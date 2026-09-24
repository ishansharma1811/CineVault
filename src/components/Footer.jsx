import React from 'react';
import { Film, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black mt-16">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
              <Film className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">Cine<span className="text-red-500">Vault</span></span>
          </div>
          <p className="text-sm text-white/50">Your Movies. Your Seats. Your Experience.</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white mb-3">Explore</h4>
          <ul className="space-y-2 text-sm text-white/50">
            <li><Link to="/" className="hover:text-red-500">Now Showing</Link></li>
            <li><Link to="/assistant" className="hover:text-red-500">AI Assistant</Link></li>
            <li><Link to="/bookings" className="hover:text-red-500">My Bookings</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white mb-3">Support</h4>
          <ul className="space-y-2 text-sm text-white/50">
            <li>Help Center</li>
            <li>Terms of Use</li>
            <li>Privacy Policy</li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white mb-3">Contact</h4>
          <ul className="space-y-2 text-sm text-white/50">
            <li className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> support@cinevault.com</li>
            <li className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> 1800-CINEVAULT</li>
            <li className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> Jaipur, India</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/40">
        © {new Date().getFullYear()} CineVault. A demo project. All movie data is fictional.
      </div>
    </footer>
  );
}