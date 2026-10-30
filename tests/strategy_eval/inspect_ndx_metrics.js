const fs = require("fs");
const path = require("path");

const blind = JSON.parse(fs.readFileSync(path.join(__dirname, "blind_evaluation_ndx_cash.json"), "utf8"));
const vault = JSON.parse(fs.readFileSync(path.join(__dirname, "vault_mapping_ndx_cash.json"), "utf8"));

const all = Object.values(vault.entries);

console.log("=== TOP 15 BY CAGR ===");
all.slice().sort((a,b) => b.fullMetrics.cagrPct - a.fullMetrics.cagrPct).slice(0, 15).forEach((v, i) => {
  console.log(`${i+1}. [${v.originalId}] ${v.name} -> CAGR: +${v.fullMetrics.cagrPct.toFixed(2)}%, MDD: ${v.fullMetrics.maxDrawdownPct.toFixed(2)}%, Calmar: ${v.fullMetrics.calmar.toFixed(3)}, Sharpe: ${v.fullMetrics.sharpe.toFixed(2)}, Score: ${v.blindCompositeScore.toFixed(1)}`);
});

console.log("\n=== TOP 15 BY CALMAR ===");
all.slice().sort((a,b) => b.fullMetrics.calmar - a.fullMetrics.calmar).slice(0, 15).forEach((v, i) => {
  console.log(`${i+1}. [${v.originalId}] ${v.name} -> CAGR: +${v.fullMetrics.cagrPct.toFixed(2)}%, MDD: ${v.fullMetrics.maxDrawdownPct.toFixed(2)}%, Calmar: ${v.fullMetrics.calmar.toFixed(3)}, Sharpe: ${v.fullMetrics.sharpe.toFixed(2)}, Score: ${v.blindCompositeScore.toFixed(1)}`);
});

console.log("\n=== TOP 15 BY LOWEST MDD ===");
all.slice().sort((a,b) => Math.abs(a.fullMetrics.maxDrawdownPct) - Math.abs(b.fullMetrics.maxDrawdownPct)).slice(0, 15).forEach((v, i) => {
  console.log(`${i+1}. [${v.originalId}] ${v.name} -> CAGR: +${v.fullMetrics.cagrPct.toFixed(2)}%, MDD: ${v.fullMetrics.maxDrawdownPct.toFixed(2)}%, Calmar: ${v.fullMetrics.calmar.toFixed(3)}, Sharpe: ${v.fullMetrics.sharpe.toFixed(2)}`);
});
