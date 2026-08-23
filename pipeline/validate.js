/**
 * Power Draw - Contract Validator & Anomaly Classifier
 * Strictly validates collector outputs against schemas and classifies issues:
 * 1. Scraper Failure (null/missing fields, selector breaks) -> Self-Healing
 * 2. Data Anomaly (unrealistic values) -> Quarantine & Flag (no scraper modification)
 */

import { logger } from './utils/logger.js';

export const VALIDATION_LIMITS = {
  capacity_mw: { min: 0.5, max: 15000 },
  residential_rate_cents_kwh: { min: 0.5, max: 150.0 }, // 0.5 cents (heavily subsidized) to $1.50/kWh (remote island/diesel microgrids)
  median_household_income: { min: 3000, max: 600000 },
  rate_change_pct_12m: { min: -50.0, max: 300.0 },
  income_growth_pct_12m: { min: -30.0, max: 100.0 }
};

/**
 * Validates a batch of Data Center records
 */
export function validateDataCenterBatch(records) {
  const result = {
    domain: 'datacenters',
    total_records: records.length,
    valid_records: 0,
    failures: [],
    anomalies: [],
    requires_heal: false,
    heal_diagnosis: null
  };

  const missingFieldsCount = {};

  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    const issues = [];
    const anomalyIssues = [];

    // Structural checks
    if (!r.facility_name || typeof r.facility_name !== 'string') {
      issues.push('missing_or_invalid_facility_name');
      missingFieldsCount['facility_name'] = (missingFieldsCount['facility_name'] || 0) + 1;
    }

    if (r.capacity_mw === null || r.capacity_mw === undefined || isNaN(r.capacity_mw)) {
      issues.push('missing_capacity_mw');
      missingFieldsCount['capacity_mw'] = (missingFieldsCount['capacity_mw'] || 0) + 1;
    } else if (r.capacity_mw < VALIDATION_LIMITS.capacity_mw.min || r.capacity_mw > VALIDATION_LIMITS.capacity_mw.max) {
      // Out of bounds -> Anomaly, not scraper failure
      anomalyIssues.push({
        field: 'capacity_mw',
        value: r.capacity_mw,
        reason: `Value outside expected range [${VALIDATION_LIMITS.capacity_mw.min} - ${VALIDATION_LIMITS.capacity_mw.max} MW]`
      });
    }

    if (!r.status || typeof r.status !== 'string') {
      issues.push('missing_status');
      missingFieldsCount['status'] = (missingFieldsCount['status'] || 0) + 1;
    }

    if (!r.provenance || !r.provenance.source_url) {
      issues.push('missing_provenance_url');
      missingFieldsCount['source_url'] = (missingFieldsCount['source_url'] || 0) + 1;
    }

    if (issues.length > 0) {
      result.failures.push({ index: i, record_id: r.facility_id || `rec_${i}`, issues });
    } else if (anomalyIssues.length > 0) {
      result.anomalies.push({ index: i, record_id: r.facility_id || `rec_${i}`, anomalyIssues });
    } else {
      result.valid_records++;
    }
  }

  // Determine if scraper failure requires healing (> 10% failure rate on structural fields)
  if (result.failures.length > 0 && (result.failures.length / result.total_records) > 0.1) {
    result.requires_heal = true;
    result.heal_diagnosis = {
      collector_id: records[0]?.provenance?.collector_id || 'c_pd_datacenters_01',
      failed_count: result.failures.length,
      missing_fields: missingFieldsCount,
      primary_broken_field: Object.entries(missingFieldsCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown'
    };
  }

  return result;
}

/**
 * Validates a batch of Electricity Pricing records
 */
export function validateElectricityBatch(records) {
  const result = {
    domain: 'electricity',
    total_records: records.length,
    valid_records: 0,
    failures: [],
    anomalies: [],
    requires_heal: false,
    heal_diagnosis: null
  };

  const missingFieldsCount = {};

  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    const issues = [];
    const anomalyIssues = [];

    if (!r.utility_name) {
      issues.push('missing_utility_name');
      missingFieldsCount['utility_name'] = (missingFieldsCount['utility_name'] || 0) + 1;
    }

    if (r.residential_rate_cents_kwh === null || r.residential_rate_cents_kwh === undefined || isNaN(r.residential_rate_cents_kwh)) {
      issues.push('missing_residential_rate');
      missingFieldsCount['residential_rate_cents_kwh'] = (missingFieldsCount['residential_rate_cents_kwh'] || 0) + 1;
    } else if (r.residential_rate_cents_kwh < VALIDATION_LIMITS.residential_rate_cents_kwh.min || r.residential_rate_cents_kwh > VALIDATION_LIMITS.residential_rate_cents_kwh.max) {
      anomalyIssues.push({
        field: 'residential_rate_cents_kwh',
        value: r.residential_rate_cents_kwh,
        reason: `Value outside expected range [${VALIDATION_LIMITS.residential_rate_cents_kwh.min} - ${VALIDATION_LIMITS.residential_rate_cents_kwh.max} cents/kWh]`
      });
    }

    if (!r.provenance || !r.provenance.source_url) {
      issues.push('missing_provenance_url');
      missingFieldsCount['source_url'] = (missingFieldsCount['source_url'] || 0) + 1;
    }

    if (issues.length > 0) {
      result.failures.push({ index: i, utility: r.utility_name || `rec_${i}`, issues });
    } else if (anomalyIssues.length > 0) {
      result.anomalies.push({ index: i, utility: r.utility_name || `rec_${i}`, anomalyIssues });
    } else {
      result.valid_records++;
    }
  }

  if (result.failures.length > 0 && (result.failures.length / result.total_records) > 0.1) {
    result.requires_heal = true;
    result.heal_diagnosis = {
      collector_id: records[0]?.provenance?.collector_id || 'c_pd_electricity_02',
      failed_count: result.failures.length,
      missing_fields: missingFieldsCount,
      primary_broken_field: Object.entries(missingFieldsCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown'
    };
  }

  return result;
}

/**
 * Validates a batch of Economics records
 */
export function validateEconomicsBatch(records) {
  const result = {
    domain: 'economics',
    total_records: records.length,
    valid_records: 0,
    failures: [],
    anomalies: [],
    requires_heal: false,
    heal_diagnosis: null
  };

  const missingFieldsCount = {};

  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    const issues = [];
    const anomalyIssues = [];

    if (!r.geography_name) {
      issues.push('missing_geography_name');
      missingFieldsCount['geography_name'] = (missingFieldsCount['geography_name'] || 0) + 1;
    }

    if (r.median_household_income === null || isNaN(r.median_household_income)) {
      issues.push('missing_median_household_income');
      missingFieldsCount['median_household_income'] = (missingFieldsCount['median_household_income'] || 0) + 1;
    } else if (r.median_household_income < VALIDATION_LIMITS.median_household_income.min || r.median_household_income > VALIDATION_LIMITS.median_household_income.max) {
      anomalyIssues.push({
        field: 'median_household_income',
        value: r.median_household_income,
        reason: `Value outside expected range [${VALIDATION_LIMITS.median_household_income.min} - ${VALIDATION_LIMITS.median_household_income.max} USD]`
      });
    }

    if (issues.length > 0) {
      result.failures.push({ index: i, geo: r.geography_name || `rec_${i}`, issues });
    } else if (anomalyIssues.length > 0) {
      result.anomalies.push({ index: i, geo: r.geography_name || `rec_${i}`, anomalyIssues });
    } else {
      result.valid_records++;
    }
  }

  if (result.failures.length > 0 && (result.failures.length / result.total_records) > 0.1) {
    result.requires_heal = true;
    result.heal_diagnosis = {
      collector_id: records[0]?.provenance?.collector_id || 'c_pd_economics_03',
      failed_count: result.failures.length,
      missing_fields: missingFieldsCount,
      primary_broken_field: Object.entries(missingFieldsCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown'
    };
  }

  return result;
}
