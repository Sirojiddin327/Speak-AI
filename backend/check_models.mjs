import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
ai.models.list({}).then(models => {
  console.log('Available models:');
  models.forEach(m => console.log(' -', m.name));
}).catch(err => console.error('Error:', err.message));
