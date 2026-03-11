import type { Service, Patient, Appointment, ClinicalNote, WorkShift } from '../types';

// === Helper para generar UUIDs simples ===
let counter = 100;
export const uuid = (): string => {
  counter++;
  return `${Date.now().toString(36)}-${counter.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
};

// === SERVICIOS ===
export const mockServices: Service[] = [
  {
    id: 'svc-001',
    name: 'Terapia Individual',
    description: 'Sesión de psicoterapia individual enfocada en el bienestar emocional.',
    price: 800,
    duration_min: 60,
    is_active: true,
    created_at: '2026-01-15T10:00:00Z',
  },
  {
    id: 'svc-002',
    name: 'Terapia de Pareja',
    description: 'Acompañamiento terapéutico para parejas en conflicto o que buscan mejorar.',
    price: 1200,
    duration_min: 90,
    is_active: true,
    created_at: '2026-01-15T10:05:00Z',
  },
  {
    id: 'svc-003',
    name: 'Terapia Infantil',
    description: 'Sesión especializada de psicoterapia para niños y adolescentes.',
    price: 700,
    duration_min: 45,
    is_active: true,
    created_at: '2026-01-20T08:00:00Z',
  },
  {
    id: 'svc-004',
    name: 'Evaluación Psicológica',
    description: 'Batería de pruebas psicométricas con reporte diagnóstico.',
    price: 2500,
    duration_min: 120,
    is_active: false,
    created_at: '2026-02-01T14:00:00Z',
  },
];

// === PACIENTES ===
export const mockPatients: Patient[] = [
  {
    id: 'pat-001',
    full_name: 'María García López',
    email: 'maria.garcia@email.com',
    phone: '+52 555-123-4567',
    created_at: '2026-02-10T09:00:00Z',
  },
  {
    id: 'pat-002',
    full_name: 'Carlos Rodríguez Pérez',
    email: 'carlos.rdz@email.com',
    phone: '+52 555-987-6543',
    created_at: '2026-02-12T11:00:00Z',
  },
  {
    id: 'pat-003',
    full_name: 'Ana Martínez Torres',
    email: 'ana.mtz@email.com',
    phone: '+52 555-456-7890',
    created_at: '2026-02-15T14:00:00Z',
  },
  {
    id: 'pat-004',
    full_name: 'Roberto Sánchez Díaz',
    email: 'roberto.sd@email.com',
    phone: '+52 555-321-0987',
    created_at: '2026-02-20T10:00:00Z',
  },
  {
    id: 'pat-005',
    full_name: 'Laura Hernández',
    email: 'laura.hz@email.com',
    phone: '+52 555-654-3210',
    created_at: '2026-03-01T08:00:00Z',
  },
];

// === CITAS ===
export const mockAppointments: Appointment[] = [
  {
    id: 'app-001',
    patient_id: 'pat-001',
    service_id: 'svc-001',
    start_time: '2026-03-11T09:00:00Z',
    end_time: '2026-03-11T10:00:00Z',
    status: 'pending',
    google_event_id: null,
    created_at: '2026-03-08T20:00:00Z',
    patients: { full_name: 'María García López', phone: '+52 555-123-4567', email: 'maria.garcia@email.com' },
    services: { name: 'Terapia Individual', price: 800 },
  },
  {
    id: 'app-002',
    patient_id: 'pat-002',
    service_id: 'svc-002',
    start_time: '2026-03-11T11:00:00Z',
    end_time: '2026-03-11T12:30:00Z',
    status: 'confirmed',
    google_event_id: 'gc-event-abc',
    created_at: '2026-03-07T15:00:00Z',
    patients: { full_name: 'Carlos Rodríguez Pérez', phone: '+52 555-987-6543', email: 'carlos.rdz@email.com' },
    services: { name: 'Terapia de Pareja', price: 1200 },
  },
  {
    id: 'app-003',
    patient_id: 'pat-003',
    service_id: 'svc-001',
    start_time: '2026-03-10T10:00:00Z',
    end_time: '2026-03-10T11:00:00Z',
    status: 'confirmed',
    google_event_id: 'gc-event-def',
    created_at: '2026-03-06T12:00:00Z',
    patients: { full_name: 'Ana Martínez Torres', phone: '+52 555-456-7890', email: 'ana.mtz@email.com' },
    services: { name: 'Terapia Individual', price: 800 },
  },
  {
    id: 'app-004',
    patient_id: 'pat-004',
    service_id: 'svc-003',
    start_time: '2026-03-12T14:00:00Z',
    end_time: '2026-03-12T14:45:00Z',
    status: 'pending',
    google_event_id: null,
    created_at: '2026-03-09T18:00:00Z',
    patients: { full_name: 'Roberto Sánchez Díaz', phone: '+52 555-321-0987', email: 'roberto.sd@email.com' },
    services: { name: 'Terapia Infantil', price: 700 },
  },
  {
    id: 'app-005',
    patient_id: 'pat-001',
    service_id: 'svc-001',
    start_time: '2026-03-05T09:00:00Z',
    end_time: '2026-03-05T10:00:00Z',
    status: 'confirmed',
    google_event_id: 'gc-event-ghi',
    created_at: '2026-02-28T10:00:00Z',
    patients: { full_name: 'María García López', phone: '+52 555-123-4567', email: 'maria.garcia@email.com' },
    services: { name: 'Terapia Individual', price: 800 },
  },
  {
    id: 'app-006',
    patient_id: 'pat-005',
    service_id: 'svc-002',
    start_time: '2026-03-13T16:00:00Z',
    end_time: '2026-03-13T17:30:00Z',
    status: 'pending',
    google_event_id: null,
    created_at: '2026-03-10T08:00:00Z',
    patients: { full_name: 'Laura Hernández', phone: '+52 555-654-3210', email: 'laura.hz@email.com' },
    services: { name: 'Terapia de Pareja', price: 1200 },
  },
  {
    id: 'app-007',
    patient_id: 'pat-002',
    service_id: 'svc-001',
    start_time: '2026-02-28T15:00:00Z',
    end_time: '2026-02-28T16:00:00Z',
    status: 'rejected',
    google_event_id: null,
    created_at: '2026-02-25T09:00:00Z',
    patients: { full_name: 'Carlos Rodríguez Pérez', phone: '+52 555-987-6543', email: 'carlos.rdz@email.com' },
    services: { name: 'Terapia Individual', price: 800 },
  },
  {
    id: 'app-008',
    patient_id: 'pat-003',
    service_id: 'svc-003',
    start_time: '2026-03-14T08:00:00Z',
    end_time: '2026-03-14T08:45:00Z',
    status: 'confirmed',
    google_event_id: 'gc-event-jkl',
    created_at: '2026-03-09T07:00:00Z',
    patients: { full_name: 'Ana Martínez Torres', phone: '+52 555-456-7890', email: 'ana.mtz@email.com' },
    services: { name: 'Terapia Infantil', price: 700 },
  },
];

// === NOTAS CLÍNICAS ===
export const mockClinicalNotes: ClinicalNote[] = [
  {
    id: 'note-001',
    appointment_id: 'app-005',
    content: 'Paciente muestra avances en el manejo de ansiedad. Se le asignaron ejercicios de respiración diafragmática. Buen progreso general.',
    updated_at: '2026-03-05T10:30:00Z',
  },
  {
    id: 'note-002',
    appointment_id: 'app-003',
    content: 'Segunda sesión. Se abordaron patrones de pensamientos automáticos negativos. Se introdujo técnica de reestructuración cognitiva.',
    updated_at: '2026-03-10T11:15:00Z',
  },
  {
    id: 'note-003',
    appointment_id: 'app-002',
    content: 'Sesión de pareja enfocada en comunicación asertiva. Ambos participantes mostraron disposición al cambio.',
    updated_at: '2026-03-11T12:45:00Z',
  },
];

// === TURNOS DE TRABAJO ===
export const mockWorkShifts: WorkShift[] = [
  // Lunes (1) - Jornada partida
  { id: 'ws-001', day_of_week: 1, start_time: '08:00:00', end_time: '12:00:00' },
  { id: 'ws-002', day_of_week: 1, start_time: '14:00:00', end_time: '18:00:00' },
  // Martes (2)
  { id: 'ws-003', day_of_week: 2, start_time: '08:00:00', end_time: '12:00:00' },
  { id: 'ws-004', day_of_week: 2, start_time: '14:00:00', end_time: '18:00:00' },
  // Miércoles (3)
  { id: 'ws-005', day_of_week: 3, start_time: '09:00:00', end_time: '13:00:00' },
  // Jueves (4)
  { id: 'ws-006', day_of_week: 4, start_time: '08:00:00', end_time: '12:00:00' },
  { id: 'ws-007', day_of_week: 4, start_time: '14:00:00', end_time: '18:00:00' },
  // Viernes (5)
  { id: 'ws-008', day_of_week: 5, start_time: '08:00:00', end_time: '14:00:00' },
];
