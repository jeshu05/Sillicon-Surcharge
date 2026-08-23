/**
 * Power Draw - Autonomous Scraper Self-Healing Engine
 * Interfaces directly with Bright Data Scraper Studio CLI (`bdata scraper heal` & `bdata scraper approve`)
 * to automatically repair drifted collectors, verify candidate outputs against schema contracts, and approve fixes in place.
 *
 * Adheres strictly to METHODOLOGY.md Section 7 (98% valid record threshold, same collector ID preservation).
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { logger } from './utils/logger.js';
import { validateDataCenterBatch, validateElectricityBatch, validateEconomicsBatch } from './validate.js';
import { runBrightDataCollector } from './brightdata.js';

const execAsync = promisify(exec);
const HEAL_LOG_PATH = path.resolve('data/heal_log.json');

/**
 * Loads existing heal log or initializes a clean one
 */
export async function loadHealLog() {
  try {
    const content = await fs.readFile(HEAL_LOG_PATH, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {
      summary: {
        total_runs: 0,
        successful_heals: 0,
        failed_heals: 0,
        manual_interventions: 0,
        last_heal_timestamp: null
      },
      events: []
    };
  }
}

/**
 * Appends a verified healing event to heal_log.json
 */
export async function recordHealEvent(event) {
  const log = await loadHealLog();
  log.events.unshift(event);
  log.summary.total_runs++;
  if (event.repair_status === 'APPROVED') {
    log.summary.successful_heals++;
    log.summary.last_heal_timestamp = event.timestamp;
  } else {
    log.summary.failed_heals++;
  }

  await fs.mkdir(path.dirname(HEAL_LOG_PATH), { recursive: true });
  await fs.writeFile(HEAL_LOG_PATH, JSON.stringify(log, null, 2), 'utf-8');
  return log;
}

/**
 * Analyzes failure and generates targeted AI repair instructions for Bright Data Scraper Studio
 */
export function generateRepairDiagnosis({ collectorId, domain, failedValidation, sampleRawPayload }) {
  const missingField = failedValidation.heal_diagnosis?.primary_broken_field || 'schema_contract';
  const missingCount = failedValidation.heal_diagnosis?.failed_count || 0;
  const totalCount = failedValidation.total_records || 1;

  const diagnosis = {
    event_id: `heal_${Date.now()}`,
    collector_id: collectorId,
    domain,
    timestamp: new Date().toISOString(),
    failure_type: 'SCHEMA_DRIFT_SELECTOR_CHANGED',
    affected_field: missingField,
    affected_records_count: missingCount,
    total_records_count: totalCount,
    root_cause: `Public source DOM layout updated; extractor for '${missingField}' returned null/invalid across ${missingCount}/${totalCount} records.`,
    repair_objective: `Update DOM extraction selector for '${missingField}' while strictly preserving the existing output JSON schema contract. Ensure null safety and clean numeric parsing.`,
    cli_command: `npx -y -p @brightdata/cli bdata scraper heal ${collectorId} "Update selector for ${missingField} while preserving JSON schema contract"`
  };

  return diagnosis;
}

/**
 * Executes the Bright Data Scraper Heal workflow:
 * 1. Diagnoses schema drift
 * 2. Invokes Bright Data Scraper Studio heal (`bdata scraper heal`)
 * 3. Evaluates repaired candidate output against strict schema validator (≥ 98% per METHODOLOGY.md)
 * 4. Approves repair (`bdata scraper approve`) if validation passes
 */
export async function executeAutonomousHeal({
  collectorId,
  domain,
  brokenRecords,
  targetUrl = null,
  repairProvider = null
}) {
  logger.section(`Autonomous Scraper Self-Healing: ${collectorId}`);
  logger.warn('SELF-HEAL', `Collector ${collectorId} [${domain}] failed validation contract. Initiating repair cycle...`);

  // Step 1: Pre-validation evaluation
  let initialValidation;
  if (domain === 'datacenters') initialValidation = validateDataCenterBatch(brokenRecords);
  else if (domain === 'electricity') initialValidation = validateElectricityBatch(brokenRecords);
  else initialValidation = validateEconomicsBatch(brokenRecords);

  const diagnosis = generateRepairDiagnosis({
    collectorId,
    domain,
    failedValidation: initialValidation,
    sampleRawPayload: brokenRecords.slice(0, 3)
  });

  logger.info('DIAGNOSIS', `Field [${diagnosis.affected_field}] broken across ${diagnosis.affected_records_count}/${diagnosis.total_records_count} records.`);
  logger.info('OBJECTIVE', diagnosis.repair_objective);

  // Step 2: Invoke Bright Data Scraper Studio Heal
  logger.info('BRIGHT DATA', `Invoking Scraper Studio Heal engine for collector ${collectorId}...`);

  // Derive targetUrl if not explicitly provided
  let effectiveTargetUrl = targetUrl;
  if (!effectiveTargetUrl && brokenRecords.length > 0) {
    effectiveTargetUrl = brokenRecords[0]?.provenance?.source_url || brokenRecords[0]?.source_url;
  }
  if (!effectiveTargetUrl) {
    if (domain === 'datacenters') effectiveTargetUrl = 'https://aidatacenterindex.com/datacenters/';
    else if (domain === 'electricity') effectiveTargetUrl = 'https://www.globalpetrolprices.com/electricity_prices/';
    else effectiveTargetUrl = 'https://www.numbeo.com/cost-of-living/prices_by_country.jsp';
  }

  let repairedRecords = [];
  let cliExecuted = false;
  let healCommandSuccess = false;

  // If a custom repair provider is supplied (e.g., in testing/simulation)
  if (typeof repairProvider === 'function') {
    repairedRecords = await repairProvider(brokenRecords, diagnosis);
    cliExecuted = true;
    healCommandSuccess = true;
  } else {
    // Attempt real Bright Data CLI heal execution
    try {
      const urlArg = effectiveTargetUrl ? `--url "${effectiveTargetUrl}"` : '';
      const healCmd = `npx -y -p @brightdata/cli bdata scraper heal ${collectorId} "${diagnosis.repair_objective}" ${urlArg} --json`;
      logger.info('BDATA-HEAL', `Executing: ${healCmd}`);

      const { stdout } = await execAsync(healCmd, { maxBuffer: 10 * 1024 * 1024, timeout: 600000 });
      if (stdout) {
        logger.info('BDATA-HEAL', `Heal response received from Bright Data.`);
        cliExecuted = true;

        // Re-run scraper to fetch candidate output for verification
        if (effectiveTargetUrl) {
          const previewRecords = await runBrightDataCollector(collectorId, effectiveTargetUrl);
          if (previewRecords && previewRecords.length > 0) {
            repairedRecords = previewRecords;
            healCommandSuccess = true;
          }
        }
      }
    } catch (cliErr) {
      logger.warn('BDATA-HEAL-WARN', `Bright Data CLI heal command: ${cliErr.message}`);
    }
  }

  // Step 3: Strict Pre-Approval Verification
  logger.info('VERIFICATION', `Testing candidate output against strict schema contract...`);

  let isApproved = false;
  let postValidation = {
    valid_records: 0,
    total_records: brokenRecords.length,
    anomalies: [],
    requires_heal: true
  };

  if (repairedRecords.length > 0) {
    if (domain === 'datacenters') postValidation = validateDataCenterBatch(repairedRecords);
    else if (domain === 'electricity') postValidation = validateElectricityBatch(repairedRecords);
    else postValidation = validateEconomicsBatch(repairedRecords);

    const validPct = (postValidation.valid_records / Math.max(1, postValidation.total_records)) * 100;
    // Strict requirement per METHODOLOGY.md Section 7: >= 98% valid and 0 anomalies
    isApproved = validPct >= 98 && postValidation.anomalies.length === 0;

    logger.info('VERIFICATION RESULTS', `Valid Records: ${postValidation.valid_records}/${postValidation.total_records} (${validPct.toFixed(1)}%) | Anomalies: ${postValidation.anomalies.length}`);
  } else {
    logger.warn('VERIFICATION', `No candidate repaired records available from heal run. Quarantining broken records.`);
  }

  // Step 4: Approve or Reject via CLI
  if (isApproved && cliExecuted) {
    try {
      const approveCmd = `npx -y -p @brightdata/cli bdata scraper approve ${collectorId} --json`;
      logger.info('BDATA-APPROVE', `Executing: ${approveCmd}`);
      await execAsync(approveCmd, { timeout: 120000 });
      logger.success('APPROVE', `Repair verified & approved on collector ${collectorId}.`);
    } catch (apprErr) {
      logger.warn('BDATA-APPROVE-WARN', `Approval command notice: ${apprErr.message}`);
    }
  } else if (!isApproved) {
    logger.error('REJECT', `Repaired collector did not meet strict contract verification threshold (≥ 98%). Retaining quarantine.`);
  }

  // Step 5: Record Event in Audit Log
  const validRecordsCount = postValidation.valid_records;
  const totalRecordsCount = postValidation.total_records;
  const passRate = totalRecordsCount > 0 ? Math.round((validRecordsCount / totalRecordsCount) * 100) : 0;

  const healEvent = {
    event_id: diagnosis.event_id,
    timestamp: diagnosis.timestamp,
    collector_id: collectorId,
    domain,
    failure: {
      type: diagnosis.failure_type,
      field: diagnosis.affected_field,
      affected_records: diagnosis.affected_records_count,
      total_records: diagnosis.total_records_count
    },
    repair: {
      objective: diagnosis.repair_objective,
      status: isApproved ? 'APPROVED' : 'REJECTED',
      method: cliExecuted ? 'BRIGHT_DATA_CLI_HEAL' : 'EXTERNAL_HEAL_REQUEST'
    },
    verification: {
      before_valid: initialValidation.valid_records,
      after_valid: validRecordsCount,
      total: totalRecordsCount,
      pass_rate_pct: passRate,
      anomalies_count: postValidation.anomalies.length
    },
    repair_status: isApproved ? 'APPROVED' : 'REJECTED'
  };

  await recordHealEvent(healEvent);

  return {
    success: isApproved,
    healEvent,
    repairedRecords: isApproved ? repairedRecords : brokenRecords
  };
}
