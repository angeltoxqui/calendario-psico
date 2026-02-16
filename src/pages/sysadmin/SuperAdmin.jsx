import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { ShieldAlert, UserX, UserCheck, Key, Lock } from 'lucide-react';

export default function SuperAdmin() {
  const [email, setEmail] = useState('');
  const [adminSecret, setAdminSecret] = useState(''); // Tu clave maestra
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const executeAction = async (action) => {
    setLoading(true);
    setMsg(null);
    try {
      const { data, error } = await supabase.functions.invoke('admin-actions', {
        body: { 
          action, 
          email, 
          newPassword: action === 'reset_password' ? newPassword : null,
          adminSecret 
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setMsg({ type: 'success', text: data.message });
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 max-w-md w-full text-slate-200">
        
        <div className="text-center mb-8">
          <ShieldAlert size={48} className="mx-auto text-red-500 mb-2"/>
          <h1 className="text-2xl font-bold text-white">Zona Super Admin</h1>
          <p className="text-slate-400 text-sm">Control de Suscripción y Accesos</p>
        </div>

        {/* Formulario de Seguridad */}
        <div className="space-y-4 mb-8">
          <div>
            <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Tu Clave Maestra</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-3 text-slate-500" size={16}/>
              <input 
                type="password" 
                placeholder="Ingresa el ADMIN_SECRET"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2 pl-10 pr-4 text-white focus:ring-2 focus:ring-red-500 outline-none"
                value={adminSecret}
                onChange={e => setAdminSecret(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Email del Cliente (Doctora)</label>
            <input 
              type="email" 
              placeholder="cliente@correo.com"
              className="w-full mt-1 bg-slate-900 border border-slate-600 rounded-lg py-2 px-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
        </div>

        {/* Acciones de Pago (Activar/Desactivar) */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button 
            onClick={() => executeAction('ban')}
            disabled={loading || !email}
            className="flex flex-col items-center justify-center p-4 bg-red-900/30 border border-red-800 rounded-xl hover:bg-red-900/50 transition-colors group"
          >
            <UserX className="mb-2 text-red-400 group-hover:text-red-300"/>
            <span className="text-sm font-bold text-red-400">Desactivar (Impago)</span>
          </button>

          <button 
            onClick={() => executeAction('unban')}
            disabled={loading || !email}
            className="flex flex-col items-center justify-center p-4 bg-emerald-900/30 border border-emerald-800 rounded-xl hover:bg-emerald-900/50 transition-colors group"
          >
            <UserCheck className="mb-2 text-emerald-400 group-hover:text-emerald-300"/>
            <span className="text-sm font-bold text-emerald-400">Reactivar Cuenta</span>
          </button>
        </div>

        {/* Cambio de Contraseña */}
        <div className="border-t border-slate-700 pt-6">
          <label className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2 block">Forzar Cambio de Contraseña</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Nueva contraseña..."
              className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 text-white"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
            />
            <button 
              onClick={() => executeAction('reset_password')}
              disabled={loading || !newPassword}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 rounded-lg flex items-center"
            >
              <Key size={18}/>
            </button>
          </div>
        </div>

        {/* Mensajes de Estado */}
        {msg && (
          <div className={`mt-6 p-3 rounded-lg text-sm text-center font-bold ${msg.type === 'error' ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
            {msg.text}
          </div>
        )}

      </div>
    </div>
  );
}