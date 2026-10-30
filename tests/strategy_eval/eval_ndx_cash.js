const fs = require("fs");
const path = require("path");

const blind = JSON.parse(fs.readFileSync(path.join(__dirname, "blind_evaluation_ndx_cash.json"), "utf8"));
const vault = JSON.parse(fs.readFileSync(path.join(__dirname, "vault_mapping_ndx_cash.json"), "utf8"));

console.log("=== BASELINES ===");
Object.values(blind.baselines).forEach(b => {
  console.log(`${b.name} -> CAGR: ${b.fullMetrics.cagrPct.toFixed(2)}%, MDD: ${b.fullMetrics.maxDrawdownPct.toFixed(2)}%, Calmar: ${b.fullMetrics.calmar.toFixed(3)}, Sharpe: ${b.fullMetrics.sharpe.toFixed(2)}`);
});

// Sort by blindCompositeScore
const sorted = blind.candidates.slice().sort((a, b) => b.blindCompositeScore - a.blindCompositeScore);

console.log("\n=== TOP 15 CANDIDATES (BLIND) ===");
sorted.slice(0, 15).forEach((c, idx) => {
  const v = vault.entries[c.blindId];
  console.log(`Rank ${idx + 1}: ${c.blindId} (${v.originalId}: ${v.name})`);
  console.log(`  CAGR: +${c.fullMetrics.cagrPct.toFixed(2)}% | MDD: ${c.fullMetrics.maxDrawdownPct.toFixed(2)}% (${c.fullMetrics.maxDrawdownPeakDate} -> ${c.fullMetrics.maxDrawdownDate})`);
  console.log(`  Calmar: ${c.fullMetrics.calmar.toFixed(3)} | Sharpe: ${c.fullMetrics.sharpe.toFixed(2)} | Sortino: ${c.fullMetrics.sortino.toFixed(2)} | Ulcer: ${c.fullMetrics.ulcerIndex.toFixed(2)}`);
  console.log(`  OOS CAGR: +${c.oosMetrics.cagrPct.toFixed(2)}% | OOS MDD: ${c.oosMetrics.maxDrawdownPct.toFixed(2)}% | Score: ${c.blindCompositeScore.toFixed(2)}`);
  console.log(`  Dotcom: ${c.crisisStats.dotcom_2000.returnPct.toFixed(1)}% (MDD ${c.crisisStats.dotcom_2000.mddPct.toFixed(1)}%) | GFC: ${c.crisisStats.gfc_2008.returnPct.toFixed(1)}% | Stability: ${c.parameterStabilityPct}%`);
  console.log(`  Trades/Wk: ${c.weeklyTradeEnforcement.avgTradesPerWeek.toFixed(2)} (Max: ${c.weeklyTradeEnforcement.maxTradesInSingleWeek})\n`);
});
