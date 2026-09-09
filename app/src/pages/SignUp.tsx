import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";

function friendlyError(code?: string): string {
  switch (code) {
    case "auth/email-already-in-use":
      return "An account with this email already exists. Try signing in instead.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/operation-not-allowed":
      return "Email/password sign-up is not enabled. Enable it in Firebase Console → Authentication → Sign-in method → Email/Password.";
    default:
      return "Sign-up failed. Please try again.";
  }
}

export default function SignUp() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password || !name.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name.trim() });
      await setDoc(
        doc(db, "users", cred.user.uid),
        { name: name.trim(), email, loginAt: serverTimestamp(), role: "user" },
        { merge: true }
      );
      toast.success("Account created! Welcome to Civic Lens.");
      navigate("/", { replace: true });
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      setError(friendlyError(code));
    } finally {
      setLoading(false);
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
          <h2 className="text-xl font-semibold text-foreground">Create Account</h2>
          <p className="text-sm text-muted-foreground">Join Civic Lens to report and track issues</p>
        </div>

        {error && (
          <Alert variant="destructive" className="text-left">
            <AlertTitle>Sign-up failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">Full Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

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
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
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
                Creating account…
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
        </p>

        <p className="text-center text-xs text-muted-foreground">
          By continuing you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
