export function openSse(res) {
  res.status(200);
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
  if (typeof res.flushHeaders === 'function') res.flushHeaders();
}

export function sendSse(res, event, data) {
  if (res.writableEnded) return false;
  if (event) res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
  return true;
}

export function closeSse(res) {
  if (!res.writableEnded) res.end();
}

export async function streamChunks(res, chunks, options = {}) {
  openSse(res);
  for await (const chunk of chunks) {
    sendSse(res, options.event || 'token', { text: String(chunk) });
  }
  sendSse(res, 'done', { ok: true });
  closeSse(res);
}
