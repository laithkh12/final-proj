import mongoose, { Document, Schema, Types } from 'mongoose';
import { TASK_PRIORITIES, TASK_STATUSES } from '../constants';
import { TaskPriority, TaskStatus } from '../types';

export interface ITask extends Document {
  title: string;
  description: string;
  project: Types.ObjectId;
  workspace: Types.ObjectId;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: Types.ObjectId;
  createdBy: Types.ObjectId;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: '', maxlength: 5000 },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    status: { type: String, enum: TASK_STATUSES, default: 'Todo', index: true },
    priority: { type: String, enum: TASK_PRIORITIES, default: 'Medium' },
    assignee: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    dueDate: { type: Date },
  },
  { timestamps: true }
);

taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ title: 'text', description: 'text' });

export const Task = mongoose.model<ITask>('Task', taskSchema);
