import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, TrendingUp, TrendingDown, AlertCircle, ExternalLink } from "lucide-react";

export default function Fundamentals() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-fundamentals-title">
            Fundamental Analysis
          </h1>
          <p className="text-muted-foreground">
            Economic calendar, news events, and market-moving fundamentals
          </p>
        </div>
      </div>

      <Tabs defaultValue="calendar" className="space-y-4">
        <TabsList>
          <TabsTrigger value="calendar" data-testid="tab-calendar">
            <Calendar className="h-4 w-4 mr-2" />
            Economic Calendar
          </TabsTrigger>
          <TabsTrigger value="news" data-testid="tab-news">
            <AlertCircle className="h-4 w-4 mr-2" />
            Market News
          </TabsTrigger>
          <TabsTrigger value="analysis" data-testid="tab-analysis">
            <TrendingUp className="h-4 w-4 mr-2" />
            Market Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Today's Economic Events</CardTitle>
                  <CardDescription>Key economic releases and central bank events</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { time: "08:30", event: "US Non-Farm Payrolls", impact: "high", previous: "187K", forecast: "170K", currency: "USD" },
                      { time: "10:00", event: "US Unemployment Rate", impact: "high", previous: "3.5%", forecast: "3.6%", currency: "USD" },
                      { time: "12:30", event: "ECB Interest Rate Decision", impact: "high", previous: "4.50%", forecast: "4.50%", currency: "EUR" },
                      { time: "14:00", event: "UK GDP Growth Rate", impact: "medium", previous: "0.2%", forecast: "0.3%", currency: "GBP" },
                      { time: "15:30", event: "CAD Employment Change", impact: "medium", previous: "59.9K", forecast: "25.0K", currency: "CAD" },
                    ].map((event, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        data-testid={`event-${index}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-sm font-mono text-muted-foreground w-16">
                            {event.time}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={event.currency === "USD" ? "default" : "secondary"}>
                              {event.currency}
                            </Badge>
                            <Badge 
                              variant={event.impact === "high" ? "destructive" : event.impact === "medium" ? "default" : "secondary"}
                            >
                              {event.impact}
                            </Badge>
                          </div>
                          <div>
                            <div className="font-medium">{event.event}</div>
                            <div className="text-sm text-muted-foreground">
                              Previous: {event.previous} | Forecast: {event.forecast}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">High Impact Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">This Week</span>
                      <Badge variant="destructive">12</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Next Week</span>
                      <Badge variant="default">8</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">This Month</span>
                      <Badge variant="secondary">45</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Central Bank Rates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { bank: "Federal Reserve", rate: "5.50%", trend: "up" },
                      { bank: "ECB", rate: "4.50%", trend: "neutral" },
                      { bank: "Bank of England", rate: "5.25%", trend: "up" },
                      { bank: "Bank of Japan", rate: "-0.10%", trend: "neutral" },
                    ].map((cb, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm">{cb.bank}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{cb.rate}</span>
                          {cb.trend === "up" ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : cb.trend === "down" ? (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          ) : (
                            <div className="h-4 w-4" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" data-testid="button-forex-factory">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Forex Factory Calendar
                  </Button>
                  <Button variant="outline" className="w-full justify-start" data-testid="button-investing">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Investing.com Calendar
                  </Button>
                  <Button variant="outline" className="w-full justify-start" data-testid="button-tradingeconomics">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Trading Economics
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="news" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Latest Market News</CardTitle>
              <CardDescription>Breaking news and market-moving headlines</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { 
                    title: "Fed Holds Rates Steady, Signals Potential Cuts Ahead",
                    source: "Reuters",
                    time: "2 hours ago",
                    impact: "high",
                    summary: "The Federal Reserve maintained interest rates at 5.25%-5.50% while indicating possible rate cuts later in the year."
                  },
                  { 
                    title: "ECB Keeps Rates Unchanged at 4.50%",
                    source: "Bloomberg",
                    time: "4 hours ago",
                    impact: "high",
                    summary: "European Central Bank holds policy steady amid slowing inflation and economic concerns."
                  },
                  { 
                    title: "US Employment Data Exceeds Expectations",
                    source: "CNBC",
                    time: "1 day ago",
                    impact: "medium",
                    summary: "Non-farm payrolls increased by 216K, beating forecasts of 170K, showing resilient labor market."
                  },
                ].map((news, index) => (
                  <div
                    key={index}
                    className="border-l-4 border-l-blue-500 pl-4 hover:bg-muted/50 p-3 rounded-r transition-colors"
                    data-testid={`news-${index}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium">{news.title}</h3>
                      <Badge variant={news.impact === "high" ? "destructive" : "default"}>
                        {news.impact}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{news.summary}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{news.source}</span>
                      <span>•</span>
                      <span>{news.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Market Sentiment</CardTitle>
                <CardDescription>Current market bias and positioning</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { pair: "EUR/USD", sentiment: "Bullish", strength: 75 },
                    { pair: "GBP/USD", sentiment: "Neutral", strength: 50 },
                    { pair: "USD/JPY", sentiment: "Bearish", strength: 35 },
                    { pair: "BTC/USD", sentiment: "Bullish", strength: 80 },
                  ].map((item, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{item.pair}</span>
                        <Badge 
                          variant={item.sentiment === "Bullish" ? "default" : item.sentiment === "Bearish" ? "destructive" : "secondary"}
                        >
                          {item.sentiment}
                        </Badge>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            item.sentiment === "Bullish" ? "bg-green-500" : 
                            item.sentiment === "Bearish" ? "bg-red-500" : 
                            "bg-gray-500"
                          }`}
                          style={{ width: `${item.strength}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Levels to Watch</CardTitle>
                <CardDescription>Important price levels and zones</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { pair: "EUR/USD", resistance: "1.0950", support: "1.0850" },
                    { pair: "GBP/USD", resistance: "1.2720", support: "1.2620" },
                    { pair: "USD/JPY", resistance: "150.50", support: "148.20" },
                    { pair: "BTC/USD", resistance: "45,000", support: "42,000" },
                  ].map((level, index) => (
                    <div key={index} className="space-y-2">
                      <div className="font-medium">{level.pair}</div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          <span className="text-muted-foreground">Resistance:</span>
                          <span className="font-medium">{level.resistance}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingDown className="h-4 w-4 text-red-500" />
                          <span className="text-muted-foreground">Support:</span>
                          <span className="font-medium">{level.support}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
