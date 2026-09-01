import { ReactNode } from "react";
import { motion } from "framer-motion";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-0 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      {/* Sidebar Placeholder */}
      <aside className="fixed left-0 top-0 h-screen w-64 border-r border-zinc-800 bg-zinc-900/70 backdrop-blur-xl">
        <div className="flex h-16 items-center border-b border-zinc-800 px-6">
          <h1 className="text-xl font-semibold tracking-tight text-white">
            Civic Lens
          </h1>
        </div>

        <nav className="space-y-2 p-4">
          {["Dashboard", "Reports", "Analytics", "Admin", "Settings"].map(
            (item) => (
              <button
                key={item}
                className="w-full rounded-xl px-4 py-3 text-left text-zinc-300 transition-all hover:bg-zinc-800 hover:text-white"
              >
                {item}
              </button>
            )
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="ml-64">
        {/* Topbar */}
        <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-950/70 px-6 backdrop-blur-xl">
          <div>
            <h2 className="text-lg font-medium text-white">
              Civic Intelligence Dashboard
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <button className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-300 transition hover:border-zinc-500 hover:text-white">
              Search
            </button>

            <div className="h-10 w-10 rounded-full bg-zinc-800" />
          </div>
        </header>

        {/* Animated Page Content */}
        <motion.main
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-6"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
};

export default MainLayout;