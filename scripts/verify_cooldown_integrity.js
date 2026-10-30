/**
 * scripts/verify_cooldown_integrity.js
 * Verification of Rule Cooldown and Pan Directions
 */

const fs = require("fs");
const path = require("path");

global.window = global;
require("../data/market_data.js");
require("../js/indicators.js");
require("../js/engine.js");

const appPath = path.join(__dirname, "..", "js", "app.js");
const app = fs.readFileSync(appPath, "utf8");
const pMatch = app.match(/const STRATEGY_PRESETS = (\[[\s\S]*?\n  \];)/);
const presets = eval(pMatch[1]);

console.log("=== 1. PRESET COOLDOWN VERIFICATION ===");
const testCooldowns = [5, 10, 15, 20, 30];
let violationCount = 0;
let totalChecks = 0;

for (const cd of testCooldowns) {
  for (const p of presets) {
    const cfg = JSON.parse(JSON.stringify(p.config));
    if (!cfg.rules || cfg.rules.length === 0) continue;
    cfg.rules.forEach((r) => (r.cooldownDays = cd));
    const res = BacktestEngine.runBacktest(DEFAULT_MARKET_DATA, cfg);

    // Group buys by ticker and rule
    const buysByTicker = {};
    const buysByRule = {};

    res.tradeLogs
      .filter((t) => t.type === "BUY")
      .forEach((t) => {
        buysByTicker[t.ticker] = buysByTicker[t.ticker] || [];
        buysByTicker[t.ticker].push(t);

        buysByRule[t.ruleName] = buysByRule[t.ruleName] || [];
        buysByRule[t.ruleName].push(t);
      });

    // Check same asset buy gap
    for (const [ticker, buys] of Object.entries(buysByTicker)) {
      for (let i = 1; i < buys.length; i++) {
        totalChecks++;
        const gap = buys[i].globalIndex - buys[i - 1].globalIndex;
        if (gap < cd) {
          console.error(`[VIOLATION - Same Asset] Preset: ${p.id}, Ticker: ${ticker}, Required CD: ${cd}, Actual Gap: ${gap} (${buys[i - 1].date} -> ${buys[i].date})`);
          violationCount++;
        }
      }
    }

    // Check same rule buy gap
    for (const [ruleName, buys] of Object.entries(buysByRule)) {
      for (let i = 1; i < buys.length; i++) {
        totalChecks++;
        const gap = buys[i].globalIndex - buys[i - 1].globalIndex;
        if (gap < cd) {
          console.error(`[VIOLATION - Same Rule] Preset: ${p.id}, Rule: ${ruleName}, Required CD: ${cd}, Actual Gap: ${gap} (${buys[i - 1].date} -> ${buys[i].date})`);
          violationCount++;
        }
      }
    }
  }
}

console.log(`Total Buy-to-Buy interval checks across all presets & cooldowns: ${totalChecks}`);
console.log(`Violations found: ${violationCount}`);

console.log("\n=== 2. RANDOM STRATEGY STRESS TEST (50 Cases) ===");
let randViolations = 0;
let randChecks = 0;

for (let i = 1; i <= 50; i++) {
  const cd = Math.floor(Math.random() * 25) + 5; // cooldown between 5 and 30 days
  const tickers = ["KPI200", "NDX", "SPX", "SOXX", "GLD"];
  const t = tickers[i % tickers.length];
  const modes = ["NEXT_CLOSE", "NEXT_OPEN", "DAY2_CLOSE", "DAY2_OPEN", "SAME_DAY_CLOSE"];
  const m = modes[i % modes.length];

  const cfg = {
    name: `Random Strategy #${i}`,
    initialCapital: 10000000,
    startDate: "2015-01-02",
    endDate: "2024-12-30",
    executionMode: m,
    feeRatePct: 0.05,
    cashYieldMode: "US3M",
    benchmarkTicker: "SPX",
    rebalanceEnabled: false,
    rulesEnabled: true,
    rules: [
      {
        id: `rnd_${i}_1`,
        name: `Buy Rule 1 (${t})`,
        enabled: true,
        logic: "AND",
        cooldownDays: cd,
        conditions: [
          {
            left: { ticker: t, transform: "PRICE" },
            operator: ">=",
            rightMode: "INDICATOR",
            rightIndicator: { ticker: t, transform: "SMA", p1: 20 },
          },
        ],
        action: {
          type: "BUY",
          targetTicker: t,
          executionMode: m,
          sizingMode: "TOTAL_PCT",
          sizingValue: 15,
          fundingSource: "CASH_THEN_PRORATA",
        },
      },
      {
        id: `rnd_${i}_2`,
        name: `Buy Rule 2 (${t})`,
        enabled: true,
        logic: "AND",
        cooldownDays: cd,
        conditions: [
          {
            left: { ticker: t, transform: "RSI", p1: 14 },
            operator: "<=",
            rightMode: "VALUE",
            rightValue: 40,
          },
        ],
        action: {
          type: "BUY",
          targetTicker: t,
          executionMode: m,
          sizingMode: "TOTAL_PCT",
          sizingValue: 15,
          fundingSource: "CASH_THEN_PRORATA",
        },
      },
    ],
  };

  const res = BacktestEngine.runBacktest(DEFAULT_MARKET_DATA, cfg);
  const buys = res.tradeLogs.filter((tr) => tr.type === "BUY" && tr.ticker === t);

  for (let j = 1; j < buys.length; j++) {
    randChecks++;
    const gap = buys[j].globalIndex - buys[j - 1].globalIndex;
    if (gap < cd) {
      console.error(`[RANDOM VIOLATION] Run #${i}, Target: ${t}, Mode: ${m}, Required CD: ${cd}, Actual Gap: ${gap} (${buys[j - 1].date} -> ${buys[j].date})`);
      randViolations++;
    }
  }
}

console.log(`Total Random Strategy Interval Checks: ${randChecks}`);
console.log(`Random Strategy Violations: ${randViolations}`);

if (violationCount === 0 && randViolations === 0) {
  console.log("\n>>> ALL TESTS PASSED! ZERO COOLDOWN VIOLATIONS! <<<");
  process.exit(0);
} else {
  console.error("\n>>> TESTS FAILED! <<<");
  process.exit(1);
}
