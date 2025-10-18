import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Maximize, Minimize, Plus, X } from "lucide-react";

declare global {
  interface Window {
    TradingView: any;
  }
}

const MAJOR_PAIRS = [
  { symbol: "OANDA:XAUUSD", label: "XAU/USD (Gold)" },
  { symbol: "BTCUSD", label: "BTC/USD" },
  { symbol: "ETHUSD", label: "ETH/USD" },
  { symbol: "NASDAQ:NDX", label: "US100 (NASDAQ)" },
  { symbol: "EURUSD", label: "EUR/USD" },
  { symbol: "GBPUSD", label: "GBP/USD" },
  { symbol: "USDJPY", label: "USD/JPY" },
  { symbol: "USDCHF", label: "USD/CHF" },
  { symbol: "AUDUSD", label: "AUD/USD" },
  { symbol: "USDCAD", label: "USD/CAD" },
  { symbol: "NZDUSD", label: "NZD/USD" },
  { symbol: "EURGBP", label: "EUR/GBP" },
  { symbol: "EURJPY", label: "EUR/JPY" },
  { symbol: "GBPJPY", label: "GBP/JPY" },
  { symbol: "AUDJPY", label: "AUD/JPY" },
];

export default function PreviewCharts() {
  const [symbol, setSymbol] = useState("EURUSD");
  const [interval, setInterval] = useState("60");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [customSymbols, setCustomSymbols] = useState<Array<{ symbol: string; label: string }>>([]);
  const [newSymbol, setNewSymbol] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartCardRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);

  // Load custom symbols from localStorage (preview uses its own key)
  useEffect(() => {
    const saved = localStorage.getItem("preview-custom-chart-symbols");
    if (saved) {
      try {
        setCustomSymbols(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load custom symbols");
      }
    }
  }, []);

  // Save custom symbols to localStorage
  useEffect(() => {
    if (customSymbols.length > 0) {
      localStorage.setItem("preview-custom-chart-symbols", JSON.stringify(customSymbols));
    }
  }, [customSymbols]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => initChart();
    document.head.appendChild(script);

    return () => {
      if (widgetRef.current) {
        try {
          widgetRef.current.remove();
        } catch (err) {
          console.log("TradingView widget cleanup (safe to ignore)");
        }
      }
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    if (window.TradingView && chartContainerRef.current) {
      initChart();
    }
  }, [symbol, interval]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    if (!chartCardRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await chartCardRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Error toggling fullscreen:", err);
    }
  };

  const initChart = () => {
    if (!chartContainerRef.current || !window.TradingView) return;

    if (widgetRef.current) {
      widgetRef.current.remove();
    }

    chartContainerRef.current.innerHTML = "";

    // Determine TradingView symbol format
    let tradingViewSymbol = `FX_IDC:${symbol}`;
    if (symbol === "BTCUSD" || symbol === "ETHUSD") {
      tradingViewSymbol = `BINANCE:${symbol}T`;
    } else if (symbol.includes(":")) {
      // Custom symbol already has exchange prefix
      tradingViewSymbol = symbol;
    }

    widgetRef.current = new window.TradingView.widget({
      autosize: true,
      symbol: tradingViewSymbol,
      interval: interval,
      timezone: "Etc/UTC",
      theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
      style: "1",
      locale: "en",
      toolbar_bg: "#f1f3f6",
      enable_publishing: false,
      withdateranges: true,
      hide_side_toolbar: false,
      allow_symbol_change: true,
      container_id: "preview_tradingview_chart",
      studies: [
        "MASimple@tv-basicstudies",
        "RSI@tv-basicstudies"
      ],
    });
  };

  const allSymbols = [...MAJOR_PAIRS, ...customSymbols];
  const symbolMap: Record<string, string> = {};
  allSymbols.forEach(s => {
    symbolMap[s.symbol] = s.label;
  });

  const addCustomSymbol = () => {
    if (!newSymbol.trim() || !newLabel.trim()) return;
    
    const symbolExists = allSymbols.some(s => s.symbol.toUpperCase() === newSymbol.toUpperCase());
    if (symbolExists) {
      alert("This symbol already exists!");
      return;
    }

    setCustomSymbols([...customSymbols, { symbol: newSymbol.toUpperCase(), label: newLabel }]);
    setNewSymbol("");
    setNewLabel("");
    setIsAddDialogOpen(false);
  };

  const removeCustomSymbol = (symbolToRemove: string) => {
    setCustomSymbols(customSymbols.filter(s => s.symbol !== symbolToRemove));
    if (symbol === symbolToRemove) {
      setSymbol("EURUSD");
    }
  };

  const intervalMap: Record<string, string> = {
    "1": "1 Min",
    "5": "5 Min",
    "15": "15 Min",
    "60": "1 Hour",
    "240": "4 Hour",
    "D": "Daily",
  };

  return (
    <div className="p-3 sm:p-4 lg:p-8 min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white" data-testid="text-charts-title">Trading Charts</h1>
            <p className="text-sm sm:text-base text-gray-300">Professional charting powered by TradingView</p>
          </div>
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2">
            <p className="text-xs sm:text-sm text-cyan-400">📊 Preview Mode</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <Select value={symbol} onValueChange={setSymbol}>
            <SelectTrigger className="w-full sm:w-48" data-testid="select-symbol">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {allSymbols.map((s) => (
                <SelectItem key={s.symbol} value={s.symbol}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={interval} onValueChange={setInterval}>
            <SelectTrigger className="w-full sm:w-32" data-testid="select-interval">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 Min</SelectItem>
              <SelectItem value="5">5 Min</SelectItem>
              <SelectItem value="15">15 Min</SelectItem>
              <SelectItem value="60">1 Hour</SelectItem>
              <SelectItem value="240">4 Hour</SelectItem>
              <SelectItem value="D">Daily</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="lg:col-span-3">
          <Card ref={chartCardRef} className="bg-slate-900/50 border-slate-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-white" data-testid="text-chart-title">
                  {symbolMap[symbol]} • {intervalMap[interval]}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-green-500" data-testid="badge-tradingview">
                    Live • TradingView
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={toggleFullscreen}
                    data-testid="button-fullscreen"
                    className="h-7 w-7 p-0"
                  >
                    {isFullscreen ? (
                      <Minimize className="h-4 w-4" />
                    ) : (
                      <Maximize className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div 
                ref={chartContainerRef}
                id="preview_tradingview_chart" 
                className={isFullscreen ? "h-[calc(100vh-120px)] rounded-lg overflow-hidden" : "h-[600px] rounded-lg overflow-hidden"}
                data-testid="container-tradingview-chart"
              />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-4">
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-lg text-white">Quick Symbols</CardTitle>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="h-7 w-7 p-0" data-testid="button-add-symbol">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent aria-describedby="add-symbol-description">
                  <DialogHeader>
                    <DialogTitle>Add Custom Symbol</DialogTitle>
                  </DialogHeader>
                  <p id="add-symbol-description" className="text-sm text-muted-foreground">
                    Add any custom symbol from TradingView (stocks, crypto, indices, etc.)
                  </p>
                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="text-sm font-medium">Symbol (e.g., NASDAQ:AAPL)</label>
                      <Input
                        value={newSymbol}
                        onChange={(e) => setNewSymbol(e.target.value)}
                        placeholder="NASDAQ:AAPL"
                        className="mt-1"
                        data-testid="input-symbol"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Display Label</label>
                      <Input
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        placeholder="Apple Inc."
                        className="mt-1"
                        data-testid="input-label"
                      />
                    </div>
                    <Button onClick={addCustomSymbol} className="w-full" data-testid="button-save-symbol">
                      Add Symbol
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
              {/* Major Pairs */}
              {MAJOR_PAIRS.map((pair) => (
                <Button 
                  key={pair.symbol}
                  size="sm" 
                  variant={symbol === pair.symbol ? "default" : "outline"} 
                  className="w-full justify-start"
                  onClick={() => setSymbol(pair.symbol)}
                  data-testid={`button-symbol-${pair.symbol.toLowerCase()}`}
                >
                  {pair.label}
                </Button>
              ))}

              {/* Custom Symbols with delete button */}
              {customSymbols.length > 0 && (
                <>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Custom Symbols</p>
                  </div>
                  {customSymbols.map((pair) => (
                    <div key={pair.symbol} className="flex gap-1">
                      <Button 
                        size="sm" 
                        variant={symbol === pair.symbol ? "default" : "outline"} 
                        className="flex-1 justify-start"
                        onClick={() => setSymbol(pair.symbol)}
                        data-testid={`button-symbol-${pair.symbol.toLowerCase()}`}
                      >
                        {pair.label}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                        onClick={() => removeCustomSymbol(pair.symbol)}
                        data-testid={`button-remove-${pair.symbol.toLowerCase()}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
