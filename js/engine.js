/**
 * engine.js
 * Multi-Asset Portfolio & Cross-Condition Backtesting Engine
 */
(function (global) {
  "use strict";

  const IndicatorEngine = global.IndicatorEngine;

  function evaluateConditionAt(marketData, cond, idx) {
    if (idx < 0) return false;
    const op = (cond.operator || ">").toUpperCase();
    const leftSpec = cond.left || { ticker: "SPX", transform: "PRICE", p1: 20, p2: 2, p3: 9 };

    // Special Bollinger & MACD built-in operators on leftSpec.ticker
    if (
      op === "BB_UPPER_TOUCH" ||
      op === "BB_LOWER_TOUCH" ||
      op === "BB_UPPER_CROSS" ||
      op === "BB_LOWER_CROSS"
    ) {
      const p1 = Number(leftSpec.p1 || 20);
      const p2 = Number(leftSpec.p2 || 2.0);
      const priceArr = IndicatorEngine.getIndicatorSeries(marketData, {
        ticker: leftSpec.ticker,
        transform: "PRICE",
      });
      const boundTransform = op.includes("UPPER") ? "BB_UPPER" : "BB_LOWER";
      const boundArr = IndicatorEngine.getIndicatorSeries(marketData, {
        ticker: leftSpec.ticker,
        transform: boundTransform,
        p1,
        p2,
      });
      if (!priceArr.length || !boundArr.length) return false;
      const curP = priceArr[idx];
      const curB = boundArr[idx];
      const prevIdx = Math.max(0, idx - 1);
      const prevP = priceArr[prevIdx];
      const prevB = boundArr[prevIdx];

      if (op === "BB_UPPER_TOUCH") return curP >= curB;
      if (op === "BB_LOWER_TOUCH") return curP <= curB;
      if (op === "BB_UPPER_CROSS") return idx > 0 && prevP < prevB && curP >= curB;
      if (op === "BB_LOWER_CROSS") return idx > 0 && prevP > prevB && curP <= curB;
    }

    if (op === "MACD_GOLDEN" || op === "MACD_DEAD") {
      const f = Number(leftSpec.p1 || 12);
      const s = Number(leftSpec.p2 || 26);
      const g = Number(leftSpec.p3 || 9);
      const histArr = IndicatorEngine.getIndicatorSeries(marketData, {
        ticker: leftSpec.ticker,
        transform: "MACD_HIST",
        p1: f,
        p2: s,
        p3: g,
      });
      if (!histArr.length || idx <= 0) return false;
      const prevH = histArr[idx - 1];
      const curH = histArr[idx];
      if (op === "MACD_GOLDEN") return prevH <= 0 && curH > 0;
      if (op === "MACD_DEAD") return prevH >= 0 && curH < 0;
    }

    // Standard comparison between Left Series and Right (Value or Indicator Series)
    const leftArr = IndicatorEngine.getIndicatorSeries(marketData, leftSpec);
    if (!leftArr.length) return false;
    const curL = leftArr[idx];
    const prevL = leftArr[Math.max(0, idx - 1)];

    let curR = 0;
    let prevR = 0;
    if (cond.rightMode === "INDICATOR" && cond.rightIndicator) {
      const rightArr = IndicatorEngine.getIndicatorSeries(marketData, cond.rightIndicator);
      if (!rightArr.length) return false;
      curR = rightArr[idx];
      prevR = rightArr[Math.max(0, idx - 1)];
    } else {
      curR = Number(cond.rightValue ?? 0);
      prevR = curR;
    }

    switch (op) {
      case ">":
        return curL > curR;
      case ">=":
        return curL >= curR;
      case "<":
        return curL < curR;
      case "<=":
        return curL <= curR;
      case "CROSS_UP":
      case "CROSS_ABOVE":
        return idx > 0 && prevL <= prevR && curL > curR;
      case "CROSS_DOWN":
      case "CROSS_BELOW":
        return idx > 0 && prevL >= prevR && curL < curR;
      default:
        return false;
    }
  }

  function evaluateRuleAt(marketData, rule, idx) {
    if (!rule || !rule.enabled || !Array.isArray(rule.conditions) || rule.conditions.length === 0) {
      return false;
    }
    const logic = (rule.logic || "AND").toUpperCase();
    if (logic === "OR") {
      for (let i = 0; i < rule.conditions.length; i++) {
        if (evaluateConditionAt(marketData, rule.conditions[i], idx)) return true;
      }
      return false;
    } else {
      for (let i = 0; i < rule.conditions.length; i++) {
        if (!evaluateConditionAt(marketData, rule.conditions[i], idx)) return false;
      }
      return true;
    }
  }

  function summarizeCondition(cond, catalogMap) {
    const leftLabel = IndicatorEngine.formatIndicatorLabel(cond.left, catalogMap);
    const op = (cond.operator || ">").toUpperCase();
    const p1 = cond.left?.p1 || 20;
    const p2 = cond.left?.p2 || 2;
    const p3 = cond.left?.p3 || 9;

    if (op === "BB_UPPER_TOUCH") return `${leftLabel} 볼린저상단(${p1}일,${p2}σ) 터치/돌파`;
    if (op === "BB_LOWER_TOUCH") return `${leftLabel} 볼린저하단(${p1}일,${p2}σ) 터치/이탈`;
    if (op === "BB_UPPER_CROSS") return `${leftLabel} 볼린저상단(${p1}일,${p2}σ) 상향돌파`;
    if (op === "BB_LOWER_CROSS") return `${leftLabel} 볼린저하단(${p1}일,${p2}σ) 하향돌파`;
    if (op === "MACD_GOLDEN") return `${leftLabel} MACD(${p1},${p2},${p3}) 골든크로스`;
    if (op === "MACD_DEAD") return `${leftLabel} MACD(${p1},${p2},${p3}) 데드크로스`;

    const opMap = {
      ">": ">",
      ">=": "≥",
      "<": "<",
      "<=": "≤",
      CROSS_UP: "↗ 상향돌파",
      CROSS_DOWN: "↘ 하향돌파",
    };
    const rightLabel =
      cond.rightMode === "INDICATOR" && cond.rightIndicator
        ? IndicatorEngine.formatIndicatorLabel(cond.rightIndicator, catalogMap)
        : `${cond.rightValue ?? 0}`;
    return `${leftLabel} ${opMap[op] || op} ${rightLabel}`;
  }

  function summarizeRule(rule, catalogMap) {
    if (!rule || !Array.isArray(rule.conditions)) return "";
    const joiner = (rule.logic || "AND").toUpperCase() === "OR" ? " OR " : " AND ";
    const condText = rule.conditions.map((c) => summarizeCondition(c, catalogMap)).join(joiner);
    const act = rule.action || {};
    const targetName = catalogMap[act.targetTicker]?.shortName || act.targetTicker || "";
    const actTypeMap = {
      BUY: "매수",
      SELL: "매도",
      SELL_ALL: "전량매도",
    };
    const sizeTypeMap = {
      AMOUNT: `₩${Number(act.sizingValue || 0).toLocaleString()}`,
      TOTAL_PCT: `총자산의 ${act.sizingValue}%`,
      BALANCE_PCT: act.type === "BUY" ? `현금잔액의 ${act.sizingValue}%` : `보유잔액의 ${act.sizingValue}%`,
    };
    const sizeText = act.type === "SELL_ALL" ? "100%" : sizeTypeMap[act.sizingMode] || `${act.sizingValue}%`;
    return `[${condText}] ⇒ ${targetName} ${sizeText} ${actTypeMap[act.type] || act.type}`;
  }

  /**
   * Run full portfolio backtest over specified date range (KRW Base Currency with USDKRW FX Conversion)
   */
  function runBacktest(marketData, config) {
    const dates = marketData.dates;
    const totalDays = dates.length;
    if (!totalDays) throw new Error("데이터가 비어 있습니다.");

    const catalogMap = {};
    (marketData.catalog || []).forEach((item) => {
      catalogMap[item.id] = item;
    });

    const usdkrwSeries = marketData.series["USDKRW"] || null;
    function getExchangeRate(gIdx) {
      if (!usdkrwSeries || !usdkrwSeries[gIdx]) return 1300.0;
      return Number(usdkrwSeries[gIdx]);
    }

    function getPriceKrw(ticker, gIdx) {
      const cur = catalogMap[ticker]?.currency || "USD";
      const rawPx = marketData.series[ticker] ? marketData.series[ticker][gIdx] : 0;
      if (cur === "KRW") return rawPx;
      return rawPx * getExchangeRate(gIdx);
    }

    function getRawPrice(ticker, gIdx) {
      return marketData.series[ticker] ? marketData.series[ticker][gIdx] : 0;
    }

    // Open Price & Open FX accessors for NEXT_OPEN execution
    function getOpenRawPrice(ticker, gIdx) {
      if (marketData.openSeries && marketData.openSeries[ticker] && marketData.openSeries[ticker][gIdx]) {
        return Number(marketData.openSeries[ticker][gIdx]);
      }
      return getRawPrice(ticker, gIdx);
    }

    function getOpenExchangeRate(gIdx) {
      if (marketData.openSeries && marketData.openSeries["USDKRW"] && marketData.openSeries["USDKRW"][gIdx]) {
        return Number(marketData.openSeries["USDKRW"][gIdx]);
      }
      return getExchangeRate(gIdx);
    }

    function getOpenPriceKrw(ticker, gIdx) {
      const cur = catalogMap[ticker]?.currency || "USD";
      const rawPx = getOpenRawPrice(ticker, gIdx);
      if (cur === "KRW") return rawPx;
      return rawPx * getOpenExchangeRate(gIdx);
    }

    // Find start and end indices
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

    // Feature toggles
    const rebalanceEnabled = config.rebalanceEnabled !== false;
    const rulesEnabled = config.rulesEnabled !== false;

    // Normalize target allocations
    const rawAlloc = Array.isArray(config.allocations) ? config.allocations : [];
    const activeAlloc = rawAlloc
      .filter((a) => a && a.ticker && marketData.series[a.ticker] && Number(a.weightPct) >= 0)
      .map((a) => ({ ticker: a.ticker, weight: Number(a.weightPct) / 100.0 }));

    // Ensure any asset targeted by rules is also tracked in holdings
    const trackedTickersSet = new Set(activeAlloc.map((a) => a.ticker));
    const rules = (rulesEnabled && Array.isArray(config.rules)) ? config.rules.filter((r) => r && r.enabled) : [];
    rules.forEach((r) => {
      if (r.action && r.action.targetTicker && marketData.series[r.action.targetTicker]) {
        trackedTickersSet.add(r.action.targetTicker);
      }
      if (r.action && r.action.fundingSource && marketData.series[r.action.fundingSource]) {
        trackedTickersSet.add(r.action.fundingSource);
      }
    });

    const benchmarkTicker = config.benchmarkTicker || "SPX";

    // Bitcoin 2010-07-20 auto-protection: prevent 1970~2010 $0.08 flat-cash distortion
    let hasBtc =
      trackedTickersSet.has("BTC_KRW") ||
      trackedTickersSet.has("BTC_USD") ||
      benchmarkTicker === "BTC_KRW" ||
      benchmarkTicker === "BTC_USD";

    if (!hasBtc && rules.length > 0) {
      hasBtc = rules.some((r) => {
        const conds = r.conditions || [];
        return conds.some(
          (c) =>
            c.left?.ticker === "BTC_KRW" ||
            c.left?.ticker === "BTC_USD" ||
            c.left?.ticker2 === "BTC_KRW" ||
            c.left?.ticker2 === "BTC_USD" ||
            (c.rightMode === "INDICATOR" &&
              (c.rightIndicator?.ticker === "BTC_KRW" || c.rightIndicator?.ticker === "BTC_USD"))
        );
      });
    }

    let btcAdjustedNotice = null;
    if (hasBtc && dates[startIdx] < "2010-07-20") {
      let btcMinIdx = 0;
      while (btcMinIdx < totalDays - 1 && dates[btcMinIdx] < "2010-07-20") btcMinIdx++;
      if (btcMinIdx < endIdx) {
        startIdx = btcMinIdx;
        btcAdjustedNotice =
          "비트코인(BTC)은 2010년 7월 20일 이전 실거래 데이터가 존재하지 않아(1970~2010 $0.08/24원 고정 왜곡 방지), 백테스트 시작일이 2010-07-20으로 자동 제한되었습니다.";
      }
    }

    const numDays = endIdx - startIdx + 1;
    // Initial capital in KRW (default: 10,000,000 KRW)
    const initialCapital = Math.max(1000, Number(config.initialCapital || 10000000));
    const feeRate = Math.max(0, Number(config.feeRatePct ?? 0.05)) / 100.0;

    // Execution Mode: NEXT_CLOSE (default), NEXT_OPEN, SAME_DAY_CLOSE
    let executionMode = config.executionMode || (config.executionLag === 0 || config.executionLag === "0" ? "SAME_DAY_CLOSE" : (config.executionLag === "NEXT_OPEN" ? "NEXT_OPEN" : "NEXT_CLOSE"));
    const executionLag = executionMode === "SAME_DAY_CLOSE" ? 0 : 1;
    const isExecuteAtOpen = executionMode === "NEXT_OPEN";
    const cashYieldMode = config.cashYieldMode || "US3M";

    const trackedTickers = Array.from(trackedTickersSet);
    const targetWeights = {};
    trackedTickers.forEach((t) => (targetWeights[t] = 0));

    let totalTargetWeight = 0;
    activeAlloc.forEach((a) => {
      targetWeights[a.ticker] = (targetWeights[a.ticker] || 0) + a.weight;
      totalTargetWeight += a.weight;
    });
    // If sum of target weights > 1.0, normalize to 1.0
    if (totalTargetWeight > 1.0001) {
      trackedTickers.forEach((t) => {
        targetWeights[t] /= totalTargetWeight;
      });
      totalTargetWeight = 1.0;
    }

    // Portfolio state: shares per ticker + KRW cash
    const shares = {};
    trackedTickers.forEach((t) => (shares[t] = 0));
    let cash = initialCapital;

    // Initial allocation purchase on startIdx in KRW
    let totalFeesPaid = 0;
    trackedTickers.forEach((t) => {
      const w = targetWeights[t] || 0;
      if (w > 0) {
        const allocKrw = initialCapital * w;
        const fee = allocKrw * feeRate;
        const netInvest = allocKrw - fee;
        const pxKrw = getPriceKrw(t, startIdx);
        if (pxKrw > 0) {
          shares[t] = netInvest / pxKrw;
          cash -= allocKrw;
          totalFeesPaid += fee;
        }
      }
    });
    if (cash < 0 && cash > -1e-6) cash = 0;

    // Arrays for time series output
    const simDates = new Array(numDays);
    const equityCurve = new Float64Array(numDays);
    const drawdownCurve = new Float64Array(numDays);
    const benchmarkCurve = new Float64Array(numDays);
    const cashRatioCurve = new Float64Array(numDays);
    const assetWeightHistory = {};
    trackedTickers.forEach((t) => {
      assetWeightHistory[t] = new Float64Array(numDays);
    });

    const tradeLogs = [];
    const ruleLastFiredIdx = new Map();
    let rebalanceCount = 0;
    let ruleTradeCount = 0;

    const us3mSeries = marketData.series["US3M"] || null;
    const benchSeries = marketData.series[benchmarkTicker] || marketData.series["SPX"];
    const benchStartPx = benchSeries ? benchSeries[startIdx] : 100;

    let peakEquity = initialCapital;
    let maxDrawdownPct = 0;
    let maxDrawdownDate = dates[startIdx];
    let lastRebalanceIdx = startIdx;
    let lastRuleTradeIdx = -9999;

    const allocTickerSet = new Set(activeAlloc.filter((a) => a.weight > 0).map((a) => a.ticker));

    // Helper: calculate current portfolio value at global index gIdx (in KRW)
    function getPortfolioValuation(gIdx) {
      let assetVal = 0;
      const vals = {};
      for (let i = 0; i < trackedTickers.length; i++) {
        const t = trackedTickers[i];
        const v = shares[t] * getPriceKrw(t, gIdx);
        vals[t] = v;
        assetVal += v;
      }
      return { total: cash + assetVal, assetVal, vals };
    }

    // Rebalance configuration
    const rebCfg = config.rebalance || {};
    const periodMode = (rebCfg.periodMode || "NONE").toUpperCase();
    const customRebDays = Math.max(1, Math.floor(Number(rebCfg.customDays || 60)));
    const bandMode = (rebCfg.bandMode || "NONE").toUpperCase();
    const bandThreshold = Math.max(0.5, Number(rebCfg.bandThreshold || 5.0)) / 100.0;

    function shouldPeriodRebalance(gIdx) {
      if (!rebalanceEnabled || gIdx <= startIdx || periodMode === "NONE" || totalTargetWeight <= 0) return false;
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

    function shouldBandRebalance(gIdx, valuation) {
      if (!rebalanceEnabled || gIdx <= startIdx || bandMode === "NONE" || totalTargetWeight <= 0) return false;
      if (valuation.total <= 0) return false;
      if (gIdx - lastRuleTradeIdx < 20 || gIdx - lastRebalanceIdx < 10) return false;

      for (let i = 0; i < trackedTickers.length; i++) {
        const t = trackedTickers[i];
        if (!allocTickerSet.has(t)) continue;
        const targetW = targetWeights[t] || 0;
        const curW = (valuation.vals[t] || 0) / valuation.total;
        const diff = Math.abs(curW - targetW);
        if (bandMode === "ABS_PP") {
          if (diff >= bandThreshold) return true;
        } else if (bandMode === "REL_PCT" && targetW > 0) {
          if (diff / targetW >= bandThreshold) return true;
        }
      }
      return false;
    }

    function executeRebalance(gIdx, reasonLabel, step) {
      const val = getPortfolioValuation(gIdx);
      const totalEq = val.total;
      if (totalEq <= 0) return;

      let tacticalOnlyVal = 0;
      for (let i = 0; i < trackedTickers.length; i++) {
        const t = trackedTickers[i];
        if (!allocTickerSet.has(t)) {
          tacticalOnlyVal += val.vals[t] || 0;
        }
      }
      const rebalanceableEq = Math.max(0, totalEq - tacticalOnlyVal);
      if (rebalanceableEq <= 1000) return;

      let tradedDollar = 0;
      // 1. Sell overweight core assets first
      for (let i = 0; i < trackedTickers.length; i++) {
        const t = trackedTickers[i];
        if (!allocTickerSet.has(t)) continue;
        const targetDollar = rebalanceableEq * (targetWeights[t] || 0);
        const curDollar = val.vals[t] || 0;
        const diff = curDollar - targetDollar;
        if (diff > 1000.0) {
          const pxKrw = getPriceKrw(t, gIdx);
          const sellShares = diff / pxKrw;
          const fee = diff * feeRate;
          shares[t] = Math.max(0, shares[t] - sellShares);
          cash += diff - fee;
          totalFeesPaid += fee;
          tradedDollar += diff;
        }
      }
      // 2. Buy underweight core assets
      for (let i = 0; i < trackedTickers.length; i++) {
        const t = trackedTickers[i];
        if (!allocTickerSet.has(t)) continue;
        const targetDollar = rebalanceableEq * (targetWeights[t] || 0);
        const curDollar = shares[t] * getPriceKrw(t, gIdx);
        const needDollar = targetDollar - curDollar;
        if (needDollar > 1000.0 && cash > 1000.0) {
          const spend = Math.min(cash, needDollar);
          const fee = spend * feeRate;
          const netBuy = spend - fee;
          const pxKrw = getPriceKrw(t, gIdx);
          if (pxKrw > 0) {
            shares[t] += netBuy / pxKrw;
            cash -= spend;
            totalFeesPaid += fee;
            tradedDollar += spend;
          }
        }
      }

      if (tradedDollar > 1000) {
        rebalanceCount++;
        lastRebalanceIdx = gIdx;
        if (tradeLogs.length < 1500) {
          tradeLogs.push({
            date: dates[gIdx],
            stepIndex: step,
            globalIndex: gIdx,
            type: "REBALANCE",
            ruleName: reasonLabel,
            ticker: "PORTFOLIO",
            tickerName: "포트폴리오 리밸런싱",
            currency: "KRW",
            rawPrice: 0,
            rate: getExchangeRate(gIdx),
            priceKrw: 0,
            shares: 0,
            amount: tradedDollar,
            amountKrw: tradedDollar,
            feeKrw: totalFeesPaid,
            equityAfter: getPortfolioValuation(gIdx).total,
          });
        }
      }
    }

    // Main daily simulation loop
    for (let step = 0; step < numDays; step++) {
      const gIdx = startIdx + step;
      const curDate = dates[gIdx];
      simDates[step] = curDate;

      // 1. Accrue overnight cash interest if enabled
      if (step > 0 && cash > 0 && cashYieldMode === "US3M" && us3mSeries) {
        const annualRate = Math.max(0, us3mSeries[gIdx - 1]) / 100.0;
        cash *= 1.0 + annualRate / 252.0;
      }

      // 2. Evaluate and execute cross-asset rules (if rulesEnabled)
      if (rulesEnabled && step > 0 && rules.length > 0) {
        const sigIdx = gIdx - executionLag;
        if (sigIdx >= 0) {
          const triggeredSells = [];
          const triggeredBuys = [];

          for (let rIdx = 0; rIdx < rules.length; rIdx++) {
            const rule = rules[rIdx];
            const cooldown = Math.max(1, Number(rule.cooldownDays ?? 5));
            const lastFired = ruleLastFiredIdx.get(rule.id);
            if (lastFired !== undefined && gIdx - lastFired < cooldown) continue;

            if (evaluateRuleAt(marketData, rule, sigIdx)) {
              const actType = (rule.action?.type || "BUY").toUpperCase();
              if (actType === "SELL" || actType === "SELL_ALL") {
                triggeredSells.push(rule);
              } else {
                triggeredBuys.push(rule);
              }
            }
          }

          // Execute SELL rules
          for (let i = 0; i < triggeredSells.length; i++) {
            const rule = triggeredSells[i];
            const act = rule.action || {};
            const t = act.targetTicker;
            if (!t || !marketData.series[t]) continue;

            const val = getPortfolioValuation(gIdx);
            const holdingVal = val.vals[t] || 0;
            if (holdingVal <= 10.0) continue;

            let sellDollar = 0;
            const sMode = (act.sizingMode || "BALANCE_PCT").toUpperCase();
            const sVal = Math.max(0, Number(act.sizingValue ?? 100));

            if (act.type === "SELL_ALL") {
              sellDollar = holdingVal;
            } else if (sMode === "AMOUNT") {
              sellDollar = Math.min(holdingVal, sVal);
            } else if (sMode === "TOTAL_PCT") {
              sellDollar = Math.min(holdingVal, val.total * (sVal / 100.0));
            } else {
              sellDollar = holdingVal * Math.min(1.0, sVal / 100.0);
            }

            if (sellDollar > 10.0) {
              const px = isExecuteAtOpen ? getOpenRawPrice(t, gIdx) : getRawPrice(t, gIdx);
              const pxKrw = isExecuteAtOpen ? getOpenPriceKrw(t, gIdx) : getPriceKrw(t, gIdx);
              const cur = catalogMap[t]?.currency || "USD";
              const rate = isExecuteAtOpen ? getOpenExchangeRate(gIdx) : getExchangeRate(gIdx);
              const sellSh = sellDollar / pxKrw;
              const fee = sellDollar * feeRate;
              shares[t] = Math.max(0, shares[t] - sellSh);
              cash += sellDollar - fee;
              totalFeesPaid += fee;
              ruleLastFiredIdx.set(rule.id, gIdx);
              lastRuleTradeIdx = gIdx;
              ruleTradeCount++;

              if (tradeLogs.length < 1500) {
                tradeLogs.push({
                  date: curDate,
                  stepIndex: step,
                  globalIndex: gIdx,
                  signalDate: dates[sigIdx],
                  type: "SELL",
                  ruleName: rule.name || "매도 조건",
                  ticker: t,
                  tickerName: catalogMap[t]?.shortName || t,
                  currency: cur,
                  rawPrice: px,
                  rate: rate,
                  priceKrw: pxKrw,
                  shares: sellSh,
                  amount: sellDollar,
                  amountKrw: sellDollar,
                  feeKrw: fee,
                  price: px,
                  execType: isExecuteAtOpen ? "익일시가" : (executionLag === 0 ? "당일종가" : "익일종가"),
                  equityAfter: getPortfolioValuation(gIdx).total,
                });
              }
            }
          }

          // Execute BUY rules
          for (let i = 0; i < triggeredBuys.length; i++) {
            const rule = triggeredBuys[i];
            const act = rule.action || {};
            const t = act.targetTicker;
            if (!t || !marketData.series[t]) continue;

            let val = getPortfolioValuation(gIdx);
            const sMode = (act.sizingMode || "TOTAL_PCT").toUpperCase();
            const sVal = Math.max(0, Number(act.sizingValue ?? 20));
            const funding = act.fundingSource || "CASH_THEN_PRORATA";

            let desiredBuyDollar = 0;
            if (sMode === "AMOUNT") {
              desiredBuyDollar = Math.min(val.total, sVal);
            } else if (sMode === "TOTAL_PCT") {
              desiredBuyDollar = val.total * Math.min(1.0, sVal / 100.0);
            } else {
              if (cash > 1000.0 || funding === "CASH_ONLY") {
                desiredBuyDollar = cash * Math.min(1.0, sVal / 100.0);
              } else if (funding !== "CASH_ONLY" && funding !== "CASH_THEN_PRORATA" && val.vals[funding] > 1000) {
                desiredBuyDollar = val.vals[funding] * Math.min(1.0, sVal / 100.0);
              } else {
                desiredBuyDollar = (val.total - (val.vals[t] || 0)) * Math.min(1.0, sVal / 100.0);
              }
            }

            if (desiredBuyDollar > cash + 10.0 && funding !== "CASH_ONLY") {
              const shortfall = desiredBuyDollar - cash;
              if (funding !== "CASH_THEN_PRORATA" && marketData.series[funding] && funding !== t) {
                const availFund = val.vals[funding] || 0;
                const toLiquidate = Math.min(availFund, shortfall / (1 - feeRate));
                if (toLiquidate > 10.0) {
                  const pxFKrw = getPriceKrw(funding, gIdx);
                  const feeF = toLiquidate * feeRate;
                  shares[funding] = Math.max(0, shares[funding] - toLiquidate / pxFKrw);
                  cash += toLiquidate - feeF;
                  totalFeesPaid += feeF;
                }
              } else if (funding === "CASH_THEN_PRORATA") {
                let otherTotal = 0;
                for (let k = 0; k < trackedTickers.length; k++) {
                  const ot = trackedTickers[k];
                  if (ot !== t) otherTotal += val.vals[ot] || 0;
                }
                if (otherTotal > 10.0) {
                  const sellFraction = Math.min(1.0, (shortfall / (1 - feeRate)) / otherTotal);
                  for (let k = 0; k < trackedTickers.length; k++) {
                    const ot = trackedTickers[k];
                    if (ot === t) continue;
                    const otVal = (val.vals[ot] || 0) * sellFraction;
                    if (otVal > 10.0) {
                      const pxOKrw = getPriceKrw(ot, gIdx);
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
            if (actualSpend > 100.0) {
              const px = isExecuteAtOpen ? getOpenRawPrice(t, gIdx) : getRawPrice(t, gIdx);
              const pxKrw = isExecuteAtOpen ? getOpenPriceKrw(t, gIdx) : getPriceKrw(t, gIdx);
              const cur = catalogMap[t]?.currency || "USD";
              const rate = isExecuteAtOpen ? getOpenExchangeRate(gIdx) : getExchangeRate(gIdx);
              const fee = actualSpend * feeRate;
              const netBuy = actualSpend - fee;
              if (pxKrw > 0) {
                const buySh = netBuy / pxKrw;
                shares[t] += buySh;
                cash -= actualSpend;
                totalFeesPaid += fee;
                ruleLastFiredIdx.set(rule.id, gIdx);
                lastRuleTradeIdx = gIdx;
                ruleTradeCount++;

                if (tradeLogs.length < 1500) {
                  tradeLogs.push({
                    date: curDate,
                    stepIndex: step,
                    globalIndex: gIdx,
                    signalDate: dates[sigIdx],
                    type: "BUY",
                    ruleName: rule.name || "매수 조건",
                    ticker: t,
                    tickerName: catalogMap[t]?.shortName || t,
                    currency: cur,
                    rawPrice: px,
                    rate: rate,
                    priceKrw: pxKrw,
                    shares: buySh,
                    amount: actualSpend,
                    amountKrw: actualSpend,
                    feeKrw: fee,
                    price: px,
                    execType: isExecuteAtOpen ? "익일시가" : (executionLag === 0 ? "당일종가" : "익일종가"),
                    equityAfter: getPortfolioValuation(gIdx).total,
                  });
                }
              }
            }
          }
        }
      }

      // 3. Check Periodic or Threshold Band Rebalancing (if rebalanceEnabled)
      if (rebalanceEnabled && step > 0 && totalTargetWeight > 0) {
        const valNow = getPortfolioValuation(gIdx);
        const periodTrig = shouldPeriodRebalance(gIdx);
        const bandTrig = !periodTrig && shouldBandRebalance(gIdx, valNow);
        if (periodTrig) {
          executeRebalance(gIdx, `정기 리밸런싱 (${periodMode})`, step);
        } else if (bandTrig) {
          executeRebalance(gIdx, `비율초과 밴드 리밸런싱`, step);
        }
      }

      // 4. Record end-of-day valuation, weights, benchmark, drawdown
      const eodVal = getPortfolioValuation(gIdx);
      const eq = eodVal.total;
      equityCurve[step] = eq;

      if (eq > peakEquity) peakEquity = eq;
      const dd = peakEquity > 0 ? ((eq - peakEquity) / peakEquity) * 100.0 : 0.0;
      drawdownCurve[step] = dd;
      if (dd < maxDrawdownPct) {
        maxDrawdownPct = dd;
        maxDrawdownDate = curDate;
      }

      cashRatioCurve[step] = eq > 0 ? (cash / eq) * 100.0 : 0.0;
      for (let i = 0; i < trackedTickers.length; i++) {
        const t = trackedTickers[i];
        assetWeightHistory[t][step] = eq > 0 ? ((eodVal.vals[t] || 0) / eq) * 100.0 : 0.0;
      }

      const benchCurKrw = getPriceKrw(benchmarkTicker, gIdx);
      const benchStartKrw = getPriceKrw(benchmarkTicker, startIdx);
      benchmarkCurve[step] = benchStartKrw > 0 ? initialCapital * (benchCurKrw / benchStartKrw) : initialCapital;
    }

    // Compute performance metrics
    const finalEquity = equityCurve[numDays - 1];
    const totalReturnPct = ((finalEquity / initialCapital) - 1.0) * 100.0;
    const years = Math.max(1 / 252, numDays / 252.0);
    const cagrPct = (Math.pow(Math.max(1e-6, finalEquity / initialCapital), 1.0 / years) - 1.0) * 100.0;

    // Benchmark metrics
    const benchFinal = benchmarkCurve[numDays - 1];
    const benchTotalReturnPct = ((benchFinal / initialCapital) - 1.0) * 100.0;
    const benchCagrPct = (Math.pow(Math.max(1e-6, benchFinal / initialCapital), 1.0 / years) - 1.0) * 100.0;
    let benchPeak = initialCapital;
    let benchMddPct = 0;
    const benchDrawdownCurve = new Float64Array(numDays);
    for (let i = 0; i < numDays; i++) {
      if (benchmarkCurve[i] > benchPeak) benchPeak = benchmarkCurve[i];
      const bdd = benchPeak > 0 ? ((benchmarkCurve[i] - benchPeak) / benchPeak) * 100.0 : 0.0;
      benchDrawdownCurve[i] = bdd;
      if (bdd < benchMddPct) benchMddPct = bdd;
    }

    // Daily return stats for Volatility, Sharpe, Sortino
    let sumRet = 0;
    let sumSqRet = 0;
    let sumDownsideSq = 0;
    let posDays = 0;
    const dailyRets = new Float64Array(Math.max(1, numDays - 1));

    for (let i = 1; i < numDays; i++) {
      const r = equityCurve[i - 1] > 0 ? equityCurve[i] / equityCurve[i - 1] - 1.0 : 0.0;
      dailyRets[i - 1] = r;
      sumRet += r;
      sumSqRet += r * r;
      if (r < 0) sumDownsideSq += r * r;
      if (r > 0) posDays++;
    }

    const nRets = Math.max(1, numDays - 1);
    const meanDaily = sumRet / nRets;
    const varDaily = Math.max(0, sumSqRet / nRets - meanDaily * meanDaily);
    const stdDaily = Math.sqrt(varDaily);
    const downsideStdDaily = Math.sqrt(sumDownsideSq / nRets);

    const annualVolPct = stdDaily * Math.sqrt(252) * 100.0;
    const rfDaily = 0.025 / 252.0; // standard 2.5% risk-free baseline for cross-era Sharpe comparability
    const sharpe = stdDaily > 1e-9 ? ((meanDaily - rfDaily) / stdDaily) * Math.sqrt(252) : 0.0;
    const sortino = downsideStdDaily > 1e-9 ? ((meanDaily - rfDaily) / downsideStdDaily) * Math.sqrt(252) : 0.0;
    const calmar = Math.abs(maxDrawdownPct) > 0.01 ? cagrPct / Math.abs(maxDrawdownPct) : cagrPct;

    // Annual returns breakdown
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
          returnPct: yrStartEq > 0 ? ((yrEndEq / yrStartEq) - 1.0) * 100.0 : 0.0,
          benchReturnPct: yrBenchStart > 0 ? ((yrBenchEnd / yrBenchStart) - 1.0) * 100.0 : 0.0,
        });
        curYear = y;
        yrStartEq = yrEndEq;
        yrBenchStart = yrBenchEnd;
      }
    }

    const winYears = yearlyReturns.filter((y) => y.returnPct > 0).length;
    const winRateYearlyPct = yearlyReturns.length > 0 ? (winYears / yearlyReturns.length) * 100.0 : 0.0;

    // Composite Quant Score (for Scoreboard ranking)
    // Rewards high Sharpe, high CAGR, high Calmar, and penalizes deep MDD
    const rawScore =
      sharpe * 32.0 +
      Math.min(25, Math.max(-15, cagrPct * 1.4)) +
      Math.min(25, Math.max(0, calmar * 14.0)) -
      Math.max(0, (Math.abs(maxDrawdownPct) - 15) * 0.55);
    const quantScore = Math.round(Math.max(0, Math.min(100, 40 + rawScore)) * 10) / 10;

    // Downsample curves for lightweight storage in Scoreboard history (~250 points max)
    const sampleStep = Math.max(1, Math.floor(numDays / 250));
    const compactDates = [];
    const compactNormEquity = [];
    for (let i = 0; i < numDays; i += sampleStep) {
      compactDates.push(simDates[i]);
      compactNormEquity.push(Math.round((equityCurve[i] / initialCapital) * 10000) / 100); // Base 100
    }
    if (compactDates[compactDates.length - 1] !== simDates[numDays - 1]) {
      compactDates.push(simDates[numDays - 1]);
      compactNormEquity.push(Math.round((finalEquity / initialCapital) * 10000) / 100);
    }

    return {
      configSnapshot: JSON.parse(JSON.stringify(config)),
      summaryText: {
        allocations: activeAlloc
          .filter((a) => a.weight > 0)
          .map((a) => `${catalogMap[a.ticker]?.shortName || a.ticker} ${(a.weight * 100).toFixed(0)}%`)
          .join(" + ") || "현금 100%",
        rules: rules.map((r) => summarizeRule(r, catalogMap)),
      },
      metrics: {
        initialCapital,
        finalEquity,
        totalReturnPct,
        cagrPct,
        maxDrawdownPct,
        maxDrawdownDate,
        annualVolPct,
        sharpe,
        sortino,
        calmar,
        winRateYearlyPct,
        DailyWinRatePct: (posDays / nRets) * 100.0,
        rebalanceCount,
        ruleTradeCount,
        totalFeesPaid,
        quantScore,
        startDate: simDates[0],
        endDate: simDates[numDays - 1],
        tradingDays: numDays,
        years: Math.round(years * 10) / 10,
        benchmarkTicker,
        executionMode,
        benchFinal,
        benchTotalReturnPct,
        benchCagrPct,
        benchMddPct,
        btcAdjustedNotice: btcAdjustedNotice || null,
      },
      btcAdjustedNotice: btcAdjustedNotice || null,
      series: {
        dates: simDates,
        equity: equityCurve,
        drawdown: drawdownCurve,
        benchmark: benchmarkCurve,
        benchDrawdown: benchDrawdownCurve,
        cashRatio: cashRatioCurve,
        assetWeights: assetWeightHistory,
        trackedTickers,
      },
      compactCurve: {
        dates: compactDates,
        normEquity: compactNormEquity,
      },
      yearlyReturns,
      tradeLogs,
    };
  }

  global.BacktestEngine = {
    runBacktest,
    evaluateConditionAt,
    evaluateRuleAt,
    summarizeCondition,
    summarizeRule,
  };
})(window);
