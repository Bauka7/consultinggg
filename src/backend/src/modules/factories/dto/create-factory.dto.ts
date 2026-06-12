import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateFactoryDto {
  @ApiProperty({ example: 'Guangzhou Electronics Co.' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: '广州电子有限公司' })
  @IsOptional()
  @IsString()
  nameCn?: string;

  @ApiPropertyOptional({ example: 'Guangzhou' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Guangdong' })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  about?: string;

  @ApiPropertyOptional({ example: '100-500' })
  @IsOptional()
  @IsString()
  staff?: string;

  @ApiPropertyOptional({ example: '5000 sqm' })
  @IsOptional()
  @IsString()
  area?: string;

  @ApiPropertyOptional({ example: '30-60 days' })
  @IsOptional()
  @IsString()
  leadTime?: string;

  @ApiPropertyOptional({ example: 2005 })
  @IsOptional()
  @IsInt()
  established?: number;

  @ApiPropertyOptional({ example: ['cat_electronics'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];

  @ApiPropertyOptional({ example: ['https://example.com/photo.jpg'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoUrls?: string[];
}
