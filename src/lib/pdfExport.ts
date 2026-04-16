import { AnalysisReport } from './types';
import { formatCurrency, formatPercent, getMarketTypeLabel } from './utils';

export async function exportAnalysisPDF(report: AnalysisReport, elementId: string) {
  const { default: jsPDF } = await import('jspdf');
  const { default: html2canvas } = await import('html2canvas');

  const el = document.getElementById(elementId);
  if (!el) throw new Error('Export element not found');

  const canvas = await html2canvas(el, {
    backgroundColor: '#070d1a',
    scale: 1.5,
    useCORS: true,
    logging: false,
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.92);
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let yOffset = 0;
  let page = 0;

  while (yOffset < imgHeight) {
    if (page > 0) pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, -yOffset, imgWidth, imgHeight);
    yOffset += pageHeight;
    page++;
  }

  // Cover page metadata (prepend)
  pdf.insertPage(1);
  pdf.setPage(1);

  // Background
  pdf.setFillColor(7, 13, 26);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  // Title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(22);
  pdf.setTextColor(255, 255, 255);
  pdf.text('RE Market Intelligence', pageWidth / 2, 40, { align: 'center' });

  pdf.setFontSize(14);
  pdf.setTextColor(148, 163, 184);
  pdf.text('Market Analysis Report', pageWidth / 2, 50, { align: 'center' });

  // City & market type
  pdf.setFontSize(28);
  pdf.setTextColor(96, 165, 250);
  pdf.text(report.config.city.name, pageWidth / 2, 80, { align: 'center' });

  pdf.setFontSize(14);
  pdf.setTextColor(167, 139, 250);
  pdf.text(getMarketTypeLabel(report.config.marketType) + ' Market', pageWidth / 2, 90, { align: 'center' });

  pdf.setFontSize(10);
  pdf.setTextColor(100, 116, 139);
  pdf.text(report.config.city.displayName, pageWidth / 2, 100, { align: 'center' });

  // Key metrics box
  const metrics = [
    ['Avg Price/sqft', report.property.avgPricePerSqft ? `$${report.property.avgPricePerSqft}` : 'N/A'],
    ['Rental Yield', report.property.rentalYield ? `${report.property.rentalYield.toFixed(1)}%` : 'N/A'],
    ['Vacancy Rate', report.property.vacancyRate ? `${report.property.vacancyRate.toFixed(1)}%` : 'N/A'],
    ['Days on Market', report.property.daysOnMarket ? `${report.property.daysOnMarket}` : 'N/A'],
    ['Market Health', `${report.healthScore.overall}/100 (${report.healthScore.label})`],
    ['GDP Growth', report.economic.gdpGrowth ? `${report.economic.gdpGrowth.toFixed(1)}%` : 'N/A'],
  ];

  let row = 0;
  metrics.forEach(([label, value], i) => {
    const col = i % 2;
    row = Math.floor(i / 2);
    const x = col === 0 ? 20 : pageWidth / 2 + 5;
    const y = 120 + row * 18;

    pdf.setFontSize(9);
    pdf.setTextColor(100, 116, 139);
    pdf.text(label, x, y);

    pdf.setFontSize(12);
    pdf.setTextColor(255, 255, 255);
    pdf.text(value, x, y + 6);
  });

  // Disclaimer
  pdf.setFontSize(8);
  pdf.setTextColor(71, 85, 105);
  pdf.text(
    'For informational purposes only. Data from World Bank, FRED, and regional benchmarks.',
    pageWidth / 2,
    pageHeight - 15,
    { align: 'center' }
  );
  pdf.text(`Generated ${new Date(report.generatedAt).toLocaleDateString()}`, pageWidth / 2, pageHeight - 9, { align: 'center' });

  pdf.save(`RE-Analysis-${report.config.city.name}-${report.config.marketType}-${Date.now()}.pdf`);
}
