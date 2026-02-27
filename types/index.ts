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

export interface Location {
    lat: number;
    lng: number;
    zone: string;
}

export interface Issue {
    id: string;
    title: string;
    description: string;
    severity: Severity;
    status: IssueStatus;
    location: Location;
    createdAt: Timestamp;
    verifiedAt?: Timestamp;
    assignedAt?: Timestamp;
    completedAt?: Timestamp;
    contractorId?: string;
    confirmationCount: number;
    reopenCount: number;
    imageUrl?: string;
}

export interface Contractor {
    id: string;
    name: string;
    zone: string;
    onTimeRate?: number;
    avgResolutionDays?: number;
    reopenRate?: number;
    totalAssigned?: number;
    performanceScore?: number;
}

export interface Confirmation {
    id: string;
    issueId: string;
    userId: string;
    type: "confirm" | "reopen";
    timestamp: Timestamp;
}

export interface UserProfile {
    uid: string;
    name: string;
    role: "citizen" | "authority";
    email: string;
}
