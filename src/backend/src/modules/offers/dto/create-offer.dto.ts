import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateOfferDto {
  @ApiProperty()
  @IsString()
  requestId: string;

  @ApiPropertyOptional({ description: 'Factory that will fulfill the order' })
  @IsOptional()
  @IsString()
  factoryId?: string;

  @ApiProperty({ example: 'LED Display Panel 55" 4K' })
  @IsString()
  product: string;

  @ApiPropertyOptional({ example: '500' })
  @IsOptional()
  @IsString()
  qty?: string;

  @ApiProperty({ example: 89.99 })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiProperty({ example: 44995.0 })
  @IsNumber()
  @Min(0)
  total: number;

  @ApiPropertyOptional({ example: '45 days' })
  @IsOptional()
  @IsString()
  leadTime?: string;

  @ApiPropertyOptional({ example: 'FOB' })
  @IsOptional()
  @IsString()
  incoterm?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ example: '2024-07-01' })
  @IsOptional()
  @IsDateString()
  validTill?: string;
}

export class RevisionOfferDto {
  @ApiPropertyOptional({ example: 'Please lower MOQ to 300 units' })
  @IsOptional()
  @IsString()
  note?: string;
}
