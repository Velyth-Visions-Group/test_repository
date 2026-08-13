import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { isInternal, getWeekStart } from '@/lib/helpers';
import { CalendarDays, X } from 'lucide-react';

// Ritual semanal de la casa (Operations One 2.7): kickoff el lunes, digest el
// viernes. El banner aparece solo si la división del usuario no ha publicado
// el reporte de esta semana, y se puede descartar hasta el día siguiente.
export default function RitualBanner() {
  const { profile } = useAuth();
  const [kind, setKind] = useState<'kickoff' | 'digest' | null>(null);

  useEffect(() => {
    const day = new Date().getDay();
    const ritual: 'kickoff' | 'digest' | null = day === 1 ? 'kickoff' : day === 5 ? 'digest' : null;
    if (!ritual || !profile || !isInternal(profile.roles) || !profile.division) return;

    const today = new Date().toISOString().split('T')[0];
    try {
      if (localStorage.getItem(`velyth-ritual:${today}:${ritual}`)) return;
    } catch {}

    (async () => {
      const { count, error } = await supabase
        .from('weeklies')
        .select('id', { count: 'exact', head: true })
        .eq('division', profile.division as string)
        .eq('kind', ritual)
        .eq('week_start', getWeekStart());
      if (!error && (count ?? 0) === 0) setKind(ritual);
    })();
  }, [profile]);

  if (!kind) return null;

  const isKickoff = kind === 'kickoff';

  const dismiss = () => {
    const today = new Date().toISOString().split('T')[0];
    try {
      localStorage.setItem(`velyth-ritual:${today}:${kind}`, '1');
    } catch {}
    setKind(null);
  };

  return (
    <div className="mb-6 flex animate-fade-in items-start gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--accent-soft)] px-4 py-3">
      <CalendarDays size={18} className="mt-0.5 shrink-0 text-[var(--accent)]" />
      <div className="flex-1 text-sm">
        <p className="font-medium text-[var(--color-text)]">
          {isKickoff ? 'Hoy es lunes: toca el Kickoff' : 'Hoy es viernes: toca el Digest'}
        </p>
        <p className="mt-0.5 text-[var(--color-text-muted)]">
          Aún no hay {isKickoff ? 'kickoff' : 'digest'} de esta semana para {profile?.division}.
        </p>
      </div>
      <Link to="/semanales" className="btn-secondary shrink-0 !py-1.5 text-xs">
        Redactar
      </Link>
      <button
        onClick={dismiss}
        className="shrink-0 text-[var(--color-text-faint)] transition-colors hover:text-[var(--color-text)]"
        aria-label="Descartar aviso"
      >
        <X size={16} />
      </button>
    </div>
  );
}
