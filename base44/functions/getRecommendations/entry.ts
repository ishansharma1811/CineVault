const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { scoreMovie } from '../../shared/cinema.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { query } = body;
    const movies = await db.entities.Movie.filter({ status: 'NOW_SHOWING' });
    const scored = movies
      .map(m => ({ movie: m, score: scoreMovie(query, m) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map(x => x.movie);
    return Response.json({ success: true, query, recommendations: scored });
  } catch (error) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}