import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, TrendingUp, TrendingDown, AlertCircle, ExternalLink, Gauge, Minus } from "lucide-react";

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

        <TabsContent value="strength" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Currency Strength Index</CardTitle>
                <CardDescription>Real-time fundamental strength of major currencies</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {[
                    { currency: "USD", strength: 85, trend: "up", factors: "Strong GDP, Hawkish Fed, Rising Employment" },
                    { currency: "EUR", strength: 65, trend: "neutral", factors: "Stable Inflation, ECB Holding Rates" },
                    { currency: "GBP", strength: 58, trend: "down", factors: "Economic Slowdown, BoE Concerns" },
                    { currency: "JPY", strength: 45, trend: "down", factors: "Negative Rates, Weak Economic Data" },
                    { currency: "CHF", strength: 72, trend: "up", factors: "Safe Haven Demand, Strong Economy" },
                    { currency: "CAD", strength: 68, trend: "neutral", factors: "Oil Prices Stable, Mixed Data" },
                    { currency: "AUD", strength: 55, trend: "down", factors: "China Concerns, RBA Dovish" },
                    { currency: "NZD", strength: 52, trend: "down", factors: "RBNZ Cutting Cycle Started" },
                  ].map((curr, index) => (
                    <div key={index} className="space-y-2" data-testid={`currency-strength-${index}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-lg">{curr.currency}</span>
                          {curr.trend === "up" ? (
                            <TrendingUp className="h-5 w-5 text-green-500" />
                          ) : curr.trend === "down" ? (
                            <TrendingDown className="h-5 w-5 text-red-500" />
                          ) : (
                            <Minus className="h-5 w-5 text-gray-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium">{curr.strength}/100</span>
                          <Badge 
                            variant={curr.strength >= 70 ? "default" : curr.strength >= 50 ? "secondary" : "destructive"}
                          >
                            {curr.strength >= 70 ? "Strong" : curr.strength >= 50 ? "Neutral" : "Weak"}
                          </Badge>
                        </div>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            curr.strength >= 70 ? "bg-green-500" : 
                            curr.strength >= 50 ? "bg-yellow-500" : 
                            "bg-red-500"
                          }`}
                          style={{ width: `${curr.strength}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">{curr.factors}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Economic Health Scores</CardTitle>
                  <CardDescription>Composite fundamental analysis by region</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { region: "United States", score: 82, gdp: "2.4%", inflation: "3.2%", unemployment: "3.8%", rating: "Strong" },
                      { region: "Euro Zone", score: 68, gdp: "0.5%", inflation: "2.9%", unemployment: "6.5%", rating: "Moderate" },
                      { region: "United Kingdom", score: 61, gdp: "0.3%", inflation: "4.6%", unemployment: "4.2%", rating: "Moderate" },
                      { region: "Japan", score: 48, gdp: "-0.1%", inflation: "0.6%", unemployment: "2.6%", rating: "Weak" },
                      { region: "Switzerland", score: 75, gdp: "1.2%", inflation: "1.7%", unemployment: "2.1%", rating: "Strong" },
                    ].map((region, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-3" data-testid={`region-health-${index}`}>
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{region.region}</span>
                          <Badge variant={region.score >= 70 ? "default" : region.score >= 50 ? "secondary" : "destructive"}>
                            {region.rating}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div>
                            <div className="text-muted-foreground text-xs">GDP Growth</div>
                            <div className="font-medium">{region.gdp}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground text-xs">Inflation</div>
                            <div className="font-medium">{region.inflation}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground text-xs">Unemployment</div>
                            <div className="font-medium">{region.unemployment}</div>
                          </div>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              region.score >= 70 ? "bg-green-500" : 
                              region.score >= 50 ? "bg-yellow-500" : 
                              "bg-red-500"
                            }`}
                            style={{ width: `${region.score}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Key Fundamental Drivers</CardTitle>
                  <CardDescription>Current market-moving themes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { driver: "Fed Rate Policy", impact: "High", status: "Hawkish Pause" },
                      { driver: "Global Growth", impact: "Medium", status: "Slowing" },
                      { driver: "Inflation Trends", impact: "High", status: "Cooling" },
                      { driver: "Geopolitical Risk", impact: "Medium", status: "Elevated" },
                      { driver: "Oil Prices", impact: "Medium", status: "Stable" },
                    ].map((driver, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border-l-4 border-l-blue-500 pl-3">
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
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
