import test from 'node:test';
import assert from 'node:assert/strict';
import { generateRepairDiagnosis, executeAutonomousHeal, loadHealLog } from '../pipeline/heal.js';

test('generateRepairDiagnosis outputs clear structured objective', () => {
  const diagnosis = generateRepairDiagnosis({
    collectorId: 'c_pd_electricity_02',
    domain: 'electricity',
    failedValidation: {
      total_records: 10,
      heal_diagnosis: {
        primary_broken_field: 'residential_rate_cents_kwh',
        failed_count: 8
      }
    },
    sampleRawPayload: []
  });

  assert.equal(diagnosis.collector_id, 'c_pd_electricity_02');
  assert.equal(diagnosis.affected_field, 'residential_rate_cents_kwh');
  assert.ok(diagnosis.repair_objective.includes('residential_rate_cents_kwh'));
});

test('executeAutonomousHeal heals broken records and logs event', async () => {
  const brokenElectricity = [
    { utility_name: 'Utility A', residential_rate_cents_kwh: null, provenance: { source_url: 'https://test.com' } },
    { utility_name: 'Utility B', residential_rate_cents_kwh: null, provenance: { source_url: 'https://test.com' } },
    { utility_name: 'Utility C', residential_rate_cents_kwh: 15.2, provenance: { source_url: 'https://test.com' } }
  ];

  const healRes = await executeAutonomousHeal({
    collectorId: 'c_mt5k0hcv20n2v7arut',
    domain: 'electricity',
    brokenRecords: brokenElectricity,
    repairProvider: async (broken) => broken.map(r => ({
      ...r,
      residential_rate_cents_kwh: r.residential_rate_cents_kwh || 16.4,
      provenance: { source_url: 'https://test.com', retrieved_at: new Date().toISOString() }
    }))
  });

  assert.equal(healRes.success, true);
  assert.equal(healRes.healEvent.repair_status, 'APPROVED');
  assert.equal(healRes.repairedRecords.every(r => r.residential_rate_cents_kwh > 0), true);

  const log = await loadHealLog();
  assert.ok(log.events.length > 0);
});
