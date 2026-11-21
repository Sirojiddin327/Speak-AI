import type { ActivityItem, CefrQuestion, CefrResult, CefrLevel, DemoUser } from '@/types';

export const CEFR_QUESTIONS: CefrQuestion[] = [
  {
    id: 'q1',
    level: 'A1',
    prompt: 'Choose the correct article: "I have ___ apple."',
    options: ['a', 'an', 'the', 'no article'],
    correctIndex: 1,
    explanation: '"Apple" starts with a vowel sound, so we use "an".',
  },
  {
    id: 'q2',
    level: 'A1',
    prompt: 'She ___ to school every day.',
    options: ['go', 'goes', 'going', 'gone'],
    correctIndex: 1,
    explanation: 'Third person singular present tense adds -s: "she goes".',
  },
  {
    id: 'q3',
    level: 'A2',
    prompt: 'There ___ many books on the shelf.',
    options: ['is', 'are', 'was', 'be'],
    correctIndex: 1,
    explanation: '"Books" is plural, so we use "are".',
  },
  {
    id: 'q4',
    level: 'A2',
    prompt: 'Yesterday I ___ a great movie.',
    options: ['watch', 'watched', 'watching', 'watches'],
    correctIndex: 1,
    explanation: 'Past simple of regular verbs adds -ed: "watched".',
  },
  {
    id: 'q5',
    level: 'B1',
    prompt: 'If I ___ more time, I would learn another language.',
    options: ['have', 'had', 'will have', 'would have'],
    correctIndex: 1,
    explanation: 'Second conditional uses the past simple in the if-clause.',
  },
  {
    id: 'q6',
    level: 'B1',
    prompt: 'He asked me where I ___.',
    options: ['live', 'lived', 'am living', 'do live'],
    correctIndex: 1,
    explanation: 'Reported questions shift the tense back: "lived".',
  },
  {
    id: 'q7',
    level: 'B2',
    prompt: 'Despite ___ hard, she failed the exam.',
    options: ['study', 'studied', 'studying', 'to study'],
    correctIndex: 2,
    explanation: '"Despite" is followed by a gerund (-ing form).',
  },
  {
    id: 'q8',
    level: 'B2',
    prompt: "I wish I ___ taller so I could play basketball better.",
    options: ['am', 'was', 'were', 'will be'],
    correctIndex: 2,
    explanation: 'After "wish", we use the subjunctive "were" for unreal situations.',
  },
  {
    id: 'q9',
    level: 'C1',
    prompt: 'The committee has not yet reached a decision, ___ is surprising.',
    options: ['that', 'which', 'what', 'who'],
    correctIndex: 1,
    explanation: 'Non-defining relative clause referring to a whole sentence uses "which".',
  },
  {
    id: 'q10',
    level: 'C1',
    prompt: 'Hardly ___ when the phone rang.',
    options: ['I had arrived', 'had I arrived', 'I arrived', 'did I arrive'],
    correctIndex: 1,
    explanation: 'Negative adverbial "Hardly" at the start triggers inversion: "had I arrived".',
  },
];

export function calculateCefrResult(answers: (number | null)[]): CefrResult {
  const perLevel: Record<CefrLevel, { correct: number; total: number }> = {
    A1: { correct: 0, total: 0 },
    A2: { correct: 0, total: 0 },
    B1: { correct: 0, total: 0 },
    B2: { correct: 0, total: 0 },
    C1: { correct: 0, total: 0 },
    C2: { correct: 0, total: 0 },
  };

  let score = 0;
  CEFR_QUESTIONS.forEach((q, i) => {
    perLevel[q.level].total += 1;
    if (answers[i] === q.correctIndex) {
      perLevel[q.level].correct += 1;
      score += 1;
    }
  });

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

  return { score, total: CEFR_QUESTIONS.length, estimatedLevel, perLevel };
}

export const DEMO_USER: DemoUser = {
  name: 'Demo Student',
  email: 'demo@speakuz.ai',
  isDemo: true,
  cefrLevel: 'B1',
  joinedAt: '2025-09-12',
  dailyGoalMinutes: 20,
  todayMinutes: 14,
};

export const DEMO_ACTIVITIES: ActivityItem[] = [
  { id: 'a1', type: 'speaking', title: 'Speaking practice — Daily routine', detail: '10 min conversation · score 78', minutes: 10, date: '2026-11-21' },
  { id: 'a2', type: 'writing', title: 'Essay — My hometown', detail: '184 words · B1 · score 82', minutes: 12, date: '2026-11-20' },
  { id: 'a3', type: 'pronunciation', title: 'Pronunciation — Travel phrases', detail: '8 words · score 88', minutes: 6, date: '2026-11-20' },
  { id: 'a4', type: 'cefr', title: 'CEFR practice test', detail: '8/10 correct · B1', minutes: 8, date: '2026-11-19' },
  { id: 'a5', type: 'speaking', title: 'Speaking practice — Hobbies', detail: '12 min conversation · score 74', minutes: 12, date: '2026-11-19' },
  { id: 'a6', type: 'writing', title: 'Essay — Why I learn English', detail: '210 words · B1 · score 79', minutes: 14, date: '2026-11-18' },
];

export interface DailyMinutes {
  day: string;
  minutes: number;
}

export const DEMO_WEEKLY_MINUTES: DailyMinutes[] = [
  { day: 'Mon', minutes: 18 },
  { day: 'Tue', minutes: 24 },
  { day: 'Wed', minutes: 12 },
  { day: 'Thu', minutes: 30 },
  { day: 'Fri', minutes: 16 },
  { day: 'Sat', minutes: 22 },
  { day: 'Sun', minutes: 14 },
];

export const DEMO_PROGRESS = {
  speakingSessions: 14,
  writingSubmissions: 9,
  pronunciationDrills: 11,
  cefrTests: 5,
  speakingTrend: [62, 66, 70, 68, 74, 78, 81],
  writingTrend: [55, 60, 64, 70, 72, 79, 82],
  totalPracticeMinutes: 312,
  streakDays: 7,
};

export const RECOMMENDED_EXERCISES = [
  { id: 'r1', title: 'Ordering food at a restaurant', type: 'speaking' as const, level: 'B1', minutes: 10 },
  { id: 'r2', title: 'Describe your favorite holiday', type: 'writing' as const, level: 'B1', minutes: 15 },
  { id: 'r3', title: 'Pronounce travel phrases', type: 'pronunciation' as const, level: 'A2', minutes: 8 },
  { id: 'r4', title: 'B1 Grammar: conditionals', type: 'cefr' as const, level: 'B1', minutes: 12 },
];
