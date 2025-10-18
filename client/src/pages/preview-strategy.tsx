import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Target, FileText } from "lucide-react";

// Demo trading strategies
const demoStrategies = [
  {
    name: "Trend Following",
    description: "EMA crossover with RSI confirmation",
    status: "Active",
    winRate: 72,
    profitFactor: 2.1,
    avgWin: 245,
    avgLoss: 115
  },
  {
    name: "Scalping Strategy",
    description: "5-minute scalping on major pairs",
    status: "Testing",
    winRate: 58,
    profitFactor: 1.4,
    avgWin: 85,
    avgLoss: 65
  },
  {
    name: "Breakout System",
    description: "Range breakout with volume confirmation",
    status: "Active",
    winRate: 68,
    profitFactor: 1.9,
    avgWin: 320,
    avgLoss: 180
  },
  {
    name: "Support & Resistance",
    description: "Price action at key S/R levels",
    status: "Active",
    winRate: 75,
    profitFactor: 2.3,
    avgWin: 280,
    avgLoss: 125
  }
];

// Demo playbook rules
const riskManagementRules = [
  { rule: "Never risk more than 2% per trade", type: "Mandatory" },
  { rule: "Maximum 3 positions open simultaneously", type: "Mandatory" },
  { rule: "Stop trading after 3 consecutive losses", type: "Recommended" },
  { rule: "Use trailing stops on winning trades", type: "Recommended" },
  { rule: "Daily loss limit of 6%", type: "Mandatory" }
];

const entryRules = [
  { rule: "Wait for confirmation candle close", type: "Mandatory" },
  { rule: "Check higher timeframe trend", type: "Recommended" },
  { rule: "Avoid trading during major news", type: "Recommended" },
  { rule: "Ensure minimum 1:2 risk-reward ratio", type: "Mandatory" },
  { rule: "Verify volume confirmation", type: "Recommended" }
];

const exitRules = [
  { rule: "Always use stop loss on every trade", type: "Mandatory" },
  { rule: "Take partial profits at 1:1 R:R", type: "Recommended" },
  { rule: "Move stop to break-even at 1:1", type: "Recommended" },
  { rule: "Exit if setup invalidated", type: "Mandatory" }
];

// Demo trade templates
const tradeTemplates = [
  {
    name: "Breakout Trade",
    description: "Standard breakout template",
    risk: "2%",
    rrRatio: "1:3",
    timeframe: "H1"
  },
  {
    name: "Swing Trade",
    description: "Multi-day position template",
    risk: "1.5%",
    rrRatio: "1:5",
    timeframe: "D1"
  },
  {
    name: "Scalp Trade",
    description: "Quick scalping template",
    risk: "1%",
    rrRatio: "1:2",
    timeframe: "M5"
  },
  {
    name: "Reversal Trade",
    description: "Counter-trend reversal setup",
    risk: "1.5%",
    rrRatio: "1:4",
    timeframe: "H4"
  },
  {
    name: "Momentum Trade",
    description: "Strong trend momentum entry",
    risk: "2%",
    rrRatio: "1:3",
    timeframe: "H1"
  },
  {
    name: "Range Trade",
    description: "Trading within consolidation zones",
    risk: "1%",
    rrRatio: "1:2",
    timeframe: "M15"
  }
];

export default function PreviewStrategy() {
  return (
    <div className="p-3 sm:p-4 lg:p-8 min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white" data-testid="text-strategy-title">
              Strategy & Playbook
            </h1>
            <p className="text-gray-300">Document and track your trading strategies</p>
          </div>
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg px-4 py-2">
            <p className="text-sm text-cyan-400">📊 Preview Mode - Demo Data</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="strategies" className="space-y-4">
        <TabsList>
          <TabsTrigger value="strategies" data-testid="tab-strategies">
            <Target className="h-4 w-4 mr-2" />
            Trading Strategies
          </TabsTrigger>
          <TabsTrigger value="playbook" data-testid="tab-playbook">
            <BookOpen className="h-4 w-4 mr-2" />
            Playbook Rules
          </TabsTrigger>
          <TabsTrigger value="templates" data-testid="tab-templates">
            <FileText className="h-4 w-4 mr-2" />
            Trade Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="strategies" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h2 className="text-lg sm:text-xl font-semibold text-white">My Strategies</h2>
            <Button data-testid="button-add-strategy" className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-700">
              Add New Strategy
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {demoStrategies.map((strategy, index) => (
              <Card key={index} className="bg-[#0f1f3a] border-[#1a2f4a]" data-testid={`strategy-card-${index}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">{strategy.name}</CardTitle>
                    <Badge 
                      variant={strategy.status === "Active" ? "default" : "secondary"}
                      className={strategy.status === "Active" ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                      {strategy.status}
                    </Badge>
                  </div>
                  <CardDescription>{strategy.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Win Rate</p>
                      <p className={`font-semibold ${strategy.winRate >= 70 ? 'text-green-600' : strategy.winRate >= 60 ? 'text-yellow-600' : 'text-gray-400'}`}>
                        {strategy.winRate}%
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Profit Factor</p>
                      <p className="font-semibold text-white">{strategy.profitFactor}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Avg Win</p>
                      <p className="font-semibold text-white">${strategy.avgWin}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Avg Loss</p>
                      <p className="font-semibold text-white">-${strategy.avgLoss}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="border-cyan-500/50 hover:bg-cyan-600/20">
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="border-cyan-500/50 hover:bg-cyan-600/20">
                      View Trades
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="playbook" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">Trading Rules</h2>
            <Button data-testid="button-add-rule" className="bg-cyan-600 hover:bg-cyan-700">
              Add New Rule
            </Button>
          </div>

          <div className="space-y-4">
            <Card className="bg-[#0f1f3a] border-[#1a2f4a]">
              <CardHeader>
                <CardTitle className="text-lg text-white">Risk Management Rules</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {riskManagementRules.map((item, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800/70 transition-colors"
                    data-testid={`risk-rule-${index}`}
                  >
                    <span className="text-gray-200">{item.rule}</span>
                    <Badge 
                      variant="outline" 
                      className={item.type === "Mandatory" ? "border-red-500/50 text-red-400" : "border-cyan-500/50 text-cyan-400"}
                    >
                      {item.type}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-[#0f1f3a] border-[#1a2f4a]">
              <CardHeader>
                <CardTitle className="text-lg text-white">Entry Rules</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {entryRules.map((item, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800/70 transition-colors"
                    data-testid={`entry-rule-${index}`}
                  >
                    <span className="text-gray-200">{item.rule}</span>
                    <Badge 
                      variant="outline" 
                      className={item.type === "Mandatory" ? "border-red-500/50 text-red-400" : "border-cyan-500/50 text-cyan-400"}
                    >
                      {item.type}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-[#0f1f3a] border-[#1a2f4a]">
              <CardHeader>
                <CardTitle className="text-lg text-white">Exit Rules</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {exitRules.map((item, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800/70 transition-colors"
                    data-testid={`exit-rule-${index}`}
                  >
                    <span className="text-gray-200">{item.rule}</span>
                    <Badge 
                      variant="outline" 
                      className={item.type === "Mandatory" ? "border-red-500/50 text-red-400" : "border-cyan-500/50 text-cyan-400"}
                    >
                      {item.type}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">Trade Templates</h2>
            <Button data-testid="button-create-template" className="bg-cyan-600 hover:bg-cyan-700">
              Create Template
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tradeTemplates.map((template, index) => (
              <Card key={index} className="bg-[#0f1f3a] border-[#1a2f4a]" data-testid={`template-card-${index}`}>
                <CardHeader>
                  <CardTitle className="text-lg text-white">{template.name}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Risk:</span>
                      <span className="text-white font-medium">{template.risk}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">R:R Ratio:</span>
                      <span className="text-white font-medium">{template.rrRatio}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Timeframe:</span>
                      <span className="text-white font-medium">{template.timeframe}</span>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-3 border-cyan-500/50 hover:bg-cyan-600/20"
                    data-testid={`button-use-template-${index}`}
                  >
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
