import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Fixed-price fast path: when a customer submits an RFQ targeted at a
// supplier who has negotiation turned OFF, and every line item is a
// catalog product of that supplier's with a Fixed Price set, skip the
// whole negotiation pipeline -- create the quote, product_quotes, and
// order all pre-Accepted in one shot.
//
// This runs server-side with the service role, deliberately NOT as direct
// client-side inserts under the customer's own session: RLS only lets
// *suppliers* insert quotes/product_quotes, and even if it didn't, a client
// that could insert an already-"Accepted" quote for arbitrary RFQs would be
// a way to fabricate confirmed orders. This function re-derives and checks
// every condition itself before writing anything, so the only thing the
// client controls is which RFQ to try this for -- not the outcome.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const authToken = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!authToken) {
      return new Response(JSON.stringify({ error: 'Missing authorization token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authToken)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authorization token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { rfq_id } = await req.json()
    if (!rfq_id) {
      return new Response(JSON.stringify({ error: 'rfq_id is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // The RFQ must belong to the caller -- only the customer who created it
    // can trigger auto-confirmation for it.
    const { data: rfq, error: rfqError } = await supabase
      .from('rfqs')
      .select('id, rfq_number, user_id, target_supplier_id, status')
      .eq('id', rfq_id)
      .eq('user_id', user.id)
      .single()

    if (rfqError || !rfq) {
      return new Response(JSON.stringify({ applied: false, reason: 'RFQ not found' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!rfq.target_supplier_id || rfq.status !== 'Created') {
      return new Response(JSON.stringify({ applied: false, reason: 'RFQ is not eligible' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { data: supplierRow, error: supplierError } = await supabase
      .from('suppliers')
      .select('negotiation_enabled, company_name')
      .eq('id', rfq.target_supplier_id)
      .single()

    if (supplierError || !supplierRow || supplierRow.negotiation_enabled) {
      return new Response(JSON.stringify({ applied: false, reason: 'Supplier requires negotiation' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, source_product_id, quantity, target_lead_time')
      .eq('rfq_id', rfq_id)

    if (productsError || !products || products.length === 0) {
      return new Response(JSON.stringify({ applied: false, reason: 'No products on this RFQ' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Every line must trace back to this exact supplier's own catalog --
    // a freeform "unidentified" item has no fixed price to auto-confirm.
    if (products.some((p) => !p.source_product_id)) {
      return new Response(JSON.stringify({ applied: false, reason: 'Not all products are catalog items' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const sourceIds = products.map((p) => p.source_product_id as string)
    const { data: catalogRows, error: catalogError } = await supabase
      .from('supplier_products')
      .select('id, price')
      .in('id', sourceIds)
      .eq('supplier_id', rfq.target_supplier_id)

    if (catalogError || !catalogRows) {
      return new Response(JSON.stringify({ applied: false, reason: 'Could not verify catalog prices' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const priceById = new Map(catalogRows.map((r) => [r.id, r.price as number | null]))
    if (products.some((p) => priceById.get(p.source_product_id as string) == null)) {
      return new Response(JSON.stringify({ applied: false, reason: 'Not every product has a fixed price' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const totalAmount = products.reduce((sum, p) => {
      const price = priceById.get(p.source_product_id as string) as number
      return sum + price * p.quantity
    }, 0)

    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .insert([{
        rfq_id,
        supplier_id: rfq.target_supplier_id,
        supplier_name: supplierRow.company_name,
        total_amount: totalAmount,
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'Accepted',
      }])
      .select()
      .single()

    if (quoteError || !quote) {
      console.error('Quote creation error:', quoteError)
      return new Response(JSON.stringify({ applied: false, reason: 'Failed to create quote' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const productQuotesToInsert = products.map((p) => ({
      quote_id: quote.id,
      product_id: p.id,
      unit_price: priceById.get(p.source_product_id as string) as number,
      lead_time: p.target_lead_time || 7,
      terms: 'Fixed price -- no negotiation',
      status: 'Accepted',
      last_offer_by: 'supplier',
    }))

    const { error: pqError } = await supabase.from('product_quotes').insert(productQuotesToInsert)
    if (pqError) {
      console.error('Product quotes creation error:', pqError)
      return new Response(JSON.stringify({ applied: false, reason: 'Failed to create product quotes' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        rfq_id,
        quote_id: quote.id,
        po_number: `PO${Date.now().toString().slice(-6)}`,
        delivery_address: 'Default delivery address',
        delivery_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      }])
      .select()
      .single()

    if (orderError) {
      console.error('Order creation error:', orderError)
      return new Response(JSON.stringify({ applied: false, reason: 'Failed to create order' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    await supabase.from('rfqs').update({ status: 'Order_Placed' }).eq('id', rfq_id)

    await supabase.from('notifications').insert([{
      user_id: rfq.target_supplier_id,
      message: `New order (${order.po_number}) for RFQ ${rfq.rfq_number} at your fixed prices -- no negotiation needed. Please acknowledge it and share your payment QR code.`,
      link: `/quote/${quote.id}`,
    }])

    return new Response(JSON.stringify({ applied: true, quote_id: quote.id }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
