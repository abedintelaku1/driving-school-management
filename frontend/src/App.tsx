import React, { useEffect, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext, useAuthProvider } from './hooks/useAuth';
import { useToast, setGlobalToastHandler } from './hooks/useToast';
import { ToastContainer } from './components/ui/Toast';
// Layouts
import { AdminLayout } from './components/layout/AdminLayout';
import { InstructorLayout } from './components/layout/InstructorLayout';
// Pages
import { LoginPage } from './pages/LoginPage';
// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { CandidatesPage } from './pages/admin/CandidatesPage';
import { CandidateDetailPage } from './pages/admin/CandidateDetailPage';
import { CarsPage } from './pages/admin/CarsPage';
import { InstructorsPage } from './pages/admin/InstructorsPage';
import { PaymentsPage } from './pages/admin/PaymentsPage';
import { PackagesPage } from './pages/admin/PackagesPage';
import { ReportsPage } from './pages/admin/ReportsPage';
// Instructor Pages
import { InstructorDashboard } from './pages/instructor/InstructorDashboard';
import { AppointmentsPage } from './pages/instructor/AppointmentsPage';
import { CalendarPage } from './pages/instructor/CalendarPage';
import { MyCandidatesPage } from './pages/instructor/MyCandidatesPage';
import { MyReportsPage } from './pages/instructor/MyReportsPage';
function ProtectedRoute({
  children,
  allowedRole
}: {
  children: React.ReactNode;
  allowedRole?: 0 | 1; // 0 = Admin, 1 = Instructor
}) {
  const {
    user,
    isAuthenticated,
    loading
  } = useContext(AuthContext)!;
  
  // Wait for auth check to complete before redirecting
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRole !== undefined && user?.role !== allowedRole) {
    return <Navigate to={user?.role === 0 ? '/admin' : '/instructor'} replace />;
  }
  
  return <>{children}</>;
}
function AppContent() {
  const auth = useAuthProvider();
  const toast = useToast();
  // Set global toast handler
  useEffect(() => {
    setGlobalToastHandler(toast);
  }, [toast]);
  return <AuthContext.Provider value={auth}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute allowedRole={0}>
                <AdminLayout title="Admin Panel" />
              </ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="candidates" element={<CandidatesPage />} />
            <Route path="candidates/:id" element={<CandidateDetailPage />} />
            <Route path="cars" element={<CarsPage />} />
            <Route path="instructors" element={<InstructorsPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="packages" element={<PackagesPage />} />
            <Route path="reports" element={<ReportsPage />} />
          </Route>

          {/* Instructor Routes */}
          <Route path="/instructor" element={<ProtectedRoute allowedRole={1}>
                <InstructorLayout title="Instructor Panel" />
              </ProtectedRoute>}>
            <Route index element={<InstructorDashboard />} />
            <Route path="appointments" element={<AppointmentsPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="candidates" element={<MyCandidatesPage />} />
            <Route path="reports" element={<MyReportsPage />} />
          </Route>

          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
      <ToastContainer toasts={toast.toasts} onDismiss={toast.removeToast} />
    </AuthContext.Provider>;
}
export function App() {
  return <AppContent />;
}