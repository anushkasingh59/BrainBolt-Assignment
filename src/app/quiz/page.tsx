'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Trophy, Flame, ArrowLeft, Home } from 'lucide-react';
import { nanoid } from 'nanoid';
import Link from 'next/link';

interface QuestionData {
  questionId: string;
  difficulty: number;
  prompt: string;
  choices: string[];
  sessionId: string;
  stateVersion: number;
  currentScore: number;
  currentStreak: number;
}

export default function QuizPage() {
  const router = useRouter();
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

  const [question, setQuestion] = useState<QuestionData | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [scoreDelta, setScoreDelta] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNextQuestion = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(
        `/api/v1/quiz/next?userId=${userId}${question?.sessionId ? `&sessionId=${question.sessionId}` : ''}`
      );

      if (!res.ok) {
        throw new Error('Failed to fetch question');
      }

      const data = await res.json();
      setQuestion(data);
      setSelectedAnswer(null);
      setShowResult(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNextQuestion();
  }, []);

  const handleSubmit = async () => {
    if (selectedAnswer === null || !question) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/quiz/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          sessionId: question.sessionId,
          questionId: question.questionId,
          answer: selectedAnswer,
          stateVersion: question.stateVersion,
          answerIdempotencyKey: nanoid(),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to submit answer');
      }

      const data = await res.json();
      setIsCorrect(data.correct);
      setScoreDelta(data.scoreDelta);
      setShowResult(true);

      // Update current score and streak
      setQuestion((prev) =>
        prev
          ? {
              ...prev,
              currentScore: data.totalScore,
              currentStreak: data.newStreak,
            }
          : null
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    fetchNextQuestion();
  };

  if (loading && !question) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading question...</p>
        </div>
      </div>
    );
  }

  if (error && !question) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <div className="flex gap-2">
              <Button onClick={fetchNextQuestion}>Retry</Button>
              <Link href="/">
                <Button variant="outline">Go Home</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!question) return null;

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

          <div className="flex gap-4">
            <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-lg shadow-sm">
              <Trophy className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Score</p>
                <p className="text-lg font-bold">{question.currentScore}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-lg shadow-sm">
              <Flame className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-xs text-muted-foreground">Streak</p>
                <p className="text-lg font-bold">{question.currentStreak}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Quiz Card */}
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <div className="flex justify-between items-start mb-4">
              <Badge variant={question.difficulty >= 7 ? 'destructive' : question.difficulty >= 4 ? 'default' : 'secondary'}>
                Difficulty: {question.difficulty}/10
              </Badge>
              <Link href="/leaderboard">
                <Button variant="ghost" size="sm">
                  <Trophy className="w-4 h-4 mr-2" />
                  Leaderboard
                </Button>
              </Link>
            </div>
            <CardTitle className="text-2xl">{question.prompt}</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="space-y-3 mb-6">
              {question.choices.map((choice, index) => (
                <button
                  key={index}
                  onClick={() => !showResult && setSelectedAnswer(index)}
                  disabled={showResult || isSubmitting}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedAnswer === index
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50 hover:bg-accent'
                  } ${showResult ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                >
                  <span className="font-medium">
                    {String.fromCharCode(65 + index)}. {choice}
                  </span>
                </button>
              ))}
            </div>

            {showResult && (
              <div
                className={`p-4 rounded-lg mb-4 ${
                  isCorrect ? 'bg-success/10 border border-success' : 'bg-destructive/10 border border-destructive'
                }`}
              >
                <p className={`font-semibold ${isCorrect ? 'text-success' : 'text-destructive'}`}>
                  {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                </p>
                {isCorrect && scoreDelta > 0 && (
                  <p className="text-sm text-muted-foreground">You earned {scoreDelta} points!</p>
                )}
              </div>
            )}

            {error && (
              <div className="p-4 rounded-lg mb-4 bg-destructive/10 border border-destructive">
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}

            {!showResult ? (
              <Button
                onClick={handleSubmit}
                disabled={selectedAnswer === null || isSubmitting}
                className="w-full"
                size="lg"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Answer'}
              </Button>
            ) : (
              <Button onClick={handleNext} className="w-full" size="lg">
                Next Question
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}