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

    console.log(`${req.method} request to /api/notifications by user: ${user.email}`)

    if (req.method === 'GET') {
      const url = new URL(req.url)
      const unreadOnly = url.searchParams.get('unread_only') === 'true'
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100)
      const offset = parseInt(url.searchParams.get('offset') || '0')

      // Build query
      let query = supabase
        .from('notifications')
        .select('id, message, is_read, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (unreadOnly) {
        query = query.eq('is_read', false)
      }

      const { data: notifications, error } = await query

      if (error) {
        console.error('Error fetching notifications:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch notifications' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Get unread count
      const { count: unreadCount, error: countError } = await supabase
        .from('notifications')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (countError) {
        console.error('Error fetching unread count:', countError)
      }

      return new Response(
        JSON.stringify({ 
          notifications: notifications || [],
          total: notifications?.length || 0,
          unread_count: unreadCount || 0,
          has_more: (notifications?.length || 0) === limit
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (req.method === 'PATCH') {
      const body = await req.json()
      const { notification_ids, mark_as_read } = body

      if (!notification_ids || !Array.isArray(notification_ids)) {
        return new Response(
          JSON.stringify({ error: 'notification_ids array is required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Update notifications
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: mark_as_read !== false })
        .in('id', notification_ids)
        .eq('user_id', user.id) // Ensure user can only update their own notifications

      if (error) {
        console.error('Error updating notifications:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to update notifications' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      return new Response(
        JSON.stringify({ 
          message: `Notifications marked as ${mark_as_read !== false ? 'read' : 'unread'}`,
          updated_count: notification_ids.length
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (req.method === 'POST') {
      // Create notification (typically used by system/admin)
      const body = await req.json()
      const { user_id, message } = body

      if (!user_id || !message) {
        return new Response(
          JSON.stringify({ error: 'user_id and message are required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Check if current user is admin or if they're creating notification for themselves
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (userRole?.role !== 'admin' && user_id !== user.id) {
        return new Response(
          JSON.stringify({ error: 'Not authorized to create notifications for other users' }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      const { data: notification, error } = await supabase
        .from('notifications')
        .insert([{
          user_id,
          message,
          is_read: false
        }])
        .select()
        .single()

      if (error) {
        console.error('Error creating notification:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to create notification' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      return new Response(
        JSON.stringify({ 
          message: 'Notification created successfully',
          notification
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