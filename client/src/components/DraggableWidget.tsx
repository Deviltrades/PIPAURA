import { ReactNode } from "react";

interface DraggableWidgetProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export default function DraggableWidget({ title, children, className = "" }: DraggableWidgetProps) {
  return (
    <div className={`bg-purple-900/40 rounded-xl border border-purple-800/30 h-full ${className}`}>
      <div className="p-4 h-full flex flex-col">
        <h3 className="text-white font-medium mb-3 text-sm">{title}</h3>
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}