import {
  getResetPasswordTemplate,
  getOrderConfirmationTemplate,
  getDeliveryConfirmationTemplate,
  getEmailVerificationTemplate,
} from './email.templates';

describe('email templates', () => {
  it('includes name and reset url', () => {
    const html = getResetPasswordTemplate(
      'An',
      'https://example.com/reset?token=abc',
    );
    expect(html).toContain('An');
    expect(html).toContain('https://example.com/reset?token=abc');
    expect(html).toContain('Đặt lại mật khẩu');
  });

  it('includes name and verification url for email verification', () => {
    const html = getEmailVerificationTemplate(
      'An',
      'https://example.com/verify?token=xyz',
    );
    expect(html).toContain('An');
    expect(html).toContain('https://example.com/verify?token=xyz');
    expect(html).toContain('Xác thực email');
  });

  it('includes order confirmation details', () => {
    const html = getOrderConfirmationTemplate('An', {
      orderNumber: 'AG-20260714-ABCD',
      total: 1500000,
      paymentMethod: 'COD',
    });
    expect(html).toContain('AG-20260714-ABCD');
    expect(html).toContain('An');
    expect(html).toContain('Thanh toán khi nhận hàng');
  });

  it('includes delivery confirmation order number', () => {
    const html = getDeliveryConfirmationTemplate('An', {
      orderNumber: 'AG-1',
    });
    expect(html).toContain('AG-1');
    expect(html).toContain('An');
  });
});
