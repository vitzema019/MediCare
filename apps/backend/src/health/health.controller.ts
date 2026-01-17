import { Controller, Get } from '@nestjs/common';
import type { HealthStatus } from '@shared/types';
import { Public } from '../auth/decorators/public.decorator';

@Controller('health')
export class HealthController {
  @Public()
  @Get()
  getHealth(): HealthStatus {
    return { status: 'ok' };
  }
}
