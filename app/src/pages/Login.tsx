// src/pages/Login.tsx
import { useNavigate } from "react-router-dom";
import Lottie from "lottie-react";
import loginAnimation from "../assets/login-animation.json";
import { db, auth, provider } from "../firebaseConfig";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { signInWithPopup } from "firebase/auth";

export default function Login() {
  const navigate = useNavigate();

  const handleFirebaseLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      await setDoc(doc(db, "users", user.uid), {
        name: user.displayName,
        email: user.email,
        loginAt: serverTimestamp(),
      }, { merge: true });

      navigate("/");

    } catch (err) {
      console.error("Firebase Auth login failed:", err);
    }
  };

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <svg
          className="w-full h-full"
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
        <div className="absolute top-6 left-6 flex items-center gap-2">
          <div className="urban-gradient flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold text-white select-none">
            CL
          </div>
          <span className="text-lg font-bold text-foreground select-none">Civic Lens</span>
        </div>

        <Lottie animationData={loginAnimation} loop style={{ width: 150, height: 150 }} />

        <h2 className="text-center text-xl font-semibold text-foreground">
          Continue with Google
        </h2>

        <button
          onClick={handleFirebaseLogin}
          className="h-11 rounded-md px-6"
        >
          Continue with Google
        </button>
      </div>
    </div>
  );
}
