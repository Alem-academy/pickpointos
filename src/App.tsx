import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/layout/AuthContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Layout } from "@/components/layout/Layout";
import Login from "@/pages/Login";
import HRDashboard from "@/pages/hr/Dashboard";
import NewEmployeePage from "@/pages/hr/NewEmployee";
import RFDashboard from "@/pages/rf/Dashboard";
import NewHire from "@/pages/rf/NewHire";
import MyPoint from "@/pages/rf/MyPoint";
import SchedulePage from '@/pages/operations/Schedule';
import NewPvzPage from "@/pages/operations/NewPvz";
import ExpensesPage from '@/pages/finance/Expenses';
import PnLPage from '@/pages/finance/PnL';
import AnalyticsDashboard from "@/pages/analytics/Dashboard";
import Applications from "@/pages/hr/Applications";
import EmployeeProfile from "@/pages/hr/EmployeeProfile";
import Timesheet from "@/pages/hr/Timesheet";
import Discipline from "@/pages/hr/Discipline";
import Employees from "@/pages/hr/Employees";
import RentPage from "@/pages/finance/Rent";
import { useAuth } from "@/components/layout/AuthContext";

function IndexRedirect() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (user.role === 'hr') return <Navigate to="/hr/applications" replace />;
  if (user.role === 'rf') return <Navigate to="/rf" replace />;
  if (user.role === 'financier') return <Navigate to="/finance/pnl" replace />;
  if (user.role === 'admin') return <Navigate to="/hr/applications" replace />;

  return <Navigate to="/login" replace />;
}


function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<Layout />}>
            {/* HR Routes */}
            <Route element={<ProtectedRoute allowedRoles={['hr', 'admin']} />}>
              <Route path="/hr" element={<HRDashboard />} />
              <Route path="/hr/applications" element={<Applications />} />
              <Route path="/hr/employees" element={<Employees />} />
              <Route path="/hr/new-employee" element={<NewEmployeePage />} />
              <Route path="hr/employees/:id" element={<EmployeeProfile />} />
              <Route path="/hr/timesheet" element={<Timesheet />} />
              <Route path="/hr/discipline" element={<Discipline />} />

              {/* Advanced Operations & Finance (HR/Admin/Financier) */}
              <Route element={<ProtectedRoute allowedRoles={['hr', 'admin', 'financier']} />}>
                <Route path="operations/new-pvz" element={<NewPvzPage />} />
                <Route path="finance/rent" element={<RentPage />} />
                <Route path="finance/pnl" element={<PnLPage />} />
                <Route path="analytics" element={<AnalyticsDashboard />} />
                <Route path="analytics/dashboard" element={<AnalyticsDashboard />} />
              </Route>

              <Route path="/" element={<IndexRedirect />} />
            </Route>

            {/* Shared Operations & Finance (HR, RF, Admin, Financier) */}
            <Route element={<ProtectedRoute allowedRoles={['hr', 'rf', 'admin', 'financier']} />}>
              <Route path="operations/schedule" element={<SchedulePage />} />
              <Route path="operations/timesheets" element={<Timesheet />} />
              <Route path="finance/expenses" element={<ExpensesPage />} />
            </Route>

            {/* RF Routes */}
            <Route element={<ProtectedRoute allowedRoles={['rf', 'admin']} />}>
              <Route path="/rf" element={<RFDashboard />} />
              <Route path="/rf/new-hire" element={<NewHire />} />
              <Route path="/rf/my-point" element={<MyPoint />} />
            </Route>
          </Route>

          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
      <Toaster />
    </AuthProvider>
  );
}

export default App;
