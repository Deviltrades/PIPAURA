import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { getUserTags } from "@/lib/supabase-service";

interface TagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

// Category information for display
const CATEGORY_INFO: Record<string, { name: string; emoji: string; color: string }> = {
  strategy: { name: "Strategy Filters", emoji: "🎯", color: "#06b6d4" },
  risk_management: { name: "Risk & Trade Management", emoji: "⚖️", color: "#a855f7" },
  market_context: { name: "Market Context", emoji: "📊", color: "#3b82f6" },
  session_timing: { name: "Session & Timing", emoji: "🕒", color: "#f97316" },
  psychological: { name: "Psychological / Behavioral", emoji: "🧠", color: "#ec4899" },
  outcome: { name: "Outcome / Result", emoji: "🎲", color: "#10b981" },
  bias_alignment: { name: "Bias Alignment", emoji: "🧭", color: "#eab308" },
  emotion_exit: { name: "Emotion at Exit", emoji: "💭", color: "#ef4444" },
  custom: { name: "Custom Tags", emoji: "✨", color: "#a855f7" }
};

export function TagSelector({ selectedTags, onTagsChange }: TagSelectorProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  // Fetch user tags
  const { data: userTags = [] } = useQuery<any[]>({
    queryKey: ["user-tags"],
    queryFn: getUserTags,
  });

  // Group tags by category
  const tagsByCategory = userTags.reduce((acc, tag) => {
    const category = tag.category || "custom";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(tag);
    return acc;
  }, {} as Record<string, any[]>);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleTag = (tagName: string) => {
    const isSelected = selectedTags.includes(tagName);
    if (isSelected) {
      onTagsChange(selectedTags.filter(t => t !== tagName));
    } else {
      onTagsChange([...selectedTags, tagName]);
    }
  };

  if (userTags.length === 0) {
    return (
      <div className="text-center py-6 text-gray-400">
        <p>No tags created yet.</p>
        <p className="text-sm mt-2">Go to Strategy & Playbook → Tags to create tags first.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="space-y-2">
        {Object.entries(tagsByCategory).map(([category, tags]) => {
          const categoryInfo = CATEGORY_INFO[category] || CATEGORY_INFO.custom;
          const isExpanded = expandedCategories.includes(category);
          const categoryTags = tags as any[];

          return (
            <Collapsible
              key={category}
              open={isExpanded}
              onOpenChange={() => toggleCategory(category)}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{categoryInfo.emoji}</span>
                  <span className="text-white font-medium">{categoryInfo.name}</span>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {categoryTags.filter((t: any) => selectedTags.includes(t.name)).length}/{categoryTags.length}
                  </Badge>
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-2 pl-4">
                <div className="flex flex-wrap gap-2">
                  {categoryTags.map((tag: any) => {
                    const isSelected = selectedTags.includes(tag.name);
                    return (
                      <div key={tag.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`tag-${tag.id}`}
                          checked={isSelected}
                          onCheckedChange={() => toggleTag(tag.name)}
                          className="border-slate-600"
                          data-testid={`checkbox-tag-${tag.name.toLowerCase().replace(/\s+/g, "-")}`}
                        />
                        <Label
                          htmlFor={`tag-${tag.id}`}
                          className="cursor-pointer"
                        >
                          <Badge
                            className="text-white border cursor-pointer"
                            style={{
                              backgroundColor: `${tag.color}40`,
                              borderColor: tag.color,
                            }}
                          >
                            {tag.name}
                          </Badge>
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </ScrollArea>
  );
}
