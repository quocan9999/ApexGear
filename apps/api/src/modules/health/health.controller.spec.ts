import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns ok status with timestamp', () => {
    const controller = new HealthController();
    const result = controller.check();
    expect(result.status).toBe('ok');
    expect(result.timestamp).toEqual(expect.any(String));
  });
});
