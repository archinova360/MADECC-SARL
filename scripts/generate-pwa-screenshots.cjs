const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const publicDir = path.resolve(__dirname, '../public');
const screenshotsDir = path.join(publicDir, 'screenshots');

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// 1. Desktop Wide Screenshot SVG (1280 x 720)
const wideSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
  <defs>
    <linearGradient id="wideBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0a0b"/>
      <stop offset="50%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
    <linearGradient id="cyan" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.5"/>
    </filter>
  </defs>

  <!-- Background Base -->
  <rect width="1280" height="720" fill="url(#wideBg)"/>

  <!-- Subtle Blueprint Grid -->
  <g opacity="0.08" stroke="#38bdf8" stroke-width="1">
    <line x1="0" y1="80" x2="1280" y2="80"/>
    <line x1="0" y1="160" x2="1280" y2="160"/>
    <line x1="0" y1="240" x2="1280" y2="240"/>
    <line x1="0" y1="320" x2="1280" y2="320"/>
    <line x1="0" y1="400" x2="1280" y2="400"/>
    <line x1="0" y1="480" x2="1280" y2="480"/>
    <line x1="0" y1="560" x2="1280" y2="560"/>
    <line x1="0" y1="640" x2="1280" y2="640"/>
    <line x1="160" y1="0" x2="160" y2="720"/>
    <line x1="320" y1="0" x2="320" y2="720"/>
    <line x1="480" y1="0" x2="480" y2="720"/>
    <line x1="640" y1="0" x2="640" y2="720"/>
    <line x1="800" y1="0" x2="800" y2="720"/>
    <line x1="960" y1="0" x2="960" y2="720"/>
    <line x1="1120" y1="0" x2="1120" y2="720"/>
  </g>

  <!-- Browser Header Navigation Bar -->
  <rect x="0" y="0" width="1280" height="68" fill="#0f172a" opacity="0.95"/>
  <line x1="0" y1="68" x2="1280" y2="68" stroke="#334155" stroke-width="1"/>

  <!-- Logo & Title -->
  <rect x="36" y="16" width="36" height="36" rx="8" fill="url(#gold)"/>
  <text x="54" y="40" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="900" fill="#0f172a" text-anchor="middle">M</text>
  <text x="82" y="38" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="800" fill="#ffffff">MADECC <tspan fill="#f59e0b">GROUP</tspan></text>
  <text x="82" y="52" font-family="system-ui, -apple-system, sans-serif" font-size="9" font-weight="600" fill="#94a3b8" letter-spacing="1.5">CIVIL ENGINEERING &amp; CONSTRUCTION</text>

  <!-- Nav Items -->
  <g font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="600" fill="#cbd5e1">
    <text x="420" y="40" fill="#f59e0b">Home</text>
    <text x="490" y="40">About Us</text>
    <text x="575" y="40">Services</text>
    <text x="655" y="40">Projects</text>
    <text x="735" y="40">Cost Guide 2026</text>
    <text x="865" y="40">Budget Calculator</text>
    <text x="1005" y="40">Blog</text>
  </g>

  <!-- CTA Buttons -->
  <rect x="1060" y="18" width="95" height="32" rx="8" fill="#1e293b" stroke="#475569" stroke-width="1"/>
  <text x="1107" y="38" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="700" fill="#f59e0b" text-anchor="middle">📱 Install App</text>

  <rect x="1165" y="18" width="80" height="32" rx="8" fill="url(#gold)"/>
  <text x="1205" y="38" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="800" fill="#0f172a" text-anchor="middle">Get Quote</text>

  <!-- Hero Content Left -->
  <g transform="translate(60, 110)">
    <!-- Badge -->
    <rect x="0" y="0" width="280" height="28" rx="14" fill="rgba(245, 158, 11, 0.12)" stroke="rgba(245, 158, 11, 0.4)" stroke-width="1"/>
    <circle cx="14" cy="14" r="4" fill="#10b981"/>
    <text x="26" y="18" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="700" fill="#f59e0b" letter-spacing="0.5">● CAMEROON &amp; PAN-AFRICA INFRASTRUCTURE</text>

    <!-- Main Headline -->
    <text x="0" y="68" font-family="system-ui, -apple-system, sans-serif" font-size="38" font-weight="900" fill="#ffffff" line-height="1.2">
      Pioneering Civil Engineering
    </text>
    <text x="0" y="112" font-family="system-ui, -apple-system, sans-serif" font-size="38" font-weight="900" fill="url(#gold)">
      &amp; Landmark Construction
    </text>

    <text x="0" y="152" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="#94a3b8">
      Delivering turnkey commercial towers, residential estates, reinforced concrete structures,
    </text>
    <text x="0" y="174" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="#94a3b8">
      and automated cost estimation tools certified under Eurocode 2 and MINDDHU standards.
    </text>

    <!-- Metrics Cards -->
    <g transform="translate(0, 210)">
      <rect x="0" y="0" width="130" height="74" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1"/>
      <text x="16" y="32" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="900" fill="#f59e0b">250+</text>
      <text x="16" y="52" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="600" fill="#94a3b8">Completed Builds</text>

      <rect x="145" y="0" width="130" height="74" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1"/>
      <text x="161" y="32" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="900" fill="#38bdf8">18+ Yrs</text>
      <text x="161" y="52" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="600" fill="#94a3b8">Engineering Mastery</text>

      <rect x="290" y="0" width="130" height="74" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1"/>
      <text x="306" y="32" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="900" fill="#10b981">99.8%</text>
      <text x="306" y="52" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="600" fill="#94a3b8">Safety Compliance</text>

      <rect x="435" y="0" width="130" height="74" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1"/>
      <text x="451" y="32" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="900" fill="#f59e0b">ONIGC</text>
      <text x="451" y="52" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="600" fill="#94a3b8">Certified Engineers</text>
    </g>

    <!-- Quick CTA buttons -->
    <g transform="translate(0, 310)">
      <rect x="0" y="0" width="180" height="44" rx="10" fill="url(#gold)"/>
      <text x="90" y="27" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="800" fill="#0f172a" text-anchor="middle">Calculate Budget Now →</text>

      <rect x="195" y="0" width="180" height="44" rx="10" fill="#1e293b" stroke="#475569" stroke-width="1"/>
      <text x="285" y="27" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="700" fill="#ffffff" text-anchor="middle">Explore Landmark Projects</text>
    </g>
  </g>

  <!-- Interactive Project Budget Calculator Widget (Right Side) -->
  <g transform="translate(670, 110)" filter="url(#shadow)">
    <rect x="0" y="0" width="550" height="520" rx="20" fill="#0f172a" stroke="#334155" stroke-width="1.5"/>
    
    <!-- Card Header -->
    <rect x="0" y="0" width="550" height="56" rx="20" fill="#1e293b"/>
    <circle cx="28" cy="28" r="6" fill="#ef4444"/>
    <circle cx="46" cy="28" r="6" fill="#f59e0b"/>
    <circle cx="64" cy="28" r="6" fill="#10b981"/>
    <text x="90" y="34" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="800" fill="#ffffff">Interactive Construction Budget Estimator</text>
    <rect x="420" y="16" width="110" height="24" rx="6" fill="rgba(245, 158, 11, 0.2)" stroke="#f59e0b" stroke-width="1"/>
    <text x="475" y="32" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="700" fill="#f59e0b" text-anchor="middle">2026 RATES (XAF)</text>

    <!-- Form Fields Inside Estimator Card -->
    <g transform="translate(24, 75)">
      <!-- Project Type -->
      <text x="0" y="16" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="700" fill="#94a3b8">PROJECT CATEGORY</text>
      <rect x="0" y="26" width="240" height="38" rx="8" fill="#1e293b" stroke="#475569" stroke-width="1"/>
      <text x="14" y="50" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="600" fill="#ffffff">Multi-Storey Commercial (R+4)</text>

      <!-- Location -->
      <text x="260" y="16" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="700" fill="#94a3b8">REGIONAL LOCATION</text>
      <rect x="260" y="26" width="240" height="38" rx="8" fill="#1e293b" stroke="#475569" stroke-width="1"/>
      <text x="274" y="50" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="600" fill="#ffffff">Yaoundé (Centre Region)</text>

      <!-- Floor Area -->
      <text x="0" y="90" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="700" fill="#94a3b8">TOTAL BUILT SURFACE (M²)</text>
      <rect x="0" y="100" width="240" height="38" rx="8" fill="#1e293b" stroke="#475569" stroke-width="1"/>
      <text x="14" y="124" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="600" fill="#ffffff">450 m²</text>

      <!-- Standard -->
      <text x="260" y="90" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="700" fill="#94a3b8">FINISH STANDARD</text>
      <rect x="260" y="100" width="240" height="38" rx="8" fill="#1e293b" stroke="#475569" stroke-width="1"/>
      <text x="274" y="124" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="600" fill="#ffffff">High Standing &amp; Solar Glass</text>

      <!-- Budget Output Highlight Box -->
      <rect x="0" y="160" width="502" height="120" rx="14" fill="rgba(245, 158, 11, 0.08)" stroke="#f59e0b" stroke-width="1.5"/>
      <text x="20" y="190" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="800" fill="#f59e0b" letter-spacing="1">ESTIMATED INVESTMENT RANGE</text>
      <text x="20" y="235" font-family="system-ui, -apple-system, sans-serif" font-size="34" font-weight="900" fill="#ffffff">126,000,000 XAF</text>
      <text x="20" y="262" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="600" fill="#94a3b8">Average Rate: 280,000 XAF / m² • Turnkey Execution &amp; Decennial Warranty</text>

      <!-- Breakdown Bars -->
      <g transform="translate(0, 295)">
        <text x="0" y="14" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="700" fill="#94a3b8">STRUCTURAL FOUNDATIONS: 38%</text>
        <rect x="0" y="20" width="502" height="6" rx="3" fill="#334155"/>
        <rect x="0" y="20" width="190" height="6" rx="3" fill="#f59e0b"/>

        <text x="0" y="44" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="700" fill="#94a3b8">MEP &amp; ELECTRICAL / SOLAR: 26%</text>
        <rect x="0" y="50" width="502" height="6" rx="3" fill="#334155"/>
        <rect x="0" y="50" width="130" height="6" rx="3" fill="#38bdf8"/>

        <text x="0" y="74" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="700" fill="#94a3b8">INTERIOR FINISHES &amp; GLAZING: 36%</text>
        <rect x="0" y="80" width="502" height="6" rx="3" fill="#334155"/>
        <rect x="0" y="80" width="182" height="6" rx="3" fill="#10b981"/>
      </g>

      <!-- Download Button -->
      <rect x="0" y="395" width="502" height="42" rx="10" fill="url(#gold)"/>
      <text x="251" y="421" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="800" fill="#0f172a" text-anchor="middle">📥 Download Certified BoQ Estimate (PDF / Excel)</text>
    </g>
  </g>

  <!-- Bottom Trust Bar -->
  <rect x="0" y="670" width="1280" height="50" fill="#0a0a0b"/>
  <line x1="0" y1="670" x2="1280" y2="670" stroke="#1e293b" stroke-width="1"/>
  <g font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="600" fill="#64748b" transform="translate(60, 700)">
    <text x="0" y="0">✓ FIDIC Red Book Contract Conditions</text>
    <text x="270" y="0">✓ ONIGC Certified Civil Engineers</text>
    <text x="520" y="0">✓ ISO 45001:2018 Safety Compliant</text>
    <text x="760" y="0">✓ 10-Year Decennial Structural Guarantee (Article 1792)</text>
    <text x="1090" y="0" fill="#f59e0b">madeccgroup.online</text>
  </g>
</svg>`;

// 2. Mobile Narrow Screenshot SVG (720 x 1280)
const narrowSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 1280" width="720" height="1280">
  <defs>
    <linearGradient id="narrowBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0a0b"/>
      <stop offset="50%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <filter id="mShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000000" flood-opacity="0.6"/>
    </filter>
  </defs>

  <!-- Mobile Screen Base -->
  <rect width="720" height="1280" fill="url(#narrowBg)"/>

  <!-- Status Bar (Android / iOS) -->
  <rect width="720" height="42" fill="#0a0a0b"/>
  <text x="40" y="28" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="700" fill="#ffffff">09:41</text>
  <text x="630" y="28" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="700" fill="#ffffff">5G 📶 98%</text>

  <!-- Mobile Top Navigation Header -->
  <rect x="0" y="42" width="720" height="70" fill="#0f172a"/>
  <line x1="0" y1="112" x2="720" y2="112" stroke="#334155" stroke-width="1"/>

  <!-- Brand Emblem & Title -->
  <rect x="24" y="58" width="38" height="38" rx="10" fill="url(#gold)"/>
  <text x="43" y="84" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="900" fill="#0f172a" text-anchor="middle">M</text>
  <text x="74" y="81" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="800" fill="#ffffff">MADECC <tspan fill="#f59e0b">GROUP</tspan></text>
  <text x="74" y="94" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="600" fill="#94a3b8" letter-spacing="1">ENGINEERING &amp; CONSTRUCTION</text>

  <!-- Menu & Language Buttons -->
  <rect x="580" y="58" width="46" height="38" rx="8" fill="#1e293b" stroke="#475569" stroke-width="1"/>
  <text x="603" y="82" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="700" fill="#f59e0b" text-anchor="middle">EN</text>

  <rect x="638" y="58" width="46" height="38" rx="8" fill="#1e293b" stroke="#475569" stroke-width="1"/>
  <line x1="650" y1="71" x2="672" y2="71" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
  <line x1="650" y1="77" x2="672" y2="77" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
  <line x1="650" y1="83" x2="672" y2="83" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>

  <!-- App Install Banner (PWA Prominence) -->
  <rect x="24" y="126" width="672" height="48" rx="12" fill="rgba(245, 158, 11, 0.15)" stroke="#f59e0b" stroke-width="1"/>
  <text x="44" y="156" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="700" fill="#ffffff">📱 Install MADECC Android App</text>
  <rect x="550" y="134" width="130" height="32" rx="8" fill="url(#gold)"/>
  <text x="615" y="155" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="800" fill="#0f172a" text-anchor="middle">Install Free</text>

  <!-- Mobile Hero Card -->
  <g transform="translate(24, 188)" filter="url(#mShadow)">
    <rect x="0" y="0" width="672" height="210" rx="18" fill="url(#cardGrad)" stroke="#334155" stroke-width="1.5"/>
    <rect x="20" y="20" width="160" height="24" rx="12" fill="rgba(245, 158, 11, 0.2)"/>
    <text x="32" y="36" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="800" fill="#f59e0b">★ 2026 EDITION ACTIVE</text>
    
    <text x="20" y="74" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="900" fill="#ffffff">
      Cameroon's Premier
    </text>
    <text x="20" y="104" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="900" fill="url(#gold)">
      Civil Engineering Portal
    </text>
    <text x="20" y="132" font-family="system-ui, -apple-system, sans-serif" font-size="13" fill="#94a3b8">
      Turnkey construction, architectural takeoffs, and 2026
    </text>
    <text x="20" y="150" font-family="system-ui, -apple-system, sans-serif" font-size="13" fill="#94a3b8">
      Bills of Quantities (BoQ) verified under ONIGC standards.
    </text>

    <!-- Call to action button -->
    <rect x="20" y="166" width="200" height="34" rx="8" fill="url(#gold)"/>
    <text x="120" y="188" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="800" fill="#0f172a" text-anchor="middle">Instant Cost Estimator →</text>
  </g>

  <!-- 4-Grid Quick Action Tiles -->
  <g transform="translate(24, 416)">
    <!-- Tile 1 -->
    <rect x="0" y="0" width="156" height="100" rx="14" fill="#1e293b" stroke="#334155" stroke-width="1"/>
    <rect x="16" y="16" width="32" height="32" rx="8" fill="rgba(245, 158, 11, 0.2)"/>
    <text x="32" y="38" font-family="system-ui, -apple-system, sans-serif" font-size="16" text-anchor="middle">🏗️</text>
    <text x="16" y="66" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="700" fill="#ffffff">Services</text>
    <text x="16" y="82" font-family="system-ui, -apple-system, sans-serif" font-size="10" fill="#94a3b8">Civil &amp; MEP</text>

    <!-- Tile 2 -->
    <rect x="172" y="0" width="156" height="100" rx="14" fill="#1e293b" stroke="#334155" stroke-width="1"/>
    <rect x="188" y="16" width="32" height="32" rx="8" fill="rgba(56, 189, 248, 0.2)"/>
    <text x="204" y="38" font-family="system-ui, -apple-system, sans-serif" font-size="16" text-anchor="middle">📐</text>
    <text x="188" y="66" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="700" fill="#ffffff">Projects</text>
    <text x="188" y="82" font-family="system-ui, -apple-system, sans-serif" font-size="10" fill="#94a3b8">250+ Portfolio</text>

    <!-- Tile 3 -->
    <rect x="344" y="0" width="156" height="100" rx="14" fill="#1e293b" stroke="#334155" stroke-width="1"/>
    <rect x="360" y="16" width="32" height="32" rx="8" fill="rgba(16, 185, 129, 0.2)"/>
    <text x="376" y="38" font-family="system-ui, -apple-system, sans-serif" font-size="16" text-anchor="middle">📊</text>
    <text x="360" y="66" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="700" fill="#ffffff">Cost Guide</text>
    <text x="360" y="82" font-family="system-ui, -apple-system, sans-serif" font-size="10" fill="#94a3b8">Regional XAF</text>

    <!-- Tile 4 -->
    <rect x="516" y="0" width="156" height="100" rx="14" fill="#1e293b" stroke="#334155" stroke-width="1"/>
    <rect x="532" y="16" width="32" height="32" rx="8" fill="rgba(244, 63, 94, 0.2)"/>
    <text x="548" y="38" font-family="system-ui, -apple-system, sans-serif" font-size="16" text-anchor="middle">📑</text>
    <text x="532" y="66" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="700" fill="#ffffff">Downloads</text>
    <text x="532" y="82" font-family="system-ui, -apple-system, sans-serif" font-size="10" fill="#94a3b8">999 XAF Gate</text>
  </g>

  <!-- Mobile Budget Calculator Card -->
  <g transform="translate(24, 532)" filter="url(#mShadow)">
    <rect x="0" y="0" width="672" height="530" rx="20" fill="#0f172a" stroke="#334155" stroke-width="1.5"/>
    
    <text x="24" y="38" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="800" fill="#ffffff">Project Budget Calculator</text>
    <text x="24" y="58" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="600" fill="#f59e0b">OFFICIAL 2026 ESTIMATION ENGINE</text>

    <!-- Form Inputs Mobile -->
    <g transform="translate(24, 80)">
      <text x="0" y="14" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="700" fill="#94a3b8">1. SELECT STRUCTURAL TYPE</text>
      <rect x="0" y="24" width="624" height="46" rx="10" fill="#1e293b" stroke="#475569" stroke-width="1"/>
      <text x="16" y="52" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="600" fill="#ffffff">Multi-Storey Residential Villa (R+2)</text>

      <text x="0" y="96" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="700" fill="#94a3b8">2. ESTIMATED BUILT SURFACE (M²)</text>
      <rect x="0" y="106" width="624" height="46" rx="10" fill="#1e293b" stroke="#475569" stroke-width="1"/>
      <text x="16" y="134" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="600" fill="#ffffff">320 m²</text>

      <!-- Result Box -->
      <rect x="0" y="172" width="624" height="136" rx="14" fill="rgba(245, 158, 11, 0.1)" stroke="#f59e0b" stroke-width="1.5"/>
      <text x="20" y="202" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="800" fill="#f59e0b" letter-spacing="1">CALCULATED TURNKEY ESTIMATE</text>
      <text x="20" y="246" font-family="system-ui, -apple-system, sans-serif" font-size="34" font-weight="900" fill="#ffffff">89,600,000 XAF</text>
      <text x="20" y="274" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="600" fill="#94a3b8">Rate: 280,000 XAF/m² • Includes Foundation, Slab, MEP &amp; Finishes</text>

      <!-- Payment & Verification Channels -->
      <g transform="translate(0, 328)">
        <text x="0" y="14" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="700" fill="#94a3b8">INSTANT VERIFICATION CHANNELS</text>
        <rect x="0" y="24" width="300" height="42" rx="10" fill="#1e293b" stroke="#f59e0b" stroke-width="1"/>
        <text x="150" y="50" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="800" fill="#f59e0b" text-anchor="middle">MTN MoMo (671 06 35 11)</text>

        <rect x="324" y="24" width="300" height="42" rx="10" fill="#1e293b" stroke="#f97316" stroke-width="1"/>
        <text x="474" y="50" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="800" fill="#f97316" text-anchor="middle">Orange Money (689 11 55 95)</text>
      </g>

      <!-- Action Button -->
      <rect x="0" y="394" width="624" height="46" rx="12" fill="url(#gold)"/>
      <text x="312" y="423" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="900" fill="#0f172a" text-anchor="middle">Generate Official A4 PDF BoQ Report</text>
    </g>
  </g>

  <!-- Mobile Bottom Sticky Navigation Bar -->
  <rect x="0" y="1200" width="720" height="80" fill="#0a0a0b"/>
  <line x1="0" y1="1200" x2="720" y2="1200" stroke="#1e293b" stroke-width="1"/>
  
  <g font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="700" text-anchor="middle">
    <g transform="translate(72, 1226)">
      <text x="0" y="0" font-size="18">🏠</text>
      <text x="0" y="20" fill="#f59e0b">Home</text>
    </g>
    <g transform="translate(216, 1226)">
      <text x="0" y="0" font-size="18">🏗️</text>
      <text x="0" y="20" fill="#94a3b8">Services</text>
    </g>
    <g transform="translate(360, 1226)">
      <text x="0" y="0" font-size="18">🧮</text>
      <text x="0" y="20" fill="#94a3b8">Estimator</text>
    </g>
    <g transform="translate(504, 1226)">
      <text x="0" y="0" font-size="18">📑</text>
      <text x="0" y="20" fill="#94a3b8">Tenders</text>
    </g>
    <g transform="translate(648, 1226)">
      <text x="0" y="0" font-size="18">📞</text>
      <text x="0" y="20" fill="#94a3b8">Contact</text>
    </g>
  </g>
</svg>`;

async function main() {
  console.log('Generating PWA screenshots for PWABuilder and App Store compliance...');

  // 1. Generate screenshot-wide.png (1280x720)
  const wideBuffer = Buffer.from(wideSvg);
  await sharp(wideBuffer)
    .resize(1280, 720)
    .png({ quality: 95 })
    .toFile(path.join(publicDir, 'screenshot-wide.png'));
  await sharp(wideBuffer)
    .resize(1280, 720)
    .png({ quality: 95 })
    .toFile(path.join(screenshotsDir, 'screenshot-wide.png'));
  console.log('✓ Created public/screenshot-wide.png & public/screenshots/screenshot-wide.png (1280x720, wide)');

  // 2. Generate screenshot-narrow.png (720x1280)
  const narrowBuffer = Buffer.from(narrowSvg);
  await sharp(narrowBuffer)
    .resize(720, 1280)
    .png({ quality: 95 })
    .toFile(path.join(publicDir, 'screenshot-narrow.png'));
  await sharp(narrowBuffer)
    .resize(720, 1280)
    .png({ quality: 95 })
    .toFile(path.join(screenshotsDir, 'screenshot-narrow.png'));
  console.log('✓ Created public/screenshot-narrow.png & public/screenshots/screenshot-narrow.png (720x1280, narrow)');
}

main().catch(err => {
  console.error('Error generating screenshots:', err);
  process.exit(1);
});
