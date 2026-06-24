import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { InquiryForm } from '../components/InquiryForm';
import { ProductCard } from '../components/ProductCard';
import { Heart, ArrowLeft, Share2 } from 'lucide-react';
import { products } from '../data/products';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase/config';

// Category-based visual treatment — no images, feature-first
const CATEGORY_STYLES = {
  'Cosmetics & Personal Care': {
    gradient: 'from-pink-400 via-rose-400 to-pink-600',
    icon: '🧴',
    bg: 'bg-pink-50',
  },
  'Food Products': {
    gradient: 'from-emerald-400 via-green-500 to-teal-600',
    icon: '🍃',
    bg: 'bg-emerald-50',
  },
  'Nutrition & Wellness': {
    gradient: 'from-blue-400 via-cyan-500 to-blue-600',
    icon: '💊',
    bg: 'bg-blue-50',
  },
  'Health & Wellness': {
    gradient: 'from-teal-400 via-emerald-500 to-green-600',
    icon: '🌿',
    bg: 'bg-teal-50',
  },
};
const DEFAULT_STYLE = { gradient: 'from-emerald-400 to-green-600', icon: '✨', bg: 'bg-emerald-50' };

export const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Find product and related products
  useEffect(() => {
    const found = products.find(p => p.id === id);
    setProduct(found);

    if (found) {
      // Get related products (same category)
      const related = products
        .filter(p => p.category === found.category && p.id !== found.id)
        .slice(0, 4);
      setRelatedProducts(related);
    }
  }, [id]);

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Product Not Found</h2>
          <Link to="/products" className="text-emerald-600 font-semibold hover:text-emerald-700">
            ← Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const handleSaveProduct = async () => {
    if (!currentUser) {
      alert('Please login to save products');
      return;
    }

    setIsLoading(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);

      if (isSaved) {
        await updateDoc(userRef, {
          savedProducts: arrayRemove(product.id)
        });
        setIsSaved(false);
      } else {
        await updateDoc(userRef, {
          savedProducts: arrayUnion(product.id)
        });
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-emerald-600 font-semibold mb-8 hover:text-emerald-700"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        {/* Product Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
          {/* Feature Hero Panel — category gradient with ingredient & feature highlights */}
          <div className="rounded-xl overflow-hidden shadow-md flex flex-col">
            {/* Top gradient banner */}
            {(() => {
              const style = CATEGORY_STYLES[product.category] || DEFAULT_STYLE;
              return (
                <>
                  <div className={`bg-gradient-to-br ${style.gradient} flex flex-col items-center justify-center gap-3 py-12 relative`}>
                    <span className="text-7xl drop-shadow select-none">{style.icon}</span>
                    <span className="text-white/80 text-sm font-semibold uppercase tracking-widest mt-1">
                      {product.category}
                    </span>
                    {/* Dot pattern overlay */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none"
                      style={{ backgroundImage: 'radial-gradient(circle at 25% 75%, white 1.5px, transparent 1.5px), radial-gradient(circle at 75% 25%, white 1.5px, transparent 1.5px)', backgroundSize: '28px 28px' }}
                    />
                  </div>
                  {/* Feature highlights strip */}
                  <div className={`${style.bg} p-6 flex-grow`}>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Key Ingredients</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {product.ingredients.map(ing => (
                        <span key={ing} className="px-3 py-1.5 bg-white text-slate-700 border border-slate-200 rounded-full text-sm font-medium shadow-sm">
                          {ing}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Features</p>
                    <div className="flex flex-wrap gap-2">
                      {product.features.map(feat => (
                        <span key={feat} className="px-3 py-1.5 bg-emerald-600 text-white rounded-full text-sm font-medium">
                          ✓ {feat}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Product Info */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold mb-4">
                  {product.category}
                </span>
                <h1 className="text-4xl font-bold text-slate-900 mb-4">{product.productName}</h1>
              </div>
              <button
                onClick={handleSaveProduct}
                disabled={isLoading}
                className={`p-3 rounded-full transition ${
                  isSaved
                    ? 'bg-red-100 text-red-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600'
                }`}
              >
                <Heart size={24} fill={isSaved ? 'currentColor' : 'none'} />
              </button>
            </div>

            <p className="text-lg text-slate-600 mb-6">{product.description}</p>

            {/* Share Button */}
            <button className="flex items-center gap-2 text-emerald-600 font-semibold hover:text-emerald-700 mb-8">
              <Share2 size={20} />
              Share Product
            </button>

            {/* Ingredients Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-bold text-slate-800 mb-3">Key Ingredients</h3>
              <div className="flex flex-wrap gap-2">
                {product.ingredients.map(ing => (
                  <span
                    key={ing}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                  >
                    {ing}
                  </span>
                ))}
              </div>
            </div>

            {/* Features Section */}
            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-bold text-slate-800 mb-3">Features</h3>
              <div className="flex flex-wrap gap-2">
                {product.features.map(feat => (
                  <span
                    key={feat}
                    className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium"
                  >
                    ✓ {feat}
                  </span>
                ))}
              </div>
            </div>

            {/* Benefits Section */}
            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-bold text-slate-800 mb-3">Benefits</h3>
              <div className="flex flex-wrap gap-2">
                {product.benefits.map(ben => (
                  <span
                    key={ben}
                    className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                  >
                    {ben}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Usage Instructions</h2>
          <p className="text-lg text-slate-600 leading-relaxed">{product.usageInstructions}</p>
        </div>

        {/* Inquiry Form */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-12">
          <InquiryForm productId={product.id} productName={product.productName} />
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-8">Related Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map(relProduct => (
                <ProductCard key={relProduct.id} product={relProduct} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
