import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

// PrismaService and REDIS_CLIENT come from global modules — no imports needed.
@Module({
  controllers: [HealthController],
})
export class HealthModule {}
