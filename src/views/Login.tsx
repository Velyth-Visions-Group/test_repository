import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { LayoutDashboard, ArrowLeft, Mail } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: window.location.origin },
      });

      if (otpError) throw otpError;
      setSent(true);
    } catch (err) {
      console.error('login failed', err);
      setError('No se pudo enviar el enlace. Verifique el correo e inténtelo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Brand header */}
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-900 text-white">
              <LayoutDashboard size={16} />
            </div>
            <span className="text-sm font-semibold text-stone-900">Velyth</span>
          </div>
          <Link
            to="/solicitar"
            className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
          >
            Solicitar servicio
          </Link>
        </div>
      </header>

      {/* Main */}
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          {sent ? (
            <div className="card p-8 text-center animate-fade-in">
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-600">
                <Mail size={22} />
              </div>
              <h1 className="text-lg font-medium text-stone-900">Revise su correo</h1>
              <p className="mt-2 text-sm text-stone-500 leading-relaxed">
                Hemos enviado un enlace de acceso a <strong className="text-stone-700">{email}</strong>.
                Haga clic en el enlace para ingresar al portal.
              </p>
              <button
                onClick={() => {
                  setSent(false);
                  setEmail('');
                }}
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
              >
                <ArrowLeft size={15} />
                Volver
              </button>
            </div>
          ) : (
            <div className="card p-8 animate-fade-in">
              <h1 className="text-xl font-medium text-stone-900">Acceso al portal</h1>
              <p className="mt-2 text-sm text-stone-500">
                Ingrese su correo y le enviaremos un enlace de acceso sin contraseña.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="label" htmlFor="email">Correo electrónico</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                    placeholder="nombre@velyth.com"
                    required
                    autoFocus
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="btn-primary w-full"
                >
                  {loading ? 'Enviando...' : 'Enviar enlace de acceso'}
                </button>
              </form>
            </div>
          )}

          <p className="mt-6 text-center text-xs text-stone-400">
            Velyth Visions Group LLC
          </p>
        </div>
      </div>
    </div>
  );
}
