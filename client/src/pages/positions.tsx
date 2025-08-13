import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatPercentage } from "@/lib/utils";

const mockPositions = [
  {
    id: 1,
    instrument: "EURUSD",
    type: "FOREX",
    side: "BUY",
    size: 100000,
    entryPrice: 1.0950,
    currentPrice: 1.0975,
    pnl: 250,
    pnlPercent: 2.3,
    openDate: "2024-01-15T09:30:00Z"
  },
  {
    id: 2,
    instrument: "BTCUSD",
    type: "CRYPTO",
    side: "SELL",
    size: 0.5,
    entryPrice: 42000,
    currentPrice: 41500,
    pnl: 250,
    pnlPercent: 1.2,
    openDate: "2024-01-14T14:20:00Z"
  }
];

export default function Positions() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Open Positions</h1>
        <p className="text-muted-foreground">Monitor your active trading positions</p>
      </div>

      <div className="grid gap-4">
        {mockPositions.map((position) => (
          <Card key={position.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-lg">{position.instrument}</CardTitle>
                <CardDescription>{position.type}</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={position.side === "BUY" ? "default" : "destructive"}>
                  {position.side}
                </Badge>
                <Badge variant={position.pnl >= 0 ? "default" : "destructive"}>
                  {formatCurrency(position.pnl)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Size</p>
                  <p className="font-semibold">{position.size.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Entry Price</p>
                  <p className="font-semibold">{formatCurrency(position.entryPrice)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Price</p>
                  <p className="font-semibold">{formatCurrency(position.currentPrice)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">P&L %</p>
                  <p className={`font-semibold ${position.pnlPercent >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatPercentage(position.pnlPercent)}
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-muted-foreground">
                  Opened: {new Date(position.openDate).toLocaleDateString()}
                </p>
                <Button variant="outline" size="sm">
                  Close Position
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {mockPositions.length === 0 && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <p>No open positions</p>
              <p className="text-sm mt-1">Your active trades will appear here</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}