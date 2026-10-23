// ── Groups (направления). Each group has its own members, depots and docs. ──
export const GROUPS = [
  { key: 'roket', name: 'Roket A4' },
  { key: 'ika', name: 'İKA (Aselsan)' },
  { key: 'k2k1', name: 'K2/K1' },
  { key: 'aerostat', name: 'AeroStat' },
];
export const GROUP_KEYS = GROUPS.map((g) => g.key);
export const groupName = (key) => GROUPS.find((g) => g.key === key)?.name ?? key;

// ── Areas (positions). Used for sections, docs visibility and default depot access. ──
export const POSITIONS = ['leadership', 'electronics', 'mechanics', 'programming'];

// ── Roles from the roster. A person's role belongs to a membership (user × group). ──
// role → area it belongs to
export const ROLES = {
  'TK Manager': 'leadership',
  'AeroStat Manager': 'leadership',
  Captain: 'leadership',
  'Electronics Engineer': 'electronics',
  'Mechanical Engineer': 'mechanics',
  'Software Engineer': 'programming',
};
export const TITLES = Object.keys(ROLES);

export const DEPOS = ['electronics', 'mechanics', 'programming', 'central']; // 4 depots in every group
export const LABEL = { leadership: 'Leadership', electronics: 'Electronics', mechanics: 'Mechanics', programming: 'Programming', central: 'Central' };

export const isLeader = (u) => u.position === 'leadership';
// Sections and docs: 'all' | position. Leadership sees everything in its group.
export const canSee = (u, area) => area === 'all' || isLeader(u) || u.position === area;

// Depots: leadership sees all three; others see the depot of their own area
// plus any extra depots an admin granted (membership.extraDepots).
export const visibleDepots = (u) =>
  isLeader(u) ? DEPOS : DEPOS.filter((d) => d === u.position || (u.extraDepots || []).includes(d));
export const canSeeDepot = (u, key) => visibleDepots(u).includes(key);

// "At work" status: allowed durations (hours).
export const STATUS_HOURS = [1, 2, 4, 6];
