import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, TrendingUp, TrendingDown, AlertCircle, ExternalLink, Gauge, Minus, Circle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getFundamentalBias, getIndexBias, getMarketDrivers, getWeeklyEconomicEvents, getHighImpactEventCounts } from "@/lib/supabase-service";
import { format, parseISO } from "date-fns";

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

  const { data: weeklyEvents, isLoading: eventsLoading } = useQuery({
    queryKey: ['/api/weekly-events'],
    queryFn: getWeeklyEconomicEvents,
  });

  // Group events by date
  const groupedEvents = weeklyEvents?.reduce((acc: any, event: any) => {
    const date = event.event_date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(event);
    return acc;
  }, {}) || {};

  const { data: eventCounts, isLoading: countsLoading } = useQuery({
    queryKey: ['/api/event-counts'],
    queryFn: getHighImpactEventCounts,
  });

  return (
    <div className="p-4 lg:p-8 min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white" data-testid="text-fundamentals-title">
            Fundamental Analysis
          </h1>
          <p className="text-gray-300">
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
              <Card className="bg-[#0f1f3a] border-[#1a2f4a]">
                <CardHeader>
                  <CardTitle>Economic Calendar</CardTitle>
                  <CardDescription>This week's key economic releases and central bank events</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {eventsLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading events...</div>
                  ) : weeklyEvents && weeklyEvents.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-[#1a2f4a] bg-slate-900/50">
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                            <th className="text-left py-3 px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Time</th>
                            <th className="text-left py-3 px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Cur</th>
                            <th className="text-left py-3 px-1 text-xs font-semibold text-gray-400 uppercase tracking-wider w-8">Impact</th>
                            <th className="text-left py-3 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Event</th>
                            <th className="text-right py-3 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Actual</th>
                            <th className="text-right py-3 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Forecast</th>
                            <th className="text-right py-3 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Previous</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.keys(groupedEvents).map((date) => [
                            <tr key={`date-${date}`} className="bg-slate-800/30">
                              <td colSpan={8} className="py-2 px-4 text-sm font-semibold text-gray-300">
                                {format(parseISO(date), 'EEE MMM dd')}
                              </td>
                            </tr>,
                            ...groupedEvents[date].map((event: any, eventIdx: number) => {
                              const getImpactColor = (impact: string) => {
                                if (impact === "High") return "text-red-500";
                                if (impact === "Medium") return "text-yellow-500";
                                return "text-gray-500";
                              };

                              return (
                                <tr 
                                  key={`event-${date}-${eventIdx}`}
                                  className="border-b border-[#1a2f4a]/50 hover:bg-cyan-600/10 transition-colors"
                                  data-testid={`event-${date}-${eventIdx}`}
                                >
                                  <td className="py-3 px-4"></td>
                                  <td className="py-3 px-2 text-sm font-mono text-gray-400">
                                    {event.event_time?.substring(0, 5) || 'TBA'}
                                  </td>
                                  <td className="py-3 px-2">
                                    <span className="text-xs font-semibold text-cyan-400">
                                      {event.currency}
                                    </span>
                                  </td>
                                  <td className="py-3 px-1">
                                    <Circle 
                                      className={`h-3 w-3 ${getImpactColor(event.impact)} fill-current`}
                                      data-testid={`impact-${event.impact.toLowerCase()}`}
                                    />
                                  </td>
                                  <td className="py-3 px-3 text-sm text-gray-200">
                                    {event.title}
                                  </td>
                                  <td className={`py-3 px-3 text-sm text-right font-medium ${
                                    event.actual ? 'text-white' : 'text-gray-500'
                                  }`}>
                                    {event.actual || '-'}
                                  </td>
                                  <td className="py-3 px-3 text-sm text-right text-gray-400">
                                    {event.forecast || '-'}
                                  </td>
                                  <td className="py-3 px-3 text-sm text-right text-gray-400">
                                    {event.previous || '-'}
                                  </td>
                                </tr>
                              );
                            })
                          ])}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No economic events scheduled. Check the calendar feed for updates.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="bg-[#0f1f3a] border-[#1a2f4a]">
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

              <Card className="bg-[#0f1f3a] border-[#1a2f4a]">
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

              <Card className="bg-[#0f1f3a] border-[#1a2f4a]">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start border-cyan-500/50 text-white hover:bg-cyan-600/20" data-testid="button-forex-factory">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Forex Factory Calendar
                  </Button>
                  <Button variant="outline" className="w-full justify-start border-cyan-500/50 text-white hover:bg-cyan-600/20" data-testid="button-investing">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Investing.com Calendar
                  </Button>
                  <Button variant="outline" className="w-full justify-start border-cyan-500/50 text-white hover:bg-cyan-600/20" data-testid="button-tradingeconomics">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Trading Economics
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="news" className="space-y-4">
          <Card className="bg-[#0f1f3a] border-[#1a2f4a]">
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
                    className="border-l-4 border-l-cyan-500 pl-4 hover:bg-muted/50 p-3 rounded-r transition-colors"
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
            <Card className="bg-[#0f1f3a] border-[#1a2f4a]">
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

            <Card className="bg-[#0f1f3a] border-[#1a2f4a]">
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
          <Card className="bg-[#0f1f3a] border-[#1a2f4a]">
            <CardHeader>
              <CardTitle>FX Pair Fundamental Bias</CardTitle>
              <CardDescription>Automated fundamental analysis for 38 major currency pairs</CardDescription>
            </CardHeader>
            <CardContent>
              {biasLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading fundamental data...</div>
              ) : fundamentalBias && fundamentalBias.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

                    const isStrongBias = bias.total_bias >= 7 || bias.total_bias <= -7;
                    
                    return (
                      <div 
                        key={index} 
                        className={`space-y-2 p-4 rounded-lg bg-[#0a1628] border-2 border-cyan-500/60 transition-all duration-300 ${
                          isStrongBias ? 'heartbeat-pulse' : ''
                        }`}
                        data-testid={`pair-bias-${index}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{bias.pair}</span>
                            {bias.total_bias >= 7 ? (
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            ) : bias.total_bias <= -7 ? (
                              <TrendingDown className="h-4 w-4 text-red-500" />
                            ) : (
                              <Minus className="h-4 w-4 text-gray-500" />
                            )}
                          </div>
                          {bias.total_bias >= 7 ? (
                            <Badge className="bg-green-600 hover:bg-green-700 text-white">
                              {bias.bias_text}
                            </Badge>
                          ) : (
                            <Badge variant={getBiasVariant(bias.total_bias)}>
                              {bias.bias_text}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{bias.summary}</p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                          <span className={`font-bold ${getBiasColor(bias.total_bias)}`}>
                            Score: {bias.total_bias > 0 ? '+' : ''}{bias.total_bias}
                          </span>
                          <span>Confidence: {bias.confidence}%</span>
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

          <Card className="bg-[#0f1f3a] border-[#1a2f4a]">
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
                    <div key={index} className="flex items-center justify-between p-2 border-l-4 border-l-cyan-500 pl-3" data-testid={`driver-${index}`}>
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

          {/* Indices Section */}
          <Card className="mt-6 bg-[#0f1f3a] border-[#1a2f4a]">
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

                    const isStrongIndexBias = index.score >= 3 || index.score <= -3;
                    
                    return (
                      <div 
                        key={idx} 
                        className={`space-y-2 p-4 rounded-lg bg-[#0a1628] border-2 border-cyan-500/60 transition-all duration-300 ${
                          isStrongIndexBias ? 'heartbeat-pulse' : ''
                        }`}
                        data-testid={`index-bias-${idx}`}
                      >
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
                          {index.score >= 3 ? (
                            <Badge className="bg-green-600 hover:bg-green-700 text-white">
                              {index.bias_text}
                            </Badge>
                          ) : (
                            <Badge variant={getBiasVariant(index.score)}>
                              {index.bias_text}
                            </Badge>
                          )}
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
