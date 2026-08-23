# Silicon Surcharge

### Global AI Infrastructure & Electricity Pressure Intelligence Observatory

> **An empirical research observatory monitoring where hyperscale AI expansion geographically coincides with rising residential electricity tariffs and community economic vulnerability.**

[![Bright Data Scraper Studio](https://img.shields.io/badge/Bright_Data-Scraper_Studio-black?style=for-the-badge&logo=databricks)](https://brightdata.com)
[![Architecture](https://img.shields.io/badge/Architecture-Static--First_Pipeline-black?style=for-the-badge)](./ARCHITECTURE.md)
[![Tests](https://img.shields.io/badge/Tests-25%2F25_Passing-black?style=for-the-badge)](./tests/)
[![License](https://img.shields.io/badge/License-MIT-black?style=for-the-badge)](./LICENSE)

---

## 1. About the Project

### The Problem
The rapid acceleration of generative AI and hyperscale cloud computing has triggered unprecedented electricity demand. State-of-the-art supercomputing campuses routinely require **500 MW to 1.5+ GW** of dedicated electrical capacity—comparable to the energy consumption of major metropolitan areas.

When massive energy-intensive computing clusters concentrate in specific regional power grids, utilities must execute multi-billion-dollar infrastructure buildouts (substations, high-voltage transmission lines, and generation capacity). In many regulatory jurisdictions, these capital costs enter the general rate base, potentially placing upward pressure on retail residential electricity tariffs.

### The Solution: Silicon Surcharge
**Silicon Surcharge** is an open, empirical research observatory that continuously aggregates, normalizes, and correlates three disparate public data streams across 83 regions and 64 countries:
1. **AI & Data Center Infrastructure:** Project names, MW capacities, development statuses, and operators extracted from public interconnection registries.
2. **Retail Electricity Tariffs:** Multi-year residential electricity prices ($/kWh) and historical utility rate schedules.
3. **Community Economics:** Regional median household earnings and baseline economic indicators.

By combining these signals into a transparent, calibrated **Power Pressure Score (0–100)** and providing complete cryptographic source provenance, Silicon Surcharge empowers researchers, policymakers, and communities with hard empirical evidence.

---

## 2. Critical Analytical Principle: Non-Causality

> [!IMPORTANT]
> **Silicon Surcharge identifies regions where large AI data-center expansion and residential electricity-price pressure geographically and temporally coincide. It does NOT claim or establish causation.**
>
> Electricity rates are determined by statutory Public Utility Commissions (PUCs) based on multifaceted factors including generation fuel price volatility, transmission grid upgrades, weatherization, grid decarbonization mandates, and inflation. Silicon Surcharge surfaces the empirical public-interest correlation needed for informed investigation.

---

## 3. Tech Stack

Silicon Surcharge is built using a modern, minimalist, high-performance stack designed for zero latency, zero backend maintenance, and 100% data auditability:

| Layer | Technologies & Tools | Rationale |
|---|---|---|
| **Data Acquisition** | **Bright Data Scraper Studio & CLI (`bdata`)** | Managed proxies, automated anti-bot bypass, structured JSON schema extraction across 3 public web targets. |
| **Autonomous Self-Healing** | **Bright Data Heal API (`bdata scraper heal` & `approve`)** | Automatically detects broken DOM selectors upon website layout changes, repairs extraction logic, and maintains the collector contract. |
| **Pipeline Engine** | **Node.js ESM (Pure Native, Zero Dependencies)** | High-throughput data ingestion, schema validation, fuzzy geographic matching, and mathematical scoring. |
| **Frontend UI** | **Vanilla HTML5, Pure CSS, Native JavaScript** | Zero framework bloat, sub-100ms load times, high-contrast monochrome design, responsive layouts. |
| **Spatial Intelligence** | **Leaflet.js & CartoDB Dark Matter** | Hardware-accelerated canvas map rendering, buffered tile preloading, custom pulse indicators. |
| **Testing & Quality** | **Node.js Native Test Runner (`node --test`)** | 25/25 comprehensive unit and contract tests verifying normalization, scoring, provenance, and self-healing. |
| **Hosting & Deployment** | **Static-First (GitHub Pages / Netlify / Vercel)** | Pre-compiled JSON intelligence files served with zero runtime server costs and global edge CDN caching. |

---

## 4. System Architecture

Silicon Surcharge operates on a **deterministic static-first pipeline architecture**:

```
                              BRIGHT DATA WEB SCRAPING
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        ▼                                ▼                                ▼
  DATA CENTERS                      ELECTRICITY                       ECONOMICS
Collector: c_mt5jpgbb1jwdnovfeu   Collector: c_mt5k0hcv20n2v7arut   Collector: c_mt5k12zk2qzd5rjm0d
Target: aidatacenterindex.com      Target: globalpetrolprices.com    Target: numbeo.com / Census
        │                                │                                │
        └────────────────────────────────┼────────────────────────────────┘
                                         ▼
                             SCHEMA CONTRACT VALIDATION
                                         │
                             ┌───────────┴───────────┐
                           VALID                   INVALID
                             │                       │
                             │                       ▼
                             │             Diagnostic Failure Engine
                             │                       │
                             │             `bdata scraper heal`
                             │                       │
                             │            Contract Verification (>98%)
                             │                       │
                             │            `bdata scraper approve`
                             │                       │
                             └───────────┬───────────┘
                                         ▼
                             MULTI-SOURCE NORMALIZATION
                                         │
                                         ▼
                            GEOGRAPHIC SPATIAL JOIN ENGINE
                                         │
                                         ▼
                            POWER PRESSURE SCORING (0-100)
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        ▼                                ▼                                ▼
  watchlist.json                history/snapshots.json              heal_log.json
        │                                │                                │
        └────────────────────────────────┼────────────────────────────────┘
                                         ▼
                             STATIC DASHBOARD (MONOCHROME)
                           Leaflet.js + Spatial Evidence Dossiers
```

### The 3 Bright Data Collectors

| Collector | Domain | Target Data Source | Schema Contract | Update Frequency |
|---|---|---|---|---|
| `c_mt5jpgbb1jwdnovfeu` | AI Data Centers | [aidatacenterindex.com](https://aidatacenterindex.com/datacenters/) (346+ facilities, 64 countries) | `datacenter.schema.json` | Daily |
| `c_mt5k0hcv20n2v7arut` | Utility Tariffs | [globalpetrolprices.com](https://www.globalpetrolprices.com/electricity_prices/) & utility filings | `electricity.schema.json` | Weekly |
| `c_mt5k12zk2qzd5rjm0d` | Household Economics | [numbeo.com](https://www.numbeo.com/cost-of-living/prices_by_country.jsp) & US Census | `economics.schema.json` | Monthly |

---

## 5. Mathematical Scoring Framework

The **Power Pressure Score ($PPS \in [0, 100]$)** combines three weighted empirical components:

$$PPS = 0.40 \times \text{Norm}(RP) + 0.35 \times \text{Norm}(AIP) + 0.25 \times \text{Norm}(\text{Burden Delta})$$

### 1. Rate Pressure Ratio ($RP$)
$$\text{Rate Pressure Ratio} = \frac{\Delta \text{Residential Electricity Rate (12-Month \%)}}{\max(0.1, \Delta \text{Median Household Income (12-Month \%)})}$$

```
Rate Pressure Ratio = %Δ Residential Electricity Rate (12-Month) / max(0.1, %Δ Median Household Income (12-Month))
```

### 2. Effective AI Load ($MW_{\text{eff}}$) & Pressure ($AIP$)
$$MW_{\text{eff}} = (\text{Planned MW} \times 1.0) + (\text{Under-Construction MW} \times 0.85) + (\text{Operational MW} \times 0.40)$$
$$AIP = \min\left(100, \frac{MW_{\text{eff}}}{\text{Baseline Capacity Threshold}} \times 100\right)$$

### 3. Classification Tiers
- **HIGH CONVERGENCE (80–100):** Rapid multi-gigawatt AI buildout coinciding with electricity rate growth significantly outpacing income growth.
- **ELEVATED (60–79):** Substantial computing growth with above-average utility rate increases.
- **WATCH (30–59):** Moderate data center development; utility rate trajectories tracking local wage growth.
- **BASELINE (0–29):** Stable electricity prices and balanced infrastructure load.

---

## 6. Project Structure

```
Scrapeverse/
├── collectors/                # Collector documentation and JSON schema contracts
│   ├── datacenters.md
│   ├── electricity.md
│   ├── economics.md
│   └── schemas/               # Strict validation JSON schemas
├── data/
│   ├── current/               # Normalized raw collector outputs
│   ├── history/               # Multi-year historical snapshot records
│   ├── watchlist.json         # Scored regional intelligence dataset (83 regions)
│   └── heal_log.json          # Autonomous repair and telemetry event log
├── pipeline/                  # Node.js ESM deterministic pipeline modules
│   ├── brightdata.js          # Bright Data SDK, REST API, & CLI bindings
│   ├── geographic.js          # Multi-tier fuzzy spatial join engine
│   ├── heal.js                # Autonomous scraper healing loop
│   ├── historical_rates.js    # Historical rate delta calculation
│   ├── normalize.js           # Multi-format cleaning & unit normalizer
│   ├── provenance.js          # Cryptographic hashing & audit trails
│   ├── run.js                 # Pipeline orchestration controller
│   ├── score.js               # Mathematical pressure scoring engine
│   ├── scraper.js             # Collector execution and validation
│   └── validate.js            # JSON schema validation engine
├── site/                      # Pure Vanilla static intelligence dashboard
│   ├── index.html             # Main dashboard structure & modals
│   ├── styles.css             # High-contrast monochrome design system
│   └── app.js                 # Leaflet spatial map controller & UI logic
├── scripts/
│   ├── seed.js                # Offline development fixtures & fallback dataset
│   └── serve.js               # Zero-dependency local development server
├── tests/                     # 25 automated unit and contract tests
│   ├── geographic.test.js
│   ├── heal.test.js
│   ├── historical_rates.test.js
│   ├── normalize.test.js
│   ├── score.test.js
│   └── validate.test.js
├── ARCHITECTURE.md            # Detailed technical architectural specification
├── METHODOLOGY.md             # In-depth scientific & analytical methodology
└── package.json               # Project manifest and test scripts
```

---

## 7. Quick Start & Execution

### Prerequisites
- Node.js $\ge 18.0.0$
- npm

### Installation & Local Run

```bash
# 1. Clone the repository
git clone https://github.com/your-username/Silicon-Surcharge.git
cd Silicon-Surcharge

# 2. (Optional) Set Bright Data API Credentials
export BRIGHT_DATA_API_KEY=your_token_here

# 3. Seed baseline datasets and execute the intelligence pipeline
npm run seed
npm run pipeline

# 4. Run automated test suite (25/25 passing)
npm test

# 5. Launch local development server
npm run serve
```

Open **`http://localhost:3000`** in your browser to view the live dashboard.

---

## 8. License

MIT License — Copyright (c) 2026 Silicon Surcharge Contributors.
