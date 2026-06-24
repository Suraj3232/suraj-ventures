import React, { useState, useMemo } from 'react';
import { SearchBar } from '../components/SearchBar';
import { FilterPanel } from '../components/FilterPanel';
import { ProductCard } from '../components/ProductCard';
import { products } from '../data/products';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export const Products = () => {
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({});
  const [userSavedProducts, setUserSavedProducts] = useState([]);

  // Fetch user's saved products
  React.useEffect(() => {
    if (currentUser) {
      const fetchSavedProducts = async () => {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            setUserSavedProducts(userDoc.data().savedProducts || []);
          }
        } catch (error) {
          console.error('Error fetching saved products:', error);
        }
      };
      fetchSavedProducts();
    }
  }, [currentUser]);

  // Filter products based on search and selected filters
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        product.productName.toLowerCase().includes(searchLower) ||
        product.category.toLowerCase().includes(searchLower) ||
        product.ingredients.some(ing => ing.toLowerCase().includes(searchLower)) ||
        product.features.some(feat => feat.toLowerCase().includes(searchLower)) ||
        product.benefits.some(ben => ben.toLowerCase().includes(searchLower));

      if (!matchesSearch) return false;

      // Ingredient filter
      if (selectedFilters.ingredients?.length > 0) {
        const hasAllIngredients = selectedFilters.ingredients.every(ing =>
          product.ingredients.includes(ing)
        );
        if (!hasAllIngredients) return false;
      }

      // Feature filter
      if (selectedFilters.features?.length > 0) {
        const hasAllFeatures = selectedFilters.features.every(feat =>
          product.features.includes(feat)
        );
        if (!hasAllFeatures) return false;
      }

      // Benefits filter
      if (selectedFilters.benefits?.length > 0) {
        const hasAllBenefits = selectedFilters.benefits.every(ben =>
          product.benefits.includes(ben)
        );
        if (!hasAllBenefits) return false;
      }

      return true;
    });
  }, [searchTerm, selectedFilters]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">All Products</h1>
          <p className="text-lg text-slate-600">
            Discover {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} based on your preferences
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <SearchBar onSearch={setSearchTerm} />
        </div>

        {/* Filters and Products Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Filters */}
          <div className="lg:col-span-1">
            <FilterPanel
              onFilterChange={setSelectedFilters}
              selectedFilters={selectedFilters}
            />
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isSaved={userSavedProducts.includes(product.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">No Products Found</h3>
                <p className="text-slate-600 mb-6">
                  Try adjusting your search or filters to find what you're looking for.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedFilters({});
                  }}
                  className="inline-block bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
