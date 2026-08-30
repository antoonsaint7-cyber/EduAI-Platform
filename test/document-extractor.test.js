'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createDocumentExtractor } = require('../src/infrastructure/document-extractor');

test('extractor routes supported MIME type to matching adapter', async () => {
  const extractor = createDocumentExtractor({
    adapters: { pdf: async () => ({ text: '  extracted text  ', pages: [{ page: 1 }] }) },
  });
  await assert.doesNotReject(async () => {
    const result = await extractor('/tmp/example.pdf', 'application/pdf');
    assert.deepEqual(result, { text: 'extracted text', pages: [{ page: 1 }], metadata: {} });
  });
});

test('extractor rejects extension/MIME mismatch', async () => {
  const extractor = createDocumentExtractor({ adapters: { pdf: async () => ({ text: 'x' }) } });
  await assert.rejects(() => extractor('/tmp/example.docx', 'application/pdf'), /Unsupported document type/);
});

test('extractor fails closed when adapter is missing', async () => {
  const extractor = createDocumentExtractor();
  await assert.rejects(() => extractor('/tmp/example.pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'), /No extraction adapter configured/);
});

test('extractor rejects empty adapter output', async () => {
  const extractor = createDocumentExtractor({ adapters: { docx: async () => ({ text: '   ' }) } });
  await assert.rejects(() => extractor('/tmp/example.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'), /returned no text/);
});
