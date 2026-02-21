import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboardIcon, UsersIcon, CarIcon, GraduationCapIcon, CreditCardIcon, PackageIcon, FileTextIcon, CalendarIcon, ClipboardListIcon, XIcon } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import type { UserRole } from '../../types';
type NavItem = {
  label: string;
  path: string;
  icon: React.ReactNode;
};

function useNavItems(role: UserRole): NavItem[] {
  const { t } = useLanguage();
  
  const adminNavItems: NavItem[] = [{
    label: t('sidebar.dashboard'),
    path: '/admin',
    icon: <LayoutDashboardIcon className="w-5 h-5" />
  }, {
    label: t('sidebar.candidates'),
    path: '/admin/candidates',
    icon: <UsersIcon className="w-5 h-5" />
  }, {
    label: t('sidebar.cars'),
    path: '/admin/cars',
    icon: <CarIcon className="w-5 h-5" />
  }, {
    label: t('sidebar.instructors'),
    path: '/admin/instructors',
    icon: <GraduationCapIcon className="w-5 h-5" />
  }, {
    label: t('sidebar.payments'),
    path: '/admin/payments',
    icon: <CreditCardIcon className="w-5 h-5" />
  }, {
    label: t('sidebar.packages'),
    path: '/admin/packages',
    icon: <PackageIcon className="w-5 h-5" />
  }, {
    label: t('sidebar.reports'),
    path: '/admin/reports',
    icon: <FileTextIcon className="w-5 h-5" />
  }];

  // Staff (role 2): only Dashboard and Payments – can add payments, cannot edit/delete
  const staffNavItems: NavItem[] = [{
    label: t('sidebar.dashboard'),
    path: '/admin',
    icon: <LayoutDashboardIcon className="w-5 h-5" />
  }, {
    label: t('sidebar.payments'),
    path: '/admin/payments',
    icon: <CreditCardIcon className="w-5 h-5" />
  }];
  
  const instructorNavItems: NavItem[] = [{
    label: t('sidebar.dashboard'),
    path: '/instructor',
    icon: <LayoutDashboardIcon className="w-5 h-5" />
  }, {
    label: t('sidebar.appointments'),
    path: '/instructor/appointments',
    icon: <ClipboardListIcon className="w-5 h-5" />
  }, {
    label: t('sidebar.calendar'),
    path: '/instructor/calendar',
    icon: <CalendarIcon className="w-5 h-5" />
  }, {
    label: t('sidebar.myCandidates'),
    path: '/instructor/candidates',
    icon: <UsersIcon className="w-5 h-5" />
  }, {
    label: t('sidebar.myReports'),
    path: '/instructor/reports',
    icon: <FileTextIcon className="w-5 h-5" />
  }];

  return role === 0 ? adminNavItems : role === 2 ? staffNavItems : instructorNavItems;
}
type SidebarProps = {
  role: UserRole;
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
};
export function Sidebar({
  role,
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose
}: SidebarProps) {
  const { t } = useLanguage();
  const navItems = useNavItems(role);
  return <>
      {/* Mobile Overlay */}
      {mobileOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onMobileClose} />}

      {/* Sidebar */}
      <aside className={`
          fixed left-0 top-0 h-full bg-gray-900 text-white z-50
          transition-transform duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          ${collapsed ? 'lg:w-16' : 'w-64'}
        `}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
          {!collapsed && <>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CarIcon className="w-5 h-5" />
                </div>
                <span className="font-bold text-lg">{t('app.title')}</span>
              </div>
              {/* Mobile Close Button */}
              <button onClick={onMobileClose} className="lg:hidden p-2 hover:bg-gray-800 rounded-lg transition-colors" aria-label={t('sidebar.closeMenu')}>
                <XIcon className="w-5 h-5" />
              </button>
            </>}
          {collapsed && <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mx-auto">
              <CarIcon className="w-5 h-5" />
            </div>}
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          {navItems.map(item => <NavLink key={item.path} to={item.path} end={item.path === '/admin' || item.path === '/instructor'} onClick={onMobileClose} className={({
          isActive
        }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                ${isActive ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}
                ${collapsed ? 'justify-center lg:justify-center' : ''}
              `} title={collapsed ? item.label : undefined}>
              {item.icon}
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </NavLink>)}
        </nav>

        {/* Desktop Toggle Button - Hidden on mobile */}
        <button onClick={onToggle} className="hidden lg:block absolute -right-3 top-20 w-6 h-6 bg-gray-900 border border-gray-700 rounded-full items-center justify-center text-gray-400 hover:text-white transition-colors" aria-label={collapsed ? t('sidebar.expandMenu') : t('sidebar.collapseMenu')}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {collapsed ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />}
          </svg>
        </button>
      </aside>
    </>;
}