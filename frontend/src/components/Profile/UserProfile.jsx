// User Profile Management Page - Comprehensive with Password Management
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import authService from '../../services/authService';
import bookingService from '../../services/bookingService';
import { 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaBuilding, 
  FaEdit, 
  FaSave, 
  FaTimes,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaCheckCircle,
  FaExclamationTriangle,
  FaCalendarAlt,
  FaCar,
  FaMoneyBillWave,
  FaGift,
  FaTrash,
  FaIdCard,
  FaShieldAlt
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import LoadingSpinner from '../Common/LoadingSpinner';

// Password Strength Indicator Component
const PasswordStrengthIndicator = ({ password }) => {
  const calculateStrength = () => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    if (strength <= 2) return { level: 'Weak', color: 'bg-red-500', width: '33%' };
    if (strength <= 4) return { level: 'Medium', color: 'bg-yellow-500', width: '66%' };
    return { level: 'Strong', color: 'bg-green-500', width: '100%' };
  };

  if (!password) return null;

  const strength = calculateStrength();

  return (
    <div className="mt-2">
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${strength.color} transition-all duration-300`}
          style={{ width: strength.width }}
        ></div>
      </div>
      <p className={`text-sm mt-1 ${
        strength.level === 'Weak' ? 'text-red-600' :
        strength.level === 'Medium' ? 'text-yellow-600' :
        'text-green-600'
      }`}>
        Password Strength: {strength.level}
      </p>
    </div>
  );
};

// Custom hook to access auth context
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const UserProfile = () => {
  const { user, updateUser, logout } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    user_type: '',
    employee_id: ''
  });

  // Password change state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Statistics state
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalSpent: 0,
    benefitsSaved: 0,
    activeBookings: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        mobile: user.mobile || '',
        user_type: user?.user_type || '',
        employee_id: user.employee_id || ''
      });
      fetchUserStatistics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchUserStatistics = async () => {
    try {
      setLoadingStats(true);
      
      // For admin users, fetch organization-wide statistics
      let bookings;
      if (user.user_type === 'admin' && user.organization_id) {
        // Fetch all organization bookings for admin
        const orgBookings = await bookingService.getOrganizationBookings(user.organization_id, {});
        bookings = orgBookings?.bookings || orgBookings?.data?.bookings || [];
      } else {
        // Regular users get their own bookings
        bookings = await bookingService.getUserBookings(user.id);
      }
      
      const totalBookings = bookings.length;
      const activeBookings = bookings.filter(b => 
        b.booking_status === 'active' || b.booking_status === 'confirmed'
      ).length;
      
      // Calculate total spent (for visitors)
      const totalSpent = bookings
        .filter(b => b.amount > 0)
        .reduce((sum, b) => sum + parseFloat(b.amount), 0);
      
      // Calculate benefits saved (for members - assuming free parking is worth ₹50/hour)
      const benefitsSaved = bookings
        .filter(b => b.amount === 0)
        .reduce((sum, b) => {
          const hours = Math.ceil((new Date(b.end_time) - new Date(b.start_time)) / (1000 * 60 * 60));
          return sum + (hours * 50);
        }, 0);

      setStats({
        totalBookings,
        totalSpent,
        benefitsSaved,
        activeBookings
      });
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(null);
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
    setPasswordError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate
    if (!formData.name || !formData.email || !formData.mobile) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      await updateUser(formData);
      toast.success('Profile updated successfully!');
      setEditMode(false);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');

    // Validation
    if (!passwordData.currentPassword) {
      setPasswordError('Current password is required');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long');
      return;
    }

    if (passwordData.newPassword === passwordData.currentPassword) {
      setPasswordError('New password must be different from current password');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setChangingPassword(true);

    try {
      await authService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      toast.success('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordSection(false);
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to change password');
      toast.error('Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error('Please enter your password to confirm deletion');
      return;
    }

    setDeleting(true);

    try {
      await authService.deleteAccount({ password: deletePassword });
      toast.success('Account deleted successfully');
      logout();
      window.location.href = '/';
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete account');
      setDeleting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user.name || '',
      email: user.email || '',
      mobile: user.mobile || '',
      user_type: user?.user_type || '',
      employee_id: user.employee_id || ''
    });
    setEditMode(false);
    setError(null);
  };

  if (!user) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
          <FaExclamationTriangle className="mr-2" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Profile Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-32"></div>
            
            <div className="px-6 pb-6">
              <div className="flex items-center -mt-16 mb-6">
                <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-white">
                  <FaUser className="text-6xl text-indigo-500" />
                </div>
                <div className="ml-6 mt-16">
                  <h2 className="text-2xl font-bold text-gray-800">{user.name}</h2>
                  <p className="text-gray-600 capitalize">{user.user_type?.replace('_', ' ')}</p>
                  {user.organization_name && (
                    <p className="text-sm text-gray-500 mt-1 flex items-center">
                      <FaBuilding className="mr-1" />
                      {user.organization_name}
                    </p>
                  )}
                </div>
              </div>

              {/* Profile Form */}
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FaUser className="inline mr-2" />
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={!editMode}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
                      required
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FaEnvelope className="inline mr-2" />
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={!editMode}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
                      required
                    />
                  </div>

                  {/* Mobile */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FaPhone className="inline mr-2" />
                      Mobile
                    </label>
                    <input
                      type="tel"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      disabled={!editMode}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
                      required
                    />
                  </div>

                  {/* User Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FaShieldAlt className="inline mr-2" />
                      User Type
                    </label>
                    <input
                      type="text"
                      value={formData.user_type?.replace('_', ' ').toUpperCase()}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                    />
                  </div>

                  {/* Employee ID (if member) */}
                  {user?.user_type === 'organization_member' && user.employee_id && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FaIdCard className="inline mr-2" />
                        Employee ID
                      </label>
                      <input
                        type="text"
                        value={formData.employee_id}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed font-mono"
                      />
                    </div>
                  )}

                  {/* Organization (if member) */}
                  {user.organization_name && (
                    <div className={user.employee_id ? '' : 'md:col-span-2'}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FaBuilding className="inline mr-2" />
                        Organization
                      </label>
                      <input
                        type="text"
                        value={user.organization_name}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                      />
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex gap-4">
                  {!editMode ? (
                    <button
                      type="button"
                      onClick={() => setEditMode(true)}
                      className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition transform hover:scale-105"
                    >
                      <FaEdit /> Edit Profile
                    </button>
                  ) : (
                    <>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <FaSave /> Save Changes
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="flex items-center gap-2 px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition transform hover:scale-105"
                      >
                        <FaTimes /> Cancel
                      </button>
                    </>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Password Change Section */}
          <div className="bg-white rounded-lg shadow-lg mt-6 overflow-hidden">
            <div 
              className="px-6 py-4 bg-gray-50 border-b cursor-pointer hover:bg-gray-100 transition flex items-center justify-between"
              onClick={() => setShowPasswordSection(!showPasswordSection)}
            >
              <div className="flex items-center gap-2">
                <FaLock className="text-indigo-600" />
                <h3 className="text-lg font-semibold">Change Password</h3>
              </div>
              <span className="text-gray-500">
                {showPasswordSection ? '▲' : '▼'}
              </span>
            </div>

            {showPasswordSection && (
              <div className="px-6 py-6">
                {passwordError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
                    <FaExclamationTriangle className="mr-2" />
                    {passwordError}
                  </div>
                )}

                <form onSubmit={handleChangePassword}>
                  {/* Current Password */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-10"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    <PasswordStrengthIndicator password={passwordData.newPassword} />
                  </div>

                  {/* Confirm Password */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    {passwordData.confirmPassword && (
                      <p className={`text-sm mt-1 flex items-center ${
                        passwordData.newPassword === passwordData.confirmPassword
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {passwordData.newPassword === passwordData.confirmPassword ? (
                          <><FaCheckCircle className="mr-1" /> Passwords match</>
                        ) : (
                          <><FaExclamationTriangle className="mr-1" /> Passwords do not match</>
                        )}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {changingPassword ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Updating Password...
                      </>
                    ) : (
                      <>
                        <FaLock /> Update Password
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Danger Zone */}
          <div className="bg-white rounded-lg shadow-lg mt-6 overflow-hidden border-2 border-red-200">
            <div className="px-6 py-4 bg-red-50">
              <div className="flex items-center gap-2 text-red-600">
                <FaExclamationTriangle />
                <h3 className="text-lg font-semibold">Danger Zone</h3>
              </div>
            </div>
            <div className="px-6 py-6">
              <p className="text-gray-600 mb-4">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition transform hover:scale-105 flex items-center gap-2"
              >
                <FaTrash /> Delete My Account
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar - Statistics */}
        <div className="lg:col-span-1">
          {/* Account Stats */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FaCalendarAlt className="text-indigo-600" />
              Account Information
            </h3>
            <div className="space-y-4">
              <div className="border-b pb-3">
                <p className="text-sm text-gray-600">Account Created</p>
                <p className="text-lg font-semibold text-gray-800">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'N/A'}
                </p>
              </div>
              <div className="border-b pb-3">
                <p className="text-sm text-gray-600">Account Status</p>
                <p className="text-lg font-semibold text-green-600 flex items-center gap-2">
                  <FaCheckCircle /> Active
                </p>
              </div>
            </div>
          </div>

          {/* Booking Statistics */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FaCar className="text-indigo-600" />
              Booking Statistics
            </h3>
            {loadingStats ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border-b pb-3">
                  <p className="text-sm text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold text-indigo-600">{stats.totalBookings}</p>
                </div>
                <div className="border-b pb-3">
                  <p className="text-sm text-gray-600">Active Bookings</p>
                  <p className="text-2xl font-bold text-green-600">{stats.activeBookings}</p>
                </div>
                {user?.user_type === 'visitor' && stats.totalSpent > 0 && (
                  <div className="border-b pb-3">
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <FaMoneyBillWave /> Total Spent
                    </p>
                    <p className="text-2xl font-bold text-orange-600">
                      ₹{stats.totalSpent.toLocaleString('en-IN')}
                    </p>
                  </div>
                )}
                {user?.user_type === 'organization_member' && stats.benefitsSaved > 0 && (
                  <div className="pb-3">
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <FaGift /> Benefits Saved
                    </p>
                    <p className="text-2xl font-bold text-purple-600">
                      ₹{stats.benefitsSaved.toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Value of free member parking
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4 text-red-600">
              <FaExclamationTriangle className="text-3xl" />
              <h3 className="text-xl font-bold">Delete Account</h3>
            </div>
            <p className="text-gray-600 mb-4">
              This action cannot be undone. All your data will be permanently deleted.
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter your password to confirm:
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Password"
              />
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting || !deletePassword}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <FaTrash /> Delete Account
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;

