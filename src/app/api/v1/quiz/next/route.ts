import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getNextQuestion, createSession } from '@/services/quiz.service';
import { rateLimiter } from '@/lib/rate-limiter';
import { GetNextQuestionResponse } from '@/types/api.types';

export async function GET(request: NextRequest) {
  try {
    // Get userId from query params
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
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

    // Get next question
    const { question, userState } = await getNextQuestion(userId);

    // Create session if not provided
    const activeSessionId = sessionId || createSession();

    const response: GetNextQuestionResponse = {
      questionId: question._id.toString(),
      difficulty: question.difficulty,
      prompt: question.prompt,
      choices: question.choices,
      sessionId: activeSessionId,
      stateVersion: userState.stateVersion,
      currentScore: userState.totalScore,
      currentStreak: userState.streak,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Get next question error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}