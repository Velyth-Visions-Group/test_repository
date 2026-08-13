import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Profile, Client, Role, Division } from '@/types/database';
import EmptyState from '@/components/EmptyState';
import Modal from '@/components/Modal';
import { Users, Save } from 'lucide-react';

const allRoles: Role[] = ['owner', 'lead', 'executor', 'cliente', 'socio'];
const allDivisions: Division[] = ['VVG', 'VNS', 'VTS', 'DSS'];

export default function Admin() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [editRoles, setEditRoles] = useState<Role[]>([]);
  const [editDivision, setEditDivision] = useState<Division | ''>('');
  const [editClientId, setEditClientId] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true });

      if (queryError) throw queryError;
      setProfiles((data ?? []) as Profile[]);
    } catch (err) {
      console.error('profiles load failed', err);
      setError('No se pudieron cargar los perfiles.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadClients = useCallback(async () => {
    try {
      const { data } = await supabase.from('clients').select('id, name').order('name');
      if (data) setClients(data as Client[]);
    } catch (err) {
      console.error('clients load failed', err);
    }
  }, []);

  useEffect(() => {
    loadProfiles();
    loadClients();
  }, [loadProfiles, loadClients]);

  const openEdit = (profile: Profile) => {
    setEditing(profile);
    setEditRoles(profile.roles ?? []);
    setEditDivision(profile.division ?? '');
    setEditClientId(profile.client_id ?? '');
  };

  const toggleRole = (role: Role) => {
    setEditRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    setError(null);

    try {
      const { error: rpcError } = await supabase.rpc('assign_profile_roles', {
        p_profile_id: editing.id,
        p_roles: editRoles,
        p_division: editDivision || null,
      });
      if (rpcError) throw rpcError;

      if (editClientId !== (editing.client_id ?? '')) {
        const { error: linkError } = await supabase.rpc('link_profile_client', {
          p_profile_id: editing.id,
          p_client_id: editClientId || null,
        });
        if (linkError) throw linkError;
      }

      setEditing(null);
      loadProfiles();
    } catch (err) {
      console.error('profile update failed', err);
      setError('No se pudo actualizar el perfil. Verifique sus permisos.');
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

  if (error && profiles.length === 0) {
    return (
      <EmptyState
        title="Sin acceso"
        message={error}
        icon={<Users size={40} />}
      />
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-stone-900">Administración</h1>
        <p className="mt-1 text-sm text-stone-500">
          Gestión de usuarios, roles y divisiones
        </p>
      </div>

      {profiles.length === 0 ? (
        <EmptyState
          title="Sin perfiles"
          message="No hay perfiles de usuario registrados."
          icon={<Users size={40} />}
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50">
                  <th className="px-5 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Nombre</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Roles</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">División</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-stone-500 uppercase tracking-wider">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {profiles.map((p) => {
                  const clientName = clients.find((c) => c.id === p.client_id)?.name;
                  return (
                    <tr key={p.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-5 py-3.5 text-sm font-medium text-stone-900">
                        {p.full_name ?? 'Sin nombre'}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {p.roles?.map((role) => (
                            <span
                              key={role}
                              className="inline-flex items-center rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-stone-600 capitalize"
                            >
                              {role}
                            </span>
                          ))}
                          {(!p.roles || p.roles.length === 0) && (
                            <span className="text-xs text-stone-400">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {p.division ? (
                          <span className="inline-flex items-center rounded bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">
                            {p.division}
                          </span>
                        ) : (
                          <span className="text-xs text-stone-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-stone-600">
                        {clientName ?? '—'}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => openEdit(p)}
                          className="btn-secondary text-xs py-1.5 px-3"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Editar perfil"
        size="md"
      >
        <div className="space-y-5">
          <div>
            <p className="label">Nombre</p>
            <p className="text-sm text-stone-800 font-medium">
              {editing?.full_name ?? 'Sin nombre'}
            </p>
          </div>

          {/* Roles multi-select */}
          <div>
            <p className="label">Roles</p>
            <div className="flex flex-wrap gap-2">
              {allRoles.map((role) => {
                const selected = editRoles.includes(role);
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleRole(role)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                      selected
                        ? 'bg-stone-900 text-white'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {role}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Division */}
          <div>
            <label className="label" htmlFor="admin-div">División</label>
            <select
              id="admin-div"
              value={editDivision}
              onChange={(e) => setEditDivision(e.target.value as Division | '')}
              className="input-field"
            >
              <option value="">Sin asignar</option>
              {allDivisions.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Client link */}
          <div>
            <label className="label" htmlFor="admin-client">Cliente vinculado</label>
            <select
              id="admin-client"
              value={editClientId}
              onChange={(e) => setEditClientId(e.target.value)}
              className="input-field"
            >
              <option value="">Sin vincular</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setEditing(null)} className="btn-secondary">
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="btn-primary"
            >
              <Save size={15} />
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
