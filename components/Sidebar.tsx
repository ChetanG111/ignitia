"use client";

import { Icon } from "@iconify/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { useState } from "react";

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user } = useAuth();
    const [viewMode, setViewMode] = useState<"admin" | "citizen">("admin");

    const menuItems = [
        { label: "Overview", icon: "solar:pie-chart-2-linear", href: "/admin" },
        { label: "Issues Management", icon: "solar:clipboard-list-linear", href: "/admin/issues" },
        { label: "Contractors", icon: "solar:users-group-rounded-linear", href: "/admin/contractors" },
        { label: "SLA Monitoring", icon: "solar:clock-circle-linear", href: "/admin/sla" },
    ];

    const citizenItems = [
        { label: "Dashboard", icon: "solar:chart-square-linear", href: "/dashboard" },
        { label: "Issues Feed", icon: "solar:documents-linear", href: "/issues" },
        { label: "My Reports", icon: "solar:user-circle-linear", href: "/my-reports" },
        { label: "Report Issue", icon: "solar:add-circle-linear", href: "/report" },
    ];

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    const handleToggle = () => {
        if (viewMode === "admin") {
            setViewMode("citizen");
            router.push("/dashboard");
        } else {
            setViewMode("citizen");
            router.push("/admin");
        }
    };

    return (
        <aside className="w-full lg:w-64 flex-shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-neutral-200 z-30 flex flex-col">
            {/* Logo */}
            <div className="h-16 px-6 flex items-center border-b border-neutral-200 flex-shrink-0 justify-between">
                <Link href="/admin" className="font-medium text-lg tracking-tighter">A X I S</Link>
                <Link href="/dashboard" className="text-neutral-400 hover:text-black transition-colors" title="Public View">
                    <Icon icon="solar:globus-linear" className="text-xl" />
                </Link>
            </div>

            {/* Test Mode Toggle */}
            <div className="px-4 pt-4 pb-2">
                <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-1 flex items-center gap-0.5">
                    <button
                        onClick={() => {
                            setViewMode("admin");
                            if (pathname.startsWith("/admin")) return;
                            router.push("/admin");
                        }}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${viewMode === "admin"
                                ? "bg-black text-white shadow-sm"
                                : "text-neutral-500 hover:text-black"
                            }`}
                    >
                        <Icon icon="solar:shield-keyhole-linear" className="text-sm" />
                        Admin
                    </button>
                    <button
                        onClick={() => {
                            setViewMode("citizen");
                            router.push("/dashboard");
                        }}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${viewMode === "citizen"
                                ? "bg-black text-white shadow-sm"
                                : "text-neutral-500 hover:text-black"
                            }`}
                    >
                        <Icon icon="solar:user-rounded-linear" className="text-sm" />
                        Citizen
                    </button>
                </div>
                <p className="text-[9px] text-neutral-400 font-medium text-center mt-1.5 tracking-wide uppercase">Test Mode</p>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 overflow-y-auto p-4 flex flex-col gap-1.5">
                {viewMode === "admin" ? (
                    <>
                        <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest px-3 mb-1">Admin Panel</span>
                        {menuItems.map((item) => {
                            const isActive = item.href === "/admin"
                                ? pathname === "/admin"
                                : pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors ${isActive
                                        ? "bg-neutral-100 text-black"
                                        : "text-neutral-500 hover:text-black hover:bg-neutral-50"
                                        }`}
                                >
                                    <Icon icon={item.icon} className="text-lg" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </>
                ) : (
                    <>
                        <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest px-3 mb-1">Citizen View</span>
                        {citizenItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm text-neutral-500 hover:text-black hover:bg-neutral-50 transition-colors"
                            >
                                <Icon icon={item.icon} className="text-lg" />
                                {item.label}
                            </Link>
                        ))}
                    </>
                )}
            </nav>

            {/* User Profile (Bottom) */}
            <div className="p-4 border-t border-neutral-200">
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-neutral-50 cursor-pointer transition-colors">
                    <div className="w-8 h-8 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-xs font-bold text-black overflow-hidden shadow-sm">
                        {user?.photoURL ? (
                            <img src={user.photoURL} alt={user.displayName || "User"} className="w-full h-full object-cover" />
                        ) : (
                            getInitials(user?.displayName || user?.email || "Admin User")
                        )}
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-sm font-semibold text-neutral-900 truncate">
                            {user?.displayName || "Administrator"}
                        </span>
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest truncate">
                            {viewMode === "admin" ? "System Dispatcher" : "Citizen View"}
                        </span>
                    </div>
                </div>
            </div>
        </aside>
    );
}
