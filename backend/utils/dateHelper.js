// Date Helper Utilities for ParkMitra Backend
// Provides date/time manipulation and formatting functions

/**
 * Get current date and time
 * @returns {Object} Object with ISO and formatted date strings
 */
const getCurrentDateTime = () => {
  const now = new Date();
  
  return {
    iso: now.toISOString(),
    formatted: now.toLocaleString('en-IN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }),
    timestamp: now.getTime(),
    date: now
  };
};

/**
 * Check if a date/time is in the future
 * @param {string|Date} dateTime - Date/time string or Date object
 * @returns {boolean} True if date is in future, false otherwise
 */
const isInFuture = (dateTime) => {
  try {
    const inputDate = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
    const now = new Date();
    
    if (isNaN(inputDate.getTime())) {
      console.error('Invalid date provided to isInFuture:', dateTime);
      return false;
    }
    
    return inputDate > now;
  } catch (error) {
    console.error('Error checking if date is in future:', error);
    return false;
  }
};

/**
 * Calculate duration in hours between two date/times
 * @param {string|Date} startTime - Start date/time
 * @param {string|Date} endTime - End date/time
 * @returns {number} Duration in decimal hours (e.g., 2.5 for 2 hours 30 minutes)
 */
const calculateDurationHours = (startTime, endTime) => {
  try {
    const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
    const end = typeof endTime === 'string' ? new Date(endTime) : endTime;
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.error('Invalid date(s) provided to calculateDurationHours:', { startTime, endTime });
      return 0;
    }
    
    const diffMs = end - start;
    const hours = diffMs / (1000 * 60 * 60);
    
    return Math.round(hours * 100) / 100;
  } catch (error) {
    console.error('Error calculating duration:', error);
    return 0;
  }
};

/**
 * Add hours to a date
 * @param {string|Date} date - Starting date
 * @param {number} hours - Number of hours to add (can be decimal)
 * @returns {Date} New Date object with hours added
 */
const addHours = (date, hours) => {
  try {
    const inputDate = typeof date === 'string' ? new Date(date) : new Date(date);
    
    if (isNaN(inputDate.getTime())) {
      console.error('Invalid date provided to addHours:', date);
      return new Date();
    }
    
    const newDate = new Date(inputDate.getTime() + (hours * 60 * 60 * 1000));
    return newDate;
  } catch (error) {
    console.error('Error adding hours to date:', error);
    return new Date();
  }
};

/**
 * Format date for SQLite database
 * @param {Date|string} date - Date object or string to format
 * @returns {string} SQLite compatible datetime string (YYYY-MM-DD HH:MM:SS)
 */
const formatDateForDB = (date) => {
  try {
    const inputDate = date instanceof Date ? date : new Date(date);
    
    if (isNaN(inputDate.getTime())) {
      console.error('Invalid date provided to formatDateForDB:', date);
      return null;
    }
    
    const year = inputDate.getFullYear();
    const month = String(inputDate.getMonth() + 1).padStart(2, '0');
    const day = String(inputDate.getDate()).padStart(2, '0');
    const hours = String(inputDate.getHours()).padStart(2, '0');
    const minutes = String(inputDate.getMinutes()).padStart(2, '0');
    const seconds = String(inputDate.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error('Error formatting date for database:', error);
    return null;
  }
};

/**
 * Check if two dates are on the same day
 * @param {string|Date} date1 - First date
 * @param {string|Date} date2 - Second date
 * @returns {boolean} True if dates are on the same day, false otherwise
 */
const isSameDay = (date1, date2) => {
  try {
    const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
    
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
      console.error('Invalid date(s) provided to isSameDay:', { date1, date2 });
      return false;
    }
    
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  } catch (error) {
    console.error('Error checking if dates are same day:', error);
    return false;
  }
};

// ===== LEGACY FUNCTIONS (Backward Compatibility) =====

/**
 * Calculate parking fee based on hours and rate
 */
const calculateParkingFee = (hours, ratePerHour) => {
  return hours * ratePerHour;
};

/**
 * Parse time string to hours
 */
const parseTime = (timeString) => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours + minutes / 60;
};

/**
 * Format date to YYYY-MM-DD
 */
const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Format time to HH:MM
 */
const formatTime = (date) => {
  const d = new Date(date);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Calculate duration between two times in hours (legacy)
 */
const calculateDuration = (startTime, endTime) => {
  const start = parseTime(startTime);
  const end = parseTime(endTime);
  return end - start;
};

/**
 * Check if time is in the past
 */
const isTimePast = (dateString, timeString) => {
  const bookingDateTime = new Date(`${dateString}T${timeString}`);
  const now = new Date();
  return bookingDateTime < now;
};

/**
 * Check if booking is within advance booking limit
 */
const isWithinAdvanceBookingLimit = (bookingDate, advanceDays) => {
  const booking = new Date(bookingDate);
  const today = new Date();
  const diffTime = booking - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= advanceDays && diffDays >= 0;
};

/**
 * Get date after n days
 */
const getDateAfterDays = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatDate(date);
};

/**
 * Check if date is today
 */
const isToday = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

/**
 * Convert minutes to hours and minutes string
 */
const minutesToHoursMinutes = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

/**
 * Check if date is in the past
 */
const isInPast = (dateTime) => {
  try {
    const inputDate = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
    const now = new Date();
    
    if (isNaN(inputDate.getTime())) {
      return false;
    }
    
    return inputDate < now;
  } catch (error) {
    return false;
  }
};

/**
 * Format date to human-readable string
 */
const formatDateReadable = (date, includeTime = true) => {
  try {
    const inputDate = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(inputDate.getTime())) {
      return 'Invalid Date';
    }
    
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
      options.hour12 = true;
    }
    
    return inputDate.toLocaleString('en-IN', options);
  } catch (error) {
    return 'Invalid Date';
  }
};

/**
 * Get time difference in human-readable format
 */
const getReadableDuration = (startTime, endTime) => {
  try {
    const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
    const end = typeof endTime === 'string' ? new Date(endTime) : endTime;
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 'Invalid duration';
    }
    
    const diffMs = end - start;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours === 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else if (minutes === 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
      return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
  } catch (error) {
    return 'Invalid duration';
  }
};

module.exports = {
  // New requested functions
  getCurrentDateTime,
  isInFuture,
  calculateDurationHours,
  addHours,
  formatDateForDB,
  isSameDay,
  
  // Additional utility functions
  isInPast,
  formatDateReadable,
  getReadableDuration,
  
  // Legacy functions (backward compatibility)
  calculateParkingFee,
  parseTime,
  formatDate,
  formatTime,
  calculateDuration,
  isTimePast,
  isWithinAdvanceBookingLimit,
  getDateAfterDays,
  isToday,
  minutesToHoursMinutes
};
