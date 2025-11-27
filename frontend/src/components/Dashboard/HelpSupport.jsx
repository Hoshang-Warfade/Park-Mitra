import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const HelpSupport = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('faq');
  const [contactForm, setContactForm] = useState({
    subject: '',
    category: 'general',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState({ type: '', text: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);

  // FAQ Data
  const faqs = [
    {
      id: 1,
      category: 'Booking',
      question: 'How do I book a parking spot?',
      answer: 'To book a parking spot, go to the "New Booking" section from your dashboard, select your vehicle type, enter the parking location and duration, then click "Book Now". You will receive a confirmation with a QR code.'
    },
    {
      id: 2,
      category: 'Booking',
      question: 'Can I cancel my booking?',
      answer: 'Yes, you can cancel your booking from the "My Bookings" section. Select the booking you want to cancel and click the "Cancel" button. Please note that cancellation policies may apply depending on how close to the booking time you cancel.'
    },
    {
      id: 3,
      category: 'Booking',
      question: 'What happens if I overstay my parking duration?',
      answer: 'If you overstay your booked parking duration, your booking will be automatically marked as "overstay" and additional charges may apply. You can extend your booking before it expires to avoid overstay fees.'
    },
    {
      id: 4,
      category: 'Payment',
      question: 'What payment methods are accepted?',
      answer: 'We accept multiple payment methods including credit/debit cards, UPI, net banking, and digital wallets. All payments are processed securely through our payment gateway.'
    },
    {
      id: 5,
      category: 'Payment',
      question: 'How do I get a refund?',
      answer: 'Refunds are processed automatically for eligible cancellations. The refund will be credited back to your original payment method within 5-7 business days. You can track your refund status in the "Payments" section.'
    },
    {
      id: 6,
      category: 'Payment',
      question: 'Can I get an invoice for my payment?',
      answer: 'Yes, invoices are automatically generated for all payments. You can download your invoice from the "Payments" section or it will be sent to your registered email address.'
    },
    {
      id: 7,
      category: 'Account',
      question: 'How do I change my password?',
      answer: 'Go to Settings → Password tab. Enter your current password, then enter and confirm your new password. Make sure your new password meets the security requirements (8+ characters, uppercase, lowercase, and number).'
    },
    {
      id: 8,
      category: 'Account',
      question: 'How do I update my profile information?',
      answer: 'You can update your name and mobile number from Settings → Profile tab. Note that email addresses cannot be changed for security reasons.'
    },
    {
      id: 9,
      category: 'QR Code',
      question: 'Where can I find my booking QR code?',
      answer: 'Your QR code is available in the "My Bookings" section. Click on any active booking to view and download the QR code. You can also receive it via email after booking.'
    },
    {
      id: 10,
      category: 'QR Code',
      question: 'What if my QR code is not scanning?',
      answer: 'Ensure your screen brightness is at maximum and the QR code is clearly visible. If the issue persists, you can manually enter your booking ID to the watchman or contact support for assistance.'
    },
    {
      id: 11,
      category: 'General',
      question: 'How do I contact customer support?',
      answer: 'You can contact us through the "Contact Us" tab in the Help & Support section, email us at support@parkmitra.com, call us at +91-1800-123-4567, or use the live chat feature.'
    },
    {
      id: 12,
      category: 'General',
      question: 'Is my data secure?',
      answer: 'Yes, we use industry-standard encryption to protect your data. Your payment information is never stored on our servers and all transactions are processed through secure payment gateways. Read our Privacy Policy for more details.'
    }
  ];

  // Quick Links
  const quickLinks = [
    { icon: '📖', title: 'User Guide', desc: 'Complete guide to using Park Mitra', link: '/guide' },
    { icon: '💳', title: 'Payment Help', desc: 'Payment methods and billing', link: '/payment-help' },
    { icon: '🚗', title: 'Booking Help', desc: 'How to book and manage parking', link: '/booking-help' },
    { icon: '🔒', title: 'Privacy Policy', desc: 'How we protect your data', link: '/privacy' },
    { icon: '📋', title: 'Terms of Service', desc: 'Terms and conditions', link: '/terms' },
    { icon: '🎯', title: 'Video Tutorials', desc: 'Step-by-step video guides', link: '/tutorials' }
  ];

  // Handle Contact Form Submit
  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSubmitMessage({ type: '', text: '' });

    try {
      // TODO: Implement contact support API
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSubmitMessage({ 
        type: 'success', 
        text: 'Your message has been sent successfully! Our team will get back to you within 24 hours.' 
      });
      setContactForm({ subject: '', category: 'general', message: '' });
    } catch (error) {
      setSubmitMessage({ 
        type: 'error', 
        text: 'Failed to send message. Please try again or email us directly.' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter FAQs based on search
  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group FAQs by category
  const faqsByCategory = filteredFaqs.reduce((acc, faq) => {
    if (!acc[faq.category]) {
      acc[faq.category] = [];
    }
    acc[faq.category].push(faq);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-8 mb-6 text-white">
          <h1 className="text-4xl font-bold mb-2">Help & Support</h1>
          <p className="text-blue-100 text-lg">We're here to help you with any questions or issues</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-3xl mb-2">⚡</div>
            <div className="text-2xl font-bold text-gray-900">24/7</div>
            <div className="text-gray-600">Support Available</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-3xl mb-2">💬</div>
            <div className="text-2xl font-bold text-gray-900">&lt; 2 hrs</div>
            <div className="text-gray-600">Average Response Time</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-3xl mb-2">⭐</div>
            <div className="text-2xl font-bold text-gray-900">98%</div>
            <div className="text-gray-600">Customer Satisfaction</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { id: 'faq', label: 'FAQs', icon: '❓' },
                { id: 'contact', label: 'Contact Us', icon: '📧' },
                { id: 'resources', label: 'Resources', icon: '📚' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveSection(tab.id);
                    setSubmitMessage({ type: '', text: '' });
                  }}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeSection === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* FAQ Section */}
            {activeSection === 'faq' && (
              <div className="space-y-6">
                {/* Search Bar */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search for answers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="absolute left-4 top-3.5 text-xl">🔍</span>
                </div>

                {/* FAQ Categories */}
                {Object.keys(faqsByCategory).length > 0 ? (
                  Object.entries(faqsByCategory).map(([category, categoryFaqs]) => (
                    <div key={category}>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm mr-3">
                          {category}
                        </span>
                        <span className="text-gray-400 text-sm">({categoryFaqs.length} questions)</span>
                      </h3>
                      <div className="space-y-3">
                        {categoryFaqs.map((faq) => (
                          <div
                            key={faq.id}
                            className="border border-gray-200 rounded-lg overflow-hidden"
                          >
                            <button
                              onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                              className="w-full px-6 py-4 text-left bg-white hover:bg-gray-50 transition flex items-center justify-between"
                            >
                              <span className="font-medium text-gray-900">{faq.question}</span>
                              <span className="text-2xl text-gray-400">
                                {expandedFaq === faq.id ? '−' : '+'}
                              </span>
                            </button>
                            {expandedFaq === faq.id && (
                              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                                <p className="text-gray-700">{faq.answer}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🔍</div>
                    <p className="text-gray-600">No FAQs found matching your search.</p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="mt-4 text-blue-600 hover:underline"
                    >
                      Clear search
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Contact Section */}
            {activeSection === 'contact' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Send us a message</h3>
                  
                  {submitMessage.text && (
                    <div className={`mb-4 p-4 rounded-lg ${
                      submitMessage.type === 'success' 
                        ? 'bg-green-50 text-green-800 border border-green-200' 
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                      {submitMessage.text}
                    </div>
                  )}

                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subject
                      </label>
                      <input
                        type="text"
                        value={contactForm.subject}
                        onChange={(e) => setContactForm({...contactForm, subject: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Brief description of your issue"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category
                      </label>
                      <select
                        value={contactForm.category}
                        onChange={(e) => setContactForm({...contactForm, category: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="general">General Inquiry</option>
                        <option value="booking">Booking Issues</option>
                        <option value="payment">Payment Issues</option>
                        <option value="technical">Technical Support</option>
                        <option value="feedback">Feedback</option>
                        <option value="complaint">Complaint</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Message
                      </label>
                      <textarea
                        value={contactForm.message}
                        onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                        rows="6"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Please provide as much detail as possible..."
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                    >
                      {loading ? 'Sending...' : 'Send Message'}
                    </button>
                  </form>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <div className="text-3xl mb-3">📧</div>
                    <h4 className="font-semibold text-gray-900 mb-2">Email Support</h4>
                    <p className="text-sm text-gray-600 mb-2">Get response within 24 hours</p>
                    <a href="mailto:support@parkmitra.com" className="text-blue-600 hover:underline">
                      support@parkmitra.com
                    </a>
                  </div>

                  <div className="bg-green-50 p-6 rounded-lg">
                    <div className="text-3xl mb-3">📞</div>
                    <h4 className="font-semibold text-gray-900 mb-2">Phone Support</h4>
                    <p className="text-sm text-gray-600 mb-2">Available 24/7</p>
                    <a href="tel:+911800123456" className="text-green-600 hover:underline">
                      +91-1800-123-4567
                    </a>
                  </div>

                  <div className="bg-purple-50 p-6 rounded-lg">
                    <div className="text-3xl mb-3">💬</div>
                    <h4 className="font-semibold text-gray-900 mb-2">Live Chat</h4>
                    <p className="text-sm text-gray-600 mb-2">Chat with our team</p>
                    <button className="text-purple-600 hover:underline">
                      Start Chat →
                    </button>
                  </div>

                  <div className="bg-orange-50 p-6 rounded-lg">
                    <div className="text-3xl mb-3">🐦</div>
                    <h4 className="font-semibold text-gray-900 mb-2">Social Media</h4>
                    <p className="text-sm text-gray-600 mb-2">Connect with us</p>
                    <a href="#" className="text-orange-600 hover:underline">
                      @ParkMitra →
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Resources Section */}
            {activeSection === 'resources' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Helpful Resources</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quickLinks.map((link, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 p-6 rounded-lg hover:bg-gray-100 transition cursor-pointer border border-gray-200"
                    >
                      <div className="text-4xl mb-3">{link.icon}</div>
                      <h4 className="font-semibold text-gray-900 mb-2">{link.title}</h4>
                      <p className="text-sm text-gray-600 mb-3">{link.desc}</p>
                      <span className="text-blue-600 text-sm font-medium hover:underline">
                        Learn more →
                      </span>
                    </div>
                  ))}
                </div>

                {/* System Status */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1 flex items-center">
                        <span className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                        System Status: All Systems Operational
                      </h4>
                      <p className="text-sm text-gray-600">Last updated: {new Date().toLocaleString()}</p>
                    </div>
                    <button className="text-blue-600 text-sm hover:underline">
                      View Status Page →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpSupport;
