import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AccountSelector } from "@/components/AccountSelector";
import { Reports } from "@/components/Reports";
import { useSelectedAccount } from "@/hooks/use-selected-account";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Edit, Trash2, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { 
  getStrategies, 
  createStrategy, 
  updateStrategy, 
  deleteStrategy,
  getPlaybookRules,
  createPlaybookRule,
  updatePlaybookRule,
  deletePlaybookRule,
  getStrategyMetrics
} from "@/lib/supabase-service";
import { queryClient } from "@/lib/queryClient";
import type { Strategy, PlaybookRule, CreateStrategy, CreatePlaybookRule } from "@shared/schema";

// Form schemas
const strategyFormSchema = z.object({
  name: z.string().min(1, "Strategy name is required"),
  description: z.string().optional(),
  status: z.enum(['active', 'testing', 'inactive']).default('active'),
});

const playbookRuleFormSchema = z.object({
  category: z.enum(['risk_management', 'entry', 'exit', 'psychology']),
  rule_text: z.string().min(1, "Rule text is required"),
  rule_type: z.enum(['mandatory', 'recommended']).default('recommended'),
});

type StrategyFormValues = z.infer<typeof strategyFormSchema>;
type PlaybookRuleFormValues = z.infer<typeof playbookRuleFormSchema>;

export default function StrategyPage() {
  const [selectedAccount, setSelectedAccount] = useSelectedAccount();
  const { toast } = useToast();
  
  // Modals state
  const [strategyModalOpen, setStrategyModalOpen] = useState(false);
  const [playbookModalOpen, setPlaybookModalOpen] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);
  const [editingRule, setEditingRule] = useState<PlaybookRule | null>(null);
  
  // Fetch strategies
  const { data: strategies = [], isLoading: strategiesLoading } = useQuery({
    queryKey: ['/api/strategies'],
    queryFn: getStrategies,
  });
  
  // Fetch playbook rules
  const { data: playbookRules = [], isLoading: rulesLoading } = useQuery({
    queryKey: ['/api/playbook-rules'],
    queryFn: getPlaybookRules,
  });
  
  // Strategy mutations
  const createStrategyMutation = useMutation({
    mutationFn: (data: CreateStrategy) => createStrategy(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/strategies'] });
      toast({ title: "Strategy created successfully" });
      setStrategyModalOpen(false);
      strategyForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create strategy", description: error.message, variant: "destructive" });
    }
  });
  
  const updateStrategyMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Strategy> }) => updateStrategy(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/strategies'] });
      toast({ title: "Strategy updated successfully" });
      setStrategyModalOpen(false);
      setEditingStrategy(null);
      strategyForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update strategy", description: error.message, variant: "destructive" });
    }
  });
  
  const deleteStrategyMutation = useMutation({
    mutationFn: (id: string) => deleteStrategy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/strategies'] });
      toast({ title: "Strategy deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete strategy", description: error.message, variant: "destructive" });
    }
  });
  
  // Playbook rule mutations
  const createRuleMutation = useMutation({
    mutationFn: (data: CreatePlaybookRule) => createPlaybookRule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/playbook-rules'] });
      toast({ title: "Rule created successfully" });
      setPlaybookModalOpen(false);
      playbookForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create rule", description: error.message, variant: "destructive" });
    }
  });
  
  const updateRuleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PlaybookRule> }) => updatePlaybookRule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/playbook-rules'] });
      toast({ title: "Rule updated successfully" });
      setPlaybookModalOpen(false);
      setEditingRule(null);
      playbookForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update rule", description: error.message, variant: "destructive" });
    }
  });
  
  const deleteRuleMutation = useMutation({
    mutationFn: (id: string) => deletePlaybookRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/playbook-rules'] });
      toast({ title: "Rule deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete rule", description: error.message, variant: "destructive" });
    }
  });
  
  // Forms
  const strategyForm = useForm<StrategyFormValues>({
    resolver: zodResolver(strategyFormSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "active",
    },
  });
  
  const playbookForm = useForm<PlaybookRuleFormValues>({
    resolver: zodResolver(playbookRuleFormSchema),
    defaultValues: {
      category: "risk_management",
      rule_text: "",
      rule_type: "recommended",
    },
  });
  
  // Handlers
  const handleCreateStrategy = () => {
    setEditingStrategy(null);
    strategyForm.reset({ name: "", description: "", status: "active" });
    setStrategyModalOpen(true);
  };
  
  const handleEditStrategy = (strategy: Strategy) => {
    setEditingStrategy(strategy);
    strategyForm.reset({
      name: strategy.name,
      description: strategy.description || "",
      status: strategy.status,
    });
    setStrategyModalOpen(true);
  };
  
  const handleStrategySubmit = (values: StrategyFormValues) => {
    if (editingStrategy) {
      updateStrategyMutation.mutate({ id: editingStrategy.id, data: values });
    } else {
      createStrategyMutation.mutate(values);
    }
  };
  
  const handleCreateRule = () => {
    setEditingRule(null);
    playbookForm.reset({ category: "risk_management", rule_text: "", rule_type: "recommended" });
    setPlaybookModalOpen(true);
  };
  
  const handleEditRule = (rule: PlaybookRule) => {
    setEditingRule(rule);
    playbookForm.reset({
      category: rule.category,
      rule_text: rule.rule_text,
      rule_type: rule.rule_type,
    });
    setPlaybookModalOpen(true);
  };
  
  const handleRuleSubmit = (values: PlaybookRuleFormValues) => {
    if (editingRule) {
      updateRuleMutation.mutate({ id: editingRule.id, data: values });
    } else {
      createRuleMutation.mutate(values);
    }
  };
  
  // Group playbook rules by category
  const rulesByCategory = playbookRules.reduce((acc, rule) => {
    if (!acc[rule.category]) acc[rule.category] = [];
    acc[rule.category].push(rule);
    return acc;
  }, {} as Record<string, PlaybookRule[]>);
  
  const categoryLabels: Record<string, string> = {
    risk_management: "Risk Management",
    entry: "Entry Rules",
    exit: "Exit Rules",
    psychology: "Psychology Rules",
  };
  
  return (
    <div className="p-4 lg:p-8 min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Strategy & Playbook</h1>
        <p className="text-gray-300 mb-3">Document and track your trading strategies</p>
        <AccountSelector value={selectedAccount} onValueChange={setSelectedAccount} />
      </div>

      <Tabs defaultValue="strategies" className="space-y-4">
        <TabsList>
          <TabsTrigger value="strategies" data-testid="tab-strategies">Trading Strategies</TabsTrigger>
          <TabsTrigger value="playbook" data-testid="tab-playbook">Playbook Rules</TabsTrigger>
          <TabsTrigger value="reports" data-testid="tab-reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="strategies" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">My Strategies</h2>
            <Button 
              onClick={handleCreateStrategy}
              className="bg-cyan-500 hover:bg-cyan-600"
              data-testid="button-create-strategy"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Strategy
            </Button>
          </div>

          {strategiesLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
            </div>
          ) : strategies.length === 0 ? (
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="py-12 text-center">
                <Activity className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                <h3 className="text-lg font-semibold text-white mb-2">No strategies yet</h3>
                <p className="text-gray-400 mb-4">Create your first trading strategy to start tracking performance</p>
                <Button 
                  onClick={handleCreateStrategy}
                  className="bg-cyan-500 hover:bg-cyan-600"
                  data-testid="button-create-first-strategy"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Strategy
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2" data-testid="strategies-grid">
              {strategies.map((strategy) => (
                <StrategyCard 
                  key={strategy.id} 
                  strategy={strategy} 
                  accountId={selectedAccount}
                  onEdit={() => handleEditStrategy(strategy)}
                  onDelete={() => deleteStrategyMutation.mutate(strategy.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="playbook" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">Trading Rules</h2>
            <Button 
              onClick={handleCreateRule}
              className="bg-cyan-500 hover:bg-cyan-600"
              data-testid="button-create-rule"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Rule
            </Button>
          </div>

          {rulesLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
            </div>
          ) : playbookRules.length === 0 ? (
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="py-12 text-center">
                <Activity className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                <h3 className="text-lg font-semibold text-white mb-2">No rules yet</h3>
                <p className="text-gray-400 mb-4">Create playbook rules to guide your trading decisions</p>
                <Button 
                  onClick={handleCreateRule}
                  className="bg-cyan-500 hover:bg-cyan-600"
                  data-testid="button-create-first-rule"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Rule
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4" data-testid="playbook-rules-list">
              {Object.entries(categoryLabels).map(([category, label]) => {
                const rules = rulesByCategory[category] || [];
                if (rules.length === 0) return null;
                
                return (
                  <Card key={category} className="bg-slate-900/50 border-slate-800">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">{label}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {rules.map((rule) => (
                        <div 
                          key={rule.id} 
                          className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-cyan-500/50 transition-colors"
                          data-testid={`rule-${rule.id}`}
                        >
                          <span className="text-gray-200 flex-1">{rule.rule_text}</span>
                          <div className="flex items-center gap-2 ml-4">
                            <Badge 
                              variant="outline" 
                              className={rule.rule_type === 'mandatory' ? 'border-red-500 text-red-400' : 'border-yellow-500 text-yellow-400'}
                            >
                              {rule.rule_type === 'mandatory' ? 'Mandatory' : 'Recommended'}
                            </Badge>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditRule(rule)}
                              data-testid={`button-edit-rule-${rule.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => deleteRuleMutation.mutate(rule.id)}
                              data-testid={`button-delete-rule-${rule.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Reports accountId={selectedAccount} />
        </TabsContent>
      </Tabs>

      {/* Strategy Modal */}
      <Dialog open={strategyModalOpen} onOpenChange={setStrategyModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingStrategy ? 'Edit Strategy' : 'Create New Strategy'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {editingStrategy ? 'Update your trading strategy details' : 'Add a new trading strategy to track performance'}
            </DialogDescription>
          </DialogHeader>
          <Form {...strategyForm}>
            <form onSubmit={strategyForm.handleSubmit(handleStrategySubmit)} className="space-y-4">
              <FormField
                control={strategyForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Strategy Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Trend Following, Scalping, Breakout" 
                        className="bg-slate-800 border-slate-700 text-white"
                        data-testid="input-strategy-name"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={strategyForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe your strategy setup, entry/exit rules..." 
                        className="bg-slate-800 border-slate-700 text-white"
                        rows={4}
                        data-testid="input-strategy-description"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={strategyForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white" data-testid="select-strategy-status">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="testing">Testing</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setStrategyModalOpen(false)}
                  className="border-slate-700 text-white hover:bg-slate-800"
                  data-testid="button-cancel-strategy"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-cyan-500 hover:bg-cyan-600"
                  disabled={createStrategyMutation.isPending || updateStrategyMutation.isPending}
                  data-testid="button-save-strategy"
                >
                  {(createStrategyMutation.isPending || updateStrategyMutation.isPending) && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {editingStrategy ? 'Update' : 'Create'} Strategy
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Playbook Rule Modal */}
      <Dialog open={playbookModalOpen} onOpenChange={setPlaybookModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingRule ? 'Edit Rule' : 'Create New Rule'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {editingRule ? 'Update your playbook rule' : 'Add a new rule to your trading playbook'}
            </DialogDescription>
          </DialogHeader>
          <Form {...playbookForm}>
            <form onSubmit={playbookForm.handleSubmit(handleRuleSubmit)} className="space-y-4">
              <FormField
                control={playbookForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white" data-testid="select-rule-category">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="risk_management">Risk Management</SelectItem>
                        <SelectItem value="entry">Entry Rules</SelectItem>
                        <SelectItem value="exit">Exit Rules</SelectItem>
                        <SelectItem value="psychology">Psychology</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={playbookForm.control}
                name="rule_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Rule Text</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="e.g., Never risk more than 2% per trade" 
                        className="bg-slate-800 border-slate-700 text-white"
                        rows={3}
                        data-testid="input-rule-text"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={playbookForm.control}
                name="rule_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Rule Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white" data-testid="select-rule-type">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="mandatory">Mandatory</SelectItem>
                        <SelectItem value="recommended">Recommended</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setPlaybookModalOpen(false)}
                  className="border-slate-700 text-white hover:bg-slate-800"
                  data-testid="button-cancel-rule"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-cyan-500 hover:bg-cyan-600"
                  disabled={createRuleMutation.isPending || updateRuleMutation.isPending}
                  data-testid="button-save-rule"
                >
                  {(createRuleMutation.isPending || updateRuleMutation.isPending) && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {editingRule ? 'Update' : 'Create'} Rule
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Strategy Card Component with Real Metrics
function StrategyCard({ 
  strategy, 
  accountId,
  onEdit, 
  onDelete 
}: { 
  strategy: Strategy; 
  accountId: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['/api/strategy-metrics', strategy.name, accountId],
    queryFn: () => getStrategyMetrics(strategy.name, accountId),
  });
  
  const statusColors = {
    active: "bg-green-500/20 text-green-400 border-green-500",
    testing: "bg-yellow-500/20 text-yellow-400 border-yellow-500",
    inactive: "bg-gray-500/20 text-gray-400 border-gray-500",
  };
  
  const statusLabels = {
    active: "Active",
    testing: "Testing",
    inactive: "Inactive",
  };
  
  return (
    <Card 
      className="bg-slate-900/50 border-slate-800 hover:border-cyan-500/50 transition-all duration-300"
      data-testid={`strategy-card-${strategy.id}`}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">{strategy.name}</CardTitle>
          <Badge variant="outline" className={statusColors[strategy.status]}>
            {statusLabels[strategy.status]}
          </Badge>
        </div>
        {strategy.description && (
          <CardDescription className="text-gray-400">{strategy.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
          </div>
        ) : metrics && metrics.totalTrades > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total Trades</p>
                <p className="font-semibold text-white" data-testid={`total-trades-${strategy.id}`}>{metrics.totalTrades}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Win Rate</p>
                <p className={`font-semibold ${metrics.winRate >= 60 ? 'text-green-400' : metrics.winRate >= 50 ? 'text-yellow-400' : 'text-red-400'}`} data-testid={`win-rate-${strategy.id}`}>
                  {metrics.winRate.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Total P&L</p>
                <p className={`font-semibold flex items-center gap-1 ${metrics.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`} data-testid={`total-pnl-${strategy.id}`}>
                  {metrics.totalPnL >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  ${Math.abs(metrics.totalPnL).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Avg R</p>
                <p className={`font-semibold ${metrics.avgR >= 1 ? 'text-green-400' : 'text-yellow-400'}`} data-testid={`avg-r-${strategy.id}`}>
                  {metrics.avgR.toFixed(2)}R
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Expectancy</p>
                <p className={`font-semibold ${metrics.expectancy >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${metrics.expectancy.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Profit Factor</p>
                <p className={`font-semibold ${metrics.profitFactor >= 2 ? 'text-green-400' : metrics.profitFactor >= 1 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {metrics.profitFactor.toFixed(2)}
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-4 text-gray-500">
            <p className="text-sm">No trades yet</p>
            <p className="text-xs mt-1">Link trades to this strategy to see metrics</p>
          </div>
        )}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onEdit}
            className="border-slate-700 text-white hover:bg-slate-800"
            data-testid={`button-edit-strategy-${strategy.id}`}
          >
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onDelete}
            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
            data-testid={`button-delete-strategy-${strategy.id}`}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
