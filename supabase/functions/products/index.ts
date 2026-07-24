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
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    console.log(`${req.method} request to /api/products`)

    if (req.method === 'GET') {
      // List all supplier products (public endpoint)
      const { data: products, error } = await supabase
        .from('supplier_products')
        .select(`
          id,
          name,
          description,
          price,
          created_at,
          suppliers!inner(
            company_name,
            contact_info
          )
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching products:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch products' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      const formattedProducts = products?.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        created_at: product.created_at,
        supplier: {
          company_name: (product.suppliers as any)?.company_name,
          contact_info: (product.suppliers as any)?.contact_info
        }
      })) || []

      return new Response(
        JSON.stringify({ 
          products: formattedProducts,
          total: formattedProducts.length 
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