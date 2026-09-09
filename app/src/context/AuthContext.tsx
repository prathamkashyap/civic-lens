import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../firebaseConfig";

interface AuthCtx {
  user: User | null;
  isGuest: boolean;
  loading: boolean;
  setGuest: (v: boolean) => void;
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  isGuest: false,
  loading: true,
  setGuest: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState(() => {
    return localStorage.getItem("civiclens_guest") === "true";
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (u) {
        setIsGuest(false);
        localStorage.removeItem("civiclens_guest");
      }
    });
    return unsub;
  }, []);

  const setGuest = (v: boolean) => {
    setIsGuest(v);
    if (v) localStorage.setItem("civiclens_guest", "true");
    else localStorage.removeItem("civiclens_guest");
  };

  return (
    <AuthContext.Provider value={{ user, isGuest, loading, setGuest }}>
      {children}
    </AuthContext.Provider>
  );
}
