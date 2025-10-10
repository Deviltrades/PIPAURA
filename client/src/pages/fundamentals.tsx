import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, TrendingUp, TrendingDown, AlertCircle, ExternalLink, Gauge, Minus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getFundamentalBias, getIndexBias, getMarketDrivers, getTodaysEconomicEvents, getHighImpactEventCounts } from "@/lib/supabase-service";
import { format } from "date-fns";

export default function Fundamentals() {
  const { data: fundamentalBias, isLoading: biasLoading } = useQuery({
    queryKey: ['/api/fundamental-bias'],
    queryFn: getFundamentalBias,
  });

  const { data: indexBias, isLoading: indexLoading } = useQuery({
    queryKey: ['/api/index-bias'],
    queryFn: getIndexBias,
  });

  const { data: marketDrivers, isLoading: driversLoading } = useQuery({
    queryKey: ['/api/market-drivers'],
    queryFn: getMarketDrivers,
  });

  const { data: todaysEvents, isLoading: eventsLoading } = useQuery({
    queryKey: ['/api/todays-events'],
    queryFn: getTodaysEconomicEvents,
  });

  const { data: eventCounts, isLoading: countsLoading } = useQuery({
    queryKey: ['/api/event-counts'],
    queryFn: getHighImpactEventCounts,
  });

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
          <TabsTrigger value="strength" data-testid="tab-strength">
            <Gauge className="h-4 w-4 mr-2" />
            Fundamental Strength
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
                  {eventsLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading today's events...</div>
                  ) : todaysEvents && todaysEvents.length > 0 ? (
                    <div className="space-y-4">
                      {todaysEvents.map((event: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                          data-testid={`event-${index}`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="text-sm font-mono text-muted-foreground w-16">
                              {event.event_time}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={event.currency === "USD" ? "default" : "secondary"}>
                                {event.currency}
                              </Badge>
                              <Badge 
                                variant={event.impact === "High" ? "destructive" : event.impact === "Medium" ? "default" : "secondary"}
                              >
                                {event.impact.toLowerCase()}
                              </Badge>
                            </div>
                            <div>
                              <div className="font-medium">{event.event_title}</div>
                              <div className="text-sm text-muted-foreground">
                                {event.previous && `Previous: ${event.previous}`}
                                {event.previous && event.forecast && ' | '}
                                {event.forecast && `Forecast: ${event.forecast}`}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No economic events scheduled for today. Check the Forex Factory feed for updates.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">High Impact Events</CardTitle>
                </CardHeader>
                <CardContent>
                  {countsLoading ? (
                    <div className="text-center py-4 text-muted-foreground">Loading counts...</div>
                  ) : eventCounts ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">This Week</span>
                        <Badge variant="destructive" data-testid="badge-this-week">{eventCounts.thisWeek}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Next Week</span>
                        <Badge variant="default" data-testid="badge-next-week">{eventCounts.nextWeek}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">This Month</span>
                        <Badge variant="secondary" data-testid="badge-this-month">{eventCounts.thisMonth}</Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">No data available</div>
                  )}
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

        <TabsContent value="strength" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>FX Pair Fundamental Bias</CardTitle>
                <CardDescription>Weekly automated fundamental analysis for major currency pairs</CardDescription>
              </CardHeader>
              <CardContent>
                {biasLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading fundamental data...</div>
                ) : fundamentalBias && fundamentalBias.length > 0 ? (
                  <div className="space-y-4">
                    {fundamentalBias.map((bias: any, index: number) => {
                      const getBiasColor = (totalBias: number) => {
                        if (totalBias >= 7) return "text-green-500";
                        if (totalBias <= -7) return "text-red-500";
                        return "text-gray-500";
                      };

                      const getBiasVariant = (totalBias: number): "default" | "destructive" | "secondary" => {
                        if (totalBias >= 7) return "default";
                        if (totalBias <= -7) return "destructive";
                        return "secondary";
                      };

                      return (
                        <div key={index} className="space-y-2 p-3 border rounded-lg" data-testid={`pair-bias-${index}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-lg">{bias.pair}</span>
                              {bias.total_bias >= 7 ? (
                                <TrendingUp className="h-5 w-5 text-green-500" />
                              ) : bias.total_bias <= -7 ? (
                                <TrendingDown className="h-5 w-5 text-red-500" />
                              ) : (
                                <Minus className="h-5 w-5 text-gray-500" />
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`text-sm font-bold ${getBiasColor(bias.total_bias)}`}>
                                {bias.total_bias > 0 ? '+' : ''}{bias.total_bias}
                              </span>
                              <Badge variant={getBiasVariant(bias.total_bias)}>
                                {bias.bias_text}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{bias.summary}</p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                            <span>Confidence: {bias.confidence}%</span>
                            <span>Updated: {format(new Date(bias.updated_at), 'MMM dd, yyyy')}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No fundamental bias data available. Run the automation script to generate data.
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Key Fundamental Drivers</CardTitle>
                  <CardDescription>Current market-moving themes</CardDescription>
                </CardHeader>
                <CardContent>
                  {driversLoading ? (
                    <div className="text-center py-4 text-muted-foreground">Loading market drivers...</div>
                  ) : marketDrivers && marketDrivers.length > 0 ? (
                    <div className="space-y-3">
                      {marketDrivers.map((driver: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 border-l-4 border-l-blue-500 pl-3" data-testid={`driver-${index}`}>
                          <div>
                            <div className="font-medium text-sm">{driver.driver}</div>
                            <div className="text-xs text-muted-foreground">{driver.status}</div>
                          </div>
                          <Badge variant={driver.impact === "High" ? "destructive" : "secondary"}>
                            {driver.impact}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      No driver data available. Run the automation to generate data.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Indices Section */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Global Indices Fundamental Bias</CardTitle>
              <CardDescription>Automated fundamental analysis for major stock market indices</CardDescription>
            </CardHeader>
            <CardContent>
              {indexLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading index bias data...</div>
              ) : indexBias && indexBias.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {indexBias.map((index: any, idx: number) => {
                    const getBiasColor = (score: number) => {
                      if (score >= 3) return "text-green-500";
                      if (score <= -3) return "text-red-500";
                      return "text-gray-500";
                    };

                    const getBiasVariant = (score: number): "default" | "destructive" | "secondary" => {
                      if (score >= 3) return "default";
                      if (score <= -3) return "destructive";
                      return "secondary";
                    };

                    return (
                      <div key={idx} className="space-y-2 p-4 border rounded-lg" data-testid={`index-bias-${idx}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{index.instrument}</span>
                            {index.score >= 3 ? (
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            ) : index.score <= -3 ? (
                              <TrendingDown className="h-4 w-4 text-red-500" />
                            ) : (
                              <Minus className="h-4 w-4 text-gray-500" />
                            )}
                          </div>
                          <Badge variant={getBiasVariant(index.score)}>
                            {index.bias_text}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{index.summary}</p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                          <span className={`font-bold ${getBiasColor(index.score)}`}>
                            Score: {index.score > 0 ? '+' : ''}{index.score}
                          </span>
                          <span>Confidence: {index.confidence}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No index bias data available. Run the automation script to generate data.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
