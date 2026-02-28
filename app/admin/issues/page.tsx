"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { collection, onSnapshot, updateDoc, doc, query, orderBy, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Issue, Contractor } from "@/types";
import { formatStatus } from "@/lib/utils";
import Select from "@/components/Select";

export default function AdminIssuesPage() {
    const [issues, setIssues] = useState<Issue[]>([]);
    const [contractors, setContractors] = useState<Contractor[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubIssues = onSnapshot(query(collection(db, "issues"), orderBy("createdAt", "desc")), (snapshot) => {
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

    const updateIssue = async (issueId: string, updates: Partial<Issue>) => {
        try {
            await updateDoc(doc(db, "issues", issueId), updates as any);
        } catch (err) {
            console.error("Update failed:", err);
        }
    };

    if (loading) return (
        <div className="flex-1 flex items-center justify-center">
            <Icon icon="solar:refresh-linear" className="text-4xl animate-spin text-neutral-400" />
        </div>
    );

    return (
        <>
            <header className="h-16 px-6 lg:px-8 flex items-center justify-between border-b border-neutral-200 bg-white sticky top-0 z-10 flex-shrink-0">
                <h1 className="text-xl font-medium tracking-tight text-neutral-900">Task Management</h1>
            </header>

            <div className="p-6 lg:p-8 flex flex-col gap-6 anim-bounce">
                <div className="bg-white border border-neutral-200 rounded-2xl shadow-lg">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="bg-neutral-50 border-b border-neutral-200">
                                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-widest">Status / Severity</th>
                                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-widest">Issue & Zone</th>
                                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-widest">Assigned Contractor</th>
                                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 bg-white">
                            {issues.map((issue) => (
                                <tr key={issue.id} className="hover:bg-neutral-50/50 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col gap-2">
                                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase border w-fit ${issue.severity === 'critical' ? 'bg-red-50 text-red-600 border-red-100' :
                                                issue.severity === 'high' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                    'bg-neutral-100 text-neutral-500 border-neutral-200'
                                                }`}>
                                                {issue.severity}
                                            </span>
                                            <Select
                                                value={issue.status}
                                                onChange={(v) => updateIssue(issue.id, { status: v as any })}
                                                size="sm"
                                                options={["reported", "verified", "assigned", "in_progress", "completed", "reopened"].map(s => ({
                                                    label: formatStatus(s),
                                                    value: s
                                                }))}
                                            />
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-neutral-900">{issue.title}</span>
                                            <span className="text-xs text-neutral-400 font-medium">{issue.location.zone}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <Select
                                            value={issue.contractorId || ""}
                                            onChange={(v) => updateIssue(issue.id, {
                                                contractorId: v,
                                                status: "assigned",
                                                assignedAt: serverTimestamp() as any
                                            })}
                                            size="sm"
                                            placeholder="Select Contractor..."
                                            options={contractors.map(c => ({
                                                label: c.name,
                                                value: c.id
                                            }))}
                                        />
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => updateIssue(issue.id, { status: "completed", completedAt: serverTimestamp() as any })}
                                                className="p-2 hover:bg-green-50 text-neutral-400 hover:text-green-600 rounded-lg transition-colors"
                                                title="Mark as Fixed"
                                            >
                                                <Icon icon="solar:check-circle-linear" className="text-xl" />
                                            </button>
                                            <Link
                                                href={`/issue/${issue.id}`}
                                                className="p-2 hover:bg-neutral-100 text-neutral-400 hover:text-black rounded-lg transition-colors"
                                            >
                                                <Icon icon="solar:eye-linear" className="text-xl" />
                                            </Link>
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
