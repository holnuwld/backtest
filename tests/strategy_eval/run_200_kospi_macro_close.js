/**
 * tests/strategy_eval/run_200_kospi_macro_close.js
 *
 * Comprehensive Backtest Runner for 200 Macro-Driven KOSPI 200 + Cash Strategies (M001 ~ M200):
 * - Execution Timing: Next-Day Close (T-1 Close signal -> T Close execution)
 * - Trade Limit: <= 3 trades/week
 * - Period: 1999-01-04 ~ 2026-10-27 (27.77 years, post-IMF modern era)
 * - OOS Modern Regime: 2011-01-03 ~ 2026-10-27 (15.82 years)
 * - 4 Historical Crises: 2000 Dotcom, 2008 GFC, 2020 COVID, 2022 RateHike
 * - Parameter Perturbation: -15% / +15% sensitivity
 *
 * Generates:
 * - `tests/strategy_eval/blind_evaluation_kospi_macro.json`
 * - `tests/strategy_eval/vault_mapping_kospi_macro.json`
 */

const fs = require("fs");
const path = require("path");
const { runNextCloseBacktest } = require("./next_close_engine");

const DATA_PATH = path.join(__dirname, "..", "..", "data", "market_data.json");
const OPEN_CACHE_PATH = path.join(__dirname, "open_prices_cache.json");
const BLIND_OUT_PATH = path.join(__dirname, "blind_evaluation_kospi_macro.json");
const VAULT_OUT_PATH = path.join(__dirname, "vault_mapping_kospi_macro.json");

const POST_IMF_CRISIS_WINDOWS = [
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

function deterministicShuffle(arr, seed = 20261055) {
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
  console.log("[Macro 200 Runner] Loading market_data.json & open_prices_cache.json ...");
  const marketData = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  const openPrices = JSON.parse(fs.readFileSync(OPEN_CACHE_PATH, "utf8"));
  const { STRATEGIES_KOSPI_MACRO_200 } = require("./strategies_kospi_macro_200");

  if (!Array.isArray(STRATEGIES_KOSPI_MACRO_200) || STRATEGIES_KOSPI_MACRO_200.length !== 200) {
    throw new Error(`Expected exactly 200 Macro strategies, got ${STRATEGIES_KOSPI_MACRO_200?.length}`);
  }

  const START_DATE = "1999-01-04";
  const END_DATE = "2026-10-27";
  const OOS_START = "2011-01-03";

  console.log(`[Macro 200 Runner] Running 200 Macro strategies with Day T Close execution (${START_DATE} ~ ${END_DATE}) ...`);

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
      id: "BASE_HALF_KPI_CASH",
      name: "코스피 50% + 현금 50% (정적 배분 무리밸런싱)",
      allocations: [{ ticker: "KPI200", weightPct: 50 }],
      rebalanceEnabled: false,
      rulesEnabled: false,
    },
    {
      id: "BASE_HALF_KPI_CASH_REB",
      name: "코스피 50% + 현금 50% (분기 리밸런싱)",
      allocations: [{ ticker: "KPI200", weightPct: 50 }],
      rebalanceEnabled: true,
      rebalance: { periodMode: "QUARTERLY", bandMode: "ABS_PP", bandThreshold: 5 },
      rulesEnabled: false,
    },
  ];

  const baselinesOut = {};
  for (const b of baselineDefs) {
    const res = runNextCloseBacktest(marketData, openPrices, {
      ...b,
      startDate: START_DATE,
      endDate: END_DATE,
    });
    baselinesOut[b.id] = {
      id: b.id,
      name: b.name,
      fullMetrics: res.metrics,
      compactCurve: res.compactCurve,
    };
  }

  const rawEvaluations = [];

  for (let i = 0; i < STRATEGIES_KOSPI_MACRO_200.length; i++) {
    const strat = STRATEGIES_KOSPI_MACRO_200[i];
    if ((i + 1) % 25 === 0 || i === 0) {
      console.log(`[Macro 200 Runner] Evaluating strategy ${i + 1} / 200: [${strat.id}] ${strat.name}`);
    }

    const fullRes = runNextCloseBacktest(marketData, openPrices, {
      ...strat,
      startDate: START_DATE,
      endDate: END_DATE,
      benchmarkTicker: "KPI200",
    });

    const oosRes = runNextCloseBacktest(marketData, openPrices, {
      ...strat,
      startDate: OOS_START,
      endDate: END_DATE,
      benchmarkTicker: "KPI200",
    });

    const crisisReturns = {};
    for (const cw of POST_IMF_CRISIS_WINDOWS) {
      const cRes = runNextCloseBacktest(marketData, openPrices, {
        ...strat,
        startDate: cw.start,
        endDate: cw.end,
        benchmarkTicker: "KPI200",
      });
      crisisReturns[cw.key] = {
        label: cw.label,
        totalReturnPct: cRes.metrics.totalReturnPct,
        maxDrawdownPct: cRes.metrics.maxDrawdownPct,
      };
    }

    // Sensitivity perturbation: -15%, +15%
    const pDown = perturbConfig(strat, 0.85);
    const pUp = perturbConfig(strat, 1.15);
    const resDown = runNextCloseBacktest(marketData, openPrices, { ...pDown, startDate: START_DATE, endDate: END_DATE });
    const resUp = runNextCloseBacktest(marketData, openPrices, { ...pUp, startDate: START_DATE, endDate: END_DATE });

    const baseSharpe = Math.max(0.01, fullRes.metrics.sharpe || 0.01);
    const diffDown = Math.abs((resDown.metrics.sharpe || 0) - baseSharpe) / baseSharpe;
    const diffUp = Math.abs((resUp.metrics.sharpe || 0) - baseSharpe) / baseSharpe;
    const avgDegradation = (diffDown + diffUp) / 2.0;
    const parameterStabilityScore = Math.max(0.0, Math.min(100.0, (1.0 - Math.min(1.0, avgDegradation)) * 100.0));

    // Composite Score Calculation
    const m = fullRes.metrics;
    const cagr = m.cagrPct;
    const mddAbs = Math.abs(m.maxDrawdownPct);
    const calmar = m.calmar || (mddAbs > 0 ? cagr / mddAbs : 0);
    const sharpe = m.sharpe || 0;
    const sortino = m.sortino || 0;
    const oosMddAbs = Math.abs(oosRes.metrics.maxDrawdownPct);
    const oosCalmar = oosRes.metrics.calmar || (oosMddAbs > 0 ? oosRes.metrics.cagrPct / oosMddAbs : 0);

    let crisisSum = 0;
    Object.values(crisisReturns).forEach((c) => {
      crisisSum += c.totalReturnPct;
    });
    const avgCrisisReturn = crisisSum / POST_IMF_CRISIS_WINDOWS.length;

    const rankScore =
      calmar * 35.0 +
      Math.min(1.5, Math.max(0, sharpe)) * 20.0 +
      Math.min(2.5, Math.max(0, sortino)) * 15.0 +
      oosCalmar * 15.0 +
      Math.max(-20, Math.min(20, avgCrisisReturn)) * 0.5 +
      (parameterStabilityScore / 100.0) * 15.0;

    rawEvaluations.push({
      originalId: strat.id,
      name: strat.name,
      category: strat.category,
      rationale: strat.rationale,
      allocations: strat.allocations,
      rebalance: strat.rebalance,
      rebalanceEnabled: strat.rebalanceEnabled,
      rules: strat.rules,
      rulesEnabled: strat.rulesEnabled,
      fullMetrics: fullRes.metrics,
      oosMetrics: oosRes.metrics,
      crisisReturns,
      parameterStabilityScore,
      compositeScore: rankScore,
      compactCurve: fullRes.compactCurve,
    });
  }

  // Anonymization / Shuffling into MACRO_BLIND_001 ~ MACRO_BLIND_200
  const shuffled = deterministicShuffle(rawEvaluations, 20261055);
  const blindList = [];
  const vaultEntries = {};

  for (let i = 0; i < shuffled.length; i++) {
    const item = shuffled[i];
    const blindId = `MACRO_BLIND_${String(i + 1).padStart(3, "0")}`;

    blindList.push({
      blindId,
      fullMetrics: item.fullMetrics,
      oosMetrics: item.oosMetrics,
      crisisReturns: item.crisisReturns,
      parameterStabilityScore: Math.round(item.parameterStabilityScore * 10) / 10,
      blindCompositeScore: Math.round(item.compositeScore * 100) / 100,
      compactCurve: item.compactCurve,
    });

    const allocText = item.allocations.map((a) => `${a.ticker} ${a.weightPct}%`).join(" + ") + (item.allocations[0].weightPct < 100 ? ` + 현금(US3M) ${100 - item.allocations[0].weightPct}%` : "");

    vaultEntries[blindId] = {
      blindId,
      originalId: item.originalId,
      name: item.name,
      category: item.category,
      rationale: item.rationale,
      config: {
        allocations: item.allocations,
        rebalanceEnabled: item.rebalanceEnabled,
        rebalance: item.rebalance,
        rulesEnabled: item.rulesEnabled,
      },
      summaryText: {
        allocations: allocText,
        rules: item.rules ? item.rules.map((r) => r.name) : [],
      },
      fullMetrics: item.fullMetrics,
      oosMetrics: item.oosMetrics,
      crisisReturns: item.crisisReturns,
      parameterStabilityScore: Math.round(item.parameterStabilityScore * 10) / 10,
      blindCompositeScore: Math.round(item.compositeScore * 100) / 100,
      compactCurve: item.compactCurve,
    };
  }

  const blindPayload = {
    experimentKey: "exp6_kospi_macro_200",
    title: "Post-IMF KOSPI 200 + Cash Macro-Driven Strategy Evaluation (200 Candidates, Next-Day Close Execution)",
    startDate: START_DATE,
    endDate: END_DATE,
    oosStartDate: OOS_START,
    totalStrategies: 200,
    baselines: baselinesOut,
    evaluations: blindList,
  };

  const vaultPayload = {
    metadata: {
      experimentId: "EXP6_KOSPI_MACRO_200",
      experimentName: "Post-IMF KOSPI 200 + Cash Macro-Driven Strategy Evaluation (200 Candidates, Next-Day Close Execution)",
      universe: ["KPI200", "US3M (Cash)"],
      macroIndicators: ["USDKRW", "US10Y", "US2Y", "T10Y2Y", "KOR_CLI", "SOXX", "VIX", "DXY", "WTI"],
      dates: { fullPeriod: { start: START_DATE, end: END_DATE, years: 27.77 }, oosPeriod: { start: OOS_START, end: END_DATE, years: 15.82 } }
    },
    baselines: baselinesOut,
    entries: vaultEntries,
  };

  fs.writeFileSync(BLIND_OUT_PATH, JSON.stringify(blindPayload, null, 2), "utf8");
  console.log(`[Macro 200 Runner] Successfully wrote blind evaluation to: ${BLIND_OUT_PATH}`);

  fs.writeFileSync(VAULT_OUT_PATH, JSON.stringify(vaultPayload, null, 2), "utf8");
  console.log(`[Macro 200 Runner] Successfully wrote vault mapping to: ${VAULT_OUT_PATH}`);
}

main();
