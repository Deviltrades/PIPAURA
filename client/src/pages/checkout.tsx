import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PipAuraLogo } from "@/components/PipAuraLogo";
import { useToast } from "@/hooks/use-toast";
import { Check, ArrowLeft, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error("Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY");
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

type Plan = "lite" | "core" | "elite";
type Interval = "monthly" | "yearly";

interface PlanDetails {
  name: string;
  monthlyPrice: string;
  yearlyPrice: string;
  storage: string;
  accounts: string;
  features: string[];
}

const planDetails: Record<Plan, PlanDetails> = {
  lite: {
    name: "Lite",
    monthlyPrice: "£4.99",
    yearlyPrice: "£49.99",
    storage: "1GB Storage",
    accounts: "1 Account",
    features: [
      "Core trading journal",
      "Basic analytics",
      "Trade logging",
      "Calendar view",
      "Performance tracking",
    ],
  },
  core: {
    name: "Core",
    monthlyPrice: "£14",
    yearlyPrice: "£114",
    storage: "2GB Storage",
    accounts: "Up to 10 accounts",
    features: [
      "Everything in Lite, plus:",
      "Advanced analytics & DNA Core",
      "Prop firm tracker",
      "Fundamental analysis",
      "Strategy backtesting",
      "Priority support",
    ],
  },
  elite: {
    name: "Elite",
    monthlyPrice: "£24",
    yearlyPrice: "£230",
    storage: "10GB Storage",
    accounts: "Unlimited accounts",
    features: [
      "Everything in Core, plus:",
      "AI-powered insights (coming soon)",
      "Advanced mentor features",
      "Custom integrations",
      "Dedicated support",
      "Early access to new features",
    ],
  },
};

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<Plan>("core");
  const [selectedInterval, setSelectedInterval] = useState<Interval>("monthly");
  const [isProcessing, setIsProcessing] = useState(false);

  // Read URL params once on mount to set initial plan/interval
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlPlan = urlParams.get("plan") as Plan | null;
    const urlInterval = urlParams.get("interval") as Interval | null;

    if (urlPlan && (urlPlan === "lite" || urlPlan === "core" || urlPlan === "elite")) {
      setSelectedPlan(urlPlan);
    }
    if (urlInterval && (urlInterval === "monthly" || urlInterval === "yearly")) {
      setSelectedInterval(urlInterval);
    }
  }, []);

  const handleCheckout = async () => {
    if (!user?.email) {
      toast({
        title: "Authentication required",
        description: "Please sign in to purchase a subscription.",
        variant: "destructive",
      });
      setLocation("/auth");
      return;
    }

    setIsProcessing(true);
    try {
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error("Stripe failed to load");
      }

      // Create checkout session
      const response = await apiRequest("POST", "/api/create-checkout-session", {
        planId: selectedPlan,
        interval: selectedInterval,
        customerEmail: user.email,
      });

      const data = await response.json();
      const { url } = data;

      if (url) {
        // Redirect to Stripe checkout
        window.location.href = url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({
        title: "Checkout failed",
        description: error.message || "Unable to start checkout. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const plan = planDetails[selectedPlan];
  const price = selectedInterval === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
  const savings = selectedInterval === "yearly" ? "Save 17%" : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/30 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <PipAuraLogo />
          <Button
            variant="ghost"
            onClick={() => setLocation("/pricing")}
            className="text-slate-400 hover:text-white hover:bg-slate-800"
            data-testid="button-back-to-pricing"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Pricing
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4" data-testid="text-checkout-title">
            Complete Your Purchase
          </h1>
          <p className="text-slate-400 text-lg">
            Secure checkout powered by Stripe
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Plan Selection */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-white mb-4">Select Your Plan</h2>
              <div className="space-y-3">
                {(Object.keys(planDetails) as Plan[]).map((planKey) => (
                  <button
                    key={planKey}
                    onClick={() => setSelectedPlan(planKey)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      selectedPlan === planKey
                        ? "border-cyan-400 bg-cyan-400/10"
                        : "border-slate-700 bg-slate-900/50 hover:border-slate-600"
                    }`}
                    data-testid={`button-select-plan-${planKey}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-cyan-400">
                          {planDetails[planKey].name}
                        </h3>
                        <p className="text-sm text-slate-400">
                          {planDetails[planKey].storage} • {planDetails[planKey].accounts}
                        </p>
                      </div>
                      {selectedPlan === planKey && (
                        <Check className="w-6 h-6 text-cyan-400" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white mb-4">Billing Cycle</h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSelectedInterval("monthly")}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedInterval === "monthly"
                      ? "border-cyan-400 bg-cyan-400/10"
                      : "border-slate-700 bg-slate-900/50 hover:border-slate-600"
                  }`}
                  data-testid="button-select-monthly"
                >
                  <div className="text-center">
                    <p className="text-white font-semibold">Monthly</p>
                    <p className="text-sm text-slate-400">Billed monthly</p>
                  </div>
                </button>
                <button
                  onClick={() => setSelectedInterval("yearly")}
                  className={`p-4 rounded-lg border-2 transition-all relative ${
                    selectedInterval === "yearly"
                      ? "border-cyan-400 bg-cyan-400/10"
                      : "border-slate-700 bg-slate-900/50 hover:border-slate-600"
                  }`}
                  data-testid="button-select-yearly"
                >
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                    Save 17%
                  </div>
                  <div className="text-center">
                    <p className="text-white font-semibold">Yearly</p>
                    <p className="text-sm text-slate-400">Billed annually</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Order Summary</CardTitle>
                <CardDescription className="text-slate-400">
                  Review your selection
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-white">
                    <span>Plan:</span>
                    <span className="font-semibold">{plan.name}</span>
                  </div>
                  <div className="flex justify-between text-white">
                    <span>Billing:</span>
                    <span className="font-semibold capitalize">{selectedInterval}</span>
                  </div>
                  {savings && (
                    <div className="flex justify-between text-green-400">
                      <span>Savings:</span>
                      <span className="font-semibold">{savings}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-700 pt-4">
                  <h4 className="text-white font-semibold mb-3">Included Features:</h4>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-slate-300 text-sm">
                        <Check className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-slate-700 pt-4">
                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-400">Total:</span>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-white">{price}</p>
                      <p className="text-sm text-slate-400">per {selectedInterval === "monthly" ? "month" : "year"}</p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/30 py-6 text-lg"
                  data-testid="button-proceed-to-payment"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>Proceed to Payment</>
                  )}
                </Button>

                <p className="text-xs text-slate-500 text-center">
                  Secure payment processing by Stripe. <br />
                  By proceeding, you agree to our{" "}
                  <a href="/membership-agreement" className="text-cyan-400 hover:underline">
                    Membership Agreement
                  </a>
                  .
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
