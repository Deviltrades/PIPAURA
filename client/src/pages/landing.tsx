import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, BarChart3, Calendar, Signal, Shield, Zap } from "lucide-react";
import logoImage from "@assets/btrustedprops_1756670174065.jpg";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      {/* Header with Login Button */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-end">
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
          <div className="flex items-center justify-center mb-6">
            <img 
              src={logoImage} 
              alt="TJ - Traders Brotherhood Logo" 
              className="w-20 h-20 mr-4 rounded-lg shadow-lg"
            />
            <h1 className="text-5xl font-bold text-foreground">
              TJ - Traders Brotherhood
            </h1>
          </div>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Unite with fellow traders through our comprehensive trading journal featuring advanced analytics, signal sharing, and community-driven performance tracking
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" asChild className="text-lg px-8 py-3">
              <a href="/api/login">
                Get Started
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8 py-3">
              <a href="/api/login">
                Login
              </a>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="border-border hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <TrendingUp className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3">Advanced Analytics</h3>
              <p className="text-muted-foreground">
                Track your performance with detailed statistics, win rates, risk metrics, and equity curves
              </p>
            </CardContent>
          </Card>

          <Card className="border-border hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <BarChart3 className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3">Trade Journal</h3>
              <p className="text-muted-foreground">
                Log trades across forex, indices, and crypto with notes, screenshots, and detailed analysis
              </p>
            </CardContent>
          </Card>

          <Card className="border-border hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <Calendar className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3">Calendar View</h3>
              <p className="text-muted-foreground">
                Visualize daily P&L, track trading patterns, and identify your most profitable days
              </p>
            </CardContent>
          </Card>

          <Card className="border-border hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <Signal className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3">Brotherhood Signals</h3>
              <p className="text-muted-foreground">
                Share and receive trading signals from the brotherhood community with detailed entry, exit, and risk parameters
              </p>
            </CardContent>
          </Card>

          <Card className="border-border hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <Shield className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3">Secure & Private</h3>
              <p className="text-muted-foreground">
                Your trading data is encrypted and secure with enterprise-grade authentication
              </p>
            </CardContent>
          </Card>

          <Card className="border-border hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <Zap className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3">Real-time Updates</h3>
              <p className="text-muted-foreground">
                Live signal updates, instant notifications, and real-time performance tracking
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to Join the Brotherhood?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Connect with fellow traders and elevate your trading journey with TJ - Traders Brotherhood
          </p>
          <Button size="lg" asChild className="text-lg px-8 py-3">
            <a href="/api/login">
              Join the Brotherhood
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
