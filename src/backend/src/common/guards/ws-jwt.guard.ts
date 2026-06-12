import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient();
    const token = this.extractToken(client);

    if (!token) {
      throw new WsException('Missing authentication token');
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('jwt.secret'),
      });
      client.data = { user: payload };
      return true;
    } catch {
      throw new WsException('Invalid or expired token');
    }
  }

  private extractToken(client: any): string | null {
    // Try handshake auth
    const authHeader = client.handshake?.auth?.token;
    if (authHeader) return authHeader;

    // Try handshake headers
    const headerAuth = client.handshake?.headers?.authorization;
    if (headerAuth && headerAuth.startsWith('Bearer ')) {
      return headerAuth.substring(7);
    }

    // Try query string
    const query = client.handshake?.query?.token;
    if (query) return query as string;

    return null;
  }
}
