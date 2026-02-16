import mongoose, { Schema, model, models } from 'mongoose';
import { DifficultyLevel } from '@/types/quiz.types';

export interface IAnswerLog {
  _id: string;
  userId: string;
  questionId: string;
  difficulty: DifficultyLevel;
  answer: number;
  correct: boolean;
  scoreDelta: number;
  streakAtAnswer: number;
  answeredAt: Date;
  idempotencyKey: string;
}

const AnswerLogSchema = new Schema<IAnswerLog>(
  {
    userId: {
      type: String,
      required: true,
      ref: 'User',
    },
    questionId: {
      type: String,
      required: true,
      ref: 'Question',
    },
    difficulty: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    answer: {
      type: Number,
      required: true,
      min: 0,
    },
    correct: {
      type: Boolean,
      required: true,
    },
    scoreDelta: {
      type: Number,
      required: true,
      default: 0,
    },
    streakAtAnswer: {
      type: Number,
      required: true,
      default: 0,
    },
    answeredAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: false,
  }
);

// Indexes for efficient querying and analytics
AnswerLogSchema.index({ userId: 1, answeredAt: -1 });
AnswerLogSchema.index({ questionId: 1 });
AnswerLogSchema.index({ userId: 1, correct: 1 });
AnswerLogSchema.index({ difficulty: 1 });
AnswerLogSchema.index({ idempotencyKey: 1 }, { unique: true });
AnswerLogSchema.index({ answeredAt: -1 });

export const AnswerLog =
  models.AnswerLog || model<IAnswerLog>('AnswerLog', AnswerLogSchema);