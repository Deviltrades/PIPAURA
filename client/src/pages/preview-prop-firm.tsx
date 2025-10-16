import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, TrendingUp, TrendingDown, Target, DollarSign, Calendar } from "lucide-react";
import { demoAccounts, demoPropFirmTrackers } from "@/lib/demo-data";

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
        </>
      )}
    </div>
  );
}
