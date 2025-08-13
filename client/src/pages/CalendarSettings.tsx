import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Palette } from "lucide-react";
import { Link } from "wouter";
import type { User, CalendarSettings } from "@shared/schema";

export default function CalendarSettings() {
  const { toast } = useToast();
  
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  const [settings, setSettings] = useState<CalendarSettings>({
    backgroundColor: "#1a1a1a",
    borderColor: "#374151", 
    dayBackgroundColor: "#2d2d2d",
    dayBorderColor: "#4b5563"
  });

  // Update settings when user data loads
  React.useEffect(() => {
    if (user?.calendarSettings) {
      setSettings(user.calendarSettings as CalendarSettings);
    }
  }, [user]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: CalendarSettings) => {
      const response = await apiRequest("PUT", "/api/calendar/settings", newSettings);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Calendar appearance settings have been saved.",
      });
      // Invalidate and refetch user data to get updated calendar settings
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.refetchQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update calendar settings.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateSettingsMutation.mutate(settings);
  };

  const handleReset = () => {
    const defaultSettings: CalendarSettings = {
      backgroundColor: "#1a1a1a",
      borderColor: "#374151",
      dayBackgroundColor: "#2d2d2d", 
      dayBorderColor: "#4b5563"
    };
    setSettings(defaultSettings);
  };

  const presets = [
    {
      name: "Dark Professional",
      settings: {
        backgroundColor: "#1a1a1a",
        borderColor: "#374151",
        dayBackgroundColor: "#2d2d2d",
        dayBorderColor: "#4b5563"
      }
    },
    {
      name: "Blue Theme",
      settings: {
        backgroundColor: "#0f172a",
        borderColor: "#1e3a8a", 
        dayBackgroundColor: "#1e293b",
        dayBorderColor: "#3b82f6"
      }
    },
    {
      name: "Green Theme",
      settings: {
        backgroundColor: "#0f1c0f",
        borderColor: "#166534",
        dayBackgroundColor: "#1a2e1a", 
        dayBorderColor: "#22c55e"
      }
    },
    {
      name: "Purple Theme",
      settings: {
        backgroundColor: "#1e1b3a",
        borderColor: "#7c3aed",
        dayBackgroundColor: "#2d2b4a",
        dayBorderColor: "#a855f7"
      }
    }
  ];

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/3 mb-6"></div>
          <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/calendar">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Calendar
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Palette className="h-6 w-6" />
            Calendar Settings
          </h1>
          <p className="text-muted-foreground">Customize your calendar appearance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Color Settings</CardTitle>
            <CardDescription>
              Customize the colors for your trading calendar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Calendar Background */}
            <div className="space-y-2">
              <Label htmlFor="backgroundColor">Calendar Background</Label>
              <div className="flex gap-2">
                <Input
                  id="backgroundColor"
                  type="color"
                  value={settings.backgroundColor}
                  onChange={(e) => setSettings(prev => ({ ...prev, backgroundColor: e.target.value }))}
                  className="w-16 h-10 p-1 rounded"
                />
                <Input
                  type="text"
                  value={settings.backgroundColor}
                  onChange={(e) => setSettings(prev => ({ ...prev, backgroundColor: e.target.value }))}
                  placeholder="#1a1a1a"
                  className="flex-1"
                />
              </div>
            </div>

            {/* Calendar Border */}
            <div className="space-y-2">
              <Label htmlFor="borderColor">Calendar Border</Label>
              <div className="flex gap-2">
                <Input
                  id="borderColor"
                  type="color"
                  value={settings.borderColor}
                  onChange={(e) => setSettings(prev => ({ ...prev, borderColor: e.target.value }))}
                  className="w-16 h-10 p-1 rounded"
                />
                <Input
                  type="text"
                  value={settings.borderColor}
                  onChange={(e) => setSettings(prev => ({ ...prev, borderColor: e.target.value }))}
                  placeholder="#374151"
                  className="flex-1"
                />
              </div>
            </div>

            {/* Day Background */}
            <div className="space-y-2">
              <Label htmlFor="dayBackgroundColor">Day Background</Label>
              <div className="flex gap-2">
                <Input
                  id="dayBackgroundColor"
                  type="color"
                  value={settings.dayBackgroundColor}
                  onChange={(e) => setSettings(prev => ({ ...prev, dayBackgroundColor: e.target.value }))}
                  className="w-16 h-10 p-1 rounded"
                />
                <Input
                  type="text"
                  value={settings.dayBackgroundColor}
                  onChange={(e) => setSettings(prev => ({ ...prev, dayBackgroundColor: e.target.value }))}
                  placeholder="#2d2d2d"
                  className="flex-1"
                />
              </div>
            </div>

            {/* Day Border */}
            <div className="space-y-2">
              <Label htmlFor="dayBorderColor">Day Border</Label>
              <div className="flex gap-2">
                <Input
                  id="dayBorderColor"
                  type="color"
                  value={settings.dayBorderColor}
                  onChange={(e) => setSettings(prev => ({ ...prev, dayBorderColor: e.target.value }))}
                  className="w-16 h-10 p-1 rounded"
                />
                <Input
                  type="text"
                  value={settings.dayBorderColor}
                  onChange={(e) => setSettings(prev => ({ ...prev, dayBorderColor: e.target.value }))}
                  placeholder="#4b5563"
                  className="flex-1"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button 
                onClick={handleSave}
                disabled={updateSettingsMutation.isPending}
                className="flex-1"
              >
                {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleReset}
                disabled={updateSettingsMutation.isPending}
              >
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview & Presets */}
        <div className="space-y-6">
          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>See how your calendar will look</CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                className="rounded-lg p-4 border-2"
                style={{ 
                  backgroundColor: settings.backgroundColor,
                  borderColor: settings.borderColor 
                }}
              >
                <div className="grid grid-cols-7 gap-1">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                    <div key={i} className="text-center text-xs text-gray-400 mb-1">
                      {day}
                    </div>
                  ))}
                  {Array.from({ length: 14 }, (_, i) => (
                    <div
                      key={i}
                      className="h-12 border-2 relative flex items-start justify-start p-1"
                      style={{
                        backgroundColor: settings.dayBackgroundColor,
                        borderColor: settings.dayBorderColor
                      }}
                    >
                      <span className="text-xs text-gray-300">{i + 1}</span>
                      {i === 5 && (
                        <div className="absolute top-1 right-1 w-3 h-3 bg-primary rounded-sm flex items-center justify-center">
                          <span className="text-[8px] text-white">+</span>
                        </div>
                      )}
                      {i === 7 && (
                        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                          <span className="text-xs text-green-400 font-bold">+$600</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Color Presets */}
          <Card>
            <CardHeader>
              <CardTitle>Color Presets</CardTitle>
              <CardDescription>Quick color schemes to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                {presets.map((preset) => (
                  <Button
                    key={preset.name}
                    variant="outline"
                    onClick={() => setSettings(preset.settings)}
                    className="justify-start h-auto p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        <div 
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: preset.settings.backgroundColor }}
                        />
                        <div 
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: preset.settings.dayBackgroundColor }}
                        />
                        <div 
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: preset.settings.dayBorderColor }}
                        />
                      </div>
                      <span>{preset.name}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}