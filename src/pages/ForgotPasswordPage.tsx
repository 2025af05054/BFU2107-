import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const ForgotPasswordPage = () => {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const { error } = await sendPasswordReset(email.trim());

    if (error && error.toLowerCase().includes("rate limit")) {
      setError("Too many requests. Please wait a minute before trying again.");
    } else {
      // Show a generic success message regardless of whether the email exists,
      // so we don't leak which emails are registered.
      setSent(true);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/40 to-accent/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md rounded-3xl shadow-hover border-0">
        <CardContent className="p-8 sm:p-10">
          <Link to="/auth" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-3 w-3" /> Back to sign in
          </Link>

          <h1 className="text-2xl font-bold mb-1">Reset your password</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Enter the email associated with your account and we'll send you a link to reset your password.
          </p>

          {error && (
            <Alert className="mb-4" variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {sent ? (
            <Alert className="mb-2">
              <AlertDescription>
                If an account exists for <strong>{email}</strong>, we've sent a password reset link to it. Check your inbox (and spam folder).
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@company.com"
                    className="pl-10 h-11 rounded-xl"
                    required
                  />
                </div>
              </div>

              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Reset Link
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;
