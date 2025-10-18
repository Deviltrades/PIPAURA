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
    <div className="p-3 sm:p-4 lg:p-8 min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white" data-testid="text-fundamentals-title">
            Fundamental Analysis
          </h1>
          <p className="text-xs sm:text-sm text-gray-300">
            Economic calendar, news events, and market-moving fundamentals
          </p>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-3 lg:gap-4 w-full sm:w-auto shrink-0">
          <TimezoneSelector />
          <Button
            onClick={handleManualRefresh}
            variant="outline"
            className="group border-cyan-600/50 bg-slate-800/50 hover:bg-cyan-600/20 hover:border-cyan-500 transition-all duration-300 shrink-0"
            disabled={isRefreshing}
            data-testid="button-refresh-fundamentals"
          >
            <RefreshCw 
              className={`h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-cyan-400 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} 
            />
            <div className="flex flex-col items-start">
              <span className="text-xs sm:text-sm font-medium text-white">Refresh<span className="hidden sm:inline"> Data</span></span>
              <span className="text-[10px] sm:text-xs text-gray-400 hidden sm:block">Auto-updates every 60s</span>
            </div>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="calendar" className="space-y-3 sm:space-y-4">
        <TabsList className="w-full grid grid-cols-4 h-auto">
          <TabsTrigger value="calendar" data-testid="tab-calendar" className="flex-col sm:flex-row gap-1 sm:gap-2 py-2 px-1 sm:px-3">
            <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="text-[10px] sm:text-sm">Calendar</span>
          </TabsTrigger>
          <TabsTrigger value="news" data-testid="tab-news" className="flex-col sm:flex-row gap-1 sm:gap-2 py-2 px-1 sm:px-3">
            <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="text-[10px] sm:text-sm">News</span>
          </TabsTrigger>
          <TabsTrigger value="analysis" data-testid="tab-analysis" className="flex-col sm:flex-row gap-1 sm:gap-2 py-2 px-1 sm:px-3">
            <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="text-[10px] sm:text-sm">Analysis</span>
          </TabsTrigger>
          <TabsTrigger value="strength" data-testid="tab-strength" className="flex-col sm:flex-row gap-1 sm:gap-2 py-2 px-1 sm:px-3">
            <Gauge className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="text-[10px] sm:text-sm">Strength</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            <div className="lg:col-span-2">
              <Card className="bg-[#0f1f3a] border-[#1a2f4a]">
                <CardHeader className="p-3 sm:p-4 lg:p-6">
                  <CardTitle className="text-base sm:text-lg lg:text-xl">Economic Calendar</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">This week's key economic releases and central bank events</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {eventsLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading events...</div>
                  ) : weeklyEvents && weeklyEvents.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-[#1a2f4a] bg-slate-900/50">
                            <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                            <th className="text-left py-2 sm:py-3 px-1 sm:px-2 text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">Time</th>
                            <th className="text-left py-2 sm:py-3 px-1 sm:px-2 text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">Cur</th>
                            <th className="text-left py-2 sm:py-3 px-1 text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider w-6 sm:w-8">Impact</th>
                            <th className="text-left py-2 sm:py-3 px-2 sm:px-3 text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">Event</th>
                            <th className="text-right py-2 sm:py-3 px-2 sm:px-3 text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">Actual</th>
                            <th className="text-right py-2 sm:py-3 px-2 sm:px-3 text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">Forecast</th>
                            <th className="text-right py-2 sm:py-3 px-2 sm:px-3 text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">Previous</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.keys(groupedEvents).map((date) => [
                            <tr key={`date-${date}`} className="bg-slate-800/30">
                              <td colSpan={8} className="py-1.5 sm:py-2 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-300">
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
                                  <td className="py-2 sm:py-3 px-2 sm:px-4"></td>
                                  <td className="py-2 sm:py-3 px-1 sm:px-2 text-[10px] sm:text-sm font-mono text-gray-400">
                                    {formatEventTime(event.event_date, event.event_time)}
                                  </td>
                                  <td className="py-2 sm:py-3 px-1 sm:px-2">
                                    <span className="text-[10px] sm:text-xs font-semibold text-cyan-400">
                                      {event.currency}
                                    </span>
                                  </td>
                                  <td className="py-2 sm:py-3 px-1">
                                    <Circle 
                                      className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${getImpactColor(event.impact)} fill-current`}
                                      data-testid={`impact-${event.impact.toLowerCase()}`}
                                    />
                                  </td>
                                  <td className="py-2 sm:py-3 px-2 sm:px-3 text-[10px] sm:text-sm text-gray-200">
                                    {event.title}
                                  </td>
                                  <td className={`py-2 sm:py-3 px-2 sm:px-3 text-[10px] sm:text-sm text-right font-medium ${
                                    event.actual ? 'text-white' : 'text-gray-500'
                                  }`}>
                                    {event.actual || '-'}
                                  </td>
                                  <td className="py-2 sm:py-3 px-2 sm:px-3 text-[10px] sm:text-sm text-right text-gray-400">
                                    {event.forecast || '-'}
                                  </td>
                                  <td className="py-2 sm:py-3 px-2 sm:px-3 text-[10px] sm:text-sm text-right text-gray-400">
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

            <div className="space-y-3 sm:space-y-4">
              <Card className="bg-[#0f1f3a] border-[#1a2f4a]">
                <CardHeader className="p-3 sm:p-4 lg:p-6">
                  <CardTitle className="text-sm sm:text-base lg:text-lg">High Impact Events & Central Bank Rates</CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4">
                  {/* High Impact Events This Week */}
                  <div>
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <h3 className="text-xs sm:text-sm font-semibold text-gray-300">High Impact Events (This Week)</h3>
                      {eventCounts && (
                        <Badge variant="destructive" data-testid="badge-this-week" className="text-[10px] sm:text-xs">
                          {eventCounts.thisWeek}
                        </Badge>
                      )}
                    </div>
                    {highImpactLoading ? (
                      <div className="text-center py-3 text-xs sm:text-sm text-muted-foreground">Loading events...</div>
                    ) : highImpactEvents && highImpactEvents.length > 0 ? (
                      <div className="space-y-1.5 sm:space-y-2">
                        {highImpactEvents.map((event: any, index: number) => (
                          <div 
                            key={index} 
                            className="flex items-center justify-between text-[10px] sm:text-xs bg-slate-800/50 p-1.5 sm:p-2 rounded"
                            data-testid={`high-impact-event-${index}`}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-1.5 sm:gap-2">
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
                      <div className="text-center py-3 text-xs sm:text-sm text-muted-foreground">No high impact events this week</div>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="border-t border-[#1a2f4a]"></div>

                  {/* Central Bank Rates */}
                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold text-gray-300 mb-2 sm:mb-3">Central Bank Rates</h3>
                    <div className="space-y-2 sm:space-y-3">
                      {[
                        { bank: "Federal Reserve", rate: "4.50%", trend: "neutral" },
                        { bank: "ECB", rate: "2.00%", trend: "down" },
                        { bank: "Bank of England", rate: "4.00%", trend: "down" },
                        { bank: "Bank of Japan", rate: "0.50%", trend: "up" },
                      ].map((cb, index) => (
                        <div key={index} className="flex items-center justify-between" data-testid={`cb-rate-${index}`}>
                          <span className="text-xs sm:text-sm">{cb.bank}</span>
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <span className="font-medium text-xs sm:text-sm">{cb.rate}</span>
                            {cb.trend === "up" ? (
                              <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
                            ) : cb.trend === "down" ? (
                              <TrendingDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500" />
                            ) : (
                              <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#0f1f3a] border-[#1a2f4a]">
                <CardHeader className="p-3 sm:p-4 lg:p-6">
                  <CardTitle className="text-sm sm:text-base lg:text-lg">Quick Links</CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 lg:p-6 space-y-1.5 sm:space-y-2">
                  <Button variant="outline" className="w-full justify-start border-cyan-500/50 text-white hover:bg-cyan-600/20 h-8 sm:h-10 text-xs sm:text-sm" data-testid="button-forex-factory">
                    <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    Forex Factory Calendar
                  </Button>
                  <Button variant="outline" className="w-full justify-start border-cyan-500/50 text-white hover:bg-cyan-600/20 h-8 sm:h-10 text-xs sm:text-sm" data-testid="button-investing">
                    <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    Investing.com Calendar
                  </Button>
                  <Button variant="outline" className="w-full justify-start border-cyan-500/50 text-white hover:bg-cyan-600/20 h-8 sm:h-10 text-xs sm:text-sm" data-testid="button-tradingeconomics">
                    <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    Trading Economics
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="news" className="space-y-3 sm:space-y-4">
          <Card className="bg-[#0f1f3a] border-[#1a2f4a]">
            <CardHeader className="p-3 sm:p-4 lg:p-6">
              <CardTitle className="text-base sm:text-lg lg:text-xl">Latest Market News</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Breaking news and market-moving headlines</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6">
              {newsLoading ? (
                <div className="text-center py-8 text-xs sm:text-sm text-muted-foreground">Loading market news...</div>
              ) : marketNews && marketNews.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {marketNews.map((news: any, index: number) => {
                    const timestamp = new Date(news.datetime * 1000);
                    const timeAgo = formatDistanceToNow(timestamp, { addSuffix: true });

                    return (
                      <div
                        key={news.id || index}
                        className="border-l-4 border-l-cyan-500 pl-2 sm:pl-4 hover:bg-muted/50 p-2 sm:p-3 rounded-r transition-colors cursor-pointer"
                        data-testid={`news-${index}`}
                        onClick={() => news.url && window.open(news.url, '_blank')}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5 sm:mb-2">
                          <h3 className="font-medium text-white text-xs sm:text-sm lg:text-base">{news.headline}</h3>
                          <Badge 
                            variant={
                              news.impact_level === "high" 
                                ? "destructive" 
                                : news.impact_level === "medium" 
                                ? "default" 
                                : "secondary"
                            }
                            className="text-[10px] sm:text-xs shrink-0"
                          >
                            {news.impact_level}
                          </Badge>
                        </div>
                        {news.summary && (
                          <p className="text-[10px] sm:text-sm text-muted-foreground mb-1.5 sm:mb-2">{news.summary}</p>
                        )}
                        <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-muted-foreground flex-wrap">
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
                <div className="text-center py-8 text-xs sm:text-sm text-muted-foreground">
                  No market news available. News will appear once the system fetches the latest updates.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-3 sm:space-y-4">
          <Card className="bg-[#0f1f3a] border-[#1a2f4a]">
            <CardHeader className="p-3 sm:p-4 lg:p-6">
              <CardTitle className="text-base sm:text-lg lg:text-xl">Market Sentiment</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Real-time fundamental bias for all FX pairs and global indices</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6">
              {biasLoading || indexLoading ? (
                <div className="text-center py-8 text-xs sm:text-sm text-muted-foreground">Loading market sentiment data...</div>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  {/* FX Pairs Section */}
                  {fundamentalBias && fundamentalBias.length > 0 && (
                    <div>
                      <h3 className="text-sm sm:text-base lg:text-lg font-semibold mb-3 sm:mb-4 text-white">FX Pairs</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                        {fundamentalBias.map((item: any, index: number) => {
                          const isStrong = item.total_bias >= 7;
                          const isWeak = item.total_bias <= -7;
                          const sentiment = isStrong ? "Bullish" : isWeak ? "Bearish" : "Neutral";
                          
                          // Calculate strength percentage (map -15 to +15 range to 0-100%)
                          const strength = ((item.total_bias + 15) / 30) * 100;
                          
                          return (
                            <div key={index} data-testid={`sentiment-pair-${index}`}>
                              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                                <span className="font-medium text-white text-xs sm:text-sm">{item.pair}</span>
                                <Badge 
                                  variant={isStrong ? "default" : isWeak ? "destructive" : "secondary"}
                                  className={`${isStrong ? "bg-green-600 hover:bg-green-700" : isWeak ? "bg-red-600 hover:bg-red-700" : ""} text-[10px] sm:text-xs`}
                                >
                                  {sentiment}
                                </Badge>
                              </div>
                              <div className="h-1.5 sm:h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-500 ${
                                    isStrong ? "bg-green-500" : 
                                    isWeak ? "bg-red-500" : 
                                    "bg-gray-500"
                                  }`}
                                  style={{ width: `${Math.max(0, Math.min(100, strength))}%` }}
                                />
                              </div>
                              <div className="mt-1 text-[10px] sm:text-xs text-gray-400">
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
                      <h3 className="text-sm sm:text-base lg:text-lg font-semibold mb-3 sm:mb-4 text-white">Global Indices</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                        {indexBias.map((item: any, index: number) => {
                          const isStrong = item.score >= 3;
                          const isWeak = item.score <= -3;
                          const sentiment = isStrong ? "Bullish" : isWeak ? "Bearish" : "Neutral";
                          
                          // Calculate strength percentage (map -6 to +6 range to 0-100%)
                          const strength = ((item.score + 6) / 12) * 100;
                          
                          return (
                            <div key={index} data-testid={`sentiment-index-${index}`}>
                              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                                <span className="font-medium text-white text-xs sm:text-sm">{item.instrument}</span>
                                <Badge 
                                  variant={isStrong ? "default" : isWeak ? "destructive" : "secondary"}
                                  className={`${isStrong ? "bg-green-600 hover:bg-green-700" : isWeak ? "bg-red-600 hover:bg-red-700" : ""} text-[10px] sm:text-xs`}
                                >
                                  {sentiment}
                                </Badge>
                              </div>
                              <div className="h-1.5 sm:h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-500 ${
                                    isStrong ? "bg-green-500" : 
                                    isWeak ? "bg-red-500" : 
                                    "bg-gray-500"
                                  }`}
                                  style={{ width: `${Math.max(0, Math.min(100, strength))}%` }}
                                />
                              </div>
                              <div className="mt-1 text-[10px] sm:text-xs text-gray-400">
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
                    <div className="text-center py-8 text-xs sm:text-sm text-muted-foreground">
                      No market sentiment data available. Automated bias calculations will populate once cron jobs run.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="strength" className="space-y-3 sm:space-y-4">
          <Card className="bg-[#0f1f3a] border-[#1a2f4a]">
            <CardHeader className="p-3 sm:p-4 lg:p-6">
              <CardTitle className="text-base sm:text-lg lg:text-xl">FX Pair Fundamental Bias</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Automated fundamental analysis for 38 major currency pairs</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6">
              {biasLoading ? (
                <div className="text-center py-8 text-xs sm:text-sm text-muted-foreground">Loading fundamental data...</div>
              ) : fundamentalBias && fundamentalBias.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
                        className={`space-y-1.5 sm:space-y-2 p-2.5 sm:p-3 lg:p-4 rounded-lg bg-[#0a1628] border-2 border-cyan-500/60 transition-all duration-300 ${
                          isStrongBias ? 'heartbeat-pulse' : ''
                        }`}
                        data-testid={`pair-bias-${index}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <span className="font-bold text-xs sm:text-sm lg:text-base">{bias.pair}</span>
                            {bias.total_bias >= 7 ? (
                              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                            ) : bias.total_bias <= -7 ? (
                              <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                            ) : (
                              <Minus className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                            )}
                          </div>
                          {bias.total_bias >= 7 ? (
                            <Badge className="bg-green-600 hover:bg-green-700 text-white text-[10px] sm:text-xs">
                              {bias.bias_text}
                            </Badge>
                          ) : (
                            <Badge variant={getBiasVariant(bias.total_bias)} className="text-[10px] sm:text-xs">
                              {bias.bias_text}
                            </Badge>
                          )}
                        </div>
                        <p className="text-[10px] sm:text-sm text-muted-foreground line-clamp-2">{bias.summary}</p>
                        <div className="flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground pt-0.5 sm:pt-1">
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
                <div className="text-center py-8 text-xs sm:text-sm text-muted-foreground">
                  No fundamental bias data available. Run the automation script to generate data.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-[#0f1f3a] border-[#1a2f4a]">
            <CardHeader className="p-3 sm:p-4 lg:p-6">
              <CardTitle className="text-base sm:text-lg lg:text-xl">Key Fundamental Drivers</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Current market-moving themes</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6">
              {driversLoading ? (
                <div className="text-center py-4 text-xs sm:text-sm text-muted-foreground">Loading market drivers...</div>
              ) : marketDrivers && marketDrivers.length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  {marketDrivers.map((driver: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-1.5 sm:p-2 border-l-4 border-l-cyan-500 pl-2 sm:pl-3" data-testid={`driver-${index}`}>
                      <div>
                        <div className="font-medium text-xs sm:text-sm">{driver.driver}</div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground">{driver.status}</div>
                      </div>
                      <Badge variant={driver.impact === "High" ? "destructive" : "secondary"} className="text-[10px] sm:text-xs">
                        {driver.impact}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-xs sm:text-sm text-muted-foreground">
                  No driver data available. Run the automation to generate data.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Indices Section */}
          <Card className="bg-[#0f1f3a] border-[#1a2f4a]">
            <CardHeader className="p-3 sm:p-4 lg:p-6">
              <CardTitle className="text-base sm:text-lg lg:text-xl">Global Indices Fundamental Bias</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Automated fundamental analysis for major stock market indices</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6">
              {indexLoading ? (
                <div className="text-center py-8 text-xs sm:text-sm text-muted-foreground">Loading index bias data...</div>
              ) : indexBias && indexBias.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
                        className={`space-y-1.5 sm:space-y-2 p-2.5 sm:p-3 lg:p-4 rounded-lg bg-[#0a1628] border-2 border-cyan-500/60 transition-all duration-300 ${
                          isStrongIndexBias ? 'heartbeat-pulse' : ''
                        }`}
                        data-testid={`index-bias-${idx}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <span className="font-bold text-xs sm:text-sm lg:text-base">{index.instrument}</span>
                            {index.score >= 3 ? (
                              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                            ) : index.score <= -3 ? (
                              <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                            ) : (
                              <Minus className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                            )}
                          </div>
                          {index.score >= 3 ? (
                            <Badge className="bg-green-600 hover:bg-green-700 text-white text-[10px] sm:text-xs">
                              {index.bias_text}
                            </Badge>
                          ) : (
                            <Badge variant={getBiasVariant(index.score)} className="text-[10px] sm:text-xs">
                              {index.bias_text}
                            </Badge>
                          )}
                        </div>
                        <p className="text-[10px] sm:text-sm text-muted-foreground line-clamp-2">{index.summary}</p>
                        <div className="flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground pt-0.5 sm:pt-1">
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
                <div className="text-center py-8 text-xs sm:text-sm text-muted-foreground">
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
