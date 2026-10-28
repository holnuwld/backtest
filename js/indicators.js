/**
 * indicators.js
 * Technical & Macro Derived Indicator Engine for Multi-Asset Backtester
 * Supports: PRICE, SMA, EMA, DISPARITY, BB_UPPER, BB_LOWER, BB_PCT_B, BB_WIDTH,
 *           RSI, MACD_LINE, MACD_SIGNAL, MACD_HIST, DRAWDOWN, ROC, DIFF, SPREAD, RATIO
 */
(function (global) {
  "use strict";

  const cache = new Map();

  function clearIndicatorCache() {
    cache.clear();
  }

  function computeSMA(values, period) {
    const n = values.length;
    const out = new Float64Array(n);
    const p = Math.max(1, Math.floor(period || 20));
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const v = values[i];
      sum += v;
      if (i >= p) {
        sum -= values[i - p];
        out[i] = sum / p;
      } else {
        out[i] = sum / (i + 1);
      }
    }
    return out;
  }

  function computeEMA(values, period) {
    const n = values.length;
    const out = new Float64Array(n);
    if (n === 0) return out;
    const p = Math.max(1, Math.floor(period || 20));
    const k = 2 / (p + 1);
    let ema = values[0];
    out[0] = ema;
    for (let i = 1; i < n; i++) {
      ema = values[i] * k + ema * (1 - k);
      out[i] = ema;
    }
    return out;
  }

  function computeDisparity(values, period) {
    const n = values.length;
    const sma = computeSMA(values, period);
    const out = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      out[i] = sma[i] !== 0 ? (values[i] / sma[i]) * 100.0 : 100.0;
    }
    return out;
  }

  function computeBollinger(values, period, mult) {
    const n = values.length;
    const p = Math.max(2, Math.floor(period || 20));
    const k = Number.isFinite(Number(mult)) && Number(mult) > 0 ? Number(mult) : 2.0;

    const upper = new Float64Array(n);
    const middle = new Float64Array(n);
    const lower = new Float64Array(n);
    const pctB = new Float64Array(n);
    const width = new Float64Array(n);

    let sum = 0;
    let sumSq = 0;

    for (let i = 0; i < n; i++) {
      const v = values[i];
      sum += v;
      sumSq += v * v;

      let count = i + 1;
      if (i >= p) {
        const old = values[i - p];
        sum -= old;
        sumSq -= old * old;
        count = p;
      }

      const mean = sum / count;
      const variance = Math.max(0, sumSq / count - mean * mean);
      const std = Math.sqrt(variance);

      const u = mean + k * std;
      const l = mean - k * std;
      upper[i] = u;
      middle[i] = mean;
      lower[i] = l;

      const bandRange = u - l;
      pctB[i] = bandRange > 1e-12 ? ((v - l) / bandRange) * 100.0 : 50.0;
      width[i] = Math.abs(mean) > 1e-12 ? (bandRange / Math.abs(mean)) * 100.0 : 0.0;
    }

    return { upper, middle, lower, pctB, width };
  }

  function computeRSI(values, period) {
    const n = values.length;
    const out = new Float64Array(n);
    if (n === 0) return out;
    const p = Math.max(2, Math.floor(period || 14));

    out[0] = 50.0;
    let avgGain = 0;
    let avgLoss = 0;

    const initLen = Math.min(p, n - 1);
    for (let i = 1; i <= initLen; i++) {
      const diff = values[i] - values[i - 1];
      if (diff > 0) avgGain += diff;
      else avgLoss -= diff;

      const g = avgGain / i;
      const l = avgLoss / i;
      out[i] = l === 0 ? (g === 0 ? 50.0 : 100.0) : 100.0 - 100.0 / (1.0 + g / l);
    }

    avgGain /= p;
    avgLoss /= p;

    for (let i = p + 1; i < n; i++) {
      const diff = values[i] - values[i - 1];
      const gain = diff > 0 ? diff : 0;
      const loss = diff < 0 ? -diff : 0;
      avgGain = (avgGain * (p - 1) + gain) / p;
      avgLoss = (avgLoss * (p - 1) + loss) / p;
      if (avgLoss < 1e-12) {
        out[i] = avgGain < 1e-12 ? 50.0 : 100.0;
      } else {
        const rs = avgGain / avgLoss;
        out[i] = 100.0 - 100.0 / (1.0 + rs);
      }
    }
    return out;
  }

  function computeMACD(values, fastPeriod, slowPeriod, signalPeriod) {
    const n = values.length;
    const f = Math.max(2, Math.floor(fastPeriod || 12));
    const s = Math.max(f + 1, Math.floor(slowPeriod || 26));
    const sig = Math.max(2, Math.floor(signalPeriod || 9));

    const emaFast = computeEMA(values, f);
    const emaSlow = computeEMA(values, s);
    const macdLine = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      macdLine[i] = emaFast[i] - emaSlow[i];
    }
    const signalLine = computeEMA(macdLine, sig);
    const hist = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      hist[i] = macdLine[i] - signalLine[i];
    }
    return { macdLine, signalLine, hist };
  }

  function computeDrawdown(values, lookback) {
    const n = values.length;
    const out = new Float64Array(n);
    const lb = Math.floor(lookback || 0); // 0 = All-time high up to t

    if (lb <= 0) {
      let peak = -Infinity;
      for (let i = 0; i < n; i++) {
        if (values[i] > peak) peak = values[i];
        out[i] = peak > 0 ? ((values[i] - peak) / peak) * 100.0 : 0.0;
      }
    } else {
      for (let i = 0; i < n; i++) {
        let peak = -Infinity;
        const start = Math.max(0, i - lb + 1);
        for (let j = start; j <= i; j++) {
          if (values[j] > peak) peak = values[j];
        }
        out[i] = peak > 0 ? ((values[i] - peak) / peak) * 100.0 : 0.0;
      }
    }
    return out;
  }

  function computeROC(values, period) {
    const n = values.length;
    const out = new Float64Array(n);
    const p = Math.max(1, Math.floor(period || 20));
    for (let i = 0; i < n; i++) {
      const prevIdx = Math.max(0, i - p);
      const prev = values[prevIdx];
      out[i] = Math.abs(prev) > 1e-12 ? ((values[i] - prev) / Math.abs(prev)) * 100.0 : 0.0;
    }
    return out;
  }

  function computeDiff(values, period) {
    const n = values.length;
    const out = new Float64Array(n);
    const p = Math.max(1, Math.floor(period || 20));
    for (let i = 0; i < n; i++) {
      const prevIdx = Math.max(0, i - p);
      out[i] = values[i] - values[prevIdx];
    }
    return out;
  }

  /**
   * Retrieve a computed indicator series from marketData
   * @param {Object} marketData - { series: { SPX: [...], ... } }
   * @param {Object} spec - { ticker, transform, p1, p2, p3, ticker2 }
   * @returns {Float64Array}
   */
  function getIndicatorSeries(marketData, spec) {
    if (!spec || !spec.ticker) return new Float64Array(0);
    const transform = (spec.transform || "PRICE").toUpperCase();
    const p1 = Number(spec.p1 ?? 20);
    const p2 = Number(spec.p2 ?? 2.0);
    const p3 = Number(spec.p3 ?? 9);
    const ticker2 = spec.ticker2 || "US2Y";

    const key = `${spec.ticker}|${transform}|${p1}|${p2}|${p3}|${ticker2}`;
    if (cache.has(key)) return cache.get(key);

    const raw = marketData.series[spec.ticker];
    if (!raw) return new Float64Array(0);

    let result;
    switch (transform) {
      case "PRICE":
        result = Float64Array.from(raw);
        break;
      case "SMA":
        result = computeSMA(raw, p1 || 20);
        break;
      case "EMA":
        result = computeEMA(raw, p1 || 20);
        break;
      case "DISPARITY":
        result = computeDisparity(raw, p1 || 20);
        break;
      case "BB_UPPER":
      case "BB_LOWER":
      case "BB_MIDDLE":
      case "BB_PCT_B":
      case "BB_WIDTH": {
        const bbKey = `${spec.ticker}|BB_ALL|${p1 || 20}|${p2 || 2.0}`;
        let bb = cache.get(bbKey);
        if (!bb) {
          bb = computeBollinger(raw, p1 || 20, p2 || 2.0);
          cache.set(bbKey, bb);
        }
        if (transform === "BB_UPPER") result = bb.upper;
        else if (transform === "BB_LOWER") result = bb.lower;
        else if (transform === "BB_MIDDLE") result = bb.middle;
        else if (transform === "BB_PCT_B") result = bb.pctB;
        else result = bb.width;
        break;
      }
      case "RSI":
        result = computeRSI(raw, p1 || 14);
        break;
      case "MACD_LINE":
      case "MACD_SIGNAL":
      case "MACD_HIST": {
        const f = p1 || 12;
        const s = p2 || 26;
        const g = p3 || 9;
        const macdKey = `${spec.ticker}|MACD_ALL|${f}|${s}|${g}`;
        let macd = cache.get(macdKey);
        if (!macd) {
          macd = computeMACD(raw, f, s, g);
          cache.set(macdKey, macd);
        }
        if (transform === "MACD_LINE") result = macd.macdLine;
        else if (transform === "MACD_SIGNAL") result = macd.signalLine;
        else result = macd.hist;
        break;
      }
      case "DRAWDOWN":
        result = computeDrawdown(raw, p1 || 0);
        break;
      case "ROC":
        result = computeROC(raw, p1 || 20);
        break;
      case "DIFF":
        result = computeDiff(raw, p1 || 20);
        break;
      case "SPREAD": {
        const raw2 = marketData.series[ticker2] || raw;
        const n = raw.length;
        result = new Float64Array(n);
        for (let i = 0; i < n; i++) {
          result[i] = raw[i] - (raw2[i] ?? 0);
        }
        break;
      }
      case "RATIO": {
        const raw2 = marketData.series[ticker2] || raw;
        const n = raw.length;
        result = new Float64Array(n);
        for (let i = 0; i < n; i++) {
          result[i] = Math.abs(raw2[i]) > 1e-12 ? raw[i] / raw2[i] : 1.0;
        }
        break;
      }
      default:
        result = Float64Array.from(raw);
    }

    cache.set(key, result);
    return result;
  }

  /**
   * Human-readable label for a condition's indicator specification
   */
  function formatIndicatorLabel(spec, catalogMap) {
    if (!spec || !spec.ticker) return "";
    const item = catalogMap && catalogMap[spec.ticker];
    const name = item ? item.shortName : spec.ticker;
    const t = (spec.transform || "PRICE").toUpperCase();
    const p1 = spec.p1 ?? 20;
    const p2 = spec.p2 ?? 2;
    const p3 = spec.p3 ?? 9;

    switch (t) {
      case "PRICE":
        return `${name}`;
      case "SMA":
        return `${name} SMA(${p1}일)`;
      case "EMA":
        return `${name} EMA(${p1}일)`;
      case "DISPARITY":
        return `${name} 이격도(${p1}일, %)`;
      case "BB_UPPER":
        return `${name} 볼린저상단(${p1}일,${p2}σ)`;
      case "BB_LOWER":
        return `${name} 볼린저하단(${p1}일,${p2}σ)`;
      case "BB_MIDDLE":
        return `${name} 볼린저중심(${p1}일)`;
      case "BB_PCT_B":
        return `${name} 볼린저%B(${p1}일,${p2}σ)`;
      case "BB_WIDTH":
        return `${name} 볼린저폭(${p1}일,${p2}σ)`;
      case "RSI":
        return `${name} RSI(${p1}일)`;
      case "MACD_LINE":
        return `${name} MACD선(${p1},${p2},${p3})`;
      case "MACD_SIGNAL":
        return `${name} MACD시그널(${p1},${p2},${p3})`;
      case "MACD_HIST":
        return `${name} MACD히스토그램(${p1},${p2},${p3})`;
      case "DRAWDOWN":
        return `${name} 고점대비하락률(${Number(p1) > 0 ? p1 + "일고점" : "전고점"}, %)`;
      case "ROC":
        return `${name} 모멘텀수익률(${p1}일, %)`;
      case "DIFF":
        return `${name} 변화폭(${p1}일)`;
      case "SPREAD": {
        const item2 = catalogMap && catalogMap[spec.ticker2];
        const name2 = item2 ? item2.shortName : spec.ticker2;
        return `[${name} - ${name2}] 스프레드`;
      }
      case "RATIO": {
        const item2 = catalogMap && catalogMap[spec.ticker2];
        const name2 = item2 ? item2.shortName : spec.ticker2;
        return `[${name} ÷ ${name2}] 비율`;
      }
      default:
        return `${name}`;
    }
  }

  global.IndicatorEngine = {
    clearIndicatorCache,
    getIndicatorSeries,
    formatIndicatorLabel,
    computeSMA,
    computeEMA,
    computeDisparity,
    computeBollinger,
    computeRSI,
    computeMACD,
    computeDrawdown,
    computeROC,
  };
})(window);
