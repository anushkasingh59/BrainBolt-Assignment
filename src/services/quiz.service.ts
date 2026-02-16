import { Question, IQuestion } from '@/models/Question';
import { UserState, IUserState } from '@/models/UserState';
import { AnswerLog } from '@/models/AnswerLog';
import { User } from '@/models/User';
import { redis, CACHE_KEYS, CACHE_TTL } from '@/lib/redis';
import {
  getUpdatedUserState,
  calculateScoreDelta,
  DEFAULT_ADAPTIVE_CONFIG,
} from '@/lib/adaptive-algorithm';
import { DifficultyLevel, UserMetrics } from '@/types/quiz.types';
import { generateUsername } from '@/lib/utils';
import { nanoid } from 'nanoid';

/**
 * Get or create user state
 */
export async function getOrCreateUserState(
  userId: string
): Promise<IUserState> {
  // Try to get from cache first
  const cacheKey = `${CACHE_KEYS.USER_STATE}${userId}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
        const parsed = JSON.parse(cached);

        return {
            ...parsed,
            lastAnswerAt: parsed.lastAnswerAt
            ? new Date(parsed.lastAnswerAt)
            : null,
        };
        }
  } catch (error) {
    console.error('Cache get error:', error);
  }

  // Get from database
  let userState = await UserState.findOne({ userId });

  if (!userState) {
    // Create new user if doesn't exist
    let user = await User.findOne({ externalId: userId });

    if (!user) {
    user = await User.create({
        externalId: userId,
        username: generateUsername(),
    });
    }

    // Create initial user state
    userState = await UserState.create({
      userId,
      currentDifficulty: 5,
      streak: 0,
      maxStreak: 0,
      totalScore: 0,
      lastQuestionId: null,
      lastAnswerAt: null,
      stateVersion: 1,
      confidenceScore: 0.5,
      recentPerformance: [],
    });
  }

  // Cache the state
  try {
    await redis.setex(
      cacheKey,
      CACHE_TTL.USER_STATE,
      JSON.stringify(userState)
    );
  } catch (error) {
    console.error('Cache set error:', error);
  }

  return userState;
}

/**
 * Get next question based on current difficulty
 */
export async function getNextQuestion(
  userId: string
): Promise<{ question: IQuestion; userState: IUserState }> {
  const userState = await getOrCreateUserState(userId);

  // Try to get questions from cache
  const cacheKey = `${CACHE_KEYS.QUESTIONS_BY_DIFFICULTY}${userState.currentDifficulty}`;

  let questions: IQuestion[];

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      questions = JSON.parse(cached);
    } else {
      // Query from database
      questions = await Question.find({
        difficulty: userState.currentDifficulty,
      }).lean<IQuestion[]>();

      // Cache the questions
      if (questions.length > 0) {
        await redis.setex(
          cacheKey,
          CACHE_TTL.QUESTIONS,
          JSON.stringify(questions)
        );
      }
    }
  } catch (error) {
    console.error('Question cache error:', error);
    questions = await Question.find({
      difficulty: userState.currentDifficulty,
    }).lean<IQuestion[]>();
  }

  if (questions.length === 0) {
    throw new Error(
      `No questions found for difficulty ${userState.currentDifficulty}`
    );
  }

  // Filter out last question to avoid repetition
  const availableQuestions = questions.filter(
    (q) => q._id.toString() !== userState.lastQuestionId
  );

  const questionPool =
    availableQuestions.length > 0 ? availableQuestions : questions;

  // Select random question
  const question =
    questionPool[Math.floor(Math.random() * questionPool.length)];

  return { question, userState };
}

/**
 * Submit answer and update user state
 */
export async function submitAnswer(
  userId: string,
  questionId: string,
  answer: number,
  stateVersion: number,
  idempotencyKey: string
): Promise<{
  correct: boolean;
  scoreDelta: number;
  newState: IUserState;
  correctAnswer?: number;
}> {
  // Check idempotency - prevent duplicate submissions
  const existingLog = await AnswerLog.findOne({ idempotencyKey });
  if (existingLog) {
    // Return cached result
    const currentState = await getOrCreateUserState(userId);
    return {
      correct: existingLog.correct,
      scoreDelta: existingLog.scoreDelta,
      newState: currentState,
      correctAnswer: existingLog.correct ? undefined : existingLog.answer,
    };
  }

  // Get question
  const question = await Question.findById(questionId);
  if (!question) {
    throw new Error('Question not found');
  }

  // Get current state
  const currentState = await getOrCreateUserState(userId);

  // Check state version for optimistic locking
  if (currentState.stateVersion !== stateVersion) {
    throw new Error(
      'State version mismatch - please refresh and try again'
    );
  }

  // Check if answer is correct
  const isCorrect = answer === question.correctAnswer;

  // Calculate score delta using current streak (before update)
  const scoreDelta = calculateScoreDelta(
    currentState.currentDifficulty,
    currentState.streak,
    isCorrect,
    DEFAULT_ADAPTIVE_CONFIG
  );

  // Get updated state
  const updates = getUpdatedUserState(
    currentState,
    isCorrect,
    questionId,
    DEFAULT_ADAPTIVE_CONFIG
  );

  // Update database with new state
  const newState = await UserState.findOneAndUpdate(
    { userId, stateVersion },
    updates,
    { new: true }
  );

  if (!newState) {
    throw new Error('Failed to update user state - concurrent modification');
  }

  // Log the answer
  await AnswerLog.create({
    userId,
    questionId,
    difficulty: currentState.currentDifficulty,
    answer,
    correct: isCorrect,
    scoreDelta,
    streakAtAnswer: currentState.streak,
    answeredAt: new Date(),
    idempotencyKey,
  });

  // Invalidate cache
  const cacheKey = `${CACHE_KEYS.USER_STATE}${userId}`;
  try {
    await redis.del(cacheKey);
    await redis.del(CACHE_KEYS.LEADERBOARD_SCORE);
    await redis.del(CACHE_KEYS.LEADERBOARD_STREAK);
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }

  return {
    correct: isCorrect,
    scoreDelta,
    newState,
    correctAnswer: isCorrect ? undefined : question.correctAnswer,
  };
}

/**
 * Get user metrics and analytics
 */
export async function getUserMetrics(userId: string): Promise<UserMetrics> {
  const userState = await getOrCreateUserState(userId);

  // Get answer logs for analytics
  const answerLogs = await AnswerLog.find({ userId }).sort({ answeredAt: -1 });

  const totalQuestions = answerLogs.length;
  const correctAnswers = answerLogs.filter((log) => log.correct).length;
  const accuracy =
    totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

  // Calculate difficulty histogram
  const difficultyHistogram: Record<DifficultyLevel, number> = {} as Record<
    DifficultyLevel,
    number
  >;

  for (let i = 1; i <= 10; i++) {
    difficultyHistogram[i as DifficultyLevel] = 0;
  }

  answerLogs.forEach((log) => {
    difficultyHistogram[log.difficulty as DifficultyLevel]++;
  });

  return {
    currentDifficulty: userState.currentDifficulty,
    streak: userState.streak,
    maxStreak: userState.maxStreak,
    totalScore: userState.totalScore,
    accuracy: Math.round(accuracy * 100) / 100,
    difficultyHistogram,
    recentPerformance: userState.recentPerformance,
    totalQuestions,
    correctAnswers,
  };
}

/**
 * Create a new session
 */
export function createSession(): string {
  return nanoid();
}