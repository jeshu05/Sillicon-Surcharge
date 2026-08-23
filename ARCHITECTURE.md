# Silicon Surcharge — Technical Architecture & System Design

This document details the engineering design, component interactions, data pipeline flow, and autonomous self-healing architecture of the **Silicon Surcharge** intelligence observatory.

---

## 1. Architectural Philosophy

Silicon Surcharge is built around three foundational design tenets:

1. **Static-First & Zero-Backend Reliability:**
   - The intelligence dashboard requires zero active database connections, zero runtime application servers, and zero compute overhead during user access.
   - All compute (data acquisition, validation, normalization, fuzzy spatial matching, scoring, and cryptographic provenance tagging) occurs during the **pipeline run phase**.
   - Outputs are compiled into static, immutable JSON documents (`watchlist.json`, `snapshots.json`, `heal_log.json`) that can be hosted on any static CDN (GitHub Pages, Netlify, Cloudflare Pages, AWS S3) with global sub-100ms response times.

2. **Strict Schema Contracts & Autonomous Resilience:**
   - External web scraping targets frequently change their HTML/DOM layouts.
   - Silicon Surcharge treats web scrapers as strict typed API contracts defined by JSON schemas. When a web target changes, the pipeline **autonomously diagnoses broken DOM selectors**, invokes Bright Data Scraper Studio's self-healing engine (`bdata scraper heal`), verifies the candidate repair output, and approves the fix automatically.

3. **Complete Empirical Provenance & Transparency:**
   - Every metric displayed on the dashboard includes raw cryptographic source provenance: target URL, collector ID, exact retrieval timestamp, and SHA-256 data hash.
   - Non-causal analytics are strictly enforced: the system surfaces empirical *spatial and temporal association* without asserting causality.

---

## 2. System Architecture & End-to-End Data Flow

```
[ Public Web Sources ]
  - aidatacenterindex.com
  - globalpetrolprices.com
  - numbeo.com / US Census
            │
            ▼
[ Bright Data Scraper Studio (Collectors) ]
  - c_mt5jpgbb1jwdnovfeu (AI Data Centers)
  - c_mt5k0hcv20n2v7arut (Electricity Rates)
  - c_mt5k12zk2qzd5rjm0d (Household Economics)
            │
            ▼
[ Raw Extraction Batch ]
            │
            ▼
[ Schema Contract Validator ] ──(Invalid)──► [ Autonomous Heal Loop ]
  (JSON Schema Draft-07)                       - Diagnose broken selector
            │                                  - `bdata scraper heal`
         (Valid)                               - Contract verification (>98%)
            │                                  - `bdata scraper approve`
            │◄─────────────────────────────────┘
            ▼
[ Multi-Format Normalizer ]
  - MW unit parsing & cleaning
  - $/kWh currency conversion
  - Annual income standardizations
            │
            ▼
[ Geographic Spatial Join Engine ]
  - Tier 1: Canonical Geo ID exact match
  - Tier 2: State/Province & Country match
  - Tier 3: Metropolitan & County cluster centroid fuzzy match
            │
            ▼
[ Historical Rate Delta Engine ]
  - Multi-year snapshot comparisons
  - 12-month authentic electricity rate delta computation
            │
            ▼
[ Power Pressure Scoring Engine ]
  - Rate Pressure Ratio ($RP$)
  - Effective AI Load ($AIP$)
  - Burden Delta & Normalization
  - Composite Power Pressure Score ($PPS \in [0, 100]$)
  - Explainable "Why Flagged" narrative synthesis
            │
            ▼
[ Cryptographic Provenance Stamping ]
  - SHA-256 batch fingerprinting
  - Collector attribution & verification status
            │
            ▼
[ Artifact Generation ]
  - data/watchlist.json (83 regions)
  - data/history/snapshots.json
  - data/heal_log.json
            │
            ▼
[ Static Frontend Dashboard ]
  - Vanilla HTML5 / Pure CSS (Monochrome Theme)
  - Leaflet.js Spatial Map
  - Interactive SVG Multi-Year Trajectory Charts
  - Evidence Dossier Inspection Drawer
```

---

## 3. Core Pipeline Components

### A. Data Acquisition (`pipeline/scraper.js`, `pipeline/brightdata.js`)
- Interfaces with Bright Data REST API and `@brightdata/cli` tools.
- Executes scraping requests across the 3 dedicated collectors with automated proxy rotation and anti-bot handling.
- Implements resilient fallbacks and structured error logging.

### B. Validation & Autonomous Self-Healing (`pipeline/validate.js`, `pipeline/heal.js`)
- Validates extracted batches against strict JSON Schemas (`collectors/schemas/*.json`).
- If validation failure rate exceeds threshold ($> 15\%$), triggers the **Self-Healing Loop**:
  1. `generateRepairDiagnosis(collectorId, validationResults)`: Analyzes broken fields across records.
  2. Synthesizes a structured natural-language repair objective for Bright Data Scraper Studio.
  3. Executes `bdata scraper heal <collector_id> --prompt "<prompt>"`.
  4. Runs a verification test against the newly healed extractor candidate.
  5. If candidate pass rate exceeds $98\%$, automatically approves the fix via `bdata scraper approve <collector_id>`.
  6. Logs the repair event with timestamp and field diagnostics into `data/heal_log.json`.

### C. Multi-Source Normalization (`pipeline/normalize.js`)
- Handles noisy real-world web data formats:
  - **Capacities:** Converts strings like `"1.2 GW"`, `"750MW"`, `"50,000 kW"` into standardized numeric Megawatts (`MW`).
  - **Electricity Rates:** Normalizes $/kWh, cents/kWh, EUR/kWh, and national currencies into standardized `cents_per_kwh`.
  - **Income & Economics:** Parses currency symbols (`$`, `€`, `£`), commas, and annual vs monthly figures into standardized annual USD figures.
  - **Workload Specialization:** Classifies data centers by AI specialization (GPU superclusters vs general cloud colocation) based on infrastructure metadata.

### D. Geographic Spatial Join Engine (`pipeline/geographic.js`)
- Solves the complex problem of joining data across different spatial granularities (e.g. facility-level coordinates, utility service territories, county lines, and national economic aggregates).
- Employs a 3-tier hierarchical resolution strategy:
  - **Tier 1 (High Confidence):** Exact match on canonical `geography_id` (e.g. `geo_us_va_loudoun`).
  - **Tier 2 (Medium-High Confidence):** Match on ISO-3166-1 alpha-2 country code + state/province postal abbreviation.
  - **Tier 3 (Centroid Matching):** Coordinate radius distance matching against global data center cluster centroids (e.g. Northern Virginia, Dublin, Frankfurt, Slough, Tokyo, Mumbai).

### E. Historical Rate Analysis (`pipeline/historical_rates.js`, `pipeline/history.js`)
- Compares incoming electricity rate schedules against historical rate snapshots stored in `data/history/snapshots.json`.
- Accurately computes true 12-month trailing rate percentage changes ($\Delta\text{Rate \%}$) for each monitored utility territory.

### F. Mathematical Scoring & Explainability (`pipeline/score.js`)
- Computes the calibrated **Power Pressure Score (0–100)**.
- Generates 5 human-readable, data-backed explainability bullet points per region (`why_flagged`), eliminating "black box" scoring.

---

## 4. Frontend Architecture (`site/`)

The user interface is built as a zero-dependency, ultra-lightweight, high-contrast dashboard:

```
site/
├── index.html       # Clean semantic HTML5 markup with accessible ARIA tags
├── styles.css       # Custom monochrome design system (pure CSS, zero frameworks)
└── app.js           # Client-side spatial intelligence controller (Leaflet.js)
```

### Key Frontend Features:
- **Zero Framework Overhead:** Written in pure Vanilla JavaScript (ESM) with instant parsing and zero compilation pipeline.
- **High-Performance Spatial Map:** Built with Leaflet.js and CartoDB Dark Matter tiles, utilizing canvas rendering, hardware acceleration, and buffered tile caching (`keepBuffer: 16`).
- **Modal Overlay System:** All drill-down dossiers, platform overviews, and mathematical methodology documents render in dedicated modal dialogs that preserve full screen height without causing map layout reflows.
- **Monochrome Design System:** Built with pure black (`#000000`), deep charcoal surfaces (`#121215`), white borders, and high-contrast typography (`#ffffff`, `#a1a1aa`, `#71717a`).

---

## 5. Security, Provenance & Privacy

1. **Zero User PII:** The observatory strictly collects public, aggregated macroeconomic and infrastructure signals. No personal user data is ever tracked or stored.
2. **Cryptographic Provenance:** Every record generated by the pipeline contains an immutable provenance object:
   ```json
   {
     "facilities_source": "aidatacenterindex.com",
     "facilities_collector": "c_mt5jpgbb1jwdnovfeu",
     "electricity_source": "globalpetrolprices.com",
     "electricity_collector": "c_mt5k0hcv20n2v7arut",
     "economics_source": "numbeo.com",
     "economics_collector": "c_mt5k12zk2qzd5rjm0d",
     "retrieved_at": "2026-08-23T18:00:00.000Z",
     "data_hash": "sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069"
   }
   ```
3. **Transparent Simulation Tagging:** If fallback fixture data is used (e.g. offline development), every record is stamped with `is_simulated: true` and clearly rendered in the UI with a `[FALLBACK]` badge.

---

## 6. Automated Testing Strategy (`tests/`)

The test suite runs using the Node.js native test runner (`node --test`), requiring zero third-party testing dependencies:

| Test File | Verification Scope | Tests |
|---|---|---|
| `geographic.test.js` | Fuzzy matching, coordinate lookup, country code normalization | 7 |
| `heal.test.js` | Failure diagnosis synthesis, autonomous repair execution | 2 |
| `historical_rates.test.js` | Trailing 12-month rate deltas, baseline fallback handling | 2 |
| `score.test.js` | Formula calibration, ratio calculations, explainability narratives | 5 |
| `normalize.test.js` | MW units, currency formats, percentages, workload classification | 7 |
| `validate.test.js` | JSON schema validation, anomaly detection, threshold triggers | 2 |
| **Total** | **Full End-to-End Pipeline & Contract Verification** | **25 / 25 Passing** |
