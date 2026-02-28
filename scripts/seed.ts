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
    { name: "BuildRite Inc.", zone: "West Central" },
    { name: "Structure Dynamics", zone: "North Central" },
    { name: "Metro Maintenance", zone: "East Central" },
    { name: "Skyline Builders", zone: "South Central" },
];

const SEVERITIES = ["low", "medium", "high", "critical"];
const STATUSES = ["reported", "verified", "assigned", "in_progress", "completed", "citizen_verified", "reopened"];

// Zone names matching the ZoneMap component
const ZONES = [
    { name: "Northwest District", lat: 40.7220, lng: -74.0100 },
    { name: "Northeast District", lat: 40.7250, lng: -73.9950 },
    { name: "North Central", lat: 40.7235, lng: -74.0025 },
    { name: "West Central", lat: 40.7155, lng: -74.0110 },
    { name: "Downtown Core", lat: 40.7128, lng: -74.0060 },
    { name: "East Central", lat: 40.7140, lng: -73.9960 },
    { name: "Southwest District", lat: 40.7050, lng: -74.0120 },
    { name: "South Central", lat: 40.7040, lng: -74.0040 },
    { name: "Southeast District", lat: 40.7030, lng: -73.9960 },
];

// Mock user IDs to simulate different reporters
// The first ID should be replaced with your real Firebase UID after signing up
const MOCK_USER_IDS = [
    "demo-citizen-001",
    "demo-citizen-002",
    "demo-citizen-003",
    "demo-citizen-004",
    "demo-citizen-005",
];

const getRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

async function clearCollection(name: string) {
    console.log(`   🗑️  Clearing ${name}...`);
    const snapshot = await getDocs(query(collection(db, name)));
    let count = 0;
    for (const docSnap of snapshot.docs) {
        await deleteDoc(docSnap.ref);
        count++;
    }
    console.log(`   ✓  Deleted ${count} ${name} documents.`);
}

async function seed() {
    console.log("🚀 Starting AXIS Database Seeding...\n");

    // 0. Clear existing data
    console.log("🧹 Clearing old data...");
    await clearCollection("issues");
    await clearCollection("contractors");
    await clearCollection("confirmations");
    console.log("");

    // 1. Seed Contractors
    console.log("🏗️  Seeding Contractors...");
    const contractorIds: string[] = [];
    for (const c of CONTRACTORS) {
        const docRef = await addDoc(collection(db, "contractors"), c);
        contractorIds.push(docRef.id);
        console.log(`   ✓ ${c.name} (${c.zone})`);
    }
    console.log("");

    // 2. Seed ~100 Issues with reportedBy
    console.log("📝 Seeding ~100 Issues...");
    const issueIds: string[] = [];
    const issueUserMap: Record<string, string> = {}; // issueId -> userId

    for (let i = 0; i < 100; i++) {
        const severity = getRandom(SEVERITIES);
        const zoneData = getRandom(ZONES);
        const status = getRandom(STATUSES);
        const reportedBy = getRandom(MOCK_USER_IDS);

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

        // Add slight randomization to coordinates within the zone
        const latJitter = (Math.random() - 0.5) * 0.005;
        const lngJitter = (Math.random() - 0.5) * 0.005;

        const issue = {
            title: `${severity.toUpperCase()} Priority: Road damage in ${zoneData.name}`,
            description: "Automated mock report for platform demonstration. High resolution data analysis required.",
            severity,
            status,
            location: {
                lat: zoneData.lat + latJitter,
                lng: zoneData.lng + lngJitter,
                zone: zoneData.name
            },
            reportedBy,
            createdAt: Timestamp.fromDate(createdAt),
            assignedAt: assignedAt ? Timestamp.fromDate(assignedAt) : null,
            completedAt: completedAt ? Timestamp.fromDate(completedAt) : null,
            contractorId,
            confirmationCount: Math.floor(Math.random() * 10) + 1,
            reopenCount: status === "reopened" ? 3 : Math.floor(Math.random() * 2),
            imageUrl: "https://images.unsplash.com/photo-1541888086425-d81bb19240f5?w=600&h=600&fit=crop"
        };

        const docRef = await addDoc(collection(db, "issues"), issue);
        issueIds.push(docRef.id);
        issueUserMap[docRef.id] = reportedBy;

        if ((i + 1) % 25 === 0) {
            console.log(`   ✓ ${i + 1}/100 issues created...`);
        }
    }
    console.log("");

    // 3. Seed Confirmations (link users to issues they confirmed)
    console.log("✅ Seeding Confirmations...");
    let confirmCount = 0;

    for (const issueId of issueIds) {
        const reporterId = issueUserMap[issueId];

        // The reporter always has a confirmation
        await addDoc(collection(db, "confirmations"), {
            issueId,
            userId: reporterId,
            type: "confirm",
            timestamp: Timestamp.fromDate(new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000))
        });
        confirmCount++;

        // Add 0-3 extra confirmations from other users
        const extraConfirms = Math.floor(Math.random() * 4);
        for (let j = 0; j < extraConfirms; j++) {
            const otherUser = getRandom(MOCK_USER_IDS.filter(u => u !== reporterId));
            await addDoc(collection(db, "confirmations"), {
                issueId,
                userId: otherUser,
                type: "confirm",
                timestamp: Timestamp.fromDate(new Date(Date.now() - Math.random() * 25 * 24 * 60 * 60 * 1000))
            });
            confirmCount++;
        }
    }
    console.log(`   ✓ ${confirmCount} confirmation records created.`);
    console.log("");

    console.log("═══════════════════════════════════════════");
    console.log("✅ Seeding Complete! AXIS is now alive.");
    console.log(`   📊 ${CONTRACTORS.length} contractors`);
    console.log(`   📝 ${issueIds.length} issues`);
    console.log(`   ✅ ${confirmCount} confirmations`);
    console.log("═══════════════════════════════════════════");
    console.log("");
    console.log("💡 TIP: After logging in, your My Reports page will");
    console.log("   show issues reported by your Firebase UID.");
    console.log("   To populate it with demo data, report a few issues");
    console.log("   from the /report page while logged in.");
    console.log("");

    process.exit(0);
}

seed().catch(err => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
});
