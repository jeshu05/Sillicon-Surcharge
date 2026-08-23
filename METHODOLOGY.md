# Power Draw — Methodology & Analytical Framework
## Global AI Infrastructure & Electricity Pressure Intelligence

---

## 1. Executive Summary & Core Premise

The rapid global expansion of artificial intelligence infrastructure represents one of the largest concentrated power load additions in modern history. Hyperscale data center campuses routinely demand between **250 MW to upwards of 1.5 GW** of dedicated grid interconnection capacity—equivalent to the power consumption of several hundred thousand homes.

In regions experiencing dense AI clustering, local electric utilities must make substantial capital investments in new high-voltage substations, transmission lines, and generation capacity.

**Power Draw** is an autonomous web intelligence system engineered to continuously monitor:
1. **Large AI / data-center infrastructure announcements and construction permits**
2. **Regulated residential retail electricity tariffs and rate change filings**
3. **Local community median household incomes and economic capacity**

---

## 2. Important Distinction: Correlation vs Causation

> [!IMPORTANT]
> **Power Draw detects spatial and temporal association; it does NOT establish or assert causation.**

Power Draw prominently displays this distinction throughout its user interface and reports:
> *"Power Draw identifies regions where large AI data-center expansion and residential electricity-price pressure overlap. It does not establish causation."*

Utility rate structures are determined through state or national regulatory proceedings influenced by diverse factors including:
- Fuel commodity costs (natural gas, coal)
- Regional grid reliability mandates and legacy transmission debt
- Decarbonization and renewable generation buildouts
- Inflation and storm hardening capital expenditures

Power Draw provides the unified public-interest intelligence necessary for journalists, researchers, policymakers, and communities to investigate these intersections with transparent source attribution.

---

## 3. Mathematical Formulation

### A. Rate Pressure Ratio ($RP$)
Measures the asymmetry between the rate of growth in residential electricity prices and the rate of growth in median household income:

$$RP = \frac{\max(0, \%\Delta \text{ Residential Electricity Rate}_{12\text{mo}})}{\max(0.1, \%\Delta \text{ Median Household Income}_{12\text{mo}})}$$

- When $RP = 1.0\times$, electricity prices and incomes are increasing at identical rates.
- When $RP \ge 2.5\times$, electricity prices are escalating at more than 2.5 times the pace of household income gains.

### B. AI Load Pressure ($AIP$)
Calculates the effective infrastructure load weight across development phases:

$$MW_{\text{eff}} = (\text{Planned MW} \times 1.0) + (\text{Under-Construction MW} \times 0.85) + (\text{Operational MW} \times 0.40)$$

$$AIP = \min\left(100, \frac{MW_{\text{eff}}}{\text{Baseline Regional Capacity Threshold}} \times 100\right)$$

### C. Household Electricity Burden ($\text{Burden}$) & Delta ($\Delta B$)
When average household consumption data is available:

$$\text{Annual Electricity Cost} = \frac{\text{Rate (cents/kWh)} \times \text{Avg Annual Household Consumption (kWh)}}{100}$$

$$\text{Burden} = \frac{\text{Annual Electricity Cost}}{\text{Median Household Income}} \times 100$$

$$\Delta B = \text{Burden}_{\text{current}} - \text{Burden}_{\text{previous}}$$

### D. Composite Power Pressure Score ($PPS \in [0, 100]$)
A calibrated composite index reflecting multifaceted power pressure:

$$PPS = 0.40 \times \text{Norm}(RP) + 0.35 \times \text{Norm}(AIP) + 0.25 \times \text{Norm}(\Delta B)$$

### Pressure Tiers:
| Score Range | Tier Label | Description |
|---|---|---|
| **80 – 100** | **CRITICAL** | High AI expansion, accelerated rate hikes ($\ge 10\%$), asymmetric income growth ($RP \ge 3.0\times$) |
| **60 – 79** | **ELEVATED** | Substantial AI load growth with above-average rate increases ($RP \ge 2.0\times$) |
| **30 – 59** | **WATCH** | Moderate AI development or rate adjustments matching income growth ($RP \approx 1.0\times$) |
| **0 – 29** | **STABLE** | Low infrastructure expansion, steady rates, or income growth exceeding energy costs |

---

## 4. Geographic Resolution & Matching Engine

Disparate public datasets are matched using a 5-tier hierarchical resolution model:

```
Facility / Permit
       │
       ▼
Level 1: Exact County Match (FIPS / County Name)         [Confidence: 0.97]
       │
       ▼
Level 2: Exact City Match (Municipal Hub Alignment)       [Confidence: 0.92]
       │
       ▼
Level 3: Utility Service Territory Overlap                [Confidence: 0.85]
       │
       ▼
Level 4: Metropolitan Statistical Area (MSA)             [Confidence: 0.75]
       │
       ▼
Level 5: State / Sub-National Administrative Fallback     [Confidence: 0.45]
```

---

## 5. Independent Data Confidence Score ($DCS \in [0, 100]$)

Separated from the economic pressure score, the Confidence Score reflects the auditability and completeness of the data:

$$DCS = 0.30 \times \text{Completeness} + 0.25 \times \text{Freshness} + 0.25 \times \text{GeoAccuracy} + 0.20 \times \text{SourceCredibility}$$

- **HIGH:** $\ge 80$
- **MEDIUM:** $55 - 79$
- **LOW:** $< 55$

---

## 6. Discrimination: Data Anomaly vs Scraper Failure

Power Draw strictly distinguishes between extraction errors and real-world statistical anomalies:

1. **Scraper Failure** (Null fields, missing DOM selectors, type drift):
   - Triggers the **Autonomous Self-Healing Pipeline** (`pipeline/heal.js` $\rightarrow$ `bdata scraper heal`).
2. **Data Anomaly** (e.g. rate $> \$1.20/\text{kWh}$ or negative capacity):
   - Quarantined immediately to prevent score distortion.
   - **Never triggers scraper modification.**
   - Retained in `data_quality.json` for human inspection.

---

## 7. Autonomous Self-Healing via Bright Data Scraper Studio

When public websites change their HTML structure:
1. **Detection:** Validation tests output against JSON schema contracts.
2. **Differential Diagnosis:** Expected vs received AST/DOM diff is computed.
3. **Targeted Prompting:** Generates machine-readable repair objective.
4. **Scraper Studio Repair:** Invokes `bdata scraper heal --collector <id>`.
5. **Strict Pre-Approval Verification:** Candidate scraper output is re-tested. Only approved if valid records $\ge 98\%$ and required fields are $100\%$.
6. **Same-Collector ID Preservation:** Scraper is approved with the same collector ID, maintaining pipeline stability.
