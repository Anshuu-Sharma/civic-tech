'use client';

import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, ListTodo, AlertTriangle, Shield,
  LogOut, ChevronLeft, ChevronRight, User, Building2, Menu
} from 'lucide-react';
import { useState } from 'react';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/queue', label: 'Queue', icon: ListTodo },
  { href: '/admin/escalations', label: 'Escalations', icon: AlertTriangle },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Login page renders without the admin shell
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-gray-400">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-saffron-500 rounded-full animate-spin" />
          <span className="text-sm">Loading session...</span>
        </div>
      </div>
    );
  }

  const roleBadge: Record<string, { label: string; color: string }> = {
    ward_officer: { label: 'Ward Officer', color: 'bg-blue-100 text-blue-700' },
    department_head: { label: 'Dept. Head', color: 'bg-saffron-100 text-saffron-700' },
    commissioner: { label: 'Commissioner', color: 'bg-red-100 text-red-700' },
  };

  const role = session?.user?.role || 'ward_officer';
  const badge = roleBadge[role] || roleBadge.ward_officer;

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          bg-civic-900 flex flex-col transition-all duration-200 ease-out
          ${collapsed ? 'w-16' : 'w-60'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Saffron accent line */}
        <div className="absolute top-0 left-0 w-[3px] h-full bg-gradient-to-b from-saffron-400 via-saffron-500/50 to-transparent" />

        {/* Logo */}
        <div className={`flex items-center gap-2.5 p-4 border-b border-white/10 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-md bg-saffron-500 flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <span className="text-white font-bold text-sm">JanSunwai</span>
              <span className="text-saffron-400 font-bold text-sm ml-0.5">AI</span>
              <p className="text-[10px] text-civic-200/60 -mt-0.5">Officer Portal</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all
                  ${collapsed ? 'justify-center' : ''}
                  ${isActive
                    ? 'bg-white/10 text-saffron-400'
                    : 'text-civic-200/70 hover:bg-white/5 hover:text-white'
                  }
                `}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-saffron-400' : ''}`} />
                {!collapsed && <span>{item.label}</span>}
                {isActive && !collapsed && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-saffron-400" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="hidden lg:block px-2 pb-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-civic-200/50 hover:text-white hover:bg-white/5 transition-all text-xs"
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>

        {/* User + Sign Out */}
        <div className={`border-t border-white/10 p-3 ${collapsed ? 'flex flex-col items-center gap-2' : ''}`}>
          {!collapsed && session?.user && (
            <div className="mb-2">
              <p className="text-white text-xs font-medium truncate">{session.user.name}</p>
              <p className="text-civic-200/50 text-[10px] truncate">{session.user.departmentName}</p>
            </div>
          )}
          <button
            onClick={() => signOut({ callbackUrl: '/admin/login' })}
            className={`
              flex items-center gap-2 text-red-400/70 hover:text-red-400 transition-colors text-xs
              ${collapsed ? 'justify-center' : 'w-full'}
            `}
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 h-14 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-1.5 rounded-md hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-sm font-semibold text-civic-900">
              {NAV_ITEMS.find((i) => pathname === i.href || (i.href !== '/admin' && pathname.startsWith(i.href)))?.label || 'Admin'}
            </h1>
          </div>

          {session?.user && (
            <div className="flex items-center gap-3">
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${badge.color}`}>
                {badge.label}
              </span>
              <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
                <Building2 className="w-3 h-3" />
                <span className="truncate max-w-[140px]">{session.user.departmentName}</span>
              </div>
              <div className="w-7 h-7 rounded-full bg-civic-100 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-civic-700" />
              </div>
            </div>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
