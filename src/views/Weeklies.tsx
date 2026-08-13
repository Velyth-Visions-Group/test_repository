import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import type { Weekly, WeeklyKind, Division } from '@/types/database';
import { formatDate, getWeekStart, formatDateTime } from '@/lib/helpers';
import EmptyState from '@/components/EmptyState';
import Modal from '@/components/Modal';
import { FileText, Plus } from 'lucide-react';

const divisions: (Division | 'todas')[] = ['todas', 'VVG', 'VNS', 'VTS', 'DSS'];
const kinds: (WeeklyKind | 'ambos')[] = ['ambos', 'kickoff', 'digest'];

const kindLabels: Record<string, string> = {
  kickoff: 'Kickoff',
  digest: 'Digest',
};

// Estructura del ritual (Operations One 2.7): el reporte nace con guía,
// nunca con una página en blanco.
const weeklyTemplates: Record<WeeklyKind, string> = {
  kickoff: 'Objetivo de la semana:\n\nTareas comprometidas:\n\nBloqueos conocidos:\n',
  digest: 'Avances de la semana:\n\nEntregas realizadas:\n\nPendientes para la próxima semana:\n',
};

export default function Weeklies() {
  const { profile } = useAuth();
  const { show } = useToast();
  const [weeklies, setWeeklies] = useState<Weekly[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterDiv, setFilterDiv] = useState<Division | 'todas'>('todas');
  const [filterKind, setFilterKind] = useState<WeeklyKind | 'ambos'>('ambos');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    kind: 'kickoff' as WeeklyKind,
    division: (profile?.division ?? 'VVG') as Division,
    week_start: getWeekStart(),
    content: weeklyTemplates.kickoff,
  });
  const [saving, setSaving] = useState(false);

  const loadWeeklies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('weeklies')
        .select(`
          id, division, kind, week_start, content, created_at, author_id,
          author:profiles!weeklies_author_id_fkey(id, full_name)
        `)
        .order('week_start', { ascending: false })
        .order('created_at', { ascending: false });

      if (filterDiv !== 'todas') query = query.eq('division', filterDiv);
      if (filterKind !== 'ambos') query = query.eq('kind', filterKind);

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;
      setWeeklies((data ?? []) as unknown as Weekly[]);
    } catch (err) {
      console.error('weeklies load failed', err);
      setError('No se pudieron cargar los semanales.');
    } finally {
      setLoading(false);
    }
  }, [filterDiv, filterKind]);

  useEffect(() => {
    loadWeeklies();
  }, [loadWeeklies]);

  const openCreate = () => {
    setForm({
      kind: 'kickoff',
      division: (profile?.division ?? 'VVG') as Division,
      week_start: getWeekStart(),
      content: weeklyTemplates.kickoff,
    });
    setModalOpen(true);
  };

  const handleKindChange = (kind: WeeklyKind) => {
    setForm((prev) => ({
      ...prev,
      kind,
      content:
        prev.content === '' ||
        prev.content === weeklyTemplates.kickoff ||
        prev.content === weeklyTemplates.digest
          ? weeklyTemplates[kind]
          : prev.content,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error: insertError } = await supabase.from('weeklies').insert({
        kind: form.kind,
        division: form.division,
        week_start: form.week_start,
        content: form.content.trim(),
      });

      if (insertError) throw insertError;
      setModalOpen(false);
      show('Reporte publicado');
      loadWeeklies();
    } catch (err) {
      console.error('weekly save failed', err);
      setError('No se pudo guardar el reporte.');
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

  if (error && weeklies.length === 0) {
    return (
      <EmptyState
        title="Sin acceso"
        message={error}
        icon={<FileText size={40} />}
      />
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-stone-900">Semanales</h1>
          <p className="mt-1 text-sm text-stone-500">Kickoffs del lunes y digests del viernes</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={16} />
          Nuevo reporte
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        <div>
          <label className="label" htmlFor="filter-div">División</label>
          <select
            id="filter-div"
            value={filterDiv}
            onChange={(e) => setFilterDiv(e.target.value as Division | 'todas')}
            className="input-field w-auto pr-8"
          >
            {divisions.map((d) => (
              <option key={d} value={d}>{d === 'todas' ? 'Todas' : d}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="filter-kind">Tipo</label>
          <select
            id="filter-kind"
            value={filterKind}
            onChange={(e) => setFilterKind(e.target.value as WeeklyKind | 'ambos')}
            className="input-field w-auto pr-8"
          >
            {kinds.map((k) => (
              <option key={k} value={k}>{k === 'ambos' ? 'Ambos' : kindLabels[k]}</option>
            ))}
          </select>
        </div>
      </div>

      {weeklies.length === 0 ? (
        <EmptyState
          title="Sin reportes"
          message="No hay reportes semanales que coincidan con los filtros seleccionados. El kickoff se publica el lunes y el digest el viernes."
          icon={<FileText size={40} />}
          action={
            <button onClick={openCreate} className="btn-primary">
              <Plus size={16} />
              Nuevo reporte
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {weeklies.map((weekly) => (
            <div key={weekly.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${weekly.kind === 'kickoff' ? 'bg-teal-50 text-teal-600' : 'bg-stone-100 text-stone-600'}`}>
                    <FileText size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-stone-900">
                      {kindLabels[weekly.kind ?? ''] ?? weekly.kind}
                    </p>
                    <p className="text-xs text-stone-500">
                      {weekly.author?.full_name ?? '—'} · {formatDate(weekly.week_start)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {weekly.division && (
                    <span className="inline-flex items-center rounded bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
                      {weekly.division}
                    </span>
                  )}
                  <span className="text-xs text-stone-400">{formatDateTime(weekly.created_at)}</span>
                </div>
              </div>
              {weekly.content && (
                <p className="mt-3 text-sm text-stone-600 whitespace-pre-wrap leading-relaxed">
                  {weekly.content}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nuevo reporte semanal"
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="wk-kind">Tipo</label>
              <select
                id="wk-kind"
                value={form.kind}
                onChange={(e) => handleKindChange(e.target.value as WeeklyKind)}
                className="input-field"
              >
                <option value="kickoff">Kickoff (lunes)</option>
                <option value="digest">Digest (viernes)</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="wk-div">División</label>
              <select
                id="wk-div"
                value={form.division}
                onChange={(e) => setForm({ ...form, division: e.target.value as Division })}
                className="input-field"
              >
                {(['VVG', 'VNS', 'VTS', 'DSS'] as Division[]).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label" htmlFor="wk-week">Inicio de semana</label>
            <input
              id="wk-week"
              type="date"
              value={form.week_start}
              onChange={(e) => setForm({ ...form, week_start: e.target.value })}
              className="input-field"
            />
          </div>

          <div>
            <label className="label" htmlFor="wk-content">Contenido</label>
            <textarea
              id="wk-content"
              rows={8}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="input-field resize-none"
              placeholder="Complete las secciones del reporte..."
            />
            <p className="mt-1.5 text-xs text-stone-400">
              La estructura viene cargada según el tipo de reporte; reemplace cada sección con su contenido.
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Guardando...' : 'Publicar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
