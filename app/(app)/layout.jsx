import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import Shell from '@/components/Shell';

export default async function AppLayout({ children }) {
  const user = await getUser();
  if (!user) redirect('/login');
  return <Shell user={user}>{children}</Shell>;
}
