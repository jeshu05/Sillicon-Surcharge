import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeCapacityMW,
  normalizeElectricityRateCentsKwh,
  normalizeIncome,
  normalizePercentage,
  normalizeStatus,
  normalizeAiAssociation
} from '../pipeline/normalize.js';

test('normalizeCapacityMW handles various noisy unit formats', () => {
  assert.equal(normalizeCapacityMW('500 MW'), 500);
  assert.equal(normalizeCapacityMW('500MW'), 500);
  assert.equal(normalizeCapacityMW('0.5 GW'), 500);
  assert.equal(normalizeCapacityMW('1.2 Gigawatts'), 1200);
  assert.equal(normalizeCapacityMW('750 megawatts'), 750);
  assert.equal(normalizeCapacityMW('300,000 kW'), 300);
  assert.equal(normalizeCapacityMW(850), 850);
  assert.equal(normalizeCapacityMW(null), null);
  assert.equal(normalizeCapacityMW('invalid'), null);
});

test('normalizeElectricityRateCentsKwh handles rate variations', () => {
  assert.equal(normalizeElectricityRateCentsKwh('$0.158/kWh'), 15.8);
  assert.equal(normalizeElectricityRateCentsKwh('15.8 cents/kWh'), 15.8);
  assert.equal(normalizeElectricityRateCentsKwh('15.8¢'), 15.8);
  assert.equal(normalizeElectricityRateCentsKwh('$158/MWh'), 15.8);
  assert.equal(normalizeElectricityRateCentsKwh('0.162'), 16.2);
  assert.equal(normalizeElectricityRateCentsKwh(16.5), 16.5);
  assert.equal(normalizeElectricityRateCentsKwh(null), null);
});

test('normalizeIncome handles currency strings', () => {
  assert.equal(normalizeIncome('$74,500'), 74500);
  assert.equal(normalizeIncome('74500 USD'), 74500);
  assert.equal(normalizeIncome('$120,000/yr'), 120000);
  assert.equal(normalizeIncome(68000), 68000);
  assert.equal(normalizeIncome(null), null);
});

test('normalizePercentage parses percentage strings', () => {
  assert.equal(normalizePercentage('+12.4%'), 12.4);
  assert.equal(normalizePercentage('3.2 percent'), 3.2);
  assert.equal(normalizePercentage('-1.5%'), -1.5);
  assert.equal(normalizePercentage(10.5), 10.5);
});

test('normalizeStatus categorizes facility lifecycle', () => {
  assert.equal(normalizeStatus('Under Construction'), 'under_construction');
  assert.equal(normalizeStatus('Building Groundbreak'), 'under_construction');
  assert.equal(normalizeStatus('Live Online Operational'), 'operational');
  assert.equal(normalizeStatus('Phase 2 Expansion'), 'expansion');
  assert.equal(normalizeStatus('Planned Project'), 'planned');
});

test('normalizeAiAssociation classifies workload specialization', () => {
  assert.equal(normalizeAiAssociation('GPU Supercomputing cluster', 'NVIDIA Blackwell Campus', 'OpenAI'), 'high');
  assert.equal(normalizeAiAssociation('Hyperscale expansion', 'Cloud Region', 'Microsoft'), 'medium');
  assert.equal(normalizeAiAssociation('Colocation facility', 'Enterprise DC', 'Standard Host'), 'low');
});
