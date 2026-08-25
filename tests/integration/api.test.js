const { test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { app } = require('../../server');

test('health endpoint is reachable', async () => { const res = await request(app).get('/health'); assert.equal(res.status,200); assert.equal(res.body.status,'ok'); });
test('chat requires authentication', async () => { const res = await request(app).post('/api/ai/chat').send({message:'hello'}); assert.equal(res.status,401); });
