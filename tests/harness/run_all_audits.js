/**
 * run_all_audits.js
 * Master Automated Verification Harness Orchestrator
 * 
 * Runs all 3 audit tiers:
 * Tier 1: Raw Data Integrity (29 CSVs + market_data.json)
 * Tier 2: Quantitative Backtest Engine Logic (indicators.js + engine.js)
 * Tier 3: UI/UX & User Behavioral Intent Fidelity (index.html + app.js + storage.js)
 * 
 * Generates consolidated console output and tests/harness/audit_report.json
 */

const fs = require('fs');
const path = require('path');

const { runDataIntegrityAudit } = require('./audit_data_integrity');
const { runEngineLogicAudit } = require('./audit_engine_logic');
const { runUiUxIntentAudit } = require('./audit_ui_ux_intent');

function runAllAudits() {
  const startTime = new Date();
  console.log('\n###############################################################');
  console.log('   QuantCross Lab Automated Verification Harness Execution');
  console.log(`   Execution Timestamp: ${startTime.toISOString()}`);
  console.log('###############################################################\n');

  // Tier 1
  const tier1 = runDataIntegrityAudit();

  // Tier 2
  const tier2 = runEngineLogicAudit();

  // Tier 3
  const tier3 = runUiUxIntentAudit();

  const endTime = new Date();
  const elapsedSec = ((endTime - startTime) / 1000).toFixed(2);

  // Compute Comprehensive Integrity & Quality Score
  const totalAssertions = tier1.totalFilesChecked + (tier2.passed + tier2.failed) + (tier3.passed + tier3.failed);
  const totalPassed = tier1.passed + tier2.passed + tier3.passed;
  const totalWarnings = tier1.warnings;
  const totalFailures = tier1.failures + tier2.failed + tier3.failed;

  // Score calculation: 100 base, -10 per fail, -2 per warning
  const compositeScore = Math.max(0, Math.min(100, Math.round(
    ((totalPassed + totalWarnings * 0.7) / totalAssertions) * 100
  )));

  console.log('===============================================================');
  console.log('               COMPREHENSIVE AUDIT REPORT');
  console.log('===============================================================');
  console.log(`  * Execution Time: ${elapsedSec}s`);
  console.log(`  * Overall Verification Score: ${compositeScore} / 100`);
  console.log(`  * Tier 1 (Raw Data):    PASS: ${tier1.passed} | WARN: ${tier1.warnings} | FAIL: ${tier1.failures}`);
  console.log(`  * Tier 2 (Engine Math): PASS: ${tier2.passed} | FAIL: ${tier2.failed}`);
  console.log(`  * Tier 3 (UI/UX Intent):PASS: ${tier3.passed} | FAIL: ${tier3.failed}`);
  console.log('---------------------------------------------------------------');
  if (totalFailures === 0) {
    console.log('  STATUS: [ALL CRITICAL HARNESS TESTS PASSED]');
    if (totalWarnings > 0) {
      console.log(`  NOTE: ${totalWarnings} warnings noted (e.g. BTC pre-2010 flatline, macro fixed parities).`);
    }
  } else {
    console.log(`  STATUS: [CRITICAL FAILURES DETECTED: ${totalFailures}] Review audit_report.json.`);
  }
  console.log('===============================================================\n');

  const report = {
    timestamp: startTime.toISOString(),
    elapsedSeconds: parseFloat(elapsedSec),
    score: compositeScore,
    summary: {
      totalAssertions,
      totalPassed,
      totalWarnings,
      totalFailures,
    },
    tier1_dataIntegrity: tier1,
    tier2_engineLogic: tier2,
    tier3_uiUxIntent: tier3
  };

  const reportPath = path.join(__dirname, 'audit_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`Detailed audit report written to: ${reportPath}\n`);

  return report;
}

if (require.main === module) {
  runAllAudits();
}

module.exports = { runAllAudits };
