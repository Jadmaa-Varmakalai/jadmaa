import sharp from 'sharp';
import fs from 'fs';

async function generateHomepageHeroPreview() {
  const width = 1200;
  const height = 630;

  // 1. Base cream canvas
  const canvas = sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 250, g: 246, b: 240 } // #FAF6F0
    }
  });

  // 2. Instructor kick image on right side
  let kickBuf;
  const kickPath = 'public/images/hero-kick-action-transparent.png';
  if (fs.existsSync(kickPath)) {
    kickBuf = await sharp(kickPath)
      .resize({ height: 560, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();
  }

  // 3. Logo
  let logoBuf;
  const logoPath = 'public/images/logo-1.png';
  if (fs.existsSync(logoPath)) {
    logoBuf = await sharp(logoPath)
      .resize(80, 80, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();
  }

  // 4. SVG Overlay for left side branding & typography
  const textSvg = Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <!-- Decorative background accent curves -->
      <circle cx="1100" cy="315" r="380" fill="#F2EDE4" opacity="0.6" />
      <circle cx="1100" cy="315" r="280" fill="#E8DDD0" opacity="0.4" />

      <!-- Left Branding Header -->
      <text x="165" y="78" font-family="DejaVu Sans, Arial, sans-serif" font-size="18" font-weight="bold" letter-spacing="2" fill="#B12B2B">JADMAA VARMAKALAI</text>
      <text x="165" y="102" font-family="DejaVu Sans, Arial, sans-serif" font-size="13" font-weight="500" fill="#5C5148">Ancient Power. Modern Training.</text>

      <!-- Eyebrow Pill -->
      <rect x="70" y="145" width="310" height="30" rx="15" fill="#FFF1F1" stroke="#F5C2C2" stroke-width="1" />
      <text x="225" y="165" font-family="DejaVu Sans, Arial, sans-serif" font-size="11" font-weight="bold" fill="#B12B2B" text-anchor="middle" letter-spacing="1">1000+ YEAR OLD MOTHER OF MARTIAL ARTS</text>

      <!-- Headline -->
      <text x="70" y="230" font-family="DejaVu Sans, Arial, sans-serif" font-size="38" font-weight="bold" fill="#2B2521">
        <tspan x="70" dy="0">Learn the Ancient Science</tspan>
        <tspan x="70" dy="48">of Varmakalai</tspan>
      </text>

      <!-- Subtitle -->
      <text x="70" y="340" font-family="DejaVu Sans, Arial, sans-serif" font-size="16" font-weight="normal" fill="#5C5148">
        <tspan x="70" dy="0">Empower your body, sharpen your mind, and preserve a timeless</tspan>
        <tspan x="70" dy="24">tradition through authentic Varmakalai martial arts training.</tspan>
      </text>

      <!-- Key Stats Bar -->
      <g transform="translate(70, 420)">
        <rect width="600" height="74" rx="12" fill="#FFFFFF" stroke="#E8DDD0" stroke-width="1.5" />
        
        <text x="75" y="32" font-family="DejaVu Sans, Arial, sans-serif" font-size="18" font-weight="bold" fill="#2B2521" text-anchor="middle">1000+</text>
        <text x="75" y="52" font-family="DejaVu Sans, Arial, sans-serif" font-size="10" font-weight="bold" fill="#7A6E65" text-anchor="middle">Yrs Tradition</text>
        <line x1="150" y1="18" x2="150" y2="56" stroke="#E8DDD0" stroke-width="1" />

        <text x="225" y="32" font-family="DejaVu Sans, Arial, sans-serif" font-size="18" font-weight="bold" fill="#2B2521" text-anchor="middle">3</text>
        <text x="225" y="52" font-family="DejaVu Sans, Arial, sans-serif" font-size="10" font-weight="bold" fill="#7A6E65" text-anchor="middle">Branches</text>
        <line x1="300" y1="18" x2="300" y2="56" stroke="#E8DDD0" stroke-width="1" />

        <text x="375" y="32" font-family="DejaVu Sans, Arial, sans-serif" font-size="18" font-weight="bold" fill="#2B2521" text-anchor="middle">5</text>
        <text x="375" y="52" font-family="DejaVu Sans, Arial, sans-serif" font-size="10" font-weight="bold" fill="#7A6E65" text-anchor="middle">Structured Courses</text>
        <line x1="450" y1="18" x2="450" y2="56" stroke="#E8DDD0" stroke-width="1" />

        <text x="525" y="32" font-family="DejaVu Sans, Arial, sans-serif" font-size="18" font-weight="bold" fill="#2B2521" text-anchor="middle">10+</text>
        <text x="525" y="52" font-family="DejaVu Sans, Arial, sans-serif" font-size="10" font-weight="bold" fill="#7A6E65" text-anchor="middle">Aasan Exp.</text>
      </g>

      <!-- Location Footer Badge -->
      <rect x="70" y="525" width="460" height="42" rx="8" fill="#FAF6F0" stroke="#E8DDD0" stroke-width="1" />
      <text x="90" y="551" font-family="DejaVu Sans, Arial, sans-serif" font-size="13" font-weight="bold" fill="#B12B2B">📍 Branches:</text>
      <text x="180" y="551" font-family="DejaVu Sans, Arial, sans-serif" font-size="13" font-weight="600" fill="#2B2521">Thanjavur • Kumbakonam • Ariyalur</text>
    </svg>
  `);

  const composites = [
    { input: textSvg, top: 0, left: 0 }
  ];

  if (logoBuf) {
    composites.push({ input: logoBuf, top: 40, left: 70 });
  }

  if (kickBuf) {
    // Position instructor on right side
    composites.push({ input: kickBuf, top: 35, left: 810 });
  }

  const outputBuf = await canvas.composite(composites).jpeg({ quality: 88 }).toBuffer();
  console.log('Homepage hero preview generated successfully! Bytes:', outputBuf.length);
  fs.writeFileSync('public/images/jadmaa-hero-preview.jpg', outputBuf);
}

generateHomepageHeroPreview().catch(console.error);
