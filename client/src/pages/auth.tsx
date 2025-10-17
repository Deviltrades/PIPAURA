import { useEffect, useState } from "react";
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

const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  
  // Check for password recovery token in URL
  useEffect(() => {
    console.log('Full URL:', window.location.href);
    console.log('Hash:', window.location.hash);
    
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    const access_token = hashParams.get('access_token');
    
    console.log('Type:', type);
    console.log('Access Token exists:', !!access_token);
    
    if (type === 'recovery' && access_token) {
      console.log('Setting up password reset...');
      supabase.auth.setSession({
        access_token,
        refresh_token: hashParams.get('refresh_token') || '',
      }).then(({ error }) => {
        if (!error) {
          console.log('Session set successfully, showing reset form');
          setIsPasswordReset(true);
          // Clear the hash from URL
          window.history.replaceState(null, '', window.location.pathname);
        } else {
          console.error('Session error:', error);
          toast({
            title: "Invalid or expired link",
            description: "Please request a new password reset link",
            variant: "destructive",
          });
        }
        setIsVerifying(false);
      });
    } else {
      console.log('No recovery token found, showing normal login');
      setIsVerifying(false);
    }
  }, [toast]);
  
  // Redirect to dashboard if already logged in
  const { user, isLoading } = useAuth();
  
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const resetForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  if (isLoading || isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950/30 to-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-slate-400">{isVerifying ? "Verifying reset link..." : "Loading..."}</p>
        </div>
      </div>
    );
  }
  
  if (user && !isPasswordReset) {
    setLocation("/dashboard");
    return null;
  }

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
      const redirectUrl = `${window.location.origin}/auth`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
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

  const onResetPassword = async (data: ResetPasswordFormData) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) throw error;

      toast({
        title: "Password updated!",
        description: "Your password has been successfully reset. Redirecting to login...",
      });

      setTimeout(() => {
        setIsPasswordReset(false);
        setLocation("/");
      }, 2000);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    }
  };

  // If this is a password reset flow, show the reset form
  if (isPasswordReset) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/30 to-slate-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <PipAuraLogo />
          </div>

          <Card className="bg-slate-900/50 border-slate-700 backdrop-blur-sm">
            <CardHeader className="text-center pb-6">
              <h1 className="text-2xl font-bold text-white">Reset Password</h1>
              <p className="text-slate-400 text-sm mt-2">Enter your new password</p>
            </CardHeader>
            <CardContent>
              <Form {...resetForm}>
                <form onSubmit={resetForm.handleSubmit(onResetPassword)} className="space-y-4">
                  <FormField
                    control={resetForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">New Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Enter new password" 
                            className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500"
                            data-testid="input-new-password"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={resetForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Confirm Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Confirm new password" 
                            className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500"
                            data-testid="input-confirm-password"
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
                    data-testid="button-reset-password"
                  >
                    Reset Password
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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