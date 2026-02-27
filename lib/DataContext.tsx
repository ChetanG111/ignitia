"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { Issue, Contractor } from "@/types";
import { DataService } from "./dataService";
import { computeContractorMetrics } from "./logic";

interface DataContextType {
    issues: Issue[];
    contractors: Contractor[];
    loading: boolean;
    stats: {
        totalIssues: number;
        openPercentage: number;
        overduePercentage: number;
        avgResolution: number;
    };
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
    const [issues, setIssues] = useState<Issue[]>([]);
    const [baseContractors, setBaseContractors] = useState<Contractor[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubIssues = DataService.subscribeIssues((data) => {
            setIssues(data);
            setLoading(false);
        });

        const unsubContractors = DataService.subscribeContractors((data) => {
            setBaseContractors(data);
        });

        return () => {
            unsubIssues();
            unsubContractors();
        };
    }, []);

    const contractors = useMemo(() => {
        return computeContractorMetrics(issues, baseContractors);
    }, [issues, baseContractors]);

    const stats = useMemo(() => {
        const total = issues.length;
        if (total === 0) return { totalIssues: 0, openPercentage: 0, overduePercentage: 0, avgResolution: 0 };

        const openCount = issues.filter(i => i.status !== "completed" && i.status !== "citizen_verified").length;
        const openPercentage = (openCount / total) * 100;

        // Overdue calculation logic duplicated here for summary
        const overdueCount = issues.filter(i => {
            if (i.status === "completed" || i.status === "citizen_verified" || !i.assignedAt) return false;
            const deadline = new Date(i.assignedAt.toDate());
            deadline.setDate(deadline.getDate() + 7);
            return new Date() > deadline;
        }).length;
        const overduePercentage = (overdueCount / total) * 100;

        const completed = issues.filter(i => i.status === "completed" || i.status === "citizen_verified");
        const avgResolution = completed.length > 0
            ? completed.reduce((acc, i) => {
                if (!i.assignedAt || !i.completedAt) return acc;
                return acc + (i.completedAt.toDate().getTime() - i.assignedAt.toDate().getTime());
            }, 0) / (completed.length * 1000 * 60 * 60 * 24)
            : 0;

        return {
            totalIssues: total,
            openPercentage,
            overduePercentage,
            avgResolution
        };
    }, [issues]);

    return (
        <DataContext.Provider value={{ issues, contractors, loading, stats }}>
            {children}
        </DataContext.Provider>
    );
}

export function useData() {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error("useData must be used within a DataProvider");
    }
    return context;
}
