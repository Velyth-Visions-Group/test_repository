import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Task, TaskStatus } from '@/types/database';
import { formatDate } from '@/lib/helpers';
import EmptyState from '@/components/EmptyState';
import StatusBadge from '@/components/StatusBadge';
import { CalendarDays, ChevronDown, ChevronRight } from 'lucide-react';

interface GroupedTasks {
  project: { id: string; name: string; division: string | null };
  tasks: Task[];
}

const statusOrder: Record<string, number> = { 'pendiente': 0, 'en curso': 1, 'hecha': 2 };
const nextStatus: Record<string, TaskStatus> = {
  'pendiente': 'en curso',
  'en curso': 'hecha',
  'hecha': 'pendiente',
};

export default function MyWeek() {
  const { user, profile } = useAuth();
  const [groups, setGroups] = useState<GroupedTasks[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const loadTasks = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('tasks')
        .select(`
          id, title, status, due_date, division, project_id,
          project:projects(id, name, division)
        `)
        .eq('assignee_id', user.id)
        .order('due_date', { ascending: true, nullsFirst: false });

      if (queryError) throw queryError;

      const tasks = (data ?? []) as unknown as Task[];
      const map = new Map<string, GroupedTasks>();
      for (const task of tasks) {
        const proj = task.project as { id: string; name: string; division: string | null } | null;
        const key = proj?.id ?? 'sin-proyecto';
        if (!map.has(key)) {
          map.set(key, {
            project: proj ?? { id: 'sin-proyecto', name: 'Sin proyecto', division: null },
            tasks: [],
          });
        }
        map.get(key)!.tasks.push(task);
      }

      const grouped = Array.from(map.values());
      grouped.forEach((g) => g.tasks.sort((a, b) => (statusOrder[a.status ?? ''] ?? 9) - (statusOrder[b.status ?? ''] ?? 9)));
      setGroups(grouped);
      setExpanded(new Set(grouped.map((g) => g.project.id)));
    } catch (err) {
      console.error('myweek load failed', err);
      setError('No se pudieron cargar sus tareas.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const toggleStatus = async (taskId: string, currentStatus: string | null) => {
    const newStatus = nextStatus[currentStatus ?? 'pendiente'] ?? 'pendiente';
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        tasks: g.tasks
          .map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
          .sort((a, b) => (statusOrder[a.status ?? ''] ?? 9) - (statusOrder[b.status ?? ''] ?? 9)),
      }))
    );

    try {
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId);
      if (updateError) throw updateError;
    } catch (err) {
      console.error('task status update failed', err);
      loadTasks();
    }
  };

  const toggleGroup = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalTasks = groups.reduce((sum, g) => sum + g.tasks.length, 0);
  const doneTasks = groups.reduce(
    (sum, g) => sum + g.tasks.filter((t) => t.status === 'hecha').length,
    0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-stone-900" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Sin acceso"
        message={error}
        icon={<CalendarDays size={40} />}
      />
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-stone-900">Mi semana</h1>
        <p className="mt-1 text-sm text-stone-500">
          {profile?.full_name ? `Hola, ${profile.full_name}.` : 'Hola.'}{' '}
          {totalTasks > 0
            ? `Tiene ${doneTasks} de ${totalTasks} tareas completadas.`
            : 'No tiene tareas asignadas.'}
        </p>
      </div>

      {totalTasks === 0 ? (
        <EmptyState
          title="Sin tareas asignadas"
          message="No tiene tareas asignadas esta semana. Cuando se le asigne una tarea, aparecerá aquí."
          icon={<CalendarDays size={40} />}
        />
      ) : (
        <div className="space-y-4">
          {groups.map((group) => {
            const isOpen = expanded.has(group.project.id);
            const projectDone = group.tasks.filter((t) => t.status === 'hecha').length;
            return (
              <div key={group.project.id} className="card overflow-hidden">
                <button
                  onClick={() => toggleGroup(group.project.id)}
                  className="flex w-full items-center justify-between px-5 py-4 hover:bg-stone-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isOpen ? (
                      <ChevronDown size={18} className="text-stone-400" />
                    ) : (
                      <ChevronRight size={18} className="text-stone-400" />
                    )}
                    <div className="text-left">
                      <p className="text-sm font-medium text-stone-900">{group.project.name}</p>
                      {group.project.division && (
                        <span className="text-xs text-stone-400">{group.project.division}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-stone-500">
                    {projectDone}/{group.tasks.length}
                  </span>
                </button>

                {isOpen && (
                  <div className="border-t border-stone-100">
                    {group.tasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-3 px-5 py-3 hover:bg-stone-50 transition-colors border-b border-stone-50 last:border-b-0"
                      >
                        <button
                          onClick={() => toggleStatus(task.id, task.status)}
                          className="flex-shrink-0 transition-transform active:scale-90"
                          title="Cambiar estado"
                        >
                          {task.status === 'hecha' ? (
                            <div className="h-5 w-5 rounded-full bg-teal-600 flex items-center justify-center">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </div>
                          ) : (
                            <div className={`h-5 w-5 rounded-full border-2 ${task.status === 'en curso' ? 'border-amber-400 bg-amber-50' : 'border-stone-300'}`} />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${task.status === 'hecha' ? 'text-stone-400 line-through' : 'text-stone-800'}`}>
                            {task.title}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-xs text-stone-400">{formatDate(task.due_date)}</span>
                          <StatusBadge status={task.status} variant="task" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
