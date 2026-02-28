"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import Sidebar from "@/components/Sidebar";
import { Icon } from "@iconify/react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [adminKey, setAdminKey] = useState("");
    const [error, setError] = useState("");
    const [isPromoting, setIsPromoting] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    const handlePromote = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        const MASTER_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY;

        if (adminKey === MASTER_KEY) {
            setIsPromoting(true);
            try {
                if (user) {
                    // Use setDoc with merge instead of updateDoc to handle missing docs
                    await setDoc(doc(db, "users", user.uid), {
                        name: user.displayName || "Admin User",
                        email: user.email,
                        role: "authority",
                        updatedAt: new Date().toISOString()
                    }, { merge: true });
                    // AuthContext snapshot will pick this up and refresh UI
                }
            } catch (err) {
                console.error("Promotion failed:", err);
                setError("System error. Please try again.");
                setIsPromoting(false);
            }
        } else {
            setError("Invalid Administrative Key.");
            setTimeout(() => setError(""), 2000);
        }
    };

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-neutral-100">
                <Icon icon="solar:refresh-linear" className="text-4xl animate-spin text-neutral-400" />
            </div>
        );
    }

    if (!user) return null;

    // Classification Gate: Show prompt if user is not an authority
    if (user.role !== "authority") {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-neutral-100 p-6">
                <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-neutral-200 p-8 anim-bounce">
                    <div className="flex flex-col items-center text-center mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center mb-4 shadow-lg shadow-black/10">
                            <Icon icon="solar:shield-keyhole-bold-duotone" className="text-white text-3xl" />
                        </div>
                        <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">Administrative Access</h1>
                        <p className="text-sm text-neutral-500 mt-2 leading-relaxed">
                            To access the management terminal, please verify your administrative identity with your unique UID key.
                        </p>
                    </div>

                    <form onSubmit={handlePromote} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest ml-1">Admin Security Key</label>
                            <div className="relative">
                                <Icon icon="solar:key-linear" className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 text-lg" />
                                <input
                                    type="password"
                                    value={adminKey}
                                    onChange={(e) => setAdminKey(e.target.value)}
                                    placeholder="••••••••••••"
                                    className="w-full pl-11 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all text-sm font-mono tracking-widest"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-semibold animate-shake">
                                <Icon icon="solar:danger-triangle-bold" className="text-base" />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isPromoting || !adminKey}
                            className="w-full py-4 bg-black text-white rounded-2xl font-bold text-sm hover:bg-neutral-800 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 shadow-lg shadow-black/10 flex items-center justify-center gap-2"
                        >
                            {isPromoting ? (
                                <Icon icon="solar:refresh-linear" className="animate-spin" />
                            ) : (
                                "Verify & Elevate Account"
                            )}
                        </button>
                    </form>

                    <div className="mt-8 flex items-center justify-center gap-2 text-neutral-400">
                        <Icon icon="solar:lock-bold-duotone" className="text-lg" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">End-to-end Encrypted Verification</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row h-screen lg:overflow-hidden bg-neutral-100 font-sans antialiased text-neutral-900">
            <Sidebar />
            <main className="flex-1 overflow-y-auto flex flex-col">
                {children}
            </main>
        </div>
    );
}
