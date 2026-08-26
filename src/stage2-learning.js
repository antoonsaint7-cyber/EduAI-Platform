'use strict';

/**
 * Stage 2 learning primitives. These functions are framework-agnostic so the
 * API layer can use them with PostgreSQL, while unit tests can exercise the
 * learning logic without an AI provider or external vector database.
 */

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

function updateMastery(previous, score, weight = 0.3) {
  const p = clamp(previous);
  const s = clamp(score);
  const w = Math.min(1, Math.max(0, Number(weight) || 0.3));
  return Math.round((p * (1 - w) + s * w) * 100) / 100;
}

function classifyMastery(score) {
  const value = clamp(score);
  if (value < 50) return 'needs_support';
  if (value < 75) return 'developing';
  if (value < 90) return 'proficient';
  return 'mastered';
}

function recommendTopics(topics, { limit = 5 } = {}) {
  return (Array.isArray(topics) ? topics : [])
    .map(topic => ({
      ...topic,
      mastery: clamp(topic.mastery),
      priority: topic.priority ?? Math.round((100 - clamp(topic.mastery)) * 100) / 100,
    }))
    .filter(topic => topic.mastery < 90)
    .sort((a, b) => b.priority - a.priority)
    .slice(0, Math.max(1, limit));
}

function buildLearningPath(topics, { maxItems = 8 } = {}) {
  return recommendTopics(topics, { limit: maxItems }).map((topic, index) => ({
    order: index + 1,
    topic: topic.topic,
    mastery: topic.mastery,
    level: classifyMastery(topic.mastery),
    action: topic.mastery < 50 ? 'review_and_practice' : 'targeted_practice',
  }));
}

function normalizeSource(source, index = 0) {
  if (!source || typeof source.text !== 'string') return null;
  const text = source.text.trim();
  if (!text) return null;
  return {
    id: String(source.id || `source-${index + 1}`),
    title: String(source.title || 'Untitled source').slice(0, 200),
    page: Number.isInteger(source.page) && source.page > 0 ? source.page : null,
    text: text.slice(0, 12000),
  };
}

function chunkDocument(source, { chunkSize = 1200, overlap = 150 } = {}) {
  const normalized = normalizeSource(source);
  if (!normalized) return [];
  const size = Math.max(300, Math.min(4000, Number(chunkSize) || 1200));
  const safeOverlap = Math.max(0, Math.min(Math.floor(size / 2), Number(overlap) || 150));
  const chunks = [];
  let start = 0;
  while (start < normalized.text.length) {
    const end = Math.min(normalized.text.length, start + size);
    chunks.push({
      id: `${normalized.id}:${chunks.length + 1}`,
      source_id: normalized.id,
      source_title: normalized.title,
      page: normalized.page,
      text: normalized.text.slice(start, end),
    });
    if (end >= normalized.text.length) break;
    start = end - safeOverlap;
  }
  return chunks;
}

function tokenize(text) {
  return new Set(String(text || '').toLowerCase().normalize('NFKC').match(/[\p{L}\p{N}]{2,}/gu) || []);
}

function lexicalRetrieve(query, chunks, { limit = 5 } = {}) {
  const q = tokenize(query);
  return (Array.isArray(chunks) ? chunks : [])
    .map(chunk => {
      const tokens = tokenize(chunk.text);
      let overlap = 0;
      q.forEach(token => { if (tokens.has(token)) overlap += 1; });
      const score = q.size ? overlap / q.size : 0;
      return { ...chunk, score: Math.round(score * 10000) / 10000 };
    })
    .filter(chunk => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, limit));
}

function buildGroundedContext(query, chunks, options = {}) {
  return lexicalRetrieve(query, chunks, options).map((chunk, index) => ({
    rank: index + 1,
    citation: chunk.page ? `${chunk.source_title}, p. ${chunk.page}` : chunk.source_title,
    source_id: chunk.source_id,
    score: chunk.score,
    text: chunk.text,
  }));
}

module.exports = {
  clamp,
  updateMastery,
  classifyMastery,
  recommendTopics,
  buildLearningPath,
  normalizeSource,
  chunkDocument,
  lexicalRetrieve,
  buildGroundedContext,
};
