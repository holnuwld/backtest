const fs = require("fs");
const path = require("path");

const srcPath = path.join(__dirname, "strategies_kospi_cash_50.js");
const dstPath = path.join(__dirname, "strategies_ndx_cash_50.js");

const srcCode = fs.readFileSync(srcPath, "utf8");

// Convert code by string and regex replacements
let dstCode = srcCode
  // Header comments
  .replace("Experiment #2: 50 Candidate Strategies (K01 ~ K50) using ONLY KOSPI 200 (`KPI200`)", "Experiment #5: 50 Candidate Strategies (N01 ~ N50) using ONLY NASDAQ 100 (`NDX`)")
  .replace("Tradable Universe: ONLY `KPI200`", "Tradable Universe: ONLY `NDX`")
  .replace(/kAlloc/g, "nAlloc")
  .replace(/STRATEGIES_KOSPI_CASH_50/g, "STRATEGIES_NDX_CASH_50")
  .replace(/KPI200/g, "NDX")
  .replace(/코스피/g, "나스닥")
  .replace(/박스피/g, "나스닥")
  // Change strategy IDs from K01~K50 to N01~N50
  .replace(/id:\s*"K([0-9]{2})/g, 'id: "N$1')
  .replace(/id:\s*"K([0-9]{2}_R[0-9])/g, 'id: "N$1')
  // Category headers
  .replace(/Group ([A-E]): 코스피·현금/g, "Group $1: 나스닥·현금");

// For N25, adjust rationale and condition 1 since both were NDX now
dstCode = dstCode
  .replace("나스닥 vs 나스닥 상대저평가 키맞추기 스윙 (45:55 코어)", "반도체(SOXX) vs 나스닥(NDX) 상대저평가 키맞추기 스윙 (45:55 코어)")
  .replace("나스닥은 강세(60일 ROC>8%)인데 나스닥가 일시 소외", "반도체(SOXX)는 강세(60일 ROC>10%)인데 나스닥이 일시 소외")
  .replace('"ticker": "NDX",\n            "transform": "ROC",\n            "p1": 60', '"ticker": "SOXX",\n            "transform": "ROC",\n            "p1": 60');

fs.writeFileSync(dstPath, dstCode, "utf8");
console.log(`Generated ${dstPath} successfully!`);

// Test loading
const { STRATEGIES_NDX_CASH_50 } = require(dstPath);
console.log("Successfully loaded STRATEGIES_NDX_CASH_50, total strategies:", STRATEGIES_NDX_CASH_50.length);
console.log("First strategy:", STRATEGIES_NDX_CASH_50[0].id, STRATEGIES_NDX_CASH_50[0].name);
console.log("Last strategy:", STRATEGIES_NDX_CASH_50[49].id, STRATEGIES_NDX_CASH_50[49].name);
