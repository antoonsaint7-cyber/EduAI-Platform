export function evaluateGrounding({ claims = [], evidence = [] }) {
  const evidenceIds = new Set(evidence.map((item) => item.id));
  const unsupported = claims.filter((claim) => !claim.sourceRefs?.some((ref) => evidenceIds.has(ref)));
  const score = claims.length === 0 ? 0 : (claims.length - unsupported.length) / claims.length;
  return {
    status: unsupported.length === 0 && claims.length > 0 ? 'passed' : 'needs-review',
    score,
    unsupportedClaims: unsupported.map((claim) => claim.text || ''),
  };
}

export function meetsGroundingThreshold(result, threshold = 0.9) {
  return result.status === 'passed' && result.score >= threshold;
}
