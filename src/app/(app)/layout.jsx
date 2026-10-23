import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import Shell from '@/components/Shell';

export default async function AppLayout({ children }) {
  const user = await getUser();
  if (!user) redirect('/login');
  if (!user.group) redirect('/groups'); // no group chosen (or access to it was removed)
  return <Shell user={user}>{children}</Shell>;
}
