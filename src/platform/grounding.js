function evaluateGrounding({ claims = [], evidence = [] }) {
  const ids = new Set(evidence.map((item) => item.id || item.file_id || item.filename));
  const unsupported = claims.filter((claim) => !claim.sourceRefs?.some((ref) => ids.has(ref)));
  const score = claims.length ? (claims.length - unsupported.length) / claims.length : 0;
  return { status: unsupported.length === 0 && claims.length > 0 ? 'passed' : 'needs-review', score, unsupportedClaims: unsupported.map((x) => x.text || '') };
}
function meetsThreshold(result, threshold = Number(process.env.GROUNDING_THRESHOLD || 0.9)) { return result.status === 'passed' && result.score >= threshold; }
module.exports = { evaluateGrounding, meetsThreshold };
