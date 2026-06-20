import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Task, TeamMember } from '../models';

dotenv.config();

/**
 * Clears task assignees that are not valid team_members in the same workspace.
 * Run once after changing Task.assignee ref from User to TeamMember.
 */
async function migrateTaskAssignees() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/teamflow';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB\n');

  const tasksWithAssignee = await Task.find({ assignee: { $ne: null } });
  let cleared = 0;

  for (const task of tasksWithAssignee) {
    const valid = await TeamMember.findOne({
      _id: task.assignee,
      workspace: task.workspace,
    });
    if (!valid) {
      task.assignee = undefined;
      await task.save();
      cleared++;
      console.log(`Cleared invalid assignee on task "${task.title}" (${task._id})`);
    }
  }

  console.log(`\nDone. Cleared ${cleared} of ${tasksWithAssignee.length} assigned task(s).`);
  await mongoose.disconnect();
}

migrateTaskAssignees().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
