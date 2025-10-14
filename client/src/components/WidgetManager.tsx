import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, TrendingUp, Percent, Calculator, BarChart3, Calendar, DollarSign, Clock } from "lucide-react";

export type WidgetType = 
  | "total-pnl"
  | "win-rate" 
  | "avg-win-loss"
  | "daily-pnl-chart"
  | "recent-trades"
  | "trading-calendar"
  | "risk-metrics"
  | "session-breakdown";

export interface WidgetConfig {
  id: WidgetType;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: "performance" | "analytics" | "trades";
}

export const availableWidgets: WidgetConfig[] = [
  {
    id: "total-pnl",
    title: "Total P&L",
    description: "Your overall profit and loss performance",
    icon: <TrendingUp className="h-4 w-4" />,
    category: "performance"
  },
  {
    id: "win-rate",
    title: "Win Rate",
    description: "Percentage of winning trades",
    icon: <Percent className="h-4 w-4" />,
    category: "performance"
  },
  {
    id: "avg-win-loss",
    title: "Avg Win/Loss",
    description: "Average winning and losing trade amounts",
    icon: <Calculator className="h-4 w-4" />,
    category: "analytics"
  },
  {
    id: "daily-pnl-chart",
    title: "Daily P&L Chart",
    description: "Visual chart of your daily performance",
    icon: <BarChart3 className="h-4 w-4" />,
    category: "analytics"
  },
  {
    id: "recent-trades",
    title: "Recent Trades",
    description: "List of your most recent trading activity",
    icon: <DollarSign className="h-4 w-4" />,
    category: "trades"
  },
  {
    id: "trading-calendar",
    title: "Trading Calendar",
    description: "Calendar view of your trading days",
    icon: <Calendar className="h-4 w-4" />,
    category: "analytics"
  },
  {
    id: "risk-metrics",
    title: "Risk Metrics",
    description: "Risk management statistics and ratios",
    icon: <TrendingUp className="h-4 w-4" />,
    category: "performance"
  },
  {
    id: "session-breakdown",
    title: "Session Breakdown",
    description: "Performance analytics by trading session (London, NY, Asia)",
    icon: <Clock className="h-4 w-4" />,
    category: "analytics"
  }
];

interface WidgetManagerProps {
  activeWidgets: WidgetType[];
  onAddWidget: (widgetId: WidgetType) => void;
  onRemoveWidget: (widgetId: WidgetType) => void;
}

export default function WidgetManager({ activeWidgets, onAddWidget, onRemoveWidget }: WidgetManagerProps) {
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = ["all", "performance", "analytics", "trades"];
  
  const filteredWidgets = selectedCategory === "all" 
    ? availableWidgets 
    : availableWidgets.filter(widget => widget.category === selectedCategory);

  const handleAddWidget = (widgetId: WidgetType) => {
    onAddWidget(widgetId);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Widget
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Dashboard Widget</DialogTitle>
          <DialogDescription>
            Choose widgets to customize your trading dashboard. You can add and remove widgets anytime.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap">
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Button>
            ))}
          </div>

          {/* Widget Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredWidgets.map(widget => {
              const isActive = activeWidgets.includes(widget.id);
              
              return (
                <Card key={widget.id} className={`cursor-pointer transition-colors ${isActive ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {widget.icon}
                        <CardTitle className="text-base">{widget.title}</CardTitle>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {widget.category}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm">
                      {widget.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {isActive ? (
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => onRemoveWidget(widget.id)}
                        className="w-full"
                      >
                        Remove from Dashboard
                      </Button>
                    ) : (
                      <Button 
                        variant="default" 
                        size="sm" 
                        onClick={() => handleAddWidget(widget.id)}
                        className="w-full"
                      >
                        Add to Dashboard
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}