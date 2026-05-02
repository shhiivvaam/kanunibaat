import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { sql } from 'drizzle-orm';

import { db } from '@jurisly/database';

import { AppService } from './app.service';

@ApiTags('meta')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Service banner string (legacy / ops)' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @ApiOperation({ summary: 'Liveness probe' })
  health(): { status: string; uptime: number } {
    return { status: 'ok', uptime: process.uptime() };
  }

  @Get('health/ready')
  @ApiOperation({ summary: 'Readiness probe (database connect)' })
  async ready(): Promise<{ status: string; database: true }> {
    try {
      await db.execute(sql`select 1`);
      return { status: 'ok', database: true as const };
    } catch {
      throw new ServiceUnavailableException('database unavailable');
    }
  }
}
