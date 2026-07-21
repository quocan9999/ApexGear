import { describe, expect, it } from 'vitest';
import {
  NAME_MAX_LENGTH,
  NAME_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_PATTERN,
  validateLoginFields,
  validateRegisterFields,
} from './authValidation';

const t = (key: string) => key;

describe('authValidation', () => {
  it('exposes auth field constraints', () => {
    expect(NAME_MIN_LENGTH).toBe(2);
    expect(NAME_MAX_LENGTH).toBe(100);
    expect(PASSWORD_MIN_LENGTH).toBe(8);
    expect(PASSWORD_MAX_LENGTH).toBe(50);
    expect(PASSWORD_PATTERN.test('Password123')).toBe(true);
  });

  it('validates login fields', () => {
    expect(validateLoginFields({ email: '', password: '' }, t)).toEqual({
      email: 'auth.errors.emailRequired',
      password: 'auth.errors.passwordRequired',
    });
    expect(validateLoginFields({ email: 'bad', password: 'Password123' }, t)).toEqual({
      email: 'auth.errors.emailInvalid',
    });
  });

  it('validates register fields', () => {
    expect(
      validateRegisterFields(
        {
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
        },
        t,
      ),
    ).toEqual({
      name: 'auth.errors.nameRequired',
      email: 'auth.errors.emailRequired',
      password: 'auth.errors.passwordRequired',
      confirmPassword: 'auth.errors.confirmPasswordRequired',
    });

    expect(
      validateRegisterFields(
        {
          name: 'A',
          email: 'user@example.com',
          password: 'password',
          confirmPassword: 'password1',
        },
        t,
      ),
    ).toEqual({
      name: 'auth.errors.nameTooShort',
      password: 'auth.errors.passwordRequirements',
      confirmPassword: 'auth.errors.passwordMismatch',
    });
  });
});
