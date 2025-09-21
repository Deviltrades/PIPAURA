import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Menu, Moon, Sun, Settings } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { Link } from "wouter";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 text-white">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSidebarOpen(true)}
          className="bg-blue-900/40 border-blue-600/30 text-white hover:bg-blue-800/50"
          data-testid="button-mobile-menu"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      {/* Top right controls */}
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          asChild
          className="bg-blue-900/40 border-blue-600/30 text-white hover:bg-blue-800/50"
          data-testid="button-settings"
        >
          <Link href="/settings">
            <Settings className="h-4 w-4" />
          </Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="bg-blue-900/40 border-blue-600/30 text-white hover:bg-blue-800/50"
          data-testid="button-theme-toggle"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
        {children}
      </div>
    </div>
  );
}
