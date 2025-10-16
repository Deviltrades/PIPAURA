import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Download, FileText, TrendingUp, TrendingDown, Receipt, DollarSign, Plus } from "lucide-react";
import { useState } from "react";

// Demo expenses data
const demoExpenses = [
  { id: 1, expense_type: 'software', vendor: 'TradingView Pro', amount: '299.95', currency: 'USD', expense_date: '2024-01-15', notes: 'Annual subscription' },
  { id: 2, expense_type: 'data', vendor: 'Bloomberg Terminal', amount: '2100.00', currency: 'USD', expense_date: '2024-02-01', notes: 'Monthly subscription' },
  { id: 3, expense_type: 'education', vendor: 'Trading Mastery Course', amount: '499.00', currency: 'USD', expense_date: '2024-03-10', notes: 'Advanced forex strategies' },
  { id: 4, expense_type: 'hardware', vendor: 'Dell UltraSharp Monitor', amount: '599.99', currency: 'USD', expense_date: '2024-04-05', notes: '27" 4K display' },
  { id: 5, expense_type: 'software', vendor: 'MetaTrader VPS', amount: '29.99', currency: 'USD', expense_date: '2024-05-20', notes: 'Monthly VPS hosting' },
  { id: 6, expense_type: 'other', vendor: 'Office Supplies', amount: '125.50', currency: 'USD', expense_date: '2024-06-12', notes: 'Desk organizer, notebooks' },
];

// Demo tax summary data
const demoTaxSummary = {
  totals: {
    trading_income: 12450.75,
    swap_income: -245.30,
    commission_deduction: 850.00,
    expenses: 3654.43,
    net_income: 7700.72
  },
  monthly: [
    { month: 1, trading_income: 1250.00, expenses: 299.95, net_income: 950.05, days_traded: 18 },
    { month: 2, trading_income: 2100.50, expenses: 2100.00, net_income: 0.50, days_traded: 20 },
    { month: 3, trading_income: 1800.25, expenses: 499.00, net_income: 1301.25, days_traded: 22 },
    { month: 4, trading_income: 950.00, expenses: 599.99, net_income: 350.01, days_traded: 15 },
    { month: 5, trading_income: 2350.00, expenses: 29.99, net_income: 2320.01, days_traded: 19 },
    { month: 6, trading_income: 2000.00, expenses: 125.50, net_income: 1874.50, days_traded: 21 },
    { month: 7, trading_income: 1000.00, expenses: 0, net_income: 1000.00, days_traded: 12 },
    { month: 8, trading_income: 1000.00, expenses: 0, net_income: 1000.00, days_traded: 16 },
  ]
};

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function PreviewTaxReports() {
  const [selectedYear, setSelectedYear] = useState("2024");

  const totalExpenses = demoExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  return (
    <div className="p-4 lg:p-8 min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white" data-testid="text-tax-title">Tax Reports</h1>
          <p className="text-gray-300">Generate comprehensive tax reports for your trading activity</p>
        </div>
        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg px-4 py-2">
          <p className="text-sm text-cyan-400">📊 Preview Mode - Demo Data</p>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
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

        <Select defaultValue="all">
          <SelectTrigger className="w-48" data-testid="select-tax-account">
            <SelectValue placeholder="Select Account" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Accounts</SelectItem>
            <SelectItem value="demo1">Main Trading Account</SelectItem>
            <SelectItem value="demo2">Swing Account</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="receipts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="receipts" data-testid="tab-receipts">
            <Receipt className="h-4 w-4 mr-2" />
            Receipts/Expenses
          </TabsTrigger>
          <TabsTrigger value="summary" data-testid="tab-summary">
            <DollarSign className="h-4 w-4 mr-2" />
            Tax Summary
          </TabsTrigger>
          <TabsTrigger value="reports" data-testid="tab-reports">
            <FileText className="h-4 w-4 mr-2" />
            Reports
          </TabsTrigger>
        </TabsList>

        {/* Receipts/Expenses Tab */}
        <TabsContent value="receipts" className="space-y-4">
          <div className="grid gap-6">
            <Card className="bg-[#0f1f3a] border-[#1a2f4a]">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-white">Trading Expenses</CardTitle>
                    <CardDescription>Track deductible expenses for tax purposes</CardDescription>
                  </div>
                  <Button className="bg-cyan-600 hover:bg-cyan-700" data-testid="button-add-expense">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Expense
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card className="border-2 border-red-500/60 bg-red-950/20">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                          ${totalExpenses.toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Deductible expenses for {selectedYear}</p>
                      </CardContent>
                    </Card>

                    <Card className="border-2 border-cyan-500/60 bg-cyan-950/20">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Expense Count</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-cyan-600">{demoExpenses.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Total expense entries</p>
                      </CardContent>
                    </Card>

                    <Card className="border-2 border-purple-500/60 bg-purple-950/20">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Currency</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-purple-600">USD</div>
                        <p className="text-xs text-muted-foreground mt-1">Reporting currency</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="bg-slate-900/50 border-cyan-500/20">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">Expense List</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {demoExpenses.map((expense) => (
                          <div key={expense.id} className="flex items-center justify-between p-3 border border-cyan-500/20 rounded-lg hover:bg-slate-800/50">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs border-cyan-500/50 text-cyan-400">
                                  {expense.expense_type}
                                </Badge>
                                <span className="font-medium text-white">{expense.vendor}</span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {new Date(expense.expense_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                {expense.notes && ` • ${expense.notes}`}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-red-600">
                                ${parseFloat(expense.amount).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tax Summary Tab */}
        <TabsContent value="summary" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-2 border-cyan-500/60 bg-cyan-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Trading Income</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ${demoTaxSummary.totals.trading_income.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Total P&L for {selectedYear}</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-cyan-500/60 bg-cyan-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Swap Income</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-cyan-600">
                  ${Math.abs(demoTaxSummary.totals.swap_income).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Included</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-cyan-500/60 bg-cyan-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Deductions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  ${(demoTaxSummary.totals.commission_deduction + demoTaxSummary.totals.expenses).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Commissions + Expenses</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-cyan-500/60 bg-cyan-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Net Taxable Income</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ${demoTaxSummary.totals.net_income.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">After all deductions</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-2 border-cyan-500/60 bg-[#0f1f3a]">
              <CardHeader>
                <CardTitle className="text-white">Monthly Breakdown</CardTitle>
                <CardDescription>Income and expenses by month for {selectedYear}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {demoTaxSummary.monthly.map((item) => (
                    <div key={item.month} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-white">{monthNames[item.month - 1]}</span>
                      </div>
                      <div className={`font-semibold flex items-center gap-1 ${item.net_income >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.net_income >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        ${Math.abs(item.net_income).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-cyan-500/60 bg-[#0f1f3a]">
              <CardHeader>
                <CardTitle className="text-white">Tax Settings</CardTitle>
                <CardDescription>Configure what to include in tax calculations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                  <div>
                    <div className="font-medium text-white">Include Swap in Income</div>
                    <p className="text-sm text-muted-foreground">Add swap fees to taxable income</p>
                  </div>
                  <Badge className="bg-green-600">ON</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                  <div>
                    <div className="font-medium text-white">Include Commission Deduction</div>
                    <p className="text-sm text-muted-foreground">Deduct trading commissions</p>
                  </div>
                  <Badge className="bg-green-600">ON</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                  <div>
                    <div className="font-medium text-white">Include Unrealized P&L</div>
                    <p className="text-sm text-muted-foreground">Include open positions (not recommended)</p>
                  </div>
                  <Badge variant="secondary">OFF</Badge>
                </div>

                <div className="pt-4 border-t border-cyan-500/20">
                  <p className="text-xs text-amber-400">
                    <strong>⚠️ Note:</strong> These settings affect your tax calculations. Consult a tax professional before making changes.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card className="bg-[#0f1f3a] border-[#1a2f4a]">
            <CardHeader>
              <CardTitle className="text-white">Export Reports</CardTitle>
              <CardDescription>Download tax documents and trading summaries</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full justify-start border-cyan-500/50 hover:bg-cyan-600/20" 
                variant="outline" 
                data-testid="button-export-csv-trades"
              >
                <FileText className="h-4 w-4 mr-2" />
                Export Trades (CSV)
                <Download className="h-4 w-4 ml-auto" />
              </Button>
              
              <Button 
                className="w-full justify-start border-cyan-500/50 hover:bg-cyan-600/20" 
                variant="outline" 
                data-testid="button-export-csv-expenses"
              >
                <FileText className="h-4 w-4 mr-2" />
                Export Expenses (CSV)
                <Download className="h-4 w-4 ml-auto" />
              </Button>
              
              <Button 
                className="w-full justify-start border-cyan-500/50 hover:bg-cyan-600/20" 
                variant="outline" 
                data-testid="button-export-pdf"
              >
                <FileText className="h-4 w-4 mr-2" />
                Tax Summary Report (PDF)
                <Download className="h-4 w-4 ml-auto" />
              </Button>
              
              <Button 
                className="w-full justify-start border-cyan-500/50 hover:bg-cyan-600/20" 
                variant="outline" 
                data-testid="button-export-html"
              >
                <FileText className="h-4 w-4 mr-2" />
                Tax Summary Report (HTML)
                <Download className="h-4 w-4 ml-auto" />
              </Button>

              <div className="pt-4 border-t border-cyan-500/20">
                <p className="text-xs text-muted-foreground">
                  <strong>Note:</strong> These reports are for informational purposes only. Please consult with a tax professional for accurate tax filing.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
