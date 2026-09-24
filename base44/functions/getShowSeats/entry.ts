const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await db.auth.me();
    if (!user) return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const { showId } = body;
    if (!showId) return Response.json({ success: false, message: 'showId is required' }, { status: 400 });

    // Release expired holds
    const now = new Date();
    const heldSeats = await db.entities.Seat.filter({ showId, status: 'HELD' });
    for (const s of heldSeats) {
      if (s.expiresAt && new Date(s.expiresAt) < now) {
        await db.entities.Seat.updateMany(
          { id: s.id, status: 'HELD' },
          { $set: { status: 'AVAILABLE', heldBy: null, expiresAt: null } }
        );
      }
    }

    const seats = await db.entities.Seat.filter({ showId });
    return Response.json({ success: true, seats, currentUserId: user.id, serverTime: now.toISOString() });
  } catch (error) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}