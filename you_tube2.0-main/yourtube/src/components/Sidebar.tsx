import {
  Home,
  Compass,
  PlaySquare,
  Clock,
  ThumbsUp,
  History,
  User,
  MonitorPlay,
  Gem,
} from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import Channeldialogue from "./channeldialogue";
import { useUser } from "@/lib/AuthContext";
import { useRouter } from "next/router";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Compass, label: "Explore", path: "/explore" },
  { icon: PlaySquare, label: "Subscriptions", path: "/subscriptions" },
  { icon: MonitorPlay, label: "Watch Party", path: "/watchparty", accent: true },
];

const libraryItems = [
  { icon: History, label: "History", path: "/history" },
  { icon: ThumbsUp, label: "Liked videos", path: "/liked" },
  { icon: Clock, label: "Watch later", path: "/watch-later" },
];

const Sidebar = () => {
  const { user } = useUser();
  const router = useRouter();
  const [isdialogeopen, setisdialogeopen] = useState(false);

  const isActive = (path: string) => router.pathname === path;

  return (
    <aside className="w-64 bg-white dark:bg-[#0f0f0f] border-r border-gray-200 dark:border-white/10 h-[calc(100vh-56px)] overflow-y-auto scrollbar-none flex flex-col py-3 px-3 transition-colors duration-300">
      
      {/* Main Navigation */}
      <nav className="space-y-1">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link 
              key={item.path} 
              href={item.path}
              className={`flex items-center gap-4 px-4 py-2.5 rounded-xl text-[14px] font-medium transition-colors cursor-pointer ${
                active 
                  ? "bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white" 
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
              }`}
            >
              <item.icon className={`w-5 h-5 ${
                active 
                  ? (item.accent ? "text-indigo-600 dark:text-indigo-400" : "text-gray-900 dark:text-white")
                  : (item.accent ? "text-indigo-500 dark:text-indigo-400" : "text-gray-500 dark:text-gray-400")
              }`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Premium Upgrade */}
      <div className="mt-4 mb-2">
        <Link href="/pricing">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-500/10 dark:to-orange-500/10 border border-amber-200 dark:border-amber-500/20 hover:border-amber-300 dark:hover:border-amber-500/30 cursor-pointer transition-colors group">
            <Gem className="w-5 h-5 text-amber-500" />
            <span className="font-semibold text-sm text-amber-700 dark:text-amber-400">Upgrade to Pro</span>
          </div>
        </Link>
      </div>

      {/* Library Section */}
      {user && (
        <>
          <div className="mt-4 mb-2 px-4 flex items-center gap-3">
            <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Library</span>
          </div>
          <nav className="space-y-1">
            {libraryItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link 
                  key={item.path} 
                  href={item.path}
                  className={`flex items-center gap-4 px-4 py-2.5 rounded-xl text-[14px] font-medium transition-colors cursor-pointer ${
                    active ? "bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${active ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}`} />
                  {item.label}
                </Link>
              );
            })}

            {/* Channel */}
            {user?.channelname ? (
              <Link 
                href={`/channel/${user.id}`}
                className="flex items-center gap-4 px-4 py-2.5 rounded-xl text-[14px] font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                Your channel
              </Link>
            ) : (
              <div className="mt-4 px-2">
                <button
                  onClick={() => setisdialogeopen(true)}
                  className="w-full py-2 rounded-lg bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-200 font-semibold text-sm transition-colors"
                >
                  Create Channel
                </button>
              </div>
            )}
          </nav>
        </>
      )}

      {/* Footer */}
      <div className="mt-auto px-4 py-4">
        <p className="text-xs text-gray-400 dark:text-gray-500">© 2026 SyncSphere</p>
      </div>

      <Channeldialogue isopen={isdialogeopen} onclose={() => setisdialogeopen(false)} mode="create" />
    </aside>
  );
};

export default Sidebar;
