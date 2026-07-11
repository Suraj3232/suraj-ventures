import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { InquiryForm } from '../components/InquiryForm';
import { ProductCard } from '../components/ProductCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Heart, ArrowLeft, Share2, Check, Tag } from 'lucide-react';
import { getProduct, getProducts } from '../services/productService';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

import { CATEGORY_STYLES, DEFAULT_STYLE } from '../utils/categoryStyles';

const generateCategoryHighlights = (category) => {
  switch (category) {
    case 'Cosmetics & Personal Care':
      return ['Paraben Free', 'Natural Formula', 'Dermatologically Inspired', 'Gentle on Skin'];
    case 'Food Products':
      return ['High Quality', 'Organic Ingredients', 'Nutrient Rich', 'No Artificial Preservatives'];
    case 'Nutrition & Wellness':
      return ['Immunity Support', 'Daily Wellness', 'Herbal Blend', 'Fast Absorbing'];
    case 'Health & Wellness':
      return ['Holistic Approach', 'Traditional Remedies', 'Wellness Support', 'Carefully Sourced'];
    default:
      return ['Premium Quality', 'Carefully Selected Ingredients', 'Trusted Wellness Product', 'Suitable for Daily Use'];
  }
};

const generatePerfectForTags = (category) => {
  switch (category) {
    case 'Cosmetics & Personal Care':
      return ['Daily Routine', 'Skin Care', 'Adults'];
    case 'Food Products':
      return ['Healthy Snacking', 'All Ages', 'Nutrition'];
    case 'Nutrition & Wellness':
      return ['Active Lifestyle', 'Dietary Support', 'Wellness'];
    case 'Health & Wellness':
      return ['Recovery', 'Balance', 'Holistic Care'];
    default:
      return ['Daily Use', 'Wellness', 'Everyone'];
  }
};

export const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // ── Load user's saved state from Firestore ────────────────────────────────
  useEffect(() => {
    if (!currentUser || !id) return;
    const loadSavedState = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const saved = userDoc.data().savedProducts || [];
          setIsSaved(saved.includes(id));
        }
      } catch (err) {
        console.error('Error loading saved state:', err);
      }
    };
    loadSavedState();
  }, [currentUser, id]);

  useEffect(() => {
    let cancelled = false;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        setNotFound(false);

        const found = await getProduct(id);
        if (cancelled) return;

        if (!found) {
          setNotFound(true);
          return;
        }

        setProduct(found);

        const all = await getProducts();
        if (cancelled) return;
        const related = all
          .filter((p) => p.category === found.category && p.id !== found.id)
          .slice(0, 4);
        setRelatedProducts(related);
      } catch (err) {
        console.error('Error loading product:', err);
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProduct();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleSaveProduct = async () => {
    if (!currentUser) {
      alert('Please login to save products');
      return;
    }

    setSaveLoading(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      if (isSaved) {
        await updateDoc(userRef, { savedProducts: arrayRemove(product.id) });
        setIsSaved(false);
      } else {
        await updateDoc(userRef, { savedProducts: arrayUnion(product.id) });
        setIsSaved(true);
      }
    } catch (err) {
      console.error('Error saving product:', err);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: product.productName, url });
      } catch (_) {}
    } else {
      try {
        await navigator.clipboard.writeText(url);
        alert('Product link copied to clipboard!');
      } catch (_) {}
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <LoadingSpinner />
          <p className="text-slate-600 mt-4 font-medium animate-pulse">Loading premium product details...</p>
        </div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-3xl font-bold text-slate-800 mb-4">Product Not Found</h2>
          <p className="text-slate-600 mb-8 max-w-md mx-auto">
            The product you're looking for doesn't exist or has been removed from our catalog.
          </p>
          <Link
            to="/products"
            className="inline-block bg-slate-900 text-white px-8 py-3 rounded-xl font-semibold hover:bg-slate-800 transition shadow-sm"
          >
            ← Browse All Products
          </Link>
        </div>
      </div>
    );
  }

  const style = CATEGORY_STYLES[product.category] || DEFAULT_STYLE;
  const highlights = product.productHighlights?.length > 0 ? product.productHighlights : generateCategoryHighlights(product.category);
  const tags = generatePerfectForTags(product.category);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="group flex items-center gap-2 text-slate-500 font-semibold mb-8 hover:text-slate-900 transition-colors"
        >
          <div className="bg-white p-2 rounded-full shadow-sm group-hover:shadow transition-shadow">
            <ArrowLeft size={18} />
          </div>
          Back to browsing
        </button>

        {/* Product Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-16">
          
          {/* LEFT PANEL: HERO SUMMARY CARD */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 h-fit">
            <div className="rounded-3xl overflow-hidden shadow-xl flex flex-col transform transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl">
              {product.image ? (
                <div className="relative">
                  <img
                    src={product.image}
                    alt={product.productName}
                    className="w-full h-80 object-cover"
                  />
                  <div className="absolute top-4 left-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-white/90 backdrop-blur shadow-sm ${style.text}`}>
                      <span className="text-base leading-none">{style.icon}</span> {product.category}
                    </span>
                  </div>
                </div>
              ) : null}
              
              <div className={`bg-gradient-to-br ${style.detailGradient} flex flex-col p-8 lg:p-10 relative`}>
                {/* Pattern overlay */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 2px, transparent 2px), radial-gradient(circle at 80% 20%, white 2px, transparent 2px)', backgroundSize: '32px 32px' }} />
                
                <div className="relative z-10 flex flex-col text-white">
                  {!product.image && (
                    <div className="flex items-center gap-3 mb-6">
                      <span className="text-5xl drop-shadow-md">{style.icon}</span>
                      <span className="text-white/90 text-xs font-bold uppercase tracking-widest">{product.category}</span>
                    </div>
                  )}
                  
                  <h2 className="text-3xl lg:text-4xl font-extrabold mb-4 leading-tight drop-shadow-sm">
                    {product.productName}
                  </h2>
                  
                  {product.shortDescription && (
                    <p className="text-white/90 text-lg font-medium mb-8 leading-relaxed">
                      {product.shortDescription}
                    </p>
                  )}
                  
                  <div className="mt-8 flex flex-col gap-6">
                    {/* Product Highlights */}
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-inner">
                      <p className="text-xs font-bold text-white/80 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Check size={14} /> Product Highlights
                      </p>
                      <ul className="space-y-3">
                        {highlights.map((h, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm font-medium">
                            <span className="text-white/90 mt-0.5"><Check size={16} /></span>
                            <span className="text-white drop-shadow-sm">{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* Perfect For */}
                    <div>
                      <p className="text-xs font-bold text-white/80 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Tag size={14} /> Perfect For
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag, i) => (
                          <span key={i} className="px-4 py-1.5 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-xs font-bold text-white shadow-sm transition-colors hover:bg-white/30">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: DETAILED INFORMATION */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 lg:p-10">
              
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-8">
                <div>
                  <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4 ${style.badge}`}>
                    {product.category}
                  </span>
                  <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
                    {product.productName}
                  </h1>
                  <div className="flex items-center gap-4">
                    {product.stockStatus && (
                      <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        product.stockStatus === 'In Stock' ? 'bg-green-100 text-green-700' : 
                        product.stockStatus === 'Out of Stock' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        <span className={`w-2 h-2 rounded-full mr-2 ${
                          product.stockStatus === 'In Stock' ? 'bg-green-500' : 
                          product.stockStatus === 'Out of Stock' ? 'bg-red-500' : 'bg-orange-500'
                        }`}></span>
                        {product.stockStatus}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex sm:flex-col gap-3">
                  <button
                    onClick={handleSaveProduct}
                    disabled={saveLoading}
                    className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 shadow-sm ${
                      isSaved
                        ? 'bg-rose-100 text-rose-600 hover:bg-rose-200'
                        : 'bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500'
                    }`}
                    aria-label={isSaved ? 'Remove from saved' : 'Save product'}
                  >
                    <Heart size={22} fill={isSaved ? 'currentColor' : 'none'} className={isSaved ? 'scale-110' : ''} />
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all duration-300 shadow-sm"
                    aria-label="Share product"
                  >
                    <Share2 size={20} />
                  </button>
                </div>
              </div>

              {/* Description */}
              <div className="prose prose-slate prose-lg max-w-none text-slate-600 mb-10 leading-relaxed font-medium">
                <p>{product.description}</p>
              </div>

              {/* Badges Sections */}
              <div className="space-y-10">
                {product.ingredients && product.ingredients.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Key Ingredients</h3>
                    <div className="flex flex-wrap gap-2.5">
                      {product.ingredients.map((ing, i) => (
                        <span key={i} className="px-4 py-2 bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-sm font-semibold shadow-sm hover:shadow transition-shadow">
                          {ing}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {product.benefits && product.benefits.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Benefits</h3>
                    <div className="flex flex-wrap gap-2.5">
                      {product.benefits.map((ben, i) => (
                        <span key={i} className={`px-4 py-2 ${style.bg} ${style.text} border ${style.border} rounded-xl text-sm font-semibold shadow-sm hover:shadow transition-shadow`}>
                          {ben}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {product.features && product.features.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Features</h3>
                    <div className="flex flex-wrap gap-2.5">
                      {product.features.map((feat, i) => (
                        <span key={i} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold shadow-sm hover:bg-slate-800 transition-colors">
                          <span className="text-emerald-400 mr-2">✓</span>{feat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Usage Instructions */}
            {product.usageInstructions && (
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 lg:p-10">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Usage Instructions</h2>
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-lg text-slate-700 leading-relaxed font-medium">
                    {product.usageInstructions}
                  </p>
                </div>
              </div>
            )}
            
            {/* Inquiry Form Wrapper */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 lg:p-10">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Interested in this product?</h2>
              <InquiryForm productId={product.id} productName={product.productName} />
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-20">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">You might also like</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {relatedProducts.map((rel) => (
                <ProductCard key={rel.id} product={rel} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
