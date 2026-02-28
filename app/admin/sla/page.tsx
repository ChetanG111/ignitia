"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { Icon } from "@iconify/react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Issue } from "@/types";
import { calculateSLA, calculateOpenDays } from "@/lib/utils";

export default function SLAMonitoringPage() {
    const [issues, setIssues] = useState<Issue[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Only monitor non-completed issues for SLA
        const q = query(
            collection(db, "issues"),
            where("status", "not-in", ["completed", "citizen_verified"])
        );

        const unsub = onSnapshot(q, (snapshot) => {
            setIssues(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Issue[]);
            setLoading(false);
        });
        return unsub;
    }, []);

    const agingData = useMemo(() => {
        return [...issues].sort((a, b) => {
            const slaA = calculateSLA(a).isOverdue;
            const slaB = calculateSLA(b).isOverdue;
            if (slaA !== slaB) return slaA ? -1 : 1;
            return b.createdAt.toMillis() - a.createdAt.toMillis();
        });
    }, [issues]);

    if (loading) return (
        <div className="flex-1 flex items-center justify-center">
            <Icon icon="solar:refresh-linear" className="text-4xl animate-spin text-neutral-400" />
        </div>
    );

    return (
        <>
            <header className="h-16 px-6 lg:px-8 flex items-center justify-between border-b border-neutral-200 bg-white sticky top-0 z-10 flex-shrink-0">
                <h1 className="text-xl font-medium tracking-tight text-neutral-900">SLA & Aging Reports</h1>
            </header>

            <div className="p-6 lg:p-8 flex flex-col gap-6 anim-bounce">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-red-50 border border-red-100 rounded-2xl p-6">
                        <span className="text-xs font-bold text-red-600 uppercase tracking-widest">Breached SLA</span>
                        <div className="text-3xl font-bold text-red-700 mt-2">{issues.filter(i => calculateSLA(i).isOverdue).length}</div>
                        <p className="text-xs text-red-500 mt-1 font-medium">Critical attention required</p>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6">
                        <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">Near Breach</span>
                        <div className="text-3xl font-bold text-amber-700 mt-2">
                            {issues.filter(i => {
                                const { isOverdue, overdueText } = calculateSLA(i);
                                return !isOverdue && overdueText.includes("h remaining");
                            }).length}
                        </div>
                        <p className="text-xs text-amber-500 mt-1 font-medium">Closing in 24 hours</p>
                    </div>
                </div>

                <div className="bg-white border border-neutral-200 rounded-2xl shadow-lg overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-neutral-50 border-b border-neutral-200">
                                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-widest">SLA Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-widest">Issue & Zone</th>
                                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-widest">Days Open</th>
                                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-widest text-right">Reference</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 bg-white">
                            {agingData.map((issue) => {
                                const { isOverdue, overdueText } = calculateSLA(issue);
                                return (
                                    <tr key={issue.id} className="hover:bg-neutral-50/50 transition-colors">
                                        <td className="px-6 py-5">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${isOverdue ? 'bg-red-100 text-red-700 border-red-200' : 'bg-blue-100 text-blue-700 border-blue-200'
                                                }`}>
                                                <Icon icon={isOverdue ? "solar:danger-triangle-linear" : "solar:clock-circle-linear"} />
                                                {overdueText || "Awaiting Assignment"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-neutral-900">{issue.title}</span>
                                                <span className="text-xs text-neutral-400 font-medium">{issue.location.zone}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-sm font-medium text-neutral-600">
                                            {calculateOpenDays(issue.createdAt)} days
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <Link href={`/issue/${issue.id}`} className="text-xs font-bold text-neutral-400 hover:text-black">
                                                #{issue.id}
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
