import React from 'react';

export const LoadingSpinner = () => {
  return (
    <div className="flex justify-center items-center p-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
    </div>
  );
};

export const SkeletonLoader = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
          <div className="bg-gray-200 h-6 rounded mb-2"></div>
          <div className="bg-gray-200 h-4 rounded w-3/4"></div>
        </div>
      ))}
    </div>
  );
};

export const Toast = ({ message, type = 'success' }) => {
  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  return (
    <div className={`${bgColor} text-white px-4 py-3 rounded-lg shadow-lg`}>
      {message}
    </div>
  );
};
