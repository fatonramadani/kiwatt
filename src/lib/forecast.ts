/**
 * Energy Forecast Calculation Logic
 *
 * Generates production forecasts based on historical data and seasonal patterns.
 * Future enhancement: integrate with weather APIs for better accuracy.
 */

// Swiss seasonal solar production factors (relative to peak summer)
const SEASONAL_FACTORS: Record<number, number> = {
  1: 0.25,   // January - winter
  2: 0.35,   // February
  3: 0.50,   // March
  4: 0.70,   // April
  5: 0.85,   // May
  6: 1.00,   // June - peak
  7: 0.95,   // July
  8: 0.85,   // August
  9: 0.65,   // September
  10: 0.45,  // October
  11: 0.30,  // November
  12: 0.20,  // December - lowest
};

// Hourly production pattern (% of daily max, based on Swiss solar data)
const HOURLY_PATTERN: Record<number, number> = {
  0: 0.00, 1: 0.00, 2: 0.00, 3: 0.00, 4: 0.00, 5: 0.00,
  6: 0.05, 7: 0.15, 8: 0.35, 9: 0.55, 10: 0.75, 11: 0.90,
  12: 1.00, 13: 0.95, 14: 0.85, 15: 0.70, 16: 0.50, 17: 0.30,
  18: 0.15, 19: 0.05, 20: 0.00, 21: 0.00, 22: 0.00, 23: 0.00,
};

// Typical consumption pattern (% of daily avg)
const CONSUMPTION_PATTERN: Record<number, number> = {
  0: 0.30, 1: 0.25, 2: 0.20, 3: 0.20, 4: 0.20, 5: 0.25,
  6: 0.50, 7: 0.80, 8: 0.90, 9: 0.85, 10: 0.80, 11: 0.85,
  12: 1.00, 13: 0.90, 14: 0.80, 15: 0.75, 16: 0.80, 17: 0.95,
  18: 1.10, 19: 1.20, 20: 1.15, 21: 1.00, 22: 0.70, 23: 0.45,
};

export interface HourlyForecast {
  hour: number;
  timestamp: string;
  productionKw: number;
  expectedConsumptionKw: number;
  expectedSurplusKw: number;
}

export interface OptimalWindow {
  start: string;
  end: string;
  avgSurplusKw: number;
  confidence: number;
}

export interface CommunityForecast {
  orgId: string;
  generatedAt: string;
  forecast: HourlyForecast[];
  optimalWindows: OptimalWindow[];
  summary: {
    peakProductionKw: number;
    peakSurplusKw: number;
    totalProductionKwh: number;
    totalSurplusKwh: number;
  };
}

export interface HistoricalData {
  avgDailyProductionKwh: number;
  avgDailyConsumptionKwh: number;
  installedCapacityKwp: number;
}

/**
 * Generate a 24-hour forecast for a community
 */
export function generateCommunityForecast(
  orgId: string,
  historicalData: HistoricalData,
  baseDate: Date = new Date()
): CommunityForecast {
  const month = baseDate.getMonth() + 1;
  const seasonalFactor = SEASONAL_FACTORS[month] ?? 0.5;

  // Calculate expected daily production based on installed capacity
  // Typical Swiss yield: 900-1100 kWh/kWp/year, so ~3 kWh/kWp/day in summer
  const expectedDailyProductionKwh = historicalData.avgDailyProductionKwh > 0
    ? historicalData.avgDailyProductionKwh * seasonalFactor
    : historicalData.installedCapacityKwp * 3 * seasonalFactor;

  const expectedDailyConsumptionKwh = historicalData.avgDailyConsumptionKwh;

  const forecast: HourlyForecast[] = [];
  let totalProductionKwh = 0;
  let totalSurplusKwh = 0;
  let peakProductionKw = 0;
  let peakSurplusKw = 0;

  for (let hour = 0; hour < 24; hour++) {
    const hourlyProductionFactor = HOURLY_PATTERN[hour] ?? 0;
    const hourlyConsumptionFactor = CONSUMPTION_PATTERN[hour] ?? 1;

    // Convert daily kWh to hourly kW using patterns
    const productionKw = (expectedDailyProductionKwh / 6) * hourlyProductionFactor; // Peak hours ~6h
    const consumptionKw = (expectedDailyConsumptionKwh / 24) * hourlyConsumptionFactor;
    const surplusKw = productionKw - consumptionKw;

    const timestamp = new Date(baseDate);
    timestamp.setHours(hour, 0, 0, 0);

    forecast.push({
      hour,
      timestamp: timestamp.toISOString(),
      productionKw: Math.round(productionKw * 10) / 10,
      expectedConsumptionKw: Math.round(consumptionKw * 10) / 10,
      expectedSurplusKw: Math.round(surplusKw * 10) / 10,
    });

    totalProductionKwh += productionKw;
    if (surplusKw > 0) totalSurplusKwh += surplusKw;
    if (productionKw > peakProductionKw) peakProductionKw = productionKw;
    if (surplusKw > peakSurplusKw) peakSurplusKw = surplusKw;
  }

  // Find optimal windows (consecutive hours with surplus > 1kW)
  const optimalWindows = findOptimalWindows(forecast);

  return {
    orgId,
    generatedAt: new Date().toISOString(),
    forecast,
    optimalWindows,
    summary: {
      peakProductionKw: Math.round(peakProductionKw * 10) / 10,
      peakSurplusKw: Math.round(peakSurplusKw * 10) / 10,
      totalProductionKwh: Math.round(totalProductionKwh * 10) / 10,
      totalSurplusKwh: Math.round(totalSurplusKwh * 10) / 10,
    },
  };
}

/**
 * Find consecutive hours with significant surplus
 */
function findOptimalWindows(forecast: HourlyForecast[]): OptimalWindow[] {
  const windows: OptimalWindow[] = [];
  let windowStart: number | null = null;
  let windowSurplus: number[] = [];

  const SURPLUS_THRESHOLD = 1.0; // kW

  for (let i = 0; i < forecast.length; i++) {
    const entry = forecast[i]!;

    if (entry.expectedSurplusKw >= SURPLUS_THRESHOLD) {
      if (windowStart === null) {
        windowStart = entry.hour;
      }
      windowSurplus.push(entry.expectedSurplusKw);
    } else {
      if (windowStart !== null && windowSurplus.length >= 2) {
        const avgSurplus = windowSurplus.reduce((a, b) => a + b, 0) / windowSurplus.length;
        windows.push({
          start: `${String(windowStart).padStart(2, '0')}:00`,
          end: `${String(entry.hour).padStart(2, '0')}:00`,
          avgSurplusKw: Math.round(avgSurplus * 10) / 10,
          confidence: calculateConfidence(windowSurplus),
        });
      }
      windowStart = null;
      windowSurplus = [];
    }
  }

  // Handle window that extends to end of day
  if (windowStart !== null && windowSurplus.length >= 2) {
    const avgSurplus = windowSurplus.reduce((a, b) => a + b, 0) / windowSurplus.length;
    windows.push({
      start: `${String(windowStart).padStart(2, '0')}:00`,
      end: "24:00",
      avgSurplusKw: Math.round(avgSurplus * 10) / 10,
      confidence: calculateConfidence(windowSurplus),
    });
  }

  return windows;
}

/**
 * Calculate confidence based on consistency of surplus
 */
function calculateConfidence(surplusValues: number[]): number {
  if (surplusValues.length === 0) return 0;

  const avg = surplusValues.reduce((a, b) => a + b, 0) / surplusValues.length;
  const variance = surplusValues.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / surplusValues.length;
  const stdDev = Math.sqrt(variance);

  // Lower variance = higher confidence
  // Normalize to 0.5-0.95 range
  const normalizedVariance = Math.min(stdDev / avg, 1);
  const confidence = 0.95 - (normalizedVariance * 0.45);

  return Math.round(confidence * 100) / 100;
}

/**
 * Get current surplus status
 */
export interface CurrentSurplus {
  timestamp: string;
  currentProductionKw: number;
  currentConsumptionKw: number;
  surplusKw: number;
  status: "surplus" | "balanced" | "deficit";
  recommendation: string;
}

export function getCurrentSurplusStatus(
  currentProductionKw: number,
  currentConsumptionKw: number
): CurrentSurplus {
  const surplusKw = currentProductionKw - currentConsumptionKw;

  let status: "surplus" | "balanced" | "deficit";
  let recommendation: string;

  if (surplusKw > 1) {
    status = "surplus";
    if (surplusKw > 3) {
      recommendation = "excellent_time_to_charge";
    } else {
      recommendation = "good_time_to_charge";
    }
  } else if (surplusKw < -1) {
    status = "deficit";
    recommendation = "delay_high_consumption";
  } else {
    status = "balanced";
    recommendation = "moderate_consumption_ok";
  }

  return {
    timestamp: new Date().toISOString(),
    currentProductionKw: Math.round(currentProductionKw * 10) / 10,
    currentConsumptionKw: Math.round(currentConsumptionKw * 10) / 10,
    surplusKw: Math.round(surplusKw * 10) / 10,
    status,
    recommendation,
  };
}
