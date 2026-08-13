import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import type { Project, Profile, Client, Division } from '@/types/database';
import { formatDate } from '@/lib/helpers';
import EmptyState from '@/components/EmptyState';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';
import { FolderKanban, Plus, Pencil } from 'lucide-react';

const divisions: Division[] = ['VVG', 'VNS', 'VTS', 'DSS'];
const projectStatuses = ['activo', 'pausado', 'completado', 'cancelado'];

export default function Projects() {
  const { show } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [leads, setLeads] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState({
    name: '', client_id: '', division: '', status: 'activo', lead_id: '', target_date: '',
  });
  const [saving, setSaving] = useState(false);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from('projects')
        .select(`
          id, name, division, status, target_date, client_id, lead_id,
          client:clients(id, name),
          lead:profiles!projects_lead_id_fkey(id, full_name)
        `)
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;
      setProjects((data ?? []) as unknown as Project[]);
    } catch (err) {
      console.error('projects load failed', err);
      setError('No se pudieron cargar los proyectos.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadOptions = useCallback(async () => {
    try {
      const [clientsRes, leadsRes] = await Promise.all([
        supabase.from('clients').select('id, name, division').order('name'),
        supabase.from('profiles').select('id, full_name, roles').order('full_name'),
      ]);
      if (!clientsRes.error) setClients(clientsRes.data as Client[]);
      if (!leadsRes.error) {
        const internalLeads = (leadsRes.data as Profile[]).filter((p) =>
          p.roles?.some((r) => ['owner', 'lead'].includes(r))
        );
        setLeads(internalLeads);
      }
    } catch (err) {
      console.error('options load failed', err);
    }
  }, []);

  useEffect(() => {
    loadProjects();
    loadOptions();
  }, [loadProjects, loadOptions]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', client_id: '', division: '', status: 'activo', lead_id: '', target_date: '' });
    setModalOpen(true);
  };

  const openEdit = (project: Project) => {
    setEditing(project);
    setForm({
      name: project.name,
      client_id: project.client_id ?? '',
      division: project.division ?? '',
      status: project.status ?? 'activo',
      lead_id: project.lead_id ?? '',
      target_date: project.target_date ?? '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        name: form.name.trim(),
        client_id: form.client_id || null,
        division: form.division || null,
        status: form.status,
        lead_id: form.lead_id || null,
        target_date: form.target_date || null,
      };

      if (editing) {
        const { error: updateError } = await supabase
          .from('projects')
          .update(payload)
          .eq('id', editing.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from('projects').insert(payload);
        if (insertError) throw insertError;
      }

      setModalOpen(false);
      show(editing ? 'Proyecto actualizado' : 'Proyecto creado');
      loadProjects();
    } catch (err) {
      console.error('project save failed', err);
      setError('No se pudo guardar el proyecto.');
      show('No se pudo guardar el proyecto', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-stone-900" />
      </div>
    );
  }

  if (error && projects.length === 0) {
    return (
      <EmptyState
        title="Sin acceso"
        message={error}
        icon={<FolderKanban size={40} />}
      />
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-stone-900">Proyectos</h1>
          <p className="mt-1 text-sm text-stone-500">Todo proyecto lleva cliente, división y responsable.</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={16} />
          Nuevo proyecto
        </button>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          title="Sin proyectos"
          message="Aún no hay proyectos registrados. Cree el primero con el botón de arriba; recuerde asignar división y responsable."
          icon={<FolderKanban size={40} />}
          action={
            <button onClick={openCreate} className="btn-primary">
              <Plus size={16} />
              Nuevo proyecto
            </button>
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50">
                  <th className="px-5 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Proyecto</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">División</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Estado</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Fecha objetivo</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-stone-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {projects.map((project) => (
                  <tr key={project.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <Link to={`/proyectos/${project.id}`} className="text-sm font-medium text-stone-900 hover:text-teal-700 transition-colors">
                        {project.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-stone-600">
                      {project.client?.name ?? '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      {project.division ? (
                        <span className="inline-flex items-center rounded bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
                          {project.division}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={project.status} variant="project" />
                    </td>
                    <td className="px-5 py-3.5 text-sm text-stone-600">
                      {formatDate(project.target_date)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => openEdit(project)}
                        className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
                        title="Editar"
                      >
                        <Pencil size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar proyecto' : 'Nuevo proyecto'}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label" htmlFor="proj-name">Nombre del proyecto</label>
            <input
              id="proj-name"
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-field"
              placeholder="Nombre del proyecto"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="proj-client">Cliente</label>
              <select
                id="proj-client"
                value={form.client_id}
                onChange={(e) => setForm({ ...form, client_id: e.target.value })}
                className="input-field"
              >
                <option value="">Sin cliente</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="proj-division">División</label>
              <select
                id="proj-division"
                value={form.division}
                onChange={(e) => setForm({ ...form, division: e.target.value })}
                className="input-field"
              >
                <option value="">Sin asignar</option>
                {divisions.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="proj-status">Estado</label>
              <select
                id="proj-status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="input-field"
              >
                {projectStatuses.map((s) => (
                  <option key={s} value={s} className="capitalize">{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="proj-date">Fecha objetivo</label>
              <input
                id="proj-date"
                type="date"
                value={form.target_date}
                onChange={(e) => setForm({ ...form, target_date: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="proj-lead">Responsable</label>
            <select
              id="proj-lead"
              value={form.lead_id}
              onChange={(e) => setForm({ ...form, lead_id: e.target.value })}
              className="input-field"
            >
              <option value="">Sin asignar</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>{l.full_name ?? 'Sin nombre'}</option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
