'use client';

import { useState, useEffect } from 'react';
import { Bell, Search, User, ShieldCheck } from 'lucide-react';

export function Header() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user');
      if (stored) setUser(JSON.parse(stored));
    }
  }, []);

  return (
    <header className="h-16 glass-header fixed top-0 right-0 left-64 z-40 flex items-center justify-between px-6">
      {/* Search */}
      <div className="relative w-80">
        <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search committees, users, events..."
          className="w-full glass-input text-xs pl-9 pr-4 py-2 text-white placeholder-white/40 focus:outline-none"
        />
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-4">
        {/* Role Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-festival-orange/15 border border-festival-orange/30 text-festival-gold text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-festival-orange" />
          <span>SUPER ADMIN</span>
        </div>

        {/* Notifications Icon */}
        <button className="relative p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-all">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-festival-crimson"></span>
        </button>

        {/* User Profile Avatar */}
        <div className="flex items-center gap-3 pl-2 border-l border-white/10">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-festival-saffron to-festival-crimson flex items-center justify-center font-bold text-sm text-white shadow-md">
            {user?.name?.[0] || 'A'}
          </div>
          <div className="text-left">
            <p className="text-xs font-semibold text-white">{user?.name || 'Super Admin'}</p>
            <p className="text-[10px] text-white/50">{user?.phone || 'admin@utsav.com'}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
