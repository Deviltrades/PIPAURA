import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Trade } from "@shared/schema";

const editTradeSchema = z.object({
  exitPrice: z.string().min(1, "Exit price is required"),
});

type EditTradeFormData = z.infer<typeof editTradeSchema>;

interface EditTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  trade: Trade;
}

export function EditTradeModal({ isOpen, onClose, trade }: EditTradeModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<EditTradeFormData>({
    resolver: zodResolver(editTradeSchema),
    defaultValues: {
      exitPrice: trade.exitPrice || "",
    },
  });

  const editTradeMutation = useMutation({
    mutationFn: async (data: EditTradeFormData) => {
      // Calculate P&L for completed trade
      const entryPrice = parseFloat(trade.entryPrice);
      const exitPrice = parseFloat(data.exitPrice);
      const positionSize = parseFloat(trade.positionSize);
      
      let pnl = 0;
      if (trade.tradeType === "BUY") {
        pnl = (exitPrice - entryPrice) * positionSize;
      } else {
        pnl = (entryPrice - exitPrice) * positionSize;
      }

      const tradeData = {
        ...data,
        status: "CLOSED", // Always set to CLOSED since we're tracking completed trades only
        pnl: pnl.toString(),
        exitDate: new Date().toISOString(),
      };
      
      const response = await apiRequest("PUT", `/api/trades/${trade.id}`, tradeData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Trade updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/stats"] });
      form.reset();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update trade. Please try again.",
        variant: "destructive",
      });
      console.error("Error updating trade:", error);
    },
  });

  const onSubmit = (data: EditTradeFormData) => {
    editTradeMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-background border">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <DialogTitle className="text-xl font-semibold">Edit Trade</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Update {trade.instrument} {trade.tradeType} position
            </DialogDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              {/* Trade Info Display */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Instrument:</span>
                  <span className="font-medium">{trade.instrument}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Type:</span>
                  <span className="font-medium">{trade.tradeType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Position Size:</span>
                  <span className="font-medium">{trade.positionSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Entry Price:</span>
                  <span className="font-medium">${trade.entryPrice}</span>
                </div>
              </div>

              {/* Exit Price */}
              <FormField
                control={form.control}
                name="exitPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exit Price</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="125.000"
                        className="bg-background border-input"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status */}
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={editTradeMutation.isPending}
                className="min-w-[100px]"
              >
                {editTradeMutation.isPending ? "Updating..." : "Update Trade"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}