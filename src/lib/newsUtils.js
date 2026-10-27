import News from '@/models/News';
import { isRecipient } from './taskUtils';

// News addressed to this user that they have not read yet (own posts count as read).
export async function unreadNews(user, select = '_id group targetScope targetArea targetDepot') {
  const docs = await News.find({
    $or: [{ group: null }, { group: user.group }],
    readBy: { $ne: user.id },
    createdBy: { $ne: user.id },
  })
    .select(select)
    .lean();
  return docs.filter((n) => isRecipient(n, user));
}
