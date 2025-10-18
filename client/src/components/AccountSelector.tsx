import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getTradeAccounts } from "@/lib/supabase-service";
import type { TradeAccount } from "@shared/schema";

interface AccountSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export function AccountSelector({ value, onValueChange, className = "" }: AccountSelectorProps) {
  const { data: accounts = [] } = useQuery<TradeAccount[]>({
    queryKey: ["trade-accounts"],
    queryFn: getTradeAccounts,
  });

  const activeAccounts = accounts.filter((acc) => acc.is_active);

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger 
        className={`w-full sm:w-[280px] bg-slate-800/50 border-slate-700 text-white ${className}`}
        data-testid="select-account-filter"
      >
        <SelectValue placeholder="All Accounts" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all" data-testid="option-all-accounts">
          All Accounts
        </SelectItem>
        {activeAccounts.map((account) => (
          <SelectItem 
            key={account.id} 
            value={account.id}
            data-testid={`option-account-${account.id}`}
          >
            {account.account_name} ({account.broker_name})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
