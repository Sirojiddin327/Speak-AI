import type {
  AICapabilityStatus,
  ConversationContext,
  PronunciationResult,
  SpeakingFeedback,
  WritingFeedback,
} from '@/types';

const ENV = (import.meta as unknown as { env: Record<string, string | undefined> }).env ?? {};

const AI_API_KEY: string | undefined = ENV.VITE_AI_API_KEY;
const AI_API_URL: string | undefined = ENV.VITE_AI_API_URL;
const AI_MODEL: string = ENV.VITE_AI_MODEL || 'gpt-4o-mini';
const AI_PROVIDER: string = ENV.VITE_AI_PROVIDER || (AI_API_URL ? 'custom' : 'none');

export function getAIStatus(): AICapabilityStatus {
  return {
    configured: Boolean(AI_API_KEY && AI_API_URL),
    provider: AI_PROVIDER === 'none' ? null : AI_PROVIDER,
  };
}

export const isDemoMode = !getAIStatus().configured;

interface ChatPayload {
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
  temperature?: number;
  max_tokens?: number;
}

async function callLLM(systemPrompt: string, userPrompt: string): Promise<string> {
  if (!AI_API_KEY || !AI_API_URL) {
    throw new Error('AI_NOT_CONFIGURED');
  }

  const payload: ChatPayload = {
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.6,
    max_tokens: 600,
  };

  const res = await fetch(AI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AI_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`AI_REQUEST_FAILED (${res.status}): ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  const content: string | undefined =
    data?.choices?.[0]?.message?.content ??
    data?.content ??
    data?.message ??
    undefined;

  if (!content) throw new Error('AI_EMPTY_RESPONSE');
  return content.trim();
}

function tryParseJSON<T>(raw: string): T | null {
  try {
    const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}

export interface SpeakingResponse {
  reply: string;
  feedback: SpeakingFeedback;
  isDemo: boolean;
}

export async function getSpeakingResponse(
  userText: string,
  context: ConversationContext,
  history: { role: 'user' | 'assistant'; content: string }[],
): Promise<SpeakingResponse> {
  const systemPrompt = `You are SpeakUz AI, a friendly English speaking tutor for students in Uzbekistan.
The learner is at CEFR level ${context.level}. Topic: ${context.topic}.
Rules:
- Keep replies short (2-4 sentences) and natural.
- Use accessible vocabulary for the learner's level.
- Be encouraging and keep the conversation going.
- After your reply, append a JSON block with feedback on the learner's LAST message.
Return EXACTLY in this format:
<conversation reply>
|||FEEDBACK|||
{"grammar":"...","vocabulary":"...","fluency":"...","scoreOutOf100":number}`;

  const historyText = history.slice(-6).map((m) => `${m.role}: ${m.content}`).join('\n');
  const userPrompt = `Conversation so far:\n${historyText}\n\nLearner: ${userText}`;

  try {
    const raw = await callLLM(systemPrompt, userPrompt);
    const [replyPart, feedbackPart] = raw.split('|||FEEDBACK|||');
    const feedbackJson = tryParseJSON<Omit<SpeakingFeedback, 'scoreOutOf100'> & { scoreOutOf100: number }>(
      feedbackPart || '{}',
    );
    const feedback: SpeakingFeedback = feedbackJson ?? {
      grammar: 'Feedback unavailable.',
      vocabulary: 'Feedback unavailable.',
      fluency: 'Feedback unavailable.',
      scoreOutOf100: 70,
    };
    return { reply: (replyPart || raw).trim(), feedback, isDemo: false };
  } catch {
    return demoSpeakingResponse(userText, context);
  }
}

function demoSpeakingResponse(userText: string, context: ConversationContext): SpeakingResponse {
  const lower = userText.toLowerCase();
  const replies: Record<string, string> = {
    greeting: "Hello! I'm glad you're practicing. Tell me, what did you do yesterday?",
    family: 'That sounds lovely. Can you describe one of your family members in more detail?',
    hobby: 'Interesting! How often do you do that, and why do you enjoy it?',
    food: 'Yum! What is your favorite dish to cook at home?',
    default: `That's a great point. Could you say a bit more about it? Try using a full sentence with because or so.`,
  };
  let reply = replies.default;
  if (/(hello|hi|hey|good morning|assalom)/.test(lower)) reply = replies.greeting;
  else if (/(family|mother|father|brother|sister|parent)/.test(lower)) reply = replies.family;
  else if (/(hobby|sport|read|music|game|play)/.test(lower)) reply = replies.hobby;
  else if (/(food|eat|cook|meal|dinner|lunch)/.test(lower)) reply = replies.food;

  const wordCount = userText.trim().split(/\s+/).filter(Boolean).length;
  const hasCapital = /^[A-Z]/.test(userText.trim());
  const hasEndPunct = /[.!?]$/.test(userText.trim());

  const grammarNotes: string[] = [];
  if (!hasCapital) grammarNotes.push('Start sentences with a capital letter.');
  if (!hasEndPunct) grammarNotes.push('End your sentence with proper punctuation (. ! ?).');
  if (/\bi is\b|\bi are\b/.test(lower)) grammarNotes.push('Use "I am" instead of "I is/are".');
  if (grammarNotes.length === 0) grammarNotes.push('Sentence structure looks good for your level.');
  else grammarNotes.push('Overall grammar is understandable — small fixes will improve clarity.');

  const score = Math.max(40, Math.min(92, 65 + wordCount * 2 + (hasCapital ? 5 : 0) + (hasEndPunct ? 5 : 0)));

  return {
    reply,
    feedback: {
      grammar: grammarNotes.join(' '),
      vocabulary: `You used ${wordCount} words. Try adding one descriptive adjective (e.g., "interesting", "delicious").`,
      fluency: wordCount < 5 ? 'Try to speak in full sentences rather than short phrases.' : 'Good fluency — keep the flow going.',
      scoreOutOf100: score,
    },
    isDemo: true,
  };
}

export interface WritingResponse {
  feedback: WritingFeedback;
  isDemo: boolean;
}

export async function getWritingFeedback(essay: string): Promise<WritingResponse> {
  const systemPrompt = `You are SpeakUz AI's writing evaluator. Analyze the learner's English essay.
Return ONLY JSON in this shape:
{"grammar":{"score":0-100,"notes":[...]},"vocabulary":{"score":0-100,"notes":[...]},"coherence":{"score":0-100,"notes":[...]},"cefrLevel":"A1|A2|B1|B2|C1|C2","suggestions":[...],"overallScore":0-100}`;

  try {
    const raw = await callLLM(systemPrompt, `Essay:\n${essay}`);
    const parsed = tryParseJSON<WritingFeedback>(raw);
    if (!parsed) throw new Error('AI_PARSE_FAILED');
    return { feedback: parsed, isDemo: false };
  } catch {
    return demoWritingFeedback(essay);
  }
}

function demoWritingFeedback(essay: string): WritingResponse {
  const words = essay.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const sentences = essay.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
  const sentenceCount = sentences.length;
  const avgLen = sentenceCount ? wordCount / sentenceCount : wordCount;

  const grammarNotes: string[] = [];
  const vocabNotes: string[] = [];
  const coherenceNotes: string[] = [];
  const suggestions: string[] = [];

  const hasCapital = /^[A-Z]/.test(essay.trim());
  const hasEndPunct = /[.!?]$/.test(essay.trim());
  if (!hasCapital) grammarNotes.push('Start your essay with a capital letter.');
  if (!hasEndPunct) grammarNotes.push('Add a closing punctuation mark at the end.');
  const lower = essay.toLowerCase();
  if (/\bi is\b|\bi are\b|\she are\b|\sshe are\b/.test(lower)) grammarNotes.push('Subject-verb agreement: check "I am / he is / she is".');
  if (grammarNotes.length === 0) grammarNotes.push('Grammar is largely correct for this level. Keep practicing varied tenses.');

  const uniqueWords = new Set(words.map((w) => w.toLowerCase().replace(/[^a-z']/g, '')));
  const lexicalDiversity = wordCount ? uniqueWords.size / wordCount : 0;
  if (lexicalDiversity < 0.4 && wordCount > 20) vocabNotes.push('You repeat some words. Try synonyms to enrich vocabulary.');
  else vocabNotes.push('Good range of vocabulary. Add a few advanced linking words (however, therefore, in addition).');

  if (sentenceCount < 3) coherenceNotes.push('Use multiple sentences to develop your ideas.');
  else if (avgLen > 28) coherenceNotes.push('Some sentences are long — split them for clarity.');
  else coherenceNotes.push('Ideas are connected reasonably well. Use transition words to improve flow.');

  suggestions.push('Plan your essay: introduction, body, conclusion.');
  suggestions.push('Read your writing aloud to catch awkward phrasing.');
  suggestions.push('Replace simple words like "good" or "nice" with more precise alternatives.');

  let level: WritingFeedback['cefrLevel'] = 'A2';
  if (wordCount > 120 && lexicalDiversity > 0.5) level = 'B1';
  if (wordCount > 180 && lexicalDiversity > 0.55) level = 'B2';

  const grammarScore = Math.max(50, 88 - grammarNotes.length * 6);
  const vocabScore = Math.max(50, Math.min(98, 78 + Math.round(lexicalDiversity * 30)));
  const coherenceScore = Math.max(50, 80 - coherenceNotes.length * 6);
  const overall = Math.round((grammarScore + vocabScore + coherenceScore) / 3);

  return {
    feedback: {
      grammar: { score: grammarScore, notes: grammarNotes },
      vocabulary: { score: vocabScore, notes: vocabNotes },
      coherence: { score: coherenceScore, notes: coherenceNotes },
      cefrLevel: level,
      suggestions,
      overallScore: overall,
    },
    isDemo: true,
  };
}

export interface PronunciationResponse {
  result: PronunciationResult;
  isDemo: boolean;
}

export async function getPronunciationAnalysis(transcript: string, targetPhrase: string): Promise<PronunciationResponse> {
  const systemPrompt = `You are a pronunciation assistant. Compare the learner's transcript to the target phrase.
Return ONLY JSON: {"words":[{"word":"...","status":"good|review|difficult","note":"..."}],"overallScore":0-100,"recommendations":[...]}`;
  try {
    const raw = await callLLM(systemPrompt, `Target phrase: ${targetPhrase}\nLearner transcript: ${transcript}`);
    const parsed = tryParseJSON<PronunciationResult>(raw);
    if (!parsed) throw new Error('AI_PARSE_FAILED');
    return { result: parsed, isDemo: false };
  } catch {
    return demoPronunciation(transcript, targetPhrase);
  }
}

function demoPronunciation(transcript: string, targetPhrase: string): PronunciationResponse {
  const targetWords = targetPhrase.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(Boolean);
  const spokenWords = transcript.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(Boolean);
  const spokenSet = new Set(spokenWords);

  const words = targetWords.map((w) => {
    if (spokenSet.has(w)) return { word: w, status: 'good' as const };
    if (spokenWords.some((s) => s.startsWith(w.slice(0, 3)) || w.startsWith(s.slice(0, 3)))) {
      return { word: w, status: 'review' as const, note: 'Possibly mispronounced — listen and retry.' };
    }
    return { word: w, status: 'difficult' as const, note: 'Word missing or unclear. Say it slowly.' };
  });

  const goodCount = words.filter((w) => w.status === 'good').length;
  const score = Math.round((goodCount / Math.max(1, targetWords.length)) * 100);

  const recommendations: string[] = [];
  if (score < 70) recommendations.push('Slow down and articulate each word.');
  recommendations.push('Practice difficult words in isolation first.');
  recommendations.push('Record yourself and compare with a native pronunciation sample.');

  return {
    result: {
      transcript,
      words,
      overallScore: Math.max(20, score),
      recommendations,
    },
    isDemo: true,
  };
}
