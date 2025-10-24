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
  MapPin,
  StickyNote,
  LineChart,
  Brain,
  Users,
  Settings as SettingsIcon,
  LogOut,
  FileText,
  Newspaper,
  ChevronRight,
  ChevronLeft,
  Target,
  User as UserIcon
} from "lucide-react";
import logoImage from "@assets/pipaura-logo.png";
import headerLogoVideo from "@assets/PipAura_1760451006076.mp4";
import collapsedLogo from "@assets/pipaura-collapsed-logo-v2.png";
import { PipAuraLogo } from "./PipAuraLogo";

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
  { name: "AI Trading Mentor", href: "/mentor", icon: Brain },
  { name: "Mentor Dashboard", href: "/mentor-dashboard", icon: Users },
  { name: "Prop Firm Tracker", href: "/prop-firm", icon: Target },
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

  // Default sidebar settings - Dark with cyan accents
  const defaultSidebarSettings: SidebarSettings = {
    primaryColor: "slate",
    gradientFrom: "from-slate-950/98",
    gradientVia: "via-slate-900/98",
    gradientTo: "to-slate-950/98",
    headerFrom: "from-slate-950/95",
    headerTo: "to-slate-900/95",
    activeGradient: "from-cyan-500/15 via-teal-500/15 to-cyan-500/15",
    activeBorder: "border-l-4 border-cyan-400",
    hoverColor: "hover:bg-cyan-500/5 hover:border-l-2 hover:border-cyan-500/40"
  };

  const sidebarSettings = (user as any)?.sidebarSettings || defaultSidebarSettings;

  const sidebarContent = (
    <>
      <div className={`flex items-center justify-center h-16 border-b border-white/5`}>
        <PipAuraLogo isCollapsed={isCollapsed} />
      </div>
      
      <nav className="mt-4 flex-1 px-3">
        <div className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-4 py-3 text-sm font-medium transition-all duration-200 rounded-xl group widget-hover-pulse",
                  isActive
                    ? `bg-gradient-to-r ${sidebarSettings.activeGradient} ${sidebarSettings.activeBorder} shadow-lg shadow-cyan-500/30`
                    : `${sidebarSettings.hoverColor} border-l-2 border-transparent`
                )}
                onClick={onClose}
              >
                <Icon className={cn(
                  "mr-3 h-5 w-5 transition-colors",
                  isActive ? "text-cyan-400" : "text-gray-400 group-hover:text-cyan-400"
                )} />
                <span className={cn(
                  "font-medium transition-colors",
                  isActive ? "text-white" : "text-gray-300 group-hover:text-white"
                )}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

    </>
  );

  if (isMobile) {
    return (
      <>
        {isOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
            <div className={`fixed inset-y-0 left-0 w-64 bg-gradient-to-br ${sidebarSettings.gradientFrom} ${sidebarSettings.gradientVia} ${sidebarSettings.gradientTo} backdrop-blur-xl shadow-2xl flex flex-col`}>
              <div className={`flex items-center justify-between h-16 border-b border-white/5`}>
                <div className="flex-1">
                  <PipAuraLogo isCollapsed={false} />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="hover:bg-white/10 text-gray-300 mr-2"
                  data-testid="button-close-mobile-menu"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <nav className="mt-4 flex-1 px-3">
                <div className="space-y-1">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    const isActive = location === item.href;
                    
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          "flex items-center px-4 py-3 text-sm font-medium transition-all duration-200 rounded-xl group widget-hover-pulse",
                          isActive
                            ? `bg-gradient-to-r ${sidebarSettings.activeGradient} ${sidebarSettings.activeBorder} shadow-lg shadow-cyan-500/30`
                            : `${sidebarSettings.hoverColor} border-l-2 border-transparent`
                        )}
                        onClick={onClose}
                        data-testid={`link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <Icon className={cn(
                          "mr-3 h-5 w-5 transition-colors",
                          isActive ? "text-cyan-400" : "text-gray-400 group-hover:text-cyan-400"
                        )} />
                        <span className={cn(
                          "font-medium transition-colors",
                          isActive ? "text-white" : "text-gray-300 group-hover:text-white"
                        )}>
                          {item.name}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </nav>

              <div className="p-4 space-y-2 border-t border-white/5">
                <Link href="/user" onClick={onClose}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-gray-300 hover:text-white hover:bg-white/5"
                    data-testid="button-mobile-user"
                  >
                    <UserIcon className="h-4 w-4 mr-3 text-gray-400" />
                    <span>User</span>
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleTheme}
                  className="w-full justify-start text-gray-300 hover:text-white hover:bg-white/5"
                  data-testid="button-mobile-theme-toggle"
                >
                  {theme === "dark" ? (
                    <>
                      <Sun className="h-4 w-4 mr-3 text-gray-400" />
                      <span>Light Mode</span>
                    </>
                  ) : (
                    <>
                      <Moon className="h-4 w-4 mr-3 text-gray-400" />
                      <span>Dark Mode</span>
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut.mutate()}
                  disabled={signOut.isPending}
                  className="w-full justify-start text-gray-300 hover:text-white hover:bg-white/5"
                  data-testid="button-mobile-logout"
                >
                  <LogOut className="h-4 w-4 mr-3 text-gray-400" />
                  <span>
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
        "fixed inset-y-0 left-0 z-50 bg-gradient-to-br backdrop-blur-xl shadow-2xl hidden lg:flex lg:flex-col transition-all duration-300 border-r border-white/5",
        `${sidebarSettings.gradientFrom} ${sidebarSettings.gradientVia} ${sidebarSettings.gradientTo}`,
        isCollapsed ? "w-20" : "w-64"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={`flex items-center justify-center h-16 border-b border-white/5 relative`}>
        <PipAuraLogo isCollapsed={isCollapsed} />
        <Button
          variant="ghost"
          size="sm"
          onClick={togglePin}
          className={cn(
            "absolute right-2 hover:bg-white/10 transition-opacity duration-300 text-gray-400 hover:text-cyan-400",
            isCollapsed && !isPinned ? "opacity-0" : "opacity-100"
          )}
          data-testid="button-pin-sidebar"
        >
          {isPinned ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>
      
      <nav className="mt-4 flex-1 overflow-y-auto sidebar-scrollbar px-3">
        <div className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center py-3 text-sm font-medium transition-all duration-200 rounded-xl group widget-hover-pulse",
                  isCollapsed ? "px-3 justify-center" : "px-4",
                  isActive
                    ? `bg-gradient-to-r ${sidebarSettings.activeGradient} ${sidebarSettings.activeBorder} shadow-lg shadow-cyan-500/30`
                    : `${sidebarSettings.hoverColor} border-l-2 border-transparent`
                )}
                data-testid={`link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <Icon className={cn(
                  "h-5 w-5 flex-shrink-0 transition-colors",
                  !isCollapsed && "mr-3",
                  isActive ? "text-cyan-400" : "text-gray-400 group-hover:text-cyan-400"
                )} />
                <span className={cn(
                  "transition-all duration-300 whitespace-nowrap overflow-hidden font-medium",
                  isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100",
                  isActive ? "text-white" : "text-gray-300 group-hover:text-white"
                )}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className={cn(
        "p-4 transition-all duration-300 border-t border-white/5 space-y-2",
        isCollapsed && "p-2"
      )}>
        <Link href="/user">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              `w-full text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-300`,
              isCollapsed ? "px-2 justify-center" : "justify-start"
            )}
            data-testid="button-user"
          >
            <UserIcon className={cn(
              "h-4 w-4 text-gray-400",
              !isCollapsed && "mr-3"
            )} />
            <span className={cn(
              "transition-all duration-300 whitespace-nowrap overflow-hidden",
              isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
            )}>
              User
            </span>
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className={cn(
            `w-full text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-300`,
            isCollapsed ? "px-2 justify-center" : "justify-start"
          )}
          data-testid="button-theme-toggle"
        >
          {theme === "dark" ? (
            <>
              <Sun className={cn(
                "h-4 w-4 text-gray-400",
                !isCollapsed && "mr-3"
              )} />
              <span className={cn(
                "transition-all duration-300 whitespace-nowrap overflow-hidden",
                isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
              )}>
                Light Mode
              </span>
            </>
          ) : (
            <>
              <Moon className={cn(
                "h-4 w-4 text-gray-400",
                !isCollapsed && "mr-3"
              )} />
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