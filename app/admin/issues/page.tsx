"use client";

import { useState, useEffect, useMemo } from "react";
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
    const [sortBy, setSortBy] = useState<string>("createdAt");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    // Filtering State
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [filterArea, setFilterArea] = useState<string>("all");
    const [filterContractor, setFilterContractor] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState<string>("");

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

    const toggleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortBy(field);
            setSortOrder("desc");
        }
    };

    const uniqueZones = useMemo(() => {
        const zones = new Set(issues.map(i => i.location?.zone).filter(Boolean));
        return Array.from(zones).sort();
    }, [issues]);

    const filteredAndSortedIssues = useMemo(() => {
        let result = [...issues];

        // Apply Filters
        if (filterStatus !== "all") {
            result = result.filter(i => i.status === filterStatus);
        }
        if (filterArea !== "all") {
            result = result.filter(i => i.location?.zone === filterArea);
        }
        if (filterContractor !== "all") {
            result = result.filter(i => (i.contractorId || "none") === filterContractor);
        }
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(i =>
                i.title.toLowerCase().includes(q) ||
                i.id.toLowerCase().includes(q)
            );
        }

        // Apply Sorting
        return result.sort((a, b) => {
            let valA: any = a[sortBy as keyof typeof a];
            let valB: any = b[sortBy as keyof typeof b];

            if (sortBy === "zone") {
                valA = a.location?.zone || "";
                valB = b.location?.zone || "";
            } else if (sortBy === "contractor") {
                valA = contractors.find(c => c.id === a.contractorId)?.name || "";
                valB = contractors.find(c => c.id === b.contractorId)?.name || "";
            } else if (sortBy === "createdAt") {
                valA = a.createdAt?.toMillis() || 0;
                valB = b.createdAt?.toMillis() || 0;
            } else if (sortBy === "severity") {
                const order = { critical: 4, high: 3, medium: 2, low: 1 };
                valA = order[a.severity as keyof typeof order] || 0;
                valB = order[b.severity as keyof typeof order] || 0;
            } else if (sortBy === "status") {
                const order = { reopened: 0, reported: 1, verified: 2, assigned: 3, in_progress: 4, completed: 5, citizen_verified: 6 };
                valA = order[a.status as keyof typeof order] || 0;
                valB = order[b.status as keyof typeof order] || 0;
            }

            if (valA < valB) return sortOrder === "asc" ? -1 : 1;
            if (valA > valB) return sortOrder === "asc" ? 1 : -1;
            return 0;
        });
    }, [issues, sortBy, sortOrder, contractors, filterStatus, filterArea, filterContractor, searchQuery]);

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

    const SortIcon = ({ field }: { field: string }) => {
        if (sortBy !== field) return <Icon icon="solar:sort-vertical-linear" className="text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity" />;
        return <Icon icon={sortOrder === "asc" ? "solar:sort-from-bottom-to-top-linear" : "solar:sort-from-top-to-bottom-linear"} className="text-black" />;
    };

    return (
        <>
            <header className="h-16 px-6 lg:px-8 flex items-center justify-between border-b border-neutral-200 bg-white sticky top-0 z-10 flex-shrink-0">
                <h1 className="text-xl font-medium tracking-tight text-neutral-900">Task Management</h1>
            </header>

            <div className="p-6 lg:p-8 flex flex-col gap-6 anim-bounce">
                {/* Filters Toolbar */}
                <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm">
                    <div className="flex-1 min-w-[240px] relative">
                        <Icon icon="solar:magnifer-linear" className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Search by issue title or ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:ring-4 focus:ring-black/5 focus:border-neutral-400 outline-none transition-all"
                        />
                    </div>
                    <div className="w-40">
                        <Select
                            value={filterStatus}
                            onChange={setFilterStatus}
                            placeholder="All Statuses"
                            size="sm"
                            options={[
                                { label: "All Statuses", value: "all" },
                                ...["reopened", "reported", "verified", "assigned", "in_progress", "completed", "citizen_verified"].map(s => ({
                                    label: formatStatus(s),
                                    value: s
                                }))
                            ]}
                        />
                    </div>
                    <div className="w-40">
                        <Select
                            value={filterArea}
                            onChange={setFilterArea}
                            placeholder="All Areas"
                            size="sm"
                            options={[
                                { label: "All Areas", value: "all" },
                                ...uniqueZones.map(z => ({ label: z, value: z }))
                            ]}
                        />
                    </div>
                    <div className="w-40">
                        <Select
                            value={filterContractor}
                            onChange={setFilterContractor}
                            placeholder="All Contractors"
                            size="sm"
                            options={[
                                { label: "All Contractors", value: "all" },
                                { label: "Unassigned", value: "none" },
                                ...contractors.map(c => ({ label: c.name, value: c.id }))
                            ]}
                        />
                    </div>
                    {(filterStatus !== "all" || filterArea !== "all" || filterContractor !== "all" || searchQuery) && (
                        <button
                            onClick={() => {
                                setFilterStatus("all");
                                setFilterArea("all");
                                setFilterContractor("all");
                                setSearchQuery("");
                            }}
                            className="text-xs font-bold text-neutral-400 hover:text-black transition-colors uppercase tracking-widest px-2"
                        >
                            Reset
                        </button>
                    )}
                </div>
                <div className="bg-white border border-neutral-200 rounded-2xl shadow-lg">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="bg-neutral-50 border-b border-neutral-200">
                                <th
                                    className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-widest cursor-pointer hover:bg-neutral-100/50 transition-colors group"
                                    onClick={() => toggleSort("status")}
                                >
                                    <div className="flex items-center gap-2">
                                        Status / Severity
                                        <SortIcon field="status" />
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-widest cursor-pointer hover:bg-neutral-100/50 transition-colors group"
                                    onClick={() => toggleSort("title")}
                                >
                                    <div className="flex items-center gap-2">
                                        Issue
                                        <SortIcon field="title" />
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-widest cursor-pointer hover:bg-neutral-100/50 transition-colors group"
                                    onClick={() => toggleSort("zone")}
                                >
                                    <div className="flex items-center gap-2">
                                        Area
                                        <SortIcon field="zone" />
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-widest cursor-pointer hover:bg-neutral-100/50 transition-colors group"
                                    onClick={() => toggleSort("contractor")}
                                >
                                    <div className="flex items-center gap-2">
                                        Contractor
                                        <SortIcon field="contractor" />
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-widest cursor-pointer hover:bg-neutral-100/50 transition-colors group text-right"
                                    onClick={() => toggleSort("createdAt")}
                                >
                                    <div className="flex items-center justify-end gap-2">
                                        Reported
                                        <SortIcon field="createdAt" />
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 bg-white">
                            {filteredAndSortedIssues.map((issue: Issue) => (
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
                                                onChange={(v) => {
                                                    const updates: Partial<Issue> = { status: v as any };
                                                    if (v === "completed") {
                                                        updates.completedAt = serverTimestamp() as any;
                                                    }
                                                    updateIssue(issue.id, updates);
                                                }}
                                                size="sm"
                                                options={["reported", "verified", "assigned", "in_progress", "completed", "reopened"].map(s => ({
                                                    label: formatStatus(s),
                                                    value: s,
                                                    disabled: s === "completed" && !["assigned", "in_progress", "reopened"].includes(issue.status)
                                                }))}
                                            />
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-sm font-semibold text-neutral-900">{issue.title}</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-xs text-neutral-500 font-medium">{issue.location.zone}</span>
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
                                    <td className="px-6 py-5 text-right font-medium text-neutral-500 text-xs text-nowrap">
                                        {issue.createdAt?.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={`/issue/${issue.id}`}
                                                className="p-2 hover:bg-neutral-100 text-neutral-400 hover:text-black rounded-lg transition-colors"
                                                title="View Details"
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
