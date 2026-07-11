import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  Plus,
  Pencil,
  Trash2,
  Archive,
  BarChart3,
  Package,
  Users,
  MessageSquare,
  Upload,
  X,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import {
  createProduct,
  updateProduct,
  archiveProduct,
  deleteProduct,
  uploadProductImage,
} from '../services/productService';
import { useAdminProducts } from '../hooks/useProducts';
import { categories } from '../utils/constants';

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORIES = categories.map(c => c.name);

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: 'bg-green-100 text-green-700' },
  { value: 'draft', label: 'Draft', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'archived', label: 'Archived', color: 'bg-gray-100 text-gray-600' },
  { value: 'out_of_stock', label: 'Out of Stock', color: 'bg-red-100 text-red-700' },
];

const STOCK_OPTIONS = ['In Stock', 'Out of Stock', 'Coming Soon'];

const EMPTY_FORM = {
  productName: '',
  category: '',
  shortDescription: '',
  description: '',
  ingredients: '',
  benefits: '',
  features: '',
  productHighlights: '',
  usageInstructions: '',
  featured: false,
  stockStatus: 'In Stock',
  status: 'active',
  image: '',
  imagePath: '',
};

// ─── Helper: status badge ─────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const opt = STATUS_OPTIONS.find((o) => o.value === status) || STATUS_OPTIONS[0];
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${opt.color}`}>
      {opt.label}
    </span>
  );
};

// ─── Helper: inline toast ─────────────────────────────────────────────────────

const ToastBar = ({ toast }) => {
  if (!toast) return null;
  const isError = toast.type === 'error';
  return (
    <div
      className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-lg shadow-xl text-white transition-all ${
        isError ? 'bg-red-500' : 'bg-emerald-600'
      }`}
    >
      {isError ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
      <span className="font-medium">{toast.message}</span>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const Admin = () => {
  const { userRole } = useAuth();

  // ── Tab state ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('overview');

  // ── Overview data (inquiries + users + messages) ────────────────────────
  const [allInquiries, setAllInquiries] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allMessages, setAllMessages] = useState([]);
  const [overviewLoading, setOverviewLoading] = useState(true);

  // ── Admin product list (all statuses) ──────────────────────────────────────
  const {
    products: adminProducts,
    loading: productsLoading,
    refetch: refetchProducts,
  } = useAdminProducts();

  // ── Form state ─────────────────────────────────────────────────────────────
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null); // null | 0-100
  const [formErrors, setFormErrors] = useState({});
  const formRef = useRef(null);

  // ── Toast ──────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Admin product search / filter ─────────────────────────────────────────
  const [adminSearch, setAdminSearch] = useState('');
  const [adminCategoryFilter, setAdminCategoryFilter] = useState('');
  const [adminStatusFilter, setAdminStatusFilter] = useState('');

  // ── Fetch overview data ────────────────────────────────────────────────────
  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const [inquiriesSnap, usersSnap, messagesSnap] = await Promise.all([
          getDocs(collection(db, 'inquiries')),
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'messages')),
        ]);
        setAllInquiries(
          inquiriesSnap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
            createdAt: d.data().createdAt?.toDate?.() || new Date(),
          }))
        );
        setAllUsers(usersSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setAllMessages(
          messagesSnap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
            createdAt: d.data().createdAt?.toDate?.() || new Date(),
          })).sort((a, b) => b.createdAt - a.createdAt)
        );
      } catch (err) {
        console.error('Error fetching overview data:', err);
      } finally {
        setOverviewLoading(false);
      }
    };
    fetchOverview();
  }, []);

  // ── Form helpers ───────────────────────────────────────────────────────────

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear field error on change
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!form.productName.trim()) errors.productName = 'Product name is required';
    if (!form.category) errors.category = 'Category is required';
    if (!form.description.trim()) errors.description = 'Description is required';
    if (!form.usageInstructions.trim())
      errors.usageInstructions = 'Usage instructions are required';
    return errors;
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormErrors({});
    setUploadProgress(null);
  };

  // ── Image upload ───────────────────────────────────────────────────────────

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file', 'error');
      return;
    }

    try {
      setUploadProgress(0);
      const { url, path } = await uploadProductImage(file, (pct) => {
        setUploadProgress(pct);
      });
      setForm((prev) => ({ ...prev, image: url, imagePath: path }));
      setUploadProgress(null);
      showToast('Image uploaded successfully');
    } catch (err) {
      console.error('Image upload failed:', err);
      showToast('Image upload failed. Please try again.', 'error');
      setUploadProgress(null);
    }
  };

  const removeImage = () => {
    setForm((prev) => ({ ...prev, image: '', imagePath: '' }));
  };

  // ── Form submit (add or edit) ──────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormLoading(true);
    try {
      const productData = {
        productName: form.productName.trim(),
        category: form.category,
        shortDescription: form.shortDescription.trim(),
        description: form.description.trim(),
        ingredients: form.ingredients
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        benefits: form.benefits
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        features: form.features
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        productHighlights: form.productHighlights
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        usageInstructions: form.usageInstructions.trim(),
        image: form.image,
        imagePath: form.imagePath,
        featured: form.featured,
        stockStatus: form.stockStatus,
        status: form.status,
      };

      if (editingId) {
        await updateProduct(editingId, productData);
        showToast('Product updated successfully!');
      } else {
        await createProduct(productData);
        showToast('Product added successfully!');
      }

      resetForm();
      refetchProducts();
    } catch (err) {
      console.error('Error saving product:', err);
      showToast('Error saving product. Please try again.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  // ── Edit ───────────────────────────────────────────────────────────────────

  const handleEdit = (product) => {
    setForm({
      productName: product.productName || '',
      category: product.category || '',
      shortDescription: product.shortDescription || '',
      description: product.description || '',
      ingredients: Array.isArray(product.ingredients)
        ? product.ingredients.join(', ')
        : product.ingredients || '',
      benefits: Array.isArray(product.benefits)
        ? product.benefits.join(', ')
        : product.benefits || '',
      features: Array.isArray(product.features)
        ? product.features.join(', ')
        : product.features || '',
      productHighlights: Array.isArray(product.productHighlights)
        ? product.productHighlights.join(', ')
        : product.productHighlights || '',
      usageInstructions: product.usageInstructions || '',
      image: product.image || '',
      imagePath: product.imagePath || '',
      featured: product.featured || false,
      stockStatus: product.stockStatus || 'In Stock',
      status: product.status || 'active',
    });
    setEditingId(product.id);
    setFormErrors({});
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ── Archive ────────────────────────────────────────────────────────────────

  const handleArchive = async (product) => {
    if (
      !window.confirm(
        `Archive "${product.productName}"?\nArchived products are hidden from the public website.`
      )
    )
      return;
    try {
      await archiveProduct(product.id);
      showToast('Product archived');
      refetchProducts();
    } catch (err) {
      console.error('Archive error:', err);
      showToast('Error archiving product', 'error');
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = async (product) => {
    if (
      !window.confirm(
        `Permanently delete "${product.productName}"?\nThis action cannot be undone and will also remove the product image from storage.`
      )
    )
      return;
    try {
      await deleteProduct(product.id, product.imagePath);
      showToast('Product deleted successfully');
      refetchProducts();
    } catch (err) {
      console.error('Delete error:', err);
      showToast('Error deleting product', 'error');
    }
  };

  // ── Update inquiry status ────────────────────────────────────────────────

  const handleUpdateInquiryStatus = async (inquiryId, newStatus) => {
    try {
      await updateDoc(doc(db, 'inquiries', inquiryId), { status: newStatus });
      setAllInquiries((prev) =>
        prev.map((i) => (i.id === inquiryId ? { ...i, status: newStatus } : i))
      );
    } catch (err) {
      console.error('Error updating inquiry status:', err);
      showToast('Error updating status', 'error');
    }
  };

  // ── Delete inquiry ─────────────────────────────────────────────────────────

  const handleDeleteInquiry = async (inquiryId) => {
    if (!window.confirm('Delete this inquiry?')) return;
    try {
      await deleteDoc(doc(db, 'inquiries', inquiryId));
      setAllInquiries((prev) => prev.filter((i) => i.id !== inquiryId));
      showToast('Inquiry deleted');
    } catch (err) {
      console.error('Error deleting inquiry:', err);
      showToast('Error deleting inquiry', 'error');
    }
  };

  // ── Filtered admin product list ────────────────────────────────────────────

  const filteredAdminProducts = adminProducts.filter((p) => {
    const matchName =
      !adminSearch ||
      p.productName?.toLowerCase().includes(adminSearch.toLowerCase());
    const matchCat = !adminCategoryFilter || p.category === adminCategoryFilter;
    const matchStatus = !adminStatusFilter || p.status === adminStatusFilter;
    return matchName && matchCat && matchStatus;
  });

  // ── Access denied guard ────────────────────────────────────────────────────

  if (!userRole || userRole !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Access Denied</h2>
          <p className="text-slate-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const stats = [
    {
      icon: <Package size={24} />,
      label: 'Total Products',
      value: adminProducts.length,
      bg: 'bg-blue-100',
      text: 'text-blue-600',
    },
    {
      icon: <Users size={24} />,
      label: 'Total Users',
      value: allUsers.length,
      bg: 'bg-green-100',
      text: 'text-green-600',
    },
    {
      icon: <MessageSquare size={24} />,
      label: 'Total Inquiries',
      value: allInquiries.length,
      bg: 'bg-purple-100',
      text: 'text-purple-600',
    },
    {
      icon: <BarChart3 size={24} />,
      label: 'Categories',
      value: 4,
      bg: 'bg-orange-100',
      text: 'text-orange-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      {/* Toast notification */}
      <ToastBar toast={toast} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <h1 className="text-4xl font-bold text-slate-900 mb-8">Admin Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow-md p-6">
              <div
                className={`${stat.bg} w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${stat.text}`}
              >
                {stat.icon}
              </div>
              <p className="text-sm text-slate-600 mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'products', label: 'Manage Products' },
            { id: 'inquiries', label: `Inquiries (${allInquiries.length})` },
            { id: 'messages', label: `Messages (${allMessages.length})` },
            { id: 'users', label: 'Users' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-2 rounded-lg font-semibold transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-slate-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Overview</h2>
            <div className="space-y-4">
              <p className="text-slate-600">
                📊 Total Products:{' '}
                <span className="font-bold">{adminProducts.length}</span>
              </p>
              <p className="text-slate-600">
                🟢 Active:{' '}
                <span className="font-bold">
                  {adminProducts.filter((p) => p.status === 'active').length}
                </span>
              </p>
              <p className="text-slate-600">
                📦 Archived:{' '}
                <span className="font-bold">
                  {adminProducts.filter((p) => p.status === 'archived').length}
                </span>
              </p>
              <p className="text-slate-600">
                ⭐ Featured:{' '}
                <span className="font-bold">
                  {adminProducts.filter((p) => p.featured).length}
                </span>
              </p>
              <p className="text-slate-600">
                👥 Registered Users:{' '}
                <span className="font-bold">{allUsers.length}</span>
              </p>
              <p className="text-slate-600">
                💬 Pending Inquiries:{' '}
                <span className="font-bold">{allInquiries.length}</span>
              </p>
              <p className="text-slate-600">
                🏢 Product Categories: <span className="font-bold">4</span>
              </p>
            </div>
            
          </div>
        )}

        {/* ── PRODUCTS TAB ── */}
        {activeTab === 'products' && (
          <div className="space-y-8">

            {/* ─ Add / Edit Form ─ */}
            <div className="bg-white rounded-lg shadow-md p-8" ref={formRef}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  {editingId ? <Pencil size={22} /> : <Plus size={22} />}
                  {editingId ? 'Edit Product' : 'Add New Product'}
                </h2>
                {editingId && (
                  <button
                    onClick={resetForm}
                    className="flex items-center gap-1 text-slate-500 hover:text-slate-700 text-sm font-medium"
                  >
                    <X size={16} /> Cancel Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Row 1: Name + Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      name="productName"
                      value={form.productName}
                      onChange={handleFormChange}
                      placeholder="e.g. Herbal Face Wash"
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 ${
                        formErrors.productName ? 'border-red-400' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.productName && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.productName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Category *
                    </label>
                    <select
                      name="category"
                      value={form.category}
                      onChange={handleFormChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 ${
                        formErrors.category ? 'border-red-400' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select Category</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    {formErrors.category && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.category}</p>
                    )}
                  </div>
                </div>

                {/* Short Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Short Description
                  </label>
                  <input
                    type="text"
                    name="shortDescription"
                    value={form.shortDescription}
                    onChange={handleFormChange}
                    placeholder="One-line product summary"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                {/* Full Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Full Description *
                  </label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleFormChange}
                    rows={3}
                    placeholder="Detailed product description"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 ${
                      formErrors.description ? 'border-red-400' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.description && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>
                  )}
                </div>

                {/* Ingredients + Benefits */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Ingredients{' '}
                      <span className="text-slate-400 font-normal">(comma-separated)</span>
                    </label>
                    <input
                      type="text"
                      name="ingredients"
                      value={form.ingredients}
                      onChange={handleFormChange}
                      placeholder="Neem, Aloe Vera, Turmeric"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Benefits{' '}
                      <span className="text-slate-400 font-normal">(comma-separated)</span>
                    </label>
                    <input
                      type="text"
                      name="benefits"
                      value={form.benefits}
                      onChange={handleFormChange}
                      placeholder="Acne Care, Hydration, Skin Care"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                {/* Features + Highlights */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Features{' '}
                      <span className="text-slate-400 font-normal">(comma-separated)</span>
                    </label>
                    <input
                      type="text"
                      name="features"
                      value={form.features}
                      onChange={handleFormChange}
                      placeholder="Paraben Free, Vegan, Organic"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Product Highlights{' '}
                      <span className="text-slate-400 font-normal">(comma-separated)</span>
                    </label>
                    <input
                      type="text"
                      name="productHighlights"
                      value={form.productHighlights}
                      onChange={handleFormChange}
                      placeholder="Deep Cleansing, Natural Ingredients"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                {/* Usage Instructions */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Usage Instructions *
                  </label>
                  <input
                    type="text"
                    name="usageInstructions"
                    value={form.usageInstructions}
                    onChange={handleFormChange}
                    placeholder="Apply on wet face, massage gently..."
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 ${
                      formErrors.usageInstructions ? 'border-red-400' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.usageInstructions && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.usageInstructions}
                    </p>
                  )}
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Product Image
                  </label>

                  {/* Preview */}
                  {form.image ? (
                    <div className="flex items-center gap-4 mb-3">
                      <img
                        src={form.image}
                        alt="Preview"
                        className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="flex items-center gap-1 text-red-600 text-sm font-medium hover:text-red-700"
                      >
                        <X size={16} /> Remove Image
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <label
                        htmlFor="image-upload"
                        className="flex items-center gap-2 cursor-pointer bg-white border-2 border-dashed border-gray-300 rounded-lg px-6 py-4 text-slate-600 hover:border-emerald-500 hover:text-emerald-600 transition"
                      >
                        <Upload size={20} />
                        <span className="text-sm font-medium">
                          {uploadProgress !== null
                            ? `Uploading… ${uploadProgress}%`
                            : 'Choose Image'}
                        </span>
                      </label>
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploadProgress !== null}
                      />
                    </div>
                  )}

                  {/* Upload Progress Bar */}
                  {uploadProgress !== null && (
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-emerald-600 h-2 rounded-full transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Status Row: Stock Status + Status + Featured */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Stock Status
                    </label>
                    <select
                      name="stockStatus"
                      value={form.stockStatus}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    >
                      {STOCK_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Status
                    </label>
                    <select
                      name="status"
                      value={form.status}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-3 pb-2">
                    <input
                      type="checkbox"
                      id="featured"
                      name="featured"
                      checked={form.featured}
                      onChange={handleFormChange}
                      className="w-5 h-5 text-emerald-600 rounded cursor-pointer"
                    />
                    <label
                      htmlFor="featured"
                      className="text-sm font-medium text-slate-700 cursor-pointer"
                    >
                      ⭐ Featured Product
                    </label>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={formLoading || uploadProgress !== null}
                  className="w-full bg-emerald-600 text-white font-semibold py-3 rounded-lg hover:bg-emerald-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingId ? <Pencil size={18} /> : <Plus size={18} />}
                  {formLoading
                    ? editingId
                      ? 'Updating…'
                      : 'Adding…'
                    : editingId
                    ? 'Update Product'
                    : 'Add Product'}
                </button>
              </form>
            </div>

            {/* ─ Admin Product Search / Filter ─ */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex flex-col md:flex-row gap-3">
                <input
                  type="text"
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                  placeholder="Search products by name…"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
                <select
                  value={adminCategoryFilter}
                  onChange={(e) => setAdminCategoryFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="">All Categories</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <select
                  value={adminStatusFilter}
                  onChange={(e) => setAdminStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="">All Statuses</option>
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* ─ Product List ─ */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">
                  Products ({filteredAdminProducts.length}
                  {filteredAdminProducts.length !== adminProducts.length
                    ? ` of ${adminProducts.length}`
                    : ''}
                  )
                </h3>
                {productsLoading && (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600" />
                )}
              </div>

              {productsLoading ? (
                <div className="p-8 text-center text-slate-500">Loading products…</div>
              ) : filteredAdminProducts.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  {adminProducts.length === 0
                    ? 'No products yet. Add your first product above!'
                    : 'No products match your search/filter.'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">
                          Product
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">
                          Category
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">
                          Status
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">
                          Featured
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">
                          Created
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAdminProducts.map((product) => (
                        <tr key={product.id} className="border-t hover:bg-gray-50">
                          {/* Product Name + Thumbnail */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {product.image ? (
                                <img
                                  src={product.image}
                                  alt={product.productName}
                                  className="w-10 h-10 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0 text-lg">
                                  📦
                                </div>
                              )}
                              <span className="font-medium text-slate-900 text-sm">
                                {product.productName}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-600">
                            {product.category}
                          </td>
                          <td className="py-3 px-4">
                            <StatusBadge status={product.status} />
                          </td>
                          <td className="py-3 px-4 text-center">
                            {product.featured ? (
                              <span className="text-yellow-500 text-lg">⭐</span>
                            ) : (
                              <span className="text-gray-300">–</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-500">
                            {product.createdAt?.toDate?.()?.toLocaleDateString?.() || '—'}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEdit(product)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="Edit"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                onClick={() => handleArchive(product)}
                                disabled={product.status === 'archived'}
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Archive"
                              >
                                <Archive size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(product)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── INQUIRIES TAB ── */}
        {activeTab === 'inquiries' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-bold text-slate-900">Product Inquiries</h3>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600">Name</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600">Email</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600">Product</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600">City</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600">Date</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600">Status</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
          {allInquiries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No inquiries yet.
                    </td>
                  </tr>
                ) : (
                  allInquiries.map((inquiry) => {
                    const statusColors = {
                      pending: 'bg-yellow-100 text-yellow-700',
                      contacted: 'bg-blue-100 text-blue-700',
                      resolved: 'bg-green-100 text-green-700',
                      closed: 'bg-gray-100 text-gray-600',
                    };
                    const statusColor = statusColors[inquiry.status || 'pending'] || statusColors.pending;
                    return (
                      <tr key={inquiry.id} className="border-b hover:bg-gray-50">
                        <td className="py-4 px-6">{inquiry.name}</td>
                        <td className="py-4 px-6 text-sm">{inquiry.email}</td>
                        <td className="py-4 px-6 text-sm font-medium">{inquiry.productName}</td>
                        <td className="py-4 px-6 text-sm">{inquiry.city}</td>
                        <td className="py-4 px-6 text-sm">{inquiry.createdAt.toLocaleDateString()}</td>
                        <td className="py-4 px-6">
                          <select
                            value={inquiry.status || 'pending'}
                            onChange={(e) => handleUpdateInquiryStatus(inquiry.id, e.target.value)}
                            className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer focus:ring-2 focus:ring-emerald-500 ${statusColor}`}
                          >
                            <option value="pending">Pending</option>
                            <option value="contacted">Contacted</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                          </select>
                        </td>
                        <td className="py-4 px-6">
                          <button
                            onClick={() => handleDeleteInquiry(inquiry.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            </div>
          </div>
        )}

        {/* ── MESSAGES TAB ── */}
        {activeTab === 'messages' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-bold text-slate-900">Contact Form Messages</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600">Name</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600">Email</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600">Subject</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600">Message</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {allMessages.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">No messages yet.</td>
                    </tr>
                  ) : (
                    allMessages.map((msg) => (
                      <tr key={msg.id} className="border-b hover:bg-gray-50">
                        <td className="py-4 px-6 font-medium text-slate-900">{msg.name}</td>
                        <td className="py-4 px-6 text-sm text-slate-600">{msg.email}</td>
                        <td className="py-4 px-6 text-sm text-slate-700">{msg.subject}</td>
                        <td className="py-4 px-6 text-sm text-slate-600 max-w-xs truncate" title={msg.message}>{msg.message}</td>
                        <td className="py-4 px-6 text-sm text-slate-500">{msg.createdAt.toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── USERS TAB ── */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left py-4 px-6">Name</th>
                  <th className="text-left py-4 px-6">Email</th>
                  <th className="text-left py-4 px-6">Role</th>
                  <th className="text-left py-4 px-6">Joined</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">
                      No users yet.
                    </td>
                  </tr>
                ) : (
                  allUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-6">{user.name}</td>
                      <td className="py-4 px-6">{user.email}</td>
                      <td className="py-4 px-6 capitalize">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            user.role === 'admin'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm">
                        {user.createdAt?.toDate?.()?.toLocaleDateString?.() || 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
