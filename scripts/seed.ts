import {
    collection,
    addDoc,
    Timestamp,
    getFirestore,
    getDocs,
    deleteDoc,
    query
} from "firebase/firestore";
import { initializeApp } from "firebase/app";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Load .env.local
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const CONTRACTORS = [
    { name: "Apex Construction", zone: "Downtown Core" },
    { name: "BuildRite Inc.", zone: "West End" },
    { name: "Structure Dynamics", zone: "North Hills" },
    { name: "Metro Maintenance", zone: "East Riverside" },
    { name: "Skyline Builders", zone: "South Harbor" },
];

const SEVERITIES = ["low", "medium", "high", "critical"];
const STATUSES = ["reported", "verified", "assigned", "in_progress", "completed", "citizen_verified", "reopened"];
const ZONES = ["Downtown Core", "West End", "North Hills", "East Riverside", "South Harbor"];

const getRandom = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];

async function seed() {
    console.log("🚀 Starting AXIS Database Sealing...");

    // 1. Seed Contractors
    console.log("🏗️ Seeding Contractors...");
    const contractorIds: string[] = [];
    for (const c of CONTRACTORS) {
        const docRef = await addDoc(collection(db, "contractors"), c);
        contractorIds.push(docRef.id);
    }

    // 2. Seed ~100 Issues
    console.log("📝 Seeding ~100 Issues...");
    for (let i = 0; i < 100; i++) {
        const severity = getRandom(SEVERITIES);
        const zone = getRandom(ZONES);
        const status = getRandom(STATUSES);

        // Logic for dates
        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 30)); // Last 30 days

        let assignedAt = null;
        let completedAt = null;
        let contractorId = null;

        if (["assigned", "in_progress", "completed", "citizen_verified", "reopened"].includes(status)) {
            assignedAt = new Date(createdAt);
            assignedAt.setHours(assignedAt.getHours() + Math.floor(Math.random() * 24));
            contractorId = getRandom(contractorIds);
        }

        if (["completed", "citizen_verified"].includes(status)) {
            completedAt = new Date(assignedAt!);
            completedAt.setDate(completedAt.getDate() + Math.floor(Math.random() * 10)); // Resolved in 1-10 days
        }

        const issue = {
            title: `${severity.toUpperCase()} Priority: Road damage in ${zone}`,
            description: "Automated mock report for platform demonstration. High resolution data analysis required.",
            severity,
            status,
            location: {
                lat: 40.7128 + (Math.random() - 0.5) * 0.1,
                lng: -74.0060 + (Math.random() - 0.5) * 0.1,
                zone
            },
            createdAt: Timestamp.fromDate(createdAt),
            assignedAt: assignedAt ? Timestamp.fromDate(assignedAt) : null,
            completedAt: completedAt ? Timestamp.fromDate(completedAt) : null,
            contractorId,
            confirmationCount: Math.floor(Math.random() * 10),
            reopenCount: status === "reopened" ? 3 : Math.floor(Math.random() * 2),
            imageUrl: "https://images.unsplash.com/photo-1541888086425-d81bb19240f5?w=600&h=600&fit=crop"
        };

        await addDoc(collection(db, "issues"), issue);
    }

    console.log("✅ Seeding Complete! AXIS is now alive.");
    process.exit(0);
}

seed().catch(err => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
});
