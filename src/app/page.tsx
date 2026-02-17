// 'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Brain, Trophy, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 text-gradient">
            BrainBolt
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Challenge yourself with an adaptive quiz that grows with your knowledge.
            Build streaks, climb leaderboards, and prove your expertise!
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Adaptive Difficulty</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Questions adjust to your skill level in real-time with advanced stabilization algorithms
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                <Zap className="w-6 h-6 text-success" />
              </div>
              <CardTitle>Streak Multipliers</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Build your streak to earn bonus points and dominate the leaderboards
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Live Leaderboards</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Compete globally with real-time rankings for score and streak
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/quiz">
            <Button size="lg" className="w-full sm:w-auto">
              Start Quiz
            </Button>
          </Link>
          <Link href="/leaderboard">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              View Leaderboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}