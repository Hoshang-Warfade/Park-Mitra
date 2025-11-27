import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import authService from '../../services/authService';
import {
  FaParking,
  FaBars,
  FaTimes,
  FaBell,
  FaUser,
  FaCog,
  FaQuestionCircle,
  FaSignOutAlt,
  FaCar,
  FaClipboardList,
  FaShieldAlt,
  FaChevronDown,
  FaUserCircle,
  FaTachometerAlt
} from 'react-icons/fa';

/**
 * Navbar Component
 * Main navigation bar with authentication integration
 */
const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout: contextLogout } = useContext(AuthContext);

  // Component state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [notificationCount] = useState(3); // Mock notification count

  /**
   * Handle scroll effect
   */
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /**
   * Close dropdowns when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownOpen && !event.target.closest('.profile-dropdown')) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileDropdownOpen]);

  /**
   * Close mobile menu when route changes
   */
  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
  }, [location.pathname]);

  /**
   * Toggle mobile menu
   */
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  /**
   * Toggle profile dropdown
   */
  const toggleProfileDropdown = () => {
    setProfileDropdownOpen(!profileDropdownOpen);
  };

  /**
   * Handle logout
   */
  const handleLogout = async () => {
    try {
      // Call logout service
      await authService.logout();

      // Clear auth context
      if (contextLogout) {
        contextLogout();
      }

      // Close dropdowns
      setProfileDropdownOpen(false);
      setMobileMenuOpen(false);

      // Navigate to login
      navigate('/login', { 
        state: { message: 'Logged out successfully' }
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Still navigate to login even if error
      navigate('/login');
    }
  };

  /**
   * Check if link is active
   */
  const isActive = (path) => {
    return location.pathname === path;
  };

  /**
   * Get user initials
   */
  const getUserInitials = () => {
    if (!user) return 'U';
    const names = user.name?.split(' ') || ['User'];
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return names[0][0].toUpperCase();
  };

  /**
   * Get navigation links based on user type
   */
  const getNavLinks = () => {
    const baseLinks = [
      {
        path: '/user/dashboard',
        label: 'Dashboard',
        icon: FaTachometerAlt,
        show: user && ['organization_member', 'visitor', 'walk_in'].includes(user?.user_type)
      },
      {
        path: '/book-parking',
        label: 'Book Parking',
        icon: FaCar,
        show: user && ['organization_member', 'visitor'].includes(user?.user_type)
      },
      {
        path: '/my-bookings',
        label: 'My Bookings',
        icon: FaClipboardList,
        show: user && ['organization_member', 'visitor'].includes(user?.user_type)
      },
      {
        path: '/informal-parking',
        label: 'Street Parking',
        icon: FaParking,
        show: user && user?.user_type !== 'admin' // Show for all authenticated users except admins
      },
      {
        path: '/admin/dashboard',
        label: 'Admin Panel',
        icon: FaShieldAlt,
        show: user && user?.user_type === 'admin'
      },
      {
        path: '/watchman/dashboard',
        label: 'Watchman Dashboard',
        icon: FaShieldAlt,
        show: user && user?.user_type === 'watchman'
      }
    ];

    return baseLinks.filter((link) => link.show);
  };

  const navLinks = getNavLinks();

  return (
    <nav
      className={`sticky top-0 z-50 bg-white transition-all duration-300 ${
        scrolled ? 'shadow-lg' : 'shadow-md'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <div className="flex items-center">
            <Link
              to="/"
              className="flex items-center space-x-2 group"
            >
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-2 rounded-lg group-hover:scale-110 transition-transform">
                <FaParking className="text-white text-2xl" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                ParkMitra
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all ${
                    isActive(link.path)
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
                  }`}
                >
                  <Icon className="mr-2" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Notification Bell */}
                <button className="relative p-2 text-gray-600 hover:text-indigo-600 transition-colors">
                  <FaBell className="text-xl" />
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {notificationCount}
                    </span>
                  )}
                </button>

                {/* Profile Dropdown */}
                <div className="relative profile-dropdown">
                  <button
                    onClick={toggleProfileDropdown}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-all"
                  >
                    {/* User Avatar */}
                    <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {getUserInitials()}
                    </div>

                    {/* User Name (Desktop only) */}
                    <div className="hidden lg:block text-left">
                      <p className="text-sm font-semibold text-gray-900">
                        {user.name || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {user.user_type?.replace('_', ' ')}
                      </p>
                    </div>

                    <FaChevronDown
                      className={`hidden lg:block text-gray-500 transition-transform ${
                        profileDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-2 animate-fade-in">
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-sm font-semibold text-gray-900">
                          {user.name || 'User'}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        <span className="inline-block mt-2 px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full capitalize">
                          {user.user_type?.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Menu Items */}
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <FaUser className="mr-3 text-gray-400" />
                        <span className="text-sm font-medium">Profile</span>
                      </Link>

                      <Link
                        to="/settings"
                        className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <FaCog className="mr-3 text-gray-400" />
                        <span className="text-sm font-medium">Settings</span>
                      </Link>

                      <Link
                        to="/help-support"
                        className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <FaQuestionCircle className="mr-3 text-gray-400" />
                        <span className="text-sm font-medium">Help & Support</span>
                      </Link>

                      <div className="border-t border-gray-200 my-2"></div>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <FaSignOutAlt className="mr-3" />
                        <span className="text-sm font-medium">Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              // Not Authenticated - Login/Sign Up Buttons
              <div className="hidden md:flex items-center space-x-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-indigo-600 font-semibold hover:text-indigo-700 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 text-gray-600 hover:text-indigo-600 transition-colors"
            >
              {mobileMenuOpen ? (
                <FaTimes className="text-2xl" />
              ) : (
                <FaBars className="text-2xl" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 animate-slide-down">
          <div className="px-4 py-4 space-y-1">
            {user ? (
              <>
                {/* User Info */}
                <div className="flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {getUserInitials()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {user.name || 'User'}
                    </p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded capitalize">
                      {user.user_type?.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Navigation Links */}
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`flex items-center px-4 py-3 rounded-lg font-medium transition-all ${
                        isActive(link.path)
                          ? 'bg-indigo-600 text-white'
                          : 'text-gray-700 hover:bg-indigo-50'
                      }`}
                    >
                      <Icon className="mr-3" />
                      {link.label}
                    </Link>
                  );
                })}

                <div className="border-t border-gray-200 my-3"></div>

                {/* Profile Menu Items */}
                <Link
                  to="/profile"
                  className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <FaUser className="mr-3 text-gray-400" />
                  <span className="font-medium">Profile</span>
                </Link>

                <Link
                  to="/settings"
                  className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <FaCog className="mr-3 text-gray-400" />
                  <span className="font-medium">Settings</span>
                </Link>

                <Link
                  to="/help-support"
                  className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <FaQuestionCircle className="mr-3 text-gray-400" />
                  <span className="font-medium">Help & Support</span>
                </Link>

                <div className="border-t border-gray-200 my-3"></div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                >
                  <FaSignOutAlt className="mr-3" />
                  Logout
                </button>
              </>
            ) : (
              // Not Authenticated - Mobile
              <>
                <Link
                  to="/login"
                  className="flex items-center justify-center px-4 py-3 text-indigo-600 font-semibold hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  <FaUserCircle className="mr-2" />
                  Login
                </Link>

                <Link
                  to="/register"
                  className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Custom Animations */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-down {
          from {
            opacity: 0;
            max-height: 0;
          }
          to {
            opacity: 1;
            max-height: 1000px;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
