import {
  getResetPasswordTemplate,
  getOrderConfirmationTemplate,
  getDeliveryConfirmationTemplate,
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
