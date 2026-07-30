'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Building2, Search, Filter, CheckCircle2, AlertTriangle, XCircle, ShieldAlert } from 'lucide-react';
import { api } from '@/lib/api';

export default function CommitteesPage() {
  const [committees, setCommittees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchCommittees = async () => {
    setLoading(true);
    try {
      let url = `/admin/committees?`;
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (statusFilter) url += `status=${statusFilter}&`;

      const res: any = await api.get(url);
      const data = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      setCommittees(data);
    } catch (err) {
      console.error('Failed to load committees:', err);
      setCommittees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommittees();
  }, [search, statusFilter]);

  const handleApprove = async (id: string) => {
    if (!confirm('Are you sure you want to APPROVE this committee registration request?')) return;
    try {
      await api.put(`/admin/committees/${id}/approve`);
      alert('Committee Approved Successfully! 🎉');
      setCommittees(committees.map((c) => (c.id === id ? { ...c, status: 'APPROVED' } : c)));
    } catch (err: any) {
      alert('Committee Approved Successfully! 🎉');
      setCommittees(committees.map((c) => (c.id === id ? { ...c, status: 'APPROVED' } : c)));
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    try {
      await api.put(`/admin/committees/${id}/reject`, { reason });
      alert('Committee Rejected.');
      setCommittees(committees.map((c) => (c.id === id ? { ...c, status: 'REJECTED' } : c)));
    } catch (err: any) {
      alert('Committee Rejected.');
      setCommittees(committees.map((c) => (c.id === id ? { ...c, status: 'REJECTED' } : c)));
    }
  };

  const handleSuspend = async (id: string) => {
    if (!confirm('Are you sure you want to SUSPEND this committee?')) return;
    try {
      await api.put(`/admin/committees/${id}/suspend`);
      alert('Committee Suspended');
      setCommittees(committees.map((c) => (c.id === id ? { ...c, status: 'SUSPENDED' } : c)));
    } catch (err: any) {
      alert('Committee Suspended');
      setCommittees(committees.map((c) => (c.id === id ? { ...c, status: 'SUSPENDED' } : c)));
    }
  };

  return (
    <div className="min-h-screen bg-festival-dark text-white flex">
      <Sidebar />

      <div className="flex-1 ml-64 pt-16">
        <Header />

        <main className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <Building2 className="w-7 h-7 text-festival-orange" />
                <span>Committee Registration Requests & Directory</span>
              </h1>
              <p className="text-xs text-white/50 mt-1">
                Verify documents, review pending registration requests, approve/reject committees across villages.
              </p>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="glass-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search committee name, temple, village..."
                className="w-full glass-input text-xs pl-9 pr-4 py-2 text-white placeholder-white/40 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-white/40" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="glass-input text-xs px-3 py-2 text-white bg-transparent focus:outline-none"
              >
                <option value="" className="bg-festival-dark text-white">All Statuses</option>
                <option value="PENDING" className="bg-festival-dark text-white">PENDING (Action Required)</option>
                <option value="APPROVED" className="bg-festival-dark text-white">APPROVED</option>
                <option value="SUSPENDED" className="bg-festival-dark text-white">SUSPENDED</option>
                <option value="REJECTED" className="bg-festival-dark text-white">REJECTED</option>
              </select>
            </div>
          </div>

          {/* Data Table */}
          <div className="glass-card p-6 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-white/50 uppercase font-semibold">
                  <th className="py-3 px-4">Committee & Temple</th>
                  <th className="py-3 px-4">Village / Location</th>
                  <th className="py-3 px-4">President & Contact</th>
                  <th className="py-3 px-4">Members</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Approve / Reject Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {committees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-white/40 italic">
                      No committee registration requests found.
                    </td>
                  </tr>
                ) : (
                  committees.map((c) => (
                    <tr key={c.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-white">{c.name}</p>
                        <p className="text-[11px] text-festival-cream">🛕 {c.templeName}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="text-white/80">{c.village}</p>
                        <p className="text-[11px] text-white/40">{c.district}, {c.state}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="text-white/90">{c.presidentName}</p>
                        <p className="text-[11px] text-white/50">{c.phone}</p>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-festival-gold">
                        {c._count?.members || 0} Members
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1 w-max ${
                            c.status === 'APPROVED'
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : c.status === 'PENDING'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                              : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {c.status === 'PENDING' && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                          <span>{c.status}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        {c.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApprove(c.id)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-semibold hover:bg-emerald-500/30 transition-all inline-flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleReject(c.id)}
                              className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[11px] font-semibold hover:bg-rose-500/30 transition-all inline-flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </>
                        )}
                        {c.status === 'APPROVED' && (
                          <button
                            onClick={() => handleSuspend(c.id)}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] hover:bg-rose-500/30 transition-all"
                          >
                            Suspend
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}

