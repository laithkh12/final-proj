import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IProject extends Document {
  name: string;
  description: string;
  workspace: Types.ObjectId;
  createdBy: Types.ObjectId;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: '', maxlength: 1000 },
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    color: { type: String, default: '#6366f1' },
  },
  { timestamps: true }
);

export const Project = mongoose.model<IProject>('Project', projectSchema);
