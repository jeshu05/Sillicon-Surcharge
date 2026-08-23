import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateDataCenterBatch,
  validateElectricityBatch,
  validateEconomicsBatch
} from '../pipeline/validate.js';

test('validateDataCenterBatch detects broken records and requests heal', () => {
  const validRecord = {
    facility_id: 'fc_1',
    facility_name: 'Alpha DC',
    country: 'US',
    country_code: 'US',
    region: 'VA',
    capacity_mw: 500,
    status: 'planned',
    provenance: { source_url: 'https://example.com' }
  };

  const brokenRecord = {
    facility_id: 'fc_2',
    facility_name: null,
    capacity_mw: null,
    status: null
  };

  const batch = [validRecord, brokenRecord, brokenRecord];
  const res = validateDataCenterBatch(batch);

  assert.equal(res.valid_records, 1);
  assert.equal(res.failures.length, 2);
  assert.equal(res.requires_heal, true);
  assert.ok(res.heal_diagnosis !== null);
});

test('validateElectricityBatch flags anomalies without requesting scraper heal', () => {
  const anomalyRecord = {
    utility_id: 'ut_1',
    utility_name: 'Test Electric',
    residential_rate_cents_kwh: 500.0, // $5.00/kWh -> Impossible anomaly
    provenance: { source_url: 'https://example.com' }
  };

  const res = validateElectricityBatch([anomalyRecord]);
  assert.equal(res.anomalies.length, 1);
  assert.equal(res.requires_heal, false);
});
