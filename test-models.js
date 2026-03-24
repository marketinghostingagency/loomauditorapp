const { Anthropic } = require('@anthropic-ai/sdk');
require('dotenv').config({ path: './.env.local' });

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const models = [
  "claude-3-5-sonnet-20241022",
  "claude-3-5-sonnet-latest",
  "claude-3-5-sonnet-20240620",
  "claude-3-sonnet-20240229",
  "claude-3-haiku-20240307",
  "claude-3-opus-20240229"
];

async function testModels() {
  for (const model of models) {
    try {
      await anthropic.messages.create({
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }],
        model: model,
      });
      console.log(model + " : SUCCESS");
    } catch (e) {
      console.log(model + " : ERROR - " + e.message);
    }
  }
}
testModels();
