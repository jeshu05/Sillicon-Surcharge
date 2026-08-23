import test from 'node:test';
import assert from 'node:assert/strict';
import { computeRateDeltas } from '../pipeline/historical_rates.js';

test('computeRateDeltas calculates authentic rate change percentage from snapshots', async () => {
  const electricityRecords = [
    {
      region: 'Virginia',
      country: 'United States',
      country_code: 'US',
      residential_rate_cents_kwh: 15.5,
      previous_rate_cents_kwh: null,
      rate_change_pct_12m: null
    }
  ];

  const mockHistory = {
    regions: {
      'us-va-loudoun': [
        { year: 2024, rate_cents_kwh: 13.0 },
        { year: 2025, rate_cents_kwh: 14.0 },
        { year: 2026, rate_cents_kwh: 15.5 }
      ]
    }
  };

  const results = await computeRateDeltas(electricityRecords, mockHistory);
  assert.equal(results.length, 1);
  assert.equal(results[0].previous_rate_cents_kwh, 14.0);
  assert.equal(results[0].rate_change_pct_12m, 10.7); // (15.5 - 14.0) / 14.0 * 100 = 10.71% -> 10.7%
  assert.equal(results[0].has_historical_baseline, true);
});

test('computeRateDeltas handles records without baseline gracefully', async () => {
  const electricityRecords = [
    {
      region: 'Unknown Region',
      country: 'Unknown',
      country_code: 'XX',
      residential_rate_cents_kwh: 20.0,
      previous_rate_cents_kwh: null,
      rate_change_pct_12m: null
    }
  ];

  const mockHistory = { regions: {} };
  const results = await computeRateDeltas(electricityRecords, mockHistory);

  assert.equal(results.length, 1);
  assert.equal(results[0].has_historical_baseline, false);
});
