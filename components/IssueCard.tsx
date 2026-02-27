"use client";

import { Icon } from "@iconify/react";

interface IssueCardProps {
    id: string;
    title: string;
    severity: "critical" | "high" | "medium" | "low";
    status: string;
    location: string;
    contractor: string;
    onTimeRate: string;
    confirmations: number;
    openDays: number;
    overdueText?: string;
    imageUrl: string;
    delay?: string;
}

export default function IssueCard({
    id,
    title,
    severity,
    status,
    location,
    contractor,
    onTimeRate,
    confirmations,
    openDays,
    overdueText,
    imageUrl,
    delay = "delay-200",
}: IssueCardProps) {
    const severityStyles = {
        critical: "bg-red-50 text-red-700 border-red-100",
        high: "bg-amber-50 text-amber-700 border-amber-100",
        medium: "bg-neutral-100 text-neutral-700 border-neutral-200",
        low: "bg-blue-50 text-blue-700 border-blue-100",
    };

    return (
        <div className={`bg-white border border-neutral-200 rounded-2xl p-5 shadow-md flex flex-col sm:flex-row gap-5 anim-bounce ${delay}`}>
            {/* Thumbnail */}
            <img
                src={imageUrl}
                alt={title}
                className="w-full sm:w-28 h-48 sm:h-auto object-cover rounded-xl border border-neutral-100 flex-shrink-0"
            />

            {/* Content */}
            <div className="flex-1 flex flex-col justify-between">
                {/* Top Row */}
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg border tracking-wide uppercase ${severityStyles[severity]}`}>
                            {severity}
                        </span>
                        <span className="px-2.5 py-1 bg-neutral-100 text-neutral-600 text-xs font-medium rounded-lg border border-neutral-200">
                            {status}
                        </span>
                    </div>
                    {overdueText && (
                        <span className="px-2.5 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-100 flex items-center gap-1.5 shadow-sm">
                            <Icon icon="solar:alarm-linear" className="text-sm" />
                            {overdueText}
                        </span>
                    )}
                </div>

                {/* Middle Row: Title & Details */}
                <div className="mb-4">
                    <h3 className="text-lg font-medium text-black tracking-tight mb-2">{title}</h3>
                    <div className="flex flex-wrap items-center gap-y-2 gap-x-3 text-sm text-neutral-500 font-medium">
                        <span className="flex items-center gap-1.5 text-black">
                            <Icon icon="solar:hard-hat-linear" /> {contractor}
                        </span>
                        <span className="hidden sm:block w-1 h-1 rounded-full bg-neutral-300"></span>
                        <span className={parseFloat(onTimeRate) > 90 ? "text-green-600" : "text-red-600"}>
                            {onTimeRate} on-time
                        </span>
                        <span className="hidden sm:block w-1 h-1 rounded-full bg-neutral-300"></span>
                        <span className="flex items-center gap-1.5">
                            <Icon icon="solar:check-circle-linear" /> {confirmations} confirmations
                        </span>
                    </div>
                </div>

                {/* Bottom Row: Metadata */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-neutral-400 font-medium border-t border-neutral-100 pt-3.5 mt-auto">
                    <span className="flex items-center gap-1.5">
                        <Icon icon="solar:map-point-linear" className="text-sm" /> {location}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Icon icon="solar:clock-circle-linear" className="text-sm" /> {openDays} days open
                    </span>
                    <span className="flex items-center gap-1.5 ml-auto">
                        #{id}
                    </span>
                </div>
            </div>
        </div>
    );
}
