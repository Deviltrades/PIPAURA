import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

const signalFormSchema = z.object({
  instrument: z.string().min(1, "Instrument is required"),
  tradeType: z.enum(["BUY", "SELL"]),
  entryPrice: z.string().min(1, "Entry price is required"),
  stopLoss: z.string().optional(),
  takeProfit: z.string().optional(),
  riskReward: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  exitPrice: z.string().optional(),
  status: z.string().optional(),
  result: z.string().optional(),
  resultPips: z.string().optional(),
});

type SignalFormData = z.infer<typeof signalFormSchema>;

interface SignalFormProps {
  signal?: any;
  onSuccess: () => void;
}

const forexPairs = ["EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD", "USD/CAD", "NZD/USD", "EUR/GBP", "EUR/JPY"];
const indices = ["S&P 500", "NASDAQ", "FTSE 100", "DAX", "Nikkei 225", "CAC 40"];
const cryptos = ["BTC/USD", "ETH/USD", "ADA/USD", "XRP/USD", "SOL/USD", "DOT/USD"];

export default function SignalForm({ signal, onSuccess }: SignalFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<SignalFormData>({
    resolver: zodResolver(signalFormSchema),
    defaultValues: {
      instrument: signal?.instrument || "",
      tradeType: signal?.tradeType || "BUY",
      entryPrice: signal?.entryPrice?.toString() || "",
      stopLoss: signal?.stopLoss?.toString() || "",
      takeProfit: signal?.takeProfit?.toString() || "",
      riskReward: signal?.riskReward || "",
      description: signal?.description || "",
      exitPrice: signal?.exitPrice?.toString() || "",
      status: signal?.status || "ACTIVE",
      result: signal?.result || "",
      resultPips: signal?.resultPips?.toString() || "",
    },
  });

  const createSignalMutation = useMutation({
    mutationFn: async (data: SignalFormData) => {
      const payload = {
        ...data,
        entryPrice: parseFloat(data.entryPrice),
        stopLoss: data.stopLoss ? parseFloat(data.stopLoss) : null,
        takeProfit: data.takeProfit ? parseFloat(data.takeProfit) : null,
        exitPrice: data.exitPrice ? parseFloat(data.exitPrice) : null,
        resultPips: data.resultPips ? parseFloat(data.resultPips) : null,
      };

      if (signal?.id) {
        return await apiRequest("PUT", `/api/signals/${signal.id}`, payload);
      } else {
        return await apiRequest("POST", "/api/signals", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/signals"] });
      toast({
        title: "Success",
        description: signal?.id ? "Signal updated successfully" : "Signal posted successfully",
      });
      onSuccess();
      if (!signal?.id) {
        form.reset();
      }
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: signal?.id ? "Failed to update signal" : "Failed to post signal",
        variant: "destructive",
      });
    },
  });

  const allInstruments = [...forexPairs, ...indices, ...cryptos];
  const isEditing = !!signal?.id;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => createSignalMutation.mutate(data))} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="instrument"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Instrument</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select instrument" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <optgroup label="Forex">
                      {forexPairs.map((pair) => (
                        <SelectItem key={pair} value={pair}>
                          {pair}
                        </SelectItem>
                      ))}
                    </optgroup>
                    <optgroup label="Indices">
                      {indices.map((index) => (
                        <SelectItem key={index} value={index}>
                          {index}
                        </SelectItem>
                      ))}
                    </optgroup>
                    <optgroup label="Crypto">
                      {cryptos.map((crypto) => (
                        <SelectItem key={crypto} value={crypto}>
                          {crypto}
                        </SelectItem>
                      ))}
                    </optgroup>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tradeType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Trade Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="BUY">BUY</SelectItem>
                    <SelectItem value="SELL">SELL</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="entryPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Entry Price</FormLabel>
                <FormControl>
                  <Input type="number" step="0.00001" placeholder="1.08450" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="stopLoss"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stop Loss</FormLabel>
                <FormControl>
                  <Input type="number" step="0.00001" placeholder="1.08200" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="takeProfit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Take Profit</FormLabel>
                <FormControl>
                  <Input type="number" step="0.00001" placeholder="1.08700" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="riskReward"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Risk/Reward</FormLabel>
                <FormControl>
                  <Input placeholder="1:2" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {isEditing && (
            <>
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                        <SelectItem value="CLOSED">CLOSED</SelectItem>
                        <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("status") === "CLOSED" && (
                <>
                  <FormField
                    control={form.control}
                    name="exitPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Exit Price</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.00001" placeholder="1.08670" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="resultPips"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Result (Pips)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="45.0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="result"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Result Description</FormLabel>
                        <FormControl>
                          <Input placeholder="Target reached successfully" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </>
          )}
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description & Analysis</FormLabel>
              <FormControl>
                <Textarea
                  rows={4}
                  placeholder="Provide detailed analysis and reasoning for this signal..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onSuccess}
            disabled={createSignalMutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createSignalMutation.isPending}>
            {createSignalMutation.isPending
              ? "Saving..."
              : isEditing
              ? "Update Signal"
              : "Post Signal"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
