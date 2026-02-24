import React, { useState } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuth } from '../../hooks/useAuth';

// Staff (role 2) may only access these admin paths; candidates for documents
const STAFF_ALLOWED_PATHS = ['/admin', '/admin/profile', '/admin/payments', '/admin/candidates'];

type AdminLayoutProps = {
  title?: string;
};
export function AdminLayout({
  title
}: AdminLayoutProps) {
  const { user } = useAuth();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const role = user?.role === 2 ? 2 : 0;
  const isStaff = user?.role === 2;
  const isCandidateDetailPage = location.pathname.startsWith('/admin/candidates/');
  const pathAllowed =
    STAFF_ALLOWED_PATHS.includes(location.pathname) ||
    isCandidateDetailPage;
  if (isStaff && !pathAllowed) {
    return <Navigate to="/admin" replace />;
  }
  return <div className="min-h-screen bg-gray-50">
      <Sidebar role={role} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />

      <div className={`
          transition-all duration-300 ease-in-out
          lg:ml-64
          ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}
        `}>
        <Header title={title} onMobileMenuToggle={() => setMobileMenuOpen(true)} />
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>;
}