import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useTheme } from "./ThemeProvider";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
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
  Settings as SettingsIcon
} from "lucide-react";

const navigation = [
  { name: "Signals", href: "/signals", icon: Radio },
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Trades", href: "/trades", icon: BookOpen },
  { name: "Open Positions", href: "/positions", icon: TrendingUp },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Accounts", href: "/accounts", icon: Wallet },
  { name: "Widgets", href: "/widgets", icon: Grid3X3 },
  { name: "Strategy/Playbook", href: "/strategy", icon: MapPin },
  { name: "Notes", href: "/notes", icon: StickyNote },
  { name: "Charts", href: "/charts", icon: LineChart },
  { name: "AI Trading Mentor", href: "/mentor", icon: Brain },
  { name: "Settings", href: "/settings", icon: SettingsIcon },
];

export function Sidebar() {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const sidebarContent = (
    <>
      <div className="flex items-center justify-center h-16 bg-primary">
        <h1 className="text-xl font-bold text-white">ForexTrader Pro</h1>
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
                  "flex items-center px-6 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                    : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
                onClick={() => setMobileMenuOpen(false)}
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
          className="w-full"
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
        <Button
          variant="outline"
          size="sm"
          className="fixed top-4 left-4 z-50 lg:hidden"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu className="h-4 w-4" />
        </Button>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setMobileMenuOpen(false)} />
            <div className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-dark-card shadow-lg flex flex-col">
              <div className="flex items-center justify-between h-16 bg-primary px-4">
                <h1 className="text-xl font-bold text-white">ForexTrader Pro</h1>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-white hover:bg-blue-700"
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
                          "flex items-center px-6 py-3 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                            : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        )}
                        onClick={() => setMobileMenuOpen(false)}
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
                  className="w-full"
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
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-dark-card shadow-lg hidden lg:flex lg:flex-col">
      {sidebarContent}
    </div>
  );
}

export default Sidebar;
