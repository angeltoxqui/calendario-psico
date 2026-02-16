import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-secret',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { action, email, newPassword, adminSecret } = await req.json()

    // 1. SEGURIDAD: Verificar una clave maestra para que nadie más use esto
    // configurar esto en Supabase Secrets: npx supabase secrets set ADMIN_SECRET="tu-clave-secreta"
    const CORRECT_SECRET = Deno.env.get('ADMIN_SECRET')
    
    if (adminSecret !== CORRECT_SECRET) {
      throw new Error('⛔ Acceso denegado: Clave de Super Admin incorrecta.')
    }

    // Inicializar Supabase con permisos de SUPER USUARIO (Service Role)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Buscar el ID del usuario por su email
    const { data: users, error: findError } = await supabaseAdmin.auth.admin.listUsers()
    const targetUser = users.users.find(u => u.email === email)

    if (!targetUser) throw new Error('Usuario no encontrado')

    let message = ''

    // 2. LÓGICA DE ACCIONES
    if (action === 'ban') {
      // Banear por 100 años (Efectivamente desactiva la cuenta)
      const { error } = await supabaseAdmin.auth.admin.updateUserById(
        targetUser.id, 
        { ban_duration: '876000h' } 
      )
      if (error) throw error
      message = `🚫 Usuario ${email} ha sido DESACTIVADO (Baneado).`
    } 
    
    else if (action === 'unban') {
      // Quitar el ban (Poner duración en 0)
      const { error } = await supabaseAdmin.auth.admin.updateUserById(
        targetUser.id, 
        { ban_duration: '0s' } 
      )
      if (error) throw error
      message = `✅ Usuario ${email} ha sido REACTIVADO.`
    } 
    
    else if (action === 'reset_password') {
      // Forzar cambio de contraseña
      const { error } = await supabaseAdmin.auth.admin.updateUserById(
        targetUser.id, 
        { password: newPassword } 
      )
      if (error) throw error
      message = `🔑 Contraseña actualizada para ${email}.`
    }

    return new Response(JSON.stringify({ success: true, message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders })
  }
})