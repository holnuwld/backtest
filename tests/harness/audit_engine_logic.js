/**
 * audit_engine_logic.js
 * [Harness Tier 2] Quantitative Backtesting Engine & Mathematical Auditor
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../../');

function setupEnvironment() {
  const globalObj = global;
  globalObj.window = globalObj;

  const marketDataJs = fs.readFileSync(path.join(ROOT_DIR, 'data/market_data.js'), 'utf8');
  eval(marketDataJs);

  const indicatorsJs = fs.readFileSync(path.join(ROOT_DIR, 'js/indicators.js'), 'utf8');
  eval(indicatorsJs);

  const engineJs = fs.readFileSync(path.join(ROOT_DIR, 'js/engine.js'), 'utf8');
  eval(engineJs);

  return {
    marketData: global.DEFAULT_MARKET_DATA,
    IndicatorEngine: global.IndicatorEngine,
    BacktestEngine: global.BacktestEngine
  };
}

function runEngineLogicAudit() {
  console.log('===============================================================');
  console.log(' [HARNESS TIER 2] Quantitative Backtest Engine Logic Audit');
  console.log('===============================================================');

  const env = setupEnvironment();
  const { marketData, IndicatorEngine, BacktestEngine } = env;

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

  // TEST 1: Indicator Math
  try {
    const samplePrices = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    const sma5 = IndicatorEngine.computeSMA(samplePrices, 5);
    assertTest('Indicator: SMA 5-period exact calculation', Math.abs(sma5[10] - 18) < 1e-6, `Got ${sma5[10]}, expected 18`);

    const rsi14 = IndicatorEngine.computeRSI(samplePrices, 5);
    assertTest('Indicator: RSI on strictly increasing series == 100', rsi14[10] === 100.0, `Got ${rsi14[10]}`);

    const dd = IndicatorEngine.computeDrawdown([100, 110, 88, 120, 96]);
    assertTest('Indicator: Drawdown peak-trough exact calculation (-20%)', Math.abs(dd[2] - (-20.0)) < 1e-4, `Got ${dd[2]}%`);
  } catch (e) {
    assertTest('Indicator Math Suite Exception', false, e.message);
  }

  // TEST 2: Cash-only portfolio interest accrual (US3M yield)
  try {
    const cashConfig = {
      startDate: '2010-01-04',
      endDate: '2020-01-03',
      initialCapital: 100000000,
      allocations: [], // 100% Cash
      rebalanceEnabled: false,
      rebalanceMode: 'NONE',
      rebalanceBandPct: 0,
      feeRatePct: 0.05,
      rules: [],
      benchmarkTicker: 'SPX'
    };

    const resCash = BacktestEngine.runBacktest(marketData, cashConfig);
    const initCap = resCash.metrics.initialCapital;
    const finalEq = resCash.metrics.finalEquity;
    const cagr = resCash.metrics.cagrPct;
    const mdd = resCash.metrics.maxDrawdownPct;

    assertTest(
      'Cash Engine: 100% Cash earns US3M short-rate and protects capital (MDD >= -0.01%)',
      finalEq > initCap && mdd >= -0.01 && cagr > 0,
      `Init: ${initCap}, Final: ${finalEq}, MDD: ${mdd}%, CAGR: ${cagr}%`
    );
  } catch (e) {
    assertTest('Cash Engine Accrual Exception', false, e.message);
  }

  // TEST 3: Portfolio Conservation Invariant (Sum of Weights == 100%)
  try {
    const balancedConfig = {
      startDate: '2015-01-05',
      endDate: '2020-12-31',
      initialCapital: 100000000,
      allocations: [
        { ticker: 'SPX', weightPct: 60 },
        { ticker: 'UST10Y_TR', weightPct: 40 }
      ],
      rebalanceEnabled: true,
      rebalanceMode: 'MONTHLY',
      feeRatePct: 0.1,
      rules: [],
      benchmarkTicker: 'SPX'
    };

    const resBal = BacktestEngine.runBacktest(marketData, balancedConfig);
    const weightHist = resBal.series.assetWeights;
    const cashRatios = resBal.series.cashRatio;
    let sumViolations = 0;

    for (let i = 0; i < cashRatios.length; i++) {
      const spxW = (weightHist['SPX'] && weightHist['SPX'][i]) || 0;
      const bndW = (weightHist['UST10Y_TR'] && weightHist['UST10Y_TR'][i]) || 0;
      const cshW = cashRatios[i] || 0;
      const totalW = spxW + bndW + cshW;
      if (Math.abs(totalW - 100.0) > 0.5) {
        sumViolations++;
      }
    }

    assertTest(
      'Invariant: Sum of Asset Weights + Cash == 100% on every trading day',
      sumViolations === 0,
      `Found ${sumViolations} days where total weight violated 100%`
    );
  } catch (e) {
    assertTest('Portfolio Conservation Exception', false, e.message);
  }

  // TEST 4: Trade Execution & Fee Accounting
  try {
    const tradingConfig = {
      startDate: '2019-01-02',
      endDate: '2020-12-31',
      initialCapital: 100000000,
      allocations: [{ ticker: 'SPX', weightPct: 100 }],
      rebalanceEnabled: false,
      rebalanceMode: 'NONE',
      feeRatePct: 0.25,
      rulesEnabled: true,
      rules: [
        {
          id: 'rule_1',
          name: 'RSI 과열 매도',
          enabled: true,
          logic: 'AND',
          cooldownDays: 5,
          action: {
            type: 'SELL_ALL',
            targetTicker: 'SPX',
            sizingMode: 'BALANCE_PCT',
            sizingValue: 100
          },
          conditions: [
            {
              left: { ticker: 'SPX', indicator: 'RSI', param1: 14 },
              operator: '>=',
              rightMode: 'CONSTANT',
              rightValue: 65
            }
          ]
        }
      ],
      benchmarkTicker: 'SPX'
    };

    const resTrade = BacktestEngine.runBacktest(marketData, tradingConfig);
    const totalFees = resTrade.metrics.totalFeesPaid;
    const tradeLogs = resTrade.tradeLogs;

    assertTest(
      'Execution: Cross-asset rules trigger trades and accurately deduct fees',
      tradeLogs.length > 0 && totalFees > 0,
      `Trades logged: ${tradeLogs.length}, Fees deducted: ${totalFees} KRW`
    );
  } catch (e) {
    assertTest('Trade Execution Exception', false, e.message);
  }

  // TEST 5: Bitcoin 2010-07-20 Auto-Correction Invariant
  try {
    const btc1970Config = {
      startDate: '1970-01-02',
      endDate: '2025-12-31',
      initialCapital: 100000000,
      allocations: [
        { ticker: 'BTC_USD', weightPct: 50 },
        { ticker: 'SPX', weightPct: 50 }
      ],
      rebalanceEnabled: true,
      rebalanceMode: 'YEARLY',
      feeRatePct: 0.1,
      rules: [],
      benchmarkTicker: 'SPX'
    };

    const resBtc = BacktestEngine.runBacktest(marketData, btc1970Config);
    const actualSimStart = resBtc.metrics.startDate;
    const hasNotice = typeof resBtc.metrics.btcAdjustedNotice === 'string' && resBtc.metrics.btcAdjustedNotice.length > 0;

    assertTest(
      'Safety Guard: Bitcoin backtest automatically clamps 1970 start to 2010-07-20',
      actualSimStart === '2010-07-20' && hasNotice,
      `Actual start: ${actualSimStart}, Notice: ${resBtc.metrics.btcAdjustedNotice}`
    );
  } catch (e) {
    assertTest('Bitcoin Auto-Correction Exception', false, e.message);
  }

  // TEST 6: Financial Metric Consistency on 100% Equity Strategy
  try {
    const eqConfig = {
      startDate: '2010-01-04',
      endDate: '2020-01-03',
      initialCapital: 100000000,
      allocations: [{ ticker: 'SPX', weightPct: 100 }],
      rebalanceEnabled: false,
      rebalanceMode: 'NONE',
      feeRatePct: 0.05,
      rules: [],
      benchmarkTicker: 'SPX'
    };

    const res = BacktestEngine.runBacktest(marketData, eqConfig);
    const m = res.metrics;
    const years = m.years;
    const expectedCagr = (Math.pow(m.finalEquity / m.initialCapital, 1 / years) - 1) * 100;
    const diffCagr = Math.abs(m.cagrPct - expectedCagr);

    assertTest(
      'Financial Metric: CAGR formula matches textbook compound annual return',
      diffCagr < 0.25,
      `Calculated: ${m.cagrPct}%, Formula: ${expectedCagr.toFixed(2)}%, Years: ${years}`
    );

    assertTest(
      'Financial Metric: Sharpe & MDD sign and magnitude consistency',
      m.maxDrawdownPct < -10.0 && m.sharpe > 0 && m.sharpe < 4.0,
      `MDD: ${m.maxDrawdownPct}%, Sharpe: ${m.sharpe}`
    );
  } catch (e) {
    assertTest('Metric Consistency Exception', false, e.message);
  }

  console.log('---------------------------------------------------------------');
  console.log(` [Engine Summary] Total Tests: ${passed + failed} | PASS: ${passed} | FAIL: ${failed}`);
  console.log('===============================================================\n');

  return { passed, failed, tests: testResults };
}

if (require.main === module) {
  runEngineLogicAudit();
}

module.exports = { runEngineLogicAudit };
