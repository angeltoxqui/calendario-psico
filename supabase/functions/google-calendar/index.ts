import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { importPKCS8, SignJWT } from "https://deno.land/x/jose@v4.14.4/index.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Manejo de preflight request (CORS)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { appointment } = await req.json()
    
    // --- VALIDACIÓN DE DATOS ---
    if (!appointment || !appointment.start_time || !appointment.patients) {
      throw new Error("Datos de cita incompletos (Falta start_time o patients)")
    }

    // --- 1. AUTENTICACIÓN CON GOOGLE ---
    const clientEmail = Deno.env.get("GOOGLE_CLIENT_EMAIL")
    const privateKeyPEM = Deno.env.get("GOOGLE_PRIVATE_KEY")?.replace(/\\n/g, "\n")
    const calendarId = Deno.env.get("GOOGLE_CALENDAR_ID")
    const resendApiKey = Deno.env.get("RESEND_API_KEY")

    if (!clientEmail || !privateKeyPEM || !calendarId) {
      throw new Error("Faltan las credenciales de Google en Supabase Secrets")
    }

    const privateKey = await importPKCS8(privateKeyPEM, 'RS256')
    const jwt = await new SignJWT({ scope: 'https://www.googleapis.com/auth/calendar' })
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuer(clientEmail)
      .setAudience('https://oauth2.googleapis.com/token')
      .setExpirationTime('1h')
      .setIssuedAt()
      .sign(privateKey)

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt })
    })
    const { access_token } = await tokenRes.json()

    // --- 2. CREAR EVENTO EN GOOGLE CALENDAR ---
    // Nota: Aquí Google maneja la zona horaria automáticamente con el campo timeZone
    const event = {
      summary: `PSI: ${appointment.services?.name || 'Consulta'} - ${appointment.patients?.full_name}`,
      description: `Paciente: ${appointment.patients?.full_name}\nTeléfono: ${appointment.patients?.phone}\nEmail: ${appointment.patients?.email}\n\nAgendado desde RootWave.`,
      start: { dateTime: appointment.start_time, timeZone: 'America/Bogota' },
      end: { dateTime: appointment.end_time, timeZone: 'America/Bogota' },
    }

    const calRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${access_token}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(event),
    })
    
    const calData = await calRes.json();
    
    if (calData.error) {
      console.error("Error Google Calendar:", calData.error);
      throw new Error(`Google Error: ${calData.error.message}`);
    }

    // --- 3. ENVIAR CORREO CON RESEND (CORRECCIÓN DE HORA AQUÍ) ---
    if (appointment.patients?.email && resendApiKey) {
      
      // SOLUCIÓN AL PROBLEMA DE LA HORA:
      // Forzamos la zona horaria a 'America/Bogota' para que convierta UTC a hora local
      const fecha = new Date(appointment.start_time).toLocaleDateString('es-CO', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        timeZone: 'America/Bogota' // <--- ESTO ES LA CLAVE
      });
      
      const hora = new Date(appointment.start_time).toLocaleTimeString('es-CO', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true,
        timeZone: 'America/Bogota' // <--- ESTO ES LA CLAVE
      });

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${resendApiKey}`, 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({
          // Recuerda: Si no has verificado dominio, solo te llegará al correo de registro de Resend
          from: "Agenda Psicológica <onboarding@resend.dev>", 
          to: [appointment.patients.email],
          subject: "✅ Cita Confirmada - RootWave",
          html: `
            <div style="font-family: sans-serif; color: #333; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #4f46e5; text-align: center;">¡Cita Confirmada!</h2>
              <p>Hola <strong>${appointment.patients.full_name}</strong>,</p>
              <p>Tu cita ha sido agendada exitosamente en nuestro sistema.</p>
              
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 8px 0; font-size: 16px;"><strong>📅 Fecha:</strong> ${fecha}</p>
                <p style="margin: 8px 0; font-size: 16px;"><strong>⏰ Hora:</strong> ${hora}</p>
                <p style="margin: 8px 0; font-size: 16px;"><strong>🧠 Servicio:</strong> ${appointment.services?.name}</p>
              </div>

              <p style="font-size: 14px; color: #666;">Te esperamos en el consultorio. Si necesitas cancelar o reagendar, por favor contáctanos con anticipación.</p>
              
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="text-align: center; font-size: 12px; color: #999;">Enviado automáticamente por RootWave Agenda</p>
            </div>
          `
        })
      })
    }

    return new Response(JSON.stringify({ success: true, eventId: calData.id }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    })

  } catch (error) {
    console.error("Error Function:", error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    })
  }
})