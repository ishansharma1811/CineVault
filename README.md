

# 🎬 CineVault — *Your Movies. Your Seats. Your Experience.*

CineVault is an original, full-stack movie & event ticket-booking platform with **real-time atomic seat locking**, mock payments, an admin dashboard, an AI movie assistant, and a premium dark cinematic UI.

> **Platform note:** This project was built on [Base44](https://db.com), a backend-as-a-service platform. The architecture requested (Node/Express/MongoDB/Mongoose/Socket.IO/JWT/bcrypt) is mapped to Base44's native primitives, which preserve the same guarantees (atomic DB operations, realtime updates, hashed-password auth, REST-style endpoints). See **Architecture Mapping** below.

---

## ✨ Features

- **Home**: hero, search, city selector, Now Showing / Coming Soon / Popular, categories, nearby theatres, promo banner.
- **Movies**: full CRUD (admin), details page with backdrop, cast, trailer, showtimes, reviews.
- **City system**: 8 cities, persisted in localStorage; movies/theatres/shows filter by city.
- **Theatres**: listing, facilities, ratings.
- **Showtimes**: date + time selection per theatre.
- **Seat booking** with **real-time atomic seat locking** (the core feature):
  - States: `AVAILABLE`, `HELD`, `BOOKED`.
  - Atomic conditional DB update (no read-then-write race).
  - 5-minute hold with countdown timer + server-side expiry.
  - Realtime updates across tabs/users via entity subscriptions.
- **Checkout**: tickets, convenience fee, taxes, coupon, total.
- **Mock payment**: simulated gateway (no real charge), architected for easy Razorpay/Stripe swap.
- **Digital ticket**: booking confirmation with QR-style code, print/download.
- **Auth**: register, login, logout (built-in, JWT + bcrypt under the hood).
- **Profile**: editable name, phone, city.
- **My Bookings**: upcoming / past / cancelled.
- **Wishlist**: add/remove movies.
- **Reviews**: rate + review after booking (one per booking).
- **Coupons**: `CINE10`, `SAVE50`, `FIRSTBOOKING` — validated server-side.
- **Admin dashboard**: stats + charts, CRUD for movies/theatres/shows/coupons, bookings & users management, one-click demo data seeding.
- **AI Movie Assistant**: local TF-style metadata recommendation engine (no API key needed).
- Responsive (mobile/tablet/desktop), loading/empty/error states, toast notifications.

---

## 🧱 Tech Stack

| Layer | Requested | Used (Base44 equivalent) |
|---|---|---|
| Frontend | React + Vite + Tailwind + React Router + Axios + Socket.IO Client | React + Vite + Tailwind + React Router + Base44 SDK + entity subscriptions |
| Backend | Node + Express + Socket.IO + JWT + bcrypt | Base44 backend functions (HTTP handlers) + built-in auth (JWT + bcrypt) + realtime subscriptions |
| Database | MongoDB + Mongoose | Base44 entities (MongoDB-backed, JSON schemas) |
| Realtime | Socket.IO rooms | Base44 entity subscriptions (push to all connected clients) |
| Hosting | Vercel / Render / Atlas | Base44 managed hosting + database |

---

## 🏛️ Architecture

```
React (UI) ──REST──▶ Backend Functions ──▶ Entities (MongoDB)
   ↕                    ↕
Subscriptions  ◀── push seat events ── (realtime seat updates)
```

### Real-time seat-locking flow
```
User A selects A5
   │
   ▼ POST /functions/holdSeat { showId, seatIds: ["A5"] }
Backend: atomic conditional update
   findOneAndUpdate({ showId, seatId:"A5", status:"AVAILABLE" },
                    { $set:{ status:"HELD", heldBy:A, expiresAt: now+5m } })
   ▼
Seat = HELD in DB (single source of truth)
   ▼
Entity subscription broadcasts seat change
   ▼
All clients watching that show re-fetch seats → A5 shows unavailable
```

**Why frontend-only locking is insufficient:** React state is per-tab and trivially bypassed. Two users in two browsers could both "select" A5 if only the frontend tracked it. The backend + database must be the source of truth, and the lock must be a single atomic DB operation so concurrent requests can't both succeed.

### Atomic locking (race-condition safe)
The hold uses a **conditional update** — it only changes a seat from `AVAILABLE` → `HELD` in one DB operation. If two users hit it simultaneously, MongoDB serializes the document update: the first wins, the second's filter (`status: AVAILABLE`) no longer matches → returns `409 Conflict` "Seat is no longer available."

### Hold expiry
- Frontend shows a 5:00 countdown.
- `getShowSeats` and `holdSeat` release any `HELD` seats whose `expiresAt` has passed (server-side cleanup — never trusts the frontend timer alone).
- On timeout, the frontend releases the seat and notifies the user.

### Multi-user test
1. Open the same show in two browsers (two accounts).
2. Browser A holds A5 → A5 turns amber/"Held" in Browser B within ~5s.
3. Browser B tries A5 → backend rejects with 409.
4. Browser A pays → A5 becomes "Booked" in both.

---

## 🗄️ Data Models (Entities)

`Movie`, `Theatre`, `Show`, `Seat`, `Booking`, `Review`, `Coupon`, `Wishlist`, plus the built-in `User`.

Key relationships: `Show.movieId → Movie`, `Show.theatreId → Theatre`, `Seat.showId → Show` (one seat doc per seat per show), `Booking.showId/userId`, `Review.movieId/bookingId`, `Wishlist.userId/movieId`.

---

## 🔌 API (Backend Functions)

| Function | Purpose |
|---|---|
| `holdSeat` | Atomically hold seats (AVAILABLE→HELD) for the current user, 5-min expiry |
| `releaseSeat` | Release seats held by the current user |
| `getShowSeats` | Return all seats for a show + clean expired holds |
| `confirmBooking` | Atomically mark held seats BOOKED, create Booking, apply coupon |
| `validateCoupon` | Server-side coupon validation + discount calc |
| `getRecommendations` | AI recommendation engine (local, no API key) |
| `adminStats` | Dashboard statistics (admin only) |
| `seedData` | Seed demo movies/theatres/shows/seats/coupons (admin only) |

Frontend calls these via `db.functions.invoke('name', payload)`. Entity CRUD (movies, theatres, etc.) uses `db.entities.<Name>.list/filter/get/create/update/delete` directly.

---

## 🤖 AI Movie Assistant

A local recommendation engine scores each `NOW_SHOWING` movie against the user's free-text query using weighted keyword overlap over `title + genre + description + cast + language + director`, with genre matches weighted higher and rating as a tiebreaker. No external API key required — the app works offline of any AI provider. (An LLM provider could be wired in later via an env var if desired.)

---

## 🚀 Setup

This app runs on Base44 — no local install needed. Open it in the Base44 builder and it's live in the preview. To populate demo content:

1. Register an account (or use the builder/owner account, which is an **admin** by default).
2. Go to **Admin → Seed Demo Data** (creates 10 movies, 5 theatres, 160 shows, ~12,800 seats, 3 coupons).
3. Browse, book, and test the seat-locking flow.

### Environment variables
None required for the core app. The AI assistant is local. If you later add a real payment gateway or LLM, set those secrets in **App Settings → Environment Variables** (never committed to code). No secrets are bundled with this project.

---

## 🔑 Demo Credentials

Base44 uses its own email/password auth (passwords are bcrypt-hashed server-side; users can't be pre-seeded into the DB). **Register your own account** to use the app.

- **Regular user:** register any email/password → role `user` by default.
- **Admin:** the app **owner/builder** is automatically an `admin`. To make another registered user an admin, an existing admin opens **Admin → Users → Make Admin**.

(There is no fixed `demo@/admin@` password because accounts are created through the real auth system, not inserted as rows.)

---

## ✅ Testing

Verified during build:
- ✅ App builds with no console errors.
- ✅ Demo data seeds (10 movies, 160 shows, 5000+ seats, 3 coupons).
- ✅ Home renders movie cards, hero, categories, theatres by city.
- ✅ Movie details renders showtimes, dates, theatres, reviews.
- ✅ Seat map renders full 8×10 grid with legend.
- ✅ Seat hold works (A1/A2 → "Seat held" toasts, 5:00 countdown, seats turn red).
- ✅ Checkout computes tickets + convenience fee + taxes + coupon discount + total.
- ✅ Coupon `CINE10` applies server-side (−₹50).
- ✅ AI recommendations return relevant movies for "thrilling sci-fi…".
- ⚠️ Final payment→confirmation step: a transient bug (seats released on page-leave) was found and fixed; re-verify by running the flow after the fix.

To test the concurrent seat-lock scenario, open the same show in two browsers/accounts and hold the same seat.

---

## 📦 Deliverables & Deployment

- **Source code:** lives in this Base44 app (frontend in `src/`, backend functions in `base44/functions/`, entities in `base44/entities/`).
- **Live URL:** publish the app from the Base44 dashboard to get a public URL (it is not yet published).
- A standalone ZIP / separate frontend+backend URLs are not produced by this platform — the app is a single deployed unit on db.

---

## 🗺️ Folder Structure

```
src/
  components/   Navbar, Footer, Layout, MovieCard, SeatMap, QRCode
  context/      CityContext
  pages/        Home, MovieDetails, SeatSelection, Checkout, Confirmation,
                MyBookings, Wishlist, Profile, Admin, AIAssistant
  App.jsx       router
base44/
  entities/     Movie, Theatre, Show, Seat, Booking, Review, Coupon, Wishlist, User
  functions/    holdSeat, releaseSeat, getShowSeats, confirmBooking,
                validateCoupon, getRecommendations, adminStats, seedData
  shared/       cinema.ts (fees, booking ref, recommendation scoring)
```

## 🔭 Future Improvements
Real Razorpay/Stripe payments, scannable QR (real QR library), scheduled expiry sweeper job, reviews from verified bookings only, seat layout presets (couple/recliner), notifications/email.

---

© CineVault — a demo project. All movie data is fictional and original.
