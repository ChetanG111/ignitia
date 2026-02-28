"use client";

import { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/Navbar";
import IssueCard from "@/components/IssueCard";
import { Icon } from "@iconify/react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Issue, Contractor, Severity } from "@/types";
import { calculateSLA, calculateOpenDays, formatStatus, severityOrder } from "@/lib/utils";

export default function IssuesFeedPage() {
    const [issues, setIssues] = useState<Issue[]>([]);
    const [contractors, setContractors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterSeverity, setFilterSeverity] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<string | null>(null);
    const [overdueFirst, setOverdueFirst] = useState(true);

    // Fetch Issues and Contractors
    useEffect(() => {
        const issuesQuery = query(collection(db, "issues"), orderBy("createdAt", "desc"));

        const unsubIssues = onSnapshot(issuesQuery, (snapshot) => {
            const issuesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Issue[];
            setIssues(issuesData);
            setLoading(false);
        });

        const unsubContractors = onSnapshot(collection(db, "contractors"), (snapshot) => {
            const contractorsMap: Record<string, string> = {};
            snapshot.docs.forEach(doc => {
                const data = doc.data() as Contractor;
                contractorsMap[doc.id] = data.name;
            });
            setContractors(contractorsMap);
        });

        return () => {
            unsubIssues();
            unsubContractors();
        };
    }, []);

    // Filtered and Sorted Issues
    const filteredIssues = useMemo(() => {
        let result = [...issues];

        // Search
        if (searchTerm) {
            result = result.filter(i =>
                i.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                i.location.zone.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filters
        if (filterSeverity) result = result.filter(i => i.severity === filterSeverity);
        if (filterStatus) result = result.filter(i => i.status === filterStatus);

        // Sorting
        result.sort((a, b) => {
            if (overdueFirst) {
                const slaA = calculateSLA(a).isOverdue;
                const slaB = calculateSLA(b).isOverdue;
                if (slaA !== slaB) return slaA ? -1 : 1;
            }

            // Then by Severity
            if (severityOrder[a.severity] !== severityOrder[b.severity]) {
                return severityOrder[a.severity] - severityOrder[b.severity];
            }

            // Then by Date
            return b.createdAt.toMillis() - a.createdAt.toMillis();
        });

        return result;
    }, [issues, searchTerm, filterSeverity, filterStatus, overdueFirst]);

    return (
        <div className="bg-neutral-100 min-h-screen text-neutral-900 flex flex-col font-sans selection:bg-black selection:text-white">
            <Navbar />

            <main className="flex-1 flex flex-col px-4 sm:px-8 pb-12 gap-6 max-w-4xl mx-auto w-full">
                {/* Top Section: Control Bar */}
                <section className="bg-white border border-neutral-200 rounded-2xl p-3 shadow-md flex flex-col sm:flex-row items-center gap-4 anim-bounce delay-100">
                    <div className="flex-1 relative w-full">
                        <Icon
                            icon="solar:magnifer-linear"
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-lg"
                        />
                        <input
                            type="text"
                            placeholder="Search issues or zones..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-10 pr-4 py-2 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-neutral-300 transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                        <select
                            className="bg-white border border-neutral-200 rounded-xl px-3 py-2 text-sm font-medium text-black focus:outline-none focus:ring-1 focus:ring-black"
                            onChange={(e) => setFilterSeverity(e.target.value || null)}
                        >
                            <option value="">All Severities</option>
                            <option value="critical">Critical</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>

                        <select
                            className="bg-white border border-neutral-200 rounded-xl px-3 py-2 text-sm font-medium text-black focus:outline-none focus:ring-1 focus:ring-black"
                            onChange={(e) => setFilterStatus(e.target.value || null)}
                        >
                            <option value="">All Statuses</option>
                            <option value="reported">Reported</option>
                            <option value="assigned">Assigned</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                        </select>

                        <div className="w-px h-6 bg-neutral-200 hidden sm:block"></div>

                        <label className="flex items-center gap-2.5 cursor-pointer flex-shrink-0 pl-1 pr-2">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={overdueFirst}
                                    onChange={() => setOverdueFirst(!overdueFirst)}
                                />
                                <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-black"></div>
                            </div>
                            <span className="text-sm font-medium text-black">Overdue First</span>
                        </label>
                    </div>
                </section>

                {/* Bottom Section: Issue Cards Feed */}
                <section className="flex flex-col gap-5">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
                            <Icon icon="solar:refresh-linear" className="text-4xl animate-spin mb-4" />
                            <p className="text-sm font-medium">Loading intelligence feed...</p>
                        </div>
                    ) : (
                        filteredIssues.map((issue) => {
                            const { overdueText } = calculateSLA(issue);
                            return (
                                <IssueCard
                                    key={issue.id}
                                    id={issue.id}
                                    title={issue.title}
                                    severity={issue.severity}
                                    status={formatStatus(issue.status)}
                                    location={issue.location.zone}
                                    contractor={contractors[issue.contractorId || ""] || "Unassigned"}
                                    onTimeRate="--" // Contractor metrics will be next
                                    confirmations={issue.confirmationCount}
                                    openDays={calculateOpenDays(issue.createdAt)}
                                    overdueText={overdueText}
                                    imageUrl={issue.imageUrl || "https://images.unsplash.com/photo-1541888086425-d81bb19240f5?w=300&h=300&fit=crop"}
                                />
                            );
                        })
                    )}
                    {!loading && filteredIssues.length === 0 && (
                        <div className="bg-white border border-neutral-200 rounded-2xl p-12 text-center">
                            <Icon icon="solar:clipboard-check-linear" className="text-5xl text-neutral-200 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-black">No issues found</h3>
                            <p className="text-sm text-neutral-500 mt-1">Try adjusting your filters or search terms.</p>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
