"use client";

import { Icon } from "@iconify/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
    const pathname = usePathname();

    const menuItems = [
        { label: "Overview", icon: "solar:pie-chart-2-linear", href: "/admin" },
        { label: "Issues Management", icon: "solar:clipboard-list-linear", href: "/admin/issues" },
        { label: "Contractors", icon: "solar:users-group-rounded-linear", href: "/admin/contractors" },
        { label: "SLA Monitoring", icon: "solar:clock-circle-linear", href: "/admin/sla" },
    ];

    return (
        <aside className="w-full lg:w-64 flex-shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-neutral-200 z-30 flex flex-col">
            {/* Logo */}
            <div className="h-16 px-6 flex items-center border-b border-neutral-200 flex-shrink-0">
                <Link href="/admin" className="font-medium text-lg tracking-tighter">AUTH.</Link>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 overflow-y-auto p-4 flex flex-col gap-1.5">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
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
            </nav>

            {/* User Profile (Bottom) */}
            <div className="p-4 border-t border-neutral-200">
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-neutral-50 cursor-pointer transition-colors">
                    <div className="w-8 h-8 rounded-full bg-neutral-200 border border-neutral-300 flex items-center justify-center text-xs font-medium text-neutral-600">JD</div>
                    <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-sm font-medium text-neutral-900 truncate">John Doe</span>
                        <span className="text-xs text-neutral-500 truncate">Dispatcher</span>
                    </div>
                </div>
            </div>
        </aside>
    );
}
