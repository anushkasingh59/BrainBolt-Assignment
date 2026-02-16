import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with proper precedence
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a random username
 */
export function generateUsername(): string {
  const adjectives = [
    'Quick',
    'Bright',
    'Smart',
    'Clever',
    'Swift',
    'Sharp',
    'Wise',
    'Bold',
  ];
  const nouns = [
    'Fox',
    'Eagle',
    'Hawk',
    'Lion',
    'Tiger',
    'Wolf',
    'Bear',
    'Owl',
  ];

  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 1000);

  return `${adj}${noun}${num}`;
}

/**
 * Calculate accuracy percentage
 */
export function calculateAccuracy(
  correctAnswers: number,
  totalQuestions: number
): number {
  if (totalQuestions === 0) return 0;
  return Math.round((correctAnswers / totalQuestions) * 100 * 100) / 100;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Format large numbers with K, M suffixes
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * Sleep for a specified duration (useful for testing)
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if a date is considered "stale" based on inactivity threshold
 */
export function isStale(
  date: Date | null,
  inactivityThresholdMs: number
): boolean {
  if (!date) return false;
  const now = new Date();
  return now.getTime() - date.getTime() > inactivityThresholdMs;
}