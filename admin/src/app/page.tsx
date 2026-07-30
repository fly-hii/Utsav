'use client';

import { useState } from 'react';
import { Sparkles, Phone, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [phone, setPhone] = useState('9999999999');
  const [password, setPassword] = useState('Admin@123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res: any = await api.post('/auth/login', { phone, password });

      if (res.data?.user?.role !== 'SUPER_ADMIN') {
        setError('Access denied. Only Super Admin can access this portal.');
        setLoading(false);
        return;
      }

      localStorage.setItem('token', res.data.accessToken);
      localStorage.setItem('refreshToken', res.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-festival-background text-festival-dark">
      {/* Background Soft Blobs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-festival-orange/10 rounded-full blur-[100px] animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-festival-crimson/10 rounded-full blur-[100px] animate-pulse delay-1000 pointer-events-none"></div>

      {/* Traditional Clean Login Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md bg-white p-8 relative z-10 border border-gray-200 shadow-traditional rounded-2xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-festival-orange to-festival-crimson mx-auto flex items-center justify-center shadow-lg mb-4"
          >
            <Sparkles className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            UTSAV ADMIN
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">Village Festival Management Portal</p>
        </div>

        {/* Error Alert */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm text-center font-semibold"
          >
            {error}
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
            <div className="relative">
              <Phone className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter Super Admin phone"
                className="w-full text-sm pl-11 pr-4 py-3.5 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-festival-orange/50 focus:border-festival-orange transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full text-sm pl-11 pr-4 py-3.5 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-festival-orange/50 focus:border-festival-orange transition-all"
                required
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-festival-orange hover:bg-festival-orange/90 text-white rounded-xl py-3.5 px-4 text-sm font-bold flex items-center justify-center gap-2 group transition-colors shadow-md"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Admin Portal</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </motion.button>
        </form>

        {/* Footer info */}
        <div className="mt-8 pt-6 border-t border-gray-100 text-center text-sm font-medium text-gray-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-5 h-5 text-festival-saffron" />
          <span>Secured Super Admin System</span>
        </div>
      </motion.div>
    </main>
  );
}
