import type {
  AICapabilityStatus,
  ConversationContext,
  PronunciationResult,
  SpeakingFeedback,
  WritingFeedback,
} from '@/types';

const ENV = (import.meta as unknown as { env: Record<string, string | undefined> }).env ?? {};

// Read backend URL from env or use default
const BACKEND_BASE_URL: string = ENV.VITE_BACKEND_URL || 'http://localhost:5000';

// Determine if AI is configured
const VITE_AI_PROVIDER: string = ENV.VITE_AI_PROVIDER || 'none';

export function getAIStatus(): AICapabilityStatus {
  return {
    configured: VITE_AI_PROVIDER !== 'none',
    provider: VITE_AI_PROVIDER === 'none' ? null : VITE_AI_PROVIDER,
  };
}

// isDemoMode is true when AI is not configured
export const isDemoMode: boolean = VITE_AI_PROVIDER === 'none';

// Check if the backend AI is actually available
export async function checkAIStatus(): Promise<AICapabilityStatus> {
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/api/ai/health`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();

    // If backend reports Gemini configured, use that
    if (data.status === 'ok' && data.geminiConfigured) {
      return { configured: true, provider: 'gemini' };
    }

    // Otherwise fall back to the Vite env provider check
    return {
      configured: VITE_AI_PROVIDER !== 'none',
      provider: VITE_AI_PROVIDER === 'none' ? null : VITE_AI_PROVIDER,
    };
  } catch {
    // If backend unreachable, fall back to Vite env check
    return {
      configured: VITE_AI_PROVIDER !== 'none',
      provider: VITE_AI_PROVIDER === 'none' ? null : VITE_AI_PROVIDER,
    };
  }
}

// --- LLM Call (backend proxy) ---
async function callBackendAPI(endpoint: string, body: object): Promise<any> {
  const res = await fetch(`${BACKEND_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    credentials: 'same-origin',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`AI_REQUEST_FAILED (${res.status}): ${text.slice(0, 200)}`);
  }

  return res.json();
}

// --- Speaking Tutor ---
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
  // If not configured, immediately return demo
  if (!getAIStatus().configured) {
    return demoSpeakingResponse(userText, context);
  }

  try {
    const body = {
      userText,
      topic: context.topic,
      level: context.level,
      history,
    };
    const result: SpeakingResponse = await callBackendAPI('/api/ai/speaking', body);
    // Result from backend has isDemo field - preserve it
    return result;
  } catch (err) {
    console.error('Speaking API error:', err);
    // Fallback to demo response when backend fails
    return demoSpeakingResponse(userText, context);
  }
}

function demoSpeakingResponse(userText: string, context: ConversationContext) {
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

// --- Writing Checker ---
export interface WritingResponse {
  feedback: WritingFeedback;
  isDemo: boolean;
}

export async function getWritingFeedback(essay: string): Promise<WritingResponse> {
  // If not configured, immediately return demo
  if (!getAIStatus().configured) {
    return demoWritingFeedback(essay);
  }

  try {
    const result: WritingResponse = await callBackendAPI('/api/ai/writing', { essay });
    return result;
  } catch (err) {
    console.error('Writing API error:', err);
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
  if (/\bi is\b|\bi are\b|\nshe are\b|\sshe are\b/.test(lower))
    grammarNotes.push('Subject-verb agreement: check "I am / he is / she is".');
  if (grammarNotes.length === 0)
    grammarNotes.push('Grammar is largely correct for this level. Keep practicing varied tenses.');

  const uniqueWords = new Set(words.map((w) => w.toLowerCase().replace(/[^a-z']/g, '')));
  const lexicalDiversity = wordCount ? uniqueWords.size / wordCount : 0;
  if (lexicalDiversity < 0.4 && wordCount > 20)
    vocabNotes.push('You repeat some words. Try synonyms to enrich vocabulary.');
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

// --- CEFR Practice Feedback ---
export interface CefrFeedbackResponse {
  estimatedLevel: CefrLevel;
  score: number;
  total: number;
  perLevel: Record<CefrLevel, { correct: number; total: number }>;
  isDemo: boolean;
}

export async function getCefrFeedback(answers: (number | null)[]): Promise<CefrFeedbackResponse> {
  // If not configured, immediately return demo (using client-side calculation)
  if (!getAIStatus().configured) {
    const LEVEL_ORDER: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const perLevel: Record<CefrLevel, { correct: number; total: number }> = {
      A1: { correct: 0, total: 0 },
      A2: { correct: 0, total: 0 },
      B1: { correct: 0, total: 0 },
      B2: { correct: 0, total: 0 },
      C1: { correct: 0, total: 0 },
      C2: { correct: 0, total: 0 },
    };

    let score = 0;
    answers.forEach((a) => { if (a !== null) score++; });

    const order: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    let estimatedLevel: CefrLevel = 'A1';
    for (const lvl of order) {
      const stat = perLevel[lvl];
      if (stat.total > 0 && stat.correct / stat.total >= 0.5) {
        estimatedLevel = lvl;
      } else {
        break;
      }
    }

    return {
      estimatedLevel,
      score,
      total: answers.length,
      perLevel,
      isDemo: true,
    };
  }

  // If configured, try backend
  try {
    const result: CefrFeedbackResponse = await callBackendAPI('/api/ai/cefr', { answers });
    return result;
  } catch (err) {
    console.error('CEFR API error:', err);
    // Fallback to client-side calculation
    const LEVEL_ORDER: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const perLevel: Record<CefrLevel, { correct: number; total: number }> = {
      A1: { correct: 0, total: 0 },
      A2: { correct: 0, total: 0 },
      B1: { correct: 0, total: 0 },
      B2: { correct: 0, total: 0 },
      C1: { correct: 0, total: 0 },
      C2: { correct: 0, total: 0 },
    };

    let score = 0;
    answers.forEach((a) => { if (a !== null) score++; });

    const order: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    let estimatedLevel: CefrLevel = 'A1';
    for (const lvl of order) {
      const stat = perLevel[lvl];
      if (stat.total > 0 && stat.correct / stat.total >= 0.5) {
        estimatedLevel = lvl;
      } else {
        break;
      }
    }

    return {
      estimatedLevel,
      score,
      total: answers.length,
      perLevel,
      isDemo: true,
    };
  }
}

// --- Pronunciation Analysis (backward compatibility) ---
export function getPronunciationAnalysis(
  transcript: string,
  targetPhrase: string
): Promise<{
  result: PronunciationResult;
  isDemo: boolean;
}> {
  // If not configured, return demo analysis
  if (isDemoMode) {
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

    return Promise.resolve({
      result: {
        transcript,
        words,
        overallScore: Math.max(20, score),
        recommendations,
      },
      isDemo: true,
    });
  }

  // Configured but no backend call - return demo for now
  // In a full implementation, this would call /api/ai/pronunciation
  return Promise.resolve({
    result: {
      transcript,
      words: [],
      overallScore: 0,
      recommendations: ['Backend integration pending.'],
    },
    isDemo: true,
  });
}