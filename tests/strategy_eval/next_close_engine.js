/**
 * tests/strategy_eval/next_close_engine.js
 *
 * Next-Day Close Execution Engine:
 * - Signal evaluation on Day (T-1) Close (전일 종가)
 * - Trade & Rebalance execution on Day (T) Close (익일 종가)
 * - End-of-day portfolio valuation marked to Day (T) Close
 * - Strict weekly trade cap: <= 3 trades per week (both ISO calendar week & rolling 5-trading-day window)
 */

const fs = require("fs");
const path = require("path");

const indicatorsCode = fs.readFileSync(path.join(__dirname, "..", "..", "js", "indicators.js"), "utf8");
const engineCode = fs.readFileSync(path.join(__dirname, "..", "..", "js", "engine.js"), "utf8");

const sandbox = { window: {} };
sandbox.window = sandbox;
new Function("window", indicatorsCode)(sandbox.window);
new Function("window", engineCode)(sandbox.window);

const IndicatorEngine = sandbox.IndicatorEngine;
const BaseEngine = sandbox.BacktestEngine;

const ALLOWED_TRADABLE = new Set(["KPI200", "NDX", "KRX_GOLD"]);

function getIsoWeekKey(dateStr) {
  const d = new Date(dateStr + "T00:00:00Z");
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function runNextCloseBacktest(marketData, openPrices, config) {
  const dates = marketData.dates;
  const totalDays = dates.length;

  const catalogMap = {};
  (marketData.catalog || []).forEach((item) => {
    catalogMap[item.id] = item;
  });

  const usdkrwClose = marketData.series["USDKRW"];

  function getCloseFx(gIdx) {
    return Number(usdkrwClose[gIdx] || 1300.0);
  }

  function getClosePriceKrw(ticker, gIdx) {
    const cur = catalogMap[ticker]?.currency || "USD";
    const rawPx = Number(marketData.series[ticker]?.[gIdx] || 0);
    if (cur === "KRW") return rawPx;
    return rawPx * getCloseFx(gIdx);
  }

  function getRawClosePrice(ticker, gIdx) {
    return Number(marketData.series[ticker]?.[gIdx] || 0);
  }

  const reqStart = config.startDate || dates[0];
  const reqEnd = config.endDate || dates[totalDays - 1];

  let startIdx = 0;
  while (startIdx < totalDays - 1 && dates[startIdx] < reqStart) startIdx++;
  let endIdx = totalDays - 1;
  while (endIdx > startIdx && dates[endIdx] > reqEnd) endIdx--;

  if (endIdx <= startIdx) {
    startIdx = 0;
    endIdx = totalDays - 1;
  }

  const rebalanceEnabled = config.rebalanceEnabled !== false;
  const rulesEnabled = config.rulesEnabled !== false;
  const initialCapital = Math.max(100000, Number(config.initialCapital || 10000000));
  const feeRate = Math.max(0, Number(config.feeRatePct ?? 0.05)) / 100.0;
  const cashYieldMode = (config.cashYieldMode || "US3M").toUpperCase();
  const maxWeeklyTrades = Math.max(1, Number(config.maxWeeklyTrades ?? 3));

  const rawAlloc = Array.isArray(config.allocations) ? config.allocations : [];
  const activeAlloc = rawAlloc
    .filter((a) => a && a.ticker && ALLOWED_TRADABLE.has(a.ticker) && Number(a.weightPct) >= 0)
    .map((a) => ({ ticker: a.ticker, weight: Number(a.weightPct) / 100.0 }));

  const targetWeights = {};
  let totalTargetWeight = 0;
  activeAlloc.forEach((a) => {
    targetWeights[a.ticker] = a.weight;
    totalTargetWeight += a.weight;
  });

  const trackedTickers = Array.from(ALLOWED_TRADABLE);

  const rules =
    rulesEnabled && Array.isArray(config.rules)
      ? config.rules.filter((r) => r && r.enabled && r.action && ALLOWED_TRADABLE.has(r.action.targetTicker))
      : [];

  const shares = { KPI200: 0, NDX: 0, KRX_GOLD: 0 };
  let cash = initialCapital;
  let totalFeesPaid = 0;

  // Day 0 initial allocation executed at startIdx Close price
  trackedTickers.forEach((t) => {
    const w = targetWeights[t] || 0;
    if (w > 0) {
      const allocKrw = initialCapital * w;
      const fee = allocKrw * feeRate;
      const netInvest = allocKrw - fee;
      const pxCloseKrw = getClosePriceKrw(t, startIdx);
      if (pxCloseKrw > 0) {
        shares[t] = netInvest / pxCloseKrw;
        cash -= allocKrw;
        totalFeesPaid += fee;
      }
    }
  });
  if (cash < 0 && cash > -1e-6) cash = 0;

  function getValuationAtClose(gIdx) {
    let assetVal = 0;
    const vals = {};
    for (let i = 0; i < trackedTickers.length; i++) {
      const t = trackedTickers[i];
      const v = shares[t] * getClosePriceKrw(t, gIdx);
      vals[t] = v;
      assetVal += v;
    }
    return { total: cash + assetVal, assetVal, vals };
  }

  const numDays = endIdx - startIdx + 1;
  const simDates = new Array(numDays);
  const portfolioEquity = new Float64Array(numDays);
  const portfolioDrawdown = new Float64Array(numDays);
  const dailyReturns = new Float64Array(numDays);

  let ruleTradeCount = 0;
  let rebalanceCount = 0;
  let weeklyCapBlockedCount = 0;
  const tradeLogs = [];

  const ruleLastFiredIdx = new Map();
  const isoWeekTradeCounts = new Map();
  const executedTradeIndices = [];

  function canExecuteTradeOnDay(gIdx) {
    const curDate = dates[gIdx];
    const wk = getIsoWeekKey(curDate);
    const wkCount = isoWeekTradeCounts.get(wk) || 0;
    if (wkCount >= maxWeeklyTrades) return false;

    let rolling5Count = 0;
    for (let i = executedTradeIndices.length - 1; i >= 0; i--) {
      if (gIdx - executedTradeIndices[i] < 5) {
        rolling5Count++;
      } else {
        break;
      }
    }
    return rolling5Count < maxWeeklyTrades;
  }

  function recordTradeExecution(gIdx) {
    const wk = getIsoWeekKey(dates[gIdx]);
    isoWeekTradeCounts.set(wk, (isoWeekTradeCounts.get(wk) || 0) + 1);
    executedTradeIndices.push(gIdx);
  }

  const us3mSeries = marketData.series["US3M"] || null;
  const benchmarkTicker = config.benchmarkTicker || "KPI200";

  let peakEquity = initialCapital;
  let peakDate = dates[startIdx];
  let peakStep = 0;
  let maxDrawdownPct = 0;
  let maxDrawdownDate = dates[startIdx];
  let maxDrawdownPeakDate = dates[startIdx];
  let maxDrawdownPeakStep = 0;
  let maxDrawdownTroughStep = 0;
  let lastRebalanceIdx = startIdx;
  let lastRuleTradeIdx = -9999;

  const allocTickerSet = new Set(activeAlloc.filter((a) => a.weight > 0).map((a) => a.ticker));
  const rebCfg = config.rebalance || {};
  const periodMode = (rebCfg.periodMode || "NONE").toUpperCase();
  const customRebDays = Math.max(5, Math.floor(Number(rebCfg.customDays || 60)));
  const bandMode = (rebCfg.bandMode || "NONE").toUpperCase();
  const bandThreshold = Math.max(1.0, Number(rebCfg.bandThreshold || 5.0)) / 100.0;

  function shouldPeriodRebalanceAtPrevClose(gIdx) {
    if (!rebalanceEnabled || gIdx <= startIdx || periodMode === "NONE" || totalTargetWeight <= 0)
      return false;
    if (rules.length > 0 && gIdx - lastRuleTradeIdx < 12) return false;
    const curDate = dates[gIdx];
    const prevDate = dates[gIdx - 1];
    const curY = curDate.slice(0, 4);
    const prevY = prevDate.slice(0, 4);
    const curM = parseInt(curDate.slice(5, 7), 10);
    const prevM = parseInt(prevDate.slice(5, 7), 10);

    if (periodMode === "MONTHLY") return curM !== prevM;
    if (periodMode === "QUARTERLY") {
      return curM !== prevM && (curM === 1 || curM === 4 || curM === 7 || curM === 10);
    }
    if (periodMode === "SEMIANNUAL") {
      return curM !== prevM && (curM === 1 || curM === 7);
    }
    if (periodMode === "YEARLY") return curY !== prevY;
    if (periodMode === "CUSTOM_DAYS") {
      return gIdx - lastRebalanceIdx >= customRebDays;
    }
    return false;
  }

  function shouldBandRebalanceAtPrevClose(sigIdx) {
    if (!rebalanceEnabled || bandMode === "NONE" || totalTargetWeight <= 0) return false;
    if (rules.length > 0 && sigIdx - lastRuleTradeIdx < 10) return false;
    const valClose = getValuationAtClose(sigIdx);
    const totalEq = valClose.total;
    if (totalEq <= 1000) return false;

    for (let i = 0; i < trackedTickers.length; i++) {
      const t = trackedTickers[i];
      if (!allocTickerSet.has(t)) continue;
      const targetW = targetWeights[t] || 0;
      const curW = (valClose.vals[t] || 0) / totalEq;
      if (bandMode === "ABS_PP") {
        if (Math.abs(curW - targetW) >= bandThreshold) return true;
      } else if (bandMode === "REL_PCT") {
        if (targetW > 0 && Math.abs(curW - targetW) / targetW >= bandThreshold) return true;
      }
    }
    return false;
  }

  function executeRebalanceAtClose(gIdx, step, reasonLabel) {
    if (!canExecuteTradeOnDay(gIdx)) {
      weeklyCapBlockedCount++;
      return;
    }

    const valClose = getValuationAtClose(gIdx);
    const totalEq = valClose.total;
    const rebalanceableEq = totalEq * Math.min(1.0, totalTargetWeight);
    let tradedDollar = 0;

    // 1. Sell overweight core assets at Close price
    for (let i = 0; i < trackedTickers.length; i++) {
      const t = trackedTickers[i];
      if (!allocTickerSet.has(t)) continue;
      const targetDollar = rebalanceableEq * (targetWeights[t] || 0);
      const curDollar = valClose.vals[t] || 0;
      const diff = curDollar - targetDollar;
      if (diff > 1000.0) {
        const pxCloseKrw = getClosePriceKrw(t, gIdx);
        const sellShares = diff / pxCloseKrw;
        const fee = diff * feeRate;
        shares[t] = Math.max(0, shares[t] - sellShares);
        cash += diff - fee;
        totalFeesPaid += fee;
        tradedDollar += diff;
      }
    }
    // 2. Buy underweight core assets at Close price
    for (let i = 0; i < trackedTickers.length; i++) {
      const t = trackedTickers[i];
      if (!allocTickerSet.has(t)) continue;
      const targetDollar = rebalanceableEq * (targetWeights[t] || 0);
      const curDollar = shares[t] * getClosePriceKrw(t, gIdx);
      const needDollar = targetDollar - curDollar;
      if (needDollar > 1000.0 && cash > 1000.0) {
        const spend = Math.min(cash, needDollar);
        const fee = spend * feeRate;
        const netBuy = spend - fee;
        const pxCloseKrw = getClosePriceKrw(t, gIdx);
        if (pxCloseKrw > 0) {
          shares[t] += netBuy / pxCloseKrw;
          cash -= spend;
          totalFeesPaid += fee;
          tradedDollar += spend;
        }
      }
    }

    if (tradedDollar > 1000) {
      rebalanceCount++;
      lastRebalanceIdx = gIdx;
      recordTradeExecution(gIdx);
      if (tradeLogs.length < 1500) {
        tradeLogs.push({
          date: dates[gIdx],
          signalDate: dates[gIdx - 1],
          executionPriceType: "NEXT_CLOSE",
          stepIndex: step,
          globalIndex: gIdx,
          type: "REBALANCE",
          ruleName: reasonLabel,
          ticker: "PORTFOLIO",
          tickerName: "포트폴리오 리밸런싱 (익일종가)",
          currency: "KRW",
          rawPrice: 0,
          rate: getCloseFx(gIdx),
          priceKrw: 0,
          shares: 0,
          amount: tradedDollar,
          amountKrw: tradedDollar,
          feeKrw: totalFeesPaid,
          equityAfter: getValuationAtClose(gIdx).total,
        });
      }
    }
  }

  // Simulation loop
  for (let step = 0; step < numDays; step++) {
    const gIdx = startIdx + step;
    const curDate = dates[gIdx];
    simDates[step] = curDate;

    // 1. Accrue overnight cash interest
    if (step > 0 && cash > 0 && cashYieldMode === "US3M" && us3mSeries) {
      const annualRate = Math.max(0, us3mSeries[gIdx - 1]) / 100.0;
      cash *= 1.0 + annualRate / 252.0;
    }

    // 2. Evaluate rules strictly at Day (T-1) Close (`sigIdx = gIdx - 1`) and execute at Day (T) Close (`gIdx`)
    if (rulesEnabled && step > 0 && rules.length > 0) {
      const sigIdx = gIdx - 1;
      const triggeredSells = [];
      const triggeredBuys = [];

      for (let rIdx = 0; rIdx < rules.length; rIdx++) {
        const rule = rules[rIdx];
        const cooldown = Math.max(2, Number(rule.cooldownDays ?? 5));
        const lastFired = ruleLastFiredIdx.get(rule.id);
        if (lastFired !== undefined && gIdx - lastFired < cooldown) continue;

        if (BaseEngine.evaluateRuleAt(marketData, rule, sigIdx)) {
          const actType = (rule.action?.type || "BUY").toUpperCase();
          if (actType === "SELL" || actType === "SELL_ALL") {
            triggeredSells.push(rule);
          } else {
            triggeredBuys.push(rule);
          }
        }
      }

      // Execute SELL rules at Day (T) Close
      for (let i = 0; i < triggeredSells.length; i++) {
        if (!canExecuteTradeOnDay(gIdx)) {
          weeklyCapBlockedCount++;
          break;
        }
        const rule = triggeredSells[i];
        const act = rule.action || {};
        const t = act.targetTicker;
        if (!t || !ALLOWED_TRADABLE.has(t)) continue;

        const valClose = getValuationAtClose(gIdx);
        const holdingVal = valClose.vals[t] || 0;
        if (holdingVal <= 1000.0) continue;

        let sellDollar = 0;
        const sMode = (act.sizingMode || "BALANCE_PCT").toUpperCase();
        const sVal = Math.max(0, Number(act.sizingValue ?? 100));

        if (act.type === "SELL_ALL") {
          sellDollar = holdingVal;
        } else if (sMode === "AMOUNT") {
          sellDollar = Math.min(holdingVal, sVal);
        } else if (sMode === "TOTAL_PCT") {
          sellDollar = Math.min(holdingVal, valClose.total * (sVal / 100.0));
        } else {
          sellDollar = holdingVal * Math.min(1.0, sVal / 100.0);
        }

        if (sellDollar > 1000.0) {
          const pxCloseRaw = getRawClosePrice(t, gIdx);
          const pxCloseKrw = getClosePriceKrw(t, gIdx);
          const cur = catalogMap[t]?.currency || "USD";
          const rate = getCloseFx(gIdx);
          const sellSh = sellDollar / pxCloseKrw;
          const fee = sellDollar * feeRate;
          shares[t] = Math.max(0, shares[t] - sellSh);
          cash += sellDollar - fee;
          totalFeesPaid += fee;
          ruleLastFiredIdx.set(rule.id, gIdx);
          lastRuleTradeIdx = gIdx;
          ruleTradeCount++;
          recordTradeExecution(gIdx);

          if (tradeLogs.length < 1500) {
            tradeLogs.push({
              date: curDate,
              signalDate: dates[sigIdx],
              executionPriceType: "NEXT_CLOSE",
              stepIndex: step,
              globalIndex: gIdx,
              type: "SELL",
              ruleName: rule.name || "매도 조건",
              ticker: t,
              tickerName: catalogMap[t]?.shortName || t,
              currency: cur,
              rawPrice: pxCloseRaw,
              rate,
              priceKrw: pxCloseKrw,
              shares: sellSh,
              amount: sellDollar,
              amountKrw: sellDollar,
              feeKrw: fee,
              equityAfter: getValuationAtClose(gIdx).total,
            });
          }
        }
      }

      // Execute BUY rules at Day (T) Close
      for (let i = 0; i < triggeredBuys.length; i++) {
        if (!canExecuteTradeOnDay(gIdx)) {
          weeklyCapBlockedCount++;
          break;
        }
        const rule = triggeredBuys[i];
        const act = rule.action || {};
        const t = act.targetTicker;
        if (!t || !ALLOWED_TRADABLE.has(t)) continue;

        const valClose = getValuationAtClose(gIdx);
        let buyDollar = 0;
        const sMode = (act.sizingMode || "BALANCE_PCT").toUpperCase();
        const sVal = Math.max(0, Number(act.sizingValue ?? 100));

        if (sMode === "AMOUNT") {
          buyDollar = Math.min(cash, sVal);
        } else if (sMode === "TOTAL_PCT") {
          buyDollar = Math.min(cash, valClose.total * (sVal / 100.0));
        } else {
          buyDollar = cash * Math.min(1.0, sVal / 100.0);
        }

        if (buyDollar > 1000.0 && cash >= buyDollar) {
          const pxCloseRaw = getRawClosePrice(t, gIdx);
          const pxCloseKrw = getClosePriceKrw(t, gIdx);
          const cur = catalogMap[t]?.currency || "USD";
          const rate = getCloseFx(gIdx);
          const fee = buyDollar * feeRate;
          const netSpend = buyDollar - fee;
          const buySh = netSpend / pxCloseKrw;
          shares[t] += buySh;
          cash -= buyDollar;
          totalFeesPaid += fee;
          ruleLastFiredIdx.set(rule.id, gIdx);
          lastRuleTradeIdx = gIdx;
          ruleTradeCount++;
          recordTradeExecution(gIdx);

          if (tradeLogs.length < 1500) {
            tradeLogs.push({
              date: curDate,
              signalDate: dates[sigIdx],
              executionPriceType: "NEXT_CLOSE",
              stepIndex: step,
              globalIndex: gIdx,
              type: "BUY",
              ruleName: rule.name || "매수 조건",
              ticker: t,
              tickerName: catalogMap[t]?.shortName || t,
              currency: cur,
              rawPrice: pxCloseRaw,
              rate,
              priceKrw: pxCloseKrw,
              shares: buySh,
              amount: buyDollar,
              amountKrw: buyDollar,
              feeKrw: fee,
              equityAfter: getValuationAtClose(gIdx).total,
            });
          }
        }
      }
    }

    // 3. Periodic or Band Rebalancing evaluated at Day (T-1) Close and executed at Day (T) Close
    if (rebalanceEnabled && step > 0 && totalTargetWeight > 0) {
      const sigIdx = gIdx - 1;
      let rebReason = null;
      if (shouldPeriodRebalanceAtPrevClose(gIdx)) {
        rebReason = `정기 리밸런싱 (${periodMode})`;
      } else if (shouldBandRebalanceAtPrevClose(sigIdx)) {
        rebReason = `밴드 리밸런싱 (${bandMode} ±${(bandThreshold * 100).toFixed(1)}%)`;
      }
      if (rebReason) {
        executeRebalanceAtClose(gIdx, step, rebReason);
      }
    }

    // 4. End-of-Day Valuation at Day (T) Close
    const eodVal = getValuationAtClose(gIdx);
    portfolioEquity[step] = eodVal.total;

    if (eodVal.total > peakEquity) {
      peakEquity = eodVal.total;
      peakDate = curDate;
      peakStep = step;
    }
    const dd = ((eodVal.total - peakEquity) / peakEquity) * 100.0;
    portfolioDrawdown[step] = dd;
    if (dd < maxDrawdownPct) {
      maxDrawdownPct = dd;
      maxDrawdownDate = curDate;
      maxDrawdownPeakDate = peakDate;
      maxDrawdownPeakStep = peakStep;
      maxDrawdownTroughStep = step;
    }

    if (step === 0) {
      dailyReturns[step] = (eodVal.total - initialCapital) / initialCapital;
    } else {
      dailyReturns[step] = (eodVal.total - portfolioEquity[step - 1]) / portfolioEquity[step - 1];
    }
  }

  // Find recovery date from trough
  let maxDrawdownRecoveryDate = null;
  let recoveryStep = -1;
  const peakValAtMdd = portfolioEquity[maxDrawdownPeakStep];
  for (let s = maxDrawdownTroughStep + 1; s < numDays; s++) {
    if (portfolioEquity[s] >= peakValAtMdd) {
      maxDrawdownRecoveryDate = simDates[s];
      recoveryStep = s;
      break;
    }
  }

  const mddPeakToTroughDays = maxDrawdownTroughStep - maxDrawdownPeakStep;
  const mddTotalUnderwaterDays =
    recoveryStep !== -1 ? recoveryStep - maxDrawdownPeakStep : numDays - maxDrawdownPeakStep;

  function classifyMddEvent(troughDateStr) {
    if (troughDateStr >= "1997-06-01" && troughDateStr <= "1998-12-31") {
      return "1997~1998 대한민국 외환위기 (IMF 국가부도 사태 및 금융기관 구조조정)";
    }
    if (troughDateStr >= "2000-01-01" && troughDateStr <= "2003-04-30") {
      return "2000~2002 IT·닷컴버블 붕괴 및 9·11 테러·국내 카드채 사태";
    }
    if (troughDateStr >= "2007-07-01" && troughDateStr <= "2009-04-30") {
      return "2008 글로벌 금융위기 (리먼브라더스 파산 및 신용경색 폭락장)";
    }
    if (troughDateStr >= "2020-01-01" && troughDateStr <= "2020-05-31") {
      return "2020 코로나19 팬데믹 글로벌 셧다운 패닉장";
    }
    if (troughDateStr >= "2021-11-01" && troughDateStr <= "2023-01-31") {
      return "2022 미 연준 급격한 금리인상 긴축장 및 레고랜드 유동성 경색";
    }
    if (troughDateStr >= "2024-01-01") {
      return "2024~2026 글로벌 매크로 금리·관세 변동성 조정기";
    }
    return "시장 추세 조정 및 경기 둔화 국면";
  }

  const mddEventDescription = classifyMddEvent(maxDrawdownDate);

  // Performance metrics
  const finalEquity = portfolioEquity[numDays - 1];
  const totalReturnPct = ((finalEquity - initialCapital) / initialCapital) * 100.0;
  const years = numDays / 252.0;
  const cagrPct = (Math.pow(Math.max(0.001, finalEquity / initialCapital), 1.0 / years) - 1.0) * 100.0;

  let meanRet = 0;
  for (let s = 0; s < numDays; s++) meanRet += dailyReturns[s];
  meanRet /= numDays;

  let varSum = 0;
  let downVarSum = 0;
  for (let s = 0; s < numDays; s++) {
    const diff = dailyReturns[s] - meanRet;
    varSum += diff * diff;
    if (dailyReturns[s] < 0) {
      downVarSum += dailyReturns[s] * dailyReturns[s];
    }
  }
  const dailyVol = Math.sqrt(varSum / Math.max(1, numDays - 1));
  const annualVolPct = dailyVol * Math.sqrt(252.0) * 100.0;
  const downVol = Math.sqrt(downVarSum / Math.max(1, numDays));
  const annualDownVolPct = downVol * Math.sqrt(252.0) * 100.0;

  const sharpe = annualVolPct > 0 ? (cagrPct - 2.0) / annualVolPct : 0;
  const sortino = annualDownVolPct > 0 ? (cagrPct - 2.0) / annualDownVolPct : 0;
  const calmar = Math.abs(maxDrawdownPct) > 0.001 ? cagrPct / Math.abs(maxDrawdownPct) : 0;

  let sumSqDd = 0;
  let curUnderwater = 0;
  let maxUnderwaterDays = 0;
  for (let s = 0; s < numDays; s++) {
    const d = portfolioDrawdown[s];
    sumSqDd += d * d;
    if (d < -0.01) {
      curUnderwater++;
      if (curUnderwater > maxUnderwaterDays) maxUnderwaterDays = curUnderwater;
    } else {
      curUnderwater = 0;
    }
  }
  const ulcerIndex = Math.sqrt(sumSqDd / numDays);
  const upi = ulcerIndex > 0.001 ? (cagrPct - 2.0) / ulcerIndex : 0;

  const yearsMap = new Map();
  for (let s = 0; s < numDays; s++) {
    const y = simDates[s].slice(0, 4);
    if (!yearsMap.has(y)) yearsMap.set(y, { start: portfolioEquity[s], end: portfolioEquity[s] });
    yearsMap.get(y).end = portfolioEquity[s];
  }
  let winYears = 0;
  let worstYearReturnPct = 999999;
  const yearlyReturns = {};
  for (const [y, obj] of yearsMap.entries()) {
    const yrRet = ((obj.end - obj.start) / obj.start) * 100.0;
    yearlyReturns[y] = Math.round(yrRet * 100) / 100;
    if (yrRet > 0) winYears++;
    if (yrRet < worstYearReturnPct) worstYearReturnPct = yrRet;
  }
  const winRateYearlyPct = (winYears / Math.max(1, yearsMap.size)) * 100.0;

  const totalTrades = ruleTradeCount + rebalanceCount;
  const avgTradesPerYear = totalTrades / years;
  const avgTradesPerWeek = totalTrades / (years * 52.0);

  let maxTradesInSingleWeek = 0;
  for (const cnt of isoWeekTradeCounts.values()) {
    if (cnt > maxTradesInSingleWeek) maxTradesInSingleWeek = cnt;
  }

  // Downsample equity and drawdown for chart payload (1 point every 5 trading days)
  const sampleStep = Math.max(1, Math.floor(numDays / 750));
  const compactDates = [];
  const compactNormEquity = [];
  const compactDrawdown = [];

  for (let s = 0; s < numDays; s += sampleStep) {
    compactDates.push(simDates[s]);
    compactNormEquity.push(Math.round((portfolioEquity[s] / initialCapital) * 100.0 * 100) / 100);
    compactDrawdown.push(Math.round(portfolioDrawdown[s] * 100) / 100);
  }
  if (compactDates[compactDates.length - 1] !== simDates[numDays - 1]) {
    compactDates.push(simDates[numDays - 1]);
    compactNormEquity.push(
      Math.round((portfolioEquity[numDays - 1] / initialCapital) * 100.0 * 100) / 100
    );
    compactDrawdown.push(Math.round(portfolioDrawdown[numDays - 1] * 100) / 100);
  }

  const allocDesc =
    activeAlloc.length > 0
      ? activeAlloc.map((a) => `${catalogMap[a.ticker]?.shortName || a.ticker} ${(a.weight * 100).toFixed(0)}%`).join(" + ")
      : "100% 현금";
  const cashRemainingPct = Math.round((1.0 - totalTargetWeight) * 100);
  const fullAllocDesc =
    cashRemainingPct > 0 ? `${allocDesc} + 현금(US3M) ${cashRemainingPct}%` : allocDesc;

  return {
    metrics: {
      startDate: simDates[0],
      endDate: simDates[numDays - 1],
      tradingDays: numDays,
      years: Math.round(years * 100) / 100,
      initialCapital,
      finalEquity: Math.round(finalEquity),
      totalReturnPct: Math.round(totalReturnPct * 100) / 100,
      cagrPct: Math.round(cagrPct * 100) / 100,
      maxDrawdownPct: Math.round(maxDrawdownPct * 100) / 100,
      maxDrawdownPeakDate,
      maxDrawdownDate,
      maxDrawdownRecoveryDate,
      mddPeakToTroughDays,
      mddTotalUnderwaterDays,
      mddEventDescription,
      ulcerIndex: Math.round(ulcerIndex * 100) / 100,
      maxUnderwaterDays,
      annualVolPct: Math.round(annualVolPct * 100) / 100,
      sharpe: Math.round(sharpe * 1000) / 1000,
      sortino: Math.round(sortino * 1000) / 1000,
      calmar: Math.round(calmar * 1000) / 1000,
      upi: Math.round(upi * 1000) / 1000,
      winRateYearlyPct: Math.round(winRateYearlyPct * 10) / 10,
      worstYearReturnPct: Math.round(worstYearReturnPct * 100) / 100,
      ruleTradeCount,
      rebalanceCount,
      totalTrades,
      avgTradesPerYear: Math.round(avgTradesPerYear * 10) / 10,
      avgTradesPerWeek: Math.round(avgTradesPerWeek * 100) / 100,
      maxTradesInSingleWeek,
      weeklyCapBlockedCount,
      totalFeesPaid: Math.round(totalFeesPaid),
      paretoScore: Math.round((cagrPct - Math.abs(maxDrawdownPct)) * 100) / 100,
    },
    yearlyReturns,
    summaryText: {
      allocations: fullAllocDesc,
      rebalance: `${periodMode} / ${bandMode}`,
      rules: rules.map((r) => BaseEngine.summarizeRule(r, catalogMap)),
    },
    compactCurve: {
      dates: compactDates,
      normEquity: compactNormEquity,
      drawdown: compactDrawdown,
    },
    tradeLogs,
  };
}

module.exports = { runNextCloseBacktest };
