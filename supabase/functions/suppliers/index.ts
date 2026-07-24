import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get JWT token from request
    const authToken = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!authToken) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Verify the JWT and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(authToken)
    if (authError || !user) {
      console.error('Auth error:', authError)
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if user is admin
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (roleError || userRole?.role !== 'admin') {
      console.error('Role check failed:', roleError, userRole)
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`${req.method} request to /api/suppliers by admin user: ${user.email}`)

    if (req.method === 'GET') {
      // List all suppliers (admin only)
      const { data: suppliers, error } = await supabase
        .from('suppliers')
        .select(`
          id,
          company_name,
          contact_info,
          created_at,
          profiles!inner(
            name
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching suppliers:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch suppliers' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      const formattedSuppliers = suppliers?.map(supplier => ({
        id: supplier.id,
        company_name: supplier.company_name,
        contact_info: supplier.contact_info,
        created_at: supplier.created_at,
        contact_person: (supplier.profiles as any)?.name || 'N/A'
      })) || []

      return new Response(
        JSON.stringify({ 
          suppliers: formattedSuppliers,
          total: formattedSuppliers.length 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})