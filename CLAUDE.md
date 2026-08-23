# Power Draw — Developer & Agent Operating Codex

## Bright Data Collectors — DO NOT recreate, heal in place only
- `COLLECTOR_DATACENTERS` = `c_mt5jpgbb1jwdnovfeu` ([`aidatacenterindex.com`](https://aidatacenterindex.com/datacenters/))
- `COLLECTOR_ENERGY_RATES` = `c_mt5k0hcv20n2v7arut` ([`globalpetrolprices.com`](https://www.globalpetrolprices.com/electricity_prices/))
- `COLLECTOR_DEMOGRAPHICS` = `c_mt5k12zk2qzd5rjm0d` ([`numbeo.com`](https://www.numbeo.com/cost-of-living/prices_by_country.jsp))

> **CRITICAL RULE:** Never call `bdata scraper create` again for these three targets. If output looks wrong or schema drifts, call `bdata scraper heal` on the existing ID and then `bdata scraper approve <id>`.

---

## 1. Collector Configurations & Bright Data Identifiers

| Collector ID | Domain | Target Public Sources | Target Schema | Frequency |
|---|---|---|---|---|
| `c_mt5jpgbb1jwdnovfeu` | AI & Hyperscale Infrastructure | `aidatacenterindex.com/datacenters/` | `collectors/schemas/datacenter.schema.json` | Daily |
| `c_mt5k0hcv20n2v7arut` | Utility Residential Electricity Rates | `globalpetrolprices.com/electricity_prices/` | `collectors/schemas/electricity.schema.json` | Daily / Weekly |
| `c_mt5k12zk2qzd5rjm0d` | Community Household Economics | `numbeo.com/cost-of-living/prices_by_country.jsp` | `collectors/schemas/economics.schema.json` | Monthly / Quarterly |

---

## 2. Core Operational Directives

1. **One-Time Setup (No Install Needed):**
   ```bash
   npx -y -p @brightdata/cli bdata login
   npx -y -p @brightdata/cli bdata --version
   ```

2. **The 3 CLI Commands That Do Everything:**
   - **Run:** `npx -y -p @brightdata/cli bdata scraper run <collector_id> <url> --pretty`
   - **Heal:** `npx -y -p @brightdata/cli bdata scraper heal <collector_id> "<what broke>"`
   - **Approve:** `npx -y -p @brightdata/cli bdata scraper approve <collector_id>`

3. **Strict Verification Threshold:**
   - Never approve a repaired scraper based solely on a successful CLI return code.
   - Validate that candidate output reaches $\ge 95\%$ valid records and $100\%$ required fields before approving.

4. **Separate Anomalies From Failures:**
   - `rate = null` $\rightarrow$ Scraper failure $\rightarrow$ Trigger heal.
   - `rate = $18.72/kWh` $\rightarrow$ Data anomaly $\rightarrow$ Flag and quarantine (do not heal).

5. **Zero-Backend Static Deployment:**
   - The pipeline writes JSON datasets to `data/`.
   - The web dashboard in `site/` consumes these static JSON files directly with zero server dependencies.

---

## 3. Key CLI & Pipeline Commands

```bash
# Bright Data Scraper Studio commands
npm run bdata:version
npm run bdata:run:datacenters
npm run bdata:run:electricity
npm run bdata:run:economics
npm run bdata:heal:datacenters
npm run bdata:heal:electricity

# Pipeline execution
npm run pipeline

# Tests & validation
npm test
npm run validate

# Local web dashboard
npm run serve
```
