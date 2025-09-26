import { useState, useEffect } from "react";
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
import { createTrade, updateTrade, uploadFile } from "@/lib/supabase-service";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { SignedImageDisplay } from "@/components/SignedImageDisplay";

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
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<TradeFormData>({
    resolver: zodResolver(tradeFormSchema),
    defaultValues: {
      instrument: trade?.instrument || "",
      instrumentType: trade?.instrumentType || "FOREX",
      tradeType: trade?.tradeType || "BUY",
      positionSize: trade?.positionSize?.toString() || "",
      entryPrice: trade?.entryPrice?.toString() || "",
      stopLoss: trade?.stopLoss?.toString() || "",
      takeProfit: trade?.takeProfit?.toString() || "",
      exitPrice: trade?.exitPrice?.toString() || "",
      pnl: trade?.pnl?.toString() || "",
      status: trade?.status || "OPEN",
      notes: trade?.notes || "",
      hasPnL: false,
      pnlType: undefined,
      pnlAmount: "",
    },
  });

  // Initialize attachments when trade changes
  useEffect(() => {
    setAttachments(trade?.attachments || []);
  }, [trade?.id]); // Only reset when editing a different trade

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
        instrument: data.instrument,
        instrument_type: data.instrumentType as 'FOREX' | 'INDICES' | 'CRYPTO',
        trade_type: data.tradeType as 'BUY' | 'SELL',
        position_size: parseFloat(data.positionSize),
        entry_price: parseFloat(data.entryPrice),
        stop_loss: data.stopLoss ? parseFloat(data.stopLoss) : undefined,
        take_profit: data.takeProfit ? parseFloat(data.takeProfit) : undefined,
        exit_price: data.exitPrice ? parseFloat(data.exitPrice) : undefined,
        pnl: calculatedPnl || 0,
        status: data.status as 'OPEN' | 'CLOSED' | 'CANCELLED',
        notes: data.notes || '',
        attachments,
        entry_date: new Date().toISOString(),
      };

      if (trade?.id) {
        return await updateTrade(trade.id, payload);
      } else {
        return await createTrade(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
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
        // Redirect to login page handled by auth
        setTimeout(() => {
          window.location.href = "/login";
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setIsUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Invalid file type",
            description: "Please upload only image files (JPG, PNG, GIF, etc.)",
            variant: "destructive",
          });
          continue;
        }

        // Upload directly to Supabase storage
        const fileUrl = await uploadFile(file);
        uploadedUrls.push(fileUrl);
      }

      setAttachments(prev => [...prev, ...uploadedUrls]);
      toast({
        title: "✅ Images uploaded successfully!",
        description: `Successfully uploaded ${uploadedUrls.length} image(s). You can now save your trade.`,
        duration: 5000,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const removeAttachment = (indexToRemove: number) => {
    setAttachments(prev => prev.filter((_, index) => index !== indexToRemove));
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
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    data-testid="input-attachments"
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex items-center justify-center gap-2 p-2 cursor-pointer hover:bg-muted/50 rounded transition-colors"
                  >
                    <span>📁</span>
                    <span>{isUploading ? "Uploading..." : "Upload Images"}</span>
                  </label>
                </div>
                
                {attachments.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Uploaded images ({attachments.length}):
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {attachments.map((url, index) => (
                        <div key={index} className="relative group">
                          <SignedImageDisplay
                            imageUrl={url}
                            alt={`Attachment ${index + 1}`}
                            className="w-full h-20 object-cover rounded border"
                            data-testid={`img-attachment-${index}`}
                          />
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            data-testid={`button-remove-attachment-${index}`}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
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
