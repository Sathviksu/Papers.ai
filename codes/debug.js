const { genkit } = require('genkit');
const ai = genkit({});
try {
  ai.defineModel({
    name: 'custom/llama-3.3-70b-versatile',
    info: {
      label: 'Llama 3.3 70B Versatile',
      versions: ['llama-3.3-70b-versatile'],
      supports: {
        multiturn: true,
        systemRole: true,
        media: false,
        tools: true,
        output: ['text', 'json'],
      },
    },
  }, async () => ({}));
} catch (e) {
  console.log(JSON.stringify(e, null, 2));
}
