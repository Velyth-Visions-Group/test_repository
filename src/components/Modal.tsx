import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export default function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizeClass = size === 'sm' ? 'max-w-md' : size === 'lg' ? 'max-w-3xl' : 'max-w-lg';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-stone-900/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        className={`relative z-10 w-full ${sizeClass} max-h-[90vh] overflow-y-auto rounded-xl border border-stone-200 bg-white shadow-xl animate-fade-in`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
          <h2 className="text-base font-medium text-stone-900">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
