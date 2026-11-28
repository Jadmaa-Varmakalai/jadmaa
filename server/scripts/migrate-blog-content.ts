import { PrismaClient } from '@prisma/client';

const DEFAULT_BLOG_CONTACT_TEMPLATE = `<p>📍 <strong>JADMAA வர்மக்கலை:</strong> கும்பகோணம் | தஞ்சாவூர் | அரியலூர்</p>

<p>👉 <a href="https://wa.me/919345220020?text=Hello%20JADMAA%20Varmakalai%2C%20I%20want%20to%20know%20about%20classes" target="_blank" rel="noopener"><strong>Chat on WhatsApp: +91 93452 20020</strong></a></p>
<p>📞 <a href="tel:+919345220020"><strong>Call Now: +91 93452 20020</strong></a></p>

<p>Ready to begin? <a href="/courses/">Explore the Basic Varmakalai Training course</a> or <a href="/contact/">book a Treatment Consulting</a> at Thanjavur, Kumbakonam, or Ariyalur.</p>`;

function extractPlainTextBody(htmlOrMd: string): string {
  if (!htmlOrMd) return '';

  let text = htmlOrMd
    // Preserve paragraph & line breaks
    .replace(/<\/(p|div|h[1-6]|li|blockquote|tr)>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    // Strip remaining HTML tags
    .replace(/<[^>]+>/g, '')
    // Decode common HTML entities
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");

  // Remove old contact footer block if present
  text = text.replace(
    /📍\s*JADMAA\s*வர்மக்கலை[\s\S]*?(?:Thanjavur,\s*Kumbakonam,\s*or\s*Ariyalur\.?|அரியலூர்)/gi,
    ''
  );
  text = text.replace(
    /Ready to begin\?[\s\S]*?Thanjavur,\s*Kumbakonam,\s*or\s*Ariyalur\.?/gi,
    ''
  );

  // Clean up excessive whitespace/newlines
  return text
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const blogs = await prisma.blogPost.findMany({
      select: { id: true, slug: true, title: true, excerpt: true, content: true },
    });

    console.log(`Found ${blogs.length} blog(s) to inspect/migrate.`);

    for (const blog of blogs) {
      const extracted = extractPlainTextBody(blog.content || '');
      const nextExcerpt =
        extracted.length > 0
          ? extracted
          : (blog.excerpt || '').trim();

      await prisma.blogPost.update({
        where: { id: blog.id },
        data: {
          excerpt: nextExcerpt,
          content: DEFAULT_BLOG_CONTACT_TEMPLATE,
        },
      });

      console.log(`Migrated blog [${blog.id}] slug="${blog.slug}" (excerpt length: ${nextExcerpt.length})`);
    }

    console.log('Blog content migration completed successfully.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
