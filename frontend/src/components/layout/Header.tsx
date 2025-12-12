import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellIcon, LogOutIcon, UserIcon, SettingsIcon, ChevronDownIcon, MenuIcon } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { useAuth } from '../../hooks/useAuth';
type HeaderProps = {
  title?: string;
  onMobileMenuToggle: () => void;
};
export function Header({
  title,
  onMobileMenuToggle
}: HeaderProps) {
  const {
    user,
    logout
  } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  // Sample notifications for testing (replace with API data when available).
  // Për real-time duhen thirrje API (polling) ose websocket/event-stream, sepse nuk ka backend notifikimesh aktualisht.
  const notifications = [
    { id: '1', title: 'New candidate added', description: 'Jane Doe', time: 'Just now' },
    { id: '2', title: 'Appointment scheduled', description: 'Tomorrow 10:00 - 11:00', time: '5m ago' }
  ];
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setShowDropdown(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  return <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
      {/* Left side - Mobile menu + Title */}
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        <button onClick={onMobileMenuToggle} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Open menu">
          <MenuIcon className="w-5 h-5 text-gray-600" />
        </button>

        {/* Title */}
        {title && <h1 className="text-lg lg:text-xl font-semibold text-gray-900 truncate">
            {title}
          </h1>}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 lg:gap-4">
        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button
            className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Notifications"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <BellIcon className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
              <div className="px-4 pb-2 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900">Notifications</p>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-sm text-gray-500 px-4 py-3">No notifications</p>
                ) : (
                  notifications.map(item => (
                    <div key={item.id} className="px-4 py-3 hover:bg-gray-50">
                      <p className="text-sm font-medium text-gray-900">{item.title}</p>
                      {item.description && <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>}
                      {item.time && <p className="text-xs text-gray-400 mt-1">{item.time}</p>}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative" ref={dropdownRef}>
          <button onClick={() => setShowDropdown(!showDropdown)} className="flex items-center gap-2 lg:gap-3 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <Avatar name={user ? `${user.firstName} ${user.lastName}` : 'User'} size="sm" />
            <div className="text-left hidden md:block">
              <p className="text-sm font-medium text-gray-900">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
            <ChevronDownIcon className="w-4 h-4 text-gray-400 hidden sm:block" />
          </button>

          {/* Dropdown */}
          {showDropdown && <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <div className="py-1">
                <button onClick={() => {
              setShowDropdown(false);
            }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <UserIcon className="w-4 h-4" />
                  Profile
                </button>
                <button onClick={() => {
              setShowDropdown(false);
            }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <SettingsIcon className="w-4 h-4" />
                  Settings
                </button>
              </div>
              <div className="border-t border-gray-100 py-1">
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                  <LogOutIcon className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </div>}
        </div>
      </div>
    </header>;
}