import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Brain, Calendar as CalendarIcon, TrendingUp, AlertTriangle } from "lucide-react";
import { getEmotionalAnalytics } from "@/lib/supabase-service";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Cell
} from "recharts";
import { format, subDays } from "date-fns";
import { EmotionalLogModal } from "./emotional-log-modal";

interface EmotionalAnalyticsTabProps {
  accountId: string;
}

export function EmotionalAnalyticsTab({ accountId }: EmotionalAnalyticsTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dateRange] = useState(30); // Last 30 days

  const startDate = format(subDays(new Date(), dateRange), 'yyyy-MM-dd');
  const endDate = format(new Date(), 'yyyy-MM-dd');

  const { data: emotionalData, isLoading, refetch } = useQuery({
    queryKey: ['emotional-analytics', accountId, startDate, endDate],
    queryFn: () => getEmotionalAnalytics(accountId, startDate, endDate),
    retry: false,
  });

  const handleSaveLog = async (logData: any) => {
    try {
      const { saveEmotionalLog } = await import('@/lib/supabase-service');
      await saveEmotionalLog(logData);
      setIsModalOpen(false);
      refetch();
    } catch (error) {
      console.error('Failed to save emotional log:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded w-64"></div>
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

  const summary = emotionalData?.summary || {
    avgMoodWinning: 0,
    avgMoodLosing: 0,
    avgEnergyWinning: 0,
    avgEnergyLosing: 0,
    moodVolatility: 0,
    totalLogs: 0,
    winningDays: 0,
    losingDays: 0
  };

  const correlationData = emotionalData?.correlationData || [];
  const tagAnalysis = emotionalData?.tagAnalysis || [];

  // Prepare scatter plot data
  const scatterData = correlationData.filter(d => d.pnl !== 0);

  // Get color based on P&L
  const getScatterColor = (pnl: number) => {
    return pnl > 0 ? '#22d3ee' : '#ef4444';
  };

  // Calculate mood impact
  const moodImpact = summary.avgMoodWinning - summary.avgMoodLosing;
  const energyImpact = summary.avgEnergyWinning - summary.avgEnergyLosing;

  return (
    <div className="space-y-6">
      {/* Header with Add Log Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Emotional Analytics</h2>
          <p className="text-gray-400">Track your trading psychology and emotional patterns</p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-cyan-500 hover:bg-cyan-600"
          data-testid="button-add-emotional-log"
        >
          <Heart className="mr-2 h-4 w-4" />
          Add Daily Log
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#0f1f3a] border-2 border-cyan-500/60" data-testid="card-total-logs">
          <CardContent className="p-4">
            <div className="text-gray-400 text-sm mb-1">Total Logs</div>
            <div className="text-2xl font-bold text-cyan-400" data-testid="text-total-logs">
              {summary.totalLogs}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0f1f3a] border-2 border-cyan-500/60" data-testid="card-mood-volatility">
          <CardContent className="p-4">
            <div className="text-gray-400 text-sm mb-1">Mood Volatility</div>
            <div className="text-2xl font-bold text-cyan-400" data-testid="text-mood-volatility">
              {summary.moodVolatility.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0f1f3a] border-2 border-cyan-500/60" data-testid="card-mood-impact">
          <CardContent className="p-4">
            <div className="text-gray-400 text-sm mb-1">Mood Impact</div>
            <div className={`text-2xl font-bold ${moodImpact > 0 ? 'text-green-400' : 'text-red-400'}`} data-testid="text-mood-impact">
              {moodImpact > 0 ? '+' : ''}{moodImpact.toFixed(1)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0f1f3a] border-2 border-cyan-500/60" data-testid="card-energy-impact">
          <CardContent className="p-4">
            <div className="text-gray-400 text-sm mb-1">Energy Impact</div>
            <div className={`text-2xl font-bold ${energyImpact > 0 ? 'text-green-400' : 'text-red-400'}`} data-testid="text-energy-impact">
              {energyImpact > 0 ? '+' : ''}{energyImpact.toFixed(1)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mood vs Performance Scatter Plot */}
        <Card className="bg-[#0f1f3a] border-cyan-500/30">
          <CardHeader>
            <CardTitle className="text-cyan-400 flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Mood vs Performance
            </CardTitle>
            <CardDescription>Correlation between mood and trading results</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  type="number" 
                  dataKey="mood" 
                  name="Mood" 
                  domain={[0, 10]}
                  stroke="#94a3b8"
                  label={{ value: 'Mood', position: 'bottom', fill: '#94a3b8' }}
                />
                <YAxis 
                  type="number" 
                  dataKey="pnl" 
                  name="P&L"
                  stroke="#94a3b8"
                  label={{ value: 'P&L', angle: -90, position: 'left', fill: '#94a3b8' }}
                />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ 
                    backgroundColor: '#0f1f3a', 
                    border: '1px solid #22d3ee',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: '#22d3ee' }}
                />
                <Scatter data={scatterData} fill="#22d3ee">
                  {scatterData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getScatterColor(entry.pnl)} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Energy vs Performance */}
        <Card className="bg-[#0f1f3a] border-cyan-500/30">
          <CardHeader>
            <CardTitle className="text-cyan-400 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Energy vs Performance
            </CardTitle>
            <CardDescription>How energy levels affect your trades</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  type="number" 
                  dataKey="energy" 
                  name="Energy" 
                  domain={[0, 10]}
                  stroke="#94a3b8"
                  label={{ value: 'Energy', position: 'bottom', fill: '#94a3b8' }}
                />
                <YAxis 
                  type="number" 
                  dataKey="pnl" 
                  name="P&L"
                  stroke="#94a3b8"
                  label={{ value: 'P&L', angle: -90, position: 'left', fill: '#94a3b8' }}
                />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ 
                    backgroundColor: '#0f1f3a', 
                    border: '1px solid #22d3ee',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: '#22d3ee' }}
                />
                <Scatter data={scatterData} fill="#22d3ee">
                  {scatterData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getScatterColor(entry.pnl)} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Emotional State Analysis */}
        <Card className="bg-[#0f1f3a] border-cyan-500/30">
          <CardHeader>
            <CardTitle className="text-cyan-400 flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Winning vs Losing Days
            </CardTitle>
            <CardDescription>Average mood and energy by outcome</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-400">Winning Days - Mood</span>
                  <span className="text-sm font-medium text-green-400">
                    {summary.avgMoodWinning.toFixed(1)}/10
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-green-400 h-2 rounded-full"
                    style={{ width: `${(summary.avgMoodWinning / 10) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-400">Losing Days - Mood</span>
                  <span className="text-sm font-medium text-red-400">
                    {summary.avgMoodLosing.toFixed(1)}/10
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-red-400 h-2 rounded-full"
                    style={{ width: `${(summary.avgMoodLosing / 10) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-400">Winning Days - Energy</span>
                  <span className="text-sm font-medium text-green-400">
                    {summary.avgEnergyWinning.toFixed(1)}/10
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-green-400 h-2 rounded-full"
                    style={{ width: `${(summary.avgEnergyWinning / 10) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-400">Losing Days - Energy</span>
                  <span className="text-sm font-medium text-red-400">
                    {summary.avgEnergyLosing.toFixed(1)}/10
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-red-400 h-2 rounded-full"
                    style={{ width: `${(summary.avgEnergyLosing / 10) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Emotional Tags */}
        <Card className="bg-[#0f1f3a] border-cyan-500/30">
          <CardHeader>
            <CardTitle className="text-cyan-400 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Emotional Patterns
            </CardTitle>
            <CardDescription>Most frequent emotions and their impact</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tagAnalysis.slice(0, 8).map((tag, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">{tag.tag}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">({tag.frequency}x)</span>
                    <span className={`text-sm font-medium ${tag.avgPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {tag.avgPnL >= 0 ? '+' : ''}{tag.avgPnL.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
              {tagAnalysis.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No emotional data yet. Start logging your daily emotions to see patterns.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Behavioral Insights */}
      {summary.totalLogs > 5 && (
        <Card className="bg-[#0f1f3a] border-cyan-500/30">
          <CardHeader>
            <CardTitle className="text-cyan-400 flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Behavioral Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              {moodImpact > 1.5 && (
                <div className="flex items-start gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-green-400 mt-0.5" />
                  <div>
                    <p className="text-green-400 font-medium">Positive Mood Correlation</p>
                    <p className="text-gray-400 mt-1">
                      Your winning days have significantly higher mood ({summary.avgMoodWinning.toFixed(1)}) 
                      compared to losing days ({summary.avgMoodLosing.toFixed(1)}). 
                      Consider only trading when your mood is above {(summary.avgMoodWinning - 1).toFixed(1)}.
                    </p>
                  </div>
                </div>
              )}
              
              {energyImpact > 1.5 && (
                <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-blue-400 font-medium">Energy Level Matters</p>
                    <p className="text-gray-400 mt-1">
                      Higher energy levels correlate with better performance. 
                      Your winning days show {energyImpact.toFixed(1)} points higher energy. 
                      Consider avoiding trading when energy is below {(summary.avgEnergyWinning - 1).toFixed(1)}.
                    </p>
                  </div>
                </div>
              )}

              {summary.moodVolatility > 2 && (
                <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5" />
                  <div>
                    <p className="text-yellow-400 font-medium">High Emotional Volatility</p>
                    <p className="text-gray-400 mt-1">
                      Your mood volatility ({summary.moodVolatility.toFixed(2)}) suggests emotional fluctuation. 
                      Consider implementing mindfulness practices or consistent routines to stabilize your trading psychology.
                    </p>
                  </div>
                </div>
              )}

              {summary.totalLogs < 10 && (
                <div className="flex items-start gap-2 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                  <CalendarIcon className="h-4 w-4 text-cyan-400 mt-0.5" />
                  <div>
                    <p className="text-cyan-400 font-medium">Build Your Data</p>
                    <p className="text-gray-400 mt-1">
                      Log {10 - summary.totalLogs} more days to unlock deeper insights and personalized recommendations.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <EmotionalLogModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSave={handleSaveLog}
      />
    </div>
  );
}
