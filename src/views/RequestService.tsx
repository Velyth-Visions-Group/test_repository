import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { LayoutDashboard, ArrowLeft, CheckCircle2 } from 'lucide-react';

const services = [
  'Branding e identidad',
  'Desarrollo web',
  'Producción audiovisual',
  'Estrategia digital',
  'Diseño gráfico',
  'Otro',
];

export default function RequestService() {
  const [form, setForm] = useState({ name: '', email: '', service: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: insertError } = await supabase.from('intake_requests').insert({
        name: form.name.trim(),
        email: form.email.trim(),
        service: form.service,
        message: form.message.trim(),
        status: 'nuevo',
      });

      if (insertError) throw insertError;
      setSubmitted(true);
    } catch (err) {
      console.error('intake insert failed', err);
      setError('No se pudo enviar la solicitud. Inténtelo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-900 text-white">
              <LayoutDashboard size={16} />
            </div>
            <span className="text-sm font-semibold text-stone-900">Velyth</span>
          </div>
          <Link
            to="/login"
            className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
          >
            Acceso al portal
          </Link>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          {submitted ? (
            <div className="card p-8 text-center animate-fade-in">
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-600">
                <CheckCircle2 size={22} />
              </div>
              <h1 className="text-lg font-medium text-stone-900">Solicitud recibida</h1>
              <p className="mt-2 text-sm text-stone-500 leading-relaxed">
                Gracias por su interés. Nuestro equipo revisará su solicitud y se pondrá en
                contacto con usted a la brevedad.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setForm({ name: '', email: '', service: '', message: '' });
                }}
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
              >
                <ArrowLeft size={15} />
                Enviar otra solicitud
              </button>
            </div>
          ) : (
            <div className="card p-8 animate-fade-in">
              <h1 className="text-xl font-medium text-stone-900">Solicitar servicio</h1>
              <p className="mt-2 text-sm text-stone-500">
                Complete el formulario y un asesor de Velyth se comunicará con usted.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="label" htmlFor="name">Nombre completo</label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input-field"
                    placeholder="Su nombre"
                  />
                </div>

                <div>
                  <label className="label" htmlFor="email">Correo electrónico</label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="input-field"
                    placeholder="nombre@empresa.com"
                  />
                </div>

                <div>
                  <label className="label" htmlFor="service">Servicio de interés</label>
                  <select
                    id="service"
                    value={form.service}
                    onChange={(e) => setForm({ ...form, service: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Seleccione un servicio</option>
                    {services.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label" htmlFor="message">Mensaje</label>
                  <textarea
                    id="message"
                    rows={4}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="input-field resize-none"
                    placeholder="Cuéntenos sobre su proyecto"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || !form.name.trim() || !form.email.trim()}
                  className="btn-primary w-full"
                >
                  {loading ? 'Enviando...' : 'Enviar solicitud'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
