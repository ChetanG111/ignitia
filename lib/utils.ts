import { Timestamp } from "firebase/firestore";
import { Issue, Severity } from "../types";

export function calculateSLA(issue: Issue) {
    if (!issue.assignedAt || issue.status === "completed" || issue.status === "citizen_verified") {
        return { isOverdue: false, overdueText: "" };
    }

    const assignedDate = issue.assignedAt.toDate();
    const now = new Date();
    const slaDeadline = new Date(assignedDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 Days

    if (now > slaDeadline) {
        const diffMs = now.getTime() - slaDeadline.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        const text = diffDays > 0 ? `${diffDays}d overdue` : `${diffHours}h overdue`;
        return { isOverdue: true, overdueText: `-${text}` };
    }

    const remainingMs = slaDeadline.getTime() - now.getTime();
    const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
    const remainingDays = Math.floor(remainingHours / 24);

    const text = remainingDays > 0 ? `${remainingDays}d remaining` : `${remainingHours}h remaining`;
    return { isOverdue: false, overdueText: text };
}

export function calculateOpenDays(createdAt: Timestamp) {
    const createdDate = createdAt.toDate();
    const now = new Date();
    const diffMs = now.getTime() - createdDate.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export function formatStatus(status: string): string {
    return status
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

export const severityOrder: Record<Severity, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
};

/**
 * Returns the higher of two severities.
 * Smaller order number = Higher severity.
 */
export function getHigherSeverity(s1: Severity, s2: Severity): Severity {
    return severityOrder[s1] < severityOrder[s2] ? s1 : s2;
}

/**
 * Escalates severity based on the number of citizen confirmations.
 * Rule: 3+ -> Medium, 8+ -> High, 15+ -> Critical.
 */
export function getEscalatedSeverity(currentSeverity: Severity, confirmationCount: number): Severity {
    let escalated = currentSeverity;

    if (confirmationCount >= 15) {
        escalated = "critical";
    } else if (confirmationCount >= 8) {
        escalated = getHigherSeverity(currentSeverity, "high");
    } else if (confirmationCount >= 3) {
        escalated = getHigherSeverity(currentSeverity, "medium");
    }

    return escalated;
}
