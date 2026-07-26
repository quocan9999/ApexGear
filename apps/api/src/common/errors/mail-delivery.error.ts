export class MailDeliveryError extends Error {
  constructor(
    message: string,
    public readonly kind: 'reset-password' | 'email-verification' | 'staff-invitation',
    public readonly recipient: string,
  ) {
    super(message);
    this.name = 'MailDeliveryError';
  }
}
