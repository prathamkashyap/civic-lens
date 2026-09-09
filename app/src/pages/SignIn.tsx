import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";

function friendlyError(code?: string): string {
  switch (code) {
    case "auth/user-not-found":
      return "No account found with this email. Please sign up first.";
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Invalid email or password. Please try again.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please try again later.";
    default:
      return "Sign-in failed. Please try again.";
  }
}

export default function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Welcome back!");
      navigate("/", { replace: true });
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      setError(friendlyError(code));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError("Enter your email above first, then click Forgot password.");
      return;
    }
    setResetting(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
      toast.success("Password reset email sent. Check your inbox.");
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      setError(friendlyError(code));
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
          <circle cx="20%" cy="20%" r="60" fill="rgba(255,255,255,0.15)">
            <animate attributeName="r" values="60;80;60" dur="10s" repeatCount="indefinite" />
          </circle>
          <circle cx="80%" cy="80%" r="70" fill="rgba(255,255,255,0.12)">
            <animate attributeName="r" values="70;90;70" dur="12s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>

      <div className="relative flex w-full max-w-md flex-col items-center gap-6 rounded-2xl border border-border/70 bg-card/85 p-10 shadow-xl backdrop-blur-md">
        <div className="absolute left-6 top-6">
          <Link to="/login" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>

        <div className="flex flex-col items-center gap-2 mt-6">
          <div className="urban-gradient flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold text-white">CL</div>
          <h2 className="text-xl font-semibold text-foreground">Welcome Back</h2>
          <p className="text-sm text-muted-foreground">Sign in to your Civic Lens account</p>
        </div>

        {error && (
          <Alert variant="destructive" className="text-left">
            <AlertTitle>Sign-in failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {resetSent && (
          <Alert className="text-left border-green-500/50 bg-green-500/10">
            <AlertTitle>Check your inbox</AlertTitle>
            <AlertDescription>We sent a password reset link to {email}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="password" className="text-sm font-medium text-foreground">Password</label>
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={resetting}
                className="text-xs text-primary hover:underline"
              >
                {resetting ? "Sending…" : resetSent ? "Sent!" : "Forgot password?"}
              </button>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 pr-10 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="h-11 w-full gap-2">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in…
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="font-medium text-primary hover:underline">Create one</Link>
        </p>

        <p className="text-center text-xs text-muted-foreground">
          By continuing you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
