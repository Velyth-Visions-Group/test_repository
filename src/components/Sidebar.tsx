import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { hasAnyRole, isInternal } from '@/lib/helpers';
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
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  to: string;
  label: string;
  icon: typeof CalendarDays;
  roles: Role[];
}

const navItems: NavItem[] = [
  { to: '/semana', label: 'Mi semana', icon: CalendarDays, roles: ['executor', 'lead', 'owner'] },
  { to: '/proyectos', label: 'Proyectos', icon: FolderKanban, roles: ['lead', 'owner'] },
  { to: '/semanales', label: 'Semanales', icon: FileText, roles: ['owner', 'lead', 'executor'] },
  { to: '/intake', label: 'Intake', icon: Inbox, roles: ['owner', 'lead'] },
  { to: '/admin', label: 'Administración', icon: Users, roles: ['owner'] },
  { to: '/mi-proyecto', label: 'Mi proyecto', icon: Briefcase, roles: ['cliente'] },
];

export default function Sidebar() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleItems = navItems.filter(
    (item) => hasAnyRole(profile?.roles, item.roles) || (item.to === '/mi-proyecto' && hasAnyRole(profile?.roles, ['cliente']))
  );

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-6 py-5 border-b border-stone-200">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-900 text-white">
          <LayoutDashboard size={16} />
        </div>
        <div>
          <p className="text-sm font-semibold text-stone-900 leading-tight">Velyth</p>
          <p className="text-[11px] text-stone-500 leading-tight">Portal Operativo</p>
        </div>
      </div>

      {/* User info */}
      {profile && (
        <div className="px-6 py-4 border-b border-stone-200">
          <p className="text-sm font-medium text-stone-800 truncate">
            {profile.full_name || 'Sin nombre'}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {profile.roles?.map((role) => (
              <span
                key={role}
                className="inline-flex items-center rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-stone-600 capitalize"
              >
                {role}
              </span>
            ))}
            {profile.division && (
              <span className="inline-flex items-center rounded bg-teal-50 px-1.5 py-0.5 text-[10px] font-medium text-teal-700">
                {profile.division}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-stone-900 text-white'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`
              }
            >
              <Icon size={17} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-stone-200">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800"
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
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-stone-200 bg-white">
        {sidebarContent}
      </aside>

      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between border-b border-stone-200 bg-white px-4 py-3 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-900 text-white">
            <LayoutDashboard size={14} />
          </div>
          <span className="text-sm font-semibold text-stone-900">Velyth</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-stone-600 hover:bg-stone-100"
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
          <div className="fixed inset-0 bg-stone-900/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-72 bg-white shadow-xl animate-slide-in">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
