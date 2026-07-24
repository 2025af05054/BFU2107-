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

    // Get user role
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (roleError || !userRole) {
      console.error('Role check failed:', roleError)
      return new Response(
        JSON.stringify({ error: 'User role not found' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`${req.method} request to /api/rfq by ${userRole.role} user: ${user.email}`)

    if (req.method === 'GET') {
      let rfqQuery = supabase
        .from('rfqs')
        .select(`
          id,
          rfq_number,
          status,
          rfq_status,
          created_at,
          customer_id,
          products(
            id,
            name,
            description,
            quantity,
            target_price,
            target_lead_time
          )
        `)

      // Role-based filtering
      if (userRole.role === 'customer') {
        // Customers see only their own RFQs
        rfqQuery = rfqQuery.eq('user_id', user.id)
      } else if (userRole.role === 'supplier') {
        // Suppliers see all RFQs to respond to
        // No additional filtering needed
      } else if (userRole.role !== 'admin') {
        // Non-authorized roles get empty results
        return new Response(
          JSON.stringify({ rfqs: [], total: 0 }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      const { data: rfqs, error } = await rfqQuery.order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching RFQs:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch RFQs' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      return new Response(
        JSON.stringify({ 
          rfqs: rfqs || [],
          total: rfqs?.length || 0,
          user_role: userRole.role
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (req.method === 'POST') {
      // Only customers can create RFQs
      if (userRole.role !== 'customer') {
        return new Response(
          JSON.stringify({ error: 'Only customers can create RFQs' }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      const body = await req.json()
      const { products } = body

      if (!products || !Array.isArray(products) || products.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Products array is required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Create RFQ
      const { data: rfq, error: rfqError } = await supabase
        .from('rfqs')
        .insert([{
          user_id: user.id,
          customer_id: user.id,
          status: 'Created',
          rfq_status: 'pending'
        }])
        .select()
        .single()

      if (rfqError) {
        console.error('Error creating RFQ:', rfqError)
        return new Response(
          JSON.stringify({ error: 'Failed to create RFQ' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Create products for the RFQ
      const productsToInsert = products.map((product: any) => ({
        rfq_id: rfq.id,
        name: product.name,
        description: product.description || '',
        type: product.type || 'General',
        quantity: product.quantity || 1,
        target_price: product.target_price || null,
        target_lead_time: product.target_lead_time || null,
        manufacturer: product.manufacturer || null
      }))

      const { error: productsError } = await supabase
        .from('products')
        .insert(productsToInsert)

      if (productsError) {
        console.error('Error creating products:', productsError)
        // Rollback RFQ creation
        await supabase.from('rfqs').delete().eq('id', rfq.id)
        return new Response(
          JSON.stringify({ error: 'Failed to create RFQ products' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Get customer profile for email notification
      const { data: customerProfile } = await supabase
        .from('profiles')
        .select('name, company')
        .eq('id', user.id)
        .single()

      // Send email notification
      try {
        const emailResponse = await supabase.functions.invoke('send-rfq-notification', {
          body: {
            rfq_id: rfq.id,
            rfq_number: rfq.rfq_number,
            customer_email: user.email,
            customer_name: customerProfile?.name || user.email,
            customer_company: customerProfile?.company || undefined
          }
        })
        
        if (emailResponse.error) {
          console.error('Error sending email notification:', emailResponse.error)
        } else {
          console.log('Email notification sent successfully')
        }
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError)
        // Don't fail the RFQ creation if email fails
      }

      return new Response(
        JSON.stringify({ 
          message: 'RFQ created successfully',
          rfq_id: rfq.id,
          rfq_number: rfq.rfq_number
        }),
        {
          status: 201,
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