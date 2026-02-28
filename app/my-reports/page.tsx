"use client";

import { useState, useEffect, useMemo } from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { collection, query, where, onSnapshot, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { Issue, Confirmation } from "@/types";
import { calculateSLA, calculateOpenDays, formatStatus } from "@/lib/utils";
import Navbar from "@/components/Navbar";

type ActivityItem = {
    id: string;
    type: "report" | "confirm" | "status_change";
    issueId: string;
    issueTitle: string;
    issueSeverity: string;
    issueStatus: string;
    zone: string;
    timestamp: Date;
};

export default function MyReportsPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [reportedIssues, setReportedIssues] = useState<Issue[]>([]);
    const [confirmedIssueIds, setConfirmedIssueIds] = useState<string[]>([]);
    const [allIssues, setAllIssues] = useState<Issue[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"reported" | "confirmed" | "activity">("reported");

    // Redirect if not logged in
    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
        }
    }, [user, authLoading, router]);

    // Fetch user's reported issues
    useEffect(() => {
        if (!user) return;

        // Listen for issues reported by this user
        const reportedQuery = query(
            collection(db, "issues"),
            where("reportedBy", "==", user.uid),
            orderBy("createdAt", "desc")
        );

        const unsubReported = onSnapshot(reportedQuery, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Issue[];
            setReportedIssues(data);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching reported issues:", error);
            setLoading(false);
        });

        // Listen for user confirmations
        const confirmQuery = query(
            collection(db, "confirmations"),
            where("userId", "==", user.uid)
        );

        const unsubConfirm = onSnapshot(confirmQuery, (snapshot) => {
            const issueIds = [...new Set(snapshot.docs.map(doc => doc.data().issueId))];
            setConfirmedIssueIds(issueIds);
        });

        // Listen for all issues (to look up confirmed issue details)
        const allQuery = query(collection(db, "issues"), orderBy("createdAt", "desc"));
        const unsubAll = onSnapshot(allQuery, (snapshot) => {
            setAllIssues(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Issue[]);
        });

        return () => {
            unsubReported();
            unsubConfirm();
            unsubAll();
        };
    }, [user]);

    // Confirmed issues (not including ones user reported)
    const confirmedIssues = useMemo(() => {
        return allIssues.filter(
            i => confirmedIssueIds.includes(i.id) && i.id && !reportedIssues.find(r => r.id === i.id)
        );
    }, [allIssues, confirmedIssueIds, reportedIssues]);

    // Stats
    const stats = useMemo(() => {
        const total = reportedIssues.length;
        const resolved = reportedIssues.filter(i => i.status === "completed" || i.status === "citizen_verified").length;
        const inProgress = reportedIssues.filter(i => i.status === "in_progress" || i.status === "assigned").length;
        const overdue = reportedIssues.filter(i => calculateSLA(i).isOverdue).length;
        return { total, resolved, inProgress, overdue, confirmed: confirmedIssues.length };
    }, [reportedIssues, confirmedIssues]);

    const getSeverityStyle = (severity: string) => {
        const map: Record<string, string> = {
            critical: "bg-red-50 text-red-700 border-red-100",
            high: "bg-amber-50 text-amber-700 border-amber-100",
            medium: "bg-neutral-100 text-neutral-700 border-neutral-200",
            low: "bg-blue-50 text-blue-700 border-blue-100",
        };
        return map[severity] || map.medium;
    };

    const getStatusColor = (status: string) => {
        const map: Record<string, string> = {
            reported: "bg-neutral-100 text-neutral-600",
            verified: "bg-blue-50 text-blue-700",
            assigned: "bg-purple-50 text-purple-700",
            in_progress: "bg-amber-50 text-amber-700",
            completed: "bg-emerald-50 text-emerald-700",
            citizen_verified: "bg-emerald-50 text-emerald-700",
            reopened: "bg-red-50 text-red-700",
        };
        return map[status] || map.reported;
    };

    const getStatusIcon = (status: string) => {
        const map: Record<string, string> = {
            reported: "solar:document-add-linear",
            verified: "solar:verified-check-linear",
            assigned: "solar:user-check-linear",
            in_progress: "solar:settings-linear",
            completed: "solar:check-circle-linear",
            citizen_verified: "solar:shield-check-linear",
            reopened: "solar:restart-linear",
        };
        return map[status] || "solar:document-text-linear";
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-100">
                <Icon icon="solar:refresh-linear" className="text-4xl animate-spin text-neutral-400" />
            </div>
        );
    }

    if (!user) return null;

    const currentIssues = activeTab === "reported" ? reportedIssues : confirmedIssues;

    return (
        <div className="bg-neutral-100 min-h-screen text-neutral-900 flex flex-col selection:bg-black selection:text-white">
            <Navbar />

            <main className="flex-1 flex flex-col px-4 sm:px-8 pb-12 gap-6 max-w-4xl mx-auto w-full">
                {/* Profile Header */}
                <section className="bg-white border border-neutral-200 rounded-2xl p-6 sm:p-8 shadow-md anim-bounce">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                        {/* Avatar */}
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-700 flex items-center justify-center text-white text-xl font-bold shadow-lg overflow-hidden flex-shrink-0">
                            {user.photoURL ? (
                                <img src={user.photoURL} alt={user.displayName || "User"} className="w-full h-full object-cover" />
                            ) : (
                                (user.displayName || user.email || "U").substring(0, 2).toUpperCase()
                            )}
                        </div>

                        <div className="flex-1">
                            <h1 className="text-xl sm:text-2xl font-medium tracking-tight text-black">
                                {user.displayName || "Citizen Reporter"}
                            </h1>
                            <p className="text-sm text-neutral-500 mt-0.5">{user.email}</p>
                            <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1.5">
                                <Icon icon="solar:shield-check-linear" className="text-sm" />
                                Active Citizen • Member since {user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : "Recently"}
                            </p>
                        </div>

                        <Link
                            href="/report"
                            className="bg-black text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-neutral-800 transition-colors shadow-sm flex items-center gap-2 flex-shrink-0"
                        >
                            <Icon icon="solar:add-circle-linear" className="text-lg" />
                            New Report
                        </Link>
                    </div>
                </section>

                {/* Stats Row */}
                <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 anim-bounce delay-100">
                    {[
                        { label: "Reported", value: stats.total, icon: "solar:document-text-linear", color: "text-black" },
                        { label: "In Progress", value: stats.inProgress, icon: "solar:hourglass-linear", color: "text-amber-600" },
                        { label: "Resolved", value: stats.resolved, icon: "solar:check-circle-linear", color: "text-emerald-600" },
                        { label: "Overdue", value: stats.overdue, icon: "solar:alarm-linear", color: "text-red-600" },
                    ].map((stat) => (
                        <div key={stat.label} className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm flex items-center gap-3 hover:border-neutral-300 transition-colors">
                            <div className={`w-10 h-10 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-center ${stat.color}`}>
                                <Icon icon={stat.icon} className="text-lg" />
                            </div>
                            <div>
                                <p className="text-xl font-semibold text-black tracking-tight">{stat.value}</p>
                                <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </section>

                {/* Tabs */}
                <section className="anim-bounce delay-200">
                    <div className="flex items-center gap-1 bg-white border border-neutral-200 rounded-xl p-1 shadow-sm w-fit">
                        {[
                            { id: "reported" as const, label: "My Reports", count: reportedIssues.length, icon: "solar:document-text-linear" },
                            { id: "confirmed" as const, label: "Confirmed", count: confirmedIssues.length, icon: "solar:check-circle-linear" },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                        ? "bg-black text-white shadow-sm"
                                        : "text-neutral-500 hover:text-black hover:bg-neutral-50"
                                    }`}
                            >
                                <Icon icon={tab.icon} className="text-base" />
                                {tab.label}
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-500"
                                    }`}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Issue List */}
                <section className="flex flex-col gap-3 anim-bounce delay-300">
                    {currentIssues.length === 0 ? (
                        <div className="bg-white border border-neutral-200 rounded-2xl p-12 text-center shadow-sm">
                            <div className="w-16 h-16 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-center justify-center mx-auto mb-4">
                                <Icon icon={activeTab === "reported" ? "solar:document-add-linear" : "solar:check-circle-linear"} className="text-3xl text-neutral-300" />
                            </div>
                            <h3 className="text-lg font-medium text-black mb-1">
                                {activeTab === "reported" ? "No reports yet" : "No confirmations yet"}
                            </h3>
                            <p className="text-sm text-neutral-500 mb-5">
                                {activeTab === "reported"
                                    ? "Start reporting road issues to help improve your city's infrastructure."
                                    : "Confirm existing reports to increase their priority and visibility."}
                            </p>
                            <Link
                                href={activeTab === "reported" ? "/report" : "/issues"}
                                className="inline-flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-neutral-800 transition-colors shadow-sm"
                            >
                                <Icon icon={activeTab === "reported" ? "solar:add-circle-linear" : "solar:magnifer-linear"} className="text-lg" />
                                {activeTab === "reported" ? "Submit a Report" : "Browse Issues"}
                            </Link>
                        </div>
                    ) : (
                        currentIssues.map((issue, idx) => {
                            const { overdueText, isOverdue } = calculateSLA(issue);
                            const openDays = issue.createdAt ? calculateOpenDays(issue.createdAt) : 0;

                            return (
                                <Link
                                    key={issue.id}
                                    href={`/issue/${issue.id}`}
                                    className="group"
                                >
                                    <div className="bg-white border border-neutral-200 rounded-xl p-4 sm:p-5 shadow-sm hover:border-black hover:shadow-md transition-all flex flex-col sm:flex-row gap-4">
                                        {/* Status Icon */}
                                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${getStatusColor(issue.status)}`}>
                                            <Icon icon={getStatusIcon(issue.status)} className="text-xl" />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border tracking-wide uppercase ${getSeverityStyle(issue.severity)}`}>
                                                    {issue.severity}
                                                </span>
                                                <span className={`px-2 py-0.5 text-[10px] font-medium rounded-md ${getStatusColor(issue.status)}`}>
                                                    {formatStatus(issue.status)}
                                                </span>
                                                {isOverdue && (
                                                    <span className="px-2 py-0.5 bg-red-50 text-red-700 text-[10px] font-bold rounded-md border border-red-100 flex items-center gap-1">
                                                        <Icon icon="solar:alarm-linear" className="text-xs" />
                                                        {overdueText}
                                                    </span>
                                                )}
                                            </div>

                                            <h3 className="text-sm font-medium text-black truncate group-hover:text-black transition-colors">
                                                {issue.title}
                                            </h3>

                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px] text-neutral-400 font-medium">
                                                <span className="flex items-center gap-1">
                                                    <Icon icon="solar:map-point-linear" className="text-xs" />
                                                    {issue.location.zone}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Icon icon="solar:clock-circle-linear" className="text-xs" />
                                                    {openDays}d open
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Icon icon="solar:check-circle-linear" className="text-xs" />
                                                    {issue.confirmationCount} confirmations
                                                </span>
                                            </div>
                                        </div>

                                        {/* Progress Indicator */}
                                        <div className="flex items-center flex-shrink-0 self-center">
                                            <div className="flex gap-1">
                                                {["reported", "verified", "assigned", "in_progress", "completed"].map((step, i) => {
                                                    const statusOrder = ["reported", "verified", "assigned", "in_progress", "completed", "citizen_verified"];
                                                    const currentIdx = statusOrder.indexOf(issue.status);
                                                    const stepIdx = statusOrder.indexOf(step);
                                                    const isActive = stepIdx <= currentIdx;

                                                    return (
                                                        <div
                                                            key={step}
                                                            className={`w-6 h-1.5 rounded-full transition-all ${isActive ? "bg-black" : "bg-neutral-200"
                                                                }`}
                                                            title={formatStatus(step)}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })
                    )}
                </section>
            </main>
        </div>
    );
}
