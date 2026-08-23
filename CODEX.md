# CODEX — Developer Reference & Architecture Manual

## Bright Data Collectors — DO NOT recreate, heal in place only
- `COLLECTOR_DATACENTERS` = `c_mt5jpgbb1jwdnovfeu` ([`aidatacenterindex.com`](https://aidatacenterindex.com/))
- `COLLECTOR_ENERGY_RATES` = `c_mt5k0hcv20n2v7arut` ([`globalpetrolprices.com`](https://www.globalpetrolprices.com/electricity_prices/))
- `COLLECTOR_DEMOGRAPHICS` = `c_mt5k12zk2qzd5rjm0d` ([`numbeo.com`](https://www.numbeo.com/cost-of-living/))

> Never call `bdata scraper create` again for these three targets. If output looks wrong, call `bdata scraper heal` on the existing ID.

---

## 1. Bright Data CLI Integration (`@brightdata/cli`)

Every command runs on-demand via `npx` with zero global installation overhead:

```bash
# 1. Login & Provision CLI Proxy Zones
npx -y -p @brightdata/cli bdata login

# 2. Check Version
npx -y -p @brightdata/cli bdata --version

# 3. Run Collectors
npx -y -p @brightdata/cli bdata scraper run c_mt5jpgbb1jwdnovfeu https://aidatacenterindex.com/ --pretty
npx -y -p @brightdata/cli bdata scraper run c_mt5k0hcv20n2v7arut https://www.globalpetrolprices.com/electricity_prices/ --pretty
npx -y -p @brightdata/cli bdata scraper run c_mt5k12zk2qzd5rjm0d https://www.numbeo.com/cost-of-living/ --pretty

# 4. Trigger Autonomous AI Scraper Heal
npx -y -p @brightdata/cli bdata scraper heal c_mt5jpgbb1jwdnovfeu "Restore capacity_mw extraction"

# 5. Approve Scraper Fix in Place (Preserves Collector ID)
npx -y -p @brightdata/cli bdata scraper approve c_mt5jpgbb1jwdnovfeu
```

---

## 2. Pipeline Execution Flow

```
┌────────────────────────────────┐
│  LIVE DATA ACQUISITION         │
│  • aidatacenterindex.com       │  ──────►  pipeline/scraper.js
│  • globalpetrolprices.com      │           pipeline/trigger.js
│  • electricchoice.com / numbeo │
└────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────┐
│  SCHEMA CONTRACT VALIDATION    │  ──────►  pipeline/validate.js
│  • 100% JSON Schema Compliance │
└────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────┐
│  MULTI-FORMAT NORMALIZATION    │  ──────►  pipeline/normalize.js
│  • Standardize MW, cents/kWh   │
└────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────┐
│  GEOGRAPHIC RESOLUTION ENGINE  │  ──────►  pipeline/geography.js
│  • 51 Global Hubs Correlated   │
└────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────┐
│  POWER PRESSURE SCORING        │  ──────►  pipeline/metrics.js
│  • PPS (0-100) & Explanations  │
└────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────┐
│  STATIC ARTIFACT GENERATION    │  ──────►  data/watchlist.json
│  • Zero-Backend Dashboard      │           data/history/snapshots.json
└────────────────────────────────┘
```
