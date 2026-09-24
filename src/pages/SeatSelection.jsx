const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Loader2, Lock } from 'lucide-react';

import { useAuth } from '@/lib/AuthContext';
import SeatMap from '@/components/SeatMap';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const HOLD_MS = 5 * 60 * 1000;

export default function SeatSelection() {
  const { id: showId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [show, setShow] = useState(null);
  const [movie, setMovie] = useState(null);
  const [theatre, setTheatre] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selected, setSelected] = useState([]);
  const [expiresAt, setExpiresAt] = useState(null);
  const [remaining, setRemaining] = useState(HOLD_MS);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const selectedRef = useRef([]);

  useEffect(() => { selectedRef.current = selected; }, [selected]);

  const fetchSeats = useCallback(async () => {
    try {
      const res = await db.functions.invoke('getShowSeats', { showId });
      const data = res.data || res;
      if (data.success) {
        setSeats(data.seats);
        // Drop any selected seats that are no longer held by me
        setSelected(prev => prev.filter(sid => {
          const s = data.seats.find(x => x.seatId === sid);
          return s && s.status === 'HELD' && s.heldBy === user.id;
        }));
      }
    } catch (e) { /* ignore transient */ }
  }, [showId, user]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const s = await db.entities.Show.get(showId);
        setShow(s);
        const [m, t] = await Promise.all([
          db.entities.Movie.get(s.movieId),
          db.entities.Theatre.get(s.theatreId)
        ]);
        setMovie(m); setTheatre(t);
        await fetchSeats();
      } catch (e) { toast({ title: 'Failed to load show', variant: 'destructive' }); }
      finally { setLoading(false); }
    })();
  }, [showId]);

  // Realtime subscription + polling fallback.
  // Note: we intentionally do NOT release seats on unmount — the server-side
  // 5-minute hold persists across the checkout page, and expiry cleans up
  // abandoned holds. Releasing here would break the checkout->payment flow.
  useEffect(() => {
    const unsub = db.entities.Seat.subscribe(() => { fetchSeats(); });
    const poll = setInterval(fetchSeats, 5000);
    return () => {
      unsub();
      clearInterval(poll);
    };
  }, [fetchSeats]);

  // Countdown
  useEffect(() => {
    if (!expiresAt) { setRemaining(HOLD_MS); return; }
    const tick = setInterval(() => {
      const ms = new Date(expiresAt).getTime() - Date.now();
      if (ms <= 0) {
        setRemaining(0);
        clearInterval(tick);
        // Auto-release
        if (selectedRef.current.length) {
          db.functions.invoke('releaseSeat', { showId, seatIds: selectedRef.current }).catch(() => {});
          setSelected([]);
          setExpiresAt(null);
          toast({ title: 'Seat hold expired', description: 'Your selected seats were released.', variant: 'destructive' });
        }
      } else {
        setRemaining(ms);
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [expiresAt]);

  const fmtTime = (ms) => {
    const s = Math.max(0, Math.floor(ms / 1000));
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  };

  const toggleSeat = async (seatId) => {
    if (busy) return;
    if (selected.includes(seatId)) {
      // release
      setBusy(true);
      try {
        await db.functions.invoke('releaseSeat', { showId, seatIds: [seatId] });
        setSelected(prev => prev.filter(s => s !== seatId));
        if (selected.length === 1) setExpiresAt(null);
        await fetchSeats();
      } catch (e) { toast({ title: 'Could not release seat', variant: 'destructive' }); }
      finally { setBusy(false); }
      return;
    }
    if (selected.length >= 10) { toast({ title: 'Max 10 seats per booking', variant: 'destructive' }); return; }
    setBusy(true);
    try {
      const res = await db.functions.invoke('holdSeat', { showId, seatIds: [seatId] });
      const data = res.data || res;
      if (data.success) {
        setSelected(prev => [...prev, seatId]);
        setExpiresAt(data.expiresAt);
        toast({ title: 'Seat held', description: `${seatId} reserved for 5 minutes` });
        await fetchSeats();
      } else {
        toast({ title: data.message || 'Seat unavailable', variant: 'destructive' });
      }
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Seat is no longer available.';
      toast({ title: msg, variant: 'destructive' });
      await fetchSeats();
    } finally { setBusy(false); }
  };

  const proceed = () => {
    if (!selected.length) { toast({ title: 'Select at least one seat', variant: 'destructive' }); return; }
    navigate('/checkout', { state: { showId, seatIds: selected } });
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-8 h-8 border-4 border-white/20 border-t-red-600 rounded-full animate-spin" /></div>;
  if (!show) return <div className="min-h-[60vh] flex items-center justify-center text-white/60">Show not found.</div>;

  const premiumRows = show.premiumRows || [];
  const selectedSeats = seats.filter(s => selected.includes(s.seatId));
  const ticketTotal = selectedSeats.reduce((sum, s) => sum + (premiumRows.includes(s.row) ? show.ticketPrice + 50 : show.ticketPrice), 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <Link to={movie ? `/movie/${movie.id}` : '/'}><Button variant="ghost" size="sm" className="text-white hover:bg-white/10 mb-4"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button></Link>

      <div className="rounded-2xl bg-zinc-900 border border-white/5 p-4 mb-6">
        <h1 className="text-lg font-bold text-white">{movie?.title}</h1>
        <p className="text-sm text-white/60">{theatre?.name} · {show.screenName} · {show.date} · {show.startTime}</p>
      </div>

      {expiresAt && (
        <div className={`rounded-xl px-4 py-3 mb-4 flex items-center justify-between border ${remaining < 60000 ? 'bg-red-950/40 border-red-700/50' : 'bg-amber-950/30 border-amber-700/40'}`}>
          <span className="flex items-center gap-2 text-sm text-white/80"><Clock className="w-4 h-4" /> Time left to complete payment</span>
          <span className="font-mono font-bold text-lg text-white">{fmtTime(remaining)}</span>
        </div>
      )}

      <div className="rounded-2xl bg-zinc-900/50 border border-white/5 p-4 sm:p-6">
        <SeatMap seats={seats} rows={show.rows} cols={show.cols} premiumRows={premiumRows} selectedIds={selected} currentUserId={user?.id} onToggle={toggleSeat} />
      </div>

      <div className="sticky bottom-0 mt-6 -mx-4 sm:mx-0 bg-zinc-900/95 backdrop-blur border-t border-white/10 sm:rounded-2xl sm:border p-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-white/50">Selected ({selected.length})</p>
          <p className="text-sm text-white font-medium">{selected.join(', ') || 'None'}</p>
          <p className="text-sm text-red-500 font-bold mt-1">₹{ticketTotal} <span className="text-xs text-white/40 font-normal">+ taxes & fees</span></p>
        </div>
        <Button onClick={proceed} disabled={!selected.length || busy} className="bg-red-600 hover:bg-red-700 text-white">
          {busy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Lock className="w-4 h-4 mr-1" />} Proceed to Checkout
        </Button>
      </div>
    </div>
  );
}