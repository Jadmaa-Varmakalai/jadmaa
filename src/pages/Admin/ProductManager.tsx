import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { productApi } from '../../lib/api/productApi';
import type { Product, ProductCategory } from '../../lib/api/productApi';
import { uploadApi } from '../../lib/api/uploadApi';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Upload,
  Layers,
  BookOpen,
} from 'lucide-react';

export interface ProductManagerProps {
  createTrigger?: number;
}

export const ProductManager: React.FC<ProductManagerProps> = ({ createTrigger }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form State - Product Name, Category, Price, Quantity, Description, Images, Availability
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('10');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState('');

  // Digital eBook / File Delivery State
  const [isDigital, setIsDigital] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [fileType, setFileType] = useState<'rar' | 'zip' | 'pdf' | string>('rar');
  const [fileSize, setFileSize] = useState('');
  const [fileName, setFileName] = useState('');
  const [uploadingEbook, setUploadingEbook] = useState(false);

  const productImageInputRef = useRef<HTMLInputElement>(null);
  const ebookInputRef = useRef<HTMLInputElement>(null);

  // Inline Category Creation State
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creatingCategoryLoading, setCreatingCategoryLoading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await productApi.getCategories(true);
      if (res.success && res.data) {
        setCategories(res.data);
      }
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

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
    setCategoryId(categories[0]?.id || '');
    setIsCreatingCategory(false);
    setNewCategoryName('');
    setPrice('');
    setStockQuantity('10');
    setDescription('');
    setImages([]);
    setNewImageUrl('');
    setIsActive(true);
    setFormError('');
    setIsDigital(false);
    setDownloadUrl('');
    setFileType('rar');
    setFileSize('');
    setFileName('');
    setUploadingEbook(false);
    setIsModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setName(prod.name);
    setCategoryId(prod.categoryId || (prod.category as any)?.id || categories[0]?.id || '');
    setIsCreatingCategory(false);
    setNewCategoryName('');
    setPrice(prod.price.toString());
    setStockQuantity(prod.stockQuantity.toString());
    setDescription(prod.description);
    setImages(prod.images || []);
    setNewImageUrl('');
    setIsActive(prod.isActive);
    setFormError('');
    const isEbookCat = Boolean(
      prod.category?.name?.toLowerCase().includes('book') ||
      (prod.category as any)?.slug?.includes('book')
    );
    setIsDigital(Boolean(prod.isDigital || isEbookCat));
    setDownloadUrl(prod.downloadUrl || '');
    setFileType(prod.fileType || 'rar');
    setFileSize(prod.fileSize || '');
    setFileName(prod.fileName || '');
    setUploadingEbook(false);
    setIsModalOpen(true);
  };

  const processEbookFile = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['rar', 'zip', 'pdf'].includes(ext || '')) {
      alert('Only .rar, .zip, and .pdf formats are supported.');
      return;
    }

    try {
      setUploadingEbook(true);
      const res = await productApi.uploadEbookFile(file);
      if (res.success && res.data) {
        setDownloadUrl(res.data.fileUrl);
        setFileName(res.data.fileName);
        setFileSize(res.data.fileSize);
        setFileType(res.data.fileType as any);
      } else {
        alert(res.error?.message || 'Failed to upload eBook file.');
      }
    } catch (err: any) {
      console.error('Failed to upload eBook file:', err);
      alert(err?.message || 'Failed to upload eBook file');
    } finally {
      setUploadingEbook(false);
    }
  };

  const processProductImageFile = async (file: File) => {
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

  const handleCreateInlineCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      alert('Please enter a category name');
      return;
    }

    try {
      setCreatingCategoryLoading(true);
      const res = await productApi.createCategory({ name: trimmed });
      if (res.success && res.data) {
        const createdCat = res.data;
        setCategories((prev) => [...prev, createdCat]);
        setCategoryId(createdCat.id);
        setNewCategoryName('');
        setIsCreatingCategory(false);
      } else {
        alert((res as any)?.error?.message || 'Failed to create category');
      }
    } catch (err: any) {
      console.error('Failed to create category', err);
      alert(err?.message || 'Failed to create category');
    } finally {
      setCreatingCategoryLoading(false);
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
        categoryId: categoryId || (categories.length > 0 ? categories[0].id : undefined),
        images,
        isActive,
        isDigital,
        downloadUrl: isDigital && downloadUrl.trim() ? downloadUrl.trim() : null,
        fileType: isDigital && fileType ? fileType : null,
        fileSize: isDigital && fileSize.trim() ? fileSize.trim() : null,
        fileName: isDigital && fileName.trim() ? fileName.trim() : null,
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
            Create, edit, manage store items, set prices, categories, and control stock availability.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-jadmaa-red w-44 sm:w-56"
            />
          </div>
          <Link
            to="/admin/categories"
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs sm:text-sm font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <Layers className="w-4 h-4 text-gray-500" />
            <span>Manage Categories</span>
          </Link>
          <button
            onClick={openAddModal}
            className="px-5 py-2.5 bg-jadmaa-red hover:bg-[#8C1E1E] text-white text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 shadow-sm hover:shadow cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create Product</span>
          </button>
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
          <div>
            {/* Mobile Stacked Cards (< 768px) */}
            <div className="md:hidden divide-y divide-gray-100 p-3 space-y-3">
              {products.map((p) => {
                const isOutOfStock = p.stockQuantity <= 0;
                const catName = p.category?.name || categories.find((c) => c.id === p.categoryId)?.name || 'Unassigned';

                return (
                  <div key={p.id} className="bg-white rounded-2xl p-4 border border-[#E8DDD0] shadow-xs space-y-3">
                    {/* Header: Thumbnail + Name + Status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0">
                          {p.images && p.images[0] ? (
                            <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-5 h-5 m-auto text-gray-300" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-[#2B2521] truncate">{p.name}</h4>
                          <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600">
                            {catName}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          p.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {p.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </div>

                    {/* Details: Price & Stock */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 text-xs">
                      <div>
                        <span className="text-[#5C5148] block text-[11px]">Price</span>
                        <span className="font-bold text-sm text-[#2B2521]">
                          ₹{p.price.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#5C5148] block text-[11px]">Stock</span>
                        <span className={`font-bold text-sm ${isOutOfStock ? 'text-red-600' : 'text-emerald-700'}`}>
                          {p.stockQuantity} units
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(p)}
                        className="px-3.5 py-2 min-h-[44px] text-xs font-bold text-[#2B2521] hover:text-[#B12B2B] bg-gray-50 hover:bg-gray-100 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p)}
                        className="px-3.5 py-2 min-h-[44px] text-xs font-bold text-red-600 bg-red-50/60 hover:bg-red-100 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table (>= 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4">Product</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Price</th>
                    <th className="py-3.5 px-4">Quantity (In Stock)</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((p) => {
                    const isOutOfStock = p.stockQuantity <= 0;
                    const catName = p.category?.name || categories.find((c) => c.id === p.categoryId)?.name || 'Unassigned';

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
                              <p className="font-bold text-gray-900 line-clamp-1 flex items-center gap-1.5">
                                <span>{p.name}</span>
                                {p.isDigital && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                                    <BookOpen className="w-2.5 h-2.5" />
                                    <span>eBook ({p.fileType?.toUpperCase() || 'FILE'}{p.fileSize ? ` • ${p.fileSize}` : ''})</span>
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-4">
                          <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 text-gray-700">
                            {catName}
                          </span>
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
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal (Responsive Bottom Sheet on Mobile) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-100 w-full max-w-xl overflow-hidden max-h-[92dvh] sm:max-h-[90vh] flex flex-col">
            
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
                  placeholder="e.g. Traditional Books / Uniform / Gear"
                  required
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-jadmaa-red text-sm"
                />
              </div>

              {/* Product Category Selection / Quick Creation */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-gray-700">Category *</label>
                  {!isCreatingCategory ? (
                    <button
                      type="button"
                      onClick={() => setIsCreatingCategory(true)}
                      className="text-jadmaa-red hover:text-[#8C1E1E] font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Create New Category</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsCreatingCategory(false)}
                      className="text-gray-400 hover:text-gray-600 font-medium text-[11px] cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>

                {isCreatingCategory ? (
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                    <p className="text-[11px] font-semibold text-amber-900">
                      Create a new category name on the fly:
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="e.g. Books & Publications, Uniforms..."
                        className="flex-1 p-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-jadmaa-red"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleCreateInlineCategory();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleCreateInlineCategory}
                        disabled={creatingCategoryLoading || !newCategoryName.trim()}
                        className="px-3 py-2 bg-jadmaa-red hover:bg-[#8C1E1E] disabled:opacity-50 text-white font-bold rounded-lg text-xs transition cursor-pointer"
                      >
                        {creatingCategoryLoading ? 'Saving...' : 'Add'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <select
                    value={categoryId}
                    onChange={(e) => {
                      const newCatId = e.target.value;
                      setCategoryId(newCatId);
                      const cat = categories.find((c) => c.id === newCatId);
                      if (cat && (cat.name.toLowerCase().includes('book') || cat.slug.toLowerCase().includes('book'))) {
                        setIsDigital(true);
                      }
                    }}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-jadmaa-red text-xs font-medium"
                    required
                  >
                    {categories.length === 0 ? (
                      <option value="">No categories yet — click "Create New Category"</option>
                    ) : (
                      <>
                        <option value="" disabled>Select a category...</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                )}
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

              {/* Product Images (Upload from Device / Drag & Drop for PC) */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">Product Images</label>
                
                {/* Upload from Device / Drag & Drop Dropzone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) processProductImageFile(file);
                  }}
                  onClick={() => !uploadingImage && productImageInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 hover:border-jadmaa-red hover:bg-gray-50/70 rounded-xl p-4 text-center cursor-pointer transition mb-2 bg-white flex flex-col items-center justify-center gap-1.5"
                >
                  <input
                    ref={productImageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) processProductImageFile(file);
                    }}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                  <div className="w-8 h-8 rounded-full bg-red-50 text-jadmaa-red flex items-center justify-center">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-semibold text-gray-800">
                    <span className="text-jadmaa-red font-bold hover:underline">Upload from device</span> or drag and drop image here (PC)
                  </div>
                  <p className="text-[10px] text-gray-500">
                    {uploadingImage ? 'Uploading & optimizing...' : 'PNG, JPG, WEBP, GIF (up to 15MB)'}
                  </p>
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

              {/* Digital eBook / File Delivery Configuration */}
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-amber-800" />
                    <span className="font-bold text-gray-900 text-xs">Digital eBook / Downloadable Asset</span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isDigital}
                      onChange={(e) => setIsDigital(e.target.checked)}
                      className="w-4 h-4 text-jadmaa-red rounded"
                    />
                    <span className="text-[11px] font-bold text-amber-900">Enable eBook Delivery</span>
                  </label>
                </div>

                {isDigital && (
                  <div className="space-y-3 pt-2 border-t border-amber-200/60">
                    <p className="text-[11px] text-gray-600 leading-relaxed">
                      Purchasing users will receive instant download access after checkout. Supports <strong>.rar</strong>, <strong>.zip</strong>, or <strong>.pdf</strong> file collections (including 1GB+ archives).
                    </p>

                    {/* File Format Selection */}
                    <div>
                      <label className="block font-bold text-gray-700 mb-1 text-[11px]">Format (.rar / .zip / .pdf)</label>
                      <div className="flex gap-2">
                        {(['rar', 'zip', 'pdf'] as const).map((fmt) => (
                          <button
                            key={fmt}
                            type="button"
                            onClick={() => setFileType(fmt)}
                            className={`px-3 py-1.5 rounded-lg font-bold text-xs uppercase transition cursor-pointer ${
                              fileType === fmt
                                ? 'bg-jadmaa-red text-white shadow-xs'
                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            .{fmt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* File Upload (Device or Drag & Drop) */}
                    <div>
                      <label className="block font-bold text-gray-700 mb-1 text-[11px]">
                        Upload eBook / Archive File (.rar, .zip, .pdf)
                      </label>
                      <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const file = e.dataTransfer.files?.[0];
                          if (file) processEbookFile(file);
                        }}
                        onClick={() => !uploadingEbook && ebookInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-300 hover:border-jadmaa-red hover:bg-white rounded-xl p-4 text-center cursor-pointer transition bg-gray-50/60 flex flex-col items-center justify-center gap-1.5"
                      >
                        <input
                          ref={ebookInputRef}
                          type="file"
                          accept=".rar,.zip,.pdf,application/x-rar-compressed,application/octet-stream,application/zip,application/pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) processEbookFile(file);
                          }}
                          className="hidden"
                          disabled={uploadingEbook}
                        />
                        <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center">
                          <Upload className="w-4 h-4 text-jadmaa-red" />
                        </div>
                        <div className="text-xs font-semibold text-gray-800">
                          <span className="text-jadmaa-red font-bold hover:underline">Upload file from device</span> or drag &amp; drop here (PC)
                        </div>
                        <p className="text-[10px] text-gray-500">
                          {uploadingEbook ? 'Uploading file...' : 'Supports .rar, .zip, or .pdf (including large 1GB+ collections)'}
                        </p>
                      </div>

                      {downloadUrl && (
                        <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-800">
                          <span className="font-semibold truncate">✓ File uploaded: {fileName || downloadUrl}</span>
                          <span className="text-[10px] text-emerald-600 font-mono ml-2 shrink-0">{fileSize || ''}</span>
                        </div>
                      )}
                    </div>

                    {/* File Metadata: Display Name & Size */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-gray-700 mb-1 text-[11px]">File Display Name</label>
                        <input
                          type="text"
                          value={fileName}
                          onChange={(e) => setFileName(e.target.value)}
                          placeholder="e.g. Rare_Siddhar_Varma_20_Books_Collection.rar"
                          className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-gray-700 mb-1 text-[11px]">File Size</label>
                        <input
                          type="text"
                          value={fileSize}
                          onChange={(e) => setFileSize(e.target.value)}
                          placeholder="e.g. 1.0 GB (20 Books)"
                          className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}
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
