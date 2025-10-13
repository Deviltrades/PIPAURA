import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import Tesseract from "tesseract.js";
import { Loader2, Upload, X, FileImage, Trash2, CheckCircle, AlertCircle } from "lucide-react";

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
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { createTrade, getTradeAccounts } from "@/lib/supabase-service";
import { useSelectedAccount } from "@/hooks/use-selected-account";

interface OCRUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UploadedImage {
  file: File;
  preview: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  extractedText?: string;
  error?: string;
}

interface ParsedTradeData {
  symbol?: string;
  tradeType?: 'BUY' | 'SELL';
  lotSize?: string;
  entryPrice?: string;
  exitPrice?: string;
  profit?: string;
  swap?: string;
  commission?: string;
  takeProfit?: string;
  stopLoss?: string;
  entryTime?: string;
  exitTime?: string;
  rawText?: string;
}

const reviewTradeSchema = z.object({
  account_id: z.string().min(1, "Account is required"),
  instrument: z.string().min(1, "Symbol is required"),
  tradeType: z.enum(["BUY", "SELL"]),
  positionSize: z.string().optional(),
  entryPrice: z.string().optional(),
  exitPrice: z.string().optional(),
  stopLoss: z.string().optional(),
  takeProfit: z.string().optional(),
  entryTime: z.string().optional(),
  exitTime: z.string().optional(),
  pnl: z.string().optional(),
  swap: z.string().optional(),
  commission: z.string().optional(),
  notes: z.string().optional(),
});

type ReviewTradeFormData = z.infer<typeof reviewTradeSchema>;

export function OCRUploadModal({ isOpen, onClose }: OCRUploadModalProps) {
  const [selectedAccount] = useSelectedAccount();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [currentStep, setCurrentStep] = useState<'upload' | 'review'>('upload');
  const [parsedData, setParsedData] = useState<ParsedTradeData | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: accounts = [] } = useQuery({
    queryKey: ["/api/accounts"],
    queryFn: getTradeAccounts,
  });

  const form = useForm<ReviewTradeFormData>({
    resolver: zodResolver(reviewTradeSchema),
    defaultValues: {
      account_id: selectedAccount === "all" ? "" : selectedAccount,
      tradeType: "BUY",
    },
  });

  const createTradeMutation = useMutation({
    mutationFn: async (data: ReviewTradeFormData) => {
      const tradeData = {
        account_id: data.account_id,
        instrument: data.instrument,
        instrument_type: 'FOREX' as const,
        trade_type: data.tradeType,
        position_size: data.positionSize ? parseFloat(data.positionSize) : 0.01,
        entry_price: data.entryPrice ? parseFloat(data.entryPrice) : 0,
        exit_price: data.exitPrice ? parseFloat(data.exitPrice) : undefined,
        stop_loss: data.stopLoss ? parseFloat(data.stopLoss) : undefined,
        take_profit: data.takeProfit ? parseFloat(data.takeProfit) : undefined,
        entry_date: data.entryTime || new Date().toISOString(),
        exit_date: data.exitTime || undefined,
        pnl: data.pnl ? parseFloat(data.pnl) : undefined,
        swap: data.swap ? parseFloat(data.swap) : undefined,
        commission: data.commission ? parseFloat(data.commission) : undefined,
        status: (data.exitPrice ? 'CLOSED' : 'OPEN') as 'CLOSED' | 'OPEN',
        notes: data.notes || 'Imported via OCR Screenshot',
      };

      return createTrade(tradeData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      toast({
        title: "✅ Trade logged automatically from screenshot",
        description: "Trade has been added to your journal",
      });
      handleClose();
    },
    onError: (error) => {
      toast({
        title: "Error saving trade",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(
      (file) => file.type === 'image/png' || file.type === 'image/jpeg'
    );

    if (validFiles.length === 0) {
      toast({
        title: "Invalid file type",
        description: "Please select PNG or JPG images only",
        variant: "destructive",
      });
      return;
    }

    const newImages: UploadedImage[] = validFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      status: 'pending',
      progress: 0,
    }));

    setImages((prev) => [...prev, ...newImages]);
  };

  const parseOCRText = (text: string): ParsedTradeData => {
    const cleanText = text.replace(/\s+/g, ' ').trim();
    const parsed: ParsedTradeData = {
      rawText: text, // Store raw text for debugging
    };

    // Extract symbol/pair (e.g., XAUUSD, EURUSD, etc.)
    const symbolMatch = cleanText.match(/([A-Z]{3,6}USD|USD[A-Z]{3,6}|XAU[A-Z]{3}|[A-Z]{3}[A-Z]{3})/i);
    if (symbolMatch) {
      parsed.symbol = symbolMatch[1].toUpperCase();
    }

    // Extract trade type (BUY/SELL)
    const typeMatch = cleanText.match(/\b(buy|sell)\b/i);
    if (typeMatch) {
      parsed.tradeType = typeMatch[1].toUpperCase() as 'BUY' | 'SELL';
    }

    // Extract lot size (e.g., 0.01, 1.00, etc.) - try multiple patterns
    const lotMatch = cleanText.match(/(?:lot|volume|size|position\s*size)[:\s]*([0-9]+\.?[0-9]*)/i) ||
                     cleanText.match(/\b([0-9]+\.?[0-9]+)\s*(?:lot|volume)/i);
    if (lotMatch) {
      parsed.lotSize = lotMatch[1];
    }

    // Extract entry price - try multiple patterns
    const entryMatch = cleanText.match(/(?:entry|open|price)[:\s]*([0-9]+\.?[0-9]*)/i) ||
                       cleanText.match(/entry\s*price[:\s]*([0-9]+\.?[0-9]*)/i);
    if (entryMatch) {
      parsed.entryPrice = entryMatch[1];
    }

    // Extract exit price - try multiple patterns
    const exitMatch = cleanText.match(/(?:exit|close)[:\s]*price[:\s]*([0-9]+\.?[0-9]*)/i) ||
                      cleanText.match(/(?:exit|close)[:\s]*([0-9]+\.?[0-9]*)/i);
    if (exitMatch) {
      parsed.exitPrice = exitMatch[1];
    }

    // Extract profit/loss - try multiple patterns including currency symbols
    const profitMatch = cleanText.match(/(?:profit|p\/l|pnl|p&l)[:\s]*\$?\s*(-?[0-9]+\.?[0-9]*)/i) ||
                       cleanText.match(/\$\s*(-?[0-9]+\.?[0-9]*)/);
    if (profitMatch) {
      parsed.profit = profitMatch[1];
    }

    // Extract swap
    const swapMatch = cleanText.match(/swap[:\s]*(-?[0-9]+\.?[0-9]*)/i);
    if (swapMatch) {
      parsed.swap = swapMatch[1];
    }

    // Extract commission
    const commissionMatch = cleanText.match(/(?:commission|charges?|fee)[:\s]*(-?[0-9]+\.?[0-9]*)/i);
    if (commissionMatch) {
      parsed.commission = commissionMatch[1];
    }

    // Extract take profit
    const tpMatch = cleanText.match(/(?:t\.?\/?p|take\s*profit|tp)[:\s]*([0-9]+\.?[0-9]*)/i);
    if (tpMatch) {
      parsed.takeProfit = tpMatch[1];
    }

    // Extract stop loss
    const slMatch = cleanText.match(/(?:s\.?\/?l|stop\s*loss|sl)[:\s]*([0-9]+\.?[0-9]*)/i);
    if (slMatch) {
      parsed.stopLoss = slMatch[1];
    }

    // Extract entry time (e.g., 2025.10.06 16:15:08)
    const entryTimeMatch = cleanText.match(/(?:open\s*time|entry\s*time)[:\s]*(\d{4}[.\-\/]\d{2}[.\-\/]\d{2}\s+\d{2}:\d{2}(?::\d{2})?)/i);
    if (entryTimeMatch) {
      const dateStr = entryTimeMatch[1].replace(/\./g, '-');
      try {
        parsed.entryTime = new Date(dateStr).toISOString();
      } catch (e) {
        console.error('Failed to parse entry time:', dateStr);
      }
    }

    // Extract exit time
    const exitTimeMatch = cleanText.match(/(?:close\s*time|exit\s*time)[:\s]*(\d{4}[.\-\/]\d{2}[.\-\/]\d{2}\s+\d{2}:\d{2}(?::\d{2})?)/i);
    if (exitTimeMatch) {
      const dateStr = exitTimeMatch[1].replace(/\./g, '-');
      try {
        parsed.exitTime = new Date(dateStr).toISOString();
      } catch (e) {
        console.error('Failed to parse exit time:', dateStr);
      }
    }

    return parsed;
  };

  const processImage = async (index: number): Promise<string | null> => {
    const image = images[index];
    if (!image || image.status !== 'pending') return null;

    setImages((prev) =>
      prev.map((img, i) =>
        i === index ? { ...img, status: 'processing' as const, progress: 0 } : img
      )
    );

    try {
      const result = await Tesseract.recognize(image.file, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            const progress = Math.round(m.progress * 100);
            setImages((prev) =>
              prev.map((img, i) =>
                i === index ? { ...img, progress } : img
              )
            );
          }
        },
      });

      const extractedText = result.data.text;
      
      setImages((prev) =>
        prev.map((img, i) =>
          i === index
            ? { ...img, status: 'completed' as const, progress: 100, extractedText }
            : img
        )
      );

      return extractedText;
    } catch (error) {
      setImages((prev) =>
        prev.map((img, i) =>
          i === index
            ? {
                ...img,
                status: 'error' as const,
                error: error instanceof Error ? error.message : 'OCR failed',
              }
            : img
        )
      );
      toast({
        title: "OCR Error",
        description: `Failed to process image ${index + 1}`,
        variant: "destructive",
      });
      return null;
    }
  };

  const processAllImages = async (): Promise<string[]> => {
    const extractedTexts: string[] = [];
    
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      
      // If already completed, use the stored text
      if (image.status === 'completed' && image.extractedText) {
        extractedTexts.push(image.extractedText);
      }
      // If pending, process it
      else if (image.status === 'pending') {
        const text = await processImage(i);
        if (text) {
          extractedTexts.push(text);
        }
      }
    }
    
    return extractedTexts;
  };

  const handleProceedToReview = async () => {
    const extractedTexts = await processAllImages();
    
    // Combine all extracted text
    const allText = extractedTexts.join('\n\n');

    console.log('OCR Extracted Text:', allText);

    if (!allText || allText.trim().length === 0) {
      toast({
        title: "No text extracted",
        description: "Could not extract text from the images. Please ensure the image contains readable text.",
        variant: "destructive",
      });
      return;
    }

    const parsed = parseOCRText(allText);
    console.log('Parsed Trade Data:', parsed);
    setParsedData(parsed);

    // Pre-fill form with parsed data
    if (parsed.symbol) form.setValue('instrument', parsed.symbol);
    if (parsed.tradeType) form.setValue('tradeType', parsed.tradeType);
    if (parsed.lotSize) form.setValue('positionSize', parsed.lotSize);
    if (parsed.entryPrice) form.setValue('entryPrice', parsed.entryPrice);
    if (parsed.exitPrice) form.setValue('exitPrice', parsed.exitPrice);
    if (parsed.stopLoss) form.setValue('stopLoss', parsed.stopLoss);
    if (parsed.takeProfit) form.setValue('takeProfit', parsed.takeProfit);
    if (parsed.entryTime) form.setValue('entryTime', parsed.entryTime);
    if (parsed.exitTime) form.setValue('exitTime', parsed.exitTime);
    if (parsed.profit) form.setValue('pnl', parsed.profit);
    if (parsed.swap) form.setValue('swap', parsed.swap);
    if (parsed.commission) form.setValue('commission', parsed.commission);

    // Check if at least some trade-relevant fields were extracted (exclude rawText)
    const tradeFields = { ...parsed };
    delete tradeFields.rawText;
    const hasAnyData = Object.values(tradeFields).some(value => value !== undefined);
    
    if (!hasAnyData) {
      toast({
        title: "No trade data found",
        description: "Could not identify trade fields in the extracted text. You can still manually enter the data in the next step.",
        variant: "default",
      });
    }

    setCurrentStep('review');
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const newImages = prev.filter((_, i) => i !== index);
      // Clean up object URL
      URL.revokeObjectURL(prev[index].preview);
      return newImages;
    });
  };

  const handleClose = () => {
    // Clean up object URLs
    images.forEach((img) => URL.revokeObjectURL(img.preview));
    setImages([]);
    setCurrentStep('upload');
    setParsedData(null);
    form.reset();
    onClose();
  };

  const onSubmit = (data: ReviewTradeFormData) => {
    createTradeMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {currentStep === 'upload' ? 'Upload Trade Screenshot (AI-Read)' : 'Review & Confirm Trade'}
          </DialogTitle>
          <DialogDescription>
            {currentStep === 'upload'
              ? 'Upload trade screenshots (.png or .jpg) for AI-powered text extraction'
              : 'Review the extracted trade data and make any necessary corrections'}
          </DialogDescription>
        </DialogHeader>

        {currentStep === 'upload' ? (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
              <FileImage className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Click to upload or drag and drop trade screenshots
              </p>
              <Input
                type="file"
                accept=".png,.jpg,.jpeg"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="screenshot-upload"
                data-testid="input-screenshot-upload"
              />
              <label htmlFor="screenshot-upload">
                <Button type="button" variant="outline" asChild data-testid="button-select-screenshots">
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Select Screenshots
                  </span>
                </Button>
              </label>
            </div>

            {images.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium">Uploaded Screenshots ({images.length})</h3>
                {images.map((image, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={image.preview}
                          alt={`Screenshot ${index + 1}`}
                          className="w-20 h-20 object-cover rounded"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{image.file.name}</p>
                          <div className="flex items-center gap-2 mt-2">
                            {image.status === 'pending' && (
                              <Badge variant="secondary">Pending</Badge>
                            )}
                            {image.status === 'processing' && (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <Progress value={image.progress} className="flex-1" />
                                <span className="text-sm">{image.progress}%</span>
                              </>
                            )}
                            {image.status === 'completed' && (
                              <>
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="text-sm text-green-600">Completed</span>
                              </>
                            )}
                            {image.status === 'error' && (
                              <>
                                <AlertCircle className="h-4 w-4 text-red-500" />
                                <span className="text-sm text-red-600">{image.error}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeImage(index)}
                          data-testid={`button-remove-image-${index}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose} data-testid="button-cancel-upload">
                Cancel
              </Button>
              <Button
                onClick={handleProceedToReview}
                disabled={images.length === 0 || images.some((img) => img.status === 'processing')}
                data-testid="button-proceed-review"
              >
                {images.some((img) => img.status === 'processing') ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Process & Review'
                )}
              </Button>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {parsedData?.rawText && (
                <Card className="bg-muted/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Extracted Text (Debug Info)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-black/20 p-3 rounded overflow-auto max-h-32">
                      {parsedData.rawText}
                    </pre>
                    <p className="text-xs text-red-500 dark:text-red-400 mt-2">
                      The AI extracted this text from your screenshot. Review the fields below and make corrections if needed.
                    </p>
                  </CardContent>
                </Card>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="account_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trading Account *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-review-account">
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {accounts.map((account: any) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.account_name} ({account.account_type === 'proprietary_firm' ? 'Prop Firm' : account.account_type === 'live_personal' ? 'Live Personal' : account.account_type === 'live_company' ? 'Live Company' : 'Demo'})
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
                  name="instrument"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Symbol *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., XAUUSD" data-testid="input-review-symbol" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tradeType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trade Type *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-review-type">
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

                <FormField
                  control={form.control}
                  name="positionSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lot Size</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., 0.01" data-testid="input-review-lot" />
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
                        <Input {...field} placeholder="e.g., 1.2345" data-testid="input-review-entry" />
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
                      <FormLabel>Exit Price</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., 1.2350" data-testid="input-review-exit" />
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
                        <Input {...field} placeholder="e.g., 1.2300" data-testid="input-review-sl" />
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
                        <Input {...field} placeholder="e.g., 1.2400" data-testid="input-review-tp" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pnl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profit/Loss</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., 50.00" data-testid="input-review-pnl" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="swap"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Swap</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., -2.50" data-testid="input-review-swap" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="commission"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Commission</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., -5.00" data-testid="input-review-commission" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="entryTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Entry Time</FormLabel>
                      <FormControl>
                        <Input {...field} type="datetime-local" data-testid="input-review-entry-time" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="exitTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exit Time</FormLabel>
                      <FormControl>
                        <Input {...field} type="datetime-local" data-testid="input-review-exit-time" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Add any additional notes..." data-testid="textarea-review-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep('upload')}
                  data-testid="button-back-upload"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={createTradeMutation.isPending}
                  data-testid="button-confirm-save"
                >
                  {createTradeMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Confirm & Save'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
