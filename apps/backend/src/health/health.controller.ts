import { Controller, Get } from '@nestjs/common';
import type { HealthStatus } from '@shared/types';

@Controller('health')
export class HealthController {
  @Get()
  getHealth(): HealthStatus {
    return { status: 'ok' };
  }
}
