import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Save, Plus, Trash2, Clock, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default function Settings() {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchShifts(); }, []);

  const fetchShifts = async () => {
    const { data } = await supabase.from('work_shifts').select('*').order('start_time', { ascending: true });
    setShifts(data || []);
    setLoading(false);
  };

  const addShift = (dayIdx) => {
    const newShift = { day_of_week: dayIdx, start_time: "08:00:00", end_time: "12:00:00" };
    setShifts([...shifts, newShift]);
  };

  const removeShift = async (shift) => {
    if (shift.id) {
      await supabase.from('work_shifts').delete().eq('id', shift.id);
    }
    setShifts(shifts.filter(s => s !== shift));
  };

  const updateShift = (index, field, value) => {
    const newShifts = [...shifts];
    newShifts[index][field] = value;
    setShifts(newShifts);
  };

  const saveAll = async () => {
    const { error } = await supabase.from('work_shifts').upsert(shifts);
    if (!error) {
        alert("✅ Horarios y bloques de descanso actualizados");
        fetchShifts();
    }
  };

  if (loading) return <div className="p-10 text-center">Cargando cronograma...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Link to="/admin" className="text-slate-500 flex items-center mb-6"><ChevronLeft size={18}/> Volver</Link>
        
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
          <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Horarios de Atención</h1>
              <p className="text-slate-400 text-sm">Configura tus bloques de trabajo y descansos</p>
            </div>
            <button onClick={saveAll} className="bg-indigo-500 hover:bg-indigo-600 px-8 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/30">
              <Save size={18}/> Guardar Cambios
            </button>
          </div>

          <div className="p-8 space-y-8">
            {DAYS.map((dayName, dayIdx) => (
              <div key={dayIdx} className="group border-b border-slate-100 pb-6 last:border-0">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg text-slate-800">{dayName}</h3>
                  <button 
                    onClick={() => addShift(dayIdx)}
                    className="text-indigo-600 hover:bg-indigo-50 px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-1 transition-all"
                  >
                    <Plus size={16}/> Añadir Bloque
                  </button>
                </div>

                <div className="flex flex-wrap gap-3">
                  {shifts.filter(s => s.day_of_week === dayIdx).length === 0 ? (
                    <span className="text-slate-400 text-sm italic">Cerrado / Sin atención</span>
                  ) : (
                    shifts.filter(s => s.day_of_week === dayIdx).map((shift, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-2 rounded-2xl">
                        <Clock size={14} className="text-slate-400 ml-2"/>
                        <input 
                          type="time" value={shift.start_time.slice(0,5)}
                          onChange={(e) => updateShift(shifts.indexOf(shift), 'start_time', e.target.value)}
                          className="bg-transparent border-0 text-sm font-bold focus:ring-0 p-1"
                        />
                        <span className="text-slate-300">-</span>
                        <input 
                          type="time" value={shift.end_time.slice(0,5)}
                          onChange={(e) => updateShift(shifts.indexOf(shift), 'end_time', e.target.value)}
                          className="bg-transparent border-0 text-sm font-bold focus:ring-0 p-1"
                        />
                        <button onClick={() => removeShift(shift)} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-xl transition-colors">
                          <Trash2 size={16}/>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}