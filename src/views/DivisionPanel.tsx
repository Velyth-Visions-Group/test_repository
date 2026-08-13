import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { hasAnyRole, getWeekStart, formatDate, dueInfo } from '@/lib/helpers';
import type { Division, Project, Task, Weekly } from '@/types/database';
import EmptyState from '@/components/EmptyState';
import { Gauge, FileText, ArrowRight } from 'lucide-react';

const divisions: Division[] = ['VVG', 'VNS', 'VTS', 'DSS'];

interface ProjectProgress extends Project {
  total: number;
  done: number;
  pct: number;
}

// Vitrina de la división (visibilidad N2): estado de la semana sin exponer
// montos ni datos de otras divisiones. Lo que cada rol ve lo delimita la RLS.
export default function DivisionPanel() {
  const { profile } = useAuth();
  const isOwner = hasAnyRole(profile?.roles, ['owner']);
  const [division, setDivision] = useState<Division>((profile?.division as Division) ?? 'VVG');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [weeklies, setWeeklies] = useState<Weekly[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const weekStart = getWeekStart();

  useEffect(() => {
    if (!isOwner && profile?.division) {
      setDivision(profile.division as Division);
    }
  }, [isOwner, profile?.division]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tasksRes, projectsRes, weekliesRes] = await Promise.all([
        supabase
          .from('tasks')
          .select('id, title, status, due_date, division, project_id')
          .eq('division', division),
        supabase
          .from('projects')
          .select('id, name, division, status')
          .eq('division', division),
        supabase
          .from('weeklies')
          .select('id, kind, content, week_start, author_id, division, author:profiles!weeklies_author_id_fkey(id, full_name)')
          .eq('division', division)
          .eq('week_start', weekStart),
      ]);
      if (tasksRes.error) throw tasksRes.error;
      if (projectsRes.error) throw projectsRes.error;
      if (weekliesRes.error) throw weekliesRes.error;
      setTasks((tasksRes.data ?? []) as unknown as Task[]);
      setProjects((projectsRes.data ?? []) as unknown as Project[]);
      setWeeklies((weekliesRes.data ?? []) as unknown as Weekly[]);
    } catch (err) {
      console.error('panel load failed', err);
      setError('No se pudo cargar el panel de división.');
    } finally {
      setLoading(false);
    }
  }, [division, weekStart]);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(
    () => ({
      done: tasks.filter((t) => t.status === 'hecha').length,
      inProgress: tasks.filter((t) => t.status === 'en curso').length,
      pending: tasks.filter((t) => t.status === 'pendiente').length,
      overdue: tasks.filter((t) => t.status !== 'hecha' && dueInfo(t.due_date).tone === 'overdue').length,
    }),
    [tasks]
  );

  const kickoff = weeklies.find((w) => w.kind === 'kickoff');
  const digest = weeklies.find((w) => w.kind === 'digest');

  const progress = useMemo<ProjectProgress[]>(
    () =>
      projects
        .filter((p) => p.status !== 'cancelado' && p.status !== 'completado')
        .map((p) => {
          const pt = tasks.filter((t) => t.project_id === p.id);
          const done = pt.filter((t) => t.status === 'hecha').length;
          return { ...p, total: pt.length, done, pct: pt.length ? Math.round((done / pt.length) * 100) : 0 };
        }),
    [projects, tasks]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-stone-900" />
      </div>
    );
  }

  if (error) {
    return <EmptyState title="Sin acceso" message={error} icon={<Gauge size={40} />} />;
  }

  const statCards = [
    { label: 'Completadas', value: counts.done, alert: false },
    { label: 'En curso', value: counts.inProgress, alert: false },
    { label: 'Pendientes', value: counts.pending, alert: false },
    { label: 'Vencidas', value: counts.overdue, alert: counts.overdue > 0 },
  ];

  const weeklyCard = (title: string, weekly: Weekly | undefined) => (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
            <FileText size={15} />
          </div>
          <h2 className="text-sm font-medium text-[var(--color-text)]">{title}</h2>
        </div>
        {weekly && (
          <span className="text-xs text-[var(--color-text-faint)]">
            {weekly.author?.full_name ?? ''}
          </span>
        )}
      </div>
      {weekly?.content ? (
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-text-muted)]">
          {weekly.content}
        </p>
      ) : (
        <div className="mt-3">
          <p className="text-sm text-[var(--color-text-faint)]">Sin publicar esta semana.</p>
          <Link
            to="/semanales"
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[var(--accent)] hover:underline"
          >
            Redactar ahora
            <ArrowRight size={12} />
          </Link>
        </div>
      )}
    </div>
  );

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-[var(--color-text)]">Panel de división</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Semana del {formatDate(weekStart)} · {division}
        </p>
      </div>

      {isOwner && (
        <div className="mb-6 flex flex-wrap gap-2">
          {divisions.map((d) => (
            <button
              key={d}
              onClick={() => setDivision(d)}
              className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                division === d
                  ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                  : 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      )}

      <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statCards.map((s) => (
          <div key={s.label} className="card p-4">
            <p className={`text-2xl font-medium ${s.alert ? 'text-red-600' : 'text-[var(--color-text)]'}`}>
              {s.value}
            </p>
            <p className="mt-1 text-xs uppercase tracking-wider text-[var(--color-text-faint)]">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      <div className="mb-4 grid gap-4 md:grid-cols-2">
        {weeklyCard('Kickoff de la semana', kickoff)}
        {weeklyCard('Digest de la semana', digest)}
      </div>

      <div className="card">
        <div className="border-b border-[var(--color-border)] px-5 py-4">
          <h2 className="text-sm font-medium text-[var(--color-text)]">Proyectos de la división</h2>
        </div>
        {progress.length === 0 ? (
          <p className="px-5 py-6 text-sm text-[var(--color-text-faint)]">
            Sin proyectos activos en esta división.
          </p>
        ) : (
          progress.map((p) => (
            <div key={p.id} className="border-b border-[var(--color-border)] px-5 py-4 last:border-b-0">
              <div className="flex items-center justify-between gap-4">
                <Link
                  to={`/proyectos/${p.id}`}
                  className="text-sm font-medium text-[var(--color-text)] transition-colors hover:text-[var(--accent)]"
                >
                  {p.name}
                </Link>
                <span className="text-xs text-[var(--color-text-muted)]">
                  {p.done}/{p.total} tareas
                </span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-[var(--color-surface-2)]">
                <div
                  className="h-1.5 rounded-full bg-[var(--accent)] transition-all"
                  style={{ width: `${p.pct}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
