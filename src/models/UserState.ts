import mongoose, { Schema, model, models } from 'mongoose';
import { DifficultyLevel } from '@/types/quiz.types';

export interface IUserState {
  _id: string;
  userId: string;
  currentDifficulty: DifficultyLevel;
  streak: number;
  maxStreak: number;
  totalScore: number;
  lastQuestionId: string | null;
  lastAnswerAt: Date | null;
  stateVersion: number;
  confidenceScore: number;
  recentPerformance: boolean[];
  createdAt: Date;
  updatedAt: Date;
}

const UserStateSchema = new Schema<IUserState>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    //   ref: 'User',
    },
    currentDifficulty: {
      type: Number,
      required: true,
      default: 5,
      min: 1,
      max: 10,
    },
    streak: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    maxStreak: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    totalScore: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    lastQuestionId: {
      type: String,
      default: null,
    },
    lastAnswerAt: {
      type: Date,
      default: null,
    },
    stateVersion: {
      type: Number,
      required: true,
      default: 1,
    },
    confidenceScore: {
      type: Number,
      required: true,
      default: 0.5,
      min: 0,
      max: 1,
    },
    recentPerformance: {
      type: [Boolean],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
UserStateSchema.index({ userId: 1 }, { unique: true });
UserStateSchema.index({ totalScore: -1 });
UserStateSchema.index({ maxStreak: -1 });
UserStateSchema.index({ lastAnswerAt: -1 });

export const UserState =
  models.UserState || model<IUserState>('UserState', UserStateSchema);