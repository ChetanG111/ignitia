import { Issue, Contractor, IssueStatus } from "@/types";

/**
 * SLA Constants
 */
const DEFAULT_SLA_DAYS = 7;

/**
 * Calculates if an issue is overdue based on assignment date.
 */
export const isIssueOverdue = (issue: Issue): boolean => {
    if (issue.status === "completed" || issue.status === "citizen_verified" || !issue.assignedAt) {
        return false;
    }

    const now = new Date();
    const assignedDate = issue.assignedAt.toDate();
    const deadline = new Date(assignedDate);
    deadline.setDate(deadline.getDate() + DEFAULT_SLA_DAYS);

    return now > deadline;
};

/**
 * Calculates remaining or overdue time string for display.
 */
export const getSLADisplayStatus = (issue: Issue): { text: string; isOverdue: boolean } | null => {
    if (!issue.assignedAt || issue.status === "completed" || issue.status === "citizen_verified") {
        return null;
    }

    const now = new Date();
    const assignedDate = issue.assignedAt.toDate();
    const deadline = new Date(assignedDate);
    deadline.setDate(deadline.getDate() + DEFAULT_SLA_DAYS);

    const diffMs = deadline.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffMs < 0) {
        const overdueHours = Math.abs(diffHours);
        if (overdueHours < 24) return { text: `-${overdueHours}h overdue`, isOverdue: true };
        return { text: `-${Math.floor(overdueHours / 24)}d overdue`, isOverdue: true };
    } else {
        if (diffHours < 24) return { text: `${diffHours}h remaining`, isOverdue: false };
        return { text: `${diffDays}d remaining`, isOverdue: false };
    }
};

/**
 * Computes metrics for a list of contractors based on an array of issues.
 */
export const computeContractorMetrics = (issues: Issue[], contractors: Contractor[]): Contractor[] => {
    return contractors.map((contractor) => {
        const contractorIssues = issues.filter((i) => i.contractorId === contractor.id);
        const completedIssues = contractorIssues.filter((i) => i.status === "completed" || i.status === "citizen_verified");

        if (contractorIssues.length === 0) {
            return {
                ...contractor,
                onTimeRate: 100,
                avgResolutionDays: 0,
                reopenRate: 0,
                totalAssigned: 0,
                performanceScore: 0,
            };
        }

        // On-Time Rate: % of completed issues that were done within SLA
        const onTimeCount = completedIssues.filter((i) => {
            if (!i.assignedAt || !i.completedAt) return true;
            const deadline = new Date(i.assignedAt.toDate());
            deadline.setDate(deadline.getDate() + DEFAULT_SLA_DAYS);
            return i.completedAt.toDate() <= deadline;
        }).length;

        const onTimeRate = completedIssues.length > 0 ? (onTimeCount / completedIssues.length) * 100 : 100;

        // Avg Resolution Days
        const resolutionDays = completedIssues.map((i) => {
            if (!i.assignedAt || !i.completedAt) return 0;
            const diffMs = i.completedAt.toDate().getTime() - i.assignedAt.toDate().getTime();
            return diffMs / (1000 * 60 * 60 * 24);
        });
        const avgResolutionDays = completedIssues.length > 0 ? resolutionDays.reduce((a, b) => a + b, 0) / completedIssues.length : 0;

        // Reopen Rate: % of ALL assigned issues that have had at least one reopen report
        // This is a more realistic "Defect Rate" than dividing by a small subset of completions
        const reopenedCount = contractorIssues.filter((i) => i.reopenCount > 0).length;
        const reopenRate = (reopenedCount / contractorIssues.length) * 100;

        // Performance Score Formula (0-100)
        // 50% On-time, 30% Resolution Speed, 20% Quality (Inverse Reopen)
        const speedScore = Math.max(0, 100 - (avgResolutionDays * 5)); // 20 days = 0 score
        const qualityScore = Math.max(0, 100 - (reopenRate * 2)); // 50% reopen = 0 score

        const score = (0.5 * onTimeRate) + (0.3 * speedScore) + (0.2 * qualityScore);

        return {
            ...contractor,
            onTimeRate,
            avgResolutionDays,
            reopenRate,
            totalAssigned: contractorIssues.length,
            performanceScore: Math.max(0, Math.min(100, score)),
        };
    }).sort((a, b) => (b.performanceScore || 0) - (a.performanceScore || 0));
};

/**
 * Duplicate Detection Logic
 */
export const checkDuplicateIssue = (newZone: string, existingIssues: Issue[]): Issue | null => {
    // Simplification from TDD: Check same zone, not completed
    return existingIssues.find(i => i.location.zone === newZone && i.status !== "completed" && i.status !== "citizen_verified") || null;
};
