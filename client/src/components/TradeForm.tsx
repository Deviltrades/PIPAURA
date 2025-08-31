import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ObjectUploader } from "./ObjectUploader";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { UploadResult } from "@uppy/core";

const tradeFormSchema = z.object({
  instrument: z.string().min(1, "Instrument is required"),
  instrumentType: z.enum(["FOREX", "INDICES", "CRYPTO"]),
  tradeType: z.enum(["BUY", "SELL"]),
  positionSize: z.string().min(1, "Position size is required"),
  entryPrice: z.string().min(1, "Entry price is required"),
  stopLoss: z.string().optional(),
  takeProfit: z.string().optional(),
  exitPrice: z.string().optional(),
  pnl: z.string().optional(),
  status: z.enum(["OPEN", "CLOSED", "CANCELLED"]).default("OPEN"),
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

type TradeFormData = z.infer<typeof tradeFormSchema>;

interface TradeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trade?: any;
}

const forexPairs = ["EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD", "USD/CAD", "NZD/USD", "EUR/GBP", "EUR/JPY"];
const indices = ["S&P 500", "NASDAQ", "FTSE 100", "DAX", "Nikkei 225", "CAC 40"];
const cryptos = ["BTC/USD", "ETH/USD", "ADA/USD", "XRP/USD", "SOL/USD", "DOT/USD"];

export function TradeForm({ open, onOpenChange, trade }: TradeFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [attachments, setAttachments] = useState<string[]>(trade?.attachments || []);

  const form = useForm<TradeFormData>({
    resolver: zodResolver(tradeFormSchema),
    defaultValues: {
      instrument: trade?.instrument || "",
      instrumentType: trade?.instrumentType || "FOREX",
      tradeType: trade?.tradeType || "BUY",
      positionSize: trade?.positionSize || "",
      entryPrice: trade?.entryPrice || "",
      stopLoss: trade?.stopLoss || "",
      takeProfit: trade?.takeProfit || "",
      exitPrice: trade?.exitPrice || "",
      pnl: trade?.pnl || "",
      status: trade?.status || "OPEN",
      notes: trade?.notes || "",
      hasPnL: false,
      pnlType: undefined,
      pnlAmount: "",
    },
  });

  const createTradeMutation = useMutation({
    mutationFn: async (data: TradeFormData) => {
      // Calculate P&L based on toggle
      let calculatedPnl = null;
      if (data.hasPnL && data.pnlAmount && data.pnlType) {
        const pnlValue = parseFloat(data.pnlAmount);
        calculatedPnl = data.pnlType === "loss" ? -pnlValue : pnlValue;
      } else if (data.pnl) {
        calculatedPnl = parseFloat(data.pnl);
      }

      const payload = {
        ...data,
        attachments,
        positionSize: parseFloat(data.positionSize),
        entryPrice: parseFloat(data.entryPrice),
        stopLoss: data.stopLoss ? parseFloat(data.stopLoss) : null,
        takeProfit: data.takeProfit ? parseFloat(data.takeProfit) : null,
        exitPrice: data.exitPrice ? parseFloat(data.exitPrice) : null,
        pnl: calculatedPnl,
      };

      if (trade?.id) {
        return await apiRequest("PUT", `/api/trades/${trade.id}`, payload);
      } else {
        return await apiRequest("POST", "/api/trades", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/daily-pnl"] });
      toast({
        title: "Success",
        description: trade?.id ? "Trade updated successfully" : "Trade created successfully",
      });
      onOpenChange(false);
      form.reset();
      setAttachments([]);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to save trade",
        variant: "destructive",
      });
    },
  });

  const handleGetUploadParameters = async () => {
    const response = await apiRequest("POST", "/api/objects/upload");
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  const handleUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadURL = result.successful[0].uploadURL;
      
      try {
        const response = await apiRequest("PUT", "/api/trade-attachments", {
          fileURL: uploadURL,
        });
        const data = await response.json();
        setAttachments(prev => [...prev, data.objectPath]);
        
        toast({
          title: "Success",
          description: "File uploaded successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to process uploaded file",
          variant: "destructive",
        });
      }
    }
  };

  const getInstrumentOptions = (type: string) => {
    switch (type) {
      case "FOREX":
        return forexPairs;
      case "INDICES":
        return indices;
      case "CRYPTO":
        return cryptos;
      default:
        return [];
    }
  };

  const instrumentType = form.watch("instrumentType");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{trade?.id ? "Edit Trade" : "Add New Trade"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => createTradeMutation.mutate(data))} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="instrumentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instrument Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
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

              <FormField
                control={form.control}
                name="instrument"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instrument</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select instrument" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getInstrumentOptions(instrumentType).map((instrument) => (
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

              <FormField
                control={form.control}
                name="tradeType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trade Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
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

              <FormField
                control={form.control}
                name="positionSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position Size</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="1.0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="entryPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entry Price</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.00001" placeholder="1.08450" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stopLoss"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stop Loss</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.00001" placeholder="1.08200" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="takeProfit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Take Profit</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.00001" placeholder="1.08700" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="OPEN">OPEN</SelectItem>
                        <SelectItem value="CLOSED">CLOSED</SelectItem>
                        <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {(form.watch("status") === "CLOSED") && (
                <>
                  <FormField
                    control={form.control}
                    name="exitPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Exit Price</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.00001" placeholder="1.08670" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Profit/Loss Toggle Section */}
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
                                data-testid="toggle-pnl"
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-medium">
                              Set Profit/Loss Amount
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    {form.watch("hasPnL") ? (
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
                                  <SelectTrigger className="bg-background border-input" data-testid="select-pnl-type">
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
                                  data-testid="input-pnl-amount"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    ) : (
                      <FormField
                        control={form.control}
                        name="pnl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>P&L ($)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="330.00" data-testid="input-pnl-manual" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </>
              )}
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trade Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="Add your trade analysis, reasoning, and strategy..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel>Attachments</FormLabel>
              <div className="mt-2">
                <ObjectUploader
                  maxNumberOfFiles={5}
                  maxFileSize={10485760}
                  onGetUploadParameters={handleGetUploadParameters}
                  onComplete={handleUploadComplete}
                  buttonClassName="w-full"
                >
                  <div className="flex items-center justify-center gap-2 p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                    <span>📁</span>
                    <span>Upload Files</span>
                  </div>
                </ObjectUploader>
                {attachments.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {attachments.length} file(s) uploaded
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createTradeMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createTradeMutation.isPending}>
                {createTradeMutation.isPending
                  ? "Saving..."
                  : trade?.id
                  ? "Update Trade"
                  : "Save Trade"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default TradeForm;
