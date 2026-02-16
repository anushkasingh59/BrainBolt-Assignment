// import mongoose, { Schema, model, models } from 'mongoose';
import { Schema, model, models, Types } from 'mongoose';

export interface IUser {
  _id: Types.ObjectId;
  externalId: string;
  username: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    externalId: {
      type: String,
      required: true,
      unique: true,
  },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
UserSchema.index({ username: 1 }, { unique: true });
UserSchema.index({ createdAt: -1 });

export const User = models.User || model<IUser>('User', UserSchema);