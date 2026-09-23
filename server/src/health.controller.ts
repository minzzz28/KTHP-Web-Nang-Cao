import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      success: true,
      message: 'Student Rental API is running',
      data: { status: 'ok' },
    };
  }
}
