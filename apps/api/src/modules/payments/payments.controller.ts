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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { Public, CurrentUser } from '../../common/decorators';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

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
}
