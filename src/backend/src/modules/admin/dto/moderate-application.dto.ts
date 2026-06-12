import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApplicationStatus } from '@prisma/client';

export class ModerateApplicationDto {
  @ApiProperty({ enum: [ApplicationStatus.approved, ApplicationStatus.rejected, ApplicationStatus.trial] })
  @IsEnum([ApplicationStatus.approved, ApplicationStatus.rejected, ApplicationStatus.trial])
  status: ApplicationStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
