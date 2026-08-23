/**
 * Power Draw - Web Acquisition & Scraper Integration Engine
 * Connects directly to Bright Data Scraper Studio CLI (`bdata scraper run`)
 * and Live Multi-Source Scrapers:
 * - Collector 1 (c_mt5jpgbb1jwdnovfeu): aidatacenterindex.com (AI Data Center Facilities)
 * - Collector 2 (c_mt5k0hcv20n2v7arut): globalpetrolprices.com (Electricity Tariffs)
 * - Collector 3 (c_mt5k12zk2qzd5rjm0d): numbeo.com (Household Economics)
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { logger } from './utils/logger.js';
import { runLiveScrapers } from './scraper.js';
import { createProvenance } from './provenance.js';
import {
  runBrightDataCollector,
  normalizeBrightDataFacilities,
  normalizeBrightDataElectricity,
  normalizeBrightDataEconomics,
  COLLECTORS
} from './brightdata.js';

export const TARGET_SOURCES = {
  datacenters: [
    { url: 'https://aidatacenterindex.com/datacenters/', name: 'aidatacenterindex.com', role: 'primary_global' }
  ],
  electricity: [
    { url: 'https://www.globalpetrolprices.com/electricity_prices/', name: 'globalpetrolprices.com', role: 'primary_global' },
    { url: 'https://findenergy.com/electricity/', name: 'findenergy.com', role: 'primary_us_county' },
    { url: 'https://www.electricchoice.com/electricity-prices-by-state/', name: 'electricchoice.com', role: 'us_state_rates' }
  ],
  economics: [
    { url: 'https://www.numbeo.com/cost-of-living/prices_by_country.jsp', name: 'numbeo.com', role: 'primary_global_income' },
    { url: 'https://www.city-data.com/top70.html', name: 'city-data.com', role: 'primary_us_county' }
  ]
};

/**
 * Fetches raw batch data across all three domains via Bright Data Scraper Studio & live scrapers
 */
export async function fetchAllRawData() {
  logger.section('Initiating Web Acquisition via Bright Data Scraper Studio & Live Scrapers');

  // 1. Data Centers: Attempt live Bright Data Scraper Studio execution
  logger.info('SOURCE', `Connecting to Bright Data Collector 1 (${COLLECTORS.DATACENTERS}): https://aidatacenterindex.com/datacenters/`);
  
  let bdataFacilities = null;
  try {
    const bdataRaw = await runBrightDataCollector(COLLECTORS.DATACENTERS, 'https://aidatacenterindex.com/datacenters/');
    if (bdataRaw && bdataRaw.length > 0) {
      bdataFacilities = normalizeBrightDataFacilities(bdataRaw, COLLECTORS.DATACENTERS);
    }
  } catch (err) {
    logger.warn('BDATA', `Bright Data data centers collector fell back: ${err.message}`);
  }

  // 2. Electricity: Attempt live Bright Data Scraper Studio execution
  logger.info('SOURCE', `Connecting to Bright Data Collector 2 (${COLLECTORS.ELECTRICITY}): https://www.globalpetrolprices.com/electricity_prices/`);

  let bdataElectricity = null;
  try {
    const bdataElecRaw = await runBrightDataCollector(COLLECTORS.ELECTRICITY, 'https://www.globalpetrolprices.com/electricity_prices/');
    if (bdataElecRaw && bdataElecRaw.length > 0) {
      bdataElectricity = normalizeBrightDataElectricity(bdataElecRaw, COLLECTORS.ELECTRICITY);
    }
  } catch (err) {
    logger.warn('BDATA', `Bright Data electricity collector fell back: ${err.message}`);
  }

  // 3. Economics: Attempt live Bright Data Scraper Studio execution
  logger.info('SOURCE', `Connecting to Bright Data Collector 3 (${COLLECTORS.ECONOMICS}): https://www.numbeo.com/cost-of-living/prices_by_country.jsp`);

  let bdataEconomics = null;
  try {
    const bdataEconRaw = await runBrightDataCollector(COLLECTORS.ECONOMICS, 'https://www.numbeo.com/cost-of-living/prices_by_country.jsp');
    if (bdataEconRaw && bdataEconRaw.length > 0) {
      bdataEconomics = normalizeBrightDataEconomics(bdataEconRaw, COLLECTORS.ECONOMICS);
    }
  } catch (err) {
    logger.warn('BDATA', `Bright Data economics collector fell back: ${err.message}`);
  }

  // Run live multi-source web scrapers
  const { liveFacilities, liveGlobalElectricity, liveUSElectricity, liveEconomics } = await runLiveScrapers();

  // Load existing baseline facilities from cache
  let rawFacilities = [];
  try {
    const facPath = path.resolve('data/current/facilities.json');
    const rawFacText = await fs.readFile(facPath, 'utf-8');
    rawFacilities = JSON.parse(rawFacText);
  } catch {
    rawFacilities = [];
  }

  // Merge Bright Data scraped facilities
  if (bdataFacilities && bdataFacilities.length > 0) {
    for (const bFac of bdataFacilities) {
      const idx = rawFacilities.findIndex(f => f.facility_name.toLowerCase() === bFac.facility_name.toLowerCase());
      if (idx >= 0) {
        rawFacilities[idx] = { ...rawFacilities[idx], ...bFac };
      } else {
        rawFacilities.push(bFac);
      }
    }
  }

  // Merge live scraped facilities from aidatacenterindex.com
  if (liveFacilities && liveFacilities.length > 0) {
    for (const live of liveFacilities) {
      const existingIdx = rawFacilities.findIndex(f => f.facility_name.toLowerCase() === live.facility_name.toLowerCase());
      if (existingIdx >= 0) {
        rawFacilities[existingIdx] = { ...rawFacilities[existingIdx], ...live };
      } else {
        rawFacilities.push(live);
      }
    }
  }

  rawFacilities = rawFacilities.map(f => {
    if (!f.provenance || !f.provenance.source_url) {
      f.provenance = createProvenance({
        sourceName: f.source_name || 'aidatacenterindex.com',
        sourceUrl: f.source_url || 'https://aidatacenterindex.com/datacenters/',
        collectorId: COLLECTORS.DATACENTERS,
        retrievedAt: f.retrieved_at || new Date().toISOString()
      });
    }
    return f;
  });

  logger.success('INGEST', `Loaded ${rawFacilities.length} Data Center infrastructure facilities from aidatacenterindex.com (Collector ${COLLECTORS.DATACENTERS}).`);

  // Load and Merge Electricity Rates
  let rawElectricity = [];
  try {
    const elecPath = path.resolve('data/current/electricity.json');
    const rawElecText = await fs.readFile(elecPath, 'utf-8');
    rawElectricity = JSON.parse(rawElecText);
  } catch {
    rawElectricity = [];
  }

  // Merge Bright Data electricity records
  if (bdataElectricity && bdataElectricity.length > 0) {
    for (const bElec of bdataElectricity) {
      const existingIdx = rawElectricity.findIndex(e => e.country && e.country.toLowerCase() === bElec.country.toLowerCase());
      if (existingIdx >= 0) {
        rawElectricity[existingIdx] = { ...rawElectricity[existingIdx], ...bElec };
      } else {
        rawElectricity.push(bElec);
      }
    }
  }

  // Merge global electricity rates
  if (liveGlobalElectricity && liveGlobalElectricity.length > 0) {
    for (const live of liveGlobalElectricity) {
      const existing = rawElectricity.find(e => e.country && e.country.toLowerCase() === live.country.toLowerCase());
      if (existing) {
        existing.residential_rate_cents_kwh = live.residential_rate_cents_kwh;
        existing.source_name = live.source_name;
        existing.source_url = live.source_url;
        existing.retrieved_at = live.retrieved_at;
        existing.provenance = live.provenance;
      } else {
        rawElectricity.push(live);
      }
    }
  }

  // Merge US state electricity rates
  if (liveUSElectricity && liveUSElectricity.length > 0) {
    for (const live of liveUSElectricity) {
      const existing = rawElectricity.find(e => e.state && e.state.toLowerCase() === live.state.toLowerCase());
      if (existing) {
        existing.residential_rate_cents_kwh = live.residential_rate_cents_kwh;
        existing.source_name = live.source_name;
        existing.source_url = live.source_url;
        existing.retrieved_at = live.retrieved_at;
        existing.provenance = live.provenance;
      } else {
        rawElectricity.push(live);
      }
    }
  }

  rawElectricity = rawElectricity.map(e => {
    if (!e.provenance || !e.provenance.source_url) {
      e.provenance = createProvenance({
        sourceName: e.source_name || 'globalpetrolprices.com',
        sourceUrl: e.source_url || 'https://www.globalpetrolprices.com/electricity_prices/',
        collectorId: COLLECTORS.ELECTRICITY,
        retrievedAt: e.retrieved_at || new Date().toISOString()
      });
    }
    return e;
  });

  logger.success('INGEST', `Loaded ${rawElectricity.length} Utility Electricity Pricing records from globalpetrolprices.com / findenergy.com (Collector ${COLLECTORS.ELECTRICITY}).`);

  // Load and Merge Economics
  let rawEconomics = [];
  try {
    const econPath = path.resolve('data/current/economics.json');
    const rawEconText = await fs.readFile(econPath, 'utf-8');
    rawEconomics = JSON.parse(rawEconText);
  } catch {
    rawEconomics = [];
  }

  // Merge Bright Data economics records
  if (bdataEconomics && bdataEconomics.length > 0) {
    for (const bEcon of bdataEconomics) {
      const existingIdx = rawEconomics.findIndex(ec => ec.country && ec.country.toLowerCase() === bEcon.country.toLowerCase());
      if (existingIdx >= 0) {
        rawEconomics[existingIdx] = { ...rawEconomics[existingIdx], ...bEcon };
      } else {
        rawEconomics.push(bEcon);
      }
    }
  }

  // Merge live scraped economics records
  if (liveEconomics && liveEconomics.length > 0) {
    for (const live of liveEconomics) {
      const existing = rawEconomics.find(ec => ec.country && ec.country.toLowerCase() === live.country.toLowerCase());
      if (existing) {
        existing.median_household_income = live.median_household_income;
        existing.source_name = live.source_name;
        existing.source_url = live.source_url;
        existing.retrieved_at = live.retrieved_at;
        existing.provenance = live.provenance;
      } else {
        rawEconomics.push(live);
      }
    }
  }

  rawEconomics = rawEconomics.map(ec => {
    if (!ec.provenance || !ec.provenance.source_url) {
      ec.provenance = createProvenance({
        sourceName: ec.source_name || 'numbeo.com',
        sourceUrl: ec.source_url || 'https://www.numbeo.com/cost-of-living/prices_by_country.jsp',
        collectorId: COLLECTORS.ECONOMICS,
        retrievedAt: ec.retrieved_at || new Date().toISOString()
      });
    }
    return ec;
  });

  logger.success('INGEST', `Loaded ${rawEconomics.length} Community Economics records from numbeo.com / city-data.com (Collector ${COLLECTORS.ECONOMICS}).`);

  return {
    rawFacilities,
    rawElectricity,
    rawEconomics
  };
}
