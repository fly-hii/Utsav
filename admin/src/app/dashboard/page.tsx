'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import {
  Building2,
  FileCheck,
  Users,
  HeartHandshake,
  Receipt,
  Film,
  TrendingUp,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
} from 'lucide-react';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const res: any = await api.get('/admin/dashboard');
        setStats(res.data);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  return (
    <div className="min-h-screen bg-festival-dark text-white flex">
      <Sidebar />

      <div className="flex-1 ml-64 pt-16">
        <Header />

        <main className="p-8 space-y-8">
          {/* Welcome Banner */}
          <div className="glass-card p-6 relative overflow-hidden flex items-center justify-between">
            <div className="relative z-10">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-festival-cream to-festival-gold bg-clip-text text-transparent">
                Welcome to Utsav Ecosystem Admin 🎪
              </h2>
              <p className="text-sm text-white/60 mt-1">
                Monitor festival committee registrations, verify documents, track village donations & expenses.
              </p>
            </div>
            <Link
              href="/committees/requests"
              className="glass-btn px-4 py-2.5 text-xs flex items-center gap-2 font-semibold relative z-10"
            >
              <FileCheck className="w-4 h-4" />
              <span>Review Pending Requests</span>
            </Link>
            <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-festival-orange/20 to-transparent pointer-events-none" />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Approved Committees */}
            <div className="glass-card p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white/60">ACTIVE COMMITTEES</span>
                <div className="p-2.5 rounded-xl bg-festival-orange/15 border border-festival-orange/30 text-festival-orange">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-extrabold">{stats?.stats?.approvedCommittees ?? 0}</p>
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Verified Village Committees</span>
              </div>
            </div>

            {/* Pending Requests */}
            <div className="glass-card p-6 space-y-3 border-amber-500/30 bg-amber-500/5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-300">PENDING APPROVALS</span>
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-amber-200">{stats?.stats?.pendingCommittees ?? 0}</p>
              <div className="flex items-center gap-1.5 text-xs text-amber-300 font-medium">
                <span>Requires Document Review</span>
              </div>
            </div>

            {/* Total Donations */}
            <div className="glass-card p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white/60">TOTAL DONATIONS</span>
                <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  <HeartHandshake className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-emerald-300">
                ₹{(stats?.stats?.totalDonationsAmount ?? 0).toLocaleString('en-IN')}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                <span>Across All Villages</span>
              </div>
            </div>

            {/* Total Expenses */}
            <div className="glass-card p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white/60">TOTAL EXPENSES</span>
                <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400">
                  <Receipt className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-rose-300">
                ₹{(stats?.stats?.totalExpensesAmount ?? 0).toLocaleString('en-IN')}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-rose-400 font-medium">
                <span>Transparent Village Spending</span>
              </div>
            </div>
          </div>

          {/* Pending Approval Requests Section */}
          <div className="glass-card p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-festival-saffron" />
                  <span>Pending Committee Approval Requests</span>
                </h3>
                <p className="text-xs text-white/50">Committees waiting for document verification & activation</p>
              </div>
              <Link
                href="/committees/requests"
                className="text-xs text-festival-saffron hover:underline flex items-center gap-1 font-semibold"
              >
                <span>View All Requests</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-white/50 uppercase font-semibold">
                    <th className="py-3 px-4">Committee & Temple</th>
                    <th className="py-3 px-4">Village / Location</th>
                    <th className="py-3 px-4">President & Phone</th>
                    <th className="py-3 px-4">Documents</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {stats?.recentPendingCommittees?.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-white/40 italic">
                        No pending committee approval requests.
                      </td>
                    </tr>
                  ) : (
                    stats?.recentPendingCommittees?.map((committee: any) => (
                      <tr key={committee.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-white">{committee.name}</p>
                          <p className="text-[11px] text-festival-cream">{committee.templeName}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="text-white/80">{committee.village}</p>
                          <p className="text-[11px] text-white/40">{committee.district}, {committee.state}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="text-white/90">{committee.presidentName}</p>
                          <p className="text-[11px] text-white/50">{committee.phone}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 text-[10px] font-semibold">
                            {committee.documents?.length || 0} Docs Uploaded
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-semibold flex items-center gap-1 w-max">
                            <Clock className="w-3 h-3" />
                            <span>PENDING</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/committees/requests`}
                            className="glass-btn-secondary px-3 py-1.5 text-[11px] inline-flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5 text-festival-orange" />
                            <span>Review</span>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
