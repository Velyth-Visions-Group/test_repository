import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Project, Task } from '@/types/database';
import { formatDate } from '@/lib/helpers';
import EmptyState from '@/components/EmptyState';
import StatusBadge from '@/components/StatusBadge';
import { Briefcase, ListChecks, Calendar } from 'lucide-react';

export default function MyProject() {
  const { profile } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile?.client_id) {
      setError('Su cuenta no está vinculada a un cliente.');
      setLoading(false);
      return;
    }

    try {
      const { data: projData, error: projError } = await supabase
        .from('projects')
        .select(`
          id, name, division, status, target_date, client_id, lead_id,
          client:clients(id, name),
          lead:profiles!projects_lead_id_fkey(id, full_name)
        `)
        .eq('client_id', profile.client_id)
        .order('created_at', { ascending: false })
        .maybeSingle();

      if (projError) throw projError;
      setProject((projData as unknown as Project) ?? null);

      if (projData) {
        const { data: taskData } = await supabase
          .from('tasks')
          .select(`
            id, title, status, due_date, division,
            assignee:profiles!tasks_assignee_id_fkey(id, full_name)
          `)
          .eq('project_id', (projData as { id: string }).id)
          .order('due_date', { ascending: true, nullsFirst: false });
        setTasks((taskData ?? []) as unknown as Task[]);
      }
    } catch (err) {
      console.error('myproject load failed', err);
      setError('No se pudo cargar su proyecto.');
    } finally {
      setLoading(false);
    }
  }, [profile?.client_id]);

  useEffect(() => {
    load();
  }, [load]);

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
        icon={<Briefcase size={40} />}
      />
    );
  }

  if (!project) {
    return (
      <EmptyState
        title="Sin proyecto"
        message="Aún no tiene un proyecto asignado. Cuando se le asigne uno, aparecerá aquí."
        icon={<Briefcase size={40} />}
      />
    );
  }

  const doneTasks = tasks.filter((t) => t.status === 'hecha').length;

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-stone-900">Mi proyecto</h1>
        <p className="mt-1 text-sm text-stone-500">Estado de su proyecto en Velyth</p>
      </div>

      {/* Project header */}
      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-medium text-stone-900">{project.name}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              {project.division && (
                <span className="inline-flex items-center rounded bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
                  {project.division}
                </span>
              )}
              <StatusBadge status={project.status} variant="project" />
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-stone-50 p-4">
            <div className="flex items-center gap-2 text-stone-400 mb-1">
              <Calendar size={14} />
              <p className="text-xs uppercase tracking-wider">Fecha objetivo</p>
            </div>
            <p className="text-sm font-medium text-stone-800">{formatDate(project.target_date)}</p>
          </div>
          <div className="rounded-lg bg-stone-50 p-4">
            <div className="flex items-center gap-2 text-stone-400 mb-1">
              <Briefcase size={14} />
              <p className="text-xs uppercase tracking-wider">Responsable</p>
            </div>
            <p className="text-sm font-medium text-stone-800">{project.lead?.full_name ?? 'Sin asignar'}</p>
          </div>
          <div className="rounded-lg bg-stone-50 p-4">
            <div className="flex items-center gap-2 text-stone-400 mb-1">
              <ListChecks size={14} />
              <p className="text-xs uppercase tracking-wider">Progreso</p>
            </div>
            <p className="text-sm font-medium text-stone-800">
              {doneTasks} / {tasks.length} tareas completadas
            </p>
          </div>
        </div>
      </div>

      {/* Tasks (read-only) */}
      {tasks.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-medium text-stone-700 uppercase tracking-wider">Tareas</h3>
          <div className="card overflow-hidden">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 px-5 py-3.5 border-b border-stone-50 last:border-b-0"
              >
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${task.status === 'hecha' ? 'text-stone-400 line-through' : 'text-stone-800'}`}>
                    {task.title}
                  </p>
                  {task.assignee?.full_name && (
                    <p className="text-xs text-stone-400 mt-0.5">{task.assignee.full_name}</p>
                  )}
                </div>
                <span className="text-xs text-stone-400">{formatDate(task.due_date)}</span>
                <StatusBadge status={task.status} variant="task" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
