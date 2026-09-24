const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useState, useCallback } from 'react';
import { LayoutDashboard, Film, Building2, CalendarDays, Ticket, Users, Tag, Plus, Trash2, Edit2, X, Database, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const EMPTY_MOVIE = { title: '', description: '', poster: '', backdrop: '', trailerUrl: '', genre: '', language: 'Hindi', duration: 120, rating: 8, certificate: 'UA', releaseDate: '', cast: '', director: '', status: 'NOW_SHOWING', featured: false };
const EMPTY_THEATRE = { name: '', city: 'Jaipur', address: '', facilities: '', screenCount: 4, rating: 4.5, image: '' };
const EMPTY_COUPON = { code: '', description: '', discountType: 'PERCENT', discountValue: 10, maxDiscount: 100, minAmount: 0, active: true };
const EMPTY_SHOW = { movieId: '', theatreId: '', screenName: 'Screen 1', date: '', startTime: '10:00 AM', endTime: '12:30 PM', ticketPrice: 250, rows: 8, cols: 10, premiumRows: 'E,F', city: 'Jaipur' };

export default function Admin() {
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [shows, setShows] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [seeding, setSeeding] = useState(false);
  const [editing, setEditing] = useState(null);

  const loadAll = useCallback(async () => {
    const [m, t, s, c, b, u] = await Promise.all([
      db.entities.Movie.list(),
      db.entities.Theatre.list(),
      db.entities.Show.list(),
      db.entities.Coupon.list(),
      db.entities.Booking.list(),
      db.entities.User.list()
    ]);
    setMovies(m); setTheatres(t); setShows(s); setCoupons(c); setBookings(b); setUsers(u);
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const res = await db.functions.invoke('adminStats', {});
      const data = res.data || res;
      if (data.success) setStats(data.stats);
    } catch (e) {}
  }, []);

  useEffect(() => { loadAll(); loadStats(); }, [loadAll, loadStats]);

  const seed = async () => {
    setSeeding(true);
    try {
      const res = await db.functions.invoke('seedData', {});
      const data = res.data || res;
      if (data.success) {
        toast({ title: 'Data seeded', description: `${data.counts.movies} movies, ${data.counts.shows} shows, ${data.counts.seats} seats` });
        loadAll(); loadStats();
      } else { toast({ title: data.message, variant: 'destructive' }); }
    } catch (e) { toast({ title: 'Seed failed', variant: 'destructive' }); }
    finally { setSeeding(false); }
  };

  if (user?.role !== 'admin') return <div className="min-h-[60vh] flex items-center justify-center text-center px-6"><div><p className="text-red-500 font-semibold">Admin access required</p><p className="text-white/50 text-sm mt-1">Your account needs the admin role.</p></div></div>;

  const tabs = [
    { k: 'overview', l: 'Overview', icon: LayoutDashboard },
    { k: 'movies', l: 'Movies', icon: Film },
    { k: 'theatres', l: 'Theatres', icon: Building2 },
    { k: 'shows', l: 'Shows', icon: CalendarDays },
    { k: 'coupons', l: 'Coupons', icon: Tag },
    { k: 'bookings', l: 'Bookings', icon: Ticket },
    { k: 'users', l: 'Users', icon: Users }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-white/50 text-sm">Manage CineVault content & operations</p>
        </div>
        <Button onClick={seed} disabled={seeding} className="bg-red-600 hover:bg-red-700"><Database className="w-4 h-4 mr-1" /> {seeding ? 'Seeding...' : 'Seed Demo Data'}</Button>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-2 mb-6 border-b border-white/10">
        {tabs.map(t => {
          const Icon = t.icon;
          return <button key={t.k} onClick={() => setTab(t.k)} className={`flex items-center gap-1.5 px-4 py-2 text-sm whitespace-nowrap border-b-2 transition ${tab === t.k ? 'border-red-500 text-red-500' : 'border-transparent text-white/60 hover:text-white'}`}><Icon className="w-4 h-4" /> {t.l}</button>;
        })}
      </div>

      {tab === 'overview' && <Overview stats={stats} bookings={bookings} />}
      {tab === 'movies' && <MoviesTab movies={movies} theatres={theatres} editing={editing} setEditing={setEditing} reload={loadAll} />}
      {tab === 'theatres' && <TheatresTab theatres={theatres} editing={editing} setEditing={setEditing} reload={loadAll} />}
      {tab === 'shows' && <ShowsTab shows={shows} movies={movies} theatres={theatres} reload={loadAll} />}
      {tab === 'coupons' && <CouponsTab coupons={coupons} reload={loadAll} />}
      {tab === 'bookings' && <BookingsTab bookings={bookings} />}
      {tab === 'users' && <UsersTab users={users} reload={loadAll} />}
    </div>
  );
}

function Overview({ stats, bookings }) {
  if (!stats) return <div className="text-white/50">Loading stats...</div>;
  const cards = [
    { l: 'Users', v: stats.totalUsers, c: 'from-blue-600 to-blue-800' },
    { l: 'Movies', v: stats.totalMovies, c: 'from-red-600 to-red-800' },
    { l: 'Theatres', v: stats.totalTheatres, c: 'from-purple-600 to-purple-800' },
    { l: 'Shows', v: stats.totalShows, c: 'from-amber-600 to-amber-800' },
    { l: 'Bookings', v: stats.totalBookings, c: 'from-green-600 to-green-800' },
    { l: "Today's", v: stats.todaysBookings, c: 'from-pink-600 to-pink-800' },
    { l: 'Revenue', v: `₹${stats.revenue}`, c: 'from-emerald-600 to-emerald-800' }
  ];
  const byMovie = {};
  bookings.forEach(b => { if (b.bookingStatus === 'CONFIRMED') byMovie[b.movieTitle] = (byMovie[b.movieTitle] || 0) + 1; });
  const chartData = Object.entries(byMovie).map(([name, count]) => ({ name: name.slice(0, 12), count })).slice(0, 8);
  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(c => (
          <div key={c.l} className={`rounded-2xl bg-gradient-to-br ${c.c} p-5`}>
            <p className="text-white/70 text-xs uppercase tracking-wide">{c.l}</p>
            <p className="text-white text-2xl font-bold mt-1">{c.v}</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl bg-zinc-900 border border-white/5 p-5">
        <div className="flex items-center gap-2 mb-4"><BarChart3 className="w-4 h-4 text-red-500" /><h3 className="font-semibold text-white">Bookings by Movie</h3></div>
        {chartData.length === 0 ? <p className="text-white/50 text-sm">No bookings yet.</p> : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="name" stroke="#ffffff60" fontSize={11} />
              <YAxis stroke="#ffffff60" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #ffffff20', borderRadius: 8 }} />
              <Bar dataKey="count" fill="#dc2626" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-white/50 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div className="mb-3">
      <label className="text-xs text-white/40 uppercase tracking-wide">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-red-500/50" />
    </div>
  );
}

function MoviesTab({ movies, editing, setEditing, reload }) {
  const [form, setForm] = useState(EMPTY_MOVIE);
  const open = (m) => {
    setEditing('movie');
    setForm(m ? { ...m, genre: (m.genre || []).join(', '), cast: (m.cast || []).join(', ') } : EMPTY_MOVIE);
  };
  const save = async () => {
    const payload = { ...form, genre: form.genre.split(',').map(s => s.trim()).filter(Boolean), cast: form.cast.split(',').map(s => s.trim()).filter(Boolean), duration: Number(form.duration), rating: Number(form.rating), featured: !!form.featured };
    try {
      if (form.id) await db.entities.Movie.update(form.id, payload);
      else await db.entities.Movie.create(payload);
      toast({ title: form.id ? 'Movie updated' : 'Movie added' });
      setEditing(null); reload();
    } catch (e) { toast({ title: 'Save failed', variant: 'destructive' }); }
  };
  const del = async (id) => { if (!confirm('Delete this movie?')) return; await db.entities.Movie.delete(id); toast({ title: 'Deleted' }); reload(); };
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-white">Movies ({movies.length})</h2>
        <Button onClick={() => open(null)} size="sm" className="bg-red-600 hover:bg-red-700"><Plus className="w-4 h-4 mr-1" /> Add Movie</Button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {movies.map(m => (
          <div key={m.id} className="rounded-xl bg-zinc-900 border border-white/5 p-3 flex gap-3">
            <img src={m.poster} alt={m.title} className="w-14 h-20 rounded object-cover" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white text-sm truncate">{m.title}</p>
              <p className="text-xs text-white/50">{(m.genre || []).join(', ')}</p>
              <p className="text-xs text-white/40">★ {m.rating} · {m.status}</p>
              <div className="flex gap-1 mt-2">
                <Button size="sm" variant="outline" onClick={() => open(m)} className="h-7 px-2 border-white/20 text-white"><Edit2 className="w-3 h-3" /></Button>
                <Button size="sm" variant="outline" onClick={() => del(m.id)} className="h-7 px-2 border-white/20 text-red-400"><Trash2 className="w-3 h-3" /></Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {editing === 'movie' && (
        <Modal title={form.id ? 'Edit Movie' : 'Add Movie'} onClose={() => setEditing(null)}>
          <Field label="Title" value={form.title} onChange={v => setForm({ ...form, title: v })} />
          <div className="mb-3"><label className="text-xs text-white/40 uppercase tracking-wide">Description</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-red-500/50" rows={3} /></div>
          <Field label="Poster URL" value={form.poster} onChange={v => setForm({ ...form, poster: v })} />
          <Field label="Backdrop URL" value={form.backdrop} onChange={v => setForm({ ...form, backdrop: v })} />
          <Field label="Trailer URL" value={form.trailerUrl} onChange={v => setForm({ ...form, trailerUrl: v })} />
          <Field label="Genre (comma separated)" value={form.genre} onChange={v => setForm({ ...form, genre: v })} />
          <Field label="Cast (comma separated)" value={form.cast} onChange={v => setForm({ ...form, cast: v })} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Language" value={form.language} onChange={v => setForm({ ...form, language: v })} />
            <Field label="Director" value={form.director} onChange={v => setForm({ ...form, director: v })} />
            <Field label="Duration (min)" type="number" value={form.duration} onChange={v => setForm({ ...form, duration: v })} />
            <Field label="Rating" type="number" value={form.rating} onChange={v => setForm({ ...form, rating: v })} />
            <Field label="Certificate" value={form.certificate} onChange={v => setForm({ ...form, certificate: v })} />
            <Field label="Release Date" type="date" value={form.releaseDate} onChange={v => setForm({ ...form, releaseDate: v })} />
          </div>
          <div className="flex items-center gap-4 mb-3">
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
              <option value="NOW_SHOWING" className="bg-zinc-900">NOW_SHOWING</option>
              <option value="COMING_SOON" className="bg-zinc-900">COMING_SOON</option>
              <option value="ENDED" className="bg-zinc-900">ENDED</option>
            </select>
            <label className="flex items-center gap-2 text-sm text-white/70"><input type="checkbox" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} /> Featured</label>
          </div>
          <Button onClick={save} className="w-full bg-red-600 hover:bg-red-700">Save</Button>
        </Modal>
      )}
    </div>
  );
}

function TheatresTab({ theatres, editing, setEditing, reload }) {
  const [form, setForm] = useState(EMPTY_THEATRE);
  const open = (t) => { setEditing('theatre'); setForm(t ? { ...t, facilities: (t.facilities || []).join(', ') } : EMPTY_THEATRE); };
  const save = async () => {
    const payload = { ...form, facilities: form.facilities.split(',').map(s => s.trim()).filter(Boolean), screenCount: Number(form.screenCount), rating: Number(form.rating) };
    try {
      if (form.id) await db.entities.Theatre.update(form.id, payload);
      else await db.entities.Theatre.create(payload);
      toast({ title: form.id ? 'Theatre updated' : 'Theatre added' }); setEditing(null); reload();
    } catch (e) { toast({ title: 'Save failed', variant: 'destructive' }); }
  };
  const del = async (id) => { if (!confirm('Delete theatre?')) return; await db.entities.Theatre.delete(id); toast({ title: 'Deleted' }); reload(); };
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-white">Theatres ({theatres.length})</h2>
        <Button onClick={() => open(null)} size="sm" className="bg-red-600 hover:bg-red-700"><Plus className="w-4 h-4 mr-1" /> Add Theatre</Button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {theatres.map(t => (
          <div key={t.id} className="rounded-xl bg-zinc-900 border border-white/5 p-3">
            <p className="font-medium text-white text-sm">{t.name}</p>
            <p className="text-xs text-white/50">{t.city} · ★ {t.rating}</p>
            <p className="text-xs text-white/40 truncate">{t.address}</p>
            <div className="flex gap-1 mt-2">
              <Button size="sm" variant="outline" onClick={() => open(t)} className="h-7 px-2 border-white/20 text-white"><Edit2 className="w-3 h-3" /></Button>
              <Button size="sm" variant="outline" onClick={() => del(t.id)} className="h-7 px-2 border-white/20 text-red-400"><Trash2 className="w-3 h-3" /></Button>
            </div>
          </div>
        ))}
      </div>
      {editing === 'theatre' && (
        <Modal title={form.id ? 'Edit Theatre' : 'Add Theatre'} onClose={() => setEditing(null)}>
          <Field label="Name" value={form.name} onChange={v => setForm({ ...form, name: v })} />
          <Field label="City" value={form.city} onChange={v => setForm({ ...form, city: v })} />
          <Field label="Address" value={form.address} onChange={v => setForm({ ...form, address: v })} />
          <Field label="Facilities (comma separated)" value={form.facilities} onChange={v => setForm({ ...form, facilities: v })} />
          <Field label="Image URL" value={form.image} onChange={v => setForm({ ...form, image: v })} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Screens" type="number" value={form.screenCount} onChange={v => setForm({ ...form, screenCount: v })} />
            <Field label="Rating" type="number" value={form.rating} onChange={v => setForm({ ...form, rating: v })} />
          </div>
          <Button onClick={save} className="w-full bg-red-600 hover:bg-red-700">Save</Button>
        </Modal>
      )}
    </div>
  );
}

function ShowsTab({ shows, movies, theatres, reload }) {
  const [form, setForm] = useState(EMPTY_SHOW);
  const save = async () => {
    if (!form.movieId || !form.theatreId || !form.date) { toast({ title: 'Movie, theatre & date required', variant: 'destructive' }); return; }
    try {
      const theatre = theatres.find(t => t.id === form.theatreId);
      const payload = { ...form, ticketPrice: Number(form.ticketPrice), rows: Number(form.rows), cols: Number(form.cols), premiumRows: form.premiumRows.split(',').map(s => s.trim()).filter(Boolean), city: theatre?.city || form.city };
      const show = await db.entities.Show.create(payload);
      // generate seats
      const ROWS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'.slice(0, payload.rows).split('');
      const seats = [];
      for (const row of ROWS) for (let c = 1; c <= payload.cols; c++) seats.push({ showId: show.id, seatId: `${row}${c}`, row, number: c, category: payload.premiumRows.includes(row) ? 'PREMIUM' : 'STANDARD', status: 'AVAILABLE' });
      for (let i = 0; i < seats.length; i += 500) await db.entities.Seat.bulkCreate(seats.slice(i, i + 500));
      toast({ title: 'Show created', description: `${seats.length} seats generated` });
      setForm(EMPTY_SHOW); reload();
    } catch (e) { toast({ title: 'Create failed', variant: 'destructive' }); }
  };
  const del = async (id) => { if (!confirm('Delete show & its seats?')) return; await db.entities.Show.delete(id); await db.entities.Seat.deleteMany({ showId: id }); toast({ title: 'Deleted' }); reload(); };
  const movieMap = Object.fromEntries(movies.map(m => [m.id, m.title]));
  const theatreMap = Object.fromEntries(theatres.map(t => [t.id, t.name]));
  return (
    <div>
      <h2 className="font-semibold text-white mb-4">Create Show</h2>
      <div className="rounded-2xl bg-zinc-900 border border-white/5 p-4 mb-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div><label className="text-xs text-white/40 uppercase">Movie</label><select value={form.movieId} onChange={e => setForm({ ...form, movieId: e.target.value })} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"><option value="" className="bg-zinc-900">Select</option>{movies.map(m => <option key={m.id} value={m.id} className="bg-zinc-900">{m.title}</option>)}</select></div>
        <div><label className="text-xs text-white/40 uppercase">Theatre</label><select value={form.theatreId} onChange={e => setForm({ ...form, theatreId: e.target.value })} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"><option value="" className="bg-zinc-900">Select</option>{theatres.map(t => <option key={t.id} value={t.id} className="bg-zinc-900">{t.name}</option>)}</select></div>
        <Field label="Screen" value={form.screenName} onChange={v => setForm({ ...form, screenName: v })} />
        <Field label="Date" type="date" value={form.date} onChange={v => setForm({ ...form, date: v })} />
        <Field label="Start Time" value={form.startTime} onChange={v => setForm({ ...form, startTime: v })} />
        <Field label="End Time" value={form.endTime} onChange={v => setForm({ ...form, endTime: v })} />
        <Field label="Ticket Price" type="number" value={form.ticketPrice} onChange={v => setForm({ ...form, ticketPrice: v })} />
        <Field label="Rows" type="number" value={form.rows} onChange={v => setForm({ ...form, rows: v })} />
        <Field label="Cols" type="number" value={form.cols} onChange={v => setForm({ ...form, cols: v })} />
        <Field label="Premium Rows (comma)" value={form.premiumRows} onChange={v => setForm({ ...form, premiumRows: v })} />
        <div className="sm:col-span-2 lg:col-span-3"><Button onClick={save} className="bg-red-600 hover:bg-red-700"><Plus className="w-4 h-4 mr-1" /> Create Show & Seats</Button></div>
      </div>
      <h3 className="font-semibold text-white mb-3">Existing Shows ({shows.length})</h3>
      <div className="space-y-2">
        {shows.slice(0, 20).map(s => (
          <div key={s.id} className="rounded-xl bg-zinc-900 border border-white/5 p-3 flex items-center justify-between">
            <div className="text-sm"><span className="text-white">{movieMap[s.movieId] || '?'}</span> <span className="text-white/50">· {theatreMap[s.theatreId] || '?'} · {s.screenName} · {s.date} {s.startTime}</span></div>
            <Button size="sm" variant="outline" onClick={() => del(s.id)} className="h-7 px-2 border-white/20 text-red-400"><Trash2 className="w-3 h-3" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function CouponsTab({ coupons, reload }) {
  const [form, setForm] = useState(EMPTY_COUPON);
  const save = async () => {
    try {
      const payload = { ...form, code: form.code.toUpperCase(), discountValue: Number(form.discountValue), maxDiscount: Number(form.maxDiscount), minAmount: Number(form.minAmount) };
      if (form.id) await db.entities.Coupon.update(form.id, payload);
      else await db.entities.Coupon.create(payload);
      toast({ title: 'Coupon saved' }); setForm(EMPTY_COUPON); reload();
    } catch (e) { toast({ title: 'Save failed', variant: 'destructive' }); }
  };
  const del = async (id) => { await db.entities.Coupon.delete(id); toast({ title: 'Deleted' }); reload(); };
  return (
    <div>
      <h2 className="font-semibold text-white mb-4">Coupons</h2>
      <div className="rounded-2xl bg-zinc-900 border border-white/5 p-4 mb-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <Field label="Code" value={form.code} onChange={v => setForm({ ...form, code: v })} />
        <Field label="Description" value={form.description} onChange={v => setForm({ ...form, description: v })} />
        <div><label className="text-xs text-white/40 uppercase">Type</label><select value={form.discountType} onChange={e => setForm({ ...form, discountType: e.target.value })} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"><option value="PERCENT" className="bg-zinc-900">PERCENT</option><option value="FLAT" className="bg-zinc-900">FLAT</option></select></div>
        <Field label="Value" type="number" value={form.discountValue} onChange={v => setForm({ ...form, discountValue: v })} />
        <Field label="Max Discount" type="number" value={form.maxDiscount} onChange={v => setForm({ ...form, maxDiscount: v })} />
        <Field label="Min Amount" type="number" value={form.minAmount} onChange={v => setForm({ ...form, minAmount: v })} />
        <div className="sm:col-span-2 lg:col-span-3 flex gap-2"><Button onClick={save} className="bg-red-600 hover:bg-red-700"><Plus className="w-4 h-4 mr-1" /> {form.id ? 'Update' : 'Add'} Coupon</Button>{form.id && <Button variant="outline" onClick={() => setForm(EMPTY_COUPON)} className="border-white/20 text-white">Cancel</Button>}</div>
      </div>
      <div className="space-y-2">
        {coupons.map(c => (
          <div key={c.id} className="rounded-xl bg-zinc-900 border border-white/5 p-3 flex items-center justify-between">
            <div><span className="font-mono font-semibold text-red-400">{c.code}</span> <span className="text-white/50 text-sm">· {c.description}</span></div>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={() => setForm(c)} className="h-7 px-2 border-white/20 text-white"><Edit2 className="w-3 h-3" /></Button>
              <Button size="sm" variant="outline" onClick={() => del(c.id)} className="h-7 px-2 border-white/20 text-red-400"><Trash2 className="w-3 h-3" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BookingsTab({ bookings }) {
  return (
    <div>
      <h2 className="font-semibold text-white mb-4">All Bookings ({bookings.length})</h2>
      <div className="overflow-x-auto rounded-2xl bg-zinc-900 border border-white/5">
        <table className="w-full text-sm">
          <thead className="text-white/40 text-xs uppercase"><tr><th className="text-left p-3">Ref</th><th className="text-left p-3">Movie</th><th className="text-left p-3">Seats</th><th className="text-left p-3">Amount</th><th className="text-left p-3">Status</th><th className="text-left p-3">Date</th></tr></thead>
          <tbody>
            {bookings.slice(0, 50).map(b => (
              <tr key={b.id} className="border-t border-white/5">
                <td className="p-3 font-mono text-white/70 text-xs">{b.bookingReference}</td>
                <td className="p-3 text-white">{b.movieTitle}</td>
                <td className="p-3 text-white/60">{(b.seats || []).join(', ')}</td>
                <td className="p-3 text-white">₹{b.amount}</td>
                <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full ${b.bookingStatus === 'CONFIRMED' ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>{b.bookingStatus}</span></td>
                <td className="p-3 text-white/50 text-xs">{b.showDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UsersTab({ users, reload }) {
  const toggleRole = async (u) => {
    try { await db.entities.User.update(u.id, { role: u.role === 'admin' ? 'user' : 'admin' }); toast({ title: 'Role updated' }); reload(); }
    catch (e) { toast({ title: 'Update failed', variant: 'destructive' }); }
  };
  return (
    <div>
      <h2 className="font-semibold text-white mb-4">Users ({users.length})</h2>
      <div className="space-y-2">
        {users.map(u => (
          <div key={u.id} className="rounded-xl bg-zinc-900 border border-white/5 p-3 flex items-center justify-between">
            <div><p className="text-white text-sm">{u.full_name || '—'} <span className="text-white/40">· {u.email}</span></p><p className="text-xs text-white/40">{u.phone || 'no phone'} · {u.city || 'no city'}</p></div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-red-600/20 text-red-400' : 'bg-white/5 text-white/60'}`}>{u.role}</span>
              <Button size="sm" variant="outline" onClick={() => toggleRole(u)} className="h-7 px-2 border-white/20 text-white">{u.role === 'admin' ? 'Make User' : 'Make Admin'}</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}