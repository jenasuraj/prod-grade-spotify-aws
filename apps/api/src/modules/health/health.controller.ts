import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service.js';

@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  // 200 when Postgres and Redis both answer, 503 otherwise; cloud platforms can probe this
  @Get()
  check() {
    return this.health.check();
  }
}
