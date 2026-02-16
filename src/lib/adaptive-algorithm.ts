import { DifficultyLevel, AdaptiveConfig, UserState } from '@/types/quiz.types';
import { clamp } from './utils';

/**
 * Default adaptive configuration
 * Implements stabilization mechanisms to prevent ping-pong oscillation
 */
export const DEFAULT_ADAPTIVE_CONFIG: AdaptiveConfig = {
  minDifficulty: 1,
  maxDifficulty: 10,
  difficultyIncrement: 1,
  difficultyDecrement: 1,
  streakMultiplierCap: 3.0,
  confidenceThreshold: 0.6, // Need 60% confidence to change difficulty
  rollingWindowSize: 5,
  inactivityDecayMs: 24 * 60 * 60 * 1000, // 24 hours
};

/**
 * Calculate the next difficulty level based on answer correctness
 * Implements three stabilization mechanisms:
 * 1. Confidence Score: Tracks performance consistency
 * 2. Rolling Window: Considers recent performance trend
 * 3. Hysteresis: Requires sustained performance before changing difficulty
 */
export function calculateNextDifficulty(
  currentState: UserState,
  isCorrect: boolean,
  config: AdaptiveConfig = DEFAULT_ADAPTIVE_CONFIG
): DifficultyLevel {
  const { currentDifficulty, confidenceScore, recentPerformance } = currentState;

  // Update recent performance window
  const updatedPerformance = [...recentPerformance, isCorrect].slice(
    -config.rollingWindowSize
  );

  // Calculate new confidence score (0.0 to 1.0)
  // Increases on correct, decreases on incorrect
  let newConfidence = confidenceScore;
  if (isCorrect) {
    newConfidence = Math.min(1.0, confidenceScore + 0.2);
  } else {
    newConfidence = Math.max(0.0, confidenceScore - 0.3);
  }

  // Calculate recent performance ratio
  const correctCount = updatedPerformance.filter(Boolean).length;
  const recentAccuracy = correctCount / updatedPerformance.length;

  // Determine if difficulty should change
  let newDifficulty = currentDifficulty;

  if (isCorrect) {
    // Only increase difficulty if:
    // 1. Confidence is high enough
    // 2. Recent accuracy is good (> 60%)
    // 3. Haven't reached max difficulty
    if (
      newConfidence >= config.confidenceThreshold &&
      recentAccuracy >= 0.6 &&
      currentDifficulty < config.maxDifficulty
    ) {
      newDifficulty = Math.min(
        config.maxDifficulty,
        currentDifficulty + config.difficultyIncrement
      ) as DifficultyLevel;
    }
  } else {
    // Decrease difficulty immediately on wrong answer if:
    // 1. Confidence has dropped significantly
    // 2. Haven't reached min difficulty
    if (
      newConfidence < 0.4 ||
      (recentAccuracy < 0.4 && currentDifficulty > config.minDifficulty)
    ) {
      newDifficulty = Math.max(
        config.minDifficulty,
        currentDifficulty - config.difficultyDecrement
      ) as DifficultyLevel;
    }
  }

  return newDifficulty;
}

/**
 * Calculate streak multiplier with cap
 * Formula: 1 + (streak * 0.1), capped at streakMultiplierCap
 */
export function calculateStreakMultiplier(
  streak: number,
  config: AdaptiveConfig = DEFAULT_ADAPTIVE_CONFIG
): number {
  const multiplier = 1 + streak * 0.1;
  return Math.min(multiplier, config.streakMultiplierCap);
}

/**
 * Calculate score delta for a given answer
 * Formula: baseScore * difficultyWeight * streakMultiplier
 */
export function calculateScoreDelta(
  difficulty: DifficultyLevel,
  streak: number,
  isCorrect: boolean,
  config: AdaptiveConfig = DEFAULT_ADAPTIVE_CONFIG
): number {
  if (!isCorrect) return 0;

  const baseScore = 100;
  const difficultyWeight = difficulty / 10; // 0.1 to 1.0
  const streakMultiplier = calculateStreakMultiplier(streak, config);

  const score = baseScore * difficultyWeight * streakMultiplier;
  return Math.round(score);
}

/**
 * Update confidence score based on answer correctness
 */
export function updateConfidenceScore(
  currentConfidence: number,
  isCorrect: boolean
): number {
  if (isCorrect) {
    return clamp(currentConfidence + 0.2, 0, 1);
  } else {
    return clamp(currentConfidence - 0.3, 0, 1);
  }
}

/**
 * Check if streak should decay due to inactivity
 */
export function shouldDecayStreak(
  lastAnswerAt: Date | null,
  config: AdaptiveConfig = DEFAULT_ADAPTIVE_CONFIG
): boolean {
  if (!lastAnswerAt) return false;

  const now = new Date();
  const timeSinceLastAnswer = now.getTime() - lastAnswerAt.getTime();

  return timeSinceLastAnswer > config.inactivityDecayMs;
}

/**
 * Get updated user state after answering a question
 */
export function getUpdatedUserState(
  currentState: UserState,
  isCorrect: boolean,
  questionId: string,
  config: AdaptiveConfig = DEFAULT_ADAPTIVE_CONFIG
): Partial<UserState> {
  // Check for inactivity decay
  const streakDecayed = shouldDecayStreak(currentState.lastAnswerAt, config);

  // Calculate new streak
  let newStreak: number;
  if (streakDecayed) {
    newStreak = isCorrect ? 1 : 0;
  } else {
    newStreak = isCorrect ? currentState.streak + 1 : 0;
  }

  // Calculate score delta
  const scoreDelta = calculateScoreDelta(
    currentState.currentDifficulty,
    currentState.streak, // Use old streak for score calculation
    isCorrect,
    config
  );

  // Update recent performance
  const updatedPerformance = [...currentState.recentPerformance, isCorrect].slice(
    -config.rollingWindowSize
  );

  // Calculate new confidence
  const newConfidence = updateConfidenceScore(
    currentState.confidenceScore,
    isCorrect
  );

  // Calculate new difficulty
  const newDifficulty = calculateNextDifficulty(
    {
      ...currentState,
      recentPerformance: updatedPerformance,
      confidenceScore: newConfidence,
    },
    isCorrect,
    config
  );

  // Update max streak
  const newMaxStreak = Math.max(currentState.maxStreak, newStreak);

  return {
    currentDifficulty: newDifficulty,
    streak: newStreak,
    maxStreak: newMaxStreak,
    totalScore: currentState.totalScore + scoreDelta,
    lastQuestionId: questionId,
    lastAnswerAt: new Date(),
    stateVersion: currentState.stateVersion + 1,
    confidenceScore: newConfidence,
    recentPerformance: updatedPerformance,
  };
}