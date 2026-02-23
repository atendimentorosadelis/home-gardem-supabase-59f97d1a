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

    const { email, username, password } = await req.json()

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email é obrigatório' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    let userId: string

    if (password) {
      // Create user directly with password
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { username: username || undefined },
      })

      if (createError) {
        if (createError.message?.includes('already been registered')) {
          // User exists, find them
          const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
          const existingUser = users?.find(u => u.email === email)
          if (!existingUser) {
            return new Response(JSON.stringify({ error: 'Usuário já existe mas não foi encontrado' }), {
              status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }
          userId = existingUser.id
        } else {
          throw createError
        }
      } else {
        userId = newUser.user!.id
      }
    } else {
      // Invite by email
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email)
      if (inviteError) {
        if (inviteError.message?.includes('already been registered')) {
          const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
          const existingUser = users?.find(u => u.email === email)
          if (!existingUser) {
            return new Response(JSON.stringify({ error: 'Usuário já existe mas não foi encontrado' }), {
              status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }
          userId = existingUser.id
        } else {
          throw inviteError
        }
      } else {
        userId = inviteData.user!.id
      }
    }

    // Update username in profile if provided
    if (username) {
      await supabaseAdmin
        .from('profiles')
        .update({ username })
        .eq('user_id', userId)
    }

    // Add admin role (upsert to avoid duplicates)
    const { data: existingRole } = await supabaseAdmin
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .single()

    if (!existingRole) {
      await supabaseAdmin
        .from('user_roles')
        .insert({ user_id: userId, role: 'admin' })
    }

    return new Response(JSON.stringify({
      success: true,
      userId,
      message: password ? 'Admin criado com sucesso' : 'Convite enviado com sucesso',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in invite-admin:', error)
    return new Response(JSON.stringify({ error: error.message || 'Erro interno' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
