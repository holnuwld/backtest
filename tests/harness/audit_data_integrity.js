/**
 * audit_data_integrity.js
 * [Harness Tier 1] Raw Market Data Integrity & Statistical Quality Auditor
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../../');
const CSV_DIR = path.join(ROOT_DIR, 'data/csv');
const JSON_PATH = path.join(ROOT_DIR, 'data/market_data.json');

function runDataIntegrityAudit() {
  console.log('===============================================================');
  console.log(' [HARNESS TIER 1] Raw Market Data Integrity Audit');
  console.log('===============================================================');

  const results = {
    totalFilesChecked: 0,
    passed: 0,
    warnings: 0,
    failures: 0,
    details: [],
    marketDataJsonCheck: {}
  };

  // 1. Verify data/market_data.json
  if (!fs.existsSync(JSON_PATH)) {
    console.error('FAIL: data/market_data.json not found!');
    results.failures++;
    results.marketDataJsonCheck = { status: 'FAIL', reason: 'File missing' };
  } else {
    try {
      const jsonData = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
      const totalDays = jsonData.totalDays;
      const catalogCount = jsonData.catalog.length;
      const seriesCount = Object.keys(jsonData.series).length;
      const jsonOk = totalDays === 14327 && catalogCount === 29 && seriesCount === 29;
      results.marketDataJsonCheck = {
        status: jsonOk ? 'PASS' : 'WARN',
        totalDays,
        catalogCount,
        seriesCount,
        startDate: jsonData.startDate,
        endDate: jsonData.endDate
      };
      console.log(`- data/market_data.json: ${jsonOk ? 'PASS' : 'WARN'} (29 series, 14,327 days: ${jsonData.startDate} ~ ${jsonData.endDate})`);
    } catch (e) {
      results.failures++;
      results.marketDataJsonCheck = { status: 'FAIL', error: e.message };
    }
  }

  // 2. Scan all CSV files
  const files = fs.readdirSync(CSV_DIR).filter(f => f.endsWith('.csv')).sort();
  results.totalFilesChecked = files.length;

  files.forEach(filename => {
    const filePath = path.join(CSV_DIR, filename);
    const content = fs.readFileSync(filePath, 'utf8').trim().split(/\r?\n/);
    const header = content[0];
    const rows = content.slice(1);

    const assetId = filename.replace('.csv', '');
    const issueList = [];

    // Check Row Count
    if (rows.length !== 14327) {
      issueList.push({ type: 'FAIL', code: 'ROW_COUNT_MISMATCH', msg: `Expected 14,327 rows, got ${rows.length}` });
    }

    // Check Header
    if (header !== 'Date,Close') {
      issueList.push({ type: 'WARN', code: 'HEADER_FORMAT', msg: `Header is '${header}' instead of 'Date,Close'` });
    }

    let nanCount = 0;
    let nonPositiveCount = 0;
    let maxFlatCount = 1;
    let curFlatCount = 1;
    let flatStart = '';
    let maxFlatRange = null;
    let maxDailyJumpPct = 0;
    let maxJumpDate = '';
    let prevVal = null;

    const isRateOrSpread = ['US10Y', 'US2Y', 'US3M', 'T10Y2Y'].includes(assetId);

    for (let i = 0; i < rows.length; i++) {
      const parts = rows[i].split(',');
      const date = parts[0];
      const val = parseFloat(parts[1]);

      if (isNaN(val) || parts[1] === '' || parts[1] === null) {
        nanCount++;
        continue;
      }

      // Check non-positive price (exclude yield rates and 2020-04-20 WTI historical negative oil event)
      if (!isRateOrSpread && val <= 0) {
        if (assetId === 'WTI' && date === '2020-04-20') {
          // Historical negative oil price: WTI closed at -$36.98/bbl on 2020-04-20
          issueList.push({
            type: 'INFO',
            code: 'HISTORICAL_NEGATIVE_OIL_SHOCK',
            msg: `Confirmed historical 2020-04-20 negative oil price event (${val} $/bbl).`
          });
        } else {
          nonPositiveCount++;
        }
      }

      if (prevVal !== null) {
        // Flatline check
        if (val === prevVal) {
          curFlatCount++;
          if (curFlatCount > maxFlatCount) {
            maxFlatCount = curFlatCount;
            maxFlatRange = { count: curFlatCount, val, start: flatStart, end: date };
          }
        } else {
          curFlatCount = 1;
          flatStart = date;
        }

        // Jump check (avoid divide-by-zero or negative bases)
        if (prevVal > 0) {
          const jumpPct = Math.abs((val - prevVal) / prevVal) * 100;
          if (jumpPct > maxDailyJumpPct) {
            maxDailyJumpPct = jumpPct;
            maxJumpDate = date;
          }
        }
      } else {
        flatStart = date;
      }

      prevVal = val;
    }

    if (nanCount > 0) {
      issueList.push({ type: 'FAIL', code: 'NAN_VALUES', msg: `Found ${nanCount} NaN/empty values` });
    }

    if (nonPositiveCount > 0) {
      issueList.push({ type: 'FAIL', code: 'NON_POSITIVE_PRICE', msg: `Found ${nonPositiveCount} non-positive prices on tradable asset` });
    }

    // Flatline Assessment
    if (maxFlatCount >= 10) {
      if (assetId.startsWith('BTC_')) {
        issueList.push({
          type: 'WARN',
          code: 'BTC_PRE_LAUNCH_FLATLINE',
          msg: `Pre-launch constant price: ${maxFlatRange.count} days flat (${maxFlatRange.start} ~ ${maxFlatRange.end}) at ${maxFlatRange.val}. Protected by engine start-date lock.`
        });
      } else if (assetId === 'USDKRW' && maxFlatRange.val === 484) {
        issueList.push({
          type: 'INFO',
          code: 'HISTORICAL_FIXED_EXCHANGE_RATE',
          msg: `Historical 1970s Korea BOK fixed parity confirmed (${maxFlatRange.count} days at 484 KRW/USD).`
        });
      } else if (assetId === 'DXY' || assetId === 'US3M') {
        issueList.push({
          type: 'INFO',
          code: 'ACCEPTABLE_MACRO_PLATEAU',
          msg: `Macro plateau: ${maxFlatRange.count} days flat (${maxFlatRange.start} ~ ${maxFlatRange.end}).`
        });
      } else {
        issueList.push({
          type: 'INFO',
          code: 'ACCEPTABLE_SHORT_PLATEAU',
          msg: `Short plateau: ${maxFlatRange.count} days flat (${maxFlatRange.start} ~ ${maxFlatRange.end}) at value ${maxFlatRange.val}`
        });
      }
    }

    // Abnormal Spike check
    if (!isRateOrSpread && assetId !== 'WTI' && assetId !== 'VIX' && assetId !== 'PCR') {
      const jumpThreshold = assetId.startsWith('BTC_') ? 150 : 65;
      if (maxDailyJumpPct > jumpThreshold) {
        issueList.push({
          type: 'WARN',
          code: 'EXTREME_DAILY_SPIKE',
          msg: `Extreme 1-day jump: ${maxDailyJumpPct.toFixed(1)}% on ${maxJumpDate}`
        });
      }
    }

    const hasFail = issueList.some(i => i.type === 'FAIL');
    const hasWarn = issueList.some(i => i.type === 'WARN');
    const status = hasFail ? 'FAIL' : (hasWarn ? 'WARN' : 'PASS');

    if (status === 'PASS') results.passed++;
    else if (status === 'WARN') results.warnings++;
    else results.failures++;

    results.details.push({
      assetId,
      filename,
      rows: rows.length,
      status,
      maxFlatCount,
      maxDailyJumpPct: maxDailyJumpPct.toFixed(2),
      issues: issueList
    });

    const statusPadded = status.padEnd(5);
    const flatNote = maxFlatCount > 10 ? `Flat:${maxFlatCount}d` : 'No-Flat';
    console.log(`  [${statusPadded}] ${filename.padEnd(15)} Rows:${rows.length} | ${flatNote.padEnd(12)} | MaxJump:${maxDailyJumpPct.toFixed(1)}%`);
    issueList.forEach(iss => {
      console.log(`         ↳ [${iss.type}] ${iss.code}: ${iss.msg}`);
    });
  });

  console.log('---------------------------------------------------------------');
  console.log(` [Integrity Summary] Total: ${results.totalFilesChecked} | PASS: ${results.passed} | WARN: ${results.warnings} | FAIL: ${results.failures}`);
  console.log('===============================================================\n');

  return results;
}

if (require.main === module) {
  runDataIntegrityAudit();
}

module.exports = { runDataIntegrityAudit };
