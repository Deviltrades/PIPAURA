import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import Tesseract from "tesseract.js";
import { Loader2, Upload, X, FileImage, Trash2, CheckCircle, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";

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
import { createTrade, getTradeAccounts, updatePropFirmMetrics, getPropFirmTrackerByAccount } from "@/lib/supabase-service";
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
  notes?: string;
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
  const [allParsedTrades, setAllParsedTrades] = useState<ParsedTradeData[]>([]); // Store all parsed trades
  const [currentTradeIndex, setCurrentTradeIndex] = useState(0); // Current trade being reviewed
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
        // DISABLED: Supabase PostgREST schema cache issue - columns exist but API doesn't recognize them yet
        // swap: data.swap ? parseFloat(data.swap) : undefined,
        // commission: data.commission ? parseFloat(data.commission) : undefined,
        status: (data.exitPrice ? 'CLOSED' : 'OPEN') as 'CLOSED' | 'OPEN',
        notes: data.notes || 'Uploaded via OCR AI',
      };

      return createTrade(tradeData);
    },
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      
      // Update prop firm metrics if this is a prop firm account
      if (variables.account_id) {
        try {
          const tracker = await getPropFirmTrackerByAccount(variables.account_id);
          if (tracker) {
            await updatePropFirmMetrics(variables.account_id);
            queryClient.invalidateQueries({ queryKey: ['prop-firm-trackers'] });
          }
        } catch (error) {
          console.error('Failed to update prop firm metrics:', error);
        }
      }
      
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

    // Extract lot size - MT4 format: "sell 5" or "buy 0.01"
    const lotMatch = cleanText.match(/(?:buy|sell)\s+([0-9]+\.?[0-9]*)/i) ||
                     cleanText.match(/(?:lot|volume|size|position\s*size)[:\s]*([0-9]+\.?[0-9]*)/i) ||
                     cleanText.match(/\b([0-9]+\.?[0-9]+)\s*(?:lot|volume)/i);
    if (lotMatch) {
      parsed.lotSize = lotMatch[1];
    }

    // Extract entry/exit prices - MT4 format: "1.39656 — 1.39557 354.69" or "0.86921 — 0.86619 2 026.45" (with spaces in P&L)
    const priceLineMatch = cleanText.match(/([0-9]+\.?[0-9]+)\s*[—\-–]\s*([0-9]+\.?[0-9]+)\s+([0-9\s]+\.?[0-9]+)/);
    if (priceLineMatch) {
      parsed.entryPrice = priceLineMatch[1];
      parsed.exitPrice = priceLineMatch[2];
      parsed.profit = priceLineMatch[3].replace(/\s/g, ''); // Remove spaces from P&L (e.g., "2 026.45" → "2026.45")
    } else {
      // Fallback to individual patterns
      const entryMatch = cleanText.match(/(?:entry|open|price)[:\s]*([0-9]+\.?[0-9]*)/i) ||
                         cleanText.match(/entry\s*price[:\s]*([0-9]+\.?[0-9]*)/i);
      if (entryMatch) {
        parsed.entryPrice = entryMatch[1];
      }

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

    // Extract take profit - includes "IE" which OCR sometimes misreads from "T/P:"
    const tpMatch = cleanText.match(/(?:t\.?\/?p|take\s*profit|tp|ie)[:\s]*([0-9]+\.?[0-9]*)/i);
    if (tpMatch) {
      parsed.takeProfit = tpMatch[1];
    }

    // Extract stop loss
    const slMatch = cleanText.match(/(?:s\.?\/?l|stop\s*loss|sl)[:\s]*([0-9]+\.?[0-9]*)/i);
    if (slMatch) {
      parsed.stopLoss = slMatch[1];
    }

    // Extract times - MT4 format: "2025.10.06 16:15:08 — 2025.10.09 09:33:39"
    const timeLineMatch = cleanText.match(/(\d{4}[.\-\/]\d{2}[.\-\/]\d{2}\s+\d{2}:\d{2}:\d{2})\s*[—\-–]\s*(\d{4}[.\-\/]\d{2}[.\-\/]\d{2}\s+\d{2}:\d{2}:\d{2})/);
    if (timeLineMatch) {
      const entryDateStr = timeLineMatch[1].replace(/\./g, '-');
      const exitDateStr = timeLineMatch[2].replace(/\./g, '-');
      try {
        parsed.entryTime = new Date(entryDateStr).toISOString();
        parsed.exitTime = new Date(exitDateStr).toISOString();
      } catch (e) {
        console.error('Failed to parse times:', entryDateStr, exitDateStr);
      }
    } else {
      // Fallback to individual patterns
      const entryTimeMatch = cleanText.match(/(?:open\s*time|entry\s*time)[:\s]*(\d{4}[.\-\/]\d{2}[.\-\/]\d{2}\s+\d{2}:\d{2}(?::\d{2})?)/i);
      if (entryTimeMatch) {
        const dateStr = entryTimeMatch[1].replace(/\./g, '-');
        try {
          parsed.entryTime = new Date(dateStr).toISOString();
        } catch (e) {
          console.error('Failed to parse entry time:', dateStr);
        }
      }

      const exitTimeMatch = cleanText.match(/(?:close\s*time|exit\s*time)[:\s]*(\d{4}[.\-\/]\d{2}[.\-\/]\d{2}\s+\d{2}:\d{2}(?::\d{2})?)/i);
      if (exitTimeMatch) {
        const dateStr = exitTimeMatch[1].replace(/\./g, '-');
        try {
          parsed.exitTime = new Date(dateStr).toISOString();
        } catch (e) {
          console.error('Failed to parse exit time:', dateStr);
        }
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
      // Use Web Worker for better performance (non-blocking)
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
        // Use worker to prevent UI blocking
        workerOptions: {
          workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/worker.min.js',
          corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5/tesseract-core.wasm.js',
        }
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
    
    // Parse EACH screenshot separately (not combined!)
    const parsedTrades: ParsedTradeData[] = [];
    
    for (let i = 0; i < extractedTexts.length; i++) {
      const text = extractedTexts[i];
      console.log(`OCR Extracted Text (Trade ${i + 1}):`, text);
      
      const parsed = parseOCRText(text);
      console.log(`Parsed Trade Data (Trade ${i + 1}):`, parsed);
      parsedTrades.push(parsed);
    }

    if (parsedTrades.length === 0) {
      toast({
        title: "No text extracted",
        description: "Could not extract text from the images. Please ensure the images contain readable text.",
        variant: "destructive",
      });
      return;
    }

    setAllParsedTrades(parsedTrades);
    setCurrentTradeIndex(0);
    
    // Pre-fill form with first trade's data
    const firstTrade = parsedTrades[0];
    if (firstTrade.symbol) form.setValue('instrument', firstTrade.symbol);
    if (firstTrade.tradeType) form.setValue('tradeType', firstTrade.tradeType);
    if (firstTrade.lotSize) form.setValue('positionSize', firstTrade.lotSize);
    if (firstTrade.entryPrice) form.setValue('entryPrice', firstTrade.entryPrice);
    if (firstTrade.exitPrice) form.setValue('exitPrice', firstTrade.exitPrice);
    if (firstTrade.stopLoss) form.setValue('stopLoss', firstTrade.stopLoss);
    if (firstTrade.takeProfit) form.setValue('takeProfit', firstTrade.takeProfit);
    if (firstTrade.entryTime) form.setValue('entryTime', firstTrade.entryTime);
    if (firstTrade.exitTime) form.setValue('exitTime', firstTrade.exitTime);
    if (firstTrade.profit) form.setValue('pnl', firstTrade.profit);
    if (firstTrade.swap) form.setValue('swap', firstTrade.swap);
    if (firstTrade.commission) form.setValue('commission', firstTrade.commission);

    setParsedData(firstTrade);
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
    setAllParsedTrades([]);
    setCurrentTradeIndex(0);
    form.reset();
    onClose();
  };

  // Navigate to next trade
  const handleNextTrade = () => {
    const formData = form.getValues();
    
    // Update current trade with form data
    const updatedTrades = [...allParsedTrades];
    updatedTrades[currentTradeIndex] = {
      ...updatedTrades[currentTradeIndex],
      symbol: formData.instrument,
      tradeType: formData.tradeType as 'BUY' | 'SELL',
      lotSize: formData.positionSize,
      entryPrice: formData.entryPrice,
      exitPrice: formData.exitPrice,
      stopLoss: formData.stopLoss,
      takeProfit: formData.takeProfit,
      entryTime: formData.entryTime,
      exitTime: formData.exitTime,
      profit: formData.pnl,
      swap: formData.swap,
      commission: formData.commission,
      notes: formData.notes,
    };
    setAllParsedTrades(updatedTrades);

    // Move to next trade
    const nextIndex = currentTradeIndex + 1;
    setCurrentTradeIndex(nextIndex);
    
    // Load next trade data into form
    const nextTrade = updatedTrades[nextIndex];
    form.reset();
    if (nextTrade.symbol) form.setValue('instrument', nextTrade.symbol);
    if (nextTrade.tradeType) form.setValue('tradeType', nextTrade.tradeType);
    if (nextTrade.lotSize) form.setValue('positionSize', nextTrade.lotSize);
    if (nextTrade.entryPrice) form.setValue('entryPrice', nextTrade.entryPrice);
    if (nextTrade.exitPrice) form.setValue('exitPrice', nextTrade.exitPrice);
    if (nextTrade.stopLoss) form.setValue('stopLoss', nextTrade.stopLoss);
    if (nextTrade.takeProfit) form.setValue('takeProfit', nextTrade.takeProfit);
    if (nextTrade.entryTime) form.setValue('entryTime', nextTrade.entryTime);
    if (nextTrade.exitTime) form.setValue('exitTime', nextTrade.exitTime);
    if (nextTrade.profit) form.setValue('pnl', nextTrade.profit);
    if (nextTrade.swap) form.setValue('swap', nextTrade.swap);
    if (nextTrade.commission) form.setValue('commission', nextTrade.commission);
    if (nextTrade.notes) form.setValue('notes', nextTrade.notes);
    
    setParsedData(nextTrade);
  };

  // Navigate to previous trade
  const handlePreviousTrade = () => {
    const formData = form.getValues();
    
    // Update current trade with form data
    const updatedTrades = [...allParsedTrades];
    updatedTrades[currentTradeIndex] = {
      ...updatedTrades[currentTradeIndex],
      symbol: formData.instrument,
      tradeType: formData.tradeType as 'BUY' | 'SELL',
      lotSize: formData.positionSize,
      entryPrice: formData.entryPrice,
      exitPrice: formData.exitPrice,
      stopLoss: formData.stopLoss,
      takeProfit: formData.takeProfit,
      entryTime: formData.entryTime,
      exitTime: formData.exitTime,
      profit: formData.pnl,
      swap: formData.swap,
      commission: formData.commission,
      notes: formData.notes,
    };
    setAllParsedTrades(updatedTrades);

    // Move to previous trade
    const prevIndex = currentTradeIndex - 1;
    setCurrentTradeIndex(prevIndex);
    
    // Load previous trade data into form
    const prevTrade = updatedTrades[prevIndex];
    form.reset();
    if (prevTrade.symbol) form.setValue('instrument', prevTrade.symbol);
    if (prevTrade.tradeType) form.setValue('tradeType', prevTrade.tradeType);
    if (prevTrade.lotSize) form.setValue('positionSize', prevTrade.lotSize);
    if (prevTrade.entryPrice) form.setValue('entryPrice', prevTrade.entryPrice);
    if (prevTrade.exitPrice) form.setValue('exitPrice', prevTrade.exitPrice);
    if (prevTrade.stopLoss) form.setValue('stopLoss', prevTrade.stopLoss);
    if (prevTrade.takeProfit) form.setValue('takeProfit', prevTrade.takeProfit);
    if (prevTrade.entryTime) form.setValue('entryTime', prevTrade.entryTime);
    if (prevTrade.exitTime) form.setValue('exitTime', prevTrade.exitTime);
    if (prevTrade.profit) form.setValue('pnl', prevTrade.profit);
    if (prevTrade.swap) form.setValue('swap', prevTrade.swap);
    if (prevTrade.commission) form.setValue('commission', prevTrade.commission);
    if (prevTrade.notes) form.setValue('notes', prevTrade.notes);
    
    setParsedData(prevTrade);
  };

  const onSubmit = async (data: ReviewTradeFormData) => {
    // Update current trade with final form data
    const updatedTrades = [...allParsedTrades];
    updatedTrades[currentTradeIndex] = {
      ...updatedTrades[currentTradeIndex],
      symbol: data.instrument,
      tradeType: data.tradeType as 'BUY' | 'SELL',
      lotSize: data.positionSize,
      entryPrice: data.entryPrice,
      exitPrice: data.exitPrice,
      stopLoss: data.stopLoss,
      takeProfit: data.takeProfit,
      entryTime: data.entryTime,
      exitTime: data.exitTime,
      profit: data.pnl,
      swap: data.swap,
      commission: data.commission,
      notes: data.notes,
    };

    // Upload all trades to database
    let successCount = 0;
    const failedTrades: string[] = [];
    
    for (let i = 0; i < updatedTrades.length; i++) {
      const trade = updatedTrades[i];
      try {
        const tradeData = {
          account_id: data.account_id,
          instrument: trade.symbol || '',
          instrument_type: 'FOREX' as const,
          trade_type: trade.tradeType || 'BUY',
          position_size: trade.lotSize ? parseFloat(trade.lotSize) : 0.01,
          entry_price: trade.entryPrice ? parseFloat(trade.entryPrice) : 0,
          exit_price: trade.exitPrice ? parseFloat(trade.exitPrice) : undefined,
          stop_loss: trade.stopLoss ? parseFloat(trade.stopLoss) : undefined,
          take_profit: trade.takeProfit ? parseFloat(trade.takeProfit) : undefined,
          entry_date: trade.entryTime || new Date().toISOString(),
          exit_date: trade.exitTime || undefined,
          pnl: trade.profit ? parseFloat(trade.profit) : undefined,
          status: (trade.exitPrice ? 'CLOSED' : 'OPEN') as 'CLOSED' | 'OPEN',
          notes: trade.notes || 'Uploaded via OCR AI',
        };

        await createTrade(tradeData);
        successCount++;
      } catch (error) {
        console.error(`Failed to upload trade ${i + 1}:`, error);
        failedTrades.push(`Trade ${i + 1} (${trade.symbol || 'Unknown'})`);
      }
    }

    queryClient.invalidateQueries({ queryKey: ["trades"] });
    queryClient.invalidateQueries({ queryKey: ["analytics"] });
    
    // Update prop firm metrics if this is a prop firm account
    if (data.account_id && successCount > 0) {
      try {
        const tracker = await getPropFirmTrackerByAccount(data.account_id);
        if (tracker) {
          await updatePropFirmMetrics(data.account_id);
          queryClient.invalidateQueries({ queryKey: ['prop-firm-trackers'] });
        }
      } catch (error) {
        console.error('Failed to update prop firm metrics:', error);
      }
    }
    
    // Only close modal if ALL trades succeeded
    if (successCount === updatedTrades.length) {
      toast({
        title: `✅ All ${successCount} trades logged successfully`,
        description: "All trades have been added to your journal",
      });
      handleClose();
    } else if (successCount > 0) {
      // Some succeeded, some failed - show warning and keep modal open
      toast({
        title: `⚠️ Partial success: ${successCount} of ${updatedTrades.length} trades saved`,
        description: `Failed to save: ${failedTrades.join(', ')}. Please check your data and try again.`,
        variant: "destructive",
      });
    } else {
      // All failed - show error and keep modal open
      toast({
        title: "❌ Upload failed",
        description: "None of the trades could be saved. Please check your data and try again.",
        variant: "destructive",
      });
    }
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
                              {account.broker_name} ({account.account_name})
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

              {/* Multi-trade navigation */}
              {allParsedTrades.length > 0 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <p className="text-sm text-gray-500">
                    Trade {currentTradeIndex + 1} of {allParsedTrades.length}
                  </p>
                  <div className="flex gap-2">
                    {/* Previous button */}
                    {currentTradeIndex > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handlePreviousTrade}
                        data-testid="button-previous-trade"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                    )}
                    
                    {/* Next button (only if not last trade) */}
                    {currentTradeIndex < allParsedTrades.length - 1 && (
                      <Button
                        type="button"
                        onClick={handleNextTrade}
                        data-testid="button-next-trade"
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    )}
                    
                    {/* Upload All button (only on last trade) */}
                    {currentTradeIndex === allParsedTrades.length - 1 && (
                      <Button
                        type="submit"
                        disabled={createTradeMutation.isPending}
                        data-testid="button-upload-all"
                      >
                        {createTradeMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          `Upload All ${allParsedTrades.length} Trades`
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
