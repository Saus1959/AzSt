export const POSITIONS = ['leadership', 'electronics', 'mechanics', 'programming'];
export const TITLES = ['Director', 'Captain', 'Coordinator', 'Electronics Engineer', 'Mechanic', '3D Mechanic', 'Programmer'];
export const DEPOS = ['electronics', 'mechanics', 'central']; // 1 depo, 3 sections
export const STATUSES = ['ok', 'low', 'out', 'in_use', 'broken'];
export const LABEL = { leadership: 'Leadership', electronics: 'Electronics', mechanics: 'Mechanics', programming: 'Programming', central: 'Central' };

export const isLeader = (u) => u.position === 'leadership';
// area: 'all' | position | 'central'. Leadership sees everything; others see 'all' and their own area.
// ('central' never equals a position, so only Leadership can see it)
export const canSee = (u, area) => area === 'all' || isLeader(u) || u.position === area;
