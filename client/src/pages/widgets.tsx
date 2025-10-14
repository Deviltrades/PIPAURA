import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { AccountSelector } from "@/components/AccountSelector";
import { useSelectedAccount } from "@/hooks/use-selected-account";

export default function Widgets() {
  const [selectedAccount, setSelectedAccount] = useSelectedAccount();
  
  return (
    <div className="p-4 lg:p-8 min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Trading Widgets</h1>
        <p className="text-gray-300 mb-3">Customizable widgets for your trading dashboard</p>
        <AccountSelector value={selectedAccount} onValueChange={setSelectedAccount} />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Market Overview</CardTitle>
            <CardDescription>Major currency pairs overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">EURUSD</span>
              <div className="text-right">
                <div className="font-semibold">1.0975</div>
                <div className="text-sm text-green-600">+0.23%</div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">GBPUSD</span>
              <div className="text-right">
                <div className="font-semibold">1.2648</div>
                <div className="text-sm text-red-600">-0.15%</div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">USDJPY</span>
              <div className="text-right">
                <div className="font-semibold">149.85</div>
                <div className="text-sm text-green-600">+0.08%</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Economic Calendar</CardTitle>
            <CardDescription>Today's key events</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <Badge variant="destructive" className="text-xs">HIGH</Badge>
              <div>
                <div className="font-medium text-sm">USD NFP</div>
                <div className="text-xs text-muted-foreground">13:30 GMT</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="secondary" className="text-xs">MED</Badge>
              <div>
                <div className="font-medium text-sm">EUR CPI</div>
                <div className="text-xs text-muted-foreground">10:00 GMT</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="text-xs">LOW</Badge>
              <div>
                <div className="font-medium text-sm">GBP Retail</div>
                <div className="text-xs text-muted-foreground">09:30 GMT</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Account Summary</CardTitle>
            <CardDescription>Quick account overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Balance</span>
              <span className="font-semibold">{formatCurrency(10000)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Equity</span>
              <span className="font-semibold">{formatCurrency(10250)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">P&L Today</span>
              <span className="font-semibold text-green-600">+{formatCurrency(125)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Price Alerts</CardTitle>
            <CardDescription>Active price notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium text-sm">EURUSD</div>
                <div className="text-xs text-muted-foreground">Above 1.1000</div>
              </div>
              <Badge variant="outline" className="text-xs">Active</Badge>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium text-sm">BTCUSD</div>
                <div className="text-xs text-muted-foreground">Below 40000</div>
              </div>
              <Badge variant="outline" className="text-xs">Active</Badge>
            </div>
            <Button size="sm" variant="outline" className="w-full">
              Add Alert
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Risk Monitor</CardTitle>
            <CardDescription>Risk management overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Risk per Trade</span>
              <span className="font-semibold">{formatPercentage(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Max Drawdown</span>
              <span className="font-semibold text-red-600">{formatPercentage(5.2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Win Rate</span>
              <span className="font-semibold text-green-600">{formatPercentage(68)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Profit Factor</span>
              <span className="font-semibold">1.85</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Market Sentiment</CardTitle>
            <CardDescription>Current market mood</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">EURUSD</span>
              <div className="flex items-center gap-2">
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: "65%" }}></div>
                </div>
                <span className="text-sm">65% Bull</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">GBPUSD</span>
              <div className="flex items-center gap-2">
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: "40%" }}></div>
                </div>
                <span className="text-sm">40% Bull</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}