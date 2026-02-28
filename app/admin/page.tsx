"use client";

import { Icon } from "@iconify/react";

const KPI_DATA = [
    { label: "Total Issues", value: "1,248", change: "12%", icon: "solar:folder-error-linear", up: true },
    { label: "Open Tickets", value: "24%", sub: "299 Active", icon: "solar:inbox-in-linear" },
    { label: "Overdue SLA", value: "8.2%", change: "1.4%", icon: "solar:danger-triangle-linear", up: false },
    { label: "Avg Resolution", value: "4.2d", sub: "Target: 5d", icon: "solar:history-linear" },
];

const ZONES = [
    { name: "Downtown Core", critical: 42, open: 156, sla: "1.8d", status: "Severe", color: "bg-red-50 text-red-700 border-red-100" },
    { name: "West End", critical: 18, open: 84, sla: "3.2d", status: "Warning", color: "bg-amber-50 text-amber-700 border-amber-100" },
    { name: "North Hills", critical: 5, open: 42, sla: "4.5d", status: "Stable", color: "bg-neutral-100 text-neutral-700 border-neutral-200" },
    { name: "East Riverside", critical: 2, open: 17, sla: "2.1d", status: "Stable", color: "bg-neutral-100 text-neutral-700 border-neutral-200" },
];

export default function AdminOverviewPage() {
    return (
        <>
            {/* Header */}
            <header className="h-16 px-6 lg:px-8 flex items-center justify-between border-b border-neutral-200 bg-white sticky top-0 z-10 flex-shrink-0">
                <h1 className="text-xl font-medium tracking-tight text-neutral-900">System Overview</h1>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 text-sm font-medium text-neutral-600 bg-neutral-50 border border-neutral-200 px-3 py-1.5 rounded-lg hover:bg-neutral-100 hover:text-black transition-colors">
                        <Icon icon="solar:calendar-linear" />
                        Last 30 Days
                    </button>
                </div>
            </header>

            <div className="p-6 lg:p-8 flex flex-col gap-6 animate-entrance opacity-0" style={{ animationFillMode: 'forwards' }}>
                {/* KPI Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {KPI_DATA.map((kpi, idx) => (
                        <div key={idx} className="bg-white border border-neutral-200 rounded-xl shadow-md p-5 flex flex-col justify-between h-28">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-neutral-500">{kpi.label}</span>
                                <Icon icon={kpi.icon} className="text-neutral-400 text-lg" />
                            </div>
                            <div className="flex items-end justify-between">
                                <span className="text-2xl font-medium tracking-tight text-neutral-900">{kpi.value}</span>
                                {kpi.change ? (
                                    <span className="text-xs font-medium text-neutral-500 flex items-center gap-1">
                                        <Icon icon={kpi.up ? "solar:arrow-right-up-linear" : "solar:arrow-right-down-linear"} className="text-neutral-900" />
                                        {kpi.change}
                                    </span>
                                ) : (
                                    <span className="text-xs font-medium text-neutral-500">{kpi.sub}</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Bar Chart: Severity Distribution */}
                    <div className="bg-white border border-neutral-200 rounded-xl shadow-md p-6 lg:col-span-1 flex flex-col">
                        <h2 className="text-sm font-medium text-neutral-900 mb-6">Severity Distribution</h2>
                        <div className="flex-1 flex flex-col gap-4 justify-center">
                            {[
                                { label: "Critical", width: "15%", bg: "bg-neutral-900", val: "15%" },
                                { label: "High", width: "28%", bg: "bg-neutral-600", val: "28%" },
                                { label: "Medium", width: "42%", bg: "bg-neutral-400", val: "42%" },
                                { label: "Low", width: "15%", bg: "bg-neutral-300", val: "15%" },
                            ].map((s) => (
                                <div key={s.label} className="flex items-center gap-3">
                                    <span className="text-xs font-medium text-neutral-600 w-16">{s.label}</span>
                                    <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                                        <div className={`h-full ${s.bg} rounded-full`} style={{ width: s.width }}></div>
                                    </div>
                                    <span className="text-xs font-medium text-neutral-900 w-8 text-right">{s.val}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Table: Zone Urgency Queue */}
                    <div className="bg-white border border-neutral-200 rounded-xl shadow-md overflow-hidden lg:col-span-2 flex flex-col">
                        <div className="px-6 py-5 border-b border-neutral-200 flex items-center justify-between bg-white">
                            <h2 className="text-sm font-medium text-neutral-900">Zone Urgency Queue</h2>
                            <button className="text-xs font-medium text-neutral-500 hover:text-black transition-colors flex items-center gap-1">
                                View All <Icon icon="solar:arrow-right-linear" />
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-neutral-50/50 border-b border-neutral-200">
                                        <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Zone</th>
                                        <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Critical</th>
                                        <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Open</th>
                                        <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Avg SLA</th>
                                        <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 bg-white">
                                    {ZONES.map((z, idx) => (
                                        <tr key={idx} className="hover:bg-neutral-50/50 transition-colors cursor-pointer group">
                                            <td className="px-6 py-4 text-sm font-medium text-neutral-900">{z.name}</td>
                                            <td className="px-6 py-4 text-sm text-neutral-600">{z.critical}</td>
                                            <td className="px-6 py-4 text-sm text-neutral-600">{z.open}</td>
                                            <td className="px-6 py-4 text-sm text-neutral-600">{z.sla}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${z.color}`}>
                                                    {z.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
