# Edge Cases Documentation - BrainBolt

## 1. Adaptive Algorithm Edge Cases

### 1.1 Ping-Pong Oscillation
**Problem**: User alternates between correct and incorrect answers at the boundary between two difficulty levels, causing rapid oscillation.

**Example**:
```
Without stabilization:
Difficulty 5 -> Correct -> 6 -> Wrong -> 5 -> Correct -> 6 -> Wrong -> 5...

User gets stuck bouncing between 5 and 6 forever.
```

**Solution Implemented**:
- **Confidence Score**: Requires sustained performance (confidence >= 0.6) before increasing difficulty
- **Rolling Window**: Maintains last 5 answers, requires 60% recent accuracy to increase
- **Hysteresis**: Different thresholds for increase (60%) vs decrease (40%)

**Implementation**:
```typescript
// Confidence-based stabilization
if (isCorrect) {
  newConfidence = Math.min(1.0, confidenceScore + 0.2);
} else {
  newConfidence = Math.max(0.0, confidenceScore - 0.3);
}

// Only increase if confidence high enough AND recent performance good
if (newConfidence >= 0.6 && recentAccuracy >= 0.6) {
  increaseDifficulty();
}
```

**Test Case**:
```
User at difficulty 5 with confidence 0.5:
1. Correct -> Confidence 0.7, Recent [T] -> Diff 6 (increased)
2. Wrong -> Confidence 0.4, Recent [T,F] -> Diff 6 (stays, not enough drop)
3. Wrong -> Confidence 0.1, Recent [T,F,F] -> Diff 5 (decreased)
4. Correct -> Confidence 0.3, Recent [T,F,F,T] -> Diff 5 (stays, confidence too low)
5. Correct -> Confidence 0.5, Recent [T,F,F,T,T] -> Diff 5 (stays, confidence < 0.6)
6. Correct -> Confidence 0.7, Recent [F,F,T,T,T] -> Diff 6 (increased, 60% recent)
```

### 1.2 Difficulty Boundaries
**Problem**: User reaches minimum (1) or maximum (10) difficulty.

**Scenarios**:
1. User at difficulty 1 answers incorrectly
2. User at difficulty 10 answers correctly

**Solution**:
```typescript
newDifficulty = Math.max(1, Math.min(10, calculatedDifficulty));
// Clamps difficulty between 1 and 10
```

**Behavior**:
- At difficulty 1: Wrong answers don't decrease further
- At difficulty 10: Correct answers don't increase further
- Score still earned at boundaries
- Streak still continues at boundaries

### 1.3 Initial State (Cold Start)
**Problem**: New user has no performance history.

**Solution**:
- Start at difficulty 5 (middle ground)
- Initial confidence score: 0.5 (neutral)
- Empty recent performance array
- First few questions build the profile quickly

**Implementation**:
```typescript
const initialState = {
  currentDifficulty: 5,
  streak: 0,
  maxStreak: 0,
  totalScore: 0,
  confidenceScore: 0.5,
  recentPerformance: [],
};
```

### 1.4 Perfect Performance
**Problem**: User answers all questions correctly at maximum difficulty.

**Behavior**:
- Difficulty stays at 10
- Streak continues to grow (no cap on streak count)
- Score multiplier capped at 3.0x
- Confidence stays at 1.0
- Recent performance stays at 100%

**No issues**: System handles this gracefully.

### 1.5 Terrible Performance
**Problem**: User answers everything incorrectly at minimum difficulty.

**Behavior**:
- Difficulty stays at 1
- Streak resets to 0 on each wrong answer
- Score earned: 0 (no points for wrong answers)
- Confidence drops to 0.0
- Recent performance stays at 0%

**No issues**: System handles this gracefully.

## 2. Streak System Edge Cases

### 2.1 Streak Decay After Inactivity
**Problem**: User doesn't answer for 24+ hours.

**Solution Implemented**:
```typescript
function shouldDecayStreak(lastAnswerAt: Date | null): boolean {
  if (!lastAnswerAt) return false;
  const timeSinceLastAnswer = Date.now() - lastAnswerAt.getTime();
  return timeSinceLastAnswer > 86400000; // 24 hours
}
```

**Behavior**:
- If user returns after 24+ hours and answers correctly: Streak resets to 1
- If user returns after 24+ hours and answers incorrectly: Streak resets to 0
- User is notified implicitly (sees streak = 1 or 0)

**Test Case**:
```
User has streak 10, last answered 25 hours ago:
- Answers correctly -> Streak becomes 1 (not 11)
- Answers incorrectly -> Streak becomes 0
```

### 2.2 Streak Reset on Wrong Answer
**Problem**: User with high streak answers incorrectly.

**Behavior**:
- Streak immediately resets to 0
- Max streak preserved
- Score multiplier lost for future questions
- No points earned for the wrong answer

**Example**:
```
User at streak 50:
- Wrong answer -> Streak = 0, Max Streak = 50 (preserved)
- Next correct answer -> Streak = 1, Max Streak = 50
```

### 2.3 Streak Multiplier Cap
**Problem**: Unlimited streak multiplier could lead to astronomical scores.

**Solution**:
```typescript
const multiplier = Math.min(1 + streak * 0.1, 3.0);
// Multiplier capped at 3.0x (achieved at streak 20)
```

**Behavior**:
- Streak 0-19: Growing multiplier (1.0x to 2.9x)
- Streak 20+: Fixed multiplier (3.0x)
- Encourages continued play without exponential score inflation

**Score Examples**:
```
Difficulty 10, Streak 0: 100 * 1.0 * 1.0 = 100 points
Difficulty 10, Streak 10: 100 * 1.0 * 2.0 = 200 points
Difficulty 10, Streak 20: 100 * 1.0 * 3.0 = 300 points
Difficulty 10, Streak 100: 100 * 1.0 * 3.0 = 300 points (capped)
```

### 2.4 Max Streak Update
**Problem**: Tracking historical best performance.

**Implementation**:
```typescript
newMaxStreak = Math.max(currentMaxStreak, newStreak);
```

**Behavior**:
- Max streak only increases, never decreases
- Reflects best historical performance
- Used for streak leaderboard

## 3. Scoring Edge Cases

### 3.1 Zero Score Scenarios
**Cases where score = 0**:
1. Wrong answer (regardless of difficulty/streak)
2. Correct answer at difficulty 1 with streak 0: 100 * 0.1 * 1.0 = 10 points (not zero, small score)

**All correct answers earn points**, minimum 10 points at difficulty 1, streak 0.

### 3.2 Score Overflow Protection
**Problem**: Very high scores could overflow integer limits.

**Solution**:
- JavaScript numbers are IEEE 754 doubles (safe up to 2^53 - 1)
- Maximum realistic score per question: 300 points (diff 10, streak 20+)
- Even 1 million questions = 300 million points (well within safe range)
- MongoDB stores as Number (64-bit float)

**No overflow risk** in realistic usage.

### 3.3 Negative Scores
**Problem**: Could wrong answers decrease score?

**Design Decision**: No negative scoring.
- Wrong answers give 0 points (not negative)
- Total score is monotonically increasing
- Encourages continued play without fear of losing progress

### 3.4 Score Rounding
**Problem**: Floating point arithmetic could cause fractional scores.

**Solution**:
```typescript
const score = Math.round(baseScore * difficultyWeight * streakMultiplier);
```

**All scores are integers** to avoid display issues.

## 4. Concurrency Edge Cases

### 4.1 Duplicate Answer Submission
**Problem**: User clicks "Submit" multiple times or network retry submits twice.

**Solution**: Idempotency keys
```typescript
const idempotencyKey = nanoid(); // Unique key per submission attempt

// Backend checks if key already processed
const existing = await AnswerLog.findOne({ idempotencyKey });
if (existing) {
  return cachedResult; // Return previous result, don't process again
}
```

**Behavior**:
- First submission: Processes normally
- Duplicate submissions: Return cached result
- Guarantees: Exactly-once processing
- Cache TTL: 5 minutes

**Test Case**:
```
User submits answer with key "abc123":
1. Request 1: Processes, updates streak, returns result
2. Request 2 (same key): Returns cached result, no state change
3. Request 3 (same key, 6 min later): Key expired, treated as new (but invalid stateVersion will prevent)
```

### 4.2 State Version Mismatch (Optimistic Locking)
**Problem**: Two requests try to update user state simultaneously.

**Scenario**:
```
Initial state: version = 5, streak = 10
Request A: Reads state (v=5), calculates new state (v=6)
Request B: Reads state (v=5), calculates new state (v=6)
Request A: Writes state (v=6) ✓
Request B: Tries to write state (v=6) but version is now 6 ✗
```

**Solution**: Optimistic locking with version check
```typescript
const updated = await UserState.findOneAndUpdate(
  { userId, stateVersion: expectedVersion },
  { ...updates, stateVersion: expectedVersion + 1 },
  { new: true }
);

if (!updated) {
  throw new Error('State version mismatch - concurrent modification detected');
}
```

**User Experience**:
- Request B returns 409 Conflict error
- Client shows error: "Please refresh and try again"
- User refreshes, gets latest state, can submit again

### 4.3 Question Reuse Before Submission
**Problem**: User requests next question before submitting answer to current question.

**Solution**: Track lastQuestionId
- Next question endpoint checks lastQuestionId
- Filters out last question from pool when selecting next
- Prevents immediate repetition

**Edge case within edge case**: What if user only has 1 question at their difficulty?
- System still returns that question (no alternative)
- Better to repeat than fail

## 5. Database Edge Cases

### 5.1 No Questions Available
**Problem**: No questions exist for user's current difficulty level.

**Solution**: Seeded database ensures questions at all levels 1-10.

**Fallback behavior** (if seed failed):
```typescript
const questions = await Question.find({ difficulty });
if (questions.length === 0) {
  throw new Error(`No questions found for difficulty ${difficulty}`);
}
```

**Error**: Returns 500 to client with error message.

### 5.2 Database Connection Failure
**Problem**: MongoDB or Redis unavailable.

**Behavior**:
- MongoDB failure: All requests fail with 500 error
- Redis failure: 
  - Cache operations fail gracefully (logged but continue)
  - Rate limiter fails open (allows requests)
  - Leaderboards fetch from DB directly

**Resilience**: System degrades gracefully, still functions without cache.

### 5.3 Database Migration/Seeding
**Problem**: Empty database on first run.

**Solution**: Seed script
```bash
npm run seed
```

**Docker**: Automatically seeds on container startup via command override.

## 6. Leaderboard Edge Cases

### 6.1 Tied Rankings
**Problem**: Multiple users with same score/streak.

**Solution**: All tied users get same rank, next rank skips.

**Example**:
```
Rank 1: User A (1000 points)
Rank 2: User B (950 points)
Rank 2: User C (950 points)  <- Tied
Rank 4: User D (900 points)  <- Skips rank 3
```

**MongoDB Query**:
```typescript
const rank = await UserState.countDocuments({ 
  totalScore: { $gt: userScore } 
});
return rank + 1;
```

**This naturally handles ties** - all users with same score get same rank.

### 6.2 User Not on Leaderboard
**Problem**: User hasn't started quiz yet or has 0 score.

**Behavior**:
- User still gets a rank (based on users with higher scores)
- Rank could be very high (e.g., 10,000)
- currentUserRank still returned in API

**Display**: Could show "Unranked" if rank > 1000 or score = 0.

### 6.3 Empty Leaderboard
**Problem**: No users have played yet.

**Behavior**:
- Returns empty array
- currentUserRank = null (or 0)
- Frontend shows "No entries yet. Be the first!"

### 6.4 Leaderboard Cache Staleness
**Problem**: Leaderboard cached but user just improved.

**Solution**: Short TTL (10 seconds)
- Updates reflect within 10 seconds
- Balance between freshness and performance
- Acceptable trade-off for live leaderboard

**Invalidation**: Cache invalidated immediately on any score/streak update.

## 7. Client-Side Edge Cases

### 7.1 localStorage Not Available
**Problem**: User in private browsing or localStorage disabled.

**Fallback**:
```typescript
const [userId] = useState(() => {
  try {
    let id = localStorage.getItem('userId');
    if (!id) {
      id = nanoid();
      localStorage.setItem('userId', id);
    }
    return id;
  } catch {
    // localStorage not available
    return nanoid(); // Use session-only ID
  }
});
```

**Behavior**: User gets new ID each session, loses history.

### 7.2 Network Request Failure
**Problem**: API request fails due to network issue.

**Handling**:
```typescript
try {
  const response = await fetch('/api/...');
  if (!response.ok) throw new Error('Request failed');
} catch (error) {
  setError(error.message);
  // Show retry button
}
```

**User sees**: Error message + Retry button.

### 7.3 Slow Network
**Problem**: Request takes long time.

**Handling**:
- Loading states during requests
- Disable submit button while submitting
- Loading spinner shown
- Prevents duplicate submissions

### 7.4 Page Refresh During Quiz
**Problem**: User refreshes page mid-quiz.

**Behavior**:
- userId persisted in localStorage (survives refresh)
- Current question lost (user gets new question)
- Score/streak preserved (in database)
- Acceptable UX trade-off

## 8. Rate Limiting Edge Cases

### 8.1 Redis Failure During Rate Check
**Problem**: Redis unavailable when checking rate limit.

**Solution**: Fail open
```typescript
try {
  const allowed = await rateLimiter.checkLimit(userId);
  return allowed;
} catch (error) {
  console.error('Rate limiter error:', error);
  return true; // Allow request on error
}
```

**Rationale**: Better to allow request than block legitimate user due to infrastructure issue.

### 8.2 Clock Skew
**Problem**: Server clock changes during rate limit window.

**Mitigation**: Use Date.now() consistently, clean up old entries.
- Sorted set automatically handles ordering
- Old entries removed regardless of clock issues

### 8.3 Burst Traffic
**Problem**: User makes 100 requests in 1 second (burst).

**Behavior**:
- First 100 requests: Allowed
- Request 101+ within same minute: Blocked (429)
- After 1 minute: Window slides, requests allowed again

**Sliding window** handles bursts fairly.

## 9. Question Selection Edge Cases

### 9.1 Difficulty Level Has Only One Question
**Problem**: User could get same question repeatedly.

**Mitigation**: Track lastQuestionId
```typescript
const availableQuestions = questions.filter(
  q => q._id !== userState.lastQuestionId
);
```

**But if only 1 question exists**: Returns same question (unavoidable).

**Real system**: Seed data ensures at least 3 questions per difficulty.

### 9.2 All Questions Exhausted
**Problem**: User has seen all questions at their difficulty.

**Current behavior**: Questions can repeat.
- lastQuestionId only prevents immediate repetition
- After answering question A, user can get B, then A again

**Future enhancement**: Track all answered questions, filter out recently answered.

## 10. Data Integrity Edge Cases

### 10.1 Invalid Data in Database
**Problem**: Manual DB edit or migration leaves invalid data.

**Validation**: Mongoose schema validation
```typescript
difficulty: {
  type: Number,
  required: true,
  min: 1,
  max: 10,
}
```

**Protection**: Schema validation prevents invalid writes.

### 10.2 Incorrect correctAnswer Index
**Problem**: Question has correctAnswer = 5 but only 4 choices.

**Prevention**: Validation in seed script
**Runtime**: Would cause incorrect answer checking
**Mitigation**: Test questions thoroughly before deploying

## Summary

All critical edge cases are handled:
✅ Ping-pong oscillation (confidence + rolling window + hysteresis)
✅ Difficulty boundaries (clamping)
✅ Streak decay (inactivity timeout)
✅ Duplicate submissions (idempotency keys)
✅ Concurrent updates (optimistic locking)
✅ Cache failures (graceful degradation)
✅ Network failures (error handling + retry)
✅ Rate limiting (sliding window with fail-open)
✅ Empty states (graceful handling)
✅ Score overflow (mathematically impossible)
✅ Leaderboard ties (natural SQL-like ranking)

The system is robust and handles edge cases gracefully.