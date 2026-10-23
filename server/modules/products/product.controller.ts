import { Request, Response } from 'express';
import { prisma } from '../../db.js';

const slugify = (text: string) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const getStockStatus = (stockQuantity: number, lowStockThreshold: number = 5) => {
  if (stockQuantity <= 0) return 'OUT_OF_STOCK';
  if (stockQuantity <= lowStockThreshold) return 'LOW_STOCK';
  return 'IN_STOCK';
};

/**
 * Public: Get products for store browsing
 */
export const getProducts = async (req: Request, res: Response) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      inStockOnly,
      sort = 'featured',
      page = '1',
      limit = '20',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      isActive: true,
      category: {
        isActive: true,
      },
    };

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (category && typeof category === 'string' && category.trim()) {
      where.category = {
        OR: [{ slug: category.trim() }, { id: category.trim() }],
        isActive: true,
      };
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice as string);
      if (maxPrice) where.price.lte = parseFloat(maxPrice as string);
    }

    if (inStockOnly === 'true') {
      where.stockQuantity = { gt: 0 };
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'price_asc') {
      orderBy = { price: 'asc' };
    } else if (sort === 'price_desc') {
      orderBy = { price: 'desc' };
    } else if (sort === 'name_asc') {
      orderBy = { name: 'asc' };
    } else if (sort === 'newest') {
      orderBy = { createdAt: 'desc' };
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take: limitNum,
        orderBy,
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
      }),
    ]);

    const enriched = products.map((p) => {
      const stockStatus = getStockStatus(p.stockQuantity, p.lowStockThreshold);
      const discountPercentage =
        p.compareAtPrice && p.compareAtPrice > p.price
          ? Math.round(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100)
          : 0;

      return {
        ...p,
        stockStatus,
        discountPercentage,
      };
    });

    return res.status(200).json({
      success: true,
      data: enriched,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err: any) {
    console.error('[Products:getProducts:Error]', err);
    return res.status(500).json({ success: false, error: { message: err?.message || 'Failed to fetch products' } });
  }
};

/**
 * Public: Get single product by slug or ID
 */
export const getProductBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const product = await prisma.product.findFirst({
      where: {
        OR: [{ slug }, { id: slug }],
      },
      include: {
        category: true,
      },
    });

    if (!product) {
      return res.status(404).json({ success: false, error: { message: 'Product not found' } });
    }

    const stockStatus = getStockStatus(product.stockQuantity, product.lowStockThreshold);
    const discountPercentage =
      product.compareAtPrice && product.compareAtPrice > product.price
        ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
        : 0;

    // Fetch up to 4 related products in the same category
    const relatedProducts = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        isActive: true,
      },
      take: 4,
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        compareAtPrice: true,
        images: true,
        stockQuantity: true,
        lowStockThreshold: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        ...product,
        stockStatus,
        discountPercentage,
        relatedProducts: relatedProducts.map((rp) => ({
          ...rp,
          stockStatus: getStockStatus(rp.stockQuantity, rp.lowStockThreshold),
        })),
      },
    });
  } catch (err: any) {
    console.error('[Products:getProductBySlug:Error]', err);
    return res.status(500).json({ success: false, error: { message: err?.message || 'Failed to fetch product' } });
  }
};

/**
 * Admin: Get all products with inventory summary and filters
 */
export const adminGetProducts = async (req: Request, res: Response) => {
  try {
    const { search, categoryId, status, lowStockOnly, page = '1', limit = '50' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (categoryId && typeof categoryId === 'string' && categoryId.trim()) {
      where.categoryId = categoryId.trim();
    }

    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { updatedAt: 'desc' },
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
          _count: {
            select: {
              orderItems: true,
              inventoryTransactions: true,
            },
          },
        },
      }),
    ]);

    let enriched = products.map((p) => {
      const stockStatus = getStockStatus(p.stockQuantity, p.lowStockThreshold);
      const isLowStock = p.stockQuantity <= p.lowStockThreshold;
      return {
        ...p,
        stockStatus,
        isLowStock,
      };
    });

    if (lowStockOnly === 'true') {
      enriched = enriched.filter((p) => p.isLowStock);
    }

    return res.status(200).json({
      success: true,
      data: enriched,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err: any) {
    console.error('[Products:adminGetProducts:Error]', err);
    return res.status(500).json({ success: false, error: { message: err?.message || 'Failed to fetch admin products' } });
  }
};

/**
 * Admin: Get single product by ID
 */
export const adminGetProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!product) {
      return res.status(404).json({ success: false, error: { message: 'Product not found' } });
    }

    const stockStatus = getStockStatus(product.stockQuantity, product.lowStockThreshold);
    return res.status(200).json({
      success: true,
      data: {
        ...product,
        stockStatus,
      },
    });
  } catch (err: any) {
    console.error('[Products:adminGetProductById:Error]', err);
    return res.status(500).json({ success: false, error: { message: err?.message || 'Failed to fetch product' } });
  }
};

/**
 * Admin: Create product with initial inventory logging
 */
export const createProduct = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const {
      name,
      slug,
      description,
      categoryId,
      price,
      compareAtPrice,
      images,
      sku,
      stockQuantity = 0,
      lowStockThreshold = 5,
      isActive = true,
    } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, error: { message: 'Product name is required' } });
    }

    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({ success: false, error: { message: 'Valid positive price is required' } });
    }

    const initialStock = Math.max(0, parseInt(stockQuantity, 10) || 0);
    const threshold = Math.max(0, parseInt(lowStockThreshold, 10) || 5);

    // Auto-resolve or create category if needed
    let targetCategoryId = categoryId;
    if (targetCategoryId) {
      const exists = await prisma.productCategory.findUnique({ where: { id: targetCategoryId } });
      if (!exists) targetCategoryId = null;
    }
    if (!targetCategoryId) {
      let defaultCat = await prisma.productCategory.findFirst();
      if (!defaultCat) {
        defaultCat = await prisma.productCategory.create({
          data: {
            name: 'General Equipment',
            slug: 'general-equipment',
            description: 'Martial arts gear and equipment',
            isActive: true,
          },
        });
      }
      targetCategoryId = defaultCat.id;
    }

    // Auto-resolve unique slug
    let baseSlug = slugify(slug || name);
    let finalSlug = baseSlug;
    let slugIndex = 1;
    while (await prisma.product.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${slugIndex++}`;
    }

    // Auto-resolve unique SKU
    let baseSku = (sku || `SKU-${Date.now().toString().slice(-6)}`).toUpperCase().trim();
    let finalSku = baseSku;
    while (await prisma.product.findUnique({ where: { sku: finalSku } })) {
      finalSku = `${baseSku}-${Math.floor(100 + Math.random() * 900)}`;
    }

    const cleanImages = Array.isArray(images) ? images.filter((img: any) => typeof img === 'string' && img.trim()) : [];

    // Atomic transaction for Product and Initial Stock Transaction
    const product = await prisma.$transaction(async (tx) => {
      const newProd = await tx.product.create({
        data: {
          name: name.trim(),
          slug: finalSlug,
          description: description?.trim() || '',
          categoryId: targetCategoryId,
          price: numPrice,
          compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null,
          images: cleanImages,
          sku: finalSku,
          stockQuantity: initialStock,
          lowStockThreshold: threshold,
          isActive: Boolean(isActive),
        },
        include: {
          category: true,
        },
      });

      if (initialStock > 0) {
        await tx.inventoryTransaction.create({
          data: {
            productId: newProd.id,
            transactionType: 'STOCK_ADDITION',
            quantityChanged: initialStock,
            previousStock: 0,
            updatedStock: initialStock,
            reason: 'Initial stock on product creation',
            performedBy: user?.name || user?.email || 'Admin',
          },
        });
      }

      return newProd;
    });

    return res.status(201).json({ success: true, data: product });
  } catch (err: any) {
    console.error('[Products:createProduct:Error]', err);
    return res.status(500).json({ success: false, error: { message: err?.message || 'Failed to create product' } });
  }
};

/**
 * Admin: Update product details
 */
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const {
      name,
      slug,
      description,
      categoryId,
      price,
      compareAtPrice,
      images,
      sku,
      stockQuantity,
      lowStockThreshold,
      isActive,
    } = req.body;

    const existing = await prisma.product.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: { message: 'Product not found' } });
    }

    let finalSlug = existing.slug;
    if (slug && slug !== existing.slug) {
      finalSlug = slugify(slug);
      const duplicateSlug = await prisma.product.findUnique({ where: { slug: finalSlug } });
      if (duplicateSlug && duplicateSlug.id !== id) {
        return res.status(400).json({ success: false, error: { message: 'Slug already taken' } });
      }
    }

    let finalSku = existing.sku;
    if (sku && sku.toUpperCase().trim() !== existing.sku) {
      finalSku = sku.toUpperCase().trim();
      const duplicateSku = await prisma.product.findUnique({ where: { sku: finalSku } });
      if (duplicateSku && duplicateSku.id !== id) {
        return res.status(400).json({ success: false, error: { message: 'SKU already taken' } });
      }
    }

    if (categoryId && categoryId !== existing.categoryId) {
      const cat = await prisma.productCategory.findUnique({ where: { id: categoryId } });
      if (!cat) {
        return res.status(400).json({ success: false, error: { message: 'Category not found' } });
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Check if stockQuantity is being updated manually
      let stockUpdate = undefined;
      if (stockQuantity !== undefined) {
        const newStock = Math.max(0, parseInt(stockQuantity, 10));
        if (newStock !== existing.stockQuantity) {
          const diff = newStock - existing.stockQuantity;
          await tx.inventoryTransaction.create({
            data: {
              productId: id,
              transactionType: 'MANUAL_ADJUSTMENT',
              quantityChanged: diff,
              previousStock: existing.stockQuantity,
              updatedStock: newStock,
              reason: 'Manual stock adjustment via product edit',
              performedBy: user?.name || user?.email || 'Admin',
            },
          });
          stockUpdate = newStock;
        }
      }

      return await tx.product.update({
        where: { id },
        data: {
          name: name !== undefined ? name.trim() : undefined,
          slug: finalSlug,
          description: description !== undefined ? description.trim() : undefined,
          categoryId: categoryId !== undefined ? categoryId : undefined,
          price: price !== undefined ? parseFloat(price) : undefined,
          compareAtPrice: compareAtPrice !== undefined ? (compareAtPrice ? parseFloat(compareAtPrice) : null) : undefined,
          images: Array.isArray(images) ? images : undefined,
          sku: finalSku,
          stockQuantity: stockUpdate !== undefined ? stockUpdate : undefined,
          lowStockThreshold: lowStockThreshold !== undefined ? Math.max(0, parseInt(lowStockThreshold, 10)) : undefined,
          isActive: isActive !== undefined ? Boolean(isActive) : undefined,
        },
        include: {
          category: true,
        },
      });
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    console.error('[Products:updateProduct:Error]', err);
    return res.status(500).json({ success: false, error: { message: err?.message || 'Failed to update product' } });
  }
};

/**
 * Admin: Delete product
 */
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.product.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: { message: 'Product not found' } });
    }

    // Clean up dependent inventory transactions
    await prisma.inventoryTransaction.deleteMany({
      where: { productId: id },
    });

    // Detach from any order items (snapshot data remains preserved)
    await prisma.orderItem.updateMany({
      where: { productId: id },
      data: { productId: null },
    });

    // Delete the product permanently
    await prisma.product.delete({
      where: { id },
    });

    return res.status(200).json({ success: true, message: `Product "${existing.name}" successfully deleted` });
  } catch (err: any) {
    console.error('[Products:deleteProduct:Error]', err);
    return res.status(500).json({ success: false, error: { message: err?.message || 'Failed to delete product' } });
  }
};
