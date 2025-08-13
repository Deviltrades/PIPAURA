import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Settings, Move } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import WidgetManager, { type WidgetType } from "@/components/WidgetManager";
import { widgetComponents } from "@/components/DashboardWidgets";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Responsive, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveGridLayout = WidthProvider(Responsive);

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [isDraggable, setIsDraggable] = useState(false);

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

  // Default layout configuration for react-grid-layout
  const getDefaultLayout = () => {
    const layouts: { [key: string]: any[] } = {
      lg: activeWidgets.map((widgetId, index) => ({
        i: widgetId,
        x: (index % 4) * 3,
        y: Math.floor(index / 4) * 4,
        w: widgetId === "trading-calendar" ? 6 : 3,
        h: widgetId === "trading-calendar" ? 8 : 4,
        minW: 2,
        minH: 3,
      })),
      md: activeWidgets.map((widgetId, index) => ({
        i: widgetId,
        x: (index % 2) * 6,
        y: Math.floor(index / 2) * 4,
        w: widgetId === "trading-calendar" ? 12 : 6,
        h: widgetId === "trading-calendar" ? 8 : 4,
        minW: 4,
        minH: 3,
      })),
      sm: activeWidgets.map((widgetId, index) => ({
        i: widgetId,
        x: 0,
        y: index * 4,
        w: 12,
        h: widgetId === "trading-calendar" ? 8 : 4,
        minW: 6,
        minH: 3,
      })),
    };
    return layouts;
  };

  const [layouts, setLayouts] = useState(getDefaultLayout());

  // Save widget preferences
  const updateWidgets = useMutation({
    mutationFn: async (widgets: WidgetType[]) => {
      const response = await apiRequest("PUT", "/api/dashboard/widgets", { widgets });
      return await response.json();
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
    // Update layouts to remove the widget
    const newLayouts = { ...layouts };
    Object.keys(newLayouts).forEach(breakpoint => {
      newLayouts[breakpoint] = newLayouts[breakpoint].filter(item => item.i !== widgetId);
    });
    setLayouts(newLayouts);
  };

  const handleLayoutChange = (layout: any, layouts: any) => {
    console.log('Layout changed:', layout);
    setLayouts(layouts);
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
            onClick={() => setIsDraggable(!isDraggable)}
          >
            <Move className="h-4 w-4 mr-2" />
            {isDraggable ? "Lock" : "Move"}
          </Button>
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
        <div className="relative">
          {isDraggable && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <Move className="h-4 w-4 inline mr-2" />
                Drag widgets to rearrange them, resize by dragging the corners
              </p>
            </div>
          )}
          <ResponsiveGridLayout
            className="layout"
            layouts={layouts}
            onLayoutChange={handleLayoutChange}
            breakpoints={{ lg: 1200, md: 768, sm: 0 }}
            cols={{ lg: 12, md: 12, sm: 12 }}
            rowHeight={80}
            isDraggable={isDraggable}
            isResizable={isDraggable}

            resizeHandles={['se']}
            margin={[16, 16]}
            containerPadding={[0, 0]}
            useCSSTransforms={true}
            preventCollision={false}
          >
            {activeWidgets.map((widgetId) => {
              const WidgetComponent = widgetComponents[widgetId];
              
              if (!WidgetComponent) {
                return null;
              }

              return (
                <div key={widgetId} className="relative group">
                  {isDraggable && (
                    <>
                      {/* Drag Handle */}
                      <div 
                        className="drag-handle absolute top-2 left-2 z-10 bg-primary text-primary-foreground p-1 rounded cursor-move opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Drag to move widget"
                      >
                        <Move className="h-3 w-3" />
                      </div>
                      
                      {/* Custom Resize Handle Visual */}
                      <div 
                        className="absolute bottom-2 right-2 z-5 bg-secondary text-secondary-foreground p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                        title="Resize handle (drag corner to resize)"
                      >
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M22,22H20V20H22V22M22,18H20V16H22V18M18,22H16V20H18V22M18,18H16V16H18V18M14,22H12V20H14V22M22,14H20V12H22V14Z" />
                        </svg>
                      </div>
                    </>
                  )}
                  
                  <WidgetComponent
                    isCustomizing={isCustomizing}
                    onRemove={() => handleRemoveWidget(widgetId)}
                    analytics={analytics}
                    trades={trades as any[] || []}
                  />
                </div>
              );
            })}
          </ResponsiveGridLayout>
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