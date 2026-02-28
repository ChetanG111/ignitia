"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";

interface ZoneData {
    name: string;
    critical: number;
    open: number;
    avgAge: string;
    status: string;
}

interface AdminZoneMapProps {
    zoneData: ZoneData[];
    totalIssues: number;
}

// Map zone names to their grid position labels
const ZONE_GRID: { id: string; name: string; label: string }[] = [
    { id: "nw", name: "Kukatpally", label: "KPK" },
    { id: "nc", name: "Ameerpet", label: "AMT" },
    { id: "ne", name: "Secunderabad", label: "SCB" },
    { id: "wc", name: "Gachibowli", label: "GCB" },
    { id: "dc", name: "Banjara Hills", label: "BNJ" },
    { id: "ec", name: "Begumpet", label: "BGP" },
    { id: "sw", name: "HITEC City", label: "HIT" },
    { id: "sc", name: "Jubilee Hills", label: "JBL" },
    { id: "se", name: "Charminar", label: "CHM" },
];

export default function AdminZoneMap({ zoneData, totalIssues }: AdminZoneMapProps) {
    const [selectedZone, setSelectedZone] = useState<string | null>(null);

    const getZoneStats = (zoneName: string) => {
        return zoneData.find(z => z.name === zoneName) || null;
    };

    const getHeatColor = (openCount: number) => {
        if (openCount >= 10) return "bg-red-500/90 text-white border-red-600";
        if (openCount >= 6) return "bg-red-400/70 text-white border-red-500";
        if (openCount >= 4) return "bg-amber-400/70 text-amber-950 border-amber-500";
        if (openCount >= 2) return "bg-amber-300/50 text-amber-900 border-amber-400";
        if (openCount >= 1) return "bg-emerald-100/80 text-emerald-800 border-emerald-300";
        return "bg-neutral-50 text-neutral-400 border-neutral-200";
    };

    const selectedData = selectedZone ? getZoneStats(selectedZone) : null;

    return (
        <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-neutral-900">Zone Heatmap</h2>
                <div className="flex items-center gap-3 text-[10px] text-neutral-400 font-medium">
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-2 rounded-sm bg-emerald-200 border border-emerald-300"></span>
                        Low
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-2 rounded-sm bg-amber-300 border border-amber-400"></span>
                        Med
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-2 rounded-sm bg-red-500 border border-red-600"></span>
                        High
                    </span>
                </div>
            </div>

            {/* Grid Map */}
            <div className="relative rounded-xl border border-neutral-200 bg-neutral-50/50 p-2 overflow-hidden">
                {/* Subtle road grid */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[33.3%] left-0 right-0 h-[1px] bg-neutral-200/60"></div>
                    <div className="absolute top-[66.6%] left-0 right-0 h-[1px] bg-neutral-200/60"></div>
                    <div className="absolute left-[33.3%] top-0 bottom-0 w-[1px] bg-neutral-200/60"></div>
                    <div className="absolute left-[66.6%] top-0 bottom-0 w-[1px] bg-neutral-200/60"></div>
                </div>

                <div className="grid grid-cols-3 gap-1 relative z-10">
                    {ZONE_GRID.map((zone) => {
                        const stats = getZoneStats(zone.name);
                        const openCount = stats?.open || 0;
                        const criticalCount = stats?.critical || 0;
                        const isSelected = selectedZone === zone.name;

                        return (
                            <button
                                key={zone.id}
                                type="button"
                                onClick={() => setSelectedZone(isSelected ? null : zone.name)}
                                className={`
                                    relative flex flex-col items-center justify-center 
                                    py-3.5 px-1.5 rounded-lg border cursor-pointer
                                    transition-all duration-200 ease-out
                                    ${isSelected
                                        ? "bg-black text-white border-black ring-2 ring-black/20 scale-[1.03] shadow-lg z-10"
                                        : getHeatColor(openCount)
                                    }
                                `}
                            >
                                {/* Critical badge */}
                                {criticalCount > 0 && !isSelected && (
                                    <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full bg-red-600 text-white text-[8px] font-bold shadow-sm border border-red-700">
                                        {criticalCount}
                                    </span>
                                )}

                                <span className="text-[10px] font-bold tracking-widest opacity-70 mb-0.5">
                                    {zone.label}
                                </span>
                                <span className={`text-lg font-bold leading-none ${isSelected ? "text-white" : ""}`}>
                                    {openCount}
                                </span>
                                <span className={`text-[8px] font-medium mt-0.5 ${isSelected ? "text-white/60" : "opacity-50"}`}>
                                    open
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Selected Zone Detail */}
            {selectedData && (
                <div className="bg-neutral-900 text-white rounded-xl p-3.5 flex flex-col gap-2 animate-[axis-bounce_0.3s_ease-out]">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white/90">{selectedData.name}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${selectedData.status === "Severe" ? "bg-red-500/30 text-red-300" :
                            selectedData.status === "Warning" ? "bg-amber-500/30 text-amber-300" :
                                "bg-emerald-500/30 text-emerald-300"
                            }`}>
                            {selectedData.status}
                        </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <div className="text-center">
                            <p className="text-base font-bold">{selectedData.open}</p>
                            <p className="text-[9px] text-white/40 font-medium">Open</p>
                        </div>
                        <div className="text-center">
                            <p className="text-base font-bold text-red-400">{selectedData.critical}</p>
                            <p className="text-[9px] text-white/40 font-medium">Critical</p>
                        </div>
                        <div className="text-center">
                            <p className="text-base font-bold">{selectedData.avgAge}d</p>
                            <p className="text-[9px] text-white/40 font-medium">Avg Age</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
