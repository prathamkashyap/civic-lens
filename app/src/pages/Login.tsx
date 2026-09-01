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
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{
        background: `radial-gradient(circle at top left, #a8edea, #fed6e3),
                     radial-gradient(circle at bottom right, #f9f586, #a1c4fd)`,
      }}
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

      <div className="relative p-10 rounded-lg shadow-xl bg-white bg-opacity-90 backdrop-blur-md w-full max-w-md flex flex-col items-center gap-6">
        <div className="absolute top-6 left-6 flex items-center gap-2">
          <div className="w-10 h-10 bg-urban-primary rounded-full flex items-center justify-center text-white font-bold text-lg select-none">
            CQ
          </div>
          <span className="font-bold text-lg text-gray-900 select-none">Civic Lens</span>
        </div>

        <Lottie animationData={loginAnimation} loop style={{ width: 150, height: 150 }} />

        <h2 className="text-xl font-semibold text-center text-gray-900">
          Continue with Google
        </h2>

        <button
          onClick={handleFirebaseLogin}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
        >
          Continue with Google
        </button>
      </div>
    </div>
  );
}
