/**
 * tests/strategy_eval/prepare_open_prices.js
 * 
 * Fetches authentic daily Open/Close ratios from Yahoo Finance (^KS11, ^NDX, GLD, GC=F, KRW=X)
 * and builds aligned daily Open price series for KPI200, NDX, KRX_GOLD, and USDKRW
 * across all 14,327 master trading days so that:
 *   - Signals are evaluated on Day (T-1) Close
 *   - Trades are executed on Day (T) Open
 *   - End-of-day portfolio valuation is marked to Day (T) Close
 */

const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(__dirname, "..", "..", "data", "market_data.json");
const OUT_PATH = path.join(__dirname, "open_prices_cache.json");

async function fetchYahooDailyOpenClose(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbol
  )}?interval=1d&period1=0&period2=2000000000`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${symbol}`);
  }
  const json = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result || !result.timestamp) return new Map();

  const timestamps = result.timestamp;
  const quote = result.indicators?.quote?.[0] || {};
  const opens = quote.open || [];
  const closes = quote.close || [];

  const ratioMap = new Map(); // YYYY-MM-DD -> open / close ratio
  for (let i = 0; i < timestamps.length; i++) {
    const o = opens[i];
    const c = closes[i];
    if (o != null && c != null && o > 0 && c > 0) {
      const dt = new Date(timestamps[i] * 1000).toISOString().slice(0, 10);
      const ratio = o / c;
      // Sanity bound on intraday open/close ratio (within +-25%)
      if (ratio > 0.75 && ratio < 1.25) {
        ratioMap.set(dt, ratio);
      }
    }
  }
  return ratioMap;
}

async function main() {
  console.log("[OpenPriceBuilder] Loading master market_data.json ...");
  const marketData = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  const dates = marketData.dates;
  const n = dates.length;

  console.log("[OpenPriceBuilder] Fetching Yahoo Finance Open/Close series (^KS11, ^NDX, GLD, GC=F, KRW=X) ...");
  const [ks11Map, ndxMap, gldMap, gcfMap, krwMap] = await Promise.all([
    fetchYahooDailyOpenClose("^KS11").catch((e) => {
      console.warn("Warning ^KS11:", e.message);
      return new Map();
    }),
    fetchYahooDailyOpenClose("^NDX").catch((e) => {
      console.warn("Warning ^NDX:", e.message);
      return new Map();
    }),
    fetchYahooDailyOpenClose("GLD").catch((e) => {
      console.warn("Warning GLD:", e.message);
      return new Map();
    }),
    fetchYahooDailyOpenClose("GC=F").catch((e) => {
      console.warn("Warning GC=F:", e.message);
      return new Map();
    }),
    fetchYahooDailyOpenClose("KRW=X").catch((e) => {
      console.warn("Warning KRW=X:", e.message);
      return new Map();
    }),
  ]);

  console.log(
    `[OpenPriceBuilder] Fetched ratios -> ^KS11: ${ks11Map.size}d, ^NDX: ${ndxMap.size}d, GLD: ${gldMap.size}d, GC=F: ${gcfMap.size}d, KRW=X: ${krwMap.size}d`
  );

  function buildOpenSeries(ticker, primaryMap, fallbackMap, decimals = 2) {
    const closeArr = marketData.series[ticker];
    const openArr = new Array(n);
    let exactMatchDays = 0;

    for (let i = 0; i < n; i++) {
      const d = dates[i];
      const closeVal = closeArr[i];
      const prevClose = i > 0 ? closeArr[i - 1] : closeVal;

      let ratio = primaryMap.get(d);
      if (ratio === undefined && fallbackMap) {
        ratio = fallbackMap.get(d);
      }

      let openVal;
      if (ratio !== undefined) {
        // Authentic Open price preserving adjusted/scaled Close level
        openVal = closeVal * ratio;
        exactMatchDays++;
      } else {
        // When intraday Open is not recorded in early history, Open on day T is previous Close + 30% overnight drift
        openVal = prevClose + 0.3 * (closeVal - prevClose);
      }
      const factor = Math.pow(10, decimals);
      openArr[i] = Math.round(openVal * factor) / factor;
    }
    return { openArr, exactMatchDays };
  }

  const kpiOpen = buildOpenSeries("KPI200", ks11Map, null, 2);
  const ndxOpen = buildOpenSeries("NDX", ndxMap, null, 2);
  const goldOpen = buildOpenSeries("KRX_GOLD", gldMap, gcfMap, 1);
  const usdkrwOpen = buildOpenSeries("USDKRW", krwMap, null, 2);

  const payload = {
    generatedAt: new Date().toISOString(),
    totalDays: n,
    stats: {
      KPI200_exactOpenDays: kpiOpen.exactMatchDays,
      NDX_exactOpenDays: ndxOpen.exactMatchDays,
      KRX_GOLD_exactOpenDays: goldOpen.exactMatchDays,
      USDKRW_exactOpenDays: usdkrwOpen.exactMatchDays,
    },
    openSeries: {
      KPI200: kpiOpen.openArr,
      NDX: ndxOpen.openArr,
      KRX_GOLD: goldOpen.openArr,
      USDKRW: usdkrwOpen.openArr,
    },
  };

  fs.writeFileSync(OUT_PATH, JSON.stringify(payload), "utf8");
  console.log(`[OpenPriceBuilder] Saved ${OUT_PATH}`);
  console.log("[OpenPriceBuilder] Stats:", JSON.stringify(payload.stats));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
