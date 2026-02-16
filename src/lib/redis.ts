import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

/**
 * Redis client singleton with automatic reconnection
 */
class RedisClient {
  private static instance: Redis | null = null;

  static getInstance(): Redis {
    if (!RedisClient.instance) {
      RedisClient.instance = new Redis(REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        reconnectOnError: (err) => {
          const targetError = 'READONLY';
          if (err.message.includes(targetError)) {
            return true;
          }
          return false;
        },
      });

      RedisClient.instance.on('connect', () => {
        console.log('✅ Redis connected successfully');
      });

      RedisClient.instance.on('error', (err) => {
        console.error('❌ Redis connection error:', err);
      });
    }

    return RedisClient.instance;
  }

  static async disconnect(): Promise<void> {
    if (RedisClient.instance) {
      await RedisClient.instance.quit();
      RedisClient.instance = null;
    }
  }
}

export const redis = RedisClient.getInstance();

// Cache key prefixes
export const CACHE_KEYS = {
  USER_STATE: 'user_state:',
  QUESTIONS_BY_DIFFICULTY: 'questions:difficulty:',
  LEADERBOARD_SCORE: 'leaderboard:score',
  LEADERBOARD_STREAK: 'leaderboard:streak',
  RATE_LIMIT: 'rate_limit:',
  IDEMPOTENCY: 'idempotency:',
};

// Cache TTL values (in seconds)
export const CACHE_TTL = {
  USER_STATE: 300, // 5 minutes
  QUESTIONS: 3600, // 1 hour
  LEADERBOARD: 10, // 10 seconds
  RATE_LIMIT: 60, // 1 minute
  IDEMPOTENCY: 300, // 5 minutes
};