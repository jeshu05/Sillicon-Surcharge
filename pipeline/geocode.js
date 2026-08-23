/**
 * Power Draw — Geocoding & ISO Country Code Resolution Engine
 * Provides proper ISO 3166-1 alpha-2 country codes, coordinate lookup,
 * US state abbreviations, and AI workload association classification.
 *
 * Replaces the broken substring(0,2) approach and hardcoded Kansas coordinates.
 */

/**
 * Comprehensive ISO 3166-1 alpha-2 country code mapping.
 * Keys are lowercase country name variants; values are 2-letter codes.
 */
const ISO_COUNTRY_CODES = {
  // North America
  'united states': 'US', 'usa': 'US', 'u.s.': 'US', 'u.s.a.': 'US', 'us': 'US', 'america': 'US',
  'canada': 'CA',
  'mexico': 'MX',

  // Europe
  'united kingdom': 'GB', 'uk': 'GB', 'england': 'GB', 'great britain': 'GB', 'scotland': 'GB', 'wales': 'GB',
  'ireland': 'IE', 'republic of ireland': 'IE',
  'germany': 'DE', 'deutschland': 'DE',
  'france': 'FR',
  'spain': 'ES', 'españa': 'ES',
  'italy': 'IT', 'italia': 'IT',
  'netherlands': 'NL', 'holland': 'NL', 'the netherlands': 'NL',
  'belgium': 'BE',
  'austria': 'AT',
  'switzerland': 'CH',
  'sweden': 'SE',
  'norway': 'NO',
  'denmark': 'DK',
  'finland': 'FI',
  'poland': 'PL',
  'portugal': 'PT',
  'greece': 'GR',
  'czech republic': 'CZ', 'czechia': 'CZ',
  'romania': 'RO',
  'hungary': 'HU',
  'iceland': 'IS',
  'luxembourg': 'LU',
  'croatia': 'HR',
  'serbia': 'RS',
  'ukraine': 'UA',
  'turkey': 'TR', 'türkiye': 'TR',
  'bulgaria': 'BG',
  'slovakia': 'SK',
  'slovenia': 'SI',
  'lithuania': 'LT',
  'latvia': 'LV',
  'estonia': 'EE',

  // Asia-Pacific
  'japan': 'JP',
  'south korea': 'KR', 'korea': 'KR', 'republic of korea': 'KR',
  'north korea': 'KP',
  'china': 'CN', "people's republic of china": 'CN',
  'taiwan': 'TW',
  'hong kong': 'HK',
  'macau': 'MO', 'macao': 'MO',
  'india': 'IN',
  'indonesia': 'ID',
  'malaysia': 'MY',
  'singapore': 'SG',
  'thailand': 'TH',
  'vietnam': 'VN', 'viet nam': 'VN',
  'philippines': 'PH',
  'australia': 'AU',
  'new zealand': 'NZ',
  'bangladesh': 'BD',
  'pakistan': 'PK',
  'sri lanka': 'LK',
  'nepal': 'NP',
  'myanmar': 'MM',
  'cambodia': 'KH',
  'mongolia': 'MN',

  // Middle East
  'united arab emirates': 'AE', 'uae': 'AE', 'abu dhabi': 'AE', 'dubai': 'AE',
  'saudi arabia': 'SA', 'saudi': 'SA', 'ksa': 'SA',
  'qatar': 'QA',
  'bahrain': 'BH',
  'oman': 'OM',
  'kuwait': 'KW',
  'israel': 'IL',
  'jordan': 'JO',
  'lebanon': 'LB',
  'iraq': 'IQ',
  'iran': 'IR',

  // Africa
  'south africa': 'ZA',
  'kenya': 'KE',
  'nigeria': 'NG',
  'egypt': 'EG',
  'ethiopia': 'ET',
  'ghana': 'GH',
  'tanzania': 'TZ',
  'uganda': 'UG',
  'morocco': 'MA',
  'algeria': 'DZ',
  'tunisia': 'TN',
  'senegal': 'SN',
  'ivory coast': 'CI', "côte d'ivoire": 'CI',
  'mozambique': 'MZ',
  'angola': 'AO',
  'rwanda': 'RW',

  // Latin America / Caribbean
  'brazil': 'BR', 'brasil': 'BR',
  'argentina': 'AR',
  'chile': 'CL',
  'colombia': 'CO',
  'peru': 'PE',
  'venezuela': 'VE',
  'ecuador': 'EC',
  'bolivia': 'BO',
  'uruguay': 'UY',
  'paraguay': 'PY',
  'costa rica': 'CR',
  'panama': 'PA',
  'guatemala': 'GT',
  'cuba': 'CU',
  'dominican republic': 'DO',
  'puerto rico': 'PR',
  'jamaica': 'JM',

  // Russia & CIS
  'russia': 'RU', 'russian federation': 'RU',
  'kazakhstan': 'KZ',
  'uzbekistan': 'UZ',
  'belarus': 'BY',
  'georgia': 'GE',
  'armenia': 'AM',
  'azerbaijan': 'AZ',
};

/**
 * US state name → 2-letter abbreviation mapping
 */
const US_STATE_CODES = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
  'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
  'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
  'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
  'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
  'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
  'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
  'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
  'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
  'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
  'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
  'wisconsin': 'WI', 'wyoming': 'WY', 'district of columbia': 'DC'
};

/**
 * Country centroid coordinates (lat, lng) for fallback geocoding.
 * Used when no specific city/state match is available.
 */
const COUNTRY_CENTROIDS = {
  'US': { lat: 38.0, lng: -97.0 },
  'CA': { lat: 56.1, lng: -106.3 },
  'MX': { lat: 23.6, lng: -102.5 },
  'GB': { lat: 51.5, lng: -0.1 },
  'IE': { lat: 53.4, lng: -8.2 },
  'DE': { lat: 51.2, lng: 10.5 },
  'FR': { lat: 46.2, lng: 2.2 },
  'ES': { lat: 40.5, lng: -3.7 },
  'IT': { lat: 41.9, lng: 12.6 },
  'NL': { lat: 52.1, lng: 5.3 },
  'BE': { lat: 50.8, lng: 4.4 },
  'CH': { lat: 46.8, lng: 8.2 },
  'SE': { lat: 60.1, lng: 18.6 },
  'NO': { lat: 60.5, lng: 8.5 },
  'FI': { lat: 61.9, lng: 25.7 },
  'DK': { lat: 56.3, lng: 9.5 },
  'PL': { lat: 51.9, lng: 19.1 },
  'AT': { lat: 47.5, lng: 14.6 },
  'PT': { lat: 39.4, lng: -8.2 },
  'GR': { lat: 39.1, lng: 21.8 },
  'CZ': { lat: 49.8, lng: 15.5 },
  'RO': { lat: 45.9, lng: 24.97 },
  'HU': { lat: 47.2, lng: 19.5 },
  'TR': { lat: 38.9, lng: 35.2 },
  'JP': { lat: 36.2, lng: 138.3 },
  'KR': { lat: 35.9, lng: 127.8 },
  'CN': { lat: 35.9, lng: 104.2 },
  'TW': { lat: 23.7, lng: 121.0 },
  'HK': { lat: 22.4, lng: 114.1 },
  'IN': { lat: 20.6, lng: 79.0 },
  'ID': { lat: -0.8, lng: 113.9 },
  'MY': { lat: 4.2, lng: 101.9 },
  'SG': { lat: 1.35, lng: 103.8 },
  'TH': { lat: 15.9, lng: 100.9 },
  'VN': { lat: 14.1, lng: 108.3 },
  'PH': { lat: 12.9, lng: 121.8 },
  'AU': { lat: -25.3, lng: 133.8 },
  'NZ': { lat: -40.9, lng: 174.9 },
  'AE': { lat: 23.4, lng: 53.8 },
  'SA': { lat: 23.9, lng: 45.1 },
  'QA': { lat: 25.4, lng: 51.2 },
  'BH': { lat: 26.0, lng: 50.5 },
  'KW': { lat: 29.3, lng: 47.5 },
  'IL': { lat: 31.0, lng: 34.9 },
  'ZA': { lat: -30.6, lng: 22.9 },
  'KE': { lat: -0.02, lng: 37.9 },
  'NG': { lat: 9.1, lng: 8.7 },
  'EG': { lat: 26.8, lng: 30.8 },
  'BR': { lat: -14.2, lng: -51.9 },
  'AR': { lat: -38.4, lng: -63.6 },
  'CL': { lat: -35.7, lng: -71.5 },
  'CO': { lat: 4.6, lng: -74.1 },
  'PE': { lat: -9.2, lng: -75.0 },
  'RU': { lat: 61.5, lng: 105.3 },
  'KZ': { lat: 48.0, lng: 68.0 },
};

/**
 * Curated location coordinates for data center hub regions.
 * Format: { 'state/region_key': { lat, lng } }
 */
const LOCATION_COORDS = {
  // US States - data center hub locations
  'virginia': { lat: 39.04, lng: -77.49 },         // Loudoun County / Northern Virginia
  'texas': { lat: 32.78, lng: -96.80 },             // Dallas
  'ohio': { lat: 39.96, lng: -82.99 },              // Columbus / Franklin County
  'arizona': { lat: 33.45, lng: -112.07 },           // Phoenix / Maricopa
  'louisiana': { lat: 32.51, lng: -91.73 },          // Richland Parish
  'wisconsin': { lat: 42.73, lng: -87.78 },          // Racine County
  'indiana': { lat: 41.68, lng: -86.25 },            // South Bend / St. Joseph County
  'tennessee': { lat: 35.15, lng: -90.05 },          // Memphis / Shelby County
  'pennsylvania': { lat: 41.24, lng: -75.88 },       // Luzerne County
  'utah': { lat: 40.76, lng: -111.89 },              // Salt Lake County
  'california': { lat: 37.39, lng: -121.96 },        // Santa Clara / Silicon Valley
  'illinois': { lat: 41.88, lng: -87.63 },           // Chicago / Cook County
  'oregon': { lat: 45.49, lng: -122.89 },            // Hillsboro / Washington County
  'iowa': { lat: 41.59, lng: -93.62 },               // Des Moines / Polk County
  'nevada': { lat: 39.51, lng: -119.78 },            // Reno / Storey County
  'north carolina': { lat: 35.23, lng: -80.84 },     // Charlotte / Mecklenburg
  'georgia': { lat: 33.75, lng: -84.39 },            // Atlanta
  'washington': { lat: 47.61, lng: -122.33 },        // Seattle
  'new york': { lat: 40.71, lng: -74.01 },           // NYC
  'colorado': { lat: 39.74, lng: -104.99 },          // Denver
  'florida': { lat: 25.76, lng: -80.19 },            // Miami
  'new jersey': { lat: 40.74, lng: -74.17 },         // Newark area
  'maryland': { lat: 39.29, lng: -76.61 },           // Baltimore area
  'south carolina': { lat: 34.00, lng: -81.03 },     // Columbia
  'kansas': { lat: 38.97, lng: -95.23 },             // Lawrence
  'nebraska': { lat: 41.26, lng: -95.94 },           // Omaha
  'minnesota': { lat: 44.98, lng: -93.27 },          // Minneapolis
  'michigan': { lat: 42.33, lng: -83.05 },           // Detroit
  'massachusetts': { lat: 42.36, lng: -71.06 },      // Boston
  'connecticut': { lat: 41.76, lng: -72.68 },        // Hartford
  'alberta': { lat: 51.05, lng: -114.07 },           // Calgary, Canada

  // International regions
  'île-de-france': { lat: 48.86, lng: 2.35 },       // Paris
  'hesse': { lat: 50.11, lng: 8.68 },                // Frankfurt
  'england': { lat: 51.51, lng: -0.13 },             // London
  'leinster': { lat: 53.35, lng: -6.26 },            // Dublin
  'north holland': { lat: 52.37, lng: 4.90 },        // Amsterdam
  'eastern norway': { lat: 59.91, lng: 10.75 },      // Oslo
  'stockholm county': { lat: 59.33, lng: 18.07 },    // Stockholm
  'madrid': { lat: 40.42, lng: -3.70 },              // Madrid
  'masovian': { lat: 52.23, lng: 21.01 },            // Warsaw
  'abu dhabi': { lat: 24.45, lng: 54.65 },           // Abu Dhabi
  'riyadh province': { lat: 24.71, lng: 46.68 },     // Riyadh
  'kanto': { lat: 35.68, lng: 139.69 },              // Tokyo
  'central region': { lat: 1.35, lng: 103.82 },      // Singapore
  'jeollanam-do': { lat: 34.82, lng: 126.89 },       // South Korea
  'tamil nadu': { lat: 13.08, lng: 80.27 },          // Chennai
  'telangana': { lat: 17.39, lng: 78.49 },           // Hyderabad
  'karnataka': { lat: 12.97, lng: 77.59 },           // Bengaluru
  'maharashtra': { lat: 19.08, lng: 72.88 },         // Mumbai
  'victoria': { lat: -37.81, lng: 144.96 },          // Melbourne
  'new south wales': { lat: -33.87, lng: 151.21 },   // Sydney
  'guangdong': { lat: 23.13, lng: 113.26 },          // Guangzhou
  'inner mongolia': { lat: 40.84, lng: 111.75 },     // Hohhot
  'hebei': { lat: 38.04, lng: 114.51 },              // Shijiazhuang
  'moscow oblast': { lat: 55.76, lng: 37.62 },       // Moscow
  'western cape': { lat: -33.93, lng: 18.42 },       // Cape Town
  'gauteng': { lat: -26.20, lng: 28.05 },            // Johannesburg
  'nairobi county': { lat: -1.29, lng: 36.82 },      // Nairobi
  'lagos state': { lat: 6.52, lng: 3.38 },           // Lagos
  'cairo governorate': { lat: 30.04, lng: 31.24 },   // Cairo
  'west java': { lat: -6.91, lng: 107.61 },          // Bandung area
  'johor': { lat: 1.49, lng: 103.74 },               // Johor Bahru
  'northern taiwan': { lat: 25.03, lng: 121.57 },    // Taipei
  'querétaro': { lat: 20.59, lng: -100.39 },         // Querétaro
  'santiago metropolitan': { lat: -33.45, lng: -70.67 }, // Santiago
  'rio grande do sul': { lat: -30.03, lng: -51.23 }, // Porto Alegre

  // Canadian provinces
  'ontario': { lat: 43.65, lng: -79.38 },            // Toronto
  'quebec': { lat: 46.81, lng: -71.21 },             // Quebec City
  'british columbia': { lat: 49.28, lng: -123.12 },  // Vancouver
};

/**
 * Regional electricity rate defaults (cents/kWh) for countries/regions
 * Used when no scraped data is available — avoids US-centric 15¢ default globally.
 */
export const REGIONAL_RATE_DEFAULTS = {
  'US': 16.0, 'CA': 13.0, 'MX': 8.5,
  'GB': 34.0, 'IE': 30.0, 'DE': 35.0, 'FR': 22.0, 'ES': 25.0, 'IT': 28.0,
  'NL': 28.0, 'SE': 20.0, 'NO': 18.0, 'FI': 18.0, 'DK': 40.0, 'PL': 18.0,
  'CH': 22.0, 'AT': 25.0, 'PT': 23.0, 'BE': 30.0,
  'JP': 28.0, 'KR': 12.0, 'CN': 8.0, 'TW': 10.0, 'HK': 18.0,
  'IN': 8.0, 'ID': 9.0, 'MY': 8.0, 'SG': 22.0, 'TH': 10.0, 'VN': 8.0, 'PH': 12.0,
  'AU': 28.0, 'NZ': 22.0,
  'AE': 8.0, 'SA': 5.0, 'QA': 4.0, 'KW': 3.0, 'BH': 4.0, 'IL': 16.0,
  'ZA': 12.0, 'KE': 18.0, 'NG': 10.0, 'EG': 6.0,
  'BR': 14.0, 'AR': 6.0, 'CL': 15.0, 'CO': 12.0,
  'RU': 5.0, 'KZ': 5.0, 'TR': 10.0,
  '_default': 12.0,  // Global median fallback
};

/**
 * Regional median household income defaults (USD/year)
 * Used when no scraped data is available — avoids US-centric $65K default globally.
 */
export const REGIONAL_INCOME_DEFAULTS = {
  'US': 65000, 'CA': 52000, 'MX': 15000,
  'GB': 42000, 'IE': 48000, 'DE': 45000, 'FR': 38000, 'ES': 28000, 'IT': 32000,
  'NL': 46000, 'SE': 42000, 'NO': 55000, 'FI': 40000, 'DK': 50000, 'PL': 18000,
  'CH': 62000, 'AT': 42000, 'PT': 22000, 'BE': 40000,
  'JP': 38000, 'KR': 32000, 'CN': 12000, 'TW': 25000, 'HK': 45000,
  'IN': 7000, 'ID': 6000, 'MY': 12000, 'SG': 55000, 'TH': 8000, 'VN': 5000, 'PH': 5500,
  'AU': 50000, 'NZ': 40000,
  'AE': 50000, 'SA': 30000, 'QA': 60000, 'KW': 45000, 'IL': 38000,
  'ZA': 8000, 'KE': 5000, 'NG': 4000, 'EG': 5000,
  'BR': 10000, 'AR': 9000, 'CL': 14000, 'CO': 7000,
  'RU': 12000, 'KZ': 10000, 'TR': 11000,
  '_default': 15000,  // Global median fallback
};

/**
 * Regional average monthly kWh consumption defaults
 */
export const REGIONAL_KWH_DEFAULTS = {
  'US': 900, 'CA': 800, 'MX': 400,
  'GB': 350, 'IE': 400, 'DE': 300, 'FR': 400, 'ES': 300, 'IT': 250,
  'NL': 300, 'SE': 350, 'NO': 500, 'FI': 450, 'DK': 350, 'PL': 250,
  'JP': 400, 'KR': 350, 'CN': 350, 'TW': 350,
  'IN': 200, 'ID': 180, 'MY': 350, 'SG': 400, 'TH': 250,
  'AU': 550, 'NZ': 500,
  'AE': 700, 'SA': 800, 'QA': 750,
  'ZA': 400, 'KE': 100, 'NG': 80, 'EG': 200,
  'BR': 350, 'AR': 300, 'CL': 300,
  '_default': 350,
};

/**
 * Resolves a country name (with variations) to its ISO 3166-1 alpha-2 code.
 * Uses fuzzy matching against the comprehensive lookup table.
 *
 * @param {string} name - Country name in any common variant
 * @returns {string} ISO 3166-1 alpha-2 code, or 'XX' if unresolved
 */
export function getCountryCode(name) {
  if (!name || typeof name !== 'string') return 'XX';

  const normalized = name.trim().toLowerCase();

  // Direct lookup
  if (ISO_COUNTRY_CODES[normalized]) return ISO_COUNTRY_CODES[normalized];

  // Prefix match (handles "United States of America", "Republic of Korea", etc.)
  for (const [key, code] of Object.entries(ISO_COUNTRY_CODES)) {
    if (normalized.includes(key) || key.includes(normalized)) return code;
  }

  // If the input is already a 2-letter code, validate and return
  if (normalized.length === 2) {
    const upper = normalized.toUpperCase();
    const validCodes = new Set(Object.values(ISO_COUNTRY_CODES));
    if (validCodes.has(upper)) return upper;
  }

  return 'XX';
}

/**
 * Resolves a US state name to its 2-letter abbreviation.
 *
 * @param {string} stateName
 * @returns {string|null} 2-letter state code or null
 */
export function getUSStateCode(stateName) {
  if (!stateName) return null;
  const key = stateName.trim().toLowerCase();
  return US_STATE_CODES[key] || null;
}

/**
 * Looks up coordinates for a location based on country, state/region, and city.
 * Falls back through: state → country centroid → null
 *
 * @param {string} country - Country name
 * @param {string} stateOrRegion - State, province, or region name
 * @param {string} city - City or county name (optional)
 * @returns {{ lat: number, lng: number } | null}
 */
export function getCoordinates(country, stateOrRegion, city) {
  // Try state/region match first
  if (stateOrRegion) {
    const regionKey = stateOrRegion.trim().toLowerCase();
    if (LOCATION_COORDS[regionKey]) return { ...LOCATION_COORDS[regionKey] };
  }

  // Try city match
  if (city) {
    const cityKey = city.trim().toLowerCase().replace(/\s*county\s*/gi, '').replace(/\s*parish\s*/gi, '').trim();
    if (LOCATION_COORDS[cityKey]) return { ...LOCATION_COORDS[cityKey] };
  }

  // Fall back to country centroid
  const countryCode = getCountryCode(country);
  if (countryCode !== 'XX' && COUNTRY_CENTROIDS[countryCode]) {
    return { ...COUNTRY_CENTROIDS[countryCode] };
  }

  return null;
}

/**
 * Classifies AI workload association level based on facility name and operator.
 * Returns 'high', 'moderate', 'low', or 'unknown'.
 *
 * @param {string} facilityName
 * @param {string} operator
 * @returns {string}
 */
export function classifyAiAssociation(facilityName, operator) {
  const combined = `${facilityName || ''} ${operator || ''}`.toLowerCase();

  // High: Explicit AI/ML branding or known AI-first operators
  const highPatterns = [
    'gpu', 'llm', 'ai cluster', 'ai campus', 'supercomputer', 'ai factory',
    'openai', 'anthropic', 'nvidia', 'nvda', 'blackwell', 'tpu', 'xai',
    'colossus', 'stargate', 'cerebras', 'groq', 'ai training',
    'machine learning', 'deep learning', 'inference'
  ];
  if (highPatterns.some(p => combined.includes(p))) return 'high';

  // Moderate: Major hyperscalers known to host significant AI workloads
  const moderatePatterns = [
    'hyperscale', 'aws', 'amazon web services', 'azure', 'google cloud',
    'meta platforms', 'meta ', 'microsoft cloud', 'microsoft data',
    'oracle cloud', 'bytedance', 'baidu', 'alibaba cloud', 'tencent'
  ];
  if (moderatePatterns.some(p => combined.includes(p))) return 'moderate';

  // Low: Generic data center / colocation
  const lowPatterns = [
    'colocation', 'colo ', 'enterprise', 'hosting', 'managed services',
    'private cloud', 'edge computing'
  ];
  if (lowPatterns.some(p => combined.includes(p))) return 'low';

  return 'unknown';
}

/**
 * Gets the regional default for a given metric type and country code.
 *
 * @param {'rate'|'income'|'kwh'} metricType
 * @param {string} countryCode - ISO 3166-1 alpha-2
 * @returns {number}
 */
export function getRegionalDefault(metricType, countryCode) {
  const code = (countryCode || 'XX').toUpperCase();
  switch (metricType) {
    case 'rate':
      return REGIONAL_RATE_DEFAULTS[code] || REGIONAL_RATE_DEFAULTS._default;
    case 'income':
      return REGIONAL_INCOME_DEFAULTS[code] || REGIONAL_INCOME_DEFAULTS._default;
    case 'kwh':
      return REGIONAL_KWH_DEFAULTS[code] || REGIONAL_KWH_DEFAULTS._default;
    default:
      return 0;
  }
}
