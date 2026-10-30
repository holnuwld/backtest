const fs = require("fs");
const path = require("path");

const VAULT_PATH = path.join(__dirname, "vault_mapping_kospi_cash_post_imf_close.json");
const vault = JSON.parse(fs.readFileSync(VAULT_PATH, "utf8"));

const top10BlindIds = [
  "CLOSE_BLIND_036",
  "CLOSE_BLIND_042",
  "CLOSE_BLIND_044",
  "CLOSE_BLIND_035",
  "CLOSE_BLIND_021",
  "CLOSE_BLIND_027",
  "CLOSE_BLIND_007",
  "CLOSE_BLIND_047",
  "CLOSE_BLIND_028",
  "CLOSE_BLIND_043",
];

top10BlindIds.forEach((id, idx) => {
  const e = vault.entries[id];
  console.log(`Rank ${idx + 1}: ${id} => ${e.originalId} (${e.name})`);
  console.log(`   Alloc: ${e.summaryText.allocations}`);
  console.log(`   CAGR: +${e.fullMetrics.cagrPct}% | MDD: ${e.fullMetrics.maxDrawdownPct}% (${e.fullMetrics.maxDrawdownPeakDate} -> ${e.fullMetrics.maxDrawdownDate}) | Calmar: ${e.fullMetrics.calmar} | Ulcer: ${e.fullMetrics.ulcerIndex}`);
});
