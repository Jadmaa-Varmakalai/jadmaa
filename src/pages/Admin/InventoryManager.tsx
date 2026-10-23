import React, { useState, useEffect } from 'react';
import { productApi } from '../../lib/api/productApi';
import type { Product, InventoryTransaction } from '../../lib/api/productApi';
import {
  Layers,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  RotateCcw,
  Sliders,
  Package,
  Plus,
  RefreshCw,
  Search,
  X,
  History,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const InventoryManager: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [logs, setLogs] = useState<InventoryTransaction[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedType, setSelectedType] = useState('');

  // Adjustment Modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [targetProduct, setTargetProduct] = useState<Product | null>(null);
  const [adjustmentType, setAdjustmentType] = useState('STOCK_ADDITION');
  const [quantityValue, setQuantityValue] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [adjustError, setAdjustError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadLogs();
  }, [selectedProductId, selectedType]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodRes, alertRes] = await Promise.all([
        productApi.adminGetProducts({ limit: 100 }),
        productApi.getLowStockAlerts(),
      ]);

      if (prodRes.success && prodRes.data) {
        setProducts(prodRes.data);
      }
      if (alertRes.success && alertRes.data?.items) {
        setLowStockAlerts(alertRes.data.items);
      }
      await loadLogs();
    } catch (err) {
      console.error('Failed to load inventory data', err);
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      setLogsLoading(true);
      const res = await productApi.getInventoryLogs({
        productId: selectedProductId || undefined,
        transactionType: selectedType || undefined,
        limit: 50,
      });
      if (res.success && res.data) {
        setLogs(res.data);
      }
    } catch (err) {
      console.error('Failed to load inventory logs', err);
    } finally {
      setLogsLoading(false);
    }
  };

  const openAdjustModal = (product: Product) => {
    setTargetProduct(product);
    setAdjustmentType('STOCK_ADDITION');
    setQuantityValue('');
    setReason('');
    setAdjustError('');
    setIsAdjustModalOpen(true);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetProduct) return;
    setAdjustError('');

    const qty = parseInt(quantityValue, 10);
    if (isNaN(qty) || qty === 0) {
      setAdjustError('Please enter a valid non-zero quantity.');
      return;
    }

    if (!reason.trim()) {
      setAdjustError('A mandatory reason is required for inventory audit tracking.');
      return;
    }

    const change = adjustmentType === 'STOCK_DEDUCTION' ? -Math.abs(qty) : Math.abs(qty);
    if (targetProduct.stockQuantity + change < 0) {
      setAdjustError(`Cannot reduce stock below 0. Current stock is ${targetProduct.stockQuantity}.`);
      return;
    }

    try {
      setSubmitting(true);
      const res = await productApi.adjustStock({
        productId: targetProduct.id,
        type: adjustmentType,
        quantityChange: change,
        reason: reason.trim(),
      });

      if (res.success) {
        setIsAdjustModalOpen(false);
        await loadData();
      } else {
        throw new Error((res as any)?.error?.message || 'Failed to adjust stock');
      }
    } catch (err: any) {
      console.error('Adjust stock error', err);
      setAdjustError(err?.message || 'Failed to adjust inventory');
    } finally {
      setSubmitting(false);
    }
  };

  const totalStockUnits = products.reduce((sum, p) => sum + p.stockQuantity, 0);
  const outOfStockCount = products.filter((p) => p.stockQuantity <= 0).length;

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <h2 className="text-xl font-heading font-extrabold text-jadmaa-charcoal">
            Inventory & Stock Tracking
          </h2>
          <p className="text-xs text-gray-500">
            Monitor real-time warehouse stock, track replenishment, handle adjustments, and inspect immutable audit logs.
          </p>
        </div>
        <button
          onClick={loadData}
          className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Total Products</span>
          <p className="text-2xl font-extrabold text-jadmaa-charcoal">{products.length}</p>
          <span className="text-[10px] text-gray-500">Active catalog items</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Total Warehouse Stock</span>
          <p className="text-2xl font-extrabold text-emerald-700">{totalStockUnits} units</p>
          <span className="text-[10px] text-gray-500">Available physical units</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200/80 bg-amber-50/20 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            Low Stock Alerts
          </span>
          <p className="text-2xl font-extrabold text-amber-900">{lowStockAlerts.length}</p>
          <span className="text-[10px] text-amber-700">At or below threshold</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-red-200/80 bg-red-50/20 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-red-700 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            Out of Stock
          </span>
          <p className="text-2xl font-extrabold text-red-700">{outOfStockCount}</p>
          <span className="text-[10px] text-red-600">Needs immediate reorder</span>
        </div>
      </div>

      {/* Low Stock Alerts Section */}
      {lowStockAlerts.length > 0 && (
        <div className="bg-white rounded-2xl border border-amber-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-amber-100 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h3 className="font-heading font-extrabold text-sm text-amber-950">
                Action Required: {lowStockAlerts.length} Product(s) Under Low-Stock Threshold
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStockAlerts.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 truncate">{item.name}</p>
                  <p className="text-[11px] text-gray-500 font-mono">SKU: {item.sku}</p>
                  <p className="text-[11px] text-amber-900 mt-1">
                    Available: <span className="font-extrabold text-sm">{item.stockQuantity}</span> (Min: {item.lowStockThreshold})
                  </p>
                </div>
                <button
                  onClick={() => openAdjustModal(item)}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-2xs transition flex-shrink-0 cursor-pointer"
                >
                  Restock
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Products Stock Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-heading font-extrabold text-sm text-gray-900 flex items-center gap-2">
            <Package className="w-4 h-4 text-jadmaa-red" />
            <span>Product Inventory Levels</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Current Stock</th>
                <th className="py-3 px-4">Low Stock Alert Level</th>
                <th className="py-3 px-4">Stock Status</th>
                <th className="py-3 px-4 text-right">Quick Stock Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p) => {
                const isOut = p.stockQuantity <= 0;
                const isLow = p.stockQuantity <= p.lowStockThreshold;

                return (
                  <tr key={p.id} className="hover:bg-gray-50/60 transition">
                    <td className="py-3 px-4 font-bold text-gray-900">{p.name}</td>
                    <td className="py-3 px-4 font-mono text-gray-500">{p.sku}</td>
                    <td className="py-3 px-4">
                      <span className="text-sm font-extrabold text-gray-900">
                        {p.stockQuantity}
                      </span>{' '}
                      units
                    </td>
                    <td className="py-3 px-4 text-gray-500">{p.lowStockThreshold} units</td>
                    <td className="py-3 px-4">
                      {isOut ? (
                        <span className="bg-red-50 text-red-600 font-bold text-[10px] px-2 py-0.5 rounded border border-red-200">
                          Out of Stock
                        </span>
                      ) : isLow ? (
                        <span className="bg-amber-50 text-amber-700 font-bold text-[10px] px-2 py-0.5 rounded border border-amber-200">
                          Low Stock
                        </span>
                      ) : (
                        <span className="bg-emerald-50 text-emerald-700 font-bold text-[10px] px-2 py-0.5 rounded border border-emerald-200">
                          Healthy
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openAdjustModal(p)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-lg transition cursor-pointer"
                      >
                        Adjust / Restock
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inventory Transaction History Logs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden space-y-3 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-jadmaa-red" />
            <div>
              <h3 className="font-heading font-extrabold text-sm text-gray-900">
                Inventory Transaction Audit Log
              </h3>
              <p className="text-[11px] text-gray-400">
                Historical record of additions, orders deductions, cancellations restorations, and manual audits
              </p>
            </div>
          </div>

          {/* Filter dropdowns */}
          <div className="flex items-center gap-2">
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="p-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg cursor-pointer max-w-xs truncate"
            >
              <option value="">All Products</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="p-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg cursor-pointer"
            >
              <option value="">All Event Types</option>
              <option value="STOCK_ADDITION">Stock Addition</option>
              <option value="STOCK_DEDUCTION">Stock Deduction</option>
              <option value="STOCK_RESTORATION">Stock Restoration</option>
              <option value="MANUAL_ADJUSTMENT">Manual Adjustment</option>
            </select>
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto">
          {logsLoading ? (
            <div className="p-8 text-center text-xs text-gray-400">Loading audit history...</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400">No inventory transactions found.</div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3">Event Type</th>
                  <th className="py-2.5 px-3">Change</th>
                  <th className="py-2.5 px-3">Stock Progression</th>
                  <th className="py-2.5 px-3">Reason / Details</th>
                  <th className="py-2.5 px-3">Performed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => {
                  const isPositive = log.quantityChanged > 0;
                  const isNegative = log.quantityChanged < 0;

                  let typeBadge = (
                    <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[10px] font-bold">
                      {log.transactionType}
                    </span>
                  );
                  if (log.transactionType === 'STOCK_ADDITION') {
                    typeBadge = (
                      <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-200">
                        Stock Addition
                      </span>
                    );
                  } else if (log.transactionType === 'STOCK_DEDUCTION') {
                    typeBadge = (
                      <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold border border-red-200">
                        Order Deduction
                      </span>
                    );
                  } else if (log.transactionType === 'STOCK_RESTORATION') {
                    typeBadge = (
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-200">
                        Restoration (Cancelled)
                      </span>
                    );
                  } else if (log.transactionType === 'MANUAL_ADJUSTMENT') {
                    typeBadge = (
                      <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-[10px] font-bold border border-purple-200">
                        Manual Adjustment
                      </span>
                    );
                  }

                  return (
                    <tr key={log.id} className="hover:bg-gray-50/60 transition">
                      <td className="py-2.5 px-3 text-gray-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      <td className="py-2.5 px-3 font-bold text-gray-900 max-w-xs truncate">
                        {log.product?.name || 'Product'}
                        <span className="block text-[10px] text-gray-400 font-mono">
                          {log.product?.sku}
                        </span>
                      </td>

                      <td className="py-2.5 px-3">{typeBadge}</td>

                      <td className="py-2.5 px-3 font-extrabold">
                        <span
                          className={
                            isPositive
                              ? 'text-emerald-600'
                              : isNegative
                              ? 'text-red-600'
                              : 'text-gray-600'
                          }
                        >
                          {isPositive ? `+${log.quantityChanged}` : log.quantityChanged}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 font-mono text-gray-600">
                        {log.previousStock} &rarr;{' '}
                        <span className="font-bold text-gray-900">{log.updatedStock}</span>
                      </td>

                      <td className="py-2.5 px-3 text-gray-700">
                        {log.reason}
                        {log.order && (
                          <span className="block text-[10px] text-jadmaa-red font-semibold">
                            Ref Order: {log.order.orderNumber}
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-gray-500 whitespace-nowrap">
                        {log.performedBy}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {isAdjustModalOpen && targetProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-jadmaa-cream/50">
              <h3 className="font-heading font-extrabold text-base text-gray-900">
                Adjust Stock: {targetProduct.name}
              </h3>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="p-6 space-y-4 text-xs">
              {adjustError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-200">
                  {adjustError}
                </div>
              )}

              <div className="bg-gray-50 p-3 rounded-xl flex justify-between items-center">
                <span className="text-gray-500">Current Available Stock:</span>
                <span className="text-base font-extrabold text-gray-900">
                  {targetProduct.stockQuantity} units
                </span>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Adjustment Action *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustmentType('STOCK_ADDITION')}
                    className={`py-2 px-3 rounded-xl font-bold text-center border cursor-pointer ${
                      adjustmentType === 'STOCK_ADDITION'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    + Add New Inventory
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustmentType('STOCK_DEDUCTION')}
                    className={`py-2 px-3 rounded-xl font-bold text-center border cursor-pointer ${
                      adjustmentType === 'STOCK_DEDUCTION'
                        ? 'border-red-600 bg-red-50 text-red-800'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    - Deduct Stock (Damage/Loss)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Quantity to {adjustmentType === 'STOCK_ADDITION' ? 'Add' : 'Deduct'} *
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantityValue}
                  onChange={(e) => setQuantityValue(e.target.value)}
                  placeholder="e.g. 15"
                  required
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-jadmaa-red font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Reason for Adjustment (Mandatory for audit trail) *
                </label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Vendor shipment receipt #VN-409 or physical inventory count discrepancy"
                  required
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-jadmaa-red"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-jadmaa-red hover:bg-red-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Applying...' : 'Confirm Stock Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
