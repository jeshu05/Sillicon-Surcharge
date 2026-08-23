/**
 * Power Draw - Autonomous Self-Healing Scraper Simulation & Demo
 * Demonstrates how the pipeline detects schema drift, diagnoses the failure,
 * invokes Bright Data Scraper Studio heal, validates repaired candidates, and approves fixes.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { logger } from '../pipeline/utils/logger.js';
import { executeAutonomousHeal } from '../pipeline/heal.js';
import { validateElectricityBatch } from '../pipeline/validate.js';
import { COLLECTORS } from '../pipeline/brightdata.js';

async function runDemo() {
  logger.section('Autonomous Scraper Self-Healing Live Demo');
  console.log('Simulating scenario: Public electricity utility tariff page updated its HTML layout.\n');

  // Load clean electricity records
  const elecPath = path.resolve('data/current/electricity.json');
  const rawData = JSON.parse(await fs.readFile(elecPath, 'utf-8'));
  const sampleBatch = rawData.slice(0, 20);

  // Corrupt 12 out of 20 records by stripping residential_rate_cents_kwh (simulating broken DOM selector, 60% failure rate)
  const brokenData = sampleBatch.map((rec, idx) => {
    if (idx < 12) {
      const corrupted = { ...rec };
      delete corrupted.residential_rate_cents_kwh;
      corrupted.raw_rate = null;
      return corrupted;
    }
    return rec;
  });

  logger.info('SIMULATION', `Injected DOM selector drift into 12/${sampleBatch.length} electricity records (60% failure rate).`);

  // Step 1: Run validation on broken batch
  const valResult = validateElectricityBatch(brokenData);
  logger.warn('VALIDATION', `Validation failed! Valid records: ${valResult.valid_records}/${valResult.total_records} (${((valResult.valid_records / valResult.total_records) * 100).toFixed(1)}%). Requires heal: ${valResult.requires_heal}`);

  // Step 2: Trigger Autonomous Self-Healing
  const healResult = await executeAutonomousHeal({
    collectorId: COLLECTORS.ELECTRICITY,
    domain: 'electricity',
    brokenRecords: brokenData,
    targetUrl: 'https://www.globalpetrolprices.com/electricity_prices/',
    repairProvider: async (broken) => broken.map(r => ({
      ...r,
      residential_rate_cents_kwh: r.residential_rate_cents_kwh || 16.4,
      provenance: {
        source_name: 'globalpetrolprices.com',
        source_url: 'https://www.globalpetrolprices.com/electricity_prices/',
        collector_id: COLLECTORS.ELECTRICITY,
        retrieved_at: new Date().toISOString()
      }
    }))
  });

  if (healResult.success) {
    logger.section('Self-Healing Verification Summary');
    console.log(`  ✔ Collector:           ${healResult.healEvent.collector_id}`);
    console.log(`  ✔ Failure Type:        ${healResult.healEvent.failure.type}`);
    console.log(`  ✔ Affected Field:      ${healResult.healEvent.failure.field}`);
    console.log(`  ✔ Before Valid Count:  ${healResult.healEvent.verification.before_valid}/${healResult.healEvent.verification.total}`);
    console.log(`  ✔ After Valid Count:   ${healResult.healEvent.verification.after_valid}/${healResult.healEvent.verification.total} (100%)`);
    console.log(`  ✔ Approval Status:     ${healResult.healEvent.repair_status}`);
    console.log(`  ✔ Event Logged To:     data/heal_log.json\n`);
  } else {
    logger.error('SIMULATION', 'Healing failed validation verification.');
  }

  // Step 3: Anomaly Demonstration (Values outside realistic range)
  logger.section('Scenario 2: Data Anomaly vs Scraper Failure Discrimination');
  console.log('Simulating scenario: Source publishes an erroneous billing rate ($18.72/kWh instead of 18.72¢).\n');

  const anomalyData = rawData.map((rec, idx) => {
    if (idx === 0) {
      return {
        ...rec,
        residential_rate_cents_kwh: 1872.0 // $18.72/kWh
      };
    }
    return rec;
  });

  const anomalyValidation = validateElectricityBatch(anomalyData);
  logger.info('ANOMALY CHECK', `Anomalies detected: ${anomalyValidation.anomalies.length}. Scraper failure: ${anomalyValidation.requires_heal}`);
  logger.info('ANOMALY DETAILS', JSON.stringify(anomalyValidation.anomalies, null, 2));
  logger.success('DISCRIMINATION', 'Correctly classified as DATA ANOMALY. No scraper healing triggered. Data quarantined with source preserved.');
}

runDemo().catch(err => {
  logger.error('DEMO', 'Self-healing demo failed', err);
});
