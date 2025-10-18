import { useState } from "react";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Crown, 
  Zap, 
  Lock, 
  ExternalLink, 
  CreditCard,
  FileText,
  TrendingUp,
  Loader2,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function UserPage() {
  const { profile, planConfig, isLoading } = useUserProfile();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);

  const getPlanIcon = (planType: string) => {
    switch (planType) {
      case 'lite':
        return <Lock className="h-5 w-5 text-gray-400" />;
      case 'core':
        return <Zap className="h-5 w-5 text-cyan-400" />;
      case 'elite':
        return <Crown className="h-5 w-5 text-yellow-400" />;
      default:
        return <Lock className="h-5 w-5" />;
    }
  };

  const getPlanColor = (planType: string) => {
    switch (planType) {
      case 'lite':
        return 'bg-gray-500/10 text-gray-300 border-gray-500/30';
      case 'core':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'elite':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-gray-500/10 text-gray-300 border-gray-500/30';
    }
  };

  const handleManageBilling = async () => {
    setIsLoadingPortal(true);
    try {
      // Get the session token from Supabase
      const { data: { session } } = await import('@/lib/supabase').then(m => m.supabase.auth.getSession());
      
      if (!session?.access_token) {
        toast({
          title: "Error",
          description: "Not authenticated. Please log in again.",
          variant: "destructive"
        });
        return;
      }

      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create portal session');
      }

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No portal URL returned');
      }
    } catch (error) {
      console.error('Error creating portal session:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to open billing portal. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingPortal(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-gray-400">Unable to load profile</p>
        </div>
      </div>
    );
  }

  const storagePercentage = profile.storage_limit_mb > 0 
    ? (profile.storage_used_mb / profile.storage_limit_mb) * 100 
    : 0;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2" data-testid="text-user-title">
          Account & Billing
        </h1>
        <p className="text-gray-400">
          Manage your subscription, billing, and account settings
        </p>
      </div>

      {/* Current Plan Card */}
      <Card className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getPlanIcon(profile.plan_type)}
              <div>
                <CardTitle className="text-white">
                  {planConfig?.name} Plan
                </CardTitle>
                <CardDescription>
                  Your current subscription plan
                </CardDescription>
              </div>
            </div>
            <Badge 
              className={`${getPlanColor(profile.plan_type)} border px-4 py-1 font-semibold`}
              data-testid={`badge-plan-${profile.plan_type}`}
            >
              {profile.plan_type.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Plan Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                <span className="text-sm font-medium text-gray-300">Storage</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {(profile.storage_limit_mb / 1024).toFixed(0)}GB
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Monthly storage limit
              </p>
            </div>

            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                <span className="text-sm font-medium text-gray-300">Accounts</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {profile.account_limit === 999999 ? 'Unlimited' : profile.account_limit}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Trading accounts
              </p>
            </div>

            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                <span className="text-sm font-medium text-gray-300">Features</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {planConfig?.features.dashboard ? 'Full' : 'Limited'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Feature access
              </p>
            </div>
          </div>

          {/* Storage Usage */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-300">Storage Usage</span>
              <span className="text-sm text-gray-400">
                {profile.storage_used_mb.toFixed(2)} MB / {profile.storage_limit_mb} MB
              </span>
            </div>
            <Progress 
              value={storagePercentage} 
              className="h-2"
              data-testid="progress-storage-usage"
            />
            <p className="text-xs text-gray-500 mt-1">
              {storagePercentage.toFixed(1)}% used
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Billing Management Card */}
      <Card className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Billing Management</CardTitle>
          <CardDescription>
            Manage your subscription, payment methods, and invoices through Stripe
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={handleManageBilling}
              disabled={isLoadingPortal}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
              data-testid="button-manage-billing"
            >
              {isLoadingPortal ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Opening Portal...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Manage Billing
                  <ExternalLink className="ml-2 h-3 w-3" />
                </>
              )}
            </Button>

            <Button
              variant="outline"
              className="w-full border-white/10 hover:bg-white/5"
              onClick={() => window.location.href = '/pricing'}
              data-testid="button-view-plans"
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              View All Plans
            </Button>
          </div>

          {/* Cancel Plan Button */}
          <Button
            onClick={handleManageBilling}
            disabled={isLoadingPortal}
            variant="ghost"
            size="sm"
            className="w-full text-gray-400 hover:text-red-400 hover:bg-red-500/10"
            data-testid="button-cancel-plan"
          >
            <XCircle className="mr-2 h-3 w-3" />
            Cancel Plan
          </Button>

          <Separator className="bg-white/10" />

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-white">What you can do:</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                <span>Upgrade or downgrade your subscription plan</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                <span>Update payment methods and billing information</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                <span>View and download past invoices</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                <span>Cancel your subscription (downgrades to Lite plan)</span>
              </li>
              <li className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                <span>Access billing history and payment receipts</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Account Information</CardTitle>
          <CardDescription>
            Your account details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between py-2">
            <span className="text-gray-400">Email</span>
            <span className="text-white font-medium" data-testid="text-user-email">
              {profile.email}
            </span>
          </div>
          <Separator className="bg-white/10" />
          <div className="flex justify-between py-2">
            <span className="text-gray-400">Account Type</span>
            <span className="text-white font-medium" data-testid="text-account-type">
              {profile.account_type}
            </span>
          </div>
          <Separator className="bg-white/10" />
          <div className="flex justify-between py-2">
            <span className="text-gray-400">Timezone</span>
            <span className="text-white font-medium">
              {profile.timezone}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
