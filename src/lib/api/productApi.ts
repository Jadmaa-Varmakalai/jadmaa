import { fetchApi } from './apiClient';

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    products: number;
  };
}

export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  category?: ProductCategory;
  price: number;
  compareAtPrice?: number | null;
  images: string[];
  sku: string;
  stockQuantity: number;
  lowStockThreshold: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  stockStatus: StockStatus;
  discountPercentage?: number;
  isLowStock?: boolean;
  relatedProducts?: Product[];
  _count?: {
    orderItems: number;
    inventoryTransactions: number;
  };
}

export interface InventoryTransaction {
  id: string;
  productId: string;
  orderId?: string | null;
  transactionType: 'STOCK_ADDITION' | 'STOCK_DEDUCTION' | 'MANUAL_ADJUSTMENT' | 'STOCK_RESTORATION';
  quantityChanged: number;
  previousStock: number;
  updatedStock: number;
  reason: string;
  performedBy: string;
  createdAt: string;
  product?: {
    id: string;
    name: string;
    sku: string;
    stockQuantity: number;
  };
  order?: {
    id: string;
    orderNumber: string;
    customerName: string;
  } | null;
}

export const productApi = {
  // Public
  getCategories: async (all = false) => {
    return fetchApi<{ success: boolean; data: ProductCategory[] }>(
      `/products/categories${all ? '?all=true' : ''}`
    );
  },

  getCategoryBySlug: async (slug: string) => {
    return fetchApi<{ success: boolean; data: ProductCategory }>(`/products/categories/${slug}`);
  },

  getProducts: async (params: {
    search?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    inStockOnly?: boolean;
    sort?: string;
    page?: number;
    limit?: number;
  } = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.category) query.set('category', params.category);
    if (params.minPrice !== undefined) query.set('minPrice', params.minPrice.toString());
    if (params.maxPrice !== undefined) query.set('maxPrice', params.maxPrice.toString());
    if (params.inStockOnly) query.set('inStockOnly', 'true');
    if (params.sort) query.set('sort', params.sort);
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());

    const qs = query.toString();
    return fetchApi<{
      success: boolean;
      data: Product[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>(`/products${qs ? `?${qs}` : ''}`);
  },

  getProductBySlug: async (slug: string) => {
    return fetchApi<{ success: boolean; data: Product }>(`/products/detail/${slug}`);
  },

  // Admin Products
  adminGetProducts: async (params: {
    search?: string;
    categoryId?: string;
    status?: 'active' | 'inactive';
    lowStockOnly?: boolean;
    page?: number;
    limit?: number;
  } = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.categoryId) query.set('categoryId', params.categoryId);
    if (params.status) query.set('status', params.status);
    if (params.lowStockOnly) query.set('lowStockOnly', 'true');
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());

    const qs = query.toString();
    return fetchApi<{
      success: boolean;
      data: Product[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>(`/products/admin/list${qs ? `?${qs}` : ''}`);
  },

  getProductById: async (id: string) => {
    return fetchApi<{ success: boolean; data: Product }>(`/products/admin/${id}`);
  },

  createProduct: async (data: Partial<Product>) => {
    return fetchApi<{ success: boolean; data: Product }>('/products/admin', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateProduct: async (id: string, data: Partial<Product>) => {
    return fetchApi<{ success: boolean; data: Product }>(`/products/admin/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteProduct: async (id: string) => {
    return fetchApi<{ success: boolean; message: string }>(`/products/admin/${id}`, {
      method: 'DELETE',
    });
  },

  // Admin Categories
  createCategory: async (data: Partial<ProductCategory>) => {
    return fetchApi<{ success: boolean; data: ProductCategory }>('/products/admin/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateCategory: async (id: string, data: Partial<ProductCategory>) => {
    return fetchApi<{ success: boolean; data: ProductCategory }>(`/products/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteCategory: async (id: string) => {
    return fetchApi<{ success: boolean; message: string }>(`/products/admin/categories/${id}`, {
      method: 'DELETE',
    });
  },

  // Admin Inventory
  getInventoryLogs: async (params: {
    productId?: string;
    transactionType?: string;
    page?: number;
    limit?: number;
  } = {}) => {
    const query = new URLSearchParams();
    if (params.productId) query.set('productId', params.productId);
    if (params.transactionType) query.set('transactionType', params.transactionType);
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());

    const qs = query.toString();
    return fetchApi<{
      success: boolean;
      data: InventoryTransaction[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>(`/products/admin/inventory/logs${qs ? `?${qs}` : ''}`);
  },

  adjustStock: async (data: {
    productId: string;
    type?: string;
    quantityChange?: number;
    newStockQuantity?: number;
    reason: string;
  }) => {
    return fetchApi<{ success: boolean; data: { product: Product; log: InventoryTransaction } }>(
      '/products/admin/inventory/adjust',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },

  getLowStockAlerts: async () => {
    return fetchApi<{
      success: boolean;
      data: {
        count: number;
        items: Array<Product & { isOutOfStock: boolean; severity: 'CRITICAL' | 'WARNING' }>;
      };
    }>('/products/admin/inventory/low-stock-alerts');
  },
};
