/**
 * tests/strategy_eval/run_50_ndx_cash_close.js
 *
 * Backtest Runner for NASDAQ 100 + Cash Only (50 Strategies N01 ~ N50):
 * - Execution Timing: Next-Day Close (T-1 Close signal -> T Close execution)
 * - Primary Period: 1999-01-04 ~ 2026-10-27 (27.77 years, post-IMF / dotcom bubble to present)
 * - Modern OOS Period: 2011-01-03 ~ 2026-10-27 (15.82 years)
 * - 4 Historical Crises: 2000 Dotcom, 2008 GFC, 2020 COVID, 2022 Tech RateHike
 * - Parameter Perturbation: -15% / +15% sensitivity
 *
 * Generates:
 * - `tests/strategy_eval/blind_evaluation_ndx_cash.json`
 * - `tests/strategy_eval/vault_mapping_ndx_cash.json`
 */

const fs = require("fs");
const path = require("path");
const { runNextCloseBacktest } = require("./next_close_engine");

const DATA_PATH = path.join(__dirname, "..", "..", "data", "market_data.json");
const OPEN_CACHE_PATH = path.join(__dirname, "open_prices_cache.json");
const BLIND_OUT_PATH = path.join(__dirname, "blind_evaluation_ndx_cash.json");
const VAULT_OUT_PATH = path.join(__dirname, "vault_mapping_ndx_cash.json");

const POST_IMF_CRISIS_WINDOWS = [
  { key: "dotcom_2000", label: "2000~02 닷컴버블 붕괴", start: "2000-03-01", end: "2002-10-15" },
  { key: "gfc_2008", label: "2007~09 글로벌 금융위기", start: "2007-10-01", end: "2009-03-31" },
  { key: "covid_2020", label: "2020 코로나19 팬데믹", start: "2020-01-15", end: "2020-05-29" },
  { key: "ratehike_2022", label: "2022 고금리 기술주 긴축 하락장", start: "2022-01-03", end: "2022-12-30" },
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

function deterministicShuffle(arr, seed = 20261042) {
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
  console.log("[NDX+Cash Next-Close Harness] Loading market_data.json & open_prices_cache.json ...");
  const marketData = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  const openPrices = JSON.parse(fs.readFileSync(OPEN_CACHE_PATH, "utf8"));
  const { STRATEGIES_NDX_CASH_50 } = require("./strategies_ndx_cash_50");

  if (!Array.isArray(STRATEGIES_NDX_CASH_50) || STRATEGIES_NDX_CASH_50.length !== 50) {
    throw new Error(`Expected exactly 50 NDX+Cash strategies, got ${STRATEGIES_NDX_CASH_50?.length}`);
  }

  const START_DATE = "1999-01-04";
  const END_DATE = "2026-10-27";
  const OOS_START = "2011-01-03";

  console.log(`[NDX+Cash Next-Close Harness] Running 50 NASDAQ+Cash strategies with Day T Close execution (${START_DATE} ~ ${END_DATE}) ...`);

  const baselineDefs = [
    {
      id: "BASE_NDX",
      name: "나스닥 100 단독 (100% Buy & Hold, 원화환산)",
      allocations: [{ ticker: "NDX", weightPct: 100 }],
      rebalanceEnabled: false,
      rulesEnabled: false,
    },
    {
      id: "BASE_CASH_US3M",
      name: "현금 단독 (100% US3M 단기금리 복리)",
      allocations: [{ ticker: "NDX", weightPct: 0 }],
      rebalanceEnabled: false,
      rulesEnabled: false,
    },
    {
      id: "BASE_NDX50_CASH50_BH",
      name: "나스닥 50% + 현금 50% (무리밸런싱 Buy & Hold)",
      allocations: [{ ticker: "NDX", weightPct: 50 }],
      rebalanceEnabled: false,
      rulesEnabled: false,
    },
  ];

  const baselines = {};
  for (const b of baselineDefs) {
    const resFull = runNextCloseBacktest(marketData, openPrices, {
      ...b,
      startDate: START_DATE,
      endDate: END_DATE,
      initialCapital: 10000000,
      feeRatePct: 0.05,
    });
    const resOos = runNextCloseBacktest(marketData, openPrices, {
      ...b,
      startDate: OOS_START,
      endDate: END_DATE,
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
  const shuffledOrder = deterministicShuffle(indices, 20261042);

  const blindCandidates = [];
  const vaultEntries = {};

  for (let bIdx = 0; bIdx < 50; bIdx++) {
    const origIdx = shuffledOrder[bIdx];
    const strat = STRATEGIES_NDX_CASH_50[origIdx];
    const blindId = `NDX_BLIND_${String(bIdx + 1).padStart(3, "0")}`;

    const baseCfg = {
      ...strat,
      startDate: START_DATE,
      endDate: END_DATE,
      initialCapital: 10000000,
      feeRatePct: 0.05,
    };

    const fullRun = runNextCloseBacktest(marketData, openPrices, baseCfg);

    const oosCfg = { ...baseCfg, startDate: OOS_START };
    const oosRun = runNextCloseBacktest(marketData, openPrices, oosCfg);

    const crisisStats = {};
    for (const cw of POST_IMF_CRISIS_WINDOWS) {
      const cRun = runNextCloseBacktest(marketData, openPrices, {
        ...baseCfg,
        startDate: cw.start,
        endDate: cw.end,
      });
      crisisStats[cw.key] = {
        label: cw.label,
        start: cw.start,
        end: cw.end,
        returnPct: cRun.metrics.totalReturnPct,
        mddPct: cRun.metrics.maxDrawdownPct,
      };
    }

    const cfgMinus = perturbConfig(baseCfg, 0.85);
    const cfgPlus = perturbConfig(baseCfg, 1.15);
    const runMinus = runNextCloseBacktest(marketData, openPrices, cfgMinus);
    const runPlus = runNextCloseBacktest(marketData, openPrices, cfgPlus);

    const baseCalmar = fullRun.metrics.calmar;
    const minusDiff = Math.abs(runMinus.metrics.calmar - baseCalmar) / (Math.abs(baseCalmar) + 1e-4);
    const plusDiff = Math.abs(runPlus.metrics.calmar - baseCalmar) / (Math.abs(baseCalmar) + 1e-4);
    const avgStabilityPct = Math.max(0, Math.min(100, 100 * (1 - (minusDiff + plusDiff) / 2)));

    const weeklyMax = fullRun.metrics.maxTradesInSingleWeek;
    if (weeklyMax > 3) {
      console.warn(`[WARNING] Strategy ${strat.id} exceeded 3 weekly trades: ${weeklyMax}`);
    }

    const crisisReturns = Object.values(crisisStats).map((c) => c.returnPct);
    const avgCrisisReturn = crisisReturns.reduce((a, b) => a + b, 0) / crisisReturns.length;
    const crisisMdds = Object.values(crisisStats).map((c) => c.mddPct);
    const avgCrisisMdd = crisisMdds.reduce((a, b) => a + b, 0) / crisisMdds.length;

    const calmar = fullRun.metrics.calmar;
    const sharpe = fullRun.metrics.sharpe;
    const sortino = fullRun.metrics.sortino;
    const ulcer = fullRun.metrics.ulcerIndex;
    const mddAbs = Math.abs(fullRun.metrics.maxDrawdownPct);
    const oosCalmar = oosRun.metrics.calmar;

    const score =
      calmar * 32 +
      sharpe * 18 +
      sortino * 12 +
      (100 - mddAbs) * 0.45 +
      (100 - ulcer) * 0.35 +
      oosCalmar * 15 +
      avgCrisisReturn * 0.4 +
      (avgStabilityPct / 100) * 10;

    const blindItem = {
      blindId,
      fullMetrics: fullRun.metrics,
      oosMetrics: oosRun.metrics,
      crisisStats,
      parameterStabilityPct: Number(avgStabilityPct.toFixed(1)),
      weeklyTradeEnforcement: {
        maxTradesInSingleWeek: weeklyMax,
        avgTradesPerWeek: fullRun.metrics.avgTradesPerWeek,
        passedLimit: weeklyMax <= 3,
      },
      blindCompositeScore: Number(score.toFixed(3)),
    };

    blindCandidates.push(blindItem);

    vaultEntries[blindId] = {
      blindId,
      originalId: strat.id,
      name: strat.name,
      category: strat.category,
      rationale: strat.rationale,
      config: {
        allocations: strat.allocations,
        rebalanceEnabled: strat.rebalanceEnabled,
        rebalance: strat.rebalance,
        rulesEnabled: strat.rulesEnabled,
        rulesCount: strat.rules ? strat.rules.length : 0,
      },
      summaryText: {
        allocations: strat.allocations.map((a) => `${a.ticker} ${a.weightPct}%`).join(" + ") + (strat.allocations[0].weightPct < 100 ? ` + 현금(US3M) ${100 - strat.allocations[0].weightPct}%` : ""),
        rules: strat.rules ? strat.rules.map((r) => r.name) : [],
      },
      fullMetrics: fullRun.metrics,
      oosMetrics: oosRun.metrics,
      crisisStats,
      parameterStabilityPct: Number(avgStabilityPct.toFixed(1)),
      avgCrisisReturn: Number(avgCrisisReturn.toFixed(2)),
      avgCrisisMdd: Number(avgCrisisMdd.toFixed(2)),
      blindCompositeScore: Number(score.toFixed(3)),
      compactCurve: fullRun.compactCurve,
    };

    process.stdout.write(`.` );
  }
  console.log("\n[NDX+Cash Next-Close Harness] All 50 runs completed!");

  const blindPayload = {
    metadata: {
      experimentId: "EXP5_NDX_CASH_POST_IMF_CLOSE",
      experimentName: "NASDAQ 100 + Cash Only Blind Strategy Evaluation (Post-IMF / Dotcom Era ~ Present, Next-Day Close Execution)",
      universe: ["NDX", "US3M (Cash)"],
      dates: {
        fullPeriod: { start: START_DATE, end: END_DATE, years: 27.77 },
        oosPeriod: { start: OOS_START, end: END_DATE, years: 15.82 },
      },
      executionCondition: "Next-Day Close (T-1 Close signal evaluation -> T Close execution)",
      maxWeeklyTradesLimit: 3,
      totalCandidates: 50,
      generatedAt: new Date().toISOString(),
    },
    baselines: {
      BASE_NDX: {
        name: baselines.BASE_NDX.name,
        fullMetrics: baselines.BASE_NDX.fullMetrics,
        oosMetrics: baselines.BASE_NDX.oosMetrics,
      },
      BASE_CASH_US3M: {
        name: baselines.BASE_CASH_US3M.name,
        fullMetrics: baselines.BASE_CASH_US3M.fullMetrics,
        oosMetrics: baselines.BASE_CASH_US3M.oosMetrics,
      },
      BASE_NDX50_CASH50_BH: {
        name: baselines.BASE_NDX50_CASH50_BH.name,
        fullMetrics: baselines.BASE_NDX50_CASH50_BH.fullMetrics,
        oosMetrics: baselines.BASE_NDX50_CASH50_BH.oosMetrics,
      },
    },
    candidates: blindCandidates,
  };

  const vaultPayload = {
    metadata: blindPayload.metadata,
    baselines,
    entries: vaultEntries,
  };

  fs.writeFileSync(BLIND_OUT_PATH, JSON.stringify(blindPayload, null, 2), "utf8");
  fs.writeFileSync(VAULT_OUT_PATH, JSON.stringify(vaultPayload, null, 2), "utf8");

  console.log(`[NDX+Cash Next-Close Harness] Blind evaluation saved to: ${BLIND_OUT_PATH}`);
  console.log(`[NDX+Cash Next-Close Harness] Vault mapping saved to: ${VAULT_OUT_PATH}`);
}

main();
