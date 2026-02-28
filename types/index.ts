import { Timestamp } from "firebase/firestore";

export type Severity = "low" | "medium" | "high" | "critical";

export type IssueStatus =
    | "reported"
    | "verified"
    | "assigned"
    | "in_progress"
    | "completed"
    | "citizen_verified"
    | "reopened";

export interface Issue {
    id: string;
    title: string;
    description: string;
    severity: Severity;
    status: IssueStatus;
    location: {
        lat: number;
        lng: number;
        zone: string;
    };
    createdAt: Timestamp;
    verifiedAt?: Timestamp | null;
    assignedAt?: Timestamp | null;
    completedAt?: Timestamp | null;
    contractorId?: string | null;
    confirmationCount: number; // Total confirmations (legacy/all)
    confirmExistsCount: number; // Citizens confirming it exists
    confirmFixedCount: number; // Citizens confirming it is fixed
    reopenCount: number; // Citizens reporting it's not fixed
    reportedBy?: string;
    imageUrl?: string;
}

export interface Contractor {
    id: string;
    name: string;
    zone: string;
}

export interface ContractorMetrics {
    onTimeRate: string;
    avgResolutionDays: string;
    reopenRate: string;
    totalAssigned: number;
    performanceScore: number;
}

export interface Confirmation {
    id: string;
    issueId: string;
    userId: string;
    type: "confirm" | "reopen" | "confirm_exists";
    timestamp: Timestamp;
}
