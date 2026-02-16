import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getUserMetrics } from '@/services/quiz.service';
import { rateLimiter } from '@/lib/rate-limiter';
import { GetMetricsResponse } from '@/types/api.types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

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

    // Get metrics
    const metrics = await getUserMetrics(userId);

    const response: GetMetricsResponse = {
      currentDifficulty: metrics.currentDifficulty,
      streak: metrics.streak,
      maxStreak: metrics.maxStreak,
      totalScore: metrics.totalScore,
      accuracy: metrics.accuracy,
      difficultyHistogram: metrics.difficultyHistogram as Record<string, number>,
      recentPerformance: metrics.recentPerformance,
      totalQuestions: metrics.totalQuestions,
      correctAnswers: metrics.correctAnswers,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Get metrics error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}