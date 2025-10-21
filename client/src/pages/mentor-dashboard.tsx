import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  TrendingUp, 
  TrendingDown, 
  MessageCircle, 
  Eye, 
  Calendar,
  BarChart3,
  Target,
  Award,
  AlertCircle,
  Loader2
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { InviteTraderModal } from "@/components/InviteTraderModal";

// This would come from Supabase in production
interface Trader {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'active' | 'needs_attention' | 'inactive';
  joinDate: string;
  totalTrades: number;
  winRate: number;
  profitLoss: number;
  profitFactor: number;
  consistency: number;
  riskScore: string;
  lastActive: string;
  recentTrades: number;
}

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
};

const getStatusBadge = (status: string) => {
  switch(status) {
    case 'active':
      return <Badge className="bg-green-600">Active</Badge>;
    case 'needs_attention':
      return <Badge className="bg-amber-600">Needs Attention</Badge>;
    case 'inactive':
      return <Badge variant="secondary">Inactive</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getRiskBadge = (score: string) => {
  switch(score) {
    case 'Excellent':
      return <Badge className="bg-green-600">{score}</Badge>;
    case 'Good':
      return <Badge className="bg-cyan-600">{score}</Badge>;
    case 'Moderate':
      return <Badge className="bg-amber-600">{score}</Badge>;
    case 'Poor':
      return <Badge className="bg-red-600">{score}</Badge>;
    default:
      return <Badge variant="outline">{score}</Badge>;
  }
};

export default function MentorDashboard() {
  const { toast } = useToast();
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  // This would fetch real trader data from Supabase
  const { data: traders = [], isLoading } = useQuery<Trader[]>({
    queryKey: ['/api/mentor/traders'],
    queryFn: async () => {
      // TODO: Implement actual Supabase query to fetch mentor's traders
      // For now, return empty array
      return [];
    },
  });

  const totalTraders = traders.length;
  const activeTraders = traders.filter(t => t.status === 'active').length;
  const needsAttention = traders.filter(t => t.status === 'needs_attention').length;
  const avgWinRate = totalTraders > 0 ? (traders.reduce((sum, t) => sum + t.winRate, 0) / totalTraders).toFixed(1) : '0';
  const totalPnL = traders.reduce((sum, t) => sum + t.profitLoss, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-mentor-title">Mentor Dashboard</h1>
        <p className="text-muted-foreground">Monitor and support your trading students</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 border-cyan-500/60 widget-hover-pulse transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Traders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-600">{totalTraders}</div>
            <p className="text-xs text-muted-foreground mt-1">{activeTraders} active</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-500/60 widget-hover-pulse transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Avg Win Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{avgWinRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">Across all traders</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-500/60 widget-hover-pulse transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Award className="h-4 w-4" />
              Total P&L
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${totalPnL.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Combined performance</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-amber-500/60 widget-hover-pulse transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Need Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{needsAttention}</div>
            <p className="text-xs text-muted-foreground mt-1">Traders struggling</p>
          </CardContent>
        </Card>
      </div>

      {traders.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Traders Connected</h3>
              <p className="text-muted-foreground mb-6">
                You don't have any traders connected to your mentor account yet.
              </p>
              <Button 
                className="bg-cyan-600 hover:bg-cyan-700" 
                data-testid="button-invite-traders"
                onClick={() => setInviteModalOpen(true)}
              >
                <Users className="h-4 w-4 mr-2" />
                Invite Traders
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all" data-testid="tab-all-traders">
              All Traders ({totalTraders})
            </TabsTrigger>
            <TabsTrigger value="active" data-testid="tab-active-traders">
              Active ({activeTraders})
            </TabsTrigger>
            <TabsTrigger value="needs-attention" data-testid="tab-needs-attention">
              Needs Attention ({needsAttention})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {traders.map((trader) => (
              <Card key={trader.id} data-testid={`card-trader-${trader.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={trader.avatar} />
                        <AvatarFallback className="bg-cyan-600 text-white">
                          {getInitials(trader.name)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{trader.name}</h3>
                          {getStatusBadge(trader.status)}
                          {getRiskBadge(trader.riskScore)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{trader.email}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Total Trades</p>
                            <p className="text-sm font-semibold">{trader.totalTrades}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Win Rate</p>
                            <p className="text-sm font-semibold">{trader.winRate}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">P&L</p>
                            <p className={`text-sm font-semibold ${trader.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              ${trader.profitLoss.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Profit Factor</p>
                            <p className="text-sm font-semibold">{trader.profitFactor}</p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-muted-foreground">Consistency Score</p>
                            <p className="text-xs font-semibold text-cyan-600">{trader.consistency}%</p>
                          </div>
                          <Progress value={trader.consistency} className="h-2" />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <Button size="sm" variant="outline" data-testid={`button-view-${trader.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button size="sm" variant="outline" data-testid={`button-message-${trader.id}`}>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                      <Button size="sm" variant="outline" data-testid={`button-analytics-${trader.id}`}>
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Analytics
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 mt-4 pt-4 border-t text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      Joined {new Date(trader.joinDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-3 w-3" />
                      {trader.recentTrades} trades this week
                    </div>
                    <div className="flex items-center gap-2">
                      Last active: {trader.lastActive}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            {traders.filter(t => t.status === 'active').map((trader) => (
              <Card key={trader.id}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-cyan-600 text-white">
                        {getInitials(trader.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{trader.name}</h3>
                      <p className="text-sm text-muted-foreground">Win Rate: {trader.winRate}% • P&L: ${trader.profitLoss.toFixed(2)}</p>
                    </div>
                    <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700">View Details</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="needs-attention" className="space-y-4">
            {traders.filter(t => t.status === 'needs_attention').map((trader) => (
              <Card key={trader.id} className="border-amber-500/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-amber-600 text-white">
                        {getInitials(trader.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{trader.name}</h3>
                      <p className="text-sm text-amber-400">Win Rate: {trader.winRate}% • P&L: ${trader.profitLoss.toFixed(2)}</p>
                    </div>
                    <Button size="sm" className="bg-amber-600 hover:bg-amber-700">Reach Out</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      )}

      <InviteTraderModal open={inviteModalOpen} onOpenChange={setInviteModalOpen} />
    </div>
  );
}
