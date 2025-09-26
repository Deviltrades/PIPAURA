import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Plus, Upload, Tag, TrendingUp, TrendingDown, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { getTags, createTag, createJournalEntry } from "@/lib/supabase-service";
import { createJournalEntrySchema, type CreateJournalEntry } from "@shared/schema";

type JournalFormData = CreateJournalEntry;

export default function Journal() {
  const { toast } = useToast();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  const form = useForm<JournalFormData>({
    resolver: zodResolver(createJournalEntrySchema),
    defaultValues: {
      notes: "",
      trade_date: new Date().toISOString().split('T')[0],
      pair_symbol: "",
      status: "OPEN",
      tags: [],
      trade_type: undefined,
    },
  });

  const { data: existingTags = [] } = useQuery({
    queryKey: ["tags"],
    queryFn: getTags,
    retry: false,
  });

  const createEntryMutation = useMutation({
    mutationFn: async (data: JournalFormData) => {
      return await createJournalEntry({
        ...data,
        tags: selectedTags,
        status: data.status || 'OPEN',
      });
    },
    onSuccess: () => {
      toast({
        title: "Journal Entry Created",
        description: "Your trade has been logged successfully.",
      });
      form.reset();
      setSelectedTags([]);
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Create Entry",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createTagMutation = useMutation({
    mutationFn: async (tagData: { name: string; category?: string }) => {
      return await createTag(tagData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      setNewTag("");
    },
  });

  const onSubmit = (data: JournalFormData) => {
    createEntryMutation.mutate(data);
  };

  const addTag = (tagName: string) => {
    if (tagName && !selectedTags.includes(tagName)) {
      setSelectedTags([...selectedTags, tagName]);
    }
  };

  const removeTag = (tagName: string) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagName));
  };

  const handleCreateTag = () => {
    if (newTag && !existingTags.some((tag: any) => tag.name === newTag)) {
      createTagMutation.mutate({ name: newTag, category: 'custom' });
      addTag(newTag);
    }
  };

  const calculatePnL = () => {
    const entry = form.getValues("entry_price");
    const exit = form.getValues("exit_price");
    const lots = form.getValues("lot_size");
    const type = form.getValues("trade_type");
    
    if (entry && exit && lots && type) {
      const pips = type === "BUY" ? (exit - entry) : (entry - exit);
      const pipValue = 10; // Simplified pip value calculation
      const pnl = pips * lots * pipValue;
      form.setValue("profit_loss", Number(pnl.toFixed(2)));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Trading Journal</h1>
        <p className="text-muted-foreground">Record and analyze your trading activity</p>
      </div>

      <Tabs defaultValue="create" className="space-y-4">
        <TabsList>
          <TabsTrigger value="create">New Entry</TabsTrigger>
          <TabsTrigger value="entries">Recent Entries</TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create Journal Entry
              </CardTitle>
              <CardDescription>
                Log your trade details for analysis and tracking
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Trade Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="trade_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Trade Date</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              data-testid="input-trade-date"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="pair_symbol"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pair/Symbol</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="EURUSD, GBPJPY, XAUUSD..." 
                              data-testid="input-pair-symbol"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="trade_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Trade Type</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger data-testid="select-trade-type">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="BUY">
                                <div className="flex items-center gap-2">
                                  <TrendingUp className="h-4 w-4 text-green-500" />
                                  BUY
                                </div>
                              </SelectItem>
                              <SelectItem value="SELL">
                                <div className="flex items-center gap-2">
                                  <TrendingDown className="h-4 w-4 text-red-500" />
                                  SELL
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Trade Execution */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="lot_size"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lot Size</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="0.01"
                              placeholder="0.10"
                              data-testid="input-lot-size"
                              {...field}
                              onChange={(e) => {
                                field.onChange(parseFloat(e.target.value) || undefined);
                                calculatePnL();
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="entry_price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Entry Price</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="0.00001"
                              placeholder="1.08500"
                              data-testid="input-entry-price"
                              {...field}
                              onChange={(e) => {
                                field.onChange(parseFloat(e.target.value) || undefined);
                                calculatePnL();
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="stop_loss"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stop Loss</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="0.00001"
                              placeholder="1.08000"
                              data-testid="input-stop-loss"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="take_profit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Take Profit</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="0.00001"
                              placeholder="1.09000"
                              data-testid="input-take-profit"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Trade Close (if closed) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger data-testid="select-status">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="OPEN">Open</SelectItem>
                              <SelectItem value="CLOSED">Closed</SelectItem>
                              <SelectItem value="CANCELLED">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="exit_price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Exit Price</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="0.00001"
                              placeholder="1.08750"
                              data-testid="input-exit-price"
                              disabled={form.watch("status") === "OPEN"}
                              {...field}
                              onChange={(e) => {
                                field.onChange(parseFloat(e.target.value) || undefined);
                                calculatePnL();
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="profit_loss"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>P&L ($)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="0.01"
                              placeholder="25.00"
                              data-testid="input-profit-loss"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Additional Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="timeframe"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Timeframe</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger data-testid="select-timeframe">
                                <SelectValue placeholder="Select timeframe" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="M1">1 Minute</SelectItem>
                              <SelectItem value="M5">5 Minutes</SelectItem>
                              <SelectItem value="M15">15 Minutes</SelectItem>
                              <SelectItem value="M30">30 Minutes</SelectItem>
                              <SelectItem value="H1">1 Hour</SelectItem>
                              <SelectItem value="H4">4 Hours</SelectItem>
                              <SelectItem value="D1">Daily</SelectItem>
                              <SelectItem value="W1">Weekly</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="session"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Session</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger data-testid="select-session">
                                <SelectValue placeholder="Select session" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="TOKYO">Tokyo</SelectItem>
                              <SelectItem value="LONDON">London</SelectItem>
                              <SelectItem value="NYC">New York</SelectItem>
                              <SelectItem value="SYDNEY">Sydney</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="strategy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Strategy</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Breakout, Scalp, Swing..."
                              data-testid="input-strategy"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Tags */}
                  <div className="space-y-3">
                    <FormLabel>Tags</FormLabel>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {selectedTags.map((tag) => (
                        <Badge 
                          key={tag} 
                          variant="secondary" 
                          className="flex items-center gap-1"
                        >
                          {tag}
                          <X 
                            className="h-3 w-3 cursor-pointer hover:text-destructive" 
                            onClick={() => removeTag(tag)}
                          />
                        </Badge>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {existingTags.map((tag: any) => (
                        <Badge 
                          key={tag.id}
                          variant="outline" 
                          className="cursor-pointer hover:bg-secondary"
                          onClick={() => addTag(tag.name)}
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Create new tag..."
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleCreateTag()}
                        data-testid="input-new-tag"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleCreateTag}
                        disabled={!newTag}
                      >
                        Add Tag
                      </Button>
                    </div>
                  </div>

                  {/* Notes */}
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your trade setup, reasons for entry/exit, lessons learned..."
                            className="min-h-[120px]"
                            data-testid="textarea-notes"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Submit */}
                  <div className="flex gap-3">
                    <Button 
                      type="submit" 
                      disabled={createEntryMutation.isPending}
                      data-testid="button-create-entry"
                    >
                      {createEntryMutation.isPending ? "Creating..." : "Create Entry"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => {
                        form.reset();
                        setSelectedTags([]);
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entries">
          <Card>
            <CardHeader>
              <CardTitle>Recent Entries</CardTitle>
              <CardDescription>Your latest journal entries</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Recent entries will appear here once created.</p>
                <p className="text-sm">Use the "New Entry" tab to log your first trade.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}