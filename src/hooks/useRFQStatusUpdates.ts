import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface RFQStatusUpdate {
  id: string;
  status: string;
  rfq_number: string;
}

export const useRFQStatusUpdates = (onStatusUpdate?: (rfq: RFQStatusUpdate) => void) => {
  const { toast } = useToast();

  useEffect(() => {
    const channel = supabase
      .channel('rfq-status-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rfqs'
        },
        (payload) => {
          const updatedRFQ = payload.new as RFQStatusUpdate;
          
          // Notify about status change
          toast({
            title: "RFQ Status Updated",
            description: `${updatedRFQ.rfq_number} status changed to: ${updatedRFQ.status}`,
          });

          // Call callback if provided
          if (onStatusUpdate) {
            onStatusUpdate(updatedRFQ);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onStatusUpdate, toast]);
};