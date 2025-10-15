import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, TrendingUp, TrendingDown, AlertCircle, ExternalLink, Gauge, Minus, Circle, RefreshCw } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getFundamentalBias, getIndexBias, getMarketDrivers, getWeeklyEconomicEvents, getHighImpactEventCounts, getMarketNews, getThisWeekHighImpactEvents, getUserProfile } from "@/lib/supabase-service";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { useState } from "react";
import { TimezoneSelector } from "@/components/timezone-selector";

export default function Fundamentals() {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: userProfile } = useQuery({
    queryKey: ['/api/user-profile'],
    queryFn: getUserProfile,
  });

  const userTimezone = userProfile?.timezone || 'UTC';

  // Helper function to format event time in user's timezone
  const formatEventTime = (dateStr: string, timeStr: string) => {
    // Handle missing or special time strings
    if (!timeStr) return 'TBA';
    
    // Check if time string is in HH:mm format (numeric time)
    const timePattern = /^\d{1,2}:\d{2}/;
    if (!timePattern.test(timeStr)) {
      // Return non-numeric times as-is (e.g., "Tentative", "All Day")
      return timeStr;
    }
    
    try {
      // Parse the date and time from the event
      const [hours, minutes] = timeStr.split(':');
      const eventDate = parseISO(dateStr);
      eventDate.setUTCHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      // Convert to user's timezone and format
      return formatInTimeZone(eventDate, userTimezone, 'HH:mm');
    } catch (error) {
      // Fallback to original time string if conversion fails
      return timeStr;
    }
  };

  const { data: fundamentalBias, isLoading: biasLoading } = useQuery({
    queryKey: ['/api/fundamental-bias'],
    queryFn: getFundamentalBias,
    refetchInterval: 60000, // Auto-refresh every 60 seconds
  });

  const { data: indexBias, isLoading: indexLoading } = useQuery({
    queryKey: ['/api/index-bias'],
    queryFn: getIndexBias,
    refetchInterval: 60000,
  });

  const { data: marketDrivers, isLoading: driversLoading } = useQuery({
    queryKey: ['/api/market-drivers'],
    queryFn: getMarketDrivers,
    refetchInterval: 60000,
  });

  const { data: weeklyEvents, isLoading: eventsLoading } = useQuery({
    queryKey: ['/api/weekly-events'],
    queryFn: getWeeklyEconomicEvents,
    refetchInterval: 60000,
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
    refetchInterval: 60000,
  });

  const { data: highImpactEvents, isLoading: highImpactLoading } = useQuery({
    queryKey: ['/api/high-impact-events'],
    queryFn: getThisWeekHighImpactEvents,
    refetchInterval: 60000,
  });

  const { data: marketNews, isLoading: newsLoading } = useQuery({
    queryKey: ['/api/market-news'],
    queryFn: () => getMarketNews(15),
    refetchInterval: 60000,
  });

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['/api/fundamental-bias'] });
    await queryClient.invalidateQueries({ queryKey: ['/api/index-bias'] });
    await queryClient.invalidateQueries({ queryKey: ['/api/market-drivers'] });
    await queryClient.invalidateQueries({ queryKey: ['/api/weekly-events'] });
    await queryClient.invalidateQueries({ queryKey: ['/api/event-counts'] });
    await queryClient.invalidateQueries({ queryKey: ['/api/high-impact-events'] });
    await queryClient.invalidateQueries({ queryKey: ['/api/market-news'] });
    setTimeout(() => setIsRefreshing(false), 1000);
  };

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
        <div className="flex items-center gap-4">
          <TimezoneSelector />
          <Button
            onClick={handleManualRefresh}
            variant="outline"
            className="group border-cyan-600/50 bg-slate-800/50 hover:bg-cyan-600/20 hover:border-cyan-500 transition-all duration-300"
            disabled={isRefreshing}
            data-testid="button-refresh-fundamentals"
          >
            <RefreshCw 
              className={`h-4 w-4 mr-2 text-cyan-400 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} 
            />
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium text-white">Refresh Data</span>
              <span className="text-xs text-gray-400">Auto-updates every 60s</span>
            </div>
          </Button>
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
                                    {formatEventTime(event.event_date, event.event_time)}
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
                  <CardTitle className="text-lg">High Impact Events & Central Bank Rates</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* High Impact Events This Week */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-300">High Impact Events (This Week)</h3>
                      {eventCounts && (
                        <Badge variant="destructive" data-testid="badge-this-week">
                          {eventCounts.thisWeek}
                        </Badge>
                      )}
                    </div>
                    {highImpactLoading ? (
                      <div className="text-center py-3 text-sm text-muted-foreground">Loading events...</div>
                    ) : highImpactEvents && highImpactEvents.length > 0 ? (
                      <div className="space-y-2">
                        {highImpactEvents.map((event: any, index: number) => (
                          <div 
                            key={index} 
                            className="flex items-center justify-between text-xs bg-slate-800/50 p-2 rounded"
                            data-testid={`high-impact-event-${index}`}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-cyan-400 font-semibold">{event.currency}</span>
                                <span className="text-gray-300">{event.title}</span>
                              </div>
                              <div className="text-gray-500 mt-0.5">
                                {format(parseISO(event.event_date), 'MMM dd')} • {formatEventTime(event.event_date, event.event_time)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-3 text-sm text-muted-foreground">No high impact events this week</div>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="border-t border-[#1a2f4a]"></div>

                  {/* Central Bank Rates */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-300 mb-3">Central Bank Rates</h3>
                    <div className="space-y-3">
                      {[
                        { bank: "Federal Reserve", rate: "4.50%", trend: "neutral" },
                        { bank: "ECB", rate: "2.00%", trend: "down" },
                        { bank: "Bank of England", rate: "4.00%", trend: "down" },
                        { bank: "Bank of Japan", rate: "0.50%", trend: "up" },
                      ].map((cb, index) => (
                        <div key={index} className="flex items-center justify-between" data-testid={`cb-rate-${index}`}>
                          <span className="text-sm">{cb.bank}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{cb.rate}</span>
                            {cb.trend === "up" ? (
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            ) : cb.trend === "down" ? (
                              <TrendingDown className="h-4 w-4 text-red-500" />
                            ) : (
                              <Minus className="h-4 w-4 text-gray-500" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
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
              {newsLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading market news...</div>
              ) : marketNews && marketNews.length > 0 ? (
                <div className="space-y-4">
                  {marketNews.map((news: any, index: number) => {
                    const timestamp = new Date(news.datetime * 1000);
                    const timeAgo = formatDistanceToNow(timestamp, { addSuffix: true });

                    return (
                      <div
                        key={news.id || index}
                        className="border-l-4 border-l-cyan-500 pl-4 hover:bg-muted/50 p-3 rounded-r transition-colors cursor-pointer"
                        data-testid={`news-${index}`}
                        onClick={() => news.url && window.open(news.url, '_blank')}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-medium text-white">{news.headline}</h3>
                          <Badge 
                            variant={
                              news.impact_level === "high" 
                                ? "destructive" 
                                : news.impact_level === "medium" 
                                ? "default" 
                                : "secondary"
                            }
                          >
                            {news.impact_level}
                          </Badge>
                        </div>
                        {news.summary && (
                          <p className="text-sm text-muted-foreground mb-2">{news.summary}</p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{news.source}</span>
                          <span>•</span>
                          <span>{timeAgo}</span>
                          {news.category && (
                            <>
                              <span>•</span>
                              <span className="capitalize">{news.category}</span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No market news available. News will appear once the system fetches the latest updates.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <Card className="bg-[#0f1f3a] border-[#1a2f4a]">
            <CardHeader>
              <CardTitle>Market Sentiment</CardTitle>
              <CardDescription>Real-time fundamental bias for all FX pairs and global indices</CardDescription>
            </CardHeader>
            <CardContent>
              {biasLoading || indexLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading market sentiment data...</div>
              ) : (
                <div className="space-y-6">
                  {/* FX Pairs Section */}
                  {fundamentalBias && fundamentalBias.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-white">FX Pairs</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {fundamentalBias.map((item: any, index: number) => {
                          const isStrong = item.total_bias >= 7;
                          const isWeak = item.total_bias <= -7;
                          const sentiment = isStrong ? "Bullish" : isWeak ? "Bearish" : "Neutral";
                          
                          // Calculate strength percentage (map -15 to +15 range to 0-100%)
                          const strength = ((item.total_bias + 15) / 30) * 100;
                          
                          return (
                            <div key={index} data-testid={`sentiment-pair-${index}`}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-white">{item.pair}</span>
                                <Badge 
                                  variant={isStrong ? "default" : isWeak ? "destructive" : "secondary"}
                                  className={isStrong ? "bg-green-600 hover:bg-green-700" : isWeak ? "bg-red-600 hover:bg-red-700" : ""}
                                >
                                  {sentiment}
                                </Badge>
                              </div>
                              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-500 ${
                                    isStrong ? "bg-green-500" : 
                                    isWeak ? "bg-red-500" : 
                                    "bg-gray-500"
                                  }`}
                                  style={{ width: `${Math.max(0, Math.min(100, strength))}%` }}
                                />
                              </div>
                              <div className="mt-1 text-xs text-gray-400">
                                Score: {item.total_bias > 0 ? '+' : ''}{item.total_bias} | Confidence: {item.confidence}%
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Global Indices Section */}
                  {indexBias && indexBias.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-white">Global Indices</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {indexBias.map((item: any, index: number) => {
                          const isStrong = item.score >= 3;
                          const isWeak = item.score <= -3;
                          const sentiment = isStrong ? "Bullish" : isWeak ? "Bearish" : "Neutral";
                          
                          // Calculate strength percentage (map -6 to +6 range to 0-100%)
                          const strength = ((item.score + 6) / 12) * 100;
                          
                          return (
                            <div key={index} data-testid={`sentiment-index-${index}`}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-white">{item.instrument}</span>
                                <Badge 
                                  variant={isStrong ? "default" : isWeak ? "destructive" : "secondary"}
                                  className={isStrong ? "bg-green-600 hover:bg-green-700" : isWeak ? "bg-red-600 hover:bg-red-700" : ""}
                                >
                                  {sentiment}
                                </Badge>
                              </div>
                              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-500 ${
                                    isStrong ? "bg-green-500" : 
                                    isWeak ? "bg-red-500" : 
                                    "bg-gray-500"
                                  }`}
                                  style={{ width: `${Math.max(0, Math.min(100, strength))}%` }}
                                />
                              </div>
                              <div className="mt-1 text-xs text-gray-400">
                                Score: {item.score > 0 ? '+' : ''}{item.score} | Confidence: {item.confidence}%
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* No Data State */}
                  {(!fundamentalBias || fundamentalBias.length === 0) && (!indexBias || indexBias.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      No market sentiment data available. Automated bias calculations will populate once cron jobs run.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
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
