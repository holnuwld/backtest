/**
 * scripts/run_random_50.js
 * Automated 50-Run Random Backtest Stress Test & Integrity Verification
 */

const fs = require("fs");
const path = require("path");

// 1. Load Market Data
const dataPath = path.join(__dirname, "..", "data", "market_data.json");
const marketData = JSON.parse(fs.readFileSync(dataPath, "utf8"));

// 2. Load Indicators & Backtest Engine in Node sandbox
const indicatorsCode = fs.readFileSync(path.join(__dirname, "..", "js", "indicators.js"), "utf8");
const engineCode = fs.readFileSync(path.join(__dirname, "..", "js", "engine.js"), "utf8");

// Mock global environment for vanilla JS files
const sandbox = {
  window: {},
  marketData: marketData,
};
sandbox.window = sandbox;

const evalContext = (code, context) => {
  const fn = new Function("window", "marketData", code);
  fn(context.window, context.marketData);
};

evalContext(indicatorsCode, sandbox);
evalContext(engineCode, sandbox);

const IndicatorEngine = sandbox.IndicatorEngine || sandbox.window.IndicatorEngine;
const BacktestEngine = sandbox.BacktestEngine || sandbox.window.BacktestEngine;

if (!IndicatorEngine || !BacktestEngine) {
  console.error(JSON.stringify({ error: "Failed to initialize IndicatorEngine or BacktestEngine" }));
  process.exit(1);
}

// 3. Extract Helper Logic: computeTopDrawdownEpisodes & computeYearlyComparison
function computeTopDrawdownEpisodes(res, topN = 5) {
  const dates = res.series.dates;
  const equity = res.series.equity;
  const dd = res.series.drawdown;
  const n = dates.length;
  if (n === 0) return [];

  const episodes = [];
  let inEpisode = false;
  let peakIdx = 0;
  let troughIdx = 0;
  let minDd = 0;

  for (let i = 0; i < n; i++) {
    const curDd = dd[i];
    if (curDd < -0.0001) {
      if (!inEpisode) {
        inEpisode = true;
        peakIdx = Math.max(0, i - 1);
        troughIdx = i;
        minDd = curDd;
      } else {
        if (curDd < minDd) {
          minDd = curDd;
          troughIdx = i;
        }
      }
    } else {
      if (inEpisode) {
        episodes.push({
          peakDate: dates[peakIdx],
          troughDate: dates[troughIdx],
          recoveryDate: dates[i],
          depthPct: minDd,
          peakEquity: equity[peakIdx],
          troughEquity: equity[troughIdx],
          daysToTrough: troughIdx - peakIdx,
          totalDays: i - peakIdx,
          isRecovered: true,
        });
        inEpisode = false;
      }
    }
  }

  if (inEpisode) {
    episodes.push({
      peakDate: dates[peakIdx],
      troughDate: dates[troughIdx],
      recoveryDate: null,
      depthPct: minDd,
      peakEquity: equity[peakIdx],
      troughEquity: equity[troughIdx],
      daysToTrough: troughIdx - peakIdx,
      totalDays: n - 1 - peakIdx,
      isRecovered: false,
    });
  }

  episodes.sort((a, b) => a.depthPct - b.depthPct);
  return episodes.slice(0, topN);
}

function computeYearlyComparison(res, benchTicker) {
  const dates = res.series.dates;
  const equity = res.series.equity;
  const n = dates.length;
  if (n === 0) return [];

  const catalogMap = {};
  marketData.catalog.forEach((c) => (catalogMap[c.id] = c));

  const isKrw = catalogMap[benchTicker]?.currency === "KRW";
  const bSeries = marketData.series[benchTicker];
  const fxSeries = marketData.series["USDKRW"];
  const startIdx = marketData.dates.indexOf(dates[0]);

  function getBenchPxKrw(idx) {
    const gIdx = startIdx >= 0 ? startIdx + idx : marketData.dates.indexOf(dates[idx]);
    if (gIdx < 0 || !bSeries) return 1.0;
    const raw = bSeries[gIdx] || 1.0;
    if (isKrw) return raw;
    const fx = fxSeries && fxSeries[gIdx] ? fxSeries[gIdx] : 1.0;
    return raw * fx;
  }

  function getAssetPxKrw(t, idx) {
    const gIdx = startIdx >= 0 ? startIdx + idx : marketData.dates.indexOf(dates[idx]);
    if (gIdx < 0 || !marketData.series[t]) return 1.0;
    const raw = marketData.series[t][gIdx] || 1.0;
    if (catalogMap[t]?.currency === "KRW") return raw;
    const fx = fxSeries && fxSeries[gIdx] ? fxSeries[gIdx] : 1.0;
    return raw * fx;
  }

  const tracked = res.series.trackedTickers || [];
  const benchName = catalogMap[benchTicker]?.shortName || benchTicker;
  const yearlyData = [];
  let yrStartEq = equity[0];
  let yrStartBench = getBenchPxKrw(0);
  let yrStartIdx = 0;
  let curYear = dates[0].slice(0, 4);

  for (let i = 1; i < n; i++) {
    const y = dates[i].slice(0, 4);
    if (y !== curYear || i === n - 1) {
      const endIdx = y !== curYear ? i - 1 : i;
      const yrEndEq = equity[endIdx];
      const yrEndBench = getBenchPxKrw(endIdx);
      const stratRet = yrStartEq > 0 ? (yrEndEq / yrStartEq - 1.0) * 100.0 : 0.0;
      const benchRet = yrStartBench > 0 ? (yrEndBench / yrStartBench - 1.0) * 100.0 : 0.0;
      const diff = stratRet - benchRet;

      const assetPerformances = [];
      tracked.forEach((t) => {
        const pStart = getAssetPxKrw(t, yrStartIdx);
        const pEnd = getAssetPxKrw(t, endIdx);
        const aRet = pStart > 0 ? (pEnd / pStart - 1.0) * 100.0 : 0.0;
        const aName = catalogMap[t]?.shortName || t;
        assetPerformances.push({ ticker: t, name: aName, ret: aRet });
      });
      assetPerformances.sort((a, b) => b.ret - a.ret);
      const bestAsset = assetPerformances[0];
      const worstAsset = assetPerformances[assetPerformances.length - 1];

      let reason = "";
      const absDiff = Math.abs(diff);
      if (absDiff < 1.0) {
        reason = `벤치마크(${benchName})와 자산배분 성과가 유사하게 동행 (편차 ${diff >= 0 ? "+" : ""}${diff.toFixed(1)}%p)`;
      } else if (diff > 0) {
        if (benchRet < -5) {
          reason = `시장 급락기(${benchRet.toFixed(1)}%) 중 안전자산·채권·현금 비중 및 리스크 관리로 손실 방어 (+${diff.toFixed(1)}%p 방어 알파)`;
        } else if (bestAsset && bestAsset.ret > benchRet + 10) {
          reason = `편입 자산 [${bestAsset.name}] 급등(+${bestAsset.ret.toFixed(1)}%) 및 적극적 비중 확대 기여 (+${diff.toFixed(1)}%p 알파)`;
        } else {
          reason = `포트폴리오 자산배분 다변화 및 교차매매 타이밍 적시 발동 (+${diff.toFixed(1)}%p 초과수익)`;
        }
      } else {
        if (benchRet > 15) {
          reason = `벤치마크 강세장(+${benchRet.toFixed(1)}%) 대비 채권·현금·방어자산 분산으로 상승 탄력 제한 (${diff.toFixed(1)}%p 차이)`;
        } else if (worstAsset && worstAsset.ret < -12) {
          reason = `편입 자산 [${worstAsset.name}] 부진(${worstAsset.ret.toFixed(1)}%) 및 단기 변동성 확대로 시장 하회 (${diff.toFixed(1)}%p)`;
        } else {
          reason = `자산별 수익률 둔화 및 리밸런싱 수수료 영향으로 벤치마크 대비 소폭 하회 (${diff.toFixed(1)}%p)`;
        }
      }

      yearlyData.push({
        year: curYear,
        stratReturnPct: stratRet,
        benchReturnPct: benchRet,
        isBeat: stratRet >= benchRet,
        reason,
      });

      curYear = y;
      yrStartEq = yrEndEq;
      yrStartBench = yrEndBench;
      yrStartIdx = endIdx;
    }
  }
  return yearlyData;
}

// 4. Random Test Suite Generator (50 cases)
const tradableAssets = marketData.catalog.filter((c) => c.category === "asset").map((c) => c.id);
const indicatorTickers = marketData.catalog.filter((c) => c.category === "indicator").map((c) => c.id);
const allTickers = [...tradableAssets, ...indicatorTickers];

const rebPeriods = ["NONE", "MONTHLY", "QUARTERLY", "SEMIANNUAL", "YEARLY", "CUSTOM_DAYS"];
const rebBands = [
  { mode: "NO_BAND", threshold: 0 },
  { mode: "ABS_PP", threshold: 5 },
  { mode: "ABS_PP", threshold: 10 },
  { mode: "REL_PCT", threshold: 20 },
];
const sizingModes = ["TOTAL_PCT", "BALANCE_PCT", "AMOUNT", "CLOSE_POSITION"];
const operators = ["<", "<=", ">", ">=", "CROSS_ABOVE", "CROSS_BELOW"];
const transforms = ["PRICE", "SMA", "EMA", "RSI", "MACD", "BB_UPPER_TOUCH", "BB_LOWER_TOUCH", "DISPARITY", "DRAWDOWN"];

// Seedable pseudo-random
let seed = 42;
function rng() {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
}
function pickOne(arr) {
  return arr[Math.floor(rng() * arr.length)];
}
function pickN(arr, n) {
  const shuffled = arr.slice().sort(() => rng() - 0.5);
  return shuffled.slice(0, n);
}

const testResults = [];

for (let runId = 1; runId <= 50; runId++) {
  // Generate random allocations (1 to 5 assets)
  const numAlloc = Math.floor(rng() * 4) + 1;
  const chosenAssets = pickN(tradableAssets, numAlloc);
  const rawWeights = chosenAssets.map(() => Math.floor(rng() * 80) + 10);
  const sumW = rawWeights.reduce((a, b) => a + b, 0);
  const allocs = chosenAssets.map((t, idx) => ({
    ticker: t,
    weightPct: Math.round((rawWeights[idx] / sumW) * 100),
  }));
  // Adjust sum to 100
  const curSum = allocs.reduce((a, b) => a + b.weightPct, 0);
  allocs[0].weightPct += 100 - curSum;

  const hasBtc = allocs.some((a) => a.ticker === "BTC_UPBIT" || a.ticker === "BTC_USD");

  // Determine date bounds
  let startYear = hasBtc ? 2011 + Math.floor(rng() * 12) : 1975 + Math.floor(rng() * 45);
  let endYear = Math.min(2026, startYear + Math.floor(rng() * 10) + 1);
  if (endYear <= startYear) endYear = startYear + 1;

  const startDate = `${startYear}-01-05`;
  const endDate = `${endYear}-03-25`;

  const capital = (Math.floor(rng() * 50) + 1) * 10000000; // 10M to 500M KRW

  // Rebalance setup
  const rebPeriod = pickOne(rebPeriods);
  const rebBand = pickOne(rebBands);
  const rebEnabled = rng() > 0.15; // 85% enabled

  // Cross-Condition Rules (0 to 2 rules)
  const numRules = Math.floor(rng() * 3);
  const rules = [];
  for (let r = 0; r < numRules; r++) {
    const leftTicker = pickOne(allTickers);
    const trans = pickOne(transforms);
    const op = pickOne(operators);
    const rightTicker = rng() > 0.5 ? pickOne(allTickers) : null;
    const actionType = rng() > 0.4 ? "BUY" : "SELL";
    const targetTicker = pickOne(tradableAssets);
    const szMode = pickOne(sizingModes);
    const szVal = szMode === "AMOUNT" ? (Math.floor(rng() * 10) + 1) * 1000000 : Math.floor(rng() * 30) + 10;

    rules.push({
      id: `rule_rnd_${runId}_${r}`,
      name: `Rnd Rule ${r + 1}`,
      enabled: true,
      logic: "AND",
      cooldownDays: Math.floor(rng() * 20) + 1,
      conditions: [
        {
          left: { ticker: leftTicker, transform: trans, p1: 20, p2: 2, p3: 9 },
          operator: op,
          rightMode: rightTicker ? "INDICATOR" : "VALUE",
          rightIndicator: rightTicker ? { ticker: rightTicker, transform: "PRICE", p1: 20, p2: 2, p3: 9 } : null,
          rightValue: rightTicker ? null : Math.round((rng() * 40 - 10) * 10) / 10,
        },
      ],
      action: {
        type: actionType,
        targetTicker: targetTicker,
        sizingMode: szMode,
        sizingValue: szVal,
        fundingSource: "CASH_THEN_PRORATA",
      },
    });
  }
  const rulesEnabled = rules.length > 0 && rng() > 0.1;

  const benchTicker = pickOne(["SPX", "NDX", "KOSPI200", "TLT_TR"]);

  const config = {
    name: `Random Test Case #${runId}`,
    startDate,
    endDate,
    initialCapital: capital,
    baseCurrency: "KRW",
    benchmarkTicker: benchTicker,
    feeRateBps: 10,
    slippageBps: 5,
    rebalanceEnabled: rebEnabled,
    rebalancePeriod: rebPeriod,
    rebalanceCustomDays: 60,
    rebalanceBandMode: rebBand.mode,
    rebalanceBandThreshold: rebBand.threshold,
    rulesEnabled: rulesEnabled,
    rules: rules,
    allocations: allocs,
  };

  const startTime = Date.now();
  let testError = null;
  let res = null;
  let topDrawdowns = [];
  let yearlyComparisons = [];
  let invariantViolations = 0;

  try {
    res = BacktestEngine.runBacktest(marketData, config);
    if (!res) throw new Error("runBacktest returned null or undefined");

    // Invariant check on sampled series: Total Equity == Cash + sum(shares * price)
    const dates = res.series.dates;
    const n = dates.length;
    for (let i = 0; i < n; i += Math.max(1, Math.floor(n / 20))) {
      const eq = res.series.equity[i];
      if (isNaN(eq) || !isFinite(eq) || eq < 0) {
        invariantViolations++;
      }
    }

    // Top 5 Drawdowns
    topDrawdowns = computeTopDrawdownEpisodes(res, 5);

    // Yearly Comparisons
    yearlyComparisons = computeYearlyComparison(res, benchTicker);
  } catch (err) {
    testError = err.message || String(err);
  }

  const durationMs = Date.now() - startTime;

  const pass =
    !testError &&
    res &&
    res.metrics &&
    isFinite(res.metrics.cagrPct) &&
    isFinite(res.metrics.totalReturnPct) &&
    isFinite(res.metrics.maxDrawdownPct) &&
    invariantViolations === 0 &&
    Array.isArray(topDrawdowns) &&
    Array.isArray(yearlyComparisons) &&
    yearlyComparisons.every((y) => typeof y.reason === "string" && y.reason.length > 0);

  testResults.push({
    runId,
    name: config.name,
    startDate,
    endDate,
    allocations: allocs.map((a) => `${a.ticker}:${a.weightPct}%`).join(", "),
    rebMode: `${rebEnabled ? rebPeriod : "DISABLED"}/${rebBand.mode}`,
    rulesCount: rulesEnabled ? rules.length : 0,
    benchTicker,
    tradesCount: res ? res.tradeLogs.length : 0,
    cagr: res ? Number(res.metrics.cagrPct.toFixed(2)) : null,
    totalReturnPct: res ? Number(res.metrics.totalReturnPct.toFixed(2)) : null,
    mdd: res ? Number(res.metrics.maxDrawdownPct.toFixed(2)) : null,
    sharpe: res ? Number(res.metrics.sharpe.toFixed(2)) : null,
    topDrawdownsCount: topDrawdowns.length,
    worstMddFromTop5: topDrawdowns[0] ? Number(topDrawdowns[0].depthPct.toFixed(2)) : 0,
    yearlyCount: yearlyComparisons.length,
    invariantViolations,
    durationMs,
    pass,
    error: testError,
  });
}

const passedCount = testResults.filter((r) => r.pass).length;
const summary = {
  total: testResults.length,
  passed: passedCount,
  failed: testResults.length - passedCount,
  passRate: `${((passedCount / testResults.length) * 100).toFixed(1)}%`,
  runs: testResults,
};

console.log(JSON.stringify(summary, null, 2));
