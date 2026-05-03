/**
 * Basic Auth route tests (unit-level, no DB needed)
 */
const request = require('supertest');
const app = require('../server');
const db = require('./setup');

jest.setTimeout(30000);

beforeAll(async () => { await db.connect(); });
afterEach(async () => { await db.clearDatabase(); });
afterAll(async () => { await db.closeDatabase(); });

const User = require('../models/User');

describe('Auth Routes — Unit Tests', () => {
  it('POST /api/auth/register returns 201 and NO token, but email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Unit User',
      email: 'unit@srmap.edu.in',
      password: 'SecurePass123',
      role: 'Student'
    });
    expect(res.statusCode).toBe(201);
    expect(res.body).not.toHaveProperty('token');
    expect(res.body).toHaveProperty('email', 'unit@srmap.edu.in');
  });

  it('POST /api/auth/verify-otp returns 200 and token', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Verify Tester',
      email: 'verify@srmap.edu.in',
      password: 'SecurePass123',
      role: 'Student'
    });
    const user = await User.findOne({ email: 'verify@srmap.edu.in' });
    const res = await request(app).post('/api/auth/verify-otp').send({
      email: 'verify@srmap.edu.in',
      otp: user.otp
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('POST /api/auth/login returns 403 on unverified user, 200 after verified', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Login Tester',
      email: 'login@srmap.edu.in',
      password: 'SecurePass123',
      role: 'Student'
    });
    
    // Attempt login unverified
    const unvRes = await request(app).post('/api/auth/login').send({
      email: 'login@srmap.edu.in',
      password: 'SecurePass123'
    });
    expect(unvRes.statusCode).toBe(403);
    
    // Manually verify
    await User.findOneAndUpdate({ email: 'login@srmap.edu.in'.toLowerCase() }, { emailVerified: true });
    
    // Attempt verified
    const vRes = await request(app).post('/api/auth/login').send({
      email: 'login@srmap.edu.in',
      password: 'SecurePass123'
    });
    expect(vRes.statusCode).toBe(200);
    expect(vRes.body).toHaveProperty('token');
  });

  it('GET /api/auth/me without token returns 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });

  it('GET /api/auth/me with valid token returns user object', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Me User',
      email: 'me@srmap.edu.in',
      password: 'SecurePass123',
      role: 'Student'
    });
    await User.findOneAndUpdate({ email: 'me@srmap.edu.in'.toLowerCase() }, { emailVerified: true });
    const { body: { token } } = await request(app).post('/api/auth/login').send({
      email: 'me@srmap.edu.in',
      password: 'SecurePass123'
    });
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.email).toBe('me@srmap.edu.in');
  });
});

