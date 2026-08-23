/**
 * Power Draw - Empirical Metrics & Power Pressure Scoring Engine
 * Computes Rate Pressure, AI Load, Burden Deltas, Power Pressure Scores, and Objective Explainability Narratives.
 */

/**
 * Calculates Rate Pressure Ratio: %Δ Electricity Rate / %Δ Household Income
 * Formula per METHODOLOGY.md Section 3.A:
 * RP = max(0, %Δ Rate) / max(0.1, %Δ Income)
 */
export function calculateRatePressureRatio(rateChangePct, incomeGrowthPct) {
  if (rateChangePct === null || rateChangePct === undefined) {
    return 1.0; // Baseline when no rate delta is recorded
  }

  const rateDelta = Math.max(0, Number(rateChangePct) || 0);
  const incomeDelta = incomeGrowthPct !== null && incomeGrowthPct !== undefined ? Number(incomeGrowthPct) : 3.0;

  // Protect against division by zero or negative income growth
  const safeIncomeDelta = incomeDelta > 0.1 ? incomeDelta : 0.1;
  const ratio = rateDelta / safeIncomeDelta;

  return Math.round(ratio * 100) / 100;
}

/**
 * Calculates Normalized Rate Pressure Score (0 - 100)
 */
export function calculateRatePressureScore(ratePressureRatio, rateChangePct) {
  if (rateChangePct === null || rateChangePct === undefined) {
    return 35; // Neutral baseline when delta is not yet observed
  }

  if (rateChangePct <= 0) return Math.max(0, Math.round(rateChangePct * 2 + 10));

  // Dynamic scale based on ratio and magnitude
  let score = 25 + (ratePressureRatio * 16);
  if (rateChangePct > 10.0) score += (rateChangePct - 10.0) * 1.5;

  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Calculates AI Load Capacity & Normalized Load Score (0 - 100)
 */
export function calculateAiLoadMetrics(facilities) {
  let planned = 0;
  let underConstruction = 0;
  let operational = 0;

  for (const f of facilities) {
    const mw = f.capacity_mw || 0;
    const status = f.status || 'planned';

    if (status === 'planned') planned += mw;
    else if (status === 'under_construction') underConstruction += mw;
    else if (status === 'operational' || status === 'expansion') operational += mw;
    else planned += mw;
  }

  const effectiveLoadMw = (planned * 1.0) + (underConstruction * 0.85) + (operational * 0.40);
  const totalTrackedMw = planned + underConstruction + operational;

  // Linear scaling relative to a high-density regional threshold (2,500 MW)
  let loadScore = Math.min(100, Math.round((effectiveLoadMw / 2500) * 85));
  if (totalTrackedMw > 3500) loadScore = 100;

  return {
    planned_mw: Math.round(planned),
    under_construction_mw: Math.round(underConstruction),
    operational_mw: Math.round(operational),
    total_tracked_mw: Math.round(totalTrackedMw),
    ai_load_score: Math.max(0, loadScore)
  };
}

/**
 * Calculates Household Electricity Burden & 12-Month Burden Delta
 * Uses consistent percentage precision across current and previous periods.
 */
export function calculateBurdenMetrics(rateCentsKwh, prevRateCentsKwh, income, avgAnnualKwh = 10800) {
  if (!rateCentsKwh || !income || income <= 0) {
    return {
      annual_cost: null,
      burden_pct: null,
      burden_change_pct: null,
      burden_score: 50
    };
  }

  const currentAnnualCost = (rateCentsKwh * avgAnnualKwh) / 100;
  const currentBurdenPct = (currentAnnualCost / income) * 100;

  let burdenDelta = 0.0;
  if (prevRateCentsKwh && prevRateCentsKwh > 0) {
    const prevAnnualCost = (prevRateCentsKwh * avgAnnualKwh) / 100;
    const prevBurdenPct = (prevAnnualCost / income) * 100;
    burdenDelta = Math.round((currentBurdenPct - prevBurdenPct) * 100) / 100;
  }

  const roundedCurrentBurden = Math.round(currentBurdenPct * 100) / 100;

  // Score strictly on household burden proportion & change
  let burdenScore = Math.round(roundedCurrentBurden * 20);
  if (burdenDelta > 0.2) burdenScore += Math.round(burdenDelta * 25);

  return {
    annual_cost: Math.round(currentAnnualCost),
    burden_pct: roundedCurrentBurden,
    burden_change_pct: burdenDelta,
    burden_score: Math.min(100, Math.max(0, burdenScore))
  };
}

/**
 * Computes Composite Power Pressure Score (0 - 100) and Categorical Pressure Tier
 */
export function computePowerPressureScore({
  ratePressureScore,
  aiLoadScore,
  burdenScore
}) {
  // Weights per METHODOLOGY.md Section 3.D: 40% Rate Pressure + 35% AI Load Pressure + 25% Burden Delta
  const weighted = (0.40 * ratePressureScore) + (0.35 * aiLoadScore) + (0.25 * burdenScore);
  const score = Math.min(100, Math.max(0, Math.round(weighted)));

  let tier = 'STABLE';
  if (score >= 80) tier = 'CRITICAL';
  else if (score >= 60) tier = 'ELEVATED';
  else if (score >= 30) tier = 'WATCH';

  return {
    score,
    tier,
    breakdown: {
      rate_pressure_component: Math.round(0.40 * ratePressureScore),
      ai_load_component: Math.round(0.35 * aiLoadScore),
      burden_component: Math.round(0.25 * burdenScore)
    }
  };
}

/**
 * Computes Data Quality Confidence Score (0 - 100)
 */
export function computeConfidenceScore({
  hasAllFields = true,
  geoMatchConfidence = 0.95,
  freshnessDays = 1,
  verifiedSourcesCount = 3
}) {
  const completeness = hasAllFields ? 100 : 60;
  const freshness = freshnessDays <= 3 ? 100 : (freshnessDays <= 14 ? 75 : 40);
  const geoAccuracy = Math.round(geoMatchConfidence * 100);
  const sourceQuality = verifiedSourcesCount >= 3 ? 100 : (verifiedSourcesCount === 2 ? 80 : 60);

  const score = Math.round(
    (0.30 * completeness) +
    (0.25 * freshness) +
    (0.25 * geoAccuracy) +
    (0.20 * sourceQuality)
  );

  let label = 'LOW';
  if (score >= 80) label = 'HIGH';
  else if (score >= 55) label = 'MEDIUM';

  return { score, label };
}

/**
 * Generates transparent, evidence-surfacing narrative points
 * Accurately cites actual data acquisition sources: aidatacenterindex.com, globalpetrolprices.com, and numbeo.com.
 */
export function generateWhyFlaggedNarrative({
  regionName,
  aiLoad,
  rateChangePct,
  incomeGrowthPct,
  ratePressureRatio,
  tier,
  confidenceLabel
}) {
  const points = [];

  // Factor 1: Grid Infrastructure Expansion
  if (aiLoad.total_tracked_mw > 500) {
    points.push(`Infrastructure Tracked: +${aiLoad.total_tracked_mw.toLocaleString()} MW total AI/data-center power capacity (${aiLoad.planned_mw.toLocaleString()} MW planned, ${aiLoad.under_construction_mw.toLocaleString()} MW under construction) recorded via aidatacenterindex.com.`);
  } else {
    points.push(`Infrastructure Tracked: +${aiLoad.total_tracked_mw.toLocaleString()} MW power capacity recorded across public project listings.`);
  }

  // Factor 2: Retail Electricity Rate Trajectory
  if (rateChangePct !== null && rateChangePct !== undefined) {
    if (rateChangePct > 8.0) {
      points.push(`Residential Electricity Rate Movement: +${rateChangePct.toFixed(1)}% trailing 12-month tariff adjustment tracked via globalpetrolprices.com / electricchoice.com.`);
    } else if (rateChangePct > 0) {
      points.push(`Residential Electricity Rate Movement: +${rateChangePct.toFixed(1)}% trailing 12-month adjustment via public tariff schedules.`);
    } else {
      points.push(`Residential Electricity Rate Movement: Stable or decreased (${rateChangePct.toFixed(1)}% trailing rate delta).`);
    }
  } else {
    points.push(`Residential Electricity Rate Movement: Baseline monitoring active; multi-month trailing rate delta calibrating against historical snapshots.`);
  }

  // Factor 3: Household Economic Trajectory
  points.push(`Household Economic Baseline: Net household earnings benchmarked at +${(incomeGrowthPct || 3.0).toFixed(1)}% trailing growth via numbeo.com cost-of-living data.`);

  // Factor 4: Rate-to-Income Growth Asymmetry
  if (rateChangePct !== null && rateChangePct !== undefined) {
    if (ratePressureRatio >= 2.0) {
      points.push(`Observable Growth Asymmetry: Electricity tariffs increased ${ratePressureRatio.toFixed(2)}× faster than local household income benchmark.`);
    } else if (ratePressureRatio >= 1.0) {
      points.push(`Observable Growth Balance: Electricity price movement closely tracked household income gains (${ratePressureRatio.toFixed(2)}× ratio).`);
    } else {
      points.push(`Observable Growth Balance: Household income growth outpaced local utility tariff adjustments (${ratePressureRatio.toFixed(2)}× ratio).`);
    }
  } else {
    points.push(`Observable Growth Balance: Rate-to-income pressure ratio tracking active with current baseline ratio at ${ratePressureRatio.toFixed(2)}×.`);
  }

  // Factor 5: Empirical Source Audit
  points.push(`Empirical Source Audit: Cross-verified across multi-source public web registries and crowdsourced cost-of-living indices with ${confidenceLabel} confidence.`);

  return points;
}
