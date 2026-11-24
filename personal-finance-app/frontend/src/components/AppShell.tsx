import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import {
  ArrowLeftRight,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileBarChart2,
  LayoutDashboard,
  LogOut,
  Menu,
  Scale,
  Settings,
  Target,
  TrendingUp,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { ThemeToggle } from './ui';

interface NavChild {
  to: string;
  label: string;
}

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  children?: NavChild[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Ringkasan',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/transactions', label: 'Transaksi', icon: ArrowLeftRight },
    ],
  },
  {
    label: 'Portofolio',
    items: [
      {
        to: '/investments',
        label: 'Investasi',
        icon: TrendingUp,
        children: [
          { to: '/investments/portfolio', label: 'Portofolio' },
          { to: '/investments/stocks', label: 'Saham' },
          { to: '/investments/bonds', label: 'Obligasi' },
          { to: '/investments/dividends', label: 'Dividen' },
          { to: '/investments/coupons', label: 'Kupon' },
        ],
      },
      { to: '/accounts', label: 'Akun', icon: Wallet },
      { to: '/assets', label: 'Aset', icon: Building2 },
      { to: '/liabilities', label: 'Liabilitas', icon: CreditCard },
    ],
  },
  {
    label: 'Perencanaan',
    items: [
      { to: '/planning/budget', label: 'Anggaran', icon: Target },
      { to: '/reconciliation', label: 'Rekonsiliasi', icon: Scale },
    ],
  },
  {
    label: 'Analisis',
    items: [
      {
        to: '/reports',
        label: 'Laporan',
        icon: FileBarChart2,
        children: [
          { to: '/reports/profit-loss', label: 'Laba rugi' },
          { to: '/reports/cash-flow', label: 'Arus kas' },
          { to: '/reports/balance-sheet', label: 'Neraca' },
          { to: '/reports/net-worth', label: 'Kekayaan bersih' },
          { to: '/reports/portfolio', label: 'Portofolio' },
          { to: '/reports/debt', label: 'Utang' },
        ],
      },
    ],
  },
];

const PAGE_META: [prefix: string, group: string, title: string][] = [
  ['/dashboard', 'Ringkasan', 'Dashboard'],
  ['/transactions', 'Ringkasan', 'Transaksi'],
  ['/investments/portfolio', 'Portofolio', 'Portofolio'],
  ['/investments/stocks', 'Portofolio', 'Saham'],
  ['/investments/bonds', 'Portofolio', 'Obligasi'],
  ['/investments/dividends', 'Portofolio', 'Dividen'],
  ['/investments/coupons', 'Portofolio', 'Kupon'],
  ['/investments', 'Portofolio', 'Investasi'],
  ['/accounts', 'Portofolio', 'Akun'],
  ['/assets', 'Portofolio', 'Aset'],
  ['/liabilities', 'Portofolio', 'Liabilitas'],
  ['/planning/budget', 'Perencanaan', 'Anggaran'],
  ['/reconciliation', 'Perencanaan', 'Rekonsiliasi'],
  ['/reports/profit-loss', 'Analisis', 'Laba rugi'],
  ['/reports/cash-flow', 'Analisis', 'Arus kas'],
  ['/reports/balance-sheet', 'Analisis', 'Neraca'],
  ['/reports/net-worth', 'Analisis', 'Kekayaan bersih'],
  ['/reports/portfolio', 'Analisis', 'Kinerja portofolio'],
  ['/reports/debt', 'Analisis', 'Utang'],
  ['/reports', 'Analisis', 'Laporan'],
  ['/settings', 'Akun', 'Pengaturan'],
];

function metaFor(pathname: string) {
  for (const [prefix, group, title] of PAGE_META) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return { group, title };
  }
  return { group: 'Finansia', title: 'Dashboard' };
}

function initials(name: string | undefined) {
  if (!name) return 'F';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function Sidebar({
  collapsed,
  onToggle,
  onNavigate,
  showCollapse = true,
  onClose,
}: {
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
  showCollapse?: boolean;
  onClose?: () => void;
}) {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="Navigasi utama"
      className={`on-dark flex h-full flex-col bg-sidebar text-sidebar-ink transition-[width] duration-200 ease-out ${
        collapsed ? 'w-[76px]' : 'w-[272px]'
      }`}
    >
      <div className={`flex h-16 shrink-0 items-center border-b border-sidebar-line ${collapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
        <Link to="/dashboard" onClick={onNavigate} className="flex min-w-0 items-center gap-2.5">
          <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent text-sm font-semibold text-accent-ink">
            F
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border border-sidebar bg-gold" aria-hidden="true" />
          </span>
          {!collapsed && (
            <span className="min-w-0">
              <span className="block truncate text-[15px] font-semibold leading-tight text-sidebar-ink">Finansia</span>
              <span className="block text-[10px] uppercase tracking-[0.14em] text-sidebar-muted">Wealth desk</span>
            </span>
          )}
        </Link>
        {!collapsed && onClose && (
          <button
            type="button"
            id="mobile-nav-close"
            onClick={onClose}
            className="icon-btn h-9 w-9 text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-ink"
            aria-label="Tutup navigasi"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className="scroll-thin flex-1 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-5 last:mb-2">
            {!collapsed && (
              <p className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-muted">{group.label}</p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active =
                  pathname === item.to ||
                  pathname.startsWith(`${item.to}/`) ||
                  Boolean(item.children?.some((child) => pathname.startsWith(child.to)));
                const target = item.children ? item.children[0].to : item.to;

                return (
                  <li key={item.to}>
                    <NavLink
                      to={target}
                      onClick={onNavigate}
                      title={collapsed ? item.label : undefined}
                      aria-label={collapsed ? item.label : undefined}
                      className={`group relative flex h-10 items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors duration-150 ${
                        active ? 'bg-sidebar-active font-medium text-sidebar-ink' : 'text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-ink'
                      }`}
                    >
                      <span
                        className={`absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full transition-colors ${
                          active ? 'bg-gold' : 'bg-transparent'
                        }`}
                        aria-hidden="true"
                      />
                      <item.icon size={18} strokeWidth={1.75} aria-hidden="true" />
                      {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                      {!collapsed && item.children && (
                        <ChevronDown
                          size={14}
                          className={`shrink-0 transition-transform duration-200 ${active ? 'rotate-0 text-sidebar-muted' : '-rotate-90 text-sidebar-muted'}`}
                          aria-hidden="true"
                        />
                      )}
                    </NavLink>

                    {!collapsed && active && item.children && (
                      <ul className="mb-1 ml-8 mt-0.5 space-y-0.5 border-l border-sidebar-line pl-2.5">
                        {item.children.map((child) => (
                          <li key={child.to}>
                            <NavLink
                              to={child.to}
                              onClick={onNavigate}
                              className={({ isActive }) =>
                                `block truncate rounded-md px-2.5 py-1.5 text-[13px] transition-colors duration-150 ${
                                  isActive ? 'bg-sidebar-hover font-medium text-sidebar-ink' : 'text-sidebar-muted hover:text-sidebar-ink'
                                }`
                              }
                            >
                              {child.label}
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="shrink-0 border-t border-sidebar-line p-3">
        <NavLink
          to="/settings"
          onClick={onNavigate}
          title={collapsed ? 'Pengaturan' : undefined}
          aria-label={collapsed ? 'Pengaturan' : undefined}
          className={({ isActive }) =>
            `mb-2 flex h-10 items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors duration-150 ${
              isActive ? 'bg-sidebar-active font-medium text-sidebar-ink' : 'text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-ink'
            }`
          }
        >
          <Settings size={18} strokeWidth={1.75} aria-hidden="true" />
          {!collapsed && <span>Pengaturan</span>}
        </NavLink>

        {showCollapse && (
          <div className={`flex items-center gap-2 ${collapsed ? 'justify-center' : 'justify-between'}`}>
            {!collapsed && (
              <span className="flex items-center gap-1.5 px-1 text-[11px] text-sidebar-muted">
                <span className="status-dot bg-positive" aria-hidden="true" />
                Jurnal berimbang
              </span>
            )}
            <button
              type="button"
              onClick={onToggle}
              className="icon-btn h-8 w-8 text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-ink"
              aria-label={collapsed ? 'Perluas sidebar' : 'Lipat sidebar'}
            >
              {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const meta = useMemo(() => metaFor(pathname), [pathname]);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    document.title = `${meta.title} · Finansia`;
  }, [meta.title]);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenu(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const frame = requestAnimationFrame(() => document.getElementById('mobile-nav-close')?.focus());
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      menuButtonRef.current?.focus();
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!userMenu) return;
    const onPointer = (event: MouseEvent) => {
      if (!userMenuRef.current?.contains(event.target as Node)) setUserMenu(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setUserMenu(false);
        userMenuRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
      }
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [userMenu]);

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-canvas">
      <a href="#main-content" className="skip-link">
        Lewati ke konten
      </a>

      <div className="hidden h-full shrink-0 lg:block">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigasi">
          <div className="absolute inset-0 animate-fade-in bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 animate-slide-in-left">
            <Sidebar
              collapsed={false}
              onToggle={() => setMobileOpen(false)}
              onNavigate={() => setMobileOpen(false)}
              showCollapse={false}
              onClose={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="z-30 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-line bg-surface px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setMobileOpen(true)}
              className="icon-btn border border-line lg:hidden"
              aria-label="Buka navigasi"
              aria-expanded={mobileOpen}
            >
              <Menu size={18} />
            </button>
            <nav aria-label="Breadcrumb" className="min-w-0">
              <ol className="flex items-center gap-1.5 truncate text-xs text-muted">
                <li className="hidden shrink-0 sm:block">Finansia</li>
                <li className="hidden shrink-0 sm:block" aria-hidden="true">
                  /
                </li>
                <li className="shrink-0">{meta.group}</li>
                <li className="shrink-0" aria-hidden="true">
                  /
                </li>
                <li className="truncate font-medium text-ink" aria-current="page">
                  {meta.title}
                </li>
              </ol>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 md:flex">
              <span className="rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-[11px] text-muted">
                <span className="text-faint">Mata uang</span> <span className="font-semibold text-ink">{user?.baseCurrency ?? 'IDR'}</span>
              </span>
              <span className="hidden rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-[11px] text-muted xl:inline">
                <span className="text-faint">Cost basis</span> <span className="font-semibold text-ink">{user?.costBasisMethod ?? 'FIFO'}</span>
              </span>
            </div>

            <ThemeToggle />

            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenu((value) => !value)}
                className="flex h-10 items-center gap-2 rounded-lg border border-line bg-surface pl-1 pr-2 text-left transition-colors hover:bg-surface-2"
                aria-haspopup="menu"
                aria-expanded={userMenu}
                aria-label="Menu profil"
              >
                <span className="grid h-8 w-8 place-items-center rounded-md bg-accent text-[11px] font-semibold text-accent-ink">
                  {initials(user?.fullName)}
                </span>
                <span className="hidden max-w-[9rem] truncate text-xs font-medium text-ink sm:block">{user?.fullName}</span>
                <ChevronDown size={14} className={`text-muted transition-transform duration-150 ${userMenu ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>

              {userMenu && (
                <div
                  role="menu"
                  aria-label="Profil"
                  className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-60 origin-top-right animate-scale-in rounded-xl border border-line bg-surface p-1.5 shadow-pop"
                >
                  <div className="border-b border-line px-2.5 py-2">
                    <p className="truncate text-sm font-medium text-ink">{user?.fullName}</p>
                    <p className="truncate text-xs text-muted">{user?.email}</p>
                  </div>
                  <Link
                    to="/settings"
                    role="menuitem"
                    onClick={() => setUserMenu(false)}
                    className="mt-1 flex h-9 items-center gap-2 rounded-md px-2.5 text-sm text-ink transition-colors hover:bg-surface-2"
                  >
                    <Settings size={16} className="text-muted" aria-hidden="true" />
                    Pengaturan
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={logout}
                    className="flex h-9 w-full items-center gap-2 rounded-md px-2.5 text-left text-sm text-negative transition-colors hover:bg-negative-soft"
                  >
                    <LogOut size={16} aria-hidden="true" />
                    Keluar
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main id="main-content" ref={mainRef} tabIndex={-1} className="scroll-thin flex-1 overflow-y-auto outline-none">
          <div className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
