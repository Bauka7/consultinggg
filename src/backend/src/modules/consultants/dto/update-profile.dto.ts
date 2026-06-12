import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ConsultantType } from '@prisma/client';

export class UpdateConsultantProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(ConsultantType)
  type?: ConsultantType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  years?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  responseTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  wechat?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  online?: boolean;

  @ApiPropertyOptional({ example: ['cat_electronics'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];
}
