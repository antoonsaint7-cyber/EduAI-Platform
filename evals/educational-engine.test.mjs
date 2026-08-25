import assert from 'node:assert/strict';
import { analyzeSource, generateDraft, evaluateDraft, publishIfApproved } from '../src/educational-engine/pipeline.js';

const source = `الوحدة الأولى\nدرس: الحضارة المصرية\nأهداف التعلم\nأهم الأحداث`;
const analysis = analyzeSource({ text: source, metadata: { title: 'التاريخ', sourceVersion: 'v1' } });
assert.equal(analysis.sections.length, 1);

const curriculum = generateDraft({ analysis, sourceText: source, subject: 'التاريخ', grade: 'أولى ثانوي' });
assert.equal(curriculum.subject, 'التاريخ');
const evaluation = evaluateDraft(curriculum, source);
assert.equal(evaluation.status, 'passed');
assert.equal(publishIfApproved(curriculum, evaluation).status, 'pending-human-review');
assert.equal(publishIfApproved(curriculum, evaluation, { approved: true }).status, 'published');

console.log('Educational engine evals passed');
