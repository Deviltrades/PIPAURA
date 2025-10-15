import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface EmotionalLogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (log: {
    log_date: string;
    mood: number;
    energy: number;
    tags: string[];
    note: string;
  }) => void;
  initialDate?: Date;
  isLoading?: boolean;
}

const EMOTION_TAGS = [
  "Confident",
  "Anxious",
  "Focused",
  "Stressed",
  "Calm",
  "Excited",
  "Frustrated",
  "Patient",
  "Impulsive",
  "Disciplined",
  "Fearful",
  "Greedy",
  "Neutral",
  "Optimistic",
  "Pessimistic"
];

const getMoodEmoji = (mood: number) => {
  if (mood <= 2) return "😔";
  if (mood <= 4) return "😕";
  if (mood <= 6) return "😐";
  if (mood <= 8) return "🙂";
  return "😊";
};

const getEnergyEmoji = (energy: number) => {
  if (energy <= 3) return "🔋";
  if (energy <= 6) return "⚡";
  return "⚡⚡";
};

export function EmotionalLogModal({
  open,
  onOpenChange,
  onSave,
  initialDate,
  isLoading = false
}: EmotionalLogModalProps) {
  const [date, setDate] = useState<Date>(initialDate || new Date());
  const [mood, setMood] = useState<number>(5);
  const [energy, setEnergy] = useState<number>(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [note, setNote] = useState("");

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSave = () => {
    onSave({
      log_date: format(date, "yyyy-MM-dd"),
      mood,
      energy,
      tags: selectedTags,
      note: note.trim()
    });
    
    // Reset form
    setMood(5);
    setEnergy(5);
    setSelectedTags([]);
    setNote("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-hidden flex flex-col" data-testid="modal-emotional-log">
        <DialogHeader>
          <DialogTitle className="text-cyan-400">Daily Emotional Check-in</DialogTitle>
          <DialogDescription>
            Track your emotional state to understand how it affects your trading performance.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 overflow-y-auto pr-2">
          {/* Date Picker */}
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                  data-testid="button-select-date"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => newDate && setDate(newDate)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Mood Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Mood <span className="text-2xl ml-1">{getMoodEmoji(mood)}</span></Label>
              <span className="text-sm font-medium text-cyan-400" data-testid="text-mood-value">
                {mood}/10
              </span>
            </div>
            <Slider
              value={[mood]}
              onValueChange={(value) => setMood(value[0])}
              min={1}
              max={10}
              step={1}
              className="py-4"
              data-testid="slider-mood"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Very Low</span>
              <span>Very High</span>
            </div>
          </div>

          {/* Energy Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Energy Level <span className="text-2xl ml-1">{getEnergyEmoji(energy)}</span></Label>
              <span className="text-sm font-medium text-cyan-400" data-testid="text-energy-value">
                {energy}/10
              </span>
            </div>
            <Slider
              value={[energy]}
              onValueChange={(value) => setEnergy(value[0])}
              min={1}
              max={10}
              step={1}
              className="py-4"
              data-testid="slider-energy"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Exhausted</span>
              <span>Energized</span>
            </div>
          </div>

          {/* Emotion Tags */}
          <div className="space-y-2">
            <Label>Emotional State (select all that apply)</Label>
            <div className="flex flex-wrap gap-2">
              {EMOTION_TAGS.map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer transition-all",
                    selectedTags.includes(tag)
                      ? "bg-cyan-500/20 text-cyan-400 border-cyan-500 hover:bg-cyan-500/30"
                      : "hover:border-cyan-500/50"
                  )}
                  onClick={() => toggleTag(tag)}
                  data-testid={`tag-${tag.toLowerCase()}`}
                >
                  {tag}
                  {selectedTags.includes(tag) && (
                    <X className="ml-1 h-3 w-3" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="How are you feeling today? Any specific thoughts or concerns about your trading?"
              className="min-h-[100px] resize-none"
              data-testid="textarea-note"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-cyan-500 hover:bg-cyan-600"
            data-testid="button-save-log"
          >
            {isLoading ? "Saving..." : "Save Log"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
