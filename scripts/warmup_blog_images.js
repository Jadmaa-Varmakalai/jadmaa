import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';

const urls = [
  'https://kakomchteolqajcjjgtr.supabase.co/storage/v1/object/public/blog-images/uploads/20830_1792459583566_kxb8u6.png',
  'https://kakomchteolqajcjjgtr.supabase.co/storage/v1/object/public/blog-images/uploads/Gemini_Generated_Image_g8qxorg_1792509127457_1r91q9.png',
  'https://kakomchteolqajcjjgtr.supabase.co/storage/v1/object/public/blog-images/uploads/Gemini_Generated_Image_g8qxorg_1792507969451_n41y0q.png',
  'https://kakomchteolqajcjjgtr.supabase.co/storage/v1/object/public/blog-images/uploads/ChatGPT_Image_Dec_20__2025__01_1792511496975_avzq5b.png'
];

const variants = [
  { w: 360, q: 80, f: 'webp' },
  { w: 480, q: 80, f: 'webp' },
  { w: 720, q: 80, f: 'webp' },
  { w: 1200, q: 82, f: 'webp' }
];

async function warmup() {
  const cacheDir = path.join(process.cwd(), 'public', 'images', 'cache');
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  for (const url of urls) {
    try {
      console.log('Fetching', url.split('/').pop());
      const res = await fetch(url);
      if (!res.ok) {
        console.error('Failed to fetch:', res.status);
        continue;
      }
      const rawBuf = Buffer.from(await res.arrayBuffer());
      console.log('Original bytes:', rawBuf.length);

      for (const v of variants) {
        const hash = crypto
          .createHash('sha256')
          .update(`${url}__w${v.w}__hauto__f${v.f}__q${v.q}`)
          .digest('hex')
          .slice(0, 32);

        const outPath = path.join(cacheDir, `${hash}.${v.f}`);
        const optBuf = await sharp(rawBuf)
          .resize(v.w, undefined, { fit: 'cover', withoutEnlargement: true })
          .webp({ quality: v.q, effort: 4 })
          .toBuffer();

        fs.writeFileSync(outPath, optBuf);
        console.log(`  -> Generated ${v.w}w ${v.f}: ${optBuf.length} bytes (saved to ${hash}.${v.f})`);
      }
    } catch (e) {
      console.error('Warmup error for', url, e.message);
    }
  }
  console.log('Warmup complete!');
}

warmup();

