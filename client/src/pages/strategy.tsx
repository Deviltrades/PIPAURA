import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountSelector } from "@/components/AccountSelector";
import { useSelectedAccount } from "@/hooks/use-selected-account";

export default function Strategy() {
  const [selectedAccount, setSelectedAccount] = useSelectedAccount();
  
  return (
    <div className="p-4 lg:p-8 min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Strategy & Playbook</h1>
        <p className="text-gray-300 mb-3">Document and track your trading strategies</p>
        <AccountSelector value={selectedAccount} onValueChange={setSelectedAccount} />
      </div>

      <Tabs defaultValue="strategies" className="space-y-4">
        <TabsList>
          <TabsTrigger value="strategies">Trading Strategies</TabsTrigger>
          <TabsTrigger value="playbook">Playbook Rules</TabsTrigger>
          <TabsTrigger value="templates">Trade Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="strategies" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">My Strategies</h2>
            <Button>Add New Strategy</Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Trend Following</CardTitle>
                  <Badge variant="default">Active</Badge>
                </div>
                <CardDescription>EMA crossover with RSI confirmation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Win Rate</p>
                    <p className="font-semibold text-green-600">72%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Profit Factor</p>
                    <p className="font-semibold">2.1</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Avg Win</p>
                    <p className="font-semibold">$245</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Avg Loss</p>
                    <p className="font-semibold">-$115</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Edit</Button>
                  <Button variant="outline" size="sm">View Trades</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Scalping Strategy</CardTitle>
                  <Badge variant="secondary">Testing</Badge>
                </div>
                <CardDescription>5-minute scalping on major pairs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Win Rate</p>
                    <p className="font-semibold text-yellow-600">58%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Profit Factor</p>
                    <p className="font-semibold">1.4</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Avg Win</p>
                    <p className="font-semibold">$85</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Avg Loss</p>
                    <p className="font-semibold">-$65</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Edit</Button>
                  <Button variant="outline" size="sm">View Trades</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="playbook" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Trading Rules</h2>
            <Button>Add New Rule</Button>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Risk Management Rules</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span>Never risk more than 2% per trade</span>
                  <Badge variant="outline">Mandatory</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span>Maximum 3 positions open simultaneously</span>
                  <Badge variant="outline">Mandatory</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span>Stop trading after 3 consecutive losses</span>
                  <Badge variant="outline">Recommended</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Entry Rules</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span>Wait for confirmation candle close</span>
                  <Badge variant="outline">Mandatory</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span>Check higher timeframe trend</span>
                  <Badge variant="outline">Recommended</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span>Avoid trading during major news</span>
                  <Badge variant="outline">Recommended</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Trade Templates</h2>
            <Button>Create Template</Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Breakout Trade</CardTitle>
                <CardDescription>Standard breakout template</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Risk:</span>
                    <span>2%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">R:R Ratio:</span>
                    <span>1:3</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Timeframe:</span>
                    <span>H1</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-3">
                  Use Template
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Swing Trade</CardTitle>
                <CardDescription>Multi-day position template</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Risk:</span>
                    <span>1.5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">R:R Ratio:</span>
                    <span>1:5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Timeframe:</span>
                    <span>D1</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-3">
                  Use Template
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Scalp Trade</CardTitle>
                <CardDescription>Quick scalping template</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Risk:</span>
                    <span>1%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">R:R Ratio:</span>
                    <span>1:2</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Timeframe:</span>
                    <span>M5</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-3">
                  Use Template
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}