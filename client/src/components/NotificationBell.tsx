import { useState } from "react";
import { Bell, Check, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  action_url: string | null;
  metadata: {
    connection_id?: string;
    mentor_name?: string;
    mentor_email?: string;
  } | null;
  created_at: string;
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return await apiRequest('PATCH', `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  const handleMentorInviteResponse = useMutation({
    mutationFn: async ({ connectionId, action }: { connectionId: string; action: 'accept' | 'reject' }) => {
      return await apiRequest('POST', `/api/mentor/connection/${connectionId}/${action}`);
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.action === 'accept' ? "Mentor connection accepted!" : "Mentor invitation declined",
        description: variables.action === 'accept' 
          ? "Your mentor can now view your trading accounts."
          : "The mentorship request has been declined.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
    onError: () => {
      toast({
        title: "Action failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'mentor_invite':
        return <UserPlus className="h-4 w-4 text-cyan-600" />;
      default:
        return <Bell className="h-4 w-4 text-cyan-600" />;
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
          data-testid="button-notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-600 text-xs"
              data-testid="badge-notification-count"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[500px] overflow-y-auto">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        ) : (
          notifications.map((notification) => (
            <div key={notification.id} data-testid={`notification-${notification.id}`}>
              <DropdownMenuItem
                className={`flex flex-col items-start gap-2 p-3 cursor-pointer ${
                  !notification.read ? 'bg-cyan-50 dark:bg-cyan-950/20' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-2 w-full">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{notification.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="h-2 w-2 rounded-full bg-cyan-600" />
                  )}
                </div>

                {/* Mentor Invite Actions */}
                {notification.type === 'mentor_invite' && notification.metadata?.connection_id && (
                  <div className="flex gap-2 w-full mt-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMentorInviteResponse.mutate({
                          connectionId: notification.metadata!.connection_id!,
                          action: 'accept',
                        });
                      }}
                      disabled={handleMentorInviteResponse.isPending}
                      data-testid={`button-accept-${notification.id}`}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMentorInviteResponse.mutate({
                          connectionId: notification.metadata!.connection_id!,
                          action: 'reject',
                        });
                      }}
                      disabled={handleMentorInviteResponse.isPending}
                      data-testid={`button-reject-${notification.id}`}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Decline
                    </Button>
                  </div>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </div>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
