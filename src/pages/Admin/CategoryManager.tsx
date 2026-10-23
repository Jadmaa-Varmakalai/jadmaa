import React, { useState, useEffect } from 'react';
import { productApi } from '../../lib/api/productApi';
import type { ProductCategory } from '../../lib/api/productApi';
import { uploadApi } from '../../lib/api/uploadApi';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  Image as ImageIcon,
  Upload,
  X,
  Layers,
  AlertCircle,
} from 'lucide-react';

export const CategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await productApi.getCategories(true);
      if (res.success && res.data) {
        setCategories(res.data);
      }
    } catch (err) {
      console.error('Failed to load categories', err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setDescription('');
    setImage('');
    setIsActive(true);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (cat: ProductCategory) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setImage(cat.image || '');
    setIsActive(cat.isActive);
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
            setImage(url);
          } else {
            alert('Failed to process image.');
          }
        } catch (uploadErr: any) {
          console.error('Upload failed:', uploadErr);
          alert(uploadErr?.message || 'Failed to upload image');
        } finally {
          setUploadingImage(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Category image upload failed', err);
      setUploadingImage(false);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Category name is required');
      return;
    }

    try {
      setSaving(true);
      const payload: any = {
        name: name.trim(),
        slug: slug.trim() || undefined,
        description: description.trim() || undefined,
        image: image.trim() || undefined,
        isActive,
      };

      if (editingCategory) {
        const res = await productApi.updateCategory(editingCategory.id, payload);
        if (!res.success) throw new Error((res as any)?.error?.message || 'Failed to update category');
      } else {
        const res = await productApi.createCategory(payload);
        if (!res.success) throw new Error((res as any)?.error?.message || 'Failed to create category');
      }

      setIsModalOpen(false);
      loadCategories();
    } catch (err: any) {
      console.error('Error saving category', err);
      setFormError(err?.message || 'An error occurred while saving category');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (cat: ProductCategory) => {
    if (cat._count && cat._count.products > 0) {
      alert(`Cannot delete "${cat.name}" because it contains ${cat._count.products} products. Please reassign or delete the products first.`);
      return;
    }

    if (!window.confirm(`Are you sure you want to delete category "${cat.name}"?`)) return;

    try {
      const res = await productApi.deleteCategory(cat.id);
      if (res.success) {
        alert('Category deleted successfully');
        loadCategories();
      }
    } catch (err: any) {
      console.error('Failed to delete category', err);
      alert(err?.message || 'Failed to delete category');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <h2 className="text-xl font-heading font-extrabold text-jadmaa-charcoal">
            Product Categories
          </h2>
          <p className="text-xs text-gray-500">
            Organize store catalog items into browsable categories like Uniforms, Sparring, and Tools.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-jadmaa-red hover:bg-red-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Category</span>
        </button>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-xs text-gray-400">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="p-10 text-center">
            <Tag className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-700">No categories found</p>
            <p className="text-xs text-gray-400 mt-1">Create your first product category to begin.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Slug</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4">Products Attached</th>
                  <th className="py-3.5 px-4">Visibility</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0">
                          {c.image ? (
                            <img src={c.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Tag className="w-5 h-5 m-auto text-gray-300" />
                          )}
                        </div>
                        <span className="font-bold text-gray-900">{c.name}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-gray-500">/{c.slug}</td>

                    <td className="py-3.5 px-4 text-gray-600 max-w-xs truncate">
                      {c.description || '—'}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="bg-gray-100 text-gray-700 font-bold px-2 py-0.5 rounded-full text-[11px]">
                        {c._count?.products || 0} product(s)
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {c.isActive ? 'Visible' : 'Hidden'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-1.5 text-gray-500 hover:text-jadmaa-red hover:bg-gray-100 rounded-lg transition cursor-pointer"
                          title="Edit Category"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(c)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          title="Delete Category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-jadmaa-cream/50">
              <h3 className="font-heading font-extrabold text-base text-gray-900">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-200">
                  {formError}
                </div>
              )}

              <div>
                <label className="block font-bold text-gray-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editingCategory) {
                      setSlug(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^\w\s-]/g, '')
                          .replace(/[\s_-]+/g, '-')
                      );
                    }
                  }}
                  placeholder="e.g. Sparring & Protective Gear"
                  required
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-jadmaa-red"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Slug</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="auto-generated-slug"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-jadmaa-red font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief summary of items in this category..."
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-jadmaa-red"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Category Image</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="Image URL (https://...)"
                    className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                  />
                  <label className="px-3 py-2 bg-jadmaa-cream hover:bg-amber-100/70 border border-amber-200 text-amber-900 font-bold rounded-xl cursor-pointer flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingImage ? '...' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                  </label>
                </div>
                {image && (
                  <div className="mt-2 w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                    <img src={image} alt="preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="catActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-jadmaa-red rounded"
                />
                <label htmlFor="catActive" className="font-bold text-gray-800 cursor-pointer">
                  Visible to users in store navigation
                </label>
              </div>

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
                  {saving ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
