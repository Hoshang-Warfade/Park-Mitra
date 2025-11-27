// ParkMitra Landing Page - Attractive and Comprehensive
import React, { useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { 
  FaQrcode, 
  FaUserShield, 
  FaMobileAlt, 
  FaHandsHelping, 
  FaLock, 
  FaParking,
  FaUserFriends,
  FaMoneyBillWave,
  FaChartLine,
  FaTachometerAlt,
  FaUsers,
  FaWallet,
  FaCheckCircle,
  FaArrowRight,
  FaBuilding,
  FaGraduationCap,
  FaShoppingCart,
  FaFilm,
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaLinkedin
} from 'react-icons/fa';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  return (
    <div className="landing-page min-h-screen">
      {/* Hero Section with Parking Theme Background */}
      <section className="relative text-white py-32 overflow-hidden min-h-screen flex items-center">
        {/* Multi-layer Background */}
        <div className="absolute inset-0">
          {/* Background Image */}
          <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{
            backgroundImage: 'url(/parking-bg.jpg)'
          }}></div>
          
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-black/60"></div>
          
          {/* Base dark gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 via-slate-900/60 to-gray-800/80"></div>
          
          {/* Parking lines pattern overlay */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `
              repeating-linear-gradient(90deg, transparent 0px, transparent 100px, rgba(255,255,255,0.15) 100px, rgba(255,255,255,0.15) 105px),
              repeating-linear-gradient(0deg, transparent 0px, transparent 150px, rgba(255,255,255,0.15) 150px, rgba(255,255,255,0.15) 155px)
            `,
            backgroundSize: '100% 100%'
          }}></div>
          
          {/* Colored light effects - mimicking parking lot lights */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/3 w-80 h-80 bg-purple-600/25 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 right-1/4 w-72 h-72 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          
          {/* Yellow lane markers effect */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-yellow-500/10 to-transparent"></div>
          
          {/* Vignette effect for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/30 via-transparent to-purple-900/30"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center animate-fade-in">
            {/* Tagline with text shadow */}
            <h2 className="text-4xl md:text-6xl font-bold mb-8 leading-tight drop-shadow-lg">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 via-white to-green-500">
                ParkMitra - आपका भरोसेमंद पार्किंग साथी
              </span>
            </h2>

            {/* Subtitle with enhanced readability */}
            <p className="text-2xl md:text-3xl mb-4 font-semibold max-w-4xl mx-auto drop-shadow-md">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 via-white to-green-500">
                School, college, company, mall, theatre - सब जगह के लिए
              </span>
            </p>
            <p className="text-xl md:text-2xl mb-4 text-gray-100 max-w-3xl mx-auto leading-relaxed drop-shadow-md">
              <span className="text-orange-400">QR entry</span> | <span className="text-white">Live updates</span> | <span className="text-green-400">Easy payments</span>
            </p>
            <p className="text-xl md:text-2xl mb-14 max-w-3xl mx-auto leading-relaxed drop-shadow-md italic">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 via-white to-green-500">
                जैसे एक अच्छा दोस्त - हमेशा वहाँ, जब ज़रूरत हो
              </span>
            </p>

            {/* CTA Buttons - Hidden when user is logged in */}
            {!user && (
              <>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <button
                    onClick={() => navigate('/register')}
                    className="group bg-white text-indigo-600 px-10 py-4 rounded-xl text-lg font-semibold hover:bg-indigo-50 transition-all shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 flex items-center gap-3"
                  >
                    Get Started
                    <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className="bg-transparent border-2 border-white text-white px-10 py-4 rounded-xl text-lg font-semibold hover:bg-white hover:text-indigo-600 transition-all shadow-lg hover:shadow-2xl transform hover:-translate-y-1"
                  >
                    Login
                  </button>
                </div>
              </>
            )}

            {/* Organization Icons */}
            <div className="mt-16 flex flex-wrap justify-center items-center gap-8 text-indigo-200">
              <div className="flex items-center gap-2">
                <FaBuilding className="text-2xl" />
                <span className="text-sm">Companies</span>
              </div>
              <div className="flex items-center gap-2">
                <FaGraduationCap className="text-2xl" />
                <span className="text-sm">Schools & Colleges</span>
              </div>
              <div className="flex items-center gap-2">
                <FaShoppingCart className="text-2xl" />
                <span className="text-sm">Malls</span>
              </div>
              <div className="flex items-center gap-2">
                <FaFilm className="text-2xl" />
                <span className="text-sm">Theaters</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why Choose ParkMitra?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience hassle-free parking with our cutting-edge features designed for modern needs
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group bg-white p-8 rounded-2xl shadow-md hover:shadow-2xl transition-all transform hover:-translate-y-2 border border-gray-100">
              <div className="bg-gradient-to-br from-indigo-100 to-indigo-200 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FaUserShield className="text-indigo-600 text-3xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Free Parking for Members
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Organization members enjoy complimentary parking with advance booking. No hidden charges!
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group bg-white p-8 rounded-2xl shadow-md hover:shadow-2xl transition-all transform hover:-translate-y-2 border border-gray-100">
              <div className="bg-gradient-to-br from-green-100 to-green-200 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FaMobileAlt className="text-green-600 text-3xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Easy Online Booking
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Book your slot in advance from anywhere. Check real-time availability on your mobile device.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group bg-white p-8 rounded-2xl shadow-md hover:shadow-2xl transition-all transform hover:-translate-y-2 border border-gray-100">
              <div className="bg-gradient-to-br from-purple-100 to-purple-200 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FaQrcode className="text-purple-600 text-3xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                QR Code Entry
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Hassle-free entry and exit with QR scanning. Quick, contactless, and secure verification.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group bg-white p-8 rounded-2xl shadow-md hover:shadow-2xl transition-all transform hover:-translate-y-2 border border-gray-100">
              <div className="bg-gradient-to-br from-orange-100 to-orange-200 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FaHandsHelping className="text-orange-600 text-3xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Walk-in Assistance
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Immediate help from our parking attendants for walk-in bookings and emergency situations.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group bg-white p-8 rounded-2xl shadow-md hover:shadow-2xl transition-all transform hover:-translate-y-2 border border-gray-100">
              <div className="bg-gradient-to-br from-pink-100 to-pink-200 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FaLock className="text-pink-600 text-3xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Secure Payments
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Multiple payment options for visitors. Online, UPI, cards, or cash - pay your way safely.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group bg-white p-8 rounded-2xl shadow-md hover:shadow-2xl transition-all transform hover:-translate-y-2 border border-gray-100">
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FaParking className="text-blue-600 text-3xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Real-time Availability
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Check parking availability in real-time. Never waste time searching for a spot again.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Simple & Fast
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get started with ParkMitra in just three easy steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {/* Step 1 */}
            <div className="text-center group">
              <div className="relative mb-6">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white w-24 h-24 rounded-2xl flex items-center justify-center mx-auto shadow-xl group-hover:shadow-2xl transition-all transform group-hover:scale-110 group-hover:rotate-6">
                  <FaUserFriends className="text-4xl" />
                </div>
                <div className="absolute -top-2 -right-2 bg-indigo-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                  1
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Register
              </h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Create your account in minutes. Join as an organization member or visitor.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center group">
              <div className="relative mb-6">
                <div className="bg-gradient-to-br from-purple-500 to-pink-600 text-white w-24 h-24 rounded-2xl flex items-center justify-center mx-auto shadow-xl group-hover:shadow-2xl transition-all transform group-hover:scale-110 group-hover:rotate-6">
                  <FaMobileAlt className="text-4xl" />
                </div>
                <div className="absolute -top-2 -right-2 bg-purple-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                  2
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Book
              </h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Select your organization and time slot. Book instantly with real-time confirmation.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center group">
              <div className="relative mb-6">
                <div className="bg-gradient-to-br from-pink-500 to-red-600 text-white w-24 h-24 rounded-2xl flex items-center justify-center mx-auto shadow-xl group-hover:shadow-2xl transition-all transform group-hover:scale-110 group-hover:rotate-6">
                  <FaQrcode className="text-4xl" />
                </div>
                <div className="absolute -top-2 -right-2 bg-pink-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                  3
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Park
              </h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Show your QR code at the gate and park worry-free. Exit whenever you're ready!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* User Types Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Built for Everyone
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Whether you're a member, visitor, or need immediate parking, we've got you covered
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Organization Members */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden transform hover:-translate-y-2 transition-all">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-8 text-white">
                <FaUserShield className="text-5xl mb-4" />
                <h3 className="text-2xl font-bold mb-2">Organization Members</h3>
                <p className="text-indigo-100 text-lg">For employees, staff & students</p>
              </div>
              <div className="p-8">
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Free parking with advance booking</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Priority access to slots</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">QR-based quick entry</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Booking history & analytics</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Visitors */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden transform hover:-translate-y-2 transition-all">
              <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-8 text-white">
                <FaMoneyBillWave className="text-5xl mb-4" />
                <h3 className="text-2xl font-bold mb-2">Visitors</h3>
                <p className="text-purple-100 text-lg">For customers, guests & patients</p>
              </div>
              <div className="p-8">
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Pay-per-hour parking</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Multiple payment options</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Transparent pricing</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Digital receipts</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Walk-ins */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden transform hover:-translate-y-2 transition-all">
              <div className="bg-gradient-to-br from-orange-500 to-red-600 p-8 text-white">
                <FaHandsHelping className="text-5xl mb-4" />
                <h3 className="text-2xl font-bold mb-2">Walk-ins</h3>
                <p className="text-orange-100 text-lg">For immediate parking needs</p>
              </div>
              <div className="p-8">
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Immediate assistance available</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Watchman-assisted booking</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Cash payment accepted</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">No pre-booking required</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Organizations Section */}
      <section className="py-20 bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{ 
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Manage Your Parking
              </h2>
              <p className="text-xl text-indigo-100 mb-8 leading-relaxed">
                Register your organization and streamline parking management with our comprehensive admin dashboard
              </p>

              <div className="space-y-4 mb-10">
                <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="bg-white/20 p-3 rounded-lg">
                    <FaTachometerAlt className="text-2xl" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">Real-time Monitoring</h4>
                    <p className="text-indigo-100">Track parking occupancy live</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="bg-white/20 p-3 rounded-lg">
                    <FaUsers className="text-2xl" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">Member Management</h4>
                    <p className="text-indigo-100">Add and manage organization members</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="bg-white/20 p-3 rounded-lg">
                    <FaWallet className="text-2xl" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">Revenue Tracking</h4>
                    <p className="text-indigo-100">Monitor earnings from visitor parking</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="bg-white/20 p-3 rounded-lg">
                    <FaChartLine className="text-2xl" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">Analytics Dashboard</h4>
                    <p className="text-indigo-100">Detailed reports and insights</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate('/register-organization')}
                className="group bg-white text-indigo-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-indigo-50 transition-all shadow-2xl transform hover:-translate-y-1 flex items-center gap-3"
              >
                Register Organization
                <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="hidden lg:block">
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 shadow-2xl">
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl p-6 text-center transform hover:scale-105 transition-transform">
                    <div className="text-4xl font-bold mb-2">1000+</div>
                    <div className="text-indigo-100">Parking Slots Managed</div>
                  </div>
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-center transform hover:scale-105 transition-transform">
                    <div className="text-4xl font-bold mb-2">50+</div>
                    <div className="text-purple-100">Organizations Registered</div>
                  </div>
                  <div className="bg-gradient-to-r from-pink-500 to-red-500 rounded-xl p-6 text-center transform hover:scale-105 transition-transform">
                    <div className="text-4xl font-bold mb-2">5000+</div>
                    <div className="text-pink-100">Happy Users</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Ready to Transform Your Parking Experience?
          </h2>
          <p className="text-xl text-gray-600 mb-10 leading-relaxed">
            Join thousands of users and organizations who trust ParkMitra for their parking needs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/register')}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-10 py-4 rounded-xl text-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
            >
              Get Started Free
            </button>
            <button
              onClick={() => navigate('/register-organization')}
              className="bg-white border-2 border-indigo-600 text-indigo-600 px-10 py-4 rounded-xl text-lg font-semibold hover:bg-indigo-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Register Organization
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <h3 className="text-2xl font-bold text-white mb-4">🅿️ ParkMitra</h3>
              <p className="text-gray-400 leading-relaxed">
                Smart parking management for everyone. Making parking hassle-free since 2025.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/about" className="hover:text-white transition-colors">About Us</Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
                </li>
                <li>
                  <Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link>
                </li>
                <li>
                  <Link to="/faq" className="hover:text-white transition-colors">FAQ</Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
                </li>
                <li>
                  <Link to="/refund" className="hover:text-white transition-colors">Refund Policy</Link>
                </li>
                <li>
                  <Link to="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link>
                </li>
              </ul>
            </div>

            {/* Social */}
            <div>
              <h4 className="text-white font-semibold mb-4">Connect With Us</h4>
              <div className="flex gap-4">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="bg-gray-800 p-3 rounded-lg hover:bg-indigo-600 transition-colors" aria-label="Facebook">
                  <FaFacebook className="text-xl" />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="bg-gray-800 p-3 rounded-lg hover:bg-blue-400 transition-colors" aria-label="Twitter">
                  <FaTwitter className="text-xl" />
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="bg-gray-800 p-3 rounded-lg hover:bg-pink-600 transition-colors" aria-label="Instagram">
                  <FaInstagram className="text-xl" />
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="bg-gray-800 p-3 rounded-lg hover:bg-blue-600 transition-colors" aria-label="LinkedIn">
                  <FaLinkedin className="text-xl" />
                </a>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-400">Email: support@parkmitra.com</p>
                <p className="text-sm text-gray-400">Phone: +91 98765 43210</p>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-400">
              © 2025 ParkMitra. All rights reserved. Made with ❤️ in India
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
