"use client";

import { Icon } from "@iconify/react";
import Link from "next/link";

export default function ReportIssuePage() {
    return (
        <div className="bg-neutral-100 text-neutral-900 min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-12 selection:bg-black selection:text-white">
            {/* Main Container */}
            <div className="w-full max-w-[960px] bg-white rounded-2xl shadow-md border border-neutral-200 flex flex-col md:flex-row overflow-hidden anim-bounce">

                {/* Left Panel: Media & Location */}
                <div className="w-full md:w-5/12 p-6 md:p-8 flex flex-col gap-6 bg-white border-b md:border-b-0 md:border-r border-neutral-200">

                    {/* Image Dropzone */}
                    <div className="flex-1 flex flex-col">
                        <label className="text-sm font-medium text-neutral-700 mb-2 block">Evidence Media</label>
                        <div className="flex-1 min-h-[200px] border-2 border-dashed border-neutral-200 rounded-xl bg-neutral-50 hover:bg-neutral-100/50 hover:border-black transition-all cursor-pointer flex flex-col items-center justify-center text-center p-6 group">
                            <div className="w-12 h-12 rounded-full bg-white border border-neutral-200 shadow-sm flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                                <Icon icon="solar:camera-add-linear" className="text-xl text-neutral-600" />
                            </div>
                            <span className="text-sm font-medium text-neutral-800">Drag & drop files here</span>
                            <span className="text-xs text-neutral-500 mt-1">or click to browse from device</span>
                            <span className="text-xs text-neutral-400 mt-4 text-center">Supports JPG, PNG, MP4 up to 50MB</span>
                        </div>
                    </div>

                    {/* Map Preview */}
                    <div className="flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-neutral-700 block">Incident Location</label>
                        </div>
                        <div className="h-44 w-full rounded-xl border border-neutral-200 bg-neutral-50 relative overflow-hidden group">
                            {/* Subtle Map Grid Pattern */}
                            <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #a3a3a3 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>

                            {/* Center Marker */}
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
                                <div className="relative flex items-center justify-center">
                                    <div className="absolute w-8 h-8 bg-black/10 rounded-full animate-ping"></div>
                                    <Icon icon="solar:map-point-linear" className="text-3xl text-black relative z-10 drop-shadow" />
                                </div>
                            </div>

                            {/* Edit Location Pill */}
                            <button type="button" className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm border border-neutral-200 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 shadow-sm hover:bg-neutral-50 transition-colors z-20">
                                <Icon icon="solar:pen-linear" className="text-neutral-500" />
                                <span className="text-xs font-medium text-neutral-700">Adjust pin</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Form Fields */}
                <div className="w-full md:w-7/12 p-6 md:p-8 flex flex-col bg-white">

                    {/* Header */}
                    <div className="mb-8 flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-medium tracking-tight text-neutral-900">Submit Report</h1>
                            <p className="text-sm text-neutral-500 mt-1.5">Provide detailed information to ensure rapid triage and resolution.</p>
                        </div>
                        <Link href="/issues" className="text-neutral-400 hover:text-black transition-colors">
                            <Icon icon="solar:close-circle-linear" className="text-xl" />
                        </Link>
                    </div>

                    <form className="flex flex-col flex-1 gap-6">

                        {/* Coordinates (Read-only) */}
                        <div>
                            <label className="text-sm font-medium text-neutral-700 block mb-2">GPS Coordinates</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <Icon icon="solar:routing-2-linear" className="text-neutral-400 text-lg" />
                                </div>
                                <input
                                    type="text"
                                    readOnly
                                    defaultValue="37.7749° N, 122.4194° W"
                                    className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-600 font-mono focus:outline-none cursor-default"
                                />
                            </div>
                        </div>

                        {/* Severity Selector */}
                        <div>
                            <label className="text-sm font-medium text-neutral-700 block mb-2">Severity Level</label>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { id: 'sev-low', label: 'Low', color: 'bg-emerald-400' },
                                    { id: 'sev-medium', label: 'Medium', color: 'bg-amber-400', default: true },
                                    { id: 'sev-critical', label: 'Critical', color: 'bg-red-500' },
                                ].map((sev) => (
                                    <div key={sev.id} className="relative">
                                        <input type="radio" name="severity" id={sev.id} className="peer sr-only" defaultChecked={sev.default} />
                                        <label htmlFor={sev.id} className="flex flex-col items-center justify-center p-3.5 border border-neutral-200 rounded-xl cursor-pointer transition-all hover:bg-neutral-50 peer-checked:border-black peer-checked:ring-1 peer-checked:ring-black peer-checked:bg-neutral-50/50">
                                            <span className={`w-2.5 h-2.5 rounded-full ${sev.color} mb-2 shadow-sm`}></span>
                                            <span className="text-sm font-medium text-neutral-500 peer-checked:text-black transition-colors">{sev.label}</span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Description */}
                        <div className="flex-1 flex flex-col">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-neutral-700 block">Description</label>
                                <span className="text-xs text-neutral-400">Optional</span>
                            </div>
                            <textarea
                                placeholder="Describe the conditions, hazards, or specific context..."
                                className="w-full flex-1 min-h-[120px] p-3.5 bg-white border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-shadow resize-none"
                            ></textarea>
                        </div>

                        {/* Footer Area: SLA & Submit */}
                        <div className="mt-2 flex flex-col gap-5">

                            {/* SLA Notice */}
                            <div className="flex gap-3 items-start bg-neutral-50 border border-neutral-200/60 rounded-xl p-3.5">
                                <Icon icon="solar:shield-warning-linear" className="text-neutral-500 text-lg shrink-0 mt-0.5" />
                                <p className="text-xs text-neutral-600 leading-relaxed">
                                    <span className="font-medium text-neutral-900">Priority Routing:</span> Reports marked as Critical automatically trigger immediate escalation with a 15-minute response SLA.
                                </p>
                            </div>

                            {/* Submit Button */}
                            <button type="submit" className="w-full flex items-center justify-center gap-2 bg-black text-white px-6 py-3.5 rounded-xl text-sm font-medium hover:bg-neutral-800 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black">
                                Submit Report
                                <Icon icon="solar:arrow-right-linear" className="text-lg" />
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
}
