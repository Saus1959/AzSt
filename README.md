# AzSt — Team Dashboard

Four groups (directions): **Roket A4**, **İKA (Aselsan)**, **K2/K1**, **AeroStat**.
After login you choose a group; only the groups you belong to are open. Inside a group you see
that group's team, docs and three depots (Electronics, Mechanics, Central).

```
npm install
cp .env.example .env.local      # fill MONGODB_URI and JWT_SECRET
npm run migrate                 # ONLY for an existing database (moves old depots/docs into Roket A4)
npm run seed                    # accounts + group places from the roster; prints new passwords once
npm run dev                     # http://localhost:3000
```

## How access works
- A person's **role belongs to a group** (membership): Kamran can be TK Manager in one group and Electronics Engineer in another.
- Default depot access: TK Manager / AeroStat Manager / Captain → all three depots of the group; Electronics Engineer → Electronics; Mechanical Engineer → Mechanics; Software Engineer → none.
- The admin can grant **extra depots** to any member and manage places on **Admin → Groups and access**.
- `npc` places are vacancies: assign a real user to them later (edit the place).
- The admin (director) can enter every group.

## Depots
Headers of every column (including Stock / Seriya / Name / Position / Active-passive) can be renamed by clicking them.
Changes are saved per row, so two people editing different rows do not overwrite each other.

Deploy: Vercel + MongoDB Atlas. Add the same env vars in Vercel. Never commit `.env.local` or passwords.
