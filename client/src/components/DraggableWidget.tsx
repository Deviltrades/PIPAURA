import { ReactNode } from "react";

interface DraggableWidgetProps {
  title: string;
  children: ReactNode;
  className?: string;
  themeColor?: string;
  textColor?: string;
}

export default function DraggableWidget({ title, children, className = "", themeColor = "slate", textColor = "#ffffff" }: DraggableWidgetProps) {
  const colorStyles = {
    slate: "bg-slate-800/60 border-slate-700/40",
    blue: "bg-blue-900/40 border-blue-800/30",
    purple: "bg-purple-900/40 border-purple-800/30",
    green: "bg-emerald-900/40 border-emerald-800/30",
    orange: "bg-orange-900/40 border-orange-800/30",
    pink: "bg-pink-900/40 border-pink-800/30",
  };

  return (
    <div className={`${colorStyles[themeColor as keyof typeof colorStyles] || colorStyles.slate} rounded-xl h-full ${className}`} style={{ color: textColor }}>
      <div className="p-4 h-full flex flex-col">
        <h3 className="font-medium mb-3 text-sm" style={{ color: textColor }}>{title}</h3>
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}