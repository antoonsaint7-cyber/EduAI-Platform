function log(level, event, fields = {}) {
  const record = { time: new Date().toISOString(), level, event, ...fields };
  console.log(JSON.stringify(record));
}
function timing(event, startedAt, fields = {}) { log('info', event, { durationMs: Date.now() - startedAt, ...fields }); }
module.exports = { log, timing };
