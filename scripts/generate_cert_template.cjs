const fs = require('fs');
const path = require('path');

const logoB64 = fs.readFileSync('public/images/logo-1.b64.txt', 'utf8').trim();
const logoDataUri = 'data:image/png;base64,' + logoB64;

// Default sample QR Code SVG or placeholder
const sampleQrCode = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="white"/><path d="M10 10h30v30h-30z M50 10h10v10h-10z M70 10h20v20h-20z M10 50h10v10h-10z M30 50h30v30h-30z M70 40h10v20h-10z M10 70h20v20h-20z M70 70h20v20h-20z" fill="%232b2521"/><rect x="18" y="18" width="14" height="14" fill="%23b12b2b"/><rect x="78" y="78" width="4" height="4" fill="%23b12b2b"/></svg>';

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>JADMAA Certificate of Achievement | Official Certification</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
<style>
:root {
  --red: #B12B2B;
  --red-dark: #8F2020;
  --red-deep: #5A1414;
  --red-glow: rgba(177, 43, 43, 0.18);
  --gold: #C9A84C;
  --gold-light: #E8D48B;
  --gold-dark: #9E7F28;
  --gold-sheen: #FFF2C6;
  --cream: #FAF6F0;
  --cream-warm: #FFFDF9;
  --ink: #2B2521;
  --ink-soft: #3D352E;
  --muted: #5C5148;
  --soft: #8A7D72;
  --line: #E8DDD0;
  --line-gold: rgba(201, 168, 76, 0.45);
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  margin: 0;
  padding: 24px;
  background: #252220;
  background-image: radial-gradient(circle at 50% 30%, #3a3430 0%, #1e1b19 100%);
  color: var(--ink);
  font-family: 'Poppins', 'Segoe UI', -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* ---- Toolbar ---- */
.toolbar {
  width: min(1140px, 100%);
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.3);
}
.toolbar-info {
  display: flex;
  align-items: center;
  gap: 12px;
}
.toolbar-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(201, 168, 76, 0.2);
  border: 1px solid var(--gold);
  color: var(--gold-light);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: .08em;
  text-transform: uppercase;
  padding: 4px 10px;
  border-radius: 6px;
}
.toolbar p {
  font-size: 13px;
  color: #d8cec4;
  margin: 0;
}
.toolbar-actions {
  display: flex;
  gap: 10px;
}
.btn-print {
  background: linear-gradient(135deg, var(--red) 0%, var(--red-dark) 100%);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 10px 22px;
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 14px rgba(177, 43, 43, 0.4);
  transition: all 0.2s ease;
}
.btn-print:hover {
  background: linear-gradient(135deg, #c73232 0%, var(--red) 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(177, 43, 43, 0.55);
}

/* ---- Certificate Outer Container ---- */
.certificate-wrapper {
  width: min(1140px, 100%);
  padding: 14px;
  background: linear-gradient(135deg, #C9A84C 0%, #E8D48B 25%, #9E7F28 50%, #E8D48B 75%, #C9A84C 100%);
  border-radius: 4px;
  box-shadow: 0 25px 70px rgba(0, 0, 0, 0.65), 0 5px 20px rgba(0, 0, 0, 0.4);
}

.certificate {
  position: relative;
  isolation: isolate;
  width: 100%;
  min-height: 770px;
  background: #FFFDF9;
  background-image: 
    radial-gradient(ellipse at 50% 0%, rgba(201, 168, 76, 0.08) 0%, transparent 60%),
    radial-gradient(ellipse at 50% 100%, rgba(177, 43, 43, 0.06) 0%, transparent 60%),
    linear-gradient(to bottom, #FFFDF9, #FAF5ED 50%, #FFFDF9);
  border: 1px solid #D8CBB8;
  overflow: hidden;
  text-align: center;
}

/* Multi-layered Geometric Borders */
.cert-border-outer {
  position: absolute;
  inset: 12px;
  border: 3px solid var(--red);
  pointer-events: none;
  z-index: 1;
}
.cert-border-middle {
  position: absolute;
  inset: 18px;
  border: 1px dashed var(--gold);
  pointer-events: none;
  z-index: 1;
  opacity: 0.85;
}
.cert-border-inner {
  position: absolute;
  inset: 22px;
  border: 1px solid var(--line);
  pointer-events: none;
  z-index: 1;
}

/* Corner Filigree Ornaments */
.corner {
  position: absolute;
  width: 72px;
  height: 72px;
  z-index: 2;
  pointer-events: none;
}
.corner svg { width: 100%; height: 100%; display: block; }
.corner.tl { top: 24px; left: 24px; }
.corner.tr { top: 24px; right: 24px; transform: scaleX(-1); }
.corner.bl { bottom: 24px; left: 24px; transform: scaleY(-1); }
.corner.br { bottom: 24px; right: 24px; transform: scale(-1); }

/* Watermark Seal in Center */
.watermark {
  position: absolute;
  top: 52%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 440px;
  height: 440px;
  opacity: 0.045;
  pointer-events: none;
  z-index: 0;
  filter: grayscale(100%) contrast(150%);
}

/* Header Crest / Logo */
.cert-header {
  position: relative;
  z-index: 3;
  padding-top: 36px;
}
.crest-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 8px;
}
.crest-line {
  width: 90px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--gold));
}
.crest-line.right {
  background: linear-gradient(90deg, var(--gold), transparent);
}
.logo-img {
  width: 82px;
  height: 82px;
  object-fit: contain;
  filter: drop-shadow(0 3px 8px rgba(43, 37, 33, 0.15));
}
.brand-title {
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 38px;
  font-weight: 800;
  letter-spacing: .08em;
  color: var(--red);
  line-height: 1;
  text-transform: uppercase;
}
.brand-tagline {
  font-family: 'Poppins', sans-serif;
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: .32em;
  color: var(--gold-dark);
  text-transform: uppercase;
  margin-top: 5px;
}

/* Decorative Central Ornament */
.ornament-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin: 14px auto 10px;
  width: 320px;
}
.ornament-divider .line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--gold), transparent);
}
.ornament-divider .symbol {
  color: var(--gold);
  font-size: 13px;
}

/* Certificate Title Section */
.cert-title-section {
  position: relative;
  z-index: 3;
  margin-top: 2px;
}
.main-title {
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: clamp(34px, 4.4vw, 48px);
  font-weight: 800;
  letter-spacing: .03em;
  color: var(--ink);
  line-height: 1.1;
  text-transform: uppercase;
  margin: 0;
}
.sub-title {
  font-family: 'Poppins', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .36em;
  color: var(--red);
  text-transform: uppercase;
  margin-top: 4px;
}

/* Presentation Citation */
.presentation-text {
  font-family: 'Poppins', sans-serif;
  font-style: italic;
  font-weight: 400;
  font-size: 15px;
  color: var(--muted);
  margin-top: 14px;
}

/* Student Name with Gold Border Plinth */
.recipient-container {
  position: relative;
  z-index: 3;
  margin: 8px auto 6px;
  max-width: 720px;
  padding: 0 20px;
}
.recipient-name {
  display: inline-block;
  min-width: 60%;
  padding: 4px 28px 8px;
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: clamp(28px, 3.8vw, 42px);
  font-weight: 700;
  color: var(--red);
  border-bottom: 2px solid var(--gold);
  letter-spacing: .02em;
  text-shadow: 0 1px 2px rgba(0,0,0,0.06);
}

/* Course Recognition */
.course-recognition {
  font-family: 'Poppins', sans-serif;
  font-size: 13px;
  color: var(--muted);
  margin-top: 8px;
}
.course-title {
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 23px;
  font-weight: 700;
  color: var(--ink);
  max-width: 780px;
  margin: 5px auto 0;
  line-height: 1.35;
}
.citation-body {
  font-family: 'Poppins', sans-serif;
  font-size: 11.5px;
  line-height: 1.85;
  color: var(--soft);
  max-width: 740px;
  margin: 10px auto 0;
}

/* Verification Metadata Pill Bar */
.cert-meta-grid {
  display: flex;
  justify-content: center;
  gap: 36px;
  margin: 18px auto 0;
  padding: 8px 24px;
  background: rgba(245, 237, 224, 0.4);
  border: 1px solid var(--line);
  border-radius: 8px;
  max-width: 780px;
}
.meta-box {
  text-align: center;
}
.meta-box .meta-label {
  font-family: 'Poppins', sans-serif;
  font-size: 8.5px;
  font-weight: 600;
  letter-spacing: .16em;
  color: var(--soft);
  text-transform: uppercase;
}
.meta-box .meta-val {
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--ink);
  margin-top: 2px;
}

/* Bottom Signatures & Seal Section */
.cert-bottom-grid {
  display: grid;
  grid-template-columns: 1fr 140px 1fr;
  align-items: end;
  gap: 24px;
  max-width: 880px;
  margin: 24px auto 0;
  padding: 0 20px;
  position: relative;
  z-index: 3;
}
.signature-block {
  text-align: center;
}
.signature-line {
  width: 100%;
  height: 1px;
  background: var(--ink);
  margin-bottom: 6px;
}
.signature-name {
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 15px;
  font-weight: 700;
  color: var(--ink);
}
.signature-title {
  font-family: 'Poppins', sans-serif;
  font-size: 9.5px;
  color: var(--soft);
  text-transform: uppercase;
  letter-spacing: .08em;
  font-weight: 500;
  margin-top: 2px;
}

/* Authenticity Seal */
.seal-container {
  display: flex;
  justify-content: center;
}
.official-seal {
  width: 108px;
  height: 108px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #FFFDF9 0%, #FAF0DF 65%, #F0DFBF 100%);
  border: 2px solid var(--red);
  box-shadow: 
    0 0 0 3px #FFFDF9,
    0 0 0 5px var(--gold),
    0 6px 18px rgba(43, 37, 33, 0.16);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 6px;
  text-align: center;
}
.seal-inner-circle {
  position: absolute;
  inset: 4px;
  border: 1px dashed var(--gold-dark);
  border-radius: 50%;
  pointer-events: none;
}
.seal-brand {
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: .12em;
  color: var(--red);
  line-height: 1;
}
.seal-star {
  color: var(--gold);
  font-size: 15px;
  line-height: 1;
  margin: 3px 0;
}
.seal-caption {
  font-family: 'Poppins', sans-serif;
  font-size: 7.5px;
  font-weight: 700;
  letter-spacing: .22em;
  color: var(--gold-dark);
  text-transform: uppercase;
  line-height: 1.2;
}

/* Verification Footer */
.cert-footer-verification {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 14px;
  margin: 18px auto 0;
  padding: 8px 18px 22px;
  position: relative;
  z-index: 3;
}
.qr-frame {
  width: 54px;
  height: 54px;
  padding: 3px;
  background: white;
  border: 1px solid var(--line);
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.06);
}
.qr-frame img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}
.verification-details {
  text-align: left;
  font-family: 'Poppins', sans-serif;
  font-size: 9px;
  line-height: 1.6;
  color: var(--soft);
}
.verification-details strong {
  color: var(--ink);
  font-weight: 600;
  letter-spacing: .08em;
  text-transform: uppercase;
}
.verification-url {
  color: var(--red);
  font-weight: 500;
  word-break: break-all;
}

/* Micro Security / Footer Note */
.security-note {
  position: absolute;
  bottom: 8px;
  left: 0;
  right: 0;
  text-align: center;
  font-family: 'Poppins', sans-serif;
  font-size: 7.5px;
  letter-spacing: .18em;
  color: var(--soft);
  text-transform: uppercase;
  z-index: 3;
}

/* Editable focus ring */
[contenteditable="true"]:focus {
  outline: 2px solid rgba(177, 43, 43, 0.4);
  background: rgba(255, 247, 244, 0.85);
  border-radius: 4px;
}

/* ---- Print Styles (Strict A4 Landscape) ---- */
@page {
  size: A4 landscape;
  margin: 0;
}
@media print {
  body {
    padding: 0;
    margin: 0;
    background: white;
    min-height: 0;
    display: block;
  }
  .toolbar {
    display: none !important;
  }
  .certificate-wrapper {
    width: 297mm;
    height: 210mm;
    min-height: 210mm;
    max-height: 210mm;
    padding: 0;
    margin: 0;
    background: none;
    box-shadow: none;
    border-radius: 0;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .certificate {
    width: 297mm;
    height: 210mm;
    min-height: 210mm;
    max-height: 210mm;
    border: 0;
    background: #FFFDF9 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .cert-border-outer { inset: 5mm; }
  .cert-border-middle { inset: 7mm; }
  .cert-border-inner { inset: 8.5mm; }
  .corner { width: 18mm; height: 18mm; }
  .corner.tl { top: 9mm; left: 9mm; }
  .corner.tr { top: 9mm; right: 9mm; }
  .corner.bl { bottom: 9mm; left: 9mm; }
  .corner.br { bottom: 9mm; right: 9mm; }
  .cert-header { padding-top: 10mm; }
  .logo-img { width: 20mm; height: 20mm; }
  .brand-title { font-size: 26pt; }
  .main-title { font-size: 32pt; }
  .recipient-name { font-size: 28pt; }
  .course-title { font-size: 16pt; }
  .cert-meta-grid { margin-top: 4mm; padding: 2mm 5mm; }
  .cert-bottom-grid { margin-top: 5mm; }
  .official-seal { width: 25mm; height: 25mm; }
  .cert-footer-verification { margin-top: 3mm; padding-bottom: 2mm; }
  .qr-frame { width: 13mm; height: 13mm; }
}

/* Mobile responsive preview */
@media (max-width: 768px) {
  body { padding: 10px; }
  .toolbar { padding: 10px 14px; }
  .certificate-wrapper { padding: 6px; }
  .certificate { min-height: auto; padding-bottom: 24px; }
  .brand-title { font-size: 28px; }
  .main-title { font-size: 26px; }
  .recipient-name { font-size: 24px; min-width: 85%; }
  .course-title { font-size: 18px; padding: 0 16px; }
  .citation-body { padding: 0 16px; }
  .cert-meta-grid { flex-wrap: wrap; gap: 14px 24px; margin: 14px 16px 0; }
  .cert-bottom-grid { grid-template-columns: 1fr; gap: 24px; margin-top: 24px; }
  .official-seal { margin: 0 auto; }
  .corner { width: 44px; height: 44px; }
}
</style>
</head>
<body>

<!-- Interactive Top Toolbar -->
<div class="toolbar">
  <div class="toolbar-info">
    <span class="toolbar-badge">Official Credential</span>
    <p>JADMAA Certificate of Achievement &middot; Click any text to customize, then Print / Save as PDF.</p>
  </div>
  <div class="toolbar-actions">
    <button class="btn-print" onclick="window.print()">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6 9 6 2 18 2 18 9"></polyline>
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
        <rect x="6" y="14" width="12" height="8"></rect>
      </svg>
      Print / Save as PDF
    </button>
  </div>
</div>

<!-- Certificate Frame -->
<div class="certificate-wrapper">
  <main class="certificate" aria-label="JADMAA Certificate of Achievement">
    <!-- Geometric Borders -->
    <div class="cert-border-outer"></div>
    <div class="cert-border-middle"></div>
    <div class="cert-border-inner"></div>

    <!-- Corner Filigree Ornaments -->
    <div class="corner tl">
      <svg viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 3 L3 28 Q3 3 28 3 Z" fill="#B12B2B" opacity="0.14"/>
        <path d="M3 3 L3 45" stroke="#C9A84C" stroke-width="0.75" opacity="0.6"/>
        <path d="M3 3 L45 3" stroke="#C9A84C" stroke-width="0.75" opacity="0.6"/>
        <circle cx="3" cy="3" r="2.5" fill="#C9A84C"/>
        <circle cx="12" cy="12" r="1.5" fill="#B12B2B"/>
        <path d="M8 3 L8 22 Q8 8 22 8 L3 8" stroke="#B12B2B" stroke-width="1.2" opacity="0.35" fill="none"/>
        <path d="M15 3 Q15 15 3 15" stroke="#C9A84C" stroke-width="0.75" opacity="0.5" fill="none"/>
      </svg>
    </div>
    <div class="corner tr">
      <svg viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 3 L3 28 Q3 3 28 3 Z" fill="#B12B2B" opacity="0.14"/>
        <path d="M3 3 L3 45" stroke="#C9A84C" stroke-width="0.75" opacity="0.6"/>
        <path d="M3 3 L45 3" stroke="#C9A84C" stroke-width="0.75" opacity="0.6"/>
        <circle cx="3" cy="3" r="2.5" fill="#C9A84C"/>
        <circle cx="12" cy="12" r="1.5" fill="#B12B2B"/>
        <path d="M8 3 L8 22 Q8 8 22 8 L3 8" stroke="#B12B2B" stroke-width="1.2" opacity="0.35" fill="none"/>
        <path d="M15 3 Q15 15 3 15" stroke="#C9A84C" stroke-width="0.75" opacity="0.5" fill="none"/>
      </svg>
    </div>
    <div class="corner bl">
      <svg viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 3 L3 28 Q3 3 28 3 Z" fill="#B12B2B" opacity="0.14"/>
        <path d="M3 3 L3 45" stroke="#C9A84C" stroke-width="0.75" opacity="0.6"/>
        <path d="M3 3 L45 3" stroke="#C9A84C" stroke-width="0.75" opacity="0.6"/>
        <circle cx="3" cy="3" r="2.5" fill="#C9A84C"/>
        <circle cx="12" cy="12" r="1.5" fill="#B12B2B"/>
        <path d="M8 3 L8 22 Q8 8 22 8 L3 8" stroke="#B12B2B" stroke-width="1.2" opacity="0.35" fill="none"/>
        <path d="M15 3 Q15 15 3 15" stroke="#C9A84C" stroke-width="0.75" opacity="0.5" fill="none"/>
      </svg>
    </div>
    <div class="corner br">
      <svg viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 3 L3 28 Q3 3 28 3 Z" fill="#B12B2B" opacity="0.14"/>
        <path d="M3 3 L3 45" stroke="#C9A84C" stroke-width="0.75" opacity="0.6"/>
        <path d="M3 3 L45 3" stroke="#C9A84C" stroke-width="0.75" opacity="0.6"/>
        <circle cx="3" cy="3" r="2.5" fill="#C9A84C"/>
        <circle cx="12" cy="12" r="1.5" fill="#B12B2B"/>
        <path d="M8 3 L8 22 Q8 8 22 8 L3 8" stroke="#B12B2B" stroke-width="1.2" opacity="0.35" fill="none"/>
        <path d="M15 3 Q15 15 3 15" stroke="#C9A84C" stroke-width="0.75" opacity="0.5" fill="none"/>
      </svg>
    </div>

    <!-- Background Watermark Logo -->
    <img class="watermark" src="${logoDataUri}" alt="" aria-hidden="true">

    <!-- Header Section -->
    <header class="cert-header">
      <div class="crest-row">
        <div class="crest-line"></div>
        <img class="logo-img" src="${logoDataUri}" alt="JADMAA Varmakalai Authentic Emblem">
        <div class="crest-line right"></div>
      </div>
      <div class="brand-title" contenteditable="true">JADMAA</div>
      <div class="brand-tagline" contenteditable="true">Varmakalai Academy &middot; Ancient Power &middot; Modern Training</div>
    </header>

    <!-- Center Ornament -->
    <div class="ornament-divider">
      <div class="line"></div>
      <div class="symbol">&#10022;</div>
      <div class="line"></div>
    </div>

    <!-- Certificate Title -->
    <div class="cert-title-section">
      <h1 class="main-title">Certificate</h1>
      <div class="sub-title">Of Achievement</div>
      <p class="presentation-text">This official credential is proudly conferred upon</p>
    </div>

    <!-- Recipient -->
    <div class="recipient-container">
      <div class="recipient-name" contenteditable="true">{{studentName}}</div>
    </div>

    <!-- Course Info -->
    <p class="course-recognition">for the rigorous study, dedication, and successful completion of</p>
    <div class="course-title" contenteditable="true">{{courseName}}</div>

    <!-- Citation Description -->
    <p class="citation-body">
      In recognition of exemplary commitment, technical mastery, and disciplined practice of the certified curriculum
      at JADMAA Varmakalai Academy. This credential formally verifies the holder's proficiency in the foundational
      and applied techniques of traditional Tamil martial arts and Varma science.
    </p>

    <!-- Metadata Grid -->
    <div class="cert-meta-grid">
      <div class="meta-box">
        <div class="meta-label">Completion Date</div>
        <div class="meta-val" contenteditable="true">{{completionDate}}</div>
      </div>
      <div class="meta-box">
        <div class="meta-label">Certificate ID</div>
        <div class="meta-val" contenteditable="true">{{certificateNumber}}</div>
      </div>
      <div class="meta-box">
        <div class="meta-label">Verification Code</div>
        <div class="meta-val" contenteditable="true">{{verificationCode}}</div>
      </div>
      <div class="meta-box">
        <div class="meta-label">Credential Status</div>
        <div class="meta-val" style="color: #2e7d32;" contenteditable="true">VERIFIED &amp; ISSUED</div>
      </div>
    </div>

    <!-- Bottom Signatures and Seal -->
    <div class="cert-bottom-grid">
      <div class="signature-block">
        <div class="signature-line"></div>
        <div class="signature-name" contenteditable="true">{{instructorName}}</div>
        <div class="signature-title">Course Instructor &middot; JADMAA</div>
      </div>

      <div class="seal-container">
        <div class="official-seal">
          <div class="seal-inner-circle"></div>
          <div class="seal-brand">JADMAA</div>
          <div class="seal-star">&#10022;</div>
          <div class="seal-caption">ACADEMY<br>SEAL OF MERIT</div>
        </div>
      </div>

      <div class="signature-block">
        <div class="signature-line"></div>
        <div class="signature-name" contenteditable="true">Varma Aasan Mr. Bojagarajan</div>
        <div class="signature-title">Founder &middot; Varma Grandmaster</div>
      </div>
    </div>

    <!-- Verification Section with QR Code -->
    <div class="cert-footer-verification">
      <div class="qr-frame">
        <img src="${sampleQrCode}" alt="Certificate Verification QR Code">
      </div>
      <div class="verification-details">
        <strong>Official Academy Credential Verification</strong><br>
        Scan the QR code to verify this certificate on the official registry or visit:<br>
        <span class="verification-url" contenteditable="true">{{verificationUrl}}</span>
      </div>
    </div>

    <div class="security-note">JADMAA VARMAKALAI ACADEMY &middot; OFFICIAL DIGITAL CREDENTIAL &middot; TAMIL NADU, INDIA</div>
  </main>
</div>

</body>
</html>
`;

// Write to user's downloads file
const downloadsPath = 'c:\\Users\\PRASANNA\\Downloads\\jadmaa-certificate-template.html';
fs.writeFileSync(downloadsPath, html, 'utf8');
console.log('Successfully updated user downloads file:', downloadsPath);

// Write to project public directory
fs.writeFileSync('public/certificate-template.html', html, 'utf8');
console.log('Successfully saved to public/certificate-template.html');
