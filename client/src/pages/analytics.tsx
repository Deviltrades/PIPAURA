import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, ResponsiveContainer } from "recharts";
import { formatCurrency, formatPercentage } from "@/lib/utils";

export default function Analytics() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["/api/analytics"],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="mb-8">
          <div className="h-8 bg-muted animate-pulse rounded w-48 mb-2"></div>
          <div className="h-4 bg-muted animate-pulse rounded w-64"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-64 bg-muted animate-pulse rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const stats = analytics || {
    totalPnL: 0,
    winRate: 0,
    profitFactor: 0,
    maxDrawdown: 0,
    monthlyData: [],
    equityCurve: []
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Trading Analytics</h1>
        <p className="text-muted-foreground">Detailed performance analysis and metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total P&L</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(stats.totalPnL)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.winRate.toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Profit Factor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.profitFactor.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Max Drawdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatPercentage(stats.maxDrawdown)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), "P&L"]}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--background))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px"
                  }}
                />
                <Bar dataKey="pnl" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Equity Curve</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.equityCurve}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), "Equity"]}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--background))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px"
                  }}
                />
                <Line type="monotone" dataKey="equity" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}