import React from 'react';
import { ChevronDown } from 'lucide-react';
import { allIngredients, allFeatures, allBenefits } from '../../data/products';

export const FilterPanel = ({ onFilterChange, selectedFilters = {} }) => {
  const [expandedSections, setExpandedSections] = React.useState({
    ingredients: true,
    features: true,
    benefits: true,
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleFilterChange = (filterType, value) => {
    const current = selectedFilters[filterType] || [];
    let updated;

    if (current.includes(value)) {
      updated = current.filter(item => item !== value);
    } else {
      updated = [...current, value];
    }

    onFilterChange({
      ...selectedFilters,
      [filterType]: updated
    });
  };

  const FilterSection = ({ title, type, items }) => (
    <div className="border-b">
      <button
        onClick={() => toggleSection(type)}
        className="w-full flex items-center justify-between py-3 px-4 hover:bg-gray-50"
      >
        <h3 className="font-semibold text-slate-800">{title}</h3>
        <ChevronDown
          size={18}
          className={`text-gray-600 transition ${expandedSections[type] ? 'rotate-180' : ''}`}
        />
      </button>

      {expandedSections[type] && (
        <div className="px-4 pb-3 space-y-2">
          {items.map(item => (
            <label key={item} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={(selectedFilters[type] || []).includes(item)}
                onChange={() => handleFilterChange(type, item)}
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <span className="text-sm text-slate-700">{item}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-4 border-b">
        <h2 className="text-lg font-bold text-slate-800">Filters</h2>
      </div>

      <FilterSection title="Ingredients" type="ingredients" items={allIngredients} />
      <FilterSection title="Features" type="features" items={allFeatures} />
      <FilterSection title="Benefits" type="benefits" items={allBenefits} />

      {/* Clear Filters Button */}
      {Object.values(selectedFilters).some(arr => arr && arr.length > 0) && (
        <div className="p-4">
          <button
            onClick={() => onFilterChange({})}
            className="w-full py-2 text-emerald-600 border border-emerald-600 rounded-lg hover:bg-emerald-50 transition font-medium"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
};
