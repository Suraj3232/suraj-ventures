import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchBar } from '../components/SearchBar';
import { FilterPanel } from '../components/FilterPanel';
import { ProductCard } from '../components/ProductCard';
import { SkeletonLoader } from '../components/LoadingSpinner';
import { useProducts } from '../hooks/useProducts';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export const Products = () => {
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();

  // ── Firestore product data ─────────────────────────────────────────────────
  const { products, loading, error } = useProducts();

  // ── User's saved product IDs (for heart icon state) ───────────────────────
  const [userSavedProducts, setUserSavedProducts] = useState([]);

  useEffect(() => {
    if (!currentUser) return;
    const fetchSaved = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUserSavedProducts(userDoc.data().savedProducts || []);
        }
      } catch (err) {
        console.error('Error fetching saved products:', err);
      }
    };
    fetchSaved();
  }, [currentUser]);

  // ── Filter / search state ──────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({});

  // Pre-populate category filter from URL query param (?category=...)
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setSelectedFilters((prev) => ({ ...prev, category: [categoryParam] }));
    }
  }, [searchParams]);

  // Pre-populate search from URL query param (?search=...)
  useEffect(() => {
    const searchParam = searchParams.get('search');
    if (searchParam) {
      setSearchTerm(searchParam);
    }
  }, [searchParams]);

  // ── Dynamic filter options derived from live Firestore products ────────────
  const ingredientOptions = useMemo(
    () => [...new Set(products.flatMap((p) => p.ingredients || []))].sort(),
    [products]
  );
  const featureOptions = useMemo(
    () => [...new Set(products.flatMap((p) => p.features || []))].sort(),
    [products]
  );
  const benefitOptions = useMemo(
    () => [...new Set(products.flatMap((p) => p.benefits || []))].sort(),
    [products]
  );

  // ── Filtered product list ──────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Search: name, category, ingredients, features, benefits
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        product.productName?.toLowerCase().includes(searchLower) ||
        product.category?.toLowerCase().includes(searchLower) ||
        (product.ingredients || []).some((ing) =>
          ing.toLowerCase().includes(searchLower)
        ) ||
        (product.features || []).some((feat) =>
          feat.toLowerCase().includes(searchLower)
        ) ||
        (product.benefits || []).some((ben) =>
          ben.toLowerCase().includes(searchLower)
        );

      if (!matchesSearch) return false;

      // Category filter
      if (selectedFilters.category?.length > 0) {
        if (!selectedFilters.category.includes(product.category)) return false;
      }

      // Ingredient filter (product must contain ALL selected)
      if (selectedFilters.ingredients?.length > 0) {
        const has = selectedFilters.ingredients.every((ing) =>
          (product.ingredients || []).includes(ing)
        );
        if (!has) return false;
      }

      // Feature filter (product must contain ALL selected)
      if (selectedFilters.features?.length > 0) {
        const has = selectedFilters.features.every((feat) =>
          (product.features || []).includes(feat)
        );
        if (!has) return false;
      }

      // Benefit filter (product must contain ALL selected)
      if (selectedFilters.benefits?.length > 0) {
        const has = selectedFilters.benefits.every((ben) =>
          (product.benefits || []).includes(ben)
        );
        if (!has) return false;
      }

      return true;
    });
  }, [products, searchTerm, selectedFilters]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">All Products</h1>
            <p className="text-lg text-slate-600">
              {loading
                ? 'Loading products…'
                : filteredProducts.length !== products.length
                ? `Showing ${filteredProducts.length} of ${products.length} product${products.length !== 1 ? 's' : ''}`
                : `${products.length} product${products.length !== 1 ? 's' : ''} available`}
            </p>
          </div>
          {!loading && Object.values(selectedFilters).some(arr => arr && arr.length > 0) && (
            <button
              onClick={() => setSelectedFilters({})}
              className="text-sm font-semibold text-emerald-600 border border-emerald-600 px-4 py-1.5 rounded-lg hover:bg-emerald-50 transition"
            >
              Clear All Filters
            </button>
          )}
        </div>

        {/* Error state */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            Failed to load products: {error}
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-8">
          <SearchBar onSearch={setSearchTerm} initialValue={searchTerm} />
        </div>

        {/* Filters + Products Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar — Filters */}
          <div className="lg:col-span-1">
            <FilterPanel
              onFilterChange={setSelectedFilters}
              selectedFilters={selectedFilters}
              ingredientOptions={ingredientOptions}
              featureOptions={featureOptions}
              benefitOptions={benefitOptions}
            />
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {/* Loading skeleton */}
            {loading && <SkeletonLoader />}

            {/* Empty state — no products in Firestore at all */}
            {!loading && !error && products.length === 0 && (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">No Products Yet</h3>
                <p className="text-slate-600">
                  No products have been added yet. Check back soon!
                </p>
              </div>
            )}

            {/* Empty state — filters yield no results */}
            {!loading && !error && products.length > 0 && filteredProducts.length === 0 && (
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

            {/* Product grid */}
            {!loading && filteredProducts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isSaved={userSavedProducts.includes(product.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
