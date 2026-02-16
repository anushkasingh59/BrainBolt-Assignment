import { redis, CACHE_KEYS, CACHE_TTL } from './redis';

/**
 * Rate limiter using Redis with sliding window
 */
export class RateLimiter {
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Check if a request should be rate limited
   * @param identifier - Unique identifier (userId, IP, etc.)
   * @returns true if allowed, false if rate limited
   */
  async checkLimit(identifier: string): Promise<boolean> {
    const key = `${CACHE_KEYS.RATE_LIMIT}${identifier}`;
    const now = Date.now();
    const windowStart = now - this.windowMs;

    try {
      // Use Redis sorted set for sliding window
      const multi = redis.multi();

      // Remove old entries outside the window
      multi.zremrangebyscore(key, 0, windowStart);

      // Count requests in current window
      multi.zcard(key);

      // Add current request
      multi.zadd(key, now, `${now}`);

      // Set expiry
      multi.expire(key, Math.ceil(this.windowMs / 1000));

      const results = await multi.exec();

      if (!results) {
        // If Redis fails, allow the request (fail open)
        console.error('Rate limiter Redis error');
        return true;
      }

      // Get count from ZCARD result
      const count = results[1][1] as number;

      return count < this.maxRequests;
    } catch (error) {
      console.error('Rate limiter error:', error);
      // Fail open - allow request if rate limiter fails
      return true;
    }
  }

  /**
   * Get remaining requests for an identifier
   */
  async getRemainingRequests(identifier: string): Promise<number> {
    const key = `${CACHE_KEYS.RATE_LIMIT}${identifier}`;
    const now = Date.now();
    const windowStart = now - this.windowMs;

    try {
      await redis.zremrangebyscore(key, 0, windowStart);
      const count = await redis.zcard(key);
      return Math.max(0, this.maxRequests - count);
    } catch (error) {
      console.error('Get remaining requests error:', error);
      return this.maxRequests;
    }
  }

  /**
   * Reset rate limit for an identifier
   */
  async reset(identifier: string): Promise<void> {
    const key = `${CACHE_KEYS.RATE_LIMIT}${identifier}`;
    try {
      await redis.del(key);
    } catch (error) {
      console.error('Reset rate limit error:', error);
    }
  }
}

// Default rate limiter instance
export const rateLimiter = new RateLimiter(
  parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000')
);

/**
 * Check idempotency key to prevent duplicate operations
 */
export async function checkIdempotency(
  key: string,
  value: any,
  ttlSeconds: number = CACHE_TTL.IDEMPOTENCY
): Promise<{ isNew: boolean; existingValue?: any }> {
  const redisKey = `${CACHE_KEYS.IDEMPOTENCY}${key}`;

  try {
    // Try to set the key only if it doesn't exist
    const result = await redis.set(
      redisKey,
      JSON.stringify(value),
      'EX',
      ttlSeconds,
      'NX'
    );

    if (result === 'OK') {
      return { isNew: true };
    }

    // Key already exists, get the existing value
    const existingValue = await redis.get(redisKey);
    return {
      isNew: false,
      existingValue: existingValue ? JSON.parse(existingValue) : null,
    };
  } catch (error) {
    console.error('Idempotency check error:', error);
    // On error, assume it's new to allow operation
    return { isNew: true };
  }
}