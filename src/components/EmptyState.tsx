import type { ReactNode } from 'react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export default function EmptyState({
  title = 'Sin resultados',
  message = 'No hay elementos para mostrar.',
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      {icon && <div className="mb-4 text-stone-300">{icon}</div>}
      <h3 className="text-base font-medium text-stone-700">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-stone-500">{message}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
