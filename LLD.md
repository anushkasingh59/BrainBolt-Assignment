# Low-Level Design (LLD) - BrainBolt

## 1. System Architecture

### 1.1 Technology Stack
- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose ODM
- **Cache**: Redis
- **Containerization**: Docker + Docker Compose

### 1.2 Architecture Pattern
- **Pattern**: Layered Architecture with Service Layer
- **Layers**:
  1. Presentation Layer (React Components)
  2. API Layer (Next.js API Routes)
  3. Service Layer (Business Logic)
  4. Data Access Layer (Mongoose Models)
  5. Cache Layer (Redis)

## 2. Database Schema

### 2.1 Collections

#### Users Collection
```typescript
{
  _id: ObjectId,
  username: string (unique, indexed),
  createdAt: Date,
  updatedAt: Date
}

Indexes:
- { username: 1 } (unique)
- { createdAt: -1 }
```

#### Questions Collection
```typescript
{
  _id: ObjectId,
  difficulty: Number (1-10, indexed),
  prompt: string,
  choices: string[],
  correctAnswer: Number,
  tags: string[] (indexed),
  createdAt: Date,
  updatedAt: Date
}

Indexes:
- { difficulty: 1 }
- { tags: 1 }
- { difficulty: 1, tags: 1 } (compound)
```

#### UserState Collection
```typescript
{
  _id: ObjectId,
  userId: string (unique, indexed, ref: User),
  currentDifficulty: Number (1-10, default: 5),
  streak: Number (default: 0),
  maxStreak: Number (default: 0),
  totalScore: Number (default: 0),
  lastQuestionId: string | null,
  lastAnswerAt: Date | null,
  stateVersion: Number (default: 1), // Optimistic locking
  confidenceScore: Number (0-1, default: 0.5), // Ping-pong stabilizer
  recentPerformance: Boolean[] (max 5), // Rolling window
  createdAt: Date,
  updatedAt: Date
}

Indexes:
- { userId: 1 } (unique)
- { totalScore: -1 }
- { maxStreak: -1 }
- { lastAnswerAt: -1 }
```

#### AnswerLog Collection
```typescript
{
  _id: ObjectId,
  userId: string (indexed, ref: User),
  questionId: string (indexed, ref: Question),
  difficulty: Number (1-10),
  answer: Number,
  correct: Boolean,
  scoreDelta: Number,
  streakAtAnswer: Number,
  answeredAt: Date (indexed),
  idempotencyKey: string (unique, indexed)
}

Indexes:
- { userId: 1, answeredAt: -1 }
- { questionId: 1 }
- { userId: 1, correct: 1 }
- { difficulty: 1 }
- { idempotencyKey: 1 } (unique)
- { answeredAt: -1 }
```

## 3. API Schema

### 3.1 GET /api/v1/quiz/next

**Request Query Params:**
```typescript
{
  userId: string (required),
  sessionId?: string
}
```

**Response (200 OK):**
```typescript
{
  questionId: string,
  difficulty: number (1-10),
  prompt: string,
  choices: string[],
  sessionId: string,
  stateVersion: number,
  currentScore: number,
  currentStreak: number
}
```

**Error Responses:**
- 400: Missing userId
- 429: Rate limit exceeded
- 500: Internal server error

### 3.2 POST /api/v1/quiz/answer

**Request Body:**
```typescript
{
  userId: string (required),
  sessionId: string (required),
  questionId: string (required),
  answer: number (required),
  stateVersion: number (required),
  answerIdempotencyKey: string (required)
}
```

**Response (200 OK):**
```typescript
{
  correct: boolean,
  newDifficulty: number (1-10),
  newStreak: number,
  scoreDelta: number,
  totalScore: number,
  stateVersion: number,
  leaderboardRankScore: number,
  leaderboardRankStreak: number,
  correctAnswer?: number (only if incorrect)
}
```

**Error Responses:**
- 400: Missing required fields
- 404: Question not found
- 409: State version mismatch (concurrent modification)
- 429: Rate limit exceeded
- 500: Internal server error

### 3.3 GET /api/v1/quiz/metrics

**Request Query Params:**
```typescript
{
  userId: string (required)
}
```

**Response (200 OK):**
```typescript
{
  currentDifficulty: number (1-10),
  streak: number,
  maxStreak: number,
  totalScore: number,
  accuracy: number,
  difficultyHistogram: Record<string, number>,
  recentPerformance: boolean[],
  totalQuestions: number,
  correctAnswers: number
}
```

### 3.4 GET /api/v1/leaderboard/score

**Request Query Params:**
```typescript
{
  limit?: number (default: 100, max: 1000),
  userId?: string
}
```

**Response (200 OK):**
```typescript
{
  leaderboard: Array<{
    userId: string,
    username: string,
    score: number,
    rank: number
  }>,
  currentUserRank?: number
}
```

### 3.5 GET /api/v1/leaderboard/streak

Similar to score leaderboard but with streak data.

## 4. Adaptive Algorithm

### 4.1 Configuration
```typescript
const config = {
  minDifficulty: 1,
  maxDifficulty: 10,
  difficultyIncrement: 1,
  difficultyDecrement: 1,
  streakMultiplierCap: 3.0,
  confidenceThreshold: 0.6,
  rollingWindowSize: 5,
  inactivityDecayMs: 86400000 // 24 hours
}
```

### 4.2 Difficulty Calculation Pseudocode

```
function calculateNextDifficulty(currentState, isCorrect, config):
  // Update recent performance window
  updatedPerformance = currentState.recentPerformance.append(isCorrect).slice(-5)
  
  // Calculate new confidence score (ping-pong stabilizer)
  if isCorrect:
    newConfidence = min(1.0, currentState.confidenceScore + 0.2)
  else:
    newConfidence = max(0.0, currentState.confidenceScore - 0.3)
  
  // Calculate recent accuracy
  recentAccuracy = count(updatedPerformance.filter(true)) / length(updatedPerformance)
  
  // Determine difficulty change
  newDifficulty = currentState.currentDifficulty
  
  if isCorrect:
    // Increase difficulty only if:
    // 1. High confidence (>= 60%)
    // 2. Good recent accuracy (>= 60%)
    // 3. Not at max difficulty
    if newConfidence >= 0.6 AND recentAccuracy >= 0.6 AND currentDifficulty < 10:
      newDifficulty = min(10, currentDifficulty + 1)
  else:
    // Decrease difficulty if:
    // 1. Low confidence (< 40%)
    // 2. Poor recent accuracy (< 40%)
    if newConfidence < 0.4 OR (recentAccuracy < 0.4 AND currentDifficulty > 1):
      newDifficulty = max(1, currentDifficulty - 1)
  
  return clamp(newDifficulty, 1, 10)
```

### 4.3 Score Calculation Pseudocode

```
function calculateScoreDelta(difficulty, streak, isCorrect):
  if NOT isCorrect:
    return 0
  
  baseScore = 100
  difficultyWeight = difficulty / 10  // 0.1 to 1.0
  
  // Streak multiplier: 1 + (streak * 0.1), capped at 3.0
  streakMultiplier = min(1 + (streak * 0.1), 3.0)
  
  score = baseScore * difficultyWeight * streakMultiplier
  return round(score)
```

### 4.4 Ping-Pong Stabilization Mechanisms

1. **Confidence Score** (Primary stabilizer)
   - Tracks performance consistency over time
   - Requires sustained good performance before increasing difficulty
   - Prevents rapid oscillation between difficulty levels

2. **Rolling Window** (Secondary stabilizer)
   - Maintains last 5 answers
   - Requires 60% recent accuracy for difficulty increase
   - Provides trend-based adjustment

3. **Hysteresis** (Tertiary stabilizer)
   - Different thresholds for increase (60%) vs decrease (40%)
   - Creates a "stability band" preventing ping-pong

**Example Prevention:**
```
User alternates correct/incorrect at difficulty 5:

Without stabilization:
Correct -> Diff 6
Wrong -> Diff 5
Correct -> Diff 6
Wrong -> Diff 5  [PING-PONG]

With stabilization:
Correct -> Confidence 0.7, Recent 1/1=100% -> Diff 6
Wrong -> Confidence 0.4, Recent 1/2=50% -> Diff 6 (stays)
Correct -> Confidence 0.6, Recent 2/3=67% -> Diff 6 (stays)
Wrong -> Confidence 0.3, Recent 2/4=50% -> Diff 5 (decrease)
```

## 5. Cache Strategy

### 5.1 Redis Keys and TTLs

```
user_state:{userId}
  - Data: Complete user state object
  - TTL: 300 seconds (5 minutes)
  - Invalidation: On answer submission
  
questions:difficulty:{difficulty}
  - Data: Array of questions for difficulty level
  - TTL: 3600 seconds (1 hour)
  - Invalidation: Manual or on question update
  
leaderboard:score
  - Data: Top 1000 users by score
  - TTL: 10 seconds
  - Invalidation: On any score update
  
leaderboard:streak
  - Data: Top 1000 users by max streak
  - TTL: 10 seconds
  - Invalidation: On any streak update
  
rate_limit:{userId}
  - Data: Sorted set of request timestamps
  - TTL: 60 seconds
  - Purpose: Rate limiting
  
idempotency:{key}
  - Data: Cached response
  - TTL: 300 seconds (5 minutes)
  - Purpose: Prevent duplicate submissions
```

### 5.2 Cache Invalidation Strategy

1. **Write-Through**: On answer submission, update DB then invalidate cache
2. **Lazy Loading**: Fetch from cache, if miss then fetch from DB and cache
3. **Time-Based**: Short TTLs for leaderboards (10s) to ensure freshness
4. **Event-Based**: Invalidate user state on any state change

### 5.3 Cache Miss Handling

```
function getUserState(userId):
  cacheKey = `user_state:${userId}`
  
  // Try cache first
  cached = redis.get(cacheKey)
  if cached:
    return JSON.parse(cached)
  
  // Cache miss - fetch from DB
  userState = db.findOne({ userId })
  
  // Cache for next time
  redis.setex(cacheKey, 300, JSON.stringify(userState))
  
  return userState
```

## 6. Leaderboard Update Strategy

### 6.1 Real-Time Updates

```
function updateLeaderboards(userId):
  // Invalidate cached leaderboards
  redis.del('leaderboard:score')
  redis.del('leaderboard:streak')
  
  // Leaderboards will be rebuilt on next fetch
  // This ensures O(1) invalidation instead of O(n) update
```

### 6.2 Rank Calculation

```
function getUserScoreRank(userId):
  userState = getUserState(userId)
  
  // Count users with higher score
  rank = db.countDocuments({ totalScore: { $gt: userState.totalScore } })
  
  return rank + 1
```

## 7. Concurrency Control

### 7.1 Optimistic Locking

```
function submitAnswer(userId, answer, stateVersion):
  // Attempt update with version check
  result = db.findOneAndUpdate(
    { userId, stateVersion },  // Match current version
    { ...updates, stateVersion: stateVersion + 1 },  // Increment version
    { new: true }
  )
  
  if NOT result:
    throw ConflictError("State version mismatch")
  
  return result
```

### 7.2 Idempotency

```
function checkIdempotency(key, value):
  redisKey = `idempotency:${key}`
  
  // Try to set only if not exists
  result = redis.set(redisKey, JSON.stringify(value), 'EX', 300, 'NX')
  
  if result == 'OK':
    return { isNew: true }
  
  // Key exists - return cached result
  existing = redis.get(redisKey)
  return { isNew: false, existingValue: JSON.parse(existing) }
```

## 8. Rate Limiting

### 8.1 Sliding Window Implementation

```
function checkRateLimit(userId):
  key = `rate_limit:${userId}`
  now = Date.now()
  windowStart = now - 60000  // 1 minute window
  
  // Remove old entries
  redis.zremrangebyscore(key, 0, windowStart)
  
  // Count current requests
  count = redis.zcard(key)
  
  if count >= 100:
    return false  // Rate limited
  
  // Add current request
  redis.zadd(key, now, `${now}`)
  redis.expire(key, 60)
  
  return true  // Allowed
```

## 9. Component Architecture

### 9.1 Component Hierarchy

```
App
├── Layout (SSR)
│   ├── ThemeProvider
│   └── Global Styles
├── Page (Home) (SSR)
│   └── Feature Cards
├── Quiz Page (CSR - Client Component)
│   ├── QuizCard
│   ├── MetricsDisplay
│   └── AnswerOptions
└── Leaderboard Page (CSR - Client Component)
    ├── LeaderboardTabs
    ├── LeaderboardTable
    └── UserRankCard
```

### 9.2 Design System Components

All components use design tokens from `globals.css`:
- Colors: CSS variables (--primary, --secondary, etc.)
- Spacing: --spacing-xs through --spacing-xl
- Typography: --font-xs through --font-3xl
- Shadows: --shadow-sm, --shadow-md, --shadow-lg
- Border Radius: --radius

Components:
- Button: Variants (default, destructive, outline, secondary, ghost, link, success)
- Card: Container with header, content, footer sections
- Badge: Status indicators with variants
- Progress: Animated progress bar

## 10. State Management

### 10.1 Client State
- React useState for component-level state
- localStorage for userId persistence
- No global state management library (keeping it simple)

### 10.2 Server State
- MongoDB for persistent data
- Redis for temporary/cached data
- Optimistic locking for concurrency

## 11. Performance Optimizations

### 11.1 Frontend
- Code splitting with dynamic imports
- SSR for home page (faster initial load)
- CSR for interactive pages (better UX)
- Memoization in complex calculations
- Efficient re-render prevention

### 11.2 Backend
- Database indexes on frequent queries
- Redis caching for hot data
- Connection pooling for MongoDB
- Query optimization with lean()

### 11.3 Network
- Minimal API payloads
- Gzip compression (Next.js default)
- CDN for static assets (Next.js optimizations)

## 12. Error Handling

### 12.1 Client-Side
```typescript
try {
  const response = await fetch('/api/...')
  if (!response.ok) {
    throw new Error('API error')
  }
  const data = await response.json()
} catch (error) {
  // Display user-friendly error message
  setError(error.message)
}
```

### 12.2 Server-Side
```typescript
try {
  await connectDB()
  const result = await service.method()
  return NextResponse.json(result)
} catch (error) {
  console.error('Error:', error)
  return NextResponse.json(
    { error: 'Internal server error', message: error.message },
    { status: 500 }
  )
}
```

## 13. Deployment

### 13.1 Docker Configuration
- Multi-stage Dockerfile for optimized image size
- Docker Compose orchestrates MongoDB, Redis, and App
- Health checks for service dependencies
- Volume persistence for data

### 13.2 Environment Variables
```
MONGODB_URI=mongodb://mongodb:27017/brainbolt
REDIS_URL=redis://redis:6379
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## 14. Security Considerations

1. **No Authentication**: Simplified for demo (uses localStorage userId)
2. **Rate Limiting**: Prevents abuse (100 req/min per user)
3. **Input Validation**: All API inputs validated
4. **Idempotency**: Prevents duplicate submissions
5. **Optimistic Locking**: Prevents race conditions
6. **No Sensitive Data**: Questions and answers are public

## 15. Scalability Considerations

### 15.1 Horizontal Scaling
- Stateless API servers (can add more instances)
- MongoDB replica sets for read scaling
- Redis cluster for cache scaling
- Load balancer for traffic distribution

### 15.2 Vertical Scaling
- Increase MongoDB indexes for faster queries
- More Redis memory for larger cache
- Database sharding by userId for huge datasets

## 16. Monitoring and Observability

### 16.1 Logging
- Console logs for errors and important events
- Request/response logging in API routes
- MongoDB query logging (slow queries)

### 16.2 Metrics (Future Enhancement)
- Request latency
- Cache hit rate
- Database query performance
- Error rates