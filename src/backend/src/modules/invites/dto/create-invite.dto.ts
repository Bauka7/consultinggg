import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { InviteRole } from '@prisma/client';

export class CreateInviteDto {
  @ApiProperty({ enum: InviteRole, example: InviteRole.consultant })
  @IsEnum(InviteRole)
  role: InviteRole;

  @ApiProperty({ example: 'invite@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'factory-uuid' })
  @IsOptional()
  @IsString()
  factoryId?: string;
}
