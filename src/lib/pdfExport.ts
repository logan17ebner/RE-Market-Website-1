import { AnalysisReport } from './types';

const CREAM  = '#f5f0e8';
const CRIMSON = '#8B1C13';
const DARK   = '#1a1514';
const MUTED  = '#7a6e65';
const BORDER = '#ddd5c5';
const GREEN  = '#2d7a4f';
const RED    = '#b91c1c';

// rgb helpers
function hex(h: string): [number, number, number] {
  const r = parseInt(h.slice(1, 3), 16);
  const g = parseInt(h.slice(3, 5), 16);
  const b = parseInt(h.slice(5, 7), 16);
  return [r, g, b];
}

export async function exportAnalysisPDF(report: AnalysisReport, elementId: string) {
  const { default: jsPDF } = await import('jspdf');
  const { default: html2canvas } = await import('html2canvas');

  const el = document.getElementById(elementId);
  if (!el) throw new Error('Export element not found');

  const canvas = await html2canvas(el, {
    backgroundColor: CREAM,
    scale: 1.5,
    useCORS: true,
    logging: false,
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.92);
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageWidth  = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth   = pageWidth;
  const imgHeight  = (canvas.height * imgWidth) / canvas.width;

  let yOffset = 0;
  let page    = 0;

  while (yOffset < imgHeight) {
    if (page > 0) pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, -yOffset, imgWidth, imgHeight);
    yOffset += pageHeight;
    page++;
  }

  // Cover page (prepended)
  pdf.insertPage(1);
  pdf.setPage(1);

  pdf.setFillColor(...hex(CREAM));
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  // Crimson header bar
  pdf.setFillColor(...hex(CRIMSON));
  pdf.rect(0, 0, pageWidth, 22, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(255, 255, 255);
  pdf.text('RE MARKET INTELLIGENCE', pageWidth / 2, 14, { align: 'center' });

  // City name
  pdf.setFontSize(32);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...hex(DARK));
  pdf.text(report.config.city.name, pageWidth / 2, 52, { align: 'center' });

  pdf.setFontSize(13);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...hex(CRIMSON));
  pdf.text('Residential Market Analysis', pageWidth / 2, 62, { align: 'center' });

  pdf.setFontSize(9);
  pdf.setTextColor(...hex(MUTED));
  pdf.text(report.config.city.displayName, pageWidth / 2, 70, { align: 'center' });

  // Divider
  pdf.setDrawColor(...hex(BORDER));
  pdf.setLineWidth(0.4);
  pdf.line(20, 78, pageWidth - 20, 78);

  // Key metrics grid
  const { property, economic, healthScore } = report;
  const mortgageRate = economic.fred?.mortgageRate;

  const metrics: [string, string][] = [
    ['Median Home Value',   property.medianPrice ? `$${(property.medianPrice / 1000).toFixed(0)}K` : 'N/A'],
    ['Median Rent',         property.medianRent  ? `$${property.medianRent.toLocaleString()}/mo`   : 'N/A'],
    ['YoY Price Change',    property.yoyChange != null ? `${property.yoyChange >= 0 ? '+' : ''}${property.yoyChange.toFixed(1)}%` : 'N/A'],
    ['Gross Rental Yield',  property.rentalYield  ? `${property.rentalYield.toFixed(1)}%`          : 'N/A'],
    ['30-Yr Mortgage Rate', mortgageRate          ? `${mortgageRate.toFixed(2)}%`                  : 'N/A'],
    ['Market Health',       `${healthScore.overall}/100 — ${healthScore.label}`],
  ];

  metrics.forEach(([label, value], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x   = col === 0 ? 20 : pageWidth / 2 + 5;
    const y   = 90 + row * 22;

    pdf.setFontSize(7.5);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...hex(MUTED));
    pdf.text(label.toUpperCase(), x, y);

    pdf.setFontSize(13);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...hex(DARK));
    pdf.text(value, x, y + 7);
  });

  // Bottom divider + disclaimer
  pdf.setDrawColor(...hex(BORDER));
  pdf.line(20, pageHeight - 22, pageWidth - 20, pageHeight - 22);

  pdf.setFontSize(7.5);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...hex(MUTED));
  pdf.text(
    'Data: Zillow Research (ZHVI/ZORI) · FRED St. Louis Fed · World Bank · For informational purposes only',
    pageWidth / 2, pageHeight - 14, { align: 'center' },
  );
  pdf.text(
    `Generated ${new Date(report.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
    pageWidth / 2, pageHeight - 8, { align: 'center' },
  );

  pdf.save(`RE-Analysis-${report.config.city.name.replace(/\s+/g, '-')}-${Date.now()}.pdf`);
}

export async function exportOnePager(report: AnalysisReport) {
  const { default: jsPDF } = await import('jspdf');

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W   = pdf.internal.pageSize.getWidth();   // 210
  const H   = pdf.internal.pageSize.getHeight();  // 297

  const { property, economic, healthScore, comparables, insights, risks, opportunities } = report;
  const mortgageRate   = economic.fred?.mortgageRate;
  const housingStartsVal = economic.fred?.housingStarts?.slice(-1)[0]?.value;
  const startsDisplay  = housingStartsVal != null
    ? housingStartsVal >= 1000 ? `${(housingStartsVal / 1000).toFixed(1)}M` : `${housingStartsVal.toFixed(0)}K`
    : 'N/A';

  // ── Crimson header bar ──────────────────────────────────────────────────────
  pdf.setFillColor(...hex(CRIMSON));
  pdf.rect(0, 0, W, 18, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(255, 255, 255);
  pdf.text('RE MARKET INTELLIGENCE', 10, 11.5);

  const dateStr = new Date(report.generatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.text(dateStr, W - 10, 11.5, { align: 'right' });

  // ── City title ──────────────────────────────────────────────────────────────
  let y = 28;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(22);
  pdf.setTextColor(...hex(DARK));
  pdf.text(report.config.city.name, 10, y);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(...hex(CRIMSON));
  y += 6;
  pdf.text('Residential Market — One-Page Summary', 10, y);

  pdf.setFontSize(8);
  pdf.setTextColor(...hex(MUTED));
  y += 5;
  pdf.text(property.metro ?? report.config.city.displayName, 10, y);

  // ── Thin divider ───────────────────────────────────────────────────────────
  y += 5;
  pdf.setDrawColor(...hex(BORDER));
  pdf.setLineWidth(0.3);
  pdf.line(10, y, W - 10, y);

  // ── Key metrics row (4 boxes) ───────────────────────────────────────────────
  y += 6;
  const boxW  = (W - 20 - 9) / 4;   // 4 boxes with 3 gaps of 3mm
  const boxH  = 22;

  const keyMetrics: [string, string, number | null][] = [
    ['Median Home Value', property.medianPrice ? `$${(property.medianPrice / 1000).toFixed(0)}K` : 'N/A', property.yoyChange ?? null],
    ['Median Rent',       property.medianRent  ? `$${property.medianRent.toLocaleString()}/mo`   : 'N/A', null],
    ['Gross Yield',       property.rentalYield  ? `${property.rentalYield.toFixed(1)}%`          : 'N/A', null],
    ['Market Health',     `${healthScore.overall}/100`, null],
  ];

  keyMetrics.forEach(([label, value, change], i) => {
    const bx = 10 + i * (boxW + 3);

    pdf.setFillColor(...hex(i === 3 ? '#fdf6ee' : CREAM));
    pdf.setDrawColor(...hex(BORDER));
    pdf.setLineWidth(0.3);
    pdf.roundedRect(bx, y, boxW, boxH, 1.5, 1.5, 'FD');

    if (i === 3) {  // health score — crimson left border
      pdf.setFillColor(...hex(CRIMSON));
      pdf.rect(bx, y, 1.5, boxH, 'F');
    }

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    pdf.setTextColor(...hex(MUTED));
    pdf.text(label.toUpperCase(), bx + 4, y + 5.5);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(...hex(DARK));
    pdf.text(value, bx + 4, y + 13);

    if (change != null) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(...hex(change >= 0 ? GREEN : RED));
      pdf.text(`${change >= 0 ? '↑' : '↓'} ${Math.abs(change).toFixed(1)}% YoY`, bx + 4, y + 19);
    }

    if (i === 3) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(...hex(CRIMSON));
      pdf.text(healthScore.label, bx + 4, y + 19);
    }
  });

  y += boxH + 6;

  // ── Second row: mortgage + starts + HPI ────────────────────────────────────
  const hpiLatest = economic.fred?.homePriceIndex?.slice(-1)[0]?.value;
  const hpiPrev   = economic.fred?.homePriceIndex?.slice(-13)[0]?.value;
  const hpiChange = hpiLatest && hpiPrev ? ((hpiLatest - hpiPrev) / hpiPrev) * 100 : null;

  const row2: [string, string][] = [
    ['30-Yr Mortgage Rate', mortgageRate   ? `${mortgageRate.toFixed(2)}%`       : 'N/A'],
    ['Housing Starts',      startsDisplay],
    ['Case-Shiller HPI',    hpiLatest      ? `${hpiLatest.toFixed(0)}`           : 'N/A'],
    ['GDP Growth (US)',     economic.gdpGrowth ? `${economic.gdpGrowth.toFixed(1)}%` : 'N/A'],
  ];

  row2.forEach(([label, value], i) => {
    const bx = 10 + i * (boxW + 3);
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(...hex(BORDER));
    pdf.setLineWidth(0.3);
    pdf.roundedRect(bx, y, boxW, 16, 1.5, 1.5, 'FD');

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6);
    pdf.setTextColor(...hex(MUTED));
    pdf.text(label.toUpperCase(), bx + 3, y + 5);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(...hex(DARK));
    pdf.text(value, bx + 3, y + 12);
  });

  y += 20;

  // ── Price trend mini bar chart ─────────────────────────────────────────────
  const history = property.rentHistory ?? property.priceHistory ?? [];
  const recent  = history.slice(-12);

  if (recent.length >= 3) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(...hex(DARK));
    pdf.text('PRICE TREND — LAST 12 MONTHS', 10, y);
    y += 4;

    const chartW = W - 20;
    const chartH = 20;
    const barW   = (chartW / recent.length) * 0.65;
    const gap    = chartW / recent.length;
    const vals   = recent.map(p => p.value);
    const minV   = Math.min(...vals);
    const maxV   = Math.max(...vals);
    const range  = maxV - minV || 1;

    recent.forEach((pt, i) => {
      const barH = Math.max(1, ((pt.value - minV) / range) * chartH);
      const bx   = 10 + i * gap;
      const by   = y + chartH - barH;
      pdf.setFillColor(...hex(CRIMSON));
      pdf.rect(bx, by, barW, barH, 'F');
    });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6);
    pdf.setTextColor(...hex(MUTED));
    pdf.text(recent[0].period.slice(0, 7), 10, y + chartH + 4);
    pdf.text(recent[recent.length - 1].period.slice(0, 7), 10 + chartW - 10, y + chartH + 4, { align: 'right' });

    y += chartH + 8;
  }

  // ── Comparable markets table ───────────────────────────────────────────────
  if (comparables.length > 0) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(...hex(DARK));
    pdf.text('COMPARABLE MARKETS', 10, y);
    y += 4;

    const colX = [10, 70, 110, 145, 175];
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6);
    pdf.setTextColor(...hex(MUTED));
    ['City', 'Avg $/sqft', 'YoY %', 'Health', 'vs This City'].forEach((h, i) => pdf.text(h, colX[i], y));
    y += 1.5;
    pdf.setDrawColor(...hex(BORDER));
    pdf.line(10, y, W - 10, y);
    y += 3;

    comparables.slice(0, 4).forEach(c => {
      const diff = property.avgPricePerSqft ? c.avgPricePerSqft - property.avgPricePerSqft : null;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(...hex(DARK));
      pdf.text(c.city, colX[0], y);
      pdf.text(`$${c.avgPricePerSqft}`, colX[1], y);
      pdf.setTextColor(...hex(c.yoyChange >= 0 ? GREEN : RED));
      pdf.text(`${c.yoyChange >= 0 ? '+' : ''}${c.yoyChange.toFixed(1)}%`, colX[2], y);
      pdf.setTextColor(...hex(DARK));
      pdf.text(`${c.healthScore}/100`, colX[3], y);
      if (diff !== null) {
        pdf.setTextColor(...hex(diff <= 0 ? GREEN : RED));
        pdf.text(`${diff >= 0 ? '+' : ''}$${diff.toFixed(0)}`, colX[4], y);
      }
      y += 6;
    });

    y += 2;
  }

  // ── Insights ───────────────────────────────────────────────────────────────
  const allBullets = [...insights.slice(0, 2), ...opportunities.slice(0, 1), ...risks.slice(0, 1)];
  if (allBullets.length > 0 && y < H - 30) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(...hex(DARK));
    pdf.text('KEY INSIGHTS', 10, y);
    y += 4;

    allBullets.forEach(bullet => {
      if (y > H - 25) return;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(...hex(DARK));
      const lines = pdf.splitTextToSize(`• ${bullet}`, W - 20) as string[];
      lines.forEach((line: string) => {
        pdf.text(line, 10, y);
        y += 4;
      });
    });
  }

  // ── Footer ─────────────────────────────────────────────────────────────────
  pdf.setFillColor(...hex(CRIMSON));
  pdf.rect(0, H - 10, W, 10, 'F');

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6.5);
  pdf.setTextColor(255, 255, 255);
  pdf.text('Data: Zillow Research (ZHVI/ZORI) · FRED St. Louis Fed · World Bank · For informational purposes only', W / 2, H - 4, { align: 'center' });

  pdf.save(`RE-OnePager-${report.config.city.name.replace(/\s+/g, '-')}-${Date.now()}.pdf`);
}
