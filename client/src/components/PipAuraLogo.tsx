interface PipAuraLogoProps {
  isCollapsed?: boolean;
  className?: string;
}

export function PipAuraLogo({ isCollapsed = false, className = "" }: PipAuraLogoProps) {
  return (
    <div 
      className={`flex flex-col items-center justify-center w-full h-full bg-gradient-to-r from-slate-950/95 to-slate-900/95 ${className}`}
      data-testid="logo-pipaura"
    >
      {isCollapsed ? (
        // Collapsed version - just "PipAura"
        <div className="text-center">
          <h1 className="text-xl font-bold tracking-tight" style={{ color: 'hsl(188, 94%, 60%)' }}>
            PipAura
          </h1>
        </div>
      ) : (
        // Expanded version - "PipAura" (50% bigger) + "Traders Hub"
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'hsl(188, 94%, 60%)' }}>
            PipAura
          </h1>
          <p className="text-sm text-white font-medium tracking-wide">
            Traders Hub
          </p>
        </div>
      )}
    </div>
  );
}
