import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Product Categories and Products...');

  const categoriesData = [
    {
      name: 'Uniforms & Belts',
      slug: 'uniforms-and-belts',
      description: 'Official tournament and training gi, doboks, and master ranking belts.',
      image: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Sparring & Protective Gear',
      slug: 'sparring-and-protection',
      description: 'High-density foam protectors, gloves, shin guards, and headgear for safe combat.',
      image: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Traditional Training Tools',
      slug: 'traditional-tools',
      description: 'Wooden bokken, jo staffs, and hand conditioning gear inspired by Okinawan tradition.',
      image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Academy Apparel & Essentials',
      slug: 'academy-apparel',
      description: 'High performance dry-fit tees, kit bags, and hydration gear for everyday practice.',
      image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    },
  ];

  const categoriesMap = new Map<string, string>();

  for (const cat of categoriesData) {
    const existing = await prisma.productCategory.findUnique({ where: { slug: cat.slug } });
    if (!existing) {
      const created = await prisma.productCategory.create({
        data: {
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          image: cat.image,
          isActive: true,
        },
      });
      categoriesMap.set(cat.slug, created.id);
      console.log(`Created Category: ${cat.name}`);
    } else {
      categoriesMap.set(cat.slug, existing.id);
    }
  }

  const productsData = [
    {
      name: 'JADMAA Master Edition Heavyweight Karate Gi (14oz)',
      slug: 'jadmaa-master-heavyweight-karate-gi',
      description: 'Crafted from 100% high-grade combed cotton canvas. Features reinforced quadruple stitching at stress points, crisp snap on strikes, and traditional Japanese cut tailored for kata and daily dojo training.',
      categorySlug: 'uniforms-and-belts',
      price: 2899,
      compareAtPrice: 3499,
      sku: 'GI-KATA-14OZ',
      stockQuantity: 25,
      lowStockThreshold: 5,
      images: [
        'https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80'
      ],
    },
    {
      name: 'Custom Embroidered Black Belt (Silk Satin Finish)',
      slug: 'custom-embroidered-black-belt-satin',
      description: 'Handcrafted master black belt featuring gold kanji calligraphy embroidery, 4.5cm width, multi-row stitch density, and interior woven core designed to age with distinguished grace.',
      categorySlug: 'uniforms-and-belts',
      price: 1199,
      compareAtPrice: 1499,
      sku: 'BELT-BLK-SATIN',
      stockQuantity: 18,
      lowStockThreshold: 4,
      images: [
        'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      name: 'Pro Kumite Sparring Gloves (WKF Style Approved)',
      slug: 'pro-kumite-sparring-gloves',
      description: 'Ultra-lightweight pre-curved polyurethane foam core providing peak knuckle impact absorption. Ergonomic wrist strap with dual hook-and-loop closure for unmatched stability.',
      categorySlug: 'sparring-and-protection',
      price: 1450,
      compareAtPrice: 1799,
      sku: 'GLV-KUMITE-RED',
      stockQuantity: 12,
      lowStockThreshold: 5,
      images: [
        'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      name: 'High Impact Curved Focus Mitts (Pair)',
      slug: 'high-impact-curved-focus-mitts-pair',
      description: 'Contoured target pad engineered for trainers. High-density EVA foam and air-cushioned center absorbs the hardest kicks and strikes without wrist strain. Grip ball inside for secure palm hold.',
      categorySlug: 'sparring-and-protection',
      price: 2199,
      compareAtPrice: 2699,
      sku: 'PAD-CURVE-02',
      stockQuantity: 8,
      lowStockThreshold: 3,
      images: [
        'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      name: 'Traditional Japanese Red Oak Bokken (Wooden Katana)',
      slug: 'traditional-japanese-red-oak-bokken',
      description: 'Solid seasoned red oak sword crafted according to traditional Daito dimensions (101cm). Perfectly balanced for suburi swing practice, partner kata, and martial coordination drills.',
      categorySlug: 'traditional-tools',
      price: 1750,
      compareAtPrice: 2100,
      sku: 'WPN-BOKKEN-OAK',
      stockQuantity: 4, // Low stock demo!
      lowStockThreshold: 5,
      images: [
        'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      name: 'JADMAA Official Academy Performance Training Tee',
      slug: 'jadmaa-official-academy-training-tee',
      description: 'Breathable 4-way stretch moisture-wicking poly-spandex blend. Features subtle embossed JADMAA crest on chest and kanji motif on sleeve. Anti-odor and quick-drying.',
      categorySlug: 'academy-apparel',
      price: 799,
      compareAtPrice: 999,
      sku: 'APP-TEE-PERF',
      stockQuantity: 40,
      lowStockThreshold: 10,
      images: [
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
      ],
    },
  ];

  for (const prod of productsData) {
    const existing = await prisma.product.findUnique({ where: { slug: prod.slug } });
    const categoryId = categoriesMap.get(prod.categorySlug);

    if (!existing && categoryId) {
      await prisma.$transaction(async (tx) => {
        const created = await tx.product.create({
          data: {
            name: prod.name,
            slug: prod.slug,
            description: prod.description,
            categoryId,
            price: prod.price,
            compareAtPrice: prod.compareAtPrice,
            sku: prod.sku,
            stockQuantity: prod.stockQuantity,
            lowStockThreshold: prod.lowStockThreshold,
            images: prod.images,
            isActive: true,
          },
        });

        await tx.inventoryTransaction.create({
          data: {
            productId: created.id,
            transactionType: 'STOCK_ADDITION',
            quantityChanged: prod.stockQuantity,
            previousStock: 0,
            updatedStock: prod.stockQuantity,
            reason: 'Initial seed stock',
            performedBy: 'SYSTEM Seed',
          },
        });
      });
      console.log(`Created Product: ${prod.name} (Stock: ${prod.stockQuantity})`);
    }
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
