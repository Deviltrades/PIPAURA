import { ReactNode } from "react";
import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DraggableWidgetProps {
  title: string;
  children: ReactNode;
  className?: string;
  themeColor?: string;
  textColor?: string;
  infoContent?: ReactNode;
}

export default function DraggableWidget({ title, children, className = "", themeColor = "slate", textColor = "#ffffff", infoContent }: DraggableWidgetProps) {
  const colorStyles = {
    slate: "bg-slate-800/60 border-slate-700/40",
    blue: "bg-slate-900/40 border-blue-800/30",
    purple: "bg-purple-900/40 border-purple-800/30",
    green: "bg-emerald-900/40 border-emerald-800/30",
    orange: "bg-orange-900/40 border-orange-800/30",
    pink: "bg-pink-900/40 border-pink-800/30",
  };

  return (
    <div className={`${colorStyles[themeColor as keyof typeof colorStyles] || colorStyles.slate} rounded-xl h-full border-2 border-cyan-500/60 widget-hover-pulse transition-all duration-300 ${className}`} style={{ color: textColor }}>
      <div className="p-4 h-full flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-sm" style={{ color: textColor }}>{title}</h3>
          {infoContent && (
            <Popover>
              <PopoverTrigger asChild>
                <button 
                  className="text-cyan-400 hover:text-cyan-300 transition-colors"
                  data-testid="button-info"
                >
                  <Info className="h-4 w-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-80 bg-slate-900/95 border-cyan-700/50 text-white"
                align="end"
              >
                {infoContent}
              </PopoverContent>
            </Popover>
          )}
        </div>
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}