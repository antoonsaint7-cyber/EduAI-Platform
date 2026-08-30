'use strict';

const path = require('node:path');

const MIME_EXTENSIONS = new Map([
  ['application/pdf', '.pdf'],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.docx'],
  ['application/vnd.openxmlformats-officedocument.presentationml.presentation', '.pptx'],
]);

function createDocumentExtractor({ adapters = {} } = {}) {
  return async function extract(filePath, mimeType) {
    const extension = MIME_EXTENSIONS.get(mimeType);
    if (!extension || path.extname(filePath || '').toLowerCase() !== extension) {
      throw new Error('Unsupported document type for extraction.');
    }
    const adapter = adapters[mimeType] || adapters[extension.slice(1)];
    if (typeof adapter !== 'function') {
      throw new Error(`No extraction adapter configured for ${mimeType}.`);
    }
    const result = await adapter(filePath);
    if (!result || typeof result.text !== 'string' || !result.text.trim()) {
      throw new Error('Extraction adapter returned no text.');
    }
    return {
      text: result.text.trim(),
      pages: Array.isArray(result.pages) ? result.pages : [],
      metadata: result.metadata && typeof result.metadata === 'object' ? result.metadata : {},
    };
  };
}

module.exports = { MIME_EXTENSIONS, createDocumentExtractor };
