// Formatting Utilities

/**
 * Format date to readable string
 * @param {Date|string|number} date - Date to format
 * @returns {string} - Formatted date: "Oct 30, 2025, 7:00 PM"
 */
export const formatDate = (date) => {
  if (!date) {
    return '';
  }

  const d = new Date(date);

  // Check if date is valid
  if (isNaN(d.getTime())) {
    return 'Invalid date';
  }

  // Format: "Oct 30, 2025, 7:00 PM"
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  };

  return d.toLocaleString('en-US', options);
};

/**
 * Format date without time
 * @param {Date|string|number} date - Date to format
 * @returns {string} - Formatted date: "Oct 30, 2025"
 */
export const formatDateOnly = (date) => {
  if (!date) {
    return '';
  }

  const d = new Date(date);

  if (isNaN(d.getTime())) {
    return 'Invalid date';
  }

  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };

  return d.toLocaleString('en-US', options);
};

/**
 * Format time only
 * @param {Date|string|number} time - Time to format
 * @returns {string} - Formatted time: "7:00 PM"
 */
export const formatTime = (time) => {
  if (!time) {
    return '';
  }

  const d = new Date(time);

  if (isNaN(d.getTime())) {
    return 'Invalid time';
  }

  const options = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  };

  return d.toLocaleString('en-US', options);
};

/**
 * Format date and time (legacy support)
 * @param {Date|string|number} datetime - DateTime to format
 * @returns {string} - Formatted datetime
 */
export const formatDateTime = (datetime) => {
  return formatDate(datetime);
};

/**
 * Format currency in Indian Rupees
 * @param {number|string} amount - Amount to format
 * @returns {string} - Formatted currency: "₹1,234.56"
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || amount === '') {
    return '₹0.00';
  }

  const numAmount = parseFloat(amount);

  if (isNaN(numAmount)) {
    return '₹0.00';
  }

  // Format with Indian locale (lakhs and crores)
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numAmount);
};

/**
 * Format duration in hours to readable string
 * @param {number} hours - Duration in hours (can be decimal)
 * @returns {string} - Formatted duration: "2 hours 30 minutes" or "30 minutes"
 */
export const formatDuration = (hours) => {
  if (hours === null || hours === undefined || isNaN(hours)) {
    return '0 minutes';
  }

  const totalMinutes = Math.round(hours * 60);

  if (totalMinutes === 0) {
    return '0 minutes';
  }

  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  const parts = [];

  if (h > 0) {
    parts.push(`${h} ${h === 1 ? 'hour' : 'hours'}`);
  }

  if (m > 0) {
    parts.push(`${m} ${m === 1 ? 'minute' : 'minutes'}`);
  }

  return parts.join(' ');
};

/**
 * Format mobile number with country code
 * @param {string} mobile - Mobile number (10 digits)
 * @returns {string} - Formatted mobile: "+91 98765 43210"
 */
export const formatMobile = (mobile) => {
  if (!mobile) {
    return '';
  }

  // Clean the mobile number (remove spaces, hyphens, etc.)
  const cleaned = mobile.toString().replace(/\D/g, '');

  // If already has country code (11 digits starting with 91)
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    const number = cleaned.substring(2);
    return `+91 ${number.substring(0, 5)} ${number.substring(5)}`;
  }

  // If 10 digits, add country code
  if (cleaned.length === 10) {
    return `+91 ${cleaned.substring(0, 5)} ${cleaned.substring(5)}`;
  }

  // Return as is if format is unclear
  return mobile;
};

/**
 * Format vehicle number to uppercase with proper spacing
 * @param {string} vehicleNumber - Vehicle number
 * @returns {string} - Formatted vehicle number: "MH 12 AB 1234"
 */
export const formatVehicleNumber = (vehicleNumber) => {
  if (!vehicleNumber) {
    return '';
  }

  // Clean and uppercase
  const cleaned = vehicleNumber.toString().replace(/\s+/g, '').replace(/-/g, '').toUpperCase();

  // Indian format: XX00XX0000 or XX00X0000
  // Add spaces: XX 00 XX 0000
  const match = cleaned.match(/^([A-Z]{2})(\d{1,2})([A-Z]{1,2})(\d{4})$/);

  if (match) {
    return `${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
  }

  // If format doesn't match, return uppercase
  return cleaned;
};

/**
 * Calculate time remaining until a future date
 * @param {Date|string|number} futureDate - Future date/time
 * @returns {Object} - { days, hours, minutes, seconds, total, isExpired }
 */
export const calculateTimeRemaining = (futureDate) => {
  if (!futureDate) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      total: 0,
      isExpired: true
    };
  }

  const future = new Date(futureDate);
  const now = new Date();

  if (isNaN(future.getTime())) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      total: 0,
      isExpired: true
    };
  }

  const diff = future.getTime() - now.getTime();

  // Check if expired
  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      total: 0,
      isExpired: true
    };
  }

  // Calculate time components
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return {
    days,
    hours,
    minutes,
    seconds,
    total: diff,
    isExpired: false
  };
};

/**
 * Format time remaining to readable string
 * @param {Date|string|number} futureDate - Future date/time
 * @returns {string} - Formatted string: "2 days 3 hours" or "5 minutes"
 */
export const formatTimeRemaining = (futureDate) => {
  const remaining = calculateTimeRemaining(futureDate);

  if (remaining.isExpired) {
    return 'Expired';
  }

  const parts = [];

  if (remaining.days > 0) {
    parts.push(`${remaining.days} ${remaining.days === 1 ? 'day' : 'days'}`);
  }

  if (remaining.hours > 0) {
    parts.push(`${remaining.hours} ${remaining.hours === 1 ? 'hour' : 'hours'}`);
  }

  if (remaining.minutes > 0 && remaining.days === 0) {
    parts.push(`${remaining.minutes} ${remaining.minutes === 1 ? 'minute' : 'minutes'}`);
  }

  if (parts.length === 0 && remaining.seconds > 0) {
    parts.push(`${remaining.seconds} ${remaining.seconds === 1 ? 'second' : 'seconds'}`);
  }

  return parts.join(' ') || 'Just now';
};

/**
 * Format relative time (e.g., "2 hours ago", "in 5 minutes")
 * @param {Date|string|number} date - Date to format
 * @returns {string} - Relative time string
 */
export const formatRelativeTime = (date) => {
  if (!date) {
    return '';
  }

  const d = new Date(date);
  const now = new Date();

  if (isNaN(d.getTime())) {
    return 'Invalid date';
  }

  const diff = d.getTime() - now.getTime();
  const absDiff = Math.abs(diff);
  const isPast = diff < 0;

  const seconds = Math.floor(absDiff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  let timeStr = '';

  if (days > 0) {
    timeStr = `${days} ${days === 1 ? 'day' : 'days'}`;
  } else if (hours > 0) {
    timeStr = `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  } else if (minutes > 0) {
    timeStr = `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
  } else {
    timeStr = `${seconds} ${seconds === 1 ? 'second' : 'seconds'}`;
  }

  return isPast ? `${timeStr} ago` : `in ${timeStr}`;
};

/**
 * Format file size in bytes to readable string
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted size: "1.5 MB"
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  if (!bytes || isNaN(bytes)) return 'N/A';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Capitalize first letter of each word
 * @param {string} str - String to capitalize
 * @returns {string} - Capitalized string
 */
export const capitalizeWords = (str) => {
  if (!str) return '';

  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;

  return text.substring(0, maxLength).trim() + '...';
};
