import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import type { Project, Task, Profile, TaskStatus, Division } from '@/types/database';
import { formatDate } from '@/lib/helpers';
import EmptyState from '@/components/EmptyState';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';
import { ArrowLeft, Plus, ListChecks } from 'lucide-react';

const taskStatuses: TaskStatus[] = ['pendiente', 'en curso', 'hecha'];
const divisions: Division[] = ['VVG', 'VNS', 'VTS', 'DSS'];

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { show } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [assignees, setAssignees] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskForm, setTaskForm] = useState({ title: '', assignee_id: '', due_date: '', division: '', status: 'pendiente' as TaskStatus });
  const [savingTask, setSavingTask] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const canEdit = profile?.roles?.some((r) => ['owner', 'lead'].includes(r)) ?? false;

  const loadProject = useCallback(async () => {
    if (!id) return;
    try {
      const { data, error: queryError } = await supabase
        .from('projects')
        .select(`
          id, name, division, status, target_date, client_id, lead_id,
          client:clients(id, name),
          lead:profiles!projects_lead_id_fkey(id, full_name)
        `)
        .eq('id', id)
        .maybeSingle();

      if (queryError) throw queryError;
      setProject((data as unknown as Project) ?? null);
    } catch (err) {
      console.error('project detail load failed', err);
      setError('No se pudo cargar el proyecto.');
    }
  }, [id]);

  const loadTasks = useCallback(async () => {
    if (!id) return;
    try {
      const { data, error: queryError } = await supabase
        .from('tasks')
        .select(`
          id, title, status, due_date, division, assignee_id, project_id,
          assignee:profiles!tasks_assignee_id_fkey(id, full_name)
        `)
        .eq('project_id', id)
        .order('created_at', { ascending: true });

      if (queryError) throw queryError;
      setTasks((data ?? []) as unknown as Task[]);
    } catch (err) {
      console.error('tasks load failed', err);
    }
  }, [id]);

  const loadAssignees = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, roles')
        .order('full_name');
      if (data) {
        const internal = (data as Profile[]).filter((p) =>
          p.roles?.some((r) => ['owner', 'lead', 'executor'].includes(r))
        );
        setAssignees(internal);
      }
    } catch (err) {
      console.error('assignees load failed', err);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadProject(), loadTasks(), loadAssignees()]);
      setLoading(false);
    })();
  }, [loadProject, loadTasks, loadAssignees]);

  const openCreateTask = () => {
    setEditingTask(null);
    setConfirmingDelete(false);
    setTaskForm({ title: '', assignee_id: '', due_date: '', division: project?.division ?? '', status: 'pendiente' });
    setModalOpen(true);
  };

  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setConfirmingDelete(false);
    setTaskForm({
      title: task.title,
      assignee_id: task.assignee_id ?? '',
      due_date: task.due_date ?? '',
      division: task.division ?? '',
      status: task.status ?? 'pendiente',
    });
    setModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSavingTask(true);

    try {
      const payload = {
        project_id: id,
        title: taskForm.title.trim(),
        assignee_id: taskForm.assignee_id || null,
        due_date: taskForm.due_date || null,
        division: taskForm.division || null,
        status: taskForm.status,
      };

      if (editingTask) {
        const { error: updateError } = await supabase.from('tasks').update(payload).eq('id', editingTask.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from('tasks').insert(payload);
        if (insertError) throw insertError;
      }

      setModalOpen(false);
      show(editingTask ? 'Tarea actualizada' : 'Tarea creada');
      loadTasks();
    } catch (err) {
      console.error('task save failed', err);
      setError('No se pudo guardar la tarea.');
      show('No se pudo guardar la tarea', 'error');
    } finally {
      setSavingTask(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error: deleteError } = await supabase.from('tasks').delete().eq('id', taskId);
      if (deleteError) throw deleteError;
      show('Tarea eliminada');
      loadTasks();
    } catch (err) {
      console.error('task delete failed', err);
      show('No se pudo eliminar la tarea', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-stone-900" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <EmptyState
        title="Sin acceso"
        message={error ?? 'No se encontró el proyecto.'}
        icon={<ListChecks size={40} />}
        action={
          <Link to="/proyectos" className="btn-secondary">
            <ArrowLeft size={15} />
            Volver a proyectos
          </Link>
        }
      />
    );
  }

  return (
    <div>
      <button
        onClick={() => navigate('/proyectos')}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 transition-colors"
      >
        <ArrowLeft size={15} />
        Proyectos
      </button>

      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-medium text-stone-900">{project.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              {project.client?.name && (
                <span className="text-sm text-stone-500">{project.client.name}</span>
              )}
              {project.division && (
                <span className="inline-flex items-center rounded bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
                  {project.division}
                </span>
              )}
              <StatusBadge status={project.status} variant="project" />
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="card p-4">
            <p className="text-xs text-stone-500 uppercase tracking-wider">Responsable</p>
            <p className="mt-1 text-sm font-medium text-stone-800">{project.lead?.full_name ?? 'Sin asignar'}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-stone-500 uppercase tracking-wider">Fecha objetivo</p>
            <p className="mt-1 text-sm font-medium text-stone-800">{formatDate(project.target_date)}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-stone-500 uppercase tracking-wider">Tareas</p>
            <p className="mt-1 text-sm font-medium text-stone-800">
              {tasks.filter((t) => t.status === 'hecha').length} / {tasks.length} completadas
            </p>
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium text-stone-900">Tareas</h2>
        {canEdit && (
          <button onClick={openCreateTask} className="btn-primary">
            <Plus size={16} />
            Nueva tarea
          </button>
        )}
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          title="Sin tareas"
          message="Este proyecto aún no tiene tareas. Cada tarea lleva responsable y fecha límite."
          icon={<ListChecks size={40} />}
          action={canEdit ? (
            <button onClick={openCreateTask} className="btn-primary">
              <Plus size={16} />
              Nueva tarea
            </button>
          ) : undefined}
        />
      ) : (
        <div className="card overflow-hidden">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 px-5 py-3.5 hover:bg-stone-50 transition-colors border-b border-stone-50 last:border-b-0"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-stone-800">{task.title}</p>
                <p className="text-xs text-stone-400 mt-0.5">
                  {task.assignee?.full_name ?? 'Sin asignar'} · {formatDate(task.due_date)}
                </p>
              </div>
              <StatusBadge status={task.status} variant="task" />
              {canEdit && (
                <button
                  onClick={() => openEditTask(task)}
                  className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
                  title="Editar"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setConfirmingDelete(false);
        }}
        title={editingTask ? 'Editar tarea' : 'Nueva tarea'}
        size="md"
      >
        <form onSubmit={handleSaveTask} className="space-y-4">
          <div>
            <label className="label" htmlFor="task-title">Título</label>
            <input
              id="task-title"
              type="text"
              required
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              className="input-field"
              placeholder="Título de la tarea"
            />
          </div>

          <div>
            <label className="label" htmlFor="task-assignee">Responsable</label>
            <select
              id="task-assignee"
              value={taskForm.assignee_id}
              onChange={(e) => setTaskForm({ ...taskForm, assignee_id: e.target.value })}
              className="input-field"
            >
              <option value="">Sin asignar</option>
              {assignees.map((a) => (
                <option key={a.id} value={a.id}>{a.full_name ?? 'Sin nombre'}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="task-due">Fecha límite</label>
              <input
                id="task-due"
                type="date"
                value={taskForm.due_date}
                onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="label" htmlFor="task-division">División</label>
              <select
                id="task-division"
                value={taskForm.division}
                onChange={(e) => setTaskForm({ ...taskForm, division: e.target.value })}
                className="input-field"
              >
                <option value="">Sin asignar</option>
                {divisions.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label" htmlFor="task-status">Estado</label>
            <select
              id="task-status"
              value={taskForm.status}
              onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value as TaskStatus })}
              className="input-field"
            >
              {taskStatuses.map((s) => (
                <option key={s} value={s} className="capitalize">{s}</option>
              ))}
            </select>
          </div>

          {editingTask && canEdit && (
            confirmingDelete ? (
              <div className="flex items-center gap-3 rounded-lg bg-red-50 px-3 py-2">
                <p className="flex-1 text-xs text-red-600">
                  Se elimina "{editingTask.title}" de forma permanente.
                </p>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="text-xs font-medium text-stone-500 hover:text-stone-700"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleDeleteTask(editingTask.id);
                    setModalOpen(false);
                    setConfirmingDelete(false);
                  }}
                  className="text-xs font-semibold text-red-600 hover:text-red-700"
                >
                  Confirmar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="text-sm text-red-600 hover:text-red-700 transition-colors"
              >
                Eliminar tarea
              </button>
            )
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => {
              setModalOpen(false);
              setConfirmingDelete(false);
            }} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={savingTask} className="btn-primary">
              {savingTask ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
