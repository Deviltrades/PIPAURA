import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import WidgetManager, { type WidgetType } from "@/components/WidgetManager";
import { widgetComponents } from "@/components/DashboardWidgets";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCustomizing, setIsCustomizing] = useState(false);

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/analytics/stats"],
    retry: false,
  });

  const { data: trades, isLoading: tradesLoading } = useQuery({
    queryKey: ["/api/trades"],
    retry: false,
  });

  // Get user's widget preferences from their profile
  const activeWidgets: WidgetType[] = (user as any)?.dashboardWidgets || [
    "total-pnl",
    "win-rate", 
    "active-trades",
    "recent-trades"
  ];

  // Save widget preferences
  const updateWidgets = useMutation({
    mutationFn: async (widgets: WidgetType[]) => {
      console.log("Updating widgets:", widgets);
      try {
        const response = await apiRequest("PUT", "/api/dashboard/widgets", { widgets });
        console.log("Widget update response:", response);
        return await response.json();
      } catch (error) {
        console.error("Widget update API error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Dashboard Updated",
        description: "Your widget preferences have been saved.",
      });
    },
    onError: (error) => {
      console.error("Widget update error:", error);
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to save widget preferences.",
        variant: "destructive",
      });
    },
  });

  const handleAddWidget = (widgetId: WidgetType) => {
    if (!activeWidgets.includes(widgetId)) {
      const newWidgets = [...activeWidgets, widgetId];
      updateWidgets.mutate(newWidgets);
    }
  };

  const handleRemoveWidget = (widgetId: WidgetType) => {
    const newWidgets = activeWidgets.filter(id => id !== widgetId);
    updateWidgets.mutate(newWidgets);
  };

  if (analyticsLoading || tradesLoading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="mb-8">
          <div className="h-8 bg-muted animate-pulse rounded mb-2 w-48"></div>
          <div className="h-4 bg-muted animate-pulse rounded w-64"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Trading Dashboard</h1>
          <p className="text-muted-foreground">Monitor your performance with customizable widgets</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCustomizing(!isCustomizing)}
          >
            <Settings className="h-4 w-4 mr-2" />
            {isCustomizing ? "Done" : "Customize"}
          </Button>
          <WidgetManager
            activeWidgets={activeWidgets}
            onAddWidget={handleAddWidget}
            onRemoveWidget={handleRemoveWidget}
          />
        </div>
      </div>

      {activeWidgets.length === 0 ? (
        <div className="text-center py-16">
          <h3 className="text-lg font-medium mb-2">No widgets added yet</h3>
          <p className="text-muted-foreground mb-4">
            Add widgets to customize your dashboard and track your trading performance
          </p>
          <WidgetManager
            activeWidgets={activeWidgets}
            onAddWidget={handleAddWidget}
            onRemoveWidget={handleRemoveWidget}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {activeWidgets.map((widgetId) => {
            const WidgetComponent = widgetComponents[widgetId];
            
            if (!WidgetComponent) {
              return null;
            }

            return (
              <WidgetComponent
                key={widgetId}
                onRemove={() => handleRemoveWidget(widgetId)}
                analytics={analytics}
                trades={trades}
              />
            );
          })}
        </div>
      )}

      {activeWidgets.length > 0 && (
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Hover over widgets and click the X to remove them, or use "Add Widget" to add more
          </p>
        </div>
      )}
    </div>
  );
}