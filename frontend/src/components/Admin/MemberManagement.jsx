/**
 * MemberManagement Component
 * Admin component for managing organization members
 * Features: member listing, search, add/remove members, validation
 */

import React, { useState, useEffect, useCallback } from 'react';
import organizationService from '../../services/organizationService';
import '../../styles/Common.css';

/**
 * MemberManagement Component
 * @param {Object} props
 * @param {number} props.organizationId - Organization ID
 */
const MemberManagement = ({ organizationId }) => {
  // State management
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    mobile: '',
    employee_id: ''
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const membersPerPage = 10;

  /**
   * Fetch members from API
   */
  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await organizationService.getMembers(organizationId);
      setMembers(response.data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      alert('Failed to load members. Please try again.');
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  /**
   * Fetch organization members on mount
   */
  useEffect(() => {
    if (organizationId) {
      fetchMembers();
    }
  }, [organizationId, fetchMembers]);

  /**
   * Handle search - filter members by name, email, or employee_id
   */
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  /**
   * Filter members based on search term
   */
  const getFilteredMembers = () => {
    if (!searchTerm.trim()) {
      return members;
    }

    const searchLower = searchTerm.toLowerCase();
    return members.filter(
      (member) =>
        member.name?.toLowerCase().includes(searchLower) ||
        member.email?.toLowerCase().includes(searchLower) ||
        member.employee_id?.toLowerCase().includes(searchLower)
    );
  };

  /**
   * Validate form fields
   */
  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!newMember.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (newMember.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    if (!newMember.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newMember.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Mobile validation
    if (!newMember.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!/^[6-9]\d{9}$/.test(newMember.mobile)) {
      newErrors.mobile = 'Please enter a valid 10-digit mobile number';
    }

    // Employee ID validation
    if (!newMember.employee_id.trim()) {
      newErrors.employee_id = 'Employee ID is required';
    } else if (
      members.some(
        (m) =>
          m.employee_id?.toLowerCase() ===
          newMember.employee_id.trim().toLowerCase()
      )
    ) {
      newErrors.employee_id = 'Employee ID already exists';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle add member
   */
  const handleAddMember = async (e) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      // Call API to add member
      await organizationService.addMember(organizationId, {
        name: newMember.name.trim(),
        email: newMember.email.trim(),
        mobile: newMember.mobile.trim(),
        employee_id: newMember.employee_id.trim()
      });

      // Success
      alert('Member added successfully!');

      // Reset form
      setNewMember({
        name: '',
        email: '',
        mobile: '',
        employee_id: ''
      });
      setErrors({});
      setShowAddModal(false);

      // Refresh members list
      await fetchMembers();
    } catch (error) {
      console.error('Error adding member:', error);
      if (error.response?.data?.message) {
        alert(`Failed to add member: ${error.response.data.message}`);
      } else {
        alert('Failed to add member. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Handle remove member
   */
  const handleRemoveMember = async (memberId, memberName) => {
    // Confirm with user
    const confirmed = window.confirm(
      `Are you sure you want to remove "${memberName}" from the organization?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      // Call API to remove member
      await organizationService.removeMember(organizationId, memberId);

      // Success
      alert(`${memberName} has been removed successfully.`);

      // Refresh members list
      await fetchMembers();
    } catch (error) {
      console.error('Error removing member:', error);
      if (error.response?.data?.message) {
        alert(`Failed to remove member: ${error.response.data.message}`);
      } else {
        alert('Failed to remove member. Please try again.');
      }
    }
  };

  /**
   * Handle modal open
   */
  const handleOpenModal = () => {
    setShowAddModal(true);
    setNewMember({
      name: '',
      email: '',
      mobile: '',
      employee_id: ''
    });
    setErrors({});
  };

  /**
   * Handle modal close
   */
  const handleCloseModal = () => {
    setShowAddModal(false);
    setNewMember({
      name: '',
      email: '',
      mobile: '',
      employee_id: ''
    });
    setErrors({});
  };

  /**
   * Handle input change
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMember((prev) => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  /**
   * Get status badge class
   */
  const getStatusBadge = (status) => {
    if (status === 'active') {
      return <span className="badge badge-success">Active</span>;
    }
    return <span className="badge badge-secondary">Inactive</span>;
  };

  // Pagination logic
  const filteredMembers = getFilteredMembers();
  const indexOfLastMember = currentPage * membersPerPage;
  const indexOfFirstMember = indexOfLastMember - membersPerPage;
  const currentMembers = filteredMembers.slice(
    indexOfFirstMember,
    indexOfLastMember
  );
  const totalPages = Math.ceil(filteredMembers.length / membersPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="member-management-container">
        <div className="loading-skeleton">
          <div className="skeleton-header"></div>
          <div className="skeleton-search"></div>
          <div className="skeleton-table">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton-row"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="member-management-container">
      {/* Header */}
      <div className="member-management-header">
        <div className="header-left">
          <h2 className="page-title">Organization Members</h2>
          <p className="page-subtitle">
            Manage members and their access to your organization
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenModal}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Member
        </button>
      </div>

      {/* Search Bar */}
      <div className="search-section">
        <div className="search-input-wrapper">
          <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search by name, email, or employee ID..."
            value={searchTerm}
            onChange={handleSearch}
          />
          {searchTerm && (
            <button
              className="clear-search-btn"
              onClick={() => {
                setSearchTerm('');
                setCurrentPage(1);
              }}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
        <div className="search-results-info">
          Showing {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''}
          {searchTerm && ` for "${searchTerm}"`}
        </div>
      </div>

      {/* Members Table */}
      {currentMembers.length === 0 ? (
        <div className="empty-state">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h3>No members found</h3>
          <p>
            {searchTerm
              ? 'Try adjusting your search criteria'
              : 'Get started by adding your first member'}
          </p>
          {!searchTerm && (
            <button className="btn btn-primary" onClick={handleOpenModal}>
              Add First Member
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="members-table-wrapper">
            <table className="members-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Mobile</th>
                  <th>Employee ID</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentMembers.map((member) => (
                  <tr key={member.id}>
                    <td>
                      <div className="member-name-cell">
                        <div className="member-avatar">
                          {member.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)}
                        </div>
                        <span>{member.name}</span>
                      </div>
                    </td>
                    <td>{member.email}</td>
                    <td>{member.mobile}</td>
                    <td>
                      <span className="employee-id-badge">{member.employee_id}</span>
                    </td>
                    <td>{getStatusBadge(member.status || 'active')}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-sm btn-secondary"
                          disabled
                          title="Coming soon"
                        >
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleRemoveMember(member.id, member.name)}
                        >
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <div className="pagination-info">
                Page {currentPage} of {totalPages}
              </div>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Member</h3>
              <button className="modal-close-btn" onClick={handleCloseModal}>
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

            <form onSubmit={handleAddMember} className="modal-body">
              {/* Name Field */}
              <div className="form-group">
                <label htmlFor="name" className="form-label">
                  Full Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className={`form-input ${errors.name ? 'error' : ''}`}
                  placeholder="Enter member's full name"
                  value={newMember.name}
                  onChange={handleInputChange}
                  disabled={submitting}
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
              </div>

              {/* Email Field */}
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email Address <span className="required">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  placeholder="member@example.com"
                  value={newMember.email}
                  onChange={handleInputChange}
                  disabled={submitting}
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
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
                  value={newMember.mobile}
                  onChange={handleInputChange}
                  maxLength="10"
                  disabled={submitting}
                />
                {errors.mobile && <span className="error-message">{errors.mobile}</span>}
              </div>

              {/* Employee ID Field */}
              <div className="form-group">
                <label htmlFor="employee_id" className="form-label">
                  Employee ID <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="employee_id"
                  name="employee_id"
                  className={`form-input ${errors.employee_id ? 'error' : ''}`}
                  placeholder="Unique employee identifier"
                  value={newMember.employee_id}
                  onChange={handleInputChange}
                  disabled={submitting}
                />
                {errors.employee_id && (
                  <span className="error-message">{errors.employee_id}</span>
                )}
              </div>

              {/* Modal Footer */}
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseModal}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <div className="spinner spinner-sm"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      Add Member
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

export default MemberManagement;
