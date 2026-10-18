import { NextResponse } from 'next/server';
import { route } from '@/lib/api';
import { publicUser } from '@/lib/auth';
import User from '@/models/User';

// Список команды доступен любому авторизованному (без паролей)
export const GET = route(async () => {
  const users = await User.find().sort('name').lean();
  return NextResponse.json({ users: users.map(publicUser) });
});
