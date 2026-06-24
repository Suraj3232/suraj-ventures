import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, X, LogOut } from 'lucide-react';

export const Navbar = () => {
  const { currentUser, logout, userRole } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
      setIsMenuOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">SV</span>
            </div>
            <span className="text-xl font-bold text-slate-800 group-hover:text-emerald-600 transition">
              Suraj Ventures
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/products" className="text-slate-600 hover:text-emerald-600 transition">
              Products
            </Link>
            <Link to="/about" className="text-slate-600 hover:text-emerald-600 transition">
              About
            </Link>
            <Link to="/contact" className="text-slate-600 hover:text-emerald-600 transition">
              Contact
            </Link>

            {/* Auth Section */}
            {!currentUser ? (
              <div className="flex gap-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-emerald-600 border border-emerald-600 rounded-lg hover:bg-emerald-50 transition"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                >
                  Sign Up
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                {userRole === 'admin' && (
                  <Link
                    to="/admin"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                  >
                    Admin Panel
                  </Link>
                )}
                <Link
                  to="/dashboard"
                  className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden pb-4 border-t">
            <Link
              to="/products"
              className="block px-4 py-2 text-slate-600 hover:bg-emerald-50"
              onClick={() => setIsMenuOpen(false)}
            >
              Products
            </Link>
            <Link
              to="/about"
              className="block px-4 py-2 text-slate-600 hover:bg-emerald-50"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            <Link
              to="/contact"
              className="block px-4 py-2 text-slate-600 hover:bg-emerald-50"
              onClick={() => setIsMenuOpen(false)}
            >
              Contact
            </Link>
            {!currentUser ? (
              <>
                <Link
                  to="/login"
                  className="block px-4 py-2 text-emerald-600"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block px-4 py-2 text-emerald-600"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                {userRole === 'admin' && (
                  <Link
                    to="/admin"
                    className="block px-4 py-2 text-blue-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Admin Panel
                  </Link>
                )}
                <Link
                  to="/dashboard"
                  className="block px-4 py-2 text-slate-600"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-red-600"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};
