/**
 * Sidebar Component
 * Reusable sidebar for admin and watchman dashboards
 * Features: responsive design, active link highlighting, role-based menu items
 */

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../../styles/Common.css';

/**
 * Sidebar Component
 * @param {Object} props
 * @param {'admin'|'watchman'} props.userType - Type of user (admin or watchman)
 * @param {string} props.organizationName - Name of the organization
 * @param {string} props.userName - Name of the logged-in user
 * @param {Function} props.onLogout - Logout handler function
 */
const Sidebar = ({ userType, organizationName, userName, onLogout }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  /**
   * Toggle sidebar collapsed state (for mobile)
   */
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  /**
   * Close sidebar on mobile after navigation
   */
  const handleLinkClick = () => {
    if (window.innerWidth <= 768) {
      setCollapsed(false);
    }
  };

  /**
   * Check if a route is active
   * @param {string} path - Route path to check
   * @returns {boolean}
   */
  const isActive = (path) => {
    return location.pathname === path;
  };

  /**
   * Get user initials for avatar
   * @param {string} name - User's full name
   * @returns {string} - User initials
   */
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Define menu items based on user type
  const adminMenuItems = [
    {
      path: '/admin/dashboard',
      label: 'Dashboard',
      icon: (
        <svg className="sidebar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      path: '/admin/live-status',
      label: 'Live Status',
      icon: (
        <svg className="sidebar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      badge: null // Can be used for notifications
    },
    {
      path: '/admin/bookings',
      label: 'Bookings',
      icon: (
        <svg className="sidebar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      path: '/admin/members',
      label: 'Members',
      icon: (
        <svg className="sidebar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    {
      path: '/admin/analytics',
      label: 'Analytics',
      icon: (
        <svg className="sidebar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      path: '/admin/settings',
      label: 'Settings',
      icon: (
        <svg className="sidebar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    }
  ];

  const watchmanMenuItems = [
    {
      path: '/watchman/scan',
      label: 'Scan QR',
      icon: (
        <svg className="sidebar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
      )
    },
    {
      path: '/watchman/walk-ins',
      label: 'Walk-ins',
      icon: (
        <svg className="sidebar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      )
    },
    {
      path: '/watchman/parking-status',
      label: 'Parking Status',
      icon: (
        <svg className="sidebar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      )
    },
    {
      path: '/watchman/payments',
      label: 'Payments',
      icon: (
        <svg className="sidebar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  const menuItems = userType === 'admin' ? adminMenuItems : watchmanMenuItems;

  return (
    <>
      {/* Mobile overlay */}
      {collapsed && (
        <div className="sidebar-overlay" onClick={toggleSidebar}></div>
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Top Section */}
        <div className="sidebar-top">
          {/* Logo */}
          <div className="sidebar-logo">
            <svg className="logo-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            <span className="logo-text">ParkMitra</span>
          </div>

          {/* Organization & User Info */}
          <div className="sidebar-user-info">
            <div className="organization-name">{organizationName}</div>
            <div className="user-card">
              <div className="user-avatar">
                {getInitials(userName)}
              </div>
              <div className="user-details">
                <div className="user-name">{userName}</div>
                <div className="user-role">
                  {userType === 'admin' ? 'Administrator' : 'Watchman'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Section - Navigation */}
        <nav className="sidebar-nav">
          <ul className="sidebar-menu">
            {menuItems.map((item, index) => (
              <li key={index}>
                <Link
                  to={item.path}
                  className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
                  onClick={handleLinkClick}
                >
                  {item.icon}
                  <span className="sidebar-label">{item.label}</span>
                  {item.badge && (
                    <span className="sidebar-badge">{item.badge}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Bottom Section */}
        <div className="sidebar-bottom">
          {/* Help & Support */}
          <Link to="/help" className="sidebar-link sidebar-help">
            <svg className="sidebar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="sidebar-label">Help & Support</span>
          </Link>

          {/* Version Info */}
          <div className="sidebar-version">
            <span>Version 1.0.0</span>
          </div>

          {/* Logout Button */}
          <button
            className="sidebar-link sidebar-logout"
            onClick={onLogout}
          >
            <svg className="sidebar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="sidebar-label">Logout</span>
          </button>
        </div>

        {/* Mobile Toggle Button */}
        <button
          className="sidebar-toggle"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {collapsed ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            )}
          </svg>
        </button>
      </aside>
    </>
  );
};

export default Sidebar;
