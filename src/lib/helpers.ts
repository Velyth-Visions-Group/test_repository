import type { Role } from '@/types/database';

export function hasRole(roles: Role[] | null | undefined, role: Role): boolean {
  return Array.isArray(roles) && roles.includes(role);
}

export function hasAnyRole(roles: Role[] | null | undefined, check: Role[]): boolean {
  if (!Array.isArray(roles)) return false;
  return check.some((r) => roles.includes(r));
}

export function isInternal(roles: Role[] | null | undefined): boolean {
  return hasAnyRole(roles, ['owner', 'lead', 'executor']);
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(date: string | null | undefined): string {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getWeekStart(date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
}

export function genericError(): string {
  return 'Ocurrió un error inesperado. Inténtelo de nuevo.';
}

export type DueTone = 'overdue' | 'today' | 'tomorrow' | 'normal' | 'none';

export function dueInfo(date: string | null | undefined): { label: string; tone: DueTone } {
  if (!date) return { label: '—', tone: 'none' };
  const raw = date.length === 10 ? `${date}T00:00:00` : date;
  const d = new Date(raw);
  if (isNaN(d.getTime())) return { label: '—', tone: 'none' };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) {
    return {
      label: diffDays === -1 ? 'Venció ayer' : `Venció hace ${-diffDays} días`,
      tone: 'overdue',
    };
  }
  if (diffDays === 0) return { label: 'Hoy', tone: 'today' };
  if (diffDays === 1) return { label: 'Mañana', tone: 'tomorrow' };
  return { label: formatDate(date), tone: 'normal' };
}
