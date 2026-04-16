import { AnalysisReport, EconomicIndicators, MarketHealthScore, MarketType, PropertyMarketData } from '../types';

export function computeHealthScore(
  economic: EconomicIndicators,
  property: PropertyMarketData,
  marketType: MarketType
): MarketHealthScore {
  // Supply/Demand: low vacancy = high demand
  const vacancy = property.vacancyRate ?? 10;
  const vacancyBenchmarks: Record<MarketType, number> = {
    residential: 5, commercial: 10, retail: 10, industrial: 4, office: 12, land: 0,
  };
  const vacancyBench = vacancyBenchmarks[marketType];
  const sdScore = Math.max(0, Math.min(100, 80 - (vacancy - vacancyBench) * 4));

  // Price growth from history
  const history = property.priceHistory;
  let priceGrowthScore = 50;
  if (history.length >= 13) {
    const recent = history[history.length - 1].value;
    const yearAgo = history[history.length - 13].value;
    const yoy = ((recent - yearAgo) / yearAgo) * 100;
    priceGrowthScore = Math.max(0, Math.min(100, 50 + yoy * 3));
  }

  // Economic strength
  const gdpGrowth = economic.gdpGrowth ?? 2;
  const inflation = economic.inflation ?? 3;
  const realGrowth = gdpGrowth - inflation;
  const ecoScore = Math.max(0, Math.min(100, 50 + realGrowth * 8));

  // Investment potential: yield vs vacancy
  const yieldScore = Math.min(100, (property.rentalYield ?? 5) * 10);
  const investScore = Math.round((yieldScore * 0.6 + sdScore * 0.4));

  const overall = Math.round(sdScore * 0.3 + priceGrowthScore * 0.3 + ecoScore * 0.2 + investScore * 0.2);

  const getLabel = (s: number): MarketHealthScore['label'] => {
    if (s >= 80) return 'Hot';
    if (s >= 65) return 'Warm';
    if (s >= 45) return 'Neutral';
    if (s >= 30) return 'Cooling';
    return 'Cold';
  };

  return {
    overall,
    supplyDemand: Math.round(sdScore),
    priceGrowth: Math.round(priceGrowthScore),
    economicStrength: Math.round(ecoScore),
    investmentPotential: Math.round(investScore),
    label: getLabel(overall),
  };
}

export function generateInsights(report: Omit<AnalysisReport, 'insights' | 'risks' | 'opportunities'>): {
  insights: string[];
  risks: string[];
  opportunities: string[];
} {
  const { economic, property, healthScore, config } = report;
  const { city, marketType } = config;
  const insights: string[] = [];
  const risks: string[] = [];
  const opportunities: string[] = [];

  // Insights
  if (economic.gdpGrowth !== null) {
    const trend = economic.gdpGrowth > 3 ? 'strong' : economic.gdpGrowth > 1 ? 'moderate' : 'weak';
    insights.push(`${city.country} is showing ${trend} GDP growth of ${economic.gdpGrowth.toFixed(1)}%, providing a ${trend === 'strong' ? 'favorable' : trend === 'moderate' ? 'stable' : 'challenging'} economic backdrop for real estate investment.`);
  }

  if (property.rentalYield !== null) {
    const yieldLevel = property.rentalYield > 7 ? 'high' : property.rentalYield > 5 ? 'moderate' : 'compressed';
    insights.push(`${marketType.charAt(0).toUpperCase() + marketType.slice(1)} yields in ${city.name} are ${yieldLevel} at ~${property.rentalYield.toFixed(1)}%, ${yieldLevel === 'high' ? 'attractive for income-focused investors' : yieldLevel === 'moderate' ? 'in line with regional averages' : 'typical of gateway cities with strong capital appreciation'}.`);
  }

  if (property.vacancyRate !== null) {
    const vacDesc = property.vacancyRate < 5 ? 'very tight' : property.vacancyRate < 10 ? 'healthy' : 'elevated';
    insights.push(`${marketType.charAt(0).toUpperCase() + marketType.slice(1)} vacancy stands at ${property.vacancyRate.toFixed(1)}% — a ${vacDesc} market indicating ${property.vacancyRate < 5 ? 'strong demand pressure' : property.vacancyRate < 10 ? 'balanced supply and demand' : 'potential oversupply concerns'}.`);
  }

  insights.push(`Days on market average ${property.daysOnMarket} days, suggesting a ${property.daysOnMarket! < 30 ? 'highly competitive' : property.daysOnMarket! < 60 ? 'active' : 'balanced to soft'} seller's market.`);

  // Risks
  if (economic.inflation !== null && economic.inflation > 5) {
    risks.push(`Elevated inflation (${economic.inflation.toFixed(1)}%) may pressure operating costs and reduce real returns.`);
  }
  if (property.vacancyRate !== null && property.vacancyRate > 15) {
    risks.push(`High vacancy rates (${property.vacancyRate.toFixed(1)}%) indicate potential oversupply or weakening tenant demand.`);
  }
  if (economic.gdpGrowth !== null && economic.gdpGrowth < 1) {
    risks.push(`Sluggish GDP growth (${economic.gdpGrowth.toFixed(1)}%) may suppress rental demand and capital appreciation.`);
  }
  risks.push('Rising interest rates globally continue to compress cap rates and increase financing costs.');
  if (marketType === 'office') {
    risks.push('Structural shift toward hybrid work models continues to weigh on office demand in many markets.');
  }
  if (marketType === 'retail') {
    risks.push('Ongoing e-commerce penetration growth poses a headwind to brick-and-mortar retail fundamentals.');
  }

  // Opportunities
  if (property.rentalYield !== null && property.rentalYield > 6) {
    opportunities.push(`Above-average rental yields (~${property.rentalYield.toFixed(1)}%) offer attractive income relative to risk, especially compared to developed-market benchmarks.`);
  }
  if (economic.gdpGrowth !== null && economic.gdpGrowth > 3) {
    opportunities.push(`Strong economic growth trajectory supports rising occupier demand and rental rate growth over the medium term.`);
  }
  if (marketType === 'industrial') {
    opportunities.push('E-commerce and supply chain restructuring continue to drive robust industrial/logistics demand globally.');
  }
  if (marketType === 'residential' && economic.population !== null) {
    opportunities.push(`Population dynamics and urbanization trends support long-term residential demand fundamentals in ${city.name}.`);
  }
  opportunities.push(`${city.name}'s position within ${city.country} creates potential for value-add and repositioning strategies in the current cycle.`);

  return { insights, risks, opportunities };
}
