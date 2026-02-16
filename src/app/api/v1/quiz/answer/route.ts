import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { submitAnswer } from '@/services/quiz.service';
import {
  getUserScoreRank,
  getUserStreakRank,
} from '@/services/leaderboard.service';
import { rateLimiter } from '@/lib/rate-limiter';
import { SubmitAnswerRequest, SubmitAnswerResponse } from '@/types/api.types';

export async function POST(request: NextRequest) {
  try {
    const body: SubmitAnswerRequest = await request.json();

    const { userId, sessionId, questionId, answer, stateVersion, answerIdempotencyKey } = body;

    // Validate required fields
    if (!userId || !questionId || answer === undefined || !stateVersion || !answerIdempotencyKey) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Rate limiting
    const isAllowed = await rateLimiter.checkLimit(userId);
    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', message: 'Too many requests' },
        { status: 429 }
      );
    }

    // Connect to database
    await connectDB();

    // Submit answer
    const result = await submitAnswer(
      userId,
      questionId,
      answer,
      stateVersion,
      answerIdempotencyKey
    );

    // Get updated leaderboard ranks
    const [scoreRank, streakRank] = await Promise.all([
      getUserScoreRank(userId),
      getUserStreakRank(userId),
    ]);

    const response: SubmitAnswerResponse = {
      correct: result.correct,
      newDifficulty: result.newState.currentDifficulty,
      newStreak: result.newState.streak,
      scoreDelta: result.scoreDelta,
      totalScore: result.newState.totalScore,
      stateVersion: result.newState.stateVersion,
      leaderboardRankScore: scoreRank,
      leaderboardRankStreak: streakRank,
      correctAnswer: result.correctAnswer,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Submit answer error:', error);

    if (error instanceof Error) {
      if (error.message.includes('State version mismatch')) {
        return NextResponse.json(
          { error: 'Conflict', message: error.message },
          { status: 409 }
        );
      }
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Not found', message: error.message },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}