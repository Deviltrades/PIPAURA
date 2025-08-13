import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { format } from "date-fns";
import { X } from "lucide-react";

import {
  Dialog,
  DialogContent,
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const addTradeSchema = z.object({
  instrumentType: z.enum(["FOREX", "INDICES", "CRYPTO"]),
  instrument: z.string().min(1, "Instrument is required"),
  tradeType: z.enum(["BUY", "SELL"]),
  positionSize: z.number().positive("Position size must be positive"),
  entryPrice: z.number().positive("Entry price must be positive"),
  stopLoss: z.number().positive("Stop loss must be positive"),
  takeProfit: z.number().positive("Take profit must be positive"),
  status: z.enum(["OPEN", "CLOSED"]),
  notes: z.string().optional(),
});

type AddTradeFormData = z.infer<typeof addTradeSchema>;

interface AddTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
}

const FOREX_INSTRUMENTS = [
  "EUR/USD", "GBP/USD", "USD/JPY", "USD/CHF", "AUD/USD", "USD/CAD", "NZD/USD",
  "EUR/GBP", "EUR/JPY", "GBP/JPY", "AUD/JPY", "CHF/JPY", "CAD/JPY", "NZD/JPY"
];

const INDICES_INSTRUMENTS = [
  "S&P 500", "NASDAQ", "DOW JONES", "FTSE 100", "DAX", "CAC 40", "NIKKEI", "HANG SENG"
];

const CRYPTO_INSTRUMENTS = [
  "BTC/USD", "ETH/USD", "ADA/USD", "SOL/USD", "DOT/USD", "LINK/USD", "UNI/USD", "AVAX/USD"
];

export function AddTradeModal({ isOpen, onClose, selectedDate }: AddTradeModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedInstrumentType, setSelectedInstrumentType] = useState<string>("FOREX");

  const form = useForm<AddTradeFormData>({
    resolver: zodResolver(addTradeSchema),
    defaultValues: {
      instrumentType: "FOREX",
      instrument: "",
      tradeType: "BUY",
      positionSize: 1.0,
      entryPrice: 0,
      stopLoss: 0,
      takeProfit: 0,
      status: "OPEN",
      notes: "",
    },
  });

  const addTradeMutation = useMutation({
    mutationFn: async (data: AddTradeFormData) => {
      const tradeData = {
        ...data,
        entryDate: selectedDate.toISOString(),
        pnl: 0, // Will be calculated when trade is closed
      };
      
      const response = await apiRequest("POST", "/api/trades", tradeData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Trade added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/stats"] });
      form.reset();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add trade. Please try again.",
        variant: "destructive",
      });
      console.error("Error adding trade:", error);
    },
  });

  const getInstrumentsForType = (type: string) => {
    switch (type) {
      case "FOREX":
        return FOREX_INSTRUMENTS;
      case "INDICES":
        return INDICES_INSTRUMENTS;
      case "CRYPTO":
        return CRYPTO_INSTRUMENTS;
      default:
        return [];
    }
  };

  const onSubmit = (data: AddTradeFormData) => {
    addTradeMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-background border">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-xl font-semibold">Add New Trade</DialogTitle>
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
            <div className="grid grid-cols-2 gap-4">
              {/* Instrument Type */}
              <FormField
                control={form.control}
                name="instrumentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instrument Type</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedInstrumentType(value);
                        form.setValue("instrument", ""); // Reset instrument when type changes
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-background border-input">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="FOREX">Forex</SelectItem>
                        <SelectItem value="INDICES">Indices</SelectItem>
                        <SelectItem value="CRYPTO">Crypto</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Instrument */}
              <FormField
                control={form.control}
                name="instrument"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instrument</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background border-input">
                          <SelectValue placeholder="Select instrument" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getInstrumentsForType(selectedInstrumentType).map((instrument) => (
                          <SelectItem key={instrument} value={instrument}>
                            {instrument}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Trade Type */}
              <FormField
                control={form.control}
                name="tradeType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trade Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background border-input">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="BUY">BUY</SelectItem>
                        <SelectItem value="SELL">SELL</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Position Size */}
              <FormField
                control={form.control}
                name="positionSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position Size</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="1.0"
                        className="bg-background border-input"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Entry Price */}
              <FormField
                control={form.control}
                name="entryPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entry Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.00001"
                        placeholder="1.08450"
                        className="bg-background border-input"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Stop Loss */}
              <FormField
                control={form.control}
                name="stopLoss"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stop Loss</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.00001"
                        placeholder="1.08200"
                        className="bg-background border-input"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Take Profit */}
              <FormField
                control={form.control}
                name="takeProfit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Take Profit</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.00001"
                        placeholder="1.08700"
                        className="bg-background border-input"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background border-input">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="OPEN">OPEN</SelectItem>
                        <SelectItem value="CLOSED">CLOSED</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Trade Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trade Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add your trade analysis, reasoning, and strategy..."
                      className="bg-background border-input min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-between items-center pt-4">
              <p className="text-sm text-muted-foreground">
                Date: {format(selectedDate, "EEEE, MMMM d, yyyy")}
              </p>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={addTradeMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={addTradeMutation.isPending}
                >
                  {addTradeMutation.isPending ? "Adding..." : "Add Trade"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}