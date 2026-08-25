import assert from 'node:assert/strict';
import { createVersion, getVersion, setEvaluation, approveVersion, listVersions } from '../src/educational-engine/store.js';
import { reviewQueue } from '../src/educational-engine/review.js';

const curriculum = { id: 'c1', sourceVersion: 'v1', units: [{ id: 'u1', lessons: [] }] };
const version = createVersion(curriculum, { name: 'history.pdf', contentHash: 'abc' });
assert.equal(getVersion(version.id).status, 'draft');
assert.throws(() => approveVersion(version.id), /Evaluation/);
setEvaluation(version.id, { status: 'passed', grounded: true, issues: [] });
assert.equal(reviewQueue().length, 1);
const published = approveVersion(version.id, 'teacher-1');
assert.equal(published.status, 'published');
assert.equal(published.approvedBy, 'teacher-1');
assert.equal(listVersions().length, 1);
console.log('Educational engine phase 3 evals passed');
