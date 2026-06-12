import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { RequestStatus } from '@prisma/client';

export class CreateRequestDto {
  @ApiProperty({ example: 'cat_electronics' })
  @IsString()
  categoryId: string;

  @ApiProperty({ example: 'LED Display Panel 55"' })
  @IsString()
  product: string;

  @ApiPropertyOptional({ example: '500' })
  @IsOptional()
  @IsString()
  qty?: string;

  @ApiPropertyOptional({ example: 'pcs' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ example: 'Must be CE certified, 4K resolution' })
  @IsOptional()
  @IsString()
  requirements?: string;

  @ApiPropertyOptional({ example: '2024-06-01' })
  @IsOptional()
  @IsString()
  deadline?: string;

  @ApiPropertyOptional({ example: '$50,000' })
  @IsOptional()
  @IsString()
  budgetHint?: string;
}

export class UpdateRequestStatusDto {
  @ApiProperty({ enum: RequestStatus, example: RequestStatus.work })
  @IsEnum(RequestStatus)
  status: RequestStatus;
}

export class AssignConsultantDto {
  @ApiProperty()
  @IsString()
  consultantId: string;
}
