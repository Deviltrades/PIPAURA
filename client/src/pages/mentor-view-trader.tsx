import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Eye, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target,
  Loader2,
  Lock
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TraderAccount {
  id: string;
  account_name: string;
  account_number: string;
  broker: string;
  account_type: string;
  currency: string;
  initial_balance: number;
  current_balance: number;
}

interface TraderStats {
  total_trades: number;
  win_rate: number;
  profit_loss: number;
  profit_factor: number;
  avg_win: number;
  avg_loss: number;
  largest_win: number;
  largest_loss: number;
}

export default function MentorViewTrader() {
  const { traderId } = useParams();
  const [, setLocation] = useLocation();

  // Fetch trader details
  const { data: trader, isLoading: traderLoading } = useQuery<{
    name: string;
    email: string;
    avatar_url: string | null;
  }>({
    queryKey: ['/api/mentor/trader', traderId, 'details'],
  });

  // Fetch trader accounts
  const { data: accounts = [], isLoading: accountsLoading } = useQuery<TraderAccount[]>({
    queryKey: ['/api/mentor/trader', traderId, 'accounts'],
  });

  // Fetch trader stats
  const { data: stats, isLoading: statsLoading } = useQuery<TraderStats>({
    queryKey: ['/api/mentor/trader', traderId, 'stats'],
  });

  const isLoading = traderLoading || accountsLoading || statsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  const traderName = trader?.name || 'Trader';
  const traderEmail = trader?.email || '';
  const traderAvatar = trader?.avatar_url || null;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLocation('/mentor')}
          data-testid="button-back-to-mentor"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      {/* Trader Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={traderAvatar || undefined} />
              <AvatarFallback className="bg-cyan-600 text-white text-lg">
                {getInitials(traderName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <CardTitle className="text-2xl">{traderName}</CardTitle>
                <Badge variant="outline" className="gap-1">
                  <Eye className="h-3 w-3" />
                  Read-Only
                </Badge>
              </div>
              <CardDescription className="text-base mt-1">{traderEmail}</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Overview */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Trades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_trades}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Win Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.win_rate.toFixed(1)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total P&L
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.profit_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${stats.profit_loss.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Profit Factor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyan-600">
                {stats.profit_factor.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-muted-foreground" />
            Trading Accounts (Read-Only)
          </CardTitle>
          <CardDescription>
            You can view this trader's accounts but cannot make any changes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No trading accounts found
            </div>
          ) : (
            <div className="space-y-4">
              {accounts.map((account) => (
                <Card key={account.id} className="border-2">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div>
                          <h3 className="font-semibold text-lg">{account.account_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {account.broker} • {account.account_number}
                          </p>
                        </div>
                        
                        <div className="flex gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Account Type</p>
                            <p className="text-sm font-medium">{account.account_type}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Currency</p>
                            <p className="text-sm font-medium">{account.currency}</p>
                          </div>
                        </div>
                      </div>

                      <div className="text-right space-y-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Initial Balance</p>
                          <p className="text-sm font-medium">
                            ${account.initial_balance.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Current Balance</p>
                          <p className={`text-lg font-bold ${
                            account.current_balance >= account.initial_balance 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            ${account.current_balance.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          {account.current_balance >= account.initial_balance ? (
                            <>
                              <TrendingUp className="h-3 w-3 text-green-600" />
                              <span className="text-green-600">
                                +{((account.current_balance - account.initial_balance) / account.initial_balance * 100).toFixed(2)}%
                              </span>
                            </>
                          ) : (
                            <>
                              <TrendingDown className="h-3 w-3 text-red-600" />
                              <span className="text-red-600">
                                {((account.current_balance - account.initial_balance) / account.initial_balance * 100).toFixed(2)}%
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Banner */}
      <Card className="border-cyan-500/50 bg-cyan-50 dark:bg-cyan-950/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-cyan-600 mt-0.5" />
            <div>
              <p className="font-medium text-cyan-900 dark:text-cyan-100">
                Read-Only Access
              </p>
              <p className="text-sm text-cyan-700 dark:text-cyan-300 mt-1">
                As a mentor, you can view this trader's accounts and performance metrics, but you cannot make any modifications to their data.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
