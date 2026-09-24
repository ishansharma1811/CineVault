const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Calendar } from 'lucide-react';

import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';

export default function MyBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState(null);
  const [tab, setTab] = useState('upcoming');

  useEffect(() => {
    (async () => {
      try {
        const b = await db.entities.Booking.filter({ userId: user.id }, '-created_date');
        setBookings(b);
      } catch (e) { setBookings([]); }
    })();
  }, [user]);

  const grouped = useMemo(() => {
    const now = new Date().toISOString().slice(0, 10);
    return {
      upcoming: (bookings || []).filter(b => b.bookingStatus === 'CONFIRMED' && b.showDate >= now),
      past: (bookings || []).filter(b => b.bookingStatus === 'CONFIRMED' && b.showDate < now),
      cancelled: (bookings || []).filter(b => b.bookingStatus === 'CANCELLED')
    };
  }, [bookings]);

  const list = grouped[tab] || [];

  if (bookings === null) return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-8 h-8 border-4 border-white/20 border-t-red-600 rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">My Bookings</h1>
      <div className="flex gap-2 mb-6">
        {[['upcoming', 'Upcoming'], ['past', 'Past'], ['cancelled', 'Cancelled']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 rounded-full text-sm transition ${tab === k ? 'bg-red-600 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}>{l}</button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="text-center py-16">
          <Ticket className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/50">No {tab} bookings.</p>
          <Link to="/"><Button className="mt-4 bg-red-600 hover:bg-red-700">Browse Movies</Button></Link>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map(b => (
            <Link key={b.id} to={`/confirmation/${b.id}`} className="block rounded-2xl bg-zinc-900 border border-white/5 hover:border-red-500/30 transition p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-white">{b.movieTitle}</h3>
                  <p className="text-xs text-white/50 mt-0.5">{b.theatreName} · {b.screenName}</p>
                  <p className="text-xs text-white/50 flex items-center gap-1 mt-1"><Calendar className="w-3 h-3" /> {b.showDate} · {b.showTime}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {b.seats.map(s => <span key={s} className="text-[11px] px-2 py-0.5 rounded bg-white/5 text-white/70 border border-white/10">{s}</span>)}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full ${b.bookingStatus === 'CONFIRMED' ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>{b.bookingStatus}</span>
                  <p className="text-lg font-bold text-white mt-2">₹{b.amount}</p>
                  <p className="text-[10px] text-white/40 font-mono">{b.bookingReference}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}