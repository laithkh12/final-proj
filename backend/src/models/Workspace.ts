import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IWorkspace extends Document {
  name: string;
  description: string;
  slug: string;
  owner: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const workspaceSchema = new Schema<IWorkspace>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: '', maxlength: 500 },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);

export const Workspace = mongoose.model<IWorkspace>('Workspace', workspaceSchema);
