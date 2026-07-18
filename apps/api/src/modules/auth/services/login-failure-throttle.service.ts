import { HttpException, Injectable } from '@nestjs/common';
import { InjectThrottlerStorage, ThrottlerStorage } from '@nestjs/throttler';

const LOGIN_FAILED_THROTTLER_NAME = 'login-failed';
const LOGIN_FAILED_LIMIT = 5;
const LOGIN_FAILED_TTL_MS = 20 * 60 * 1000;
const LOGIN_FAILED_BLOCK_MS = 20 * 60 * 1000;

@Injectable()
export class LoginFailureThrottleService {
  constructor(
    @InjectThrottlerStorage()
    private readonly storage: ThrottlerStorage,
  ) {}

  async recordFailedAttempt(ip: string): Promise<void> {
    const key = `auth:login:failed:${ip || 'unknown'}`;
    const record = await this.storage.increment(
      key,
      LOGIN_FAILED_TTL_MS,
      LOGIN_FAILED_LIMIT,
      LOGIN_FAILED_BLOCK_MS,
      LOGIN_FAILED_THROTTLER_NAME,
    );

    if (record.isBlocked) {
      throw new HttpException(
        {
          message: 'Too many failed login attempts',
          retry_after: Math.max(record.timeToBlockExpire, 0),
        },
        429,
      );
    }
  }
}
