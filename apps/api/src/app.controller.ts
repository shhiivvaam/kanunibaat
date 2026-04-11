import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

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
}
