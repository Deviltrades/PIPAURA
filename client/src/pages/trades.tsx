import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2 } from "lucide-react";
import TradeForm from "@/components/TradeForm";
import { formatCurrency } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Trades() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: trades = [], isLoading } = useQuery({
    queryKey: ["/api/trades"],
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/trades/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      toast({
        title: "Trade deleted successfully",
      });
    },
  });

  const handleEdit = (trade: any) => {
    setEditingTrade(trade);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this trade?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingTrade(null);
  };

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
                <div className="h-24 bg-muted animate-pulse rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Trade Journal</h1>
          <p className="text-muted-foreground">Manage and track all your trading positions</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Trade
        </Button>
      </div>

      <div className="space-y-4">
        {trades.length > 0 ? (
          trades.map((trade: any) => (
            <Card key={trade.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge variant={trade.tradeType === 'BUY' ? 'default' : 'secondary'}>
                        {trade.tradeType}
                      </Badge>
                      <h3 className="text-lg font-semibold">{trade.instrument}</h3>
                      <Badge variant={trade.status === 'OPEN' ? 'default' : 
                                   trade.status === 'CLOSED' ? 'secondary' : 'destructive'}>
                        {trade.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Position Size</p>
                        <p className="font-medium">{trade.positionSize}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Entry Price</p>
                        <p className="font-medium">{trade.entryPrice}</p>
                      </div>
                      {trade.exitPrice && (
                        <div>
                          <p className="text-muted-foreground">Exit Price</p>
                          <p className="font-medium">{trade.exitPrice}</p>
                        </div>
                      )}
                      {trade.pnl !== null && (
                        <div>
                          <p className="text-muted-foreground">P&L</p>
                          <p className={`font-medium ${trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(trade.pnl)}
                          </p>
                        </div>
                      )}
                    </div>

                    {trade.notes && (
                      <div className="mt-4">
                        <p className="text-muted-foreground text-sm mb-1">Notes</p>
                        <p className="text-sm">{trade.notes}</p>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground mt-4">
                      {new Date(trade.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(trade)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(trade.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <h3 className="text-lg font-medium mb-2">No trades yet</h3>
              <p className="text-muted-foreground mb-4">
                Start building your trading journal by adding your first trade
              </p>
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Trade
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <TradeForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        trade={editingTrade}
      />
    </div>
  );
}