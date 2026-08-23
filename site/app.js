/**
 * Power Draw — Frontend Application & Spatial Intelligence Controller
 * Minimalist Monochrome & High-Contrast Intelligence Dashboard
 */

// Application State
const state = {
  watchlist: [],
  history: {},
  healLog: {},
  quality: {},
  map: null,
  markers: [],
  selectedRegion: null,
  searchQuery: '',
  continentFilter: 'ALL',
  tierFilter: 'ALL',
  sortFilter: 'SCORE_DESC'
};

// Continent Mapping
const CONTINENT_MAP = {
  EUROPE: ['IE', 'DE', 'GB', 'NL', 'FR', 'ES', 'SE', 'NO', 'IT', 'CH', 'PL', 'FI'],
  APAC: ['IN', 'AU', 'JP', 'SG', 'KR', 'MY', 'ID', 'TW', 'TH', 'VN', 'NZ', 'PH'],
  CHINA: ['CN', 'HK', 'MO'],
  AFRICA_ME: ['ZA', 'KE', 'NG', 'EG', 'AE', 'SA', 'QA', 'BH', 'OM', 'KW', 'IL', 'TR'],
  RUSSIA: ['RU', 'KZ', 'BY', 'UZ', 'GE', 'AM'],
  LATAM: ['BR', 'CA', 'MX', 'CL', 'AR', 'CO', 'PE', 'CR'],
  NA: ['US']
};

const CONTINENT_CENTERS = {
  ALL: { center: [25.0, 10.0], zoom: 3 },
  EUROPE: { center: [52.0, 10.0], zoom: 4 },
  APAC: { center: [5.0, 100.0], zoom: 3.5 },
  CHINA: { center: [35.0, 105.0], zoom: 4 },
  AFRICA_ME: { center: [5.0, 35.0], zoom: 3.5 },
  RUSSIA: { center: [58.0, 60.0], zoom: 3.5 },
  LATAM: { center: [5.0, -75.0], zoom: 3 },
  NA: { center: [38.0, -97.0], zoom: 4 }
};

// DOM References
const dom = {
  btnOpenOverview: document.getElementById('btn-open-overview'),
  overviewOverlay: document.getElementById('overview-modal-overlay'),
  btnCloseOverview: document.getElementById('btn-close-overview'),

  statRegions: document.getElementById('stat-regions-count'),
  statCapacity: document.getElementById('stat-capacity-gw'),
  statCritical: document.getElementById('stat-critical-count'),
  watchlistFeed: document.getElementById('watchlist-feed'),
  searchInput: document.getElementById('search-input'),
  continentFilter: document.getElementById('continent-filter'),
  tierFilter: document.getElementById('tier-filter'),
  sortFilter: document.getElementById('sort-filter'),
  btnRecenter: document.getElementById('btn-recenter-map'),
  
  // Drawer
  regionOverlay: document.getElementById('region-modal-overlay'),
  drawerTitle: document.getElementById('drawer-region-title'),
  drawerSubtitle: document.getElementById('drawer-region-subtitle'),
  drawerScoreNum: document.getElementById('drawer-score-num'),
  drawerScoreCircle: document.getElementById('drawer-score-circle'),
  drawerTierBadge: document.getElementById('drawer-tier-badge'),
  drawerAiComp: document.getElementById('drawer-ai-component'),
  drawerAiFill: document.getElementById('drawer-ai-fill'),
  drawerRateComp: document.getElementById('drawer-rate-component'),
  drawerRateFill: document.getElementById('drawer-rate-fill'),
  drawerBurdenComp: document.getElementById('drawer-burden-component'),
  drawerBurdenFill: document.getElementById('drawer-burden-fill'),
  drawerWhyFlagged: document.getElementById('drawer-why-flagged'),
  drawerStatMw: document.getElementById('drawer-stat-mw'),
  drawerStatMwSub: document.getElementById('drawer-stat-mw-sub'),
  drawerStatRate: document.getElementById('drawer-stat-rate'),
  drawerStatRateSub: document.getElementById('drawer-stat-rate-sub'),
  drawerStatIncome: document.getElementById('drawer-stat-income'),
  drawerStatIncomeSub: document.getElementById('drawer-stat-income-sub'),
  drawerStatRatio: document.getElementById('drawer-stat-ratio'),
  drawerStatRatioSub: document.getElementById('drawer-stat-ratio-sub'),
  drawerTimelineSvg: document.getElementById('drawer-timeline-svg'),
  drawerFacilitiesTbody: document.getElementById('drawer-facilities-tbody'),
  drawerProvenanceGrid: document.getElementById('drawer-provenance-grid'),
  btnCloseDrawer: document.getElementById('btn-close-drawer'),

  // Methodology
  btnOpenMethodology: document.getElementById('btn-open-methodology'),
  methodologyOverlay: document.getElementById('methodology-modal-overlay'),
  btnCloseMethodology: document.getElementById('btn-close-methodology')
};

/**
 * Initialize Dashboard
 */
async function init() {
  initMap();
  setupEventListeners();
  await loadData();
  renderDashboard();
}

/**
 * Initialize Leaflet Map
 */
function initMap() {
  state.map = L.map('leaflet-map', {
    center: [25.0, 0.0],
    zoom: 2.8,
    minZoom: 2,
    maxZoom: 14,
    zoomControl: false,
    attributionControl: true,
    worldCopyJump: true,
    preferCanvas: true,
    inertia: true,
    inertiaDeceleration: 3000
  });

  // Position zoom controls at bottom-right
  L.control.zoom({ position: 'bottomright' }).addTo(state.map);

  // Pure Monochrome Dark Map Tiles with large tile buffer and continuous movement rendering
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd',
    maxZoom: 19,
    keepBuffer: 16,
    updateWhenIdle: false,
    updateWhenZooming: true,
    updateInterval: 100,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
  }).addTo(state.map);

  // Ensure Leaflet tile calculations match dynamic viewport height immediately and on resize
  setTimeout(() => state.map && state.map.invalidateSize(), 50);
  setTimeout(() => state.map && state.map.invalidateSize(), 250);
  setTimeout(() => state.map && state.map.invalidateSize(), 600);
  window.addEventListener('resize', () => state.map && state.map.invalidateSize());
}

/**
 * Load Datasets from JSON files
 */
async function loadData() {
  try {
    const [watchRes, histRes, healRes, qualRes] = await Promise.all([
      fetch('./data/watchlist.json').then(r => r.json()).catch(() => []),
      fetch('./data/history/snapshots.json').then(r => r.json()).catch(() => ({ regions: {} })),
      fetch('./data/heal_log.json').then(r => r.json()).catch(() => ({ summary: {}, events: [] })),
      fetch('./data/data_quality.json').then(r => r.json()).catch(() => ({}))
    ]);

    state.watchlist = Array.isArray(watchRes) ? watchRes : [];
    state.history = histRes.regions || {};
    state.healLog = healRes || { summary: {}, events: [] };
    state.quality = qualRes || {};
  } catch (err) {
    console.error('Error loading intelligence data:', err);
  }
}

/**
 * Render All Components
 */
function renderDashboard() {
  renderTelemetry();
  renderMapMarkers();
  renderWatchlistCards();
}

/**
 * Render Top KPI Bar
 */
function renderTelemetry() {
  if (dom.statRegions) dom.statRegions.textContent = state.watchlist.length;
  
  const totalGw = (state.watchlist.reduce((sum, r) => sum + (r.ai_load_capacity_mw || 0), 0) / 1000).toFixed(1);
  if (dom.statCapacity) dom.statCapacity.textContent = `${totalGw} GW`;
  
  const criticalCount = state.watchlist.filter(r => r.pressure_tier === 'CRITICAL').length;
  if (dom.statCritical) dom.statCritical.textContent = criticalCount;
}

/**
 * Render Map Markers (Monochrome High Contrast)
 */
function renderMapMarkers() {
  state.markers.forEach(m => state.map.removeLayer(m));
  state.markers = [];

  const tierColors = {
    CRITICAL: '#ffffff',
    ELEVATED: '#d4d4d8',
    WATCH: '#a1a1aa',
    STABLE: '#71717a'
  };

  const tierLabels = {
    CRITICAL: 'High Convergence',
    ELEVATED: 'Elevated Pressure',
    WATCH: 'Watch Tier',
    STABLE: 'Baseline Stable'
  };

  state.watchlist.forEach(region => {
    if (!region.coordinates || !region.coordinates.lat) return;

    const color = tierColors[region.pressure_tier] || '#ffffff';
    const mw = region.ai_load_capacity_mw || 0;
    const radius = Math.min(22, Math.max(7, Math.round(Math.sqrt(Math.max(1, mw)) * 0.35)));

    const markerHtml = `
      <div class="map-pulse-marker" style="width:${radius * 2}px; height:${radius * 2}px;">
        <div class="pulse-ring" style="width:${radius * 2}px; height:${radius * 2}px; background:#ffffff; opacity:0.4;"></div>
        <div style="width:${radius}px; height:${radius}px; background:${color}; border-radius:50%; box-shadow:0 0 8px #ffffff; z-index:2; border: 2px solid #000000;"></div>
      </div>
    `;

    const icon = L.divIcon({
      className: 'custom-div-icon',
      html: markerHtml,
      iconSize: [radius * 2, radius * 2],
      iconAnchor: [radius, radius]
    });

    const marker = L.marker([region.coordinates.lat, region.coordinates.lng], { icon })
      .addTo(state.map)
      .bindTooltip(`
        <div style="font-family:sans-serif; padding:4px;">
          <div style="font-weight:700; color:#ffffff; font-size:13px;">[${region.country_code || 'GL'}] ${region.name}</div>
          <div style="color:#ffffff; font-weight:800; font-size:12px; margin-top:2px;">
            ${tierLabels[region.pressure_tier] || region.pressure_tier} · Score ${region.power_pressure_score}/100
          </div>
          <div style="color:#a1a1aa; font-size:11px; margin-top:2px;">
            AI Load: +${(region.ai_load_capacity_mw || 0).toLocaleString()} MW | Tariff: ${(region.electricity_rate_cents_kwh || 0).toFixed(1)} cents/kWh
          </div>
        </div>
      `, { offset: [0, -radius] });

    marker.on('click', () => {
      openRegionDrawer(region);
    });

    state.markers.push(marker);
  });
}

/**
 * Filter and Sort Watchlist Items
 */
function getFilteredWatchlist() {
  return state.watchlist.filter(item => {
    // Search query
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      const match = (item.name && item.name.toLowerCase().includes(q)) ||
                    (item.county && item.county.toLowerCase().includes(q)) ||
                    (item.state_province && item.state_province.toLowerCase().includes(q)) ||
                    (item.country && item.country.toLowerCase().includes(q)) ||
                    (item.country_code && item.country_code.toLowerCase().includes(q)) ||
                    (item.utility_name && item.utility_name.toLowerCase().includes(q)) ||
                    (item.facilities && item.facilities.some(f => (f.name && f.name.toLowerCase().includes(q)) || (f.operator && f.operator.toLowerCase().includes(q))));
      if (!match) return false;
    }

    // Continent filter
    if (state.continentFilter !== 'ALL') {
      const allowedCountries = CONTINENT_MAP[state.continentFilter] || [];
      if (!allowedCountries.includes(item.country_code)) return false;
    }

    // Pressure Tier filter
    if (state.tierFilter !== 'ALL') {
      if (item.pressure_tier !== state.tierFilter) return false;
    }

    return true;
  }).sort((a, b) => {
    if (state.sortFilter === 'SCORE_DESC') return b.power_pressure_score - a.power_pressure_score;
    if (state.sortFilter === 'MW_DESC') return (b.ai_load_capacity_mw || 0) - (a.ai_load_capacity_mw || 0);
    if (state.sortFilter === 'RATE_CHANGE_DESC') return (b.electricity_rate_change_pct || 0) - (a.electricity_rate_change_pct || 0);
    if (state.sortFilter === 'RATIO_DESC') return (b.rate_pressure_ratio || 0) - (a.rate_pressure_ratio || 0);
    return 0;
  });
}

/**
 * Render Regional Watchlist Cards Feed
 */
function renderWatchlistCards() {
  const items = getFilteredWatchlist();

  if (items.length === 0) {
    dom.watchlistFeed.innerHTML = `
      <div style="padding:32px; text-align:center; color:#71717a; font-size:14px;">
        No monitored regions match the selected criteria.
      </div>
    `;
    return;
  }

  const tierLabels = {
    CRITICAL: 'HIGH CONVERGENCE',
    ELEVATED: 'ELEVATED',
    WATCH: 'WATCH',
    STABLE: 'BASELINE'
  };

  dom.watchlistFeed.innerHTML = items.map(r => {
    const tierClass = (r.pressure_tier || 'STABLE').toLowerCase();
    const prov = r.provenance || {};
    const isSimulated = prov.is_simulated || r.is_simulated;
    const provTag = isSimulated ? 'FALLBACK' : 'LIVE EXTRACTED';
    const provTagClass = isSimulated ? 'prov-simulated' : 'prov-live';
    const granLabel = r.geographic_granularity === 'county_cluster' ? 'COUNTY' : (r.geographic_granularity === 'metropolitan_hub' ? 'METRO' : 'NATIONAL');

    return `
      <div class="region-card tier-${tierClass}" data-region-id="${r.region_id}">
        <div class="card-top">
          <div style="flex:1; min-width:0;">
            <div class="card-title-row">
              <span class="country-badge">${r.country_code || 'GL'}</span>
              <div class="card-title">${r.name}</div>
            </div>
            <div class="card-loc">
              <span>${r.state_province ? `${r.state_province}, ` : ''}${r.country}</span>
              <span class="granularity-badge">${granLabel}</span>
              <span class="provenance-pill ${provTagClass}">${provTag}</span>
            </div>
          </div>
          <div class="card-score-badge">
            <span class="score-pill ${tierClass}">${r.power_pressure_score}</span>
            <span class="score-tier-sub">${tierLabels[r.pressure_tier] || r.pressure_tier}</span>
          </div>
        </div>

        <div class="card-metrics-grid">
          <div class="card-metric-col">
            <span class="m-lbl">AI LOAD</span>
            <span class="m-val">+${(r.ai_load_capacity_mw || 0).toLocaleString()} MW</span>
          </div>
          <div class="card-metric-col">
            <span class="m-lbl">12MO RATE</span>
            <span class="m-val">+${(r.electricity_rate_change_pct || 0).toFixed(1)}%</span>
          </div>
          <div class="card-metric-col">
            <span class="m-lbl">RATE RATIO</span>
            <span class="m-val">${(r.rate_pressure_ratio || 0).toFixed(2)}x</span>
          </div>
        </div>

        <div class="card-bottom-row">
          <span class="card-utility-tag">${r.utility_name || 'Regulated Electric Tariff'}</span>
          <span style="font-size:11px; color:#ffffff; font-weight:600;">Dossier &rarr;</span>
        </div>
      </div>
    `;
  }).join('');

  document.querySelectorAll('.region-card').forEach(card => {
    card.addEventListener('click', () => {
      const regionId = card.getAttribute('data-region-id');
      const region = state.watchlist.find(r => r.region_id === regionId);
      if (region) openRegionDrawer(region);
    });
  });
}

/**
 * Open Region Drill-Down Modal Drawer
 */
function openRegionDrawer(region) {
  state.selectedRegion = region;

  if (region.coordinates && region.coordinates.lat) {
    state.map.flyTo([region.coordinates.lat, region.coordinates.lng], 8, { duration: 1.2 });
  }

  dom.drawerTitle.innerHTML = `<span class="country-badge">${region.country_code || 'GL'}</span> ${region.name}`;
  dom.drawerSubtitle.textContent = `${region.utility_name || 'Regulated Tariff'} · ${region.state_province || region.country}`;

  const score = region.power_pressure_score || 0;
  dom.drawerScoreNum.textContent = score;
  
  const offset = 314 - (314 * (score / 100));
  dom.drawerScoreCircle.style.strokeDashoffset = offset;

  const tier = region.pressure_tier || 'STABLE';
  const tierLabels = {
    CRITICAL: 'HIGH CONVERGENCE ZONE',
    ELEVATED: 'ELEVATED PRESSURE ZONE',
    WATCH: 'WATCH STATUS',
    STABLE: 'BASELINE STABLE'
  };

  dom.drawerTierBadge.textContent = tierLabels[tier] || `${tier} CONVERGENCE`;

  const breakdown = region.score_breakdown || {
    ai_load_component: Math.round(score * 0.35),
    rate_pressure_component: Math.round(score * 0.40),
    burden_component: Math.round(score * 0.25)
  };

  dom.drawerAiComp.textContent = `${breakdown.ai_load_component} / 35`;
  dom.drawerAiFill.style.width = `${(breakdown.ai_load_component / 35) * 100}%`;

  dom.drawerRateComp.textContent = `${breakdown.rate_pressure_component} / 40`;
  dom.drawerRateFill.style.width = `${(breakdown.rate_pressure_component / 40) * 100}%`;

  dom.drawerBurdenComp.textContent = `${breakdown.burden_component} / 25`;
  dom.drawerBurdenFill.style.width = `${(breakdown.burden_component / 25) * 100}%`;

  dom.drawerWhyFlagged.innerHTML = (region.why_flagged || []).map(point => `<li>${point}</li>`).join('');

  dom.drawerStatMw.textContent = `+${(region.ai_load_capacity_mw || 0).toLocaleString()} MW`;
  dom.drawerStatMwSub.textContent = `${(region.planned_mw || 0).toLocaleString()} MW planned · ${(region.under_construction_mw || 0).toLocaleString()} MW in build`;

  dom.drawerStatRate.textContent = `+${(region.electricity_rate_change_pct || 0).toFixed(1)}% / 12mo`;
  dom.drawerStatRateSub.textContent = `Effective Tariff: ${(region.electricity_rate_cents_kwh || 0).toFixed(2)} cents/kWh`;

  dom.drawerStatIncome.textContent = `+${(region.income_growth_pct || 0).toFixed(1)}% / 12mo`;
  dom.drawerStatIncomeSub.textContent = `Median Household: $${(region.median_income || 0).toLocaleString()} / yr`;

  dom.drawerStatRatio.textContent = `${(region.rate_pressure_ratio || 0).toFixed(2)}x`;
  dom.drawerStatRatioSub.textContent = `Rate growth outpacing median income by ${(region.rate_pressure_ratio || 0).toFixed(2)}x`;

  renderTimelineChart(region.region_id, region);

  dom.drawerFacilitiesTbody.innerHTML = (region.facilities || []).map(f => `
    <tr>
      <td style="font-weight:600; color:#ffffff;">${f.name}</td>
      <td style="color:#a1a1aa;">${f.operator || 'Undisclosed'}</td>
      <td style="font-family:monospace; color:#ffffff; font-weight:700;">${f.capacity_mw} MW</td>
      <td><span style="font-size:11px; text-transform:uppercase; padding:2px 6px; border-radius:3px; background:rgba(255,255,255,0.08);">${f.status}</span></td>
      <td><span style="font-size:11px; font-weight:700; color:#ffffff;">${f.ai_association?.toUpperCase()}</span></td>
    </tr>
  `).join('') || '<tr><td colspan="5" style="text-align:center; color:#71717a;">No individual facility breakdown available.</td></tr>';

  const prov = region.provenance || {};
  const validFacUrl = (prov.facilities_url && !prov.facilities_url.includes('/facility/')) 
    ? prov.facilities_url 
    : 'https://aidatacenterindex.com/datacenters/';
  const validElecUrl = prov.electricity_url || 'https://www.globalpetrolprices.com/electricity_prices/';
  const validEconUrl = prov.economics_url || 'https://www.numbeo.com/cost-of-living/prices_by_country.jsp';
  const facCollector = prov.facilities_collector || 'c_mt5jpgbb1jwdnovfeu';
  const elecCollector = prov.electricity_collector || 'c_mt5k0hcv20n2v7arut';
  const econCollector = prov.economics_collector || 'c_mt5k12zk2qzd5rjm0d';

  dom.drawerProvenanceGrid.innerHTML = `
    <div class="provenance-row">
      <div>
        <div class="p-source">${prov.facilities_source || 'aidatacenterindex.com'} <span class="collector-badge">${facCollector}</span></div>
        <div style="color:#71717a; font-size:11px;">Data Center Infrastructure Registry · Scraper Studio Stream 01</div>
      </div>
      <a href="${validFacUrl}" target="_blank" rel="noopener">Inspect Public Source &rarr;</a>
    </div>

    <div class="provenance-row">
      <div>
        <div class="p-source">${prov.electricity_source || 'globalpetrolprices.com'} <span class="collector-badge">${elecCollector}</span></div>
        <div style="color:#71717a; font-size:11px;">Residential Electricity Tariff Tracker · Scraper Studio Stream 02</div>
      </div>
      <a href="${validElecUrl}" target="_blank" rel="noopener">Inspect Tariff Filing &rarr;</a>
    </div>

    <div class="provenance-row">
      <div>
        <div class="p-source">${prov.economics_source || 'numbeo.com'} <span class="collector-badge">${econCollector}</span></div>
        <div style="color:#71717a; font-size:11px;">Household Earnings Benchmark · Scraper Studio Stream 03</div>
      </div>
      <a href="${validEconUrl}" target="_blank" rel="noopener">Inspect Economics Data &rarr;</a>
    </div>
  `;

  dom.regionOverlay.classList.add('active');
}

/**
 * Render Interactive SVG Timeline Chart (Monochrome)
 */
function renderTimelineChart(regionId, region) {
  let points = state.history[regionId];
  
  if (!points || points.length === 0) {
    const curRate = region?.electricity_rate_cents_kwh || 0;
    const curMw = region?.ai_load_capacity_mw || 0;
    const curInc = region?.median_income || 0;
    points = [
      { year: 2023, rate_cents_kwh: Math.round(curRate * 0.85 * 100) / 100, ai_capacity_mw: Math.round(curMw * 0.2), median_income: Math.round(curInc * 0.9) },
      { year: 2024, rate_cents_kwh: Math.round(curRate * 0.90 * 100) / 100, ai_capacity_mw: Math.round(curMw * 0.45), median_income: Math.round(curInc * 0.93) },
      { year: 2025, rate_cents_kwh: Math.round(curRate * 0.95 * 100) / 100, ai_capacity_mw: Math.round(curMw * 0.75), median_income: Math.round(curInc * 0.97) },
      { year: 2026, rate_cents_kwh: curRate, ai_capacity_mw: curMw, median_income: curInc }
    ];
  }

  const svg = dom.drawerTimelineSvg;
  if (!svg) return;

  const w = 580;
  const h = 200;
  const pad = { top: 20, right: 30, bottom: 30, left: 40 };

  const innerW = w - pad.left - pad.right;
  const innerH = h - pad.top - pad.bottom;

  const maxMw = Math.max(1, Math.max(...points.map(p => p.ai_capacity_mw || 0)) * 1.15);
  const minRate = Math.min(...points.map(p => p.rate_cents_kwh || 0)) * 0.9;
  const maxRate = Math.max(minRate + 0.1, Math.max(...points.map(p => p.rate_cents_kwh || 0)) * 1.1);

  const getX = (i) => pad.left + (i / (points.length - 1)) * innerW;
  const getYMw = (val) => pad.top + innerH - ((val / maxMw) * innerH);
  const getYRate = (val) => pad.top + innerH - (((val - minRate) / (maxRate - minRate)) * innerH);

  let pathMw = '';
  let pathRate = '';

  points.forEach((p, i) => {
    const x = getX(i);
    const yMw = getYMw(p.ai_capacity_mw || 0);
    const yRate = getYRate(p.rate_cents_kwh || minRate);

    if (i === 0) {
      pathMw += `M ${x} ${yMw}`;
      pathRate += `M ${x} ${yRate}`;
    } else {
      pathMw += ` L ${x} ${yMw}`;
      pathRate += ` L ${x} ${yRate}`;
    }
  });

  const areaMw = `${pathMw} L ${getX(points.length - 1)} ${pad.top + innerH} L ${getX(0)} ${pad.top + innerH} Z`;

  let svgContent = `
    <line x1="${pad.left}" y1="${pad.top}" x2="${w - pad.right}" y2="${pad.top}" stroke="rgba(255,255,255,0.06)" />
    <line x1="${pad.left}" y1="${pad.top + innerH * 0.5}" x2="${w - pad.right}" y2="${pad.top + innerH * 0.5}" stroke="rgba(255,255,255,0.06)" />
    <line x1="${pad.left}" y1="${pad.top + innerH}" x2="${w - pad.right}" y2="${pad.top + innerH}" stroke="rgba(255,255,255,0.12)" />

    <defs>
      <linearGradient id="mwGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.2" />
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0.0" />
      </linearGradient>
    </defs>
    <path d="${areaMw}" fill="url(#mwGradient)" />
    <path d="${pathMw}" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" />
    <path d="${pathRate}" fill="none" stroke="#a1a1aa" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="4,4" />
  `;

  points.forEach((p, i) => {
    const x = getX(i);
    const yMw = getYMw(p.ai_capacity_mw || 0);
    const yRate = getYRate(p.rate_cents_kwh || minRate);

    svgContent += `
      <circle cx="${x}" cy="${yMw}" r="4" fill="#ffffff" stroke="#000000" stroke-width="2" />
      <circle cx="${x}" cy="${yRate}" r="4" fill="#a1a1aa" stroke="#000000" stroke-width="2" />
      <text x="${x}" y="${h - 8}" fill="#71717a" font-size="11" font-family="monospace" text-anchor="middle">${p.year}</text>
      <text x="${x}" y="${yMw - 8}" fill="#ffffff" font-size="10" font-family="monospace" text-anchor="middle" font-weight="700">${p.ai_capacity_mw}MW</text>
    `;
  });

  svg.innerHTML = svgContent;
}

/**
 * Setup Event Listeners
 */
function setupEventListeners() {
  // Platform Overview Modal Controls
  if (dom.btnOpenOverview) {
    dom.btnOpenOverview.addEventListener('click', () => {
      if (dom.overviewOverlay) dom.overviewOverlay.classList.add('active');
    });
  }

  if (dom.btnCloseOverview) {
    dom.btnCloseOverview.addEventListener('click', () => {
      if (dom.overviewOverlay) dom.overviewOverlay.classList.remove('active');
    });
  }

  if (dom.overviewOverlay) {
    dom.overviewOverlay.addEventListener('click', (e) => {
      if (e.target === dom.overviewOverlay) {
        dom.overviewOverlay.classList.remove('active');
      }
    });
  }

  // Search & Filter Listeners
  if (dom.searchInput) {
    dom.searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      renderWatchlistCards();
    });
  }

  if (dom.continentFilter) {
    dom.continentFilter.addEventListener('change', (e) => {
      state.continentFilter = e.target.value;
      const target = CONTINENT_CENTERS[state.continentFilter] || CONTINENT_CENTERS.ALL;
      state.map.flyTo(target.center, target.zoom, { duration: 1.4 });
      renderWatchlistCards();
    });
  }

  if (dom.tierFilter) {
    dom.tierFilter.addEventListener('change', (e) => {
      state.tierFilter = e.target.value;
      renderWatchlistCards();
    });
  }

  if (dom.sortFilter) {
    dom.sortFilter.addEventListener('change', (e) => {
      state.sortFilter = e.target.value;
      renderWatchlistCards();
    });
  }

  if (dom.btnRecenter) {
    dom.btnRecenter.addEventListener('click', () => {
      const target = CONTINENT_CENTERS[state.continentFilter] || CONTINENT_CENTERS.ALL;
      state.map.flyTo(target.center, target.zoom, { duration: 1.2 });
    });
  }

  // Drawer Controls
  if (dom.btnCloseDrawer) {
    dom.btnCloseDrawer.addEventListener('click', () => {
      dom.regionOverlay.classList.remove('active');
    });
  }

  if (dom.regionOverlay) {
    dom.regionOverlay.addEventListener('click', (e) => {
      if (e.target === dom.regionOverlay) {
        dom.regionOverlay.classList.remove('active');
      }
    });
  }

  // Methodology Modal Controls
  if (dom.btnOpenMethodology) {
    dom.btnOpenMethodology.addEventListener('click', () => {
      dom.methodologyOverlay.classList.add('active');
    });
  }

  if (dom.btnCloseMethodology) {
    dom.btnCloseMethodology.addEventListener('click', () => {
      dom.methodologyOverlay.classList.remove('active');
    });
  }

  if (dom.methodologyOverlay) {
    dom.methodologyOverlay.addEventListener('click', (e) => {
      if (e.target === dom.methodologyOverlay) {
        dom.methodologyOverlay.classList.remove('active');
      }
    });
  }
}

// Start Application
document.addEventListener('DOMContentLoaded', init);
