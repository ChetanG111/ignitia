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
    { name: "Telangana Road Corp", zone: "Banjara Hills" },
    { name: "Hitech Infra", zone: "HITEC City" },
    { name: "Charminar Heritage Builders", zone: "Charminar" },
    { name: "Gachibowli Tech-Roads", zone: "Gachibowli" },
    { name: "Cyberabad Maintenance", zone: "Kukatpally" },
];

const SEVERITIES = ["low", "medium", "high", "critical"];
const STATUSES = ["reported", "verified", "assigned", "in_progress", "completed", "citizen_verified", "reopened"];

// Zone names matching the ZoneMap component (Hyderabad)
const ZONES = [
    { name: "Kukatpally", lat: 17.4933, lng: 78.3847 },
    { name: "Ameerpet", lat: 17.4375, lng: 78.4482 },
    { name: "Secunderabad", lat: 17.4399, lng: 78.4983 },
    { name: "Gachibowli", lat: 17.4401, lng: 78.3489 },
    { name: "Banjara Hills", lat: 17.4156, lng: 78.4347 },
    { name: "Begumpet", lat: 17.4447, lng: 78.4664 },
    { name: "HITEC City", lat: 17.4435, lng: 78.3772 },
    { name: "Jubilee Hills", lat: 17.4284, lng: 78.4115 },
    { name: "Charminar", lat: 17.3616, lng: 78.4747 },
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
        const statusProb = Math.random();
        const status = statusProb > 0.6 ? "citizen_verified" :
            statusProb > 0.4 ? "completed" :
                statusProb > 0.3 ? "in_progress" :
                    statusProb > 0.2 ? "assigned" :
                        statusProb > 0.1 ? "verified" : "reported";
        const reportedBy = getRandom(MOCK_USER_IDS);

        // Logic for dates
        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 60)); // Last 60 days

        let assignedAt = null;
        let completedAt = null;
        let contractorId = null;

        if (["assigned", "in_progress", "completed", "citizen_verified", "reopened"].includes(status)) {
            assignedAt = new Date(createdAt);
            assignedAt.setHours(assignedAt.getHours() + Math.floor(Math.random() * 48));
            contractorId = getRandom(contractorIds);
        }

        if (["completed", "citizen_verified"].includes(status)) {
            completedAt = new Date(assignedAt!);
            // 85% of repairs take 2-6 days (within SLA)
            // 15% take 8-15 days (overdue)
            const daysToComplete = Math.random() > 0.15 ? (2 + Math.floor(Math.random() * 4)) : (8 + Math.floor(Math.random() * 7));
            completedAt.setDate(completedAt.getDate() + daysToComplete);
        }

        // Add slight randomization to coordinates within the zone
        const latJitter = (Math.random() - 0.5) * 0.005;
        const lngJitter = (Math.random() - 0.5) * 0.005;

        // Realistic Reopen Logic: ~5% of completed issues get a reopen report
        const hasReopen = Math.random() < 0.05;

        const POTHOLE_IMAGES = [
            "https://images.unsplash.com/photo-1541888086425-d81bb19240f5?w=800&q=80&fit=crop",
            "https://images.unsplash.com/photo-1596487048032-0fe0017ad371?w=800&q=80&fit=crop",
            "https://images.unsplash.com/photo-1584467541268-b040f83be3fd?w=800&q=80&fit=crop",
            "https://images.unsplash.com/OOiAy2lBZc?w=800&q=80&fit=crop",
            "https://images.unsplash.com/MQjJHTT-diQ?w=800&q=80&fit=crop",
            "https://media.istockphoto.com/id/502561495/photo/pot-holed-road.webp?a=1&b=1&s=612x612&w=0&k=20&c=S9FvmjGBw3BU0YVF7MSD0auwNo2G_83vOvSrwvxFWVM=",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQCwIC0GZUMMXshPCy_IinSe-iBuuJaqx33-Z7AYmkwdNS9B1BNaYVsIks&s",
            "https://akm-img-a-in.tosshub.com/indiatoday/images/story/201707/mumbai_potholes_story_647_072117032707.jpg",
            "https://www.deccanherald.com/sites/dh/files/articleimages/2022/11/04/pothole-1159392-1667554541.jpg",
            "https://i.ndtvimg.com/i/2018-07/mumbai-potholes-generic-istock_650x400_81531474922.jpg",
            "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=800&q=80&fit=crop",
            "https://images.unsplash.com/photo-1621293954908-907159247fc8?w=800&q=80&fit=crop",
            "https://images.unsplash.com/photo-1547949003-9792a18a2601?w=800&q=80&fit=crop",
            "https://images.unsplash.com/photo-1599387737281-893a95ff0e8e?w=800&q=80&fit=crop",
            "https://images.unsplash.com/photo-1621430030588-46603a105825?w=800&q=80&fit=crop",
            "https://images.unsplash.com/photo-1533230408708-8f9f91d1235a?w=800&q=80&fit=crop",
            "https://images.unsplash.com/photo-1589118949245-7d38baf380d6?w=800&q=80&fit=crop",
            "https://images.unsplash.com/photo-1605647540924-852290f6b0d5?w=800&q=80&fit=crop",
            "https://images.unsplash.com/photo-1588654522434-31121d586161?w=800&q=80&fit=crop"
        ];

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
            confirmExistsCount: Math.floor(Math.random() * 5),
            confirmFixedCount: ["completed", "citizen_verified"].includes(status) ? (3 + Math.floor(Math.random() * 5)) : Math.floor(Math.random() * 2),
            reopenCount: status === "reopened" ? 3 : (hasReopen ? 1 : 0),
            imageUrl: `https://images.unsplash.com/${getRandom(POTHOLE_IMAGES)}?w=800&q=80&fit=crop`
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
