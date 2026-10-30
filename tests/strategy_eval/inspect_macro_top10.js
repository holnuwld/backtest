const fs = require("fs");
const path = require("path");

const blind = JSON.parse(fs.readFileSync(path.join(__dirname, "blind_evaluation_kospi_macro.json"), "utf8"));
const vault = JSON.parse(fs.readFileSync(path.join(__dirname, "vault_mapping_kospi_macro.json"), "utf8"));

const vaultMap = {};
vault.forEach(v => {
  vaultMap[v.blindId] = v;
});

const sorted = blind.evaluations.slice().sort((a, b) => b.blindCompositeScore - a.blindCompositeScore);

console.log("=== TOP 15 KOSPI MACRO STRATEGIES (OUT OF 200) ===");
for (let i = 0; i < 15; i++) {
  const b = sorted[i];
  const v = vaultMap[b.blindId];
  const m = b.fullMetrics;
  const oos = b.oosMetrics;
  console.log(
    `#${i + 1} [${b.blindId} => ${v.originalId}] ${v.name}`
  );
  console.log(
    `   Alloc: ${JSON.stringify(v.allocations[0])} | CAGR: +${m.cagrPct.toFixed(2)}% | MDD: ${m.maxDrawdownPct.toFixed(2)}% | Calmar: ${(m.calmar || 0).toFixed(3)} | Sharpe: ${(m.sharpe || 0).toFixed(3)} | Sortino: ${(m.sortino || 0).toFixed(3)} | Stab: ${b.parameterStabilityScore}% | Trades: ${m.totalTrades} (${(m.avgTradesPerWeek || 0).toFixed(2)}/wk)`
  );
  console.log(
    `   OOS CAGR: +${oos.cagrPct.toFixed(2)}% | OOS MDD: ${oos.maxDrawdownPct.toFixed(2)}% | OOS Calmar: ${(oos.calmar || 0).toFixed(3)}`
  );
  console.log(
    `   Crises: 2000 Dotcom: ${b.crisisReturns.dotcom_2000.totalReturnPct.toFixed(1)}% | 2008 GFC: ${b.crisisReturns.gfc_2008.totalReturnPct.toFixed(1)}% | 2020 COVID: ${b.crisisReturns.covid_2020.totalReturnPct.toFixed(1)}% | 2022 RateHike: ${b.crisisReturns.ratehike_2022.totalReturnPct.toFixed(1)}%`
  );
  console.log("");
}
