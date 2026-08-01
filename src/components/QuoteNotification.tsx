import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSupabaseWorkflow } from "@/hooks/useSupabaseWorkflow";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

const QuoteNotification = () => {
  const { user } = useAuth();
  const { quotes } = useSupabaseWorkflow();
  
  // Only show notifications for authenticated users
  if (!user) {
    return (
      <Link to="/auth">
        <Button variant="outline" size="icon">
          <Bell className="w-4 h-4" />
        </Button>
      </Link>
    );
  }

  const pendingQuotes = quotes.filter(q => q.status === 'Pending');

  if (pendingQuotes.length === 0) {
    return (
      <Link to="/rfq-dashboard">
        <Button variant="outline" size="icon">
          <Bell className="w-4 h-4" />
        </Button>
      </Link>
    );
  }

  return (
    <Link to="/rfq-dashboard">
      <Button variant="outline" size="icon" className="relative">
        <Bell className="w-4 h-4" />
        <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
          {pendingQuotes.length}
        </Badge>
      </Button>
    </Link>
  );
};

export default QuoteNotification;