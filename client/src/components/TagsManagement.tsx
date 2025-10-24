import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Plus, Palette } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { getUserTags, createUserTag, createUserTagsBatch, deleteUserTag } from "@/lib/supabase-service";

// Pre-made tags organized by category
const PREMADE_TAGS = {
  strategy: [
    "Pivot Reversal",
    "Breakout Box",
    "Liquidity Sweep",
    "Trendline Retest",
    "News Reversal",
    "Range Compression Break",
    "Continuation Pullback",
    "Fakeout Entry",
    "Momentum Flip",
    "Sniper Entry"
  ],
  risk_management: [
    "Aggressive Entry",
    "Conservative Entry",
    "Scaled In",
    "Scaled Out",
    "Partial Exit",
    "Trailing Stop Used",
    "No SL / No TP",
    "Breakeven Exit",
    "Moved to BE Early"
  ],
  market_context: [
    "High Volatility",
    "Low Volatility",
    "Trend Market",
    "Range Market",
    "News Hour",
    "Low Volume Session",
    "Post-News Reversal"
  ],
  session_timing: [
    "Asia",
    "London",
    "NY",
    "London-NY Overlap",
    "Pre-London",
    "NY Close Fade"
  ],
  psychological: [
    "FOMO Entry",
    "Revenge Trade",
    "Hesitant Entry",
    "Overconfident",
    "Fear of Missing Out",
    "Overleveraged",
    "Perfect Discipline",
    "Tired / Distracted",
    "Rule Violation"
  ],
  outcome: [
    "Textbook Trade",
    "Sloppy Entry",
    "Missed TP by Spread",
    "News Spike Loss",
    "Execution Error",
    "Patience Rewarded",
    "Cut Early"
  ],
  bias_alignment: [
    "Aligned with Fundamental Bias",
    "Counter to Bias",
    "Same as HTF Direction",
    "Against HTF Direction"
  ],
  emotion_exit: [
    "Confident Exit",
    "Regret Exit",
    "Hesitant Exit",
    "Emotional Close",
    "Mechanical Exit"
  ]
};

// Category display names and colors
const CATEGORY_INFO = {
  strategy: { name: "Strategy Filters", emoji: "🎯", color: "bg-cyan-500/20 border-cyan-500/50" },
  risk_management: { name: "Risk & Trade Management", emoji: "⚖️", color: "bg-purple-500/20 border-purple-500/50" },
  market_context: { name: "Market Context", emoji: "📊", color: "bg-blue-500/20 border-blue-500/50" },
  session_timing: { name: "Session & Timing", emoji: "🕒", color: "bg-orange-500/20 border-orange-500/50" },
  psychological: { name: "Psychological / Behavioral", emoji: "🧠", color: "bg-pink-500/20 border-pink-500/50" },
  outcome: { name: "Outcome / Result", emoji: "🎲", color: "bg-green-500/20 border-green-500/50" },
  bias_alignment: { name: "Bias Alignment", emoji: "🧭", color: "bg-yellow-500/20 border-yellow-500/50" },
  emotion_exit: { name: "Emotion at Exit", emoji: "💭", color: "bg-red-500/20 border-red-500/50" },
  custom: { name: "Custom Tags", emoji: "✨", color: "bg-indigo-500/20 border-indigo-500/50" }
};

// Color options for tags
const TAG_COLORS = [
  { name: "Cyan", value: "#06b6d4" },
  { name: "Purple", value: "#a855f7" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#10b981" },
  { name: "Yellow", value: "#eab308" },
  { name: "Red", value: "#ef4444" },
  { name: "Pink", value: "#ec4899" },
  { name: "Orange", value: "#f97316" }
];

export function TagsManagement() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagCategory, setNewTagCategory] = useState<string>("custom");
  const [newTagColor, setNewTagColor] = useState("#06b6d4");
  const [selectedPredefinedTags, setSelectedPredefinedTags] = useState<Set<string>>(new Set());

  // Fetch user's tags
  const { data: userTags = [] } = useQuery<any[]>({
    queryKey: ["user-tags"],
    queryFn: getUserTags,
  });

  // Create custom tag mutation
  const createTagMutation = useMutation({
    mutationFn: createUserTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-tags"] });
      setIsCreateDialogOpen(false);
      setNewTagName("");
      setNewTagCategory("custom");
      setNewTagColor("#06b6d4");
      toast({
        title: "Tag created",
        description: "Your custom tag has been created successfully."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create tag. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Add predefined tags mutation
  const addPredefinedTagsMutation = useMutation({
    mutationFn: createUserTagsBatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-tags"] });
      setSelectedPredefinedTags(new Set());
      toast({
        title: "Tags added",
        description: "Selected pre-made tags have been added to your library."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add tags. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Delete tag mutation
  const deleteTagMutation = useMutation({
    mutationFn: deleteUserTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-tags"] });
      toast({
        title: "Tag deleted",
        description: "Tag has been removed from your library."
      });
    }
  });

  const handleCreateTag = () => {
    if (!newTagName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a tag name.",
        variant: "destructive"
      });
      return;
    }
    createTagMutation.mutate({
      name: newTagName.trim(),
      category: newTagCategory,
      color: newTagColor
    });
  };

  const handleTogglePredefinedTag = (category: string, tagName: string) => {
    const key = `${category}:${tagName}`;
    const newSet = new Set(selectedPredefinedTags);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setSelectedPredefinedTags(newSet);
  };

  const handleAddSelectedTags = () => {
    const tagsToAdd = Array.from(selectedPredefinedTags).map(key => {
      const [category, ...nameParts] = key.split(":");
      const name = nameParts.join(":");
      // Assign color based on category
      const categoryColors: Record<string, string> = {
        strategy: "#06b6d4",
        risk_management: "#a855f7",
        market_context: "#3b82f6",
        session_timing: "#f97316",
        psychological: "#ec4899",
        outcome: "#10b981",
        bias_alignment: "#eab308",
        emotion_exit: "#ef4444"
      };
      return {
        name,
        category,
        color: categoryColors[category] || "#06b6d4"
      };
    });

    if (tagsToAdd.length === 0) {
      toast({
        title: "No tags selected",
        description: "Please select at least one tag to add.",
        variant: "destructive"
      });
      return;
    }

    addPredefinedTagsMutation.mutate(tagsToAdd);
  };

  // Get existing tag names to avoid duplicates
  const existingTagNames = new Set(userTags.map((tag: any) => tag.name.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Tag Management</h2>
          <p className="text-gray-400 mt-1">Create custom tags and select from pre-made filters to categorize your trades</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white" data-testid="button-create-custom-tag">
              <Plus className="w-4 h-4 mr-2" />
              Create Custom Tag
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-white">Create Custom Tag</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tag-name" className="text-gray-300">Tag Name</Label>
                <Input
                  id="tag-name"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="e.g., My Custom Setup"
                  className="bg-slate-800 border-slate-700 text-white"
                  data-testid="input-tag-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tag-category" className="text-gray-300">Category</Label>
                <Select value={newTagCategory} onValueChange={setNewTagCategory}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white" data-testid="select-tag-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {Object.entries(CATEGORY_INFO).map(([key, info]) => (
                      <SelectItem key={key} value={key}>
                        {info.emoji} {info.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300 flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Color
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {TAG_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setNewTagColor(color.value)}
                      className={`h-10 rounded-lg border-2 transition-all ${
                        newTagColor === color.value ? "border-white scale-110" : "border-slate-700"
                      }`}
                      style={{ backgroundColor: color.value }}
                      data-testid={`color-${color.name.toLowerCase()}`}
                    >
                      {newTagColor === color.value && <span className="text-white">✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="bg-slate-800 border-slate-700 text-white">
                Cancel
              </Button>
              <Button onClick={handleCreateTag} disabled={createTagMutation.isPending} className="bg-purple-600 hover:bg-purple-700 text-white" data-testid="button-save-tag">
                {createTagMutation.isPending ? "Creating..." : "Create Tag"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pre-made Tags Selection */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Pre-made Filter Templates</CardTitle>
              <CardDescription className="text-gray-400">Select tags to add to your library</CardDescription>
            </div>
            {selectedPredefinedTags.size > 0 && (
              <Button 
                onClick={handleAddSelectedTags} 
                disabled={addPredefinedTagsMutation.isPending}
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
                data-testid="button-add-selected-tags"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add {selectedPredefinedTags.size} Selected
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-6">
              {Object.entries(PREMADE_TAGS).map(([category, tags]) => {
                const categoryInfo = CATEGORY_INFO[category as keyof typeof CATEGORY_INFO];
                return (
                  <div key={category} className="space-y-3">
                    <div className={`p-3 rounded-lg border ${categoryInfo.color}`}>
                      <h3 className="text-white font-semibold flex items-center gap-2">
                        <span className="text-xl">{categoryInfo.emoji}</span>
                        {categoryInfo.name}
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 pl-4">
                      {tags.map((tag) => {
                        const key = `${category}:${tag}`;
                        const isSelected = selectedPredefinedTags.has(key);
                        const alreadyExists = existingTagNames.has(tag.toLowerCase());
                        return (
                          <div key={tag} className="flex items-center gap-2">
                            <Checkbox
                              id={key}
                              checked={isSelected}
                              onCheckedChange={() => handleTogglePredefinedTag(category, tag)}
                              disabled={alreadyExists}
                              className="border-slate-600"
                              data-testid={`checkbox-tag-${tag.toLowerCase().replace(/\s+/g, "-")}`}
                            />
                            <Label htmlFor={key} className={`text-sm cursor-pointer ${alreadyExists ? "text-gray-500" : "text-gray-300"}`}>
                              {tag} {alreadyExists && "✓"}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* User's Tag Library */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Your Tag Library</CardTitle>
          <CardDescription className="text-gray-400">Tags you can apply to your trades</CardDescription>
        </CardHeader>
        <CardContent>
          {userTags.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No tags yet. Create a custom tag or select from pre-made templates above.</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(CATEGORY_INFO).map(([category, info]) => {
                const categoryTags = userTags.filter((tag: any) => tag.category === category);
                if (categoryTags.length === 0) return null;
                
                return (
                  <div key={category} className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-400 flex items-center gap-2">
                      <span>{info.emoji}</span>
                      {info.name}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {categoryTags.map((tag: any) => (
                        <Badge
                          key={tag.id}
                          className="text-white border transition-all hover:scale-105 cursor-pointer group"
                          style={{
                            backgroundColor: `${tag.color}40`,
                            borderColor: tag.color,
                            boxShadow: `0 0 10px ${tag.color}40`
                          }}
                          data-testid={`badge-tag-${tag.name.toLowerCase().replace(/\s+/g, "-")}`}
                        >
                          {tag.name}
                          {!tag.is_predefined && (
                            <button
                              onClick={() => deleteTagMutation.mutate(tag.id)}
                              className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              data-testid={`button-delete-tag-${tag.id}`}
                            >
                              ×
                            </button>
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
