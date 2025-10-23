import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Sparkles } from "lucide-react";
import { useUserProfile } from "@/hooks/use-user-profile";
import { queryClient } from "@/lib/queryClient";

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();
  const { profile, isLoading } = useUserProfile();
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [planType, setPlanType] = useState<string>('lite');

  useEffect(() => {
    // Get session_id and customer email from URL
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');

    if (!sessionId) {
      // No session ID, redirect to auth
      setLocation('/auth');
      return;
    }

    // Extract email and plan from URL (Stripe checkout adds these as query params)
    const email = params.get('email') || '';
    const plan = params.get('plan') || 'lite';
    
    setCustomerEmail(email);
    setPlanType(plan);

    // Wait a moment for webhook to process, then refresh profile
    const timer = setTimeout(async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
      setIsRefreshing(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [setLocation]);

  const getPlanName = (planType?: string) => {
    if (!planType) return 'Lite';
    return planType.charAt(0).toUpperCase() + planType.slice(1);
  };

  const getPlanFeatures = (planType?: string) => {
    const features = {
      lite: [
        "Core trading journal",
        "Basic analytics",
        "1 trading account",
        "1GB storage"
      ],
      core: [
        "Everything in Lite",
        "Advanced analytics & DNA Core",
        "Prop firm tracker",
        "Up to 10 accounts",
        "2GB storage"
      ],
      elite: [
        "Everything in Core",
        "AI-powered insights (coming soon)",
        "Advanced mentor features",
        "Unlimited accounts",
        "10GB storage"
      ]
    };

    return features[planType as keyof typeof features] || features.lite;
  };

  if (isRefreshing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/30 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-cyan-500 mx-auto mb-4" />
          <p className="text-white text-lg">Processing your subscription...</p>
          <p className="text-slate-400 text-sm mt-2">This will just take a moment</p>
        </div>
      </div>
    );
  }

  const displayPlanType = profile?.plan_type || planType;
  const displayEmail = profile?.email || customerEmail;
  const planName = getPlanName(displayPlanType);
  const features = getPlanFeatures(displayPlanType);
  const isLoggedIn = !!profile;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/30 to-slate-950">
      <div className="max-w-2xl mx-auto px-4 py-16">
        {/* Success Animation */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-green-500/20 blur-3xl rounded-full animate-pulse"></div>
            <div className="relative bg-green-500 rounded-full p-6 mb-4 inline-block">
              <Check className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            Payment Successful!
            <Sparkles className="h-8 w-8 text-yellow-400" />
          </h1>
          <p className="text-lg text-slate-300">
            Welcome to PipAura {planName}
          </p>
        </div>

        {/* Plan Details Card */}
        <Card className="bg-slate-900/50 border-cyan-500/30 shadow-xl shadow-cyan-500/10 mb-6">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <div className="inline-block bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-2 rounded-full font-semibold text-lg mb-4">
                {planName} Plan Active
              </div>
              <p className="text-slate-300">
                Your subscription is now active and ready to use
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-white font-semibold text-lg mb-3">You now have access to:</h3>
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="bg-cyan-500/20 rounded-full p-1 mt-0.5">
                    <Check className="h-4 w-4 text-cyan-400" />
                  </div>
                  <span className="text-slate-300">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card className="bg-slate-900/50 border-slate-700 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Account Email</p>
                <p className="text-white font-medium" data-testid="text-account-email">{displayEmail}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-400">Plan Type</p>
                <p className="text-cyan-400 font-semibold">{planName}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Password Setup Notice - Only show if not logged in */}
        {!isLoggedIn && (
          <Card className="bg-amber-900/20 border-amber-500/30 mb-6">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="bg-amber-500/20 rounded-full p-2 mt-0.5">
                  <Sparkles className="h-5 w-5 text-amber-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-amber-400 font-semibold mb-2">Check Your Email!</h3>
                  <p className="text-slate-300 text-sm mb-2">
                    We've sent a password setup email to <span className="font-semibold text-white">{displayEmail}</span>
                  </p>
                  <p className="text-slate-400 text-sm">
                    Click the link in the email to set your password and access your trading journal.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Next Steps */}
        <Card className="bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border-cyan-500/30 mb-6">
          <CardContent className="p-6">
            <h3 className="text-white font-semibold mb-3">What's Next?</h3>
            <ul className="space-y-2 text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1">•</span>
                <span>Start logging your trades in the journal</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1">•</span>
                <span>Set up your trading accounts</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1">•</span>
                <span>Explore advanced analytics and performance metrics</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1">•</span>
                <span>Manage your subscription in Settings</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          {isLoggedIn ? (
            <>
              <Button
                onClick={() => setLocation('/dashboard')}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/30"
                size="lg"
                data-testid="button-go-to-dashboard"
              >
                Go to Dashboard
              </Button>
              <Button
                onClick={() => setLocation('/settings')}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-800"
                size="lg"
                data-testid="button-manage-subscription"
              >
                Manage Subscription
              </Button>
            </>
          ) : (
            <Button
              onClick={() => setLocation('/auth')}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/30"
              size="lg"
              data-testid="button-go-to-login"
            >
              Go to Login
            </Button>
          )}
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          You can manage your subscription, update payment methods, or cancel anytime from your Settings page.
        </p>
      </div>
    </div>
  );
}
