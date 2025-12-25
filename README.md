# PVZ Management OS (HR Core + Finance)

## Context & Objective
This project aims to create a corporate ERP system for managing a network of Wildberries Pickup Points (PVZ) in Kazakhstan. The system replaces disparate Excel files and a costly Retool MVP with a hybrid architecture solution.
Last Updated: 2025-12-25 (Force Rebuild)

**Fundamental Principle:** Hybrid Architecture.
- **HR Block:** Full-fledged Web Application (High security, file handling).
- **Finance Block:** Google Sheets as input interface (Speed, familiarity, mass data), backed by a cloud database.

## Global Goals
1.  **Operational Efficiency:** Reduce hiring time from 5 days to 2 days via digital workflow.
2.  **Financial Control:** Automatic P&L generation per point (weekly/monthly).
3.  **End-to-End Analytics:** Identify loss-making points and root causes (fines, payroll, theft, low rating).

## Execution Plan (4 Streams)

### Stream A: Infrastructure & Security (Railway)
-   **Database:** Railway Managed PostgreSQL (`employees`, `pvz_points`, `financial_transactions`).
-   **Storage:** Cloud Storage (documents bucket).
-   **Auth:** JWT-based authentication with RBAC (`hr`, `rf`, `admin`).

### Stream B: HR Module (Web Application)
-   **Hiring & Onboarding:** Candidate forms, photo uploads, HR Kanban board.
-   **Document Management:** PDF generation.
-   **Personnel Records:** Digital dossier, seniority motivation.

### Stream C: Finance Module (Data Engineering)
-   **Data Ingestion:** WB Parser (Node.js), mapping, validation.
-   **Google Sheets Sync:** Triggers for expense processing.
-   **Calculation Engine:** P&L (Gross/Net Profit).
-   **Payroll:** Auto-calculation based on shifts.

### Stream D: Visualization (Frontend Dashboard)
-   **Operational:** Hiring funnel, turnover.
-   **Financial:** P&L pivot tables, PVZ ratings.

## Technical Architecture
-   **Frontend:** React 18, TypeScript, Tailwind CSS, Shadcn UI.
-   **Backend:** Node.js (Express) on Railway.
-   **Database:** Railway Managed PostgreSQL + Redis.
-   **DevOps:** Railway (CI/CD).

## Success Metrics
-   **Paperless Office:** 0% paper documents for hiring.
-   **Speed:** P&L available 5 mins after data upload.
-   **Transparency:** Real-time payroll visibility.
