# Collector 2: Utility & Residential Electricity Rates (`c_pd_electricity_02`)

## Objective
Extract residential retail electricity tariffs, recent rate changes, and historical residential billing schedules across regulated investor-owned utilities and retail energy providers.

---

## Primary & Secondary Web Targets

| Role | Target URL | Coverage & Strengths |
|---|---|---|
| **Primary US County/City Granular Target** | [`findenergy.com/electricity/`](https://findenergy.com/electricity/) | Maps coverage areas and effective residential rates of electricity providers by state, county, and city rather than just state averages. Essential for county-level geographic alignment. |
| **Primary Global Country Target** | [`globalpetrolprices.com/electricity_prices/`](https://www.globalpetrolprices.com/electricity_prices/) / [`electricitycostcalc.com`](https://electricitycostcalc.com/) | 40+ countries with residential rates converted to USD, cross-sourced from GlobalPetrolPrices, Ofgem, EIA, and Eurostat. |
| **Tariff Docket & NREL Cross-Check** | [`electricrates.org/`](https://electricrates.org/) & [`electricchoice.com`](https://www.electricchoice.com/electricity-prices-by-state/) | Sources rates from official utility tariffs, EIA monthly state data, and NREL Utility Rate Database. |

---

## Bright Data Scraper Studio Collector Script (`c_pd_electricity_02`)

```javascript
// Bright Data Scraper Studio Parser Definition
async function extractElectricityRates({ page, url }) {
  const records = [];

  // Scrape findenergy.com / globalpetrolprices.com table structures
  const rows = await page.$$('.utility-row, .rate-card, table.dataTable tr, .tariff-item');
  
  for (const row of rows) {
    const utility = await row.$eval('.utility-name, .provider-title, td:nth-child(1)', e => e.textContent.trim()).catch(() => null);
    const rateVal = await row.$eval('.rate-cents, .price-kwh, td:nth-child(2)', e => e.textContent.trim()).catch(() => null);
    const territory = await row.$eval('.service-area, .county-name, td:nth-child(3)', e => e.textContent.trim()).catch(() => null);
    const rateChange = await row.$eval('.change-pct, td:nth-child(4)', e => e.textContent.trim()).catch(() => null);
    const effectiveDate = await row.$eval('.effective-date, td:nth-child(5)', e => e.textContent.trim()).catch(() => new Date().toISOString().split('T')[0]);

    if (utility && rateVal) {
      records.push({
        utility_name: utility,
        raw_rate: rateVal,
        raw_territory: territory,
        raw_rate_change: rateChange,
        effective_date: effectiveDate,
        source_name: url.includes('globalpetrolprices') ? 'globalpetrolprices.com' : 'findenergy.com',
        source_url: url || 'https://findenergy.com/electricity/',
        retrieved_at: new Date().toISOString()
      });
    }
  }
  return records;
}
```

---

## Target JSON Schema Contract
Outputs conform to [`collectors/schemas/electricity.schema.json`](./schemas/electricity.schema.json).
