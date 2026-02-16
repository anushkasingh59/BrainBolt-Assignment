import { DifficultyLevel } from './quiz.types';

// GET /api/v1/quiz/next
export interface GetNextQuestionRequest {
  userId: string;
  sessionId?: string;
}

export interface GetNextQuestionResponse {
  questionId: string;
  difficulty: DifficultyLevel;
  prompt: string;
  choices: string[];
  sessionId: string;
  stateVersion: number;
  currentScore: number;
  currentStreak: number;
}

// POST /api/v1/quiz/answer
export interface SubmitAnswerRequest {
  userId: string;
  sessionId: string;
  questionId: string;
  answer: number;
  stateVersion: number;
  answerIdempotencyKey: string;
}

export interface SubmitAnswerResponse {
  correct: boolean;
  newDifficulty: DifficultyLevel;
  newStreak: number;
  scoreDelta: number;
  totalScore: number;
  stateVersion: number;
  leaderboardRankScore: number;
  leaderboardRankStreak: number;
  correctAnswer?: number; // Only sent if answer was wrong
}

// GET /api/v1/quiz/metrics
export interface GetMetricsRequest {
  userId: string;
}

export interface GetMetricsResponse {
  currentDifficulty: DifficultyLevel;
  streak: number;
  maxStreak: number;
  totalScore: number;
  accuracy: number;
  difficultyHistogram: Record<string, number>;
  recentPerformance: boolean[];
  totalQuestions: number;
  correctAnswers: number;
}

// GET /api/v1/leaderboard/score
export interface GetLeaderboardScoreRequest {
  limit?: number;
  userId?: string;
}

export interface GetLeaderboardScoreResponse {
  leaderboard: Array<{
    userId: string;
    username: string;
    score: number;
    rank: number;
  }>;
  currentUserRank?: number;
}

// GET /api/v1/leaderboard/streak
export interface GetLeaderboardStreakRequest {
  limit?: number;
  userId?: string;
}

export interface GetLeaderboardStreakResponse {
  leaderboard: Array<{
    userId: string;
    username: string;
    streak: number;
    rank: number;
  }>;
  currentUserRank?: number;
}

// Error Response
export interface ErrorResponse {
  error: string;
  message: string;
  code?: string;
}