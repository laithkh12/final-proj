import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Task, TeamMember, User, Workspace } from '../models';
import { seedDefaultTeamMembers } from '../services/teamMember.service';

dotenv.config();

/**
 * Migrates task assignees from User refs to TeamMember refs.
 * Seeds demo team members, maps by user email when possible, clears the rest.
 */
async function migrateTaskAssignees() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/teamflow';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB\n');

  const workspaces = await Workspace.find();
  for (const workspace of workspaces) {
    await seedDefaultTeamMembers(workspace._id);
  }
  console.log(`Seeded team_members for ${workspaces.length} workspace(s)\n`);

  const tasksWithAssignee = await Task.find({ assignee: { $ne: null } });
  let mapped = 0;
  let cleared = 0;

  for (const task of tasksWithAssignee) {
    const valid = await TeamMember.findOne({
      _id: task.assignee,
      workspace: task.workspace,
    });
    if (valid) continue;

    const user = await User.findById(task.assignee);
    if (user) {
      const teamMember = await TeamMember.findOne({
        workspace: task.workspace,
        email: user.email,
      });
      if (teamMember) {
        task.assignee = teamMember._id;
        await task.save();
        mapped++;
        console.log(`Mapped assignee on task "${task.title}" (${task._id}) → ${teamMember.name}`);
        continue;
      }
    }

    task.assignee = undefined;
    await task.save();
    cleared++;
    console.log(`Cleared invalid assignee on task "${task.title}" (${task._id})`);
  }

  console.log(
    `\nDone. Mapped ${mapped}, cleared ${cleared} of ${tasksWithAssignee.length} assigned task(s).`
  );
  await mongoose.disconnect();
}

migrateTaskAssignees().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
