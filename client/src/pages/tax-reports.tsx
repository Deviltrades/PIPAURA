import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calendar, Download, FileText, TrendingUp, TrendingDown, Receipt, DollarSign, Plus, Trash2, Edit, Loader2 } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  getTaxProfile,
  upsertTaxProfile,
  getTaxExpenses,
  createTaxExpense,
  updateTaxExpense,
  deleteTaxExpense,
  getTaxSummary,
  getTradeAccounts,
  getTrades
} from "@/lib/supabase-service";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  exportTradesToCSV,
  exportExpensesToCSV,
  exportTaxSummaryHTML,
  exportTaxSummaryPDF
} from "@/lib/tax-exports";

const expenseSchema = z.object({
  expense_type: z.enum(['software', 'education', 'data', 'hardware', 'other']),
  vendor: z.string().min(1, "Vendor name is required"),
  amount: z.string().min(1, "Amount is required"),
  currency: z.string().default('USD'),
  expense_date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

export default function TaxReports() {
  console.log('🚀 TAX REPORTS PAGE LOADED');
  
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedAccount, setSelectedAccount] = useState("all");
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  console.log('📊 Tax Reports State:', { selectedYear, selectedAccount });

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  // Fetch accounts
  const { data: accounts = [] } = useQuery({
    queryKey: ['/api/accounts'],
    queryFn: getTradeAccounts,
  });

  // Fetch tax profile
  const { data: taxProfile } = useQuery({
    queryKey: ['/api/tax/profile'],
    queryFn: getTaxProfile,
  });

  // Fetch expenses
  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ['/api/tax/expenses', parseInt(selectedYear)],
    queryFn: () => getTaxExpenses(parseInt(selectedYear)),
  });

  // Fetch tax summary
  const { data: taxSummary, isLoading: summaryLoading, error: summaryError } = useQuery({
    queryKey: ['/api/tax/summary', parseInt(selectedYear), selectedAccount],
    queryFn: async () => {
      console.log('🔍 TAX SUMMARY QUERY STARTED', { year: selectedYear, account: selectedAccount });
      const accountIds = selectedAccount === 'all' ? [] : [selectedAccount];
      const result = await getTaxSummary(parseInt(selectedYear), accountIds);
      console.log('✅ TAX SUMMARY RESULT:', result);
      return result;
    },
  });

  // Log any errors
  if (summaryError) {
    console.error('❌ TAX SUMMARY ERROR:', summaryError);
  }

  // Fetch all trades for export
  const { data: allTrades = [] } = useQuery({
    queryKey: ['/api/trades', selectedAccount],
    queryFn: () => getTrades(selectedAccount === 'all' ? undefined : selectedAccount),
  });

  // Tax profile mutation
  const updateTaxProfileMutation = useMutation({
    mutationFn: upsertTaxProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tax/profile'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tax/summary'] });
      toast({ title: "Tax profile updated successfully" });
    },
  });

  // Expense form
  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      expense_type: 'software',
      vendor: '',
      amount: '',
      currency: 'USD',
      expense_date: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  // Create/Update expense mutation
  const expenseMutation = useMutation({
    mutationFn: async (data: ExpenseFormData) => {
      if (editingExpense) {
        return updateTaxExpense(editingExpense.id, data);
      }
      return createTaxExpense(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tax/expenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tax/summary'] });
      toast({
        title: editingExpense ? "Expense updated" : "Expense added",
        description: "Your tax expense has been saved successfully",
      });
      handleCloseExpenseModal();
    },
  });

  // Delete expense mutation
  const deleteExpenseMutation = useMutation({
    mutationFn: deleteTaxExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tax/expenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tax/summary'] });
      toast({ title: "Expense deleted successfully" });
    },
  });

  const handleOpenExpenseModal = (expense?: any) => {
    if (expense) {
      setEditingExpense(expense);
      form.reset({
        expense_type: expense.expense_type,
        vendor: expense.vendor,
        amount: expense.amount,
        currency: expense.currency || 'USD',
        expense_date: expense.expense_date.split('T')[0],
        notes: expense.notes || '',
      });
    } else {
      setEditingExpense(null);
      form.reset({
        expense_type: 'software',
        vendor: '',
        amount: '',
        currency: 'USD',
        expense_date: new Date().toISOString().split('T')[0],
        notes: '',
      });
    }
    setIsExpenseModalOpen(true);
  };

  const handleCloseExpenseModal = () => {
    setIsExpenseModalOpen(false);
    setEditingExpense(null);
    form.reset();
  };

  const onSubmitExpense = (data: ExpenseFormData) => {
    expenseMutation.mutate(data);
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount_report || exp.amount || '0'), 0);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // Export handlers
  const handleExportTrades = () => {
    if (!allTrades || allTrades.length === 0) {
      toast({ title: "No trades to export", variant: "destructive" });
      return;
    }
    exportTradesToCSV(allTrades, parseInt(selectedYear));
    toast({ title: "Trades exported successfully", description: `Downloaded trades_${selectedYear}.csv` });
  };

  const handleExportExpenses = () => {
    if (!expenses || expenses.length === 0) {
      toast({ title: "No expenses to export", variant: "destructive" });
      return;
    }
    exportExpensesToCSV(expenses, parseInt(selectedYear));
    toast({ title: "Expenses exported successfully", description: `Downloaded expenses_${selectedYear}.csv` });
  };

  const handleExportPDF = () => {
    if (!taxSummary) {
      toast({ title: "No tax summary available", variant: "destructive" });
      return;
    }
    exportTaxSummaryPDF(taxSummary, parseInt(selectedYear));
    toast({ title: "PDF export initiated", description: "Print dialog opened for PDF generation" });
  };

  const handleExportHTML = () => {
    if (!taxSummary) {
      toast({ title: "No tax summary available", variant: "destructive" });
      return;
    }
    exportTaxSummaryHTML(taxSummary, parseInt(selectedYear));
    toast({ title: "HTML exported successfully", description: `Downloaded tax_summary_${selectedYear}.html` });
  };

  return (
    <div className="p-4 lg:p-8 min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Tax Reports</h1>
          <p className="text-gray-300">Generate comprehensive tax reports for your trading activity</p>
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

        <Select value={selectedAccount} onValueChange={setSelectedAccount}>
          <SelectTrigger className="w-48" data-testid="select-tax-account">
            <SelectValue placeholder="Select Account" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Accounts</SelectItem>
            {accounts.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                {account.account_name}
              </SelectItem>
            ))}
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
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Trading Expenses</CardTitle>
                    <CardDescription>Track deductible expenses for tax purposes</CardDescription>
                  </div>
                  <Button onClick={() => handleOpenExpenseModal()} data-testid="button-add-expense">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Expense
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card className="border-red-500/30 bg-red-950/20">
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

                    <Card className="border-blue-500/30 bg-blue-950/20">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Expense Count</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{expenses.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Total expense entries</p>
                      </CardContent>
                    </Card>

                    <Card className="border-purple-500/30 bg-purple-950/20">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Currency</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-purple-600">{taxProfile?.reporting_currency || 'USD'}</div>
                        <p className="text-xs text-muted-foreground mt-1">Reporting currency</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Expense List</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {expensesLoading ? (
                        <div className="text-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                        </div>
                      ) : expenses.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>No expenses recorded yet</p>
                          <p className="text-sm mt-1">Click "Add Expense" to track your trading-related expenses</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {expenses.map((expense) => (
                            <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {expense.expense_type}
                                  </Badge>
                                  <span className="font-medium">{expense.vendor}</span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {format(new Date(expense.expense_date), 'MMM dd, yyyy')}
                                  {expense.notes && ` • ${expense.notes}`}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-bold text-red-600">
                                  ${parseFloat(expense.amount_report || expense.amount).toFixed(2)}
                                </span>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleOpenExpenseModal(expense)}
                                    data-testid={`button-edit-expense-${expense.id}`}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      if (confirm('Are you sure you want to delete this expense?')) {
                                        deleteExpenseMutation.mutate(expense.id);
                                      }
                                    }}
                                    data-testid={`button-delete-expense-${expense.id}`}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tax Summary Tab */}
        <TabsContent value="summary" className="space-y-4">
          {summaryLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Trading Income</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${(taxSummary?.totals.trading_income || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${(taxSummary?.totals.trading_income || 0).toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Total P&L for {selectedYear}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Swap Income</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      ${(taxSummary?.totals.swap_income || 0).toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {taxProfile?.include_swap_in_income ? 'Included' : 'Excluded'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Deductions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      ${((taxSummary?.totals.commission_deduction || 0) + (taxSummary?.totals.expenses || 0)).toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Commissions + Expenses</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Net Taxable Income</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${(taxSummary?.totals.net_income || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${(taxSummary?.totals.net_income || 0).toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">After all deductions</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Breakdown</CardTitle>
                    <CardDescription>Income and expenses by month for {selectedYear}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {taxSummary?.monthly.filter(m => m.trading_income !== 0 || m.expenses !== 0).map((item) => (
                        <div key={item.month} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{monthNames[item.month - 1]}</span>
                          </div>
                          <div className={`font-semibold flex items-center gap-1 ${item.net_income >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {item.net_income >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                            ${Math.abs(item.net_income).toFixed(2)}
                          </div>
                        </div>
                      ))}
                      {taxSummary?.monthly.every(m => m.trading_income === 0 && m.expenses === 0) && (
                        <p className="text-center text-muted-foreground py-4">No trading activity for {selectedYear}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Tax Settings</CardTitle>
                    <CardDescription>Configure what to include in tax calculations</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="swap-toggle">Include Swap in Income</Label>
                        <p className="text-sm text-muted-foreground">Add swap fees to taxable income</p>
                      </div>
                      <Switch
                        id="swap-toggle"
                        checked={taxProfile?.include_swap_in_income === 1}
                        onCheckedChange={(checked) => {
                          updateTaxProfileMutation.mutate({
                            include_swap_in_income: checked ? 1 : 0
                          });
                        }}
                        data-testid="toggle-swap-income"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="commission-toggle">Include Commission Deduction</Label>
                        <p className="text-sm text-muted-foreground">Deduct trading commissions</p>
                      </div>
                      <Switch
                        id="commission-toggle"
                        checked={taxProfile?.include_commission_deduction === 1}
                        onCheckedChange={(checked) => {
                          updateTaxProfileMutation.mutate({
                            include_commission_deduction: checked ? 1 : 0
                          });
                        }}
                        data-testid="toggle-commission-deduction"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="unrealized-toggle">Include Unrealized P&L</Label>
                        <p className="text-sm text-muted-foreground">Include open positions (not recommended)</p>
                      </div>
                      <Switch
                        id="unrealized-toggle"
                        checked={taxProfile?.include_unrealized_pnl === 1}
                        onCheckedChange={(checked) => {
                          updateTaxProfileMutation.mutate({
                            include_unrealized_pnl: checked ? 1 : 0
                          });
                        }}
                        data-testid="toggle-unrealized-pnl"
                      />
                    </div>

                    <div className="pt-4 border-t">
                      <p className="text-xs text-amber-400">
                        <strong>⚠️ Note:</strong> These settings affect your tax calculations. Consult a tax professional before making changes.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Export Reports</CardTitle>
              <CardDescription>Download tax documents and trading summaries</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full justify-start" 
                variant="outline" 
                onClick={handleExportTrades}
                data-testid="button-export-csv-trades"
              >
                <FileText className="h-4 w-4 mr-2" />
                Export Trades (CSV)
                <Download className="h-4 w-4 ml-auto" />
              </Button>
              
              <Button 
                className="w-full justify-start" 
                variant="outline" 
                onClick={handleExportExpenses}
                data-testid="button-export-csv-expenses"
              >
                <FileText className="h-4 w-4 mr-2" />
                Export Expenses (CSV)
                <Download className="h-4 w-4 ml-auto" />
              </Button>
              
              <Button 
                className="w-full justify-start" 
                variant="outline" 
                onClick={handleExportPDF}
                data-testid="button-export-pdf"
              >
                <FileText className="h-4 w-4 mr-2" />
                Tax Summary Report (PDF)
                <Download className="h-4 w-4 ml-auto" />
              </Button>
              
              <Button 
                className="w-full justify-start" 
                variant="outline" 
                onClick={handleExportHTML}
                data-testid="button-export-html"
              >
                <FileText className="h-4 w-4 mr-2" />
                Tax Summary Report (HTML)
                <Download className="h-4 w-4 ml-auto" />
              </Button>

              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  <strong>Note:</strong> These reports are for informational purposes only. Please consult with a tax professional for accurate tax filing.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Expense Add/Edit Modal */}
      <Dialog open={isExpenseModalOpen} onOpenChange={setIsExpenseModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
            <DialogDescription>Track deductible trading expenses for tax purposes</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitExpense)} className="space-y-4">
              <FormField
                control={form.control}
                name="expense_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expense Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-expense-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="software">Software</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="data">Data Feeds</SelectItem>
                        <SelectItem value="hardware">Hardware</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vendor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor/Description</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., TradingView, Forex.com" data-testid="input-vendor" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" placeholder="0.00" data-testid="input-amount" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expense_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" data-testid="input-expense-date" />
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
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Additional details..." data-testid="textarea-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={handleCloseExpenseModal} data-testid="button-cancel-expense">
                  Cancel
                </Button>
                <Button type="submit" disabled={expenseMutation.isPending} data-testid="button-save-expense">
                  {expenseMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Expense'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
