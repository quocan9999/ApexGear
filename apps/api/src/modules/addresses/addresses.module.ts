import { Module } from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { AddressesController } from './addresses.controller';
import { ProvincesService } from './provinces.service';
import { ProvincesController } from './provinces.controller';

@Module({
  controllers: [AddressesController, ProvincesController],
  providers: [AddressesService, ProvincesService],
  exports: [AddressesService],
})
export class AddressesModule {}
