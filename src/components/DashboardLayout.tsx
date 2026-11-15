import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  CalendarCheck,
  Users,
  ClipboardList,
  UtensilsCrossed,
  Salad,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface DashboardLayoutProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export function DashboardLayout({
  title,
  subtitle,
  action,
  children,
}: DashboardLayoutProps) {
  const { user } = useAuth();
  const location = useLocation();

  const memberNav = [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/orders', label: 'My Orders', icon: ShoppingBag },
    { to: '/subscription', label: 'My Subscription', icon: CalendarCheck },
    { to: '/builder', label: 'Salad Builder', icon: Salad },
  ];

  const adminNav = [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard },
    { to: '/admin/members', label: 'Manage Members', icon: Users },
    { to: '/admin/orders', label: 'Manage Orders', icon: ClipboardList },
    { to: '/admin/menu', label: 'Manage Menu', icon: UtensilsCrossed },
  ];

  const navItems = user?.role === 'admin' ? adminNav : memberNav;

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation (240px on desktop) */}
        <aside className="lg:w-[240px] shrink-0">
          <div className="bg-white border border-[#DCE3D8] rounded-xl p-4">
            <div className="pb-3 mb-3 border-b border-[#EEF2EC]">
              <p className="text-sm font-semibold text-[#16221A] truncate">
                {user?.name}
              </p>
              <p className="text-xs text-[#4D5E53] mt-0.5 truncate">
                {user?.role === 'admin'
                  ? 'Administrator'
                  : user?.activePlan
                  ? `${user.activePlan.name} Member`
                  : 'Standard Account'}
              </p>
            </div>
            <nav className="flex lg:flex-col gap-1 overflow-x-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                      active
                        ? 'bg-[#1B5E37] text-white'
                        : 'text-[#4D5E53] hover:bg-[#EEF2EC] hover:text-[#16221A]'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main Viewport */}
        <main className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#DCE3D8] mb-6">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#16221A]">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-[#4D5E53] mt-1">{subtitle}</p>
              )}
            </div>
            {action && <div className="shrink-0">{action}</div>}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
