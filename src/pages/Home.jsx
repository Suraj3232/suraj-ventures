import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SearchBar } from '../components/SearchBar';
import { ArrowRight, Leaf, Users, Zap, Shield } from 'lucide-react';
import { categories } from '../utils/constants';
import { getFeaturedProducts } from '../services/productService';

import { CATEGORY_STYLES, DEFAULT_STYLE } from '../utils/categoryStyles';

export const Home = () => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [featuredProducts, setFeaturedProducts] = useState([]);

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  // Load featured products from Firestore on mount
  useEffect(() => {
    getFeaturedProducts(6)
      .then(setFeaturedProducts)
      .catch((err) => console.error('Failed to load featured products:', err));
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-emerald-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-4 leading-tight">
                Choose by <span className="text-emerald-600">Features</span>, Not Brands
              </h1>
              <p className="text-xl text-slate-600 mb-8">
                Discover products through ingredients, benefits, and product features instead of brand identity. Make informed choices for a healthier lifestyle.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 bg-emerald-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-emerald-700 transition"
                >
                  Explore Products
                  <ArrowRight size={20} />
                </Link>
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 border-2 border-emerald-600 text-emerald-600 px-8 py-4 rounded-lg font-semibold hover:bg-emerald-50 transition"
                >
                  Learn More
                </Link>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="bg-emerald-200 rounded-2xl h-96 flex items-center justify-center">
                <div className="text-6xl">🌿</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Search */}
      <section className="py-12 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Quick Search</h2>
            <SearchBar onSearch={handleSearch} />
            {searchTerm && (
              <Link
                to={`/products?search=${searchTerm}`}
                className="inline-block mt-4 text-emerald-600 font-semibold hover:text-emerald-700"
              >
                See all results for "{searchTerm}" →
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Browse Categories</h2>
          <p className="text-lg text-slate-600 mb-12">Find products that fit your lifestyle and wellness goals</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map(category => (
              <Link
                key={category.id}
                to={`/products?category=${encodeURIComponent(category.name)}`}
                className="group bg-white rounded-2xl p-8 hover:shadow-2xl transition transform hover:-translate-y-2"
              >
                <div className="text-5xl mb-4">{category.icon}</div>
                <h3 className="text-xl font-bold text-slate-800 group-hover:text-emerald-600 transition mb-2">
                  {category.name}
                </h3>
                <p className="text-slate-600 mb-4">{category.description}</p>
                <p className="text-sm font-semibold text-emerald-600 group-hover:text-emerald-700">
                  Explore →
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-slate-900 mb-4 text-center">Why Choose Suraj Ventures?</h2>
          <p className="text-lg text-slate-600 text-center mb-12 max-w-2xl mx-auto">
            We believe in transparency and helping you make informed decisions about the products you use.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Shield size={32} className="text-emerald-600" />,
                title: "Ingredient Transparency",
                description: "See exactly what's in every product"
              },
              {
                icon: <Leaf size={32} className="text-emerald-600" />,
                title: "Eco-Conscious",
                description: "Discover sustainable and natural products"
              },
              {
                icon: <Users size={32} className="text-emerald-600" />,
                title: "Community Driven",
                description: "Share your preferences and get recommendations"
              },
              {
                icon: <Zap size={32} className="text-emerald-600" />,
                title: "Easy Discovery",
                description: "Filter by ingredients, features, and benefits"
              }
            ].map((benefit, idx) => (
              <div key={idx} className="p-6 rounded-lg border border-emerald-100 hover:border-emerald-600 transition">
                <div className="mb-4">{benefit.icon}</div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">{benefit.title}</h3>
                <p className="text-slate-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-4xl font-bold text-slate-900 mb-2">Featured Products</h2>
              <p className="text-lg text-slate-600">Discover our curated selection of premium products</p>
            </div>
            <Link
              to="/products"
              className="hidden md:inline-flex items-center gap-2 text-emerald-600 font-semibold hover:text-emerald-700"
            >
              View All
              <ArrowRight size={20} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProducts.map((product) => {
              const style = CATEGORY_STYLES[product.category] || DEFAULT_STYLE;
              return (
                <Link
                  key={product.id}
                  to={`/product/${product.id}`}
                  className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col"
                >
                  <div className={`relative h-48 bg-gradient-to-br ${style.cardGradient} flex flex-col items-center justify-center gap-2`}>
                    <span className="text-5xl drop-shadow-sm select-none group-hover:scale-110 transition-transform duration-300">{style.icon}</span>
                    <span className="text-white/80 text-xs font-semibold uppercase tracking-widest">{product.category.split(' & ')[0]}</span>
                    <div className="absolute inset-0 opacity-10 pointer-events-none"
                      style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }}
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-slate-800 group-hover:text-emerald-600 transition mb-1 line-clamp-2">
                      {product.productName}
                    </h3>
                    <p className="text-sm text-slate-500">{product.category}</p>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="mt-8 text-center md:hidden">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-emerald-700 transition"
            >
              View All Products
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Discover Smarter?</h2>
          <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
            Start exploring products by their ingredients, features, and benefits. Make informed choices today.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-white text-emerald-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Explore Now
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </div>
  );
};
