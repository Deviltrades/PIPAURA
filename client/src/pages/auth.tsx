import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { PipAuraLogo } from "@/components/PipAuraLogo";

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
  
  // Check for password recovery token in URL and redirect to reset password page
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    
    if (type === 'recovery') {
      // Redirect to reset password page with the hash intact
      setLocation(`/reset-password${window.location.hash}`);
    }
  }, [setLocation]);
  
  // Redirect to dashboard if already logged in
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950/30 to-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
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

  // Get auth methods from the new Supabase Auth hook
  const { signIn } = useAuth();

  const onLogin = (data: LoginFormData) => {
    signIn.mutate({
      email: data.email,
      password: data.password,
    });
  };

  const handleForgotPassword = async () => {
    const email = loginForm.getValues("email");
    
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address first",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Reset email sent!",
        description: "Check your email for the password reset link",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/30 to-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* PipAura Logo */}
        <div className="flex justify-center mb-8">
          <PipAuraLogo />
        </div>

        {/* Login Card */}
        <Card className="bg-slate-900/50 border-slate-700 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
            <p className="text-slate-400 text-sm mt-2">Sign in to your account</p>
          </CardHeader>
          <CardContent>
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="Enter your email" 
                          className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500"
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
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-slate-300">Password</FormLabel>
                        <Button
                          type="button"
                          variant="link"
                          className="text-cyan-400 hover:text-cyan-300 p-0 h-auto text-sm"
                          onClick={handleForgotPassword}
                          data-testid="button-forgot-password"
                        >
                          Forgot password?
                        </Button>
                      </div>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Enter your password" 
                          className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500"
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
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/30" 
                  disabled={signIn.isPending}
                  data-testid="button-login"
                >
                  {signIn.isPending ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Sign Up Link */}
        <div className="text-center mt-6">
          <p className="text-slate-400 text-lg">
            New to PipAura?{" "}
            <Button
              variant="link"
              className="text-cyan-400 hover:text-cyan-300 p-0 h-auto font-semibold text-lg"
              onClick={() => setLocation("/landing")}
              data-testid="button-join-here"
            >
              Join Here
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
}