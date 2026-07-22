const baseStyle = `
  font-family: 'Segoe UI', sans-serif;
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background: #f9fafb;
`;

const buttonStyle = `
  display: inline-block;
  padding: 12px 24px;
  background: #2563eb;
  color: #ffffff;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
`;

export function getResetPasswordTemplate(name: string, resetUrl: string): string {
  return `
    <div style="${baseStyle}">
      <h2>Xin chào ${name},</h2>
      <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản ApexGear.</p>
      <p>Nhấn vào nút bên dưới để đặt lại mật khẩu (có hiệu lực trong 1 giờ):</p>
      <p style="text-align:center; margin: 30px 0;">
        <a href="${resetUrl}" style="${buttonStyle}">Đặt lại mật khẩu</a>
      </p>
      <p>Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="color: #9ca3af; font-size: 12px;">ApexGear - Tech Gear cho game thủ Việt</p>
    </div>
  `;
}

export function getEmailVerificationTemplate(
  name: string,
  verificationUrl: string,
): string {
  return `
    <div style="${baseStyle}">
      <h2>Xin chào ${name},</h2>
      <p>Cảm ơn bạn đã đăng ký tài khoản tại ApexGear.</p>
      <p>Nhấn vào nút bên dưới để xác thực địa chỉ email của bạn (có hiệu lực trong 24 giờ):</p>
      <p style="text-align:center; margin: 30px 0;">
        <a href="${verificationUrl}" style="${buttonStyle}">Xác thực email</a>
      </p>
      <p>Nếu bạn không tạo tài khoản này, hãy bỏ qua email này.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="color: #9ca3af; font-size: 12px;">ApexGear - Tech Gear cho game thủ Việt</p>
    </div>
  `;
}

export function getOrderConfirmationTemplate(
  name: string,
  order: { orderNumber: string; total: number; paymentMethod: string },
): string {
  const paymentLabel =
    order.paymentMethod === 'COD'
      ? 'Thanh toán khi nhận hàng'
      : 'Chuyển khoản ngân hàng';
  return `
    <div style="${baseStyle}">
      <h2>Cảm ơn bạn đã đặt hàng, ${name}!</h2>
      <p>Đơn hàng <strong>${order.orderNumber}</strong> đã được tạo thành công.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">Mã đơn hàng</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>${order.orderNumber}</strong></td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">Tổng tiền</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>${order.total.toLocaleString('vi-VN')}₫</strong></td></tr>
        <tr><td style="padding: 8px;">Thanh toán</td><td style="padding: 8px;">${paymentLabel}</td></tr>
      </table>
      <p>Chúng tôi sẽ xác nhận và giao hàng trong thời gian sớm nhất.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="color: #9ca3af; font-size: 12px;">ApexGear - Tech Gear cho game thủ Việt</p>
    </div>
  `;
}

export function getDeliveryConfirmationTemplate(
  name: string,
  order: { orderNumber: string },
): string {
  return `
    <div style="${baseStyle}">
      <h2>Đơn hàng đã giao thành công!</h2>
      <p>Xin chào ${name}, đơn hàng <strong>${order.orderNumber}</strong> đã được giao đến bạn.</p>
      <p>Hãy xác nhận hoàn thành đơn hàng và để lại đánh giá sản phẩm nhé!</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="color: #9ca3af; font-size: 12px;">ApexGear - Tech Gear cho game thủ Việt</p>
    </div>
  `;
}
