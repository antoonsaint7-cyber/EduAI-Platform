'use strict';

function tokens(text) { return new Set(String(text || '').toLowerCase().normalize('NFKC').match(/[\p{L}\p{N}]{2,}/gu) || []); }
function lexicalScore(query, text) { const q=tokens(query), t=tokens(text); if (!q.size) return 0; let hits=0; q.forEach(x=>{if(t.has(x))hits++;}); return hits/q.size; }
function metadataMatch(chunk, filters = {}) { return Object.entries(filters).every(([k,v]) => v == null || v === '' || chunk?.metadata?.[k] === v); }
function hybridRetrieve(query, chunks = [], { vectorScores = {}, filters = {}, limit = 8, lexicalWeight = 0.45, vectorWeight = 0.55 } = {}) {
  return (Array.isArray(chunks) ? chunks : []).filter(c => metadataMatch(c, filters)).map((c, i) => {
    const lexical = lexicalScore(query, c.text); const vector = Math.max(0, Math.min(1, Number(vectorScores[c.id] ?? c.vector_score ?? 0)));
    const score = lexical * lexicalWeight + vector * vectorWeight;
    return { ...c, lexical_score: Math.round(lexical*10000)/10000, vector_score: Math.round(vector*10000)/10000, score: Math.round(score*10000)/10000, rank_hint:i };
  }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0, Math.max(1, limit)).map((x,i)=>({ ...x, rank:i+1, citation:x.metadata?.page ? `${x.metadata.title || 'Source'}, p. ${x.metadata.page}` : (x.metadata?.title || x.source_title || 'Source') }));
}
function groundedPrompt(question, contexts) {
  const sources = (contexts || []).map((c,i)=>`[${i+1}] ${c.citation}\n${c.text}`).join('\n\n');
  return `Answer the educational question using only the supplied sources. If the sources do not contain enough evidence, explicitly say so. Never invent citations or facts. Cite claims as [1], [2], etc.\n\nQUESTION:\n${question}\n\nSOURCES:\n${sources}`;
}
module.exports = { tokens, lexicalScore, metadataMatch, hybridRetrieve, groundedPrompt };
