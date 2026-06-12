import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'John Smith' })
  @IsString()
  name: string;

  @ApiProperty({ enum: [Role.client, Role.consultant], default: Role.client })
  @IsEnum([Role.client, Role.consultant])
  role: Role;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'Moscow' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Russia' })
  @IsOptional()
  @IsString()
  country?: string;
}

export class RegisterWithInviteDto extends RegisterDto {
  @ApiProperty({ example: 'uuid-invite-token' })
  @IsString()
  inviteToken: string;
}
