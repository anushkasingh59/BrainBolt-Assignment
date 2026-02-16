export type DifficultyLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface Question {
  id: string;
  difficulty: DifficultyLevel;
  prompt: string;
  choices: string[];
  correctAnswer: number;
  tags?: string[];
}

export interface UserState {
  userId: string;
  currentDifficulty: DifficultyLevel;
  streak: number;
  maxStreak: number;
  totalScore: number;
  lastQuestionId: string | null;
  lastAnswerAt: Date | null;
  stateVersion: number;
  confidenceScore: number; // For ping-pong stabilization
  recentPerformance: boolean[]; // Rolling window of last 5 answers
}

export interface AnswerLog {
  id: string;
  userId: string;
  questionId: string;
  difficulty: DifficultyLevel;
  answer: number;
  correct: boolean;
  scoreDelta: number;
  streakAtAnswer: number;
  answeredAt: Date;
}

export interface UserMetrics {
  currentDifficulty: DifficultyLevel;
  streak: number;
  maxStreak: number;
  totalScore: number;
  accuracy: number;
  difficultyHistogram: Record<DifficultyLevel, number>;
  recentPerformance: boolean[];
  totalQuestions: number;
  correctAnswers: number;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  score?: number;
  streak?: number;
  rank: number;
}

export interface AdaptiveConfig {
  minDifficulty: DifficultyLevel;
  maxDifficulty: DifficultyLevel;
  difficultyIncrement: number;
  difficultyDecrement: number;
  streakMultiplierCap: number;
  confidenceThreshold: number; // Threshold for difficulty change
  rollingWindowSize: number; // Size of recent performance window
  inactivityDecayMs: number; // Time before streak decay
}