import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TagSelector } from "@/components/TagSelector";
import { updateTrade } from "@/lib/supabase-service";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface ManageTagsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  trade: any;
}

export function ManageTagsDialog({ isOpen, onClose, trade }: ManageTagsDialogProps) {
  const { toast } = useToast();
  const [selectedTags, setSelectedTags] = useState<string[]>(trade?.custom_tags || []);

  // Update selected tags when trade changes
  useEffect(() => {
    if (trade) {
      setSelectedTags(trade.custom_tags || []);
    }
  }, [trade]);

  const updateTagsMutation = useMutation({
    mutationFn: async (tags: string[]) => {
      if (!trade?.id) {
        throw new Error("Trade ID is required");
      }
      
      // Update the trade with new tags
      await updateTrade(trade.id, {
        custom_tags: tags,
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      toast({
        title: "Tags updated successfully",
        description: `Updated tags for ${trade.instrument}`,
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error updating tags",
        description: error.message || "Failed to update tags",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateTagsMutation.mutate(selectedTags);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>🏷️</span>
            <span>Manage Tags for {trade?.instrument}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <TagSelector
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="bg-slate-800 border-slate-700 hover:bg-slate-700"
            data-testid="button-cancel-tags"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateTagsMutation.isPending}
            className="bg-cyan-600 hover:bg-cyan-700"
            data-testid="button-save-tags"
          >
            {updateTagsMutation.isPending ? "Saving..." : "Save Tags"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
