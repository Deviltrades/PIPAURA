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
import { PipAuraLogo } from "@/components/PipAuraLogo";
import { supabase } from "@/lib/supabase";

const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);

  // Handle the password reset token from the URL
  useEffect(() => {
    const verifyResetToken = async () => {
      // Check for hash parameters from email link
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const access_token = hashParams.get('access_token');
      const type = hashParams.get('type');

      if (access_token && type === 'recovery') {
        try {
          // Verify the session is valid
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token: hashParams.get('refresh_token') || '',
          });

          if (error) throw error;

          setIsValidToken(true);
          // Clear the hash from URL
          window.history.replaceState(null, '', window.location.pathname);
        } catch (error: any) {
          console.error('Token verification error:', error);
          toast({
            title: "Invalid or expired link",
            description: "Please request a new password reset link",
            variant: "destructive",
          });
          setTimeout(() => setLocation('/'), 3000);
        }
      } else {
        toast({
          title: "No reset token found",
          description: "Please use the link from your email",
          variant: "destructive",
        });
        setTimeout(() => setLocation('/'), 3000);
      }
      setIsVerifying(false);
    };

    verifyResetToken();
  }, [toast, setLocation]);

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) throw error;

      toast({
        title: "Password updated!",
        description: "Your password has been successfully reset",
      });

      // Redirect to main page after successful reset
      setTimeout(() => {
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

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/30 to-slate-950 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/30 to-slate-950 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-slate-400">Redirecting...</p>
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

        {/* Reset Password Card */}
        <Card className="bg-slate-900/50 border-slate-700 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <h1 className="text-2xl font-bold text-white">Reset Password</h1>
            <p className="text-slate-400 text-sm mt-2">Enter your new password</p>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
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
                  control={form.control}
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
