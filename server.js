const express = require('express');
const OpenAI = require('openai');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));
app.use(express.static('public'));

app.post('/api/chat', async (req, res) => {
  try {
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
    if (!message) return res.status(400).json({ error: 'Message is required.' });
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ error: 'OPENAI_API_KEY is not configured on the server.' });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || 'gpt-5-mini',
      instructions: 'You are a concise, friendly voice assistant. Answer in the same language as the user. Keep spoken answers natural and reasonably short.',
      input: message
    });

    res.json({ answer: response.output_text || 'I could not generate an answer.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'The assistant could not process the request.' });
  }
});

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(port, () => {
  console.log(`Voice AI Assistant running on port ${port}`);
});
