// app/[locale]/profile/page.tsx
"use client";

import { useEffect, Suspense } from "react"; 
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

import SettingsTab from "./components/SettingsTab";
import BookingsTab from "./components/BookingsTab";
import HistoryTab from "./components/HistoryTab";
import RefundsTab from "./components/RefundsTab";

type ProfileTab = "profile" | "bookings" | "history" | "refunds";

function ProfileContent() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const tabParam = searchParams.get("tab");
  const orderIdParam = searchParams.get("order_id");

  let activeTab: ProfileTab = "profile";
  if (tabParam && ["profile", "bookings", "history", "refunds"].includes(tabParam)) {
    activeTab = tabParam as ProfileTab;
  } else if (orderIdParam) {
    activeTab = "bookings";
  }

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    await logout();
    toast.info("You have been logged out.");
  };

  const switchTab = (tab: ProfileTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    
    if (tab !== "bookings") {
      params.delete("order_id");
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse flex flex-col items-center">
            <div className="h-12 w-12 bg-gray-200 rounded-full mb-4"></div>
            <p className="text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  const tabClasses = "px-4 py-2.5 font-semibold rounded-lg transition-colors text-left w-full flex items-center gap-2 text-sm";
  const activeTabClasses = "bg-primary text-primary-foreground shadow-md shadow-primary/20";
  const inactiveTabClasses = "hover:bg-muted text-foreground/70";

  const renderTabContent = () => {
    const highlightOrderId = searchParams.get("order_id");
    switch (activeTab) {
      case "profile": return <SettingsTab />;
      // @ts-expect-error: Component props type definition needs refinement
      case "bookings": return <BookingsTab highlightOrderId={highlightOrderId} />; 
      case "history": return <HistoryTab />;
      case "refunds": return <RefundsTab />;
      default: return null;
    }
  };

  return (
    <div className="bg-[#f8fafc] dark:bg-background min-h-screen py-6 sm:py-12">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-6 lg:gap-10">
          
          {/* Sidebar - Dibuat sedikit lebih ramping di Desktop */}
          <aside className="w-full md:w-[280px] shrink-0">
            <div className="p-5 sm:p-6 bg-card border border-border rounded-2xl shadow-sm sticky top-24">
              <div className="text-center mb-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 mx-auto flex items-center justify-center text-primary text-xl sm:text-2xl font-bold border-2 border-primary/20">
                  {user.name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "U"}
                </div>
                <h2 className="mt-3 text-lg font-bold truncate">{user.name}</h2>
                <p className="text-xs text-muted-foreground truncate px-2" title={user.email}>
                    {user.email}
                </p>
              </div>

              <nav className="flex flex-col space-y-1.5">
                <button onClick={() => switchTab("profile")} className={`${tabClasses} ${activeTab === "profile" ? activeTabClasses : inactiveTabClasses}`}>My Profile</button>
                <button onClick={() => switchTab("bookings")} className={`${tabClasses} ${activeTab === "bookings" ? activeTabClasses : inactiveTabClasses}`}>My Bookings</button>
                <button onClick={() => switchTab("history")} className={`${tabClasses} ${activeTab === "history" ? activeTabClasses : inactiveTabClasses}`}>History</button>
                <button onClick={() => switchTab("refunds")} className={`${tabClasses} ${activeTab === "refunds" ? activeTabClasses : inactiveTabClasses}`}>Refunds</button>
                
                <div className="pt-4 mt-2 border-t border-border">
                    <button onClick={handleLogout} className="px-4 py-2.5 font-bold text-red-500 rounded-lg hover:bg-red-50 transition-colors text-left w-full text-sm">Logout</button>
                </div>
              </nav>
            </div>
          </aside>

          {/* Main Content Area - Padding disesuaikan untuk layar kecil agar WA Number tidak terpotong */}
          <main className="flex-1 w-full min-w-0">
            <div className="p-4 sm:p-8 bg-card border border-border rounded-2xl shadow-sm min-h-[500px]">
              {renderTabContent()}
            </div>
          </main>
          
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
         <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}