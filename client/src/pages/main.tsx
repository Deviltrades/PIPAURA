import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { TrendingUp, BarChart3, Calendar, Signal, Shield, Zap, Users } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import logoImage from "@assets/btrustedprops_1756670174065.jpg";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = loginSchema.extend({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function MainPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("login");
  
  // Redirect to dashboard if already logged in
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (user) {
    setLocation("/dashboard");
    return null;
  }

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const res = await apiRequest("POST", "/api/login", data);
      return await res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/auth/user"], user);
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
      setLocation("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      const res = await apiRequest("POST", "/api/register", data);
      return await res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/auth/user"], user);
      toast({
        title: "Welcome to TJ!",
        description: "Your account has been created successfully.",
      });
      setLocation("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onLogin = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  const onRegister = (data: RegisterFormData) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      {/* Logo and Title Centered at Top */}
      <div className="border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          {/* Logo and Title Centered */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <img 
                src={logoImage} 
                alt="TJ - Traders Brotherhood Logo" 
                className="w-16 h-16 rounded-lg shadow-lg"
              />
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  TJ - Traders Brotherhood
                </h1>
                <p className="text-muted-foreground">
                  Professional Trading Journal & Community
                </p>
              </div>
            </div>
          </div>

          {/* Login Form Centered */}
          <div className="flex justify-center">
            <div className="w-full max-w-md">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl text-center">Access Your Journal</CardTitle>
                  <CardDescription className="text-center">
                    Sign in to your trading account or create a new one
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="login">Sign In</TabsTrigger>
                      <TabsTrigger value="register">Sign Up</TabsTrigger>
                    </TabsList>

                    <TabsContent value="login">
                      <Form {...loginForm}>
                        <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                          <FormField
                            control={loginForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="email" 
                                    placeholder="Enter your email" 
                                    data-testid="input-email"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={loginForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="password" 
                                    placeholder="Enter your password" 
                                    data-testid="input-password"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button 
                            type="submit" 
                            className="w-full" 
                            disabled={loginMutation.isPending}
                            data-testid="button-login"
                          >
                            {loginMutation.isPending ? "Signing in..." : "Sign In"}
                          </Button>
                        </form>
                      </Form>
                    </TabsContent>

                    <TabsContent value="register">
                      <Form {...registerForm}>
                        <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={registerForm.control}
                              name="firstName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>First Name</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="First name" 
                                      data-testid="input-firstname"
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={registerForm.control}
                              name="lastName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Last Name</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="Last name" 
                                      data-testid="input-lastname"
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <FormField
                            control={registerForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="email" 
                                    placeholder="Enter your email" 
                                    data-testid="input-register-email"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={registerForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="password" 
                                    placeholder="Create a password" 
                                    data-testid="input-register-password"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button 
                            type="submit" 
                            className="w-full" 
                            disabled={registerMutation.isPending}
                            data-testid="button-register"
                          >
                            {registerMutation.isPending ? "Creating account..." : "Create Account"}
                          </Button>
                        </form>
                      </Form>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Marketing Content Below */}
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-6">
            Elevate Your Trading Journey
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Join the brotherhood of professional traders with our comprehensive trading journal featuring advanced analytics, 
            signal sharing, and community-driven performance tracking. Transform your trading from guesswork to precision.
          </p>
          <div className="flex flex-wrap gap-2 justify-center text-sm text-muted-foreground">
            <span className="bg-primary/10 px-3 py-1 rounded-full">✓ View Journal before Purchase</span>
            <span className="bg-primary/10 px-3 py-1 rounded-full">✓ No Setup Fees</span>
            <span className="bg-primary/10 px-3 py-1 rounded-full">✓ Cancel Anytime</span>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="border-border hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <TrendingUp className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3">Advanced Analytics</h3>
              <p className="text-muted-foreground">
                Track your performance with detailed statistics, win rates, risk metrics, and equity curves that reveal your true trading edge
              </p>
            </CardContent>
          </Card>

          <Card className="border-border hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <BarChart3 className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3">Professional Trade Journal</h3>
              <p className="text-muted-foreground">
                Log trades across forex, indices, and crypto with notes, screenshots, and detailed analysis that helps you learn from every trade
              </p>
            </CardContent>
          </Card>

          <Card className="border-border hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <Calendar className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3">Visual Calendar</h3>
              <p className="text-muted-foreground">
                Visualize daily P&L, track trading patterns, and identify your most profitable days with our intuitive calendar interface
              </p>
            </CardContent>
          </Card>

          <Card className="border-border hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <Signal className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3">Brotherhood Signals</h3>
              <p className="text-muted-foreground">
                Share and receive high-quality trading signals from verified traders with detailed entry, exit, and risk parameters
              </p>
            </CardContent>
          </Card>

          <Card className="border-border hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <Shield className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3">Bank-Level Security</h3>
              <p className="text-muted-foreground">
                Your trading data is protected with enterprise-grade encryption and secure authentication. Your secrets stay secret.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <Users className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3">Trading Community</h3>
              <p className="text-muted-foreground">
                Connect with like-minded traders, share insights, and learn from a community dedicated to trading excellence
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pricing CTA Section */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-xl p-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to Transform Your Trading?
          </h2>
          <p className="text-lg text-muted-foreground mb-6">
            Join thousands of traders who have elevated their performance with TJ - Traders Brotherhood
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">£7.99</div>
              <div className="text-sm text-muted-foreground">per month</div>
            </div>
            <Button size="lg" className="text-lg px-8 py-3" onClick={() => setActiveTab("register")}>
              Try Demo Journal
            </Button>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold text-foreground mb-8">Everything You Need to Succeed</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            <div>
              <h4 className="font-semibold text-foreground mb-2">📊 Performance Tracking</h4>
              <p className="text-sm text-muted-foreground">Win rate, profit factor, Sharpe ratio, and more</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">📝 Trade Journaling</h4>
              <p className="text-sm text-muted-foreground">Screenshots, notes, and detailed trade analysis</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">🎯 Risk Management</h4>
              <p className="text-sm text-muted-foreground">Position sizing, stop losses, and risk metrics</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">📱 Mobile Ready</h4>
              <p className="text-sm text-muted-foreground">Access your journal anywhere, anytime</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}