"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { Icon } from "@iconify/react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Issue } from "@/types";
import { calculateSLA, calculateOpenDays } from "@/lib/utils";
import AdminZoneMap from "@/components/AdminZoneMap";

export default function AdminOverviewPage() {
    const [issues, setIssues] = useState<Issue[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onSnapshot(collection(db, "issues"), (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Issue[];
            setIssues(data);
            setLoading(false);
        });
        return unsub;
    }, []);

    const stats = useMemo(() => {
        if (issues.length === 0) return null;

        const total = issues.length;
        const open = issues.filter(i => i.status !== "completed" && i.status !== "citizen_verified").length;
        const overdue = issues.filter(i => calculateSLA(i).isOverdue).length;

        // Avg Resolution (completed issues only)
        const completed = issues.filter(i => i.completedAt && i.assignedAt);
        const avgResolutionDays = completed.length > 0
            ? completed.reduce((acc, i) => {
                const completedMs = (i.completedAt && typeof i.completedAt.toMillis === 'function')
                    ? i.completedAt.toMillis()
                    : (i.completedAt ? (i.completedAt as any).seconds * 1000 : 0);

                const assignedMs = (i.assignedAt && typeof i.assignedAt.toMillis === 'function')
                    ? i.assignedAt.toMillis()
                    : (i.assignedAt ? (i.assignedAt as any).seconds * 1000 : 0);

                return acc + (completedMs - assignedMs);
            }, 0) / completed.length / (1000 * 60 * 60 * 24)
            : 0;

        // Severity Distribution
        const severityCounts = { critical: 0, high: 0, medium: 0, low: 0 };
        issues.forEach(i => severityCounts[i.severity]++);

        // Zone Urgency
        const zones: Record<string, { critical: number, open: number, totalDays: number, count: number }> = {};
        issues.forEach(i => {
            if (!zones[i.location.zone]) zones[i.location.zone] = { critical: 0, open: 0, totalDays: 0, count: 0 };
            if (i.severity === "critical") zones[i.location.zone].critical++;
            if (i.status !== "completed") zones[i.location.zone].open++;
            zones[i.location.zone].totalDays += calculateOpenDays(i.createdAt);
            zones[i.location.zone].count++;
        });

        const zoneArray = Object.entries(zones).map(([name, data]) => ({
            name,
            critical: data.critical,
            open: data.open,
            avgAge: (data.totalDays / data.count).toFixed(1),
            status: data.critical > 10 ? "Severe" : data.critical > 5 ? "Warning" : "Stable",
            color: data.critical > 10 ? "bg-red-50 text-red-700 border-red-100" : data.critical > 5 ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-neutral-100 text-neutral-700 border-neutral-200"
        })).sort((a, b) => b.critical - a.critical);

        return {
            total,
            openPercent: ((open / total) * 100).toFixed(1),
            openCount: open,
            overduePercent: ((overdue / total) * 100).toFixed(1),
            avgResolution: avgResolutionDays.toFixed(1),
            severityCounts,
            zoneArray
        };
    }, [issues]);

    if (loading) return (
        <div className="flex-1 flex items-center justify-center">
            <Icon icon="solar:refresh-linear" className="text-4xl animate-spin text-neutral-400" />
        </div>
    );

    const KPI_DATA = [
        { label: "Total Issues", value: stats?.total.toString(), change: "Live", icon: "solar:folder-error-linear", up: true, href: "/admin/issues" },
        { label: "Open Tickets", value: `${stats?.openPercent}%`, sub: `${stats?.openCount} Active`, icon: "solar:inbox-in-linear", href: "/admin/issues" },
        { label: "Overdue SLA", value: `${stats?.overduePercent}%`, change: "Alert", icon: "solar:danger-triangle-linear", up: false, href: "/admin/sla" },
        { label: "Avg Resolution", value: `${stats?.avgResolution}d`, sub: "Target: 7d", icon: "solar:history-linear", href: "/admin/contractors" },
    ];

    return (
        <>
            <header className="h-16 px-6 lg:px-8 flex items-center justify-between border-b border-neutral-200 bg-white sticky top-0 z-10 flex-shrink-0">
                <h1 className="text-xl font-medium tracking-tight text-neutral-900">System Overview</h1>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-bold border border-green-100">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        LIVE REAL-TIME DATA
                    </div>
                </div>
            </header>

            <div className="p-6 lg:p-8 flex flex-col gap-6 anim-bounce">
                {/* KPI Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {KPI_DATA.map((kpi, idx) => (
                        <Link key={idx} href={kpi.href}>
                            <div className="bg-white border border-neutral-200 rounded-xl shadow-md p-5 flex flex-col justify-between h-28 hover:border-black hover:shadow-lg transition-all cursor-pointer group">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-neutral-500 group-hover:text-black transition-colors">{kpi.label}</span>
                                    <Icon icon={kpi.icon} className="text-neutral-400 text-lg group-hover:text-black transition-colors" />
                                </div>
                                <div className="flex items-end justify-between">
                                    <span className="text-2xl font-medium tracking-tight text-neutral-900">{kpi.value}</span>
                                    {kpi.change ? (
                                        <span className="text-xs font-medium text-neutral-500 flex items-center gap-1">
                                            <Icon icon={kpi.up ? "solar:pulse-linear" : "solar:danger-linear"} className="text-neutral-900" />
                                            {kpi.change}
                                        </span>
                                    ) : (
                                        <span className="text-xs font-medium text-neutral-500">{kpi.sub}</span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Bar Chart: Severity Distribution */}
                    <div className="bg-white border border-neutral-200 rounded-xl shadow-md p-6 lg:col-span-1 flex flex-col">
                        <h2 className="text-sm font-medium text-neutral-900 mb-6">Severity Distribution</h2>
                        <div className="flex-1 flex flex-col gap-4 justify-center">
                            {[
                                { label: "Critical", key: "critical", bg: "bg-red-600" },
                                { label: "High", key: "high", bg: "bg-amber-500" },
                                { label: "Medium", key: "medium", bg: "bg-neutral-400" },
                                { label: "Low", key: "low", bg: "bg-blue-400" },
                            ].map((s) => {
                                const count = stats?.severityCounts[s.key as keyof typeof stats.severityCounts] || 0;
                                const percent = stats ? ((count / stats.total) * 100).toFixed(0) : 0;
                                return (
                                    <div key={s.label} className="flex items-center gap-3">
                                        <span className="text-xs font-medium text-neutral-600 w-16">{s.label}</span>
                                        <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                                            <div className={`h-full ${s.bg} rounded-full`} style={{ width: `${percent}%` }}></div>
                                        </div>
                                        <span className="text-xs font-medium text-neutral-900 w-8 text-right">{percent}%</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Zone Heatmap */}
                    <div className="bg-white border border-neutral-200 rounded-xl shadow-md p-6 lg:col-span-1 flex flex-col">
                        <AdminZoneMap zoneData={stats?.zoneArray || []} totalIssues={stats?.total || 0} />
                    </div>

                    {/* Table: Zone Urgency Queue */}
                    <div className="bg-white border border-neutral-200 rounded-xl shadow-md overflow-hidden lg:col-span-2 flex flex-col">
                        <div className="px-6 py-5 border-b border-neutral-200 flex items-center justify-between bg-white">
                            <h2 className="text-sm font-medium text-neutral-900">Zone Urgency Queue</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-neutral-50/50 border-b border-neutral-200">
                                        <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Zone</th>
                                        <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Critical</th>
                                        <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Open</th>
                                        <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Avg Age</th>
                                        <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 bg-white">
                                    {stats?.zoneArray.map((z, idx) => (
                                        <tr key={idx} className="hover:bg-neutral-50/50 transition-colors cursor-pointer group">
                                            <td className="px-6 py-4 text-sm font-medium text-neutral-900">{z.name}</td>
                                            <td className="px-6 py-4 text-sm text-neutral-600">{z.critical}</td>
                                            <td className="px-6 py-4 text-sm text-neutral-600">{z.open}</td>
                                            <td className="px-6 py-4 text-sm text-neutral-600">{z.avgAge}d</td>
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
