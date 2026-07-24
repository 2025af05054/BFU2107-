import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RFQNotificationRequest {
  rfq_id: string;
  rfq_number: string;
  customer_email: string;
  customer_name: string;
  customer_company?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { rfq_id, rfq_number, customer_email, customer_name, customer_company }: RFQNotificationRequest = await req.json();

    console.log(`Sending RFQ notification for RFQ ${rfq_number} from ${customer_email}`);

    // Fetch complete RFQ details including products
    const { data: rfqData, error: rfqError } = await supabase
      .from('rfqs')
      .select(`
        *,
        products (
          id,
          name,
          description,
          quantity,
          target_price,
          target_lead_time,
          manufacturer,
          type,
          images
        )
      `)
      .eq('id', rfq_id)
      .single();

    if (rfqError || !rfqData) {
      console.error('Error fetching RFQ data:', rfqError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch RFQ details' }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create email HTML content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>New RFQ Notification</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f4f4f4; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
            .rfq-details { background: #fff; border: 1px solid #ddd; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
            .product-item { border-bottom: 1px solid #eee; padding: 15px 0; }
            .product-item:last-child { border-bottom: none; }
            .label { font-weight: bold; color: #555; }
            .value { margin-left: 10px; }
            .products-header { background: #e8f4fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>🔔 New RFQ Notification</h2>
              <p>A new Request for Quotation has been submitted by a customer.</p>
            </div>
            
            <div class="rfq-details">
              <h3>RFQ Information</h3>
              <p><span class="label">RFQ Number:</span><span class="value">${rfq_number}</span></p>
              <p><span class="label">Status:</span><span class="value">${rfqData.status}</span></p>
              <p><span class="label">Created Date:</span><span class="value">${new Date(rfqData.created_at).toLocaleDateString()}</span></p>
              <p><span class="label">Last Updated:</span><span class="value">${new Date(rfqData.updated_at).toLocaleDateString()}</span></p>
            </div>

            <div class="rfq-details">
              <h3>Customer Information</h3>
              <p><span class="label">Customer Name:</span><span class="value">${customer_name}</span></p>
              <p><span class="label">Email:</span><span class="value">${customer_email}</span></p>
              ${customer_company ? `<p><span class="label">Company:</span><span class="value">${customer_company}</span></p>` : ''}
            </div>

            <div class="products-header">
              <h3>📦 Products Requested (${rfqData.products?.length || 0} items)</h3>
            </div>

            <div class="rfq-details">
              ${rfqData.products?.map((product: any, index: number) => `
                <div class="product-item">
                  <h4>Product ${index + 1}: ${product.name}</h4>
                  <p><span class="label">Type:</span><span class="value">${product.type || 'General'}</span></p>
                  <p><span class="label">Quantity:</span><span class="value">${product.quantity}</span></p>
                  ${product.description ? `<p><span class="label">Description:</span><span class="value">${product.description}</span></p>` : ''}
                  ${product.manufacturer ? `<p><span class="label">Manufacturer:</span><span class="value">${product.manufacturer}</span></p>` : ''}
                  ${product.target_price ? `<p><span class="label">Target Price:</span><span class="value">₹${product.target_price}</span></p>` : ''}
                  ${product.target_lead_time ? `<p><span class="label">Target Lead Time:</span><span class="value">${product.target_lead_time} days</span></p>` : ''}
                  ${product.images && product.images.length > 0 ? `<p><span class="label">Images:</span><span class="value">${product.images.length} attached</span></p>` : ''}
                </div>
              `).join('') || '<p>No products found</p>'}
            </div>

            <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin-top: 20px;">
              <p><strong>Next Steps:</strong></p>
              <ul>
                <li>Review the RFQ details carefully</li>
                <li>Contact suppliers for quotations</li>
                <li>Follow up with the customer if needed</li>
                <li>Update the RFQ status in the admin panel</li>
              </ul>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email using Resend API directly
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'RFQ System <onboarding@resend.dev>',
        to: ['2025af05054@wilp.bits-pilani.ac.in'],
        subject: `🔔 New RFQ ${rfq_number} from ${customer_name}`,
        html: emailHtml,
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error('Error sending email:', emailResult);
      return new Response(
        JSON.stringify({ error: 'Failed to send email notification' }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Email sent successfully:", emailResult);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "RFQ notification email sent successfully",
      email_id: emailResult.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-rfq-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);