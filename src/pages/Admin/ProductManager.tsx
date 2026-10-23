import React, { useState, useEffect } from 'react';
import { productApi } from '../../lib/api/productApi';
import type { Product, ProductCategory } from '../../lib/api/productApi';
import { uploadApi } from '../../lib/api/uploadApi';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle,
  X,
  Upload,
  Image as ImageIcon,
  DollarSign,
  Tag,
  Layers,
  Sparkles,
} from 'lucide-react';

export interface ProductManagerProps {
  createTrigger?: number;
}

export const ProductManager: React.FC<ProductManagerProps> = ({ createTrigger }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form State - strictly Product Name, Price, Quantity, Description, Images, Availability
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('10');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (createTrigger && createTrigger > 0) {
      openAddModal();
    }
  }, [createTrigger]);

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash.includes('create=true')) {
        openAddModal();
      } else if (hash.includes('edit=')) {
        const match = hash.match(/edit=([^&]+)/);
        if (match && match[1]) {
          const prodId = match[1];
          productApi.getProductById(prodId).then((res) => {
            if (res.success && res.data) {
              openEditModal(res.data);
            }
          }).catch(console.error);
        }
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  useEffect(() => {
    loadProducts();
  }, [search]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await productApi.adminGetProducts({
        search: search.trim() || undefined,
      });
      if (res.success && res.data) {
        setProducts(res.data);
      }
    } catch (err) {
      console.error('Failed to load products', err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setName('');
    setPrice('');
    setStockQuantity('10');
    setDescription('');
    setImages([]);
    setNewImageUrl('');
    setIsActive(true);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setName(prod.name);
    setPrice(prod.price.toString());
    setStockQuantity(prod.stockQuantity.toString());
    setDescription(prod.description);
    setImages(prod.images || []);
    setNewImageUrl('');
    setIsActive(prod.isActive);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          const url = await uploadApi.uploadImage(base64, file.name);
          if (url && typeof url === 'string') {
            setImages((prev) => [...prev, url]);
          } else {
            alert('Failed to process uploaded image.');
          }
        } catch (uploadErr: any) {
          console.error('Upload failed:', uploadErr);
          alert(uploadErr?.message || 'Image upload failed');
        } finally {
          setUploadingImage(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Image upload failed', err);
      setUploadingImage(false);
    }
  };

  const handleAddImageUrl = () => {
    if (newImageUrl.trim()) {
      setImages((prev) => [...prev, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Product name is required');
      return;
    }
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      setFormError('Valid price is required');
      return;
    }
    const numQty = parseInt(stockQuantity, 10);
    if (isNaN(numQty) || numQty < 0) {
      setFormError('Valid quantity is required');
      return;
    }

    try {
      setSaving(true);
      const generatedSlug = name
        .trim()
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-');
      const generatedSku = `PRD-${Date.now().toString().slice(-6)}`;

      const payload: any = {
        name: name.trim(),
        slug: editingProduct?.slug || generatedSlug,
        price: numPrice,
        stockQuantity: numQty,
        sku: editingProduct?.sku || generatedSku,
        description: description.trim() || `${name.trim()} - Official JADMAA equipment.`,
        images,
        isActive,
      };

      if (editingProduct) {
        const res = await productApi.updateProduct(editingProduct.id, payload);
        if (!res.success) {
          throw new Error((res as any)?.error?.message || 'Failed to update product');
        }
      } else {
        const res = await productApi.createProduct(payload);
        if (!res.success) {
          throw new Error((res as any)?.error?.message || 'Failed to create product');
        }
      }

      setIsModalOpen(false);
      loadProducts();
    } catch (err: any) {
      console.error('Error saving product', err);
      setFormError(err?.message || 'An error occurred while saving product');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (prod: Product) => {
    if (!window.confirm(`Are you sure you want to delete "${prod.name}"?`)) return;

    try {
      const res = await productApi.deleteProduct(prod.id);
      if (res.success) {
        alert(res.message || 'Product deleted or deactivated');
        loadProducts();
      }
    } catch (err: any) {
      console.error('Failed to delete product', err);
      alert(err?.message || 'Failed to delete product');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Bar: Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <h2 className="text-xl font-heading font-extrabold text-jadmaa-charcoal">
            Product Management
          </h2>
          <p className="text-xs text-gray-500">
            Create, edit, manage store items, set prices, and control stock availability.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-5 py-2.5 bg-jadmaa-red hover:bg-[#8C1E1E] text-white text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 shadow-sm hover:shadow cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Create Product</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search products by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-jadmaa-red"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-xs text-gray-400">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="py-14 px-6 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-3">
              <Package className="w-8 h-8 text-jadmaa-red" />
            </div>
            <h3 className="text-base font-bold text-gray-800">No products in catalog</h3>
            <p className="text-xs text-gray-500 max-w-sm mt-1 mb-5">
              Add your martial arts gear, uniforms, weapons, or accessories to make them available in the store.
            </p>
            <button
              onClick={openAddModal}
              className="px-6 py-3 bg-jadmaa-red hover:bg-[#8C1E1E] text-white text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 shadow-md hover:shadow-lg cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Create Product</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4">Quantity (In Stock)</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p) => {
                  const isOutOfStock = p.stockQuantity <= 0;

                  return (
                    <tr key={p.id} className="hover:bg-gray-50/60 transition">
                      {/* Product Thumbnail & Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0">
                            {p.images && p.images[0] ? (
                              <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-5 h-5 m-auto text-gray-300" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 line-clamp-1">{p.name}</p>
                          </div>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4 font-bold text-gray-900">
                        ₹{p.price.toLocaleString('en-IN')}
                      </td>

                      {/* Stock Quantity */}
                      <td className="py-3 px-4">
                        <span
                          className={`font-extrabold ${
                            isOutOfStock ? 'text-red-600' : 'text-emerald-700'
                          }`}
                        >
                          {p.stockQuantity} units
                        </span>
                        {isOutOfStock ? (
                          <span className="ml-2 bg-red-50 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded border border-red-200">
                            Out of Stock
                          </span>
                        ) : null}
                      </td>

                      {/* Active Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {p.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 text-gray-500 hover:text-jadmaa-red hover:bg-gray-100 rounded-lg transition cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 w-full max-w-xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-jadmaa-cream/50">
              <h3 className="font-heading font-extrabold text-base text-gray-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveProduct} className="p-6 overflow-y-auto space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-200">
                  {formError}
                </div>
              )}

              {/* Product Name */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Protein Powder / Master Uniform"
                  required
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-jadmaa-red text-sm"
                />
              </div>

              {/* Price & Quantity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. 1499"
                    required
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-jadmaa-red text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Quantity (Stock) *</label>
                  <input
                    type="number"
                    min="0"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    placeholder="e.g. 10"
                    required
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-jadmaa-red text-sm font-semibold"
                  />
                </div>
              </div>

              {/* Product Images */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">Product Images</label>
                
                {/* Upload or Add URL */}
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="Paste image URL (https://...)"
                    className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl cursor-pointer"
                  >
                    Add URL
                  </button>
                  <label className="px-3 py-2 bg-jadmaa-cream hover:bg-amber-100/70 border border-amber-200 text-amber-900 font-bold rounded-xl cursor-pointer flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingImage ? 'Uploading...' : 'Upload File'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                  </label>
                </div>

                {/* Image Thumbnails */}
                {images.length > 0 && (
                  <div className="flex gap-2 flex-wrap pt-1">
                    {images.map((img, i) => (
                      <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 group">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(i)}
                          className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">Product Description *</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detail the materials, sizing, purpose, and highlights of this item..."
                  required
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-jadmaa-red"
                />
              </div>

              {/* Is Active */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-jadmaa-red rounded"
                />
                <label htmlFor="isActive" className="font-bold text-gray-800 cursor-pointer">
                  Available for user purchase on website
                </label>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-jadmaa-red hover:bg-red-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
