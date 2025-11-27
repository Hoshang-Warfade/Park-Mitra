// Footer Component - ParkMitra
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FaParking,
  FaFacebook, 
  FaTwitter, 
  FaInstagram, 
  FaLinkedin,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaHeart
} from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          
          {/* Column 1: About ParkMitra */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-500 w-10 h-10 rounded-lg flex items-center justify-center">
                <FaParking className="text-white text-2xl" />
              </div>
              <h3 className="text-2xl font-bold text-white">ParkMitra</h3>
            </div>
            
            <p className="text-gray-400 leading-relaxed">
              Smart parking management for everyone. Making parking hassle-free for schools, colleges, companies, malls, and theaters.
            </p>

            {/* Contact Info */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <FaEnvelope className="flex-shrink-0" />
                <a href="mailto:support@parkmitra.com" className="hover:text-white transition-colors">
                  support@parkmitra.com
                </a>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <FaPhone className="flex-shrink-0" />
                <a href="tel:+919876543210" className="hover:text-white transition-colors">
                  +91 98765 43210
                </a>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <FaMapMarkerAlt className="flex-shrink-0" />
                <span>Bangalore, India</span>
              </div>
            </div>

            {/* Social Media Icons */}
            <div className="flex gap-3 pt-2">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="bg-gray-800 p-2.5 rounded-lg hover:bg-indigo-600 transition-colors"
                aria-label="Facebook"
              >
                <FaFacebook className="text-lg" />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="bg-gray-800 p-2.5 rounded-lg hover:bg-blue-400 transition-colors"
                aria-label="Twitter"
              >
                <FaTwitter className="text-lg" />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="bg-gray-800 p-2.5 rounded-lg hover:bg-pink-600 transition-colors"
                aria-label="Instagram"
              >
                <FaInstagram className="text-lg" />
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="bg-gray-800 p-2.5 rounded-lg hover:bg-blue-600 transition-colors"
                aria-label="LinkedIn"
              >
                <FaLinkedin className="text-lg" />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="text-white font-bold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/" 
                  className="text-gray-400 hover:text-white hover:translate-x-1 inline-block transition-all"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link 
                  to="/book-parking" 
                  className="text-gray-400 hover:text-white hover:translate-x-1 inline-block transition-all"
                >
                  Book Parking
                </Link>
              </li>
              <li>
                <Link 
                  to="/my-bookings" 
                  className="text-gray-400 hover:text-white hover:translate-x-1 inline-block transition-all"
                >
                  My Bookings
                </Link>
              </li>
              <li>
                <Link 
                  to="/informal-parking" 
                  className="text-gray-400 hover:text-white hover:translate-x-1 inline-block transition-all"
                >
                  Street Parking
                </Link>
              </li>
              <li>
                <Link 
                  to="/about" 
                  className="text-gray-400 hover:text-white hover:translate-x-1 inline-block transition-all"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link 
                  to="/contact" 
                  className="text-gray-400 hover:text-white hover:translate-x-1 inline-block transition-all"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: For Organizations */}
          <div>
            <h4 className="text-white font-bold text-lg mb-4">For Organizations</h4>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/register-organization" 
                  className="text-gray-400 hover:text-white hover:translate-x-1 inline-block transition-all"
                >
                  Register Organization
                </Link>
              </li>
              <li>
                <Link 
                  to="/login" 
                  className="text-gray-400 hover:text-white hover:translate-x-1 inline-block transition-all"
                >
                  Admin Login
                </Link>
              </li>
              <li>
                <Link 
                  to="/features" 
                  className="text-gray-400 hover:text-white hover:translate-x-1 inline-block transition-all"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link 
                  to="/pricing" 
                  className="text-gray-400 hover:text-white hover:translate-x-1 inline-block transition-all"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link 
                  to="/demo" 
                  className="text-gray-400 hover:text-white hover:translate-x-1 inline-block transition-all"
                >
                  Request Demo
                </Link>
              </li>
              <li>
                <Link 
                  to="/case-studies" 
                  className="text-gray-400 hover:text-white hover:translate-x-1 inline-block transition-all"
                >
                  Case Studies
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Support */}
          <div>
            <h4 className="text-white font-bold text-lg mb-4">Support</h4>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/help" 
                  className="text-gray-400 hover:text-white hover:translate-x-1 inline-block transition-all"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link 
                  to="/faq" 
                  className="text-gray-400 hover:text-white hover:translate-x-1 inline-block transition-all"
                >
                  FAQs
                </Link>
              </li>
              <li>
                <Link 
                  to="/privacy" 
                  className="text-gray-400 hover:text-white hover:translate-x-1 inline-block transition-all"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link 
                  to="/terms" 
                  className="text-gray-400 hover:text-white hover:translate-x-1 inline-block transition-all"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link 
                  to="/refund" 
                  className="text-gray-400 hover:text-white hover:translate-x-1 inline-block transition-all"
                >
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link 
                  to="/cookies" 
                  className="text-gray-400 hover:text-white hover:translate-x-1 inline-block transition-all"
                >
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            
            {/* Copyright */}
            <div className="text-center md:text-left">
              <p className="text-gray-400 text-sm">
                © {currentYear} ParkMitra. All rights reserved.
              </p>
            </div>

            {/* Made with Love */}
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>Made with</span>
              <FaHeart className="text-red-500 animate-pulse" />
              <span>for smart parking</span>
            </div>

            {/* Additional Links */}
            <div className="flex gap-4 text-sm">
              <Link to="/sitemap" className="text-gray-400 hover:text-white transition-colors">
                Sitemap
              </Link>
              <span className="text-gray-700">|</span>
              <Link to="/accessibility" className="text-gray-400 hover:text-white transition-colors">
                Accessibility
              </Link>
            </div>

          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
