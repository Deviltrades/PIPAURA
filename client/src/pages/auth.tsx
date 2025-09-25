import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Shield, TrendingUp, Users, BarChart3 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = loginSchema;

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("login");
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  
  // Redirect to dashboard if already logged in
  const { user, isLoading } = useAuth();

  // Handle email verification from URL hash parameters
  useEffect(() => {
    const handleEmailVerification = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const access_token = hashParams.get('access_token');
      const refresh_token = hashParams.get('refresh_token');
      const type = hashParams.get('type');

      if (access_token && refresh_token && type === 'signup') {
        setVerifyingEmail(true);
        try {
          // Set the session using the tokens from email verification
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token
          });

          if (error) {
            throw error;
          }

          toast({
            title: "Email verified!",
            description: "Your account has been successfully verified.",
          });

          // Clear the hash from URL
          window.history.replaceState(null, '', window.location.pathname);
          
        } catch (error: any) {
          console.error('Email verification error:', error);
          toast({
            title: "Verification failed",
            description: error.message || "Failed to verify email. Please try again.",
            variant: "destructive",
          });
        } finally {
          setVerifyingEmail(false);
        }
      }
    };

    handleEmailVerification();
  }, [toast]);
  
  if (isLoading || verifyingEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {verifyingEmail ? "Verifying your email..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }
  
  if (user) {
    setLocation("/");
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
    },
  });

  // Get auth methods from the new Supabase Auth hook
  const { signIn, signUp } = useAuth();

  const onLogin = (data: LoginFormData) => {
    signIn.mutate({
      email: data.email,
      password: data.password,
    });
  };

  const onRegister = (data: RegisterFormData) => {
    signUp.mutate({
      email: data.email,
      password: data.password,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/50 flex">
      {/* Left side - Hero */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary/5 flex-col justify-center px-12">
        <div className="max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">TJ</h1>
              <p className="text-sm text-muted-foreground">Traders Brotherhood</p>
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Join the Brotherhood of Elite Traders
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Track, analyze, and improve your trading performance with our comprehensive journal and analytics platform.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-primary" />
              </div>
              <span className="text-muted-foreground">Advanced analytics and performance tracking</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <span className="text-muted-foreground">Community-driven trading insights</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              <span className="text-muted-foreground">Proprietary firm friendly platform</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Auth forms */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Welcome</CardTitle>
              <CardDescription>
                Sign in to your account or create a new one to get started
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
                        disabled={signIn.isPending}
                        data-testid="button-login"
                      >
                        {signIn.isPending ? "Signing in..." : "Sign In"}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>

                <TabsContent value="register">
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
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
                                placeholder="Create a password (min 6 characters)" 
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
                        disabled={signUp.isPending}
                        data-testid="button-register"
                      >
                        {signUp.isPending ? "Creating account..." : "Create Account"}
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
  );
}