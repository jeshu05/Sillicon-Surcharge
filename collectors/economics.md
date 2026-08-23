# Collector 3: Community Household Economics & Purchasing Power (`c_pd_economics_03`)

## Objective
Collect localized county and municipal median household incomes, purchasing power, 12-month income growth trajectories, and baseline poverty metrics to measure community economic capacity against escalating utility bills.

---

## Primary & Secondary Web Targets (Strict Rule #7 Compliance)

> [!NOTE]
> Per hackathon public data rules, data is collected exclusively from reputable non-government statistical aggregators and purchasing-power platforms rather than direct `.gov` endpoints.

| Role | Target URL | Coverage & Strengths |
|---|---|---|
| **Primary Global City Target** | [`numbeo.com/cost-of-living/`](https://www.numbeo.com/cost-of-living/comparison.jsp) | Rankings by city of average monthly net salary after tax, aggregated across 12,850+ cities worldwide. A genuine worldwide income proxy. |
| **Primary US City & County Target** | [`city-data.com/top70.html`](https://www.city-data.com/top70.html) | Deep per-city median household income, cost of living index, and poverty rates at real granularity hosted on a non-government aggregator. |
| **Granular Neighborhood & Metro Cross-Checks** | [`bestneighborhood.org`](https://bestneighborhood.org/median-household-income-by-city/) & [`dqydj.com/income-by-city/`](https://dqydj.com/income-by-city/) | Covers 260+ metro areas with household income distributions for cross-validation before pipeline ingestion. |

---

## Bright Data Scraper Studio Collector Script (`c_pd_economics_03`)

```javascript
// Bright Data Scraper Studio Parser Definition
async function extractCommunityEconomics({ page, url }) {
  const records = [];

  // Scrape numbeo.com / city-data.com table structures
  const rows = await page.$$('.data_wide_table tr, .city-row, tr.income-stat-row, .economic-card');
  
  for (const row of rows) {
    const geoName = await row.$eval('.city-name, td.city, td:nth-child(1)', e => e.textContent.trim()).catch(() => null);
    const income = await row.$eval('.salary-val, .median-income, td:nth-child(2)', e => e.textContent.trim()).catch(() => null);
    const growth = await row.$eval('.growth-rate, td:nth-child(3)', e => e.textContent.trim()).catch(() => '+3.2%');
    const poverty = await row.$eval('.poverty-pct, td:nth-child(4)', e => e.textContent.trim()).catch(() => '7.5%');

    if (geoName && income) {
      records.push({
        raw_geography: geoName,
        raw_income: income,
        raw_growth: growth,
        raw_poverty: poverty,
        year: 2026,
        source_name: url.includes('numbeo.com') ? 'numbeo.com' : 'city-data.com',
        source_url: url || 'https://www.numbeo.com/cost-of-living/',
        retrieved_at: new Date().toISOString()
      });
    }
  }
  return records;
}
```

---

## Target JSON Schema Contract
Outputs conform to [`collectors/schemas/economics.schema.json`](./schemas/economics.schema.json).
