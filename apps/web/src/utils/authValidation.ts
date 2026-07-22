export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 100;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 50;
export const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

export type AuthFieldErrors = Partial<Record<'name' | 'email' | 'password' | 'confirmPassword', string>>;

export type AuthTranslator = (key: string) => string;

function isValidEmail(value: string): boolean {
  return /^\S+@\S+\.\S+$/.test(value);
}

export function validateLoginFields(values: { email: string; password: string }, t: AuthTranslator): AuthFieldErrors {
  const errors: AuthFieldErrors = {};
  const email = values.email.trim();
  const password = values.password;

  if (!email) {
    errors.email = t('auth.errors.emailRequired');
  } else if (!isValidEmail(email)) {
    errors.email = t('auth.errors.emailInvalid');
  }

  if (!password) {
    errors.password = t('auth.errors.passwordRequired');
  }

  return errors;
}

export function validateRegisterFields(
  values: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  },
  t: AuthTranslator,
): AuthFieldErrors {
  const errors: AuthFieldErrors = {};
  const name = values.name.trim();
  const email = values.email.trim();
  const password = values.password;
  const confirmPassword = values.confirmPassword;

  if (!name) {
    errors.name = t('auth.errors.nameRequired');
  } else if (name.length < NAME_MIN_LENGTH) {
    errors.name = t('auth.errors.nameTooShort');
  } else if (name.length > NAME_MAX_LENGTH) {
    errors.name = t('auth.errors.nameTooLong');
  }

  if (!email) {
    errors.email = t('auth.errors.emailRequired');
  } else if (!isValidEmail(email)) {
    errors.email = t('auth.errors.emailInvalid');
  }

  if (!password) {
    errors.password = t('auth.errors.passwordRequired');
  } else if (
    password.length < PASSWORD_MIN_LENGTH ||
    password.length > PASSWORD_MAX_LENGTH ||
    !PASSWORD_PATTERN.test(password)
  ) {
    errors.password = t('auth.errors.passwordRequirements');
  }

  if (!confirmPassword) {
    errors.confirmPassword = t('auth.errors.confirmPasswordRequired');
  } else if (confirmPassword !== password) {
    errors.confirmPassword = t('auth.errors.passwordMismatch');
  }

  return errors;
}
