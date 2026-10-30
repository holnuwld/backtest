const fs = require("fs");
const path = require("path");

const VAULT_POST_IMF_PATH = path.join(__dirname, "vault_mapping_kospi_cash_post_imf.json");
const vault = JSON.parse(fs.readFileSync(VAULT_POST_IMF_PATH, "utf8"));

const top10BlindIds = [
  "POST_IMF_BLIND_004",
  "POST_IMF_BLIND_008",
  "POST_IMF_BLIND_017",
  "POST_IMF_BLIND_048",
  "POST_IMF_BLIND_010",
  "POST_IMF_BLIND_046",
  "POST_IMF_BLIND_011",
  "POST_IMF_BLIND_043",
  "POST_IMF_BLIND_006",
  "POST_IMF_BLIND_012",
];

top10BlindIds.forEach((id, idx) => {
  const e = vault.entries[id];
  console.log(`Rank ${idx + 1}: ${id} => ${e.originalId} (${e.name})`);
  console.log(`   Alloc: ${e.summaryText.allocations}`);
  console.log(`   CAGR: +${e.fullMetrics.cagrPct}% | MDD: ${e.fullMetrics.maxDrawdownPct}% (${e.fullMetrics.maxDrawdownPeakDate} -> ${e.fullMetrics.maxDrawdownDate}) | Calmar: ${e.fullMetrics.calmar} | Ulcer: ${e.fullMetrics.ulcerIndex}`);
});
