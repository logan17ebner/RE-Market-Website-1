const PptxGenJS = require('pptxgenjs');

const prs = new PptxGenJS();
prs.layout = 'LAYOUT_WIDE'; // 13.33" x 7.5"

// ── Brand colors ───────────────────────────────────────────────────────────
const CREAM   = 'F5F0E8';
const CRIMSON = '8B1C13';
const DARK    = '1A1514';
const MUTED   = '7A6E65';
const BORDER  = 'DDD5C5';
const GREEN   = '2D7A4F';
const AMBER   = 'B47800';
const WHITE   = 'FFFFFF';

const W = 13.33;
const H = 7.5;

// ── Shared helpers ─────────────────────────────────────────────────────────
function bg(slide) {
  slide.background = { color: CREAM };
}

function crimsonBar(slide, h = 1.1) {
  slide.addShape(prs.ShapeType.rect, { x: 0, y: 0, w: W, h, fill: { color: CRIMSON } });
}

function sectionDivider(slide, y) {
  slide.addShape(prs.ShapeType.rect, { x: 0.55, y, w: W - 1.1, h: 0.02, fill: { color: BORDER } });
}

function card(slide, x, y, w, h, opts = {}) {
  slide.addShape(prs.ShapeType.roundRect, {
    x, y, w, h,
    fill: { color: opts.fill ?? WHITE },
    line: { color: opts.border ?? BORDER, width: 0.75 },
    rectRadius: 0.08,
  });
}

const PILL_BG = { [CRIMSON]: 'F9E8E7', [DARK]: 'EDEAE5', [GREEN]: 'E6F2EB' };

function pill(slide, x, y, w, label, color) {
  slide.addShape(prs.ShapeType.roundRect, {
    x, y, w, h: 0.35,
    fill: { color: PILL_BG[color] ?? 'EEEBE7' },
    line: { color: color, width: 0.75 },
    rectRadius: 0.18,
  });
  slide.addText(label.toUpperCase(), {
    x, y, w, h: 0.35,
    align: 'center', valign: 'middle',
    fontSize: 8, bold: true, color,
    fontFace: 'Calibri',
    charSpacing: 1.5,
  });
}

// ══════════════════════════════════════════════════════════════════════════
// SLIDE 1 — Title
// ══════════════════════════════════════════════════════════════════════════
const s1 = prs.addSlide();
bg(s1);
crimsonBar(s1, 1.4);

// Parcel wordmark
s1.addText('Parcel', {
  x: 0, y: 0, w: W, h: 1.4,
  align: 'center', valign: 'middle',
  fontSize: 54, bold: true, italic: true,
  color: WHITE, fontFace: 'Georgia',
});

// Tagline
s1.addText('Know the market before you make a move.', {
  x: 1.2, y: 1.7, w: W - 2.4, h: 1.0,
  align: 'center', valign: 'middle',
  fontSize: 30, bold: false, color: DARK,
  fontFace: 'Georgia',
});

// Subtitle line
sectionDivider(s1, 2.9);
s1.addText('US RESIDENTIAL MARKET INTELLIGENCE', {
  x: 0, y: 3.0, w: W, h: 0.45,
  align: 'center', fontSize: 10, bold: true,
  color: MUTED, fontFace: 'Calibri', charSpacing: 3,
});

// Three feature pills
const pills = [
  ['Live Zillow + FRED Data', CRIMSON],
  ['50-State Coverage', DARK],
  ['AI-Powered Local Insights', GREEN],
];
const pillW = 2.6;
const pillGap = 0.35;
const pillTotalW = pills.length * pillW + (pills.length - 1) * pillGap;
const pillStartX = (W - pillTotalW) / 2;
pills.forEach(([label, color], i) => {
  pill(s1, pillStartX + i * (pillW + pillGap), 3.7, pillW, label, color);
});

// Bottom source line
s1.addText('Data: Zillow Research (ZHVI/ZORI) · FRED St. Louis Fed · World Bank · Anthropic Claude API', {
  x: 0, y: H - 0.4, w: W, h: 0.35,
  align: 'center', fontSize: 7.5, color: MUTED,
  fontFace: 'Calibri',
});


// ══════════════════════════════════════════════════════════════════════════
// SLIDE 2 — Problem & Solution
// ══════════════════════════════════════════════════════════════════════════
const s2 = prs.addSlide();
bg(s2);
crimsonBar(s2, 0.85);

s2.addText('Parcel', {
  x: 0.55, y: 0, w: 2, h: 0.85,
  align: 'left', valign: 'middle',
  fontSize: 18, bold: true, italic: true,
  color: WHITE, fontFace: 'Georgia',
});
s2.addText('The Problem — and the Answer', {
  x: 0, y: 0, w: W, h: 0.85,
  align: 'center', valign: 'middle',
  fontSize: 18, bold: false,
  color: WHITE, fontFace: 'Georgia', italic: true,
});

// ── Left column: problems ──────────────────────────────────────────────────
const colX1 = 0.55;
const colX2 = 6.9;
const colW  = 5.9;

// Home Seekers card
card(s2, colX1, 1.05, colW, 2.6, { fill: CREAM, border: BORDER });
s2.addShape(prs.ShapeType.rect, { x: colX1, y: 1.05, w: 0.07, h: 2.6, fill: { color: CRIMSON } });
s2.addText('Home Seekers', {
  x: colX1 + 0.2, y: 1.12, w: colW - 0.3, h: 0.4,
  fontSize: 13, bold: true, color: CRIMSON, fontFace: 'Georgia',
});
[
  'Fragmented data — Zillow, Redfin, and news are all separate',
  'Hard to understand if a local market is actually affordable',
  'No clear view of price trends or where a market is heading',
  'Difficult to compare one neighborhood to another',
].forEach((txt, i) => {
  s2.addText(`• ${txt}`, {
    x: colX1 + 0.2, y: 1.58 + i * 0.43, w: colW - 0.35, h: 0.4,
    fontSize: 10, color: DARK, fontFace: 'Calibri',
  });
});

// Investment Analysts card
card(s2, colX1, 3.8, colW, 2.6, { fill: CREAM, border: BORDER });
s2.addShape(prs.ShapeType.rect, { x: colX1, y: 3.8, w: 0.07, h: 2.6, fill: { color: AMBER } });
s2.addText('Investment Analysts', {
  x: colX1 + 0.2, y: 3.87, w: colW - 0.3, h: 0.4,
  fontSize: 13, bold: true, color: AMBER, fontFace: 'Georgia',
});
[
  'No fast way to screen multiple US markets at once',
  'Rental yield and cap rate data scattered across paid platforms',
  'Comparable market analysis requires expensive subscriptions',
  'Local sentiment and news not integrated with hard data',
].forEach((txt, i) => {
  s2.addText(`• ${txt}`, {
    x: colX1 + 0.2, y: 4.33 + i * 0.43, w: colW - 0.35, h: 0.4,
    fontSize: 10, color: DARK, fontFace: 'Calibri',
  });
});

// ── Right column: solution ─────────────────────────────────────────────────
card(s2, colX2, 1.05, colW, 5.35, { fill: CREAM, border: CRIMSON });
s2.addShape(prs.ShapeType.rect, { x: colX2, y: 1.05, w: colW, h: 0.5, fill: { color: CRIMSON } });
s2.addText('How Parcel Solves It', {
  x: colX2, y: 1.05, w: colW, h: 0.5,
  align: 'center', valign: 'middle',
  fontSize: 12, bold: true, color: WHITE, fontFace: 'Georgia', italic: true,
});

const solutions = [
  'Live Zillow ZHVI/ZORI — Real median home values and rent, updated monthly for every US metro',
  'FRED Mortgage Data — 30-year fixed rate, Case-Shiller HPI, and housing starts updated weekly',
  'AI Local Intelligence — Claude searches recent news and RE firm reports for city-specific insights',
  'Comparable Markets — 55 US cities benchmarked by city class, no international noise',
  'Sub-Market Breakdown — Neighborhood-level price estimates for 16 major metros',
  'Side-by-Side Comparison — Fetch two city reports and compare every metric head-to-head',
  'Export PDF — Download a formatted report with only the sections you have toggled on',
];

solutions.forEach((line, i) => {
  const ry = 1.72 + i * 0.63;
  s2.addShape(prs.ShapeType.ellipse, { x: colX2 + 0.22, y: ry + 0.1, w: 0.15, h: 0.15, fill: { color: GREEN } });
  s2.addText(line, {
    x: colX2 + 0.47, y: ry, w: colW - 0.62, h: 0.55,
    fontSize: 9.5, color: DARK, fontFace: 'Calibri', wrap: true,
  });
});


// ══════════════════════════════════════════════════════════════════════════
// SLIDE 3 — Workflow & Tools
// ══════════════════════════════════════════════════════════════════════════
const s3 = prs.addSlide();
bg(s3);
crimsonBar(s3, 0.85);

s3.addText('Parcel', {
  x: 0.55, y: 0, w: 2, h: 0.85,
  align: 'left', valign: 'middle',
  fontSize: 18, bold: true, italic: true,
  color: WHITE, fontFace: 'Georgia',
});
s3.addText('Workflow & Technology Stack', {
  x: 0, y: 0, w: W, h: 0.85,
  align: 'center', valign: 'middle',
  fontSize: 18, bold: false,
  color: WHITE, fontFace: 'Georgia', italic: true,
});

// ── Workflow steps ─────────────────────────────────────────────────────────
s3.addText('HOW IT WORKS', {
  x: 0.55, y: 1.05, w: 4, h: 0.35,
  fontSize: 9, bold: true, color: MUTED, fontFace: 'Calibri', charSpacing: 2,
});

const steps = [
  ['01', 'City Search',    'User types any US city — Nominatim geocoding returns verified lat/lon and state'],
  ['02', 'Data Fetch',     'Zillow CSV, FRED API, World Bank, and Claude web search run in parallel'],
  ['03', 'Analysis Build', 'Health score computed, comps matched by city class, insights generated'],
  ['04', 'Live Report',    'Interactive report with toggleable sections, source popovers, and PDF export'],
];

const stepW = (W - 1.1 - 0.45) / 4;
steps.forEach(([num, title, desc], i) => {
  const sx = 0.55 + i * (stepW + 0.15);
  const sy = 1.48;

  // Step card
  card(s3, sx, sy, stepW, 1.85, { fill: CREAM, border: i === 0 ? CRIMSON : BORDER });

  // Number badge
  s3.addShape(prs.ShapeType.ellipse, { x: sx + 0.15, y: sy + 0.15, w: 0.42, h: 0.42, fill: { color: i === 0 ? CRIMSON : BORDER } });
  s3.addText(num, {
    x: sx + 0.15, y: sy + 0.15, w: 0.42, h: 0.42,
    align: 'center', valign: 'middle',
    fontSize: 11, bold: true, color: i === 0 ? WHITE : MUTED, fontFace: 'Georgia',
  });

  s3.addText(title, {
    x: sx + 0.12, y: sy + 0.65, w: stepW - 0.2, h: 0.35,
    fontSize: 11, bold: true, color: DARK, fontFace: 'Georgia',
  });
  s3.addText(desc, {
    x: sx + 0.12, y: sy + 1.02, w: stepW - 0.2, h: 0.75,
    fontSize: 8.5, color: MUTED, fontFace: 'Calibri',
    wrap: true,
  });

  // Arrow between steps
  if (i < 3) {
    s3.addText('→', {
      x: sx + stepW + 0.01, y: sy + 0.6, w: 0.16, h: 0.4,
      align: 'center', fontSize: 14, color: CRIMSON, fontFace: 'Georgia',
    });
  }
});

sectionDivider(s3, 3.48);

// ── Tools grid ─────────────────────────────────────────────────────────────
s3.addText('BUILT WITH', {
  x: 0.55, y: 3.6, w: 4, h: 0.35,
  fontSize: 9, bold: true, color: MUTED, fontFace: 'Calibri', charSpacing: 2,
});

const tools = [
  { label: 'Next.js 16',       sub: 'App Router · TypeScript',   color: DARK    },
  { label: 'Tailwind CSS',     sub: 'Utility-first styling',      color: DARK    },
  { label: 'Zillow Research',  sub: 'ZHVI · ZORI live CSVs',      color: CRIMSON },
  { label: 'FRED API',         sub: 'St. Louis Fed — live rates',  color: CRIMSON },
  { label: 'World Bank API',   sub: 'US GDP · inflation data',     color: CRIMSON },
  { label: 'Anthropic Claude', sub: 'Web search · local insights', color: GREEN   },
  { label: 'jsPDF / html2canvas', sub: 'PDF report export',        color: DARK    },
  { label: 'Vercel',           sub: 'Deployment · CDN',            color: DARK    },
];

const toolW = (W - 1.1 - 0.35 * 3) / 4;
const toolH = 0.82;
tools.forEach((t, i) => {
  const col = i % 4;
  const row = Math.floor(i / 4);
  const tx = 0.55 + col * (toolW + 0.35 / 1);
  const ty = 4.02 + row * (toolH + 0.14);
  card(s3, tx, ty, toolW, toolH, { fill: CREAM, border: t.color === CRIMSON ? 'D4A09B' : BORDER });
  s3.addText(t.label, {
    x: tx + 0.14, y: ty + 0.1, w: toolW - 0.25, h: 0.35,
    fontSize: 10, bold: true, color: t.color, fontFace: i === 0 ? 'Georgia' : 'Calibri',
  });
  s3.addText(t.sub, {
    x: tx + 0.14, y: ty + 0.44, w: toolW - 0.25, h: 0.3,
    fontSize: 8, color: MUTED, fontFace: 'Calibri',
  });
});

// Dev note
s3.addText('Developed using Claude Code — Anthropic\'s AI-assisted CLI for software engineering', {
  x: 0, y: H - 0.4, w: W, h: 0.35,
  align: 'center', fontSize: 8, color: MUTED, fontFace: 'Calibri', italic: true,
});

// ── Write file ─────────────────────────────────────────────────────────────
prs.writeFile({ fileName: 'Parcel-Presentation.pptx' })
  .then(() => console.log('✓ Parcel-Presentation.pptx generated'))
  .catch(err => console.error(err));
