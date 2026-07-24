import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Notification {
  id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  unread_count: number;
  has_more: boolean;
}

interface NotificationsParams {
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
}

// Use the Supabase URL from environment
const SUPABASE_URL = "https://fbgioxhbuullokzmqwqn.supabase.co";

export const useNotifications = (params: NotificationsParams = {}) => {
  const { user } = useAuth();

  return useQuery<NotificationsResponse>({
    queryKey: ['notifications', params],
    queryFn: async () => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get auth token for API call
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session found');

      const searchParams = new URLSearchParams();
      if (params.unreadOnly) searchParams.set('unread_only', 'true');
      if (params.limit) searchParams.set('limit', params.limit.toString());
      if (params.offset) searchParams.set('offset', params.offset.toString());

      const response = await fetch(`${SUPABASE_URL}/functions/v1/notifications?${searchParams}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch notifications');
      }
      
      return response.json();
    },
    staleTime: 30 * 1000, // 30 seconds (notifications need to be fresh)
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!user, // Only run if user is authenticated
  });
};

export const useMarkNotificationsAsRead = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ notificationIds, markAsRead = true }: { 
      notificationIds: string[];
      markAsRead?: boolean;
    }) => {
      if (!user) throw new Error('User not authenticated');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session found');

      const response = await fetch(`${SUPABASE_URL}/functions/v1/notifications`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notification_ids: notificationIds,
          mark_as_read: markAsRead,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update notifications');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch notifications
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useCreateNotification = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, message }: { 
      userId: string;
      message: string;
    }) => {
      if (!user) throw new Error('User not authenticated');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session found');

      const response = await fetch(`${SUPABASE_URL}/functions/v1/notifications`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          message,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create notification');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch notifications
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};