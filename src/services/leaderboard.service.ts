import { UserState } from '@/models/UserState';
import { User } from '@/models/User';
import { redis, CACHE_KEYS, CACHE_TTL } from '@/lib/redis';
import { LeaderboardEntry } from '@/types/quiz.types';

/**
 * Get score leaderboard with current user rank
 */
export async function getScoreLeaderboard(
  limit: number = 100,
  userId?: string
): Promise<{
  leaderboard: any;
  currentUserRank?: number;
}> {
  // Try cache first
  const cacheKey = CACHE_KEYS.LEADERBOARD_SCORE;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      const data = JSON.parse(cached);

      if (userId) {
        const userRank = await getUserScoreRank(userId);
        return {
          leaderboard: data.slice(0, limit),
          currentUserRank: userRank,
        };
      }

      return { leaderboard: data.slice(0, limit) };
    }
  } catch (error) {
    console.error('Leaderboard cache error:', error);
  }

  // Query from database
  const topUsers = await UserState.find()
    .sort({ totalScore: -1 })
    .limit(1000) // Cache top 1000
    // .populate('userId', 'username')
    .lean();

  // const leaderboard: LeaderboardEntry[] = topUsers.map((user, index) => ({
  //   userId: user.userId,
  //   username: (user.userId as any).username || 'Anonymous',
  //   score: user.totalScore,
  //   rank: index + 1,
  // }));
    const leaderboard: LeaderboardEntry[] = await Promise.all(
    topUsers.map(async (state, index) => {
      const user = await User.findOne({ externalId: state.userId }).lean<{ username: string }>();

      return {
        userId: state.userId,
        username: user?.username || 'Anonymous',
        score: state.totalScore,
        rank: index + 1,
      };
    })
  );

  // Cache the result
  try {
    await redis.setex(
      cacheKey,
      CACHE_TTL.LEADERBOARD,
      JSON.stringify(leaderboard)
    );
  } catch (error) {
    console.error('Cache set error:', error);
  }

  let currentUserRank: number | undefined;
  if (userId) {
    currentUserRank = await getUserScoreRank(userId);
  }

  return {
    leaderboard: leaderboard.slice(0, limit),
    currentUserRank,
  };
}

/**
 * Get streak leaderboard with current user rank
 */
export async function getStreakLeaderboard(
  limit: number = 100,
  userId?: string
): Promise<{
  leaderboard: any;
  currentUserRank?: number;
}> {
  // Try cache first
  const cacheKey = CACHE_KEYS.LEADERBOARD_STREAK;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      const data = JSON.parse(cached);

      if (userId) {
        const userRank = await getUserStreakRank(userId);
        return {
          leaderboard: data.slice(0, limit),
          currentUserRank: userRank,
        };
      }

      return { leaderboard: data.slice(0, limit) };
    }
  } catch (error) {
    console.error('Leaderboard cache error:', error);
  }

  // Query from database
  const topUsers = await UserState.find()
    .sort({ maxStreak: -1 })
    .limit(1000) // Cache top 1000
    // .populate('userId', 'username')
    .lean();

  // const leaderboard: LeaderboardEntry[] = topUsers.map((user, index) => ({
  //   userId: user.userId,
  //   username: (user.userId as any).username || 'Anonymous',
  //   streak: user.maxStreak,
  //   rank: index + 1,
  // }));

  const leaderboard: LeaderboardEntry[] = await Promise.all(
  topUsers.map(async (state, index) => {
    const user = await User.findOne({ externalId: state.userId }).lean<{ username: string }>();

    return {
      userId: state.userId,
      username: user?.username || 'Anonymous',
      streak: state.maxStreak,
      rank: index + 1,
    };
  })
);

  // Cache the result
  try {
    await redis.setex(
      cacheKey,
      CACHE_TTL.LEADERBOARD,
      JSON.stringify(leaderboard)
    );
  } catch (error) {
    console.error('Cache set error:', error);
  }

  let currentUserRank: number | undefined;
  if (userId) {
    currentUserRank = await getUserStreakRank(userId);
  }

  return {
    leaderboard: leaderboard.slice(0, limit),
    currentUserRank,
  };
}

/**
 * Get user's rank in score leaderboard
 */
export async function getUserScoreRank(userId: string): Promise<number> {
  const userState = await UserState.findOne({ userId });
  if (!userState) return 0;

  const rank = await UserState.countDocuments({
    totalScore: { $gt: userState.totalScore },
  });

  return rank + 1;
}

/**
 * Get user's rank in streak leaderboard
 */
export async function getUserStreakRank(userId: string): Promise<number> {
  const userState = await UserState.findOne({ userId });
  if (!userState) return 0;

  const rank = await UserState.countDocuments({
    maxStreak: { $gt: userState.maxStreak },
  });

  return rank + 1;
}