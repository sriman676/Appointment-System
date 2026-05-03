/**
 * ================================================================
 * MULTI-USER INTEGRATION TEST SUITE
 * Tests: User isolation, concurrent booking conflict,
 *        role-scoped data visibility, notification isolation,
 *        concurrent request limits, admin cross-user operations
 * ================================================================
 */
const request = require('supertest');
const app    = require('../server');
const db     = require('./setup');
const User   = require('../models/User');
const Request  = require('../models/Request');
const Appointment = require('../models/Appointment');
const Category = require('../models/Category');
const mongoose = require('mongoose');

jest.setTimeout(60000);

beforeAll(async () => { await db.connect(); });
afterEach(async () => { await db.clearDatabase(); });
afterAll(async () => { await db.closeDatabase(); });

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const makeUser = async (role, emailPrefix) => {
  const email = `${emailPrefix}@srmap.edu.in`;
  const reg = await request(app).post('/api/auth/register').send({
    name: `${role} ${emailPrefix}`,
    email,
    password: 'SecurePass123',
    role
  });
  
  // Directly set emailVerified to true in the database to bypass OTP email requirement for tests
  await User.findOneAndUpdate({ email: email.toLowerCase() }, { emailVerified: true });

  const login = await request(app).post('/api/auth/login').send({ email, password: 'SecurePass123' });
  return { token: login.body.token, id: login.body._id, email };
};

const makeCategory = async () => {
  return await Category.create({ name: 'Academic Counseling', description: 'Test' });
};

// ─── 1. USER ISOLATION ────────────────────────────────────────────────────────
describe('1. User Isolation — students only see their own data', () => {
  it('Student A cannot see Student B\'s requests', async () => {
    const category = await makeCategory();
    const studentA = await makeUser('Student', 'studentA');
    const studentB = await makeUser('Student', 'studentB');

    // studentA creates a request
    await request(app)
      .post('/api/requests')
      .set('Authorization', `Bearer ${studentA.token}`)
      .send({
        categoryId: category._id,
        requestType: 'Counseling',
        subject: 'Student A private issue',
        meetingMode: 'Online',
        preferredDate: new Date(Date.now() + 86400000).toISOString(),
        preferredTime: '10:00',
        duration: 30
      });

    // studentB GETs requests — should see 0 (only their own)
    const res = await request(app)
      .get('/api/requests')
      .set('Authorization', `Bearer ${studentB.token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.requests).toHaveLength(0);
  });

  it('Student A cannot update Student B\'s request', async () => {
    const category = await makeCategory();
    const studentA = await makeUser('Student', 'studentA');
    const studentB = await makeUser('Student', 'studentB');

    const createRes = await request(app)
      .post('/api/requests')
      .set('Authorization', `Bearer ${studentA.token}`)
      .send({
        categoryId: category._id,
        requestType: 'Counseling',
        subject: 'Private request',
        meetingMode: 'Online',
        preferredDate: new Date(Date.now() + 86400000).toISOString(),
        preferredTime: '10:00',
      });

    const reqId = createRes.body._id;

    // studentB tries to cancel studentA's request
    const res = await request(app)
      .put(`/api/requests/${reqId}`)
      .set('Authorization', `Bearer ${studentB.token}`)
      .send({ status: 'Cancelled' });

    expect(res.statusCode).toBe(403);
  });
});

// ─── 2. COUNSELOR SCOPING ────────────────────────────────────────────────────
describe('2. Counselor sees only relevant requests', () => {
  it('Counselor sees unassigned requests in their category', async () => {
    const category = await makeCategory();
    const student   = await makeUser('Student', 'student1');
    const counselor = await makeUser('Counselor', 'counselor1');

    // Assign category to counselor
    await User.findByIdAndUpdate(counselor.id, { categories: [category._id] });
    const newLogin = await request(app).post('/api/auth/login').send({ email: counselor.email, password: 'SecurePass123' });

    await request(app)
      .post('/api/requests')
      .set('Authorization', `Bearer ${student.token}`)
      .send({
        categoryId: category._id,
        requestType: 'Counseling',
        subject: 'Need help with exams',
        meetingMode: 'Online',
        preferredDate: new Date(Date.now() + 86400000).toISOString(),
        preferredTime: '09:30',
      });

    const res = await request(app)
      .get('/api/requests')
      .set('Authorization', `Bearer ${newLogin.body.token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.requests.length).toBeGreaterThanOrEqual(1);
    expect(res.body.requests[0].subject).toBe('Need help with exams');
  });

  it('Counselor CANNOT see requests from a different category', async () => {
    const catA = await makeCategory();
    const catB = await Category.create({ name: 'Career Counseling', description: 'Test' });
    const student    = await makeUser('Student', 'student2');
    const counselor  = await makeUser('Counselor', 'counselor2');

    // Counselor only assigned to catB
    await User.findByIdAndUpdate(counselor.id, { categories: [catB._id] });
    const newLogin = await request(app).post('/api/auth/login').send({ email: counselor.email, password: 'SecurePass123' });

    // Student creates request in catA
    await request(app)
      .post('/api/requests')
      .set('Authorization', `Bearer ${student.token}`)
      .send({
        categoryId: catA._id,
        requestType: 'Counseling',
        subject: 'Should not be visible',
        meetingMode: 'Online',
        preferredDate: new Date(Date.now() + 86400000).toISOString(),
        preferredTime: '10:00',
      });

    const res = await request(app)
      .get('/api/requests')
      .set('Authorization', `Bearer ${newLogin.body.token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.requests).toHaveLength(0);
  });
});

// ─── 3. CONCURRENT BOOKING CONFLICT PREVENTION ───────────────────────────────
describe('3. Concurrent booking — double-booking prevention', () => {
  it('Two students booking the same slot simultaneously — only one succeeds', async () => {
    const category  = await makeCategory();
    const studentA  = await makeUser('Student', 'studentConcA');
    const studentB  = await makeUser('Student', 'studentConcB');
    const counselor = await makeUser('Counselor', 'counselorConc');

    await User.findByIdAndUpdate(counselor.id, { categories: [category._id] });
    const counselorLogin = await request(app).post('/api/auth/login').send({ email: counselor.email, password: 'SecurePass123' });
    const counselorToken = counselorLogin.body.token;

    const futureDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    // Both students create requests for the same time slot
    const [reqA, reqB] = await Promise.all([
      request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${studentA.token}`)
        .send({ categoryId: category._id, requestType: 'Counseling', subject: 'Request A', meetingMode: 'Online', preferredDate: futureDate, preferredTime: '11:00' }),
      request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${studentB.token}`)
        .send({ categoryId: category._id, requestType: 'Counseling', subject: 'Request B', meetingMode: 'Online', preferredDate: futureDate, preferredTime: '11:00' }),
    ]);

    expect(reqA.statusCode).toBe(201);
    expect(reqB.statusCode).toBe(201);

    // Assign counselor to both requests
    await Request.findByIdAndUpdate(reqA.body._id, { counselorId: counselor.id, status: 'Accepted' });
    await Request.findByIdAndUpdate(reqB.body._id, { counselorId: counselor.id, status: 'Accepted' });

    // Both try to book the same slot simultaneously
    const [bookA, bookB] = await Promise.all([
      request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${counselorToken}`)
        .send({ requestId: reqA.body._id, date: futureDate, startTime: '11:00', endTime: '11:30' }),
      request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${counselorToken}`)
        .send({ requestId: reqB.body._id, date: futureDate, startTime: '11:00', endTime: '11:30' }),
    ]);

    const statuses = [bookA.statusCode, bookB.statusCode].sort();
    // Exactly one should succeed (201) and one should conflict (409)
    expect(statuses).toContain(201);
    expect(statuses).toContain(409);
  });
});

// ─── 4. STUDENT REQUEST LIMITS ───────────────────────────────────────────────
describe('4. Student request limits enforced per-user', () => {
  it('Student A hitting max 3 active requests does NOT affect Student B', async () => {
    const category = await makeCategory();
    const studentA = await makeUser('Student', 'limitStudA');
    const studentB = await makeUser('Student', 'limitStudB');

    const futureDate = new Date(Date.now() + 86400000).toISOString();
    const makeReq = (token, time) =>
      request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${token}`)
        .send({ categoryId: category._id, requestType: 'Counseling', subject: 'Test', meetingMode: 'Online', preferredDate: futureDate, preferredTime: time });

    // Fill up Student A's 3 active slots
    await makeReq(studentA.token, '09:00');
    await makeReq(studentA.token, '09:30');
    await makeReq(studentA.token, '10:00');

    // Student A's 4th attempt should fail
    const overLimitRes = await makeReq(studentA.token, '10:30');
    expect(overLimitRes.statusCode).toBe(400);
    expect(overLimitRes.body.message).toMatch(/maximum active/i);

    // Student B is unaffected — can still create requests
    const studentBRes = await makeReq(studentB.token, '11:00');
    expect(studentBRes.statusCode).toBe(201);
  });
});

// ─── 5. NOTIFICATION ISOLATION ───────────────────────────────────────────────
describe('5. Notifications are user-scoped', () => {
  it('Student A cannot see Student B\'s notifications', async () => {
    const studentA = await makeUser('Student', 'notifA');
    const studentB = await makeUser('Student', 'notifB');

    const Notification = require('../models/Notification');
    // Manually create a notification for Student A only
    await Notification.create({ userId: studentA.id, message: 'Only for A', type: 'system' });

    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${studentB.token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.notifications).toHaveLength(0);
  });
});

// ─── 6. ADMIN CROSS-USER OPERATIONS ─────────────────────────────────────────
describe('6. Admin can operate across all users', () => {
  it('Admin sees ALL requests regardless of student', async () => {
    const category = await makeCategory();
    const studentA = await makeUser('Student', 'adminTestA');
    const studentB = await makeUser('Student', 'adminTestB');
    const admin    = await makeUser('Administrator', 'adminTestAdmin');
    const futureDate = new Date(Date.now() + 86400000).toISOString();

    await Promise.all([
      request(app).post('/api/requests').set('Authorization', `Bearer ${studentA.token}`)
        .send({ categoryId: category._id, requestType: 'Counseling', subject: 'A issue', meetingMode: 'Online', preferredDate: futureDate, preferredTime: '09:00' }),
      request(app).post('/api/requests').set('Authorization', `Bearer ${studentB.token}`)
        .send({ categoryId: category._id, requestType: 'Counseling', subject: 'B issue', meetingMode: 'Online', preferredDate: futureDate, preferredTime: '09:30' }),
    ]);

    const res = await request(app)
      .get('/api/requests')
      .set('Authorization', `Bearer ${admin.token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.total).toBe(2);
  });

  it('Admin can delete any user', async () => {
    const admin    = await makeUser('Administrator', 'delAdmin');
    const student  = await makeUser('Student', 'toDelete');

    const res = await request(app)
      .delete(`/api/admin/users/${student.id}`)
      .set('Authorization', `Bearer ${admin.token}`);

    expect(res.statusCode).toBe(200);
    const gone = await User.findById(student.id);
    expect(gone).toBeNull();
  });
});
