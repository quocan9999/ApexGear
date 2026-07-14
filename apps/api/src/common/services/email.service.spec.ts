import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';

const sendMail = jest.fn();

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({ sendMail })),
}));

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(() => {
    sendMail.mockReset();
    sendMail.mockResolvedValue({ messageId: '1' });
    const config = {
      get: jest.fn((key: string, def?: unknown) => {
        const map: Record<string, unknown> = {
          SMTP_FROM: 'ApexGear <noreply@apexgear.vn>',
          SMTP_HOST: 'smtp.test',
          SMTP_PORT: 587,
          SMTP_USER: 'user',
          SMTP_PASS: 'pass',
        };
        return map[key] ?? def;
      }),
    };
    service = new EmailService(config as unknown as ConfigService);
  });

  it('sends reset password email', async () => {
    await service.sendResetPasswordEmail(
      'a@b.com',
      'An',
      'https://x/reset?token=1',
    );
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'a@b.com',
        subject: expect.stringContaining('mật khẩu'),
        html: expect.stringContaining('https://x/reset?token=1'),
      }),
    );
  });

  it('sends order confirmation email', async () => {
    await service.sendOrderConfirmation('a@b.com', 'An', {
      orderNumber: 'AG-1',
      total: 1000,
      paymentMethod: 'COD',
    });
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining('AG-1'),
      }),
    );
  });

  it('swallows send errors without throwing', async () => {
    sendMail.mockRejectedValue(new Error('smtp down'));
    await expect(
      service.sendDeliveryConfirmation('a@b.com', 'An', {
        orderNumber: 'AG-1',
      }),
    ).resolves.toBeUndefined();
  });
});
