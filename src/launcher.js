const http = require('node:http');
const { app, close } = require('../server');

const port = Number(process.env.PORT || 3000);
const server = http.createServer(app);
let shuttingDown = false;

server.listen(port, () => {
  console.log(`EduAI Platform running on port ${port}`);
});

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`Received ${signal}; shutting down gracefully.`);

  server.close(async () => {
    try {
      await close();
      process.exit(0);
    } catch (error) {
      console.error(error?.message || error);
      process.exit(1);
    }
  });

  setTimeout(() => process.exit(1), 10_000).unref();
}

process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));
