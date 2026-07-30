'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { HeartHandshake, Search, Download } from 'lucide-react';
import { api } from '@/lib/api';

export default function DonationsPage() {
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAllDonations() {
      try {
        setLoading(true);
        const committeesRes: any = await api.get('/admin/committees?status=APPROVED');
        const commList = Array.isArray(committeesRes) ? committeesRes : Array.isArray(committeesRes?.data) ? committeesRes.data : [];
        
        if (commList.length > 0) {
          const promises = commList.map((c: any) =>
            api.get(`/committees/${c.id}/donations`).catch(() => ({ data: [] }))
          );
          const results: any[] = await Promise.all(promises);
          const all = results.flatMap((r) => Array.isArray(r) ? r : Array.isArray(r?.data) ? r.data : []);
          setDonations(all);
        }
      } catch (err) {
        console.error('Failed to load donations:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAllDonations();
  }, []);

  return (
    <div className="min-h-screen bg-festival-dark text-white flex">
      <Sidebar />

      <div className="flex-1 ml-64 pt-16">
        <Header />

        <main className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <HeartHandshake className="w-7 h-7 text-emerald-400" />
                <span>Donations Ledger & Audit</span>
              </h1>
              <p className="text-xs text-white/50 mt-1">
                Transparent view of all offline and manual festival donations recorded by committee members.
              </p>
            </div>
          </div>

          {/* Table */}
          <div className="glass-card p-6 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-white/50 uppercase font-semibold">
                  <th className="py-3 px-4">Receipt No</th>
                  <th className="py-3 px-4">Donor Name & Phone</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Purpose</th>
                  <th className="py-3 px-4">Recorded By</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {donations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-white/40 italic">
                      No donation entries found.
                    </td>
                  </tr>
                ) : (
                  donations.map((d) => (
                    <tr key={d.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-festival-gold">{d.receiptNo || 'N/A'}</td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-white">{d.donorName}</p>
                        <p className="text-[11px] text-white/50">{d.donorPhone || 'No Phone'}</p>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-400 text-sm">
                        ₹{d.amount?.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-white/10 text-white/80 text-[10px]">
                          {d.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-white/70">{d.purpose || 'Festival Contribution'}</td>
                      <td className="py-3.5 px-4 text-white/80">{d.addedBy?.name || 'Member'}</td>
                      <td className="py-3.5 px-4 text-white/40">
                        {new Date(d.date).toLocaleDateString('en-IN')}
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
