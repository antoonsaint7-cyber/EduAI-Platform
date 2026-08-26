const { app, close } = require('../server');
const { query } = require('./db');
const { getCurrentUser } = require('./auth');
const OpenAI = require('openai');
const { registerPlatformV2 } = require('./platform-v2');

const client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
registerPlatformV2(app, { query, getCurrentUser, client });

const port = Number(process.env.PORT || 3000);
const server = app.listen(port, () => console.log(`EduAI Platform running on port ${port}`));
const shutdown = async () => { server.close(async () => { await close(); process.exit(0); }); };
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
