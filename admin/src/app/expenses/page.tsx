'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Receipt, FileText, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);

  useEffect(() => {
    async function loadExpenses() {
      try {
        const committeesRes: any = await api.get('/admin/committees?status=APPROVED');
        const commList = Array.isArray(committeesRes) ? committeesRes : Array.isArray(committeesRes?.data) ? committeesRes.data : [];
        if (commList.length > 0) {
          const promises = commList.map((c: any) =>
            api.get(`/committees/${c.id}/expenses`).catch(() => ({ data: [] }))
          );
          const results: any[] = await Promise.all(promises);
          const all = results.flatMap((r) => Array.isArray(r) ? r : Array.isArray(r?.data) ? r.data : []);
          setExpenses(all);
        }
      } catch (err) {
        console.error('Failed to load expenses:', err);
      }
    }
    loadExpenses();
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
                <Receipt className="w-7 h-7 text-rose-400" />
                <span>Committee Expenses & Bill Proof Audit</span>
              </h1>
              <p className="text-xs text-white/50 mt-1">
                Inspect committee expenditure categories, vendor proofs, and bill S3 uploads.
              </p>
            </div>
          </div>

          <div className="glass-card p-6 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-white/50 uppercase font-semibold">
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Vendor</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Bill Image / S3 Proof</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-white/40 italic">
                      No expense logs found.
                    </td>
                  </tr>
                ) : (
                  expenses.map((e) => (
                    <tr key={e.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-rose-300">{e.category}</td>
                      <td className="py-3.5 px-4 text-white/80">{e.vendor || 'N/A'}</td>
                      <td className="py-3.5 px-4 font-bold text-rose-400 text-sm">
                        ₹{e.amount?.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4">
                        {e.billS3Url ? (
                          <a
                            href={e.billS3Url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] inline-flex items-center gap-1 hover:underline"
                          >
                            <FileText className="w-3 h-3" />
                            <span>View Bill</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-white/30 italic">No bill uploaded</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-white/60">{e.description || 'General expense'}</td>
                      <td className="py-3.5 px-4 text-white/40">
                        {new Date(e.date).toLocaleDateString('en-IN')}
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
