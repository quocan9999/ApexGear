import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @Public()
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
