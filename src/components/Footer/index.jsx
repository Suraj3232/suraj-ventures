import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Mail, Phone } from 'lucide-react';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 py-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">SV</span>
              </div>
              <span className="text-lg font-bold">Suraj Ventures</span>
            </div>
            <p className="text-gray-400">
              Choose by Features, Not Brands. Discover products through ingredients and benefits.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/products" className="text-gray-400 hover:text-emerald-400 transition">
                  Products
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-400 hover:text-emerald-400 transition">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-emerald-400 transition">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-gray-400 hover:text-emerald-400 transition">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Categories</h3>
            <ul className="space-y-2">
              <li>
                <a href="/products?category=Cosmetics" className="text-gray-400 hover:text-emerald-400 transition">
                  Cosmetics & Care
                </a>
              </li>
              <li>
                <a href="/products?category=Food" className="text-gray-400 hover:text-emerald-400 transition">
                  Food Products
                </a>
              </li>
              <li>
                <a href="/products?category=Nutrition" className="text-gray-400 hover:text-emerald-400 transition">
                  Nutrition & Wellness
                </a>
              </li>
              <li>
                <a href="/products?category=Health" className="text-gray-400 hover:text-emerald-400 transition">
                  Health & Wellness
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <Mail size={18} className="text-emerald-400" />
                <a href="mailto:contact@surajventures.com" className="text-gray-400 hover:text-emerald-400 transition">
                  contact@surajventures.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={18} className="text-emerald-400" />
                <a href="tel:+91-9876543210" className="text-gray-400 hover:text-emerald-400 transition">
                  +91-9876543210
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-700"></div>

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center py-8">
          <p className="text-gray-400">
            &copy; {currentYear} Suraj Ventures. All rights reserved.
          </p>
          <div className="flex items-center gap-2 mt-4 md:mt-0">
            <span className="text-gray-400">Made with</span>
            <Heart size={18} className="text-red-500 fill-red-500" />
            <span className="text-gray-400">for conscious consumers</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
