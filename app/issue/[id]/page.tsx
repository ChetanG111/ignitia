"use client";

import { Icon } from "@iconify/react";
import Link from "next/link";
import { useParams } from "next/navigation";

const TIMELINE_STEPS = [
    { label: "Reported", date: "Oct 24, 09:12 AM", status: "completed" },
    { label: "Verified", date: "Oct 24, 11:45 AM", status: "completed" },
    { label: "Assigned", date: "Oct 25, 08:30 AM", status: "completed" },
    { label: "In Progress", date: "Contractor currently on site", status: "active" },
    { label: "Completed", date: "Awaiting contractor", status: "pending" },
    { label: "Citizen Verified", date: "Awaiting public confirmation", status: "pending" },
];

export default function IssueDetailsPage() {
    const params = useParams();
    const id = params.id;

    return (
        <div className="bg-neutral-100 text-neutral-900 min-h-screen flex flex-col selection:bg-black selection:text-white">
            {/* Header */}
            <header className="px-4 sm:px-8 py-6 anim-bounce max-w-6xl mx-auto w-full flex items-center justify-between">
                <Link href="/issues" className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-black transition-colors">
                    <Icon icon="solar:arrow-left-linear" className="text-lg" />
                    Back to feed
                </Link>
                <div className="text-xl font-medium tracking-tighter text-black">A X I S</div>
            </header>

            {/* Main Layout: 3-Column Grid */}
            <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 px-4 sm:px-8 pb-12 max-w-6xl mx-auto w-full">

                {/* Left Panel: Issue Info */}
                <section className="lg:col-span-4 flex flex-col gap-6 anim-bounce delay-100">
                    <div className="bg-white border border-neutral-200 rounded-2xl shadow-md overflow-hidden flex flex-col">
                        <div className="relative h-64 w-full bg-neutral-100">
                            <img
                                src="https://images.unsplash.com/photo-1541888086425-d81bb19240f5?w=600&h=600&fit=crop"
                                alt="Elevator Shaft"
                                className="w-full h-full object-cover"
                            />
                        </div>

                        <div className="p-6 flex flex-col">
                            <div className="flex flex-wrap items-center gap-2.5 mb-4">
                                <span className="px-2.5 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-100 tracking-wide uppercase">Critical</span>
                                <span className="px-2.5 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-100 flex items-center gap-1.5 shadow-sm">
                                    <Icon icon="solar:alarm-linear" className="text-sm" />
                                    -4h overdue
                                </span>
                            </div>

                            <h1 className="text-2xl font-medium text-black tracking-tight mb-5 leading-tight">
                                Elevator shaft basement flooding
                            </h1>

                            <div className="flex flex-col gap-3.5 text-sm font-medium text-neutral-500 border-t border-neutral-100 pt-5">
                                <div className="flex items-start gap-2.5">
                                    <Icon icon="solar:map-point-linear" className="text-lg text-neutral-400 mt-0.5" />
                                    <span className="text-black flex-1">Building A, Level B1<br /><span className="text-xs text-neutral-400 font-normal">Coordinates: 40.7128° N, 74.0060° W</span></span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <Icon icon="solar:clock-circle-linear" className="text-lg text-neutral-400" />
                                    <span className="text-black">3 days open <span className="text-neutral-400 font-normal">(Reported Oct 24)</span></span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <Icon icon="solar:users-group-two-rounded-linear" className="text-lg text-neutral-400" />
                                    <span className="text-black">5 citizen confirmations</span>
                                </div>
                                <div className="flex items-center gap-2.5 mt-1">
                                    <Icon icon="solar:hashtag-linear" className="text-lg text-neutral-400" />
                                    <span className="text-neutral-400">ID: {id}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Center Panel: Timeline */}
                <section className="lg:col-span-4 flex flex-col gap-6 anim-bounce delay-200">
                    <div className="bg-white border border-neutral-200 rounded-2xl shadow-md p-6 h-full">
                        <h2 className="text-lg font-medium text-black tracking-tight mb-8">Resolution Timeline</h2>

                        <div className="relative pl-3 space-y-8 before:absolute before:inset-y-1 before:left-[23px] before:w-px before:bg-neutral-200">
                            {TIMELINE_STEPS.map((step, idx) => (
                                <div key={idx} className="relative flex gap-4 items-start group">
                                    <div className={`w-8 h-8 rounded-full border-[3px] border-white shadow-sm flex-shrink-0 relative z-10 flex items-center justify-center ${step.status === 'completed' ? 'bg-black' :
                                            step.status === 'active' ? 'bg-white border-black' :
                                                'bg-neutral-100'
                                        }`}>
                                        {step.status === 'completed' && <Icon icon="solar:check-read-linear" className="text-white text-xs" />}
                                        {step.status === 'active' && <div className="w-2 h-2 bg-black rounded-full"></div>}
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

                {/* Right Panel: Contractor Performance */}
                <section className="lg:col-span-4 flex flex-col gap-6 anim-bounce delay-300">
                    <div className="bg-white border border-neutral-200 rounded-2xl shadow-md p-6">
                        <h2 className="text-lg font-medium text-black tracking-tight mb-5">Contractor Performance</h2>
                        <div className="flex items-center gap-3.5 mb-6">
                            <div className="w-12 h-12 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-600 flex-shrink-0">
                                <Icon icon="solar:hard-hat-linear" className="text-2xl" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-base font-semibold text-black tracking-tight">Metro Maintenance</span>
                                <span className="text-xs font-medium text-amber-600 flex items-center gap-1 mt-0.5">
                                    <Icon icon="solar:star-linear" /> Top 5% Rank
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-2">
                            <div className="flex flex-col gap-1 p-3.5 bg-neutral-50 rounded-xl border border-neutral-100">
                                <span className="text-xs text-neutral-500 font-medium">On-Time Rate</span>
                                <span className="text-lg font-semibold text-green-600 tracking-tight">94.5%</span>
                            </div>
                            <div className="flex flex-col gap-1 p-3.5 bg-neutral-50 rounded-xl border border-neutral-100">
                                <span className="text-xs text-neutral-500 font-medium">Avg Resolution</span>
                                <span className="text-lg font-semibold text-black tracking-tight">1.2 days</span>
                            </div>
                            <div className="col-span-2 flex flex-col gap-1 p-3.5 bg-neutral-50 rounded-xl border border-neutral-100">
                                <span className="text-xs text-neutral-500 font-medium">Reopen Rate</span>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-black tracking-tight">2.1%</span>
                                    <span className="text-xs font-medium text-neutral-400">Excellent</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-neutral-200 rounded-2xl shadow-md p-6 flex flex-col gap-4">
                        <div className="flex flex-col mb-1">
                            <h2 className="text-sm font-semibold text-black">Verify Resolution</h2>
                            <p className="text-xs text-neutral-500 font-medium mt-1 leading-relaxed">
                                As a citizen, your confirmation is required to close this issue permanently.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button className="w-full py-2.5 bg-black text-white text-sm font-medium rounded-xl hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 shadow-sm">
                                <Icon icon="solar:check-circle-linear" className="text-lg" />
                                Confirm Fixed
                            </button>
                            <button className="w-full py-2.5 bg-white text-red-600 text-sm font-medium rounded-xl border border-red-200 hover:bg-red-50 transition-colors flex items-center justify-center gap-2 shadow-sm">
                                <Icon icon="solar:close-circle-linear" className="text-lg" />
                                Mark Not Fixed
                            </button>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
