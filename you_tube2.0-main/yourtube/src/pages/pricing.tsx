import React from "react";
import Header from "@/components/Header";
import { useUser } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import axiosInstance from "@/lib/axiosinstance";

export default function PricingPage() {
  const { user, setUser } = useUser();

  const handleUpgrade = async (plan: string) => {
    if (!user) return alert("Please sign in first to upgrade.");
    
    // Check if they are already on this plan or higher
    if (user.plan === plan) return alert(`You are already on the ${plan} plan.`);
    if (user.plan === 'GOLD' && plan === 'BRONZE') return alert("You already have the Gold plan.");
    
    try {
      // Fix: The auth route is /auth/update/:id, not /user/update/:id
      const res = await axiosInstance.patch(`/auth/update/${user._id}`, { plan });
      const updatedUser = { ...user, plan: res.data.plan || plan };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      alert(`Successfully upgraded to ${plan} Plan!`);
    } catch (e) {
      console.error(e);
      alert("Upgrade failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f] text-gray-900 dark:text-white transition-colors duration-300">
      <Header />
      <main className="max-w-6xl mx-auto py-16 px-4 sm:px-6">
        <h1 className="text-4xl font-bold text-center tracking-tight mb-4 text-gray-900 dark:text-white">Choose Your Plan</h1>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-12 text-lg">
          Upgrade to enjoy Watch Parties without limits and an ad-free experience.
        </p>
        
        <div className="grid md:grid-cols-3 gap-8">
          {/* FREE PLAN */}
          <div className="border border-gray-200 dark:border-white/10 rounded-2xl p-8 bg-white dark:bg-[#1a1a1a] shadow-sm transition-transform hover:-translate-y-1">
            <h3 className="text-2xl font-bold mb-2">Free</h3>
            <p className="text-4xl font-bold mb-6">$0<span className="text-sm font-normal text-gray-500">/mo</span></p>
            <ul className="space-y-4 mb-8 text-sm">
              <li className="flex items-center">✓ Basic Video Streaming</li>
              <li className="flex items-center">✓ Standard Quality</li>
              <li className="text-gray-400 dark:text-gray-600 flex items-center">✗ Ads Before Videos</li>
              <li className="text-gray-400 dark:text-gray-600 flex items-center">✗ Max 1 Video Upload/Day</li>
            </ul>
            <Button disabled className="w-full bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400">
              {(!user || !user.plan || user.plan === 'FREE') ? "Current Plan" : "Included"}
            </Button>
          </div>

          {/* BRONZE PLAN */}
          <div className="border border-indigo-200 dark:border-indigo-500/30 rounded-2xl p-8 bg-indigo-50/50 dark:bg-indigo-500/5 shadow-sm transition-transform hover:-translate-y-1 relative">
            <div className="absolute top-0 right-0 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">
              POPULAR
            </div>
            <h3 className="text-2xl font-bold mb-2 text-indigo-900 dark:text-indigo-100">Bronze</h3>
            <p className="text-4xl font-bold mb-6 text-indigo-900 dark:text-indigo-100">$4.99<span className="text-sm font-normal text-indigo-600 dark:text-indigo-400">/mo</span></p>
            <ul className="space-y-4 mb-8 text-sm text-indigo-900 dark:text-indigo-100/80">
              <li className="flex items-center">✓ HD Video Streaming</li>
              <li className="flex items-center">✓ Priority Support</li>
              <li className="text-indigo-400 dark:text-indigo-500/50 flex items-center">✗ Occasional Ads</li>
              <li className="text-indigo-400 dark:text-indigo-500/50 flex items-center">✗ Max 5 Video Uploads/Day</li>
            </ul>
            <Button 
              onClick={() => handleUpgrade('BRONZE')} 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
            >
              {user?.plan === 'BRONZE' ? "Current Plan" : "Upgrade to Bronze"}
            </Button>
          </div>

          {/* GOLD PLAN */}
          <div className="border border-amber-200 dark:border-amber-500/20 rounded-2xl p-8 bg-gradient-to-b from-amber-50 to-white dark:from-amber-500/10 dark:to-[#1a1a1a] shadow-md transition-transform hover:-translate-y-1 relative">
            <h3 className="text-2xl font-bold mb-2 text-amber-900 dark:text-amber-100">Gold</h3>
            <p className="text-4xl font-bold mb-6 text-amber-900 dark:text-amber-100">$14.99<span className="text-sm font-normal text-amber-600 dark:text-amber-400">/mo</span></p>
            <ul className="space-y-4 mb-8 text-sm text-amber-900 dark:text-amber-100/80">
              <li className="flex items-center">✓ 4K Ultra HD Streaming</li>
              <li className="flex items-center">✓ Zero Ads Experience</li>
              <li className="flex items-center">✓ Unlimited Uploads</li>
              <li className="flex items-center">✓ Exclusive Watch Party Features</li>
            </ul>
            <Button 
              onClick={() => handleUpgrade('GOLD')} 
              className="w-full bg-amber-500 hover:bg-amber-600 text-white shadow-md font-semibold"
            >
              {user?.plan === 'GOLD' ? "Current Plan" : "Get Gold"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
