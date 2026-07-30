'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Calendar, MapPin, Clock } from 'lucide-react';
import { api } from '@/lib/api';

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    async function loadEvents() {
      try {
        const res: any = await api.get('/events');
        setEvents(res.data || []);
      } catch (err) {
        console.error('Failed to load events:', err);
      }
    }
    loadEvents();
  }, []);

  return (
    <div className="min-h-screen bg-festival-dark text-white flex">
      <Sidebar />

      <div className="flex-1 ml-64 pt-16">
        <Header />

        <main className="p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Calendar className="w-7 h-7 text-festival-orange" />
              <span>Village Festival Events Directory</span>
            </h1>
            <p className="text-xs text-white/50 mt-1">
              List of all upcoming, ongoing, and completed festival events created by committee admins.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.length === 0 ? (
              <div className="col-span-full glass-card p-12 text-center text-white/40 italic">
                No festival events scheduled.
              </div>
            ) : (
              events.map((e) => (
                <div key={e.id} className="glass-card p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full bg-festival-orange/15 border border-festival-orange/30 text-festival-gold text-[10px] font-semibold">
                      {e.status}
                    </span>
                    <span className="text-xs text-white/40">
                      {new Date(e.date).toLocaleDateString('en-IN')}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white">{e.name}</h3>
                    <p className="text-xs text-festival-cream">🏛️ {e.committee?.name}</p>
                  </div>

                  <p className="text-xs text-white/60 line-clamp-2">{e.description || 'Village festival event.'}</p>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-white/50">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-festival-crimson" />
                      <span>{e.venue || e.committee?.village}</span>
                    </span>
                    {e.budget && (
                      <span className="font-semibold text-emerald-400">Budget: ₹{e.budget.toLocaleString('en-IN')}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
