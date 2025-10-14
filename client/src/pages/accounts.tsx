import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, TrendingUp, Trash2, DollarSign, BarChart3, Eye } from "lucide-react";
import { getTradeAccounts, createTradeAccount, deleteTradeAccount, toggleAccountStatus, getAccountAnalytics, migrateLegacyTrades } from "@/lib/supabase-service";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import type { TradeAccount } from "@shared/schema";

const createAccountSchema = z.object({
  account_type: z.enum(['demo', 'proprietary_firm', 'live_personal', 'live_company']),
  market_type: z.enum(['forex', 'futures', 'stocks', 'crypto']),
  broker_name: z.string().min(1, "Broker name is required"),
  account_name: z.string().min(1, "Account name/number is required"),
  starting_balance: z.string().min(1, "Starting balance is required"),
});

export default function Accounts() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<TradeAccount | null>(null);

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['/api/trade-accounts'],
    queryFn: getTradeAccounts,
  });

  const { data: analytics } = useQuery({
    queryKey: ['/api/account-analytics', selectedAccount?.id],
    queryFn: () => selectedAccount ? getAccountAnalytics(selectedAccount.id) : null,
    enabled: !!selectedAccount,
  });

  const form = useForm({
    resolver: zodResolver(createAccountSchema),
    defaultValues: {
      account_type: 'demo' as const,
      market_type: 'forex' as const,
      broker_name: '',
      account_name: '',
      starting_balance: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: createTradeAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trade-accounts'] });
      toast({
        title: "Success",
        description: "Trading account created successfully",
      });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTradeAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trade-accounts'] });
      toast({
        title: "Success",
        description: "Trading account deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleAccountStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trade-accounts'] });
      toast({
        title: "Success",
        description: "Account status updated",
      });
    },
  });

  // Auto-migrate legacy trades on first load
  useEffect(() => {
    const runMigration = async () => {
      try {
        const result = await migrateLegacyTrades();
        if (result.migrated) {
          queryClient.invalidateQueries({ queryKey: ['/api/trade-accounts'] });
          toast({
            title: "Migration Complete! 🎉",
            description: `Linked ${result.tradeCount} existing trade(s) to "Legacy Account"`,
            duration: 5000,
          });
        }
      } catch (error) {
        console.error('Migration error:', error);
      }
    };
    runMigration();
  }, []);

  const onSubmit = (data: z.infer<typeof createAccountSchema>) => {
    createMutation.mutate({
      ...data,
      starting_balance: parseFloat(data.starting_balance),
    });
  };

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case 'demo': return 'Demo';
      case 'proprietary_firm': return 'Prop Firm';
      case 'live_personal': return 'Live Personal';
      case 'live_company': return 'Live Company';
      default: return type;
    }
  };

  const getMarketTypeLabel = (type: string) => {
    switch (type) {
      case 'forex': return 'Forex';
      case 'futures': return 'Futures';
      case 'stocks': return 'Stocks';
      case 'crypto': return 'Crypto';
      default: return type;
    }
  };

  const accountType = form.watch('account_type') as 'demo' | 'proprietary_firm' | 'live_personal' | 'live_company';

  return (
    <div className="p-4 lg:p-8 min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white" data-testid="text-accounts-title">
            Trading Accounts
          </h1>
          <p className="text-gray-300">
            Manage your demo, prop firm, and live trading accounts
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-account">
              <Plus className="h-4 w-4 mr-2" />
              Add Account
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add Trading Account</DialogTitle>
              <DialogDescription>
                Connect a new trading account to track your performance
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="account_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-account-type">
                            <SelectValue placeholder="Select account type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="demo">Demo Account</SelectItem>
                          <SelectItem value="proprietary_firm">Proprietary Firm Account</SelectItem>
                          <SelectItem value="live_personal">Live Personal Account</SelectItem>
                          <SelectItem value="live_company">Live Company Account</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="market_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Market Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-market-type">
                            <SelectValue placeholder="Select market type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="forex">Forex</SelectItem>
                          <SelectItem value="futures">Futures</SelectItem>
                          <SelectItem value="stocks">Stocks</SelectItem>
                          <SelectItem value="crypto">Cryptocurrency</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="broker_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {accountType === 'proprietary_firm' ? 'Prop Firm Name' : 'Broker Name'}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={
                            accountType === 'proprietary_firm'
                              ? 'e.g., FTMO, MyForexFunds'
                              : 'e.g., IC Markets, Binance'
                          }
                          data-testid="input-broker-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="account_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Name/Number</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., #12345678 or My Prop Challenge"
                          data-testid="input-account-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="starting_balance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Starting Balance ($)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          placeholder="10000.00"
                          data-testid="input-starting-balance"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    data-testid="button-create-account"
                  >
                    {createMutation.isPending ? 'Creating...' : 'Create Account'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading accounts...
        </div>
      ) : !accounts || accounts.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <DollarSign className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="font-semibold">No Trading Accounts</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Get started by adding your first trading account. You'll need at least one
                account before you can log trades.
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-first-account">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Account
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {accounts.map((account) => (
            <div key={account.id} className="relative">
              {/* Animated Cyan Border Snake Effect */}
              <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none z-0">
                <div className="absolute inset-[-2px]" style={{
                  background: 'conic-gradient(from 0deg, transparent 0%, transparent 60%, hsl(188, 94%, 60%) 80%, hsl(188, 94%, 70%) 90%, transparent 100%)',
                  animation: 'border-rotate 5.76s linear infinite',
                  borderRadius: '0.5rem',
                  filter: 'blur(0.5px)',
                }}></div>
                <div className="absolute inset-[2px] rounded-lg bg-slate-950"></div>
              </div>
              
              <Card className="relative z-10 bg-transparent border-0" data-testid={`account-card-${account.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {account.account_name}
                      {!account.is_active && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {account.broker_name} • {getMarketTypeLabel(account.market_type)}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      account.account_type === 'live_personal' || account.account_type === 'live_company'
                        ? 'default'
                        : account.account_type === 'proprietary_firm'
                        ? 'secondary'
                        : 'outline'
                    }
                    data-testid={`badge-account-type-${account.id}`}
                  >
                    {getAccountTypeLabel(account.account_type)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Starting Balance</p>
                    <p className="text-lg font-semibold" data-testid={`text-starting-balance-${account.id}`}>
                      {formatCurrency(account.starting_balance)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current Balance</p>
                    <p className="text-lg font-semibold" data-testid={`text-current-balance-${account.id}`}>
                      {formatCurrency(account.current_balance || account.starting_balance)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedAccount(account)}
                    data-testid={`button-view-analytics-${account.id}`}
                  >
                    <BarChart3 className="h-4 w-4 mr-1" />
                    Analytics
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      toggleMutation.mutate({
                        id: account.id,
                        isActive: !account.is_active,
                      })
                    }
                    data-testid={`button-toggle-status-${account.id}`}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    {account.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this account?')) {
                        deleteMutation.mutate(account.id);
                      }
                    }}
                    data-testid={`button-delete-${account.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Analytics Dialog */}
      <Dialog open={!!selectedAccount} onOpenChange={() => setSelectedAccount(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedAccount?.account_name} Analytics</DialogTitle>
            <DialogDescription>
              Performance metrics for this trading account
            </DialogDescription>
          </DialogHeader>
          {analytics && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Trades</p>
                  <p className="text-2xl font-bold">{analytics.totalTrades}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Win Rate</p>
                  <p className="text-2xl font-bold">{analytics.winRate}%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Winning Trades</p>
                  <p className="text-2xl font-bold text-green-500">{analytics.winningTrades}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Losing Trades</p>
                  <p className="text-2xl font-bold text-red-500">{analytics.losingTrades}</p>
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Total P&L</p>
                <p className={`text-3xl font-bold ${analytics.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatCurrency(analytics.totalPnL)}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
