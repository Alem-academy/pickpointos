import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/components/layout/AuthContext';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { Layout } from '@/components/layout/Layout';
import Login from '@/pages/Login';
import HRDashboard from '@/pages/hr/Dashboard';
import RFDashboard from '@/pages/rf/Dashboard';
import NewHire from '@/pages/rf/NewHire';
import Applications from '@/pages/hr/Applications';
import Templates from '@/pages/hr/Templates';

const router = createBrowserRouter([
    {
        path: '/login',
        element: <Login />,
    },
    {
        element: <Layout />,
        children: [
            {
                element: <ProtectedRoute allowedRoles={['hr', 'admin']} />,
                children: [
                    { path: '/hr', element: <HRDashboard /> },
                    { path: '/hr/applications', element: <Applications /> },
                    { path: '/hr/templates', element: <Templates /> },
                ],
            },
            {
                element: <ProtectedRoute allowedRoles={['rf']} />,
                children: [
                    { path: '/rf', element: <RFDashboard /> },
                    { path: '/rf/new-hire', element: <NewHire /> },
                ],
            },
        ],
    },
    {
        path: '/',
        element: <Navigate to="/login" replace />,
    },
]);

export const AppRoutes = () => {
    return (
        <AuthProvider>
            <RouterProvider router={router} />
        </AuthProvider>
    );
};
