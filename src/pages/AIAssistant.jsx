const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useState } from 'react';
import { Sparkles, Send, Loader2, Wand2 } from 'lucide-react';

import MovieCard from '@/components/MovieCard';
import { Button } from '@/components/ui/button';

const SUGGESTIONS = [
  'A thrilling sci-fi movie with a strong story',
  'A romantic drama to watch with family',
  'A fun comedy for the weekend',
  'An action-packed adventure'
];

export default function AIAssistant() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const recommend = async (q) => {
    const text = q ?? query;
    if (!text.trim()) return;
    setLoading(true); setResults(null);
    try {
      const res = await db.functions.invoke('getRecommendations', { query: text });
      const data = res.data || res;
      setResults(data.recommendations || []);
    } catch (e) { setResults([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { recommend('thrilling sci-fi'); }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="text-center mb-8">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center mb-3 shadow-lg shadow-red-900/40">
          <Sparkles className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">AI Movie Assistant</h1>
        <p className="text-white/60 text-sm mt-1 max-w-md mx-auto">Tell us what you're in the mood for. Our recommendation engine matches your vibe to movies using metadata similarity.</p>
      </div>

      <div className="flex gap-2 max-w-2xl mx-auto">
        <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2.5 focus-within:border-red-500/50">
          <Wand2 className="w-4 h-4 text-red-500" />
          <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && recommend()} placeholder="e.g. I want a thrilling sci-fi movie with a strong story" className="bg-transparent outline-none text-sm text-white placeholder:text-white/40 flex-1" />
        </div>
        <Button onClick={() => recommend()} disabled={loading} className="bg-red-600 hover:bg-red-700 rounded-full">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>

      <div className="flex flex-wrap justify-center gap-2 mt-4">
        {SUGGESTIONS.map(s => (
          <button key={s} onClick={() => { setQuery(s); recommend(s); }} className="text-xs px-3 py-1.5 rounded-full border border-white/15 text-white/70 hover:bg-white/5 transition">{s}</button>
        ))}
      </div>

      <div className="mt-10">
        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-8 h-8 text-red-600 animate-spin mx-auto" /></div>
        ) : results && results.length === 0 ? (
          <p className="text-center text-white/50 py-12">No matches found. Try a different mood.</p>
        ) : results ? (
          <>
            <h2 className="text-sm text-white/50 mb-4">Recommended for you</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {results.map(m => <MovieCard key={m.id} movie={m} />)}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}