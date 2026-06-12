import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty()
  @IsString()
  threadId: string;

  @ApiProperty({ example: 'Hello! I reviewed your request and have some questions.' })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiPropertyOptional({ example: 'https://storage.example.com/attachment.pdf' })
  @IsOptional()
  @IsString()
  attachmentUrl?: string;
}

// Body for POST /messaging/threads/:id/messages (threadId taken from the path)
export class SendMessageBodyDto {
  @ApiProperty({ example: 'Hello!' })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  attachmentUrl?: string;
}

export class CreateThreadDto {
  @ApiProperty({ enum: ['client', 'factory', 'support'] })
  @IsIn(['client', 'factory', 'support'])
  kind: 'client' | 'factory' | 'support';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  requestId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  consultantId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  factoryId?: string;
}
