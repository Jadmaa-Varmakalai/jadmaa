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

/**
 * Public: Get all active categories with product counts
 * Admin: Can include inactive with ?all=true
 */
export const getCategories = async (req: Request, res: Response) => {
  try {
    const { all } = req.query;
    const user = (req as any).user;
    const isAdmin = user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.isAdmin);

    const where: any = {};
    if (!all || !isAdmin) {
      where.isActive = true;
    }

    const categories = await prisma.productCategory.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            products: {
              where: isAdmin ? undefined : { isActive: true },
            },
          },
        },
      },
    });

    return res.status(200).json({ success: true, data: categories });
  } catch (err: any) {
    console.error('[Categories:getCategories:Error]', err);
    return res.status(500).json({ success: false, error: { message: err?.message || 'Failed to fetch categories' } });
  }
};

/**
 * Public: Get category by slug or id
 */
export const getCategoryBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const category = await prisma.productCategory.findFirst({
      where: {
        OR: [{ slug }, { id: slug }],
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      return res.status(404).json({ success: false, error: { message: 'Category not found' } });
    }

    return res.status(200).json({ success: true, data: category });
  } catch (err: any) {
    console.error('[Categories:getCategoryBySlug:Error]', err);
    return res.status(500).json({ success: false, error: { message: err?.message || 'Failed to fetch category' } });
  }
};

/**
 * Admin: Create category
 */
export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, slug, description, image, isActive } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, error: { message: 'Category name is required' } });
    }

    const finalSlug = slugify(slug || name);
    if (!finalSlug) {
      return res.status(400).json({ success: false, error: { message: 'Invalid slug generated' } });
    }

    const existing = await prisma.productCategory.findUnique({
      where: { slug: finalSlug },
    });

    if (existing) {
      return res.status(400).json({ success: false, error: { message: 'Category with this slug already exists' } });
    }

    const category = await prisma.productCategory.create({
      data: {
        name: name.trim(),
        slug: finalSlug,
        description: description?.trim() || null,
        image: image || null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    return res.status(201).json({ success: true, data: category });
  } catch (err: any) {
    console.error('[Categories:createCategory:Error]', err);
    return res.status(500).json({ success: false, error: { message: err?.message || 'Failed to create category' } });
  }
};

/**
 * Admin: Update category
 */
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, slug, description, image, isActive } = req.body;

    const existing = await prisma.productCategory.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: { message: 'Category not found' } });
    }

    let finalSlug = existing.slug;
    if (slug && slug !== existing.slug) {
      finalSlug = slugify(slug);
      const duplicate = await prisma.productCategory.findUnique({
        where: { slug: finalSlug },
      });
      if (duplicate && duplicate.id !== id) {
        return res.status(400).json({ success: false, error: { message: 'Slug already taken by another category' } });
      }
    } else if (name && name !== existing.name && !slug) {
      // Keep existing slug unless user explicitly provided a new one
    }

    const category = await prisma.productCategory.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        slug: finalSlug,
        description: description !== undefined ? (description?.trim() || null) : undefined,
        image: image !== undefined ? (image || null) : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      },
    });

    return res.status(200).json({ success: true, data: category });
  } catch (err: any) {
    console.error('[Categories:updateCategory:Error]', err);
    return res.status(500).json({ success: false, error: { message: err?.message || 'Failed to update category' } });
  }
};

/**
 * Admin: Delete category
 */
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const productCount = await prisma.product.count({
      where: { categoryId: id },
    });

    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        error: { message: `Cannot delete category because it has ${productCount} associated product(s). Please reassign or delete them first.` },
      });
    }

    await prisma.productCategory.delete({
      where: { id },
    });

    return res.status(200).json({ success: true, message: 'Category deleted successfully' });
  } catch (err: any) {
    console.error('[Categories:deleteCategory:Error]', err);
    return res.status(500).json({ success: false, error: { message: err?.message || 'Failed to delete category' } });
  }
};
