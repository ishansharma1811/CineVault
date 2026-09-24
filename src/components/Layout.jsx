import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0b] text-white">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}