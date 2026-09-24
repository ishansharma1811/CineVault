const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await db.auth.me();
    if (!user) return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const { showId, seatIds } = body;
    if (!showId || !Array.isArray(seatIds))
      return Response.json({ success: false, message: 'showId and seatIds are required' }, { status: 400 });

    for (const seatId of seatIds) {
      await db.entities.Seat.updateMany(
        { showId, seatId, status: 'HELD', heldBy: user.id },
        { $set: { status: 'AVAILABLE', heldBy: null, expiresAt: null } }
      );
    }
    return Response.json({ success: true, released: seatIds });
  } catch (error) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}