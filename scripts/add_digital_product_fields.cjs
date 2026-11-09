const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('Checking and adding digital product fields to Product table...');
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Product" 
      ADD COLUMN IF NOT EXISTS "isDigital" BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS "downloadUrl" TEXT,
      ADD COLUMN IF NOT EXISTS "fileType" TEXT,
      ADD COLUMN IF NOT EXISTS "fileSize" TEXT,
      ADD COLUMN IF NOT EXISTS "fileName" TEXT;
    `);
    console.log('Successfully added columns (or they already existed).');

    // Check product 'Rare Siddhar Varma Book Collections'
    const product = await prisma.product.findFirst({
      where: {
        OR: [
          { slug: 'rare-siddhar-varma-book-collections' },
          { id: '748c2416-15ca-40f0-8727-54e15f89eec7' }
        ]
      }
    });

    console.log('Found target product:', product ? { id: product.id, name: product.name, slug: product.slug } : 'Not found');
    
    // Check raw row for columns
    const rawCols = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Product' 
      ORDER BY ordinal_position;
    `);
    console.log('Product columns:', rawCols.map(c => c.column_name));
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
