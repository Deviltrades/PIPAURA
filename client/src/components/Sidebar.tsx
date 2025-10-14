import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useTheme } from "./ThemeProvider";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import type { SidebarSettings } from "@shared/schema";
import { 
  LayoutDashboard, 
  BookOpen, 
  Calendar, 
  BarChart3, 
  Menu,
  Moon,
  Sun,
  X,
  TrendingUp,
  Wallet,
  Grid3X3,
  MapPin,
  StickyNote,
  LineChart,
  Brain,
  Settings as SettingsIcon,
  LogOut,
  FileText,
  Newspaper,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import logoImage from "@assets/pipaura-logo.png";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Accounts", href: "/accounts", icon: Wallet },
  { name: "Trades", href: "/trades", icon: BookOpen },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Charts", href: "/charts", icon: LineChart },
  { name: "Fundamentals", href: "/fundamentals", icon: Newspaper },
  { name: "Strategy/Playbook", href: "/strategy", icon: MapPin },
  { name: "Notes", href: "/notes", icon: StickyNote },
  { name: "Widgets", href: "/widgets", icon: Grid3X3 },
  { name: "AI Trading Mentor", href: "/mentor", icon: Brain },
  { name: "Tax Reports", href: "/tax-reports", icon: FileText },
  { name: "Settings", href: "/settings", icon: SettingsIcon },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { signOut } = useAuth();
  const isMobile = useIsMobile();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isPinned, setIsPinned] = useState(false);
  
  const { data: user } = useQuery({
    queryKey: ["/api/user/profile"],
    retry: false,
  });

  const handleMouseEnter = () => {
    if (!isPinned) {
      setIsCollapsed(false);
    }
  };

  const handleMouseLeave = () => {
    if (!isPinned) {
      setIsCollapsed(true);
    }
  };

  const togglePin = () => {
    setIsPinned(!isPinned);
    if (!isPinned) {
      setIsCollapsed(false);
    }
  };

  // Default sidebar settings
  const defaultSidebarSettings: SidebarSettings = {
    primaryColor: "blue",
    gradientFrom: "from-blue-950",
    gradientVia: "via-blue-900",
    gradientTo: "to-slate-950",
    headerFrom: "from-blue-600",
    headerTo: "to-blue-500",
    activeGradient: "from-blue-600/20 to-blue-500/20",
    activeBorder: "border-blue-500/30",
    hoverColor: "hover:bg-blue-900/30"
  };

  const sidebarSettings = (user as any)?.sidebarSettings || defaultSidebarSettings;

  const sidebarContent = (
    <>
      <div className={`flex items-center justify-center h-16 bg-gradient-to-r ${sidebarSettings.headerFrom} ${sidebarSettings.headerTo}`}>
        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center p-1">
          <img 
            src={logoImage}
            alt="PipAura Logo" 
            className="h-full w-full object-contain"
          />
        </div>
      </div>
      
      <nav className="mt-8 flex-1">
        <div className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-6 py-3 text-sm font-medium transition-colors rounded-lg mx-2",
                  isActive
                    ? `bg-gradient-to-r ${sidebarSettings.activeGradient} text-white border ${sidebarSettings.activeBorder}`
                    : `text-gray-300 ${sidebarSettings.hoverColor} hover:text-white`
                )}
                onClick={onClose}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="p-4">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleTheme}
          className={`w-full border-${sidebarSettings.primaryColor}-600/30 text-gray-300 hover:bg-${sidebarSettings.primaryColor}-800/50`}
        >
          {theme === "dark" ? (
            <>
              <Sun className="h-4 w-4 mr-2" />
              Light Mode
            </>
          ) : (
            <>
              <Moon className="h-4 w-4 mr-2" />
              Dark Mode
            </>
          )}
        </Button>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <>
        {isOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
            <div className={`fixed inset-y-0 left-0 w-64 bg-gradient-to-br ${sidebarSettings.gradientFrom} ${sidebarSettings.gradientVia} ${sidebarSettings.gradientTo} shadow-lg flex flex-col`}>
              <div className={`flex items-center justify-between h-16 bg-gradient-to-r ${sidebarSettings.headerFrom} ${sidebarSettings.headerTo} px-4`}>
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1">
                  <img 
                    src={logoImage}
                    alt="PipAura Logo" 
                    className="h-full w-full object-contain"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className={`text-white hover:bg-${sidebarSettings.primaryColor}-700/50`}
                  data-testid="button-close-mobile-menu"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <nav className="mt-8 flex-1">
                <div className="space-y-1">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    const isActive = location === item.href;
                    
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          "flex items-center px-6 py-3 text-sm font-medium transition-colors rounded-lg mx-2",
                          isActive
                            ? `bg-gradient-to-r ${sidebarSettings.activeGradient} text-white border ${sidebarSettings.activeBorder}`
                            : `text-gray-300 ${sidebarSettings.hoverColor} hover:text-white`
                        )}
                        onClick={onClose}
                        data-testid={`link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <Icon className="mr-3 h-5 w-5" />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              </nav>

              <div className="p-4 space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleTheme}
                  className={`w-full border-${sidebarSettings.primaryColor}-600/30 text-gray-300 hover:bg-${sidebarSettings.primaryColor}-800/50`}
                  data-testid="button-mobile-theme-toggle"
                >
                  {theme === "dark" ? (
                    <>
                      <Sun className="h-4 w-4 mr-2" />
                      Light Mode
                    </>
                  ) : (
                    <>
                      <Moon className="h-4 w-4 mr-2" />
                      Dark Mode
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signOut.mutate()}
                  disabled={signOut.isPending}
                  className={`w-full border-${sidebarSettings.primaryColor}-600/30 text-gray-300 hover:bg-${sidebarSettings.primaryColor}-800/50`}
                  data-testid="button-mobile-logout"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {signOut.isPending ? "Logging out..." : "Logout"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div 
      className={cn(
        "fixed inset-y-0 left-0 z-50 bg-gradient-to-br shadow-lg hidden lg:flex lg:flex-col transition-all duration-300",
        `${sidebarSettings.gradientFrom} ${sidebarSettings.gradientVia} ${sidebarSettings.gradientTo}`,
        isCollapsed ? "w-20" : "w-64"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={`flex items-center justify-center h-16 bg-gradient-to-r ${sidebarSettings.headerFrom} ${sidebarSettings.headerTo} relative`}>
        <div className={cn(
          "bg-white rounded-lg flex items-center justify-center transition-all duration-300 p-1",
          isCollapsed ? "w-10 h-10" : "w-12 h-12"
        )}>
          <img 
            src={logoImage}
            alt="PipAura Logo" 
            className="h-full w-full object-contain transition-all duration-300"
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={togglePin}
          className={cn(
            "absolute right-2 text-white hover:bg-white/10 transition-opacity duration-300",
            isCollapsed && !isPinned ? "opacity-0" : "opacity-100"
          )}
          data-testid="button-pin-sidebar"
        >
          {isPinned ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>
      
      <nav className="mt-8 flex-1 overflow-y-auto sidebar-scrollbar">
        <div className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center py-3 text-sm font-medium transition-all duration-300 rounded-lg mx-2",
                  isCollapsed ? "px-3 justify-center" : "px-6",
                  isActive
                    ? `bg-gradient-to-r ${sidebarSettings.activeGradient} text-white border ${sidebarSettings.activeBorder}`
                    : `text-gray-300 ${sidebarSettings.hoverColor} hover:text-white`
                )}
                data-testid={`link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <Icon className={cn(
                  "h-5 w-5 flex-shrink-0",
                  !isCollapsed && "mr-3"
                )} />
                <span className={cn(
                  "transition-all duration-300 whitespace-nowrap overflow-hidden",
                  isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                )}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className={cn(
        "p-4 transition-all duration-300",
        isCollapsed && "p-2"
      )}>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleTheme}
          className={cn(
            `w-full border-${sidebarSettings.primaryColor}-600/30 text-gray-300 hover:bg-${sidebarSettings.primaryColor}-800/50 transition-all duration-300`,
            isCollapsed && "px-2"
          )}
          data-testid="button-theme-toggle"
        >
          {theme === "dark" ? (
            <>
              <Sun className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
              <span className={cn(
                "transition-all duration-300 whitespace-nowrap overflow-hidden",
                isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
              )}>
                Light Mode
              </span>
            </>
          ) : (
            <>
              <Moon className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
              <span className={cn(
                "transition-all duration-300 whitespace-nowrap overflow-hidden",
                isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
              )}>
                Dark Mode
              </span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default Sidebar;