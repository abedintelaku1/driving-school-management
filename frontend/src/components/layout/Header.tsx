import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellIcon, LogOutIcon, UserIcon, SettingsIcon, ChevronDownIcon, MenuIcon, CheckIcon, XIcon } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { useAuth } from '../../hooks/useAuth';
import { notificationsApi, type Notification } from '../../utils/api/notifications';

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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const result = await notificationsApi.getAll(undefined, 20, 0);
      if (result.ok && result.data) {
        setNotifications(result.data.notifications);
        setUnreadCount(result.data.unread);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [user]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;

    try {
      const result = await notificationsApi.getUnreadCount();
      if (result.ok && result.data) {
        setUnreadCount(result.data.count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [user]);

  // Mark notification as read
  const handleMarkAsRead = useCallback(async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      const result = await notificationsApi.markAsRead(notificationId);
      if (result.ok) {
        // Update local state
        setNotifications(prev => 
          prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Mark all as read
  const handleMarkAllAsRead = useCallback(async () => {
    try {
      setLoading(true);
      const result = await notificationsApi.markAllAsRead();
      if (result.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete notification
  const handleDeleteNotification = useCallback(async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      const result = await notificationsApi.delete(notificationId);
      if (result.ok) {
        // Remove from local state
        setNotifications(prev => prev.filter(n => n._id !== notificationId));
        // Update unread count if it was unread
        const deletedNotification = notifications.find(n => n._id === notificationId);
        if (deletedNotification && !deletedNotification.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [notifications]);

  // Format time ago
  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Tani';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m më parë`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h më parë`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d më parë`;
    return date.toLocaleDateString('sq-AL');
  };

  // Get notification type color
  const getNotificationTypeColor = (type: string): string => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  // Setup polling for real-time updates
  useEffect(() => {
    if (!user) return;

    // Initial fetch
    fetchNotifications();
    fetchUnreadCount();

    // Poll every 3 seconds
    pollingIntervalRef.current = setInterval(() => {
      fetchUnreadCount();
      if (showNotifications) {
        fetchNotifications();
      }
    }, 5000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [user, showNotifications, fetchNotifications, fetchUnreadCount]);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (showNotifications && user) {
      fetchNotifications();
    }
  }, [showNotifications, user, fetchNotifications]);

  // Click outside handler
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

  // Convert role number to display string
  const getRoleDisplay = (role: number | string | undefined): string => {
    if (role === 0 || role === '0' || role === 'admin') return 'Admin';
    if (role === 1 || role === '1' || role === 'instructor') return 'Instructor';
    return 'User';
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
      {/* Left side - Mobile menu + Title */}
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        <button 
          onClick={onMobileMenuToggle} 
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors" 
          aria-label="Open menu"
        >
          <MenuIcon className="w-5 h-5 text-gray-600" />
        </button>

        {/* Title */}
        {title && (
          <h1 className="text-lg lg:text-xl font-semibold text-gray-900 truncate">
            {title}
          </h1>
        )}
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
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[1.25rem] h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-semibold px-1">
                {unreadCount}
              </span>
            )}
          </button>
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
              <div className="px-4 pb-2 border-b border-gray-100 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900">Notifikime</p>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    disabled={loading}
                    className="text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50 flex items-center gap-1"
                  >
                    <CheckIcon className="w-3 h-3" />
                    Shëno të gjitha si të lexuara
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-sm text-gray-500 px-4 py-3 text-center">Nuk ka notifikime</p>
                ) : (
                  notifications.map(item => (
                    <div
                      key={item._id}
                      className={`px-4 py-3 hover:bg-gray-50 border-l-4 ${
                        item.read ? 'border-transparent' : 'border-blue-500 bg-blue-50/30'
                      } transition-colors cursor-pointer`}
                      onClick={() => !item.read && handleMarkAsRead(item._id, {} as React.MouseEvent)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className={`text-xs px-2 py-0.5 rounded-full ${getNotificationTypeColor(item.type)}`}>
                              {item.type}
                            </p>
                            {!item.read && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-gray-900 mt-1">{item.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{item.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{formatTimeAgo(item.createdAt)}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {!item.read && (
                            <button
                              onClick={(e) => handleMarkAsRead(item._id, e)}
                              className="p-1 hover:bg-gray-200 rounded transition-colors"
                              aria-label="Mark as read"
                            >
                              <CheckIcon className="w-4 h-4 text-gray-400" />
                            </button>
                          )}
                          <button
                            onClick={(e) => handleDeleteNotification(item._id, e)}
                            className="p-1 hover:bg-red-100 rounded transition-colors"
                            aria-label="Delete notification"
                          >
                            <XIcon className="w-4 h-4 text-gray-400 hover:text-red-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowDropdown(!showDropdown)} 
            className="flex items-center gap-2 lg:gap-3 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Avatar name={user ? `${user.firstName} ${user.lastName}` : 'User'} size="sm" />
            <div className="text-left hidden md:block">
              <p className="text-sm font-medium text-gray-900">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500">{getRoleDisplay(user?.role)}</p>
            </div>
            <ChevronDownIcon className="w-4 h-4 text-gray-400 hidden sm:block" />
          </button>

          {/* Dropdown */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <div className="py-1">
                <button 
                  onClick={() => {
                    setShowDropdown(false);
                    navigate(user?.role === 0 ? '/admin/profile' : '/instructor/profile');
                  }} 
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <UserIcon className="w-4 h-4" />
                  Profile
                </button>
                <button 
                  onClick={() => {
                    setShowDropdown(false);
                  }} 
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <SettingsIcon className="w-4 h-4" />
                  Settings
                </button>
              </div>
              <div className="border-t border-gray-100 py-1">
                <button 
                  onClick={handleLogout} 
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOutIcon className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
