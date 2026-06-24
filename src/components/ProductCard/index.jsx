import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

// Category → gradient + icon mapping
const CATEGORY_STYLES = {
  'Cosmetics & Personal Care': {
    gradient: 'from-pink-400 via-rose-400 to-pink-500',
    icon: '🧴',
    label: 'Personal Care',
  },
  'Food Products': {
    gradient: 'from-emerald-400 via-green-400 to-teal-500',
    icon: '🍃',
    label: 'Food',
  },
  'Nutrition & Wellness': {
    gradient: 'from-blue-400 via-cyan-400 to-blue-500',
    icon: '💊',
    label: 'Nutrition',
  },
  'Health & Wellness': {
    gradient: 'from-teal-400 via-emerald-400 to-green-500',
    icon: '🌿',
    label: 'Wellness',
  },
};

const DEFAULT_STYLE = {
  gradient: 'from-emerald-400 via-emerald-500 to-green-600',
  icon: '✨',
  label: 'Product',
};

export const ProductCard = ({ product, isSaved = false }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [saved, setSaved] = useState(isSaved);
  const { currentUser } = useAuth();

  const style = CATEGORY_STYLES[product.category] || DEFAULT_STYLE;

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert('Please login to save products');
      return;
    }

    setIsLoading(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);

      if (saved) {
        await updateDoc(userRef, {
          savedProducts: arrayRemove(product.id)
        });
        setSaved(false);
      } else {
        await updateDoc(userRef, {
          savedProducts: arrayUnion(product.id)
        });
        setSaved(true);
      }
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error saving product');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Link
      to={`/product/${product.id}`}
      className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col"
    >
      {/* Feature Header — no image, category-driven gradient */}
      <div className={`relative h-48 bg-gradient-to-br ${style.gradient} flex flex-col items-center justify-center gap-2`}>
        {/* Large category icon */}
        <span className="text-5xl drop-shadow-sm select-none">{style.icon}</span>
        <span className="text-white/90 text-xs font-semibold uppercase tracking-widest">
          {style.label}
        </span>

        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        />

        {/* Save Button */}
        <button
          onClick={handleSaveProduct}
          className={`absolute top-3 right-3 p-2 rounded-full shadow-md transition-all duration-200 ${
            saved
              ? 'bg-red-500 text-white scale-110'
              : 'bg-white/90 text-gray-600 hover:bg-red-500 hover:text-white hover:scale-110'
          }`}
          disabled={isLoading}
          aria-label={saved ? 'Remove from saved' : 'Save product'}
        >
          <Heart size={18} fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Content Section */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Category Badge */}
        <span className="inline-block px-2 py-1 text-xs font-semibold text-emerald-600 bg-emerald-50 rounded-full mb-2 self-start">
          {product.category.split(' & ')[0]}
        </span>

        {/* Product Name */}
        <h3 className="text-base font-semibold text-slate-800 group-hover:text-emerald-600 transition mb-3 line-clamp-2 flex-grow">
          {product.productName}
        </h3>

        {/* Key Ingredients */}
        <div className="mb-3">
          <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Ingredients</p>
          <div className="flex flex-wrap gap-1">
            {product.ingredients.slice(0, 2).map((ing) => (
              <span key={ing} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                {ing}
              </span>
            ))}
            {product.ingredients.length > 2 && (
              <span className="text-xs text-gray-400">+{product.ingredients.length - 2}</span>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Features</p>
          <div className="flex flex-wrap gap-1">
            {product.features.slice(0, 2).map((feat) => (
              <span key={feat} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                ✓ {feat}
              </span>
            ))}
            {product.features.length > 2 && (
              <span className="text-xs text-gray-400">+{product.features.length - 2}</span>
            )}
          </div>
        </div>

        {/* View Details */}
        <div className="flex items-center gap-1 text-emerald-600 text-sm font-semibold group-hover:gap-2 transition-all duration-200 mt-auto">
          View Details
          <ArrowRight size={15} />
        </div>
      </div>
    </Link>
  );
};
