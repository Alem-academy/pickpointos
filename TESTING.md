# Manual Testing Instructions - PVZ Management OS

This guide outlines how to manually test the key features of the PVZ Management OS.

## 1. Authentication & Roles
**Goal**: Verify role-based access control.

1.  **Login Page**: Navigate to `/login`. Verify the new design with the infographic.
2.  **Admin Login**: Click "Администратор".
    *   Verify you are redirected to `/hr` (or the default dashboard).
    *   **Sidebar**: Verify you see ALL sections: HR, Operations, Finance, Analytics.
3.  **HR Login**: Logout and click "HR Менеджер".
    *   **Sidebar**: Verify you ONLY see HR sections.
4.  **RF Login**: Logout and click "Управляющий (РФ)".
    *   **Sidebar**: Verify you ONLY see Operations/RF sections.

## 2. HR Module
**Goal**: Verify employee lifecycle management.

1.  **Applications**: Navigate to `/hr/applications`.
    *   Drag a candidate from "New" to "Review".
    *   Click "Reject" on a candidate.
2.  **Employees**: Navigate to `/hr/employees`.
    *   Click on an employee to view their profile.
    *   **Discipline**: Go to the "Discipline" tab in the profile. Add a warning.
    *   **Transfer**: Click "Transfer" and move the employee to a different PVZ.
3.  **Timesheet**: Navigate to `/hr/timesheet`.
    *   Select a month. Verify the grid loads.
    *   Click "Approve Month".

## 3. Operations Module
**Goal**: Verify daily operations.

1.  **Schedule**: Navigate to `/operations/schedule`.
    *   Click "Generate Schedule". Select dates and teams.
    *   Verify shifts appear on the calendar.
2.  **New PVZ**: Navigate to `/operations/new-pvz`.
    *   Fill out the form (Name, Address, Brand).
    *   Click "Start Process".
    *   Toggle items in the checklist (Renovation, Equipment, etc.).
    *   Verify the progress bar updates.

## 4. Finance Module
**Goal**: Verify financial flows.

1.  **Rent**: Navigate to `/finance/rent`.
    *   View the list of PVZs.
    *   Click "Pay" on a pending rent item.
2.  **Expenses (OpEx)**: Navigate to `/finance/expenses`.
    *   Click "New Request" and submit an expense (e.g., "Office Supplies", 5000).
    *   Verify it appears in "Pending".
    *   Click "Approve" (Green Check). Verify it moves to "Approved".
3.  **P&L**: Navigate to `/finance/pnl`.
    *   Select a PVZ and Month.
    *   Verify the Net Profit calculation (Revenue - Expenses - Payroll).

## 5. Analytics
**Goal**: Verify high-level insights.

1.  **Dashboard**: Navigate to `/analytics/dashboard`.
    *   Check the "Revenue", "OpEx", and "Net Profit" cards.
    *   Verify the "Top PVZ" list is populated.
    *   Check the "Recent Activity" feed.

## Technical Verification
To ensure the code is production-ready:

```bash
npm run build
```

If the build passes without errors, the application is ready for deployment.
