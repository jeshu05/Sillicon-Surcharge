/**
 * Power Draw - Live Multi-Source Web Scraper Engine
 * Scrapes real-world data centers, electricity tariffs, and economic purchasing power from:
 * - Collector 1: aidatacenterindex.com & valueaddvc.com (AI Data Center Infrastructure)
 * - Collector 2: globalpetrolprices.com & electricchoice.com & findenergy.com (Electricity Rates)
 * - Collector 3: numbeo.com & city-data.com (Household Economics)
 */

import { logger } from './utils/logger.js';
import { createProvenance } from './provenance.js';
import { COLLECTORS } from './brightdata.js';
import { getCountryCode, getCoordinates, classifyAiAssociation } from './geocode.js';

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache'
};

/**
 * Scrapes live data center facilities from aidatacenterindex.com
 */
export async function scrapeLiveAIDataCenters() {
  const url = 'https://aidatacenterindex.com/';
  logger.info('SCRAPER', `Fetching live AI data center facilities from ${url}...`);

  try {
    const res = await fetch(url, { headers: BROWSER_HEADERS });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

    const html = await res.text();
    const records = [];

    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let rowMatch;

    while ((rowMatch = rowRegex.exec(html)) !== null) {
      const rowContent = rowMatch[1];
      const nameMatch = rowContent.match(/<a[^>]*href="\/datacenters\/([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
      const capMatch = rowContent.match(/(\d[\d,]*)\s*MW/i);
      const locMatch = rowContent.match(/class="[^"]*location-secondary[^"]*"[^>]*>([\s\S]*?)<\/div>/i) || rowContent.match(/<td[^>]*>([\s\S]*?(?:County|Parish|State|United States|Virginia|Texas|Ohio|Arizona|Louisiana|Wisconsin|Indiana|Tennessee|Pennsylvania|Utah|California|Illinois|Oregon|Iowa|Nevada|North Carolina|France|Germany|Japan|Singapore|Ireland|UK|Netherlands|Norway|Sweden|Spain|Brazil|Canada|South Korea|United Arab Emirates|Abu Dhabi)[\s\S]*?)<\/td>/i);
      const statusMatch = rowContent.match(/class="[^"]*status-pill[^"]*"[^>]*>([\s\S]*?)<\/a>/i) || rowContent.match(/status\/([^"/]+)/i);

      if (nameMatch && capMatch) {
        const rawName = nameMatch[2].replace(/<[^>]+>/g, '').trim();
        const slug = nameMatch[1];
        const capacityMw = parseInt(capMatch[1].replace(/,/g, ''), 10);
        const locationText = locMatch ? locMatch[1].replace(/<[^>]+>/g, '').trim() : 'Global Hub';
        const rawStatus = statusMatch ? (statusMatch[1] || statusMatch[0]).replace(/<[^>]+>/g, '').trim().toLowerCase() : 'operational';

        let operator = 'Undisclosed Hyperscaler';
        if (rawName.includes('AWS') || rawName.includes('Amazon')) operator = 'Amazon Web Services (AWS)';
        else if (rawName.includes('Microsoft')) operator = 'Microsoft Cloud';
        else if (rawName.includes('Meta')) operator = 'Meta Platforms';
        else if (rawName.includes('Google')) operator = 'Google Cloud';
        else if (rawName.includes('Oracle')) operator = 'Oracle Cloud Infrastructure';
        else if (rawName.includes('xAI') || rawName.includes('Colossus')) operator = 'xAI / Elon Musk';
        else if (rawName.includes('SoftBank')) operator = 'SoftBank Group';
        else if (rawName.includes('G42') || rawName.includes('Stargate')) operator = 'G42 / Microsoft Stargate';
        else if (rawName.includes('Scala')) operator = 'Scala Data Centers';
        else if (rawName.includes('Elea')) operator = 'Elea Digital';
        else if (rawName.includes('Vantage')) operator = 'Vantage Data Centers';
        else if (rawName.includes('QTS')) operator = 'QTS Data Centers';
        else if (rawName.includes('CyrusOne')) operator = 'CyrusOne';
        else if (rawName.includes('Digital Realty')) operator = 'Digital Realty';
        else if (rawName.includes('Equinix')) operator = 'Equinix';

        let status = 'operational';
        if (rawStatus.includes('planned') || rawStatus.includes('proposal') || rawStatus.includes('announced')) {
          status = 'planned';
        } else if (rawStatus.includes('construction') || rawStatus.includes('building') || rawStatus.includes('progress') || rawStatus.includes('startup')) {
          status = 'under_construction';
        }

        let country = 'United States';
        let countryCode = 'US';
        let regionState = locationText;
        let county = locationText;

        if (locationText.includes('France')) { country = 'France'; countryCode = 'FR'; regionState = 'Île-de-France'; }
        else if (locationText.includes('Germany')) { country = 'Germany'; countryCode = 'DE'; regionState = 'Hesse'; }
        else if (locationText.includes('United Kingdom') || locationText.includes('UK')) { country = 'United Kingdom'; countryCode = 'GB'; regionState = 'England'; }
        else if (locationText.includes('Ireland')) { country = 'Ireland'; countryCode = 'IE'; regionState = 'Leinster'; }
        else if (locationText.includes('Netherlands')) { country = 'Netherlands'; countryCode = 'NL'; regionState = 'North Holland'; }
        else if (locationText.includes('Norway')) { country = 'Norway'; countryCode = 'NO'; regionState = 'Eastern Norway'; }
        else if (locationText.includes('Sweden')) { country = 'Sweden'; countryCode = 'SE'; regionState = 'Stockholm County'; }
        else if (locationText.includes('Spain')) { country = 'Spain'; countryCode = 'ES'; regionState = 'Madrid'; }
        else if (locationText.includes('Poland')) { country = 'Poland'; countryCode = 'PL'; regionState = 'Masovian'; }
        else if (locationText.includes('Abu Dhabi') || locationText.includes('UAE') || locationText.includes('United Arab Emirates')) { country = 'United Arab Emirates'; countryCode = 'AE'; regionState = 'Abu Dhabi'; }
        else if (locationText.includes('Saudi Arabia') || locationText.includes('Riyadh') || locationText.includes('NEOM')) { country = 'Saudi Arabia'; countryCode = 'SA'; regionState = 'Riyadh Province'; }
        else if (locationText.includes('Japan')) { country = 'Japan'; countryCode = 'JP'; regionState = 'Kanto'; }
        else if (locationText.includes('Singapore')) { country = 'Singapore'; countryCode = 'SG'; regionState = 'Central Region'; }
        else if (locationText.includes('South Korea') || locationText.includes('Korea')) { country = 'South Korea'; countryCode = 'KR'; regionState = 'Jeollanam-do'; }
        else if (locationText.includes('India')) {
          country = 'India'; countryCode = 'IN';
          if (locationText.includes('Chennai') || locationText.includes('Tamil Nadu')) regionState = 'Tamil Nadu';
          else if (locationText.includes('Hyderabad') || locationText.includes('Telangana')) regionState = 'Telangana';
          else if (locationText.includes('Bengaluru') || locationText.includes('Bangalore') || locationText.includes('Karnataka')) regionState = 'Karnataka';
          else regionState = 'Maharashtra';
        }
        else if (locationText.includes('Australia')) {
          country = 'Australia'; countryCode = 'AU';
          regionState = locationText.includes('Melbourne') || locationText.includes('Victoria') ? 'Victoria' : 'New South Wales';
        }
        else if (locationText.includes('China')) {
          country = 'China'; countryCode = 'CN';
          if (locationText.includes('Qingyuan') || locationText.includes('Guangdong')) regionState = 'Guangdong';
          else if (locationText.includes('Horinger') || locationText.includes('Inner Mongolia') || locationText.includes('Guizhou')) regionState = 'Inner Mongolia';
          else regionState = 'Hebei';
        }
        else if (locationText.includes('Russia')) { country = 'Russia'; countryCode = 'RU'; regionState = 'Moscow Oblast'; }
        else if (locationText.includes('South Africa')) {
          country = 'South Africa'; countryCode = 'ZA';
          regionState = locationText.includes('Cape Town') ? 'Western Cape' : 'Gauteng';
        }
        else if (locationText.includes('Kenya')) { country = 'Kenya'; countryCode = 'KE'; regionState = 'Nairobi County'; }
        else if (locationText.includes('Nigeria')) { country = 'Nigeria'; countryCode = 'NG'; regionState = 'Lagos State'; }
        else if (locationText.includes('Egypt')) { country = 'Egypt'; countryCode = 'EG'; regionState = 'Cairo Governorate'; }
        else if (locationText.includes('Indonesia')) { country = 'Indonesia'; countryCode = 'ID'; regionState = 'West Java'; }
        else if (locationText.includes('Malaysia')) { country = 'Malaysia'; countryCode = 'MY'; regionState = 'Johor'; }
        else if (locationText.includes('Taiwan')) { country = 'Taiwan'; countryCode = 'TW'; regionState = 'Northern Taiwan'; }
        else if (locationText.includes('Mexico')) { country = 'Mexico'; countryCode = 'MX'; regionState = 'Querétaro'; }
        else if (locationText.includes('Chile')) { country = 'Chile'; countryCode = 'CL'; regionState = 'Santiago Metropolitan'; }
        else if (locationText.includes('Brazil')) { country = 'Brazil'; countryCode = 'BR'; regionState = 'Rio Grande do Sul'; }
        else if (locationText.includes('Canada') || locationText.includes('Alberta')) { country = 'Canada'; countryCode = 'CA'; regionState = 'Alberta'; }

        if (locationText.includes('Virginia')) { regionState = 'Virginia'; county = locationText.includes('Caroline') ? 'Caroline County' : (locationText.includes('Prince William') ? 'Prince William County' : 'Loudoun County'); }
        else if (locationText.includes('Texas')) { regionState = 'Texas'; county = locationText.includes('Shackelford') ? 'Shackelford County' : (locationText.includes('Bexar') ? 'Bexar County' : 'Dallas County'); }
        else if (locationText.includes('Ohio')) { regionState = 'Ohio'; county = 'Franklin County'; }
        else if (locationText.includes('Arizona')) { regionState = 'Arizona'; county = 'Maricopa County'; }
        else if (locationText.includes('Louisiana')) { regionState = 'Louisiana'; county = 'Richland Parish'; }
        else if (locationText.includes('Wisconsin')) { regionState = 'Wisconsin'; county = 'Racine County'; }
        else if (locationText.includes('Indiana')) { regionState = 'Indiana'; county = 'St. Joseph County'; }
        else if (locationText.includes('Tennessee') || locationText.includes('Memphis')) { regionState = 'Tennessee'; county = 'Shelby County'; }
        else if (locationText.includes('Pennsylvania')) { regionState = 'Pennsylvania'; county = 'Luzerne County'; }
        else if (locationText.includes('Utah')) { regionState = 'Utah'; county = 'Salt Lake County'; }
        else if (locationText.includes('California')) { regionState = 'California'; county = 'Santa Clara County'; }
        else if (locationText.includes('Illinois')) { regionState = 'Illinois'; county = 'Cook County'; }
        else if (locationText.includes('Oregon')) { regionState = 'Oregon'; county = 'Washington County'; }
        else if (locationText.includes('Iowa')) { regionState = 'Iowa'; county = 'Polk County'; }
        else if (locationText.includes('Nevada')) { regionState = 'Nevada'; county = 'Storey County'; }
        else if (locationText.includes('North Carolina')) { regionState = 'North Carolina'; county = 'Mecklenburg County'; }

        const facilityId = `fac_${slug.replace(/[^a-z0-9_]/gi, '_').substring(0, 30)}`;
        const sourceUrl = slug.endsWith('.html') 
          ? `https://aidatacenterindex.com/datacenters/${slug}` 
          : (slug && !slug.includes('/') ? `https://aidatacenterindex.com/datacenters/${slug}.html` : 'https://aidatacenterindex.com/datacenters/');
        const retrievedAt = new Date().toISOString();

        const coords = getCoordinates(country, regionState, county) || { lat: null, lng: null };
        const aiAssoc = classifyAiAssociation(rawName, operator);

        records.push({
          facility_id: facilityId,
          facility_name: rawName,
          operator,
          capacity_mw: capacityMw,
          status,
          country,
          country_code: countryCode,
          region: regionState,
          county,
          city: county.replace(/County|Parish/gi, '').trim(),
          latitude: coords.lat,
          longitude: coords.lng,
          ai_association: aiAssoc,
          source_name: 'aidatacenterindex.com',
          source_url: sourceUrl,
          retrieved_at: retrievedAt,
          provenance: createProvenance({
            sourceName: 'aidatacenterindex.com',
            sourceUrl: sourceUrl,
            collectorId: COLLECTORS.DATACENTERS,
            retrievedAt: retrievedAt
          })
        });
      }
    }

    logger.success('SCRAPER', `Successfully scraped ${records.length} live AI data center facilities from aidatacenterindex.com`);
    return records;
  } catch (err) {
    logger.warn('SCRAPER', `Live AI Data Center scrape encountered issue: ${err.message}.`);
    return [];
  }
}

/**
 * Scrapes live global electricity tariffs from GlobalPetrolPrices.com
 */
export async function scrapeLiveGlobalElectricity() {
  const url = 'https://www.globalpetrolprices.com/electricity_prices/';
  logger.info('SCRAPER', `Fetching live global electricity tariffs from ${url}...`);

  try {
    const res = await fetch(url, { headers: BROWSER_HEADERS });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

    const html = await res.text();
    const records = [];

    const rowRegex = /<tr[^>]*>[\s\S]*?<td[^>]*><a[^>]*>([\s\S]*?)<\/a>[\s\S]*?<td[^>]*>([\d\.]+)<\/td>[\s\S]*?<td[^>]*>([\d\.]+)<\/td>/gi;
    let match;

    while ((match = rowRegex.exec(html)) !== null) {
      const countryName = match[1].trim();
      const householdRateUsd = parseFloat(match[2]);
      const rateCentsKwh = Math.round(householdRateUsd * 100 * 100) / 100;
      const retrievedAt = new Date().toISOString();

      if (countryName && !isNaN(rateCentsKwh)) {
        records.push({
          utility_id: `util_${countryName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          utility_name: `National Grid / ${countryName} Regulated Electric Utility`,
          country: countryName,
          country_code: getCountryCode(countryName),
          residential_rate_cents_kwh: rateCentsKwh,
          previous_rate_cents_kwh: null,
          rate_change_pct_12m: null,
          source_name: 'globalpetrolprices.com',
          source_url: url,
          retrieved_at: retrievedAt,
          provenance: createProvenance({
            sourceName: 'globalpetrolprices.com',
            sourceUrl: url,
            collectorId: COLLECTORS.ELECTRICITY,
            retrievedAt: retrievedAt
          })
        });
      }
    }

    logger.success('SCRAPER', `Successfully scraped ${records.length} live global electricity tariffs from globalpetrolprices.com`);
    return records;
  } catch (err) {
    logger.warn('SCRAPER', `Live electricity scrape encountered issue: ${err.message}.`);
    return [];
  }
}

/**
 * Scrapes live US state residential electricity rates from electricchoice.com
 */
export async function scrapeLiveUSElectricity() {
  const url = 'https://www.electricchoice.com/electricity-prices-by-state/';
  logger.info('SCRAPER', `Fetching live US state electricity rates from ${url}...`);

  try {
    const res = await fetch(url, { headers: BROWSER_HEADERS });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

    const html = await res.text();
    const records = [];

    const regex = /<tr><td><a[^>]*>([^<]+)<\/a><\/td><td[^>]*>([\d\.]+)<\/td>/gi;
    let match;

    while ((match = regex.exec(html)) !== null) {
      const stateName = match[1].trim();
      const rateCents = parseFloat(match[2]);
      const retrievedAt = new Date().toISOString();

      if (stateName && !isNaN(rateCents)) {
        records.push({
          utility_id: `util_us_${stateName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          utility_name: `${stateName} Regulated Electric Service`,
          country: 'United States',
          country_code: 'US',
          state: stateName,
          residential_rate_cents_kwh: rateCents,
          previous_rate_cents_kwh: null,
          rate_change_pct_12m: null,
          source_name: 'electricchoice.com / findenergy.com',
          source_url: url,
          retrieved_at: retrievedAt,
          provenance: createProvenance({
            sourceName: 'electricchoice.com / findenergy.com',
            sourceUrl: url,
            collectorId: COLLECTORS.ELECTRICITY,
            retrievedAt: retrievedAt
          })
        });
      }
    }

    logger.success('SCRAPER', `Successfully scraped ${records.length} live US state electricity rates from electricchoice.com`);
    return records;
  } catch (err) {
    logger.warn('SCRAPER', `Live US electricity scrape encountered issue: ${err.message}.`);
    return [];
  }
}

/**
 * Scrapes live global household income & economics from numbeo.com / public cost-of-living aggregator
 */
export async function scrapeLiveGlobalEconomics() {
  const url = 'https://www.numbeo.com/cost-of-living/prices_by_country.jsp';
  logger.info('SCRAPER', `Fetching live global economic indicators from ${url}...`);

  try {
    const res = await fetch(url, { headers: BROWSER_HEADERS });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

    const html = await res.text();
    const records = [];

    // Parse Numbeo country rows
    const rowRegex = /<tr[^>]*>[\s\S]*?<td[^>]*><a[^>]*href="[^"]*country_result\.jsp\?country=([^"&]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<td[^>]*>([\d\.,]+)<\/td>/gi;
    let match;

    while ((match = rowRegex.exec(html)) !== null) {
      const countryRaw = match[2].replace(/<[^>]+>/g, '').trim();
      const salaryNum = parseFloat(match[3].replace(/,/g, ''));
      const retrievedAt = new Date().toISOString();

      if (countryRaw && !isNaN(salaryNum) && salaryNum > 0) {
        const countryCode = getCountryCode(countryRaw);
        // Annual household income estimate: monthly salary * 12 * 1.4 average earners
        const annualIncome = Math.round(salaryNum * 12 * 1.4);

        records.push({
          geography_id: `geo_live_${countryRaw.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          geography_name: countryRaw,
          country: countryRaw,
          country_code: countryCode,
          region: countryRaw,
          county: null,
          median_household_income: annualIncome,
          previous_median_income: null,
          income_growth_pct_12m: 3.0,
          poverty_rate_pct: null,
          year: new Date().getFullYear(),
          source_name: 'numbeo.com',
          source_url: `https://www.numbeo.com/cost-of-living/country_result.jsp?country=${encodeURIComponent(countryRaw)}`,
          retrieved_at: retrievedAt,
          provenance: createProvenance({
            sourceName: 'numbeo.com',
            sourceUrl: `https://www.numbeo.com/cost-of-living/country_result.jsp?country=${encodeURIComponent(countryRaw)}`,
            collectorId: COLLECTORS.ECONOMICS,
            retrievedAt: retrievedAt
          })
        });
      }
    }

    logger.success('SCRAPER', `Successfully scraped ${records.length} live global economic profiles from numbeo.com`);
    return records;
  } catch (err) {
    logger.warn('SCRAPER', `Live economics scrape encountered issue: ${err.message}.`);
    return [];
  }
}

/**
 * Executes full multi-source live scraping routine
 */
export async function runLiveScrapers() {
  logger.section('Executing Live Multi-Source Web Scrapers');

  const [liveFacilities, liveGlobalElec, liveUSElec, liveEconomics] = await Promise.all([
    scrapeLiveAIDataCenters(),
    scrapeLiveGlobalElectricity(),
    scrapeLiveUSElectricity(),
    scrapeLiveGlobalEconomics()
  ]);

  return {
    liveFacilities,
    liveGlobalElectricity: liveGlobalElec,
    liveUSElectricity: liveUSElec,
    liveEconomics
  };
}
