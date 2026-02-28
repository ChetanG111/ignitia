"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs, addDoc, updateDoc, doc, increment, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { Severity, Issue } from "@/types";
import { getHigherSeverity, getEscalatedSeverity } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import ZoneMap, { CITY_ZONES, Zone } from "@/components/ZoneMap";
import { useRef } from "react";

export default function ReportIssuePage() {
    const router = useRouter();
    const { user } = useAuth();
    const [severity, setSeverity] = useState<Severity>("medium");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [selectedZoneId, setSelectedZoneId] = useState<string | null>("dc"); // default Downtown Core
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Get selected zone data
    const selectedZone = CITY_ZONES.find(z => z.id === selectedZoneId);
    const MOCK_LOCATION = {
        lat: selectedZone?.lat || 40.7128,
        lng: selectedZone?.lng || -74.0060,
        zone: selectedZone?.name || "Downtown Core"
    };

    const handleZoneSelect = (zone: Zone) => {
        setSelectedZoneId(zone.id);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const clearImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedFile(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let uploadedImageUrl = "https://images.unsplash.com/photo-1541888086425-d81bb19240f5?w=600&h=600&fit=crop";

            if (selectedFile) {
                const storageRef = ref(storage, `issue_images/${Date.now()}_${selectedFile.name}`);
                const snapshot = await uploadBytes(storageRef, selectedFile);
                uploadedImageUrl = await getDownloadURL(snapshot.ref);
            }

            // 1. Duplicate Detection (TDD Section 11)
            // Check for open issues in the same zone
            const q = query(
                collection(db, "issues"),
                where("location.zone", "==", MOCK_LOCATION.zone),
                where("status", "not-in", ["completed", "citizen_verified"])
            );

            const querySnapshot = await getDocs(q);
            let targetIssueId = "";

            if (!querySnapshot.empty) {
                // If found, apply Dynamic Severity Weighting (PRD Section 11)
                const existingDoc = querySnapshot.docs[0];
                const existingData = { id: existingDoc.id, ...existingDoc.data() } as Issue;
                targetIssueId = existingDoc.id;

                const newCount = existingData.confirmationCount + 1;

                // Compare reporter's perceived severity vs existing
                const baseSeverity = getHigherSeverity(existingData.severity, severity);

                // Apply volume-based escalation (e.g., 8+ confirmations -> High)
                const escalatedSeverity = getEscalatedSeverity(baseSeverity, newCount);

                await updateDoc(doc(db, "issues", targetIssueId), {
                    confirmationCount: increment(1),
                    confirmExistsCount: increment(1),
                    severity: escalatedSeverity,
                    // Refresh title with updated priority level
                    title: `${escalatedSeverity.toUpperCase()} Priority: Road damage in ${MOCK_LOCATION.zone}`
                });

                // Add confirmation record for audit trail
                await addDoc(collection(db, "confirmations"), {
                    issueId: targetIssueId,
                    userId: user?.uid || "anonymous",
                    type: "confirm",
                    timestamp: serverTimestamp()
                });
            } else {
                // 2. Create New Issue
                const newIssue = {
                    title: `${severity.toUpperCase()} Priority: Road damage in ${MOCK_LOCATION.zone}`,
                    description: description || "Citizen reported road maintenance requirement.",
                    severity,
                    status: "reported",
                    location: MOCK_LOCATION,
                    reportedBy: user?.uid || "anonymous",
                    createdAt: serverTimestamp(),
                    verifiedAt: null,
                    assignedAt: null,
                    completedAt: null,
                    contractorId: null,
                    confirmationCount: 1,
                    confirmExistsCount: 1,
                    confirmFixedCount: 0,
                    reopenCount: 0,
                    imageUrl: uploadedImageUrl
                };
                const docRef = await addDoc(collection(db, "issues"), newIssue);
                targetIssueId = docRef.id;

                // Also create initial confirmation record
                await addDoc(collection(db, "confirmations"), {
                    issueId: targetIssueId,
                    userId: user?.uid || "anonymous",
                    type: "confirm",
                    timestamp: serverTimestamp()
                });
            }

            // 3. Redirect to the issue detail page
            router.push(`/issue/${targetIssueId}`);
        } catch (error) {
            console.error("Submission failed:", error);
            setLoading(false);
        }
    };

    return (
        <div className="bg-neutral-100 text-neutral-900 min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-12 selection:bg-black selection:text-white">
            <div className="w-full max-w-[960px] bg-white rounded-2xl shadow-md border border-neutral-200 flex flex-col md:flex-row overflow-hidden anim-bounce">

                {/* Left Panel: Media & Location */}
                <div className="w-full md:w-5/12 p-6 md:p-8 flex flex-col gap-6 bg-white border-b md:border-b-0 md:border-r border-neutral-200">
                    <div className="flex-1 flex flex-col">
                        <label className="text-sm font-medium text-neutral-700 mb-2 block">Evidence Media</label>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 min-h-[200px] border-2 border-dashed border-neutral-200 rounded-xl bg-neutral-50 hover:bg-neutral-100/50 hover:border-black transition-all cursor-pointer flex flex-col items-center justify-center text-center p-6 group relative overflow-hidden"
                        >
                            {imagePreview ? (
                                <>
                                    <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                        <button
                                            type="button"
                                            onClick={clearImage}
                                            className="w-10 h-10 rounded-full bg-white text-red-500 shadow-md flex items-center justify-center hover:scale-110 transition-transform"
                                        >
                                            <Icon icon="solar:trash-bin-trash-bold" className="text-xl" />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="w-12 h-12 rounded-full bg-white border border-neutral-200 shadow-sm flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                                        <Icon icon="solar:camera-add-linear" className="text-xl text-neutral-600" />
                                    </div>
                                    <span className="text-sm font-medium text-neutral-800">Drag & drop files here</span>
                                    <span className="text-xs text-neutral-500 mt-1">or click to browse from device</span>
                                </>
                            )}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                className="hidden"
                            />
                        </div>
                    </div>

                    {/* Interactive Zone Map */}
                    <ZoneMap
                        selectedZone={selectedZoneId}
                        onZoneSelect={handleZoneSelect}
                    />
                </div>

                {/* Right Panel: Form Fields */}
                <div className="w-full md:w-7/12 p-6 md:p-8 flex flex-col bg-white">
                    <div className="mb-8 flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-medium tracking-tight text-neutral-900">Submit Report</h1>
                            <p className="text-sm text-neutral-500 mt-1.5">Provide detailed information to ensure rapid triage and resolution.</p>
                        </div>
                        <Link href="/issues" className="text-neutral-400 hover:text-black transition-colors">
                            <Icon icon="solar:close-circle-linear" className="text-xl" />
                        </Link>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col flex-1 gap-6">
                        <div>
                            <label className="text-sm font-medium text-neutral-700 block mb-2">Service Zone</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <Icon icon="solar:map-point-bold-duotone" className="text-neutral-400 text-lg" />
                                </div>
                                <input
                                    type="text"
                                    readOnly
                                    value={`${MOCK_LOCATION.zone} District`}
                                    className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-600 font-medium focus:outline-none cursor-default"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-neutral-700 block mb-2">Severity Level</label>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { id: 'low', label: 'Low', color: 'bg-emerald-400' },
                                    { id: 'medium', label: 'Medium', color: 'bg-amber-400' },
                                    { id: 'critical', label: 'Critical', color: 'bg-red-500' },
                                ].map((sev) => (
                                    <div key={sev.id} className="relative">
                                        <input
                                            type="radio"
                                            name="severity"
                                            id={sev.id}
                                            className="peer sr-only"
                                            checked={severity === sev.id}
                                            onChange={() => setSeverity(sev.id as Severity)}
                                        />
                                        <label htmlFor={sev.id} className="flex flex-col items-center justify-center p-3.5 border border-neutral-200 rounded-xl cursor-pointer transition-all hover:bg-neutral-50 peer-checked:border-black peer-checked:ring-1 peer-checked:ring-black peer-checked:bg-neutral-50/50">
                                            <span className={`w-2.5 h-2.5 rounded-full ${sev.color} mb-2 shadow-sm`}></span>
                                            <span className="text-sm font-medium text-neutral-500 peer-checked:text-black transition-colors">{sev.label}</span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-neutral-700 block">Description</label>
                            </div>
                            <textarea
                                required
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe the conditions, hazards, or specific context..."
                                className="w-full flex-1 min-h-[120px] p-3.5 bg-white border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-shadow resize-none"
                            ></textarea>
                        </div>

                        <div className="mt-2 flex flex-col gap-5">
                            <div className="flex gap-3 items-start bg-neutral-50 border border-neutral-200/60 rounded-xl p-3.5">
                                <Icon icon="solar:shield-warning-linear" className="text-neutral-500 text-lg shrink-0 mt-0.5" />
                                <p className="text-xs text-neutral-600 leading-relaxed">
                                    <span className="font-medium text-neutral-900">Priority Routing:</span> Reports in <b>{MOCK_LOCATION.zone}</b> are cross-checked against active tickets to prevent redundancy.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !selectedZoneId}
                                className="w-full flex items-center justify-center gap-2 bg-black text-white px-6 py-3.5 rounded-xl text-sm font-medium hover:bg-neutral-800 disabled:bg-neutral-400 transition-colors shadow-sm"
                            >
                                {loading ? <Icon icon="solar:refresh-linear" className="animate-spin text-lg" /> : "Submit Report"}
                                {!loading && <Icon icon="solar:arrow-right-linear" className="text-lg" />}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
