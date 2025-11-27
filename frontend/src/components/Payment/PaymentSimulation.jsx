import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import paymentService from '../../services/paymentService';
import {
  FaLock,
  FaCreditCard,
  FaMobileAlt,
  FaUniversity,
  FaCheckCircle,
  FaSpinner,
  FaShieldAlt,
  FaRupeeSign,
  FaInfoCircle,
  FaClock,
  FaBuilding
} from 'react-icons/fa';

/**
 * PaymentSimulation Component
 * Simulates payment gateway for booking confirmation
 */
const PaymentSimulation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get booking from route state
  const booking = location.state?.booking;

  // Component state
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
    cardName: ''
  });
  const [upiId, setUpiId] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState(null);
  const [saveCard, setSaveCard] = useState(false);
  const [errors, setErrors] = useState({});

  /**
   * Redirect if no booking data
   */
  useEffect(() => {
    if (!booking) {
      navigate('/booking/new');
    }
  }, [booking, navigate]);

  /**
   * Format card number with spaces
   */
  const formatCardNumber = (value) => {
    const cleaned = value.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.substring(0, 19); // Max 16 digits + 3 spaces
  };

  /**
   * Format expiry date as MM/YY
   */
  const formatExpiry = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  /**
   * Validate card details
   */
  const validateCardDetails = () => {
    const newErrors = {};

    // Card number validation (16 digits)
    const cleanedCardNumber = cardDetails.cardNumber.replace(/\s/g, '');
    if (!cleanedCardNumber) {
      newErrors.cardNumber = 'Card number is required';
    } else if (cleanedCardNumber.length !== 16 || !/^\d{16}$/.test(cleanedCardNumber)) {
      newErrors.cardNumber = 'Card number must be 16 digits';
    }

    // Expiry validation
    if (!cardDetails.expiry) {
      newErrors.expiry = 'Expiry date is required';
    } else {
      const [month, year] = cardDetails.expiry.split('/');
      if (!month || !year || month.length !== 2 || year.length !== 2) {
        newErrors.expiry = 'Invalid format (MM/YY)';
      } else {
        const currentYear = new Date().getFullYear() % 100;
        const currentMonth = new Date().getMonth() + 1;
        const expMonth = parseInt(month);
        const expYear = parseInt(year);

        if (expMonth < 1 || expMonth > 12) {
          newErrors.expiry = 'Invalid month';
        } else if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
          newErrors.expiry = 'Card has expired';
        }
      }
    }

    // CVV validation
    if (!cardDetails.cvv) {
      newErrors.cvv = 'CVV is required';
    } else if (cardDetails.cvv.length !== 3 || !/^\d{3}$/.test(cardDetails.cvv)) {
      newErrors.cvv = 'CVV must be 3 digits';
    }

    // Cardholder name validation
    if (!cardDetails.cardName || cardDetails.cardName.trim().length < 3) {
      newErrors.cardName = 'Cardholder name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Validate UPI ID
   */
  const validateUpiId = () => {
    if (!upiId || !upiId.includes('@')) {
      setErrors({ upiId: 'Invalid UPI ID format' });
      return false;
    }
    setErrors({});
    return true;
  };

  /**
   * Validate Net Banking
   */
  const validateNetBanking = () => {
    if (!selectedBank) {
      setErrors({ bank: 'Please select a bank' });
      return false;
    }
    setErrors({});
    return true;
  };

  /**
   * Simulate payment processing
   */
  const simulatePayment = async () => {
    // Validate based on payment method
    let isValid = false;
    if (paymentMethod === 'card') {
      isValid = validateCardDetails();
    } else if (paymentMethod === 'upi') {
      isValid = validateUpiId();
    } else if (paymentMethod === 'netbanking') {
      isValid = validateNetBanking();
    }

    if (!isValid) return;

    setProcessing(true);
    setErrors({});

    try {
      // Simulate 2-3 seconds processing delay
      await new Promise((resolve) => setTimeout(resolve, 2500));

      // Call payment service
      await paymentService.simulateOnlinePayment(
        booking.id,
        booking.amount,
        paymentMethod
      );

      // Generate mock transaction ID
      const txnId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      setTransactionId(txnId);
      setPaymentSuccess(true);

      // Redirect to QR code page after 2 seconds
      setTimeout(() => {
        navigate(`/booking/${booking.id}/qr`, {
          state: {
            booking: { ...booking, payment_status: 'completed' },
            message: 'Payment successful!'
          }
        });
      }, 2000);
    } catch (error) {
      console.error('Payment simulation error:', error);
      setErrors({ general: 'Payment failed. Please try again.' });
      setProcessing(false);
    }
  };

  /**
   * Handle card input changes
   */
  const handleCardChange = (field, value) => {
    let formattedValue = value;

    if (field === 'cardNumber') {
      formattedValue = formatCardNumber(value);
    } else if (field === 'expiry') {
      formattedValue = formatExpiry(value);
    } else if (field === 'cvv') {
      formattedValue = value.replace(/\D/g, '').substring(0, 3);
    }

    setCardDetails({ ...cardDetails, [field]: formattedValue });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  /**
   * Get card type from number
   */
  const getCardType = () => {
    const cleaned = cardDetails.cardNumber.replace(/\s/g, '');
    if (cleaned.startsWith('4')) return 'visa';
    if (cleaned.startsWith('5')) return 'mastercard';
    if (cleaned.startsWith('6')) return 'rupay';
    return null;
  };

  if (!booking) {
    return null;
  }

  // Processing view
  if (processing && !paymentSuccess) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center">
          <div className="relative">
            <FaSpinner className="animate-spin text-indigo-600 text-6xl mx-auto mb-4" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Your Payment</h2>
          <p className="text-gray-600 mb-4">Please wait, do not refresh or close this page</p>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <FaShieldAlt className="text-green-500" />
            <span>Secure encrypted transaction</span>
          </div>
        </div>
      </div>
    );
  }

  // Success view
  if (paymentSuccess) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center">
          <div className="inline-block p-4 bg-green-100 rounded-full mb-4 animate-bounce">
            <FaCheckCircle className="text-green-600 text-6xl" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
          <div className="bg-gray-50 rounded-lg p-4 my-4">
            <p className="text-sm text-gray-500 mb-1">Transaction ID</p>
            <p className="text-lg font-bold text-gray-900 font-mono">{transactionId}</p>
          </div>
          <div className="flex items-center justify-center mb-4">
            <span className="text-gray-600 mr-2">Amount Paid:</span>
            <span className="text-2xl font-bold text-green-600">
              <FaRupeeSign className="inline text-xl" />
              {booking.amount}
            </span>
          </div>
          <div className="flex items-center justify-center text-sm text-gray-500">
            <FaClock className="mr-2" />
            <span>Redirecting to your booking...</span>
          </div>
        </div>
      </div>
    );
  }

  // Main payment form
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-t-2xl shadow-lg p-6 border-b-2 border-indigo-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-indigo-600 p-3 rounded-lg mr-4">
                <FaShieldAlt className="text-white text-2xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">ParkMitra Payment Gateway</h1>
                <p className="text-sm text-gray-500 flex items-center">
                  <FaLock className="mr-1 text-green-600" />
                  Secure Payment
                </p>
              </div>
            </div>
            <div className="text-right hidden md:block">
              <p className="text-xs text-gray-500">Merchant</p>
              <p className="font-semibold text-gray-900">{booking.org_name}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Payment Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-b-2xl lg:rounded-2xl shadow-lg p-6">
              {/* Payment Method Tabs */}
              <div className="flex border-b border-gray-200 mb-6">
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`flex-1 py-3 px-4 text-center font-semibold transition-all ${
                    paymentMethod === 'card'
                      ? 'border-b-2 border-indigo-600 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FaCreditCard className="inline mr-2" />
                  Card
                </button>
                <button
                  onClick={() => setPaymentMethod('upi')}
                  className={`flex-1 py-3 px-4 text-center font-semibold transition-all ${
                    paymentMethod === 'upi'
                      ? 'border-b-2 border-indigo-600 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FaMobileAlt className="inline mr-2" />
                  UPI
                </button>
                <button
                  onClick={() => setPaymentMethod('netbanking')}
                  className={`flex-1 py-3 px-4 text-center font-semibold transition-all ${
                    paymentMethod === 'netbanking'
                      ? 'border-b-2 border-indigo-600 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FaUniversity className="inline mr-2" />
                  Net Banking
                </button>
              </div>

              {/* General Error */}
              {errors.general && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700">
                  {errors.general}
                </div>
              )}

              {/* CARD PAYMENT VIEW */}
              {paymentMethod === 'card' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Card Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={cardDetails.cardNumber}
                        onChange={(e) => handleCardChange('cardNumber', e.target.value)}
                        placeholder="1234 5678 9012 3456"
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          errors.cardNumber ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {getCardType() && (
                        <div className="absolute right-3 top-3">
                          <span className="text-xs font-semibold text-gray-500 uppercase">
                            {getCardType()}
                          </span>
                        </div>
                      )}
                    </div>
                    {errors.cardNumber && (
                      <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        value={cardDetails.expiry}
                        onChange={(e) => handleCardChange('expiry', e.target.value)}
                        placeholder="MM/YY"
                        maxLength="5"
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          errors.expiry ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.expiry && (
                        <p className="text-red-500 text-xs mt-1">{errors.expiry}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                      <input
                        type="password"
                        value={cardDetails.cvv}
                        onChange={(e) => handleCardChange('cvv', e.target.value)}
                        placeholder="123"
                        maxLength="3"
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          errors.cvv ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.cvv && <p className="text-red-500 text-xs mt-1">{errors.cvv}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      value={cardDetails.cardName}
                      onChange={(e) => handleCardChange('cardName', e.target.value)}
                      placeholder="Name as on card"
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        errors.cardName ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.cardName && (
                      <p className="text-red-500 text-xs mt-1">{errors.cardName}</p>
                    )}
                  </div>

                  <label className="flex items-center text-sm text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveCard}
                      onChange={(e) => setSaveCard(e.target.checked)}
                      className="mr-2 rounded"
                    />
                    Save card for future payments
                  </label>

                  <div className="flex justify-center space-x-4 pt-4 border-t">
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg"
                      alt="Visa"
                      className="h-8 opacity-50"
                    />
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg"
                      alt="Mastercard"
                      className="h-8 opacity-50"
                    />
                    <span className="text-gray-400 font-semibold">RuPay</span>
                  </div>
                </div>
              )}

              {/* UPI PAYMENT VIEW */}
              {paymentMethod === 'upi' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Enter UPI ID
                    </label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => {
                        setUpiId(e.target.value);
                        if (errors.upiId) setErrors({ ...errors, upiId: '' });
                      }}
                      placeholder="yourname@upi"
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        errors.upiId ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.upiId && <p className="text-red-500 text-xs mt-1">{errors.upiId}</p>}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6 text-center">
                    <div className="bg-white p-4 inline-block rounded-lg border-2 border-gray-200">
                      <div className="w-48 h-48 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center">
                        <p className="text-gray-500 text-sm">QR Code Placeholder</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                      Scan QR with any UPI app to pay
                    </p>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600 mb-3 text-center">Popular UPI Apps</p>
                    <div className="flex justify-center space-x-6">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-blue-500 rounded-lg mb-1"></div>
                        <p className="text-xs text-gray-600">GPay</p>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 bg-purple-500 rounded-lg mb-1"></div>
                        <p className="text-xs text-gray-600">PhonePe</p>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 bg-blue-600 rounded-lg mb-1"></div>
                        <p className="text-xs text-gray-600">Paytm</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* NET BANKING VIEW */}
              {paymentMethod === 'netbanking' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Your Bank
                    </label>
                    <select
                      value={selectedBank}
                      onChange={(e) => {
                        setSelectedBank(e.target.value);
                        if (errors.bank) setErrors({ ...errors, bank: '' });
                      }}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        errors.bank ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">-- Select Bank --</option>
                      <option value="sbi">State Bank of India</option>
                      <option value="hdfc">HDFC Bank</option>
                      <option value="icici">ICICI Bank</option>
                      <option value="axis">Axis Bank</option>
                      <option value="pnb">Punjab National Bank</option>
                      <option value="bob">Bank of Baroda</option>
                      <option value="kotak">Kotak Mahindra Bank</option>
                    </select>
                    {errors.bank && <p className="text-red-500 text-xs mt-1">{errors.bank}</p>}
                  </div>

                  {selectedBank && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-blue-900 font-semibold mb-2">
                        <FaInfoCircle className="inline mr-2" />
                        You will be redirected to your bank's website
                      </p>
                      <p className="text-sm text-blue-700">
                        Please complete the payment on your bank's secure page
                      </p>
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600 mb-3 text-center">Popular Banks</p>
                    <div className="grid grid-cols-4 gap-3">
                      {['SBI', 'HDFC', 'ICICI', 'Axis'].map((bank) => (
                        <div
                          key={bank}
                          className="border border-gray-200 rounded-lg p-3 text-center hover:bg-gray-50 cursor-pointer"
                        >
                          <div className="w-full h-8 bg-gray-200 rounded mb-1"></div>
                          <p className="text-xs text-gray-600">{bank}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Security Notice */}
              <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center">
                <FaLock className="text-green-600 mr-3 text-xl" />
                <p className="text-sm text-green-900">
                  Your payment is secure and encrypted with 256-bit SSL
                </p>
              </div>
            </div>
          </div>

          {/* Booking Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Booking Summary</h3>

              <div className="space-y-3 text-sm">
                <div className="flex items-start">
                  <FaBuilding className="text-indigo-600 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-gray-500">Organization</p>
                    <p className="font-semibold text-gray-900">{booking.org_name}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <span className="text-gray-500">Booking ID</span>
                  <span className="font-semibold text-gray-900">#{booking.id}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Duration</span>
                  <span className="font-semibold text-gray-900">
                    {booking.duration_hours} hour{booking.duration_hours !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Vehicle</span>
                  <span className="font-semibold text-gray-900">{booking.vehicle_number}</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700">Amount to Pay</span>
                  <span className="text-3xl font-bold text-indigo-600">
                    <FaRupeeSign className="inline text-2xl" />
                    {booking.amount}
                  </span>
                </div>
              </div>

              <button
                onClick={simulatePayment}
                disabled={processing}
                className="w-full mt-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {processing ? (
                  <FaSpinner className="animate-spin mr-2" />
                ) : (
                  <FaLock className="mr-2" />
                )}
                Pay ₹{booking.amount}
              </button>

              <p className="text-xs text-gray-500 text-center mt-4">
                Powered by ParkMitra Payment Gateway
              </p>
            </div>
          </div>
        </div>

        {/* Simulation Disclaimer */}
        <div className="mt-6 bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
          <div className="flex items-start">
            <FaInfoCircle className="text-yellow-600 text-xl mr-3 mt-1 flex-shrink-0" />
            <div>
              <p className="font-semibold text-yellow-900 mb-1">Payment Simulation Mode</p>
              <p className="text-sm text-yellow-800">
                This is a simulated payment gateway for demonstration purposes. No actual
                transaction will occur. All payments will automatically succeed after processing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSimulation;
