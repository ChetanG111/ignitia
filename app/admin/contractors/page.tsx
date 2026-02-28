"use client";

import { useState, useEffect, useMemo } from "react";
import { Icon } from "@iconify/react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Issue, Contractor, ContractorMetrics } from "@/types";

export default function ContractorPerformancePage() {
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

    const performanceData = useMemo(() => {
        return contractors.map(c => {
            const assignedIssues = issues.filter(i => i.contractorId === c.id);
            const completed = assignedIssues.filter(i => i.status === "completed" || i.status === "citizen_verified");

            if (assignedIssues.length === 0) return { ...c, metrics: null };

            const onTimeCount = completed.filter(i => {
                if (!i.assignedAt || !i.completedAt) return false;

                // Safety check for Firestore Timestamp
                const completedMs = (i.completedAt && typeof i.completedAt.toMillis === 'function')
                    ? i.completedAt.toMillis()
                    : (i.completedAt ? (i.completedAt as any).seconds * 1000 : 0);

                const assignedMs = (i.assignedAt && typeof i.assignedAt.toMillis === 'function')
                    ? i.assignedAt.toMillis()
                    : (i.assignedAt ? (i.assignedAt as any).seconds * 1000 : 0);

                const SLA_PERIOD = 7 * 24 * 60 * 60 * 1000;
                return (completedMs - assignedMs) <= SLA_PERIOD;
            }).length;

            const onTimeRate = completed.length > 0 ? (onTimeCount / completed.length) : 0;
            const reopenRate = completed.length > 0 ? (assignedIssues.filter(i => i.reopenCount > 0).length / completed.length) : 0;

            const totalResDays = completed.reduce((acc, i) => {
                const completedMs = (i.completedAt && typeof i.completedAt.toMillis === 'function')
                    ? i.completedAt.toMillis()
                    : (i.completedAt ? (i.completedAt as any).seconds * 1000 : 0);

                const assignedMs = (i.assignedAt && typeof i.assignedAt.toMillis === 'function')
                    ? i.assignedAt.toMillis()
                    : (i.assignedAt ? (i.assignedAt as any).seconds * 1000 : 0);

                return acc + (completedMs - assignedMs) / (1000 * 60 * 60 * 24);
            }, 0);
            const avgResolutionDays = completed.length > 0 ? totalResDays / completed.length : 0;

            // Score formula: (0.5 * On-time %) + (0.3 * Inverse Avg Days) - (0.2 * Reopen Rate)
            const inverseAvgDays = avgResolutionDays > 0 ? Math.min(1.5, 7 / avgResolutionDays) : 0;
            const score = (0.5 * onTimeRate) + (0.3 * inverseAvgDays) - (0.2 * reopenRate);

            return {
                ...c,
                metrics: {
                    onTimeRate: (onTimeRate * 100).toFixed(1) + "%",
                    avgResolutionDays: avgResolutionDays.toFixed(1) + "d",
                    reopenRate: (reopenRate * 100).toFixed(1) + "%",
                    totalAssigned: assignedIssues.length,
                    performanceScore: Math.max(0, Math.min(100, score * 100)).toFixed(0)
                }
            };
        }).sort((a, b) => {
            const scoreA = a.metrics ? parseInt(a.metrics.performanceScore) : 0;
            const scoreB = b.metrics ? parseInt(b.metrics.performanceScore) : 0;
            return scoreB - scoreA;
        });
    }, [issues, contractors]);

    if (loading) return (
        <div className="flex-1 flex items-center justify-center">
            <Icon icon="solar:refresh-linear" className="text-4xl animate-spin text-neutral-400" />
        </div>
    );

    return (
        <>
            <header className="h-16 px-6 lg:px-8 flex items-center justify-between border-b border-neutral-200 bg-white sticky top-0 z-10 flex-shrink-0">
                <h1 className="text-xl font-medium tracking-tight text-neutral-900">Contractor Analytics</h1>
            </header>

            <div className="p-6 lg:p-8 flex flex-col gap-6 anim-bounce">
                <div className="bg-white border border-neutral-200 rounded-2xl shadow-lg overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-neutral-50 border-b border-neutral-200">
                                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-widest">Rank</th>
                                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-widest">Entity & Zone</th>
                                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-widest text-center">Assigned</th>
                                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-widest text-center">On-Time %</th>
                                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-widest text-center">Avg Days</th>
                                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-widest text-center">Reopen Rate</th>
                                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-widest text-right">Perform. Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 bg-white">
                            {performanceData.map((contractor, idx) => (
                                <tr key={contractor.id} className="hover:bg-neutral-50/50 transition-colors group">
                                    <td className="px-6 py-5">
                                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${idx === 0 ? "bg-amber-100 text-amber-700" :
                                            idx === 1 ? "bg-neutral-200 text-neutral-700" :
                                                idx === 2 ? "bg-orange-100 text-orange-700" : "text-neutral-400"
                                            }`}>
                                            {idx + 1}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-neutral-900">{contractor.name}</span>
                                            <span className="text-xs text-neutral-400 font-medium">{contractor.zone}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center text-sm font-medium text-neutral-600">
                                        {contractor.metrics?.totalAssigned || 0}
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <span className={`text-sm font-semibold ${parseFloat(contractor.metrics?.onTimeRate || "0") > 80 ? "text-green-600" : "text-amber-600"
                                            }`}>
                                            {contractor.metrics?.onTimeRate || "--"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-center text-sm font-medium text-neutral-600">
                                        {contractor.metrics?.avgResolutionDays || "--"}
                                    </td>
                                    <td className="px-6 py-5 text-center text-sm font-medium text-red-500">
                                        {contractor.metrics?.reopenRate || "--"}
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex flex-col items-end gap-1.5">
                                            <span className="text-lg font-bold text-black">{contractor.metrics?.performanceScore || "--"}</span>
                                            <div className="w-24 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${parseInt(contractor.metrics?.performanceScore || "0") > 80 ? "bg-green-500" :
                                                        parseInt(contractor.metrics?.performanceScore || "0") > 60 ? "bg-amber-500" : "bg-red-500"
                                                        }`}
                                                    style={{ width: `${contractor.metrics?.performanceScore || 0}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
