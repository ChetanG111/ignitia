"use client";

import { Icon } from "@iconify/react";

interface StatCardProps {
    label: string;
    value: string;
    description?: string;
    unit?: string;
    icon: string;
    delay: string;
}

export default function StatCard({ label, value, description, unit, icon, delay }: StatCardProps) {
    return (
        <div className={`bg-white border border-neutral-200 rounded-2xl p-6 shadow-md anim-bounce ${delay} flex flex-col justify-between min-h-40 h-auto`}>
            <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-neutral-500">{label}</span>
                <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-black">
                    <Icon icon={icon} width="18" />
                </div>
            </div>
            <div className="flex flex-col gap-1 mt-auto">
                <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-semibold tracking-tight text-black">{value}</span>
                    {unit && <span className="text-sm font-medium text-neutral-400">{unit}</span>}
                </div>
                {description && <p className="text-[10px] leading-tight text-neutral-400 font-medium">{description}</p>}
            </div>
        </div>
    );
}
