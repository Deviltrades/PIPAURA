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
import { Plus, TrendingUp, Trash2, DollarSign, BarChart3, Power, CloudUpload, RefreshCw, Check, X } from "lucide-react";
import { getTradeAccounts, createTradeAccount, deleteTradeAccount, toggleAccountStatus, getAccountAnalytics, migrateLegacyTrades } from "@/lib/supabase-service";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import type { TradeAccount } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";

const createAccountSchema = z.object({
  account_type: z.enum(['demo', 'proprietary_firm', 'live_personal', 'live_company']),
  market_type: z.enum(['forex', 'futures', 'stocks', 'crypto']),
  broker_name: z.string().min(1, "Broker name is required"),
  account_name: z.string().min(1, "Account name/number is required"),
  starting_balance: z.string().min(1, "Starting balance is required"),
});

export default function Accounts() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<TradeAccount | null>(null);
  
  // MyFxBook state
  const [myfxbookEmail, setMyfxbookEmail] = useState("");
  const [myfxbookPassword, setMyfxbookPassword] = useState("");
  const [showMyfxbookForm, setShowMyfxbookForm] = useState(false);

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['/api/trade-accounts'],
    queryFn: getTradeAccounts,
  });

  const { data: analytics } = useQuery({
    queryKey: ['/api/account-analytics', selectedAccount?.id],
    queryFn: () => selectedAccount ? getAccountAnalytics(selectedAccount.id) : null,
    enabled: !!selectedAccount,
  });

  // MyFxBook linked account query - uses secure backend endpoint
  const { data: myfxbookStatus, refetch: refetchMyfxbook } = useQuery({
    queryKey: ['/api/myfxbook/status', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      // Get the session token
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL!,
        import.meta.env.VITE_SUPABASE_ANON_KEY!
      );
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      // Call secure backend endpoint with auth token
      const response = await fetch('/api/myfxbook/status', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch MyFxBook status');
      }

      return response.json();
    },
    enabled: !!user?.id,
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

  // MyFxBook connect mutation
  const connectMyfxbookMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // Get the session token
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL!,
        import.meta.env.VITE_SUPABASE_ANON_KEY!
      );
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/myfxbook/connect', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: myfxbookEmail,
          password: myfxbookPassword,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Connection failed');
      }
      return response.json();
    },
    onSuccess: (data) => {
      refetchMyfxbook();
      queryClient.invalidateQueries({ queryKey: ['/api/trade-accounts'] });
      toast({
        title: "MyFxBook Connected",
        description: `Successfully linked ${data.accountCount} trading account(s)`,
      });
      setMyfxbookEmail("");
      setMyfxbookPassword("");
      setShowMyfxbookForm(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect MyFxBook account",
        variant: "destructive",
      });
    },
  });

  // MyFxBook sync mutation
  const syncMyfxbookMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // Get the session token
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL!,
        import.meta.env.VITE_SUPABASE_ANON_KEY!
      );
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/myfxbook/sync-user', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({}),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Sync failed');
      }
      return response.json();
    },
    onSuccess: (data) => {
      refetchMyfxbook();
      queryClient.invalidateQueries({ queryKey: ['/api/trade-accounts'] });
      toast({
        title: "Sync Complete",
        description: `Imported ${data.importedCount} new trade(s) from ${data.accountsProcessed} account(s)`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync MyFxBook trades",
        variant: "destructive",
      });
    },
  });

  // MyFxBook disconnect mutation
  const disconnectMyfxbookMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // Get the session token
      const { createClient} = await import('@supabase/supabase-js');
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL!,
        import.meta.env.VITE_SUPABASE_ANON_KEY!
      );
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/myfxbook/disconnect', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Disconnect failed');
      }
      return response.json();
    },
    onSuccess: () => {
      refetchMyfxbook();
      queryClient.invalidateQueries({ queryKey: ['/api/trade-accounts'] });
      toast({
        title: "Disconnected",
        description: "MyFxBook account has been disconnected successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Disconnect Failed",
        description: error.message || "Failed to disconnect MyFxBook account",
        variant: "destructive",
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
      case 'demo': return 'Demo Account';
      case 'proprietary_firm': return 'Prop Firm';
      case 'live_personal': return 'Live Personal';
      case 'live_company': return 'Live Company';
      default: return type;
    }
  };

  const getAccountTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'demo': return 'bg-gray-600/50 text-gray-200 border-gray-500/50';
      case 'proprietary_firm': return 'bg-purple-600/50 text-purple-200 border-purple-500/50';
      case 'live_personal': return 'bg-cyan-600/50 text-cyan-200 border-cyan-500/50';
      case 'live_company': return 'bg-blue-600/50 text-blue-200 border-blue-500/50';
      default: return 'bg-gray-600/50 text-gray-200 border-gray-500/50';
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

  // Calculate summary stats
  const totalAccounts = accounts?.length || 0;
  const activeAccounts = accounts?.filter(a => a.is_active).length || 0;
  const totalBalance = accounts?.reduce((sum, acc) => sum + (acc.current_balance || acc.starting_balance), 0) || 0;
  const totalPnL = accounts?.reduce((sum, acc) => {
    const startBalance = acc.starting_balance;
    const currentBalance = acc.current_balance || acc.starting_balance;
    return sum + (currentBalance - startBalance);
  }, 0) || 0;

  return (
    <div className="p-4 lg:p-8 min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white" data-testid="text-accounts-title">
            Trading Accounts
          </h1>
          <p className="text-sm sm:text-base text-gray-300">
            Manage your demo, prop firm, and live trading accounts
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto" data-testid="button-add-account">
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
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="rounded-xl border-2 border-cyan-500/60 p-4 sm:p-6 widget-hover-pulse" style={{ backgroundColor: "#0f172a" }}>
              <p className="text-gray-400 text-xs sm:text-sm mb-1 sm:mb-2">Total Accounts</p>
              <p className="text-2xl sm:text-3xl font-bold text-white" data-testid="text-total-accounts">{totalAccounts}</p>
            </div>
            <div className="rounded-xl border-2 border-cyan-500/60 p-4 sm:p-6 widget-hover-pulse" style={{ backgroundColor: "#0f172a" }}>
              <p className="text-gray-400 text-xs sm:text-sm mb-1 sm:mb-2">Active Accounts</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-400" data-testid="text-active-accounts">{activeAccounts}</p>
            </div>
            <div className="rounded-xl border-2 border-cyan-500/60 p-4 sm:p-6 widget-hover-pulse" style={{ backgroundColor: "#0f172a" }}>
              <p className="text-gray-400 text-xs sm:text-sm mb-1 sm:mb-2">Total Balance</p>
              <p className="text-xl sm:text-3xl font-bold text-white" data-testid="text-total-balance">{formatCurrency(totalBalance)}</p>
            </div>
            <div className="rounded-xl border-2 border-cyan-500/60 p-4 sm:p-6 widget-hover-pulse" style={{ backgroundColor: "#0f172a" }}>
              <p className="text-gray-400 text-xs sm:text-sm mb-1 sm:mb-2">Total P&L</p>
              <p className="text-xl sm:text-3xl font-bold text-green-400" data-testid="text-total-pnl">{formatCurrency(totalPnL)}</p>
            </div>
          </div>

          {/* MyFxBook Auto-Sync Integration */}
          <Card className="mb-4 sm:mb-6 bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CloudUpload className="h-6 w-6 text-purple-400" />
                  <div>
                    <CardTitle className="text-white">MyFxBook Auto-Sync</CardTitle>
                    <CardDescription>Automatically import your trades from MyFxBook</CardDescription>
                  </div>
                </div>
                {myfxbookStatus?.linked && (
                  <Badge className="bg-green-600/50 text-green-200 border-green-500/50">
                    <Check className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!myfxbookStatus?.linked ? (
                <>
                  {!showMyfxbookForm ? (
                    <div className="text-center py-6">
                      <p className="text-sm text-gray-300 mb-4">
                        Connect your MyFxBook account to automatically sync trades every 3 hours
                      </p>
                      <Button 
                        onClick={() => setShowMyfxbookForm(true)}
                        className="bg-purple-600 hover:bg-purple-700"
                        data-testid="button-connect-myfxbook"
                      >
                        <CloudUpload className="h-4 w-4 mr-2" />
                        Connect MyFxBook
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          MyFxBook Email
                        </label>
                        <Input
                          type="email"
                          placeholder="your@email.com"
                          value={myfxbookEmail}
                          onChange={(e) => setMyfxbookEmail(e.target.value)}
                          data-testid="input-myfxbook-email"
                          className="bg-slate-800/50 border-slate-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          MyFxBook Password
                        </label>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          value={myfxbookPassword}
                          onChange={(e) => setMyfxbookPassword(e.target.value)}
                          data-testid="input-myfxbook-password"
                          className="bg-slate-800/50 border-slate-600"
                        />
                      </div>
                      <p className="text-xs text-gray-400">
                        🔒 Your credentials are encrypted and never shared. We use them only to sync your trades.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowMyfxbookForm(false);
                            setMyfxbookEmail("");
                            setMyfxbookPassword("");
                          }}
                          data-testid="button-cancel-myfxbook"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                        <Button
                          onClick={() => connectMyfxbookMutation.mutate()}
                          disabled={connectMyfxbookMutation.isPending || !myfxbookEmail || !myfxbookPassword}
                          className="bg-purple-600 hover:bg-purple-700"
                          data-testid="button-submit-myfxbook"
                        >
                          {connectMyfxbookMutation.isPending ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Connecting...
                            </>
                          ) : (
                            <>
                              <CloudUpload className="h-4 w-4 mr-2" />
                              Connect
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                      <p className="text-xs text-gray-400 mb-1">Linked Email</p>
                      <p className="text-sm font-medium text-white">{myfxbookStatus.account?.email}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                      <p className="text-xs text-gray-400 mb-1">Last Sync</p>
                      <p className="text-sm font-medium text-white">
                        {myfxbookStatus.account?.last_sync_at 
                          ? new Date(myfxbookStatus.account.last_sync_at).toLocaleString()
                          : 'Never'}
                      </p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                      <p className="text-xs text-gray-400 mb-1">Status</p>
                      <p className="text-sm font-medium text-green-400 capitalize">{myfxbookStatus.account?.sync_status}</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex gap-2">
                      <Button
                        onClick={() => syncMyfxbookMutation.mutate()}
                        disabled={syncMyfxbookMutation.isPending}
                        className="bg-purple-600 hover:bg-purple-700"
                        data-testid="button-sync-now"
                      >
                        {syncMyfxbookMutation.isPending ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Syncing...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Sync Now
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => disconnectMyfxbookMutation.mutate()}
                        disabled={disconnectMyfxbookMutation.isPending}
                        variant="outline"
                        className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                        data-testid="button-disconnect-myfxbook"
                      >
                        {disconnectMyfxbookMutation.isPending ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Disconnecting...
                          </>
                        ) : (
                          <>
                            <X className="h-4 w-4 mr-2" />
                            Disconnect
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-400 flex items-center">
                      Auto-sync runs every 3 hours
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Cards */}
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
            {accounts.map((account) => {
              const pnl = (account.current_balance || account.starting_balance) - account.starting_balance;
              const pnlPercentage = account.starting_balance > 0 
                ? ((pnl / account.starting_balance) * 100).toFixed(2)
                : '0.00';
              
              return (
                <div key={account.id} className="rounded-xl border-2 border-cyan-500/60 p-4 sm:p-6 widget-hover-pulse" style={{ backgroundColor: "#0f172a" }} data-testid={`account-card-${account.id}`}>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 sm:mb-4">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                        <h2 className="text-lg sm:text-xl font-bold text-white">{account.account_name}</h2>
                        <Badge className={`${getAccountTypeBadgeColor(account.account_type)} border text-xs w-fit`} data-testid={`badge-account-type-${account.id}`}>
                          {getAccountTypeLabel(account.account_type)}
                        </Badge>
                      </div>
                      <p className="text-gray-400 text-xs sm:text-sm">
                        {account.broker_name} • {getMarketTypeLabel(account.market_type)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div>
                      <p className="text-gray-400 text-xs sm:text-sm mb-1">Starting Balance</p>
                      <p className="text-base sm:text-xl font-bold text-white" data-testid={`text-starting-balance-${account.id}`}>
                        {formatCurrency(account.starting_balance)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs sm:text-sm mb-1">Current Balance</p>
                      <p className="text-base sm:text-xl font-bold text-white" data-testid={`text-current-balance-${account.id}`}>
                        {formatCurrency(account.current_balance || account.starting_balance)}
                      </p>
                    </div>
                  </div>

                  <div className="mb-3 sm:mb-4">
                    <p className="text-gray-400 text-xs sm:text-sm mb-1">Total P&L</p>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 sm:h-5 w-4 sm:w-5 text-green-400 flex-shrink-0" />
                      <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
                        <p className="text-lg sm:text-2xl font-bold text-green-400" data-testid={`text-pnl-${account.id}`}>
                          {formatCurrency(pnl)}
                        </p>
                        <span className="text-sm sm:text-lg text-green-400 font-bold">({pnlPercentage > '0' ? '+' : ''}{pnlPercentage}%)</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 bg-transparent border-cyan-500/60 hover:bg-cyan-500/10 text-xs sm:text-sm"
                      onClick={() => setSelectedAccount(account)}
                      data-testid={`button-view-analytics-${account.id}`}
                    >
                      <BarChart3 className="h-3 sm:h-4 w-3 sm:w-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">View Analytics</span>
                      <span className="sm:hidden">Analytics</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className={`bg-transparent border-cyan-500/60 h-8 w-8 sm:h-10 sm:w-10 ${account.is_active ? 'hover:bg-green-500/10 text-green-400' : 'hover:bg-gray-500/10'}`}
                      onClick={() =>
                        toggleMutation.mutate({
                          id: account.id,
                          isActive: !account.is_active,
                        })
                      }
                      data-testid={`button-toggle-status-${account.id}`}
                    >
                      <Power className="h-3 sm:h-4 w-3 sm:w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="bg-transparent border-red-500/60 hover:bg-red-500/10 text-red-400 h-8 w-8 sm:h-10 sm:w-10"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this account?')) {
                          deleteMutation.mutate(account.id);
                        }
                      }}
                      data-testid={`button-delete-${account.id}`}
                    >
                      <Trash2 className="h-3 sm:h-4 w-3 sm:w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
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
