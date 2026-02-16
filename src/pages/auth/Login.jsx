import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate, Link } from 'react-router-dom'; // Importamos Link
import { Lock, Mail, ChevronLeft, Loader2 } from 'lucide-react'; // Importamos ChevronLeft

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      navigate('/admin');
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 relative">

      {/* --- NUEVO: Botón Flotante para Regresar --- */}
      {/* Lo ponemos fuera de la tarjeta para que se sienta como "volver atrás en la página" */}
      <Link
        to="/"
        className="absolute top-6 left-6 text-slate-500 hover:text-indigo-600 flex items-center gap-2 font-medium transition-colors bg-white px-4 py-2 rounded-full shadow-sm hover:shadow-md border border-slate-200"
      >
        <ChevronLeft size={20} />
        Volver al Inicio
      </Link>

      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100 relative">

        <div className="text-center mb-8">
          <div className="bg-indigo-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Acceso Profesional</h2>
          <p className="text-slate-500 mt-2">Ingresa tus credenciales para gestionar el consultorio.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Correo Electrónico</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail size={20} />
              </div>
              <input
                type="email"
                required
                className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="doctora@rootwave.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Contraseña</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock size={20} />
              </div>
              <input
                type="password"
                required
                className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="animate-spin" size={18} /> Verificando...
              </span>
            ) : (
              "Ingresar al Panel"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}