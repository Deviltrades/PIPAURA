import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createJournalEntrySchema } from "@shared/schema";
import type { CreateJournalEntry } from "@shared/schema";
import { createJournalEntry, uploadFile } from "@/lib/supabase-service";

interface JournalEntryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function JournalEntryForm({ open, onOpenChange }: JournalEntryFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<CreateJournalEntry>({
    resolver: zodResolver(createJournalEntrySchema),
    defaultValues: {
      notes: "",
      trade_data: {},
      image_url: "",
    },
  });

  const createEntry = useMutation({
    mutationFn: async (data: CreateJournalEntry) => {
      return await createJournalEntry({
        ...data,
        status: 'OPEN' as const,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
      toast({
        title: "Journal Entry Created",
        description: "Your journal entry has been saved successfully.",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create journal entry",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload only image files');
      }

      const fileUrl = await uploadFile(file);
      form.setValue("image_url", fileUrl);
      toast({
        title: "Image Uploaded",
        description: "Your image has been uploaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = (data: CreateJournalEntry) => {
    createEntry.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Journal Entry</DialogTitle>
          <DialogDescription>
            Record your trading thoughts, analysis, and attach screenshots.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Write your trading notes, analysis, or thoughts..."
                      className="min-h-[120px]"
                      {...field}
                      data-testid="input-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel>Trade Data (JSON)</FormLabel>
              <FormField
                control={form.control}
                name="trade_data"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder='{"instrument": "EURUSD", "type": "BUY", "pnl": 150.00}'
                        className="min-h-[80px] font-mono text-sm"
                        value={typeof field.value === 'string' ? field.value : JSON.stringify(field.value, null, 2)}
                        onChange={(e) => {
                          try {
                            const parsed = JSON.parse(e.target.value);
                            field.onChange(parsed);
                          } catch {
                            field.onChange(e.target.value);
                          }
                        }}
                        data-testid="input-trade-data"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <FormLabel>Screenshot/Image</FormLabel>
              <div className="space-y-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                  data-testid="input-image"
                />
                {form.watch("image_url") && (
                  <div className="mt-2">
                    <img
                      src={form.watch("image_url")}
                      alt="Uploaded screenshot"
                      className="max-w-full h-32 object-cover rounded border"
                    />
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createEntry.isPending || isUploading}
                data-testid="button-submit"
              >
                {createEntry.isPending ? "Saving..." : "Save Entry"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}