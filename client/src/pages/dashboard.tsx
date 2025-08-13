import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Settings, Move, GripVertical, Maximize2 } from "lucide-react";
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

// Default layouts for different widgets
const getDefaultLayout = (widgetIds: string[]) => {
  return widgetIds.map((widgetId, index) => ({
    i: widgetId,
    x: (index * 6) % 12,
    y: Math.floor((index * 6) / 12) * 4,
    w: 6,
    h: 4,
    minW: 3,
    minH: 3,
    maxW: 12,
    maxH: 8,
    static: false
  }));
};

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [isDraggable, setIsDraggable] = useState(false);
  const [hasLayoutChanges, setHasLayoutChanges] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

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

  // Initialize layouts - use saved layout from user if available
  const [layouts, setLayouts] = useState(() => {
    const savedLayout = (user as any)?.dashboardLayout;
    if (savedLayout && savedLayout.lg && savedLayout.lg.length > 0) {
      return savedLayout;
    }
    return {
      lg: getDefaultLayout(activeWidgets),
      md: getDefaultLayout(activeWidgets),
      sm: getDefaultLayout(activeWidgets)
    };
  });

  const updateWidgets = useMutation({
    mutationFn: async (widgets: WidgetType[]) => {
      const response = await fetch("/api/dashboard/widgets", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ widgets }),
      });
      
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: any) => {
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
      
      // Add to layouts
      const newItem = {
        i: widgetId,
        x: (activeWidgets.length * 6) % 12,
        y: Math.floor((activeWidgets.length * 6) / 12) * 4,
        w: 6,
        h: 4,
        minW: 3,
        minH: 3,
        maxW: 12,
        maxH: 8
      };
      
      setLayouts(prev => ({
        lg: [...prev.lg, newItem],
        md: [...prev.md, newItem],
        sm: [...prev.sm, newItem]
      }));
    }
  };

  const handleRemoveWidget = (widgetId: WidgetType) => {
    const newWidgets = activeWidgets.filter(id => id !== widgetId);
    updateWidgets.mutate(newWidgets);
    
    // Remove from layouts
    setLayouts(prev => ({
      lg: prev.lg.filter(item => item.i !== widgetId),
      md: prev.md.filter(item => item.i !== widgetId),
      sm: prev.sm.filter(item => item.i !== widgetId)
    }));
  };

  // Track if user is currently dragging to prevent automatic layout changes

  const handleLayoutChange = (layout: any, allLayouts: any) => {
    console.log('Layout changed:', layout);
    
    // Don't process automatic layout changes while dragging
    if (isDragging) return;
    
    // Only update if this is a real user interaction, not an automatic rearrangement
    if (layout && layout.length > 0) {
      // Prevent layout from resetting to 1x1 - maintain minimum sizes
      const sanitizedLayouts = {
        lg: allLayouts.lg?.map((item: any) => ({
          ...item,
          w: Math.max(item.w, 3), // minimum width of 3
          h: Math.max(item.h, 3), // minimum height of 3
          minW: 3,
          minH: 3,
          maxW: 12,
          maxH: 8,
          static: false // Ensure widgets are not locked
        })) || [],
        md: allLayouts.md?.map((item: any) => ({
          ...item,
          w: Math.max(item.w, 3),
          h: Math.max(item.h, 3),
          minW: 3,
          minH: 3,
          maxW: 10,
          maxH: 8,
          static: false
        })) || [],
        sm: allLayouts.sm?.map((item: any) => ({
          ...item,
          w: Math.max(item.w, 3),
          h: Math.max(item.h, 3),
          minW: 3,
          minH: 3,
          maxW: 6,
          maxH: 8,
          static: false
        })) || []
      };
      
      setLayouts(sanitizedLayouts);
      setHasLayoutChanges(true);
    }
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragStop = (layout: any, oldItem: any, newItem: any) => {
    setIsDragging(false);
    // Process the final layout change after drag is complete
    handleLayoutChange(layout, layouts);
  };

  const saveLayoutMutation = useMutation({
    mutationFn: async (layoutData: any) => {
      const response = await fetch("/api/dashboard/layout", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ layouts: layoutData }),
      });
      
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      setHasLayoutChanges(false);
      toast({
        title: "Layout Saved",
        description: "Your dashboard layout has been saved successfully.",
      });
    },
    onError: (error: any) => {
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
        description: "Failed to save layout.",
        variant: "destructive",
      });
    },
  });

  const handleSaveLayout = () => {
    saveLayoutMutation.mutate(layouts);
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
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDraggable(!isDraggable)}
            className={isDraggable ? "bg-primary text-primary-foreground" : ""}
          >
            <Move className="h-4 w-4 mr-2" />
            {isDraggable ? "Lock Layout" : "Move Widgets"}
          </Button>
          
          {hasLayoutChanges && (
            <Button
              variant="default"
              size="sm"
              onClick={handleSaveLayout}
              disabled={saveLayoutMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {saveLayoutMutation.isPending ? "Saving..." : "Save Layout"}
            </Button>
          )}
          
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
              <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
                <GripVertical className="h-4 w-4" />
                <span>Click and drag widgets to move them around</span>
                <Maximize2 className="h-4 w-4 ml-4" />
                <span>Drag the bottom-right corner to resize</span>
              </div>
            </div>
          )}
          
          <ResponsiveGridLayout
            className="layout"
            layouts={layouts}
            onLayoutChange={handleLayoutChange}
            onDragStart={handleDragStart}
            onDragStop={handleDragStop}
            onResizeStop={handleLayoutChange}
            breakpoints={{ lg: 1200, md: 768, sm: 0 }}
            cols={{ lg: 12, md: 10, sm: 6 }}
            rowHeight={60}
            isDraggable={isDraggable}
            isResizable={isDraggable}
            resizeHandles={['se']}
            margin={[16, 16]}
            containerPadding={[0, 0]}
            useCSSTransforms={true}
            preventCollision={false}
            compactType={null}
            allowOverlap={true}
            autoSize={true}
          >
            {activeWidgets.map((widgetId) => {
              const WidgetComponent = widgetComponents[widgetId];
              
              if (!WidgetComponent) {
                return null;
              }

              return (
                <div 
                  key={widgetId}
                  className={`h-full w-full relative ${
                    isDraggable 
                      ? "border-2 border-dashed border-primary/50 bg-primary/5 hover:bg-primary/10 transition-colors" 
                      : ""
                  }`}
                  style={{ 
                    pointerEvents: isDraggable ? 'auto' : 'auto',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {isDraggable && (
                    <>
                      <div className="absolute top-2 left-2 z-10 bg-primary text-primary-foreground px-2 py-1 rounded text-xs flex items-center gap-1 pointer-events-none">
                        <GripVertical className="h-3 w-3" />
                        Drag to move
                      </div>
                      <div className="absolute bottom-1 right-6 z-10 bg-secondary text-secondary-foreground px-1 py-0.5 rounded text-xs flex items-center gap-1 pointer-events-none shadow-sm">
                        ↗ Resize
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

      {activeWidgets.length > 0 && !isDraggable && (
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Click "Move Widgets" to rearrange your dashboard, or use "Customize" to manage widgets
          </p>
        </div>
      )}
    </div>
  );
}