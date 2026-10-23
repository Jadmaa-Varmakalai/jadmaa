import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware.js';
import {
  createOrder,
  verifyOrderPayment,
  getUserOrders,
  getUserOrderById,
  adminGetOrders,
  adminGetOrderById,
  adminUpdateOrderStatus,
} from './order.controller.js';

const router = Router();

// ==========================================
// USER / CHECKOUT ROUTES (Authenticated)
// ==========================================
router.post('/checkout', authenticate, createOrder);
router.post('/verify-payment', authenticate, verifyOrderPayment);
router.get('/my-orders', authenticate, getUserOrders);
router.get('/my-orders/:id', authenticate, getUserOrderById);

// ==========================================
// ADMIN ORDER MANAGEMENT ROUTES
// ==========================================
router.get('/admin/list', authenticate, requireAdmin, adminGetOrders);
router.get('/admin/:id', authenticate, requireAdmin, adminGetOrderById);
router.put('/admin/:id/status', authenticate, requireAdmin, adminUpdateOrderStatus);

export default router;
