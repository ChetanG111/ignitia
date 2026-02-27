Transparent Road Maintenance Intelligence Platform

1. Architecture Overview

Frontend:

Next.js (App Router, TypeScript)

Desktop-first responsive UI

Backend:

Firebase Authentication

Firestore (database)

Firebase Hosting

All business logic (SLA, metrics, scoring) computed client-side from Firestore data.

No external APIs. No server-side custom backend.

2. Application Architecture Pattern

Client-heavy architecture

Firestore as single source of truth

Derived metrics calculated in memory after data fetch

No server-side cron jobs (SLA computed dynamically on render)

Data Flow:

User Action → Firestore Write → Snapshot Listener → UI Re-render → Derived Metrics Recalculate

3. Firestore Structure

Collections:

users
issues
contractors
confirmations

Indexes required:

issues.status

issues.severity

issues.assignedAt

issues.contractorId

issues.location.zone

Geo queries simulated using zone field (not real geo-hashing).

4. Issue Object Schema
{
  id: string,
  title: string,
  description: string,
  severity: "low" | "medium" | "critical",
  status: "reported" | "verified" | "assigned" | "in_progress" | "completed" | "citizen_verified" | "reopened",
  location: {
    lat: number,
    lng: number,
    zone: string
  },
  createdAt: timestamp,
  verifiedAt?: timestamp,
  assignedAt?: timestamp,
  completedAt?: timestamp,
  contractorId?: string,
  confirmationCount: number,
  reopenCount: number
}
5. SLA Logic (Client-Side)

Default SLA: 7 days from assignedAt.

Overdue Calculation:

if (status !== "completed" && now > assignedAt + 7 days)
   overdue = true

On-time completion:

completedWithinSLA = completedAt <= assignedAt + 7 days

SLA recalculated dynamically during render.

6. Contractor Metrics Computation

For each contractor:

totalAssigned = issues where contractorId matches

totalCompleted = issues where status == completed

onTimeCount = completedWithinSLA

reopenCount = issues where reopenCount > 0

Metrics:

onTimeRate = onTimeCount / totalCompleted
avgResolutionDays = avg(completedAt - assignedAt)
reopenRate = reopenCount / totalCompleted

Performance Score:

score = (0.5 * onTimeRate)
      + (0.3 * inverse(avgResolutionDays))
      - (0.2 * reopenRate)

All computed after fetching issues array.

7. Duplicate Detection Logic

On report submit:

Compare new issue zone

Check for issues in same zone with status != completed

If found → increment confirmationCount

Else → create new issue

No true geospatial radius calculation (mock simplification).

8. Reopen Logic

When citizen selects "Not Fixed":

Add confirmation record

Increment reopenCount

If reopenCount >= 3:
status = "reopened"
assignedAt = new timestamp (SLA reset)

9. State Management

React Server Components for initial fetch

Client components for interactive tables

useState for local filters

Derived analytics calculated in useMemo

No external state management library.

10. Routing Structure

Public:

/issues

/issue/[id]

/report

/dashboard

Admin:

/admin

/admin/issues

/admin/contractors

Protected via role check in layout.

11. Mock Data Seeding

Seed Script:

Generate 200 issues

Random severity distribution

Random statuses

Random assignedAt timestamps

20–30% overdue

10–15% reopened

5 contractors with uneven performance

Seeding executed once at project setup.

12. UI Rendering Strategy

Tables:

Client-rendered

Sort + filter client-side

KPI Cards:

Derived counts from issue array

No pagination required for 200 records (hackathon scope).

13. Performance Considerations

Single batch fetch for issues

Compute metrics once per render

Avoid nested re-calculations

Dataset intentionally limited for smooth demo performance.

14. Security (Hackathon Scope)

Role field stored in user document

Conditional rendering based on role

Firestore rules permissive (demo-only)

15. Deployment

Firebase Hosting

Environment variables stored securely

Production build via Next.js build output