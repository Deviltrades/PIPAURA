import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Maximize, Minimize } from "lucide-react";

declare global {
  interface Window {
    TradingView: any;
  }
}

export default function Charts() {
  const [symbol, setSymbol] = useState("EURUSD");
  const [interval, setInterval] = useState("60");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartCardRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);

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

    const tradingViewSymbol = symbol === "BTCUSD" || symbol === "ETHUSD" 
      ? `BINANCE:${symbol}T` 
      : `FX_IDC:${symbol}`;

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
      container_id: "tradingview_chart",
      studies: [
        "MASimple@tv-basicstudies",
        "RSI@tv-basicstudies"
      ],
    });
  };

  const symbolMap: Record<string, string> = {
    EURUSD: "EUR/USD",
    GBPUSD: "GBP/USD",
    USDJPY: "USD/JPY",
    BTCUSD: "BTC/USD",
    ETHUSD: "ETH/USD",
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
    <div className="p-4 lg:p-8 min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white" data-testid="text-charts-title">Trading Charts</h1>
          <p className="text-gray-300">Professional charting powered by TradingView</p>
        </div>
        <div className="flex gap-2">
          <Select value={symbol} onValueChange={setSymbol}>
            <SelectTrigger className="w-40" data-testid="select-symbol">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EURUSD">EUR/USD</SelectItem>
              <SelectItem value="GBPUSD">GBP/USD</SelectItem>
              <SelectItem value="USDJPY">USD/JPY</SelectItem>
              <SelectItem value="BTCUSD">BTC/USD</SelectItem>
              <SelectItem value="ETHUSD">ETH/USD</SelectItem>
            </SelectContent>
          </Select>
          <Select value={interval} onValueChange={setInterval}>
            <SelectTrigger className="w-32" data-testid="select-interval">
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card ref={chartCardRef}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg" data-testid="text-chart-title">
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
                id="tradingview_chart" 
                className={isFullscreen ? "h-[calc(100vh-120px)] rounded-lg overflow-hidden" : "h-[600px] rounded-lg overflow-hidden"}
                data-testid="container-tradingview-chart"
              />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Quick Symbols</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                size="sm" 
                variant={symbol === "EURUSD" ? "default" : "outline"} 
                className="w-full justify-start"
                onClick={() => setSymbol("EURUSD")}
                data-testid="button-symbol-eurusd"
              >
                EUR/USD
              </Button>
              <Button 
                size="sm" 
                variant={symbol === "GBPUSD" ? "default" : "outline"} 
                className="w-full justify-start"
                onClick={() => setSymbol("GBPUSD")}
                data-testid="button-symbol-gbpusd"
              >
                GBP/USD
              </Button>
              <Button 
                size="sm" 
                variant={symbol === "USDJPY" ? "default" : "outline"} 
                className="w-full justify-start"
                onClick={() => setSymbol("USDJPY")}
                data-testid="button-symbol-usdjpy"
              >
                USD/JPY
              </Button>
              <Button 
                size="sm" 
                variant={symbol === "BTCUSD" ? "default" : "outline"} 
                className="w-full justify-start"
                onClick={() => setSymbol("BTCUSD")}
                data-testid="button-symbol-btcusd"
              >
                BTC/USD
              </Button>
              <Button 
                size="sm" 
                variant={symbol === "ETHUSD" ? "default" : "outline"} 
                className="w-full justify-start"
                onClick={() => setSymbol("ETHUSD")}
                data-testid="button-symbol-ethusd"
              >
                ETH/USD
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
