import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, TrendingUp, Users, Crown } from "lucide-react";
import logoImage from "@assets/btrustedprops_1756670174065.jpg";

export default function Pricing() {
  const plans = [
    {
      name: "Monthly",
      price: "£15",
      period: "month",
      description: "Full access with the flexibility to cancel anytime",
      icon: Users,
      features: [
        "Add up to 10 Accounts",
        "Manually enter trades",
        "Automatically add trades",
        "CSV Imports",
        "1 GB File Upload",
        "Proprietary firm friendly",
        "Created specifically for forex, futures and crypto traders",
        "Advanced analytics and reports",
        "Signal sharing with the community",
        "Custom dashboard widgets",
        "Calendar view of trading activity",
        "Mobile and desktop access",
        "Priority email support",
        "Cancel anytime"
      ],
      popular: true,
      cta: "Start Monthly Plan"
    },
    {
      name: "Lifetime",
      price: "£275",
      period: "one-time",
      description: "Pay once and access PipAura forever",
      icon: Crown,
      features: [
        "Add up to 10 Accounts",
        "Manually enter trades",
        "Automatically add trades",
        "CSV Imports",
        "1 GB File Upload",
        "Proprietary firm friendly",
        "Created specifically for forex, futures and crypto traders",
        "Lifetime access - no recurring fees",
        "All future feature updates included",
        "Priority feature requests",
        "Exclusive lifetime member benefits",
        "Advanced export capabilities",
        "API access for integrations",
        "Dedicated support channel",
        "Early access to new features",
        "One-time payment - save over £600"
      ],
      popular: false,
      cta: "Get Lifetime Access"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      {/* Header */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <img 
              src={logoImage} 
              alt="PipAura Logo" 
              className="w-12 h-12 mr-3 rounded-lg shadow-lg"
            />
            <span className="text-2xl font-bold text-foreground">PipAura</span>
          </div>
          <Button variant="outline" asChild>
            <a href="/api/login">
              Login
            </a>
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Join thousands of traders who are elevating their performance with PipAura. 
            Select the plan that matches your trading journey.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Check className="h-4 w-4 text-green-500" />
            <span>No setup fees</span>
            <span className="mx-2">•</span>
            <Check className="h-4 w-4 text-green-500" />
            <span>Instant access</span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 max-w-4xl mx-auto">
          {plans.map((plan, index) => {
            const IconComponent = plan.icon;
            return (
              <Card 
                key={plan.name} 
                className={`relative border-border hover:shadow-lg transition-all duration-300 h-full flex flex-col ${
                  plan.popular ? 'border-primary shadow-lg' : ''
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                )}
                
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <div className={`p-3 rounded-full ${plan.popular ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground">
                      {plan.period === "one-time" ? " one-time" : `/${plan.period}`}
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-2">{plan.description}</p>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col">
                  <ul className="space-y-3 mb-6 flex-1">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <Check className="h-4 w-4 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    size="lg" 
                    className="w-full"
                    asChild
                  >
                    <a href="/auth">
                      {plan.cta}
                    </a>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-8">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="text-left">
              <h3 className="font-semibold text-foreground mb-2">How quickly can I get started?</h3>
              <p className="text-muted-foreground text-sm">
                You get instant access to all features immediately after signup. Start logging trades right away.
              </p>
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-foreground mb-2">Can I change plans later?</h3>
              <p className="text-muted-foreground text-sm">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-foreground mb-2">Is my trading data secure?</h3>
              <p className="text-muted-foreground text-sm">
                Absolutely. We use enterprise-grade encryption and security measures to protect your data.
              </p>
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-foreground mb-2">What payment methods do you accept?</h3>
              <p className="text-muted-foreground text-sm">
                We accept all major credit cards and PayPal for secure and convenient payment processing.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to Join the Brotherhood?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Get instant access today and experience the power of community-driven trading analytics.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" asChild className="text-lg px-8 py-3">
              <a href="/auth">
                Get Started Now
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8 py-3">
              <a href="/">
                Back to Home
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}