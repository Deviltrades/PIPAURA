import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Download, FileText, TrendingUp, TrendingDown } from "lucide-react";
import { useState } from "react";

export default function TaxReports() {
  const [selectedYear, setSelectedYear] = useState("2024");
  const [selectedAccount, setSelectedAccount] = useState("all");

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  return (
    <div className="p-4 lg:p-8 min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Tax Reports</h1>
        <p className="text-gray-300 mb-4">Generate comprehensive tax reports for your trading activity</p>
        
        <div className="flex gap-3">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-40" data-testid="select-tax-year">
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedAccount} onValueChange={setSelectedAccount}>
            <SelectTrigger className="w-48" data-testid="select-tax-account">
              <SelectValue placeholder="Select Account" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Accounts</SelectItem>
              <SelectItem value="live">Live Account</SelectItem>
              <SelectItem value="demo">Demo Account</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Realized P&L</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">$12,450.00</div>
            <p className="text-xs text-muted-foreground mt-1">Taxable gains for {selectedYear}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Trades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">247</div>
            <p className="text-xs text-muted-foreground mt-1">Closed positions in {selectedYear}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Winning Trades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">165</div>
            <p className="text-xs text-muted-foreground mt-1">66.8% win rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Losing Trades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">82</div>
            <p className="text-xs text-muted-foreground mt-1">33.2% loss rate</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Breakdown</CardTitle>
            <CardDescription>Realized P&L by month for {selectedYear}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { month: "January", pnl: 1250, trades: 23 },
                { month: "February", pnl: 890, trades: 19 },
                { month: "March", pnl: -320, trades: 21 },
                { month: "April", pnl: 1450, trades: 25 },
                { month: "May", pnl: 2100, trades: 28 },
                { month: "June", pnl: 1680, trades: 22 },
              ].map((item) => (
                <div key={item.month} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{item.month}</span>
                    <Badge variant="outline" className="text-xs">{item.trades} trades</Badge>
                  </div>
                  <div className={`font-semibold flex items-center gap-1 ${item.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {item.pnl >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    ${Math.abs(item.pnl).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Available Reports</CardTitle>
            <CardDescription>Download tax documents and trading summaries</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline" data-testid="button-download-summary">
              <FileText className="h-4 w-4 mr-2" />
              Annual Trading Summary
              <Download className="h-4 w-4 ml-auto" />
            </Button>
            
            <Button className="w-full justify-start" variant="outline" data-testid="button-download-gains">
              <FileText className="h-4 w-4 mr-2" />
              Capital Gains/Loss Report
              <Download className="h-4 w-4 ml-auto" />
            </Button>
            
            <Button className="w-full justify-start" variant="outline" data-testid="button-download-monthly">
              <FileText className="h-4 w-4 mr-2" />
              Monthly Trade Log
              <Download className="h-4 w-4 ml-auto" />
            </Button>
            
            <Button className="w-full justify-start" variant="outline" data-testid="button-download-csv">
              <FileText className="h-4 w-4 mr-2" />
              Export All Trades (CSV)
              <Download className="h-4 w-4 ml-auto" />
            </Button>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                <strong>Note:</strong> These reports are for informational purposes only. Please consult with a tax professional for accurate tax filing.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tax Information</CardTitle>
          <CardDescription>Important considerations for trading taxes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div className="p-4 bg-blue-950/20 rounded-lg border border-blue-500/30">
              <h4 className="font-semibold text-blue-400 mb-2">📊 Reporting Requirements</h4>
              <p className="text-gray-300">
                Forex and cryptocurrency trading profits are generally taxable. You must report all realized gains and losses, even from foreign brokers.
              </p>
            </div>

            <div className="p-4 bg-purple-950/20 rounded-lg border border-purple-500/30">
              <h4 className="font-semibold text-purple-400 mb-2">⏰ Holding Periods</h4>
              <p className="text-gray-300">
                Short-term gains (held less than 1 year) are taxed as ordinary income. Long-term gains (held over 1 year) may qualify for lower tax rates.
              </p>
            </div>

            <div className="p-4 bg-amber-950/20 rounded-lg border border-amber-500/30">
              <h4 className="font-semibold text-amber-400 mb-2">⚠️ Professional Advice</h4>
              <p className="text-gray-300">
                Tax laws vary by jurisdiction and change frequently. Always consult with a qualified tax professional or CPA for personalized advice.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
