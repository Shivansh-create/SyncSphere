"use client";

import { useRouter } from "next/router";

const categories = [
  { name: "Home", path: "/" },
  { name: "Upgrades & Subscriptions", path: "/pricing" },
  { name: "Watch Party Rooms", path: "/watchparty" },
  { name: "Video Vault", path: "/vault" },
];

export default function CategoryTabs() {
  const router = useRouter();

  const handleCategoryClick = (category: typeof categories[0]) => {
    if (category.path !== router.pathname) {
      router.push(category.path);
    }
  };

  return (
    <div className="flex gap-3 mb-6 overflow-x-auto pb-2 scrollbar-none">
      {categories.map((category) => {
        const isActive = router.pathname === category.path;
        return (
          <button
            key={category.name}
            onClick={() => handleCategoryClick(category)}
            className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/20"
            }`}
          >
            {category.name}
          </button>
        );
      })}
    </div>
  );
}
