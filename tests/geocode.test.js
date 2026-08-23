import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getCountryCode,
  getUSStateCode,
  getCoordinates,
  classifyAiAssociation,
  getRegionalDefault
} from '../pipeline/geocode.js';

test('getCountryCode accurately resolves country name variants', () => {
  assert.equal(getCountryCode('United States'), 'US');
  assert.equal(getCountryCode('United States of America'), 'US');
  assert.equal(getCountryCode('South Korea'), 'KR');
  assert.equal(getCountryCode('Republic of Korea'), 'KR');
  assert.equal(getCountryCode('New Zealand'), 'NZ');
  assert.equal(getCountryCode('United Arab Emirates'), 'AE');
  assert.equal(getCountryCode('United Kingdom'), 'GB');
  assert.equal(getCountryCode('Germany'), 'DE');
  assert.equal(getCountryCode('France'), 'FR');
  assert.equal(getCountryCode('India'), 'IN');
  assert.equal(getCountryCode('Kenya'), 'KE');
  assert.equal(getCountryCode('US'), 'US');
  assert.equal(getCountryCode('GB'), 'GB');
});

test('getUSStateCode resolves state names to abbreviations', () => {
  assert.equal(getUSStateCode('Virginia'), 'VA');
  assert.equal(getUSStateCode('Texas'), 'TX');
  assert.equal(getUSStateCode('California'), 'CA');
  assert.equal(getUSStateCode('Illinois'), 'IL');
});

test('getCoordinates returns accurate hub and centroid coordinates', () => {
  const vaCoords = getCoordinates('United States', 'Virginia', 'Loudoun County');
  assert.ok(vaCoords);
  assert.equal(vaCoords.lat, 39.04);
  assert.equal(vaCoords.lng, -77.49);

  const deCoords = getCoordinates('Germany', 'Hesse', 'Frankfurt');
  assert.ok(deCoords);
  assert.equal(deCoords.lat, 50.11);
  assert.equal(deCoords.lng, 8.68);
});

test('classifyAiAssociation correctly classifies workloads', () => {
  assert.equal(classifyAiAssociation('GPU Cluster', 'OpenAI'), 'high');
  assert.equal(classifyAiAssociation('Hyperscale Facility', 'Microsoft Cloud'), 'moderate');
  assert.equal(classifyAiAssociation('Colocation Hosting', 'Enterprise Host'), 'low');
  assert.equal(classifyAiAssociation('General Warehouse', 'Standard Corp'), 'unknown');
});

test('getRegionalDefault provides region-appropriate economic values', () => {
  const usIncome = getRegionalDefault('income', 'US');
  assert.equal(usIncome, 65000);

  const inIncome = getRegionalDefault('income', 'IN');
  assert.equal(inIncome, 7000);

  const keIncome = getRegionalDefault('income', 'KE');
  assert.equal(keIncome, 5000);

  const deRate = getRegionalDefault('rate', 'DE');
  assert.equal(deRate, 35.0);
});
