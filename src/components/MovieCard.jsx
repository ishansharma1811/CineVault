import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { Button } from '@/components/ui/button';

export default function MovieCard({ movie }) {
  if (!movie) return null;
  return (
    <Link to={`/movie/${movie.id}`} className="group block">
      <div className="relative rounded-2xl overflow-hidden bg-zinc-900 border border-white/5 transition-all duration-300 group-hover:border-red-500/40 group-hover:shadow-2xl group-hover:shadow-red-900/20 group-hover:-translate-y-1">
        <div className="aspect-[2/3] overflow-hidden">
          <Image src={movie.poster} alt={movie.title} fittingType="fill" className="w-full h-full transition-transform duration-500 group-hover:scale-105" />
        </div>
        <div className="absolute top-2 left-2 flex gap-1.5">
          <span className="bg-black/70 backdrop-blur text-amber-400 text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
            <Star className="w-3 h-3 fill-amber-400" /> {movie.rating?.toFixed(1)}
          </span>
        </div>
        {movie.status === 'COMING_SOON' && (
          <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">Soon</div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-3 pt-8">
          <h3 className="text-white font-semibold text-sm truncate">{movie.title}</h3>
          <div className="flex items-center gap-2 text-[11px] text-white/60 mt-0.5">
            <span>{movie.genre?.[0]}</span>
            <span>•</span>
            <span>{movie.language}</span>
          </div>
        </div>
      </div>
      {movie.status === 'NOW_SHOWING' && (
        <Button size="sm" className="w-full mt-2 bg-red-600 hover:bg-red-700 text-white">Book Now</Button>
      )}
      {movie.status === 'COMING_SOON' && (
        <Button size="sm" variant="outline" className="w-full mt-2 border-white/20 text-white/80 hover:bg-white/5">Notify Me</Button>
      )}
    </Link>
  );
}