const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

import { useAuth } from '@/lib/AuthContext';
import MovieCard from '@/components/MovieCard';
import { Button } from '@/components/ui/button';

export default function Wishlist() {
  const { user } = useAuth();
  const [items, setItems] = useState(null);
  const [movies, setMovies] = useState([]);

  const load = async () => {
    try {
      const wl = await db.entities.Wishlist.filter({ userId: user.id });
      setItems(wl);
      const ms = await Promise.all(wl.map(w => db.entities.Movie.get(w.movieId).catch(() => null)));
      setMovies(ms.filter(Boolean));
    } catch (e) { setItems([]); }
  };

  useEffect(() => { load(); }, [user]);

  if (items === null) return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-8 h-8 border-4 border-white/20 border-t-red-600 rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">My Wishlist</h1>
      {movies.length === 0 ? (
        <div className="text-center py-16">
          <Heart className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/50">Your wishlist is empty.</p>
          <Link to="/"><Button className="mt-4 bg-red-600 hover:bg-red-700">Browse Movies</Button></Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {movies.map(m => <MovieCard key={m.id} movie={m} />)}
        </div>
      )}
    </div>
  );
}