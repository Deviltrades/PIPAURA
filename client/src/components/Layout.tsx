import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Menu, Moon, Sun, Settings } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { Link } from "wouter";
import { NotificationBell } from "@/components/NotificationBell";

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
          className="bg-slate-900/40 border-cyan-600/30 text-white hover:bg-slate-800/50"
          data-testid="button-mobile-menu"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      {/* Top right controls */}
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <NotificationBell />
        <Button
          variant="outline"
          size="sm"
          asChild
          className="bg-slate-900/40 border-cyan-600/30 text-white hover:bg-slate-800/50"
          data-testid="button-settings"
        >
          <Link href="/settings">
            <Settings className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Main Content */}
      <div className="lg:ml-20 min-h-screen pt-16 lg:pt-0">
        {children}
      </div>
    </div>
  );
}
