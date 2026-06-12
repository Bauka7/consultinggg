import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { REDIS_CLIENT } from '../../database/redis.module';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';
import { Role, InviteStatus } from '@prisma/client';
import { LoginDto } from './dto/login.dto';
import { RegisterDto, RegisterWithInviteDto } from './dto/register.dto';

const RESET_TOKEN_TTL_SECONDS = 60 * 60; // 1 hour

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private auditService: AuditService,
    private emailService: EmailService,
    @Inject(REDIS_CLIENT) private redis: Redis,
  ) {}

  async login(dto: LoginDto, ip?: string) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) throw new UnauthorizedException('Invalid credentials');

    if (user.status === 'blocked') {
      throw new ForbiddenException('Account is suspended due to low rating or policy violation');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.storeRefreshToken(user.id, tokens.refreshToken);
    await this.auditService.log(user.id, 'login', `user:${user.id}`, ip);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, status: user.status },
    };
  }

  async register(dto: RegisterDto, ip?: string) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    if (dto.role !== Role.client && dto.role !== Role.consultant) {
      throw new ForbiddenException('Cannot self-register with this role');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: dto.role,
        name: dto.name,
        phone: dto.phone,
        city: dto.city,
        country: dto.country,
        status: 'active',
      },
    });

    if (user.role === Role.consultant) {
      await this.prisma.consultantProfile.create({
        data: { userId: user.id, type: 'general', trial: true, languages: [] },
      });
    }

    await this.auditService.log(user.id, 'register', `user:${user.id}`, ip);

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, status: user.status },
    };
  }

  async registerWithInvite(dto: RegisterWithInviteDto, ip?: string) {
    const invite = await this.prisma.invite.findUnique({
      where: { token: dto.inviteToken },
      include: { factory: true },
    });

    if (!invite) throw new NotFoundException('Invite not found');
    if (invite.status !== InviteStatus.pending) {
      throw new BadRequestException('Invite has already been used or expired');
    }
    if (invite.expiresAt < new Date()) {
      await this.prisma.invite.update({ where: { id: invite.id }, data: { status: InviteStatus.expired } });
      throw new BadRequestException('Invite has expired');
    }
    if (invite.email !== dto.email) {
      throw new BadRequestException('Invite email does not match');
    }

    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const role = invite.role === 'factory' ? Role.factory_admin : Role.consultant;

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role,
        name: dto.name,
        phone: dto.phone,
        city: dto.city,
        country: dto.country,
        status: 'active',
      },
    });

    if (role === Role.factory_admin && invite.factoryId) {
      await this.prisma.factory.update({
        where: { id: invite.factoryId },
        data: { ownerUserId: user.id },
      });
    }

    if (role === Role.consultant) {
      const profile = await this.prisma.consultantProfile.create({
        data: { userId: user.id, type: 'general', trial: true, languages: [] },
      });
      // Business rule #8: factory invite auto-links consultant to factory
      if (invite.factoryId) {
        await this.prisma.consultantFactoryLink.create({
          data: { consultantId: profile.id, factoryId: invite.factoryId },
        });
      }
    }

    await this.prisma.invite.update({
      where: { id: invite.id },
      data: { status: InviteStatus.used },
    });

    await this.auditService.log(user.id, 'register', `user:${user.id} via invite:${invite.id}`, ip);

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, status: user.status },
    };
  }

  async refresh(userId: string, ip?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    if (user.status === 'blocked') throw new ForbiddenException('Account is suspended');

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
    return { message: 'Logged out successfully' };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    // Always return success to prevent email enumeration
    if (!user) return { message: 'If that email exists, a reset link has been sent.' };

    // Secure random token, stored in Redis with a TTL so it survives restarts
    // and works across multiple API instances.
    const token = randomBytes(32).toString('base64url');
    await this.redis.set(`pwreset:${token}`, user.id, 'EX', RESET_TOKEN_TTL_SECONDS);

    await this.emailService.sendPasswordReset(email, token);

    return { message: 'If that email exists, a reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const key = `pwreset:${token}`;
    const userId = await this.redis.get(key);
    if (!userId) throw new BadRequestException('Invalid or expired reset token');

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    await this.redis.del(key);
    return { message: 'Password updated successfully' };
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn: this.configService.get<string>('jwt.expiresIn'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(userId: string, refreshToken: string) {
    const hashed = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashed },
    });
  }
}
