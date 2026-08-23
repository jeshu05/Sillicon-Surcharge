/**
 * Power Draw — Historical Electricity Rate Delta Resolution Engine
 * Computes authentic empirical 12-month rate changes by comparing live scraped
 * electricity tariffs against recorded historical snapshots in data/history/snapshots.json.
 *
 * Eliminates fabricated hardcoded rate change percentages (8.7% / 11.1%).
 */

import { loadHistory } from './history.js';
import { logger } from './utils/logger.js';
import { findBestRegionKey } from './geography.js';

/**
 * Computes empirical rate deltas and previous rates for electricity records
 * using actual historical snapshots.
 *
 * @param {Array<Object>} electricityRecords - Normalized electricity records
 * @param {Object} [existingHistory] - Optional pre-loaded history object
 * @returns {Promise<Array<Object>>} Enriched electricity records with real deltas
 */
export async function computeRateDeltas(electricityRecords, existingHistory = null) {
  const history = existingHistory || await loadHistory();
  const regionsHistory = history.regions || {};

  let matchedHistoricalCount = 0;

  const enrichedRecords = electricityRecords.map(elec => {
    const currentRate = elec.residential_rate_cents_kwh;
    if (!currentRate || isNaN(currentRate)) {
      return {
        ...elec,
        previous_rate_cents_kwh: null,
        rate_change_pct_12m: null,
        has_historical_baseline: false
      };
    }

    // Determine region key to look up history
    const regionKey = findBestRegionKey(elec);
    const regionPoints = regionsHistory[regionKey];

    let prevRate = elec.previous_rate_cents_kwh;
    let rateChangePct = elec.rate_change_pct_12m;
    let hasBaseline = false;

    // If historical data points exist in snapshots
    if (Array.isArray(regionPoints) && regionPoints.length > 1) {
      // Find historical point from ~1 year ago (e.g. 2025 or previous entry)
      const currentYear = new Date().getFullYear();
      const targetYear = currentYear - 1;

      const baselinePoint = regionPoints.find(p => p.year === targetYear) 
        || regionPoints[regionPoints.length - 2]; // Previous snapshot

      if (baselinePoint && baselinePoint.rate_cents_kwh && baselinePoint.rate_cents_kwh > 0) {
        prevRate = Number(baselinePoint.rate_cents_kwh);
        rateChangePct = Math.round(((currentRate - prevRate) / prevRate) * 1000) / 10;
        hasBaseline = true;
        matchedHistoricalCount++;
      }
    } else if (prevRate && !isNaN(prevRate) && prevRate > 0) {
      rateChangePct = Math.round(((currentRate - prevRate) / prevRate) * 1000) / 10;
      hasBaseline = true;
    }

    return {
      ...elec,
      previous_rate_cents_kwh: prevRate !== undefined ? prevRate : null,
      rate_change_pct_12m: rateChangePct !== undefined ? rateChangePct : null,
      has_historical_baseline: hasBaseline
    };
  });

  logger.info('HISTORICAL-RATES', `Resolved authentic rate deltas for ${matchedHistoricalCount}/${electricityRecords.length} electricity records from historical snapshots.`);
  return enrichedRecords;
}
