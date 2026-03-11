import { useState } from 'react';
import type { TimeSlot } from '../types';
import { mockWorkShifts, mockAppointments } from '../data/mockData';
import { getOrCreatePatient } from '../services/mockService';

export const useScheduler = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAvailableSlots = async (dateString: string): Promise<TimeSlot[]> => {
    setLoading(true);
    setError(null);

    try {
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 400));

      const date = new Date(dateString + 'T00:00:00');
      const dayOfWeek = date.getDay();

      // 1. Obtener los turnos de trabajo para ese día
      const shifts = mockWorkShifts.filter(s => s.day_of_week === dayOfWeek);

      if (shifts.length === 0) return []; // Día cerrado

      // 2. Generar todos los slots posibles en intervalos de 1 hora
      const allSlots: string[] = [];
      shifts.forEach(shift => {
        const startHour = parseInt(shift.start_time.split(':')[0]);
        const endHour = parseInt(shift.end_time.split(':')[0]);
        for (let h = startHour; h < endHour; h++) {
          allSlots.push(`${h.toString().padStart(2, '0')}:00`);
        }
      });

      // 3. Verificar disponibilidad contra citas existentes
      const dateStr = dateString; // "YYYY-MM-DD"
      const slots: TimeSlot[] = allSlots.map(time => {
        const slotStart = new Date(`${dateStr}T${time}:00`);
        const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000); // +1 hora

        const isOccupied = mockAppointments.some(app => {
          if (app.status === 'rejected') return false; // Rechazadas no bloquean
          const appStart = new Date(app.start_time);
          const appEnd = new Date(app.end_time);
          return appStart < slotEnd && appEnd > slotStart;
        });

        return { time, available: !isOccupied };
      });

      return slots;
    } catch (err) {
      console.error(err);
      setError('Error calculando disponibilidad');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const registerPatient = async (data: { name: string; email: string; phone: string }): Promise<{ data: string | null; error: Error | null }> => {
    try {
      const patientId = await getOrCreatePatient(data);
      return { data: patientId, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  };

  return { getAvailableSlots, registerPatient, loading, error };
};
