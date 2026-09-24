const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Tag, Loader2, CheckCircle2, CreditCard } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

export default function Checkout() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { showId, seatIds } = state || {};
  const [show, setShow] = useState(null);
  const [movie, setMovie] = useState(null);
  const [theatre, setTheatre] = useState(null);
  const [loading, setLoading] = useState(true);
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (!showId || !seatIds?.length) { navigate('/'); return; }
    (async () => {
      try {
        const s = await db.entities.Show.get(showId);
        setShow(s);
        const [m, t] = await Promise.all([db.entities.Movie.get(s.movieId), db.entities.Theatre.get(s.theatreId)]);
        setMovie(m); setTheatre(t);
      } catch (e) { toast({ title: 'Failed to load checkout', variant: 'destructive' }); }
      finally { setLoading(false); }
    })();
  }, [showId]);

  if (!showId || !seatIds?.length) return null;
  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-8 h-8 border-4 border-white/20 border-t-red-600 rounded-full animate-spin" /></div>;

  const premiumRows = show.premiumRows || [];
  const seatDetails = seatIds.map(sid => ({ id: sid, row: sid.replace(/\d/g, ''), price: premiumRows.includes(sid.replace(/\d/g, '')) ? show.ticketPrice + 50 : show.ticketPrice }));
  const ticketTotal = seatDetails.reduce((s, x) => s + x.price, 0);
  const convenienceFee = Math.round(ticketTotal * 0.10);
  const taxes = Math.round((ticketTotal + convenienceFee) * 0.05);
  const total = Math.max(0, ticketTotal + convenienceFee + taxes - discount);

  const applyCoupon = async () => {
    if (!coupon) return;
    try {
      const res = await db.functions.invoke('validateCoupon', { code: coupon.toUpperCase(), amount: ticketTotal });
      const data = res.data || res;
      if (data.success) {
        setDiscount(data.discount);
        setAppliedCoupon(data.code);
        toast({ title: `Coupon applied — ₹${data.discount} off` });
      } else { toast({ title: data.message, variant: 'destructive' }); }
    } catch (e) {
      const msg = e?.response?.data?.message || 'Invalid coupon';
      toast({ title: msg, variant: 'destructive' });
      setDiscount(0); setAppliedCoupon('');
    }
  };

  const pay = async () => {
    setPaying(true);
    try {
      // Mock payment delay
      await new Promise(r => setTimeout(r, 1800));
      const res = await db.functions.invoke('confirmBooking', { showId, seatIds, couponCode: appliedCoupon || undefined });
      const data = res.data || res;
      if (data.success && data.booking) {
        toast({ title: 'Payment Successful', description: 'Booking confirmed' });
        navigate(`/confirmation/${data.booking.id}`);
      } else {
        toast({ title: data.message || 'Booking failed', variant: 'destructive' });
      }
    } catch (e) {
      const msg = e?.response?.data?.message || 'Booking failed';
      toast({ title: msg, variant: 'destructive' });
    } finally { setPaying(false); }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <Link to={`/show/${showId}/seats`}><Button variant="ghost" size="sm" className="text-white hover:bg-white/10 mb-4"><ArrowLeft className="w-4 h-4 mr-1" /> Back to seats</Button></Link>
      <h1 className="text-2xl font-bold text-white mb-6">Checkout</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-zinc-900 border border-white/5 p-5">
          <h2 className="font-semibold text-white mb-3">{movie?.title}</h2>
          <p className="text-sm text-white/60">{theatre?.name} · {show.screenName}</p>
          <p className="text-sm text-white/60">{show.date} · {show.startTime}</p>
          <div className="mt-4">
            <p className="text-xs text-white/40 uppercase tracking-wide mb-2">Your Seats</p>
            <div className="flex flex-wrap gap-2">
              {seatIds.map(s => <span key={s} className="px-3 py-1.5 rounded-lg bg-red-600/20 border border-red-600/40 text-red-300 text-sm font-medium">{s}</span>)}
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-zinc-900 border border-white/5 p-5">
          <h2 className="font-semibold text-white mb-4">Payment Summary</h2>
          <div className="space-y-2 text-sm">
            <Row label={`Tickets (${seatIds.length})`} value={`₹${ticketTotal}`} />
            <Row label="Convenience Fee" value={`₹${convenienceFee}`} />
            <Row label="Taxes" value={`₹${taxes}`} />
            {discount > 0 && <Row label={`Discount (${appliedCoupon})`} value={`-₹${discount}`} green />}
            <div className="border-t border-white/10 my-2" />
            <Row label="Total Amount" value={`₹${total}`} bold />
          </div>

          <div className="mt-4 flex gap-2">
            <input value={coupon} onChange={e => setCoupon(e.target.value)} placeholder="Coupon code" className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:border-red-500/50" />
            <Button onClick={applyCoupon} variant="outline" className="border-white/20 text-white hover:bg-white/10"><Tag className="w-4 h-4 mr-1" /> Apply</Button>
          </div>
          <p className="text-[11px] text-white/40 mt-2">Try: CINE10, SAVE50, FIRSTBOOKING</p>

          <div className="mt-5 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 p-4">
            <div className="flex items-center gap-2 text-white/70 text-sm mb-3"><CreditCard className="w-4 h-4" /> Mock Payment</div>
            <div className="text-xs text-white/40 mb-3">No real charge. This simulates a payment gateway.</div>
            <Button onClick={pay} disabled={paying} className="w-full bg-red-600 hover:bg-red-700 text-white">
              {paying ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing Payment...</> : <><CheckCircle2 className="w-4 h-4 mr-1" /> Pay ₹{total}</>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold, green }) {
  return (
    <div className="flex justify-between">
      <span className={bold ? 'text-white font-semibold' : 'text-white/60'}>{label}</span>
      <span className={`${bold ? 'text-white font-bold text-base' : green ? 'text-green-400' : 'text-white/80'}`}>{value}</span>
    </div>
  );
}