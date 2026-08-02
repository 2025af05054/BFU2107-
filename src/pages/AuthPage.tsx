import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Loader2,
  Building2,
  Mail,
  Lock,
  User,
  Phone,
  Shield,
  ShoppingBag,
  Factory,
  MapPin,
  FileText,
  ArrowLeft,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

type Step = "signin" | "details" | "verify";
type Role = "customer" | "supplier";

const MAX_SIGNIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60_000;

const attemptsKey = (email: string) => `signin_attempts_${email.trim().toLowerCase()}`;

const getFailedAttempts = (email: string): { count: number; lockoutUntil: number } => {
  try {
    const raw = sessionStorage.getItem(attemptsKey(email));
    if (!raw) return { count: 0, lockoutUntil: 0 };
    return JSON.parse(raw);
  } catch {
    return { count: 0, lockoutUntil: 0 };
  }
};

const setFailedAttempts = (email: string, data: { count: number; lockoutUntil: number }) => {
  sessionStorage.setItem(attemptsKey(email), JSON.stringify(data));
};

const clearFailedAttempts = (email: string) => {
  sessionStorage.removeItem(attemptsKey(email));
};

const friendlyAuthError = (message: string): string => {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials")) {
    return "Incorrect email or password. Please try again.";
  }
  if (lower.includes("email not confirmed")) {
    return "Please verify your email before signing in. Check your inbox for the verification code.";
  }
  if (lower.includes("user already registered") || lower.includes("already been registered")) {
    return "An account with this email already exists. Please sign in instead, or use \"Forgot password?\" if you don't remember your password.";
  }
  if (lower.includes("rate limit") || lower.includes("too many")) {
    return "Too many attempts. Please wait a moment before trying again.";
  }
  return message;
};

const AuthPage = () => {
  const [step, setStep] = useState<Step>("signin");
  const [role, setRole] = useState<Role>("customer");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState(0);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const navigate = useNavigate();
  const { user, signUpWithDetails, verifySignupOtp, resendOtp, signInWithPassword } = useAuth();

  const searchParams = new URLSearchParams(window.location.search);
  const returnTo = searchParams.get('returnTo');

  useEffect(() => {
    if (user) {
      navigate(returnTo || '/');
    }
  }, [user, returnTo, navigate]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  useEffect(() => {
    if (lockoutUntil <= Date.now()) {
      setLockoutRemaining(0);
      return;
    }
    const tick = () => setLockoutRemaining(Math.max(0, Math.ceil((lockoutUntil - Date.now()) / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [lockoutUntil]);

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setIsLoading(false);
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  if (user) {
    return null;
  }

  const resetMessages = () => {
    setError("");
    setMessage("");
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    resetMessages();

    const formData = new FormData(e.currentTarget);
    const email = (formData.get("signin-email") as string).trim();
    const password = formData.get("signin-password") as string;

    const { count, lockoutUntil: existingLockout } = getFailedAttempts(email);
    if (existingLockout > Date.now()) {
      setLockoutUntil(existingLockout);
      setError(`Too many failed attempts. Please try again in ${Math.ceil((existingLockout - Date.now()) / 1000)}s.`);
      return;
    }

    setIsLoading(true);
    const { error } = await signInWithPassword(email, password);

    if (error) {
      const nextCount = count + 1;
      if (nextCount >= MAX_SIGNIN_ATTEMPTS) {
        const until = Date.now() + LOCKOUT_DURATION_MS;
        setFailedAttempts(email, { count: 0, lockoutUntil: until });
        setLockoutUntil(until);
        setError(`Too many failed attempts. Your account sign-in is temporarily locked for ${LOCKOUT_DURATION_MS / 1000}s for security.`);
      } else {
        setFailedAttempts(email, { count: nextCount, lockoutUntil: 0 });
        const remaining = MAX_SIGNIN_ATTEMPTS - nextCount;
        setError(`${friendlyAuthError(error)} (${remaining} attempt${remaining === 1 ? "" : "s"} remaining)`);
      }
    } else {
      clearFailedAttempts(email);
      navigate(returnTo || '/');
    }
    setIsLoading(false);
  };

  const handleDetailsSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    resetMessages();

    const formData = new FormData(e.currentTarget);
    const email = (formData.get("signup-email") as string).trim();
    const password = formData.get("signup-password") as string;
    const name = (formData.get("signup-name") as string).trim();
    const mobile = (formData.get("signup-mobile") as string).trim();
    const company = (formData.get("signup-company") as string).trim();
    const address = (formData.get("signup-address") as string).trim();
    const gst = ((formData.get("signup-gst") as string | null) ?? "").trim();

    const emailPattern = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    const mobilePattern = /^(\+91[\s-]?)?[6-9]\d{9}$/;
    const gstPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

    if (!emailPattern.test(email)) {
      setError("Please enter a valid business email address.");
      setIsLoading(false);
      return;
    }

    if (!mobilePattern.test(mobile)) {
      setError("Please enter a valid 10-digit mobile number (e.g. +91 98765 43210).");
      setIsLoading(false);
      return;
    }

    if (company.length < 2) {
      setError("Please enter a valid company name.");
      setIsLoading(false);
      return;
    }

    if (address.length < 10) {
      setError("Please enter a complete address (street, city, state, PIN).");
      setIsLoading(false);
      return;
    }

    if (role === "supplier" && !gstPattern.test(gst.toUpperCase())) {
      setError("Please enter a valid GST number (e.g. 22AAAAA0000A1Z5).");
      setIsLoading(false);
      return;
    }

    const { error } = await signUpWithDetails({
      email,
      password,
      name,
      company,
      mobile,
      address,
      gst: role === 'supplier' ? gst : undefined,
      role,
    });

    const isEmailDeliveryFailure = error?.toLowerCase().includes('confirmation email') || error?.toLowerCase().includes('sending email');

    if (error && !isEmailDeliveryFailure) {
      setError(friendlyAuthError(error));
      setIsLoading(false);
      return;
    }

    if (isEmailDeliveryFailure) {
      setMessage("Your account details were saved, but we couldn't send the verification email right now. If you have a code (e.g. from an admin), enter it below.");
    }

    setPendingEmail(email);
    setStep("verify");
    setResendCooldown(60);
    setIsLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    resetMessages();

    const { error } = await verifySignupOtp(pendingEmail, otp);

    if (error) {
      setError(error.toLowerCase().includes("expired") || error.toLowerCase().includes("invalid")
        ? "That code is invalid or has expired. Please request a new one."
        : friendlyAuthError(error));
      setIsLoading(false);
      return;
    }

    navigate(returnTo || '/');
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    resetMessages();
    const { error } = await resendOtp(pendingEmail);
    if (error) {
      setError(error);
    } else {
      setMessage("A new code has been sent to your email.");
      setResendCooldown(60);
    }
  };

  const stepTitle =
    step === "signin"
      ? "Welcome Back"
      : step === "details"
      ? "Create your business account"
      : "Verify your email";

  const stepSubtitle =
    step === "signin"
      ? "Sign in to manage your business operations"
      : step === "details"
      ? "Connect with verified suppliers and buyers across India"
      : `Enter the 8-digit code we sent to ${pendingEmail}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/40 to-accent/10 relative overflow-hidden">
      {/* Decorative glows */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full gradient-gold blur-3xl opacity-20" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full gradient-hero blur-3xl opacity-20" />

      {/* Header */}
      <div className="relative border-b border-card-border bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 rounded-lg flex items-center justify-center shadow-glow border-2 border-amber-300/50 sparkle-gold">
                <span className="text-black font-bold text-lg drop-shadow-sm">BFU</span>
              </div>
              <div className="leading-tight">
                <div className="text-lg font-bold text-foreground">BUY FOR US</div>
                <div className="text-[11px] text-muted-foreground">Smart Sourcing Solutions</div>
              </div>
            </Link>
            <div className="hidden sm:block text-sm font-medium text-muted-foreground">
              India's Leading B2B Marketplace
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative container mx-auto px-4 py-10 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-0 max-w-5xl mx-auto rounded-3xl overflow-hidden shadow-hover">
          {/* Left Side - Gold hero panel */}
          <div className="hidden lg:flex flex-col justify-center gap-8 p-10 gradient-gold text-black relative overflow-hidden">
            <div className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-white/20 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-black/10 blur-2xl" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full bg-black/10 px-3 py-1 text-xs font-semibold mb-6">
                <Shield className="h-3.5 w-3.5" /> Trusted by 1000+ businesses
              </div>
              <h1 className="text-3xl xl:text-4xl font-extrabold mb-3 leading-tight">{stepTitle}</h1>
              <p className="text-black/80 font-medium">{stepSubtitle}</p>
            </div>

            <div className="relative space-y-4">
              <div className="flex items-start gap-3 bg-white/30 backdrop-blur-sm rounded-xl p-3 border border-white/40">
                <div className="rounded-full bg-black/10 p-2">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold mb-0.5">Verified Businesses</h3>
                  <p className="text-sm text-black/70">
                    Connect with authenticated suppliers and buyers
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white/30 backdrop-blur-sm rounded-xl p-3 border border-white/40">
                <div className="rounded-full bg-black/10 p-2">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold mb-0.5">Wide Product Range</h3>
                  <p className="text-sm text-black/70">
                    Access thousands of products and services
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white/30 backdrop-blur-sm rounded-xl p-3 border border-white/40">
                <div className="rounded-full bg-black/10 p-2">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold mb-0.5">Easy RFQ Management</h3>
                  <p className="text-sm text-black/70">
                    Submit and track your quotes efficiently
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <Card className="rounded-none lg:rounded-r-3xl border-0 shadow-none bg-card">
            <CardContent className="p-6 sm:p-10">
              {/* Mobile-only heading */}
              <div className="lg:hidden mb-6">
                <h1 className="text-2xl font-bold mb-1">{stepTitle}</h1>
                <p className="text-sm text-muted-foreground">{stepSubtitle}</p>
              </div>

              {step !== "signin" && (
                <div className="flex items-center gap-2 mb-6 text-xs font-semibold text-muted-foreground">
                  <span className={cn("flex items-center gap-1.5", step === "details" && "text-amber-600")}>
                    <span className={cn("h-5 w-5 rounded-full flex items-center justify-center text-[10px]", step === "details" ? "gradient-gold text-black" : "bg-muted")}>1</span>
                    Your details
                  </span>
                  <span className="flex-1 h-px bg-border" />
                  <span className={cn("flex items-center gap-1.5", step === "verify" && "text-amber-600")}>
                    <span className={cn("h-5 w-5 rounded-full flex items-center justify-center text-[10px]", step === "verify" ? "gradient-gold text-black" : "bg-muted")}>2</span>
                    Verify email
                  </span>
                </div>
              )}

              {step === "signin" && (
                <div className="grid grid-cols-2 gap-1.5 mb-8 p-1.5 bg-muted rounded-xl">
                  <Button type="button" className="w-full gradient-gold text-black hover:shadow-gold border-0 font-bold">
                    Sign In
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full font-semibold"
                    onClick={() => {
                      setStep("details");
                      resetMessages();
                    }}
                  >
                    Sign Up
                  </Button>
                </div>
              )}

              {step === "details" && (
                <div className="grid grid-cols-2 gap-1.5 mb-8 p-1.5 bg-muted rounded-xl">
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full font-semibold"
                    onClick={() => {
                      setStep("signin");
                      resetMessages();
                    }}
                  >
                    Sign In
                  </Button>
                  <Button type="button" className="w-full gradient-gold text-black hover:shadow-gold border-0 font-bold">
                    Sign Up
                  </Button>
                </div>
              )}

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
              {step === "signin" && (
                <form onSubmit={handleSignIn} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email Address *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-email"
                        name="signin-email"
                        type="email"
                        placeholder="your.email@company.com"
                        className="pl-10 h-11 rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="signin-password">Password *</Label>
                      <Link to="/forgot-password" className="text-xs font-semibold text-amber-600 hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-password"
                        name="signin-password"
                        type="password"
                        placeholder="Enter your password"
                        className="pl-10 h-11 rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isLoading || lockoutRemaining > 0}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {lockoutRemaining > 0 ? `Try again in ${lockoutRemaining}s` : "Sign In to Your Account"}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground mt-6">
                    Don't have an account?{" "}
                    <button
                      type="button"
                      className="text-amber-600 font-bold hover:underline"
                      onClick={() => {
                        setStep("details");
                        resetMessages();
                      }}
                    >
                      Sign Up Now
                    </button>
                  </p>
                </form>
              )}

              {/* Details (Sign Up step 1) */}
              {step === "details" && (
                <form onSubmit={handleDetailsSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>I am a *</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRole("customer")}
                        className={cn(
                          "flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-smooth",
                          role === "customer"
                            ? "border-amber-400 bg-amber-50 shadow-gold"
                            : "border-input hover:bg-muted"
                        )}
                      >
                        <ShoppingBag className={cn("h-6 w-6", role === "customer" ? "text-amber-600" : "text-muted-foreground")} />
                        <span className="text-sm font-semibold">Buyer</span>
                        <span className="text-xs text-muted-foreground">Procurement &amp; sourcing</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole("supplier")}
                        className={cn(
                          "flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-smooth",
                          role === "supplier"
                            ? "border-amber-400 bg-amber-50 shadow-gold"
                            : "border-input hover:bg-muted"
                        )}
                      >
                        <Factory className={cn("h-6 w-6", role === "supplier" ? "text-amber-600" : "text-muted-foreground")} />
                        <span className="text-sm font-semibold">Supplier</span>
                        <span className="text-xs text-muted-foreground">Manufacturer &amp; seller</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-name"
                          name="signup-name"
                          type="text"
                          placeholder="John Doe"
                          className="pl-10 h-11 rounded-xl"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-mobile">Mobile Number *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-mobile"
                          name="signup-mobile"
                          type="tel"
                          placeholder="+91 98765 43210"
                          className="pl-10 h-11 rounded-xl"
                          pattern="^(\+91[\s-]?)?[6-9]\d{9}$"
                          title="Enter a valid 10-digit mobile number"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Business Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        name="signup-email"
                        type="email"
                        placeholder="your.email@company.com"
                        className="pl-10 h-11 rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-company">Company Name *</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-company"
                        name="signup-company"
                        type="text"
                        placeholder="Your Company Pvt Ltd"
                        className="pl-10 h-11 rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-address">
                      {role === "supplier" ? "Business Address *" : "Delivery Address *"}
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-address"
                        name="signup-address"
                        type="text"
                        placeholder="Street, City, State, PIN"
                        className="pl-10 h-11 rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  {role === "supplier" && (
                    <div className="space-y-2">
                      <Label htmlFor="signup-gst">GST Number *</Label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-gst"
                          name="signup-gst"
                          type="text"
                          placeholder="22AAAAA0000A1Z5"
                          className="pl-10 h-11 rounded-xl uppercase"
                          pattern="^[0-9]{2}[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}[1-9A-Za-z]{1}Z[0-9A-Za-z]{1}$"
                          title="Enter a valid 15-character GST number"
                          maxLength={15}
                          required
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        name="signup-password"
                        type="password"
                        placeholder="Minimum 6 characters"
                        className="pl-10 h-11 rounded-xl"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 bg-muted/50 rounded-xl p-3">
                    <Checkbox
                      id="terms"
                      checked={agreedToTerms}
                      onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                    />
                    <label
                      htmlFor="terms"
                      className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      I agree to BUY FOR US's{" "}
                      <Link to="/terms" target="_blank" rel="noopener noreferrer" className="text-amber-600 font-semibold underline">Terms & Conditions</Link>
                      {" "}and{" "}
                      <Link to="/policy" target="_blank" rel="noopener noreferrer" className="text-amber-600 font-semibold underline">Privacy Policy</Link>
                    </label>
                  </div>

                  <Button
                    type="submit"
                    variant="hero"
                    size="lg"
                    className="w-full"
                    disabled={isLoading || !agreedToTerms}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Continue
                  </Button>

                  <p className="text-xs text-center text-muted-foreground mt-6">
                    Already have an account?{" "}
                    <button
                      type="button"
                      className="text-amber-600 font-bold hover:underline"
                      onClick={() => {
                        setStep("signin");
                        resetMessages();
                      }}
                    >
                      Sign In
                    </button>
                  </p>
                </form>
              )}

              {/* Verify (Sign Up step 2) */}
              {step === "verify" && (
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("details");
                      resetMessages();
                      setOtp("");
                    }}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="h-3 w-3" /> Change details
                  </button>

                  <div className="flex justify-center">
                    <InputOTP maxLength={8} value={otp} onChange={setOtp}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                        <InputOTPSlot index={6} />
                        <InputOTPSlot index={7} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isLoading || otp.length !== 8}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Verify &amp; Create Account
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    Didn't get a code?{" "}
                    <button
                      type="button"
                      className={cn(
                        "font-semibold hover:underline",
                        resendCooldown > 0 ? "text-muted-foreground cursor-not-allowed" : "text-amber-600"
                      )}
                      onClick={handleResend}
                      disabled={resendCooldown > 0}
                    >
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                    </button>
                  </p>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
