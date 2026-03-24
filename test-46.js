const { Anthropic } = require('@anthropic-ai/sdk');
require('dotenv').config({ path: './.env.local' });
const a = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
a.messages.create({ max_tokens: 10, messages: [{ role: 'user', content: 'test' }], model: 'claude-sonnet-4-6' })
.then(r => console.log("SUCCESS"))
.catch(e => console.log("ERROR: " + e.message));
