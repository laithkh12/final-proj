import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { TeamMember, Workspace } from '../models';
import { seedDefaultTeamMembers } from '../services/teamMember.service';

dotenv.config();

async function seedTeamMembers() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/teamflow';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB\n');

  const workspaces = await Workspace.find();
  if (!workspaces.length) {
    console.log('No workspaces found. Create a workspace first, then run this script again.');
    await mongoose.disconnect();
    return;
  }

  console.log(`Seeding team_members for ${workspaces.length} workspace(s)...\n`);

  for (const workspace of workspaces) {
    const before = await TeamMember.countDocuments({ workspace: workspace._id });
    await seedDefaultTeamMembers(workspace._id);
    const after = await TeamMember.countDocuments({ workspace: workspace._id });
    console.log(`"${workspace.name}": ${after} team member(s) (${after - before} added)`);
  }

  const total = await TeamMember.countDocuments();
  console.log(`\nDone! ${total} document(s) in team_members.`);

  await mongoose.disconnect();
}

seedTeamMembers().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
