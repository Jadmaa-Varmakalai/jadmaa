import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware.js';
import {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
} from './category.controller.js';
import {
  getProducts,
  getProductBySlug,
  adminGetProducts,
  adminGetProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from './product.controller.js';
import {
  getInventoryLogs,
  adjustStock,
  getLowStockAlerts,
} from './inventory.controller.js';

const router = Router();

// ==========================================
// PUBLIC STOREFRONT ROUTES
// ==========================================
router.get('/', getProducts);
router.get('/detail/:slug', getProductBySlug);

router.get('/categories', getCategories);
router.get('/categories/:slug', getCategoryBySlug);

// ==========================================
// ADMIN PRODUCT & CATEGORY MANAGEMENT ROUTES
// ==========================================
router.get('/admin/list', authenticate, requireAdmin, adminGetProducts);
router.get('/admin/:id', authenticate, requireAdmin, adminGetProductById);
router.post('/admin', authenticate, requireAdmin, createProduct);
router.put('/admin/:id', authenticate, requireAdmin, updateProduct);
router.delete('/admin/:id', authenticate, requireAdmin, deleteProduct);

router.post('/admin/categories', authenticate, requireAdmin, createCategory);
router.put('/admin/categories/:id', authenticate, requireAdmin, updateCategory);
router.delete('/admin/categories/:id', authenticate, requireAdmin, deleteCategory);

// ==========================================
// ADMIN INVENTORY MANAGEMENT ROUTES
// ==========================================
router.get('/admin/inventory/logs', authenticate, requireAdmin, getInventoryLogs);
router.post('/admin/inventory/adjust', authenticate, requireAdmin, adjustStock);
router.get('/admin/inventory/low-stock-alerts', authenticate, requireAdmin, getLowStockAlerts);

export default router;
