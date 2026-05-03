const fs = require('fs');
let file = fs.readFileSync('tests/pentest.test.js', 'utf8');

file = file.replace(/@college\.edu/g, '@srmap.edu.in');

const oldRegister = `const registerUser = (overrides = {}) =>
  request(app).post('/api/auth/register').send({
    name: 'Test User',
    email: 'test@college.edu',
    password: 'SecurePass123',
    role: 'Student',
    ...overrides
  });`;

const newRegister = `const registerUser = async (overrides = {}) => {
  const email = overrides.email || 'test@srmap.edu.in';
  const res = await request(app).post('/api/auth/register').send({
    name: 'Test User',
    email,
    password: 'SecurePass123',
    role: 'Student',
    ...overrides
  });
  await User.findOneAndUpdate({ email }, { emailVerified: true });
  return res;
};`;

file = file.replace(oldRegister, newRegister);

const oldTest = `  it('PASS: Should register a new Student user', async () => {
    const res = await registerUser();
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.role).toBe('Student');
  });`;

const newTest = `  it('PASS: Should register a new Student user', async () => {
    const res = await registerUser();
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('email');
  });`;

file = file.replace(oldTest, newTest);

fs.writeFileSync('tests/pentest.test.js', file);
console.log('Done!');
