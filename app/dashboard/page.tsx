"use client";

import { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/Navbar";
import StatCard from "@/components/StatCard";
import { Icon } from "@iconify/react";
import { collection, onSnapshot, query, where, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Issue, Contractor } from "@/types";
import { calculateSLA } from "@/lib/utils";

export default function PublicDashboardPage() {
    const [issues, setIssues] = useState<Issue[]>([]);
    const [contractors, setContractors] = useState<Contractor[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubIssues = onSnapshot(collection(db, "issues"), (snapshot) => {
            setIssues(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Issue[]);
        });
        const unsubContractors = onSnapshot(collection(db, "contractors"), (snapshot) => {
            setContractors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Contractor[]);
            setLoading(false);
        });
        return () => {
            unsubIssues();
            unsubContractors();
        };
    }, []);

    const stats = useMemo(() => {
        if (issues.length === 0) return null;
        const total = issues.length;
        const open = issues.filter(i => i.status !== "completed" && i.status !== "citizen_verified").length;
        const overdueCount = issues.filter(i => calculateSLA(i).isOverdue).length;
        const completed = issues.filter(i => i.status === "completed" || i.status === "citizen_verified");
        const validCompleted = completed.filter(i => i.completedAt && i.assignedAt);
        const avgRes = validCompleted.length > 0
            ? validCompleted.reduce((acc, i) => acc + (i.completedAt!.toMillis() - i.assignedAt!.toMillis()), 0) / validCompleted.length / (1000 * 60 * 60 * 24)
            : 0;

        return {
            total,
            open,
            openPercent: ((open / total) * 100).toFixed(1) + "%",
            overduePercent: ((overdueCount / total) * 100).toFixed(1) + "%",
            avgRes: avgRes.toFixed(1)
        };
    }, [issues]);

    const performanceData = useMemo(() => {
        return contractors.map(c => {
            const assigned = issues.filter(i => i.contractorId === c.id);
            const comp = assigned.filter(i => i.status === "completed" || i.status === "citizen_verified");
            const onTime = comp.filter(i => {
                if (!i.completedAt || !i.assignedAt) return false;
                const SLA = 7 * 24 * 60 * 60 * 1000;
                return (i.completedAt.toMillis() - i.assignedAt.toMillis()) <= SLA;
            }).length;
            const validComp = comp.filter(i => i.completedAt && i.assignedAt);
            const avgRes = validComp.length > 0 ? (validComp.reduce((acc, i) => acc + (i.completedAt!.toMillis() - i.assignedAt!.toMillis()) / (1000 * 60 * 60 * 24), 0) / validComp.length).toFixed(1) : "0";

            return {
                name: c.name,
                onTime: comp.length > 0 ? ((onTime / comp.length) * 100).toFixed(1) + "%" : "0%",
                avgRes,
                reopen: comp.length > 0 ? ((assigned.filter(i => i.reopenCount > 0).length / comp.length) * 100).toFixed(1) + "%" : "0%",
                score: (comp.length > 0 ? (onTime / comp.length) : 0)
            };
        }).sort((a, b) => b.score - a.score).slice(0, 5);
    }, [issues, contractors]);

    const criticalIssues = useMemo(() => {
        return issues
            .filter(i => i.severity === "critical" || calculateSLA(i).isOverdue)
            .sort((a, b) => {
                const aTime = a.createdAt?.toMillis() || 0;
                const bTime = b.createdAt?.toMillis() || 0;
                return bTime - aTime;
            })
            .slice(0, 10);
    }, [issues]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-100">
            <Icon icon="solar:refresh-linear" className="text-4xl animate-spin text-neutral-400" />
        </div>
    );

    return (
        <div className="bg-neutral-100 min-h-screen text-neutral-900 flex flex-col selection:bg-black selection:text-white">
            <Navbar />

            <main className="flex-1 flex flex-col px-8 pb-8 gap-8">
                <section className="mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 w-full">
                        <StatCard
                            label="Total Issues"
                            value={stats?.total.toString() || "0"}
                            description="Cumulative number of unique reports submitted by citizens to date."
                            icon="solar:document-text-linear"
                            delay="delay-100"
                        />
                        <StatCard
                            label="Open"
                            value={stats?.open.toString() || "0"}
                            description="Total number of reports currently pending action or being resolved."
                            icon="solar:inbox-in-linear"
                            delay="delay-200"
                        />
                        <StatCard
                            label="Overdue %"
                            value={stats?.overduePercent || "0%"}
                            description="Proportion of reports that have exceeded their standard SLA time."
                            icon="solar:alarm-linear"
                            delay="delay-300"
                        />
                        <StatCard
                            label="Avg Resolution"
                            value={stats?.avgRes || "0"}
                            unit="days"
                            description="Average time taken from report assignment to final completion."
                            icon="solar:calendar-linear"
                            delay="delay-400"
                        />
                    </div>
                </section>

                <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                    {/* Leaderboard */}
                    <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-md anim-bounce delay-100 flex flex-col">
                        <h2 className="text-lg font-medium tracking-tight text-black mb-6">Contractor Leaderboard</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse whitespace-nowrap">
                                <thead>
                                    <tr className="text-xs text-neutral-400 border-b border-neutral-100 text-right">
                                        <th className="pb-3 font-medium text-left">Name</th>
                                        <th className="pb-3 font-medium">On-Time</th>
                                        <th className="pb-3 font-medium">Avg Days</th>
                                        <th className="pb-3 font-medium">Reopen</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm divide-y divide-neutral-100">
                                    {performanceData.map((c, idx) => (
                                        <tr key={idx} className="group hover:bg-neutral-50 transition-colors">
                                            <td className="py-3.5 flex items-center gap-3">
                                                <span className="text-neutral-400 w-4 text-[10px] font-bold">{idx + 1}</span>
                                                <span className="font-medium text-black">{c.name}</span>
                                            </td>
                                            <td className="py-3.5 text-right font-medium text-green-600">{c.onTime}</td>
                                            <td className="py-3.5 text-right text-neutral-500 font-medium">{c.avgRes}d</td>
                                            <td className="py-3.5 text-right">
                                                <div className="inline-flex items-center gap-2 justify-end">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${parseFloat(c.reopen) < 5 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                    <span className="font-medium text-black">{c.reopen}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Critical Highlights */}
                    <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-md anim-bounce delay-200 flex flex-col">
                        <h2 className="text-lg font-medium tracking-tight text-black mb-6">High-Severity & Overdue Alerts</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse whitespace-nowrap">
                                <thead>
                                    <tr className="text-xs text-neutral-400 border-b border-neutral-100">
                                        <th className="pb-3 font-medium">Issue</th>
                                        <th className="pb-3 font-medium text-right">SLA Status</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm divide-y divide-neutral-100">
                                    {criticalIssues.map((issue) => {
                                        const { overdueText, isOverdue } = calculateSLA(issue);
                                        return (
                                            <tr key={issue.id} className="group hover:bg-neutral-50 transition-colors">
                                                <td className="py-3.5 w-full">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-black truncate max-w-[250px]">{issue.title}</span>
                                                        <span className="text-[10px] text-neutral-400">ID: {issue.id} • {issue.location.zone}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 text-right">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${isOverdue ? 'bg-red-50 text-red-700 border-red-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                                                        {overdueText || "QUEUEING"}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
