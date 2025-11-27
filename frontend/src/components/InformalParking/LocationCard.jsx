/**
 * LocationCard Component
 * Display card for informal parking locations with availability and features
 * Features: availability checking, color-coded status, pricing display
 */

import React, { useState } from 'react';
import '../../styles/Common.css';

/**
 * LocationCard Component
 * @param {Object} props
 * @param {Object} props.location - Location object with id, name, address, distance, available_spots, hourly_rate
 * @param {Function} props.onSelect - Callback when location is selected
 * @param {Function} props.onCheckAvailability - Callback to check availability
 */
const LocationCard = ({ location, onSelect, onCheckAvailability }) => {
  const [checking, setChecking] = useState(false);

  /**
   * Handle availability check
   */
  const handleCheckAvailability = async () => {
    setChecking(true);

    try {
      // Call parent callback to check availability
      if (onCheckAvailability) {
        await onCheckAvailability(location.id);
      }
    } catch (error) {
      console.error('Error checking availability:', error);
    } finally {
      // Simulate update delay
      setTimeout(() => {
        setChecking(false);
      }, 1000);
    }
  };

  /**
   * Handle navigate action
   */
  const handleNavigate = () => {
    alert('Navigation Simulation\n\nThis feature will provide turn-by-turn directions to the parking location in production. Currently showing simulated data for demonstration.');
    
    if (onSelect) {
      onSelect(location);
    }
  };

  /**
   * Get availability color based on spots
   * @param {number} spots - Number of available spots
   * @returns {string} Color class
   */
  const getAvailabilityColor = (spots) => {
    if (spots >= 5) return 'availability-high';
    if (spots >= 2) return 'availability-medium';
    return 'availability-low';
  };

  /**
   * Get random discount for simulation
   * @returns {number|null} Discount percentage or null
   */
  const getSimulatedDiscount = () => {
    const random = Math.random();
    if (random > 0.7) return 10;
    if (random > 0.5) return 20;
    return null;
  };

  const discount = getSimulatedDiscount();

  return (
    <div className="location-card">
      {/* Header */}
      <div className="location-card-header">
        <h3 className="location-name">{location.name}</h3>
        <span className="badge badge-warning badge-sm simulation-badge">Simulation</span>
      </div>

      {/* Content */}
      <div className="location-card-content">
        {/* Address */}
        <div className="location-address">
          <svg className="location-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span>{location.address}</span>
        </div>

        {/* Distance Indicator */}
        <div className="location-distance">
          <svg className="distance-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
          </svg>
          <span>{location.distance} km away</span>
        </div>

        {/* Availability Section */}
        <div className={`location-availability ${getAvailabilityColor(location.available_spots)}`}>
          <div className="availability-number">{location.available_spots}</div>
          <div className="availability-label">
            <span className="spots-text">spots available</span>
            <span className="update-time">Just now</span>
          </div>
        </div>

        {/* Pricing */}
        <div className="location-pricing">
          <div className="price-main">
            <span className="price-amount">₹{location.hourly_rate}</span>
            <span className="price-unit">per hour</span>
          </div>
          {discount && (
            <span className="discount-badge">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
                  clipRule="evenodd"
                />
              </svg>
              {discount}% OFF
            </span>
          )}
        </div>

        {/* Features */}
        <div className="location-features">
          <div className="feature-item" title="CCTV Surveillance">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <span>CCTV</span>
          </div>
          <div className="feature-item" title="Security Guard">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <span>Security</span>
          </div>
          <div className="feature-item" title="Well Lit Area">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            <span>Well Lit</span>
          </div>
          <div className="feature-item" title="Open 24/7">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>24/7</span>
          </div>
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="location-card-footer">
        <button
          className="btn btn-secondary btn-sm"
          onClick={handleCheckAvailability}
          disabled={checking}
        >
          {checking ? (
            <>
              <div className="spinner spinner-sm"></div>
              Checking...
            </>
          ) : (
            <>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Check Availability
            </>
          )}
        </button>
        <button
          className="btn btn-primary btn-sm"
          onClick={handleNavigate}
          disabled={checking}
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          Navigate
        </button>
      </div>

      {/* Disclaimer */}
      <div className="location-disclaimer">
        <svg fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
        <span>Simulation data - Feature under development</span>
      </div>
    </div>
  );
};

export default LocationCard;
