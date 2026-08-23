# Collector 1: AI & Hyperscale Infrastructure (`c_pd_datacenters_01`)

## Objective
Continuously monitor, extract, and normalize major global AI campus and data-center project announcements, active construction permits, and operational capacity from verified public sources.

---

## Primary & Secondary Web Targets

| Role | Target URL | Coverage & Strengths |
|---|---|---|
| **Primary Global Target** | [`aidatacenterindex.com`](https://aidatacenterindex.com/) | Structured global index tracking 346+ facilities across 64 countries with per-project fields (operator, location, MW power capacity, readiness %, status). |
| **Secondary US Cross-Check** | [`valueaddvc.com/ai-buildout-tracker`](https://valueaddvc.com/ai-buildout-tracker) | Tracks 74+ new AI-focused facilities breaking ground in 2026 across 28 states, with capex and workload specialization. |
| **Narrative Timeline Source** | [`blackridgeresearch.com`](https://www.blackridgeresearch.com/blog/upcoming-largest-data-center-projects-in-united-states-usa) | Captures project narrative detail, financing dockets, and substation expansion schedules. |

---

## Bright Data Scraper Studio Collector Script (`c_pd_datacenters_01`)

```javascript
// Bright Data Scraper Studio Parser Definition
async function extractDataCenter({ page, url }) {
  const records = [];

  // Scrape aidatacenterindex.com / valueaddvc.com layout
  const rows = await page.$$('.facility-card, .table-row, tr.project-row, .datacenter-item');
  
  for (const el of rows) {
    const name = await el.$eval('.project-name, .facility-title, td:nth-child(1)', e => e.textContent.trim()).catch(() => null);
    const operator = await el.$eval('.operator-name, .company, td:nth-child(2)', e => e.textContent.trim()).catch(() => 'Undisclosed');
    const location = await el.$eval('.location-text, .region-tag, td:nth-child(3)', e => e.textContent.trim()).catch(() => null);
    const capacity = await el.$eval('.capacity-mw, .power-rating, td:nth-child(4)', e => e.textContent.trim()).catch(() => null);
    const status = await el.$eval('.status-badge, td:nth-child(5)', e => e.textContent.trim()).catch(() => 'planned');
    const aiWorkload = await el.$eval('.ai-tag, .specialization', e => e.textContent.trim()).catch(() => 'high');

    if (name && (capacity || location)) {
      records.push({
        raw_name: name,
        raw_operator: operator,
        raw_location: location,
        raw_capacity: capacity,
        raw_status: status,
        raw_ai_classification: aiWorkload,
        source_name: 'aidatacenterindex.com',
        source_url: url || 'https://aidatacenterindex.com/',
        retrieved_at: new Date().toISOString()
      });
    }
  }
  return records;
}
```

---

## Target JSON Schema Contract
Outputs conform to [`collectors/schemas/datacenter.schema.json`](./schemas/datacenter.schema.json).
