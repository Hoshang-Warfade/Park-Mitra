const QRCode = require('qrcode');

/**
 * Generate QR code from booking object
 * @param {Object} bookingData - Booking object with booking_id, user_id, vehicle_number
 * @returns {String} QR code data URL (base64 image)
 */
const generateQRCode = async (bookingData) => {
  try {
    // Validate input
    if (!bookingData) {
      throw new Error('Booking data is required');
    }

    // Create data string from booking info
    let dataString;
    if (typeof bookingData === 'string') {
      // If already a string, use it directly
      dataString = bookingData;
    } else if (typeof bookingData === 'object') {
      // Ensure required fields exist
      const { booking_id, user_id, vehicle_number } = bookingData;
      if (!booking_id || !user_id) {
        throw new Error('booking_id and user_id are required');
      }

      // Create structured data object
      const qrData = {
        booking_id,
        user_id,
        vehicle_number: vehicle_number || 'N/A',
        timestamp: new Date().toISOString(),
        version: '1.0'
      };

      // JSON stringify for QR code
      dataString = JSON.stringify(qrData);
    } else {
      throw new Error('Invalid booking data type: must be a string or object');
    }

    // Generate QR code as base64 data URL
    const qrCodeDataUrl = await QRCode.toDataURL(dataString, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 1,
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    return qrCodeDataUrl;
  } catch (error) {
    throw new Error('Error generating QR code: ' + error.message);
  }
};

/**
 * Generate QR code data string for database storage
 * @param {Number} booking_id - Booking ID
 * @param {Number} user_id - User ID
 * @param {Object} additionalData - Optional additional data (vehicle_number, organization_id, etc.)
 * @returns {String} Encoded JSON string for database storage
 */
const generateQRCodeData = (booking_id, user_id, additionalData = {}) => {
  try {
    // Validate inputs
    if (!booking_id || !user_id) {
      throw new Error('booking_id and user_id are required');
    }

    // Create encoded string with booking info and timestamp
    const qrData = {
      booking_id,
      user_id,
      timestamp: new Date().toISOString(),
      version: '1.0',
      ...additionalData
    };

    // Return encoded string (JSON) for database storage
    return JSON.stringify(qrData);
  } catch (error) {
    throw new Error('Error generating QR code data: ' + error.message);
  }
};

/**
 * Decode QR code data string
 * @param {String} qr_code_data - QR code data string from database or scan
 * @returns {Object} Decoded object with booking_id, user_id, etc.
 */
const decodeQRData = (qr_code_data) => {
  try {
    // Validate input
    if (!qr_code_data || typeof qr_code_data !== 'string') {
      throw new Error('Invalid QR data: must be a non-empty string');
    }

    // Parse JSON string
    const decodedData = JSON.parse(qr_code_data);

    // Validate required fields
    if (!decodedData.booking_id || !decodedData.user_id) {
      throw new Error('Invalid QR data: missing booking_id or user_id');
    }

    // Return decoded object
    return {
      booking_id: decodedData.booking_id,
      user_id: decodedData.user_id,
      vehicle_number: decodedData.vehicle_number,
      organization_id: decodedData.organization_id,
      slot_number: decodedData.slot_number,
      timestamp: decodedData.timestamp,
      version: decodedData.version || '1.0'
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid QR data format: not valid JSON');
    }
    throw new Error('Error decoding QR data: ' + error.message);
  }
};

/**
 * Generate QR code as buffer (for file storage)
 * @param {String} data - Data to encode in QR code
 * @returns {Buffer} QR code image buffer
 */
const generateQRCodeBuffer = async (data) => {
  try {
    if (!data) {
      throw new Error('Data is required to generate QR code buffer');
    }

    const buffer = await QRCode.toBuffer(data, {
      errorCorrectionLevel: 'H',
      type: 'png',
      quality: 0.95,
      margin: 1,
      width: 300
    });

    return buffer;
  } catch (error) {
    throw new Error('Error generating QR code buffer: ' + error.message);
  }
};

/**
 * Verify QR code data integrity
 * @param {String} qr_code_data - QR code data to verify
 * @returns {Boolean} True if valid, false otherwise
 */
const verifyQRCodeData = (qr_code_data) => {
  try {
    const decoded = decodeQRData(qr_code_data);
    
    // Check if required fields exist
    if (!decoded.booking_id || !decoded.user_id) {
      return false;
    }

    // Optional: Check timestamp (reject if older than 24 hours)
    if (decoded.timestamp) {
      const qrTimestamp = new Date(decoded.timestamp);
      const now = new Date();
      const hoursDiff = (now - qrTimestamp) / (1000 * 60 * 60);
      
      // QR codes older than 24 hours might be invalid
      if (hoursDiff > 24) {
        return false;
      }
    }

    return true;
  } catch (error) {
    return false;
  }
};

module.exports = {
  generateQRCode,
  generateQRCodeData,
  decodeQRData,
  generateQRCodeBuffer,
  verifyQRCodeData
};
