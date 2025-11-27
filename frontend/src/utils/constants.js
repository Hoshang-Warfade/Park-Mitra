// Application Constants

// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// User Types
export const USER_TYPES = {
  ORGANIZATION_MEMBER: 'organization_member',
  VISITOR: 'visitor',
  WALK_IN: 'walk_in',
  ADMIN: 'admin',
  WATCHMAN: 'watchman'
};

// User Type Labels (for display)
export const USER_TYPE_LABELS = {
  [USER_TYPES.ORGANIZATION_MEMBER]: 'Organization Member',
  [USER_TYPES.VISITOR]: 'Visitor',
  [USER_TYPES.WALK_IN]: 'Walk-in',
  [USER_TYPES.ADMIN]: 'Administrator',
  [USER_TYPES.WATCHMAN]: 'Watchman'
};

// Booking Status
export const BOOKING_STATUS = {
  ACTIVE: 'active',
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
  NO_SHOW: 'no-show'
};

// Booking Status Labels
export const BOOKING_STATUS_LABELS = {
  [BOOKING_STATUS.ACTIVE]: 'Active',
  [BOOKING_STATUS.PENDING]: 'Pending',
  [BOOKING_STATUS.CONFIRMED]: 'Confirmed',
  [BOOKING_STATUS.COMPLETED]: 'Completed',
  [BOOKING_STATUS.CANCELLED]: 'Cancelled',
  [BOOKING_STATUS.EXPIRED]: 'Expired',
  [BOOKING_STATUS.NO_SHOW]: 'No Show'
};

// Booking Status Colors (Tailwind classes)
export const BOOKING_STATUS_COLORS = {
  [BOOKING_STATUS.ACTIVE]: 'bg-green-100 text-green-800',
  [BOOKING_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800',
  [BOOKING_STATUS.CONFIRMED]: 'bg-blue-100 text-blue-800',
  [BOOKING_STATUS.COMPLETED]: 'bg-gray-100 text-gray-800',
  [BOOKING_STATUS.CANCELLED]: 'bg-red-100 text-red-800',
  [BOOKING_STATUS.EXPIRED]: 'bg-orange-100 text-orange-800',
  [BOOKING_STATUS.NO_SHOW]: 'bg-purple-100 text-purple-800'
};

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  PROCESSING: 'processing'
};

// Payment Status Labels
export const PAYMENT_STATUS_LABELS = {
  [PAYMENT_STATUS.PENDING]: 'Pending',
  [PAYMENT_STATUS.COMPLETED]: 'Completed',
  [PAYMENT_STATUS.FAILED]: 'Failed',
  [PAYMENT_STATUS.REFUNDED]: 'Refunded',
  [PAYMENT_STATUS.PROCESSING]: 'Processing'
};

// Payment Status Colors
export const PAYMENT_STATUS_COLORS = {
  [PAYMENT_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800',
  [PAYMENT_STATUS.COMPLETED]: 'bg-green-100 text-green-800',
  [PAYMENT_STATUS.FAILED]: 'bg-red-100 text-red-800',
  [PAYMENT_STATUS.REFUNDED]: 'bg-blue-100 text-blue-800',
  [PAYMENT_STATUS.PROCESSING]: 'bg-indigo-100 text-indigo-800'
};

// Payment Methods
export const PAYMENT_METHODS = {
  ONLINE: 'online',
  CASH: 'cash',
  UPI: 'upi',
  CARD: 'card',
  NET_BANKING: 'net_banking',
  FREE: 'free'
};

// Payment Method Labels
export const PAYMENT_METHOD_LABELS = {
  [PAYMENT_METHODS.ONLINE]: 'Online Payment',
  [PAYMENT_METHODS.CASH]: 'Cash Payment',
  [PAYMENT_METHODS.UPI]: 'UPI',
  [PAYMENT_METHODS.CARD]: 'Credit/Debit Card',
  [PAYMENT_METHODS.NET_BANKING]: 'Net Banking',
  [PAYMENT_METHODS.FREE]: 'Free (Member)'
};

// Vehicle Types
export const VEHICLE_TYPES = {
  TWO_WHEELER: '2-wheeler',
  FOUR_WHEELER: '4-wheeler',
  BICYCLE: 'bicycle',
  HEAVY_VEHICLE: 'heavy-vehicle'
};

// Vehicle Type Labels
export const VEHICLE_TYPE_LABELS = {
  [VEHICLE_TYPES.TWO_WHEELER]: 'Two Wheeler',
  [VEHICLE_TYPES.FOUR_WHEELER]: 'Four Wheeler',
  [VEHICLE_TYPES.BICYCLE]: 'Bicycle',
  [VEHICLE_TYPES.HEAVY_VEHICLE]: 'Heavy Vehicle'
};

// Slot Types
export const SLOT_TYPES = {
  REGULAR: 'regular',
  COMPACT: 'compact',
  LARGE: 'large',
  HANDICAP: 'handicap',
  EV_CHARGING: 'ev_charging',
  VIP: 'vip'
};

// Slot Status
export const SLOT_STATUS = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  RESERVED: 'reserved',
  MAINTENANCE: 'maintenance'
};

// Slot Status Colors
export const SLOT_STATUS_COLORS = {
  [SLOT_STATUS.AVAILABLE]: 'bg-green-500',
  [SLOT_STATUS.OCCUPIED]: 'bg-red-500',
  [SLOT_STATUS.RESERVED]: 'bg-yellow-500',
  [SLOT_STATUS.MAINTENANCE]: 'bg-gray-500'
};

// Time Slots (for quick booking)
export const QUICK_TIME_SLOTS = [
  { label: '1 hour', hours: 1 },
  { label: '2 hours', hours: 2 },
  { label: '3 hours', hours: 3 },
  { label: '4 hours', hours: 4 },
  { label: '6 hours', hours: 6 },
  { label: '8 hours', hours: 8 },
  { label: '12 hours', hours: 12 },
  { label: '24 hours', hours: 24 }
];

// Pricing (per hour)
export const PRICING = {
  [VEHICLE_TYPES.TWO_WHEELER]: 20,
  [VEHICLE_TYPES.FOUR_WHEELER]: 40,
  [VEHICLE_TYPES.BICYCLE]: 10,
  [VEHICLE_TYPES.HEAVY_VEHICLE]: 60,
  MEMBER_DISCOUNT: 100, // 100% discount for members (free)
  VISITOR_RATE: 1.0 // No discount for visitors
};

// Date & Time Formats
export const DATE_FORMAT = 'MMM DD, YYYY';
export const TIME_FORMAT = 'hh:mm A';
export const DATETIME_FORMAT = 'MMM DD, YYYY, hh:mm A';
export const DATE_INPUT_FORMAT = 'YYYY-MM-DD';
export const TIME_INPUT_FORMAT = 'HH:mm';

// Validation Rules
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MOBILE_LENGTH: 10,
  MIN_BOOKING_DURATION: 0.5, // 30 minutes
  MAX_BOOKING_DURATION: 24, // 24 hours
  MIN_ADVANCE_BOOKING: 5, // 5 minutes
  MAX_ADVANCE_BOOKING: 30 // 30 days
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 20, 50, 100]
};

// QR Code Settings
export const QR_CODE = {
  SIZE: 256,
  LEVEL: 'H', // Error correction level (L, M, Q, H)
  MARGIN: 2,
  EXPIRY_MINUTES: 10 // QR code validity
};

// Toast Notification Settings
export const TOAST = {
  POSITION: 'top-right',
  AUTO_CLOSE: 3000,
  HIDE_PROGRESS_BAR: false,
  CLOSE_ON_CLICK: true,
  PAUSE_ON_HOVER: true,
  DRAGGABLE: true
};

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'token',
  USER_DATA: 'user',
  THEME: 'theme',
  LANGUAGE: 'language',
  RECENT_SEARCHES: 'recentSearches'
};

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  REFRESH_TOKEN: '/auth/refresh',
  
  // Users
  USER_PROFILE: '/users/profile',
  UPDATE_PROFILE: '/users/profile',
  CHANGE_PASSWORD: '/users/change-password',
  
  // Organizations
  ORGANIZATIONS: '/organizations',
  ORGANIZATION_MEMBERS: '/organizations/:id/members',
  
  // Bookings
  BOOKINGS: '/bookings',
  USER_BOOKINGS: '/bookings/user',
  BOOKING_DETAILS: '/bookings/:id',
  CANCEL_BOOKING: '/bookings/:id/cancel',
  
  // Payments
  PAYMENTS: '/payments',
  PAYMENT_STATUS: '/payments/:id/status',
  INITIATE_PAYMENT: '/payments/initiate',
  
  // Watchman
  SCAN_QR: '/watchman/scan',
  VERIFY_ENTRY: '/watchman/verify-entry',
  VERIFY_EXIT: '/watchman/verify-exit',
  PARKING_STATUS: '/watchman/status',
  
  // Informal Parking
  STREET_PARKING: '/informal-parking/locations',
  CHECK_AVAILABILITY: '/informal-parking/availability'
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your internet connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  SESSION_EXPIRED: 'Your session has expired. Please login again.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  BOOKING_FAILED: 'Failed to create booking. Please try again.',
  PAYMENT_FAILED: 'Payment failed. Please try again.',
  GENERIC_ERROR: 'Something went wrong. Please try again.'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  REGISTRATION_SUCCESS: 'Registration successful!',
  BOOKING_SUCCESS: 'Booking created successfully!',
  PAYMENT_SUCCESS: 'Payment completed successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  PASSWORD_CHANGED: 'Password changed successfully!',
  BOOKING_CANCELLED: 'Booking cancelled successfully!'
};

// Regex Patterns
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  MOBILE: /^\d{10}$/,
  VEHICLE_NUMBER: /^[A-Z]{2}\d{1,2}[A-Z]{1,2}\d{4}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
};

// Debounce/Throttle Delays
export const DELAYS = {
  SEARCH_DEBOUNCE: 300,
  AUTO_SAVE: 1000,
  REFRESH_INTERVAL: 30000, // 30 seconds
  TOAST_DURATION: 3000
};

// Feature Flags
export const FEATURES = {
  STREET_PARKING: true,
  QR_CODE_SCANNER: true,
  PAYMENT_GATEWAY: true,
  NOTIFICATIONS: true,
  ANALYTICS: true,
  MULTI_LANGUAGE: false
};

// App Metadata
export const APP_INFO = {
  NAME: 'ParkMitra',
  VERSION: '1.0.0',
  DESCRIPTION: 'Smart Parking Management System',
  SUPPORT_EMAIL: 'support@parkmitra.com',
  SUPPORT_PHONE: '+91 9876543210'
};
