import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { importPKCS8, SignJWT } from "https://deno.land/x/jose@v4.14.4/index.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { date } = await req.json() // Recibe '2026-02-09'
    
    // Inicializar Supabase Admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Obtener BLOQUES DE TRABAJO (Tus horarios configurados)
    // Usamos una fecha ficticia a medio día para evitar errores de día incorrecto por UTC
    const targetDate = new Date(date + 'T12:00:00') 
    const dayOfWeek = targetDate.getDay()

    const { data: shifts } = await supabaseAdmin
      .from('work_shifts')
      .select('*')
      .eq('day_of_week', dayOfWeek)

    // Si no hay turnos configurados para hoy, devolvemos todo vacío (Cerrado)
    if (!shifts || shifts.length === 0) {
      return new Response(JSON.stringify({ slots: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    // 2. Obtener CITAS OCUPADAS en SUPABASE (La parte que faltaba)
    const { data: dbAppointments } = await supabaseAdmin
      .from('appointments')
      .select('start_time')
      .gte('start_time', `${date}T00:00:00`) // Todo el día actual
      .lte('start_time', `${date}T23:59:59`)
      .in('status', ['pending', 'confirmed']) // Bloquear si está pendiente O confirmada

    // CORRECCIÓN DE ZONA HORARIA (Crucial para Colombia/Latam)
    // La DB devuelve UTC (ej: 13:00). Colombia es UTC-5 (ej: 08:00).
    const dbBusyHours = dbAppointments?.map(app => {
      const utcDate = new Date(app.start_time);
      // Restamos 5 horas para obtener la hora local de Colombia
      // Nota: Si usas servidores en otra zona, esto asegura que leamos la hora "real" del evento
      const localHour = utcDate.getUTCHours() - 5; 
      return localHour;
    }) || [];

    // 3. Obtener EVENTOS DE GOOGLE CALENDAR
    const clientEmail = Deno.env.get("GOOGLE_CLIENT_EMAIL")
    const privateKeyPEM = Deno.env.get("GOOGLE_PRIVATE_KEY")?.replace(/\\n/g, "\n")
    const calendarId = Deno.env.get("GOOGLE_CALENDAR_ID")

    const privateKey = await importPKCS8(privateKeyPEM!, 'RS256')
    const jwt = await new SignJWT({ scope: 'https://www.googleapis.com/auth/calendar.readonly' })
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuer(clientEmail!)
      .setAudience('https://oauth2.googleapis.com/token')
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(privateKey)

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt })
    })
    const { access_token } = await tokenRes.json()

    // Consultar Google
    const timeMin = `${date}T00:00:00Z`
    const timeMax = `${date}T23:59:59Z`
    const googleRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    )
    const googleData = await googleRes.json()
    
    // Procesar horas ocupadas en Google (Detectando hora local)
    const googleBusyHours = googleData.items?.map((event: any) => {
      const startStr = event.start.dateTime || event.start.date;
      
      // Si es evento de todo el día, devolvemos un marcador especial
      if(!event.start.dateTime) return "ALL_DAY";

      // Extraemos la hora local directamente del string ISO que da Google (ej: T08:00:00-05:00)
      const hourMatch = startStr.match(/T(\d{2}):/);
      return hourMatch ? parseInt(hourMatch[1]) : null;
    }).flat() || []


    // 4. GENERAR SLOTS (Cruzando toda la información)
    const finalSlots: any[] = []
    const isAllDayBusy = googleBusyHours.includes("ALL_DAY");
    
    shifts.forEach((shift: any) => {
      const startHour = parseInt(shift.start_time.split(':')[0]);
      const endHour = parseInt(shift.end_time.split(':')[0]) - 1; // Restamos 1 porque la cita dura 1 hora

      for (let hour = startHour; hour <= endHour; hour++) {
        const timeString = `${hour.toString().padStart(2, '0')}:00`
        
        // ¿Está ocupado? Sí, si Google dice que sí O si la DB dice que sí
        const isBusy = isAllDayBusy || googleBusyHours.includes(hour) || dbBusyHours.includes(hour);
        
        finalSlots.push({
          time: timeString,
          available: !isBusy
        });
      }
    });

    // Ordenar cronológicamente
    finalSlots.sort((a: any, b: any) => a.time.localeCompare(b.time));

    return new Response(JSON.stringify({ slots: finalSlots }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders })
  }
})