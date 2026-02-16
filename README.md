# 🧠 RootWave Agenda - Sistema de Gestión Psicológica

RootWave Agenda es una plataforma integral de gestión clínica y automatización de citas diseñada para optimizar el flujo de trabajo de profesionales de la salud mental. Este sistema transforma la interacción paciente-especialista mediante una sincronización bidireccional inteligente con Google Calendar, un sistema de notificaciones por correo profesional y un expediente clínico digital protegido por estándares de seguridad de alto nivel.

## 🚀 Arquitectura y Tecnologías (Tech Stack)

El sistema utiliza una arquitectura **Serverless** y reactiva para garantizar velocidad, escalabilidad y costos mínimos de mantenimiento:

*   **Frontend (React 19):** Aprovecha las últimas capacidades de React para una interfaz ultra-fluida, incluyendo navegación intuitiva con botones flotantes de retorno para mejorar la UX.
*   **Construcción (Vite):** Herramienta de nueva generación para compilación instantánea y carga optimizada.
*   **Estilos (Tailwind CSS):** Diseño responsivo basado en utilidades, garantizando una estética moderna y profesional en móviles y escritorio.
*   **Backend (Supabase):** Base de datos PostgreSQL con capacidades de tiempo real y autenticación integrada.
*   **Lógica en la Nube (Edge Functions):** Microservicios desarrollados en Deno/TypeScript que ejecutan lógica pesada de forma aislada.
*   **Motor de Notificaciones (Resend):** Infraestructura de email transaccional que garantiza la entrega de correos (alta entregabilidad) con diseños HTML profesionales, superando las limitaciones de los correos planos.
*   **Integración (Google Calendar API v3):** Conexión mediante Service Accounts para la gestión automática de la agenda.

## 🛠️ Desglose Detallado de Módulos

### 1. 🏥 Experiencia del Paciente (Módulo Público)

Diseñado para eliminar cualquier fricción en el proceso de reserva:

*   **Agendamiento Inteligente con Triple Validación:** El sistema es infalible evitando el "Overbooking". Un horario se bloquea si cumple cualquiera de estas condiciones:
    *   Existe una cita en estado "Pendiente" en la base de datos (bloqueo temporal mientras se confirma).
    *   Existe una cita "Confirmada" en la base de datos.
    *   Existe un evento personal (ej. "Almuerzo") en el Google Calendar de la doctora.
*   **Registro Transparente (Guest Checkout):** El paciente no necesita crear una cuenta. El sistema detecta si el paciente ya existe por su correo o lo crea automáticamente mediante una Función RPC segura.
*   **Navegación de Retorno:** Interfaz amigable que permite navegar entre el panel de administración y la vista pública sin quedar atrapado en flujos de login.

### 2. 👩‍⚕️ Panel de Control Administrativo (Especialista)

Un centro de mando para la gestión total del consultorio:

*   **Gestión de Citas (Lifecycle):** Las solicitudes llegan en estado "Pendiente". El profesional puede Confirmar o Rechazar.
*   **Sincronización y Notificaciones Automáticas:**
    *   **PUSH a Calendar:** Al confirmar, se crea el evento en Google Calendar.
    *   **Email Transaccional (Resend):** Simultáneamente, se dispara un correo al paciente con diseño corporativo.
    *   **Inteligencia Horaria:** El sistema convierte automáticamente la hora UTC del servidor a la hora local del consultorio (ej. America/Bogota), asegurando que el paciente reciba la hora correcta en su correo sin importar dónde esté alojado el servidor.
*   **Dashboard de Analíticas (Business Intelligence):**
    *   **KPIs Financieros:** Visualización de ingresos totales.
    *   **Métricas de Servicios:** Gráficos para identificar terapias más rentables.
    *   **Mapa de Calor:** Identificación de días con mayor afluencia.

### 3. 📂 Gestión Clínica y Configuración

*   **Expediente Clínico Digital:** Línea de tiempo (Timeline) que muestra el historial del paciente y notas privadas de evolución.
*   **Configuración de Horarios Multibloque:** Soporte avanzado para jornadas partidas (ej. 8-12 y 14-18) y días de descanso, configurable desde el panel sin tocar código.
*   **CRUD de Servicios:** Control total sobre el catálogo de terapias, precios y duración.

## 🔐 Seguridad y Privacidad (Data Protection)

Al tratar con datos de salud, la seguridad no es opcional:

*   **Row Level Security (RLS):** Las notas clínicas están blindadas a nivel de base de datos. Solo el administrador autenticado puede leerlas.
*   **Arquitectura de Service Account:** Las credenciales de Google y Resend nunca se exponen al navegador; viven en variables de entorno en el servidor (Edge Functions).
*   **Validación de Identidad:** Autenticación JWT robusta para el panel administrativo.

## 🗄️ Estructura de Datos (Schema)

*   `work_shifts`: Almacena la configuración dinámica de horarios y turnos.
*   `services`: Catálogo maestro de terapias.
*   `patients`: Directorio único de pacientes.
*   `appointments`: Tabla central de citas con estados.
*   `clinical_notes`: Notas privadas vinculadas a cada sesión.

## 📦 Guía de Instalación y Despliegue

**Requisitos:** Node.js, Supabase CLI, Cuenta de Google Cloud y Cuenta de Resend.

### 1. Clonar y dependencias

```bash
git clone [repo-url]
npm install
```

### 2. Configuración de Entorno

Renombra `.env.example` a `.env.local` y añade tus credenciales de Supabase (`VITE_SUPABASE_URL`, etc.).

### 3. Despliegue de Edge Functions (Backend)

```bash
npx supabase functions deploy google-calendar --no-verify-jwt
npx supabase functions deploy check-availability --no-verify-jwt
```

### 4. Gestión de Secretos (Producción)

Es vital configurar las llaves de las APIs externas en el servidor de Supabase:

```bash
# Credenciales de Google Calendar
npx supabase secrets set GOOGLE_CLIENT_EMAIL="tu-service-account@..."
npx supabase secrets set GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY..."
npx supabase secrets set GOOGLE_CALENDAR_ID="tu-email@gmail.com"

# Credencial de Resend (Emails)
npx supabase secrets set RESEND_API_KEY="re_123456..."
```

---

*Desarrollado con ❤️ por Ángel ToxquI Muñoz (ToxquiDev) - 2026*