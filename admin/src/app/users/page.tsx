'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Users, Search, KeyRound, Shield } from 'lucide-react';
import { api } from '@/lib/api';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Password reset modal state
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let url = `/admin/users?`;
      if (search) url += `search=${encodeURIComponent(search)}`;
      const res: any = await api.get(url);
      setUsers(res.data || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newPassword) return;

    try {
      await api.put(`/admin/users/${selectedUser.id}/reset-password`, { newPassword });
      alert(`Password for ${selectedUser.name} reset successfully!`);
      setSelectedUser(null);
      setNewPassword('');
    } catch (err: any) {
      alert(err.message || 'Failed to reset password');
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
                <Users className="w-7 h-7 text-festival-saffron" />
                <span>User Account Administration</span>
              </h1>
              <p className="text-xs text-white/50 mt-1">
                Manage registered villagers, committee admins, members, and reset credentials.
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="glass-card p-4">
            <div className="relative max-w-md">
              <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search user by name, phone number, email..."
                className="w-full glass-input text-xs pl-9 pr-4 py-2 text-white placeholder-white/40 focus:outline-none"
              />
            </div>
          </div>

          {/* Table */}
          <div className="glass-card p-6 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-white/50 uppercase font-semibold">
                  <th className="py-3 px-4">User Name</th>
                  <th className="py-3 px-4">Phone Number</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">{u.name}</td>
                    <td className="py-3.5 px-4 text-white/80">{u.phone}</td>
                    <td className="py-3.5 px-4 text-white/50">{u.email || 'N/A'}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full bg-festival-orange/15 border border-festival-orange/30 text-festival-gold text-[10px] font-semibold">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold">
                        {u.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedUser(u)}
                        className="glass-btn-secondary px-3 py-1.5 text-[11px] inline-flex items-center gap-1 font-semibold"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-festival-gold" />
                        <span>Reset Password</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* Password Reset Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleResetPassword} className="glass-card max-w-md w-full p-6 space-y-4 border border-white/20">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-festival-gold" />
              <span>Reset Password for {selectedUser.name}</span>
            </h3>
            <p className="text-xs text-white/60">Phone: {selectedUser.phone}</p>
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1">New Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 chars)"
                className="w-full glass-input text-xs p-3 text-white focus:outline-none"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button type="button" onClick={() => setSelectedUser(null)} className="glass-btn-secondary px-4 py-2 text-xs">
                Cancel
              </button>
              <button type="submit" className="glass-btn px-4 py-2 text-xs font-semibold">
                Update Password
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
