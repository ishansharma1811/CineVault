const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useState } from 'react';
import { User, Mail, Phone, MapPin, Save } from 'lucide-react';

import { useAuth } from '@/lib/AuthContext';
import { useCity, CITIES } from '@/context/CityContext';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

export default function Profile() {
  const { user, checkUserAuth } = useAuth();
  const { setCity } = useCity();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [cityVal, setCityVal] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(user?.full_name || '');
    setPhone(user?.phone || '');
    setCityVal(user?.city || '');
  }, [user]);

  const save = async () => {
    setSaving(true);
    try {
      await db.auth.updateMe({ full_name: name, phone, city: cityVal });
      if (cityVal) setCity(cityVal);
      await checkUserAuth();
      toast({ title: 'Profile updated' });
    } catch (e) { toast({ title: 'Update failed', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">My Profile</h1>
      <div className="rounded-2xl bg-zinc-900 border border-white/5 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white text-2xl font-bold">
            {(user?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-white">{user?.full_name || 'User'}</p>
            <p className="text-sm text-white/50">{user?.email}</p>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-600/20 text-red-400 mt-1 inline-block uppercase">{user?.role}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-white/40 uppercase tracking-wide flex items-center gap-1"><User className="w-3 h-3" /> Full Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500/50" />
          </div>
          <div>
            <label className="text-xs text-white/40 uppercase tracking-wide flex items-center gap-1"><Mail className="w-3 h-3" /> Email</label>
            <input value={user?.email || ''} disabled className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white/50 outline-none" />
          </div>
          <div>
            <label className="text-xs text-white/40 uppercase tracking-wide flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Add phone number" className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500/50" />
          </div>
          <div>
            <label className="text-xs text-white/40 uppercase tracking-wide flex items-center gap-1"><MapPin className="w-3 h-3" /> City</label>
            <select value={cityVal} onChange={e => setCityVal(e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500/50">
              <option value="" className="bg-zinc-900">Select city</option>
              {CITIES.map(c => <option key={c} value={c} className="bg-zinc-900">{c}</option>)}
            </select>
          </div>
          <Button onClick={save} disabled={saving} className="bg-red-600 hover:bg-red-700"><Save className="w-4 h-4 mr-1" /> {saving ? 'Saving...' : 'Save Changes'}</Button>
        </div>
      </div>
    </div>
  );
}