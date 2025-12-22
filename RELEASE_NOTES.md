# Release Notes: localization-v1.0

## 🚀 Overview
This release focuses on the **complete Russian localization** of the PVZ Management OS frontend and critical **backend stability fixes**. The application is now fully localized for Russian-speaking users across all roles (HR, Operations, Finance, Analytics).

> [!IMPORTANT]
> **Hotfix v1.0.1**: Resolved a TypeScript build error preventing deployment on Railway (`Type 'string' is not assignable to type 'number'` in NewEmployeePage). The build is now passing green.

## ✨ New Features
- **Full Russian Localization**: All interfaces, buttons, errors, and tooltips are now in Russian.
- **New Employee Page**: Added `/hr/new-employee` for HR managers to manually register new staff members without needing the public application form.
- **Enhanced Notifications**: Replaced native browser alerts with modern, styled toast notifications (`sonner`) for better user feedback.
- **Improved Loading States**: Added "Skeleton" loading screens for dashboards and reports to improve perceived performance.

## 🛠 Backend & Schema Fixes
- **Document Types**: Fixed a mismatch between the frontend `document_type` enum (expected `order_hiring`) and the backend database (stored as `order`).
- **Timesheets**: Resolved an issue where `fact_hours` was not being correctly read/written to the `shifts` table (mapped to `actual_hours`).

## 📦 Technical Improvements
- **Type Safety**: Implemented strict Zod schemas for API responses.
- **React Query**: Migrated data fetching to React Query for better caching and state management.
- **Linting**: Resolved hundreds of ESLint warnings and unused code.

## 🧪 Testing Instructions
1.  **Login**: Verify login flow and error messages in Russian.
2.  **HR**: Create a new employee manually via the "Add Employee" button.
3.  **Operations**: Check the RF Dashboard statistics and shift status.
4.  **Finance**: Submit a test expense and generate a mock P&L report.
5.  **General**: Navigate through the app to ensure no "undefined" text or English strings remain.
