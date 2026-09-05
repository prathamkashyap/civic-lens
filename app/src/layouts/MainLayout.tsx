import { ReactNode, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, FileText, LayoutDashboard, Map, Menu, Settings, ShieldCheck } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const location = useLocation();
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const navigation = [
    { label: "Overview", path: "/dashboard", icon: LayoutDashboard },
    { label: "Reports", path: "/reports", icon: FileText },
    { label: "Map", path: "/map", icon: Map },
    { label: "Analytics", path: "/dashboard", icon: BarChart3 },
    { label: "Admin", path: "/admin", icon: ShieldCheck },
    { label: "Settings", path: "/help-center", icon: Settings },
  ];
  const pageTitle = location.pathname.startsWith("/reports")
    ? location.pathname !== "/reports" ? "Report details" : "Reports workspace"
    : location.pathname.startsWith("/map") || location.pathname.endsWith("/map")
      ? "Civic map"
        : location.pathname.startsWith("/admin")
          ? "Admin overview"
      : "Dashboard overview";

  const renderNavigation = (mobile = false) => navigation.map(({ label, path, icon: Icon }) => {
    const active = location.pathname === path && label !== "Analytics";
    return (
      <Link
        key={label}
        to={path}
        onClick={() => mobile && setMobileNavigationOpen(false)}
        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
          active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
      >
        <Icon className="h-4 w-4" />
        {label}
      </Link>
    );
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-0 top-0 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-accent/5 blur-3xl" />
      </div>

      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-border/70 bg-card/75 backdrop-blur-xl md:block">
        <div className="flex h-16 items-center border-b border-border/70 px-6">
          <Link to="/" className="flex items-center gap-3">
            <span className="urban-gradient flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white">CL</span>
            <span className="font-semibold tracking-tight">Civic Lens</span>
          </Link>
        </div>

        <nav className="space-y-1 p-4">
          <p className="px-3 pb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Workspace</p>
          {renderNavigation()}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="md:ml-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/70 bg-background/80 px-4 backdrop-blur-xl md:px-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open navigation" onClick={() => setMobileNavigationOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Civic intelligence</p>
              <h2 className="text-lg font-semibold">{pageTitle}</h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </header>

        {/* Animated Page Content */}
        <motion.main
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-4 md:p-8"
        >
          {children}
        </motion.main>
      </div>

      <Sheet open={mobileNavigationOpen} onOpenChange={setMobileNavigationOpen}>
        <SheetContent side="left" className="w-[min(19rem,85vw)] bg-card px-4">
          <SheetTitle className="mb-8 flex items-center gap-3 px-2 pt-2">
            <span className="urban-gradient flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white">CL</span>
            Civic Lens
          </SheetTitle>
          <nav className="space-y-1">
            <p className="px-3 pb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Workspace</p>
            {renderNavigation(true)}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default MainLayout;