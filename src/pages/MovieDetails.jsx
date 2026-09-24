const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, Clock, Calendar, Globe, Film, Heart, Play, ArrowLeft, MapPin } from 'lucide-react';

import { useAuth } from '@/lib/AuthContext';
import { useCity } from '@/context/CityContext';
import { Image } from '@/components/ui/image';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

function getYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?&]+)/);
  return m ? m[1] : null;
}

export default function MovieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { city } = useCity();
  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [wishlist, setWishlist] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true); setError(null);
      try {
        const m = await db.entities.Movie.get(id);
        setMovie(m);
        const [allShows, allTheatres, revs] = await Promise.all([
          db.entities.Show.filter({ movieId: id }),
          db.entities.Theatre.list(),
          db.entities.Review.filter({ movieId: id })
        ]);
        setShows(allShows);
        setTheatres(allTheatres);
        setReviews(revs);
        if (user) {
          const wl = await db.entities.Wishlist.filter({ userId: user.id, movieId: id });
          setWishlist(wl.length > 0);
        }
      } catch (e) { setError(e.message || 'Movie not found'); }
      finally { setLoading(false); }
    })();
  }, [id, user]);

  const cityShows = useMemo(() => shows.filter(s => s.city === city), [shows, city]);
  const dates = useMemo(() => {
    const set = new Set(cityShows.map(s => s.date));
    return [...set].sort();
  }, [cityShows]);
  useEffect(() => { if (dates.length && !selectedDate) setSelectedDate(dates[0]); }, [dates, selectedDate]);

  const theatresForDate = useMemo(() => {
    const tMap = {};
    cityShows.filter(s => s.date === selectedDate).forEach(s => {
      if (!tMap[s.theatreId]) tMap[s.theatreId] = { theatre: theatres.find(t => t.id === s.theatreId), shows: [] };
      tMap[s.theatreId].shows.push(s);
    });
    return Object.values(tMap).filter(x => x.theatre);
  }, [cityShows, selectedDate, theatres]);

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  const toggleWishlist = async () => {
    if (!user) { navigate('/login'); return; }
    try {
      if (wishlist) {
        const wl = await db.entities.Wishlist.filter({ userId: user.id, movieId: id });
        for (const w of wl) await db.entities.Wishlist.delete(w.id);
        setWishlist(false);
        toast({ title: 'Removed from wishlist' });
      } else {
        await db.entities.Wishlist.create({ userId: user.id, movieId: id });
        setWishlist(true);
        toast({ title: 'Added to wishlist' });
      }
    } catch (e) { toast({ title: 'Wishlist update failed', variant: 'destructive' }); }
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-8 h-8 border-4 border-white/20 border-t-red-600 rounded-full animate-spin" /></div>;
  if (error) return <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6"><p className="text-red-500 font-semibold">{error}</p><Link to="/"><Button className="mt-4 bg-red-600 hover:bg-red-700">Back to Home</Button></Link></div>;

  const ytId = getYouTubeId(movie.trailerUrl);

  return (
    <div>
      <div className="relative h-[45vh] min-h-[320px] overflow-hidden">
        <Image src={movie.backdrop || movie.poster} alt={movie.title} fittingType="fill" className="absolute inset-0 w-full h-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/60 to-[#0a0a0b]/30" />
        <div className="absolute top-4 left-4">
          <Link to="/"><Button variant="ghost" size="sm" className="text-white hover:bg-white/10"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button></Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-32 relative">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="w-40 sm:w-52 shrink-0 mx-auto sm:mx-0">
            <div className="aspect-[2/3] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <Image src={movie.poster} alt={movie.title} fittingType="fill" className="w-full h-full" />
            </div>
          </div>
          <div className="flex-1 pt-2 sm:pt-20">
            <h1 className="text-3xl sm:text-4xl font-bold text-white">{movie.title}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-white/70">
              <span className="flex items-center gap-1 text-amber-400 font-semibold"><Star className="w-4 h-4 fill-amber-400" /> {movie.rating?.toFixed(1)}{avgRating ? ` / users ${avgRating}` : ''}</span>
              <span>•</span><span>{(movie.genre || []).join(', ')}</span>
              <span>•</span><span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {movie.duration} min</span>
              <span>•</span><span>{movie.certificate}</span>
              <span>•</span><span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> {movie.language}</span>
            </div>
            <p className="text-white/70 mt-4 max-w-2xl text-sm leading-relaxed">{movie.description}</p>
            <div className="flex flex-wrap gap-2 mt-5">
              {movie.status === 'NOW_SHOWING' ? (
                <a href="#showtimes"><Button className="bg-red-600 hover:bg-red-700">Book Tickets</Button></a>
              ) : (
                <Button disabled variant="outline" className="border-white/20 text-white/50">Coming {movie.releaseDate}</Button>
              )}
              {ytId && <Button variant="outline" onClick={() => setShowTrailer(true)} className="border-white/20 text-white hover:bg-white/10"><Play className="w-4 h-4 mr-1" /> Trailer</Button>}
              <Button variant="outline" onClick={toggleWishlist} className={`border-white/20 ${wishlist ? 'text-red-500 border-red-500/50' : 'text-white hover:bg-white/10'}`}><Heart className={`w-4 h-4 mr-1 ${wishlist ? 'fill-red-500' : ''}`} /> {wishlist ? 'In Wishlist' : 'Wishlist'}</Button>
            </div>
            <div className="mt-5 text-sm text-white/60">
              <p><span className="text-white/40">Director:</span> {movie.director}</p>
              <p className="mt-1"><span className="text-white/40">Cast:</span> {(movie.cast || []).join(', ')}</p>
              <p className="mt-1"><span className="text-white/40">Release:</span> {movie.releaseDate}</p>
            </div>
          </div>
        </div>

        {ytId && showTrailer && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowTrailer(false)}>
            <div className="w-full max-w-3xl aspect-video" onClick={e => e.stopPropagation()}>
              <iframe src={`https://www.youtube.com/embed/${ytId}`} title="Trailer" className="w-full h-full rounded-xl" allowFullScreen />
            </div>
          </div>
        )}

        {movie.status === 'NOW_SHOWING' && (
          <div id="showtimes" className="mt-12">
            <div className="flex items-center gap-2 mb-4">
              <Film className="w-5 h-5 text-red-500" />
              <h2 className="text-xl font-bold text-white">Select Showtime · {city}</h2>
            </div>
            {dates.length === 0 ? (
              <p className="text-white/50 text-sm">No shows available in {city} for this movie.</p>
            ) : (
              <>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {dates.map(d => (
                    <button key={d} onClick={() => setSelectedDate(d)} className={`shrink-0 px-4 py-2 rounded-xl border text-sm transition ${selectedDate === d ? 'bg-red-600 border-red-600 text-white' : 'border-white/15 text-white/70 hover:bg-white/5'}`}>
                      <span className="block text-[10px] uppercase">{new Date(d).toLocaleDateString('en', { weekday: 'short' })}</span>
                      <span className="font-semibold">{new Date(d).toLocaleDateString('en', { day: 'numeric', month: 'short' })}</span>
                    </button>
                  ))}
                </div>
                <div className="space-y-4 mt-4">
                  {theatresForDate.map(({ theatre, shows: ts }) => (
                    <div key={theatre.id} className="rounded-2xl bg-zinc-900 border border-white/5 p-4">
                      <div className="flex items-start justify-between flex-wrap gap-2">
                        <div>
                          <h3 className="font-semibold text-white">{theatre.name}</h3>
                          <p className="text-xs text-white/50 flex items-center gap-1"><MapPin className="w-3 h-3" /> {theatre.address}</p>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {(theatre.facilities || []).map(f => <span key={f} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/60 border border-white/10">{f}</span>)}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {ts.map(s => (
                          <button key={s.id} onClick={() => navigate(`/show/${s.id}/seats`)} className="px-4 py-2 rounded-lg bg-green-600/15 border border-green-600/40 text-green-400 hover:bg-green-600 hover:text-white transition text-sm">
                            <span className="font-semibold">{s.startTime}</span>
                            <span className="block text-[10px] opacity-70">{s.screenName} · ₹{s.ticketPrice}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <div className="mt-12 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Reviews {avgRating && <span className="text-amber-400 text-sm">· {avgRating} ★</span>}</h2>
          {reviews.length === 0 ? (
            <p className="text-white/50 text-sm">No reviews yet. Book and watch this movie to leave a review.</p>
          ) : (
            <div className="space-y-3">
              {reviews.map(r => (
                <div key={r.id} className="rounded-xl bg-zinc-900 border border-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white text-sm">{r.userName || 'User'}</span>
                    <span className="text-amber-400 text-sm">{'★'.repeat(r.rating)}</span>
                  </div>
                  <p className="text-white/60 text-sm mt-2">{r.review}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}