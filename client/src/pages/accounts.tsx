import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

const mockAccounts = [
  {
    id: 1,
    name: "Live Trading Account",
    broker: "IC Markets",
    accountNumber: "12345678",
    balance: 10000,
    equity: 10250,
    margin: 500,
    freeMargin: 9750,
    marginLevel: 2050,
    status: "Active"
  },
  {
    id: 2,
    name: "Demo Account",
    broker: "XM Global",
    accountNumber: "87654321",
    balance: 50000,
    equity: 49800,
    margin: 1000,
    freeMargin: 48800,
    marginLevel: 4980,
    status: "Active"
  }
];

export default function Accounts() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Trading Accounts</h1>
        <p className="text-muted-foreground">Manage your trading accounts and balances</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {mockAccounts.map((account) => (
          <Card key={account.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{account.name}</CardTitle>
                  <CardDescription>{account.broker} • #{account.accountNumber}</CardDescription>
                </div>
                <Badge variant={account.status === "Active" ? "default" : "secondary"}>
                  {account.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Balance</p>
                  <p className="text-lg font-semibold">{formatCurrency(account.balance)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Equity</p>
                  <p className="text-lg font-semibold">{formatCurrency(account.equity)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Margin Used</p>
                  <p className="font-semibold">{formatCurrency(account.margin)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Free Margin</p>
                  <p className="font-semibold">{formatCurrency(account.freeMargin)}</p>
                </div>
              </div>
              <div className="pt-2">
                <p className="text-sm text-muted-foreground">Margin Level</p>
                <p className="text-lg font-semibold">{account.marginLevel.toFixed(2)}%</p>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm">
                  View Details
                </Button>
                <Button variant="outline" size="sm">
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Account</CardTitle>
          <CardDescription>Connect additional trading accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <Button>
            Connect Account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}