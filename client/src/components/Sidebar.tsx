import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useTheme } from "./ThemeProvider";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  BookOpen, 
  Calendar, 
  BarChart3, 
  Radio,
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
  LogOut
} from "lucide-react";

const navigation = [
  { name: "Signals", href: "/signals", icon: Radio },
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Trades", href: "/trades", icon: BookOpen },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Accounts", href: "/accounts", icon: Wallet },
  { name: "Widgets", href: "/widgets", icon: Grid3X3 },
  { name: "Strategy/Playbook", href: "/strategy", icon: MapPin },
  { name: "Notes", href: "/notes", icon: StickyNote },
  { name: "Charts", href: "/charts", icon: LineChart },
  { name: "AI Trading Mentor", href: "/mentor", icon: Brain },
  { name: "Settings", href: "/settings", icon: SettingsIcon },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { logoutMutation } = useAuth();
  const isMobile = useIsMobile();

  const sidebarContent = (
    <>
      <div className="flex items-center justify-center h-16 bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
          <img 
            src="/logo.jpg"
            alt="TJ - Traders Brotherhood Logo" 
            className="h-10 w-10 object-contain"
            onError={(e) => {
              console.log('Logo failed to load');
              e.currentTarget.style.display = 'none';
            }}
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
                    ? "bg-gradient-to-r from-purple-600/20 to-blue-600/20 text-white border border-purple-500/30"
                    : "text-gray-300 hover:bg-purple-900/30 hover:text-white"
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
          className="w-full border-purple-600/30 text-gray-300 hover:bg-purple-800/50"
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
            <div className="fixed inset-y-0 left-0 w-64 bg-gradient-to-br from-purple-950 via-blue-950 to-purple-900 shadow-lg flex flex-col">
              <div className="flex items-center justify-between h-16 bg-gradient-to-r from-purple-600 to-blue-600 px-4">
                <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                  <img 
                    src="/logo.jpg"
                    alt="TJ - Traders Brotherhood Logo" 
                    className="h-8 w-8 object-contain"
                    onError={(e) => {
                      console.log('Logo failed to load');
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-white hover:bg-purple-700/50"
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
                            ? "bg-gradient-to-r from-purple-600/20 to-blue-600/20 text-white border border-purple-500/30"
                            : "text-gray-300 hover:bg-purple-900/30 hover:text-white"
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
                  className="w-full border-purple-600/30 text-gray-300 hover:bg-purple-800/50"
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
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                  className="w-full border-purple-600/30 text-gray-300 hover:bg-purple-800/50"
                  data-testid="button-mobile-logout"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {logoutMutation.isPending ? "Logging out..." : "Logout"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-br from-purple-950 via-blue-950 to-purple-900 shadow-lg hidden lg:flex lg:flex-col">
      {sidebarContent}
    </div>
  );
}

export default Sidebar;