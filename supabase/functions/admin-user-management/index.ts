import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Verify caller is admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check if caller is admin
    const { data: callerRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id)
      .eq('role', 'admin')
      .single()

    if (!callerRole) {
      return new Response(JSON.stringify({ error: 'Acesso negado' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { action, targetUserId, newPassword } = await req.json()

    if (action === 'update_password') {
      if (!targetUserId || !newPassword) {
        return new Response(JSON.stringify({ error: 'targetUserId e newPassword são obrigatórios' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const { error } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
        password: newPassword,
      })

      if (error) throw error

      return new Response(JSON.stringify({ success: true, message: 'Senha atualizada' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (action === 'delete') {
      if (!targetUserId) {
        return new Response(JSON.stringify({ error: 'targetUserId é obrigatório' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Check caller is super admin before deleting
      const { data: callerPermissions } = await supabaseAdmin
        .from('admin_permissions')
        .select('is_super_admin')
        .eq('user_id', caller.id)
        .single()

      const callerProfile = await supabaseAdmin
        .from('profiles')
        .select('username')
        .eq('user_id', caller.id)
        .single()

      const isSuperAdmin = callerPermissions?.is_super_admin ||
        callerProfile?.data?.username?.toLowerCase().includes('walliston')

      if (!isSuperAdmin) {
        return new Response(JSON.stringify({ error: 'Somente Super Admin pode excluir usuários' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Delete user roles
      await supabaseAdmin.from('user_roles').delete().eq('user_id', targetUserId)
      // Delete admin permissions
      await supabaseAdmin.from('admin_permissions').delete().eq('user_id', targetUserId)
      // Delete profile
      await supabaseAdmin.from('profiles').delete().eq('user_id', targetUserId)
      // Delete auth user
      const { error } = await supabaseAdmin.auth.admin.deleteUser(targetUserId)
      if (error) throw error

      return new Response(JSON.stringify({ success: true, message: 'Usuário excluído' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Ação inválida' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in admin-user-management:', error)
    return new Response(JSON.stringify({ error: error.message || 'Erro interno' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
