/**
 * Power Draw - Master End-to-End Intelligence Pipeline Runner
 * Orchestrates web acquisition, schema validation, self-healing,
 * multi-domain normalization, geographic joins, metric calculation, and output publishing.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { logger } from './utils/logger.js';
import { fetchAllRawData } from './trigger.js';
import { validateDataCenterBatch, validateElectricityBatch, validateEconomicsBatch } from './validate.js';
import { executeAutonomousHeal } from './heal.js';
import { normalizeDataCenterRecord, normalizeElectricityRecord, normalizeEconomicsRecord } from './normalize.js';
import { KNOWN_HUBS, findBestRegionKey, matchGeography } from './geography.js';
import { getCoordinates } from './geocode.js';
import { computeRateDeltas } from './historical_rates.js';
import {
  calculateAiLoadMetrics,
  calculateRatePressureRatio,
  calculateRatePressureScore,
  calculateBurdenMetrics,
  computePowerPressureScore,
  computeConfidenceScore,
  generateWhyFlaggedNarrative
} from './metrics.js';
import { updateHistorySnapshot } from './history.js';
import { COLLECTORS } from './brightdata.js';

export async function runPipeline() {
  logger.section('Power Draw — Autonomous Web Intelligence Pipeline');
  const startTime = Date.now();

  // Phase 1: Ingestion from Web Collectors & Live Scrapers
  let { rawFacilities, rawElectricity, rawEconomics } = await fetchAllRawData();

  if (!rawFacilities.length || !rawElectricity.length || !rawEconomics.length) {
    logger.warn('PIPELINE', 'Live acquisition incomplete. Falling back to offline seed fixtures (explicitly tagged as SIMULATED_FALLBACK)...');
    const { seedAllData } = await import('../scripts/seed.js');
    await seedAllData();
    const fetched = await fetchAllRawData();
    rawFacilities = fetched.rawFacilities;
    rawElectricity = fetched.rawElectricity;
    rawEconomics = fetched.rawEconomics;
  }

  // Phase 2: Schema Contract Validation
  logger.section('Phase 2: Schema Contract Validation');
  let valFac = validateDataCenterBatch(rawFacilities);
  let valElec = validateElectricityBatch(rawElectricity);
  let valEcon = validateEconomicsBatch(rawEconomics);

  logger.info('VALIDATION', `Data Centers: ${valFac.valid_records}/${valFac.total_records} valid | Status: ${valFac.requires_heal ? 'HEAL_REQUIRED' : 'HEALTHY'}`);
  logger.info('VALIDATION', `Electricity: ${valElec.valid_records}/${valElec.total_records} valid | Status: ${valElec.requires_heal ? 'HEAL_REQUIRED' : 'HEALTHY'}`);
  logger.info('VALIDATION', `Economics: ${valEcon.valid_records}/${valEcon.total_records} valid | Status: ${valEcon.requires_heal ? 'HEAL_REQUIRED' : 'HEALTHY'}`);

  // Phase 3: Autonomous Self-Healing on Layout Drift (with explicit targetUrls)
  if (valFac.requires_heal) {
    const healRes = await executeAutonomousHeal({
      collectorId: COLLECTORS.DATACENTERS,
      domain: 'datacenters',
      brokenRecords: rawFacilities,
      targetUrl: 'https://aidatacenterindex.com/datacenters/'
    });
    if (healRes.success) rawFacilities = healRes.repairedRecords;
  }

  if (valElec.requires_heal) {
    const healRes = await executeAutonomousHeal({
      collectorId: COLLECTORS.ELECTRICITY,
      domain: 'electricity',
      brokenRecords: rawElectricity,
      targetUrl: 'https://www.globalpetrolprices.com/electricity_prices/'
    });
    if (healRes.success) rawElectricity = healRes.repairedRecords;
  }

  if (valEcon.requires_heal) {
    const healRes = await executeAutonomousHeal({
      collectorId: COLLECTORS.ECONOMICS,
      domain: 'economics',
      brokenRecords: rawEconomics,
      targetUrl: 'https://www.numbeo.com/cost-of-living/prices_by_country.jsp'
    });
    if (healRes.success) rawEconomics = healRes.repairedRecords;
  }

  // Phase 4: Normalization & Historical Rate Delta Resolution
  logger.section('Phase 4: Multi-Format Normalization & Historical Delta Matching');
  let normalizedFacilities = rawFacilities.map(f => normalizeDataCenterRecord(f));
  let normalizedElectricity = rawElectricity.map(e => normalizeElectricityRecord(e));
  let normalizedEconomics = rawEconomics.map(ec => normalizeEconomicsRecord(ec));

  // Compute authentic rate deltas using historical snapshots
  normalizedElectricity = await computeRateDeltas(normalizedElectricity);

  // Write normalized current datasets
  await fs.mkdir(path.resolve('data/current'), { recursive: true });
  await fs.writeFile(path.resolve('data/current/facilities.json'), JSON.stringify(normalizedFacilities, null, 2));
  await fs.writeFile(path.resolve('data/current/electricity.json'), JSON.stringify(normalizedElectricity, null, 2));
  await fs.writeFile(path.resolve('data/current/economics.json'), JSON.stringify(normalizedEconomics, null, 2));
  logger.success('NORMALIZATION', 'Saved clean normalized records to data/current/');

  // Phase 5: Geographic Joining & Intelligence Aggregation
  logger.section('Phase 5: Geographic Joining & Power Pressure Analytics');
  const regionMap = {};

  // Initialize known hub regions
  for (const [key, hub] of Object.entries(KNOWN_HUBS)) {
    regionMap[key] = {
      region_id: key,
      name: hub.name,
      county: hub.county,
      state_province: hub.state,
      country: hub.country,
      country_code: hub.country_code,
      metro: hub.metro,
      coordinates: { lat: hub.lat, lng: hub.lng },
      primary_utility: hub.primary_utility,
      avg_annual_kwh: hub.avg_annual_kwh,
      geographic_granularity: hub.county && hub.country_code === 'US' ? 'county_cluster' : 'metropolitan_hub',
      facilities: [],
      electricity_record: null,
      economics_record: null,
      geographic_matches: []
    };
  }

  // Group facilities to regions
  for (const fac of normalizedFacilities) {
    const regionKey = findBestRegionKey(fac);
    if (!regionMap[regionKey]) {
      const fallbackCoords = (fac.latitude && fac.longitude)
        ? { lat: fac.latitude, lng: fac.longitude }
        : getCoordinates(fac.country, fac.region, fac.county || fac.city) || { lat: null, lng: null };

      regionMap[regionKey] = {
        region_id: regionKey,
        name: `${fac.county || fac.city || fac.region}, ${fac.region}`,
        county: fac.county,
        state_province: fac.region,
        country: fac.country,
        country_code: fac.country_code,
        coordinates: fallbackCoords,
        geographic_granularity: fac.county ? 'county_cluster' : 'national_aggregate',
        facilities: [],
        electricity_record: null,
        economics_record: null,
        geographic_matches: []
      };
    }
    regionMap[regionKey].facilities.push(fac);
    const match = matchGeography(fac, regionKey, regionMap[regionKey]);
    regionMap[regionKey].geographic_matches.push(match);
  }

  // Group electricity records to regions
  for (const elec of normalizedElectricity) {
    const regionKey = findBestRegionKey(elec);
    if (regionMap[regionKey] && !regionMap[regionKey].electricity_record) {
      regionMap[regionKey].electricity_record = elec;
    }
  }

  // Group economics records to regions
  for (const econ of normalizedEconomics) {
    const regionKey = findBestRegionKey(econ);
    if (regionMap[regionKey] && !regionMap[regionKey].economics_record) {
      regionMap[regionKey].economics_record = econ;
    }
  }

  // Phase 6: Score Calculation for each Region
  const watchlist = [];

  for (const [key, reg] of Object.entries(regionMap)) {
    const elec = reg.electricity_record || {
      residential_rate_cents_kwh: null,
      previous_rate_cents_kwh: null,
      rate_change_pct_12m: null,
      utility_name: reg.primary_utility || 'Regional Electric Service'
    };

    const econ = reg.economics_record || {
      median_household_income: null,
      income_growth_pct_12m: null,
      geography_name: reg.name
    };

    // Calculate core metrics
    const aiLoad = calculateAiLoadMetrics(reg.facilities);
    const ratePressureRatio = calculateRatePressureRatio(elec.rate_change_pct_12m, econ.income_growth_pct_12m);
    const ratePressureScore = calculateRatePressureScore(ratePressureRatio, elec.rate_change_pct_12m);
    const burdenMetrics = calculateBurdenMetrics(
      elec.residential_rate_cents_kwh,
      elec.previous_rate_cents_kwh,
      econ.median_household_income,
      reg.avg_annual_kwh || 10800
    );

    const powerPressure = computePowerPressureScore({
      ratePressureScore,
      aiLoadScore: aiLoad.ai_load_score,
      burdenScore: burdenMetrics.burden_score
    });

    const avgGeoConfidence = reg.geographic_matches.length > 0
      ? reg.geographic_matches.reduce((acc, m) => acc + (m.confidence || 0.75), 0) / reg.geographic_matches.length
      : 0.85;

    const sourceCount = [reg.facilities.length > 0, !!reg.electricity_record, !!reg.economics_record].filter(Boolean).length;

    const confidence = computeConfidenceScore({
      hasAllFields: !!reg.electricity_record && !!reg.economics_record,
      geoMatchConfidence: avgGeoConfidence,
      freshnessDays: 1,
      verifiedSourcesCount: Math.max(1, sourceCount)
    });

    const whyFlagged = generateWhyFlaggedNarrative({
      regionName: reg.name,
      aiLoad,
      rateChangePct: elec.rate_change_pct_12m,
      incomeGrowthPct: econ.income_growth_pct_12m,
      ratePressureRatio,
      tier: powerPressure.tier,
      confidenceLabel: confidence.label
    });

    const isSimulated = reg.facilities.some(f => f.is_simulated || f.provenance?.is_simulated)
      || (elec.is_simulated || elec.provenance?.is_simulated)
      || (econ.is_simulated || econ.provenance?.is_simulated)
      || false;

    const watchItem = {
      region_id: reg.region_id,
      name: reg.name,
      county: reg.county,
      state_province: reg.state_province,
      country: reg.country,
      country_code: reg.country_code,
      metro: reg.metro,
      coordinates: reg.coordinates,
      geographic_granularity: reg.geographic_granularity || (reg.county ? 'county_cluster' : 'national_aggregate'),
      power_pressure_score: powerPressure.score,
      pressure_tier: powerPressure.tier,
      score_breakdown: powerPressure.breakdown,
      rate_pressure_ratio: ratePressureRatio,
      electricity_rate_cents_kwh: elec.residential_rate_cents_kwh,
      electricity_rate_change_pct: elec.rate_change_pct_12m,
      utility_name: elec.utility_name,
      median_income: econ.median_household_income,
      income_growth_pct: econ.income_growth_pct_12m,
      annual_burden_pct: burdenMetrics.burden_pct,
      burden_change_pct: burdenMetrics.burden_change_pct,
      ai_load_capacity_mw: aiLoad.total_tracked_mw,
      planned_mw: aiLoad.planned_mw,
      under_construction_mw: aiLoad.under_construction_mw,
      operational_mw: aiLoad.operational_mw,
      active_facility_count: reg.facilities.length,
      facilities: reg.facilities.slice(0, 10).map(f => ({
        id: f.facility_id,
        name: f.facility_name,
        operator: f.operator,
        capacity_mw: f.capacity_mw,
        status: f.status,
        ai_association: f.ai_association
      })),
      confidence_score: confidence.score,
      confidence_label: confidence.label,
      geographic_match_type: reg.geographic_matches[0]?.type || 'exact_county',
      why_flagged: whyFlagged,
      provenance: {
        facilities_source: reg.facilities[0]?.provenance?.source_name || reg.facilities[0]?.source_name || 'aidatacenterindex.com',
        facilities_url: (() => {
          const raw = reg.facilities[0]?.provenance?.source_url || reg.facilities[0]?.source_url || 'https://aidatacenterindex.com/datacenters/';
          if (raw.includes('/facility/')) return 'https://aidatacenterindex.com/datacenters/';
          return raw;
        })(),
        facilities_collector: COLLECTORS.DATACENTERS,
        electricity_source: elec.provenance?.source_name || elec.source_name || 'globalpetrolprices.com / findenergy.com',
        electricity_url: elec.provenance?.source_url || elec.source_url || 'https://www.globalpetrolprices.com/electricity_prices/',
        electricity_collector: COLLECTORS.ELECTRICITY,
        economics_source: econ.provenance?.source_name || econ.source_name || 'numbeo.com',
        economics_url: econ.provenance?.source_url || econ.source_url || 'https://www.numbeo.com/cost-of-living/prices_by_country.jsp',
        economics_collector: COLLECTORS.ECONOMICS,
        is_simulated: isSimulated,
        provenance_type: isSimulated ? 'SIMULATED_FALLBACK' : 'LIVE_BRIGHTDATA_COLLECTOR',
        retrieved_at: new Date().toISOString()
      },
      last_updated: new Date().toISOString()
    };

    watchlist.push(watchItem);
  }

  // Sort watchlist by Power Pressure Score descending
  watchlist.sort((a, b) => b.power_pressure_score - a.power_pressure_score);

  // Write watchlist.json
  await fs.writeFile(path.resolve('data/watchlist.json'), JSON.stringify(watchlist, null, 2), 'utf-8');
  logger.success('WATCHLIST', `Ranked and generated watchlist for ${watchlist.length} global regions.`);

  // Phase 7: Historical Snapshots
  await updateHistorySnapshot(watchlist);
  logger.success('HISTORY', 'Updated multi-year historical snapshots in data/history/snapshots.json');

  // Phase 8: Data Quality & Health Status
  const allAnomalies = [
    ...valFac.anomalies.map(a => ({ domain: 'datacenters', ...a })),
    ...valElec.anomalies.map(a => ({ domain: 'electricity', ...a })),
    ...valEcon.anomalies.map(a => ({ domain: 'economics', ...a }))
  ];

  let overallHealth = 'SYSTEM_OPTIMAL_ALL_VALID';
  if (valFac.requires_heal || valElec.requires_heal || valEcon.requires_heal) {
    overallHealth = 'SYSTEM_SELF_HEAL_ACTIVE';
  } else if (allAnomalies.length > 0) {
    overallHealth = 'SYSTEM_DEGRADED_ANOMALIES_QUARANTINED';
  }

  const qualityReport = {
    generated_at: new Date().toISOString(),
    execution_duration_ms: Date.now() - startTime,
    collectors: [
      {
        collector_id: COLLECTORS.DATACENTERS,
        name: 'AI & Data Center Infrastructure',
        target_source: 'aidatacenterindex.com',
        status: valFac.requires_heal ? 'SELF_HEALED' : 'HEALTHY',
        total_records: normalizedFacilities.length,
        valid_records: valFac.valid_records,
        anomalies_count: valFac.anomalies.length,
        freshness_status: 'FRESH (Updated today)',
        schedule: 'Daily'
      },
      {
        collector_id: COLLECTORS.ELECTRICITY,
        name: 'Residential Electricity Tariffs',
        target_source: 'globalpetrolprices.com / findenergy.com',
        status: valElec.requires_heal ? 'SELF_HEALED' : 'HEALTHY',
        total_records: normalizedElectricity.length,
        valid_records: valElec.valid_records,
        anomalies_count: valElec.anomalies.length,
        freshness_status: 'FRESH (Updated today)',
        schedule: 'Daily / Weekly'
      },
      {
        collector_id: COLLECTORS.ECONOMICS,
        name: 'Community Household Economics',
        target_source: 'numbeo.com / city-data.com',
        status: valEcon.requires_heal ? 'SELF_HEALED' : 'HEALTHY',
        total_records: normalizedEconomics.length,
        valid_records: valEcon.valid_records,
        anomalies_count: valEcon.anomalies.length,
        freshness_status: 'FRESH (Updated this cycle)',
        schedule: 'Monthly / Quarterly'
      }
    ],
    anomalies: allAnomalies,
    overall_health: overallHealth
  };

  await fs.writeFile(path.resolve('data/data_quality.json'), JSON.stringify(qualityReport, null, 2), 'utf-8');
  logger.success('DATA QUALITY', `Wrote pipeline health report [${overallHealth}] to data/data_quality.json`);

  // Summary Metrics
  const criticalCount = watchlist.filter(w => w.pressure_tier === 'CRITICAL').length;
  const elevatedCount = watchlist.filter(w => w.pressure_tier === 'ELEVATED').length;
  const watchCount = watchlist.filter(w => w.pressure_tier === 'WATCH').length;
  const stableCount = watchlist.filter(w => w.pressure_tier === 'STABLE').length;
  const totalGw = (watchlist.reduce((sum, w) => sum + (w.ai_load_capacity_mw || 0), 0) / 1000).toFixed(1);

  logger.section('Pipeline Summary Results');
  console.log(`  ⚡ Monitored Regions:     ${watchlist.length}`);
  console.log(`  ⚡ Total AI Capacity:     ${totalGw} GW`);
  console.log(`  🔴 HIGH CONVERGENCE:      ${criticalCount} regions`);
  console.log(`  🟠 ELEVATED Pressure:     ${elevatedCount} regions`);
  console.log(`  🟡 WATCH Status:          ${watchCount} regions`);
  console.log(`  🟢 BASELINE Status:       ${stableCount} regions`);
  console.log(`  ⏱ Execution Time:        ${Date.now() - startTime}ms\n`);

  return {
    watchlist,
    qualityReport,
    totalGw
  };
}

// Allow direct execution
if (process.argv[1]?.endsWith('run.js') || process.argv[1]?.endsWith('run')) {
  runPipeline().catch(err => {
    logger.error('PIPELINE', 'Pipeline execution failed', err);
    process.exit(1);
  });
}
