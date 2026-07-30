'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { BarChart3, TrendingUp, DollarSign, Users, Building2, Film } from 'lucide-react';
import { api } from '@/lib/api';

export default function ReportsPage() {
  const [platformData, setPlatformData] = useState<any>(null);

  useEffect(() => {
    async function loadReports() {
      try {
        const res: any = await api.get('/reports/platform');
        setPlatformData(res.data);
      } catch (err) {
        console.error('Failed to load report data:', err);
      }
    }
    loadReports();
  }, []);

  return (
    <div className="min-h-screen bg-festival-dark text-white flex">
      <Sidebar />

      <div className="flex-1 ml-64 pt-16">
        <Header />

        <main className="p-8 space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <BarChart3 className="w-7 h-7 text-festival-gold" />
              <span>Platform Analytics & Financial Reports</span>
            </h1>
            <p className="text-xs text-white/50 mt-1">
              Consolidated financial breakdown, engagement metrics, and growth indicators.
            </p>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-white/50">
                <span>TOTAL DONATIONS COLLECTED</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-3xl font-extrabold text-emerald-300">
                ₹{(platformData?.financials?.donationsAmount ?? 0).toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-white/40">{platformData?.financials?.donationsCount ?? 0} Recorded Donations</p>
            </div>

            <div className="glass-card p-6 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-white/50">
                <span>TOTAL EXPENSES SPENT</span>
                <DollarSign className="w-4 h-4 text-rose-400" />
              </div>
              <p className="text-3xl font-extrabold text-rose-300">
                ₹{(platformData?.financials?.expensesAmount ?? 0).toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-white/40">{platformData?.financials?.expensesCount ?? 0} Verified Expense Bills</p>
            </div>

            <div className="glass-card p-6 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-white/50">
                <span>NET FESTIVAL BALANCE</span>
                <TrendingUp className="w-4 h-4 text-festival-gold" />
              </div>
              <p className="text-3xl font-extrabold text-festival-gold">
                ₹{(
                  (platformData?.financials?.donationsAmount ?? 0) -
                  (platformData?.financials?.expensesAmount ?? 0)
                ).toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-white/40">Remaining Funds across all committees</p>
            </div>
          </div>

          {/* Engagement breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-festival-orange" />
                <span>Committee Growth</span>
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-white/70">Active Approved Committees</span>
                  <span className="font-bold text-emerald-400">{platformData?.committees?.active ?? 0}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-white/70">Pending Verification</span>
                  <span className="font-bold text-amber-300">{platformData?.committees?.pending ?? 0}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-white/70">Registered Villagers / Users</span>
                  <span className="font-bold text-white">{platformData?.users ?? 0}</span>
                </div>
              </div>
            </div>

            <div className="glass-card p-6 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Film className="w-5 h-5 text-festival-saffron" />
                <span>Content & Event Engagement</span>
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-white/70">Published Festival Reels</span>
                  <span className="font-bold text-festival-saffron">{platformData?.reels ?? 0}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-white/70">Scheduled Festival Events</span>
                  <span className="font-bold text-white">{platformData?.events ?? 0}</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
