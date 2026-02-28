"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";

interface Zone {
    id: string;
    name: string;
    label: string;
    lat: number;
    lng: number;
    hotspot?: boolean; // zones with known issues
}

interface ZoneMapProps {
    selectedZone: string | null;
    onZoneSelect: (zone: Zone) => void;
}

const CITY_ZONES: Zone[] = [
    { id: "nw", name: "Northwest District", label: "NW", lat: 40.7220, lng: -74.0100, hotspot: false },
    { id: "ne", name: "Northeast District", label: "NE", lat: 40.7250, lng: -73.9950, hotspot: true },
    { id: "nc", name: "North Central", label: "NC", lat: 40.7235, lng: -74.0025, hotspot: false },
    { id: "wc", name: "West Central", label: "WC", lat: 40.7155, lng: -74.0110, hotspot: false },
    { id: "dc", name: "Downtown Core", label: "DC", lat: 40.7128, lng: -74.0060, hotspot: true },
    { id: "ec", name: "East Central", label: "EC", lat: 40.7140, lng: -73.9960, hotspot: false },
    { id: "sw", name: "Southwest District", label: "SW", lat: 40.7050, lng: -74.0120, hotspot: false },
    { id: "sc", name: "South Central", label: "SC", lat: 40.7040, lng: -74.0040, hotspot: true },
    { id: "se", name: "Southeast District", label: "SE", lat: 40.7030, lng: -73.9960, hotspot: false },
];

export default function ZoneMap({ selectedZone, onZoneSelect }: ZoneMapProps) {
    const [hoveredZone, setHoveredZone] = useState<string | null>(null);

    const getZoneStyle = (zone: Zone) => {
        const isSelected = selectedZone === zone.id;
        const isHovered = hoveredZone === zone.id;

        if (isSelected) {
            return "bg-black text-white border-black shadow-lg scale-[1.03] ring-2 ring-black/20";
        }
        if (isHovered) {
            return "bg-neutral-100 text-black border-neutral-400 scale-[1.02] shadow-md";
        }
        if (zone.hotspot) {
            return "bg-red-50/60 text-neutral-700 border-red-200/80 hover:border-red-300";
        }
        return "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50";
    };

    return (
        <div className="flex flex-col gap-3">
            {/* Map Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-neutral-900 flex items-center justify-center">
                        <Icon icon="solar:map-linear" className="text-white text-xs" />
                    </div>
                    <span className="text-sm font-medium text-neutral-800">Select Zone</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-neutral-400 font-medium">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-200 border border-red-300"></span>
                        Hotspot
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-black"></span>
                        Selected
                    </span>
                </div>
            </div>

            {/* Interactive Grid Map */}
            <div className="relative rounded-xl border border-neutral-200 bg-neutral-50/50 p-2.5 overflow-hidden">
                {/* Subtle grid background */}
                <div
                    className="absolute inset-0 opacity-[0.15] pointer-events-none"
                    style={{
                        backgroundImage: "linear-gradient(to right, #a3a3a3 1px, transparent 1px), linear-gradient(to bottom, #a3a3a3 1px, transparent 1px)",
                        backgroundSize: "28px 28px",
                    }}
                ></div>

                {/* Road lines overlay */}
                <div className="absolute inset-0 pointer-events-none">
                    {/* Horizontal roads */}
                    <div className="absolute top-[33.3%] left-0 right-0 h-[2px] bg-neutral-300/40"></div>
                    <div className="absolute top-[66.6%] left-0 right-0 h-[2px] bg-neutral-300/40"></div>
                    {/* Vertical roads */}
                    <div className="absolute left-[33.3%] top-0 bottom-0 w-[2px] bg-neutral-300/40"></div>
                    <div className="absolute left-[66.6%] top-0 bottom-0 w-[2px] bg-neutral-300/40"></div>
                </div>

                {/* Zone Grid */}
                <div className="grid grid-cols-3 gap-1.5 relative z-10">
                    {CITY_ZONES.map((zone) => (
                        <button
                            key={zone.id}
                            type="button"
                            onClick={() => onZoneSelect(zone)}
                            onMouseEnter={() => setHoveredZone(zone.id)}
                            onMouseLeave={() => setHoveredZone(null)}
                            className={`
                                relative flex flex-col items-center justify-center 
                                py-4 px-2 rounded-lg border cursor-pointer
                                transition-all duration-200 ease-out
                                ${getZoneStyle(zone)}
                            `}
                        >
                            {/* Hotspot pulse indicator */}
                            {zone.hotspot && selectedZone !== zone.id && (
                                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-50"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-400"></span>
                                </span>
                            )}

                            {/* Selected checkmark */}
                            {selectedZone === zone.id && (
                                <span className="absolute top-1.5 right-1.5">
                                    <Icon icon="solar:check-circle-bold" className="text-white text-sm" />
                                </span>
                            )}

                            <span className="text-[10px] font-bold tracking-widest opacity-60 mb-0.5">
                                {zone.label}
                            </span>
                            <span className={`text-[10px] font-medium leading-tight text-center ${selectedZone === zone.id ? "text-white/80" : "text-neutral-500"
                                }`}>
                                {zone.name.replace(" District", "").replace(" Central", "")}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Selected Zone Info */}
            {selectedZone && (
                <div className="flex items-center gap-2.5 px-3 py-2 bg-neutral-900 text-white rounded-xl text-xs font-medium animate-[axis-bounce_0.4s_ease-out]">
                    <Icon icon="solar:map-point-bold" className="text-sm flex-shrink-0" />
                    <span className="flex-1">
                        {CITY_ZONES.find(z => z.id === selectedZone)?.name}
                    </span>
                    <span className="text-neutral-400 font-mono text-[10px]">
                        {CITY_ZONES.find(z => z.id === selectedZone)?.lat.toFixed(4)}°N, {Math.abs(CITY_ZONES.find(z => z.id === selectedZone)?.lng || 0).toFixed(4)}°W
                    </span>
                </div>
            )}
        </div>
    );
}

export { CITY_ZONES };
export type { Zone };
