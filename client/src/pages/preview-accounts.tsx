import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { demoAccounts } from "@/lib/demo-data";
import { formatCurrency } from "@/lib/utils";
import { Plus, BarChart3, Power, Trash2, TrendingUp, TrendingDown } from "lucide-react";

export default function PreviewAccounts() {
  const getAccountTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      demo: "Demo Account",
      proprietary_firm: "Prop Firm",
      live_personal: "Live Personal",
      live_company: "Live Company",
    };
    return labels[type] || type;
  };

  const getMarketTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      forex: "Forex",
      futures: "Futures",
      stocks: "Stocks",
      crypto: "Crypto",
    };
    return labels[type] || type;
  };

  const calculatePnL = (account: typeof demoAccounts[0]) => {
    return account.current_balance - account.starting_balance;
  };

  const calculatePnLPercent = (account: typeof demoAccounts[0]) => {
    const pnl = calculatePnL(account);
    return (pnl / account.starting_balance) * 100;
  };

  return (
    <div className="p-3 sm:p-4 lg:p-8 min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Trading Accounts</h1>
            <p className="text-sm sm:text-base text-gray-300">Manage your connected trading accounts</p>
          </div>
          <div className="flex gap-2 sm:gap-3 flex-wrap">
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2">
              <p className="text-xs sm:text-sm text-cyan-400">📊 Preview Mode</p>
            </div>
            <Button 
              className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-xs sm:text-sm"
              data-testid="button-add-account"
            >
              <Plus className="h-3 h-3 sm:h-4 sm:w-4 mr-2" />
              Add Account
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400">Total Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{demoAccounts.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400">Active Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {demoAccounts.filter(a => a.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400">Total Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(demoAccounts.reduce((sum, a) => sum + a.current_balance, 0))}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400">Total P&L</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              demoAccounts.reduce((sum, a) => sum + calculatePnL(a), 0) >= 0 
                ? "text-green-400" 
                : "text-red-400"
            }`}>
              {formatCurrency(demoAccounts.reduce((sum, a) => sum + calculatePnL(a), 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {demoAccounts.map((account) => {
          const pnl = calculatePnL(account);
          const pnlPercent = calculatePnLPercent(account);
          
          return (
            <Card 
              key={account.id} 
              className="bg-slate-900/50 border-slate-700 hover:border-cyan-500/50 transition-all"
              style={{
                boxShadow: '0 0 15px rgba(34, 211, 238, 0.15), 0 0 30px rgba(34, 211, 238, 0.08)'
              }}
              data-testid={`account-card-${account.id}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-white">
                      {account.account_name}
                      {!account.is_active && (
                        <Badge variant="secondary" className="text-xs">Inactive</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      {account.broker_name} • {getMarketTypeLabel(account.market_type)}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      ['live_personal', 'live_company'].includes(account.account_type)
                        ? 'default'
                        : account.account_type === 'proprietary_firm'
                        ? 'secondary'
                        : 'outline'
                    }
                    className={
                      ['live_personal', 'live_company'].includes(account.account_type)
                        ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50'
                        : account.account_type === 'proprietary_firm'
                        ? 'bg-purple-500/20 text-purple-400 border-purple-500/50'
                        : 'border-slate-600 text-slate-400'
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
                    <p className="text-sm text-slate-500">Starting Balance</p>
                    <p 
                      className="text-lg font-semibold text-white" 
                      data-testid={`text-starting-balance-${account.id}`}
                    >
                      {formatCurrency(account.starting_balance)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Current Balance</p>
                    <p 
                      className="text-lg font-semibold text-white" 
                      data-testid={`text-current-balance-${account.id}`}
                    >
                      {formatCurrency(account.current_balance)}
                    </p>
                  </div>
                </div>

                {/* P&L Display */}
                <div className="pt-3 border-t border-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Total P&L</span>
                    <div className="flex items-center gap-2">
                      {pnl >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-400" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-400" />
                      )}
                      <span className={`text-lg font-bold ${pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {formatCurrency(pnl)}
                      </span>
                      <span className={`text-sm ${pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                        ({pnlPercent >= 0 ? "+" : ""}{pnlPercent.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-slate-600 text-slate-300 hover:text-white hover:border-cyan-500"
                    data-testid={`button-view-analytics-${account.id}`}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Analytics
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`border-slate-600 ${
                      account.is_active 
                        ? "text-green-400 hover:text-green-300" 
                        : "text-slate-500 hover:text-slate-400"
                    }`}
                    data-testid={`button-toggle-status-${account.id}`}
                  >
                    <Power className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-600 text-red-400 hover:text-red-300 hover:border-red-500"
                    data-testid={`button-delete-${account.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info Card */}
      <div className="mt-8 bg-gradient-to-br from-cyan-600/10 to-blue-600/10 border border-cyan-500/20 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-2">
          💡 Account Management
        </h3>
        <p className="text-slate-400 text-sm">
          This preview shows {demoAccounts.length} demo trading accounts including Demo, Prop Firm, and Live accounts. 
          In the real app, you can add unlimited accounts, track performance separately, and switch between them seamlessly.
        </p>
      </div>
    </div>
  );
}
