// 404 Not Found Page - ParkMitra
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FaParking, 
  FaHome, 
  FaTachometerAlt, 
  FaCalendarAlt,
  FaListAlt,
  FaHeadset,
  FaMapMarkerAlt,
  FaExclamationCircle
} from 'react-icons/fa';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          {/* Sad Parking Icon with Animation */}
          <div className="relative inline-block mb-8">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-400 opacity-20 blur-3xl rounded-full animate-pulse-slow"></div>
            <div className="relative bg-gradient-to-br from-indigo-100 to-purple-100 w-40 h-40 rounded-full flex items-center justify-center shadow-2xl animate-bounce-slow">
              <FaParking className="text-indigo-600 text-8xl" />
              <div className="absolute -bottom-2 -right-2 bg-red-500 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-lg">
                <FaExclamationCircle className="text-3xl" />
              </div>
            </div>
          </div>

          {/* 404 Text with Gradient */}
          <h1 className="text-9xl md:text-[12rem] font-black mb-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-none">
            404
          </h1>

          {/* Heading */}
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Page Not Found
          </h2>

          {/* Message */}
          <p className="text-xl md:text-2xl text-gray-600 mb-4 max-w-2xl mx-auto leading-relaxed">
            Oops! Looks like this parking spot doesn't exist.
          </p>
          <p className="text-lg text-gray-500 mb-12">
            The page you're looking for doesn't exist or has been moved to a different location.
          </p>

          {/* Main Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              to="/dashboard"
              className="group inline-flex items-center justify-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
            >
              <FaTachometerAlt className="mr-3 text-xl group-hover:rotate-12 transition-transform" />
              Go to Dashboard
            </Link>

            <Link
              to="/"
              className="inline-flex items-center justify-center bg-white text-indigo-600 border-2 border-indigo-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-indigo-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <FaHome className="mr-3 text-xl" />
              Go to Home
            </Link>
          </div>
        </div>

        {/* Helpful Links Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              Looking for something?
            </h3>
            <p className="text-gray-600">
              Here are some helpful links to get you back on track
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Link 1: Book Parking */}
            <Link
              to="/book-parking"
              className="group flex flex-col items-center p-6 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 transition-all transform hover:-translate-y-1 hover:shadow-lg border border-indigo-100"
            >
              <div className="bg-gradient-to-br from-indigo-500 to-purple-500 w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                <FaCalendarAlt className="text-white text-2xl" />
              </div>
              <h4 className="font-semibold text-gray-800 mb-1">Book Parking</h4>
              <p className="text-sm text-gray-600 text-center">Reserve your spot</p>
            </Link>

            {/* Link 2: My Bookings */}
            <Link
              to="/my-bookings"
              className="group flex flex-col items-center p-6 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 transition-all transform hover:-translate-y-1 hover:shadow-lg border border-green-100"
            >
              <div className="bg-gradient-to-br from-green-500 to-emerald-500 w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                <FaListAlt className="text-white text-2xl" />
              </div>
              <h4 className="font-semibold text-gray-800 mb-1">My Bookings</h4>
              <p className="text-sm text-gray-600 text-center">View your history</p>
            </Link>

            {/* Link 3: Street Parking */}
            <Link
              to="/informal-parking"
              className="group flex flex-col items-center p-6 rounded-xl bg-gradient-to-br from-orange-50 to-yellow-50 hover:from-orange-100 hover:to-yellow-100 transition-all transform hover:-translate-y-1 hover:shadow-lg border border-orange-100"
            >
              <div className="bg-gradient-to-br from-orange-500 to-yellow-500 w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                <FaMapMarkerAlt className="text-white text-2xl" />
              </div>
              <h4 className="font-semibold text-gray-800 mb-1">Street Parking</h4>
              <p className="text-sm text-gray-600 text-center">Find nearby spots</p>
            </Link>

            {/* Link 4: Contact Support */}
            <Link
              to="/contact"
              className="group flex flex-col items-center p-6 rounded-xl bg-gradient-to-br from-pink-50 to-rose-50 hover:from-pink-100 hover:to-rose-100 transition-all transform hover:-translate-y-1 hover:shadow-lg border border-pink-100"
            >
              <div className="bg-gradient-to-br from-pink-500 to-rose-500 w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                <FaHeadset className="text-white text-2xl" />
              </div>
              <h4 className="font-semibold text-gray-800 mb-1">Contact Support</h4>
              <p className="text-sm text-gray-600 text-center">We're here to help</p>
            </Link>
          </div>
        </div>

        {/* Support Contact */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-2">
            Still can't find what you're looking for?
          </p>
          <p className="text-sm text-gray-500">
            Contact our support team at{' '}
            <a 
              href="mailto:support@parkmitra.com" 
              className="text-indigo-600 hover:text-indigo-800 font-semibold hover:underline"
            >
              support@parkmitra.com
            </a>
            {' '}or call{' '}
            <a 
              href="tel:+919876543210" 
              className="text-indigo-600 hover:text-indigo-800 font-semibold hover:underline"
            >
              +91 98765 43210
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
