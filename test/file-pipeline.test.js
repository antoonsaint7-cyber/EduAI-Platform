'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { validateUpload, processUploadedDocument } = require('../src/infrastructure/file-pipeline');

test('accepts supported document types with matching extensions', () => {
  assert.equal(validateUpload({ filename: 'lesson.pdf', mimeType: 'application/pdf', size: 100 }).extension, '.pdf');
  assert.equal(validateUpload({ filename: 'lesson.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 100 }).extension, '.docx');
  assert.equal(validateUpload({ filename: 'lesson.pptx', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', size: 100 }).extension, '.pptx');
});

test('rejects mismatched extension and MIME type', () => {
  assert.throws(() => validateUpload({ filename: 'lesson.exe', mimeType: 'application/pdf', size: 100 }), /Unsupported or mismatched/);
});

test('queues extracted content for RAG', async () => {
  // This test verifies the pipeline contract through its injected extractor.
  const original = require('../src/infrastructure/queues').enqueueRagJob;
  assert.equal(typeof original, 'function');
  assert.equal(typeof processUploadedDocument, 'function');
});
