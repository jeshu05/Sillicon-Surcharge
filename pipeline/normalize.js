/**
 * Power Draw - Multi-Format Normalization Engine
 * Standardizes noisy real-world web representations into strict numeric and categorical types.
 *
 * Uses region-aware defaults from geocode.js instead of applying US-centric values globally.
 */

import { createProvenance } from './provenance.js';
import { getCountryCode, getCoordinates, classifyAiAssociation, getRegionalDefault } from './geocode.js';
import { COLLECTORS } from './brightdata.js';

/**
 * Normalizes any power capacity string/number to Megawatts (MW)
 * Examples: "500 MW", "0.5 GW", "1,200 megawatts", "750,000 kW", 500
 */
export function normalizeCapacityMW(input) {
  if (input === null || input === undefined) return null;
  if (typeof input === 'number') return Number.isFinite(input) && input > 0 ? Math.round(input * 10) / 10 : null;

  const str = String(input).trim().toLowerCase().replace(/,/g, '');

  // Check Gigawatts (GW)
  const gwMatch = str.match(/([\d.]+)\s*(?:gw|gigawatts?)/i);
  if (gwMatch) {
    const val = parseFloat(gwMatch[1]);
    return Number.isFinite(val) ? Math.round(val * 1000 * 10) / 10 : null;
  }

  // Check Megawatts (MW)
  const mwMatch = str.match(/([\d.]+)\s*(?:mw|megawatts?)/i);
  if (mwMatch) {
    const val = parseFloat(mwMatch[1]);
    return Number.isFinite(val) ? Math.round(val * 10) / 10 : null;
  }

  // Check Kilowatts (kW)
  const kwMatch = str.match(/([\d.]+)\s*(?:kw|kilowatts?)/i);
  if (kwMatch) {
    const val = parseFloat(kwMatch[1]);
    return Number.isFinite(val) ? Math.round((val / 1000) * 10) / 10 : null;
  }

  // Pure number fallback
  const numMatch = str.match(/^([\d.]+)$/);
  if (numMatch) {
    const val = parseFloat(numMatch[1]);
    return Number.isFinite(val) && val > 0 ? Math.round(val * 10) / 10 : null;
  }

  return null;
}

/**
 * Normalizes electricity price strings to US Cents per Kilowatt-hour (¢/kWh)
 * Examples: "$0.158/kWh", "15.8 cents/kWh", "15.8¢", "$158/MWh", "0.158"
 */
export function normalizeElectricityRateCentsKwh(input) {
  if (input === null || input === undefined) return null;
  if (typeof input === 'number') return Number.isFinite(input) && input > 0 ? Math.round(input * 100) / 100 : null;

  const str = String(input).trim().toLowerCase().replace(/,/g, '');

  // Check $/MWh or dollars/MWh ($158/MWh -> 15.8 cents/kWh)
  const mwhMatch = str.match(/\$?\s*([\d.]+)\s*(?:\/|\s*per\s*)mwh/i);
  if (mwhMatch) {
    const val = parseFloat(mwhMatch[1]);
    return Number.isFinite(val) ? Math.round((val / 10) * 100) / 100 : null;
  }

  // Check $/kWh ($0.158/kWh -> 15.8 cents/kWh)
  const dollarKwhMatch = str.match(/\$\s*([\d.]+)\s*(?:\/|\s*per\s*)kwh/i);
  if (dollarKwhMatch) {
    const val = parseFloat(dollarKwhMatch[1]);
    return Number.isFinite(val) ? Math.round(val * 100 * 100) / 100 : null;
  }

  // Check cents/kWh or ¢/kWh ("15.8 cents", "15.8¢")
  const centsMatch = str.match(/([\d.]+)\s*(?:¢|cents?|c\/kwh|\/kwh)/i);
  if (centsMatch) {
    const val = parseFloat(centsMatch[1]);
    if (val < 1.0) {
      return Math.round(val * 100 * 100) / 100;
    }
    return Number.isFinite(val) ? Math.round(val * 100) / 100 : null;
  }

  // Raw numeric string fallback
  const rawVal = parseFloat(str.replace(/[^\d.]/g, ''));
  if (Number.isFinite(rawVal)) {
    if (rawVal < 1.0) return Math.round(rawVal * 100 * 100) / 100;
    return Math.round(rawVal * 100) / 100;
  }

  return null;
}

/**
 * Normalizes currency and income figures to numeric USD equivalent
 * Examples: "$74,500", "74500 USD", "$ 68,000 / year"
 */
export function normalizeIncome(input) {
  if (input === null || input === undefined) return null;
  if (typeof input === 'number') return Number.isFinite(input) && input > 0 ? Math.round(input) : null;

  const str = String(input).replace(/[^\d.]/g, '');
  const val = parseFloat(str);
  return Number.isFinite(val) && val > 0 ? Math.round(val) : null;
}

/**
 * Normalizes percentage strings to floating point numbers
 * Examples: "+12.4%", "3.2 percent", "-1.5%" -> 12.4, 3.2, -1.5
 */
export function normalizePercentage(input) {
  if (input === null || input === undefined) return null;
  if (typeof input === 'number') return Number.isFinite(input) ? Math.round(input * 10) / 10 : null;

  const str = String(input).trim();
  // Check if string starts with a negative sign
  const isNegative = /^-\s*\d/.test(str);
  const rawNum = parseFloat(str.replace(/[^\d.]/g, ''));
  if (!Number.isFinite(rawNum)) return null;

  const result = isNegative ? -rawNum : rawNum;
  return Math.round(result * 10) / 10;
}

/**
 * Normalizes facility development status
 */
export function normalizeStatus(input) {
  if (!input) return 'planned';
  const str = String(input).toLowerCase();
  if (str.includes('construct') || str.includes('building') || str.includes('groundbreak')) return 'under_construction';
  if (str.includes('operat') || str.includes('live') || str.includes('online') || str.includes('active')) return 'operational';
  if (str.includes('expan') || str.includes('phase 2') || str.includes('phase 3')) return 'expansion';
  if (str.includes('decommission') || str.includes('closed') || str.includes('retired')) return 'decommissioned';
  return 'planned';
}

/**
 * Normalizes AI workload association level
 */
export function normalizeAiAssociation(input, title = '', operator = '') {
  const combined = `${input || ''} ${title || ''} ${operator || ''}`.toLowerCase();
  if (combined.includes('gpu') || combined.includes('llm') || combined.includes('ai cluster') || combined.includes('supercomputer') || combined.includes('openai') || combined.includes('anthropic') || combined.includes('nvda') || combined.includes('blackwell') || combined.includes('tpu') || combined.includes('xai')) {
    return 'high';
  }
  if (combined.includes('hyperscale') || combined.includes('aws') || combined.includes('azure') || combined.includes('google cloud') || combined.includes('meta') || combined.includes('microsoft') || combined.includes('moderate') || combined.includes('medium')) {
    return 'medium';
  }
  if (combined.includes('colocation') || combined.includes('enterprise') || combined.includes('hosting') || combined.includes('low')) {
    return 'low';
  }
  return 'unknown';
}

/**
 * Full record normalizer for Data Center facilities
 */
export function normalizeDataCenterRecord(raw, defaultSource = {}) {
  const capacity = normalizeCapacityMW(raw.capacity_mw || raw.raw_capacity || raw.power_mw || raw.capacity);
  const status = normalizeStatus(raw.status || raw.raw_status);
  const facilityName = (raw.facility_name || raw.raw_title || 'Unnamed Project').trim();
  const operator = (raw.operator || raw.raw_operator || 'Undisclosed Operator').trim();
  const aiAssoc = normalizeAiAssociation(raw.ai_association, facilityName, operator);

  const country = raw.country || defaultSource.country || 'United States';
  const countryCode = raw.country_code ? getCountryCode(raw.country_code) : getCountryCode(country);
  const region = raw.region || raw.state || defaultSource.region || country;
  const county = raw.county || null;
  const city = raw.city || null;

  const coords = (typeof raw.latitude === 'number' && typeof raw.longitude === 'number')
    ? { lat: raw.latitude, lng: raw.longitude }
    : getCoordinates(country, region, county || city) || { lat: null, lng: null };

  const sourceUrl = raw.source_url || raw.provenance?.source_url || defaultSource.source_url || 'https://aidatacenterindex.com/datacenters/';
  const sourceName = raw.source_name || raw.provenance?.source_name || defaultSource.source_name || 'aidatacenterindex.com';
  const retrievedAt = raw.retrieved_at || raw.provenance?.retrieved_at || new Date().toISOString();

  const isEstimatedCap = capacity === null;
  const finalCapacity = capacity !== null ? capacity : 100;

  return {
    facility_id: raw.facility_id || `fc_${Math.abs(hashString((facilityName) + region))}`,
    facility_name: facilityName,
    operator,
    developer: (raw.developer || raw.raw_developer || null),
    country,
    country_code: countryCode,
    region,
    county,
    city,
    latitude: coords.lat,
    longitude: coords.lng,
    capacity_mw: finalCapacity,
    is_capacity_estimated: isEstimatedCap,
    status,
    announcement_date: raw.announcement_date || null,
    expected_operation_date: raw.expected_operation_date || null,
    ai_association: aiAssoc,
    source_url: sourceUrl,
    source_name: sourceName,
    retrieved_at: retrievedAt,
    provenance: createProvenance({
      sourceName,
      sourceUrl,
      collectorId: raw.collector_id || COLLECTORS.DATACENTERS,
      retrievedAt,
      rawPayload: { facility_name: facilityName, capacity_mw: finalCapacity }
    })
  };
}

/**
 * Full record normalizer for Electricity tariffs
 */
export function normalizeElectricityRecord(raw, defaultSource = {}) {
  const currentRate = normalizeElectricityRateCentsKwh(raw.residential_rate_cents_kwh || raw.raw_rate || raw.rate);
  const prevRate = normalizeElectricityRateCentsKwh(raw.previous_rate_cents_kwh || raw.prev_rate);

  const country = raw.country || defaultSource.country || 'United States';
  const countryCode = raw.country_code ? getCountryCode(raw.country_code) : getCountryCode(country);
  const region = (raw.region || raw.state || defaultSource.region || country).trim();

  let changePct = normalizePercentage(raw.rate_change_pct_12m);
  if (changePct === null && currentRate && prevRate && prevRate > 0) {
    changePct = Math.round(((currentRate - prevRate) / prevRate) * 1000) / 10;
  }

  const isEstimatedRate = currentRate === null;
  const finalRate = currentRate !== null ? currentRate : getRegionalDefault('rate', countryCode);
  const finalKwh = raw.avg_monthly_kwh_consumption || getRegionalDefault('kwh', countryCode);

  const sourceUrl = raw.source_url || raw.provenance?.source_url || defaultSource.source_url || 'https://www.globalpetrolprices.com/electricity_prices/';
  const sourceName = raw.source_name || raw.provenance?.source_name || defaultSource.source_name || 'globalpetrolprices.com';
  const retrievedAt = raw.retrieved_at || raw.provenance?.retrieved_at || new Date().toISOString();

  return {
    utility_id: raw.utility_id || `ut_${Math.abs(hashString((raw.utility_name || 'utility') + region))}`,
    utility_name: (raw.utility_name || `${region} Electric Service`).trim(),
    country,
    country_code: countryCode,
    region,
    service_area_counties: Array.isArray(raw.service_area_counties) ? raw.service_area_counties : (raw.raw_territory ? [raw.raw_territory] : [region]),
    service_area_cities: Array.isArray(raw.service_area_cities) ? raw.service_area_cities : [],
    residential_rate_cents_kwh: finalRate,
    is_rate_estimated: isEstimatedRate,
    previous_rate_cents_kwh: prevRate,
    rate_change_pct_12m: changePct,
    avg_monthly_kwh_consumption: finalKwh,
    effective_date: raw.effective_date || new Date().toISOString().split('T')[0],
    source_url: sourceUrl,
    source_name: sourceName,
    retrieved_at: retrievedAt,
    provenance: createProvenance({
      sourceName,
      sourceUrl,
      collectorId: raw.collector_id || COLLECTORS.ELECTRICITY,
      retrievedAt,
      rawPayload: { utility_name: raw.utility_name, residential_rate: finalRate }
    })
  };
}

/**
 * Full record normalizer for Community Economics
 */
export function normalizeEconomicsRecord(raw, defaultSource = {}) {
  const income = normalizeIncome(raw.median_household_income || raw.raw_income || raw.income);
  const prevIncome = normalizeIncome(raw.previous_median_income || raw.prev_income);

  const country = raw.country || defaultSource.country || 'United States';
  const countryCode = raw.country_code ? getCountryCode(raw.country_code) : getCountryCode(country);
  const region = (raw.region || raw.state || defaultSource.region || country).trim();

  let growthPct = normalizePercentage(raw.income_growth_pct_12m || raw.raw_growth);
  if (growthPct === null && income && prevIncome && prevIncome > 0) {
    growthPct = Math.round(((income - prevIncome) / prevIncome) * 1000) / 10;
  }

  const isEstimatedIncome = income === null;
  const finalIncome = income !== null ? income : getRegionalDefault('income', countryCode);

  const sourceUrl = raw.source_url || raw.provenance?.source_url || defaultSource.source_url || 'https://www.numbeo.com/cost-of-living/';
  const sourceName = raw.source_name || raw.provenance?.source_name || defaultSource.source_name || 'numbeo.com / Census Bureau';
  const retrievedAt = raw.retrieved_at || raw.provenance?.retrieved_at || new Date().toISOString();

  return {
    geography_id: raw.geography_id || `geo_${Math.abs(hashString((raw.geography_name || region) + countryCode))}`,
    geography_name: (raw.geography_name || raw.raw_geography || region).trim(),
    country,
    country_code: countryCode,
    region,
    county: raw.county || null,
    median_household_income: finalIncome,
    is_income_estimated: isEstimatedIncome,
    previous_median_income: prevIncome,
    income_growth_pct_12m: growthPct !== null ? growthPct : 3.0,
    poverty_rate_pct: typeof raw.poverty_rate_pct === 'number' ? raw.poverty_rate_pct : null,
    year: raw.year || new Date().getFullYear(),
    source_url: sourceUrl,
    source_name: sourceName,
    retrieved_at: retrievedAt,
    provenance: createProvenance({
      sourceName,
      sourceUrl,
      collectorId: raw.collector_id || COLLECTORS.ECONOMICS,
      retrievedAt,
      rawPayload: { geography: raw.geography_name, income: finalIncome }
    })
  };
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  const result = Math.abs(hash);
  return Number.isFinite(result) && result >= 0 ? result : 0;
}
