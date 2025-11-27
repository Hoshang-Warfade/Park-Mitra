import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { FaDownload, FaFilter, FaReceipt, FaMoneyBillWave, FaUndo, FaExclamationTriangle } from 'react-icons/fa';

const PaymentHistory = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, debit, refund, penalty
  const [filterStatus, setFilterStatus] = useState('all'); // all, success, pending, failed
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showFilters, setShowFilters] = useState(false);

  // Summary stats
  const [stats, setStats] = useState({
    totalSpent: 0,
    totalRefunds: 0,
    totalPenalties: 0,
    transactionCount: 0
  });

  // Fetch payment history
  useEffect(() => {
    fetchPaymentHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch payments from API (remove /api prefix as api.js already adds it)
      // Note: api.js interceptor already unwraps response.data, so response IS the data
      const response = await api.get('/payments/history');
      
      console.log('Payment History Response:', response);
      console.log('User:', user);
      
      // Check if response has data (no .data needed because interceptor unwraps it)
      if (response && response.success !== false) {
        const paymentData = response.payments || response.data?.payments || [];
        console.log('Payment data received:', paymentData);
        console.log('Payment data length:', paymentData.length);
        setPayments(paymentData);
        calculateStats(paymentData);
      } else {
        console.log('Invalid response format or no payments');
        setPayments([]);
        calculateStats([]);
      }
    } catch (err) {
      console.error('Error fetching payment history:', err);
      console.error('Error details:', err.response?.data || err.message);
      
      // Check if it's an authentication error
      if (err.response?.status === 401) {
        setError('Session expired. Please login again.');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to view payment history.');
      } else {
        setError('Failed to load payment history. Please try again.');
      }
      
      // Use empty array instead of mock data
      setPayments([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary statistics
  const calculateStats = (paymentData) => {
    const successPayments = paymentData.filter(p => p.status === 'success');
    
    const totalSpent = successPayments
      .filter(p => p.type === 'debit')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const totalRefunds = successPayments
      .filter(p => p.type === 'refund')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const totalPenalties = successPayments
      .filter(p => p.type === 'penalty')
      .reduce((sum, p) => sum + p.amount, 0);

    setStats({
      totalSpent,
      totalRefunds,
      totalPenalties,
      transactionCount: paymentData.length
    });
  };

  // Filter payments
  const getFilteredPayments = () => {
    let filtered = [...payments];

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(p => p.type === filterType);
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(p => p.status === filterStatus);
    }

    // Filter by date range
    if (dateRange.start) {
      filtered = filtered.filter(p => new Date(p.created_at) >= new Date(dateRange.start));
    }
    if (dateRange.end) {
      filtered = filtered.filter(p => new Date(p.created_at) <= new Date(dateRange.end));
    }

    return filtered;
  };

  // Get transaction icon and color
  const getTransactionStyle = (type, status) => {
    if (status === 'failed') {
      return { icon: FaExclamationTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
    }
    if (status === 'pending') {
      return { icon: FaReceipt, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' };
    }

    switch (type) {
      case 'debit':
        return { icon: FaMoneyBillWave, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
      case 'refund':
        return { icon: FaUndo, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
      case 'penalty':
        return { icon: FaExclamationTriangle, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' };
      default:
        return { icon: FaReceipt, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' };
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Download invoice
  const handleDownloadInvoice = (payment) => {
    // TODO: Implement actual invoice download
    alert(`Downloading invoice for ${payment.transaction_id}`);
  };

  // Export payment history
  const handleExportHistory = () => {
    const filtered = getFilteredPayments();
    const csv = [
      ['Transaction ID', 'Date', 'Type', 'Amount', 'Status', 'Payment Method', 'Description'].join(','),
      ...filtered.map(p => [
        p.transaction_id,
        formatDate(p.created_at),
        p.type.toUpperCase(),
        `₹${p.amount.toFixed(2)}`,
        p.status.toUpperCase(),
        p.payment_method,
        p.description
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredPayments = getFilteredPayments();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <FaExclamationTriangle className="text-red-600 mr-3" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Payment History</h1>
              <p className="text-gray-600 mt-2">View all your transactions, refunds, and penalties</p>
            </div>
            <button
              onClick={handleExportHistory}
              className="mt-4 md:mt-0 flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <FaDownload className="mr-2" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Spent</p>
                <p className="text-3xl font-bold mt-2">₹{stats.totalSpent.toFixed(2)}</p>
              </div>
              <FaMoneyBillWave className="text-4xl text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Total Refunds</p>
                <p className="text-3xl font-bold mt-2">₹{stats.totalRefunds.toFixed(2)}</p>
              </div>
              <FaUndo className="text-4xl text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Total Penalties</p>
                <p className="text-3xl font-bold mt-2">₹{stats.totalPenalties.toFixed(2)}</p>
              </div>
              <FaExclamationTriangle className="text-4xl text-orange-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Transactions</p>
                <p className="text-3xl font-bold mt-2">{stats.transactionCount}</p>
              </div>
              <FaReceipt className="text-4xl text-purple-200" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Filter Transactions</h3>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            >
              <FaFilter className="mr-2" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
              {(filterType !== 'all' || filterStatus !== 'all' || dateRange.start || dateRange.end) && (
                <span className="ml-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">Active</span>
              )}
            </button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="debit">Debit (Payment)</option>
                  <option value="refund">Refund</option>
                  <option value="penalty">Penalty</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="success">Success</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              {/* Date From */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Date To */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Clear Filters */}
              {(filterType !== 'all' || filterStatus !== 'all' || dateRange.start || dateRange.end) && (
                <div className="md:col-span-4">
                  <button
                    onClick={() => {
                      setFilterType('all');
                      setFilterStatus('all');
                      setDateRange({ start: '', end: '' });
                    }}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Payment List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <FaReceipt className="mx-auto text-6xl text-gray-300 mb-4" />
              <p className="text-gray-600 text-lg">No transactions found</p>
              <p className="text-gray-500 text-sm mt-2">Try adjusting your filters or search query</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredPayments.map((payment) => {
                const style = getTransactionStyle(payment.type, payment.status);
                const Icon = style.icon;

                return (
                  <div key={payment.id} className="p-6 hover:bg-gray-50 transition border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      {/* Left Section - Icon + Details */}
                      <div className="flex items-center space-x-4 flex-1">
                        {/* Icon */}
                        <div className={`${style.bg} ${style.color} p-3 rounded-lg border ${style.border} flex-shrink-0`}>
                          <Icon className="text-2xl" />
                        </div>

                        {/* Date & Time */}
                        <div className="min-w-[180px]">
                          <p className="text-sm font-semibold text-gray-900">{formatDate(payment.created_at)}</p>
                          <p className="text-xs text-gray-500">Transaction ID: {payment.transaction_id}</p>
                        </div>

                        {/* Payment Mode */}
                        <div className="min-w-[120px]">
                          <p className="text-xs text-gray-500 uppercase">Mode</p>
                          <p className="text-sm font-medium text-gray-900">{payment.payment_method}</p>
                        </div>

                        {/* Type Badge */}
                        <div className="min-w-[100px]">
                          <p className="text-xs text-gray-500 uppercase mb-1">Type</p>
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            payment.type === 'debit' ? 'bg-blue-100 text-blue-800' :
                            payment.type === 'refund' ? 'bg-green-100 text-green-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                            {payment.type.toUpperCase()}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <div className="min-w-[100px]">
                          <p className="text-xs text-gray-500 uppercase mb-1">Status</p>
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            payment.status === 'success' ? 'bg-green-100 text-green-800' :
                            payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {payment.status.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Right Section - Amount */}
                      <div className="text-right ml-6">
                        <p className="text-xs text-gray-500 uppercase mb-1">Amount</p>
                        <div className={`text-2xl font-bold ${
                          payment.type === 'refund' ? 'text-green-600' :
                          payment.type === 'penalty' ? 'text-orange-600' :
                          payment.status === 'failed' ? 'text-red-600' :
                          'text-gray-900'
                        }`}>
                          {payment.type === 'refund' ? '+' : '-'}₹{payment.amount.toFixed(2)}
                        </div>
                        
                        {/* Invoice Button */}
                        {payment.status === 'success' && (
                          <button
                            onClick={() => handleDownloadInvoice(payment)}
                            className="flex items-center justify-end text-xs text-blue-600 hover:text-blue-700 font-medium mt-2"
                          >
                            <FaDownload className="mr-1" />
                            Invoice
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Info Banner */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="text-2xl mr-3">ℹ️</div>
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Payment Information</p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Debits:</strong> Parking booking charges deducted from your account</li>
                <li><strong>Refunds:</strong> Money returned for cancelled bookings (processing time: 5-7 business days)</li>
                <li><strong>Penalties:</strong> Additional charges for overstay or late exit</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentHistory;
