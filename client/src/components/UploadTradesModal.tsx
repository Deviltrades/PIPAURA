import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, CheckCircle, AlertCircle, FileText } from "lucide-react";
import Papa from "papaparse";
import { useToast } from "@/hooks/use-toast";
import { getTradeAccounts, uploadTrades } from "@/lib/supabase-service";
import type { TradeAccount } from "@shared/schema";

interface UploadTradesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedTrade {
  ticket_id?: string;
  pair: string;
  type: string;
  entry_price?: string;
  exit_price?: string;
  stop_loss?: string;
  take_profit?: string;
  lot_size?: string;
  profit?: string;
  open_date?: string;
  open_time?: string;
  close_date?: string;
  close_time?: string;
}

interface MappedTrade {
  ticket_id?: string;
  instrument: string;
  trade_type: "BUY" | "SELL";
  position_size: number;
  entry_price: number;
  exit_price?: number;
  stop_loss?: number;
  take_profit?: number;
  pnl?: number;
  entry_date?: string;
  exit_date?: string;
  status: "OPEN" | "CLOSED";
}

export function UploadTradesModal({ isOpen, onClose }: UploadTradesModalProps) {
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedTrades, setParsedTrades] = useState<MappedTrade[]>([]);
  const [previewTrades, setPreviewTrades] = useState<MappedTrade[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: accounts = [] } = useQuery<TradeAccount[]>({
    queryKey: ["trade-accounts"],
    queryFn: getTradeAccounts,
  });

  const activeAccounts = accounts.filter((acc) => acc.is_active);

  const determineInstrumentType = (instrument: string): "FOREX" | "INDICES" | "CRYPTO" | "FUTURES" | "STOCKS" => {
    const upper = instrument.toUpperCase();
    
    if (upper.includes("USD") || upper.includes("EUR") || upper.includes("GBP") || 
        upper.includes("JPY") || upper.includes("AUD") || upper.includes("CAD") ||
        upper.includes("CHF") || upper.includes("NZD")) {
      return "FOREX";
    }
    
    if (upper.includes("BTC") || upper.includes("ETH") || upper.includes("USDT") || 
        upper.includes("BNB") || upper.includes("XRP")) {
      return "CRYPTO";
    }
    
    if (upper.includes("US30") || upper.includes("NAS100") || upper.includes("SPX500") || 
        upper.includes("GER40") || upper.includes("UK100") || upper.includes("JPN225")) {
      return "INDICES";
    }
    
    return "FOREX";
  };

  const parseCSV = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedData = results.data as ParsedTrade[];
        const mappedTrades: MappedTrade[] = [];
        const parseErrors: string[] = [];

        parsedData.forEach((row, index) => {
          try {
            const instrument = row.pair?.trim();
            if (!instrument) {
              parseErrors.push(`Row ${index + 1}: Missing pair/instrument`);
              return;
            }

            const tradeType = row.type?.toUpperCase();
            if (tradeType !== "BUY" && tradeType !== "SELL") {
              parseErrors.push(`Row ${index + 1}: Invalid trade type "${row.type}"`);
              return;
            }

            const entryDate = row.open_date && row.open_time
              ? `${row.open_date} ${row.open_time}`
              : row.open_date || undefined;

            const exitDate = row.close_date && row.close_time
              ? `${row.close_date} ${row.close_time}`
              : row.close_date || undefined;

            const trade: MappedTrade = {
              ticket_id: row.ticket_id?.trim(),
              instrument: instrument,
              trade_type: tradeType as "BUY" | "SELL",
              position_size: parseFloat(row.lot_size || "1.0"),
              entry_price: parseFloat(row.entry_price || "0"),
              exit_price: row.exit_price ? parseFloat(row.exit_price) : undefined,
              stop_loss: row.stop_loss ? parseFloat(row.stop_loss) : undefined,
              take_profit: row.take_profit ? parseFloat(row.take_profit) : undefined,
              pnl: row.profit ? parseFloat(row.profit) : undefined,
              entry_date: entryDate,
              exit_date: exitDate,
              status: exitDate ? "CLOSED" : "OPEN",
            };

            mappedTrades.push(trade);
          } catch (error) {
            parseErrors.push(`Row ${index + 1}: ${error instanceof Error ? error.message : "Parse error"}`);
          }
        });

        setParsedTrades(mappedTrades);
        setPreviewTrades(mappedTrades.slice(0, 5));
        setErrors(parseErrors);
        setShowPreview(true);
      },
      error: (error) => {
        toast({
          title: "CSV Parse Error",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
        toast({
          title: "Invalid File",
          description: "Please upload a CSV file",
          variant: "destructive",
        });
        return;
      }
      setCsvFile(file);
      setShowPreview(false);
      setParsedTrades([]);
      setErrors([]);
    }
  };

  const handleParseClick = () => {
    if (!csvFile) {
      toast({
        title: "No File Selected",
        description: "Please select a CSV file to upload",
        variant: "destructive",
      });
      return;
    }

    if (!selectedAccountId) {
      toast({
        title: "No Account Selected",
        description: "Please select a trading account",
        variant: "destructive",
      });
      return;
    }

    parseCSV(csvFile);
  };

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAccountId || parsedTrades.length === 0) {
        throw new Error("Missing account or trades data");
      }

      const tradesWithAccount = parsedTrades.map((trade) => ({
        ...trade,
        account_id: selectedAccountId,
        instrument_type: determineInstrumentType(trade.instrument),
      }));

      return await uploadTrades(tradesWithAccount, selectedAccountId);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["trade-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });

      const selectedAccount = accounts.find((acc) => acc.id === selectedAccountId);
      toast({
        title: "Upload Complete",
        description: `✅ ${result.uploaded} trades uploaded to ${selectedAccount?.account_name || "account"} successfully. ${result.skipped > 0 ? `${result.skipped} duplicates skipped.` : ""}`,
      });

      onClose();
      resetState();
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload trades",
        variant: "destructive",
      });
    },
  });

  const resetState = () => {
    setSelectedAccountId("");
    setCsvFile(null);
    setParsedTrades([]);
    setPreviewTrades([]);
    setShowPreview(false);
    setUploadProgress(0);
    setErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Trades from CSV
          </DialogTitle>
          <DialogDescription>
            Upload trades from MT4/MT5/TradeZella CSV files to your trading account
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Account Selection */}
          <div className="space-y-2">
            <Label htmlFor="account-select">Select Trading Account</Label>
            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
              <SelectTrigger id="account-select" data-testid="select-upload-account">
                <SelectValue placeholder="Choose an account..." />
              </SelectTrigger>
              <SelectContent>
                {activeAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.account_name} ({account.broker_name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="csv-upload">CSV File</Label>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
                data-testid="button-select-csv"
              >
                <FileText className="w-4 h-4 mr-2" />
                {csvFile ? csvFile.name : "Choose CSV File"}
              </Button>
              <Button
                type="button"
                onClick={handleParseClick}
                disabled={!csvFile || !selectedAccountId}
                data-testid="button-parse-csv"
              >
                Parse
              </Button>
            </div>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-1">Parsing Errors:</div>
                <ul className="list-disc list-inside text-sm">
                  {errors.slice(0, 5).map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                  {errors.length > 5 && <li>... and {errors.length - 5} more</li>}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Preview */}
          {showPreview && previewTrades.length > 0 && (
            <div className="space-y-2">
              <Label>Preview (First 5 Trades)</Label>
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-3 py-2 text-left">Ticket</th>
                        <th className="px-3 py-2 text-left">Instrument</th>
                        <th className="px-3 py-2 text-left">Type</th>
                        <th className="px-3 py-2 text-right">Size</th>
                        <th className="px-3 py-2 text-right">Entry</th>
                        <th className="px-3 py-2 text-right">Exit</th>
                        <th className="px-3 py-2 text-right">P&L</th>
                        <th className="px-3 py-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewTrades.map((trade, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-3 py-2">{trade.ticket_id || "-"}</td>
                          <td className="px-3 py-2">{trade.instrument}</td>
                          <td className="px-3 py-2">{trade.trade_type}</td>
                          <td className="px-3 py-2 text-right">{trade.position_size}</td>
                          <td className="px-3 py-2 text-right">{trade.entry_price}</td>
                          <td className="px-3 py-2 text-right">{trade.exit_price || "-"}</td>
                          <td className="px-3 py-2 text-right">{trade.pnl?.toFixed(2) || "-"}</td>
                          <td className="px-3 py-2">
                            <span className={trade.status === "CLOSED" ? "text-green-500" : "text-yellow-500"}>
                              {trade.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Total trades to upload: {parsedTrades.length}
              </p>
            </div>
          )}

          {/* Upload Progress */}
          {uploadMutation.isPending && (
            <div className="space-y-2">
              <Label>Uploading Trades...</Label>
              <Progress value={uploadProgress} />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleClose} data-testid="button-cancel-upload">
              Cancel
            </Button>
            <Button
              onClick={() => uploadMutation.mutate()}
              disabled={!showPreview || parsedTrades.length === 0 || uploadMutation.isPending}
              data-testid="button-confirm-upload"
            >
              {uploadMutation.isPending ? (
                <>Uploading...</>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Upload {parsedTrades.length} Trades
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
