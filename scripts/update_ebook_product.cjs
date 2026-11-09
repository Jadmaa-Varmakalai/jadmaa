const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function run() {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'ebooks');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const sampleRarPath = path.join(uploadsDir, 'Rare_Siddhar_Varma_20_Books_Collection.rar');
  if (!fs.existsSync(sampleRarPath)) {
    fs.writeFileSync(sampleRarPath, Buffer.from('Rar!\x1a\x07\x00JADMAA_SIDDHAR_VARMA_20_BOOKS_COLLECTION_ARCHIVE_PLACEHOLDER'));
    console.log('Created sample archive at', sampleRarPath);
  }

  const updated = await prisma.product.update({
    where: { id: '748c2416-15ca-40f0-8727-54e15f89eec7' },
    data: {
      isDigital: true,
      fileType: 'rar',
      fileSize: '1.0 GB (20 Books Collection)',
      fileName: 'Rare_Siddhar_Varma_20_Books_Collection.rar',
      downloadUrl: '/uploads/ebooks/Rare_Siddhar_Varma_20_Books_Collection.rar',
      stockQuantity: 9999, // unlimited stock for digital downloads
    }
  });

  console.log('Updated product successfully:', {
    id: updated.id,
    name: updated.name,
    isDigital: updated.isDigital,
    fileType: updated.fileType,
    fileSize: updated.fileSize,
    fileName: updated.fileName,
    downloadUrl: updated.downloadUrl,
    stockQuantity: updated.stockQuantity,
  });

  await prisma.$disconnect();
}

run().catch(err => {
  console.error('Error updating product:', err);
  process.exit(1);
});

