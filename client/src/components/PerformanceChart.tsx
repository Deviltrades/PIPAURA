import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";

interface PerformanceChartProps {
  trades: any[];
  type: "equity" | "winloss" | "monthly";
}

export function PerformanceChart({ trades, type }: PerformanceChartProps) {
  const getEquityData = () => {
    const closedTrades = trades
      .filter(trade => trade.status === "CLOSED" && trade.pnl !== null)
      .sort((a, b) => new Date(a.exitDate || a.createdAt).getTime() - new Date(b.exitDate || b.createdAt).getTime());

    let runningTotal = 0;
    return closedTrades.map((trade, index) => {
      runningTotal += parseFloat(trade.pnl);
      return {
        trade: index + 1,
        equity: runningTotal,
        date: new Date(trade.exitDate || trade.createdAt).toLocaleDateString(),
      };
    });
  };

  const getWinLossData = () => {
    const closedTrades = trades.filter(trade => trade.status === "CLOSED" && trade.pnl !== null);
    const winners = closedTrades.filter(trade => parseFloat(trade.pnl) > 0).length;
    const losers = closedTrades.filter(trade => parseFloat(trade.pnl) < 0).length;
    
    return [
      { name: "Winners", value: winners, color: "#059669" },
      { name: "Losers", value: losers, color: "#DC2626" },
    ];
  };

  const getMonthlyData = () => {
    const monthlyPnL: Record<string, number> = {};
    
    trades
      .filter(trade => trade.status === "CLOSED" && trade.pnl !== null)
      .forEach(trade => {
        const date = new Date(trade.exitDate || trade.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyPnL[monthKey]) {
          monthlyPnL[monthKey] = 0;
        }
        monthlyPnL[monthKey] += parseFloat(trade.pnl);
      });

    return Object.entries(monthlyPnL)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, pnl]) => ({
        month,
        pnl,
      }));
  };

  if (type === "equity") {
    const data = getEquityData();
    
    return (
      <Card>
        <CardHeader>
          <CardTitle>Equity Curve</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            {data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-600" />
                  <XAxis
                    dataKey="trade"
                    className="text-gray-600 dark:text-gray-400"
                  />
                  <YAxis className="text-gray-600 dark:text-gray-400" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="equity"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                No closed trades yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (type === "winloss") {
    const data = getWinLossData();
    
    return (
      <Card>
        <CardHeader>
          <CardTitle>Win/Loss Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            {data.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                No closed trades yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (type === "monthly") {
    const data = getMonthlyData();
    
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Returns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            {data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-600" />
                  <XAxis
                    dataKey="month"
                    className="text-gray-600 dark:text-gray-400"
                  />
                  <YAxis className="text-gray-600 dark:text-gray-400" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar
                    dataKey="pnl"
                    fill={(data) => data.pnl >= 0 ? "#059669" : "#DC2626"}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                No data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
