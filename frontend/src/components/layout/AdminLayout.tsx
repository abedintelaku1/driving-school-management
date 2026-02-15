import React, { useState } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuth } from '../../hooks/useAuth';

// Staff (role 2) may only access these admin paths; others redirect to /admin
const STAFF_ALLOWED_PATHS = ['/admin', '/admin/profile', '/admin/payments'];

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
  // Admin area: role 0 (Admin) or 2 (Staff – limited menu and payment permissions)
  const role = user?.role === 2 ? 2 : 0;
  const isStaff = user?.role === 2;
  const pathAllowed = STAFF_ALLOWED_PATHS.includes(location.pathname);
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