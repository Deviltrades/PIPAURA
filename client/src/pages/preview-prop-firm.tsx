import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, TrendingUp, TrendingDown, Target, DollarSign, Calendar, BarChart3, Trophy } from "lucide-react";
import { demoAccounts, demoPropFirmTrackers } from "@/lib/demo-data";

// Preview Funding Progress Tracker Component (Read-only)
function PreviewFundingProgressTracker({ tracker }: { tracker: any }) {
  const [selectedPhase] = useState<'challenge' | 'verification' | 'funded' | 'scaling'>(tracker.current_phase || 'challenge');

  // Calculate drawdown buffer
  const dailyDrawdownBuffer = tracker.daily_max_loss - (tracker.current_daily_loss || 0);
  const overallDrawdownBuffer = tracker.overall_max_loss - (tracker.current_overall_loss || 0);
  const dailyBufferPercentage = tracker.daily_max_loss > 0 ? (dailyDrawdownBuffer / tracker.daily_max_loss) * 100 : 0;
  const overallBufferPercentage = tracker.overall_max_loss > 0 ? (overallDrawdownBuffer / tracker.overall_max_loss) * 100 : 0;

  // Calculate profit progress
  const profitProgress = tracker.profit_target > 0 ? ((tracker.current_profit || 0) / tracker.profit_target) * 100 : 0;
  const profitRemaining = tracker.profit_target - (tracker.current_profit || 0);

  // Calculate pass probability
  const calculatePassProbability = () => {
    let probability = 100;
    const dailyDrawdownUsage = tracker.daily_max_loss > 0 ? ((tracker.current_daily_loss || 0) / tracker.daily_max_loss) * 100 : 0;
    const overallDrawdownUsage = tracker.overall_max_loss > 0 ? ((tracker.current_overall_loss || 0) / tracker.overall_max_loss) * 100 : 0;
    
    if (dailyDrawdownUsage > 80) probability -= 30;
    else if (dailyDrawdownUsage > 60) probability -= 15;
    else if (dailyDrawdownUsage > 40) probability -= 5;
    
    if (overallDrawdownUsage > 80) probability -= 30;
    else if (overallDrawdownUsage > 60) probability -= 15;
    else if (overallDrawdownUsage > 40) probability -= 5;
    
    if (profitProgress >= 90) probability = Math.min(100, probability + 10);
    else if (profitProgress >= 70) probability = Math.min(100, probability + 5);
    
    return Math.max(0, Math.min(100, probability));
  };

  const passProbability = calculatePassProbability();

  const phaseConfig = {
    challenge: { label: 'Challenge', color: 'bg-blue-500', ring: 'ring-blue-500' },
    verification: { label: 'Verification', color: 'bg-purple-500', ring: 'ring-purple-500' },
    funded: { label: 'Funded', color: 'bg-green-500', ring: 'ring-green-500' },
    scaling: { label: 'Scaling', color: 'bg-cyan-500', ring: 'ring-cyan-500' }
  };

  const currentPhaseConfig = phaseConfig[selectedPhase];

  return (
    <div className="space-y-6">
      <Card className="bg-[#0f1f3a] border-[#1a2f4a] p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Current Phase</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {Object.entries(phaseConfig).map(([phase, config]) => (
            <div
              key={phase}
              className={`
                p-4 rounded-lg border-2
                ${selectedPhase === phase 
                  ? `${config.color} border-current ring-2 ${config.ring}` 
                  : 'bg-[#1a2f4a] border-cyan-500/30'}
              `}
            >
              <div className="text-center">
                <p className={`font-bold ${selectedPhase === phase ? 'text-white' : 'text-slate-400'}`}>
                  {config.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <Card className="bg-gradient-to-br from-orange-600/20 to-yellow-600/20 border-orange-500/30 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-slate-400">Daily Drawdown Buffer</p>
              <p className="text-3xl font-bold text-white">${dailyDrawdownBuffer.toLocaleString()}</p>
            </div>
            <div className={`text-2xl font-bold ${dailyBufferPercentage > 50 ? 'text-green-400' : dailyBufferPercentage > 20 ? 'text-orange-400' : 'text-red-400'}`}>
              {dailyBufferPercentage.toFixed(0)}%
            </div>
          </div>
          <Progress 
            value={dailyBufferPercentage} 
            className={`h-3 ${dailyBufferPercentage > 50 ? 'bg-green-900/30' : dailyBufferPercentage > 20 ? 'bg-orange-900/30' : 'bg-red-900/30'}`}
          />
          <p className="text-sm text-slate-400 mt-2">Buffer remaining before daily limit</p>
        </Card>

        <Card className="bg-gradient-to-br from-red-600/20 to-pink-600/20 border-red-500/30 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-slate-400">Overall Drawdown Buffer</p>
              <p className="text-3xl font-bold text-white">${overallDrawdownBuffer.toLocaleString()}</p>
            </div>
            <div className={`text-2xl font-bold ${overallBufferPercentage > 50 ? 'text-green-400' : overallBufferPercentage > 20 ? 'text-orange-400' : 'text-red-400'}`}>
              {overallBufferPercentage.toFixed(0)}%
            </div>
          </div>
          <Progress 
            value={overallBufferPercentage} 
            className={`h-3 ${overallBufferPercentage > 50 ? 'bg-green-900/30' : overallBufferPercentage > 20 ? 'bg-orange-900/30' : 'bg-red-900/30'}`}
          />
          <p className="text-sm text-slate-400 mt-2">Buffer remaining before overall limit</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <Card className="bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border-cyan-500/30 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-slate-400">Pass Probability</p>
              <p className="text-4xl font-bold text-white">{passProbability.toFixed(0)}%</p>
            </div>
            <Trophy className={`w-12 h-12 ${passProbability >= 80 ? 'text-green-400' : passProbability >= 50 ? 'text-yellow-400' : 'text-orange-400'}`} />
          </div>
          <Progress 
            value={passProbability} 
            className={`h-3 ${passProbability >= 80 ? 'bg-green-900/30' : passProbability >= 50 ? 'bg-yellow-900/30' : 'bg-orange-900/30'}`}
          />
          <p className="text-sm text-slate-400 mt-2">Based on current performance metrics</p>
        </Card>

        <Card className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-green-500/30 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-slate-400">Profit Target Progress</p>
              <p className="text-3xl font-bold text-white">${(tracker.current_profit || 0).toLocaleString()}</p>
              <p className="text-sm text-green-400">${profitRemaining.toLocaleString()} remaining</p>
            </div>
            <div className="text-2xl font-bold text-green-400">
              {profitProgress.toFixed(0)}%
            </div>
          </div>
          <Progress value={profitProgress} className="h-3 bg-green-900/30" />
          <p className="text-sm text-slate-400 mt-2">Target: ${tracker.profit_target.toLocaleString()}</p>
        </Card>
      </div>

      <Card className="bg-[#0f1f3a] border-[#1a2f4a] p-6">
        <h3 className="text-lg font-bold text-white mb-4">Phase Status</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-[#1a2f4a]/50 rounded-lg">
            <span className="text-slate-400">Current Phase</span>
            <span className={`font-semibold ${currentPhaseConfig.color.replace('bg-', 'text-')}`}>
              {currentPhaseConfig.label}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-[#1a2f4a]/50 rounded-lg">
            <span className="text-slate-400">Challenge Type</span>
            <span className="text-cyan-400 font-semibold">
              {tracker.challenge_type === '1-step' ? '1 Step' : tracker.challenge_type === '2-step' ? '2 Step' : tracker.challenge_type === '3-step' ? '3 Step' : 'Instant'}
            </span>
          </div>
          {passProbability < 50 && (
            <div className="flex items-center gap-3 p-3 bg-orange-500/20 border border-orange-500/30 rounded-lg">
              <AlertCircle className="w-5 h-5 text-orange-400" />
              <span className="text-orange-400">Warning: Pass probability is low. Consider reducing risk!</span>
            </div>
          )}
          {profitProgress >= 100 && (
            <div className="flex items-center gap-3 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
              <Trophy className="w-5 h-5 text-green-400" />
              <span className="text-green-400">Congratulations! You've hit your profit target! 🎉</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

export default function PreviewPropFirm() {
  const propFirmAccounts = demoAccounts.filter(acc => acc.account_type === "proprietary_firm");
  const [selectedAccountId, setSelectedAccountId] = useState<string>(propFirmAccounts[0]?.id || "");
  const [challengeType, setChallengeType] = useState<string>("2-step");
  const [dailyMaxLoss, setDailyMaxLoss] = useState<string>("5000");
  const [overallMaxLoss, setOverallMaxLoss] = useState<string>("10000");
  const [profitTarget, setProfitTarget] = useState<string>("10000");

  const selectedAccount = propFirmAccounts.find(acc => acc.id === selectedAccountId);
  const tracker = demoPropFirmTrackers.find(t => t.account_id === selectedAccountId);

  // Calculate percentages
  const dailyLossPercentage = tracker ? (tracker.current_daily_loss / tracker.daily_max_loss) * 100 : 0;
  const overallLossPercentage = tracker ? (tracker.current_overall_loss / tracker.overall_max_loss) * 100 : 0;
  const profitPercentage = tracker ? (tracker.current_profit / tracker.profit_target) * 100 : 0;

  // Calculate remaining amounts
  const dailyLossRemaining = tracker ? tracker.daily_max_loss - tracker.current_daily_loss : 0;
  const overallLossRemaining = tracker ? tracker.overall_max_loss - tracker.current_overall_loss : 0;
  const profitRemaining = tracker ? tracker.profit_target - tracker.current_profit : 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Prop Firm Tracker</h1>
          <p className="text-slate-400">Monitor your prop firm challenge progress and metrics</p>
        </div>
        <div className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded-lg">
          <span className="text-cyan-400 font-semibold">📊 Preview Mode - Demo Data</span>
        </div>
      </div>

      {propFirmAccounts.length === 0 ? (
        <Card className="bg-[#0f1f3a] border-[#1a2f4a] p-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto">
              <Target className="w-8 h-8 text-cyan-400" />
            </div>
            <h3 className="text-xl font-semibold text-white">No Prop Firm Accounts</h3>
            <p className="text-slate-400 max-w-md mx-auto">
              You need to create an account marked as "Prop Firm" first. Go to the Accounts page to add a prop firm account.
            </p>
            <Button 
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
              data-testid="button-go-to-accounts"
            >
              Go to Accounts
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* Account Selector */}
          <Card className="bg-[#0f1f3a] border-[#1a2f4a] p-6">
            <div className="space-y-4">
              <div>
                <Label className="text-white mb-2 block">Select Prop Firm Account</Label>
                <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                  <SelectTrigger className="bg-[#1a2f4a] border-cyan-500/30 text-white" data-testid="select-account">
                    <SelectValue placeholder="Choose an account" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0f1f3a] border-cyan-500/30">
                    {propFirmAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id} className="text-white hover:bg-[#1a2f4a]">
                        {account.account_name} - ${account.current_balance?.toLocaleString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedAccount && (
                <div className="flex items-center gap-4 p-4 bg-[#1a2f4a]/50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm text-slate-400">Broker</p>
                    <p className="text-white font-semibold" data-testid="text-broker">{selectedAccount.broker_name}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-400">Starting Balance</p>
                    <p className="text-white font-semibold" data-testid="text-starting-balance">${selectedAccount.starting_balance.toLocaleString()}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-400">Current Balance</p>
                    <p className="text-cyan-400 font-semibold" data-testid="text-current-balance">${selectedAccount.current_balance?.toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Tabs for Overview and Funding Progress */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 bg-[#1a2f4a] border border-cyan-500/30">
              <TabsTrigger value="overview" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                <BarChart3 className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="funding-progress" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                <Trophy className="w-4 h-4 mr-2" />
                Funding Progress
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              {/* Challenge Settings */}
              <Card className="bg-[#0f1f3a] border-[#1a2f4a] p-6">
                <h2 className="text-xl font-bold text-white mb-4">Challenge Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-white mb-2 block">Challenge Type</Label>
                <Select value={challengeType} onValueChange={setChallengeType}>
                  <SelectTrigger className="bg-[#1a2f4a] border-cyan-500/30 text-white" data-testid="select-challenge-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0f1f3a] border-cyan-500/30">
                    <SelectItem value="instant" className="text-white hover:bg-[#1a2f4a]">Instant Funding</SelectItem>
                    <SelectItem value="1-step" className="text-white hover:bg-[#1a2f4a]">1 Step Challenge</SelectItem>
                    <SelectItem value="2-step" className="text-white hover:bg-[#1a2f4a]">2 Step Challenge</SelectItem>
                    <SelectItem value="3-step" className="text-white hover:bg-[#1a2f4a]">3 Step Challenge</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-white mb-2 block">Profit Target ($)</Label>
                <Input 
                  type="number" 
                  value={profitTarget}
                  onChange={(e) => setProfitTarget(e.target.value)}
                  className="bg-[#1a2f4a] border-cyan-500/30 text-white"
                  data-testid="input-profit-target"
                />
              </div>

              <div>
                <Label className="text-white mb-2 block">Daily Max Loss ($)</Label>
                <Input 
                  type="number" 
                  value={dailyMaxLoss}
                  onChange={(e) => setDailyMaxLoss(e.target.value)}
                  className="bg-[#1a2f4a] border-cyan-500/30 text-white"
                  data-testid="input-daily-max-loss"
                />
              </div>

              <div>
                <Label className="text-white mb-2 block">Overall Max Loss ($)</Label>
                <Input 
                  type="number" 
                  value={overallMaxLoss}
                  onChange={(e) => setOverallMaxLoss(e.target.value)}
                  className="bg-[#1a2f4a] border-cyan-500/30 text-white"
                  data-testid="input-overall-max-loss"
                />
              </div>
            </div>

            <Button 
              className="mt-6 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
              data-testid="button-save-settings"
            >
              Save Challenge Settings
            </Button>
          </Card>

          {/* Metrics Dashboard */}
          {tracker && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Profit Target Progress */}
                <Card className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-green-500/30 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-green-500/20 rounded-lg">
                        <TrendingUp className="w-6 h-6 text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Profit Target</p>
                        <p className="text-2xl font-bold text-white" data-testid="text-profit-target">${tracker.profit_target.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Current Profit</span>
                      <span className="text-green-400 font-semibold" data-testid="text-current-profit">${tracker.current_profit?.toLocaleString()}</span>
                    </div>
                    <Progress value={profitPercentage} className="h-2 bg-green-900/30" />
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">{profitPercentage.toFixed(1)}% achieved</span>
                      <span className="text-slate-400" data-testid="text-profit-remaining">${profitRemaining.toLocaleString()} to go</span>
                    </div>
                  </div>
                </Card>

                {/* Daily Max Loss */}
                <Card className="bg-gradient-to-br from-orange-600/20 to-red-600/20 border-orange-500/30 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-orange-500/20 rounded-lg">
                        <Calendar className="w-6 h-6 text-orange-400" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Daily Max Loss</p>
                        <p className="text-2xl font-bold text-white" data-testid="text-daily-max">${tracker.daily_max_loss.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Current Loss</span>
                      <span className="text-orange-400 font-semibold" data-testid="text-daily-loss">${tracker.current_daily_loss?.toLocaleString()}</span>
                    </div>
                    <Progress value={dailyLossPercentage} className="h-2 bg-orange-900/30" />
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">{dailyLossPercentage.toFixed(1)}% used</span>
                      <span className="text-slate-400" data-testid="text-daily-remaining">${dailyLossRemaining.toLocaleString()} remaining</span>
                    </div>
                  </div>
                </Card>

                {/* Overall Max Loss */}
                <Card className="bg-gradient-to-br from-red-600/20 to-pink-600/20 border-red-500/30 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-red-500/20 rounded-lg">
                        <TrendingDown className="w-6 h-6 text-red-400" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Overall Max Loss</p>
                        <p className="text-2xl font-bold text-white" data-testid="text-overall-max">${tracker.overall_max_loss.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Current Loss</span>
                      <span className="text-red-400 font-semibold" data-testid="text-overall-loss">${tracker.current_overall_loss?.toLocaleString()}</span>
                    </div>
                    <Progress value={overallLossPercentage} className="h-2 bg-red-900/30" />
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">{overallLossPercentage.toFixed(1)}% used</span>
                      <span className="text-slate-400" data-testid="text-overall-remaining">${overallLossRemaining.toLocaleString()} remaining</span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Status & Alerts */}
              <Card className="bg-[#0f1f3a] border-[#1a2f4a] p-6">
                <h2 className="text-xl font-bold text-white mb-4">Challenge Status</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-[#1a2f4a]/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-cyan-400" />
                      <span className="text-white">Challenge Type</span>
                    </div>
                    <span className="text-cyan-400 font-semibold" data-testid="text-challenge-type">
                      {challengeType === '1-step' ? '1 Step Challenge' : challengeType === '2-step' ? '2 Step Challenge' : challengeType === '3-step' ? '3 Step Challenge' : 'Instant Funding'}
                    </span>
                  </div>

                  {dailyLossPercentage > 80 && (
                    <div className="flex items-center gap-3 p-4 bg-orange-500/20 border border-orange-500/30 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-orange-400" />
                      <span className="text-orange-400">Warning: Daily loss limit nearly reached!</span>
                    </div>
                  )}

                  {overallLossPercentage > 80 && (
                    <div className="flex items-center gap-3 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-400" />
                      <span className="text-red-400">Critical: Overall loss limit nearly reached!</span>
                    </div>
                  )}

                  {profitPercentage >= 100 && (
                    <div className="flex items-center gap-3 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-green-400" />
                      <span className="text-green-400">Congratulations! Profit target achieved! 🎉</span>
                    </div>
                  )}
                </div>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="funding-progress" className="space-y-6 mt-6">
          {tracker ? (
            <PreviewFundingProgressTracker tracker={tracker} />
          ) : (
            <Card className="bg-[#0f1f3a] border-[#1a2f4a] p-8">
              <div className="text-center text-slate-400">
                Demo data not available for funding progress tracking.
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
        </>
      )}
    </div>
  );
}
