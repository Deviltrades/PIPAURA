import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { format } from "date-fns";
import { X, Upload, Image as ImageIcon, Trash2, Check, ChevronsUpDown, Calendar as CalendarIcon } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { SignedImageDisplay } from "@/components/SignedImageDisplay";
import { PlanGate, FeatureGate } from "@/components/PlanGate";
import { useToast } from "@/hooks/use-toast";
import { createTrade, updateTrade, uploadFile, getTradeAccounts, updatePropFirmMetrics, getPropFirmTrackerByAccount } from "@/lib/supabase-service";
import { useQuery } from "@tanstack/react-query";
import { getInstrumentsByType } from "@shared/instruments";
import { cn } from "@/lib/utils";

const addTradeSchema = z.object({
  account_id: z.string().optional(),
  instrumentType: z.enum(["FOREX", "INDICES", "CRYPTO", "FUTURES", "STOCKS"]),
  instrument: z.string().min(1, "Instrument is required"),
  tradeType: z.enum(["BUY", "SELL"]),
  positionSize: z.string().optional(),
  entryPrice: z.string().optional(),
  entryTime: z.string().optional(),
  exitTime: z.string().optional(),
  stopLoss: z.string().optional(),
  takeProfit: z.string().optional(),
  notes: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  hasPnL: z.boolean().optional(),
  pnlType: z.enum(["profit", "loss"]).optional(),
  pnlAmount: z.string().optional(),
  entryMode: z.enum(["easy", "advanced"]).default("advanced"),
}).superRefine((data, ctx) => {
  // Easy mode validation
  if (data.entryMode === "easy") {
    if (!data.hasPnL || !data.pnlAmount || !data.pnlType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "P&L amount and type are required in Easy mode",
        path: ["pnlAmount"],
      });
    }
  }
  
  // Advanced mode validation
  if (data.entryMode === "advanced") {
    if (!data.account_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Trading account is required",
        path: ["account_id"],
      });
    }
    if (!data.positionSize) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Position size is required",
        path: ["positionSize"],
      });
    }
    if (!data.entryPrice) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Entry price is required",
        path: ["entryPrice"],
      });
    }
    if (!data.stopLoss) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Stop loss is required",
        path: ["stopLoss"],
      });
    }
    if (!data.takeProfit) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Take profit is required",
        path: ["takeProfit"],
      });
    }
  }
});

type AddTradeFormData = z.infer<typeof addTradeSchema>;

interface AddTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date;
  trade?: any;
}

export function AddTradeModal({ isOpen, onClose, selectedDate, trade }: AddTradeModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for trade date (editable by user)
  const [tradeDate, setTradeDate] = useState<Date>(
    trade?.entry_date ? new Date(trade.entry_date) : selectedDate || new Date()
  );
    
  const [entryMode, setEntryMode] = useState<"easy" | "advanced">("advanced");
  const [selectedInstrumentType, setSelectedInstrumentType] = useState<string>("FOREX");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [instrumentSearchOpen, setInstrumentSearchOpen] = useState(false);
  const [instrumentSearchValue, setInstrumentSearchValue] = useState("");

  // Fetch user's trading accounts
  const { data: accounts } = useQuery({
    queryKey: ['/api/trade-accounts'],
    queryFn: getTradeAccounts,
  });

  const form = useForm<AddTradeFormData>({
    resolver: zodResolver(addTradeSchema),
    defaultValues: {
      account_id: "",
      instrumentType: "FOREX",
      instrument: "",
      tradeType: "BUY",
      positionSize: "1.0",
      entryPrice: "",
      entryTime: "",
      exitTime: "",
      stopLoss: "",
      takeProfit: "",
      notes: "",
      attachments: [],
      hasPnL: false,
      pnlType: "profit",
      pnlAmount: "",
      entryMode: "advanced",
    },
  });

  // Reset form and state when modal opens or trade changes
  useEffect(() => {
    if (isOpen) {
      // Set trade date based on props
      const newDate = trade?.entry_date ? new Date(trade.entry_date) : selectedDate || new Date();
      setTradeDate(newDate);
      
      if (trade) {
        // Editing existing trade - always use advanced mode
        setEntryMode("advanced");
        form.reset({
          account_id: trade.account_id || "",
          instrumentType: trade.instrument_type || "FOREX",
          instrument: trade.instrument || "",
          tradeType: trade.trade_type || "BUY",
          positionSize: trade.position_size?.toString() || "1.0",
          entryPrice: trade.entry_price?.toString() || "",
          entryTime: trade.entry_date ? new Date(trade.entry_date).toTimeString().slice(0, 5) : "",
          exitTime: trade.exit_date ? new Date(trade.exit_date).toTimeString().slice(0, 5) : "",
          stopLoss: trade.stop_loss?.toString() || "",
          takeProfit: trade.take_profit?.toString() || "",
          notes: trade.notes || "",
          attachments: trade.attachments || [],
          hasPnL: trade.pnl !== undefined && trade.pnl !== 0,
          pnlType: trade.pnl && trade.pnl < 0 ? "loss" : "profit",
          pnlAmount: trade.pnl ? Math.abs(trade.pnl).toString() : "",
          entryMode: "advanced", // Always advanced when editing
        });
        setSelectedInstrumentType(trade.instrument_type || "FOREX");
        setUploadedImages(trade.attachments || []);
      } else {
        // Adding new trade
        form.reset({
          account_id: "",
          instrumentType: "FOREX",
          instrument: "",
          tradeType: "BUY",
          positionSize: "1.0",
          entryPrice: "",
          entryTime: "",
          exitTime: "",
          stopLoss: "",
          takeProfit: "",
          notes: "",
          attachments: [],
          hasPnL: entryMode === "easy", // Auto-enable P&L in easy mode
          pnlType: "profit",
          pnlAmount: "",
          entryMode: entryMode, // Use current mode for new trades
        });
        setSelectedInstrumentType("FOREX");
        setUploadedImages([]);
      }
    }
  }, [isOpen, trade, form, entryMode]);

  // Auto-enable P&L in easy mode and sync entryMode to form (only for new trades)
  useEffect(() => {
    if (!trade) {
      form.setValue("entryMode", entryMode, { shouldValidate: true });
      if (entryMode === "easy") {
        form.setValue("hasPnL", true);
      }
    }
  }, [entryMode, form, trade]);

  const addTradeMutation = useMutation({
    mutationFn: async (data: AddTradeFormData) => {
      // Format date as YYYY-MM-DD to avoid timezone issues
      const localDateString = tradeDate.getFullYear() + '-' + 
        String(tradeDate.getMonth() + 1).padStart(2, '0') + '-' + 
        String(tradeDate.getDate()).padStart(2, '0');
      
      // Combine date and time for entry_date
      let entryDateTime = localDateString;
      if (data.entryTime) {
        entryDateTime = `${localDateString} ${data.entryTime}:00`;
      }
      
      // Combine date and time for exit_date (if exit time is provided)
      let exitDateTime = undefined;
      if (data.exitTime) {
        exitDateTime = `${localDateString} ${data.exitTime}:00`;
      }
      
      // Calculate P&L based on user input
      let calculatedPnL = 0;
      if (data.hasPnL && data.pnlAmount) {
        const amount = parseFloat(data.pnlAmount);
        calculatedPnL = data.pnlType === "loss" ? -amount : amount;
      }

      // Handle easy mode defaults
      const isEasyMode = data.entryMode === "easy";
      const activeAccounts = accounts?.filter(acc => acc.is_active) || [];
      const firstAccount = activeAccounts.length > 0 ? activeAccounts[0].id : "";
      
      // Block easy mode submission if no accounts exist
      if (isEasyMode && !firstAccount) {
        throw new Error("Please create a trading account before using Easy mode");
      }

      const tradeData = {
        account_id: isEasyMode ? firstAccount : data.account_id!,
        instrument: data.instrument,
        instrument_type: data.instrumentType as 'FOREX' | 'INDICES' | 'CRYPTO' | 'FUTURES' | 'STOCKS',
        trade_type: data.tradeType as 'BUY' | 'SELL',
        position_size: isEasyMode ? 1.0 : parseFloat(data.positionSize!),
        entry_price: isEasyMode ? 0 : parseFloat(data.entryPrice!),
        stop_loss: isEasyMode ? 0 : parseFloat(data.stopLoss!),
        take_profit: isEasyMode ? 0 : parseFloat(data.takeProfit!),
        pnl: calculatedPnL,
        status: "CLOSED" as const,
        notes: data.notes || '',
        attachments: uploadedImages,
        entry_date: entryDateTime,
        exit_date: exitDateTime,
      };
      
      if (trade?.id) {
        return await updateTrade(trade.id, tradeData);
      } else {
        return await createTrade(tradeData);
      }
    },
    onSuccess: async (_, variables) => {
      toast({
        title: "Success",
        description: trade?.id ? "Trade updated successfully" : "Trade added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ['/api/trade-accounts'] });
      
      // Update prop firm metrics if this is a prop firm account
      if (variables.account_id) {
        try {
          const tracker = await getPropFirmTrackerByAccount(variables.account_id);
          if (tracker) {
            await updatePropFirmMetrics(variables.account_id);
            queryClient.invalidateQueries({ queryKey: ['prop-firm-trackers'] });
          }
        } catch (error) {
          console.error('Failed to update prop firm metrics:', error);
        }
      }
      
      form.reset();
      setUploadedImages([]); // Clear uploaded images
      onClose();
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : "Failed to add trade. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      console.error("Error adding trade:", error);
    },
  });

  // Get instruments for the selected type using the shared function
  const currentInstruments = getInstrumentsByType(selectedInstrumentType);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    console.log("AddTradeModal: Starting image upload, current form values:", form.getValues());
    setIsUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Invalid file type",
            description: "Please upload only image files (JPG, PNG, GIF, etc.)",
            variant: "destructive",
          });
          continue;
        }

        // Upload file directly to Supabase storage
        const fileUrl = await uploadFile(file);
        uploadedUrls.push(fileUrl);
      }

      setUploadedImages(prev => [...prev, ...uploadedUrls]);
      console.log("AddTradeModal: After image upload, form values:", form.getValues());
      toast({
        title: "✅ Images uploaded successfully!",
        description: `Successfully uploaded ${uploadedUrls.length} image(s). You can now save your trade.`,
        duration: 5000,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const removeImage = (indexToRemove: number) => {
    setUploadedImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const onSubmit = (data: AddTradeFormData) => {
    console.log("Form data:", data);
    console.log("Form errors:", form.formState.errors);
    
    // Add entryMode to data
    const submitData = {
      ...data,
      entryMode,
    };
    
    addTradeMutation.mutate(submitData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] bg-background border overflow-y-auto">
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">{trade?.id ? 'Edit Trade' : 'Add New Trade'}</DialogTitle>
            {!trade?.id && (
              <div className="flex items-center gap-2 bg-muted px-3 py-1 rounded-full">
                <button
                  type="button"
                  onClick={() => setEntryMode("easy")}
                  className={cn(
                    "px-3 py-1 text-sm font-medium rounded-full transition-colors",
                    entryMode === "easy" 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  data-testid="button-easy-mode"
                >
                  Easy
                </button>
                <button
                  type="button"
                  onClick={() => setEntryMode("advanced")}
                  className={cn(
                    "px-3 py-1 text-sm font-medium rounded-full transition-colors",
                    entryMode === "advanced" 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  data-testid="button-advanced-mode"
                >
                  Advanced
                </button>
              </div>
            )}
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            Record a new trade for {tradeDate.toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Trading Account Selection - Advanced mode only */}
            {entryMode === "advanced" && (
              <FormField
                control={form.control}
                name="account_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trading Account *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background border-input" data-testid="select-account">
                          <SelectValue placeholder="Select trading account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {!accounts || accounts.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground">
                            No accounts available. Please add an account first.
                          </div>
                        ) : (
                          accounts
                            .filter(acc => acc.is_active)
                            .map((account) => (
                              <SelectItem key={account.id} value={account.id} data-testid={`option-account-${account.id}`}>
                                {account.account_name} ({account.broker_name})
                              </SelectItem>
                            ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Trade Date Picker */}
            <div className="mb-4">
              <Label className="mb-2 block">Trade Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-background border-input",
                      !tradeDate && "text-muted-foreground"
                    )}
                    data-testid="button-select-trade-date"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {tradeDate ? format(tradeDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={tradeDate}
                    onSelect={(date) => date && setTradeDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Instrument Type */}
              <FormField
                control={form.control}
                name="instrumentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instrument Type</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedInstrumentType(value);
                        form.setValue("instrument", ""); // Reset instrument when type changes
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-background border-input">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="FOREX">Forex</SelectItem>
                        <SelectItem value="INDICES">Indices</SelectItem>
                        <SelectItem value="CRYPTO">Crypto</SelectItem>
                        <SelectItem value="FUTURES">Futures</SelectItem>
                        <SelectItem value="STOCKS">Stocks</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Instrument - Searchable */}
              <FormField
                control={form.control}
                name="instrument"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Instrument</FormLabel>
                    <Popover open={instrumentSearchOpen} onOpenChange={setInstrumentSearchOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between bg-background border-input",
                              !field.value && "text-muted-foreground"
                            )}
                            data-testid="button-select-instrument"
                          >
                            {field.value || "Type to search..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <Command shouldFilter={false}>
                          <CommandInput 
                            placeholder="Search or type custom instrument..." 
                            value={instrumentSearchValue}
                            onValueChange={setInstrumentSearchValue}
                          />
                          <CommandEmpty>No instruments found.</CommandEmpty>
                          <CommandGroup className="max-h-[300px] overflow-auto">
                            {/* Custom create option - show when user has typed and it doesn't exactly match any instrument */}
                            {instrumentSearchValue && 
                             !currentInstruments.some((i: string) => i.toLowerCase() === instrumentSearchValue.toLowerCase()) && (
                              <CommandItem
                                key="create-custom"
                                value={`create-${instrumentSearchValue}`}
                                onSelect={() => {
                                  form.setValue("instrument", instrumentSearchValue);
                                  setInstrumentSearchOpen(false);
                                  setInstrumentSearchValue("");
                                }}
                                className="cursor-pointer border-b"
                                data-testid="option-create-custom"
                              >
                                <Check className="mr-2 h-4 w-4 opacity-0" />
                                Create: <span className="font-semibold ml-1">{instrumentSearchValue}</span>
                              </CommandItem>
                            )}
                            {/* Filtered instrument list */}
                            {currentInstruments
                              .filter((instrument: string) => 
                                instrumentSearchValue === "" || 
                                instrument.toLowerCase().includes(instrumentSearchValue.toLowerCase())
                              )
                              .map((instrument: string) => (
                              <CommandItem
                                key={instrument}
                                value={instrument}
                                onSelect={(value) => {
                                  // Find the original instrument (case-insensitive match)
                                  const selected = currentInstruments.find(
                                    (i: string) => i.toLowerCase() === value.toLowerCase()
                                  ) || value;
                                  form.setValue("instrument", selected);
                                  setInstrumentSearchOpen(false);
                                  setInstrumentSearchValue("");
                                }}
                                data-testid={`option-instrument-${instrument.replace(/[^a-zA-Z0-9]/g, '-')}`}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === instrument ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {instrument}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Trade Type */}
              <FormField
                control={form.control}
                name="tradeType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trade Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background border-input">
                          <SelectValue />
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

              {/* Advanced mode only fields */}
              {entryMode === "advanced" && (
                <>
                  {/* Position Size */}
                  <FormField
                    control={form.control}
                    name="positionSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Position Size</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="1.0"
                            className="bg-background border-input"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Entry Price */}
                  <FormField
                    control={form.control}
                    name="entryPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Entry Price</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="1.08450"
                            className="bg-background border-input"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Entry Time */}
                  <FormField
                    control={form.control}
                    name="entryTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Entry Time (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            className="bg-background border-input"
                            data-testid="input-entry-time"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Exit Time */}
                  <FormField
                    control={form.control}
                    name="exitTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Exit Time (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            className="bg-background border-input"
                            data-testid="input-exit-time"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Stop Loss */}
                  <FormField
                    control={form.control}
                    name="stopLoss"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stop Loss</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="1.08200"
                            className="bg-background border-input"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Take Profit */}
                  <FormField
                    control={form.control}
                    name="takeProfit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Take Profit</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="1.08700"
                            className="bg-background border-input"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

            </div>

            {/* Profit/Loss Section */}
            <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
              {entryMode === "advanced" && (
                <FormField
                  control={form.control}
                  name="hasPnL"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center space-x-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-medium">
                          Set Profit/Loss Amount
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              )}
              
              {entryMode === "easy" && (
                <div className="mb-2">
                  <p className="text-sm font-medium text-foreground">Profit/Loss *</p>
                </div>
              )}

              {(entryMode === "easy" || form.watch("hasPnL")) && (
                <div className="grid grid-cols-2 gap-4">
                  {/* P&L Type */}
                  <FormField
                    control={form.control}
                    name="pnlType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background border-input">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="profit">Profit</SelectItem>
                            <SelectItem value="loss">Loss</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* P&L Amount */}
                  <FormField
                    control={form.control}
                    name="pnlAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="600"
                            className="bg-background border-input"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            {/* Trade Notes */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trade Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add your trade analysis, reasoning, and strategy..."
                        className="bg-background border-input min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Image Upload Section */}
              <FeatureGate feature="notes_uploads">
                <div className="border rounded-lg p-4 bg-muted/20">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium">Attach Images</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      id="image-upload"
                      disabled={isUploading}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('image-upload')?.click()}
                      disabled={isUploading}
                      className="h-8"
                    >
                      {isUploading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-1" />
                          Upload Images
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Uploaded Images Display */}
                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {uploadedImages.map((imageUrl, index) => (
                      <div key={index} className="relative group">
                        <SignedImageDisplay
                          imageUrl={imageUrl}
                          alt={`Trade attachment ${index + 1}`}
                          className="w-full h-20 object-cover rounded border bg-gray-100"
                          data-testid={`img-attachment-${index}`}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeImage(index)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {uploadedImages.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Upload screenshots, charts, or analysis images</p>
                    <p className="text-xs">Supports JPG, PNG, GIF formats</p>
                  </div>
                )}
                </div>
              </FeatureGate>
            </div>

            {/* Warning for Easy Mode */}
            {entryMode === "easy" && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  ⚠️ <strong>Warning:</strong> Trades uploaded using the <strong>(easy)</strong> mode will affect analytics & dashboard data, but the calendar will function as normal.
                </p>
              </div>
            )}

            <div className="flex justify-between items-center pt-4">
              <p className="text-sm text-muted-foreground">
                Date: {format(tradeDate, "EEEE, MMMM d, yyyy")}
              </p>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={addTradeMutation.isPending}
                >
                  Cancel
                </Button>
                <PlanGate action="save" buttonId="save">
                  <Button
                    type="submit"
                    disabled={addTradeMutation.isPending}
                    data-testid="button-submit"
                  >
                    {addTradeMutation.isPending 
                      ? (trade?.id ? "Updating..." : "Adding...") 
                      : (trade?.id ? "Update Trade" : "Add Trade")}
                  </Button>
                </PlanGate>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}