import assert from 'node:assert/strict';
import { verifyTotp, newSecret } from '../src/platform/mfa.js';
import { signPayload, verifySignedWebhook } from '../src/platform/payments.js';
import { hashToken } from '../src/platform/routes-integrations.js';

const secret=newSecret();
assert.equal(secret.length,32);
assert.equal(typeof verifyTotp(secret,'000000'), 'boolean');
const payload='{"id":"evt_test","type":"checkout.session.completed"}';
const sig=signPayload(payload,'test-secret',1700000000);
assert.equal(verifySignedWebhook(payload,sig,'test-secret',300,1700000000),true);
assert.equal(verifySignedWebhook(payload,sig,'wrong-secret',300,1700000000),false);
assert.equal(hashToken('abc').length,64);
console.log('Production integration evals passed');
