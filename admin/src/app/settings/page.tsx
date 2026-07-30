'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Settings, Shield, Database, Cloud } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-festival-dark text-white flex">
      <Sidebar />

      <div className="flex-1 ml-64 pt-16">
        <Header />

        <main className="p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Settings className="w-7 h-7 text-festival-gold" />
              <span>Platform Settings & Infrastructure Config</span>
            </h1>
            <p className="text-xs text-white/50 mt-1">
              Configuration details for AWS S3 bucket storage, MySQL database, and WebSocket cluster.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Cloud className="w-4 h-4 text-festival-orange" />
                <span>AWS S3 Media Storage</span>
              </h3>
              <div className="text-xs space-y-2 text-white/70">
                <p>Bucket: <code className="text-festival-cream">utsav-media</code></p>
                <p>Region: <code className="text-festival-cream">ap-south-1 (Mumbai)</code></p>
                <p>Folders: committee-logos, festival-reels, expense-bills, receipts</p>
              </div>
            </div>

            <div className="glass-card p-6 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>MySQL 8 & Prisma ORM</span>
              </h3>
              <div className="text-xs space-y-2 text-white/70">
                <p>Database Engine: <code className="text-festival-cream">MySQL 8.0</code></p>
                <p>ORM Client: <code className="text-festival-cream">Prisma ORM Client v6</code></p>
                <p>Models Configured: <code className="text-emerald-300">17 Core Tables</code></p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
