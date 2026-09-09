// src/pages/Login.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Lottie from "lottie-react";
import loginAnimation from "../assets/login-animation.json";
import { db, auth, provider } from "../firebaseConfig";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
} from "firebase/auth";
import { toast } from "sonner";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";

function friendlyAuthError(code?: string, fallback?: string): string {
  switch (code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "The Google sign-in popup was closed before completing. Please try again.";
    case "auth/popup-blocked":
      return "Your browser blocked the Google sign-in popup. Allow popups for this site, or continue — we'll try a full-page redirect instead.";
    case "auth/unauthorized-domain":
      return "This domain is not authorized for Firebase Auth. Add it under Firebase Console → Authentication → Settings → Authorized domains.";
    case "auth/operation-not-allowed":
      return "Google sign-in is not enabled. Enable it in Firebase Console → Authentication → Sign-in method → Google.";
    case "auth/network-request-failed":
      return "Network error while contacting Google. Check your connection and try again.";
    case "auth/invalid-api-key":
    case "auth/configuration-not-found":
      return "Firebase config is missing or invalid (API key / authDomain). Check your .env / Vercel environment variables.";
    case "auth/account-exists-with-different-credential":
      return "An account already exists with this email using a different sign-in method.";
    default:
      return fallback || "Google sign-in failed. Please try again.";
  }
}

async function syncUserProfile(uid: string, name: string | null, email: string | null) {
  // Non-fatal: a Firestore rules/offline hiccup must never strand a
  // successfully-authenticated user on the login page.
  try {
    await setDoc(
      doc(db, "users", uid),
      { name, email, loginAt: serverTimestamp() },
      { merge: true }
    );
  } catch (e) {
    console.warn("User profile sync failed (non-fatal):", e);
    toast.warning("Signed in, but profile sync failed. You can still continue.");
  }
}

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [resolvingRedirect, setResolvingRedirect] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // If already signed in (or returning from signInWithRedirect), go home.
  useEffect(() => {
    let cancelled = false;
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!cancelled && user && !loading) navigate("/", { replace: true });
    });
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user && !cancelled) {
          await syncUserProfile(
            result.user.uid,
            result.user.displayName,
            result.user.email
          );
          navigate("/", { replace: true });
        }
      })
      .catch((err) => {
        console.error("Redirect sign-in failed:", err);
        if (!cancelled) setError(friendlyAuthError(err?.code, err?.message));
      })
      .finally(() => {
        if (!cancelled) setResolvingRedirect(false);
      });
    return () => {
      cancelled = true;
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFirebaseLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      await syncUserProfile(
        result.user.uid,
        result.user.displayName,
        result.user.email
      );
      toast.success("Signed in with Google");
      navigate("/");
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      const message = (err as { message?: string })?.message;
      console.error("Firebase Auth login failed:", err);

      // User dismissed the popup — not an error worth alarming them with.
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        setLoading(false);
        return;
      }

      // Popup blocked / COOP issues (common in Safari, Brave, embedded
      // webviews): fall back to a full-page redirect which always works.
      if (code === "auth/popup-blocked" || code === "auth/popup-window-blocked") {
        toast.info("Popup blocked — redirecting to Google instead…");
        try {
          await signInWithRedirect(auth, provider);
          return; // page will navigate away; result handled above on return
        } catch (redirectErr: unknown) {
          const rCode = (redirectErr as { code?: string })?.code;
          const rMsg = (redirectErr as { message?: string })?.message;
          setError(friendlyAuthError(rCode, rMsg));
        }
      } else {
        setError(friendlyAuthError(code, message));
      }
    } finally {
      setLoading(false);
    }
  };

  const busy = loading || resolvingRedirect;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <svg
          className="h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid meet"
        >
          <circle cx="20%" cy="20%" r="60" fill="rgba(255,255,255,0.15)">
            <animate attributeName="r" values="60;80;60" dur="10s" repeatCount="indefinite" />
          </circle>
          <circle cx="80%" cy="80%" r="70" fill="rgba(255,255,255,0.12)">
            <animate attributeName="r" values="70;90;70" dur="12s" repeatCount="indefinite" />
          </circle>
          <circle cx="50%" cy="50%" r="50" fill="rgba(255,255,255,0.1)">
            <animate attributeName="r" values="50;65;50" dur="14s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>

      <div className="relative flex w-full max-w-md flex-col items-center gap-6 rounded-2xl border border-border/70 bg-card/85 p-10 shadow-xl backdrop-blur-md">
        <div className="absolute left-6 top-6 flex items-center gap-2">
          <div className="urban-gradient flex h-10 w-10 select-none items-center justify-center rounded-xl text-lg font-bold text-white">
            CL
          </div>
          <span className="select-none text-lg font-bold text-foreground">Civic Lens</span>
        </div>

        <Lottie animationData={loginAnimation} loop style={{ width: 150, height: 150 }} />

        <h2 className="text-center text-xl font-semibold text-foreground">
          Continue with Google
        </h2>

        {error && (
          <Alert variant="destructive" className="text-left">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Sign-in failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleFirebaseLogin}
          disabled={busy}
          size="lg"
          className="h-11 w-full gap-2"
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {resolvingRedirect ? "Checking session…" : "Signing in…"}
            </>
          ) : (
            <>
              <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M21.35 11.1H12v2.9h5.35c-.5 2.4-2.55 3.5-5.35 3.5a5.9 5.9 0 1 1 0-11.8c1.5 0 2.85.55 3.9 1.45l2.1-2.1A8.9 8.9 0 1 0 12 20.9c4.6 0 8.4-3.2 8.4-8.9 0-.3 0-.6-.05-.9Z"
                />
              </svg>
              Continue with Google
            </>
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          By continuing you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
