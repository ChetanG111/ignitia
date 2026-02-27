"use client";

import Navbar from "@/components/Navbar";
import StatCard from "@/components/StatCard";
import { Icon } from "@iconify/react";

const CONTRACTORS = [
    { rank: "01", name: "Apex Construction", onTime: "99.2%", avgDays: "1.8", reopen: "0.8%", color: "bg-green-500" },
    { rank: "02", name: "BuildRite Inc.", onTime: "96.5%", avgDays: "2.4", reopen: "1.4%", color: "bg-green-500" },
    { rank: "03", name: "Structure Dynamics", onTime: "88.0%", avgDays: "4.1", reopen: "4.2%", color: "bg-amber-500" },
    { rank: "04", name: "Metro Maintenance", onTime: "74.5%", avgDays: "7.5", reopen: "12.1%", color: "bg-red-500" },
    { rank: "05", name: "Skyline Builders", onTime: "68.2%", avgDays: "9.2", reopen: "15.8%", color: "bg-red-500" },
];

const CRITICAL_ISSUES = [
    { id: "#9402", desc: "Main server rack thermal alert", status: "-4h overdue", type: "overdue" },
    { id: "#9408", desc: "Elevator shaft flooding", status: "-1h overdue", type: "overdue" },
    { id: "#9415", desc: "HVAC offline in Sector B", status: "2h remaining", type: "warning" },
    { id: "#9421", desc: "Access control system reset", status: "6h remaining", type: "warning" },
    { id: "#9425", desc: "Fiber optic line exposed", status: "18h remaining", type: "stable" },
];

export default function PublicDashboardPage() {
    return (
        <div className="bg-neutral-100 min-h-screen text-neutral-900 flex flex-col selection:bg-black selection:text-white">
            <Navbar />

            <main className="flex-1 flex flex-col px-8 pb-8 gap-8">
                {/* KPI Strip */}
                <section className="mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 w-full">
                        <StatCard label="Total Issues" value="3,842" icon="solar:document-text-linear" delay="delay-100" />
                        <StatCard label="Open %" value="18.4%" icon="solar:pie-chart-2-linear" delay="delay-200" />
                        <StatCard label="Overdue %" value="4.2%" icon="solar:alarm-linear" delay="delay-300" />
                        <StatCard label="Avg Resolution" value="3.6" unit="days" icon="solar:calendar-linear" delay="delay-400" />
                    </div>
                </section>

                {/* Data Panels */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                    {/* Leaderboard */}
                    <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-md anim-bounce delay-500 flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-medium tracking-tight text-black">Contractor Leaderboard</h2>
                            <button className="text-neutral-400 hover:text-black transition-colors">
                                <Icon icon="solar:menu-dots-bold" width="20" />
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse whitespace-nowrap">
                                <thead>
                                    <tr className="text-xs text-neutral-400 border-b border-neutral-100">
                                        <th className="pb-3 font-medium w-16">Rank</th>
                                        <th className="pb-3 font-medium">Name</th>
                                        <th className="pb-3 font-medium text-right pr-6">On-Time</th>
                                        <th className="pb-3 font-medium text-right pr-6">Avg Days</th>
                                        <th className="pb-3 font-medium text-right">Reopen</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm divide-y divide-neutral-100">
                                    {CONTRACTORS.map((c) => (
                                        <tr key={c.rank} className="group hover:bg-neutral-50 transition-colors">
                                            <td className="py-3.5 text-neutral-400">{c.rank}</td>
                                            <td className="py-3.5 font-medium text-black">{c.name}</td>
                                            <td className="py-3.5 text-right pr-6">{c.onTime}</td>
                                            <td className="py-3.5 text-right pr-6">{c.avgDays}</td>
                                            <td className="py-3.5 text-right font-medium">
                                                <div className="inline-flex items-center gap-2 justify-end">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${c.color}`}></div>
                                                    <span>{c.reopen}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Critical Highlights */}
                    <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-md anim-bounce delay-500 flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-medium tracking-tight text-black">High-Severity & Overdue</h2>
                            <button className="text-neutral-400 hover:text-black transition-colors">
                                <Icon icon="solar:filter-linear" width="20" />
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse whitespace-nowrap">
                                <thead>
                                    <tr className="text-xs text-neutral-400 border-b border-neutral-100">
                                        <th className="pb-3 font-medium w-20">ID</th>
                                        <th className="pb-3 font-medium">Description</th>
                                        <th className="pb-3 font-medium text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm divide-y divide-neutral-100">
                                    {CRITICAL_ISSUES.map((issue) => (
                                        <tr key={issue.id} className="group hover:bg-neutral-50 transition-colors">
                                            <td className="py-3.5 font-mono text-xs text-neutral-400">{issue.id}</td>
                                            <td className="py-3.5 font-medium text-black pr-4 truncate max-w-[250px]">{issue.desc}</td>
                                            <td className="py-3.5 text-right">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${issue.type === 'overdue' ? 'bg-red-50 text-red-700 border-red-100' :
                                                        issue.type === 'warning' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                            'bg-neutral-100 text-neutral-600 border-neutral-200'
                                                    }`}>
                                                    {issue.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
