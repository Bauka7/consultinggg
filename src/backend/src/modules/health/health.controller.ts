import {
  Controller,
  Get,
  Inject,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Redis } from 'ioredis';
import { PrismaService } from '../../database/prisma.service';
import { REDIS_CLIENT } from '../../database/redis.module';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private prisma: PrismaService,
    @Inject(REDIS_CLIENT) private redis: Redis,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Liveness/readiness probe (checks DB + Redis)' })
  async check() {
    const [db, redis] = await Promise.allSettled([
      this.prisma.$queryRaw`SELECT 1`,
      this.redis.ping(),
    ]);

    const dbOk = db.status === 'fulfilled';
    const redisOk = redis.status === 'fulfilled';

    const payload = {
      status: dbOk && redisOk ? 'ok' : 'degraded',
      db: dbOk,
      redis: redisOk,
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };

    // Return 503 when a dependency is down so orchestrators mark the pod unhealthy.
    if (!dbOk || !redisOk) throw new ServiceUnavailableException(payload);
    return payload;
  }
}
