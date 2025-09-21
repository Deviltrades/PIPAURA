import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { format } from "date-fns";
import { X, Upload, Image as ImageIcon, Trash2 } from "lucide-react";

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
import type { Trade } from "@shared/schema";

const editTradeSchema = z.object({
  instrumentType: z.enum(["FOREX", "INDICES", "CRYPTO"]),
  instrument: z.string().min(1, "Instrument is required"),
  tradeType: z.enum(["BUY", "SELL"]),
  positionSize: z.string().min(1, "Position size is required"),
  entryPrice: z.string().min(1, "Entry price is required"),
  exitPrice: z.string().optional(),
  stopLoss: z.string().optional(),
  takeProfit: z.string().optional(),
  notes: z.string().optional(),
  attachments: z.array(z.string()).optional(),
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

type EditTradeFormData = z.infer<typeof editTradeSchema>;

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

interface EditTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  trade: Trade;
}

export function EditTradeModal({ isOpen, onClose, trade }: EditTradeModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedInstrumentType, setSelectedInstrumentType] = useState<string>(trade.instrumentType || "FOREX");
  const [uploadedImages, setUploadedImages] = useState<string[]>(trade.attachments || []);
  const [isUploading, setIsUploading] = useState(false);

  // Calculate if trade has manual P&L
  const currentPnL = parseFloat(trade.pnl || "0");
  const hasPnLValue = Math.abs(currentPnL) > 0;

  const form = useForm<EditTradeFormData>({
    resolver: zodResolver(editTradeSchema),
    defaultValues: {
      instrumentType: (trade.instrumentType as "FOREX" | "INDICES" | "CRYPTO") || "FOREX",
      instrument: trade.instrument || "",
      tradeType: (trade.tradeType as "BUY" | "SELL") || "BUY",
      positionSize: trade.positionSize || "1.0",
      entryPrice: trade.entryPrice || "",
      exitPrice: trade.exitPrice || "",
      stopLoss: trade.stopLoss || "",
      takeProfit: trade.takeProfit || "",
      notes: trade.notes || "",
      attachments: trade.attachments || [],
      hasPnL: hasPnLValue,
      pnlType: (currentPnL >= 0 ? "profit" : "loss") as "profit" | "loss",
      pnlAmount: hasPnLValue ? Math.abs(currentPnL).toString() : "",
    },
  });

  const editTradeMutation = useMutation({
    mutationFn: async (data: EditTradeFormData) => {
      // Calculate P&L based on user input or automatic calculation
      let calculatedPnL = "0";
      if (data.hasPnL && data.pnlAmount) {
        const amount = parseFloat(data.pnlAmount);
        calculatedPnL = data.pnlType === "loss" ? (-amount).toString() : amount.toString();
      } else if (data.exitPrice && data.entryPrice) {
        // Auto-calculate P&L if exit price is provided
        const entryPrice = parseFloat(data.entryPrice);
        const exitPrice = parseFloat(data.exitPrice);
        const positionSize = parseFloat(data.positionSize);
        
        let pnl = 0;
        if (data.tradeType === "BUY") {
          pnl = (exitPrice - entryPrice) * positionSize;
        } else {
          pnl = (entryPrice - exitPrice) * positionSize;
        }
        calculatedPnL = pnl.toString();
      }

      const tradeData = {
        ...data,
        pnl: calculatedPnL,
        status: "CLOSED", // Always set to CLOSED since we're tracking completed trades only
        attachments: uploadedImages, // Include uploaded images
        // Remove the extra fields that aren't in the backend schema
        hasPnL: undefined,
        pnlType: undefined,
        pnlAmount: undefined,
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

        // Step 1: Get upload URL from server
        const uploadResponse = await apiRequest("POST", "/api/objects/upload");
        const { uploadURL } = await uploadResponse.json();

        // Step 2: Upload file to the signed URL
        const putResponse = await fetch(uploadURL, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });

        if (putResponse.ok) {
          // Step 3: Call the server to set ACL and get normalized path
          const aclResponse = await apiRequest("PUT", "/api/trade-attachments", {
            fileURL: uploadURL
          });
          const { objectPath } = await aclResponse.json();
          uploadedUrls.push(objectPath);
        } else {
          throw new Error('Upload failed');
        }
      }

      setUploadedImages(prev => [...prev, ...uploadedUrls]);
      toast({
        title: "Images uploaded",
        description: `Successfully uploaded ${uploadedUrls.length} image(s)`,
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
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const getInstrumentOptions = () => {
    switch (selectedInstrumentType) {
      case "FOREX":
        return FOREX_INSTRUMENTS;
      case "INDICES":
        return INDICES_INSTRUMENTS;
      case "CRYPTO":
        return CRYPTO_INSTRUMENTS;
      default:
        return FOREX_INSTRUMENTS;
    }
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
              {/* Instrument Type */}
              <FormField
                control={form.control}
                name="instrumentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instrument Type</FormLabel>
                    <Select 
                      value={field.value} 
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedInstrumentType(value);
                        form.setValue("instrument", ""); // Reset instrument when type changes
                      }}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-instrument-type">
                          <SelectValue placeholder="Select instrument type" />
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
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger data-testid="select-instrument">
                          <SelectValue placeholder="Select instrument" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getInstrumentOptions().map((instrument) => (
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

              {/* Trade Type and Position Size */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tradeType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trade Type</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-trade-type">
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
                        <Input
                          type="text"
                          placeholder="1.0"
                          className="bg-background border-input"
                          data-testid="input-position-size"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Entry Price and Exit Price */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="entryPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Entry Price</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="120.000"
                          className="bg-background border-input"
                          data-testid="input-entry-price"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="exitPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exit Price (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="125.000"
                          className="bg-background border-input"
                          data-testid="input-exit-price"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Stop Loss and Take Profit */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="stopLoss"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stop Loss (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="115.000"
                          className="bg-background border-input"
                          data-testid="input-stop-loss"
                          {...field}
                        />
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
                      <FormLabel>Take Profit (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="130.000"
                          className="bg-background border-input"
                          data-testid="input-take-profit"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* P&L Section */}
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <FormField
                    control={form.control}
                    name="hasPnL"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-has-pnl"
                          />
                        </FormControl>
                        <Label className="text-sm font-medium">
                          Set Profit/Loss Manually
                        </Label>
                      </FormItem>
                    )}
                  />
                </div>
                
                {form.watch("hasPnL") && (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="pnlType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Profit/Loss Type</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger data-testid="select-pnl-type">
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

                    <FormField
                      control={form.control}
                      name="pnlAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="500.00"
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
                )}
              </div>

              {/* Trade Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trade Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any notes about this trade..."
                        className="resize-none bg-background border-input min-h-20"
                        data-testid="textarea-notes"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Image Upload Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Attached Images</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      id="image-upload-edit"
                      disabled={isUploading}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('image-upload-edit')?.click()}
                      disabled={isUploading}
                      className="h-8"
                    >
                      {isUploading ? (
                        <>
                          <Upload className="w-3 h-3 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-3 h-3 mr-2" />
                          Add Images
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Uploaded Images Display */}
                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {uploadedImages.map((imageUrl, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={imageUrl}
                          alt={`Trade attachment ${index + 1}`}
                          className="w-full h-20 object-cover rounded border bg-gray-100"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            setUploadedImages(prev => prev.filter((_, i) => i !== index));
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {uploadedImages.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Upload screenshots, charts, or analysis images</p>
                    <p className="text-xs">Supports JPG, PNG, GIF formats</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={editTradeMutation.isPending}
                className="min-w-[100px]"
                data-testid="button-update-trade"
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