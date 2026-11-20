import React, { useState, useEffect } from 'react';
import { X, Plus, Image as ImageIcon, Check } from 'lucide-react';
import { Product } from '../../types';

interface AddEditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Partial<Product>) => void;
  productToEdit?: Product | null;
}

export const AddEditProductModal: React.FC<AddEditProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  productToEdit
}) => {
  const [name, setName] = useState('');
  const [localName, setLocalName] = useState('');
  const [category, setCategory] = useState('Vegetables');
  const [price, setPrice] = useState<number>(30);
  const [originalPrice, setOriginalPrice] = useState<number>(45);
  const [unit, setUnit] = useState('1 kg');
  const [stock, setStock] = useState<number>(50);
  const [inStock, setInStock] = useState(true);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const imagePresets = [
    { label: 'Tomatoes', url: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400&auto=format&fit=crop&q=80' },
    { label: 'Bananas', url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&auto=format&fit=crop&q=80' },
    { label: 'Potatoes', url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&auto=format&fit=crop&q=80' },
    { label: 'Milk Pouch', url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&auto=format&fit=crop&q=80' },
    { label: 'Onions', url: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400&auto=format&fit=crop&q=80' },
    { label: 'Dooars Tea', url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&auto=format&fit=crop&q=80' },
    { label: 'Paneer', url: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&auto=format&fit=crop&q=80' },
    { label: 'Mustard Oil', url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&auto=format&fit=crop&q=80' },
    { label: 'Rice', url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&auto=format&fit=crop&q=80' },
    { label: 'Apples / Fruits', url: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&auto=format&fit=crop&q=80' }
  ];

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setLocalName(productToEdit.localName || '');
      setCategory(productToEdit.category);
      setPrice(productToEdit.price);
      setOriginalPrice(productToEdit.originalPrice || Math.round(productToEdit.price * 1.3));
      setUnit(productToEdit.unit);
      setStock(productToEdit.stock !== undefined ? productToEdit.stock : 25);
      setInStock(productToEdit.inStock !== false);
      setDescription(productToEdit.description || '');
      setImageUrl(productToEdit.image || imagePresets[0].url);
    } else {
      setName('');
      setLocalName('');
      setCategory('Vegetables');
      setPrice(30);
      setOriginalPrice(45);
      setUnit('1 kg');
      setStock(50);
      setInStock(true);
      setDescription('');
      setImageUrl(imagePresets[0].url);
    }
    setFormError(null);
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Please enter a product name.');
      return;
    }
    setFormError(null);

    onSave({
      name: name.trim(),
      localName: localName.trim() || undefined,
      category,
      price: Number(price),
      originalPrice: Number(originalPrice) || undefined,
      unit,
      stock: Number(stock),
      inStock,
      isAvailable: inStock,
      description: description.trim() || undefined,
      image: imageUrl || imagePresets[0].url,
      rating: productToEdit?.rating || 4.8
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 my-8">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">
            {productToEdit ? 'Edit Product' : 'Add New Product'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold px-3 py-2 rounded-xl">
              {formError}
            </div>
          )}
          {/* Product Name */}
          <div>
            <label className="text-[11px] font-bold text-gray-700 block mb-1">Product Title</label>
            <input
              type="text"
              placeholder="e.g. Fresh Red Tomatoes"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-gray-50 border border-gray-200 text-xs sm:text-sm rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-[#0E7438]"
            />
          </div>

          {/* Local Name */}
          <div>
            <label className="text-[11px] font-bold text-gray-700 block mb-1">Regional / Local Name (Hindi / Bengali)</label>
            <input
              type="text"
              placeholder="e.g. Tamatar / টমেটো"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-xs sm:text-sm rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-[#0E7438]"
            />
          </div>

          {/* Category & Unit */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5 font-semibold"
              >
                <option value="Vegetables">Vegetables</option>
                <option value="Fruits">Fruits</option>
                <option value="Dairy">Dairy</option>
                <option value="Staples">Staples & Grains</option>
                <option value="Beverages">Tea & Beverages</option>
                <option value="Household">Household</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5 font-semibold"
              >
                <option value="1 kg">1 kg</option>
                <option value="500 g">500 g</option>
                <option value="250 g">250 g</option>
                <option value="1 L">1 L</option>
                <option value="500 ml">500 ml</option>
                <option value="1 pc">1 pc</option>
                <option value="1 pack">1 pack</option>
              </select>
            </div>
          </div>

          {/* Pricing & Stock */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">Selling Price (₹)</label>
              <input
                type="number"
                min="1"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                required
                className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5 font-bold"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">MRP Price (₹)</label>
              <input
                type="number"
                min="1"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5 font-semibold"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">Stock Units</label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5 font-semibold"
              />
            </div>
          </div>

          {/* Availability Toggle */}
          <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
            <div>
              <span className="text-xs font-bold text-gray-900 block">Product Availability</span>
              <span className="text-[10px] text-gray-500">Allow customers to add this item to cart</span>
            </div>
            <button
              type="button"
              onClick={() => setInStock(!inStock)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                inStock ? 'bg-[#0E7438] justify-end' : 'bg-gray-300 justify-start'
              }`}
            >
              <span className="bg-white w-4 h-4 rounded-full shadow-md" />
            </button>
          </div>

          {/* Image Presets & URL */}
          <div>
            <label className="text-[11px] font-bold text-gray-700 block mb-1">
              Product Photo Presets or Custom Image
            </label>
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
              {imagePresets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setImageUrl(preset.url)}
                  className={`relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                    imageUrl === preset.url ? 'border-[#0E7438] scale-105 shadow-xs' : 'border-gray-200 opacity-80 hover:opacity-100'
                  }`}
                >
                  <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                  {imageUrl === preset.url && (
                    <div className="absolute inset-0 bg-[#0E7438]/40 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-1.5">
              <input
                type="url"
                placeholder="Or paste custom image URL"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-[11px] rounded-xl p-2 font-mono"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] font-bold text-gray-700 block mb-1">Description (Optional)</label>
            <textarea
              placeholder="Fresh harvested produce from Kalchini local farms..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2 font-medium"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-1/2 py-2.5 bg-[#0E7438] hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs"
            >
              {productToEdit ? 'Update Product' : 'Add to Inventory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
