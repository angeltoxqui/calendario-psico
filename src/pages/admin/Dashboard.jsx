import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { LogOut, CheckCircle, XCircle, Clock, Calendar, LayoutDashboard } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 1. Cargar citas al iniciar
  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    // Traemos la cita Y los datos del paciente y servicio relacionados
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        patients ( full_name, phone, email ),
        services ( name, price )
      `)
      .order('created_at', { ascending: false }); // Las más nuevas primero

    if (error) {
      console.error('Error cargando citas:', error);
      // Si el error es por no estar logueado, redirigir
      // (En producción manejaríamos esto mejor con un Context de Auth)
    } else {
      setAppointments(data || []);
    }
    setLoading(false);
  };

  // 2. Función para aceptar/rechazar
  const handleStatusChange = async (id, newStatus) => {
    // 1. Encontramos la cita completa en el estado actual para tener los datos del paciente
    const appointmentData = appointments.find(app => app.id === id);

    if (!appointmentData) return;

    // Indicador visual de carga (opcional, podrías poner un toast loading aquí)
    const isConfirming = newStatus === 'confirmed';
    if (isConfirming && !confirm("¿Confirmar cita y sincronizar con Google Calendar?")) return;

    try {
      // 2. Actualizar estado en Supabase (Base de Datos)
      const { error: dbError } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', id);

      if (dbError) throw new Error('Error actualizando la base de datos');

      // 3. SI ES CONFIRMADA -> INVOCAR EDGE FUNCTION (Google Calendar)
      if (isConfirming) {
        // toast.loading('Sincronizando con Google...') // Si usaras una librería de notificaciones

        const { data: funcData, error: funcError } = await supabase.functions.invoke('google-calendar', {
          body: {
            action: 'create',
            appointment: appointmentData
          }
        });

        if (funcError) {
          console.error("Error Function:", funcError);
          alert("⚠️ La cita se guardó en el sistema, pero FALLÓ la sincronización con Google Calendar. Revisa los logs.");
        } else {
          // Opcional: Guardar el ID de Google en la base de datos para referencia futura
          if (funcData?.googleEventId) {
            await supabase
              .from('appointments')
              .update({ google_event_id: funcData.googleEventId })
              .eq('id', id);
          }
          alert("✅ Cita confirmada y agendada en Google Calendar.");
        }
      } else {
        alert(`Cita marcada como: ${newStatus === 'confirmed' ? 'Confirmada' : 'Rechazada'}`);
      }

      // 4. Recargar la lista
      fetchAppointments();

    } catch (err) {
      console.error(err);
      alert('Error: ' + err.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* SIDEBAR: Lo hacemos fijo y controlamos su altura */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col h-screen sticky top-0">

        {/* Cabecera del Sidebar */}
        <div className="p-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <LayoutDashboard className="text-indigo-400" />
            RootWave
          </h2>
          <p className="text-slate-400 text-sm mt-1">Panel de Control</p>
        </div>

        {/* Navegación (Empuja el contenido hacia abajo) */}
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {/* ... Tus botones de navegación actuales ... */}
          <button onClick={fetchAppointments} className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-800 transition flex items-center gap-3 text-slate-300 hover:text-white">
            📅 Gestión de Citas
          </button>

          <Link to="/admin/pacientes" className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-800 transition flex items-center gap-3 text-slate-300 hover:text-white">
            👥 Pacientes
          </Link>

          <Link to="/admin/servicios" className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-800 transition flex items-center gap-3 text-slate-300 hover:text-white">
            ⚙️ Mis Servicios
          </Link>

          <Link to="/admin/estadisticas" className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-800 transition flex items-center gap-3 text-slate-300 hover:text-white">
            📊 Estadísticas
          </Link>

          <Link to="/admin/configuracion" className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-800 transition flex items-center gap-3 text-slate-300 hover:text-white">
            🕒 Horarios y Turnos
          </Link>
        </nav>

        {/* Footer del Sidebar (Botón Cerrar Sesión SIEMPRE ABAJO) */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white px-4 py-3 rounded-xl transition-all font-medium"
          >
            <LogOut size={18} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL: Este es el que hace scroll */}
      <main className="flex-1 p-8 overflow-y-auto h-screen">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Solicitudes de Citas</h1>

        {loading ? (
          <p>Cargando datos...</p>
        ) : (
          <div className="grid gap-4">
            {appointments.length === 0 && <p className="text-gray-500">No hay citas registradas aún.</p>}

            {appointments.map((app) => (
              <div key={app.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">

                {/* Info Cita */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${app.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      app.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                      {app.status}
                    </span>
                    <span className="text-gray-400 text-sm">#{app.id.slice(0, 6)}</span>
                  </div>

                  <h3 className="text-xl font-bold text-gray-800">
                    <Link
                      to={`/admin/pacientes/${app.patient_id}`}
                      className="hover:text-indigo-600 hover:underline decoration-2 underline-offset-2 transition"
                    >
                      {app.patients?.full_name}
                    </Link>
                  </h3>


                  <p className="text-indigo-600 font-medium">{app.services?.name}</p>

                  <div className="flex gap-4 mt-2 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar size={14} /> {new Date(app.start_time).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={14} /> {new Date(app.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">{app.patients?.phone} • {app.patients?.email}</p>
                </div>

                {/* Acciones */}
                {app.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStatusChange(app.id, 'rejected')}
                      className="flex items-center gap-1 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition"
                    >
                      <XCircle size={18} /> Rechazar
                    </button>
                    <button
                      onClick={() => handleStatusChange(app.id, 'confirmed')}
                      className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-sm"
                    >
                      <CheckCircle size={18} /> Confirmar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}