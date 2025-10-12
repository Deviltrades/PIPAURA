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
import * as XLSX from "xlsx";
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

  const getFieldValue = (row: any, aliases: string[]): string | undefined => {
    for (const alias of aliases) {
      if (row[alias] !== undefined && row[alias] !== null && row[alias] !== "") {
        return String(row[alias]).trim();
      }
    }
    return undefined;
  };

  const parseExcel = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get first sheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convert to array of arrays to inspect structure
          const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          
          // Find the header row (first row with multiple non-empty values)
          let headerRowIndex = -1;
          for (let i = 0; i < Math.min(10, rawData.length); i++) {
            const row = rawData[i];
            const nonEmptyCells = row.filter(cell => cell !== null && cell !== undefined && cell !== '').length;
            if (nonEmptyCells >= 3) { // At least 3 columns
              headerRowIndex = i;
              break;
            }
          }
          
          if (headerRowIndex === -1) {
            reject(new Error('Could not find header row in Excel file'));
            return;
          }
          
          // Convert to JSON using the identified header row
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            range: headerRowIndex,
            defval: ''
          });
          
          console.log("Excel headers found at row", headerRowIndex + 1, ":", Object.keys(jsonData[0] || {}));
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  };

  const parseHTML = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const htmlString = e.target?.result as string;
          const parser = new DOMParser();
          const doc = parser.parseFromString(htmlString, 'text/html');
          
          // Find the first table
          const table = doc.querySelector('table');
          if (!table) {
            reject(new Error('No table found in HTML file'));
            return;
          }
          
          const rows = Array.from(table.querySelectorAll('tr'));
          if (rows.length < 2) {
            reject(new Error('Table has no data rows'));
            return;
          }
          
          // Extract headers from first row
          const headerCells = Array.from(rows[0].querySelectorAll('th, td'));
          const headers = headerCells.map(cell => cell.textContent?.trim() || '');
          
          // Extract data rows
          const data = rows.slice(1).map(row => {
            const cells = Array.from(row.querySelectorAll('td'));
            const rowData: any = {};
            headers.forEach((header, i) => {
              rowData[header] = cells[i]?.textContent?.trim() || '';
            });
            return rowData;
          });
          
          resolve(data);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  };

  const detectFileType = (file: File): 'csv' | 'excel' | 'html' | 'unknown' => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (extension === 'csv') return 'csv';
    if (extension === 'xls' || extension === 'xlsx') return 'excel';
    if (extension === 'html' || extension === 'htm') return 'html';
    
    // Check MIME type as fallback
    if (file.type.includes('csv') || file.type.includes('comma-separated')) return 'csv';
    if (file.type.includes('spreadsheet') || file.type.includes('excel')) return 'excel';
    if (file.type.includes('html')) return 'html';
    
    return 'unknown';
  };

  const parseFile = async (file: File) => {
    const fileType = detectFileType(file);
    let parsedData: any[] = [];
    
    try {
      if (fileType === 'excel') {
        parsedData = await parseExcel(file);
        console.log("Excel file parsed:", parsedData.length, "rows");
      } else if (fileType === 'html') {
        parsedData = await parseHTML(file);
        console.log("HTML table parsed:", parsedData.length, "rows");
      } else if (fileType === 'csv') {
        // Use existing CSV parser
        return parseCSV(file);
      } else {
        toast({
          title: "Unsupported File Type",
          description: "Please upload a CSV, Excel (.xls/.xlsx), or HTML file",
          variant: "destructive",
        });
        return;
      }
      
      // Process the parsed data (same logic as CSV)
      processParsedData(parsedData);
    } catch (error) {
      toast({
        title: "File Parse Error",
        description: error instanceof Error ? error.message : "Failed to parse file",
        variant: "destructive",
      });
    }
  };

  const processParsedData = (parsedData: any[]) => {
    const mappedTrades: MappedTrade[] = [];
    const parseErrors: string[] = [];

    if (parsedData.length > 0) {
      console.log("Headers detected:", Object.keys(parsedData[0]));
    }

    parsedData.forEach((row, index) => {
      try {
        // Check if row has any meaningful data (excluding __EMPTY columns)
        const meaningfulColumns = Object.entries(row).filter(([key]) => !key.startsWith('__EMPTY'));
        const hasAnyData = meaningfulColumns.some(([_, value]) => 
          value !== null && value !== undefined && String(value).trim() !== ''
        );
        
        if (!hasAnyData) {
          return; // Skip completely empty rows silently
        }
        
        // Get critical fields early
        const typeColumnValue = getFieldValue(row, ['Type', 'type', 'TYPE']);
        const positionValue = getFieldValue(row, ['Position', 'position', 'Ticket', 'ticket']);
        
        // Skip rows that are duplicate headers (where Type column = "Type")
        if (typeColumnValue === 'Type' || typeColumnValue === 'TYPE' || typeColumnValue === 'type') {
          return; // Skip this row silently, it's a header row
        }
        
        // Skip rows where both Type AND Position are empty (definitely not a trade)
        if ((!typeColumnValue || typeColumnValue.trim() === '') && 
            (!positionValue || positionValue.trim() === '')) {
          return; // Skip empty rows silently
        }
        
        // Skip balance adjustments, deposits, withdrawals (Type = "balance", "deposit", "credit", etc.)
        const typeLower = typeColumnValue?.toLowerCase().trim() || '';
        
        if (typeLower === 'balance' || typeLower === 'deposit' || typeLower === 'withdrawal' || 
            typeLower === 'credit' || typeLower === 'debit' || typeLower === 'bonus') {
          return; // Skip non-trade entries silently
        }
        
        // Skip rows where Type is a number (these are malformed/summary rows)
        if (typeColumnValue && !isNaN(Number(typeColumnValue))) {
          return; // Skip rows with numeric Type values silently
        }
        
        // Skip rows where Type is empty (likely empty rows)
        if (!typeColumnValue || typeColumnValue.trim() === '') {
          return; // Skip empty rows silently
        }
        
        const instrument = getFieldValue(row, [
          'Pair', 'pair', 'Symbol', 'symbol', 'Item', 'item', 'Instrument', 'instrument', 'PAIR', 'SYMBOL', 'ITEM'
        ]);
        
        if (!instrument || instrument.trim() === '') {
          // Check if this is a non-trade row (balance adjustment, deposit, etc.)
          // These rows might have Type but no Symbol
          const rowType = row['Type'] || row['type'] || '';
          const position = row['Position'] || row['position'] || '';
          const profit = row['Profit'] || row['profit'] || '';
          
          // Debug: log the problematic row for first few errors
          if (parseErrors.length < 3) {
            console.log(`Row ${index + 1} - Type: "${rowType}", Position: "${position}", Profit: "${profit}"`);
          }
          
          // Skip rows that look like balance adjustments (have profit but no symbol)
          if (rowType && profit && (!instrument || instrument.trim() === '')) {
            return; // Skip silently - likely a balance adjustment or credit/debit
          }
          
          parseErrors.push(`Row ${index + 1}: Missing pair/instrument`);
          return;
        }

        const tradeTypeRaw = getFieldValue(row, [
          'Type', 'type', 'TYPE', 'Direction', 'direction', 'Side', 'side'
        ]);
        
        const tradeType = tradeTypeRaw?.toUpperCase();
        if (tradeType !== "BUY" && tradeType !== "SELL") {
          parseErrors.push(`Row ${index + 1}: Invalid trade type "${tradeTypeRaw}"`);
          return;
        }

        const openDate = getFieldValue(row, [
          'Open Time', 'open_time', 'OpenTime', 'open_date', 'Open Date', 'Entry Time', 'entry_time', 'Date', 'date', 'Time', 'time'
        ]);

        const closeDate = getFieldValue(row, [
          'Close Time', 'close_time', 'CloseTime', 'close_date', 'Close Date', 'Exit Time', 'exit_time', 'Time_1', 'time_1'
        ]);

        const ticketId = getFieldValue(row, [
          'Ticket', 'ticket', 'ticket_id', 'Order', 'order', 'ID', 'id', 'Trade ID', 'trade_id', 'Deal #', 'deal', 'Position', 'position'
        ]);

        const lotSize = getFieldValue(row, [
          'Size', 'size', 'Lot Size', 'lot_size', 'LotSize', 'Volume', 'volume', 'Lots', 'lots', 'Position Size', 'position_size'
        ]);

        const entryPrice = getFieldValue(row, [
          'Price', 'price', 'Entry Price', 'entry_price', 'EntryPrice', 'Open Price', 'open_price', 'OpenPrice'
        ]);

        const exitPrice = getFieldValue(row, [
          'Close Price', 'close_price', 'ClosePrice', 'Exit Price', 'exit_price', 'ExitPrice', 'Price_1', 'price_1'
        ]);

        const stopLoss = getFieldValue(row, [
          'SL', 'sl', 'S/L', 'S / L', 's / l', 'Stop Loss', 'stop_loss', 'StopLoss'
        ]);

        const takeProfit = getFieldValue(row, [
          'TP', 'tp', 'T/P', 'T / P', 't / p', 'Take Profit', 'take_profit', 'TakeProfit'
        ]);

        const profit = getFieldValue(row, [
          'Profit', 'profit', 'P/L', 'pnl', 'PnL', 'P&L', 'Net Profit', 'net_profit'
        ]);

        const trade: MappedTrade = {
          ticket_id: ticketId,
          instrument: instrument,
          trade_type: tradeType as "BUY" | "SELL",
          position_size: parseFloat(lotSize || "1.0"),
          entry_price: parseFloat(entryPrice || "0"),
          exit_price: exitPrice ? parseFloat(exitPrice) : undefined,
          stop_loss: stopLoss ? parseFloat(stopLoss) : undefined,
          take_profit: takeProfit ? parseFloat(takeProfit) : undefined,
          pnl: profit ? parseFloat(profit) : undefined,
          entry_date: openDate,
          exit_date: closeDate,
          status: closeDate ? "CLOSED" : "OPEN",
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
  };

  const parseCSV = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: "",
      complete: (results) => {
        processParsedData(results.data as any[]);
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
      const fileType = detectFileType(file);
      if (fileType === 'unknown') {
        toast({
          title: "Unsupported File Type",
          description: "Please upload a CSV, Excel (.xls/.xlsx), or HTML file",
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
        description: "Please select a file to upload",
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

    parseFile(csvFile);
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
            Upload Trades
          </DialogTitle>
          <DialogDescription>
            Upload trades from MT4/MT5/TradeZella exports (CSV, Excel, or HTML) to your trading account
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
            <Label htmlFor="csv-upload">Trade History File (CSV, Excel, or HTML)</Label>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                id="csv-upload"
                type="file"
                accept=".csv,.xls,.xlsx,.html,.htm"
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
                {csvFile ? csvFile.name : "Choose File"}
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
