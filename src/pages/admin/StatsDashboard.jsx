import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  ChevronLeft,
  Award,
  BarChart3
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function StatsDashboard() {
  const [stats, setStats] = useState({
    totalCitas: 0,
    ingresosTotales: 0,
    pacientesUnicos: 0,
    serviciosPopulares: [],
    diasPico: [0, 0, 0, 0, 0, 0, 0]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // 1. Obtener todas las citas confirmadas con sus servicios vinculados
      const { data: apps, error } = await supabase
        .from('appointments')
        .select(`
          *,
          services (name, price)
        `)
        .eq('status', 'confirmed');

      if (error) throw error;

      // 2. Procesamiento de KPIs
      const total = apps.length;
      const ingresos = apps.reduce((acc, curr) => acc + (curr.services?.price || 0), 0);
      const pacientes = new Set(apps.map(a => a.patient_id)).size;

      // 3. Procesar servicios más requeridos
      const svcMap = {};
      apps.forEach(a => {
        const name = a.services?.name || 'Otro';
        svcMap[name] = (svcMap[name] || 0) + 1;
      });
      const topServices = Object.entries(svcMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5); // Tomamos los 5 mejores

      // 4. Procesar días de la semana (0=Dom, 1=Lun...)
      const daysMap = [0, 0, 0, 0, 0, 0, 0];
      apps.forEach(a => {
        const day = new Date(a.start_time).getDay();
        daysMap[day]++;
      });

      setStats({
        totalCitas: total,
        ingresosTotales: ingresos,
        pacientesUnicos: pacientes,
        serviciosPopulares: topServices,
        diasPico: daysMap
      });

    } catch (err) {
      console.error("Error cargando estadísticas:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-pulse flex flex-col items-center">
        <BarChart3 size={48} className="text-indigo-600 mb-4" />
        <p className="text-slate-500 font-medium">Analizando métricas del consultorio...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">

        {/* Encabezado */}
        <div className="mb-8">
          <Link to="/admin" className="text-slate-500 hover:text-indigo-600 flex items-center mb-2 text-sm font-medium transition-colors">
            <ChevronLeft size={18} /> Volver al Tablero Principal
          </Link>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <TrendingUp className="text-indigo-600" /> Rendimiento y Métricas
          </h1>
        </div>

        {/* Resumen de Tarjetas (KPIs) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <StatCard title="Citas Realizadas" value={stats.totalCitas} icon={<Calendar />} color="bg-blue-600" />
          <StatCard title="Ingresos Generados" value={`$${stats.ingresosTotales.toLocaleString()}`} icon={<DollarSign />} color="bg-emerald-600" />
          <StatCard title="Pacientes Únicos" value={stats.pacientesUnicos} icon={<Users />} color="bg-violet-600" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* TOP SERVICIOS */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Award className="text-amber-500" /> Servicios más solicitados
            </h3>
            <div className="space-y-6">
              {stats.serviciosPopulares.length > 0 ? (
                stats.serviciosPopulares.map(([name, count]) => (
                  <div key={name}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-semibold text-slate-700">{name}</span>
                      <span className="font-bold text-indigo-600">{count} {count === 1 ? 'cita' : 'citas'}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full rounded-full transition-all duration-1000"
                        style={{ width: `${(count / stats.totalCitas) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-center italic py-10">No hay datos suficientes aún</p>
              )}
            </div>
          </div>

          {/* DÍAS DE MAYOR AFLUENCIA */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Frecuencia Semanal</h3>
            <div className="flex items-end justify-between h-48 gap-3 px-2">
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day, idx) => {
                const height = stats.totalCitas > 0 ? (stats.diasPico[idx] / Math.max(...stats.diasPico)) * 100 : 0;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full bg-indigo-100 rounded-t-xl transition-all duration-1000 relative group"
                      style={{ height: `${height}%` }}
                    >
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {stats.diasPico[idx]} citas
                      </div>
                      <div className={`absolute inset-0 bg-indigo-500 rounded-t-xl transition-opacity ${height > 0 ? 'opacity-100' : 'opacity-0'}`}></div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{day}</span>
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5 hover:shadow-md transition-shadow">
      <div className={`${color} p-4 rounded-2xl text-white shadow-lg shadow-current/20`}>
        {icon}
      </div>
      <div>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{title}</p>
        <h4 className="text-3xl font-black text-slate-800">{value}</h4>
      </div>
    </div>
  );
}