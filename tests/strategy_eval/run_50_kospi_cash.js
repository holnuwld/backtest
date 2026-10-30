/**
 * tests/strategy_eval/run_50_kospi_cash.js
 *
 * Stage 3 Harness Runner for Experiment #2 (KOSPI 200 + Cash Only, 50 Strategies K01 ~ K50):
 * 1. Loads 50 strategies from `strategies_kospi_cash_50.js`
 * 2. Strictly validates that ONLY `KPI200` and `Cash` are traded (no NDX or KRX_GOLD allocations/targets)
 * 3. Executes each strategy using `next_open_engine.js` (T-1 Close signal -> T Open execution, max 3 trades/week)
 *    across:
 *    - Primary Full Verified Regime (1996-07-01 ~ 2026-10-27, 30.3 years)
 *    - Modern Out-of-Sample Regime (2011-01-03 ~ 2026-10-27, 15.8 years)
 *    - 5 Historical Crisis Stress Windows (1997 IMF, 2000 Dotcom, 2008 GFC, 2020 COVID, 2022 RateHike)
 *    - Parameter Perturbation (-15% / +15% lookback period sensitivity)
 * 4. Generates:
 *    - `blind_evaluation_kospi_cash.json` (100% anonymized quantitative metrics for `blind-reviewer`)
 *    - `vault_mapping_kospi_cash.json` (secret mapping + full curves/logs + MDD episode details for HTML report)
 */

const fs = require("fs");
const path = require("path");
const { runNextOpenBacktest } = require("./next_open_engine");

const DATA_PATH = path.join(__dirname, "..", "..", "data", "market_data.json");
const OPEN_CACHE_PATH = path.join(__dirname, "open_prices_cache.json");
const BLIND_OUT_PATH = path.join(__dirname, "blind_evaluation_kospi_cash.json");
const VAULT_OUT_PATH = path.join(__dirname, "vault_mapping_kospi_cash.json");

const CRISIS_WINDOWS = [
  { key: "imf_1997", label: "1997~98 IMF 외환위기", start: "1997-06-02", end: "1998-09-30" },
  { key: "dotcom_2000", label: "2000~02 닷컴버블 붕괴", start: "2000-03-01", end: "2002-10-15" },
  { key: "gfc_2008", label: "2007~09 글로벌 금융위기", start: "2007-10-01", end: "2009-03-31" },
  { key: "covid_2020", label: "2020 코로나19 팬데믹", start: "2020-01-15", end: "2020-05-29" },
  { key: "ratehike_2022", label: "2022 고금리 긴축 하락장", start: "2022-01-03", end: "2022-12-30" },
];

function perturbConfig(cfg, mult) {
  const clone = JSON.parse(JSON.stringify(cfg));
  if (Array.isArray(clone.rules)) {
    clone.rules.forEach((r) => {
      if (Array.isArray(r.conditions)) {
        r.conditions.forEach((c) => {
          if (c.left && typeof c.left.p1 === "number" && c.left.p1 >= 5) {
            c.left.p1 = Math.max(3, Math.round(c.left.p1 * mult));
          }
          if (
            c.rightIndicator &&
            typeof c.rightIndicator.p1 === "number" &&
            c.rightIndicator.p1 >= 5
          ) {
            c.rightIndicator.p1 = Math.max(3, Math.round(c.rightIndicator.p1 * mult));
          }
        });
      }
    });
  }
  if (clone.rebalance && clone.rebalance.bandThreshold) {
    clone.rebalance.bandThreshold = Math.max(
      1.5,
      Math.round(clone.rebalance.bandThreshold * mult * 10) / 10
    );
  }
  return clone;
}

function deterministicShuffle(arr, seed = 20261030) {
  const out = arr.slice();
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) % 4294967296;
    const j = s % (i + 1);
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

function main() {
  console.log("[KOSPI+Cash Harness] Loading market_data.json & open_prices_cache.json ...");
  const marketData = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  const openPrices = JSON.parse(fs.readFileSync(OPEN_CACHE_PATH, "utf8"));
  const { STRATEGIES_KOSPI_CASH_50 } = require("./strategies_kospi_cash_50");

  if (!Array.isArray(STRATEGIES_KOSPI_CASH_50) || STRATEGIES_KOSPI_CASH_50.length !== 50) {
    throw new Error(`Expected exactly 50 KOSPI+Cash strategies, got ${STRATEGIES_KOSPI_CASH_50?.length}`);
  }

  // Strictly verify that only KPI200 is allocated/traded
  for (const s of STRATEGIES_KOSPI_CASH_50) {
    for (const a of s.allocations || []) {
      if (a.ticker !== "KPI200" && a.weightPct > 0) {
        throw new Error(`Strategy ${s.id} has non-KPI200 allocation: ${a.ticker}`);
      }
    }
    for (const r of s.rules || []) {
      if (r.action && r.action.targetTicker && r.action.targetTicker !== "KPI200") {
        throw new Error(`Strategy ${s.id} has non-KPI200 targetTicker: ${r.action.targetTicker}`);
      }
    }
  }

  console.log(`[KOSPI+Cash Harness] Running 50 KOSPI+Cash strategies across Multi-Regime + 5 Crises + Perturbation ...`);

  const baselineDefs = [
    {
      id: "BASE_KPI200",
      name: "코스피 200 단독 (100% Buy & Hold)",
      allocations: [{ ticker: "KPI200", weightPct: 100 }],
      rebalanceEnabled: false,
      rulesEnabled: false,
    },
    {
      id: "BASE_CASH_US3M",
      name: "현금 단독 (100% US3M 단기금리 복리)",
      allocations: [{ ticker: "KPI200", weightPct: 0 }],
      rebalanceEnabled: false,
      rulesEnabled: false,
    },
    {
      id: "BASE_KPI50_CASH50_BH",
      name: "코스피 50% + 현금 50% (무리밸런싱 Buy & Hold)",
      allocations: [{ ticker: "KPI200", weightPct: 50 }],
      rebalanceEnabled: false,
      rulesEnabled: false,
    },
  ];

  const baselines = {};
  for (const b of baselineDefs) {
    const resFull = runNextOpenBacktest(marketData, openPrices, {
      ...b,
      startDate: "1996-07-01",
      endDate: "2026-10-27",
      initialCapital: 10000000,
      feeRatePct: 0.05,
    });
    const resOos = runNextOpenBacktest(marketData, openPrices, {
      ...b,
      startDate: "2011-01-03",
      endDate: "2026-10-27",
      initialCapital: 10000000,
      feeRatePct: 0.05,
    });
    baselines[b.id] = {
      id: b.id,
      name: b.name,
      fullMetrics: resFull.metrics,
      oosMetrics: resOos.metrics,
      compactCurve: resFull.compactCurve,
    };
  }

  const indices = Array.from({ length: 50 }, (_, i) => i);
  const shuffledOrder = deterministicShuffle(indices, 20261030);

  const blindCandidates = [];
  const vaultEntries = {};

  for (let bIdx = 0; bIdx < 50; bIdx++) {
    const origIdx = shuffledOrder[bIdx];
    const strat = STRATEGIES_KOSPI_CASH_50[origIdx];
    const blindId = `KC_BLIND_${String(bIdx + 1).padStart(3, "0")}`;

    const baseCfg = {
      ...strat,
      initialCapital: 10000000,
      feeRatePct: 0.05,
      cashYieldMode: strat.cashYieldMode || "US3M",
      maxWeeklyTrades: 3,
    };

    // 1. Primary Full Verified Period (1996-07-01 ~ 2026-10-27)
    const resFull = runNextOpenBacktest(marketData, openPrices, {
      ...baseCfg,
      startDate: "1996-07-01",
      endDate: "2026-10-27",
    });

    // 2. Modern Out-of-Sample Period (2011-01-03 ~ 2026-10-27)
    const resOos = runNextOpenBacktest(marketData, openPrices, {
      ...baseCfg,
      startDate: "2011-01-03",
      endDate: "2026-10-27",
    });

    // 3. Crisis Windows
    const crisisStats = {};
    let worstCrisisMdd = 0;
    let avgCrisisMdd = 0;
    let avgCrisisReturn = 0;
    for (const cw of CRISIS_WINDOWS) {
      const rCw = runNextOpenBacktest(marketData, openPrices, {
        ...baseCfg,
        startDate: cw.start,
        endDate: cw.end,
      });
      crisisStats[cw.key] = {
        returnPct: rCw.metrics.totalReturnPct,
        mddPct: rCw.metrics.maxDrawdownPct,
      };
      if (rCw.metrics.maxDrawdownPct < worstCrisisMdd) {
        worstCrisisMdd = rCw.metrics.maxDrawdownPct;
      }
      avgCrisisMdd += rCw.metrics.maxDrawdownPct;
      avgCrisisReturn += rCw.metrics.totalReturnPct;
    }
    avgCrisisMdd = Math.round((avgCrisisMdd / CRISIS_WINDOWS.length) * 100) / 100;
    avgCrisisReturn = Math.round((avgCrisisReturn / CRISIS_WINDOWS.length) * 100) / 100;

    // 4. Parameter Perturbation (-15% and +15%)
    const resMinus = runNextOpenBacktest(marketData, openPrices, {
      ...perturbConfig(baseCfg, 0.85),
      startDate: "1996-07-01",
      endDate: "2026-10-27",
    });
    const resPlus = runNextOpenBacktest(marketData, openPrices, {
      ...perturbConfig(baseCfg, 1.15),
      startDate: "1996-07-01",
      endDate: "2026-10-27",
    });

    const calmarBase = resFull.metrics.calmar;
    const calmarMinus = resMinus.metrics.calmar;
    const calmarPlus = resPlus.metrics.calmar;
    const calmarDrift =
      (Math.abs(calmarMinus - calmarBase) + Math.abs(calmarPlus - calmarBase)) /
      (2 * Math.max(0.15, Math.abs(calmarBase)));
    const parameterStabilityPct = Math.round(Math.max(0, (1 - calmarDrift) * 100) * 10) / 10;

    if (resFull.metrics.maxTradesInSingleWeek > 3) {
      throw new Error(
        `Invariant Violation on ${strat.id}: maxTradesInSingleWeek = ${resFull.metrics.maxTradesInSingleWeek} > 3`
      );
    }

    const m = resFull.metrics;
    const mo = resOos.metrics;
    const blindCompositeScore =
      Math.round(
        (m.calmar * 26.0 +
          m.sortino * 14.0 +
          m.sharpe * 14.0 +
          m.cagrPct * 2.2 -
          Math.abs(m.maxDrawdownPct) * 1.15 -
          m.ulcerIndex * 0.65 +
          mo.calmar * 12.0 +
          mo.cagrPct * 1.1 -
          Math.abs(mo.maxDrawdownPct) * 0.55 -
          Math.abs(avgCrisisMdd) * 0.4 +
          parameterStabilityPct * 0.08) *
          100
      ) / 100;

    blindCandidates.push({
      blindId,
      executionConstraintCheck: {
        signalTiming: "PREV_DAY_CLOSE (T-1)",
        executionTiming: "NEXT_DAY_OPEN (T)",
        maxTradesInAnySingleWeek: m.maxTradesInSingleWeek,
        avgTradesPerWeek: m.avgTradesPerWeek,
        avgTradesPerYear: m.avgTradesPerYear,
        weeklyCapCompliant: m.maxTradesInSingleWeek <= 3,
      },
      regimeA_full_1996_2026: {
        cagrPct: m.cagrPct,
        totalReturnPct: m.totalReturnPct,
        maxDrawdownPct: m.maxDrawdownPct,
        maxDrawdownPeakDate: m.maxDrawdownPeakDate,
        maxDrawdownDate: m.maxDrawdownDate,
        maxDrawdownRecoveryDate: m.maxDrawdownRecoveryDate,
        mddPeakToTroughDays: m.mddPeakToTroughDays,
        mddTotalUnderwaterDays: m.mddTotalUnderwaterDays,
        calmar: m.calmar,
        sortino: m.sortino,
        sharpe: m.sharpe,
        upi: m.upi,
        ulcerIndex: m.ulcerIndex,
        maxUnderwaterDays: m.maxUnderwaterDays,
        annualVolPct: m.annualVolPct,
        winRateYearlyPct: m.winRateYearlyPct,
        worstYearReturnPct: m.worstYearReturnPct,
        finalEquityFrom10M: m.finalEquity,
      },
      regimeB_modernOOS_2011_2026: {
        cagrPct: mo.cagrPct,
        totalReturnPct: mo.totalReturnPct,
        maxDrawdownPct: mo.maxDrawdownPct,
        maxDrawdownPeakDate: mo.maxDrawdownPeakDate,
        maxDrawdownDate: mo.maxDrawdownDate,
        calmar: mo.calmar,
        sortino: mo.sortino,
        sharpe: mo.sharpe,
        annualVolPct: mo.annualVolPct,
        winRateYearlyPct: mo.winRateYearlyPct,
      },
      regimeC_crisisStress: {
        avgCrisisMddPct: avgCrisisMdd,
        worstCrisisMddPct: worstCrisisMdd,
        avgCrisisReturnPct: avgCrisisReturn,
        byCrisis: crisisStats,
      },
      robustness: {
        parameterStabilityPct,
        perturbedMinus15_cagrPct: resMinus.metrics.cagrPct,
        perturbedMinus15_mddPct: resMinus.metrics.maxDrawdownPct,
        perturbedPlus15_cagrPct: resPlus.metrics.cagrPct,
        perturbedPlus15_mddPct: resPlus.metrics.maxDrawdownPct,
      },
      referenceCompositeScore: blindCompositeScore,
    });

    vaultEntries[blindId] = {
      blindId,
      originalId: strat.id,
      name: strat.name,
      category: strat.category,
      rationale: strat.rationale,
      config: baseCfg,
      summaryText: resFull.summaryText,
      fullMetrics: resFull.metrics,
      oosMetrics: resOos.metrics,
      crisisStats,
      avgCrisisMdd,
      avgCrisisReturn,
      parameterStabilityPct,
      blindCompositeScore,
      yearlyReturns: resFull.yearlyReturns,
      compactCurve: resFull.compactCurve,
      recentTrades: resFull.tradeLogs.slice(-15),
    };
  }

  const blindPayload = {
    protocol: "QUANTCROSS_BLIND_EVAL_KOSPI_CASH_V1",
    generatedAt: new Date().toISOString(),
    blindNotice:
      "All strategy names, KOSPI/Cash weights, rebalancing rules, and indicator parameters have been stripped. Evaluate candidates strictly on risk-adjusted return (Low MDD + High CAGR relative to KOSPI 100% Buy & Hold), multi-regime consistency, crisis defense, and parameter stability.",
    constraintsEnforced: {
      tradableUniverse: ["KPI200 (KOSPI 200)", "CASH (US3M Yield)"],
      signalBasis: "Previous Day Close (T-1 Close)",
      executionBasis: "Next Day Open (T Open)",
      maxWeeklyTradesLimit: 3,
      primaryPeriod: "1996-07-01 ~ 2026-10-27 (30.32 years, 100% genuine market data)",
      modernOOSPeriod: "2011-01-03 ~ 2026-10-27 (15.82 years)",
    },
    referenceBaselines: {
      KOSPI200_100_BuyHold: baselines.BASE_KPI200.fullMetrics,
      Cash_US3M_100: baselines.BASE_CASH_US3M.fullMetrics,
      KOSPI50_Cash50_NoReb: baselines.BASE_KPI50_CASH50_BH.fullMetrics,
    },
    candidates: blindCandidates,
  };

  const vaultPayload = {
    generatedAt: new Date().toISOString(),
    baselines,
    entries: vaultEntries,
  };

  fs.writeFileSync(BLIND_OUT_PATH, JSON.stringify(blindPayload, null, 2), "utf8");
  fs.writeFileSync(VAULT_OUT_PATH, JSON.stringify(vaultPayload, null, 2), "utf8");

  console.log(`[KOSPI+Cash Harness] Successfully generated:`);
  console.log(`  1) Blind Reviewer Input: ${BLIND_OUT_PATH} (${blindCandidates.length} anonymized candidates)`);
  console.log(`  2) Secret Mapping Vault: ${VAULT_OUT_PATH}`);
}

if (require.main === module) {
  main();
}

module.exports = { main };
