import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications, useMarkNotificationsAsRead } from "@/hooks/useNotifications";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

// Real cross-user notifications (new RFQ received, negotiation updates, PO
// created, RFQ cancelled, ...) -- rows are written directly by whichever
// side triggers the event (see useSupabaseWorkflow) and read here via the
// notifications edge function.
const QuoteNotification = () => {
  const { user } = useAuth();
  const { data } = useNotifications({ limit: 10 });
  const { mutate: markAsRead } = useMarkNotificationsAsRead();

  if (!user) {
    return (
      <Link to="/auth">
        <Button variant="outline" size="icon">
          <Bell className="w-4 h-4" />
        </Button>
      </Link>
    );
  }

  const notifications = data?.notifications || [];
  const unreadCount = data?.unread_count || 0;

  const handleOpenChange = (open: boolean) => {
    if (open && unreadCount > 0) {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      if (unreadIds.length > 0) markAsRead({ notificationIds: unreadIds });
    }
  };

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center p-0">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <p className="px-2 py-4 text-sm text-muted-foreground text-center">
            No notifications yet
          </p>
        ) : (
          notifications.map(n => (
            <DropdownMenuItem key={n.id} className="flex-col items-start gap-0.5 whitespace-normal py-2">
              <p className={`text-sm ${n.is_read ? 'text-muted-foreground' : 'font-medium text-foreground'}`}>
                {n.message}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
              </p>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default QuoteNotification;
