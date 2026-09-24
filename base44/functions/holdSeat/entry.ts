const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { HOLD_DURATION_MS } from '../../shared/cinema.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await db.auth.me();
    if (!user) return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const { showId, seatIds } = body;
    if (!showId || !Array.isArray(seatIds) || seatIds.length === 0)
      return Response.json({ success: false, message: 'showId and seatIds are required' }, { status: 400 });

    const now = new Date();
    const expiresAt = new Date(now.getTime() + HOLD_DURATION_MS).toISOString();
    const held = [];
    const failed = [];

    // Release expired holds on this show first (best-effort cleanup)
    try {
      const heldSeats = await db.entities.Seat.filter({ showId, status: 'HELD' });
      for (const s of heldSeats) {
        if (s.expiresAt && new Date(s.expiresAt) < now) {
          await db.entities.Seat.updateMany(
            { id: s.id, status: 'HELD' },
            { $set: { status: 'AVAILABLE', heldBy: null, expiresAt: null } }
          );
        }
      }
    } catch (e) { /* ignore cleanup errors */ }

    for (const seatId of seatIds) {
      // Atomic conditional update: only AVAILABLE -> HELD
      await db.entities.Seat.updateMany(
        { showId, seatId, status: 'AVAILABLE' },
        { $set: { status: 'HELD', heldBy: user.id, expiresAt } }
      );
      // Refresh expiry for seats already held by this same user
      await db.entities.Seat.updateMany(
        { showId, seatId, status: 'HELD', heldBy: user.id },
        { $set: { expiresAt } }
      );
      const seats = await db.entities.Seat.filter({ showId, seatId });
      const seat = seats[0];
      if (seat && seat.status === 'HELD' && seat.heldBy === user.id) {
        held.push(seatId);
      } else {
        failed.push({ seatId, status: seat ? seat.status : 'NOT_FOUND' });
      }
    }

    if (failed.length > 0) {
      // Roll back any seats we did hold in this request
      for (const seatId of held) {
        await db.entities.Seat.updateMany(
          { showId, seatId, status: 'HELD', heldBy: user.id },
          { $set: { status: 'AVAILABLE', heldBy: null, expiresAt: null } }
        );
      }
      return Response.json({
        success: false,
        message: 'Seat is no longer available.',
        failed
      }, { status: 409 });
    }
    return Response.json({ success: true, held, expiresAt });
  } catch (error) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}