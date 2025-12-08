import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
type AdminLayoutProps = {
  title?: string;
};
export function AdminLayout({
  title
}: AdminLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return <div className="min-h-screen bg-gray-50">
      <Sidebar role="admin" collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />

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