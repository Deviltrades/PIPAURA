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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const addTradeSchema = z.object({
  instrumentType: z.enum(["FOREX", "INDICES", "CRYPTO"]),
  instrument: z.string().min(1, "Instrument is required"),
  tradeType: z.enum(["BUY", "SELL"]),
  positionSize: z.string().min(1, "Position size is required"),
  entryPrice: z.string().min(1, "Entry price is required"),
  stopLoss: z.string().min(1, "Stop loss is required"),
  takeProfit: z.string().min(1, "Take profit is required"),
  notes: z.string().optional(),
  hasPnL: z.boolean().optional(),
  pnlType: z.enum(["profit", "loss"]).optional(),
  pnlAmount: z.string().optional(),
}).refine((data) => {
  if (data.hasPnL && (!data.pnlAmount || !data.pnlType)) {
    return false;
  }
  return true;
}, {
  message: "P&L type and amount are required when profit/loss is enabled",
  path: ["pnlAmount"]
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
      positionSize: "1.0",
      entryPrice: "",
      stopLoss: "",
      takeProfit: "",
      notes: "",
      hasPnL: false,
      pnlType: "profit",
      pnlAmount: "",
    },
  });

  const addTradeMutation = useMutation({
    mutationFn: async (data: AddTradeFormData) => {
      // Format date as YYYY-MM-DD to avoid timezone issues
      const localDateString = selectedDate.getFullYear() + '-' + 
        String(selectedDate.getMonth() + 1).padStart(2, '0') + '-' + 
        String(selectedDate.getDate()).padStart(2, '0');
      
      // Calculate P&L based on user input
      let calculatedPnL = "0";
      if (data.hasPnL && data.pnlAmount) {
        const amount = parseFloat(data.pnlAmount);
        calculatedPnL = data.pnlType === "loss" ? (-amount).toString() : amount.toString();
      }

      const tradeData = {
        ...data,
        entryDate: localDateString, // Send as local date string
        pnl: calculatedPnL,
        status: "CLOSED", // Always set to CLOSED since we're tracking completed trades only
        // Remove the extra fields that aren't in the backend schema
        hasPnL: undefined,
        pnlType: undefined,
        pnlAmount: undefined,
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
    console.log("Form data:", data);
    console.log("Form errors:", form.formState.errors);
    addTradeMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] bg-background border overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <DialogTitle className="text-xl font-semibold">Add New Trade</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Record a new trade for {selectedDate.toLocaleDateString()}
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
                        type="text"
                        placeholder="1.0"
                        className="bg-background border-input"
                        {...field}
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
                        type="text"
                        placeholder="1.08450"
                        className="bg-background border-input"
                        {...field}
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
                        type="text"
                        placeholder="1.08200"
                        className="bg-background border-input"
                        {...field}
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
                        type="text"
                        placeholder="1.08700"
                        className="bg-background border-input"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </div>

            {/* Profit/Loss Section */}
            <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
              <FormField
                control={form.control}
                name="hasPnL"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center space-x-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-medium">
                        Set Profit/Loss Amount
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {form.watch("hasPnL") && (
                <div className="grid grid-cols-2 gap-4">
                  {/* P&L Type */}
                  <FormField
                    control={form.control}
                    name="pnlType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background border-input">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="profit">Profit</SelectItem>
                            <SelectItem value="loss">Loss</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* P&L Amount */}
                  <FormField
                    control={form.control}
                    name="pnlAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="600"
                            className="bg-background border-input"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
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