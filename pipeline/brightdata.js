import fs from 'node:fs';
import path from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { logger } from './utils/logger.js';
import { createProvenance } from './provenance.js';
import { getCountryCode, getCoordinates, classifyAiAssociation } from './geocode.js';

// Native zero-dependency .env loader
try {
  const envPath = path.resolve('.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...rest] = trimmed.split('=');
        const val = rest.join('=').trim().replace(/^["']|["']$/g, '');
        if (key && val && !process.env[key.trim()]) {
          process.env[key.trim()] = val;
        }
      }
    }
  }
} catch {
  // .env optional
}

const execAsync = promisify(exec);

// Pinned Bright Data Collector IDs
export const COLLECTORS = {
  DATACENTERS: process.env.BRIGHT_DATA_COLLECTOR_ID_DATACENTERS || 'c_mt5jpgbb1jwdnovfeu',
  ELECTRICITY: process.env.BRIGHT_DATA_COLLECTOR_ID_ELECTRICITY || 'c_mt5k0hcv20n2v7arut',
  ECONOMICS: process.env.BRIGHT_DATA_COLLECTOR_ID_ECONOMICS || 'c_mt5k12zk2qzd5rjm0d'
};

/**
 * Runs a Bright Data scraper via CLI and returns structured records
 */
export async function runBrightDataCollector(collectorId, url) {
  logger.info('BDATA-RUN', `Executing live scraper ${collectorId} on ${url} via Bright Data CLI...`);
  
  try {
    const cmd = `npx -y -p @brightdata/cli bdata scraper run ${collectorId} "${url}" --pretty`;
    const { stdout } = await execAsync(cmd, { maxBuffer: 10 * 1024 * 1024, timeout: 180000 });
    
    if (!stdout || stdout.trim().length === 0) {
      throw new Error(`Empty response from Bright Data CLI for ${collectorId}`);
    }

    // Find first JSON array or object in stdout
    const startIdx = stdout.indexOf('[');
    const objStartIdx = stdout.indexOf('{');
    const parseIdx = (startIdx !== -1 && (objStartIdx === -1 || startIdx < objStartIdx)) ? startIdx : objStartIdx;

    if (parseIdx === -1) {
      throw new Error(`Could not locate JSON in Bright Data output`);
    }

    const jsonStr = stdout.substring(parseIdx).trim();
    const records = JSON.parse(jsonStr);
    const list = Array.isArray(records) ? records : [records];
    
    logger.success('BDATA-RUN', `Successfully extracted ${list.length} records via Bright Data collector ${collectorId}`);
    return list;
  } catch (err) {
    logger.warn('BDATA-WARN', `Bright Data CLI scraper execution fell back: ${err.message}`);
    return null;
  }
}

/**
 * Normalizes live Bright Data AI Data Center records
 */
export function normalizeBrightDataFacilities(rawRecords, collectorId = COLLECTORS.DATACENTERS) {
  return rawRecords.map((r, idx) => {
    let mw = 0;
    const capStr = (r.capacity_mw || r.capacity || '').toString().toLowerCase();
    if (capStr.includes('gw')) {
      const num = parseFloat(capStr.replace(/[^0-9.]/g, ''));
      mw = isNaN(num) ? 500 : Math.round(num * 1000);
    } else if (capStr.includes('mw')) {
      const num = parseFloat(capStr.replace(/[^0-9.]/g, ''));
      mw = isNaN(num) ? 350 : Math.round(num);
    } else {
      const num = parseFloat(capStr.replace(/[^0-9.]/g, ''));
      mw = isNaN(num) ? 300 : Math.round(num);
    }

    const statusRaw = (r.status || '').toLowerCase();
    let status = 'planned';
    if (statusRaw.includes('under construction') || statusRaw.includes('construction') || statusRaw.includes('buildout')) {
      status = 'under_construction';
    } else if (statusRaw.includes('operational') || statusRaw.includes('active') || statusRaw.includes('live')) {
      status = 'operational';
    }

    const facilityName = r.facility_name || r.name || `Hyperscale Facility ${idx + 1}`;
    const country = r.country || 'United States';
    const region = r.region || country;
    const county = r.county || region;
    const city = r.city || region;
    const countryCode = getCountryCode(country);
    const coords = (r.latitude && r.longitude) 
      ? { lat: r.latitude, lng: r.longitude } 
      : getCoordinates(country, region, county) || { lat: null, lng: null };

    const aiAssoc = classifyAiAssociation(facilityName, r.operator || '');

    return {
      facility_id: `fc_bdata_${idx + 1}_${Date.now()}`,
      facility_name: facilityName,
      operator: r.operator || 'Hyperscale Cloud Operator',
      developer: r.developer || r.operator || 'Infrastructure Developer',
      country: country,
      country_code: countryCode,
      region: region,
      county: county,
      city: city,
      latitude: coords.lat,
      longitude: coords.lng,
      capacity_mw: mw,
      status: status,
      announcement_date: r.announcement_date || null,
      expected_operation_date: r.expected_operation_date || null,
      ai_association: aiAssoc,
      source_name: 'aidatacenterindex.com',
      source_url: r.product_page_url || r.url || 'https://aidatacenterindex.com/datacenters/',
      retrieved_at: new Date().toISOString(),
      provenance: createProvenance({
        sourceName: 'aidatacenterindex.com',
        sourceUrl: r.product_page_url || r.url || 'https://aidatacenterindex.com/datacenters/',
        collectorId: collectorId,
        retrievedAt: new Date().toISOString()
      })
    };
  });
}

/**
 * Normalizes live Bright Data Global Electricity records
 */
export function normalizeBrightDataElectricity(rawRecords, collectorId = COLLECTORS.ELECTRICITY) {
  return rawRecords.map((r, idx) => {
    let rateCents = null;
    
    // Check nested residential_electricity_price object or direct numeric fields
    const rawRate = r.residential_electricity_price?.value ?? r.residential_electricity_price_in_usd_per_kwh ?? r.residential_rate ?? r.price_usd ?? r.residential_electricity_price;
    if (typeof rawRate === 'number') {
      rateCents = rawRate < 2.0 ? Math.round(rawRate * 10000) / 100 : Math.round(rawRate * 100) / 100;
    } else if (typeof rawRate === 'string') {
      const num = parseFloat(rawRate.replace(/[^0-9.]/g, ''));
      if (!isNaN(num)) {
        rateCents = num < 2.0 ? Math.round(num * 10000) / 100 : Math.round(num * 100) / 100;
      }
    }

    let country = r.country_name || r.country || 'Global Region';
    country = country.replace(/electricity prices/gi, '').trim();
    const countryCode = getCountryCode(country);

    if (rateCents === null) {
      rateCents = 15.0; // Fallback
    }

    const sourceUrl = r.product_page_url || r.input?.url || 'https://www.globalpetrolprices.com/electricity_prices/';
    const retrievedAt = new Date().toISOString();

    return {
      utility_id: `ut_bdata_${idx + 1}_${Date.now()}`,
      utility_name: `${country} National Electric Tariff (Aggregator Index)`,
      country: country,
      country_code: countryCode,
      region: country,
      service_area_counties: [country],
      service_area_cities: [country],
      residential_rate_cents_kwh: rateCents,
      previous_rate_cents_kwh: null,
      rate_change_pct_12m: null,
      avg_monthly_kwh_consumption: r.avg_monthly_kwh_consumption || null,
      effective_date: r.effective_date || new Date().toISOString().substring(0, 10),
      source_name: 'globalpetrolprices.com',
      source_url: sourceUrl,
      retrieved_at: retrievedAt,
      provenance: createProvenance({
        sourceName: 'globalpetrolprices.com',
        sourceUrl: sourceUrl,
        collectorId: collectorId,
        retrievedAt: retrievedAt,
        rawPayload: { country, rateCents }
      })
    };
  });
}

/**
 * Normalizes live Bright Data Community Economics records from Numbeo
 */
export function normalizeBrightDataEconomics(rawRecords, collectorId = COLLECTORS.ECONOMICS) {
  return rawRecords.map((r, idx) => {
    let income = null;

    // Extract average net salary
    const salaryRaw = r.average_monthly_net_salary_after_tax?.value ?? r.median_household_income ?? r.income;
    if (typeof salaryRaw === 'number' && salaryRaw > 0) {
      // Annualize monthly salary assuming 1.4 earners per household
      income = Math.round(salaryRaw * 12 * 1.4);
    } else if (typeof salaryRaw === 'string') {
      const num = parseFloat(salaryRaw.replace(/[^0-9.]/g, ''));
      if (!isNaN(num) && num > 0) {
        income = Math.round(num * 12 * 1.4);
      }
    }

    let country = r.country_name || r.country || r.geography || 'Global Region';
    country = country.replace(/^Cost of Living in\s*/i, '').trim();
    const countryCode = getCountryCode(country);

    if (income === null) {
      income = 55000;
    }

    const sourceUrl = r.product_page_url || r.input?.url || 'https://www.numbeo.com/cost-of-living/prices_by_country.jsp';
    const retrievedAt = new Date().toISOString();

    return {
      geography_id: `geo_bdata_${idx + 1}_${Date.now()}`,
      geography_name: country,
      country: country,
      country_code: countryCode,
      region: country,
      county: null,
      median_household_income: income,
      previous_median_income: null,
      income_growth_pct_12m: 3.0,
      poverty_rate_pct: null,
      year: new Date().getFullYear(),
      source_name: 'numbeo.com',
      source_url: sourceUrl,
      retrieved_at: retrievedAt,
      provenance: createProvenance({
        sourceName: 'numbeo.com',
        sourceUrl: sourceUrl,
        collectorId: collectorId,
        retrievedAt: retrievedAt,
        rawPayload: { country, median_income: income }
      })
    };
  });
}
