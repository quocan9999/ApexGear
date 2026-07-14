import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import {
  getResetPasswordTemplate,
  getOrderConfirmationTemplate,
  getDeliveryConfirmationTemplate,
} from './email.templates';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);
  private from: string;

  constructor(private config: ConfigService) {
    this.from = this.config.get<string>(
      'SMTP_FROM',
      'ApexGear <noreply@apexgear.vn>',
    );
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('SMTP_HOST', 'smtp.gmail.com'),
      port: this.config.get<number>('SMTP_PORT', 587),
      secure: false,
      auth: {
        user: this.config.get<string>('SMTP_USER'),
        pass: this.config.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendResetPasswordEmail(
    email: string,
    name: string,
    resetUrl: string,
  ): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.from,
        to: email,
        subject: 'ApexGear - Đặt lại mật khẩu',
        html: getResetPasswordTemplate(name, resetUrl),
      });
      this.logger.log(`Reset password email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send reset password email to ${email}`, error);
      // Don't throw — email failure shouldn't block the flow
    }
  }

  async sendOrderConfirmation(
    email: string,
    name: string,
    order: { orderNumber: string; total: number; paymentMethod: string },
  ): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.from,
        to: email,
        subject: `ApexGear - Xác nhận đơn hàng ${order.orderNumber}`,
        html: getOrderConfirmationTemplate(name, order),
      });
      this.logger.log(`Order confirmation email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send order confirmation email`, error);
    }
  }

  async sendDeliveryConfirmation(
    email: string,
    name: string,
    order: { orderNumber: string },
  ): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.from,
        to: email,
        subject: `ApexGear - Đơn hàng ${order.orderNumber} đã giao thành công`,
        html: getDeliveryConfirmationTemplate(name, order),
      });
      this.logger.log(`Delivery confirmation email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send delivery confirmation email`, error);
    }
  }
}
