import mongoose, { Schema, model, models } from 'mongoose';
import { DifficultyLevel } from '@/types/quiz.types';

export interface IQuestion {
  _id: string;
  difficulty: DifficultyLevel;
  prompt: string;
  choices: string[];
  correctAnswer: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>(
  {
    difficulty: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    prompt: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
    },
    choices: {
      type: [String],
      required: true,
      validate: {
        validator: (v: string[]) => v.length >= 2 && v.length <= 6,
        message: 'Must have between 2 and 6 choices',
      },
    },
    correctAnswer: {
      type: Number,
      required: true,
      min: 0,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
QuestionSchema.index({ difficulty: 1 });
QuestionSchema.index({ tags: 1 });
QuestionSchema.index({ difficulty: 1, tags: 1 });

export const Question =
  models.Question || model<IQuestion>('Question', QuestionSchema);