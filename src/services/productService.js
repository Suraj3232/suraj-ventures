import { db, storage } from '../firebase/config';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';

const PRODUCTS_COLLECTION = 'products';

// ─── Slug Helper ────────────────────────────────────────────────────────────

/** Convert a product name to a URL-safe slug. */
export const generateSlug = (name) =>
  name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// ─── Sort Helper (client-side, avoids composite index requirements) ──────────

const sortByCreatedAtDesc = (arr) =>
  [...arr].sort(
    (a, b) =>
      (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)
  );

// ─── Public Queries ─────────────────────────────────────────────────────────

/**
 * Fetch all ACTIVE products for the public website.
 * Uses a single `where` clause to avoid composite index requirements.
 */
export const getProducts = async () => {
  try {
    const q = query(
      collection(db, PRODUCTS_COLLECTION),
      where('status', '==', 'active')
    );
    const snap = await getDocs(q);
    const products = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return sortByCreatedAtDesc(products);
  } catch (err) {
    console.error('getProducts error:', err);
    throw err;
  }
};

/**
 * Fetch featured active products for the Home page.
 * Queries by `featured == true` then filters `status === 'active'` client-side
 * to avoid a composite index on (status + featured).
 */
export const getFeaturedProducts = async (limitCount = 6) => {
  try {
    const q = query(
      collection(db, PRODUCTS_COLLECTION),
      where('featured', '==', true)
    );
    const snap = await getDocs(q);
    const products = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((p) => p.status === 'active');
    return sortByCreatedAtDesc(products).slice(0, limitCount);
  } catch (err) {
    console.error('getFeaturedProducts error:', err);
    throw err;
  }
};

/**
 * Fetch a single product by Firestore document ID.
 * Returns the product object or null if not found.
 */
export const getProduct = async (id) => {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  } catch (err) {
    console.error('getProduct error:', err);
    throw err;
  }
};

/**
 * Fetch multiple products by an array of Firestore document IDs.
 * Used by Dashboard to resolve saved product IDs.
 * Silently drops IDs that no longer exist in Firestore.
 */
export const getProductsByIds = async (ids) => {
  if (!ids || ids.length === 0) return [];
  try {
    const promises = ids.map((id) => getProduct(id));
    const results = await Promise.all(promises);
    return results.filter(Boolean); // remove nulls (deleted / archived)
  } catch (err) {
    console.error('getProductsByIds error:', err);
    throw err;
  }
};

// ─── Admin Queries ───────────────────────────────────────────────────────────

/**
 * Fetch ALL products regardless of status — for Admin Panel only.
 */
export const getAllProductsAdmin = async () => {
  try {
    const snap = await getDocs(collection(db, PRODUCTS_COLLECTION));
    const products = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return sortByCreatedAtDesc(products);
  } catch (err) {
    console.error('getAllProductsAdmin error:', err);
    throw err;
  }
};

// ─── Write Operations ────────────────────────────────────────────────────────

/**
 * Create a new product document in Firestore.
 * Automatically generates a slug from productName.
 * Returns the new document ID.
 */
export const createProduct = async (data) => {
  try {
    const slug = generateSlug(data.productName);
    const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), {
      ...data,
      slug,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (err) {
    console.error('createProduct error:', err);
    throw err;
  }
};

/**
 * Update an existing product document.
 * Always refreshes `updatedAt` timestamp.
 */
export const updateProduct = async (id, data) => {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error('updateProduct error:', err);
    throw err;
  }
};

/**
 * Soft-delete: set product status to 'archived'.
 * Archived products are invisible to the public website.
 */
export const archiveProduct = async (id) => {
  try {
    await updateProduct(id, { status: 'archived' });
  } catch (err) {
    console.error('archiveProduct error:', err);
    throw err;
  }
};

/**
 * Permanently delete a product document and its associated Storage image.
 * @param {string} id - Firestore document ID
 * @param {string} [imagePath] - Firebase Storage path (NOT the download URL)
 */
export const deleteProduct = async (id, imagePath) => {
  try {
    if (imagePath) {
      try {
        await deleteObject(ref(storage, imagePath));
      } catch (storageErr) {
        // Image may have been manually removed; don't block the document delete
        console.warn('Storage image delete skipped:', storageErr.message);
      }
    }
    await deleteDoc(doc(db, PRODUCTS_COLLECTION, id));
  } catch (err) {
    console.error('deleteProduct error:', err);
    throw err;
  }
};

// ─── Image Upload ────────────────────────────────────────────────────────────

/**
 * Upload a product image to Firebase Storage.
 *
 * @param {File} file - The image File object from an input[type="file"]
 * @param {Function} [onProgress] - Called with upload percentage (0-100)
 * @returns {Promise<{ url: string, path: string }>}
 *   url  — the public download URL to store in Firestore
 *   path — the Storage path needed for future deletion
 */
export const uploadProductImage = (file, onProgress) => {
  return new Promise((resolve, reject) => {
    const sanitized = file.name.replace(/\s+/g, '_');
    const path = `products/${Date.now()}_${sanitized}`;
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const pct = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        if (onProgress) onProgress(pct);
      },
      (error) => reject(error),
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({ url, path });
        } catch (err) {
          reject(err);
        }
      }
    );
  });
};
