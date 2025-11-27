/**
 * ParkingRules Component
 * Admin component for managing organization parking rules
 * Features: rules editor, operating hours, visitor rates, suggestions
 */

import React, { useState, useEffect, useCallback } from 'react';
import organizationService from '../../services/organizationService';
import '../../styles/Common.css';

/**
 * ParkingRules Component
 * @param {Object} props
 * @param {number} props.organizationId - Organization ID
 */
const ParkingRules = ({ organizationId }) => {
  // State management
  const [rules, setRules] = useState('');
  const [operatingHours, setOperatingHours] = useState('');
  const [visitorRate, setVisitorRate] = useState(0);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Store original values for cancel
  const [originalRules, setOriginalRules] = useState('');
  const [originalHours, setOriginalHours] = useState('');
  const [originalRate, setOriginalRate] = useState(0);

  /**
   * Fetch organization details
   */
  const fetchOrganizationDetails = useCallback(async () => {
    setLoading(true);
    try {
      const response = await organizationService.getOrganizationById(organizationId);
      const org = response.data;

      // Set current values
      const currentRules = org.parking_rules || 'No parking rules set yet.';
      const currentHours = org.operating_hours || '24 Hours';
      const currentRate = org.visitor_rate || 0;

      setRules(currentRules);
      setOperatingHours(currentHours);
      setVisitorRate(currentRate);

      // Store originals for cancel
      setOriginalRules(currentRules);
      setOriginalHours(currentHours);
      setOriginalRate(currentRate);
    } catch (error) {
      console.error('Error fetching organization details:', error);
      alert('Failed to load parking rules. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  /**
   * Fetch on mount
   */
  useEffect(() => {
    if (organizationId) {
      fetchOrganizationDetails();
    }
  }, [organizationId, fetchOrganizationDetails]);

  /**
   * Handle edit mode
   */
  const handleEdit = () => {
    setEditing(true);
  };

  /**
   * Validate fields
   */
  const validateFields = () => {
    if (!rules.trim()) {
      alert('Please enter parking rules');
      return false;
    }

    if (!operatingHours.trim()) {
      alert('Please enter operating hours');
      return false;
    }

    if (visitorRate < 0) {
      alert('Visitor rate cannot be negative');
      return false;
    }

    return true;
  };

  /**
   * Handle save
   */
  const handleSave = async () => {
    // Validate
    if (!validateFields()) {
      return;
    }

    setSaving(true);

    try {
      // Call API to update parking rules
      await organizationService.updateParkingRules(organizationId, {
        parking_rules: rules.trim(),
        operating_hours: operatingHours.trim(),
        visitor_rate: parseFloat(visitorRate)
      });

      // Success
      alert('Parking rules updated successfully!');

      // Update originals
      setOriginalRules(rules);
      setOriginalHours(operatingHours);
      setOriginalRate(visitorRate);

      // Exit edit mode
      setEditing(false);
    } catch (error) {
      console.error('Error saving parking rules:', error);
      if (error.response?.data?.message) {
        alert(`Failed to save: ${error.response.data.message}`);
      } else {
        alert('Failed to save parking rules. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  /**
   * Handle cancel
   */
  const handleCancel = () => {
    // Reset to original values
    setRules(originalRules);
    setOperatingHours(originalHours);
    setVisitorRate(originalRate);

    // Exit edit mode
    setEditing(false);
  };

  /**
   * Add suggestion to rules
   */
  const addSuggestion = (suggestion) => {
    if (editing) {
      // Add to existing rules with newline if rules exist
      const newRules = rules.trim()
        ? `${rules.trim()}\n• ${suggestion}`
        : `• ${suggestion}`;
      setRules(newRules);
    } else {
      // Start editing and add suggestion
      setEditing(true);
      const newRules = rules.trim() && rules !== 'No parking rules set yet.'
        ? `${rules.trim()}\n• ${suggestion}`
        : `• ${suggestion}`;
      setRules(newRules);
    }
  };

  // Common parking rules suggestions
  const suggestions = [
    'Park within marked slots only',
    'No parking in fire lanes or emergency exits',
    'Visitor parking requires registration at security desk',
    'Two-wheelers must use designated areas',
    'Maximum parking duration: 12 hours',
    'No overnight parking without prior approval',
    'Maintain cleanliness, no littering',
    'Speed limit: 10 km/h within premises',
    'Follow one-way traffic signs',
    'Parking at owner\'s risk',
    'Display vehicle pass/permit visibly',
    'Report any damage or incidents immediately'
  ];

  // Loading state
  if (loading) {
    return (
      <div className="parking-rules-container">
        <div className="loading-skeleton">
          <div className="skeleton-header"></div>
          <div className="skeleton-content"></div>
          <div className="skeleton-content"></div>
          <div className="skeleton-content"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="parking-rules-container">
      {/* Header */}
      <div className="parking-rules-header">
        <div className="header-left">
          <h2 className="page-title">Parking Rules & Configuration</h2>
          <p className="page-subtitle">
            Manage parking rules, operating hours, and visitor rates
          </p>
        </div>
        {!editing && (
          <button className="btn btn-primary" onClick={handleEdit}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Edit Rules
          </button>
        )}
      </div>

      {/* Main Form Card */}
      <div className="parking-rules-card">
        <form onSubmit={(e) => e.preventDefault()}>
          {/* Parking Rules Section */}
          <div className="form-section">
            <div className="section-header">
              <div className="section-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="section-title">Parking Rules</h3>
                <p className="section-description">
                  Define rules and guidelines for parking facility users
                </p>
              </div>
            </div>

            <div className="section-content">
              {editing ? (
                <>
                  <textarea
                    className="form-textarea"
                    rows="12"
                    placeholder="Enter parking rules, one per line..."
                    value={rules}
                    onChange={(e) => setRules(e.target.value)}
                    disabled={saving}
                  />
                  <div className="helper-text">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>
                      Use bullet points (•) or numbers for better readability. Click
                      suggestions below to add common rules.
                    </span>
                  </div>
                </>
              ) : (
                <div className="rules-display">
                  {rules.split('\n').map((rule, index) => (
                    <div key={index} className="rule-line">
                      {rule}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Operating Hours Section */}
          <div className="form-section">
            <div className="section-header">
              <div className="section-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="section-title">Operating Hours</h3>
                <p className="section-description">
                  Specify when the parking facility is available
                </p>
              </div>
            </div>

            <div className="section-content">
              {editing ? (
                <>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., 8 AM - 8 PM or 24 Hours"
                    value={operatingHours}
                    onChange={(e) => setOperatingHours(e.target.value)}
                    disabled={saving}
                  />
                  <div className="helper-text">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>
                      Examples: "6 AM - 10 PM", "24 Hours", "Monday-Friday: 8 AM - 6 PM"
                    </span>
                  </div>
                </>
              ) : (
                <div className="info-display">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="info-text">{operatingHours}</span>
                </div>
              )}
            </div>
          </div>

          {/* Visitor Rate Section */}
          <div className="form-section">
            <div className="section-header">
              <div className="section-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="section-title">Visitor Hourly Rate</h3>
                <p className="section-description">
                  Set hourly parking rate for visitors (members park free)
                </p>
              </div>
            </div>

            <div className="section-content">
              {editing ? (
                <>
                  <div className="input-with-icon">
                    <span className="input-icon">₹</span>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="0"
                      min="0"
                      step="10"
                      value={visitorRate}
                      onChange={(e) => setVisitorRate(e.target.value)}
                      disabled={saving}
                    />
                    <span className="input-suffix">per hour</span>
                  </div>
                  <div className="info-badge info-badge-success">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Organization members always park free</span>
                  </div>
                </>
              ) : (
                <div className="rate-display">
                  <div className="rate-amount">₹{visitorRate}</div>
                  <div className="rate-label">per hour</div>
                  <div className="info-badge info-badge-success">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Members park free</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {editing && (
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="spinner spinner-sm"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Suggestions Section */}
      <div className="suggestions-card">
        <div className="suggestions-header">
          <div className="suggestions-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <div>
            <h3 className="suggestions-title">Common Parking Rules</h3>
            <p className="suggestions-description">
              Click any rule below to add it to your parking rules
            </p>
          </div>
        </div>

        <div className="suggestions-grid">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              className="suggestion-item"
              onClick={() => addSuggestion(suggestion)}
              type="button"
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>{suggestion}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Preview Section */}
      {!editing && (
        <div className="preview-card">
          <div className="preview-header">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            <h3>User Preview</h3>
          </div>
          <div className="preview-content">
            <p className="preview-label">This is how users will see your parking rules:</p>
            <div className="preview-box">
              <h4>Parking Rules & Guidelines</h4>
              <div className="preview-rules">
                {rules.split('\n').map((rule, index) => (
                  rule.trim() && <div key={index} className="preview-rule">{rule}</div>
                ))}
              </div>
              <div className="preview-info">
                <div className="preview-info-item">
                  <strong>Hours:</strong> {operatingHours}
                </div>
                <div className="preview-info-item">
                  <strong>Visitor Rate:</strong> ₹{visitorRate}/hour
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParkingRules;
