import request from 'supertest';
import * as bcrypt from 'bcrypt';
import {
  createTestApp,
  cookieFrom,
  baseUser,
  E2EContext,
} from './create-test-app';

describe('Auth (e2e)', () => {
  let ctx: E2EContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POST /api/auth/register validates body', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'bad', password: 'short', name: 'A' })
      .expect(400);

    expect(res.body.message).toBe('Validation failed');
    expect(res.body.errors).toEqual(expect.any(Array));
  });

  it('POST /api/auth/register creates user (no password in response)', async () => {
    ctx.prisma.user.findFirst.mockResolvedValue(null);
    ctx.prisma.user.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) =>
      baseUser({
        email: data.email,
        name: data.name,
        password: data.password,
      }),
    );

    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'new@example.com',
        password: 'Password123',
        name: 'New User',
      })
      .expect(201);

    expect(res.body.data.email).toBe('new@example.com');
    expect(res.body.data.password).toBeUndefined();
    expect(ctx.prisma.user.create).toHaveBeenCalled();
  });

  it('POST /api/auth/login sets httpOnly jwt cookie and returns user', async () => {
    const hash = await bcrypt.hash('Password123', 10);
    const user = baseUser({ password: hash });
    ctx.prisma.user.findFirst.mockResolvedValue(user);
    ctx.prisma.user.findUnique.mockResolvedValue(user);

    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: user.email, password: 'Password123' })
      .expect(200);

    expect(res.body.data.email).toBe(user.email);
    expect(res.body.data.password).toBeUndefined();

    const cookies = cookieFrom(res);
    expect(cookies.some((c) => c.startsWith('jwt='))).toBe(true);
    expect(cookies.some((c) => /HttpOnly/i.test(c))).toBe(true);
  });

  it('GET /api/auth/me requires auth', async () => {
    await request(ctx.app.getHttpServer()).get('/api/auth/me').expect(401);
  });

  it('GET /api/auth/me works with jwt cookie', async () => {
    const hash = await bcrypt.hash('Password123', 10);
    const user = baseUser({ password: hash });
    ctx.prisma.user.findFirst.mockResolvedValue(user);
    ctx.prisma.user.findUnique.mockResolvedValue(user);

    const login = await request(ctx.app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: user.email, password: 'Password123' })
      .expect(200);

    const cookies = cookieFrom(login);
    const me = await request(ctx.app.getHttpServer())
      .get('/api/auth/me')
      .set('Cookie', cookies)
      .expect(200);

    expect(me.body.data.email).toBe(user.email);
  });

  it('POST /api/auth/logout clears cookie', async () => {
    const hash = await bcrypt.hash('Password123', 10);
    const user = baseUser({ password: hash });
    ctx.prisma.user.findFirst.mockResolvedValue(user);
    ctx.prisma.user.findUnique.mockResolvedValue(user);

    const login = await request(ctx.app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: user.email, password: 'Password123' });

    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/logout')
      .set('Cookie', cookieFrom(login))
      .expect(200);

    expect(res.body.data.message).toMatch(/Logged out/i);
    const cleared = cookieFrom(res);
    // clearCookie typically sets Max-Age=0 / expires
    expect(cleared.some((c) => c.startsWith('jwt='))).toBe(true);
  });

  it('POST /api/auth/forgot-password always returns generic success', async () => {
    ctx.prisma.user.findFirst.mockResolvedValue(null);

    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/forgot-password')
      .send({ email: 'missing@example.com' })
      .expect(200);

    expect(res.body.data.message).toMatch(/If the email exists/i);
    expect(ctx.email.sendResetPasswordEmail).not.toHaveBeenCalled();
  });

  it('POST /api/auth/forgot-password sends email when user exists', async () => {
    const user = baseUser();
    ctx.prisma.user.findFirst.mockResolvedValue(user);
    ctx.prisma.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });
    ctx.prisma.passwordResetToken.create.mockResolvedValue({});

    await request(ctx.app.getHttpServer())
      .post('/api/auth/forgot-password')
      .send({ email: user.email })
      .expect(200);

    expect(ctx.email.sendResetPasswordEmail).toHaveBeenCalledWith(
      user.email,
      user.name,
      expect.stringContaining('/reset-password?token='),
    );
  });

  it('POST /api/auth/login returns 401 for bad password', async () => {
    const hash = await bcrypt.hash('Password123', 10);
    ctx.prisma.user.findFirst.mockResolvedValue(
      baseUser({ password: hash, failedLoginAttempts: 0 }),
    );
    ctx.prisma.user.update.mockResolvedValue(baseUser());

    await request(ctx.app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: 'WrongPass1' })
      .expect(401);
  });
});
