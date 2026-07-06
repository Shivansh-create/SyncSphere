import { Bell, Menu, Mic, Search, User, Tv, MonitorPlay } from "lucide-react";
import React, { useState } from "react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import Channeldialogue from "./channeldialogue";
import { useRouter } from "next/router";
import { useUser } from "@/lib/AuthContext";

const Header = () => {
  const { user, logout } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [isdialogeopen, setisdialogeopen] = useState(false);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="flex items-center justify-between h-14 px-4 bg-white dark:bg-[#0f0f0f] border-b border-gray-200 dark:border-white/10 transition-colors duration-300">
      {/* Left: Logo & Menu */}
      <div className="flex items-center gap-4">
        <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 rounded-lg">
            <Tv className="w-4 h-4 text-white" />
          </div>
          <span className="text-[17px] font-bold text-gray-900 dark:text-white tracking-tight">SyncSphere</span>
        </Link>
      </div>

      {/* Center: Search */}
      <form
        onSubmit={handleSearch}
        className="hidden sm:flex items-center gap-2 flex-1 max-w-2xl mx-8"
      >
        <div className="flex flex-1 items-center bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-full overflow-hidden focus-within:border-indigo-500 transition-colors">
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 h-10 pl-5 pr-4 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-white/40 text-[15px] outline-none"
          />
          <button type="submit" className="h-10 px-5 bg-gray-100 dark:bg-white/10 border-l border-gray-300 dark:border-white/10 text-gray-600 dark:text-white/60 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">
            <Search className="w-4 h-4" />
          </button>
        </div>
        <button type="button" className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-700 dark:text-white/70 transition-colors shrink-0">
          <Mic className="w-4 h-4" />
        </button>
      </form>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Watch Party Button */}
        <button
          onClick={() => router.push('/watchparty')}
          className="hidden md:flex items-center gap-2 h-9 px-4 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 font-semibold text-sm transition-colors mr-2"
        >
          <MonitorPlay className="w-4 h-4" />
          Watch Party
        </button>

        {user ? (
          <>
            <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-8 h-8 rounded-full ml-2 overflow-hidden ring-1 ring-gray-200 dark:ring-white/20 hover:ring-indigo-500 transition-shadow">
                  <Avatar className="w-full h-full">
                    <AvatarImage src={user.image} className="object-cover" />
                    <AvatarFallback className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold text-xs">{user.name?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-white dark:bg-[#1f1f1f] border-gray-200 dark:border-white/10 rounded-xl p-2 mt-2" align="end">
                {user?.channelname ? (
                  <DropdownMenuItem asChild className="rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 p-2 cursor-pointer">
                    <Link href={`/channel/${user?._id}`} className="font-medium text-gray-900 dark:text-white">Your channel</Link>
                  </DropdownMenuItem>
                ) : (
                  <div className="p-1">
                    <button
                      className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-colors"
                      onClick={() => setisdialogeopen(true)}
                    >
                      Create Channel
                    </button>
                  </div>
                )}
                <DropdownMenuSeparator className="bg-gray-100 dark:bg-white/10 my-2" />
                <DropdownMenuItem asChild className="rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 p-2 cursor-pointer">
                  <Link href="/history" className="text-gray-700 dark:text-gray-300">History</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 p-2 cursor-pointer">
                  <Link href="/liked" className="text-gray-700 dark:text-gray-300">Liked videos</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout} className="rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 p-2 cursor-pointer mt-1">Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <button
            onClick={() => router.push('/auth')}
            className="flex items-center gap-2 h-9 px-4 rounded-full border border-gray-300 dark:border-white/20 hover:bg-gray-50 dark:hover:bg-white/5 text-blue-600 dark:text-blue-400 font-semibold text-sm transition-colors"
          >
            <User className="w-4 h-4" />
            Sign In
          </button>
        )}
      </div>
      <Channeldialogue isopen={isdialogeopen} onclose={() => setisdialogeopen(false)} mode="create" />
    </header>
  );
};

export default Header;
