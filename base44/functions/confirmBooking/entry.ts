const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { generateBookingReference, computeFees } from '../../shared/cinema.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await db.auth.me();
    if (!user) return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const { showId, seatIds, couponCode } = body;
    if (!showId || !Array.isArray(seatIds) || seatIds.length === 0)
      return Response.json({ success: false, message: 'showId and seatIds are required' }, { status: 400 });

    // Validate seats are HELD by this user and not expired
    const now = new Date();
    const invalid = [];
    for (const seatId of seatIds) {
      const seats = await db.entities.Seat.filter({ showId, seatId });
      const seat = seats[0];
      if (!seat || seat.status !== 'HELD' || seat.heldBy !== user.id) {
        invalid.push({ seatId, status: seat ? seat.status : 'NOT_FOUND' });
      } else if (seat.expiresAt && new Date(seat.expiresAt) < now) {
        invalid.push({ seatId, status: 'EXPIRED' });
      }
    }
    if (invalid.length > 0)
      return Response.json({ success: false, message: 'Some seats are no longer held for you', invalid }, { status: 409 });

    // Atomically mark seats BOOKED (only if still HELD by this user)
    for (const seatId of seatIds) {
      await db.entities.Seat.updateMany(
        { showId, seatId, status: 'HELD', heldBy: user.id },
        { $set: { status: 'BOOKED', bookedBy: user.id, expiresAt: null } }
      );
    }
    // Verify
    const bookedFailures = [];
    for (const seatId of seatIds) {
      const seats = await db.entities.Seat.filter({ showId, seatId });
      const seat = seats[0];
      if (!seat || seat.status !== 'BOOKED' || seat.bookedBy !== user.id) {
        bookedFailures.push(seatId);
      }
    }
    if (bookedFailures.length > 0)
      return Response.json({ success: false, message: 'Booking failed due to a seat conflict', bookedFailures }, { status: 409 });

    // Load show/movie/theatre
    const shows = await db.entities.Show.filter({ id: showId });
    const show = shows[0];
    let movieTitle = '', theatreName = '', screenName = show?.screenName || '', showDate = show?.date || '', showTime = show?.startTime || '', city = show?.city || '', ticketPrice = show?.ticketPrice || 0;
    if (show) {
      const movies = await db.entities.Movie.filter({ id: show.movieId });
      if (movies[0]) movieTitle = movies[0].title;
      const theatres = await db.entities.Theatre.filter({ id: show.theatreId });
      if (theatres[0]) theatreName = theatres[0].name;
    }

    // Coupon validation
    let discount = 0;
    let appliedCoupon = null;
    if (couponCode) {
      const coupons = await db.entities.Coupon.filter({ code: couponCode, active: true });
      const coupon = coupons[0];
      if (coupon) {
        const ticketTotal = ticketPrice * seatIds.length;
        if (!coupon.minAmount || ticketTotal >= coupon.minAmount) {
          if (coupon.discountType === 'PERCENT') {
            discount = Math.min(coupon.maxDiscount || Infinity, Math.round(ticketTotal * coupon.discountValue / 100));
          } else {
            discount = coupon.discountValue;
          }
          appliedCoupon = coupon.code;
        }
      }
    }

    const fees = computeFees(ticketPrice, seatIds.length, discount);
    const bookingReference = generateBookingReference();

    const booking = await db.entities.Booking.create({
      userId: user.id,
      showId,
      movieId: show?.movieId || '',
      theatreId: show?.theatreId || '',
      seats: seatIds,
      ticketPrice,
      convenienceFee: fees.convenienceFee,
      taxes: fees.taxes,
      discount: fees.discount,
      amount: fees.total,
      paymentStatus: 'PAID',
      bookingStatus: 'CONFIRMED',
      bookingReference,
      couponCode: appliedCoupon || '',
      movieTitle,
      theatreName,
      screenName,
      showDate,
      showTime,
      city
    });

    return Response.json({ success: true, booking });
  } catch (error) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}