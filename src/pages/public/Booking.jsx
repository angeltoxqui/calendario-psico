import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useScheduler } from '../../hooks/useScheduler'; // Importamos el Hook
import { Link } from 'react-router-dom';
import { ChevronLeft, Calendar, User, CheckCircle } from 'lucide-react';

export default function Booking() {
  const { getAvailableSlots, registerPatient } = useScheduler();
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState([]);
  
  // Estados para el flujo
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]); // Array de horas {time: '08:00', available: true}
  const [selectedTime, setSelectedTime] = useState(null);

  // Formulario datos
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });

  // 1. Cargar Servicios
  useEffect(() => {
    const fetchServices = async () => {
      const { data } = await supabase.from('services').select('*').eq('is_active', true);
      if (data) setServices(data);
    };
    fetchServices();
  }, []);

  // 2. Cuando cambia la fecha, calculamos los slots
  useEffect(() => {
    if (selectedDate && selectedService) {
      loadSlots();
    }
  }, [selectedDate, selectedService]);

  const loadSlots = async () => {
    // Limpiamos selección previa
    setSelectedTime(null);
    const slots = await getAvailableSlots(selectedDate);
    setAvailableSlots(slots);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Registrar/Buscar Paciente
      const { data: patientId, error: pError } = await registerPatient(formData);
      if (pError) throw pError;

      // 2. Crear Cita
      const startTime = new Date(`${selectedDate}T${selectedTime}`);
      const endTime = new Date(startTime.getTime() + (selectedService.duration_min * 60000));

      const { error: appError } = await supabase.from('appointments').insert({
        patient_id: patientId,
        service_id: selectedService.id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: 'pending'
      });

      if (appError) throw appError;

      alert('✅ ¡Cita solicitada con éxito! Espera la confirmación.');
      // Reiniciar
      setSelectedDate('');
      setSelectedTime(null);
      
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-indigo-50 p-6 flex justify-center items-start pt-10">
      <div className="bg-white max-w-3xl w-full rounded-2xl shadow-xl p-8">
        
        <div className="flex items-center mb-8">
          <Link to="/" className="text-gray-400 hover:text-indigo-600 mr-4"><ChevronLeft/></Link>
          <h1 className="text-2xl font-bold text-gray-800">Agendar Cita</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* SECCIÓN 1: SERVICIO */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-3">1. Elige el motivo de consulta</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {services.map(svc => (
                <div 
                  key={svc.id} 
                  onClick={() => setSelectedService(svc)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedService?.id === svc.id ? 'border-indigo-600 bg-indigo-50' : 'border-gray-100 hover:border-indigo-200'
                  }`}
                >
                  <div className="font-bold text-gray-800">{svc.name}</div>
                  <div className="text-sm text-gray-500">${svc.price} • {svc.duration_min} min</div>
                </div>
              ))}
            </div>
          </div>

          {/* SECCIÓN 2: FECHA Y HORA (Solo aparece si hay servicio) */}
          {selectedService && (
            <div className="animate-fade-in-up">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">2. Fecha y Hora</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm text-gray-500 mb-2">Selecciona el día</label>
                  <input 
                    type="date" 
                    required
                    min={new Date().toISOString().split('T')[0]} // No permitir pasado
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>

                {/* GRILLA DE HORARIOS */}
                <div>
                  <label className="block text-sm text-gray-500 mb-2">Horarios Disponibles</label>
                  {!selectedDate ? (
                    <p className="text-sm text-gray-400 italic">Elige una fecha primero</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot.time}
                          type="button"
                          disabled={!slot.available}
                          onClick={() => setSelectedTime(slot.time)}
                          className={`py-2 px-1 rounded text-sm font-medium transition-all ${
                            !slot.available 
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed line-through' // Ocupado
                              : selectedTime === slot.time
                                ? 'bg-indigo-600 text-white shadow-md transform scale-105' // Seleccionado
                                : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-400' // Disponible
                          }`}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN 3: DATOS (Solo aparece si hay hora) */}
          {selectedTime && (
            <div className="animate-fade-in-up bg-slate-50 p-6 rounded-xl border border-slate-100">
              <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <User size={20}/> Tus Datos Finales
              </h3>
              <div className="space-y-4">
                <input 
                  type="text" placeholder="Nombre Completo" required 
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    type="email" placeholder="Correo" required 
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                  <input 
                    type="tel" placeholder="Teléfono" required 
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full mt-6 bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-xl shadow-lg transition-all"
              >
                {loading ? 'Procesando...' : 'CONFIRMAR CITA'}
              </button>
            </div>
          )}

        </form>
      </div>
    </div>
  );
}