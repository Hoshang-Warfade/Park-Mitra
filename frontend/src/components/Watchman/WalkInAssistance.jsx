/**
 * WalkInAssistance Component
 * Watchman component for managing walk-in users and slot assignments
 * Features: waiting list, slot assignment, new walk-in registration, statistics
 */

import React, { useState, useEffect, useCallback } from 'react';
import watchmanService from '../../services/watchmanService';
import '../../styles/Common.css';

/**
 * WalkInAssistance Component
 */
const WalkInAssistance = () => {
  // State management
  const [waitingUsers, setWaitingUsers] = useState([]);
  const [assigningSlot, setAssigningSlot] = useState(false);
  const [newWalkIn, setNewWalkIn] = useState({
    name: '',
    mobile: '',
    vehicle_number: '',
    duration: 2
  });
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recentAssignments, setRecentAssignments] = useState([]);
  const [stats, setStats] = useState({
    todayWalkIns: 0,
    avgWaitTime: 0
  });
  const [errors, setErrors] = useState({});

  /**
   * Fetch waiting users
   */
  const fetchWaitingUsers = useCallback(async () => {
    try {
      const response = await watchmanService.getWaitingWalkIns();
      const users = response.data || [];
      
      // Calculate wait times
      const usersWithWaitTime = users.map(user => ({
        ...user,
        waitTime: calculateWaitTime(user.request_time)
      }));
      
      setWaitingUsers(usersWithWaitTime);
    } catch (error) {
      console.error('Error fetching waiting users:', error);
      // Generate mock data for demo
      setWaitingUsers(generateMockWaitingUsers());
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch recent assignments
   */
  const fetchRecentAssignments = useCallback(async () => {
    try {
      const response = await watchmanService.getRecentWalkInAssignments();
      setRecentAssignments((response.data || []).slice(0, 5));
    } catch (error) {
      console.error('Error fetching recent assignments:', error);
      setRecentAssignments(generateMockRecentAssignments());
    }
  }, []);

  /**
   * Fetch statistics
   */
  const fetchStats = useCallback(async () => {
    try {
      const response = await watchmanService.getWalkInStats();
      setStats(response.data || { todayWalkIns: 0, avgWaitTime: 0 });
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats({ todayWalkIns: 12, avgWaitTime: 3 });
    }
  }, []);

  /**
   * Fetch data on mount and refresh every 30 seconds
   */
  useEffect(() => {
    fetchWaitingUsers();
    fetchRecentAssignments();
    fetchStats();

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchWaitingUsers();
      fetchStats();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchWaitingUsers, fetchRecentAssignments, fetchStats]);

  /**
   * Generate mock waiting users
   */
  const generateMockWaitingUsers = () => {
    const names = ['John Doe', 'Sarah Smith', 'Mike Johnson'];
    const mobiles = ['9876543210', '9876543211', '9876543212'];
    const now = new Date();
    
    return names.slice(0, Math.floor(Math.random() * 3) + 1).map((name, index) => ({
      id: index + 1,
      name,
      mobile: mobiles[index],
      request_time: new Date(now - (index + 1) * 5 * 60000).toISOString(),
      waitTime: `${(index + 1) * 5} minutes`
    }));
  };

  /**
   * Generate mock recent assignments
   */
  const generateMockRecentAssignments = () => {
    const names = ['Alice Brown', 'Bob Wilson', 'Carol Davis', 'David Lee', 'Emma White'];
    const vehicles = ['MH12AB1234', 'KA05CD5678', 'DL08EF9012', 'TN09GH3456', 'AP01IJ7890'];
    const now = new Date();
    
    return names.map((name, index) => ({
      id: index + 1,
      name,
      vehicle_number: vehicles[index],
      slot_number: Math.floor(Math.random() * 50) + 1,
      assigned_time: new Date(now - (index + 1) * 15 * 60000).toISOString()
    }));
  };

  /**
   * Calculate wait time
   */
  const calculateWaitTime = (requestTime) => {
    if (!requestTime) return '0 minutes';
    
    try {
      const start = new Date(requestTime);
      const now = new Date();
      const diffMs = now - start;
      const minutes = Math.floor(diffMs / 60000);
      
      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
      
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} min`;
    } catch {
      return '0 minutes';
    }
  };

  /**
   * Handle assist walk-in from waiting list
   */
  const handleAssistWalkIn = async (userId, userName) => {
    setAssigningSlot(true);

    try {
      const response = await watchmanService.assignSlotToWalkIn(userId);
      const slotNumber = response.data?.slot_number || 'N/A';

      alert(`Slot Assigned Successfully!\n\nUser: ${userName}\nSlot Number: ${slotNumber}\n\nPlease direct the user to their assigned slot.`);

      // Refresh lists
      await fetchWaitingUsers();
      await fetchRecentAssignments();
      await fetchStats();
    } catch (error) {
      console.error('Error assigning slot:', error);
      if (error.response?.data?.message) {
        alert(`Failed to assign slot: ${error.response.data.message}`);
      } else {
        alert('Failed to assign slot. Please try again.');
      }
    } finally {
      setAssigningSlot(false);
    }
  };

  /**
   * Validate new walk-in form
   */
  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!newWalkIn.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (newWalkIn.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Mobile validation
    if (!newWalkIn.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!/^[6-9]\d{9}$/.test(newWalkIn.mobile)) {
      newErrors.mobile = 'Please enter a valid 10-digit mobile number';
    }

    // Vehicle number validation
    if (!newWalkIn.vehicle_number.trim()) {
      newErrors.vehicle_number = 'Vehicle number is required';
    } else if (newWalkIn.vehicle_number.trim().length < 4) {
      newErrors.vehicle_number = 'Please enter a valid vehicle number';
    }

    // Duration validation
    if (!newWalkIn.duration || newWalkIn.duration < 1) {
      newErrors.duration = 'Please select a duration';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle new walk-in submission
   */
  const handleNewWalkIn = async (e) => {
    e.preventDefault();

    // Validate
    if (!validateForm()) {
      return;
    }

    setAssigningSlot(true);

    try {
      const response = await watchmanService.registerAndAssignWalkIn({
        name: newWalkIn.name.trim(),
        mobile: newWalkIn.mobile.trim(),
        vehicle_number: newWalkIn.vehicle_number.trim().toUpperCase(),
        duration: parseInt(newWalkIn.duration)
      });

      const slotNumber = response.data?.slot_number || 'N/A';

      alert(`Walk-in Registered Successfully!\n\nName: ${newWalkIn.name}\nVehicle: ${newWalkIn.vehicle_number.toUpperCase()}\nSlot Number: ${slotNumber}\n\nPlease direct the user to their assigned slot.`);

      // Reset form
      setNewWalkIn({
        name: '',
        mobile: '',
        vehicle_number: '',
        duration: 2
      });
      setErrors({});
      setShowAssignForm(false);

      // Refresh lists
      await fetchWaitingUsers();
      await fetchRecentAssignments();
      await fetchStats();
    } catch (error) {
      console.error('Error registering walk-in:', error);
      if (error.response?.data?.message) {
        alert(`Failed to register walk-in: ${error.response.data.message}`);
      } else {
        alert('Failed to register walk-in. Please try again.');
      }
    } finally {
      setAssigningSlot(false);
    }
  };

  /**
   * Handle input change
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewWalkIn(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  /**
   * Handle open form
   */
  const handleOpenForm = () => {
    setShowAssignForm(true);
    setNewWalkIn({
      name: '',
      mobile: '',
      vehicle_number: '',
      duration: 2
    });
    setErrors({});
  };

  /**
   * Handle close form
   */
  const handleCloseForm = () => {
    setShowAssignForm(false);
    setNewWalkIn({
      name: '',
      mobile: '',
      vehicle_number: '',
      duration: 2
    });
    setErrors({});
  };

  /**
   * Format time ago
   */
  const formatTimeAgo = (dateTime) => {
    if (!dateTime) return 'N/A';
    
    try {
      const date = new Date(dateTime);
      const now = new Date();
      const diffMs = now - date;
      const minutes = Math.floor(diffMs / 60000);
      
      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return 'N/A';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="walkin-assistance-container">
        <div className="loading-skeleton">
          <div className="skeleton-header"></div>
          <div className="skeleton-cards"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="walkin-assistance-container">
      {/* Header */}
      <div className="walkin-header">
        <div className="header-left">
          <h2 className="page-title">Walk-in Assistance</h2>
          <p className="page-subtitle">Manage walk-in users and slot assignments</p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={handleOpenForm}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
            />
          </svg>
          New Walk-in
        </button>
      </div>

      {/* Quick Stats */}
      <div className="stats-grid">
        <div className="stat-card stat-card-primary">
          <div className="stat-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.todayWalkIns}</div>
            <div className="stat-label">Walk-ins Today</div>
          </div>
        </div>

        <div className="stat-card stat-card-success">
          <div className="stat-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.avgWaitTime} min</div>
            <div className="stat-label">Avg Wait Time</div>
          </div>
        </div>

        <div className="stat-card stat-card-warning">
          <div className="stat-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{waitingUsers.length}</div>
            <div className="stat-label">Currently Waiting</div>
          </div>
        </div>
      </div>

      {/* Waiting Users Section */}
      <div className="waiting-section">
        <h3 className="section-title">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Waiting Users
        </h3>

        {waitingUsers.length === 0 ? (
          <div className="empty-state">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3>No Walk-ins Waiting</h3>
            <p>All walk-in users have been assisted</p>
          </div>
        ) : (
          <div className="waiting-users-grid">
            {waitingUsers.map((user) => (
              <div key={user.id} className="user-card">
                <div className="user-card-header">
                  <div className="user-avatar">
                    {user.name
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <div className="user-info">
                    <h4 className="user-name">{user.name}</h4>
                    <div className="user-mobile">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                      {user.mobile}
                    </div>
                  </div>
                </div>

                <div className="user-card-body">
                  <div className="wait-time-badge">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Waiting {user.waitTime}
                  </div>
                </div>

                <div className="user-card-footer">
                  <button
                    className="btn btn-success btn-block"
                    onClick={() => handleAssistWalkIn(user.id, user.name)}
                    disabled={assigningSlot}
                  >
                    {assigningSlot ? (
                      <>
                        <div className="spinner spinner-sm"></div>
                        Assigning...
                      </>
                    ) : (
                      <>
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Assist Now
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Assignments */}
      <div className="recent-section">
        <h3 className="section-title">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Recent Assignments
        </h3>

        {recentAssignments.length === 0 ? (
          <div className="empty-state empty-state-sm">
            <p>No recent assignments</p>
          </div>
        ) : (
          <div className="recent-table-wrapper">
            <table className="recent-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Vehicle</th>
                  <th>Slot</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {recentAssignments.map((assignment) => (
                  <tr key={assignment.id}>
                    <td>{assignment.name}</td>
                    <td>
                      <span className="vehicle-badge">{assignment.vehicle_number}</span>
                    </td>
                    <td>
                      <span className="slot-badge">#{assignment.slot_number}</span>
                    </td>
                    <td className="time-cell">{formatTimeAgo(assignment.assigned_time)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Walk-in Form Modal */}
      {showAssignForm && (
        <div className="modal-overlay" onClick={handleCloseForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Register New Walk-in</h3>
              <button className="modal-close-btn" onClick={handleCloseForm}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleNewWalkIn} className="modal-body">
              {/* Name Field */}
              <div className="form-group">
                <label htmlFor="name" className="form-label">
                  User Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className={`form-input ${errors.name ? 'error' : ''}`}
                  placeholder="Enter user's full name"
                  value={newWalkIn.name}
                  onChange={handleInputChange}
                  disabled={assigningSlot}
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
              </div>

              {/* Mobile Field */}
              <div className="form-group">
                <label htmlFor="mobile" className="form-label">
                  Mobile Number <span className="required">*</span>
                </label>
                <input
                  type="tel"
                  id="mobile"
                  name="mobile"
                  className={`form-input ${errors.mobile ? 'error' : ''}`}
                  placeholder="10-digit mobile number"
                  value={newWalkIn.mobile}
                  onChange={handleInputChange}
                  maxLength="10"
                  disabled={assigningSlot}
                />
                {errors.mobile && <span className="error-message">{errors.mobile}</span>}
              </div>

              {/* Vehicle Number Field */}
              <div className="form-group">
                <label htmlFor="vehicle_number" className="form-label">
                  Vehicle Number <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="vehicle_number"
                  name="vehicle_number"
                  className={`form-input ${errors.vehicle_number ? 'error' : ''}`}
                  placeholder="e.g., MH12AB1234"
                  value={newWalkIn.vehicle_number}
                  onChange={handleInputChange}
                  disabled={assigningSlot}
                  style={{ textTransform: 'uppercase' }}
                />
                {errors.vehicle_number && (
                  <span className="error-message">{errors.vehicle_number}</span>
                )}
              </div>

              {/* Duration Field */}
              <div className="form-group">
                <label htmlFor="duration" className="form-label">
                  Estimated Duration <span className="required">*</span>
                </label>
                <select
                  id="duration"
                  name="duration"
                  className={`form-input ${errors.duration ? 'error' : ''}`}
                  value={newWalkIn.duration}
                  onChange={handleInputChange}
                  disabled={assigningSlot}
                >
                  <option value="">Select duration</option>
                  <option value="1">1 Hour</option>
                  <option value="2">2 Hours</option>
                  <option value="4">4 Hours</option>
                  <option value="8">8 Hours</option>
                </select>
                {errors.duration && <span className="error-message">{errors.duration}</span>}
              </div>

              {/* Modal Footer */}
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseForm}
                  disabled={assigningSlot}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={assigningSlot}
                >
                  {assigningSlot ? (
                    <>
                      <div className="spinner spinner-sm"></div>
                      Assigning Slot...
                    </>
                  ) : (
                    <>
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Assign Slot
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalkInAssistance;
