import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getStreakLeaderboard } from '@/services/leaderboard.service';
import { GetLeaderboardStreakResponse } from '@/types/api.types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limitParam = searchParams.get('limit');
    const userId = searchParams.get('userId');

    const limit = limitParam ? parseInt(limitParam) : 100;

    if (limit < 1 || limit > 1000) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 1000' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Get leaderboard
    const { leaderboard, currentUserRank } = await getStreakLeaderboard(
      limit,
      userId || undefined
    );

    const response: GetLeaderboardStreakResponse = {
      leaderboard,
      currentUserRank,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Get streak leaderboard error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}