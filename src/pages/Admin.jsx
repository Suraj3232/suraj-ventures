import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp, query, where } from 'firebase/firestore';
import { Plus, Trash2, BarChart3, Package, Users, MessageSquare } from 'lucide-react';
import { products } from '../data/products';

export const Admin = () => {
  const { userRole } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [allInquiries, setAllInquiries] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allProducts, setAllProducts] = useState(products);
  const [loading, setLoading] = useState(true);
  const [newProduct, setNewProduct] = useState({
    productName: '',
    category: '',
    ingredients: '',
    features: '',
    benefits: '',
    description: '',
    usageInstructions: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all inquiries
        const inquiriesSnap = await getDocs(collection(db, 'inquiries'));
        setAllInquiries(inquiriesSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date()
        })));

        // Fetch all users
        const usersSnap = await getDocs(collection(db, 'users'));
        setAllUsers(usersSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })));
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'products'), {
        ...newProduct,
        ingredients: newProduct.ingredients.split(',').map(i => i.trim()),
        features: newProduct.features.split(',').map(f => f.trim()),
        benefits: newProduct.benefits.split(',').map(b => b.trim()),
        createdAt: serverTimestamp()
      });
      setNewProduct({
        productName: '',
        category: '',
        ingredients: '',
        features: '',
        benefits: '',
        description: '',
        usageInstructions: '',
      });
      alert('Product added successfully!');
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Error adding product');
    }
  };

  const handleDeleteInquiry = async (inquiryId) => {
    if (window.confirm('Are you sure you want to delete this inquiry?')) {
      try {
        await deleteDoc(doc(db, 'inquiries', inquiryId));
        setAllInquiries(prev => prev.filter(i => i.id !== inquiryId));
      } catch (error) {
        console.error('Error deleting inquiry:', error);
      }
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <h1 className="text-4xl font-bold text-slate-900 mb-8">Admin Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { icon: <Package size={24} />, label: 'Total Products', value: allProducts.length, bg: 'bg-blue-100', text: 'text-blue-600' },
            { icon: <Users size={24} />, label: 'Total Users', value: allUsers.length, bg: 'bg-green-100', text: 'text-green-600' },
            { icon: <MessageSquare size={24} />, label: 'Total Inquiries', value: allInquiries.length, bg: 'bg-purple-100', text: 'text-purple-600' },
            { icon: <BarChart3 size={24} />, label: 'Categories', value: 4, bg: 'bg-orange-100', text: 'text-orange-600' }
          ].map((stat, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow-md p-6">
              <div className={`${stat.bg} w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${stat.text}`}>
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
            { id: 'inquiries', label: 'Inquiries' },
            { id: 'users', label: 'Users' }
          ].map(tab => (
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

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Overview</h2>
            <div className="space-y-4">
              <p className="text-slate-600">📊 Total Products in Database: <span className="font-bold">{allProducts.length}</span></p>
              <p className="text-slate-600">👥 Registered Users: <span className="font-bold">{allUsers.length}</span></p>
              <p className="text-slate-600">💬 Pending Inquiries: <span className="font-bold">{allInquiries.length}</span></p>
              <p className="text-slate-600">🏢 Product Categories: <span className="font-bold">4</span></p>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-8">
            {/* Add Product Form */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Plus size={24} />
                Add New Product
              </h2>
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Product Name"
                    value={newProduct.productName}
                    onChange={(e) => setNewProduct({...newProduct, productName: e.target.value})}
                    required
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                    required
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select Category</option>
                    <option value="Cosmetics & Personal Care">Cosmetics & Personal Care</option>
                    <option value="Food Products">Food Products</option>
                    <option value="Nutrition & Wellness">Nutrition & Wellness</option>
                    <option value="Health & Wellness">Health & Wellness</option>
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="Ingredients (comma-separated)"
                  value={newProduct.ingredients}
                  onChange={(e) => setNewProduct({...newProduct, ingredients: e.target.value})}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Features (comma-separated)"
                  value={newProduct.features}
                  onChange={(e) => setNewProduct({...newProduct, features: e.target.value})}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Benefits (comma-separated)"
                  value={newProduct.benefits}
                  onChange={(e) => setNewProduct({...newProduct, benefits: e.target.value})}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                <textarea
                  placeholder="Description"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  required
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                <textarea
                  placeholder="Usage Instructions"
                  value={newProduct.usageInstructions}
                  onChange={(e) => setNewProduct({...newProduct, usageInstructions: e.target.value})}
                  required
                  rows="2"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                <button
                  type="submit"
                  className="w-full bg-emerald-600 text-white font-semibold py-2 rounded-lg hover:bg-emerald-700 transition"
                >
                  Add Product
                </button>
              </form>
            </div>

            {/* Products List */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Current Products ({allProducts.length})</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Name</th>
                      <th className="text-left py-3 px-4">Category</th>
                      <th className="text-left py-3 px-4">Ingredients</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allProducts.slice(0, 5).map(product => (
                      <tr key={product.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{product.productName}</td>
                        <td className="py-3 px-4">{product.category}</td>
                        <td className="py-3 px-4 text-sm">{product.ingredients.join(', ')}</td>
                        <td className="py-3 px-4">
                          <button className="text-red-600 hover:text-red-700">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inquiries' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left py-4 px-6">Name</th>
                  <th className="text-left py-4 px-6">Email</th>
                  <th className="text-left py-4 px-6">Product</th>
                  <th className="text-left py-4 px-6">City</th>
                  <th className="text-left py-4 px-6">Date</th>
                  <th className="text-left py-4 px-6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {allInquiries.map(inquiry => (
                  <tr key={inquiry.id} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-6">{inquiry.name}</td>
                    <td className="py-4 px-6">{inquiry.email}</td>
                    <td className="py-4 px-6">{inquiry.productName}</td>
                    <td className="py-4 px-6">{inquiry.city}</td>
                    <td className="py-4 px-6 text-sm">{inquiry.createdAt.toLocaleDateString()}</td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleDeleteInquiry(inquiry.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

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
                {allUsers.map(user => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-6">{user.name}</td>
                    <td className="py-4 px-6">{user.email}</td>
                    <td className="py-4 px-6 capitalize">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        user.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm">{user.createdAt?.toDate?.()?.toLocaleDateString?.() || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
