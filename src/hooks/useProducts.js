import { useState, useEffect, useCallback } from 'react';
import { getProducts, getAllProductsAdmin } from '../services/productService';

// ─── Public Products Hook ────────────────────────────────────────────────────

/**
 * Fetch all ACTIVE products from Firestore.
 * Used by: Products.jsx
 *
 * Returns:
 *   products  — array of product objects
 *   loading   — true while the initial fetch is in progress
 *   error     — error message string, or null
 *   refetch   — call this to manually re-fetch (e.g. after a filter change)
 */
export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      console.error('useProducts fetch error:', err);
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, loading, error, refetch: fetchProducts };
};

// ─── Admin Products Hook ─────────────────────────────────────────────────────

/**
 * Fetch ALL products from Firestore (all statuses) for the Admin Panel.
 * Used by: Admin.jsx
 *
 * Returns the same shape as useProducts plus `refetch`.
 */
export const useAdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllProductsAdmin();
      setProducts(data);
    } catch (err) {
      console.error('useAdminProducts fetch error:', err);
      setError(err.message || 'Failed to load admin products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, loading, error, refetch: fetchProducts };
};
