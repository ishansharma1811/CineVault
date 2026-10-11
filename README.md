# CineVault

🎬 **Your Movies. Your Seats. Your Experience.**

CineVault is a full-stack movie & event ticket-booking platform with real-time atomic seat locking, mock payments, an admin dashboard, an AI movie assistant, and more.

Built on Base44 — a backend-as-a-service platform.

## Quick Start

1. Register an account
2. Go to **Admin → Seed Demo Data** to populate the database
3. Browse, book seats, and test the real-time seat-locking flow

## Features

- Real-time atomic seat locking (race-condition safe)
- 5-minute seat hold with countdown timer
- Checkout with taxes, convenience fees, and coupons
- Digital tickets with QR codes
- Admin dashboard with stats and CRUD operations
- AI Movie Assistant for recommendations
- Responsive design (mobile/tablet/desktop)

## Tech Stack

| Layer | Technology |
|-------|-------------|
| Frontend | React + Vite + Tailwind + React Router |
| Backend | Base44 backend functions + entity subscriptions |
| Database | Base44 entities (MongoDB-backed) |
| Realtime | Base44 entity subscriptions |
| Hosting | Base44 managed hosting |

## Architecture

```
React (UI) ──REST──▶ Backend Functions ──▶ Entities (MongoDB)
   ↕                    ↕
Subscriptions  ◀── push seat events ── (realtime seat updates)
```

## Seat Locking Flow

1. User selects a seat → atomic conditional DB update
2. Seat status: `AVAILABLE` → `HELD` (single operation, race-safe)
3. 5-minute hold with server-side expiry cleanup
4. Real-time updates broadcast to all connected clients
5. On payment → seat becomes `BOOKED`

## Data Models

- `Movie`, `Theatre`, `Show`, `Seat`, `Booking`, `Review`, `Coupon`, `Wishlist`, `User`

## API Functions

- `holdSeat` — atomically hold seats for 5 minutes
- `releaseSeat` — release held seats
- `getShowSeats` — fetch seats + clean expired holds
- `confirmBooking` — mark held seats as booked
- `validateCoupon` — server-side coupon validation
- `getRecommendations` — local AI recommendations
- `adminStats` — dashboard statistics
- `seedData` — populate demo content

## Demo Coupons

- `CINE10` — ₹50 discount
- `SAVE50` — 50% off
- `FIRSTBOOKING` — first-time user discount

## Environment Variables

None required for the core app. The AI assistant is local.

## Testing

✅ App builds with no console errors  
✅ Demo data seeds successfully  
✅ Seat hold works with real-time updates  
✅ Checkout calculations are accurate  
✅ Coupons apply server-side  
✅ AI recommendations work  

## Future Improvements

- Real Razorpay/Stripe payments
- Scannable QR codes
- Scheduled expiry sweeper job
- Reviews from verified bookings only
- Seat layout presets (couple/recliner)
- Email notifications

---

© CineVault — a demo project. All movie data is fictional and original.
