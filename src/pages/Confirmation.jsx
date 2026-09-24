const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Download, Printer, Ticket, ArrowLeft } from 'lucide-react';

import QRCode from '@/components/QRCode';
import { Button } from '@/components/ui/button';

export default function Confirmation() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const b = await db.entities.Booking.get(id);
        setBooking(b);
      } catch (e) {}
      finally { setLoading(false); }
    })();
  }, [id]);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-8 h-8 border-4 border-white/20 border-t-red-600 rounded-full animate-spin" /></div>;
  if (!booking) return <div className="min-h-[60vh] flex items-center justify-center text-white/60">Booking not found.</div>;

  const ticketPayload = `CINEVAULT|${booking.bookingReference}|${booking.movieTitle}|${booking.seats.join(',')}|${booking.showDate} ${booking.showTime}`;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-green-600/20 flex items-center justify-center mb-3">
          <CheckCircle2 className="w-9 h-9 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-white">Booking Confirmed!</h1>
        <p className="text-white/60 text-sm mt-1">Your tickets are booked. Show this at the entrance.</p>
      </div>

      <div className="rounded-3xl overflow-hidden bg-gradient-to-br from-zinc-900 to-black border border-white/10 shadow-2xl">
        <div className="p-6 bg-gradient-to-r from-red-600 to-red-800">
          <div className="flex items-center justify-between">
            <span className="text-white font-bold text-lg">CineVault</span>
            <span className="text-white/80 text-sm">{booking.bookingReference}</span>
          </div>
        </div>
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-4">{booking.movieTitle}</h2>
          <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
            <Field label="Theatre" value={booking.theatreName} />
            <Field label="Screen" value={booking.screenName} />
            <Field label="Date" value={booking.showDate} />
            <Field label="Time" value={booking.showTime} />
            <Field label="Seats" value={booking.seats.join(', ')} />
            <Field label="City" value={booking.city} />
          </div>
          <div className="border-t border-dashed border-white/15 my-5" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wide">Amount Paid</p>
              <p className="text-2xl font-bold text-white">₹{booking.amount}</p>
              {booking.couponCode && <p className="text-xs text-green-400 mt-1">Coupon: {booking.couponCode}</p>}
            </div>
            <div className="bg-white p-2 rounded-xl">
              <QRCode value={ticketPayload} size={110} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mt-6 justify-center">
        <Button onClick={() => window.print()} variant="outline" className="border-white/20 text-white hover:bg-white/10"><Printer className="w-4 h-4 mr-1" /> Print Ticket</Button>
        <Button onClick={() => window.print()} variant="outline" className="border-white/20 text-white hover:bg-white/10"><Download className="w-4 h-4 mr-1" /> Download</Button>
        <Link to="/bookings"><Button className="bg-red-600 hover:bg-red-700"><Ticket className="w-4 h-4 mr-1" /> My Bookings</Button></Link>
      </div>
      <div className="text-center mt-6">
        <Link to="/"><Button variant="ghost" size="sm" className="text-white/60 hover:bg-white/10"><ArrowLeft className="w-4 h-4 mr-1" /> Back to Home</Button></Link>
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-white/40 uppercase tracking-wide">{label}</p>
      <p className="text-white font-medium mt-0.5">{value}</p>
    </div>
  );
}