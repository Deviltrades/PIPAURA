import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Palette, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { SidebarSettings } from "@shared/schema";

interface ColorTheme {
  name: string;
  settings: SidebarSettings;
  preview: string;
}

const colorThemes: ColorTheme[] = [
  {
    name: "Ocean Blue",
    settings: {
      primaryColor: "blue",
      gradientFrom: "from-blue-950",
      gradientVia: "via-blue-900",
      gradientTo: "to-slate-950",
      headerFrom: "from-blue-600",
      headerTo: "to-blue-500",
      activeGradient: "from-blue-600/20 to-blue-500/20",
      activeBorder: "border-blue-500/30",
      hoverColor: "hover:bg-blue-900/30"
    },
    preview: "bg-gradient-to-br from-blue-950 via-blue-900 to-slate-950"
  },
  {
    name: "Forest Green", 
    settings: {
      primaryColor: "green",
      gradientFrom: "from-green-950",
      gradientVia: "via-green-900",
      gradientTo: "to-slate-950",
      headerFrom: "from-green-600",
      headerTo: "to-green-500",
      activeGradient: "from-green-600/20 to-green-500/20",
      activeBorder: "border-green-500/30",
      hoverColor: "hover:bg-green-900/30"
    },
    preview: "bg-gradient-to-br from-green-950 via-green-900 to-slate-950"
  },
  {
    name: "Royal Purple",
    settings: {
      primaryColor: "purple",
      gradientFrom: "from-purple-950",
      gradientVia: "via-purple-900",
      gradientTo: "to-slate-950",
      headerFrom: "from-purple-600",
      headerTo: "to-purple-500",
      activeGradient: "from-purple-600/20 to-purple-500/20",
      activeBorder: "border-purple-500/30",
      hoverColor: "hover:bg-purple-900/30"
    },
    preview: "bg-gradient-to-br from-purple-950 via-purple-900 to-slate-950"
  },
  {
    name: "Sunset Orange",
    settings: {
      primaryColor: "orange",
      gradientFrom: "from-orange-950",
      gradientVia: "via-orange-900",
      gradientTo: "to-slate-950",
      headerFrom: "from-orange-600",
      headerTo: "to-orange-500",
      activeGradient: "from-orange-600/20 to-orange-500/20",
      activeBorder: "border-orange-500/30",
      hoverColor: "hover:bg-orange-900/30"
    },
    preview: "bg-gradient-to-br from-orange-950 via-orange-900 to-slate-950"
  },
  {
    name: "Crimson Red",
    settings: {
      primaryColor: "red",
      gradientFrom: "from-red-950",
      gradientVia: "via-red-900",
      gradientTo: "to-slate-950",
      headerFrom: "from-red-600",
      headerTo: "to-red-500",
      activeGradient: "from-red-600/20 to-red-500/20",
      activeBorder: "border-red-500/30",
      hoverColor: "hover:bg-red-900/30"
    },
    preview: "bg-gradient-to-br from-red-950 via-red-900 to-slate-950"
  },
  {
    name: "Teal Cyan",
    settings: {
      primaryColor: "teal",
      gradientFrom: "from-teal-950",
      gradientVia: "via-teal-900",
      gradientTo: "to-slate-950",
      headerFrom: "from-teal-600",
      headerTo: "to-teal-500",
      activeGradient: "from-teal-600/20 to-teal-500/20",
      activeBorder: "border-teal-500/30",
      hoverColor: "hover:bg-teal-900/30"
    },
    preview: "bg-gradient-to-br from-teal-950 via-teal-900 to-slate-950"
  },
  {
    name: "Gold Amber",
    settings: {
      primaryColor: "amber",
      gradientFrom: "from-amber-950",
      gradientVia: "via-amber-900",
      gradientTo: "to-slate-950",
      headerFrom: "from-amber-600",
      headerTo: "to-amber-500",
      activeGradient: "from-amber-600/20 to-amber-500/20",
      activeBorder: "border-amber-500/30",
      hoverColor: "hover:bg-amber-900/30"
    },
    preview: "bg-gradient-to-br from-amber-950 via-amber-900 to-slate-950"
  },
  {
    name: "Pink Rose",
    settings: {
      primaryColor: "pink",
      gradientFrom: "from-pink-950",
      gradientVia: "via-pink-900",
      gradientTo: "to-slate-950",
      headerFrom: "from-pink-600",
      headerTo: "to-pink-500",
      activeGradient: "from-pink-600/20 to-pink-500/20",
      activeBorder: "border-pink-500/30",
      hoverColor: "hover:bg-pink-900/30"
    },
    preview: "bg-gradient-to-br from-pink-950 via-pink-900 to-slate-950"
  },
  {
    name: "Silver Slate",
    settings: {
      primaryColor: "slate",
      gradientFrom: "from-slate-950",
      gradientVia: "via-slate-900",
      gradientTo: "to-slate-800",
      headerFrom: "from-slate-600",
      headerTo: "to-slate-500",
      activeGradient: "from-slate-600/20 to-slate-500/20",
      activeBorder: "border-slate-500/30",
      hoverColor: "hover:bg-slate-900/30"
    },
    preview: "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800"
  }
];

interface SidebarColorPickerProps {
  onColorChange?: (settings: SidebarSettings) => void;
}

export default function SidebarColorPicker({ onColorChange }: SidebarColorPickerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: user } = useQuery({
    queryKey: ["/api/user/profile"],
    retry: false,
  });

  const updateSidebarMutation = useMutation({
    mutationFn: async (settings: SidebarSettings) => {
      return await apiRequest("PUT", "/api/user/sidebar-settings", settings);
    },
    onSuccess: (_, settings) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      queryClient.refetchQueries({ queryKey: ["/api/user/profile"] });
      onColorChange?.(settings);
      toast({
        title: "Sidebar Color Updated",
        description: "Your sidebar color theme has been saved successfully.",
      });
      setDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const currentSettings = (user as any)?.sidebarSettings || colorThemes[0].settings;
  const currentTheme = colorThemes.find(theme => 
    theme.settings.primaryColor === currentSettings.primaryColor
  ) || colorThemes[0];

  const handleThemeSelect = (theme: ColorTheme) => {
    updateSidebarMutation.mutate(theme.settings);
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          data-testid="button-open-sidebar-color-picker"
        >
          <Palette className="h-4 w-4" />
          Sidebar Color Theme
          <Badge variant="outline" className="ml-auto">
            {currentTheme.name}
          </Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Choose Sidebar Color Theme</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-4 py-4">
          {colorThemes.map((theme) => {
            const isActive = theme.settings.primaryColor === currentSettings.primaryColor;
            
            return (
              <Card 
                key={theme.name}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  isActive ? 'ring-2 ring-primary' : 'hover:ring-1 hover:ring-muted-foreground'
                }`}
                onClick={() => handleThemeSelect(theme)}
                data-testid={`color-theme-${theme.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{theme.name}</CardTitle>
                    {isActive && (
                      <Check className="h-4 w-4 text-green-500" data-testid="icon-active-theme" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  {/* Preview */}
                  <div className={`w-full h-20 rounded-md border ${theme.preview} relative overflow-hidden`}>
                    {/* Mini header simulation */}
                    <div className={`h-6 w-full bg-gradient-to-r ${theme.settings.headerFrom} ${theme.settings.headerTo}`} />
                    
                    {/* Mini sidebar content simulation */}
                    <div className="p-2 space-y-1">
                      <div className="h-2 bg-white/20 rounded w-3/4" />
                      <div className={`h-2 rounded w-full bg-gradient-to-r ${theme.settings.activeGradient}`} />
                      <div className="h-2 bg-white/10 rounded w-2/3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        <div className="text-sm text-muted-foreground text-center">
          Select a color theme for your sidebar. Changes will be applied immediately.
        </div>
      </DialogContent>
    </Dialog>
  );
}