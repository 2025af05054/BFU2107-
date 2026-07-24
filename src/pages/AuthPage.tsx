import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Building2, Mail, Lock, User, Phone, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const AuthPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Get return URL from query params
  const searchParams = new URLSearchParams(window.location.search);
  const returnTo = searchParams.get('returnTo');
  const source = searchParams.get('source');

  // Redirect if already authenticated
  if (user) {
    if (returnTo) {
      navigate(returnTo);
    } else {
      navigate('/');
    }
    return null;
  }

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("signup-email") as string;
    const password = formData.get("signup-password") as string;
    const name = formData.get("signup-name") as string;
    const company = formData.get("signup-company") as string;
    const role = formData.get("signup-role") as string;

    const redirectUrl = returnTo 
      ? `${window.location.origin}${returnTo}` 
      : `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name,
          company,
          role: role || 'customer',
        }
      }
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage("✅ Registration successful! We've sent a verification link with OTP to your email. Please check your inbox and verify your email before signing in.");
    }
    setIsLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("signin-email") as string;
    const password = formData.get("signin-password") as string;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      // Redirect to return URL or home
      if (returnTo) {
        navigate(returnTo);
      } else {
        navigate('/');
      }
    }
    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError("");
    setMessage("");

    console.log('Starting Google OAuth with redirect to:', `${window.location.origin}/`);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`
      }
    });

    if (error) {
      console.error('Google OAuth error:', error);
      setError(error.message);
      setIsLoading(false);
    } else {
      console.log('Google OAuth initiated successfully:', data);
      // Don't set loading to false here as user will be redirected
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">ConnectTrade</span>
            </div>
            <div className="text-sm text-muted-foreground">
              India's Leading B2B Marketplace
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Left Side - Benefits */}
          <div className="hidden lg:flex flex-col justify-center space-y-6">
            <div>
              <h1 className="text-4xl font-bold mb-4">
                {isSignUp ? 'Join ConnectTrade Today' : 'Welcome Back'}
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                {isSignUp 
                  ? 'Connect with verified suppliers and buyers across India' 
                  : 'Sign in to manage your business operations'}
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Verified Businesses</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect with authenticated suppliers and buyers
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Wide Product Range</h3>
                  <p className="text-sm text-muted-foreground">
                    Access thousands of products and services
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Easy RFQ Management</h3>
                  <p className="text-sm text-muted-foreground">
                    Submit and track your quotes efficiently
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <Card className="shadow-card">
            <CardContent className="pt-6">
              {/* Toggle Buttons */}
              <div className="grid grid-cols-2 gap-2 mb-6 p-1 bg-muted rounded-lg">
                <Button
                  type="button"
                  variant={!isSignUp ? "default" : "ghost"}
                  className="w-full"
                  onClick={() => {
                    setIsSignUp(false);
                    setError("");
                    setMessage("");
                  }}
                >
                  Sign In
                </Button>
                <Button
                  type="button"
                  variant={isSignUp ? "default" : "ghost"}
                  className="w-full"
                  onClick={() => {
                    setIsSignUp(true);
                    setError("");
                    setMessage("");
                  }}
                >
                  Sign Up
                </Button>
              </div>

              {error && (
                <Alert className="mb-4" variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {message && (
                <Alert className="mb-4">
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}

              {/* Sign In Form */}
              {!isSignUp && (
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email Address *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-email"
                        name="signin-email"
                        type="email"
                        placeholder="your.email@company.com"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-password"
                        name="signin-password"
                        type="password"
                        placeholder="Enter your password"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In to Your Account
                  </Button>
                  
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or continue with
                      </span>
                    </div>
                  </div>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full" 
                    disabled={isLoading}
                    onClick={handleGoogleSignIn}
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Sign in with Google
                  </Button>
                </form>
              )}

              {/* Sign Up Form */}
              {isSignUp && (
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-name"
                          name="signup-name"
                          type="text"
                          placeholder="John Doe"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-mobile">Mobile Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-mobile"
                          name="signup-mobile"
                          type="tel"
                          placeholder="+91 98765 43210"
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Business Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        name="signup-email"
                        type="email"
                        placeholder="your.email@company.com"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-company">Company Name *</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-company"
                        name="signup-company"
                        type="text"
                        placeholder="Your Company Pvt Ltd"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-role">Business Type *</Label>
                    <Select name="signup-role" defaultValue="customer">
                      <SelectTrigger>
                        <SelectValue placeholder="Select your business type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="customer">Buyer / Procurement</SelectItem>
                        <SelectItem value="supplier">Supplier / Manufacturer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        name="signup-password"
                        type="password"
                        placeholder="Minimum 6 characters"
                        className="pl-10"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox 
                      id="terms" 
                      checked={agreedToTerms}
                      onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                    />
                    <label
                      htmlFor="terms"
                      className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      I agree to ConnectTrade's{" "}
                      <span className="text-primary underline cursor-pointer">Terms & Conditions</span>
                      {" "}and{" "}
                      <span className="text-primary underline cursor-pointer">Privacy Policy</span>
                    </label>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading || !agreedToTerms}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Free Account
                  </Button>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or sign up with
                      </span>
                    </div>
                  </div>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full" 
                    disabled={isLoading}
                    onClick={handleGoogleSignIn}
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Sign up with Google
                  </Button>
                </form>
              )}

              {/* Footer Text */}
              <p className="text-xs text-center text-muted-foreground mt-6">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{" "}
                <button
                  type="button"
                  className="text-primary font-semibold hover:underline"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError("");
                    setMessage("");
                  }}
                >
                  {isSignUp ? 'Sign In' : 'Sign Up Now'}
                </button>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;