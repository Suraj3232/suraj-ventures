import React, { useState } from 'react';
import { Search } from 'lucide-react';

export const SearchBar = ({ onSearch, placeholder = "Search by ingredient or benefit...", initialValue = '' }) => {
  const [searchTerm, setSearchTerm] = useState(initialValue);

  // Sync when initialValue changes (e.g. from URL param)
  React.useEffect(() => {
    setSearchTerm(initialValue);
  }, [initialValue]);

  const handleChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          value={searchTerm}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
        />
      </div>
    </div>
  );
};
