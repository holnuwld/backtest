/**
 * tests/strategy_eval/next_open_engine.js
 *
 * Specialized Next-Day Open (전일 종가 시그널 -> 익일 시가 체결) & Weekly Trade Cap (주 최대 3회 매매 제한)
 * Backtesting Engine for KPI200, NDX, KRX_GOLD Portfolio Optimization.
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

/**
 * Run backtest with:
 *  - Signal evaluation on Day (T-1) Close (전일 종가)
 *  - Trade & Rebalance execution on Day (T) Open (익일 시가)
 *  - End-of-day valuation on Day (T) Close (당일 종가)
 *  - Strict weekly trade cap: <= 3 trades per week (both ISO calendar week & rolling 5-trading-day window)
 */
function runNextOpenBacktest(marketData, openPrices, config) {
  const dates = marketData.dates;
  const totalDays = dates.length;

  const catalogMap = {};
  (marketData.catalog || []).forEach((item) => {
    catalogMap[item.id] = item;
  });

  const usdkrwClose = marketData.series["USDKRW"];
  const usdkrwOpen = openPrices.openSeries["USDKRW"] || usdkrwClose;

  function getCloseFx(gIdx) {
    return Number(usdkrwClose[gIdx] || 1300.0);
  }
  function getOpenFx(gIdx) {
    return Number(usdkrwOpen[gIdx] || getCloseFx(gIdx));
  }

  function getClosePriceKrw(ticker, gIdx) {
    const cur = catalogMap[ticker]?.currency || "USD";
    const rawPx = marketData.series[ticker] ? marketData.series[ticker][gIdx] : 0;
    return cur === "KRW" ? rawPx : rawPx * getCloseFx(gIdx);
  }

  function getOpenPriceKrw(ticker, gIdx) {
    const cur = catalogMap[ticker]?.currency || "USD";
    const openArr = openPrices.openSeries[ticker] || marketData.series[ticker];
    const rawPx = openArr ? openArr[gIdx] : 0;
    return cur === "KRW" ? rawPx : rawPx * getOpenFx(gIdx);
  }

  function getRawOpenPrice(ticker, gIdx) {
    const openArr = openPrices.openSeries[ticker] || marketData.series[ticker];
    return openArr ? openArr[gIdx] : 0;
  }

  const reqStart = config.startDate || "1996-07-01";
  const reqEnd = config.endDate || dates[totalDays - 1];

  let startIdx = 0;
  while (startIdx < totalDays - 1 && dates[startIdx] < reqStart) startIdx++;
  let endIdx = totalDays - 1;
  while (endIdx > startIdx && dates[endIdx] > reqEnd) endIdx--;

  const numDays = endIdx - startIdx + 1;
  const initialCapital = Math.max(1000, Number(config.initialCapital || 10000000));
  const feeRate = Math.max(0, Number(config.feeRatePct ?? 0.05)) / 100.0;
  const cashYieldMode = config.cashYieldMode || "US3M";
  const maxWeeklyTrades = Math.min(3, Math.max(1, Number(config.maxWeeklyTrades ?? 3)));

  const rebalanceEnabled = config.rebalanceEnabled !== false;
  const rulesEnabled = config.rulesEnabled !== false;

  // Validate and normalize allocations strictly to KPI200, NDX, KRX_GOLD
  const rawAlloc = Array.isArray(config.allocations) ? config.allocations : [];
  const activeAlloc = rawAlloc
    .filter((a) => a && ALLOWED_TRADABLE.has(a.ticker) && Number(a.weightPct) >= 0)
    .map((a) => ({ ticker: a.ticker, weight: Number(a.weightPct) / 100.0 }));

  const trackedTickers = ["KPI200", "NDX", "KRX_GOLD"];
  const targetWeights = { KPI200: 0, NDX: 0, KRX_GOLD: 0 };
  let totalTargetWeight = 0;
  activeAlloc.forEach((a) => {
    targetWeights[a.ticker] += a.weight;
    totalTargetWeight += a.weight;
  });
  if (totalTargetWeight > 1.0001) {
    trackedTickers.forEach((t) => {
      targetWeights[t] /= totalTargetWeight;
    });
    totalTargetWeight = 1.0;
  }

  const rules =
    rulesEnabled && Array.isArray(config.rules)
      ? config.rules.filter(
          (r) => r && r.enabled && r.action && ALLOWED_TRADABLE.has(r.action.targetTicker)
        )
      : [];

  const shares = { KPI200: 0, NDX: 0, KRX_GOLD: 0 };
  let cash = initialCapital;
  let totalFeesPaid = 0;

  // Day 0 initial allocation executed at startIdx Open price
  trackedTickers.forEach((t) => {
    const w = targetWeights[t] || 0;
    if (w > 0) {
      const allocKrw = initialCapital * w;
      const fee = allocKrw * feeRate;
      const netInvest = allocKrw - fee;
      const pxOpenKrw = getOpenPriceKrw(t, startIdx);
      if (pxOpenKrw > 0) {
        shares[t] = netInvest / pxOpenKrw;
        cash -= allocKrw;
        totalFeesPaid += fee;
      }
    }
  });
  if (cash < 0 && cash > -1e-6) cash = 0;

  // Valuation helper at Open or Close
  function getValuationAtOpen(gIdx) {
    let assetVal = 0;
    const vals = {};
    for (let i = 0; i < trackedTickers.length; i++) {
      const t = trackedTickers[i];
      const v = shares[t] * getOpenPriceKrw(t, gIdx);
      vals[t] = v;
      assetVal += v;
    }
    return { total: cash + assetVal, assetVal, vals };
  }

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

  const simDates = new Array(numDays);
  const equityCurve = new Float64Array(numDays);
  const drawdownCurve = new Float64Array(numDays);
  const benchmarkCurve = new Float64Array(numDays);
  const cashRatioCurve = new Float64Array(numDays);
  const assetWeightHistory = {
    KPI200: new Float64Array(numDays),
    NDX: new Float64Array(numDays),
    KRX_GOLD: new Float64Array(numDays),
  };

  const tradeLogs = [];
  const ruleLastFiredIdx = new Map();
  let rebalanceCount = 0;
  let ruleTradeCount = 0;
  let weeklyCapBlockedCount = 0;

  // Track trade timestamps to strictly enforce <= 3 trades per week
  const executedTradeIndices = []; // global indices where trades occurred
  const isoWeekTradeCounts = new Map(); // YYYY-Www -> count

  function canExecuteTradeOnDay(gIdx) {
    const wk = getIsoWeekKey(dates[gIdx]);
    const wkCount = isoWeekTradeCounts.get(wk) || 0;
    if (wkCount >= maxWeeklyTrades) return false;

    // Also check rolling 5 trading days window [gIdx - 4, gIdx]
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
    if (periodMode === "CUSTOM_DAYS") return gIdx - lastRebalanceIdx >= customRebDays;
    return false;
  }

  // Band check evaluated strictly on previous day's Close (sigIdx = gIdx - 1)
  function shouldBandRebalanceAtPrevClose(gIdx) {
    if (!rebalanceEnabled || gIdx <= startIdx || bandMode === "NONE" || totalTargetWeight <= 0)
      return false;
    if (gIdx - lastRuleTradeIdx < 15 || gIdx - lastRebalanceIdx < 10) return false;

    const prevCloseVal = getValuationAtClose(gIdx - 1);
    if (prevCloseVal.total <= 0) return false;

    for (let i = 0; i < trackedTickers.length; i++) {
      const t = trackedTickers[i];
      if (!allocTickerSet.has(t)) continue;
      const targetW = targetWeights[t] || 0;
      const curW = (prevCloseVal.vals[t] || 0) / prevCloseVal.total;
      const diff = Math.abs(curW - targetW);
      if (bandMode === "ABS_PP") {
        if (diff >= bandThreshold) return true;
      } else if (bandMode === "REL_PCT" && targetW > 0) {
        if (diff / targetW >= bandThreshold) return true;
      }
    }
    return false;
  }

  // Rebalance executed at Day (T) Open price
  function executeRebalanceAtOpen(gIdx, reasonLabel, step) {
    if (!canExecuteTradeOnDay(gIdx)) {
      weeklyCapBlockedCount++;
      return;
    }
    const valOpen = getValuationAtOpen(gIdx);
    const totalEq = valOpen.total;
    if (totalEq <= 0) return;

    let tacticalOnlyVal = 0;
    for (let i = 0; i < trackedTickers.length; i++) {
      const t = trackedTickers[i];
      if (!allocTickerSet.has(t)) {
        tacticalOnlyVal += valOpen.vals[t] || 0;
      }
    }
    const rebalanceableEq = Math.max(0, totalEq - tacticalOnlyVal);
    if (rebalanceableEq <= 1000) return;

    let tradedDollar = 0;
    // 1. Sell overweight core assets at Open price
    for (let i = 0; i < trackedTickers.length; i++) {
      const t = trackedTickers[i];
      if (!allocTickerSet.has(t)) continue;
      const targetDollar = rebalanceableEq * (targetWeights[t] || 0);
      const curDollar = valOpen.vals[t] || 0;
      const diff = curDollar - targetDollar;
      if (diff > 1000.0) {
        const pxOpenKrw = getOpenPriceKrw(t, gIdx);
        const sellShares = diff / pxOpenKrw;
        const fee = diff * feeRate;
        shares[t] = Math.max(0, shares[t] - sellShares);
        cash += diff - fee;
        totalFeesPaid += fee;
        tradedDollar += diff;
      }
    }
    // 2. Buy underweight core assets at Open price
    for (let i = 0; i < trackedTickers.length; i++) {
      const t = trackedTickers[i];
      if (!allocTickerSet.has(t)) continue;
      const targetDollar = rebalanceableEq * (targetWeights[t] || 0);
      const curDollar = shares[t] * getOpenPriceKrw(t, gIdx);
      const needDollar = targetDollar - curDollar;
      if (needDollar > 1000.0 && cash > 1000.0) {
        const spend = Math.min(cash, needDollar);
        const fee = spend * feeRate;
        const netBuy = spend - fee;
        const pxOpenKrw = getOpenPriceKrw(t, gIdx);
        if (pxOpenKrw > 0) {
          shares[t] += netBuy / pxOpenKrw;
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
          executionPriceType: "NEXT_OPEN",
          stepIndex: step,
          globalIndex: gIdx,
          type: "REBALANCE",
          ruleName: reasonLabel,
          ticker: "PORTFOLIO",
          tickerName: "포트폴리오 리밸런싱 (익일시가)",
          currency: "KRW",
          rawPrice: 0,
          rate: getOpenFx(gIdx),
          priceKrw: 0,
          shares: 0,
          amount: tradedDollar,
          amountKrw: tradedDollar,
          feeKrw: totalFeesPaid,
          equityAfter: getValuationAtOpen(gIdx).total,
        });
      }
    }
  }

  // Main daily simulation loop
  for (let step = 0; step < numDays; step++) {
    const gIdx = startIdx + step;
    const curDate = dates[gIdx];
    simDates[step] = curDate;

    // 1. Accrue overnight cash interest
    if (step > 0 && cash > 0 && cashYieldMode === "US3M" && us3mSeries) {
      const annualRate = Math.max(0, us3mSeries[gIdx - 1]) / 100.0;
      cash *= 1.0 + annualRate / 252.0;
    }

    // 2. Evaluate rules strictly at Day (T-1) Close (`sigIdx = gIdx - 1`) and execute at Day (T) Open (`gIdx`)
    if (rulesEnabled && step > 0 && rules.length > 0) {
      const sigIdx = gIdx - 1; // Always previous day's Close
      const triggeredSells = [];
      const triggeredBuys = [];

      for (let rIdx = 0; rIdx < rules.length; rIdx++) {
        const rule = rules[rIdx];
        // Enforce minimum cooldown of at least 2 trading days so rules don't spam
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

      // Execute SELL rules at Day (T) Open
      for (let i = 0; i < triggeredSells.length; i++) {
        if (!canExecuteTradeOnDay(gIdx)) {
          weeklyCapBlockedCount++;
          break;
        }
        const rule = triggeredSells[i];
        const act = rule.action || {};
        const t = act.targetTicker;
        if (!t || !ALLOWED_TRADABLE.has(t)) continue;

        const valOpen = getValuationAtOpen(gIdx);
        const holdingVal = valOpen.vals[t] || 0;
        if (holdingVal <= 1000.0) continue;

        let sellDollar = 0;
        const sMode = (act.sizingMode || "BALANCE_PCT").toUpperCase();
        const sVal = Math.max(0, Number(act.sizingValue ?? 100));

        if (act.type === "SELL_ALL") {
          sellDollar = holdingVal;
        } else if (sMode === "AMOUNT") {
          sellDollar = Math.min(holdingVal, sVal);
        } else if (sMode === "TOTAL_PCT") {
          sellDollar = Math.min(holdingVal, valOpen.total * (sVal / 100.0));
        } else {
          sellDollar = holdingVal * Math.min(1.0, sVal / 100.0);
        }

        if (sellDollar > 1000.0) {
          const pxOpenRaw = getRawOpenPrice(t, gIdx);
          const pxOpenKrw = getOpenPriceKrw(t, gIdx);
          const cur = catalogMap[t]?.currency || "USD";
          const rate = getOpenFx(gIdx);
          const sellSh = sellDollar / pxOpenKrw;
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
              executionPriceType: "NEXT_OPEN",
              stepIndex: step,
              globalIndex: gIdx,
              type: "SELL",
              ruleName: rule.name || "매도 조건",
              ticker: t,
              tickerName: catalogMap[t]?.shortName || t,
              currency: cur,
              rawPrice: pxOpenRaw,
              rate,
              priceKrw: pxOpenKrw,
              shares: sellSh,
              amount: sellDollar,
              amountKrw: sellDollar,
              feeKrw: fee,
              equityAfter: getValuationAtOpen(gIdx).total,
            });
          }
        }
      }

      // Execute BUY rules at Day (T) Open
      for (let i = 0; i < triggeredBuys.length; i++) {
        if (!canExecuteTradeOnDay(gIdx)) {
          weeklyCapBlockedCount++;
          break;
        }
        const rule = triggeredBuys[i];
        const act = rule.action || {};
        const t = act.targetTicker;
        if (!t || !ALLOWED_TRADABLE.has(t)) continue;

        const valOpen = getValuationAtOpen(gIdx);
        const sMode = (act.sizingMode || "TOTAL_PCT").toUpperCase();
        const sVal = Math.max(0, Number(act.sizingValue ?? 20));
        const funding = act.fundingSource || "CASH_THEN_PRORATA";

        let desiredBuyDollar = 0;
        if (sMode === "AMOUNT") {
          desiredBuyDollar = Math.min(valOpen.total, sVal);
        } else if (sMode === "TOTAL_PCT") {
          desiredBuyDollar = valOpen.total * Math.min(1.0, sVal / 100.0);
        } else {
          if (cash > 1000.0 || funding === "CASH_ONLY") {
            desiredBuyDollar = cash * Math.min(1.0, sVal / 100.0);
          } else if (
            funding !== "CASH_ONLY" &&
            funding !== "CASH_THEN_PRORATA" &&
            ALLOWED_TRADABLE.has(funding) &&
            valOpen.vals[funding] > 1000
          ) {
            desiredBuyDollar = valOpen.vals[funding] * Math.min(1.0, sVal / 100.0);
          } else {
            desiredBuyDollar = (valOpen.total - (valOpen.vals[t] || 0)) * Math.min(1.0, sVal / 100.0);
          }
        }

        if (desiredBuyDollar > cash + 1000.0 && funding !== "CASH_ONLY") {
          const shortfall = desiredBuyDollar - cash;
          if (
            funding !== "CASH_THEN_PRORATA" &&
            ALLOWED_TRADABLE.has(funding) &&
            funding !== t
          ) {
            const availFund = valOpen.vals[funding] || 0;
            const toLiquidate = Math.min(availFund, shortfall / (1 - feeRate));
            if (toLiquidate > 1000.0) {
              const pxFKrw = getOpenPriceKrw(funding, gIdx);
              const feeF = toLiquidate * feeRate;
              shares[funding] = Math.max(0, shares[funding] - toLiquidate / pxFKrw);
              cash += toLiquidate - feeF;
              totalFeesPaid += feeF;
            }
          } else if (funding === "CASH_THEN_PRORATA") {
            let otherTotal = 0;
            for (let k = 0; k < trackedTickers.length; k++) {
              const ot = trackedTickers[k];
              if (ot !== t) otherTotal += valOpen.vals[ot] || 0;
            }
            if (otherTotal > 1000.0) {
              const sellFraction = Math.min(1.0, shortfall / (1 - feeRate) / otherTotal);
              for (let k = 0; k < trackedTickers.length; k++) {
                const ot = trackedTickers[k];
                if (ot === t) continue;
                const otVal = (valOpen.vals[ot] || 0) * sellFraction;
                if (otVal > 1000.0) {
                  const pxOKrw = getOpenPriceKrw(ot, gIdx);
                  const feeO = otVal * feeRate;
                  shares[ot] = Math.max(0, shares[ot] - otVal / pxOKrw);
                  cash += otVal - feeO;
                  totalFeesPaid += feeO;
                }
              }
            }
          }
        }

        const actualSpend = Math.min(cash, desiredBuyDollar);
        if (actualSpend > 1000.0) {
          const pxOpenRaw = getRawOpenPrice(t, gIdx);
          const pxOpenKrw = getOpenPriceKrw(t, gIdx);
          const cur = catalogMap[t]?.currency || "USD";
          const rate = getOpenFx(gIdx);
          const fee = actualSpend * feeRate;
          const netBuy = actualSpend - fee;
          if (pxOpenKrw > 0) {
            const buySh = netBuy / pxOpenKrw;
            shares[t] += buySh;
            cash -= actualSpend;
            totalFeesPaid += fee;
            ruleLastFiredIdx.set(rule.id, gIdx);
            lastRuleTradeIdx = gIdx;
            ruleTradeCount++;
            recordTradeExecution(gIdx);

            if (tradeLogs.length < 1500) {
              tradeLogs.push({
                date: curDate,
                signalDate: dates[sigIdx],
                executionPriceType: "NEXT_OPEN",
                stepIndex: step,
                globalIndex: gIdx,
                type: "BUY",
                ruleName: rule.name || "매수 조건",
                ticker: t,
                tickerName: catalogMap[t]?.shortName || t,
                currency: cur,
                rawPrice: pxOpenRaw,
                rate,
                priceKrw: pxOpenKrw,
                shares: buySh,
                amount: actualSpend,
                amountKrw: actualSpend,
                feeKrw: fee,
                equityAfter: getValuationAtOpen(gIdx).total,
              });
            }
          }
        }
      }
    }

    // 3. Evaluate Periodic or Threshold Band Rebalancing at Day (T-1) Close and execute at Day (T) Open
    if (rebalanceEnabled && step > 0 && totalTargetWeight > 0) {
      const periodTrig = shouldPeriodRebalanceAtPrevClose(gIdx);
      const bandTrig = !periodTrig && shouldBandRebalanceAtPrevClose(gIdx);
      if (periodTrig) {
        executeRebalanceAtOpen(gIdx, `정기 리밸런싱 (${periodMode})`, step);
      } else if (bandTrig) {
        executeRebalanceAtOpen(gIdx, `비율초과 밴드 리밸런싱`, step);
      }
    }

    // 4. End-of-Day Valuation at Day (T) Close
    const eodVal = getValuationAtClose(gIdx);
    const eq = eodVal.total;
    equityCurve[step] = eq;

    if (eq >= peakEquity) {
      peakEquity = eq;
      peakDate = curDate;
      peakStep = step;
    }
    const dd = peakEquity > 0 ? ((eq - peakEquity) / peakEquity) * 100.0 : 0.0;
    drawdownCurve[step] = dd;
    if (dd < maxDrawdownPct) {
      maxDrawdownPct = dd;
      maxDrawdownDate = curDate;
      maxDrawdownPeakDate = peakDate;
      maxDrawdownPeakStep = peakStep;
      maxDrawdownTroughStep = step;
    }

    cashRatioCurve[step] = eq > 0 ? (cash / eq) * 100.0 : 0.0;
    for (let i = 0; i < trackedTickers.length; i++) {
      const t = trackedTickers[i];
      assetWeightHistory[t][step] = eq > 0 ? ((eodVal.vals[t] || 0) / eq) * 100.0 : 0.0;
    }

    const benchCurKrw = getClosePriceKrw(benchmarkTicker, gIdx);
    const benchStartKrw = getOpenPriceKrw(benchmarkTicker, startIdx);
    benchmarkCurve[step] =
      benchStartKrw > 0 ? initialCapital * (benchCurKrw / benchStartKrw) : initialCapital;
  }

  // Find exact recovery date after maxDrawdownTroughStep
  let maxDrawdownRecoveryDate = "미회복 (진행중)";
  let mddRecoveryDays = numDays - 1 - maxDrawdownTroughStep;
  for (let s = maxDrawdownTroughStep + 1; s < numDays; s++) {
    if (drawdownCurve[s] >= -0.001) {
      maxDrawdownRecoveryDate = simDates[s];
      mddRecoveryDays = s - maxDrawdownTroughStep;
      break;
    }
  }
  const mddPeakToTroughDays = Math.max(1, maxDrawdownTroughStep - maxDrawdownPeakStep);
  const mddTotalUnderwaterDays = mddPeakToTroughDays + mddRecoveryDays;

  function classifyMddEvent(troughDt) {
    if (!troughDt) return "역사적 변동성 조정기";
    if (troughDt >= "1997-01-01" && troughDt <= "1999-03-31")
      return "1997~1998 IMF 외환위기 (국가부도 위기 및 고금리·실물 쇼크)";
    if (troughDt >= "2000-01-01" && troughDt <= "2003-04-30")
      return "2000~2002 IT·닷컴버블 붕괴 및 9·11 테러·국내 카드채 사태";
    if (troughDt >= "2004-01-01" && troughDt <= "2006-12-31")
      return "2004~2006 중국 긴축 발작 및 글로벌 IT 조정기";
    if (troughDt >= "2007-07-01" && troughDt <= "2009-09-30")
      return "2008 글로벌 금융위기 (리먼브라더스 파산 및 신용경색 폭락장)";
    if (troughDt >= "2010-01-01" && troughDt <= "2013-08-31")
      return "2011~2012 미국 신용등급 강등 및 유럽 남유럽 재정위기";
    if (troughDt >= "2014-01-01" && troughDt <= "2017-06-30")
      return "2015~2016 중국 증시 버블 붕괴 및 신흥국 자금 유출기";
    if (troughDt >= "2018-01-01" && troughDt <= "2019-12-31")
      return "2018~2019 미·중 무역전쟁 관세충격 및 반도체 다운사이클";
    if (troughDt >= "2020-01-01" && troughDt <= "2020-12-31")
      return "2020 코로나19 팬데믹 글로벌 셧다운 패닉장";
    if (troughDt >= "2021-07-01" && troughDt <= "2023-12-31")
      return "2022 미 연준 급격한 금리인상 긴축장 및 레고랜드 유동성 경색";
    return "2024~2026 글로벌 매크로 금리·관세 변동성 조정기";
  }
  const mddEventDescription = classifyMddEvent(maxDrawdownDate);

  // Compute performance metrics
  const finalEquity = equityCurve[numDays - 1];
  const totalReturnPct = (finalEquity / initialCapital - 1.0) * 100.0;
  const years = Math.max(1 / 252, numDays / 252.0);
  const cagrPct = (Math.pow(Math.max(1e-6, finalEquity / initialCapital), 1.0 / years) - 1.0) * 100.0;

  // Max underwater recovery days & Ulcer Index
  let currentUnderwaterDays = 0;
  let maxUnderwaterDays = 0;
  let sumSqDd = 0;
  for (let i = 0; i < numDays; i++) {
    const d = drawdownCurve[i];
    sumSqDd += d * d;
    if (d < -0.01) {
      currentUnderwaterDays++;
      if (currentUnderwaterDays > maxUnderwaterDays) maxUnderwaterDays = currentUnderwaterDays;
    } else {
      currentUnderwaterDays = 0;
    }
  }
  const ulcerIndex = Math.sqrt(sumSqDd / Math.max(1, numDays));

  // Daily returns for Volatility, Sharpe, Sortino
  let sumRet = 0;
  let sumSqRet = 0;
  let sumDownsideSq = 0;
  let posDays = 0;
  const nRets = Math.max(1, numDays - 1);

  for (let i = 1; i < numDays; i++) {
    const r = equityCurve[i - 1] > 0 ? equityCurve[i] / equityCurve[i - 1] - 1.0 : 0.0;
    sumRet += r;
    sumSqRet += r * r;
    if (r < 0) sumDownsideSq += r * r;
    if (r > 0) posDays++;
  }

  const meanDaily = sumRet / nRets;
  const varDaily = Math.max(0, sumSqRet / nRets - meanDaily * meanDaily);
  const stdDaily = Math.sqrt(varDaily);
  const downsideStdDaily = Math.sqrt(sumDownsideSq / nRets);

  const annualVolPct = stdDaily * Math.sqrt(252) * 100.0;
  const rfDaily = 0.025 / 252.0;
  const sharpe = stdDaily > 1e-9 ? ((meanDaily - rfDaily) / stdDaily) * Math.sqrt(252) : 0.0;
  const sortino =
    downsideStdDaily > 1e-9 ? ((meanDaily - rfDaily) / downsideStdDaily) * Math.sqrt(252) : 0.0;
  const calmar = Math.abs(maxDrawdownPct) > 0.01 ? cagrPct / Math.abs(maxDrawdownPct) : cagrPct;
  const upi = ulcerIndex > 0.01 ? (cagrPct - 2.5) / ulcerIndex : cagrPct; // Martin / Ulcer Performance Index

  // Yearly returns
  const yearlyReturns = [];
  let yrStartEq = equityCurve[0];
  let yrBenchStart = benchmarkCurve[0];
  let curYear = simDates[0].slice(0, 4);

  for (let i = 1; i < numDays; i++) {
    const y = simDates[i].slice(0, 4);
    if (y !== curYear || i === numDays - 1) {
      const endIdxForYr = y !== curYear ? i - 1 : i;
      const yrEndEq = equityCurve[endIdxForYr];
      const yrBenchEnd = benchmarkCurve[endIdxForYr];
      yearlyReturns.push({
        year: curYear,
        returnPct: yrStartEq > 0 ? (yrEndEq / yrStartEq - 1.0) * 100.0 : 0.0,
        benchReturnPct: yrBenchStart > 0 ? (yrBenchEnd / yrBenchStart - 1.0) * 100.0 : 0.0,
      });
      curYear = y;
      yrStartEq = yrEndEq;
      yrBenchStart = yrBenchEnd;
    }
  }

  const winYears = yearlyReturns.filter((y) => y.returnPct > 0).length;
  const winRateYearlyPct =
    yearlyReturns.length > 0 ? (winYears / yearlyReturns.length) * 100.0 : 0.0;
  const worstYearReturnPct =
    yearlyReturns.length > 0 ? Math.min(...yearlyReturns.map((y) => y.returnPct)) : 0.0;

  // Weekly trade frequency statistics
  let maxTradesInSingleWeek = 0;
  for (const cnt of isoWeekTradeCounts.values()) {
    if (cnt > maxTradesInSingleWeek) maxTradesInSingleWeek = cnt;
  }
  const totalTrades = ruleTradeCount + rebalanceCount;
  const avgTradesPerWeek = totalTrades / Math.max(1, numDays / 5.0);
  const avgTradesPerYear = totalTrades / years;

  // Composite Low-MDD + High-Return Pareto Score
  const paretoScore =
    calmar * 22.0 +
    sortino * 14.0 +
    sharpe * 14.0 +
    cagrPct * 1.6 -
    Math.abs(maxDrawdownPct) * 1.15 -
    ulcerIndex * 0.8;

  // Downsampled curve (~180 points) for HTML charting
  const sampleStep = Math.max(1, Math.floor(numDays / 180));
  const compactDates = [];
  const compactNormEquity = [];
  const compactDrawdown = [];
  for (let i = 0; i < numDays; i += sampleStep) {
    compactDates.push(simDates[i]);
    compactNormEquity.push(Math.round((equityCurve[i] / initialCapital) * 10000) / 100);
    compactDrawdown.push(Math.round(drawdownCurve[i] * 100) / 100);
  }
  if (compactDates[compactDates.length - 1] !== simDates[numDays - 1]) {
    compactDates.push(simDates[numDays - 1]);
    compactNormEquity.push(Math.round((finalEquity / initialCapital) * 10000) / 100);
    compactDrawdown.push(Math.round(drawdownCurve[numDays - 1] * 100) / 100);
  }

  const allocLabels = activeAlloc
    .filter((a) => a.weight > 0)
    .map((a) => `${catalogMap[a.ticker]?.shortName || a.ticker} ${(a.weight * 100).toFixed(0)}%`);
  const cashWeightPct = Math.round((1.0 - totalTargetWeight) * 100);
  if (cashWeightPct > 0) {
    allocLabels.push(`현금(US3M) ${cashWeightPct}%`);
  }

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
      avgTradesPerYear: Math.round(avgTradesPerYear * 100) / 100,
      avgTradesPerWeek: Math.round(avgTradesPerWeek * 1000) / 1000,
      maxTradesInSingleWeek,
      weeklyCapBlockedCount,
      totalFeesPaid: Math.round(totalFeesPaid),
      paretoScore: Math.round(paretoScore * 100) / 100,
    },
    summaryText: {
      allocations: allocLabels.join(" + ") || "현금(US3M) 100%",
      rules: rules.map((r) => BaseEngine.summarizeRule(r, catalogMap)),
    },
    yearlyReturns,
    compactCurve: {
      dates: compactDates,
      normEquity: compactNormEquity,
      drawdown: compactDrawdown,
    },
    tradeLogs: tradeLogs.slice(0, 50),
  };
}

module.exports = {
  IndicatorEngine,
  BaseEngine,
  runNextOpenBacktest,
};
