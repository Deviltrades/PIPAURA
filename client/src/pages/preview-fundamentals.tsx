import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, TrendingUp, TrendingDown, AlertCircle, ExternalLink, Gauge, Minus, Circle } from "lucide-react";
import { format, formatDistanceToNow, addDays } from "date-fns";

// Demo data for economic events
const demoEconomicEvents = [
  { date: format(new Date(), 'yyyy-MM-dd'), time: '08:30', currency: 'USD', impact: 'High', event: 'Non-Farm Payrolls', actual: '250K', forecast: '200K', previous: '180K' },
  { date: format(new Date(), 'yyyy-MM-dd'), time: '10:00', currency: 'EUR', impact: 'Medium', event: 'CPI m/m', actual: null, forecast: '0.4%', previous: '0.3%' },
  { date: format(new Date(), 'yyyy-MM-dd'), time: '13:00', currency: 'GBP', impact: 'Low', event: 'Manufacturing PMI', actual: null, forecast: '52.5', previous: '51.8' },
  { date: format(addDays(new Date(), 1), 'yyyy-MM-dd'), time: '08:30', currency: 'USD', impact: 'High', event: 'Federal Reserve Rate Decision', actual: null, forecast: '4.50%', previous: '4.50%' },
  { date: format(addDays(new Date(), 1), 'yyyy-MM-dd'), time: '12:00', currency: 'CAD', impact: 'Medium', event: 'GDP q/q', actual: null, forecast: '2.1%', previous: '1.9%' },
  { date: format(addDays(new Date(), 2), 'yyyy-MM-dd'), time: '09:00', currency: 'EUR', impact: 'High', event: 'ECB Press Conference', actual: null, forecast: null, previous: null },
  { date: format(addDays(new Date(), 2), 'yyyy-MM-dd'), time: '14:30', currency: 'USD', impact: 'Medium', event: 'Unemployment Claims', actual: null, forecast: '215K', previous: '210K' },
];

// Demo high impact events
const demoHighImpactEvents = demoEconomicEvents.filter(e => e.impact === 'High');

// Demo market news
const demoMarketNews = [
  {
    id: 1,
    headline: 'Federal Reserve Signals Potential Rate Cuts in Q2 2025',
    summary: 'Fed Chair Jerome Powell indicated that the central bank may begin easing monetary policy if inflation continues to decline toward the 2% target.',
    source: 'Reuters',
    category: 'forex',
    impact_level: 'high',
    datetime: Math.floor(Date.now() / 1000) - 7200,
    url: 'https://reuters.com'
  },
  {
    id: 2,
    headline: 'EUR/USD Breaks Above 1.10 on Weak US Dollar Sentiment',
    summary: 'The euro gained strength against the dollar as traders anticipate dovish Fed policy shifts.',
    source: 'Bloomberg',
    category: 'forex',
    impact_level: 'medium',
    datetime: Math.floor(Date.now() / 1000) - 10800,
    url: 'https://bloomberg.com'
  },
  {
    id: 3,
    headline: 'Gold Prices Surge to New Highs Amid Geopolitical Tensions',
    summary: 'Safe-haven demand pushes gold above $2,100 per ounce as global uncertainties persist.',
    source: 'CNBC',
    category: 'general',
    impact_level: 'high',
    datetime: Math.floor(Date.now() / 1000) - 14400,
    url: 'https://cnbc.com'
  },
  {
    id: 4,
    headline: 'Bitcoin Consolidates Around $45,000 After Recent Rally',
    summary: 'Cryptocurrency markets show signs of stabilization following last weeks sharp gains.',
    source: 'CoinDesk',
    category: 'crypto',
    impact_level: 'low',
    datetime: Math.floor(Date.now() / 1000) - 18000,
    url: 'https://coindesk.com'
  },
  {
    id: 5,
    headline: 'ECB Maintains Rates, But Hints at Future Policy Flexibility',
    summary: 'European Central Bank keeps rates unchanged but acknowledges improving economic conditions.',
    source: 'Financial Times',
    category: 'forex',
    impact_level: 'medium',
    datetime: Math.floor(Date.now() / 1000) - 21600,
    url: 'https://ft.com'
  }
];

// Demo fundamental bias for FX pairs
const demoFundamentalBias = [
  { pair: 'EUR/USD', total_bias: 8, confidence: 85, bias_text: 'Bullish EUR', summary: 'Strong EUR fundamentals driven by ECB policy normalization and improved economic data.' },
  { pair: 'GBP/USD', total_bias: -9, confidence: 78, bias_text: 'Bearish GBP', summary: 'UK economic headwinds and BoE dovish stance weigh on sterling.' },
  { pair: 'USD/JPY', total_bias: 5, confidence: 72, bias_text: 'Slight Bullish', summary: 'Mixed signals with Fed policy uncertainty offsetting BoJ ultra-dovish stance.' },
  { pair: 'AUD/USD', total_bias: 10, confidence: 88, bias_text: 'Strong Bullish', summary: 'Commodity rally and RBA hawkish tone support Aussie dollar strength.' },
  { pair: 'USD/CAD', total_bias: -3, confidence: 65, bias_text: 'Neutral', summary: 'Oil prices and Fed policy create balanced outlook for USD/CAD.' },
  { pair: 'NZD/USD', total_bias: 7, confidence: 80, bias_text: 'Bullish NZD', summary: 'RBNZ maintaining higher rates supports NZD against weakening USD.' },
  { pair: 'EUR/GBP', total_bias: 12, confidence: 92, bias_text: 'Very Bullish', summary: 'EUR significantly outperforming GBP on diverging central bank policies.' },
  { pair: 'USD/CHF', total_bias: -6, confidence: 70, bias_text: 'Bearish USD', summary: 'Safe-haven flows into CHF amid global uncertainties.' },
];

// Demo index bias
const demoIndexBias = [
  { instrument: 'US100', score: 4, confidence: 82, bias_text: 'Bullish', summary: 'Tech sector strength and AI optimism drive NASDAQ higher.' },
  { instrument: 'SPX500', score: 3, confidence: 78, bias_text: 'Slight Bullish', summary: 'Broad market gains supported by earnings resilience.' },
  { instrument: 'UK100', score: -4, confidence: 75, bias_text: 'Bearish', summary: 'UK economic concerns weigh on FTSE performance.' },
  { instrument: 'GER40', score: 5, confidence: 80, bias_text: 'Bullish', summary: 'German manufacturing recovery supports DAX rally.' },
  { instrument: 'JPN225', score: 2, confidence: 68, bias_text: 'Neutral', summary: 'Mixed signals from BoJ policy and export data.' },
  { instrument: 'AUS200', score: 6, confidence: 85, bias_text: 'Bullish', summary: 'Mining sector strength drives ASX higher.' },
];

// Demo market drivers
const demoMarketDrivers = [
  { driver: 'Federal Reserve Policy Expectations', status: 'Dovish pivot anticipated for Q2', impact: 'High' },
  { driver: 'US-China Trade Relations', status: 'Stabilizing after recent tensions', impact: 'Medium' },
  { driver: 'Energy Prices', status: 'Oil consolidating around $75/barrel', impact: 'Medium' },
  { driver: 'Inflation Trends', status: 'Core CPI continuing to moderate', impact: 'High' },
];

export default function PreviewFundamentals() {
  const groupedEvents = demoEconomicEvents.reduce((acc: any, event: any) => {
    if (!acc[event.date]) {
      acc[event.date] = [];
    }
    acc[event.date].push(event);
    return acc;
  }, {});

  const getImpactColor = (impact: string) => {
    if (impact === "High") return "text-red-500";
    if (impact === "Medium") return "text-yellow-500";
    return "text-gray-500";
  };

  return (
    <div className="p-3 sm:p-4 lg:p-8 min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white" data-testid="text-fundamentals-title">
            Fundamental Analysis
          </h1>
          <p className="text-sm sm:text-base text-gray-300">
            Economic calendar, news events, and market-moving fundamentals
          </p>
        </div>
        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2">
          <p className="text-xs sm:text-sm text-cyan-400">📊 Preview Mode</p>
        </div>
      </div>

      <Tabs defaultValue="calendar" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="calendar" data-testid="tab-calendar" className="text-xs sm:text-sm">
            <Calendar className="h-3 h-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Economic </span>Calendar
          </TabsTrigger>
          <TabsTrigger value="news" data-testid="tab-news" className="text-xs sm:text-sm">
            <AlertCircle className="h-3 h-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Market </span>News
          </TabsTrigger>
          <TabsTrigger value="analysis" data-testid="tab-analysis" className="text-xs sm:text-sm">
            <TrendingUp className="h-3 h-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Analysis
          </TabsTrigger>
          <TabsTrigger value="strength" data-testid="tab-strength" className="text-xs sm:text-sm">
            <Gauge className="h-3 h-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Strength
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="lg:col-span-2">
              <Card className="bg-[#0f1f3a] border-[#1a2f4a]">
                <CardHeader>
                  <CardTitle>Economic Calendar</CardTitle>
                  <CardDescription>This week's key economic releases and central bank events</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
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
                              {format(new Date(date), 'EEE MMM dd')}
                            </td>
                          </tr>,
                          ...groupedEvents[date].map((event: any, eventIdx: number) => (
                            <tr 
                              key={`event-${date}-${eventIdx}`}
                              className="border-b border-[#1a2f4a]/50 hover:bg-cyan-600/10 transition-colors"
                              data-testid={`event-${date}-${eventIdx}`}
                            >
                              <td className="py-3 px-4"></td>
                              <td className="py-3 px-2 text-sm font-mono text-gray-400">{event.time}</td>
                              <td className="py-3 px-2">
                                <span className="text-xs font-semibold text-cyan-400">{event.currency}</span>
                              </td>
                              <td className="py-3 px-1">
                                <Circle className={`h-3 w-3 ${getImpactColor(event.impact)} fill-current`} />
                              </td>
                              <td className="py-3 px-3 text-sm text-gray-200">{event.event}</td>
                              <td className={`py-3 px-3 text-sm text-right font-medium ${event.actual ? 'text-white' : 'text-gray-500'}`}>
                                {event.actual || '-'}
                              </td>
                              <td className="py-3 px-3 text-sm text-right text-gray-400">{event.forecast || '-'}</td>
                              <td className="py-3 px-3 text-sm text-right text-gray-400">{event.previous || '-'}</td>
                            </tr>
                          ))
                        ])}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="bg-[#0f1f3a] border-[#1a2f4a]">
                <CardHeader>
                  <CardTitle className="text-lg">High Impact Events & Central Bank Rates</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-300">High Impact Events (This Week)</h3>
                      <Badge variant="destructive">{demoHighImpactEvents.length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {demoHighImpactEvents.map((event: any, index: number) => (
                        <div key={index} className="flex items-center justify-between text-xs bg-slate-800/50 p-2 rounded">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-cyan-400 font-semibold">{event.currency}</span>
                              <span className="text-gray-300">{event.event}</span>
                            </div>
                            <div className="text-gray-500 mt-0.5">
                              {format(new Date(event.date), 'MMM dd')} • {event.time}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-[#1a2f4a]"></div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-300 mb-3">Central Bank Rates</h3>
                    <div className="space-y-3">
                      {[
                        { bank: "Federal Reserve", rate: "4.50%", trend: "neutral" },
                        { bank: "ECB", rate: "2.00%", trend: "down" },
                        { bank: "Bank of England", rate: "4.00%", trend: "down" },
                        { bank: "Bank of Japan", rate: "0.50%", trend: "up" },
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
                  <Button variant="outline" className="w-full justify-start border-cyan-500/50 text-white hover:bg-cyan-600/20">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Forex Factory Calendar
                  </Button>
                  <Button variant="outline" className="w-full justify-start border-cyan-500/50 text-white hover:bg-cyan-600/20">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Investing.com Calendar
                  </Button>
                  <Button variant="outline" className="w-full justify-start border-cyan-500/50 text-white hover:bg-cyan-600/20">
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
                {demoMarketNews.map((news: any, index: number) => {
                  const timestamp = new Date(news.datetime * 1000);
                  const timeAgo = formatDistanceToNow(timestamp, { addSuffix: true });

                  return (
                    <div
                      key={news.id}
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
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-white">FX Pairs</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {demoFundamentalBias.slice(0, 6).map((item: any, index: number) => {
                      const isStrong = item.total_bias >= 7;
                      const isWeak = item.total_bias <= -7;
                      const sentiment = isStrong ? "Bullish" : isWeak ? "Bearish" : "Neutral";
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

                <div>
                  <h3 className="text-lg font-semibold mb-4 text-white">Global Indices</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {demoIndexBias.map((item: any, index: number) => {
                      const isStrong = item.score >= 3;
                      const isWeak = item.score <= -3;
                      const sentiment = isStrong ? "Bullish" : isWeak ? "Bearish" : "Neutral";
                      const strength = ((item.score + 10) / 20) * 100;
                      
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
              </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {demoFundamentalBias.map((bias: any, index: number) => {
                  const getBiasColor = (totalBias: number) => {
                    if (totalBias >= 7) return "text-green-500";
                    if (totalBias <= -7) return "text-red-500";
                    return "text-gray-500";
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
                        <Badge 
                          variant={bias.total_bias >= 7 ? "default" : bias.total_bias <= -7 ? "destructive" : "secondary"}
                          className={bias.total_bias >= 7 ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                        >
                          {bias.bias_text}
                        </Badge>
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
            </CardContent>
          </Card>

          <Card className="bg-[#0f1f3a] border-[#1a2f4a]">
            <CardHeader>
              <CardTitle>Key Fundamental Drivers</CardTitle>
              <CardDescription>Current market-moving themes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {demoMarketDrivers.map((driver: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 border-l-4 border-l-cyan-500 pl-3">
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
            </CardContent>
          </Card>

          <Card className="bg-[#0f1f3a] border-[#1a2f4a]">
            <CardHeader>
              <CardTitle>Global Indices Fundamental Bias</CardTitle>
              <CardDescription>Automated fundamental analysis for major stock market indices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {demoIndexBias.map((index: any, idx: number) => {
                  const getBiasColor = (score: number) => {
                    if (score >= 3) return "text-green-500";
                    if (score <= -3) return "text-red-500";
                    return "text-gray-500";
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
                        <Badge 
                          variant={index.score >= 3 ? "default" : index.score <= -3 ? "destructive" : "secondary"}
                          className={index.score >= 3 ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                        >
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
