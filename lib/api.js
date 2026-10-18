import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getUser } from './auth';
import { isLeader } from './constants';

export const fail = (message, status = 400) => NextResponse.json({ error: message }, { status });
export const body = async (req) => { try { return await req.json(); } catch { return {}; } };
export const pick = (o, keys) => Object.fromEntries(keys.filter((k) => o[k] !== undefined).map((k) => [k, o[k]]));
export const validId = (id) => mongoose.isValidObjectId(id);

// Фильтры видимости для Mongo
export const docFilter = (u) => (isLeader(u) ? {} : { department: { $in: ['all', u.position] } });
export const depoFilter = (u) => (isLeader(u) ? {} : { depo: u.position }); // programming → ничего

export function route(fn, { admin } = {}) {
  return async (req, ctx) => {
    try {
      const user = await getUser();
      if (!user) return fail('Unauthorized', 401);
      if (admin && !user.isAdmin) return fail('Forbidden', 403);
      const params = ctx?.params ? await ctx.params : {};
      return await fn(req, { user, params });
    } catch (e) {
      if (e.name === 'ValidationError') return fail(e.message, 400);
      if (e.code === 11000) return fail('Already exists', 409);
      console.error(e);
      return fail('Server error', 500);
    }
  };
}
