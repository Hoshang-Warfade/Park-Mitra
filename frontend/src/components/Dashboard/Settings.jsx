import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const Settings = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Profile Settings State
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    mobile: user?.mobile || '',
    email: user?.email || ''
  });

  // Password Change State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Notification Settings State
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: false,
    bookingReminders: true,
    paymentAlerts: true,
    promotionalEmails: false
  });

  // Handle Profile Update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await api.put('/api/auth/profile', {
        name: profileData.name,
        mobile: profileData.mobile
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        // Update user context if needed
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update profile' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle Password Change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    // Validate passwords match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      setLoading(false);
      return;
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(passwordData.newPassword)) {
      setMessage({ 
        type: 'error', 
        text: 'Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number' 
      });
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/api/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Password changed successfully!' });
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to change password' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle Notification Settings Update
  const handleNotificationUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // TODO: Implement notification settings API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage({ type: 'success', text: 'Notification preferences updated!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update notification settings' });
    } finally {
      setLoading(false);
    }
  };

  // Handle Account Deletion
  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    const confirmText = window.prompt('Type "DELETE" to confirm account deletion:');
    if (confirmText !== 'DELETE') {
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // TODO: Implement account deletion API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage({ type: 'success', text: 'Account deletion requested. You will be logged out.' });
      setTimeout(() => logout(), 2000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete account' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
        </div>

        {/* Message Display */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            <div className="flex items-center">
              <span className="text-lg mr-2">
                {message.type === 'success' ? '✓' : '⚠'}
              </span>
              {message.text}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { id: 'profile', label: 'Profile', icon: '👤' },
                { id: 'password', label: 'Password', icon: '🔒' },
                { id: 'notifications', label: 'Notifications', icon: '🔔' },
                { id: 'privacy', label: 'Privacy', icon: '🛡️' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMessage({ type: '', text: '' });
                  }}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Profile Settings Tab */}
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mobile Number
                      </label>
                      <input
                        type="tel"
                        value={profileData.mobile}
                        onChange={(e) => setProfileData({...profileData, mobile: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={profileData.email}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <span className="font-semibold">Account Type:</span> {user?.user_type}
                      </p>
                      {user?.organization_id && (
                        <p className="text-sm text-blue-800 mt-1">
                          <span className="font-semibold">Organization ID:</span> {user.organization_id}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? 'Updating...' : 'Update Profile'}
                </button>
              </form>
            )}

            {/* Password Settings Tab */}
            {activeTab === 'password' && (
              <form onSubmit={handlePasswordChange} className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-sm text-yellow-800 font-medium mb-2">Password Requirements:</p>
                      <ul className="text-xs text-yellow-700 space-y-1 ml-4 list-disc">
                        <li>At least 8 characters long</li>
                        <li>Contains at least 1 uppercase letter (A-Z)</li>
                        <li>Contains at least 1 lowercase letter (a-z)</li>
                        <li>Contains at least 1 number (0-9)</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <form onSubmit={handleNotificationUpdate} className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>
                  
                  <div className="space-y-4">
                    {[
                      { id: 'emailNotifications', label: 'Email Notifications', desc: 'Receive notifications via email' },
                      { id: 'smsNotifications', label: 'SMS Notifications', desc: 'Receive notifications via SMS' },
                      { id: 'bookingReminders', label: 'Booking Reminders', desc: 'Get reminders for upcoming bookings' },
                      { id: 'paymentAlerts', label: 'Payment Alerts', desc: 'Receive alerts for payments and transactions' },
                      { id: 'promotionalEmails', label: 'Promotional Emails', desc: 'Receive promotional offers and updates' }
                    ].map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{item.label}</p>
                          <p className="text-sm text-gray-600">{item.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifications[item.id]}
                            onChange={(e) => setNotifications({...notifications, [item.id]: e.target.checked})}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? 'Saving...' : 'Save Preferences'}
                </button>
              </form>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy & Security</h3>
                  
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Data Privacy</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Your personal data is encrypted and stored securely. We never share your information with third parties without your consent.
                      </p>
                      <button className="text-blue-600 text-sm font-medium hover:underline">
                        Read Privacy Policy →
                      </button>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Download Your Data</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Request a copy of all your data stored in our system.
                      </p>
                      <button className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition text-sm font-medium">
                        Download Data
                      </button>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                      <h4 className="font-medium text-red-900 mb-2">Delete Account</h4>
                      <p className="text-sm text-red-700 mb-3">
                        Permanently delete your account and all associated data. This action cannot be undone.
                      </p>
                      <button
                        onClick={handleDeleteAccount}
                        disabled={loading}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm font-medium disabled:bg-gray-400"
                      >
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
