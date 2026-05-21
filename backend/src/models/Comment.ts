import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IComment extends Document {
  content: string;
  task: Types.ObjectId;
  author: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    content: { type: String, required: true, trim: true, maxlength: 2000 },
    task: { type: Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Comment = mongoose.model<IComment>('Comment', commentSchema);
