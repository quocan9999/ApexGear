import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PaymentTimeoutService } from './payment-timeout.service';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentTimeoutService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
