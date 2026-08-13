import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { IntakeRequest, IntakeStatus } from '@/types/database';
import { formatDateTime } from '@/lib/helpers';
import EmptyState from '@/components/EmptyState';
import StatusBadge from '@/components/StatusBadge';
import { Inbox } from 'lucide-react';

const statuses: IntakeStatus[] = ['nuevo', 'en revisión', 'convertido', 'descartado'];

export default function Intake() {
  const [requests, setRequests] = useState<IntakeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<IntakeStatus | 'todos'>('todos');

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('intake_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'todos') query = query.eq('status', filter);

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;
      setRequests((data ?? []) as IntakeRequest[]);
    } catch (err) {
      console.error('intake load failed', err);
      setError('No se pudieron cargar las solicitudes.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const updateStatus = async (id: string, status: IntakeStatus) => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    try {
      const { error: updateError } = await supabase
        .from('intake_requests')
        .update({ status })
        .eq('id', id);
      if (updateError) throw updateError;
    } catch (err) {
      console.error('intake status update failed', err);
      loadRequests();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-stone-900" />
      </div>
    );
  }

  if (error && requests.length === 0) {
    return (
      <EmptyState
        title="Sin acceso"
        message={error}
        icon={<Inbox size={40} />}
      />
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-stone-900">Intake</h1>
        <p className="mt-1 text-sm text-stone-500">Solicitudes de servicio recibidas</p>
      </div>

      {/* Filter tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {(['todos', ...statuses] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors capitalize ${
              filter === s
                ? 'bg-stone-900 text-white'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {requests.length === 0 ? (
        <EmptyState
          title="Sin solicitudes"
          message="No hay solicitudes que coincidan con el filtro seleccionado."
          icon={<Inbox size={40} />}
        />
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div key={req.id} className="card p-5 animate-fade-in">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-medium text-stone-900">{req.name}</p>
                    <StatusBadge status={req.status} variant="intake" />
                  </div>
                  <p className="mt-1 text-xs text-stone-500">{req.email}</p>
                  {req.service && (
                    <p className="mt-2 text-xs text-stone-400">
                      Servicio: <span className="text-stone-600">{req.service}</span>
                    </p>
                  )}
                  {req.message && (
                    <p className="mt-2 text-sm text-stone-600 leading-relaxed">{req.message}</p>
                  )}
                  <p className="mt-2 text-xs text-stone-400">{formatDateTime(req.created_at)}</p>
                </div>
                <div className="flex-shrink-0">
                  <select
                    value={req.status ?? 'nuevo'}
                    onChange={(e) => updateStatus(req.id, e.target.value as IntakeStatus)}
                    className="input-field w-auto text-sm py-2"
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s} className="capitalize">{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
