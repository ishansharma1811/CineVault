const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { ROW_LABELS } from '../../shared/cinema.ts';

const MOVIES = [
  { title: "Neon Horizon", description: "A rogue astronomer discovers a signal that rewrites humanity's place in the cosmos. A gripping sci-fi thriller about first contact and the cost of knowledge.", poster: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&q=80", backdrop: "https://images.unsplash.com/photo-1536440136628-849c47e672b3?w=1600&q=80", trailerUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", genre: ["Sci-Fi", "Thriller"], language: "English", duration: 142, rating: 8.7, certificate: "UA", releaseDate: "2026-08-15", cast: ["Aryan Mehta", "Lena Cole", "Vikram Shah"], director: "Rajiv Anand", status: "NOW_SHOWING", featured: true },
  { title: "Crimson Veil", description: "A detective hunts a phantom killer through the rain-soaked alleys of a coastal city. A dark, atmospheric crime thriller with a twist you won't see coming.", poster: "https://images.unsplash.com/photo-1509347526635-9a8b6c3b54b3?w=600&q=80", backdrop: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1600&q=80", trailerUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", genre: ["Crime", "Thriller", "Drama"], language: "Hindi", duration: 128, rating: 8.2, certificate: "A", releaseDate: "2026-09-01", cast: ["Imran Qureshi", "Sara Pillai"], director: "Meghna Rao", status: "NOW_SHOWING", featured: true },
  { title: "Paper Lanterns", description: "A tender romance spanning one summer in the hills, where two strangers find love, loss, and lantern light. Warm, emotional, unforgettable.", poster: "https://images.unsplash.com/photo-1518929458117-e4a659acb9cb?w=600&q=80", backdrop: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1600&q=80", trailerUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", genre: ["Romance", "Drama"], language: "Hindi", duration: 118, rating: 7.9, certificate: "U", releaseDate: "2026-07-20", cast: ["Kabir Nair", "Ananya Iyer"], director: "Sufiyan Khan", status: "NOW_SHOWING", featured: false },
  { title: "The Last Cartographer", description: "An aging mapmaker races against time to chart a vanishing land. An epic adventure drama about memory, legacy, and the maps we draw of our lives.", poster: "https://images.unsplash.com/photo-1440404904302-6e313c7c19c4?w=600&q=80", backdrop: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1600&q=80", trailerUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", genre: ["Adventure", "Drama"], language: "English", duration: 135, rating: 8.0, certificate: "UA", releaseDate: "2026-06-10", cast: ["Devansh Kapoor", "Mira Bose"], director: "Arjun Walia", status: "NOW_SHOWING", featured: true },
  { title: "Laugh Riot", description: "Four friends, one disastrous wedding, and a goat named Lucky. A laugh-out-loud comedy about chaos, friendship, and the worst best-man ever.", poster: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&q=80", backdrop: "https://images.unsplash.com/photo-1517604931442-7e0c8ed296ad?w=1600&q=80", trailerUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", genre: ["Comedy"], language: "Hindi", duration: 124, rating: 7.5, certificate: "U", releaseDate: "2026-09-10", cast: ["Bunty Ahuja", "Priya Sethi"], director: "Karan Malhotra", status: "NOW_SHOWING", featured: false },
  { title: "Echoes of Tomorrow", description: "A physicist receives messages from her future self. A mind-bending sci-fi mystery about time, grief, and the choices that define us.", poster: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=600&q=80", backdrop: "https://images.unsplash.com/photo-1419242902178-5b5b0a8b7a7c?w=1600&q=80", trailerUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", genre: ["Sci-Fi", "Mystery"], language: "English", duration: 130, rating: 8.4, certificate: "UA", releaseDate: "2026-05-30", cast: ["Rhea Chakraborty", "Omar Faruk"], director: "Nisha Bhatt", status: "NOW_SHOWING", featured: true },
  { title: "Steel Hearts", description: "An underdog boxer fights for a national title while holding her family together. A raw, emotional sports drama with knockout performances.", poster: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600&q=80", backdrop: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1600&q=80", trailerUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", genre: ["Drama", "Sports"], language: "Hindi", duration: 140, rating: 8.1, certificate: "UA", releaseDate: "2026-04-18", cast: ["Tara Singh", "Ravi Dahiya"], director: "Sandeep Rawal", status: "NOW_SHOWING", featured: false },
  { title: "Whispers in the Dark", description: "A family moves into a house that remembers. A chilling supernatural horror about secrets that refuse to stay buried.", poster: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&q=80", backdrop: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1600&q=80", trailerUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", genre: ["Horror", "Thriller"], language: "Tamil", duration: 122, rating: 7.3, certificate: "A", releaseDate: "2026-08-25", cast: ["Karthik Raman", "Divya Menon"], director: "Vetri Selvan", status: "NOW_SHOWING", featured: false },
  { title: "Galaxy Heist", description: "A crew of unlikely thieves pulls off the impossible across three planets. A dazzling sci-fi action adventure packed with spectacle and swagger.", poster: "https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=600&q=80", backdrop: "https://images.unsplash.com/photo-1462331940025-97f536b0c5e3?w=1600&q=80", trailerUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", genre: ["Action", "Sci-Fi", "Adventure"], language: "English", duration: 138, rating: 8.6, certificate: "UA", releaseDate: "2026-11-07", cast: ["Zane Malik", "Isla Verma"], director: "Rohit Sehgal", status: "COMING_SOON", featured: true },
  { title: "Monsoon Melody", description: "Three lives intersect during one unforgettable monsoon in Mumbai. A lyrical musical drama about love, ambition, and the rains that change everything.", poster: "https://images.unsplash.com/photo-1515462277126-2cd0c4626fcf?w=600&q=80", backdrop: "https://images.unsplash.com/photo-1503152394-c571994fc383?w=1600&q=80", trailerUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", genre: ["Drama", "Musical", "Romance"], language: "Hindi", duration: 145, rating: 8.3, certificate: "U", releaseDate: "2026-10-20", cast: ["Aditi Rao", "Faisal Khan"], director: "Mahesh Bhatia", status: "COMING_SOON", featured: false }
];

const THEATRES = [
  { name: "CineVault Grand Jaipur", city: "Jaipur", address: "MI Road, Jaipur, Rajasthan", facilities: ["Dolby Atmos", "Recliner", "Food Court", "Parking"], screenCount: 5, rating: 4.7, image: "https://images.unsplash.com/photo-1517604931442-7e0c8ed296ad?w=800&q=80" },
  { name: "CineVault Central Jaipur", city: "Jaipur", address: "Civil Lines, Jaipur, Rajasthan", facilities: ["IMAX", "Dolby Atmos", "Parking"], screenCount: 4, rating: 4.5, image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80" },
  { name: "Royal Cinema Delhi", city: "Delhi", address: "Connaught Place, New Delhi", facilities: ["4K Projection", "Recliner", "Food Court", "Valet"], screenCount: 6, rating: 4.6, image: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&q=80" },
  { name: "CineVault Mumbai Metro", city: "Mumbai", address: "Andheri West, Mumbai", facilities: ["IMAX", "Dolby Atmos", "Lounge", "Parking"], screenCount: 7, rating: 4.8, image: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&q=80" },
  { name: "CineVault Bengaluru Tech", city: "Bengaluru", address: "Koramangala, Bengaluru", facilities: ["4K Projection", "Recliner", "Food Court", "Parking"], screenCount: 5, rating: 4.5, image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&q=80" }
];

const COUPONS = [
  { code: "CINE10", description: "10% off on tickets", discountType: "PERCENT", discountValue: 10, maxDiscount: 100, minAmount: 500, active: true },
  { code: "SAVE50", description: "Flat ₹50 off", discountType: "FLAT", discountValue: 50, maxDiscount: 50, minAmount: 300, active: true },
  { code: "FIRSTBOOKING", description: "25% off (max ₹150) on your first booking", discountType: "PERCENT", discountValue: 25, maxDiscount: 150, minAmount: 400, active: true }
];

const TIMES = ["10:00 AM", "12:30 PM", "3:00 PM", "6:30 PM", "9:30 PM"];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await db.auth.me();
    if (!user || user.role !== 'admin')
      return Response.json({ success: false, message: 'Admin access required' }, { status: 403 });

    // Movies
    const createdMovies = await db.entities.Movie.bulkCreate(MOVIES);
    const nowShowing = createdMovies.filter(m => m.status === 'NOW_SHOWING');

    // Theatres
    const createdTheatres = await db.entities.Theatre.bulkCreate(THEATRES);

    // Coupons
    await db.entities.Coupon.bulkCreate(COUPONS);

    // Shows: for each NOW_SHOWING movie, create shows across theatres for next 5 days
    const today = new Date();
    const showsToCreate = [];
    for (const movie of nowShowing) {
      for (const theatre of createdTheatres) {
        for (let d = 0; d < 2; d++) {
          const date = new Date(today.getTime() + d * 86400000).toISOString().slice(0, 10);
          for (let t = 0; t < 2; t++) {
            const screenNum = (t % 2) + 1;
            showsToCreate.push({
              movieId: movie.id,
              theatreId: theatre.id,
              screenName: `Screen ${screenNum}`,
              date,
              startTime: TIMES[t],
              endTime: TIMES[t + 1] || "12:30 PM",
              ticketPrice: 200 + (screenNum * 50),
              rows: 8,
              cols: 10,
              premiumRows: ["E", "F"],
              city: theatre.city
            });
          }
        }
      }
    }
    const createdShows = await db.entities.Show.bulkCreate(showsToCreate);

    // Seats: generate layout per show (8 rows x 10 cols = 80 seats)
    const seatsToCreate = [];
    for (const show of createdShows) {
      for (let r = 0; r < show.rows; r++) {
        const row = ROW_LABELS[r];
        const category = (show.premiumRows || []).includes(row) ? "PREMIUM" : "STANDARD";
        for (let c = 1; c <= show.cols; c++) {
          seatsToCreate.push({
            showId: show.id,
            seatId: `${row}${c}`,
            row,
            number: c,
            category,
            status: "AVAILABLE",
            heldBy: null,
            bookedBy: null,
            expiresAt: null
          });
        }
      }
    }
    // Bulk create in chunks of 500
    for (let i = 0; i < seatsToCreate.length; i += 500) {
      await db.entities.Seat.bulkCreate(seatsToCreate.slice(i, i + 500));
    }

    return Response.json({
      success: true,
      message: 'Seed complete',
      counts: {
        movies: createdMovies.length,
        theatres: createdTheatres.length,
        shows: createdShows.length,
        seats: seatsToCreate.length,
        coupons: COUPONS.length
      }
    });
  } catch (error) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}