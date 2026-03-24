const { Anthropic } = require('@anthropic-ai/sdk');
require('dotenv').config({ path: './.env.local' });

const anthropic = new Anthropic({ 
    apiKey: process.env.ANTHROPIC_API_KEY,
    defaultHeaders: { "anthropic-beta": "max-tokens-3-5-sonnet-2024-07-15" }
});

anthropic.messages.create({ 
    max_tokens: 8192, 
    messages: [{ role: 'user', content: 'Say hello and stop.' }], 
    model: 'claude-sonnet-4-6' 
})
.then(r => console.log("SUCCESS 8192 with Beta Header"))
.catch(e => console.log("ERROR Beta: " + e.message));
