import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Upload, Scan } from "lucide-react";
import { AddTradeModal } from "@/components/AddTradeModal";
import { UploadTradesModal } from "@/components/UploadTradesModal";
import { OCRUploadModal } from "@/components/OCRUploadModal";
import { AccountSelector } from "@/components/AccountSelector";
import { formatCurrency } from "@/lib/utils";
import { getTrades, deleteTrade } from "@/lib/supabase-service";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useSelectedAccount } from "@/hooks/use-selected-account";

export default function Trades() {
  const [selectedAccount, setSelectedAccount] = useSelectedAccount();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isOCRModalOpen, setIsOCRModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();

  // Auto-open Add Trade modal when navigated from calendar
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('add') === 'true') {
      setIsFormOpen(true);
      // Clean up URL without the parameter
      window.history.replaceState({}, '', '/trades');
    }
  }, []);

  const { data: trades = [], isLoading } = useQuery({
    queryKey: ["trades", selectedAccount],
    queryFn: () => getTrades(selectedAccount),
    retry: false,
  }) as { data: any[], isLoading: boolean };

  const deleteMutation = useMutation({
    mutationFn: deleteTrade,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trades"] });
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
    <div className="p-4 lg:p-8 min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Trade Journal</h1>
          <p className="text-gray-300 mb-3">Manage and track all your trading positions</p>
          <AccountSelector value={selectedAccount} onValueChange={setSelectedAccount} />
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setIsOCRModalOpen(true)}
            variant="outline"
            className="border-green-500/50 text-white hover:bg-green-600/20"
            data-testid="button-upload-screenshot"
          >
            <Scan className="h-4 w-4 mr-2" />
            Upload Trade Screenshot (AI-Read)
          </Button>
          <Button 
            onClick={() => setIsUploadModalOpen(true)}
            variant="outline"
            className="border-purple-500/50 text-white hover:bg-purple-600/20"
            data-testid="button-upload-trades"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload CSV | HTML | EXCEL
          </Button>
          <Button 
            onClick={() => setIsFormOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0"
            data-testid="button-add-trade"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Trade
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {trades.length > 0 ? (
          trades.map((trade: any) => (
            <Card key={trade.id} className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 border-purple-500/30">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge variant={trade.trade_type === 'BUY' ? 'default' : 'secondary'} className={
                        trade.trade_type === 'BUY' 
                          ? 'bg-green-600 text-white hover:bg-green-700' 
                          : 'bg-red-600 text-white hover:bg-red-700'
                      }>
                        {trade.trade_type}
                      </Badge>
                      <h3 className="text-lg font-semibold text-white">{trade.instrument}</h3>
                      <Badge variant={trade.status === 'OPEN' ? 'default' : 
                                   trade.status === 'CLOSED' ? 'secondary' : 'destructive'} 
                             className="bg-purple-600 text-white">
                        {trade.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Position Size</p>
                        <p className="font-medium text-white">{trade.position_size}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Entry Price</p>
                        <p className="font-medium text-white">{trade.entry_price}</p>
                      </div>
                      {trade.exit_price && (
                        <div>
                          <p className="text-gray-400">Exit Price</p>
                          <p className="font-medium text-white">{trade.exit_price}</p>
                        </div>
                      )}
                      {trade.pnl !== null && (
                        <div>
                          <p className="text-gray-400">P&L</p>
                          <p className={`font-medium ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {formatCurrency(trade.pnl)}
                          </p>
                        </div>
                      )}
                    </div>

                    {trade.notes && (
                      <div className="mt-4">
                        <p className="text-gray-400 text-sm mb-1">Notes</p>
                        <p className="text-sm text-gray-300">{trade.notes}</p>
                      </div>
                    )}

                    {trade.entry_date && (
                      <p className="text-xs text-gray-500 mt-4">
                        Entry Date: {new Date(trade.entry_date).toLocaleDateString()}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Created: {new Date(trade.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(trade)}
                      className="border-purple-500/30 text-purple-300 hover:bg-purple-800/50"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(trade.id)}
                      disabled={deleteMutation.isPending}
                      className="border-red-500/30 text-red-300 hover:bg-red-800/50"
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

      <AddTradeModal
        isOpen={isFormOpen}
        onClose={handleFormClose}
        trade={editingTrade}
      />

      <OCRUploadModal
        isOpen={isOCRModalOpen}
        onClose={() => setIsOCRModalOpen(false)}
      />

      <UploadTradesModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </div>
  );
}