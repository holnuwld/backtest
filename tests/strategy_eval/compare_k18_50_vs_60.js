/**
 * tests/strategy_eval/compare_k18_50_vs_60.js
 *
 * One-off comparison of Strategy K18:
 * - 60-day SMA (Original)
 * - 50-day SMA (Requested Variant)
 *
 * NOTE: As requested by the user, this does NOT modify any result files.
 */

const fs = require("fs");
const path = require("path");
const { runNextOpenBacktest } = require("./next_open_engine");
const { STRATEGIES_KOSPI_CASH_50 } = require("./strategies_kospi_cash_50");

const DATA_PATH = path.join(__dirname, "..", "..", "data", "market_data.json");
const OPEN_CACHE_PATH = path.join(__dirname, "open_prices_cache.json");

const marketData = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
const openPrices = JSON.parse(fs.readFileSync(OPEN_CACHE_PATH, "utf8"));

const k18Original = STRATEGIES_KOSPI_CASH_50.find((s) => s.id === "K18");
if (!k18Original) throw new Error("Could not find K18 strategy");

function createK18WithPeriod(p1) {
  const cfg = JSON.parse(JSON.stringify(k18Original));
  cfg.id = `K18_SMA_${p1}`;
  cfg.name = `K18 (${p1}일선)`;
  cfg.rules.forEach((r) => {
    r.conditions.forEach((c) => {
      if (c.rightIndicator && c.rightIndicator.transform === "SMA") {
        c.rightIndicator.p1 = p1;
      }
    });
  });
  return cfg;
}

const k18_60 = createK18WithPeriod(60);
const k18_50 = createK18WithPeriod(50);

const testRegimes = [
  { name: "포스트 IMF 실전 (1999.01.04 ~ 2026.10.27, 27.8년)", start: "1999-01-04", end: "2026-10-27" },
  { name: "30년 전수 구간 (1996.07.01 ~ 2026.10.27, 30.3년)", start: "1996-07-01", end: "2026-10-27" },
  { name: "현대 OOS 구간 (2011.01.03 ~ 2026.10.27, 15.8년)", start: "2011-01-03", end: "2026-10-27" },
  { name: "2000~02 닷컴버블 붕괴 (2000.03.01 ~ 2002.10.15)", start: "2000-03-01", end: "2002-10-15" },
  { name: "2007~09 글로벌 금융위기 (2007.10.01 ~ 2009.03.31)", start: "2007-10-01", end: "2009-03-31" },
  { name: "2020 코로나19 팬데믹 (2020.01.15 ~ 2020.05.29)", start: "2020-01-15", end: "2020-05-29" },
  { name: "2022 고금리 긴축장 (2022.01.03 ~ 2022.12.30)", start: "2022-01-03", end: "2022-12-30" },
];

console.log("================================================================================");
console.log("   K18 전략: 60일 이동평균선 vs 50일 이동평균선 정밀 비교 백테스트");
console.log("================================================================================");

const commonOpts = {
  initialCapital: 10000000,
  feeRatePct: 0.05,
  cashYieldMode: "US3M",
  maxWeeklyTrades: 3,
};

testRegimes.forEach((regime) => {
  const r60 = runNextOpenBacktest(marketData, openPrices, { ...k18_60, startDate: regime.start, endDate: regime.end, ...commonOpts });
  const r50 = runNextOpenBacktest(marketData, openPrices, { ...k18_50, startDate: regime.start, endDate: regime.end, ...commonOpts });

  const m60 = r60.metrics;
  const m50 = r50.metrics;

  console.log(`\n📌 [${regime.name}]`);
  console.log(`- 60일선 (현재): CAGR +${m60.cagrPct.toFixed(2)}% | MDD ${m60.maxDrawdownPct.toFixed(2)}% | Calmar ${m60.calmar.toFixed(3)} | Sharpe ${m60.sharpe.toFixed(3)} | 총매매 ${m60.totalTrades}회 (연 ${m60.avgTradesPerYear.toFixed(1)}회) | 최종자산 ${(m60.finalEquity/10000).toFixed(0)}만원`);
  console.log(`  └ MDD 발생: ${m60.maxDrawdownPeakDate} -> ${m60.maxDrawdownDate} (${m60.mddEventDescription})`);
  console.log(`- 50일선 (비교): CAGR +${m50.cagrPct.toFixed(2)}% | MDD ${m50.maxDrawdownPct.toFixed(2)}% | Calmar ${m50.calmar.toFixed(3)} | Sharpe ${m50.sharpe.toFixed(3)} | 총매매 ${m50.totalTrades}회 (연 ${m50.avgTradesPerYear.toFixed(1)}회) | 최종자산 ${(m50.finalEquity/10000).toFixed(0)}만원`);
  console.log(`  └ MDD 발생: ${m50.maxDrawdownPeakDate} -> ${m50.maxDrawdownDate} (${m50.mddEventDescription})`);

  const cagrDiff = (m50.cagrPct - m60.cagrPct).toFixed(2);
  const mddDiff = (m50.maxDrawdownPct - m60.maxDrawdownPct).toFixed(2);
  const calmarDiff = (m50.calmar - m60.calmar).toFixed(3);
  console.log(`  ⚖️ 50일선 vs 60일선 차이: CAGR ${cagrDiff > 0 ? "+" : ""}${cagrDiff}%p | MDD ${mddDiff > 0 ? "+" : ""}${mddDiff}%p | Calmar ${calmarDiff > 0 ? "+" : ""}${calmarDiff}`);
});

console.log("\n================================================================================");
