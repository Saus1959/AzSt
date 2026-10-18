'use client';
import Link from 'next/link';
import { POSITIONS, LABEL } from '@/lib/constants';
import { Card, Avatar, inputCls } from './ui';

export default function MemberCard({ u, onMove }) {
  return (
    <Card className="flex flex-col gap-3">
      <Link href={`/team/${u.username}`} className="flex items-center gap-3">
        <Avatar name={u.name} />
        <div className="min-w-0">
          <div className="truncate font-medium">{u.name}</div>
          <div className="text-sm text-mute">{u.title}</div>
        </div>
      </Link>
      {onMove && (
        <select className={inputCls} value={u.position} onChange={(e) => onMove(u, e.target.value)}>
          {POSITIONS.map((p) => <option key={p} value={p}>{LABEL[p]}</option>)}
        </select>
      )}
    </Card>
  );
}
