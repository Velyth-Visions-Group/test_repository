interface StatusBadgeProps {
  status: string | null | undefined;
  variant?: 'task' | 'project' | 'client' | 'intake' | 'neutral';
}

const taskStyles: Record<string, string> = {
  'pendiente': 'bg-stone-100 text-stone-600',
  'en curso': 'bg-amber-50 text-amber-700',
  'hecha': 'bg-teal-50 text-teal-700',
};

const projectStyles: Record<string, string> = {
  'activo': 'bg-teal-50 text-teal-700',
  'pausado': 'bg-stone-100 text-stone-600',
  'completado': 'bg-stone-50 text-stone-400',
  'cancelado': 'bg-red-50 text-red-600',
};

const intakeStyles: Record<string, string> = {
  'nuevo': 'bg-teal-50 text-teal-700',
  'en revisión': 'bg-amber-50 text-amber-700',
  'convertido': 'bg-stone-100 text-stone-600',
  'descartado': 'bg-red-50 text-red-600',
};

const clientStyles: Record<string, string> = {
  'activo': 'bg-teal-50 text-teal-700',
  'inactivo': 'bg-stone-100 text-stone-500',
};

export default function StatusBadge({ status, variant = 'neutral' }: StatusBadgeProps) {
  if (!status) return <span className="text-stone-400 text-sm">—</span>;

  let styles: string;
  if (variant === 'task') styles = taskStyles[status] ?? 'bg-stone-100 text-stone-600';
  else if (variant === 'project') styles = projectStyles[status] ?? 'bg-stone-100 text-stone-600';
  else if (variant === 'intake') styles = intakeStyles[status] ?? 'bg-stone-100 text-stone-600';
  else if (variant === 'client') styles = clientStyles[status] ?? 'bg-stone-100 text-stone-600';
  else styles = 'bg-stone-100 text-stone-600';

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles}`}
    >
      {status}
    </span>
  );
}
