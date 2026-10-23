import { Request, Response } from 'express';
import { prisma } from '../../db.js';

/**
 * Admin: Get inventory transaction audit logs
 */
export const getInventoryLogs = async (req: Request, res: Response) => {
  try {
    const { productId, transactionType, page = '1', limit = '50' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (productId && typeof productId === 'string' && productId.trim()) {
      where.productId = productId.trim();
    }
    if (transactionType && typeof transactionType === 'string' && transactionType.trim()) {
      where.transactionType = transactionType.trim();
    }

    const [total, logs] = await Promise.all([
      prisma.inventoryTransaction.count({ where }),
      prisma.inventoryTransaction.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              stockQuantity: true,
            },
          },
          order: {
            select: {
              id: true,
              orderNumber: true,
              customerName: true,
            },
          },
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err: any) {
    console.error('[Inventory:getInventoryLogs:Error]', err);
    return res.status(500).json({ success: false, error: { message: err?.message || 'Failed to fetch inventory logs' } });
  }
};

/**
 * Admin: Manual Stock Adjustment (Arrival of new shipment, damage/loss, physical count audit)
 */
export const adjustStock = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { productId, type = 'MANUAL_ADJUSTMENT', quantityChange, newStockQuantity, reason } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, error: { message: 'Product ID is required' } });
    }

    if (!reason || typeof reason !== 'string' || !reason.trim()) {
      return res.status(400).json({ success: false, error: { message: 'A reason for stock adjustment is required' } });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({ success: false, error: { message: 'Product not found' } });
    }

    let diff = 0;
    let targetStock = product.stockQuantity;

    if (newStockQuantity !== undefined) {
      targetStock = Math.max(0, parseInt(newStockQuantity, 10));
      diff = targetStock - product.stockQuantity;
    } else if (quantityChange !== undefined) {
      diff = parseInt(quantityChange, 10);
      targetStock = product.stockQuantity + diff;
    } else {
      return res.status(400).json({ success: false, error: { message: 'Specify either quantityChange or newStockQuantity' } });
    }

    if (targetStock < 0) {
      return res.status(400).json({
        success: false,
        error: { message: `Cannot reduce stock below 0. Current available stock is ${product.stockQuantity}.` },
      });
    }

    let finalTransactionType = type;
    if (diff > 0 && type !== 'STOCK_RESTORATION') {
      finalTransactionType = 'STOCK_ADDITION';
    } else if (diff < 0) {
      finalTransactionType = 'STOCK_DEDUCTION';
    } else if (diff === 0) {
      finalTransactionType = 'MANUAL_ADJUSTMENT';
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: { stockQuantity: targetStock },
      });

      const log = await tx.inventoryTransaction.create({
        data: {
          productId,
          transactionType: finalTransactionType,
          quantityChanged: diff,
          previousStock: product.stockQuantity,
          updatedStock: targetStock,
          reason: reason.trim(),
          performedBy: user?.name || user?.email || 'Admin',
        },
      });

      return { product: updatedProduct, log };
    });

    return res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    console.error('[Inventory:adjustStock:Error]', err);
    return res.status(500).json({ success: false, error: { message: err?.message || 'Failed to adjust stock' } });
  }
};

/**
 * Admin: Get low stock alerts
 */
export const getLowStockAlerts = async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
      },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
      orderBy: { stockQuantity: 'asc' },
    });

    const lowStockItems = products
      .filter((p) => p.stockQuantity <= p.lowStockThreshold)
      .map((p) => ({
        ...p,
        isOutOfStock: p.stockQuantity <= 0,
        severity: p.stockQuantity <= 0 ? 'CRITICAL' : 'WARNING',
      }));

    return res.status(200).json({
      success: true,
      data: {
        count: lowStockItems.length,
        items: lowStockItems,
      },
    });
  } catch (err: any) {
    console.error('[Inventory:getLowStockAlerts:Error]', err);
    return res.status(500).json({ success: false, error: { message: err?.message || 'Failed to fetch low stock alerts' } });
  }
};
