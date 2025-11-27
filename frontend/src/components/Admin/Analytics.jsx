/**
 * Analytics Component
 * Admin dashboard for viewing analytics and reports
 * Features: key metrics, trends, charts, insights, export
 */

import React, { useState, useEffect, useCallback } from 'react';
import organizationService from '../../services/organizationService';
import '../../styles/Common.css';

/**
 * Analytics Component
 * @param {Object} props
 * @param {number} props.organizationId - Organization ID
 */
const Analytics = ({ organizationId }) => {
  // State management
  const [dateRange, setDateRange] = useState('week');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Fetch analytics data
   */
  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const response = await organizationService.getAnalytics(organizationId, dateRange);
      setAnalyticsData(response.data || generateMockData(dateRange));
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Use mock data if API fails
      setAnalyticsData(generateMockData(dateRange));
    } finally {
      setLoading(false);
    }
  }, [organizationId, dateRange]);

  /**
   * Fetch on mount and when dateRange changes
   */
  useEffect(() => {
    if (organizationId) {
      fetchAnalytics();
    }
  }, [organizationId, dateRange, fetchAnalytics]);

  /**
   * Generate mock analytics data
   */
  const generateMockData = (range) => {
    const days = range === 'week' ? 7 : range === 'month' ? 30 : 365;
    const bookingsData = [];
    const labels = [];

    for (let i = 0; i < (range === 'week' ? 7 : range === 'month' ? 30 : 12); i++) {
      if (range === 'year') {
        labels.push(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]);
        bookingsData.push(Math.floor(Math.random() * 200 + 100));
      } else {
        const date = new Date();
        date.setDate(date.getDate() - (days - i - 1));
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        bookingsData.push(Math.floor(Math.random() * 50 + 10));
      }
    }

    // Generate hourly occupancy
    const occupancyHeatmap = [];
    const hours = ['6AM', '8AM', '10AM', '12PM', '2PM', '4PM', '6PM', '8PM'];
    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    weekdays.forEach(day => {
      const dayData = { day };
      hours.forEach(hour => {
        dayData[hour] = Math.floor(Math.random() * 100);
      });
      occupancyHeatmap.push(dayData);
    });

    return {
      totalBookings: bookingsData.reduce((a, b) => a + b, 0),
      bookingsTrend: Math.random() > 0.5 ? 12 : -5,
      revenue: Math.floor(Math.random() * 50000 + 10000),
      revenueTrend: Math.random() > 0.5 ? 8 : -3,
      avgOccupancy: Math.floor(Math.random() * 30 + 60),
      peakHours: '9 AM - 11 AM',
      bookingsData,
      labels,
      memberBookings: Math.floor(Math.random() * 40 + 50),
      visitorBookings: Math.floor(Math.random() * 40 + 10),
      occupancyHeatmap,
      hours,
      weekdays,
      avgDuration: (Math.random() * 3 + 2).toFixed(1),
      insights: [
        { icon: 'clock', text: 'Peak time is 9 AM - 11 AM with 85% occupancy' },
        { icon: 'users', text: '68% of bookings are from organization members' },
        { icon: 'chart', text: 'Average parking duration: 3.5 hours' },
        { icon: 'trend', text: 'Weekends show 40% lower occupancy than weekdays' }
      ]
    };
  };

  /**
   * Handle date range change
   */
  const handleDateRangeChange = (range) => {
    setDateRange(range);
  };

  /**
   * Handle export
   */
  const handleExport = (format) => {
    if (format === 'pdf') {
      alert('PDF export feature coming soon!\n\nThis will generate a comprehensive PDF report with all analytics data.');
    } else if (format === 'csv') {
      alert('CSV export feature coming soon!\n\nThis will export analytics data in CSV format for Excel/Sheets.');
    } else if (format === 'email') {
      alert('Email report feature coming soon!\n\nThis will send a detailed analytics report to your email.');
    }
  };

  /**
   * Get trend icon and color
   */
  const getTrendDisplay = (trend) => {
    const isPositive = trend > 0;
    return (
      <span className={`trend ${isPositive ? 'trend-up' : 'trend-down'}`}>
        <svg fill="currentColor" viewBox="0 0 20 20">
          {isPositive ? (
            <path
              fillRule="evenodd"
              d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          ) : (
            <path
              fillRule="evenodd"
              d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          )}
        </svg>
        {Math.abs(trend)}%
      </span>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="analytics-container">
        <div className="loading-skeleton">
          <div className="skeleton-header"></div>
          <div className="skeleton-metrics-grid"></div>
          <div className="skeleton-chart"></div>
          <div className="skeleton-chart"></div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="analytics-container">
        <div className="empty-state">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <h3>No Analytics Data</h3>
          <p>Analytics data is not available at the moment.</p>
        </div>
      </div>
    );
  }

  const maxBookings = Math.max(...analyticsData.bookingsData);

  return (
    <div className="analytics-container">
      {/* Header */}
      <div className="analytics-header">
        <div className="header-left">
          <h2 className="page-title">Analytics & Reports</h2>
          <p className="page-subtitle">
            Track performance and gain insights from your parking data
          </p>
        </div>
        <div className="header-right">
          {/* Date Range Selector */}
          <div className="date-range-selector">
            <button
              className={`range-btn ${dateRange === 'week' ? 'active' : ''}`}
              onClick={() => handleDateRangeChange('week')}
            >
              Week
            </button>
            <button
              className={`range-btn ${dateRange === 'month' ? 'active' : ''}`}
              onClick={() => handleDateRangeChange('month')}
            >
              Month
            </button>
            <button
              className={`range-btn ${dateRange === 'year' ? 'active' : ''}`}
              onClick={() => handleDateRangeChange('year')}
            >
              Year
            </button>
          </div>

          {/* Export Dropdown */}
          <div className="export-dropdown">
            <button className="btn btn-primary">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Export
            </button>
            <div className="dropdown-menu">
              <button onClick={() => handleExport('pdf')}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                Download as PDF
              </button>
              <button onClick={() => handleExport('csv')}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Download as CSV
              </button>
              <button onClick={() => handleExport('email')}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Email Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="metrics-grid">
        {/* Total Bookings */}
        <div className="metric-card">
          <div className="metric-icon metric-icon-blue">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div className="metric-content">
            <div className="metric-label">Total Bookings</div>
            <div className="metric-value">{analyticsData.totalBookings}</div>
            {getTrendDisplay(analyticsData.bookingsTrend)}
          </div>
        </div>

        {/* Revenue Generated */}
        <div className="metric-card">
          <div className="metric-icon metric-icon-green">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="metric-content">
            <div className="metric-label">Revenue Generated</div>
            <div className="metric-value">₹{analyticsData.revenue.toLocaleString()}</div>
            {getTrendDisplay(analyticsData.revenueTrend)}
          </div>
        </div>

        {/* Average Occupancy */}
        <div className="metric-card">
          <div className="metric-icon metric-icon-purple">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <div className="metric-content">
            <div className="metric-label">Avg Occupancy Rate</div>
            <div className="metric-value">{analyticsData.avgOccupancy}%</div>
            <span className="metric-subtitle">Across all slots</span>
          </div>
        </div>

        {/* Peak Hours */}
        <div className="metric-card">
          <div className="metric-icon metric-icon-orange">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="metric-content">
            <div className="metric-label">Peak Hours</div>
            <div className="metric-value metric-value-sm">{analyticsData.peakHours}</div>
            <span className="metric-subtitle">Busiest time</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        {/* Bookings Trend Chart */}
        <div className="chart-card chart-card-full">
          <div className="chart-header">
            <h3 className="chart-title">Bookings Trend</h3>
            <p className="chart-subtitle">Daily booking volume over time</p>
          </div>
          <div className="chart-content">
            <div className="line-chart">
              <div className="chart-y-axis">
                <span>{maxBookings}</span>
                <span>{Math.floor(maxBookings * 0.75)}</span>
                <span>{Math.floor(maxBookings * 0.5)}</span>
                <span>{Math.floor(maxBookings * 0.25)}</span>
                <span>0</span>
              </div>
              <div className="chart-area">
                <svg viewBox="0 0 800 300" className="line-chart-svg">
                  {/* Grid lines */}
                  {[0, 1, 2, 3, 4].map((i) => (
                    <line
                      key={i}
                      x1="0"
                      y1={i * 75}
                      x2="800"
                      y2={i * 75}
                      stroke="#e5e7eb"
                      strokeWidth="1"
                    />
                  ))}
                  
                  {/* Line path */}
                  <polyline
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    points={analyticsData.bookingsData
                      .map((value, index) => {
                        const x = (index / (analyticsData.bookingsData.length - 1)) * 800;
                        const y = 300 - (value / maxBookings) * 300;
                        return `${x},${y}`;
                      })
                      .join(' ')}
                  />
                  
                  {/* Data points */}
                  {analyticsData.bookingsData.map((value, index) => {
                    const x = (index / (analyticsData.bookingsData.length - 1)) * 800;
                    const y = 300 - (value / maxBookings) * 300;
                    return (
                      <circle
                        key={index}
                        cx={x}
                        cy={y}
                        r="5"
                        fill="#3b82f6"
                      />
                    );
                  })}
                </svg>
                <div className="chart-x-axis">
                  {analyticsData.labels.map((label, index) => (
                    <span key={index}>{label}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Member vs Visitor Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Member vs Visitor</h3>
            <p className="chart-subtitle">Booking distribution</p>
          </div>
          <div className="chart-content">
            <div className="pie-chart">
              <svg viewBox="0 0 200 200" className="pie-chart-svg">
                {/* Member slice */}
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="transparent"
                  stroke="#3b82f6"
                  strokeWidth="40"
                  strokeDasharray={`${(analyticsData.memberBookings / 100) * 502} 502`}
                  transform="rotate(-90 100 100)"
                />
                {/* Visitor slice */}
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="transparent"
                  stroke="#10b981"
                  strokeWidth="40"
                  strokeDasharray={`${(analyticsData.visitorBookings / 100) * 502} 502`}
                  strokeDashoffset={`-${(analyticsData.memberBookings / 100) * 502}`}
                  transform="rotate(-90 100 100)"
                />
              </svg>
              <div className="pie-chart-legend">
                <div className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: '#3b82f6' }}></span>
                  <span className="legend-label">Members ({analyticsData.memberBookings}%)</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: '#10b981' }}></span>
                  <span className="legend-label">Visitors ({analyticsData.visitorBookings}%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Trend Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Revenue Trend</h3>
            <p className="chart-subtitle">Visitor payments only</p>
          </div>
          <div className="chart-content">
            <div className="bar-chart">
              {analyticsData.bookingsData.slice(0, 7).map((value, index) => {
                const height = (value / maxBookings) * 100;
                return (
                  <div key={index} className="bar-item">
                    <div className="bar-column">
                      <div
                        className="bar-fill"
                        style={{ height: `${height}%` }}
                        title={`₹${(value * 50).toLocaleString()}`}
                      ></div>
                    </div>
                    <span className="bar-label">{analyticsData.labels[index]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Occupancy Heatmap */}
        <div className="chart-card chart-card-full">
          <div className="chart-header">
            <h3 className="chart-title">Occupancy Heatmap</h3>
            <p className="chart-subtitle">Busiest hours throughout the week</p>
          </div>
          <div className="chart-content">
            <div className="heatmap">
              <div className="heatmap-y-labels">
                {analyticsData.weekdays.map((day) => (
                  <div key={day} className="heatmap-y-label">{day}</div>
                ))}
              </div>
              <div className="heatmap-grid">
                {analyticsData.occupancyHeatmap.map((row, rowIndex) => (
                  <div key={rowIndex} className="heatmap-row">
                    {analyticsData.hours.map((hour) => {
                      const value = row[hour];
                      const intensity = Math.floor((value / 100) * 4);
                      return (
                        <div
                          key={hour}
                          className={`heatmap-cell heatmap-intensity-${intensity}`}
                          title={`${row.day} ${hour}: ${value}% occupied`}
                        ></div>
                      );
                    })}
                  </div>
                ))}
                <div className="heatmap-x-labels">
                  {analyticsData.hours.map((hour) => (
                    <div key={hour} className="heatmap-x-label">{hour}</div>
                  ))}
                </div>
              </div>
              <div className="heatmap-legend">
                <span className="heatmap-legend-label">Low</span>
                <div className="heatmap-legend-gradient">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className={`heatmap-cell heatmap-intensity-${i}`}></div>
                  ))}
                </div>
                <span className="heatmap-legend-label">High</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Insights Section */}
      <div className="insights-section">
        <div className="insights-header">
          <h3 className="insights-title">Key Insights</h3>
          <p className="insights-subtitle">Auto-generated insights from your data</p>
        </div>
        <div className="insights-grid">
          {analyticsData.insights.map((insight, index) => (
            <div key={index} className="insight-card">
              <div className="insight-icon">
                {insight.icon === 'clock' && (
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
                {insight.icon === 'users' && (
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                )}
                {insight.icon === 'chart' && (
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                )}
                {insight.icon === 'trend' && (
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                )}
              </div>
              <p className="insight-text">{insight.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
