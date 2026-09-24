const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Sparkles, TrendingUp, Calendar, MapPin, Film, Search } from 'lucide-react';

import MovieCard from '@/components/MovieCard';
import { useCity } from '@/context/CityContext';
import { Image } from '@/components/ui/image';
import { Button } from '@/components/ui/button';

const CATEGORIES = ['Sci-Fi', 'Drama', 'Comedy', 'Thriller', 'Romance', 'Action', 'Horror', 'Adventure'];

function Section({ title, icon, children }) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-12">
      <div className="flex items-center gap-2 mb-5">
        {icon}
        <h2 className="text-xl sm:text-2xl font-bold text-white">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export default function Home() {
  const [searchParams] = useSearchParams();
  const search = (searchParams.get('search') || '').toLowerCase();
  const { city } = useCity();
  const [movies, setMovies] = useState(null);
  const [theatres, setTheatres] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCat, setActiveCat] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true); setError(null);
      try {
        const [m, t] = await Promise.all([
          db.entities.Movie.list(),
          db.entities.Theatre.list()
        ]);
        setMovies(m); setTheatres(t);
      } catch (e) { setError(e.message || 'Failed to load'); }
      finally { setLoading(false); }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!movies) return [];
    return movies.filter(m => {
      if (search) {
        const hay = [m.title, m.description, m.director, (m.genre || []).join(' '), (m.cast || []).join(' '), m.language].join(' ').toLowerCase();
        if (!hay.includes(search)) return false;
      }
      if (activeCat && !(m.genre || []).includes(activeCat)) return false;
      return true;
    });
  }, [movies, search, activeCat]);

  const nowShowing = filtered.filter(m => m.status === 'NOW_SHOWING');
  const comingSoon = filtered.filter(m => m.status === 'COMING_SOON');
  const popular = [...filtered].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 10);
  const featured = movies?.find(m => m.featured && m.status === 'NOW_SHOWING') || nowShowing[0];
  const cityTheatres = (theatres || []).filter(t => t.city === city);

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-white/20 border-t-red-600 rounded-full animate-spin" />
    </div>
  );
  if (error) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
      <p className="text-red-500 font-semibold">Something went wrong</p>
      <p className="text-white/50 text-sm mt-1">{error}</p>
      <p className="text-white/40 text-sm mt-3">If this is a fresh app, an admin must seed data from the Admin dashboard.</p>
    </div>
  );

  return (
    <div>
      {featured && !search && !activeCat && (
        <div className="relative h-[55vh] min-h-[400px] overflow-hidden">
          <Image src={featured.backdrop || featured.poster} alt={featured.title} fittingType="fill" className="absolute inset-0 w-full h-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0b]/90 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-6 pb-10">
            <span className="inline-flex items-center gap-1.5 bg-red-600/90 text-white text-xs font-semibold px-3 py-1 rounded-full mb-3"><Sparkles className="w-3 h-3" /> Featured</span>
            <h1 className="text-4xl sm:text-6xl font-bold text-white tracking-tight mb-2">{featured.title}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-white/70 mb-4">
              <span className="text-amber-400 font-semibold">★ {featured.rating?.toFixed(1)}</span>
              <span>•</span><span>{(featured.genre || []).join(', ')}</span>
              <span>•</span><span>{featured.language}</span>
              <span>•</span><span>{featured.certificate}</span>
            </div>
            <p className="text-white/70 max-w-xl text-sm sm:text-base line-clamp-2 mb-5">{featured.description}</p>
            <Link to={`/movie/${featured.id}`}><Button size="lg" className="bg-red-600 hover:bg-red-700 text-white">Book Now</Button></Link>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-red-600 to-red-800 text-white">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-3 text-sm">
          <MapPin className="w-4 h-4" />
          <span>Showing movies & theatres in <strong>{city}</strong></span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <span className="text-xs text-white/40 shrink-0">Categories:</span>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setActiveCat(activeCat === c ? null : c)} className={`shrink-0 px-3 py-1.5 text-xs rounded-full border transition ${activeCat === c ? 'bg-red-600 border-red-600 text-white' : 'border-white/15 text-white/70 hover:bg-white/5'}`}>{c}</button>
          ))}
        </div>
      </div>

      {(search || activeCat) ? (
        <Section title={`Search Results (${filtered.length})`} icon={<Search className="w-5 h-5 text-red-500" />}>
          {filtered.length === 0 ? (
            <p className="text-white/50 text-sm">No movies match your search.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filtered.map(m => <MovieCard key={m.id} movie={m} />)}
            </div>
          )}
        </Section>
      ) : (
        <>
          <Section title="Now Showing" icon={<Film className="w-5 h-5 text-red-500" />}>
            {nowShowing.length === 0 ? <p className="text-white/50 text-sm">No movies currently showing.</p> : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {nowShowing.map(m => <MovieCard key={m.id} movie={m} />)}
              </div>
            )}
          </Section>

          <div className="max-w-7xl mx-auto px-6 mt-12">
            <div className="rounded-2xl bg-gradient-to-r from-zinc-900 via-red-950/40 to-zinc-900 border border-red-900/30 p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-white">Unlock 10% off your next booking</h3>
                <p className="text-white/60 text-sm mt-1">Use code <span className="font-mono text-red-400 font-semibold">CINE10</span> at checkout.</p>
              </div>
              <Link to="/bookings"><Button className="bg-red-600 hover:bg-red-700">Explore</Button></Link>
            </div>
          </div>

          <Section title="Coming Soon" icon={<Calendar className="w-5 h-5 text-red-500" />}>
            {comingSoon.length === 0 ? <p className="text-white/50 text-sm">No upcoming movies.</p> : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {comingSoon.map(m => <MovieCard key={m.id} movie={m} />)}
              </div>
            )}
          </Section>

          <Section title="Popular This Week" icon={<TrendingUp className="w-5 h-5 text-red-500" />}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {popular.map(m => <MovieCard key={m.id} movie={m} />)}
            </div>
          </Section>

          <Section title={`Theatres in ${city}`} icon={<MapPin className="w-5 h-5 text-red-500" />}>
            {cityTheatres.length === 0 ? <p className="text-white/50 text-sm">No theatres listed in {city}.</p> : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cityTheatres.map(t => (
                  <div key={t.id} className="rounded-2xl overflow-hidden bg-zinc-900 border border-white/5 hover:border-red-500/30 transition">
                    <div className="h-32 overflow-hidden">
                      <Image src={t.image} alt={t.name} fittingType="fill" className="w-full h-full" />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-white">{t.name}</h3>
                      <p className="text-xs text-white/50 mt-1">{t.address}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-white/60">
                        <span className="text-amber-400">★ {t.rating?.toFixed(1)}</span>
                        <span>•</span><span>{t.screenCount} screens</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-3">
                        {(t.facilities || []).slice(0, 3).map(f => <span key={f} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/60 border border-white/10">{f}</span>)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </>
      )}
    </div>
  );
}