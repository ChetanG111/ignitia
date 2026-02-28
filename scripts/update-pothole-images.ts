import {
    collection,
    getDocs,
    updateDoc,
    orderBy,
    query,
    getFirestore,
    Timestamp
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

// Mirror the logic from lib/utils.ts
const severityOrder: Record<string, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
};

function calculateSLA(issue: any) {
    if (!issue.assignedAt || issue.status === "completed" || issue.status === "citizen_verified") {
        return { isOverdue: false };
    }
    const assignedDate = issue.assignedAt.toDate();
    const now = new Date();
    const slaDeadline = new Date(assignedDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    return { isOverdue: now > slaDeadline };
}

const HIGH_QUALITY_IMAGES = [
    "https://images.unsplash.com/photo-1541888086425-d81bb19240f5?w=800&q=80&fit=crop",
    "https://images.unsplash.com/photo-1596487048032-0fe0017ad371?w=800&q=80&fit=crop",
    "https://images.unsplash.com/photo-1584467541268-b040f83be3fd?w=800&q=80&fit=crop",
    "https://images.unsplash.com/photo-1562916183-50983e20606f?w=800&q=80&fit=crop",
    "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=800&q=80&fit=crop",
    "https://images.unsplash.com/photo-1621293954908-907159247fc8?w=800&q=80&fit=crop",
    "https://images.unsplash.com/photo-1547949003-9792a18a2601?w=800&q=80&fit=crop",
    "https://images.unsplash.com/photo-1599387737281-893a95ff0e8e?w=800&q=80&fit=crop",
    "https://images.unsplash.com/photo-1621430030588-46603a105825?w=800&q=80&fit=crop",
    "https://images.unsplash.com/photo-1533230408708-8f9f91d1235a?w=800&q=80&fit=crop",
    "https://images.unsplash.com/photo-1589118949245-7d38baf380d6?w=800&q=80&fit=crop",
    "https://images.unsplash.com/photo-1605647540924-852290f6b0d5?w=800&q=80&fit=crop",
    "https://images.unsplash.com/photo-1588654522434-31121d586161?w=800&q=80&fit=crop",
    "https://images.unsplash.com/photo-1590674154761-12c8209348d7?w=800&q=80&fit=crop",
    "https://images.unsplash.com/photo-1594786118579-95ba90c801ec?w=800&q=80&fit=crop",
    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80&fit=crop",
    "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&q=80&fit=crop",
    "https://images.unsplash.com/photo-1579227114347-15d08fc37cae?w=800&q=80&fit=crop",
    "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=800&q=80&fit=crop",
    "https://images.unsplash.com/photo-1542615525-46f4995f56b2?w=800&q=80&fit=crop",
    "https://images.unsplash.com/photo-1563806456209-42b719468164?w=800&q=80&fit=crop", // User's: OOiAy2lBZc
    "https://images.unsplash.com/photo-1621252179027-94459d278660?w=800&q=80&fit=crop", // User's: MQjJHTT-diQ
    "https://media.istockphoto.com/id/502561495/photo/pot-holed-road.webp?a=1&b=1&s=612x612&w=0&k=20&c=S9FvmjGBw3BU0YVF7MSD0auwNo2G_83vOvSrwvxFWVM=",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQCwIC0GZUMMXshPCy_IinSe-iBuuJaqx33-Z7AYmkwdNS9B1BNaYVsIks&s",
    "https://akm-img-a-in.tosshub.com/indiatoday/images/story/201707/mumbai_potholes_story_647_072117032707.jpg",
    "https://www.deccanherald.com/sites/dh/files/articleimages/2022/11/04/pothole-1159392-1667554541.jpg",
    "https://i.ndtvimg.com/i/2018-07/mumbai-potholes-generic-istock_650x400_81531474922.jpg"
];

const PLACEHOLDER_IMG = "https://images.unsplash.com/photo-1541888086425-d81bb19240f5?w=200&q=20&fit=crop";

async function clearImages() {
    console.log("🛠️  Clearing ALL imageUrl values from the database...\n");

    const issuesRef = collection(db, "issues");
    const snapshot = await getDocs(issuesRef);

    if (snapshot.empty) {
        console.log("❌ No issues found in database.");
        return;
    }

    const allIssues = snapshot.docs;
    console.log(`📊 Found ${allIssues.length} total issues.`);

    for (const docSnap of allIssues) {
        await updateDoc(docSnap.ref, {
            imageUrl: ""
        });
    }

    console.log(`\n✅ Finished! All ${allIssues.length} issues have been cleared of images.`);
    process.exit(0);
}

clearImages().catch(err => {
    console.error("❌ Clearing failed:", err);
    process.exit(1);
});
