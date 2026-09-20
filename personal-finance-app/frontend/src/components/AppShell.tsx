import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ArrowLeftRight, TrendingUp, Wallet, Building2, CreditCard, Target, FileBarChart2, Settings, ChevronLeft, ChevronRight, Menu, LogOut, type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../lib/auth';

interface Item { to: string; label: string; icon: LucideIcon; children?: { to: string; label: string }[] }

const NAV: Item[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/transactions', label: 'Transaksi', icon: ArrowLeftRight },
  { to: '/investments', label: 'Investasi', icon: TrendingUp, children: [
    { to: '/investments/portfolio', label: 'Portofolio' }, { to: '/investments/stocks', label: 'Saham' }, { to: '/investments/bonds', label: 'Obligasi' },
    { to: '/investments/dividends', label: 'Dividen' }, { to: '/investments/coupons', label: 'Kupon' },
  ] },
  { to: '/accounts', label: 'Akun', icon: Wallet },
  { to: '/assets', label: 'Aset', icon: Building2 },
  { to: '/liabilities', label: 'Liabilitas', icon: CreditCard },
  { to: '/planning', label: 'Perencanaan', icon: Target, children: [{ to: '/planning/budget', label: 'Anggaran' }, { to: '/reconciliation', label: 'Rekonsiliasi' }] },
  { to: '/reports', label: 'Laporan', icon: FileBarChart2, children: [
    { to: '/reports/profit-loss', label: 'Laba Rugi' }, { to: '/reports/cash-flow', label: 'Arus Kas' }, { to: '/reports/balance-sheet', label: 'Neraca' },
    { to: '/reports/net-worth', label: 'Kekayaan Bersih' }, { to: '/reports/portfolio', label: 'Portofolio' }, { to: '/reports/debt', label: 'Utang' },
  ] },
  { to: '/settings', label: 'Pengaturan', icon: Settings },
];

function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { pathname } = useLocation();
  return (
    <nav className={`bg-navy text-slate-300 flex flex-col h-full ${collapsed ? 'w-16' : 'w-60'} transition-[width] duration-150`}>
      <div className="h-14 flex items-center px-4 border-b border-white/10">
        <span className="w-7 h-7 rounded-md bg-accent-blue text-white grid place-items-center font-bold text-sm">F</span>
        {!collapsed && <span className="ml-3 font-semibold text-white">Finansia</span>}
      </div>
      <ul className="flex-1 overflow-y-auto py-3 space-y-0.5">
        {NAV.map((item) => {
          const active = pathname.startsWith(item.to) || item.children?.some((c) => pathname.startsWith(c.to));
          return (
            <li key={item.to}>
              <NavLink to={item.children ? item.children[0].to : item.to} title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 mx-2 px-2.5 h-9 rounded-md text-sm ${active ? 'bg-navy-light text-white' : 'hover:bg-white/5 hover:text-white'}`}>
                <item.icon size={18} strokeWidth={1.75} />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
              {!collapsed && active && item.children && (
                <ul className="ml-9 mt-0.5 mb-1 space-y-0.5">
                  {item.children.map((c) => (
                    <li key={c.to}>
                      <NavLink to={c.to} className={({ isActive }) => `block px-2.5 h-8 leading-8 rounded-md text-sm ${isActive ? 'text-white bg-white/10' : 'text-slate-400 hover:text-white'}`}>{c.label}</NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
      <button onClick={onToggle} className="h-11 border-t border-white/10 flex items-center justify-center hover:bg-white/5" aria-label="Lipat sidebar">
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
    </nav>
  );
}

export default function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  return (
    <div className="h-screen flex">
      <div className="hidden md:block h-full"><Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} /></div>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-navy/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full" onClick={() => setMobileOpen(false)}><Sidebar collapsed={false} onToggle={() => setMobileOpen(false)} /></div>
        </div>
      )}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6">
          <button className="md:hidden btn-secondary h-8 px-2" onClick={() => setMobileOpen(true)} aria-label="Menu"><Menu size={18} /></button>
          <div className="hidden md:block text-sm text-slate-500">Mata uang dasar: <span className="font-medium text-slate-800">{user?.baseCurrency}</span> · Metode cost basis: <span className="font-medium text-slate-800">{user?.costBasisMethod}</span></div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-700">{user?.fullName}</span>
            <button onClick={logout} className="btn-secondary h-8 px-2" title="Keluar"><LogOut size={16} /></button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6"><Outlet /></main>
      </div>
    </div>
  );
}
