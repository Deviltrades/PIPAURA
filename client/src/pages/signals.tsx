import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, TrendingUp, TrendingDown, Clock } from "lucide-react";
import SignalForm from "@/components/SignalForm";
import { useAuth } from "@/hooks/useAuth";
import type { Signal } from "@shared/schema";

export default function Signals() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { user } = useAuth();
  
  const { data: signals = [], isLoading } = useQuery<Signal[]>({
    queryKey: ["/api/signals"],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="h-8 bg-muted animate-pulse rounded w-48 mb-2"></div>
            <div className="h-4 bg-muted animate-pulse rounded w-64"></div>
          </div>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-32 bg-muted animate-pulse rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const isAdmin = (user as any)?.isAdmin || false;

  return (
    <div className="p-4 lg:p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Signal Channel</h1>
          <p className="text-muted-foreground">Professional trading signals and analysis</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Signal
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {signals.length > 0 ? (
          signals.map((signal: Signal) => (
            <Card key={signal.id} className="border-l-4 border-l-primary">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {signal.tradeType === 'BUY' ? (
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-600" />
                      )}
                      <Badge variant={signal.tradeType === 'BUY' ? 'default' : 'secondary'}>
                        {signal.tradeType}
                      </Badge>
                    </div>
                    <h3 className="text-xl font-semibold">{signal.instrument}</h3>
                    <Badge variant="outline">
                      {signal.instrumentType}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {signal.createdAt ? new Date(signal.createdAt).toLocaleString() : 'N/A'}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Entry Price</p>
                    <p className="text-lg font-semibold">{signal.entryPrice}</p>
                  </div>
                  
                  {signal.stopLoss && (
                    <div>
                      <p className="text-sm text-muted-foreground">Stop Loss</p>
                      <p className="text-lg font-semibold text-red-600">{signal.stopLoss}</p>
                    </div>
                  )}
                  
                  {signal.takeProfit && (
                    <div>
                      <p className="text-sm text-muted-foreground">Take Profit</p>
                      <p className="text-lg font-semibold text-green-600">{signal.takeProfit}</p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={
                      signal.status === 'ACTIVE' ? 'default' : 
                      signal.status === 'CLOSED' ? 'secondary' : 'destructive'
                    }>
                      {signal.status}
                    </Badge>
                  </div>
                </div>

                {signal.description && (
                  <div className="border-t pt-4">
                    <p className="text-sm text-muted-foreground mb-2">Technical Analysis</p>
                    <p className="text-sm leading-relaxed">{signal.description}</p>
                  </div>
                )}

                {signal.riskReward && (
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">Risk/Reward Ratio:</span>
                    <Badge variant="outline">{signal.riskReward}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <h3 className="text-lg font-medium mb-2">No signals available</h3>
              <p className="text-muted-foreground mb-4">
                {isAdmin 
                  ? "Start sharing trading signals with your community" 
                  : "Check back later for new trading signals from our analysts"
                }
              </p>
              {isAdmin && (
                <Button onClick={() => setIsFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Signal
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {isAdmin && (
        <SignalForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
        />
      )}
    </div>
  );
}