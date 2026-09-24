export const HOLD_DURATION_MS = 5 * 60 * 1000; // 5 minutes
export const CONVENIENCE_FEE_RATE = 0.10; // 10% of ticket total
export const TAX_RATE = 0.05; // 5% of (tickets + fee)

export const ROW_LABELS = "ABCDEFGHJKLMNPQRSTUVWXYZ".split("");

export function generateBookingReference() {
  const year = new Date().getFullYear();
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const rand = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  const nums = Math.floor(1000 + Math.random() * 9000);
  return `CV-${year}-${rand}${nums}`;
}

export function computeFees(ticketPrice, seatCount, discountAmount = 0) {
  const ticketTotal = Math.round(ticketPrice * seatCount);
  const convenienceFee = Math.round(ticketTotal * CONVENIENCE_FEE_RATE);
  const taxes = Math.round((ticketTotal + convenienceFee) * TAX_RATE);
  const total = Math.max(0, ticketTotal + convenienceFee + taxes - discountAmount);
  return { ticketTotal, convenienceFee, taxes, discount: discountAmount, total };
}

// Simple weighted keyword recommendation engine (TF-style overlap).
export function scoreMovie(query, movie) {
  const q = (query || "").toLowerCase();
  if (!q.trim()) return movie.rating || 0;
  const doc = [
    movie.title || "",
    (movie.description || ""),
    (movie.genre || []).join(" "),
    (movie.cast || []).join(" "),
    movie.language || "",
    movie.director || ""
  ].join(" ").toLowerCase();
  const stop = new Set(["the", "a", "an", "movie", "film", "with", "and", "i", "want", "to", "watch", "of", "for", "me", "strong", "story", "good"]);
  const terms = q.split(/[^a-z0-9]+/).filter(t => t && !stop.has(t));
  if (terms.length === 0) return movie.rating || 0;
  let score = 0;
  for (const t of terms) {
    if (doc.includes(t)) score += 2;
  }
  // genre exact matches weighted higher
  const genres = (movie.genre || []).map(g => g.toLowerCase());
  for (const t of terms) if (genres.includes(t)) score += 3;
  score += (movie.rating || 0) * 0.2;
  return score;
}