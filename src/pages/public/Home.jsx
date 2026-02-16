import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { LayoutDashboard } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Verificamos si hay alguien logueado (la doctora)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col items-center justify-center p-6 relative">
      <h1 className="text-5xl font-bold text-slate-800 mb-4">Dra. Psicología</h1>
      <p className="text-xl text-slate-600 mb-8 text-center max-w-lg">
        Bienvenido a mi consultorio virtual. Aquí puedes agendar tu cita de manera rápida y privada.
      </p>

      <div className="space-x-4">
        <Link
          to="/agendar"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all"
        >
          Agendar Cita
        </Link>
        <Link
          to="/login"
          className="text-indigo-600 font-semibold hover:underline"
        >
          Soy la Doctora
        </Link>
      </div>

      {/* --- NUEVO: Botón Flotante para Admin --- */}
      {session && (
        <Link
          to="/admin"
          className="fixed top-6 right-6 bg-white text-indigo-600 px-4 py-2 rounded-full shadow-lg font-bold flex items-center gap-2 hover:bg-indigo-50 transition-all border border-indigo-100 z-50"
        >
          <LayoutDashboard size={18} />
          Ir al Panel Admin
        </Link>
      )}

    </div>
  );
}