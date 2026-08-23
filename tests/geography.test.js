import test from 'node:test';
import assert from 'node:assert/strict';
import { KNOWN_HUBS, matchGeography, findBestRegionKey } from '../pipeline/geography.js';

test('findBestRegionKey resolves major hubs accurately', () => {
  assert.equal(findBestRegionKey({ county: 'Loudoun County', region: 'Virginia', country: 'US' }), 'us-va-loudoun');
  assert.equal(findBestRegionKey({ city: 'New Albany', region: 'Ohio', country: 'US' }), 'us-oh-franklin');
  assert.equal(findBestRegionKey({ county: 'Maricopa County', region: 'Arizona', country: 'US' }), 'us-az-maricopa');
  assert.equal(findBestRegionKey({ city: 'Dublin', country: 'Ireland' }), 'ie-leinster-dublin');
  assert.equal(findBestRegionKey({ city: 'Frankfurt', country: 'Germany' }), 'de-he-frankfurt');
});

test('matchGeography calculates confidence scores by tier', () => {
  const hubLoudoun = KNOWN_HUBS['us-va-loudoun'];
  
  // Exact county match -> 0.97
  const match1 = matchGeography({ county: 'Loudoun County', country_code: 'US' }, 'us-va-loudoun', hubLoudoun);
  assert.equal(match1.type, 'exact_county');
  assert.equal(match1.confidence, 0.97);

  // Exact city match -> 0.92
  const match2 = matchGeography({ city: 'Loudoun', country_code: 'US' }, 'us-va-loudoun', hubLoudoun);
  assert.equal(match2.type, 'exact_city');
  assert.equal(match2.confidence, 0.92);

  // Metro match -> 0.75
  const match3 = matchGeography({ region: 'Virginia', country_code: 'US' }, 'us-va-loudoun', hubLoudoun);
  assert.equal(match3.type, 'metro_match');
  assert.equal(match3.confidence, 0.75);
});
