export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type PageKey =
  | 'landing'
  | 'demo'
  | 'dashboard'
  | 'speaking'
  | 'pronunciation'
  | 'writing'
  | 'cefr'
  | 'progress'
  | 'settings';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  feedback?: SpeakingFeedback;
  createdAt: number;
  isDemo?: boolean;
}

export interface SpeakingFeedback {
  grammar: string;
  vocabulary: string;
  fluency: string;
  scoreOutOf100: number;
}

export interface ConversationContext {
  topic: string;
  level: CefrLevel;
}

export interface WritingFeedback {
  grammar: {
    score: number;
    notes: string[];
  };
  vocabulary: {
    score: number;
    notes: string[];
  };
  coherence: {
    score: number;
    notes: string[];
  };
  cefrLevel: CefrLevel;
  suggestions: string[];
  overallScore: number;
}

export interface PronunciationResult {
  transcript: string;
  words: PronunciationWord[];
  overallScore: number;
  recommendations: string[];
}

export interface PronunciationWord {
  word: string;
  status: 'good' | 'review' | 'difficult';
  note?: string;
}

export interface CefrQuestion {
  id: string;
  level: CefrLevel;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface CefrResult {
  score: number;
  total: number;
  estimatedLevel: CefrLevel;
  perLevel: Record<CefrLevel, { correct: number; total: number }>;
}

export interface ActivityItem {
  id: string;
  type: 'speaking' | 'writing' | 'pronunciation' | 'cefr';
  title: string;
  detail: string;
  minutes: number;
  date: string;
}

export interface DemoUser {
  name: string;
  email: string;
  isDemo: boolean;
  cefrLevel: CefrLevel;
  joinedAt: string;
  dailyGoalMinutes: number;
  todayMinutes: number;
}

export interface AICapabilityStatus {
  configured: boolean;
  provider: string | null;
}
