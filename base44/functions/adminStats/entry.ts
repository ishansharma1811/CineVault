const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await db.auth.me();
    if (!user || user.role !== 'admin')
      return Response.json({ success: false, message: 'Admin access required' }, { status: 403 });

    const [users, movies, theatres, shows, bookings] = await Promise.all([
      db.entities.User.list(),
      db.entities.Movie.list(),
      db.entities.Theatre.list(),
      db.entities.Show.list(),
      db.entities.Booking.list()
    ]);
    const today = new Date().toISOString().slice(0, 10);
    const todays = bookings.filter(b => b.created_date && b.created_date.slice(0, 10) === today);
    const revenue = bookings.filter(b => b.bookingStatus === 'CONFIRMED').reduce((s, b) => s + (b.amount || 0), 0);
    return Response.json({
      success: true,
      stats: {
        totalUsers: users.length,
        totalMovies: movies.length,
        totalTheatres: theatres.length,
        totalShows: shows.length,
        totalBookings: bookings.length,
        todaysBookings: todays.length,
        revenue
      }
    });
  } catch (error) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}