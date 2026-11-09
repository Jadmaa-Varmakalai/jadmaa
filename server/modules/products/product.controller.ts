import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
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
    const slug = String(req.params.slug);

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
    const id = String(req.params.id);
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
      isDigital = false,
      downloadUrl = null,
      fileType = null,
      fileSize = null,
      fileName = null,
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
          isDigital: Boolean(isDigital),
          downloadUrl: downloadUrl ? downloadUrl.trim() : null,
          fileType: fileType ? fileType.trim().toLowerCase() : null,
          fileSize: fileSize ? fileSize.trim() : null,
          fileName: fileName ? fileName.trim() : null,
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
    const id = String(req.params.id);
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
      isDigital,
      downloadUrl,
      fileType,
      fileSize,
      fileName,
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
          isDigital: isDigital !== undefined ? Boolean(isDigital) : undefined,
          downloadUrl: downloadUrl !== undefined ? (downloadUrl ? downloadUrl.trim() : null) : undefined,
          fileType: fileType !== undefined ? (fileType ? fileType.trim().toLowerCase() : null) : undefined,
          fileSize: fileSize !== undefined ? (fileSize ? fileSize.trim() : null) : undefined,
          fileName: fileName !== undefined ? (fileName ? fileName.trim() : null) : undefined,
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
    const id = String(req.params.id);

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

/**
 * Check if the current user has access to download the digital product
 */
export const checkProductAccess = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const user = (req as any).user;

    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      select: {
        id: true,
        name: true,
        isDigital: true,
        fileType: true,
        fileSize: true,
        fileName: true,
      },
    });

    if (!product) {
      return res.status(404).json({ success: false, error: { message: 'Product not found' } });
    }

    if (!product.isDigital) {
      return res.status(200).json({
        success: true,
        data: {
          hasAccess: false,
          isDigital: false,
        },
      });
    }

    if (!user || !user.id) {
      return res.status(200).json({
        success: true,
        data: {
          hasAccess: false,
          isDigital: true,
          fileName: product.fileName,
          fileType: product.fileType,
          fileSize: product.fileSize,
        },
      });
    }

    // Admins always have access
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      return res.status(200).json({
        success: true,
        data: {
          hasAccess: true,
          isAdmin: true,
          isDigital: true,
          fileName: product.fileName,
          fileType: product.fileType,
          fileSize: product.fileSize,
        },
      });
    }

    // Check if user has an order with SUCCESS paymentStatus containing this product
    const orderItem = await prisma.orderItem.findFirst({
      where: {
        productId: product.id,
        order: {
          userId: user.id,
          paymentStatus: 'SUCCESS',
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        hasAccess: Boolean(orderItem),
        isDigital: true,
        fileName: product.fileName,
        fileType: product.fileType,
        fileSize: product.fileSize,
      },
    });
  } catch (err: any) {
    console.error('[Products:checkProductAccess:Error]', err);
    return res.status(500).json({ success: false, error: { message: err?.message || 'Failed to check access' } });
  }
};

/**
 * Download product file
 */
export const downloadProductFile = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const user = (req as any).user;

    if (!user || !user.id) {
      return res.status(401).json({ success: false, error: { message: 'Authentication required to download this asset.' } });
    }

    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
    });

    if (!product) {
      return res.status(404).json({ success: false, error: { message: 'Product not found' } });
    }

    if (!product.isDigital) {
      return res.status(400).json({ success: false, error: { message: 'This item is not a digital downloadable product.' } });
    }

    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

    if (!isAdmin) {
      const orderItem = await prisma.orderItem.findFirst({
        where: {
          productId: product.id,
          order: {
            userId: user.id,
            paymentStatus: 'SUCCESS',
          },
        },
      });

      if (!orderItem) {
        return res.status(403).json({
          success: false,
          error: { message: 'You have not purchased this eBook yet. Please complete checkout to download.' },
        });
      }
    }

    if (!product.downloadUrl) {
      return res.status(404).json({
        success: false,
        error: { message: 'The digital download file has not been uploaded yet. Please contact support.' },
      });
    }

    const downloadTarget = product.downloadUrl.trim();

    // If external URL (Google Drive, Cloud Storage, S3, Dropbox, etc.)
    if (downloadTarget.startsWith('http://') || downloadTarget.startsWith('https://')) {
      return res.redirect(downloadTarget);
    }

    // Local file delivery
    const sanitizedRelative = downloadTarget.replace(/^\/+/, '');
    const localFilePath = path.join(process.cwd(), 'public', sanitizedRelative);

    if (fs.existsSync(localFilePath)) {
      const exportName = product.fileName || path.basename(localFilePath);
      return res.download(localFilePath, exportName);
    }

    return res.status(404).json({
      success: false,
      error: { message: 'File asset is currently unavailable on server. Please contact support.' },
    });
  } catch (err: any) {
    console.error('[Products:downloadProductFile:Error]', err);
    return res.status(500).json({ success: false, error: { message: err?.message || 'Download failed' } });
  }
};

/**
 * Admin: Upload eBook / digital file (.rar, .zip, .pdf)
 */
export const adminUploadEbookFile = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return res.status(403).json({ success: false, error: { message: 'Admin access required' } });
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'ebooks');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Check if JSON body with base64 data
    if (req.body && req.body.fileData) {
      const { fileData, filename, fileSize } = req.body;
      const cleanName = (filename || `ebook_${Date.now()}.rar`).replace(/[^a-zA-Z0-9._-]/g, '_');
      const targetExt = path.extname(cleanName).toLowerCase().replace('.', '');
      if (!['rar', 'zip', 'pdf'].includes(targetExt)) {
        return res.status(400).json({ success: false, error: { message: 'Only .rar, .zip, and .pdf formats are permitted.' } });
      }

      const match = fileData.match(/^data:application\/([a-zA-Z0-9+.-]+);base64,(.+)$/) || fileData.match(/^data:[^;]+;base64,(.+)$/);
      const base64Content = match ? match[match.length - 1] : fileData;
      const fileBuffer = Buffer.from(base64Content, 'base64');
      const finalFileName = `${Date.now()}_${cleanName}`;
      const filePath = path.join(uploadsDir, finalFileName);
      fs.writeFileSync(filePath, fileBuffer);

      const sizeStr = fileSize || (fileBuffer.length > 1024 * 1024 * 1024
        ? `${(fileBuffer.length / (1024 * 1024 * 1024)).toFixed(2)} GB`
        : `${(fileBuffer.length / (1024 * 1024)).toFixed(2)} MB`);

      return res.status(200).json({
        success: true,
        data: {
          fileUrl: `/uploads/ebooks/${finalFileName}`,
          fileName: cleanName,
          fileSize: sizeStr,
          fileType: targetExt,
        },
      });
    }

    // Streaming body with x-filename header
    const rawFileName = (req.headers['x-filename'] as string) || (req.query.filename as string);
    if (rawFileName) {
      const cleanName = decodeURIComponent(rawFileName).replace(/[^a-zA-Z0-9._-]/g, '_');
      const targetExt = path.extname(cleanName).toLowerCase().replace('.', '');
      if (!['rar', 'zip', 'pdf'].includes(targetExt)) {
        return res.status(400).json({ success: false, error: { message: 'Only .rar, .zip, and .pdf formats are permitted.' } });
      }

      const finalFileName = `${Date.now()}_${cleanName}`;
      const filePath = path.join(uploadsDir, finalFileName);
      const writeStream = fs.createWriteStream(filePath);

      let bytesReceived = 0;
      req.on('data', (chunk) => {
        bytesReceived += chunk.length;
      });

      req.pipe(writeStream);

      writeStream.on('finish', () => {
        const sizeStr = bytesReceived > 1024 * 1024 * 1024
          ? `${(bytesReceived / (1024 * 1024 * 1024)).toFixed(2)} GB`
          : `${(bytesReceived / (1024 * 1024)).toFixed(2)} MB`;

        return res.status(200).json({
          success: true,
          data: {
            fileUrl: `/uploads/ebooks/${finalFileName}`,
            fileName: cleanName,
            fileSize: sizeStr,
            fileType: targetExt,
          },
        });
      });

      writeStream.on('error', (err) => {
        console.error('[UploadEbook:StreamError]', err);
        return res.status(500).json({ success: false, error: { message: 'File upload stream failed' } });
      });

      return;
    }

    return res.status(400).json({ success: false, error: { message: 'No file data or filename provided.' } });
  } catch (err: any) {
    console.error('[Products:adminUploadEbookFile:Error]', err);
    return res.status(500).json({ success: false, error: { message: err?.message || 'Upload failed' } });
  }
};
