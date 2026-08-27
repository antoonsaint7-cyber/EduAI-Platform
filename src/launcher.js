const http = require('node:http');
const { app, close } = require('../server');

const port = Number(process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(`Invalid PORT: ${process.env.PORT}`);
}

const server = http.createServer(app);
let shuttingDown = false;

server.on('error', (error) => {
  console.error(`HTTP server error: ${error?.message || error}`);
  process.exitCode = 1;
});

server.listen(port, '0.0.0.0', () => {
  console.log(`EduAI Platform running on port ${port}`);
});

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`Received ${signal}; shutting down gracefully.`);

  const forceExit = setTimeout(() => process.exit(1), 10_000);
  forceExit.unref();

  server.close(async () => {
    try {
      await close();
      clearTimeout(forceExit);
      process.exit(0);
    } catch (error) {
      console.error(error?.message || error);
      clearTimeout(forceExit);
      process.exit(1);
    }
  });
}

process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));
