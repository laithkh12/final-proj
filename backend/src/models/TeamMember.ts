import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ITeamMember extends Document {
  name: string;
  email: string;
  role: string;
  avatar: string;
  workspace: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const teamMemberSchema = new Schema<ITeamMember>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    role: { type: String, default: '', maxlength: 100 },
    avatar: { type: String, default: '' },
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
  },
  {
    timestamps: true,
    collection: 'team_members',
  }
);

teamMemberSchema.index({ workspace: 1, email: 1 }, { unique: true });

export const TeamMember = mongoose.model<ITeamMember>('TeamMember', teamMemberSchema);
