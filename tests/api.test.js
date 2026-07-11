process.env.AI_PROVIDER = 'mock';

const request = require('supertest');
const { app } = require('../server');

describe('POST /api/process', () => {
  it('returns 400 for empty body', async () => {
    const res = await request(app).post('/api/process').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid rows data');
  });

  it('returns 400 for empty rows array', async () => {
    const res = await request(app).post('/api/process').send({ rows: [] });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid rows data');
  });

  it('processes valid rows with email', async () => {
    const rows = [
      { email: 'john@example.com', name: 'John Doe', phone: '9876543210' },
    ];
    const res = await request(app).post('/api/process').send({ rows });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.processed.length).toBe(1);
    expect(res.body.skipped.length).toBe(0);
    expect(res.body.stats.success).toBe(1);
    expect(res.body.processed[0].email).toBe('john@example.com');
  });

  it('processes valid rows with phone only', async () => {
    const rows = [
      { mobile_without_country_code: '9876543210', name: 'Jane' },
    ];
    const res = await request(app).post('/api/process').send({ rows });
    expect(res.status).toBe(200);
    expect(res.body.processed.length).toBe(1);
  });

  it('flags rows with neither email nor phone as errors', async () => {
    const rows = [
      { name: 'No Contact', notes: 'just a note' },
    ];
    const res = await request(app).post('/api/process').send({ rows });
    expect(res.status).toBe(200);
    expect(res.body.stats.failed).toBeGreaterThanOrEqual(1);
    expect(res.body.errors.length).toBeGreaterThanOrEqual(1);
  });

  it('handles batch of 30+ rows', async () => {
    const rows = Array.from({ length: 35 }, (_, i) => ({
      email: `user${i}@test.com`,
      name: `User ${i}`,
    }));
    const res = await request(app).post('/api/process').send({ rows });
    expect(res.status).toBe(200);
    expect(res.body.stats.total).toBe(35);
  });

  it('returns mappings for processed data', async () => {
    const rows = [
      { email: 'a@b.com', name: 'Alice', phone: '1234567890' },
    ];
    const res = await request(app).post('/api/process').send({ rows });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.mappings)).toBe(true);
  });

  it('handles rows with extra unknown columns', async () => {
    const rows = [
      { email: 'x@y.com', name: 'Extra', unknown_field: 'something', another_extra: 'value' },
    ];
    const res = await request(app).post('/api/process').send({ rows });
    expect(res.status).toBe(200);
    expect(res.body.processed.length).toBe(1);
  });
});

describe('GET /api/health', () => {
  it('returns ok status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
