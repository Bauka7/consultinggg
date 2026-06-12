import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ example: 'cp-uuid-here' })
  @IsString()
  consultantId: string;

  @ApiPropertyOptional({ example: 'TW-0001' })
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ example: 'Excellent service, very professional and responsive.' })
  @IsString()
  text: string;
}
