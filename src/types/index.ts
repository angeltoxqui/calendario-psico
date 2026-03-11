// === Entidades del Dominio ===

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_min: number;
  is_active: boolean;
  created_at: string;
}

export interface Patient {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  created_at: string;
}

export interface ClinicalNote {
  id: string;
  appointment_id: string;
  content: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  service_id: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'rejected';
  google_event_id: string | null;
  created_at: string;
  // Relaciones expandidas (JOIN)
  patients?: Pick<Patient, 'full_name' | 'phone' | 'email'>;
  services?: Pick<Service, 'name' | 'price'>;
  clinical_notes?: ClinicalNote[];
}

export interface WorkShift {
  id?: string;
  day_of_week: number; // 0=Dom ... 6=Sáb
  start_time: string;  // "HH:MM:SS"
  end_time: string;    // "HH:MM:SS"
}

export interface TimeSlot {
  time: string;     // "HH:MM"
  available: boolean;
}

export interface BookingFormData {
  name: string;
  email: string;
  phone: string;
}

// === Estadísticas ===

export interface StatsData {
  totalCitas: number;
  ingresosTotales: number;
  pacientesUnicos: number;
  serviciosPopulares: [string, number][];
  diasPico: number[];
}

// === Auth ===

export interface AuthSession {
  user: {
    id: string;
    email: string;
  };
}

export interface AdminMessage {
  type: 'success' | 'error';
  text: string;
}
