import type { MemberRole } from '@/types';

export function canRemoveMember(actorRole: MemberRole, targetRole: MemberRole): boolean {
  if (targetRole === 'owner') return false;
  if (actorRole === 'owner') return true;
  if (actorRole === 'admin' && targetRole === 'member') return true;
  return false;
}
