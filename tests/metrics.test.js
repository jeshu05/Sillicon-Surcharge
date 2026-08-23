import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateRatePressureRatio,
  calculateRatePressureScore,
  calculateAiLoadMetrics,
  calculateBurdenMetrics,
  computePowerPressureScore,
  computeConfidenceScore,
  generateWhyFlaggedNarrative
} from '../pipeline/metrics.js';

test('calculateRatePressureRatio divides rate growth by income growth safely', () => {
  // Electricity +12%, Income +4% -> RP = 3.0x
  assert.equal(calculateRatePressureRatio(12.0, 4.0), 3.0);

  // Electricity +11.8%, Income +3.4% -> RP = 3.47x
  assert.equal(calculateRatePressureRatio(11.8, 3.4), 3.47);

  // Near zero income growth protects against divide-by-zero
  assert.ok(calculateRatePressureRatio(10.0, 0.0) > 0);
});

test('calculateAiLoadMetrics computes weighted capacity accurately', () => {
  const facilities = [
    { capacity_mw: 500, status: 'planned' },
    { capacity_mw: 400, status: 'under_construction' },
    { capacity_mw: 200, status: 'operational' }
  ];

  const metrics = calculateAiLoadMetrics(facilities);
  assert.equal(metrics.planned_mw, 500);
  assert.equal(metrics.under_construction_mw, 400);
  assert.equal(metrics.operational_mw, 200);
  assert.equal(metrics.total_tracked_mw, 1100);
  assert.ok(metrics.ai_load_score >= 10 && metrics.ai_load_score <= 100);
});

test('calculateBurdenMetrics computes annual cost and delta', () => {
  // 15 cents/kWh on 10,000 kWh = $1500 / $60,000 income = 2.5%
  const burden = calculateBurdenMetrics(15.0, 13.0, 60000, 10000);
  assert.equal(burden.annual_cost, 1500);
  assert.equal(burden.burden_pct, 2.5);
  assert.ok(burden.burden_change_pct > 0);
});

test('computePowerPressureScore adheres to calibrated tier boundaries', () => {
  const highPressure = computePowerPressureScore({
    ratePressureScore: 90,
    aiLoadScore: 85,
    burdenScore: 80
  });
  assert.ok(highPressure.score >= 80);
  assert.equal(highPressure.tier, 'CRITICAL');

  const lowPressure = computePowerPressureScore({
    ratePressureScore: 20,
    aiLoadScore: 20,
    burdenScore: 20
  });
  assert.ok(lowPressure.score < 30);
  assert.equal(lowPressure.tier, 'STABLE');
});

test('computeConfidenceScore returns HIGH for complete fresh multi-source data', () => {
  const conf = computeConfidenceScore({
    hasAllFields: true,
    geoMatchConfidence: 0.97,
    freshnessDays: 1,
    verifiedSourcesCount: 3
  });
  assert.ok(conf.score >= 85);
  assert.equal(conf.label, 'HIGH');
});

test('generateWhyFlaggedNarrative creates 5 explainability points', () => {
  const narrative = generateWhyFlaggedNarrative({
    regionName: 'Loudoun County, VA',
    aiLoad: { total_tracked_mw: 2800, planned_mw: 1500, under_construction_mw: 1300 },
    rateChangePct: 11.8,
    incomeGrowthPct: 3.4,
    ratePressureRatio: 3.47,
    tier: 'CRITICAL',
    confidenceLabel: 'HIGH'
  });

  assert.equal(narrative.length, 5);
  assert.ok(narrative[0].includes('2,800 MW'));
  assert.ok(narrative[1].includes('+11.8%'));
  assert.ok(narrative[3].includes('3.47×'));
});
