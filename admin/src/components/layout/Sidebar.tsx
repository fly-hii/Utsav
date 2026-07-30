'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  FileCheck,
  Users,
  HeartHandshake,
  Receipt,
  Calendar,
  Film,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  Sparkles,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Pending Approvals', href: '/committees/requests', icon: FileCheck, badgeKey: 'pendingCount' },
  { label: 'Committees', href: '/committees', icon: Building2 },
  { label: 'Users', href: '/users', icon: Users },
  { label: 'Donations', href: '/donations', icon: HeartHandshake },
  { label: 'Expenses', href: '/expenses', icon: Receipt },
  { label: 'Events', href: '/events', icon: Calendar },
  { label: 'Reel Moderation', href: '/reels', icon: Film },
  { label: 'Analytics & Reports', href: '/reports', icon: BarChart3 },
  { label: 'Notifications', href: '/notifications', icon: Bell },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  return (
    <aside className="w-64 glass-sidebar fixed inset-y-0 left-0 z-50 flex flex-col justify-between p-4">
      <div>
        {/* Brand */}
        <div className="flex items-center gap-3 px-3 py-4 mb-6 border-b border-white/10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-festival-orange to-festival-crimson flex items-center justify-center shadow-glow">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-white via-festival-cream to-festival-gold bg-clip-text text-transparent">
              UTSAV ADMIN
            </h1>
            <p className="text-xs text-white/50">Village Festival Portal</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'glass-card-active text-white font-semibold'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-festival-orange' : 'text-white/50'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all w-full"
      >
        <LogOut className="w-5 h-5" />
        <span>Logout</span>
      </button>
    </aside>
  );
}
