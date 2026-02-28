"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, increment, addDoc, collection, serverTimestamp, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Issue, Contractor, IssueStatus, Confirmation } from "@/types";
import { calculateSLA, calculateOpenDays, formatStatus } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";

export default function IssueDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const { user } = useAuth();
    const [issue, setIssue] = useState<Issue | null>(null);
    const [contractor, setContractor] = useState<Contractor | null>(null);
    const [userConfirmations, setUserConfirmations] = useState<Confirmation[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            const issueDoc = await getDoc(doc(db, "issues", id));
            if (!issueDoc.exists()) {
                setLoading(false);
                return;
            }

            const issueData = { id: issueDoc.id, ...issueDoc.data() } as Issue;
            setIssue(issueData);

            if (issueData.contractorId) {
                const contractorDoc = await getDoc(doc(db, "contractors", issueData.contractorId));
                if (contractorDoc.exists()) {
                    setContractor({ id: contractorDoc.id, ...contractorDoc.data() } as Contractor);
                }
            }

            // Check for existing confirmations by this user
            if (user) {
                const q = query(
                    collection(db, "confirmations"),
                    where("issueId", "==", id),
                    where("userId", "==", user.uid)
                );
                const confirmSnap = await getDocs(q);
                const confirms = confirmSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Confirmation));
                setUserConfirmations(confirms);
            }

            setLoading(false);
        };

        fetchData();
    }, [id, user]);

    const hasConfirmExists = userConfirmations.some(c => c.type === "confirm_exists");
    const hasFinalDecision = userConfirmations.some(c => c.type === "confirm" || c.type === "reopen");

    const handleAction = async (type: "confirm" | "reopen" | "confirm_exists") => {
        if (!issue || actionLoading) return;
        if (hasFinalDecision) return;
        if (type === "confirm_exists" && hasConfirmExists) return;

        if (!user) {
            router.push("/login?redirect=" + encodeURIComponent(window.location.pathname));
            return;
        }
        setActionLoading(true);

        try {
            // 1. Add confirmation record
            await addDoc(collection(db, "confirmations"), {
                issueId: id,
                userId: user.uid,
                type,
                timestamp: serverTimestamp()
            });

            // 2. Update issue counts and status
            const updates: any = {};

            if (type === "reopen") {
                const newReopenCount = (issue.reopenCount || 0) + 1;
                updates.reopenCount = increment(1);
                updates.confirmationCount = increment(1);
                if (newReopenCount >= 3) {
                    updates.status = "reopened";
                    updates.assignedAt = serverTimestamp(); // Reset SLA
                }
            } else if (type === "confirm") {
                const newConfirmFixedCount = (issue.confirmFixedCount || 0) + 1;
                updates.confirmFixedCount = increment(1);
                updates.confirmationCount = increment(1);
                // Require 3 citizens to verify it's fixed before updating status
                if (newConfirmFixedCount >= 3) {
                    updates.status = "citizen_verified";
                }
            } else if (type === "confirm_exists") {
                updates.confirmExistsCount = increment(1);
                updates.confirmationCount = increment(1);
            }

            await updateDoc(doc(db, "issues", id), updates);

            // Refresh local state
            const refreshedDoc = await getDoc(doc(db, "issues", id));
            setIssue({ id: refreshedDoc.id, ...refreshedDoc.data() } as Issue);

            // Refresh user confirmations
            const q = query(
                collection(db, "confirmations"),
                where("issueId", "==", id),
                where("userId", "==", user.uid)
            );
            const confirmSnap = await getDocs(q);
            setUserConfirmations(confirmSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Confirmation)));
        } catch (error) {
            console.error("Action failed:", error);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-100">
                <Icon icon="solar:refresh-linear" className="text-4xl animate-spin text-neutral-400" />
            </div>
        );
    }

    if (!issue) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-100 p-8 text-center">
                <Icon icon="solar:shield-cross-linear" className="text-6xl text-neutral-300 mb-4" />
                <h1 className="text-xl font-medium">Issue Not Found</h1>
                <p className="text-neutral-500 mt-2">The requested reporting record does not exist or has been archived.</p>
                <Link href="/issues" className="mt-6 text-black font-medium border-b border-black">Return to feed</Link>
            </div>
        );
    }

    const { overdueText, isOverdue } = calculateSLA(issue);

    // Sequential status flow — determine current position and mark all prior steps as completed
    const STATUS_ORDER: IssueStatus[] = ["reported", "verified", "assigned", "in_progress", "completed", "citizen_verified"];
    const currentStatusIdx = STATUS_ORDER.indexOf(issue.status === "reopened" ? "reported" : issue.status);

    const TIMELINE_STEPS = [
        { label: "Reported", dateValue: issue.createdAt?.toDate().toLocaleString(), pendingText: "Pending" },
        { label: "Verified", dateValue: issue.verifiedAt?.toDate().toLocaleString(), pendingText: "Awaiting Verification" },
        { label: "Assigned", dateValue: issue.assignedAt?.toDate().toLocaleString(), pendingText: "Awaiting Assignment" },
        { label: "In Progress", dateValue: issue.status === "in_progress" || currentStatusIdx > 3 ? "Active on site" : null, pendingText: "Pending start" },
        { label: "Completed", dateValue: issue.completedAt?.toDate().toLocaleString(), pendingText: "Awaiting contractor" },
        { label: "Citizen Verified", dateValue: issue.status === "citizen_verified" ? "Confirmed by public" : null, pendingText: "Awaiting confirmation" },
    ];

    const TIMELINE = TIMELINE_STEPS.map((step, idx) => {
        const isCompleted = idx < currentStatusIdx;
        const isActive = idx === currentStatusIdx;
        const isPending = idx > currentStatusIdx;

        return {
            label: step.label,
            date: isCompleted || isActive ? (step.dateValue || step.pendingText) : step.pendingText,
            status: isCompleted ? "completed" : isActive ? "active" : "pending",
        };
    });

    return (
        <div className="bg-neutral-100 text-neutral-900 min-h-screen flex flex-col selection:bg-black selection:text-white">
            <header className="px-4 sm:px-8 py-6 anim-bounce max-w-6xl mx-auto w-full flex items-center justify-between">
                <Link href="/issues" className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-black transition-colors">
                    <Icon icon="solar:arrow-left-linear" className="text-lg" />
                    Back to feed
                </Link>
                <div className="text-xl font-medium tracking-tighter text-black">A X I S</div>
            </header>

            <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 px-4 sm:px-8 pb-12 max-w-6xl mx-auto w-full">
                {/* Left Panel */}
                <section className="lg:col-span-4 flex flex-col gap-6 anim-bounce delay-100">
                    <div className="bg-white border border-neutral-200 rounded-2xl shadow-md overflow-hidden flex flex-col">
                        <div className="relative h-64 w-full bg-neutral-100">
                            <img
                                src={issue.imageUrl || "https://images.unsplash.com/photo-1541888086425-d81bb19240f5?w=600&h=600&fit=crop"}
                                alt={issue.title}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        <div className="p-6 flex flex-col">
                            <div className="flex flex-wrap items-center gap-2.5 mb-4">
                                <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg border tracking-wide uppercase ${issue.severity === 'critical' ? 'bg-red-50 text-red-700 border-red-100' :
                                    issue.severity === 'high' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                        'bg-neutral-100 text-neutral-700 border-neutral-200'
                                    }`}>
                                    {issue.severity}
                                </span>
                                {overdueText && (
                                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg border flex items-center gap-1.5 shadow-sm ${isOverdue ? 'bg-red-50 text-red-700 border-red-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                                        }`}>
                                        <Icon icon="solar:alarm-linear" className="text-sm" />
                                        {overdueText}
                                    </span>
                                )}
                            </div>

                            <h1 className="text-2xl font-medium text-black tracking-tight mb-3 leading-tight">
                                {issue.title}
                            </h1>
                            <p className="text-sm text-neutral-500 mb-5 leading-relaxed">{issue.description}</p>

                            <div className="flex flex-col gap-3.5 text-sm font-medium text-neutral-500 border-t border-neutral-100 pt-5">
                                <div className="flex items-start gap-2.5">
                                    <Icon icon="solar:map-point-linear" className="text-lg text-neutral-400 mt-0.5" />
                                    <span className="text-black flex-1">{issue.location.zone}<br />
                                        <span className="text-xs text-neutral-400 font-normal underline decoration-neutral-200">Reported via AXIS Geo-tagging</span>
                                    </span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <Icon icon="solar:clock-circle-linear" className="text-lg text-neutral-400" />
                                    <span className="text-black">{calculateOpenDays(issue.createdAt)} days open</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <Icon icon="solar:users-group-two-rounded-linear" className="text-lg text-neutral-400" />
                                    <span className="text-black">{(issue.confirmExistsCount || 0) + (issue.confirmFixedCount || 0)} public confirmations</span>
                                </div>
                                <div className="flex items-center gap-2.5 mt-1">
                                    <Icon icon="solar:hashtag-linear" className="text-lg text-neutral-400" />
                                    <span className="text-neutral-400">ID: {issue.id}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Center Panel */}
                <section className="lg:col-span-4 flex flex-col gap-6 anim-bounce delay-200">
                    <div className="bg-white border border-neutral-200 rounded-2xl shadow-md p-6 h-full">
                        <h2 className="text-lg font-medium text-black tracking-tight mb-8">Resolution Timeline</h2>

                        <div className="relative pl-3 space-y-8 before:absolute before:inset-y-1 before:left-[23px] before:w-px before:bg-neutral-200">
                            {TIMELINE.map((step, idx) => (
                                <div key={idx} className="relative flex gap-4 items-start group">
                                    <div className={`w-8 h-8 rounded-full border-[3px] border-white shadow-sm flex-shrink-0 relative z-10 flex items-center justify-center ${step.status === 'completed' ? 'bg-black' :
                                        step.status === 'active' ? 'bg-white border-black' :
                                            'bg-neutral-100'
                                        }`}>
                                        {step.status === 'completed' && <Icon icon="solar:check-read-linear" className="text-white text-xs" />}
                                        {step.status === 'active' && <div className="w-2 h-2 bg-black rounded-full animate-pulse"></div>}
                                    </div>
                                    <div className="flex-1 flex flex-col pt-1">
                                        <span className={`text-sm font-semibold ${step.status === 'pending' ? 'text-neutral-400' : 'text-black'}`}>
                                            {step.label}
                                        </span>
                                        <span className={`text-xs font-medium mt-0.5 ${step.status === 'pending' ? 'text-neutral-300' : 'text-neutral-400'}`}>
                                            {step.date}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Right Panel */}
                <section className="lg:col-span-4 flex flex-col gap-6 anim-bounce delay-300">
                    <div className="bg-white border border-neutral-200 rounded-2xl shadow-md p-6">
                        <h2 className="text-lg font-medium text-black tracking-tight mb-5">Contractor Information</h2>
                        {contractor ? (
                            <div className="flex items-center gap-3.5 mb-6">
                                <div className="w-12 h-12 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-600 flex-shrink-0">
                                    <Icon icon="solar:hard-hat-linear" className="text-2xl" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-base font-semibold text-black tracking-tight">{contractor.name}</span>
                                    <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">{contractor.zone}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-neutral-50 border border-dashed border-neutral-200 rounded-xl p-4 text-center mb-6">
                                <span className="text-sm text-neutral-400">No contractor assigned yet</span>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 mb-2">
                            <div className="flex flex-col gap-1 p-3.5 bg-neutral-50 rounded-xl border border-neutral-100">
                                <span className="text-xs text-neutral-500 font-medium">Assignment Status</span>
                                <span className={`text-sm font-semibold tracking-tight ${issue.contractorId ? 'text-green-600' : 'text-amber-600'}`}>
                                    {issue.contractorId ? 'Assigned' : 'Queueing'}
                                </span>
                            </div>
                            <div className="flex flex-col gap-1 p-3.5 bg-neutral-50 rounded-xl border border-neutral-100">
                                <span className="text-xs text-neutral-500 font-medium">Auto-Triage</span>
                                <span className="text-sm font-semibold text-black tracking-tight capitalize">{issue.severity}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-neutral-200 rounded-2xl shadow-md p-6 flex flex-col gap-4">
                        <div className="flex flex-col mb-1">
                            <h2 className="text-sm font-semibold text-black">Citizen Cross-Validation</h2>
                            <p className="text-xs text-neutral-500 font-medium mt-1 leading-relaxed">
                                Use your on-ground presence to audit the repair status. Confirmed issues help rank contractors.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3">
                            {hasFinalDecision && (
                                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 flex items-center gap-3 mb-2">
                                    <Icon icon="solar:info-circle-linear" className="text-xl text-neutral-400" />
                                    <p className="text-xs font-medium text-neutral-600">
                                        You have already submitted a final verification for this issue.
                                    </p>
                                </div>
                            )}

                            {/* Confirm Issue Exists — visible when issue is still open/unresolved */}
                            {!["completed", "citizen_verified"].includes(issue.status) && (
                                <button
                                    onClick={(e) => { e.preventDefault(); handleAction("confirm_exists"); }}
                                    disabled={actionLoading || hasConfirmExists || hasFinalDecision}
                                    className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:bg-neutral-300 disabled:text-white/50 transition-colors flex items-center justify-center gap-2 shadow-sm"
                                >
                                    {actionLoading ? <Icon icon="solar:refresh-linear" className="animate-spin" /> : <Icon icon="solar:eye-linear" />}
                                    {hasConfirmExists ? "You Confirmed This Exists" : `Confirm Issue Exists (${issue.confirmExistsCount || 0})`}
                                </button>
                            )}
                            <button
                                onClick={() => handleAction("confirm")}
                                disabled={actionLoading || issue.status === "citizen_verified" || hasFinalDecision}
                                className="w-full py-2.5 bg-black text-white text-sm font-medium rounded-xl hover:bg-neutral-800 disabled:bg-neutral-300 disabled:text-white/50 transition-colors flex items-center justify-center gap-2 shadow-sm"
                            >
                                {actionLoading ? <Icon icon="solar:refresh-linear" className="animate-spin" /> : <Icon icon="solar:check-circle-linear" />}
                                {issue.status === "citizen_verified" ? "Officially Verified" : `Confirm Fixed (${issue.confirmFixedCount || 0})`}
                            </button>
                            <button
                                onClick={() => handleAction("reopen")}
                                disabled={actionLoading || hasFinalDecision}
                                className="w-full py-2.5 bg-white text-red-600 text-sm font-medium rounded-xl border border-red-200 hover:bg-red-50 disabled:opacity-50 disabled:bg-neutral-50 disabled:text-neutral-300 disabled:border-neutral-100 transition-colors flex items-center justify-center gap-2 shadow-sm"
                            >
                                {actionLoading ? <Icon icon="solar:refresh-linear" className="animate-spin" /> : <Icon icon="solar:close-circle-linear" />}
                                Report Not Fixed ({issue.reopenCount || 0})
                            </button>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
