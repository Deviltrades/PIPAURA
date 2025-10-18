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
  AlertCircle
} from "lucide-react";

// Demo traders data
const demoTraders = [
  {
    id: 1,
    name: "Alex Johnson",
    email: "alex.j@email.com",
    avatar: "",
    status: "active",
    joinDate: "2024-01-15",
    totalTrades: 145,
    winRate: 68.5,
    profitLoss: 8450.25,
    profitFactor: 2.1,
    consistency: 78,
    riskScore: "Good",
    lastActive: "2 hours ago",
    recentTrades: 12
  },
  {
    id: 2,
    name: "Sarah Martinez",
    email: "sarah.m@email.com",
    avatar: "",
    status: "active",
    joinDate: "2024-02-20",
    totalTrades: 98,
    winRate: 72.4,
    profitLoss: 5230.80,
    profitFactor: 2.5,
    consistency: 85,
    riskScore: "Excellent",
    lastActive: "1 day ago",
    recentTrades: 8
  },
  {
    id: 3,
    name: "Michael Chen",
    email: "michael.c@email.com",
    avatar: "",
    status: "needs_attention",
    joinDate: "2024-03-10",
    totalTrades: 67,
    winRate: 45.2,
    profitLoss: -1250.50,
    profitFactor: 0.8,
    consistency: 42,
    riskScore: "Poor",
    lastActive: "3 days ago",
    recentTrades: 5
  },
  {
    id: 4,
    name: "Emma Wilson",
    email: "emma.w@email.com",
    avatar: "",
    status: "active",
    joinDate: "2024-01-05",
    totalTrades: 203,
    winRate: 65.0,
    profitLoss: 12340.00,
    profitFactor: 1.9,
    consistency: 72,
    riskScore: "Good",
    lastActive: "30 minutes ago",
    recentTrades: 15
  },
  {
    id: 5,
    name: "James Brown",
    email: "james.b@email.com",
    avatar: "",
    status: "inactive",
    joinDate: "2024-04-01",
    totalTrades: 23,
    winRate: 56.5,
    profitLoss: 450.00,
    profitFactor: 1.2,
    consistency: 55,
    riskScore: "Moderate",
    lastActive: "2 weeks ago",
    recentTrades: 2
  }
];

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

export default function PreviewMentorDashboard() {
  const totalTraders = demoTraders.length;
  const activeTraders = demoTraders.filter(t => t.status === 'active').length;
  const needsAttention = demoTraders.filter(t => t.status === 'needs_attention').length;
  const avgWinRate = (demoTraders.reduce((sum, t) => sum + t.winRate, 0) / totalTraders).toFixed(1);
  const totalPnL = demoTraders.reduce((sum, t) => sum + t.profitLoss, 0);

  return (
    <div className="p-3 sm:p-4 lg:p-8 min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white" data-testid="text-mentor-title">Mentor Dashboard</h1>
          <p className="text-xs sm:text-sm text-gray-300">Monitor and support your trading students</p>
        </div>
        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 w-full sm:w-auto">
          <p className="text-xs sm:text-sm text-cyan-400">📊 Preview Mode - Demo Data</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <Card className="border-2 border-cyan-500/60 bg-cyan-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Traders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-400">{totalTraders}</div>
            <p className="text-xs text-muted-foreground mt-1">{activeTraders} active</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-500/60 bg-green-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Avg Win Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{avgWinRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">Across all traders</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-500/60 bg-purple-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Award className="h-4 w-4" />
              Total P&L
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${totalPnL.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Combined performance</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-amber-500/60 bg-amber-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Need Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400">{needsAttention}</div>
            <p className="text-xs text-muted-foreground mt-1">Traders struggling</p>
          </CardContent>
        </Card>
      </div>

      {/* Traders List */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="w-full grid grid-cols-3 h-auto">
          <TabsTrigger value="all" data-testid="tab-all-traders" className="text-xs sm:text-sm px-2 sm:px-4">
            <span className="hidden sm:inline">All Traders</span>
            <span className="sm:hidden">All</span> ({totalTraders})
          </TabsTrigger>
          <TabsTrigger value="active" data-testid="tab-active-traders" className="text-xs sm:text-sm px-2 sm:px-4">
            <span className="hidden sm:inline">Active</span>
            <span className="sm:hidden">Act.</span> ({activeTraders})
          </TabsTrigger>
          <TabsTrigger value="needs-attention" data-testid="tab-needs-attention" className="text-xs sm:text-sm px-1 sm:px-4">
            <span className="hidden sm:inline">Needs Attention</span>
            <span className="sm:hidden">Alert</span> ({needsAttention})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3 sm:space-y-4">
          {demoTraders.map((trader) => (
            <Card key={trader.id} className="bg-[#0f1f3a] border-[#1a2f4a]" data-testid={`card-trader-${trader.id}`}>
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  {/* Trader Info */}
                  <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                    <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                      <AvatarImage src={trader.avatar} />
                      <AvatarFallback className="bg-cyan-600 text-white">
                        {getInitials(trader.name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-base sm:text-lg font-semibold text-white">{trader.name}</h3>
                        {getStatusBadge(trader.status)}
                        {getRiskBadge(trader.riskScore)}
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-3 truncate">{trader.email}</p>
                      
                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-3 sm:mt-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Total Trades</p>
                          <p className="text-sm font-semibold text-white">{trader.totalTrades}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Win Rate</p>
                          <p className="text-sm font-semibold text-white">{trader.winRate}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">P&L</p>
                          <p className={`text-sm font-semibold ${trader.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            ${trader.profitLoss.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Profit Factor</p>
                          <p className="text-sm font-semibold text-white">{trader.profitFactor}</p>
                        </div>
                      </div>

                      {/* Consistency Bar */}
                      <div className="mt-3 sm:mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-muted-foreground">Consistency Score</p>
                          <p className="text-xs font-semibold text-cyan-400">{trader.consistency}%</p>
                        </div>
                        <Progress value={trader.consistency} className="h-2" />
                      </div>
                    </div>
                  </div>

                  {/* Actions - Full width on mobile, vertical on desktop */}
                  <div className="grid grid-cols-3 lg:grid-cols-1 gap-2 lg:w-auto">
                    <Button size="sm" variant="outline" className="border-cyan-500/50 hover:bg-cyan-600/20 w-full" data-testid={`button-view-${trader.id}`}>
                      <Eye className="h-4 w-4 lg:mr-2" />
                      <span className="hidden lg:inline">View</span>
                    </Button>
                    <Button size="sm" variant="outline" className="border-cyan-500/50 hover:bg-cyan-600/20 w-full" data-testid={`button-message-${trader.id}`}>
                      <MessageCircle className="h-4 w-4 lg:mr-2" />
                      <span className="hidden lg:inline">Message</span>
                    </Button>
                    <Button size="sm" variant="outline" className="border-cyan-500/50 hover:bg-cyan-600/20 w-full" data-testid={`button-analytics-${trader.id}`}>
                      <BarChart3 className="h-4 w-4 lg:mr-2" />
                      <span className="hidden lg:inline">Analytics</span>
                    </Button>
                  </div>
                </div>

                {/* Footer Info - Stack on mobile */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-cyan-500/20 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">Joined {new Date(trader.joinDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-3 w-3 flex-shrink-0" />
                    <span>{trader.recentTrades} trades this week</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="truncate">Last active: {trader.lastActive}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="active" className="space-y-3 sm:space-y-4">
          {demoTraders.filter(t => t.status === 'active').map((trader) => (
            <Card key={trader.id} className="bg-[#0f1f3a] border-[#1a2f4a]">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                    <AvatarFallback className="bg-cyan-600 text-white">
                      {getInitials(trader.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-white truncate">{trader.name}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Win Rate: {trader.winRate}% • P&L: ${trader.profitLoss.toFixed(2)}</p>
                  </div>
                  <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 w-full sm:w-auto">View Details</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="needs-attention" className="space-y-3 sm:space-y-4">
          {demoTraders.filter(t => t.status === 'needs_attention').map((trader) => (
            <Card key={trader.id} className="bg-amber-950/20 border-amber-500/50">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                    <AvatarFallback className="bg-amber-600 text-white">
                      {getInitials(trader.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-white truncate">{trader.name}</h3>
                    <p className="text-xs sm:text-sm text-amber-400 truncate">Win Rate: {trader.winRate}% • P&L: ${trader.profitLoss.toFixed(2)}</p>
                  </div>
                  <Button size="sm" className="bg-amber-600 hover:bg-amber-700 w-full sm:w-auto">Reach Out</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
