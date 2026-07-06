import CategoryTabs from "@/components/category-tabs";
import Videogrid from "@/components/Videogrid";
import { Suspense } from "react";

function VideoGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3 animate-pulse">
          <div className="aspect-video rounded-xl bg-gray-200 dark:bg-white/10" />
          <div className="flex gap-3 px-1">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-white/10 flex-shrink-0" />
            <div className="flex-1 space-y-2 mt-1">
              <div className="h-4 bg-gray-200 dark:bg-white/10 rounded-md w-full" />
              <div className="h-3 bg-gray-200 dark:bg-white/10 rounded-md w-2/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <main className="flex-1 p-4 md:p-6 lg:p-8 min-h-screen">
      
      {/* Simple, clean welcome */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">
          Discover
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-base max-w-xl">
          Watch, sync, and explore the most amazing content perfectly curated for you.
        </p>
      </div>

      <CategoryTabs />
      
      <div className="pb-10">
        <Suspense fallback={<VideoGridSkeleton />}>
          <Videogrid />
        </Suspense>
      </div>
    </main>
  );
}
