
# Product Requirements Document (PRD)

## Project: Transparent Road Maintenance Intelligence Platform

## Scope: Hackathon Demo (Fully Mock Data)

---

## 1. Project Overview

This project is a desktop-first responsive web application built using Next.js and Firebase (Authentication, Firestore, Hosting).

The system simulates a GPS-enabled civic road damage reporting platform with transparent repair tracking, SLA enforcement, and contractor performance analytics.

All data is mock-generated but logically consistent and dynamically computed.

---

## 2. Problem Definition

Cities lack:

* Structured and centralized road damage reporting
* Transparent tracking of repair assignment and progress
* Measurable accountability for contractor timelines
* Actionable analytics for prioritization
* Closed feedback loops between citizens and authorities

The system aims to convert fragmented complaints into measurable infrastructure performance data.

---

## 3. Goals (Hackathon Scope)

The system must demonstrate:

* Structured reporting workflow
* Transparent end-to-end issue tracking
* SLA deadline enforcement
* Public contractor performance metrics
* Authority decision dashboard
* Dynamic metric computation from issue data

---

## 4. Non-Goals

The system will NOT include:

* Real municipal integration
* Real-time ML prediction
* Rainfall or traffic APIs
* Navigation app integration
* Production-grade security enforcement
* Real-world contractor login accounts

---

## 5. User Roles

### Citizen

* Can report issues
* Can view all issues
* Can confirm or reopen completed issues
* Can view public analytics dashboard

### Authority

* Can update issue status
* Can assign contractors
* Can view operational analytics
* Can monitor SLA compliance

Roles are stored as a field in the user object and enforced at UI level only.

---

## 6. Core Citizen Features

1. Issue Reporting

   * Upload photo
   * Auto/mock GPS location
   * Select severity (Low / Medium / Critical)
   * Optional description
   * Submit

2. Duplicate Detection

   * If issue exists within defined radius → merge confirmation
   * Else create new issue

3. Issues Feed

   * Sorted by urgency (Critical + Overdue first)
   * Card view with key metadata

4. Issue Detail Page

   * Status timeline
   * SLA countdown
   * Contractor performance summary
   * Confirmation count
   * Reopen option

5. Public Analytics Dashboard

   * Total issues
   * Open %
   * Overdue %
   * Avg resolution days
   * Contractor leaderboard

---

## 7. Authority Features

1. Overview Dashboard

   * KPI strip
   * Severity distribution
   * Zone-wise issue counts

2. Issue Management

   * Filterable table
   * Status update dropdown
   * Contractor assignment dropdown

3. SLA Monitoring

   * Overdue issues table
   * Aging report sorted by days open

4. Contractor Performance Page

   * On-time rate
   * Avg resolution days
   * Reopen rate
   * Total assigned
   * Performance score

---

## 8. Status Workflow

Each issue follows:

Reported → Verified → Assigned → In Progress → Completed → Citizen Verified

If multiple reopen confirmations occur → status = Reopened

---

## 9. SLA Logic

* SLA begins when status becomes “Assigned”
* Default SLA = 7 days
* If current date > assignedAt + 7 days → Overdue = true
* SLA compliance affects contractor metrics

---

## 10. Contractor Accountability Engine

Contractors are data entities (not logged-in users).

Metrics dynamically calculated from issue records:

* On-time completion rate
* Average resolution days
* Reopen rate
* Total assigned
* Performance score

Performance score formula (example):

Score =
(0.5 × On-time %)

* (0.3 × Inverse Avg Days Score)

- (0.2 × Reopen Rate)

All metrics computed client-side from issue dataset.

---

## 11. Duplicate & Cross-Validation Logic

* If new issue location within X meters of existing → increment confirmationCount
* Severity weighting increases with confirmations
* Reopen threshold = 3 “Not Fixed” confirmations

---

## 12. Data Model (Firestore Collections)

### users

* id
* name
* role (citizen | authority)

### issues

* id
* title
* description
* location {lat, lng, zone}
* severity
* status
* createdAt
* verifiedAt
* assignedAt
* completedAt
* contractorId
* confirmationCount
* reopenCount

### contractors

* id
* name
* zone

### confirmations

* id
* issueId
* userId
* type (confirm | reopen)
* timestamp

---

## 13. Mock Data Strategy

* Seed ~200 issues
* 5 contractors
* Randomized timestamps over past 30 days
* Some issues intentionally overdue
* Some issues intentionally reopened
* Some contractors intentionally underperforming

Data generation script included.

---

## 14. Performance Calculations

On-time %
= completedWithinSLA / totalCompleted

Avg Resolution Days
= average(completedAt - assignedAt)

Reopen %
= reopenedIssues / totalCompleted

All calculations dynamic from issue dataset.

---

## 15. Page Structure (Next.js Routes)

/login
/issues (Feed)
/issue/[id]
/report
/dashboard (Public Analytics)
/admin
/admin/issues
/admin/contractors

---

## 16. UI Requirements

* Desktop-first
* Minimalist
* Data-dense
* KPI-driven
* No marketing pages
* Responsive to mobile

---

## 17. Tech Stack

* Next.js (App Router)
* Firebase Authentication
* Firestore
* Firebase Hosting
* All data mocked

---

## 18. Access Control

* UI-based role control
* Citizen cannot access admin routes
* Authority can access all

Firebase rules not production hardened (demo-only).

---

## 19. Success Criteria (Hackathon)

The demo must clearly show:

* Report → Assign → SLA → Complete → Verify loop
* Overdue flag logic functioning
* Contractor ranking changing based on issue data
* Dashboard metrics dynamically updating
* Clear differentiation from simple reporting apps

