import { fetchApi } from './apiClient';

export interface OrderItem {
  id: string;
  orderId: string;
  productId?: string | null;
  productName: string;
  sku: string;
  image?: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  createdAt: string;
  product?: {
    id: string;
    name: string;
    sku: string;
    stockQuantity: number;
  };
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED';

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  subtotal: number;
  shippingCharge: number;
  discountAmount: number;
  totalAmount: number;
  shippingAddress: string;
  shippingPincode: string;
  customerName: string;
  customerPhone?: string | null;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  paymentTransactionId?: string | null;
  merchantOrderId?: string | null;
  orderStatus: OrderStatus;
  trackingNumber?: string | null;
  notes?: string | null;
  isStockRestored: boolean;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
  };
  inventoryTransactions?: any[];
}

export interface CreateOrderPayload {
  items: Array<{ productId: string; quantity: number }>;
  shippingAddress: string;
  shippingPincode: string;
  customerPhone?: string;
  notes?: string;
}

export interface CreateOrderResponse {
  success: boolean;
  data: {
    orderId: string;
    orderNumber: string;
    subtotal: number;
    shippingCharge: number;
    totalAmount: number;
    currency: string;
    razorpayOrderId: string;
    keyId: string;
    customer: {
      name: string;
      email: string;
      phone: string;
    };
  };
}

export interface VerifyPaymentPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export const orderApi = {
  // User checkout
  checkout: async (payload: CreateOrderPayload) => {
    return fetchApi<CreateOrderResponse>('/orders/checkout', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Payment verification
  verifyPayment: async (payload: VerifyPaymentPayload) => {
    return fetchApi<{ success: boolean; message: string; data: Order }>('/orders/verify-payment', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Logged-in user orders
  getUserOrders: async () => {
    return fetchApi<{ success: boolean; data: Order[] }>('/orders/my-orders');
  },

  getUserOrderById: async (id: string) => {
    return fetchApi<{ success: boolean; data: Order }>(`/orders/my-orders/${id}`);
  },

  // Admin orders
  adminGetOrders: async (params: {
    orderStatus?: string;
    paymentStatus?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}) => {
    const query = new URLSearchParams();
    if (params.orderStatus) query.set('orderStatus', params.orderStatus);
    if (params.paymentStatus) query.set('paymentStatus', params.paymentStatus);
    if (params.search) query.set('search', params.search);
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());

    const qs = query.toString();
    return fetchApi<{
      success: boolean;
      data: Order[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>(`/orders/admin/list${qs ? `?${qs}` : ''}`);
  },

  adminGetOrderById: async (id: string) => {
    return fetchApi<{ success: boolean; data: Order }>(`/orders/admin/${id}`);
  },

  adminUpdateOrderStatus: async (
    id: string,
    data: {
      orderStatus?: OrderStatus;
      paymentStatus?: PaymentStatus;
      trackingNumber?: string;
      notes?: string;
    }
  ) => {
    return fetchApi<{ success: boolean; message: string; data: Order }>(`/orders/admin/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};
