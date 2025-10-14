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
import headerLogo from "@assets/pipaura-header-logo.png";
import collapsedLogo from "@assets/pipaura-collapsed-logo-v2.png";

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

  // Default sidebar settings - Silver gradient background with pink-purple text
  const defaultSidebarSettings: SidebarSettings = {
    primaryColor: "gray",
    gradientFrom: "from-gray-300",
    gradientVia: "via-gray-400",
    gradientTo: "to-gray-500",
    headerFrom: "from-gray-300",
    headerTo: "to-gray-400",
    activeGradient: "from-pink-500/20 to-purple-600/20",
    activeBorder: "border-pink-500/30",
    hoverColor: "hover:bg-gray-200/20"
  };

  const sidebarSettings = (user as any)?.sidebarSettings || defaultSidebarSettings;

  const sidebarContent = (
    <>
      <div className={`flex items-center justify-center h-16 bg-gradient-to-r ${sidebarSettings.headerFrom} ${sidebarSettings.headerTo}`}>
        <img 
          src={headerLogo}
          alt="PipAura" 
          className="w-full h-full object-cover"
        />
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
                    ? `bg-gradient-to-r ${sidebarSettings.activeGradient} border ${sidebarSettings.activeBorder}`
                    : `${sidebarSettings.hoverColor}`
                )}
                onClick={onClose}
              >
                <Icon className={cn(
                  "mr-3 h-5 w-5",
                  "bg-gradient-to-r from-pink-500 via-pink-600 to-purple-600 bg-clip-text text-transparent"
                )} />
                <span className={cn(
                  "bg-gradient-to-r from-pink-500 via-pink-600 to-purple-600 bg-clip-text text-transparent font-semibold"
                )}>
                  {item.name}
                </span>
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
          className={`w-full border-pink-500/30 hover:bg-gray-200/20`}
        >
          {theme === "dark" ? (
            <>
              <Sun className="h-4 w-4 mr-2 bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent" />
              <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent font-semibold">Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="h-4 w-4 mr-2 bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent" />
              <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent font-semibold">Dark Mode</span>
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
              <div className={`flex items-center justify-between h-16 bg-gradient-to-r ${sidebarSettings.headerFrom} ${sidebarSettings.headerTo}`}>
                <img 
                  src={headerLogo}
                  alt="PipAura" 
                  className="h-full object-cover flex-1"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="hover:bg-gray-200/20"
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
                            ? `bg-gradient-to-r ${sidebarSettings.activeGradient} border ${sidebarSettings.activeBorder}`
                            : `${sidebarSettings.hoverColor}`
                        )}
                        onClick={onClose}
                        data-testid={`link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <Icon className={cn(
                          "mr-3 h-5 w-5",
                          "bg-gradient-to-r from-pink-500 via-pink-600 to-purple-600 bg-clip-text text-transparent"
                        )} />
                        <span className={cn(
                          "bg-gradient-to-r from-pink-500 via-pink-600 to-purple-600 bg-clip-text text-transparent font-semibold"
                        )}>
                          {item.name}
                        </span>
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
                  className={`w-full border-pink-500/30 hover:bg-gray-200/20`}
                  data-testid="button-mobile-theme-toggle"
                >
                  {theme === "dark" ? (
                    <>
                      <Sun className="h-4 w-4 mr-2 bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent" />
                      <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent font-semibold">Light Mode</span>
                    </>
                  ) : (
                    <>
                      <Moon className="h-4 w-4 mr-2 bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent" />
                      <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent font-semibold">Dark Mode</span>
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signOut.mutate()}
                  disabled={signOut.isPending}
                  className={`w-full border-pink-500/30 hover:bg-gray-200/20`}
                  data-testid="button-mobile-logout"
                >
                  <LogOut className="h-4 w-4 mr-2 bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent" />
                  <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent font-semibold">
                    {signOut.isPending ? "Logging out..." : "Logout"}
                  </span>
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
        <img 
          src={isCollapsed ? collapsedLogo : headerLogo}
          alt="PipAura" 
          className="w-full h-full object-cover transition-opacity duration-300"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={togglePin}
          className={cn(
            "absolute right-2 hover:bg-white/10 transition-opacity duration-300 bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent",
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
                    ? `bg-gradient-to-r ${sidebarSettings.activeGradient} border ${sidebarSettings.activeBorder}`
                    : `${sidebarSettings.hoverColor}`
                )}
                data-testid={`link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <Icon className={cn(
                  "h-5 w-5 flex-shrink-0",
                  !isCollapsed && "mr-3",
                  "bg-gradient-to-r from-pink-500 via-pink-600 to-purple-600 bg-clip-text text-transparent"
                )} />
                <span className={cn(
                  "transition-all duration-300 whitespace-nowrap overflow-hidden",
                  isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100",
                  "bg-gradient-to-r from-pink-500 via-pink-600 to-purple-600 bg-clip-text text-transparent font-semibold"
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
            `w-full border-pink-500/30 hover:bg-gray-200/20 transition-all duration-300`,
            isCollapsed && "px-2"
          )}
          data-testid="button-theme-toggle"
        >
          {theme === "dark" ? (
            <>
              <Sun className={cn(
                "h-4 w-4 bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent",
                !isCollapsed && "mr-2"
              )} />
              <span className={cn(
                "transition-all duration-300 whitespace-nowrap overflow-hidden bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent font-semibold",
                isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
              )}>
                Light Mode
              </span>
            </>
          ) : (
            <>
              <Moon className={cn(
                "h-4 w-4 bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent",
                !isCollapsed && "mr-2"
              )} />
              <span className={cn(
                "transition-all duration-300 whitespace-nowrap overflow-hidden bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent font-semibold",
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