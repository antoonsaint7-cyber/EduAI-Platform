import assert from 'node:assert/strict';
import { evaluateGrounding, meetsGroundingThreshold } from '../src/educational-engine/grounding.js';
import { can } from '../src/educational-engine/roles.js';
import { auditEvent } from '../src/educational-engine/audit.js';

const result = evaluateGrounding({
  claims: [
    { text: 'Claim A', sourceRefs: ['s1'] },
    { text: 'Claim B', sourceRefs: ['s2'] }
  ],
  evidence: [{ id: 's1' }, { id: 's2' }]
});
assert.equal(result.status, 'passed');
assert.equal(meetsGroundingThreshold(result), true);
assert.equal(can('student', 'publish:curriculum'), false);
assert.equal(can('teacher', 'publish:curriculum'), true);
assert.equal(auditEvent({ action: 'publish', actorId: 't1', actorRole: 'teacher' }).actorId, 't1');
console.log('Phase 4 evals passed');
