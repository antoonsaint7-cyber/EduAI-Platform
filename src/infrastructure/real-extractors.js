'use strict';

const fs = require('node:fs/promises');

/**
 * Production adapters. Optional parser packages are loaded lazily so the core
 * application can still boot when a deployment has not enabled a format.
 */
async function extractPdf(filePath) {
  let pdfParse;
  try { pdfParse = require('pdf-parse'); } catch { throw new Error('PDF extraction requires the pdf-parse adapter dependency.'); }
  const data = await fs.readFile(filePath);
  const result = await pdfParse(data);
  const text = String(result.text || '').trim();
  if (!text) throw new Error('PDF contains no extractable text.');
  return { text, pages: Number(result.numpages || 0), metadata: result.info || {} };
}

async function extractDocx(filePath) {
  let mammoth;
  try { mammoth = require('mammoth'); } catch { throw new Error('DOCX extraction requires the mammoth adapter dependency.'); }
  const result = await mammoth.extractRawText({ path: filePath });
  const text = String(result.value || '').trim();
  if (!text) throw new Error('DOCX contains no extractable text.');
  return { text, pages: [], metadata: { messages: result.messages || [] } };
}

async function extractPptx(filePath) {
  let pptxTextParser;
  try { pptxTextParser = require('pptx-text-parser'); } catch { throw new Error('PPTX extraction requires the pptx-text-parser adapter dependency.'); }
  const text = String(await pptxTextParser(filePath, 'text') || '').trim();
  if (!text) throw new Error('PPTX contains no extractable text.');
  return { text, pages: [], metadata: {} };
}

const extractors = {
  'application/pdf': extractPdf,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': extractDocx,
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': extractPptx,
};

async function extractDocument({ filePath, mimeType }) {
  if (!filePath) throw new Error('filePath is required for document extraction.');
  const extractor = extractors[mimeType];
  if (!extractor) throw new Error(`No production extractor configured for ${mimeType}.`);
  return extractor(filePath);
}

module.exports = { extractDocument, extractPdf, extractDocx, extractPptx };
