# Bright Data Collectors Architecture — Power Draw

Power Draw uses **Bright Data** as its primary, continuously operating data acquisition layer. Rather than relying on generic web scrapers or manual downloads, Power Draw configures and triggers custom Bright Data Scraper Studio collectors equipped with automated proxy rotation, anti-bot handling, and dynamic structured parsing.

Reference: [Bright Data Scraping Automation Documentation](https://docs.brightdata.com/scraping-automation/introduction)

---

## 1. Overview of Collectors

```
                                  BRIGHT DATA SCRAPER STUDIO
                                               │
               ┌───────────────────────────────┼───────────────────────────────┐
               ▼                               ▼                               ▼
       COLLECTOR 1: AI & DC           COLLECTOR 2: UTILITY           COLLECTOR 3: HOUSEHOLD
          INFRASTRUCTURE                ELECTRICITY RATES                  ECONOMICS
               │                               │                               │
        • aidatacenterindex.com         • globalpetrolprices.com        • numbeo.com
        • 346+ facilities, 64 countries • 100+ countries rates in USD   • 12,850+ global cities
        • Hyperscale Announcements     • Utility Service Boundaries    • Median Net Salary
               │                               │                               │
               └───────────────────────────────┼───────────────────────────────┘
                                               ▼
                                      STRUCTURED JSON STREAM
                                               │
                                               ▼
                                 POWER DRAW VALIDATION & HEAL
```

| Collector | Domain | Target Data & Primary Sources | Output Schema | Refresh Cadence |
|---|---|---|---|---|
| **Collector 1** (`c_mt5jpgbb1jwdnovfeu`) | AI / Hyperscale Infrastructure | [`aidatacenterindex.com/datacenters/`](https://aidatacenterindex.com/datacenters/) (346+ facilities, 64 countries) | [`datacenter.schema.json`](./schemas/datacenter.schema.json) | Daily |
| **Collector 2** (`c_mt5k0hcv20n2v7arut`) | Residential Electricity Tariffs | [`globalpetrolprices.com/electricity_prices/`](https://www.globalpetrolprices.com/electricity_prices/) (100+ countries in USD), [`findenergy.com`](https://findenergy.com) | [`electricity.schema.json`](./schemas/electricity.schema.json) | Daily / Weekly |
| **Collector 3** (`c_mt5k12zk2qzd5rjm0d`) | Community Economics | [`numbeo.com/cost-of-living/prices_by_country.jsp`](https://www.numbeo.com/cost-of-living/prices_by_country.jsp) (12,850+ global cities) | [`economics.schema.json`](./schemas/economics.schema.json) | Monthly / Quarterly |

---

## 2. Bright Data CLI Commands (`@brightdata/cli`)

Run any collector on demand with clean JSON output:

```bash
# 1. Run AI Data Center Collector
npx -y -p @brightdata/cli bdata scraper run c_mt5jpgbb1jwdnovfeu https://aidatacenterindex.com/datacenters/ --pretty

# 2. Run Global Electricity Rates Collector
npx -y -p @brightdata/cli bdata scraper run c_mt5k0hcv20n2v7arut https://www.globalpetrolprices.com/electricity_prices/ --pretty

# 3. Run Global Economics Collector
npx -y -p @brightdata/cli bdata scraper run c_mt5k12zk2qzd5rjm0d https://www.numbeo.com/cost-of-living/prices_by_country.jsp --pretty
```

---

## 3. Autonomous Self-Healing Workflow

When a public web source modifies its DOM layout or css selectors, Power Draw detects the schema contract violation immediately and initiates the automated Bright Data repair cycle:

```
1. FAILURE DETECTED:
   Collector output misses required field 'residential_rate_cents_kwh'
   ↓
2. DIFFERENTIAL DIAGNOSIS:
   pipeline/heal.js calculates expected contract vs actual output diff
   ↓
3. HEAL INVOCATION:
   bdata scraper heal c_mt5k0hcv20n2v7arut "Update selector for residential rate"
   ↓
4. VERIFICATION TEST:
   pipeline/validate.js evaluates test output from candidate scraper
   ↓
5. CONDITIONAL APPROVAL:
   Only if valid_count / total_count > 95% and required_fields == 100%,
   pipeline executes 'bdata scraper approve c_mt5k0hcv20n2v7arut'
   ↓
6. AUDIT LOGGING:
   Logged to data/heal_log.json for complete transparency
```

---

## 4. Compliance & Ethical Web Intelligence

In strict accordance with the WeMakeDevs "Into the Scrape-Verse" hackathon guidelines:
- **No Paywalled / Login Content:** Only publicly accessible infrastructure notices, news, and utility tariff rate filings are indexed.
- **No Personal Data Collected:** Only macro-economic county indicators, utility companies, and corporate infrastructure projects are captured.
- **Source Transparency:** Every data point preserves its original public `source_url` and retrieval timestamp.
