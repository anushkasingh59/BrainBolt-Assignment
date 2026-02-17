Edge Cases – BrainBolt
1. Adaptive Difficulty

Ping-Pong Oscillation
Difficulty changes only after sustained performance using confidence + rolling accuracy (60% up / 40% down), preventing rapid flips.

Difficulty Bounds (1–10)
Difficulty is clamped between 1 and 10; score and streak continue even at boundaries.

Cold Start
New users start at difficulty 5 with neutral confidence (0.5) and no history.

Perfect / Poor Performance
At extremes, difficulty stabilizes while streak and scoring logic continue normally.

2. Streak System

Wrong Answer Reset
Any incorrect answer immediately resets streak to 0; max streak is preserved.

Inactivity Decay
If inactive for 24+ hours, next correct answer starts streak from 1.

Multiplier Cap
Streak multiplier grows gradually and is capped at 3.0x to prevent score inflation.

3. Scoring

No Negative Scoring
Wrong answers give 0 points; total score never decreases.

Integer Scores
All scores are rounded to integers to avoid floating-point inconsistencies.

Overflow Safety
Even at maximum play volume, scores remain within safe numeric limits.

4. Concurrency & Idempotency

Duplicate Submissions
Idempotency keys ensure answers are processed exactly once.

Concurrent Updates
Optimistic locking via stateVersion prevents streak/score corruption.

5. Leaderboard

Tie Handling
Users with equal scores share the same rank; the next rank is skipped.

Empty Leaderboard
Returns empty list gracefully if no users have played.

Cache Freshness
Leaderboard cache has short TTL and is invalidated on score updates.

6. Question Selection

Immediate Repetition Avoided
The previously served question is excluded from the next selection.

Limited Question Pool
If only one question exists at a level, repetition is allowed as fallback.