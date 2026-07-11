import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ProductCard } from '../components/ProductCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { db } from '../firebase/config';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getProductsByIds } from '../services/productService';
import { User, Heart, MessageSquare } from 'lucide-react';

export const Dashboard = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [userData, setUserData] = useState(null);
  const [savedProducts, setSavedProducts] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;

      try {
        // Fetch user profile from Firestore
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);

          // Resolve saved product IDs → full product objects from Firestore
          const savedIds = data.savedProducts || [];
          if (savedIds.length > 0) {
            const resolved = await getProductsByIds(savedIds);
            setSavedProducts(resolved);
          } else {
            setSavedProducts([]);
          }
        }

        // Fetch user's own inquiries
        const inquiriesQuery = query(
          collection(db, 'inquiries'),
          where('userId', '==', currentUser.uid)
        );
        const inquiriesSnap = await getDocs(inquiriesQuery);
        const inquiriesList = inquiriesSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          createdAt: d.data().createdAt?.toDate?.() || new Date(),
        }));
        setInquiries(inquiriesList.sort((a, b) => b.createdAt - a.createdAt));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
              <User size={32} className="text-emerald-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {userData?.name || 'User'}
              </h1>
              <p className="text-slate-600">{currentUser?.email}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 overflow-x-auto">
          {[
            { id: 'profile', icon: <User size={20} />, label: 'Profile' },
            { id: 'favorites', icon: <Heart size={20} />, label: 'Saved Products' },
            { id: 'inquiries', icon: <MessageSquare size={20} />, label: 'My Inquiries' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-slate-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}

        {/* Profile */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Profile Information</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600">Full Name</label>
                <p className="text-lg text-slate-900">{userData?.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Email Address</label>
                <p className="text-lg text-slate-900">{currentUser?.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Role</label>
                <p className="text-lg text-slate-900 capitalize">{userData?.role || 'User'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Member Since</label>
                <p className="text-lg text-slate-900">
                  {userData?.createdAt?.toDate?.()?.toLocaleDateString?.() || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Saved Products */}
        {activeTab === 'favorites' && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">My Saved Products</h2>
            {savedProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} isSaved={true} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <Heart size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-2xl font-bold text-slate-800 mb-2">No Saved Products</h3>
                <p className="text-slate-600">
                  You haven't saved any products yet. Start exploring!
                </p>
              </div>
            )}
          </div>
        )}

        {/* My Inquiries */}
        {activeTab === 'inquiries' && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">My Inquiries</h2>
            {inquiries.length > 0 ? (
              <div className="space-y-4">
                {inquiries.map((inquiry) => (
                  <div key={inquiry.id} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">
                          {inquiry.productName}
                        </h3>
                        <p className="text-sm text-slate-600">{inquiry.message}</p>
                      </div>
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                        Pending
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-slate-600">Name</p>
                        <p className="font-medium text-slate-900">{inquiry.name}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Email</p>
                        <p className="font-medium text-slate-900">{inquiry.email}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Phone</p>
                        <p className="font-medium text-slate-900">{inquiry.phone}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Date</p>
                        <p className="font-medium text-slate-900">
                          {inquiry.createdAt.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <MessageSquare size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-2xl font-bold text-slate-800 mb-2">No Inquiries Yet</h3>
                <p className="text-slate-600">
                  You haven't sent any inquiries. Explore products and get in touch!
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
