'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Trophy, Flame, Home, RefreshCw } from 'lucide-react';
import { nanoid } from 'nanoid';

interface LeaderboardEntry {
  userId: string;
  username: string;
  score?: number;
  streak?: number;
  rank: number;
}

type LeaderboardType = 'score' | 'streak';

export default function LeaderboardPage() {
  const [userId] = useState(() => {
    if (typeof window !== 'undefined') {
      let id = localStorage.getItem('userId');
      if (!id) {
        id = nanoid();
        localStorage.setItem('userId', id);
      }
      return id;
    }
    return nanoid();
  });

  const [type, setType] = useState<LeaderboardType>('score');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      setError(null);

      const endpoint = type === 'score' ? 'score' : 'streak';
      const res = await fetch(`/api/v1/leaderboard/${endpoint}?limit=100&userId=${userId}`);

      if (!res.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      const data = await res.json();
      setLeaderboard(data.leaderboard);
      setCurrentUserRank(data.currentUserRank || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  // Initial fetch
  fetchLeaderboard(true);

  // Poll every 9 seconds
  const interval = setInterval(() => {
    fetchLeaderboard();
  }, 9000);

  return () => clearInterval(interval);
}, [type]);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { emoji: '🥇', variant: 'default' as const };
    if (rank === 2) return { emoji: '🥈', variant: 'secondary' as const };
    if (rank === 3) return { emoji: '🥉', variant: 'outline' as const };
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </Link>

          <Link href="/quiz">
            <Button size="sm">
              Start Quiz
            </Button>
          </Link>
        </div>

        {/* Title and Tabs */}
        <div className="max-w-4xl mx-auto mb-8">
          <h1 className="text-4xl font-bold mb-6 text-center text-gradient">
            Leaderboard
          </h1>

          <div className="flex gap-2 justify-center mb-6">
            <Button
              variant={type === 'score' ? 'default' : 'outline'}
              onClick={() => setType('score')}
              className="flex items-center gap-2"
            >
              <Trophy className="w-4 h-4" />
              Top Scores
            </Button>
            <Button
              variant={type === 'streak' ? 'default' : 'outline'}
              onClick={() => setType('streak')}
              className="flex items-center gap-2"
            >
              <Flame className="w-4 h-4" />
              Top Streaks
            </Button>
          </div>

          {currentUserRank && (
            <Card className="mb-4 bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <p className="text-center text-sm">
                  Your Rank: <span className="font-bold text-lg">#{currentUserRank}</span>
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Leaderboard */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                {type === 'score' ? 'Highest Scores' : 'Longest Streaks'}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchLeaderboard(true)}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {loading && leaderboard.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading leaderboard...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={() => fetchLeaderboard(true)}>Retry</Button>
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No entries yet. Be the first!</p>
                <Link href="/quiz">
                  <Button className="mt-4">Start Quiz</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((entry) => {
                  const rankBadge = getRankBadge(entry.rank);
                  const isCurrentUser = entry.userId === userId;

                  return (
                    <div
                      key={entry.userId}
                      className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                        isCurrentUser ? 'bg-primary/10 border-primary' : 'bg-card border-border hover:bg-accent'
                      }`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 text-center">
                          {rankBadge ? (
                            <span className="text-2xl">{rankBadge.emoji}</span>
                          ) : (
                            <span className="text-lg font-semibold text-muted-foreground">
                              #{entry.rank}
                            </span>
                          )}
                        </div>

                        <div className="flex-1">
                          <p className="font-semibold">
                            {entry.username}
                            {isCurrentUser && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                You
                              </Badge>
                            )}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">
                            {type === 'score' ? entry.score?.toLocaleString() : entry.streak}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {type === 'score' ? 'points' : 'streak'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}