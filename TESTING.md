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
**Goal**: Verify employee lifecycle management and E-gov onboarding.

1.  **New Employee Request**: Navigate to `/hr`. Click "Добавить кандидата".
    *   Fill out Personal Info (IIN is required).
    *   Fill out Job Info (Role, PVZ).
    *   Upload required documents (ID scan, Photo). Submit.
2.  **Applications Kanban**: Navigate to `/hr`.
    *   Verify candidate is in "Новые заявки".
    *   Click the candidate to open the `CandidateModal`. Verify IIN, Phone, Email are visible.
    *   Click "На доработку" (Revision). Verify card moves to the red "Доработка" column.
    *   Click on candidate again, click "Одобрить к оформлению". Verify card moves to "Оформление".
3.  **Document Rejection & Review**: Navigate to `/hr`, open a candidate in "Оформление", click "В профиль".
    *   Go to "Документы" tab.
    *   Click "Отклонить" on a specific document.
    *   Verify candidate status changes to `revision` (orange banner appears in "Общие данные").
    *   Upload a new document to replace the rejected one.
4.  **Contract Generation**:
    *   In the "Документы" tab, click "Трудовой договор".
    *   Enter 20-character IBAN. Verify document is generated.
5.  **Employee Profile**:
    *   Go to "Общие данные" tab. Verify IIN, IBAN, and Address are correctly displayed.
6.  **Discipline / Transfer**:
    *   Go to the "Discipline" tab. Add a warning.
    *   Click "Transfer" and move the employee to a different PVZ.

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
