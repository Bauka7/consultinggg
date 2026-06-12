import { Module } from '@nestjs/common';
import { ConsultantsService } from './consultants.service';
import { ConsultantsController } from './consultants.controller';

@Module({
  providers: [ConsultantsService],
  controllers: [ConsultantsController],
  exports: [ConsultantsService],
})
export class ConsultantsModule {}
