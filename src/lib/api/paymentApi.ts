import { fetchApi } from './apiClient';

export interface RazorpayOrderResponse {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  paymentRecordId: string;
  course: {
    id: string;
    title: string;
  };
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
}

export interface RazorpayVerifyPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export const paymentApi = {
  /**
   * Create Razorpay order on backend
   */
  createOrder: async (courseId: string) => {
    return fetchApi('/payments/create-order', {
      method: 'POST',
      body: JSON.stringify({ courseId }),
    });
  },

  /**
   * Verify Razorpay payment signature and unlock enrollment
   */
  verifyRazorpayPayment: async (payload: RazorpayVerifyPayload) => {
    return fetchApi('/payments/razorpay/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Check order status
   */
  checkStatus: async (merchantOrderId: string) => {
    return fetchApi(`/payments/${merchantOrderId}/status`);
  },
};
