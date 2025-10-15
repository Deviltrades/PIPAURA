import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUserProfile, updateUserProfile } from "@/lib/supabase-service";
import { useToast } from "@/hooks/use-toast";

const TIMEZONES = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)", offset: "+00:00" },
  { value: "America/New_York", label: "New York (EST/EDT)", offset: "-05:00/-04:00" },
  { value: "America/Chicago", label: "Chicago (CST/CDT)", offset: "-06:00/-05:00" },
  { value: "America/Los_Angeles", label: "Los Angeles (PST/PDT)", offset: "-08:00/-07:00" },
  { value: "Europe/London", label: "London (GMT/BST)", offset: "+00:00/+01:00" },
  { value: "Europe/Paris", label: "Paris (CET/CEST)", offset: "+01:00/+02:00" },
  { value: "Europe/Berlin", label: "Berlin (CET/CEST)", offset: "+01:00/+02:00" },
  { value: "Asia/Dubai", label: "Dubai (GST)", offset: "+04:00" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)", offset: "+09:00" },
  { value: "Asia/Singapore", label: "Singapore (SGT)", offset: "+08:00" },
  { value: "Asia/Hong_Kong", label: "Hong Kong (HKT)", offset: "+08:00" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)", offset: "+08:00" },
  { value: "Australia/Sydney", label: "Sydney (AEDT/AEST)", offset: "+11:00/+10:00" },
];

export function TimezoneSelector() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: userProfile, isLoading } = useQuery({
    queryKey: ['/api/user-profile'],
    queryFn: getUserProfile,
  });

  const updateTimezoneMutation = useMutation({
    mutationFn: (timezone: string) => updateUserProfile({ timezone }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['/api/weekly-events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/high-impact-events'] });
      toast({
        title: "Timezone updated",
        description: "Event times will now display in your selected timezone",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating timezone",
        description: error instanceof Error ? error.message : "Failed to update timezone",
        variant: "destructive",
      });
    },
  });

  const handleTimezoneChange = (timezone: string) => {
    updateTimezoneMutation.mutate(timezone);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Globe className="h-4 w-4" />
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2" data-testid="timezone-selector">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <Select
        value={userProfile?.timezone || "UTC"}
        onValueChange={handleTimezoneChange}
        disabled={updateTimezoneMutation.isPending}
      >
        <SelectTrigger className="w-[280px] border-cyan-600/50 bg-slate-800/50 hover:bg-cyan-600/20 hover:border-cyan-500">
          <SelectValue placeholder="Select timezone" />
        </SelectTrigger>
        <SelectContent>
          {TIMEZONES.map((tz) => (
            <SelectItem key={tz.value} value={tz.value} data-testid={`timezone-${tz.value}`}>
              <div className="flex items-center justify-between w-full">
                <span>{tz.label}</span>
                <span className="text-xs text-muted-foreground ml-2">{tz.offset}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
