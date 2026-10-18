# Team Dashboard

```bash
npm install
cp .env.example .env.local      # fill MONGODB_URI and JWT_SECRET
npm run seed                    # creates 15 users + demo data (safe to re-run)
npm run dev                     # http://localhost:3000
```
Passwords for everyone: `PASSWORDS.md` (delete it after handing them out).
Director can change positions on the **Team** page and reset passwords on a member's profile.
Deploy: Vercel + MongoDB Atlas. Add the same env vars in Vercel.
