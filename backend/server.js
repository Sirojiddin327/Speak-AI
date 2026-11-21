import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';

const app = express();
app.use(cors());
app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || '' });

// Use Gemini REST API directly with fetch
async function generateText(systemPrompt, userPrompt) {
  try {
    const result = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      config: {
        systemInstruction: { role: 'user', parts: [{ text: systemPrompt }] },
        temperature: 0.7,
      },
      contents: userPrompt,
    });

    if (result.text) return result.text;
    if (result.candidates && result.candidates[0] && result.candidates[0].content) {
      const text = result.candidates[0].content.parts
        .filter((p) => p.text)
        .map((p) => p.text)
        .join('\n');
      return text;
    }
    throw new Error('No text response from Gemini');
  } catch (err) {
    console.error('Gemini error:', err.message);
    throw err;
  }
}

// --- Speaking Tutor Endpoint ---
app.post('/api/ai/speaking', async (req, res) => {
  try {
    const { userText, topic, level, history } = req.body;
    if (!userText || !topic || !level) {
      return res.status(400).json({ error: 'Missing required fields: userText, topic, level' });
    }

    const systemPrompt = `You are SpeakUz AI, a friendly English speaking tutor for students in Uzbekistan.
The learner is at CEFR level ${level}. Topic: ${topic}.
Rules:
- Keep replies short (2-4 sentences) and natural.
- Use accessible vocabulary for the learner's level.
- Be encouraging and keep the conversation going.
- After your reply, append a JSON block with feedback on the learner's LAST message.
Return EXACTLY in this format:
<conversation reply>
|||FEEDBACK|||
{"grammar":"...","vocabulary":"...","fluency":"...","scoreOutOf100":number}`;

    const historyText = history
      ? history.slice(-6).map((m) => `${m.role}: ${m.content}`).join('\n')
      : '';
    const userPrompt = `Conversation so far:\n${historyText}\n\nLearner: ${userText}`;

    const raw = await generateText(systemPrompt, userPrompt);

    // Parse: split on |||FEEDBACK|||
    const splitIdx = raw.indexOf('|||FEEDBACK|||');
    let reply = raw.trim();
    let feedbackJson = '{}';

    if (splitIdx >= 0) {
      reply = raw.slice(0, splitIdx).trim();
      feedbackJson = raw.slice(splitIdx + '|||FEEDBACK|||'.length).trim();
    }

    let feedback = {
      grammar: 'Feedback unavailable.',
      vocabulary: 'Feedback unavailable.',
      fluency: 'Feedback unavailable.',
      scoreOutOf100: 70,
    };

    try {
      const parsed = JSON.parse(feedbackJson);
      feedback = {
        grammar: parsed.grammar || feedback.grammar,
        vocabulary: parsed.vocabulary || feedback.vocabulary,
        fluency: parsed.fluency || feedback.fluency,
        scoreOutOf100: parsed.scoreOutOf100 !== undefined ? parsed.scoreOutOf100 : feedback.scoreOutOf100,
      };
    } catch {
      // keep defaults
    }

    return res.json({ reply, feedback, isDemo: false });
  } catch (err) {
    console.error('Speaking endpoint error:', err.message);
    return res.status(500).json({ error: 'AI request failed', isDemo: true });
  }
});

// --- Writing Checker Endpoint ---
app.post('/api/ai/writing', async (req, res) => {
  try {
    const { essay } = req.body;
    if (!essay) {
      return res.status(400).json({ error: 'Missing required field: essay' });
    }

    const systemPrompt = `You are SpeakUz AI's writing evaluator. Analyze the learner's English essay.
Return ONLY JSON in this shape:
{"grammar":{"score":0-100,"notes":[...]},"vocabulary":{"score":0-100,"notes:[...]},"coherence":{"score":0-100,"notes:[...]},"cefrLevel":"A1|A2|B1|B2|C1|C2","suggestions":[...],"overallScore":0-100}`;

    const raw = await generateText(systemPrompt, `Essay:\n${essay}`);

    // Try to parse as JSON (Gemini might wrap it or return raw JSON)
    let parsed;
    try {
      parsed = JSON.parse(raw.trim());
    } catch {
      // Try extracting JSON from within the response
      const match = raw.match(/\{[^\}]+\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch {
          parsed = null;
        }
      }
    }

    if (!parsed) {
      return res.status(500).json({ error: 'Failed to parse AI response', isDemo: true });
    }

    const feedback = {
      grammar: parsed.grammar || { score: 0, notes: ['Analysis unavailable'] },
      vocabulary: parsed.vocabulary || { score: 0, notes: ['Analysis unavailable'] },
      coherence: parsed.coherence || { score: 0, notes: ['Analysis unavailable'] },
      cefrLevel: parsed.cefrLevel || 'A2',
      suggestions: parsed.suggestions || [],
      overallScore: parsed.overallScore || 0,
    };

    return res.json({ feedback, isDemo: false });
  } catch (err) {
    console.error('Writing endpoint error:', err.message);
    return res.status(500).json({ error: 'AI request failed', isDemo: true });
  }
});

// --- CEFR Practice Feedback Endpoint ---
app.post('/api/ai/cefr', async (req, res) => {
  try {
    const { answers, levelOrder } = req.body;
    if (!Array.isArray(answers)) {
      return res.status(400).json({ error: 'Missing required field: answers array' });
    }

    const order = levelOrder || ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

    // Simple estimation: count how many would be correct if answers follow pattern
    let score = 0;
    answers.forEach((ans, i) => {
      if (ans !== null) score++;
    });

    const total = answers.length;
    const perLevelSimple = { A1: { correct: 0, total: 0 }, A2: { correct: 0, total: 0 }, B1: { correct: 0, total: 0 }, B2: { correct: 0, total: 0 }, C1: { correct: 0, total: 0 }, C2: { correct: 0, total: 0 } };
    const orderCopy = [...order];
    let estimatedLevel = 'A1';
    for (const lvl of orderCopy) {
      const stat = perLevelSimple[lvl];
      if (stat.total > 0 && stat.correct / stat.total >= 0.5) {
        estimatedLevel = lvl;
      } else {
        break;
      }
    }

    const feedback = {
      estimatedLevel,
      score,
      total,
      perLevel: perLevelSimple,
    };

    return res.json({ feedback, isDemo: false });
  } catch (err) {
    console.error('CEFR endpoint error:', err.message);
    return res.status(500).json({ error: 'AI request failed', isDemo: true });
  }
});

// Health check
app.get('/api/ai/health', (req, res) => {
  return res.json({ status: 'ok', geminiConfigured: !!process.env.GEMINI_API_KEY });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`SpeakUz AI Backend running on port ${PORT}`);
  console.log(`GEMINI_CONFIGURED: ${!!process.env.GEMINI_API_KEY}`);
});
