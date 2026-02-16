import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { ChevronLeft, User, Phone, Mail, Save, Calendar, Clock, Activity, FileText } from 'lucide-react';

export default function PatientDetails() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notesBuffer, setNotesBuffer] = useState({});

  useEffect(() => {
    fetchClinicalData();
  }, [id]);

  const fetchClinicalData = async () => {
    try {
      // 1. Paciente
      const { data: pData } = await supabase.from('patients').select('*').eq('id', id).single();
      setPatient(pData);

      // 2. Historial (Citas + Notas + Servicios)
      const { data: hData, error } = await supabase
        .from('appointments')
        .select(`
          *,
          services (name),
          clinical_notes (content, updated_at) 
        `)
        .eq('patient_id', id)
        .order('start_time', { ascending: false }); // Del más reciente al más antiguo

      if (error) throw error;
      setAppointments(hData);

      // Cargar notas en el buffer
      const initialNotes = {};
      hData.forEach(app => {
        if (app.clinical_notes && app.clinical_notes.length > 0) {
          initialNotes[app.id] = app.clinical_notes[0].content;
        }
      });
      setNotesBuffer(initialNotes);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async (appointmentId) => {
    const content = notesBuffer[appointmentId];
    if (!content) return;

    try {
      // Verificar si ya existe nota
      const { data: existing } = await supabase
        .from('clinical_notes')
        .select('id')
        .eq('appointment_id', appointmentId)
        .maybeSingle();

      if (existing) {
        await supabase.from('clinical_notes').update({ content }).eq('id', existing.id);
      } else {
        await supabase.from('clinical_notes').insert({ appointment_id: appointmentId, content });
      }
      
      alert('✅ Nota guardada en el historial.');
      fetchClinicalData(); // Recargar para actualizar fechas de edición
    } catch (err) {
      alert('Error guardando nota');
    }
  };

  if (loading) return <div className="p-10 text-center">Cargando expediente...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        
        {/* Encabezado del Paciente */}
        <div className="mb-8">
          <Link to="/admin" className="text-slate-500 hover:text-indigo-600 flex items-center mb-4 text-sm font-medium">
            <ChevronLeft size={18} /> Volver al Tablero
          </Link>
          
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-100 p-4 rounded-full text-indigo-600">
                <User size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">{patient?.full_name}</h1>
                <p className="text-slate-500 text-sm">Expediente #{patient?.id.slice(0, 8)}</p>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 min-w-[250px]">
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-indigo-400"/> {patient?.phone}
              </div>
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-indigo-400"/> {patient?.email}
              </div>
              <div className="flex items-center gap-3">
                <Activity size={16} className="text-indigo-400"/> {appointments.length} Sesiones totales
              </div>
            </div>
          </div>
        </div>

        {/* TIMELINE DE SESIONES */}
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <FileText size={24} className="text-indigo-600"/> Historial Clínico
        </h2>

        <div className="relative border-l-2 border-indigo-200 ml-4 md:ml-6 space-y-8 pb-10">
          {appointments.map((app) => {
            const dateObj = new Date(app.start_time);
            const isFuture = dateObj > new Date();
            
            return (
              <div key={app.id} className="relative pl-8 md:pl-12">
                {/* Punto en la línea de tiempo */}
                <div className={`absolute -left-[9px] top-0 w-5 h-5 rounded-full border-4 border-white ${
                  isFuture ? 'bg-indigo-400' : 'bg-slate-400'
                }`}></div>

                {/* Tarjeta de la Sesión */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group hover:border-indigo-300 transition-colors">
                  
                  {/* Header de la Tarjeta */}
                  <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">{app.services?.name}</h3>
                      <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                        <span className="flex items-center gap-1"><Calendar size={14}/> {dateObj.toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><Clock size={14}/> {dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      app.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      app.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-slate-200 text-slate-600'
                    }`}>
                      {app.status}
                    </span>
                  </div>

                  {/* Cuerpo (Notas) */}
                  <div className="p-5">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Nota de Evolución
                    </label>
                    <textarea
                      className="w-full p-4 bg-yellow-50/30 border border-yellow-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all min-h-[120px] leading-relaxed"
                      placeholder="Escribe aquí los detalles de la sesión..."
                      value={notesBuffer[app.id] || ''}
                      onChange={(e) => setNotesBuffer({...notesBuffer, [app.id]: e.target.value})}
                    />
                    <div className="mt-3 flex justify-between items-center">
                      <span className="text-xs text-slate-400 italic">
                        {app.clinical_notes?.[0]?.updated_at 
                          ? `Guardado: ${new Date(app.clinical_notes[0].updated_at).toLocaleString()}` 
                          : 'Sin guardar'}
                      </span>
                      <button 
                        onClick={() => handleSaveNote(app.id)}
                        className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900 transition-colors text-sm font-medium shadow-md"
                      >
                        <Save size={16}/> Guardar Progreso
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}