import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('healthcheck')
  healthcheck(): string {
    return 'This is a api';
  }
}
