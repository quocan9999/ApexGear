import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Headers,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Observable, fromEvent, map, filter } from 'rxjs';
import { PaymentsService } from './payments.service';
import { Public, CurrentUser } from '../../common/decorators';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private paymentsService: PaymentsService,
    private eventEmitter: EventEmitter2,
  ) {}

  @Post('sepay/webhook')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'SePay payment webhook (HMAC verified)' })
  @ApiHeader({ name: 'x-sepay-signature', required: false })
  handleWebhook(
    @Body() body: Record<string, unknown>,
    @Headers('x-sepay-signature') signature?: string,
  ) {
    return this.paymentsService.handleWebhook(body, signature);
  }

  @Get('sepay/qr/:orderId')
  @ApiOperation({ summary: 'Get SePay QR transfer data for an order' })
  getQr(
    @CurrentUser() user: { id: string },
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    return this.paymentsService.getQrData(user.id, orderId);
  }

  @Public()
  @Sse('stream/:orderId')
  @ApiOperation({ summary: 'Stream payment status updates' })
  streamPayment(@Param('orderId') orderId: string): Observable<MessageEvent> {
    return fromEvent(this.eventEmitter, 'order.paid').pipe(
      filter((payload: any) => payload.orderId === orderId),
      map((payload: any) => ({
        data: { success: true, orderNumber: payload.orderNumber },
      } as MessageEvent)),
    );
  }
}
