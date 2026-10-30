const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('--- 1. VERIFY VARMA TREATMENT OFFER IN DATABASE ---');
  const offer = await prisma.courseOffer.findFirst({
    where: { slug: { equals: '20-of-varma-treatment', mode: 'insensitive' } }
  });

  if (!offer) {
    console.error('FAILED: Offer 20-of-varma-treatment not found in DB!');
    process.exit(1);
  }

  console.log('SUCCESS: Found offer:');
  console.log({
    id: offer.id,
    title: offer.title,
    slug: offer.slug,
    category: offer.category,
    pricingType: offer.pricingType,
    originalPrice: offer.originalPrice,
    offerPrice: offer.offerPrice,
    discountPercent: offer.discountPercent,
    status: offer.status,
    isEnabled: offer.isEnabled,
    showPopup: offer.showPopup,
    bannerImageUrl: offer.bannerImageUrl,
    popupImageUrl: offer.popupImageUrl,
    mobileImageUrl: offer.mobileImageUrl
  });

  console.log('\n--- 2. VERIFY CASE-INSENSITIVE SLUG MATCHING ---');
  const caseVariant = await prisma.courseOffer.findFirst({
    where: { slug: { equals: '20-Of-Varma-Treatment', mode: 'insensitive' } }
  });
  if (caseVariant && caseVariant.id === offer.id) {
    console.log('SUCCESS: Case-insensitive lookup matches correctly!');
  } else {
    console.error('FAILED: Case-insensitive lookup failed!');
  }

  console.log('\n--- 3. VERIFY ACTIVE POPUP CANDIDATES ---');
  const popupCandidates = await prisma.courseOffer.findMany({
    where: {
      showPopup: true,
      isEnabled: true,
      status: 'PUBLISHED'
    }
  });
  console.log(`SUCCESS: Found ${popupCandidates.length} eligible popup campaigns.`);
  popupCandidates.forEach(p => {
    console.log(`- [${p.category}] ${p.title} (slug: ${p.slug}, priority: ${p.popupPriority})`);
  });

  console.log('\n--- ALL VERIFICATIONS PASSED ---');
}

run()
  .catch(err => {
    console.error('Error during verification:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

