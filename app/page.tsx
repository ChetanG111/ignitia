"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { Icon } from "@iconify/react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user?.role === "authority") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    }
  }, [user, loading, router]);

  return (
    <div className="h-screen w-full flex items-center justify-center bg-neutral-50 font-sans">
      <div className="flex flex-col items-center gap-4">
        <div className="text-2xl font-bold tracking-tighter text-black anim-pulse italic">A X I S</div>
        <Icon icon="solar:refresh-linear" className="text-2xl animate-spin text-neutral-400" />
        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Initializing Terminal</span>
      </div>
    </div>
  );
}

