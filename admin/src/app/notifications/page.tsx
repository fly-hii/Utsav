'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Bell, Send } from 'lucide-react';

export default function NotificationsPage() {
  return (
    <div className="min-h-screen bg-festival-dark text-white flex">
      <Sidebar />

      <div className="flex-1 ml-64 pt-16">
        <Header />

        <main className="p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Bell className="w-7 h-7 text-festival-saffron" />
              <span>Broadcast Announcements & Push Notifications</span>
            </h1>
            <p className="text-xs text-white/50 mt-1">
              Send system announcements to all committee admins, members, or villagers.
            </p>
          </div>

          <div className="glass-card p-6 max-w-xl space-y-4">
            <h3 className="text-base font-bold text-white">Send Broadcast Announcement</h3>
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1">Title</label>
              <input
                type="text"
                placeholder="e.g. Festival Season Guidelines 2026"
                className="w-full glass-input text-xs p-3 text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1">Announcement Body</label>
              <textarea
                rows={4}
                placeholder="Write message content for committees and villagers..."
                className="w-full glass-input text-xs p-3 text-white focus:outline-none"
              />
            </div>
            <button
              onClick={() => alert('Broadcast announcement sent to all users!')}
              className="glass-btn w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Send Broadcast Now</span>
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
