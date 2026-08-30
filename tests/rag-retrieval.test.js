const { toVectorLiteral, retrieveRelevantChunks } = require('../src/infrastructure/rag-retrieval');

test('serializes a 1536-dimensional embedding', () => {
  const embedding = Array(1536).fill(0.1);
  expect(toVectorLiteral(embedding).startsWith('[')).toBe(true);
  expect(toVectorLiteral(embedding).endsWith(']')).toBe(true);
});

test('rejects invalid embedding dimensions', () => {
  expect(() => toVectorLiteral([0.1])).toThrow(/1536/);
});

test('retrieval always scopes results to tenant', async () => {
  const query = jest.fn().mockResolvedValue({ rows: [] });
  await retrieveRelevantChunks({ pool: { query }, tenantId: 'tenant-a', embedding: Array(1536).fill(0), limit: 3 });
  expect(query).toHaveBeenCalledWith(expect.stringContaining('WHERE tenant_id = $2'), expect.any(Array));
  expect(query.mock.calls[0][1][1]).toBe('tenant-a');
  expect(query.mock.calls[0][1][2]).toBe(3);
});
