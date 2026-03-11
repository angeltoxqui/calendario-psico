import type { Service, Patient, Appointment, ClinicalNote, WorkShift, StatsData } from '../types';
import {
  mockServices,
  mockPatients,
  mockAppointments,
  mockClinicalNotes,
  mockWorkShifts,
  uuid,
} from '../data/mockData';

// ==========================================
// Servicio Mock - Reemplazo de Supabase
// Opera sobre los arrays en memoria
// ==========================================

// ---- DELAY: simula latencia de red ----
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

// ===================== SERVICES =====================

export const getServices = async (onlyActive = false): Promise<Service[]> => {
  await delay(200);
  if (onlyActive) return mockServices.filter(s => s.is_active);
  return [...mockServices].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

export const createService = async (data: Omit<Service, 'id' | 'is_active' | 'created_at'>): Promise<Service> => {
  await delay(300);
  const newService: Service = {
    id: uuid(),
    ...data,
    is_active: true,
    created_at: new Date().toISOString(),
  };
  mockServices.unshift(newService);
  return newService;
};

export const updateService = async (id: string, data: Partial<Service>): Promise<void> => {
  await delay(300);
  const idx = mockServices.findIndex(s => s.id === id);
  if (idx !== -1) Object.assign(mockServices[idx], data);
};

export const deleteService = async (id: string): Promise<{ error: string | null }> => {
  await delay(300);
  const hasAppointments = mockAppointments.some(a => a.service_id === id);
  if (hasAppointments) {
    return { error: 'No se puede borrar porque ya tiene citas registradas. Mejor usa el botón de "Desactivar".' };
  }
  const idx = mockServices.findIndex(s => s.id === id);
  if (idx !== -1) mockServices.splice(idx, 1);
  return { error: null };
};

export const toggleServiceActive = async (id: string, currentStatus: boolean): Promise<void> => {
  await delay(200);
  const idx = mockServices.findIndex(s => s.id === id);
  if (idx !== -1) mockServices[idx].is_active = !currentStatus;
};

// ===================== APPOINTMENTS =====================

export const getAppointments = async (): Promise<Appointment[]> => {
  await delay(300);
  return [...mockAppointments].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

export const createAppointment = async (data: {
  patient_id: string;
  service_id: string;
  start_time: string;
  end_time: string;
}): Promise<void> => {
  await delay(400);
  const patient = mockPatients.find(p => p.id === data.patient_id);
  const service = mockServices.find(s => s.id === data.service_id);

  const newAppointment: Appointment = {
    id: uuid(),
    ...data,
    status: 'pending',
    google_event_id: null,
    created_at: new Date().toISOString(),
    patients: patient ? { full_name: patient.full_name, phone: patient.phone, email: patient.email } : undefined,
    services: service ? { name: service.name, price: service.price } : undefined,
  };
  mockAppointments.unshift(newAppointment);
};

export const updateAppointmentStatus = async (id: string, status: 'confirmed' | 'rejected'): Promise<void> => {
  await delay(300);
  const idx = mockAppointments.findIndex(a => a.id === id);
  if (idx !== -1) {
    mockAppointments[idx].status = status;
    if (status === 'confirmed') {
      mockAppointments[idx].google_event_id = `gc-mock-${uuid()}`;
    }
  }
};

// ===================== PATIENTS =====================

export const getPatient = async (id: string): Promise<Patient | null> => {
  await delay(200);
  return mockPatients.find(p => p.id === id) || null;
};

export const getOrCreatePatient = async (data: { name: string; email: string; phone: string }): Promise<string> => {
  await delay(300);
  // Buscar por email primero
  const existing = mockPatients.find(p => p.email === data.email);
  if (existing) return existing.id;

  // Crear nuevo
  const newPatient: Patient = {
    id: uuid(),
    full_name: data.name,
    email: data.email,
    phone: data.phone,
    created_at: new Date().toISOString(),
  };
  mockPatients.push(newPatient);
  return newPatient.id;
};

// ===================== PATIENT HISTORY =====================

export const getPatientAppointments = async (patientId: string): Promise<Appointment[]> => {
  await delay(300);
  const apps = mockAppointments
    .filter(a => a.patient_id === patientId)
    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

  // Attach clinical notes
  return apps.map(app => ({
    ...app,
    clinical_notes: mockClinicalNotes.filter(n => n.appointment_id === app.id),
  }));
};

// ===================== CLINICAL NOTES =====================

export const saveClinicalNote = async (appointmentId: string, content: string): Promise<void> => {
  await delay(300);
  const existing = mockClinicalNotes.find(n => n.appointment_id === appointmentId);
  if (existing) {
    existing.content = content;
    existing.updated_at = new Date().toISOString();
  } else {
    mockClinicalNotes.push({
      id: uuid(),
      appointment_id: appointmentId,
      content,
      updated_at: new Date().toISOString(),
    });
  }
};

// ===================== WORK SHIFTS =====================

export const getWorkShifts = async (): Promise<WorkShift[]> => {
  await delay(200);
  return [...mockWorkShifts].sort((a, b) => a.start_time.localeCompare(b.start_time));
};

export const saveWorkShifts = async (shifts: WorkShift[]): Promise<void> => {
  await delay(400);
  // Reemplazar todos los shifts
  mockWorkShifts.length = 0;
  shifts.forEach(s => {
    if (!s.id) s.id = uuid();
    mockWorkShifts.push(s);
  });
};

// ===================== STATS =====================

export const getStats = async (): Promise<StatsData> => {
  await delay(400);
  const confirmed = mockAppointments.filter(a => a.status === 'confirmed');

  const total = confirmed.length;
  const ingresos = confirmed.reduce((acc, curr) => acc + (curr.services?.price || 0), 0);
  const pacientes = new Set(confirmed.map(a => a.patient_id)).size;

  // Servicios populares
  const svcMap: Record<string, number> = {};
  confirmed.forEach(a => {
    const name = a.services?.name || 'Otro';
    svcMap[name] = (svcMap[name] || 0) + 1;
  });
  const topServices = Object.entries(svcMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5) as [string, number][];

  // Días pico
  const daysMap = [0, 0, 0, 0, 0, 0, 0];
  confirmed.forEach(a => {
    const day = new Date(a.start_time).getDay();
    daysMap[day]++;
  });

  return {
    totalCitas: total,
    ingresosTotales: ingresos,
    pacientesUnicos: pacientes,
    serviciosPopulares: topServices,
    diasPico: daysMap,
  };
};
