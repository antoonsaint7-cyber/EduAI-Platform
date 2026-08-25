const { test } = require('node:test');
const assert = require('node:assert/strict');
const { hashPassword, verifyPassword, sign, verify } = require('../../src/auth');

test('password hashing and verification',()=>{const h=hashPassword('correct horse battery staple');assert.notEqual(h,'correct horse battery staple');assert.equal(verifyPassword('correct horse battery staple',h),true);assert.equal(verifyPassword('wrong',h),false);});
test('signed auth token round trips',()=>{process.env.AUTH_SECRET='test-secret';const token=sign({userId:'u1',tenantId:'t1'});const payload=verify(token);assert.equal(payload.userId,'u1');assert.equal(payload.tenantId,'t1');});
