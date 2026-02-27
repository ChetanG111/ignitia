import {
    collection,
    query,
    onSnapshot,
    orderBy,
    addDoc,
    updateDoc,
    doc,
    Timestamp,
    serverTimestamp,
    increment
} from "firebase/firestore";
import { db } from "./firebase";
import { Issue, Contractor, Confirmation } from "@/types";

export const DataService = {
    /**
     * Listen to issues
     */
    subscribeIssues: (callback: (issues: Issue[]) => void) => {
        const q = query(collection(db, "issues"), orderBy("createdAt", "desc"));
        return onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Issue[];
            callback(data);
        });
    },

    /**
     * Listen to contractors
     */
    subscribeContractors: (callback: (contractors: Contractor[]) => void) => {
        const q = query(collection(db, "contractors"), orderBy("name"));
        return onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Contractor[];
            callback(data);
        });
    },

    /**
     * Create new issue
     */
    createIssue: async (issue: Omit<Issue, 'id' | 'createdAt' | 'confirmationCount' | 'reopenCount'>) => {
        return addDoc(collection(db, "issues"), {
            ...issue,
            createdAt: serverTimestamp(),
            confirmationCount: 1,
            reopenCount: 0,
            status: "reported"
        });
    },

    /**
     * Update issue status
     */
    updateIssueStatus: async (issueId: string, status: string, additionalData: any = {}) => {
        const issueRef = doc(db, "issues", issueId);
        return updateDoc(issueRef, {
            status,
            ...additionalData
        });
    },

    /**
     * Increment confirmation (duplicate/citizen report)
     */
    confirmIssue: async (issueId: string) => {
        const issueRef = doc(db, "issues", issueId);
        return updateDoc(issueRef, {
            confirmationCount: increment(1)
        });
    },

    /**
     * Reopen issue
     */
    reopenIssue: async (issueId: string) => {
        const issueRef = doc(db, "issues", issueId);
        // Logic from TDD: If reopenCount >= 3, status becomes "reopened"
        // Here we'll just handle the increment and the UI can trigger status change if needed, 
        // or we handle it here.
        return updateDoc(issueRef, {
            reopenCount: increment(1),
            status: "reopened",
            assignedAt: serverTimestamp() // Reset SLA
        });
    }
};
