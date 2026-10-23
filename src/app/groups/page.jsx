import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { groupAccess } from '@/lib/groups';
import GroupPicker from '@/components/GroupPicker';

export const metadata = { title: 'AzSt' };
export const dynamic = 'force-dynamic';

export default async function GroupsPage() {
  const user = await getUser();
  if (!user) redirect('/login');
  const groups = await groupAccess(user);
  return <GroupPicker user={user} groups={groups} />;
}
