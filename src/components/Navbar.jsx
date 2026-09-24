import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Film, Search, MapPin, User, Menu, X, Heart, Ticket, Sparkles, LayoutDashboard, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useCity } from '@/context/CityContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { city, setCity, cities } = useCity();
  const [search, setSearch] = useState('');
  const [cityOpen, setCityOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const submitSearch = (e) => {
    e.preventDefault();
    navigate(`/?search=${encodeURIComponent(search)}`);
    setMenuOpen(false);
  };

  const navLinks = [
    { to: '/', label: 'Movies' },
    { to: '/bookings', label: 'My Bookings' },
    { to: '/wishlist', label: 'Wishlist' },
    { to: '/assistant', label: 'AI Assistant' }
  ];
  if (user?.role === 'admin') navLinks.push({ to: '/admin', label: 'Admin' });

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/70 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-4 h-16">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-lg shadow-red-900/40">
              <Film className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Cine<span className="text-red-500">Vault</span>
            </span>
          </Link>

          <form onSubmit={submitSearch} className="hidden md:flex flex-1 max-w-md items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 focus-within:border-red-500/50 transition">
            <Search className="w-4 h-4 text-white/50" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search movies, genres, cast..."
              className="bg-transparent outline-none text-sm text-white placeholder:text-white/40 flex-1"
            />
          </form>

          <div className="relative hidden sm:block">
            <button onClick={() => setCityOpen(o => !o)} className="flex items-center gap-1.5 text-sm text-white/80 hover:text-white px-3 py-2 rounded-full hover:bg-white/5 transition">
              <MapPin className="w-4 h-4 text-red-500" />
              {city}
            </button>
            {cityOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl py-1 z-50">
                {cities.map(c => (
                  <button key={c} onClick={() => { setCity(c); setCityOpen(false); }} className={cn('w-full text-left px-4 py-2 text-sm hover:bg-white/5 transition', c === city ? 'text-red-500' : 'text-white/80')}>
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="hidden md:flex items-center gap-1 ml-auto">
            {navLinks.map(l => (
              <Link key={l.to} to={l.to} className={cn('px-3 py-2 text-sm rounded-full transition', location.pathname === l.to ? 'text-red-500' : 'text-white/70 hover:text-white hover:bg-white/5')}>
                {l.label}
              </Link>
            ))}
          </div>

          {isAuthenticated ? (
            <div className="relative ml-auto md:ml-2">
              <button onClick={() => setProfileOpen(o => !o)} className="w-9 h-9 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white text-sm font-semibold">
                {(user?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
              </button>
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl py-2 z-50">
                  <div className="px-4 py-2 border-b border-white/10">
                    <p className="text-sm font-medium text-white truncate">{user?.full_name || 'User'}</p>
                    <p className="text-xs text-white/50 truncate">{user?.email}</p>
                  </div>
                  <Link to="/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-white/80 hover:bg-white/5"><User className="w-4 h-4" /> Profile</Link>
                  <Link to="/bookings" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-white/80 hover:bg-white/5"><Ticket className="w-4 h-4" /> My Bookings</Link>
                  <Link to="/wishlist" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-white/80 hover:bg-white/5"><Heart className="w-4 h-4" /> Wishlist</Link>
                  {user?.role === 'admin' && <Link to="/admin" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-white/80 hover:bg-white/5"><LayoutDashboard className="w-4 h-4" /> Admin</Link>}
                  <button onClick={() => { setProfileOpen(false); logout(); }} className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-white/5 w-full"><LogOut className="w-4 h-4" /> Logout</button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2 ml-auto">
              <Link to="/login"><Button variant="ghost" size="sm" className="text-white hover:text-white hover:bg-white/10">Login</Button></Link>
              <Link to="/register"><Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">Register</Button></Link>
            </div>
          )}

          <button className="md:hidden text-white ml-auto" onClick={() => setMenuOpen(o => !o)}>
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <form onSubmit={submitSearch} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2">
              <Search className="w-4 h-4 text-white/50" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search movies..." className="bg-transparent outline-none text-sm text-white placeholder:text-white/40 flex-1" />
            </form>
            <div className="flex flex-wrap gap-1">
              {cities.map(c => (
                <button key={c} onClick={() => setCity(c)} className={cn('px-3 py-1 text-xs rounded-full border', c === city ? 'bg-red-600 text-white border-red-600' : 'border-white/10 text-white/70')}>{c}</button>
              ))}
            </div>
            {navLinks.map(l => (
              <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-white/80 hover:bg-white/5 rounded-lg">{l.label}</Link>
            ))}
            {!isAuthenticated && (
              <div className="flex gap-2 pt-2">
                <Link to="/login" className="flex-1"><Button variant="outline" size="sm" className="w-full border-white/20 text-white">Login</Button></Link>
                <Link to="/register" className="flex-1"><Button size="sm" className="w-full bg-red-600 hover:bg-red-700">Register</Button></Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}