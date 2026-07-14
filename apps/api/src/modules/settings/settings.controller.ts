import { Controller, Get, Patch, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { Public, Roles } from '../../common/decorators';
import { Role } from '../../common/enums';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get('public')
  @Public()
  @ApiOperation({ summary: 'Public store settings (shipping_fee, store_name)' })
  getPublic() {
    return this.settingsService.getPublicSettings();
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List all settings (admin)' })
  getAll() {
    return this.settingsService.getAll();
  }

  @Patch(':key')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update a setting by key (admin)' })
  update(@Param('key') key: string, @Body() dto: UpdateSettingDto) {
    return this.settingsService.update(key, dto.value);
  }
}
