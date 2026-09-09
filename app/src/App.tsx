import { lazy, Suspense, useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { TooltipProvider } from "./components/ui/tooltip";
import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";

// Pages load on demand
const ReportMapView = lazy(() => import("./pages/ReportMapView"));
const Index = lazy(() => import("./pages/Index"));
const Report = lazy(() => import("./pages/Report"));
const Reports = lazy(() => import("./pages/Reports"));
const ReportDetail = lazy(() => import("./pages/ReportDetail"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const Login = lazy(() => import("./pages/Login"));
const SignIn = lazy(() => import("./pages/SignIn"));
const SignUp = lazy(() => import("./pages/SignUp"));
const Admin = lazy(() => import("./pages/Admin"));

// Components
import PageTransition from "./components/PageTransition";
import { ErrorBoundary } from "./components/ErrorBoundary";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, isGuest, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" replace />;
};

const GuestOrUserRoute = ({ children }: { children: JSX.Element }) => {
  const { user, isGuest, loading } = useAuth();
  if (loading) return null;
  return user || isGuest ? children : <Navigate to="/login" replace />;
};

const AuthOnlyRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" replace />;
};

const RouteFallback = () => (
  <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8" role="status">
    <div className="flex w-full max-w-md flex-col gap-3">
      <div className="h-8 w-48 rounded bg-muted animate-pulse" />
      <div className="h-4 w-full rounded bg-muted animate-pulse" />
      <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
      <div className="mt-4 h-32 w-full rounded-lg bg-muted animate-pulse" />
      <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
    </div>
    <span className="sr-only">Loading Civic Lens…</span>
  </div>
);

const AppRoutes = () => {
  const location = useLocation();
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    setTransitioning(true);
    const timeout = setTimeout(() => setTransitioning(false), 350);
    return () => clearTimeout(timeout);
  }, [location.pathname]);

  return (
    <>
      {transitioning && <PageTransition />}
      <Suspense fallback={<RouteFallback />}>
        <Routes location={location}>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Info Pages (public) */}
          <Route path="/help-center" element={<HelpCenter />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/report/:id/map" element={<ReportMapView />} />

          {/* Guest-accessible routes */}
          <Route path="/" element={<GuestOrUserRoute><Index /></GuestOrUserRoute>} />
          <Route path="/reports" element={<GuestOrUserRoute><Reports /></GuestOrUserRoute>} />
          <Route path="/reports/:id" element={<GuestOrUserRoute><ReportDetail /></GuestOrUserRoute>} />
          <Route path="/dashboard" element={<GuestOrUserRoute><Dashboard /></GuestOrUserRoute>} />
          <Route path="/map" element={<GuestOrUserRoute><ReportMapView /></GuestOrUserRoute>} />

          {/* Auth-required routes */}
          <Route path="/report" element={<AuthOnlyRoute><Report /></AuthOnlyRoute>} />
          <Route path="/admin" element={<AuthOnlyRoute><Admin /></AuthOnlyRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter basename="/">
            <AuthProvider>
              <div className="flex min-h-screen flex-col bg-muted/20">
                <main className="flex-grow">
                  <AppRoutes />
                </main>
              </div>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
