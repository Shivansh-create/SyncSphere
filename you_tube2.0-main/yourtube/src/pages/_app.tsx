import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "@/components/ui/sonner";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { UserProvider } from "../lib/AuthContext";
import { ThemeProvider, useTheme } from "next-themes";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

function ThemeEnforcer({ children }: { children: React.ReactNode }) {
  const { setTheme } = useTheme();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const enforceTheme = () => {
      const hour = new Date().getHours();
      // Strict rule: 10AM to 12PM (10:00 - 11:59) is light mode. Everything else is dark mode strictly.
      if (hour >= 10 && hour < 12) {
        setTheme("light");
      } else {
        setTheme("dark");
      }
      setLoading(false);
    };

    enforceTheme();
  }, [setTheme]);

  return <>{children}</>;
}

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isWatchParty = router.pathname.startsWith('/watchparty');

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <UserProvider>
        <ThemeEnforcer>
          {isWatchParty ? (
            /* Watch Party gets full screen */
            <div className="min-h-screen bg-[#0f0f0f] text-white">
              <Toaster />
              <Component {...pageProps} />
            </div>
          ) : (
            /* Standard Layout */
            <div className="min-h-screen bg-white dark:bg-[#0f0f0f] text-slate-900 dark:text-slate-100 transition-colors duration-300">
              <title>SyncSphere</title>
              <Header />
              <Toaster />
              <div className="flex h-[calc(100vh-56px)] overflow-hidden">
                <Sidebar />
                <div className="flex-1 overflow-y-auto">
                  <Component {...pageProps} />
                </div>
              </div>
            </div>
          )}
        </ThemeEnforcer>
      </UserProvider>
    </ThemeProvider>
  );
}
