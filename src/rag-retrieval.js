function tokenize(text) { return String(text || '').toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean); }

function lexicalScore(query, content) {
  const q = new Set(tokenize(query)); const words = tokenize(content); if (!q.size || !words.length) return 0;
  let hits = 0; for (const w of words) if (q.has(w)) hits++;
  return hits / Math.sqrt(q.size * words.length);
}

function matchesMetadata(item, filters = {}) {
  return Object.entries(filters).every(([key, value]) => value == null || item?.metadata?.[key] === value);
}

function hybridRetrieve(query, items, { filters = {}, limit = 5 } = {}) {
  return (items || []).filter(i => matchesMetadata(i, filters)).map(i => ({ ...i, score: lexicalScore(query, i.content) * 0.45 + Number(i.vector_score || 0) * 0.55 })).sort((a, b) => b.score - a.score).slice(0, limit);
}

function groundedPrompt(question, contexts = []) {
  const evidence = contexts.map((c, i) => `[${i + 1}] ${c.content}\nSource: ${c.metadata?.source || 'unknown'}${c.metadata?.page ? `, page ${c.metadata.page}` : ''}`).join('\n\n');
  return `Answer using only the evidence below. If the evidence is insufficient, explicitly say that the sources do not contain enough information. Do not invent citations or facts.\n\nEvidence:\n${evidence}\n\nQuestion: ${question}`;
}

module.exports = { tokenize, lexicalScore, matchesMetadata, hybridRetrieve, groundedPrompt };
