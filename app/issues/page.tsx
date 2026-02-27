"use client";

import Navbar from "@/components/Navbar";
import IssueCard from "@/components/IssueCard";
import { Icon } from "@iconify/react";

const MOCK_ISSUES = [
    {
        id: "9408",
        title: "Elevator shaft basement flooding",
        severity: "critical" as const,
        status: "In Progress",
        location: "Building A, Level B1",
        contractor: "Metro Maintenance",
        onTimeRate: "74.5%",
        confirmations: 5,
        openDays: 3,
        overdueText: "-4h overdue",
        imageUrl: "https://images.unsplash.com/photo-1541888086425-d81bb19240f5?w=300&h=300&fit=crop",
        delay: "delay-200",
    },
    {
        id: "9402",
        title: "HVAC offline causing thermal alert",
        severity: "high" as const,
        status: "Dispatched",
        location: "Sector B, Main Server Room",
        contractor: "BuildRite Inc.",
        onTimeRate: "96.5%",
        confirmations: 2,
        openDays: 1,
        overdueText: "2h remaining",
        imageUrl: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=300&h=300&fit=crop",
        delay: "delay-300",
    },
    {
        id: "9425",
        title: "Fiber optic line exposed in hallway",
        severity: "medium" as const,
        status: "Pending Review",
        location: "West Wing, Floor 2",
        contractor: "Apex Construction",
        onTimeRate: "99.2%",
        confirmations: 1,
        openDays: 0,
        overdueText: "18h remaining",
        imageUrl: "https://images.unsplash.com/photo-1616423640778-28d1b53229bd?w=300&h=300&fit=crop",
        delay: "delay-400",
    },
];

export default function IssuesFeedPage() {
    return (
        <div className="bg-neutral-100 min-h-screen text-neutral-900 flex flex-col font-sans selection:bg-black selection:text-white">
            <Navbar />

            <main className="flex-1 flex flex-col px-4 sm:px-8 pb-12 gap-6 max-w-4xl mx-auto w-full">
                {/* Top Section: Control Bar */}
                <section className="bg-white border border-neutral-200 rounded-2xl p-3 shadow-md flex flex-col sm:flex-row items-center gap-4 anim-bounce delay-100">
                    {/* Search Input */}
                    <div className="flex-1 relative w-full">
                        <Icon
                            icon="solar:magnifer-linear"
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-lg"
                        />
                        <input
                            type="text"
                            placeholder="Search issues..."
                            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-10 pr-4 py-2 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-neutral-300 transition-all"
                        />
                    </div>

                    {/* Filters Container */}
                    <div className="flex items-center gap-4 w-full sm:w-auto overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                        {/* Severity Dropdown */}
                        <div className="relative group cursor-pointer flex-shrink-0">
                            <div className="flex items-center gap-2 bg-white border border-neutral-200 rounded-xl px-3 py-2 text-sm font-medium text-black hover:bg-neutral-50 transition-colors">
                                <Icon icon="solar:danger-triangle-linear" className="text-neutral-400 text-base" />
                                Severity
                                <Icon icon="solar:alt-arrow-down-linear" className="text-neutral-400 ml-1" />
                            </div>
                        </div>

                        {/* Status Dropdown */}
                        <div className="relative group cursor-pointer flex-shrink-0">
                            <div className="flex items-center gap-2 bg-white border border-neutral-200 rounded-xl px-3 py-2 text-sm font-medium text-black hover:bg-neutral-50 transition-colors">
                                <Icon icon="solar:clipboard-list-linear" className="text-neutral-400 text-base" />
                                Status
                                <Icon icon="solar:alt-arrow-down-linear" className="text-neutral-400 ml-1" />
                            </div>
                        </div>

                        <div className="w-px h-6 bg-neutral-200 hidden sm:block"></div>

                        {/* Overdue First Toggle */}
                        <label className="flex items-center gap-2.5 cursor-pointer flex-shrink-0 pl-1 pr-2">
                            <div className="relative">
                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-black"></div>
                            </div>
                            <span className="text-sm font-medium text-black">Overdue First</span>
                        </label>
                    </div>
                </section>

                {/* Bottom Section: Issue Cards Feed */}
                <section className="flex flex-col gap-5">
                    {MOCK_ISSUES.map((issue) => (
                        <IssueCard key={issue.id} {...issue} />
                    ))}
                </section>
            </main>
        </div>
    );
}
