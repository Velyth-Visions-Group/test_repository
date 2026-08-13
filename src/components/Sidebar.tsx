import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { hasAnyRole } from '@/lib/helpers';
import type { Role } from '@/types/database';
import {
  CalendarDays,
  FolderKanban,
  FileText,
  Inbox,
  Users,
  Briefcase,
  LogOut,
  LayoutDashboard,
  Sun,
  Moon,
  Gauge,
  BookOpen,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface NavItem {
  to: string;
  label: string;
  icon: typeof CalendarDays;
  roles: Role[];
}

const navItems: NavItem[] = [
  { to: '/panel', label: 'Panel de división', icon: Gauge, roles: ['owner', 'lead', 'executor'] },
  { to: '/semana', label: 'Mi semana', icon: CalendarDays, roles: ['executor', 'lead', 'owner'] },
  { to: '/proyectos', label: 'Proyectos', icon: FolderKanban, roles: ['lead', 'owner'] },
  { to: '/semanales', label: 'Semanales', icon: FileText, roles: ['owner', 'lead', 'executor'] },
  { to: '/manual', label: 'Manual', icon: BookOpen, roles: ['owner', 'lead', 'executor'] },
  { to: '/intake', label: 'Intake', icon: Inbox, roles: ['owner', 'lead'] },
  { to: '/admin', label: 'Administración', icon: Users, roles: ['owner'] },
  { to: '/mi-proyecto', label: 'Mi proyecto', icon: Briefcase, roles: ['cliente'] },
];

export default function Sidebar() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDark, setIsDark] = useState(
    () => document.documentElement.classList.contains('dark')
  );
  const [newIntakeCount, setNewIntakeCount] = useState(0);

  const visibleItems = navItems.filter(
    (item) => hasAnyRole(profile?.roles, item.roles) || (item.to === '/mi-proyecto' && hasAnyRole(profile?.roles, ['cliente']))
  );

  const canSeeIntake = hasAnyRole(profile?.roles, ['owner', 'lead']);

  useEffect(() => {
    if (!canSeeIntake) return;
    supabase
      .from('intake_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'nuevo')
      .then(({ count }) => setNewIntakeCount(count ?? 0));
  }, [canSeeIntake]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('velyth-theme', next ? 'dark' : 'light');
    } catch {}
  };

  const initials = (profile?.full_name || 'V')
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[var(--color-surface)]">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-6 py-5 border-b border-[var(--color-border)]">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] text-[var(--accent-ink)]">
          <LayoutDashboard size={16} />
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--color-text)] leading-tight">Velyth</p>
          <p className="text-[11px] text-[var(--color-text-muted)] leading-tight">Portal Operativo</p>
        </div>
      </div>

      {/* User info */}
      {profile && (
        <div className="px-6 py-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-xs font-semibold text-[var(--accent)]">
              {initials}
            </div>
            <p className="truncate text-sm font-medium text-[var(--color-text)]">
              {profile.full_name || 'Sin nombre'}
            </p>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1">
            {profile.roles?.map((role) => (
              <span
                key={role}
                className="inline-flex items-center rounded-md bg-[var(--color-surface-2)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-text-muted)] capitalize"
              >
                {role}
              </span>
            ))}
            {profile.division && (
              <span className="inline-flex items-center rounded-md bg-[var(--accent-soft)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--accent)]">
                {profile.division}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-faint)]">
          Menú
        </p>
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                    : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]'
                }`
              }
            >
              <Icon size={17} />
              <span className="flex-1">{item.label}</span>
              {item.to === '/intake' && newIntakeCount > 0 && (
                <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--accent)]">
                  {newIntakeCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Theme + sign out */}
      <div className="px-3 py-4 border-t border-[var(--color-border)] space-y-0.5">
        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
          {isDark ? 'Modo claro' : 'Modo oscuro'}
        </button>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
        >
          <LogOut size={17} />
          Cerrar sesión
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-[var(--color-border)] bg-[var(--color-surface)]">
        {sidebarContent}
      </aside>

      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent)] text-[var(--accent-ink)]">
            <LayoutDashboard size={14} />
          </div>
          <span className="text-sm font-semibold text-[var(--color-text)]">Velyth</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]"
          aria-label="Abrir menú"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-72 bg-[var(--color-surface)] shadow-xl animate-slide-in">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
