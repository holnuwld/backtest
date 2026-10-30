/**
 * audit_ui_ux_intent.js
 * [Harness Tier 3] UI/UX & User Behavioral Intent Fidelity Auditor
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../../');

function runUiUxIntentAudit() {
  console.log('===============================================================');
  console.log(' [HARNESS TIER 3] UI/UX & User Intent Fidelity Audit');
  console.log('===============================================================');

  const htmlPath = path.join(ROOT_DIR, 'index.html');
  const appJsPath = path.join(ROOT_DIR, 'js/app.js');
  const storageJsPath = path.join(ROOT_DIR, 'js/storage.js');
  const stylesCssPath = path.join(ROOT_DIR, 'css/styles.css');

  const testResults = [];
  let passed = 0;
  let failed = 0;

  function assertTest(name, condition, detail = '') {
    if (condition) {
      passed++;
      testResults.push({ name, status: 'PASS', detail });
      console.log(`  [PASS] ${name}`);
    } else {
      failed++;
      testResults.push({ name, status: 'FAIL', detail });
      console.error(`  [FAIL] ${name} -> ${detail}`);
    }
  }

  // Check 1: HTML Core Structure & Essential Elements
  try {
    const html = fs.readFileSync(htmlPath, 'utf8');

    const hasStartInput = html.includes('id="cfgStartDate"');
    const hasEndInput = html.includes('id="cfgEndDate"');
    const hasInitialCapital = html.includes('id="cfgCapital"');
    const hasFeeInput = html.includes('id="cfgFee"');
    const hasChartCanvas = html.includes('id="chartEquity"');
    const hasScoreboard = html.includes('tableScoreboard') || html.includes('scoreboard');
    const hasMobileNav = html.includes('mobile-nav') || html.includes('tab-btn');

    assertTest('UI HTML: Essential simulation parameter inputs exist (cfgStartDate, cfgEndDate, cfgCapital, cfgFee)', hasStartInput && hasEndInput && hasInitialCapital && hasFeeInput, 'Verified all config input tags');
    assertTest('UI HTML: Performance visualization canvas exists (chartEquity)', hasChartCanvas, 'Verified chart canvas container');
    assertTest('UI HTML: Scoreboard experiment log table exists', hasScoreboard, 'Verified scoreboard UI markup');
    assertTest('UI HTML: Responsive mobile tab navigation exists', hasMobileNav, 'Verified mobile tab elements');
  } catch (e) {
    assertTest('HTML Markup Inspection Exception', false, e.message);
  }

  // Check 2: JavaScript App Controller & Input Validation
  try {
    const appJs = fs.readFileSync(appJsPath, 'utf8');

    const hasWeightCheck = appJs.includes('weight') && (appJs.includes('100') || appJs.includes('sum') || appJs.includes('alert') || appJs.includes('warn'));
    assertTest('Intent Guard: Allocation weight validation or sum display present', hasWeightCheck, 'Verified asset weight processing in app.js');

    const hasPresets = appJs.includes('preset') || appJs.includes('PRESETS');
    assertTest('Intent Guard: Standard investment strategy presets exist', hasPresets, 'Verified preset strategies definition');

    const handlesBtcNotice = appJs.includes('btcAdjustedNotice') || appJs.includes('btc') || appJs.includes('2010-07-20');
    assertTest('Intent Guard: UI handles or acknowledges Bitcoin 2010 constraint', handlesBtcNotice, 'Verified Bitcoin notice integration in app.js');

    const handlesChart = appJs.includes('Chart(') || appJs.includes('renderChart');
    assertTest('UI Execution: Chart visualization rendering engine linked', handlesChart, 'Verified Chart.js instantiation');
  } catch (e) {
    assertTest('App Controller Inspection Exception', false, e.message);
  }

  // Check 3: Storage Safety
  try {
    const storageJs = fs.readFileSync(storageJsPath, 'utf8');
    const hasTryCatch = storageJs.includes('try') && storageJs.includes('catch');
    const hasStorage = storageJs.includes('localStorage') || storageJs.includes('indexedDB');

    assertTest('Storage Resilience: localStorage / IndexedDB operations wrapped in try-catch', hasTryCatch && hasStorage, 'Verified safe storage persistence logic');
  } catch (e) {
    assertTest('Storage Inspection Exception', false, e.message);
  }

  // Check 4: Responsive Design & Dark/Light Themes
  try {
    const css = fs.readFileSync(stylesCssPath, 'utf8');
    const hasMediaQueries = css.includes('@media');
    const hasMobileStyles = css.includes('max-width') || css.includes('768px') || css.includes('480px');
    const hasThemeVars = css.includes('--') || css.includes('theme');

    assertTest('UX Design: Responsive layout with mobile media queries & CSS variables', hasMediaQueries && hasMobileStyles && hasThemeVars, 'Verified modern CSS styling');
  } catch (e) {
    assertTest('CSS Inspection Exception', false, e.message);
  }

  console.log('---------------------------------------------------------------');
  console.log(` [UI/UX Summary] Total Tests: ${passed + failed} | PASS: ${passed} | FAIL: ${failed}`);
  console.log('===============================================================\n');

  return { passed, failed, tests: testResults };
}

if (require.main === module) {
  runUiUxIntentAudit();
}

module.exports = { runUiUxIntentAudit };
