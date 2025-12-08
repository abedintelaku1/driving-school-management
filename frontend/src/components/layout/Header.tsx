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
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
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
        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Notifications">
          <BellIcon className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

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