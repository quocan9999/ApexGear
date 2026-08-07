import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Headers,
  Req,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Sse,
  MessageEvent,
  RawBodyRequest,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Observable, fromEvent, map, filter } from 'rxjs';
import { PaymentsService } from './payments.service';
import { Public, CurrentUser } from '../../common/decorators';

export interface OrderPaidEvent {
  orderId: string;
  orderNumber: string;
}

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
  @ApiHeader({ name: 'x-sepay-signature', required: false, description: 'SePay HMAC signature' })
  @ApiHeader({ name: 'x-sepay-timestamp', required: false, description: 'SePay webhook timestamp' })
  @ApiHeader({ name: 'authorization', required: false, description: 'SePay API key authorization' })
  handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Body() body: Record<string, unknown>,
    @Headers('x-sepay-signature') signature?: string,
    @Headers('x-sepay-timestamp') timestamp?: string,
    @Headers('authorization') authHeader?: string,
  ) {
    return this.paymentsService.handleWebhook(body, {
      signature,
      timestamp,
      rawBody: req?.rawBody,
      authHeader,
    });
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
  streamPayment(
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ): Observable<MessageEvent> {
    return (fromEvent(this.eventEmitter, 'order.paid') as Observable<OrderPaidEvent>).pipe(
      filter((payload: OrderPaidEvent) => payload.orderId === orderId),
      map(
        (payload: OrderPaidEvent) =>
          ({
            data: { success: true, orderNumber: payload.orderNumber },
          }) as MessageEvent,
      ),
    );
  }
}
