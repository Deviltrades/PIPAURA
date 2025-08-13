import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function Charts() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trading Charts</h1>
          <p className="text-muted-foreground">Professional charting and technical analysis</p>
        </div>
        <div className="flex gap-2">
          <Select defaultValue="EURUSD">
            <SelectTrigger className="w-40">
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
          <Select defaultValue="H1">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="M1">1 Min</SelectItem>
              <SelectItem value="M5">5 Min</SelectItem>
              <SelectItem value="M15">15 Min</SelectItem>
              <SelectItem value="H1">1 Hour</SelectItem>
              <SelectItem value="H4">4 Hour</SelectItem>
              <SelectItem value="D1">Daily</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Chart Area */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">EUR/USD • H1</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">1.0975</Badge>
                  <Badge variant="default" className="text-green-600 bg-green-50">+0.23%</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Placeholder for TradingView widget or custom chart */}
              <div className="h-96 bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <p className="text-lg font-medium">Professional Chart Widget</p>
                  <p className="text-sm mt-1">TradingView integration would go here</p>
                  <Button className="mt-4">
                    Connect TradingView
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart Tools Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Technical Indicators</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Moving Averages</span>
                <Badge variant="secondary">ON</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">RSI</span>
                <Badge variant="secondary">ON</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">MACD</span>
                <Badge variant="outline">OFF</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Bollinger Bands</span>
                <Badge variant="outline">OFF</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Fibonacci</span>
                <Badge variant="outline">OFF</Badge>
              </div>
              <Button size="sm" variant="outline" className="w-full">
                Customize
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Drawing Tools</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button size="sm" variant="outline" className="w-full justify-start">
                Trend Line
              </Button>
              <Button size="sm" variant="outline" className="w-full justify-start">
                Support/Resistance
              </Button>
              <Button size="sm" variant="outline" className="w-full justify-start">
                Rectangle
              </Button>
              <Button size="sm" variant="outline" className="w-full justify-start">
                Fibonacci Retracement
              </Button>
              <Button size="sm" variant="outline" className="w-full justify-start">
                Text Note
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Market Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Open:</span>
                  <span>1.0945</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">High:</span>
                  <span>1.0982</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Low:</span>
                  <span>1.0935</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Close:</span>
                  <span>1.0975</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Volume:</span>
                  <span>2.4M</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button size="sm" className="w-full">
                New Trade
              </Button>
              <Button size="sm" variant="outline" className="w-full">
                Price Alert
              </Button>
              <Button size="sm" variant="outline" className="w-full">
                Save Layout
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Watchlist</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {["EURUSD", "GBPUSD", "USDJPY", "BTCUSD", "ETHUSD"].map((pair) => (
                <div key={pair} className="flex items-center justify-between p-2 hover:bg-muted rounded cursor-pointer">
                  <span className="font-medium">{pair}</span>
                  <div className="text-right">
                    <div className="text-sm font-semibold">1.0975</div>
                    <div className="text-xs text-green-600">+0.23%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Market Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>London</span>
                <Badge variant="default">Open</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>New York</span>
                <Badge variant="default">Open</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Tokyo</span>
                <Badge variant="secondary">Closed</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Sydney</span>
                <Badge variant="secondary">Closed</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">News Feed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="border-l-4 border-l-red-500 pl-3">
                <div className="font-medium">ECB Rate Decision</div>
                <div className="text-muted-foreground">13:45 GMT</div>
              </div>
              <div className="border-l-4 border-l-yellow-500 pl-3">
                <div className="font-medium">US GDP Data</div>
                <div className="text-muted-foreground">15:30 GMT</div>
              </div>
              <div className="border-l-4 border-l-blue-500 pl-3">
                <div className="font-medium">Fed Speaker</div>
                <div className="text-muted-foreground">17:00 GMT</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}