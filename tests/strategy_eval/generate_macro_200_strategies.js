/**
 * tests/strategy_eval/generate_macro_200_strategies.js
 *
 * Generates 200 distinct, rigorously structured Macro-Driven KOSPI 200 + Cash strategies.
 * Targets:
 *   - Tradable Universe: ONLY KPI200 + Cash (earning US3M short-term yield)
 *   - External Macro Signals:
 *       1. USDKRW (Korean Won / US Dollar FX rate)
 *       2. T10Y2Y (US 10Y - 2Y Yield Spread / Recession indicator)
 *       3. US10Y & US2Y (US Treasury 10-year & 2-year yields)
 *       4. KOR_CLI (OECD Composite Leading Indicator for Korea / Business cycle)
 *       5. SOXX (PHLX Semiconductor Index / Korea export proxy)
 *       6. VIX (CBOE Volatility index)
 *       7. DXY (US Dollar index)
 *       8. WTI (Crude Oil price / Energy shock)
 *   - Execution: Previous-Day Close (T-1) Signal -> Next-Day Close (T) Execution
 *   - Weekly trade cap: <= 3 trades/week
 */

const fs = require("fs");
const path = require("path");

function kAlloc(kpiPct) {
  return [{ ticker: "KPI200", weightPct: kpiPct }];
}

function reb(periodMode, bandMode = "NONE", bandThreshold = 8, customDays = 60) {
  return { periodMode, bandMode, bandThreshold, customDays };
}

const strategies = [];

// =========================================================================
// GROUP A: USDKRW (환율) 거시 전술 전략 (40개: M001 ~ M040)
// =========================================================================
const groupAFxConfigs = [
  // A1: 환율 이평선 돌파 및 데드크로스 스위칭 (10개)
  { core: 45, smaP: 60, sellPct: 60, buyPct: 60, cool: 5, desc: "환율 60일선 상향돌파 시 현금화 60% / 하향이탈 시 코스피 매수 60%" },
  { core: 50, smaP: 60, sellPct: 75, buyPct: 75, cool: 5, desc: "환율 60일선 상향돌파 시 현금화 75% / 하향이탈 시 코스피 매수 75%" },
  { core: 40, smaP: 120, sellPct: 70, buyPct: 70, cool: 7, desc: "환율 120일 중기선 상향돌파 시 현금화 70% / 하향이탈 시 재매수" },
  { core: 55, smaP: 120, sellPct: 80, buyPct: 80, cool: 7, desc: "환율 120일선 돌파 시 적극 현금화 80% / 하향 시 코스피 80% 복원" },
  { core: 35, smaP: 200, sellPct: 85, buyPct: 85, cool: 10, desc: "환율 200일 장기 추세선 상향돌파 시 현금 85% 대피 / 하향 시 코스피 복원" },
  { core: 50, smaP: 20, sellPct: 50, buyPct: 50, cool: 4, desc: "환율 20일 단기선 상향돌파 시 50% 현금화 / 하향이탈 시 50% 매수" },
  { core: 60, smaP: 60, sellPct: 70, buyPct: 60, cool: 5, desc: "환율 60일선 돌파 시 코스피 70% 매도 / 하향이탈 시 현금 60% 매수" },
  { core: 45, smaP: 90, sellPct: 75, buyPct: 75, cool: 6, desc: "환율 90일 분기선 상향돌파 시 75% 대피 / 하향 시 매수" },
  { core: 50, smaP: 60, sellPct: 100, buyPct: 80, cool: 5, desc: "환율 60일선 돌파 시 전량(100%) 현금화 / 안정 시 80% 재매수" },
  { core: 40, smaP: 60, sellPct: 65, buyPct: 70, cool: 5, desc: "환율 60일선 + 코스피 40:60 코어 밸런스 스위칭" },

  // A2: 환율 이격도(DISPARITY) 급등 과열 방어 (10개)
  { core: 45, dispP: 60, dispHigh: 104, dispLow: 97, sellPct: 70, buyPct: 70, cool: 5, desc: "환율 60일 이격도 104% 초과 시 외인 이탈 대비 현금화 / 97% 이하 시 환율 진정 매수" },
  { core: 50, dispP: 60, dispHigh: 105, dispLow: 96, sellPct: 80, buyPct: 80, cool: 6, desc: "환율 60일 이격도 105% 폭등 시 긴급 현금화 80% / 96% 이하 시 저점 매수" },
  { core: 40, dispP: 20, dispHigh: 103, dispLow: 98, sellPct: 60, buyPct: 60, cool: 4, desc: "환율 20일 단기 이격도 103% 초과 시 매도 / 98% 이하 매수" },
  { core: 55, dispP: 120, dispHigh: 106, dispLow: 95, sellPct: 85, buyPct: 80, cool: 7, desc: "환율 120일 중기 이격도 106% 오버슈팅 시 85% 현금화" },
  { core: 35, dispP: 60, dispHigh: 103.5, dispLow: 97.5, sellPct: 75, buyPct: 75, cool: 5, desc: "환율 60일 이격도 103.5% 민감형 환율 방어" },
  { core: 50, dispP: 60, dispHigh: 104.5, dispLow: 96.5, sellPct: 70, buyPct: 70, cool: 5, desc: "환율 60일 이격도 104.5% 기준 균형형 환율 쉴드" },
  { core: 60, dispP: 90, dispHigh: 105, dispLow: 96, sellPct: 75, buyPct: 75, cool: 6, desc: "환율 90일 이격도 105% 상회 시 외환 충격 차단" },
  { core: 45, dispP: 60, dispHigh: 106, dispLow: 95, sellPct: 90, buyPct: 85, cool: 7, desc: "환율 60일 이격도 106% 극단 과열 시 전량급(90%) 대피" },
  { core: 40, dispP: 30, dispHigh: 103.5, dispLow: 97, sellPct: 65, buyPct: 65, cool: 4, desc: "환율 30일 이격도 스위퍼" },
  { core: 50, dispP: 60, dispHigh: 104, dispLow: 98, sellPct: 60, buyPct: 60, cool: 5, desc: "환율 60일 이격도 104%/98% 타이트 밴드" },

  // A3: 환율 변화율(ROC) 모멘텀 급등 방어 & 꺾임 재매수 (10개)
  { core: 45, rocP: 20, rocHigh: 4.0, rocLow: -2.0, sellPct: 70, buyPct: 70, cool: 5, desc: "환율 20일 급등률 4% 초과 시 현금화 / 환율 -2% 하락 진정 시 매수" },
  { core: 50, rocP: 20, rocHigh: 5.0, rocLow: -2.5, sellPct: 80, buyPct: 80, cool: 5, desc: "환율 20일 급등률 5% 초과 시 80% 현금 대피" },
  { core: 40, rocP: 10, rocHigh: 3.0, rocLow: -1.5, sellPct: 60, buyPct: 60, cool: 4, desc: "환율 10일 초단기 급등 3% 포착 시 선제적 리스크 오프" },
  { core: 55, rocP: 60, rocHigh: 6.0, rocLow: -3.0, sellPct: 75, buyPct: 75, cool: 7, desc: "환율 60일 중기 상승률 6% 도달 시 매도 / -3% 안정 시 매수" },
  { core: 35, rocP: 20, rocHigh: 3.5, rocLow: -1.8, sellPct: 75, buyPct: 75, cool: 5, desc: "환율 20일 ROC 3.5% 저낙폭 보수형" },
  { core: 50, rocP: 40, rocHigh: 4.5, rocLow: -2.0, sellPct: 70, buyPct: 70, cool: 6, desc: "환율 40일 ROC 4.5% 스윙 필터" },
  { core: 60, rocP: 20, rocHigh: 5.5, rocLow: -2.5, sellPct: 85, buyPct: 80, cool: 6, desc: "환율 20일 ROC 5.5% 돌파 시 고성장형 긴급 현금화" },
  { core: 45, rocP: 15, rocHigh: 3.2, rocLow: -1.5, sellPct: 65, buyPct: 65, cool: 4, desc: "환율 15일 ROC 3.2% 밸런스 필터" },
  { core: 40, rocP: 60, rocHigh: 7.0, rocLow: -3.5, sellPct: 80, buyPct: 80, cool: 7, desc: "환율 60일 대형 사이클 7% 급등 차단" },
  { core: 50, rocP: 20, rocHigh: 4.2, rocLow: -2.2, sellPct: 75, buyPct: 75, cool: 5, desc: "환율 20일 4.2%/-2.2% 대칭 스위칭" },

  // A4: 환율 볼린저밴드 상단 터치 / 달러인덱스(DXY) 복합 방어 (10개)
  { core: 45, bbP: 20, bbStd: 2.0, sellPct: 70, buyPct: 70, cool: 5, desc: "환율 20일 볼린저상단 터치 시 외환과열 현금화 / 하단 접근 시 매수" },
  { core: 50, bbP: 40, bbStd: 2.0, sellPct: 75, buyPct: 75, cool: 6, desc: "환율 40일 볼린저상단 돌파 시 75% 현금화" },
  { core: 40, bbP: 60, bbStd: 2.0, sellPct: 80, buyPct: 80, cool: 7, desc: "환율 60일 볼린저상단 돌파 시 외환위기 차단 80% 현금화" },
  { core: 55, bbP: 20, bbStd: 2.2, sellPct: 75, buyPct: 75, cool: 5, desc: "환율 20일 2.2시그마 극단 과열 시 매도" },
  { core: 35, bbP: 30, bbStd: 1.8, sellPct: 65, buyPct: 65, cool: 4, desc: "환율 30일 1.8시그마 민감형 밴드 방어" },
  { core: 50, dxySma: 60, sellPct: 70, buyPct: 70, cool: 6, desc: "달러인덱스(DXY) 60일선 상향돌파 강달러 시 현금화 / 하향이탈 시 매수" },
  { core: 45, dxySma: 120, sellPct: 75, buyPct: 75, cool: 7, desc: "달러인덱스(DXY) 120일선 돌파 시 글로벌 달러경색 대피" },
  { core: 40, dxyRoc: 20, dxyVal: 3.0, sellPct: 70, buyPct: 70, cool: 5, desc: "달러인덱스 20일 3% 급등 시 외환 리스크 오프" },
  { core: 50, usdkrwP: 60, dxyP: 60, sellPct: 80, buyPct: 80, cool: 6, desc: "환율 60일선 & 달러인덱스 60일선 동반 돌파 시 80% 현금 대피" },
  { core: 45, bbP: 20, bbStd: 2.0, dxySma: 60, sellPct: 85, buyPct: 80, cool: 6, desc: "환율 BB 상단 + 달러인덱스 60일선 쌍끌이 강달러 철벽 방어" },
];

groupAFxConfigs.forEach((cfg, idx) => {
  const num = String(idx + 1).padStart(3, "0");
  const stratId = `M${num}`;
  const rules = [];

  if (cfg.smaP) {
    rules.push({
      id: `${stratId}_R1`,
      name: `환율 > SMA(${cfg.smaP}) 시 코스피 매도`,
      enabled: true,
      logic: "AND",
      cooldownDays: cfg.cool,
      conditions: [{
        left: { ticker: "USDKRW", transform: "PRICE" },
        operator: "CROSS_UP",
        rightMode: "INDICATOR",
        rightIndicator: { ticker: "USDKRW", transform: "SMA", p1: cfg.smaP }
      }],
      action: { targetTicker: "KPI200", type: "SELL", sizingMode: "BALANCE_PCT", sizingValue: cfg.sellPct }
    });
    rules.push({
      id: `${stratId}_R2`,
      name: `환율 < SMA(${cfg.smaP}) 시 코스피 매수`,
      enabled: true,
      logic: "AND",
      cooldownDays: cfg.cool,
      conditions: [{
        left: { ticker: "USDKRW", transform: "PRICE" },
        operator: "CROSS_DOWN",
        rightMode: "INDICATOR",
        rightIndicator: { ticker: "USDKRW", transform: "SMA", p1: cfg.smaP }
      }],
      action: { targetTicker: "KPI200", type: "BUY", sizingMode: "BALANCE_PCT", sizingValue: cfg.buyPct }
    });
  } else if (cfg.dispP) {
    rules.push({
      id: `${stratId}_R1`,
      name: `환율 이격도(${cfg.dispP}) > ${cfg.dispHigh}% 매도`,
      enabled: true,
      logic: "AND",
      cooldownDays: cfg.cool,
      conditions: [{
        left: { ticker: "USDKRW", transform: "DISPARITY", p1: cfg.dispP },
        operator: ">=",
        rightMode: "VALUE",
        rightValue: cfg.dispHigh
      }],
      action: { targetTicker: "KPI200", type: "SELL", sizingMode: "BALANCE_PCT", sizingValue: cfg.sellPct }
    });
    rules.push({
      id: `${stratId}_R2`,
      name: `환율 이격도(${cfg.dispP}) < ${cfg.dispLow}% 매수`,
      enabled: true,
      logic: "AND",
      cooldownDays: cfg.cool,
      conditions: [{
        left: { ticker: "USDKRW", transform: "DISPARITY", p1: cfg.dispP },
        operator: "<=",
        rightMode: "VALUE",
        rightValue: cfg.dispLow
      }],
      action: { targetTicker: "KPI200", type: "BUY", sizingMode: "BALANCE_PCT", sizingValue: cfg.buyPct }
    });
  } else if (cfg.rocP) {
    rules.push({
      id: `${stratId}_R1`,
      name: `환율 ROC(${cfg.rocP}) > ${cfg.rocHigh}% 매도`,
      enabled: true,
      logic: "AND",
      cooldownDays: cfg.cool,
      conditions: [{
        left: { ticker: "USDKRW", transform: "ROC", p1: cfg.rocP },
        operator: ">=",
        rightMode: "VALUE",
        rightValue: cfg.rocHigh
      }],
      action: { targetTicker: "KPI200", type: "SELL", sizingMode: "BALANCE_PCT", sizingValue: cfg.sellPct }
    });
    rules.push({
      id: `${stratId}_R2`,
      name: `환율 ROC(${cfg.rocP}) < ${cfg.rocLow}% 매수`,
      enabled: true,
      logic: "AND",
      cooldownDays: cfg.cool,
      conditions: [{
        left: { ticker: "USDKRW", transform: "ROC", p1: cfg.rocP },
        operator: "<=",
        rightMode: "VALUE",
        rightValue: cfg.rocLow
      }],
      action: { targetTicker: "KPI200", type: "BUY", sizingMode: "BALANCE_PCT", sizingValue: cfg.buyPct }
    });
  } else if (cfg.bbP && !cfg.dxySma) {
    rules.push({
      id: `${stratId}_R1`,
      name: `환율 BB(${cfg.bbP},${cfg.bbStd}) 상단 돌파 매도`,
      enabled: true,
      logic: "AND",
      cooldownDays: cfg.cool,
      conditions: [{
        left: { ticker: "USDKRW", transform: "PRICE", p1: cfg.bbP, p2: cfg.bbStd },
        operator: "BB_UPPER_TOUCH"
      }],
      action: { targetTicker: "KPI200", type: "SELL", sizingMode: "BALANCE_PCT", sizingValue: cfg.sellPct }
    });
    rules.push({
      id: `${stratId}_R2`,
      name: `환율 BB(${cfg.bbP},${cfg.bbStd}) 하단 터치 매수`,
      enabled: true,
      logic: "AND",
      cooldownDays: cfg.cool,
      conditions: [{
        left: { ticker: "USDKRW", transform: "PRICE", p1: cfg.bbP, p2: cfg.bbStd },
        operator: "BB_LOWER_TOUCH"
      }],
      action: { targetTicker: "KPI200", type: "BUY", sizingMode: "BALANCE_PCT", sizingValue: cfg.buyPct }
    });
  } else if (cfg.dxySma && !cfg.bbP) {
    rules.push({
      id: `${stratId}_R1`,
      name: `달러인덱스 > SMA(${cfg.dxySma}) 매도`,
      enabled: true,
      logic: "AND",
      cooldownDays: cfg.cool,
      conditions: [{
        left: { ticker: "DXY", transform: "PRICE" },
        operator: "CROSS_UP",
        rightMode: "INDICATOR",
        rightIndicator: { ticker: "DXY", transform: "SMA", p1: cfg.dxySma }
      }],
      action: { targetTicker: "KPI200", type: "SELL", sizingMode: "BALANCE_PCT", sizingValue: cfg.sellPct }
    });
    rules.push({
      id: `${stratId}_R2`,
      name: `달러인덱스 < SMA(${cfg.dxySma}) 매수`,
      enabled: true,
      logic: "AND",
      cooldownDays: cfg.cool,
      conditions: [{
        left: { ticker: "DXY", transform: "PRICE" },
        operator: "CROSS_DOWN",
        rightMode: "INDICATOR",
        rightIndicator: { ticker: "DXY", transform: "SMA", p1: cfg.dxySma }
      }],
      action: { targetTicker: "KPI200", type: "BUY", sizingMode: "BALANCE_PCT", sizingValue: cfg.buyPct }
    });
  } else if (cfg.dxyRoc) {
    rules.push({
      id: `${stratId}_R1`,
      name: `달러인덱스 ROC(${cfg.dxyRoc}) > ${cfg.dxyVal}% 매도`,
      enabled: true,
      logic: "AND",
      cooldownDays: cfg.cool,
      conditions: [{
        left: { ticker: "DXY", transform: "ROC", p1: cfg.dxyRoc },
        operator: ">=",
        rightMode: "VALUE",
        rightValue: cfg.dxyVal
      }],
      action: { targetTicker: "KPI200", type: "SELL", sizingMode: "BALANCE_PCT", sizingValue: cfg.sellPct }
    });
    rules.push({
      id: `${stratId}_R2`,
      name: `달러인덱스 ROC(${cfg.dxyRoc}) < -1.5% 매수`,
      enabled: true,
      logic: "AND",
      cooldownDays: cfg.cool,
      conditions: [{
        left: { ticker: "DXY", transform: "ROC", p1: cfg.dxyRoc },
        operator: "<=",
        rightMode: "VALUE",
        rightValue: -1.5
      }],
      action: { targetTicker: "KPI200", type: "BUY", sizingMode: "BALANCE_PCT", sizingValue: cfg.buyPct }
    });
  } else {
    // Composite
    rules.push({
      id: `${stratId}_R1`,
      name: `환율 > SMA(60) AND 달러인덱스 > SMA(60) 쌍끌이 매도`,
      enabled: true,
      logic: "OR",
      cooldownDays: cfg.cool,
      conditions: [
        {
          left: { ticker: "USDKRW", transform: "PRICE" },
          operator: ">=",
          rightMode: "INDICATOR",
          rightIndicator: { ticker: "USDKRW", transform: "SMA", p1: 60 }
        },
        {
          left: { ticker: "DXY", transform: "PRICE" },
          operator: ">=",
          rightMode: "INDICATOR",
          rightIndicator: { ticker: "DXY", transform: "SMA", p1: 60 }
        }
      ],
      action: { targetTicker: "KPI200", type: "SELL", sizingMode: "BALANCE_PCT", sizingValue: cfg.sellPct }
    });
    rules.push({
      id: `${stratId}_R2`,
      name: `환율 < SMA(60) AND 달러인덱스 < SMA(60) 매수`,
      enabled: true,
      logic: "AND",
      cooldownDays: cfg.cool,
      conditions: [
        {
          left: { ticker: "USDKRW", transform: "PRICE" },
          operator: "<",
          rightMode: "INDICATOR",
          rightIndicator: { ticker: "USDKRW", transform: "SMA", p1: 60 }
        },
        {
          left: { ticker: "DXY", transform: "PRICE" },
          operator: "<",
          rightMode: "INDICATOR",
          rightIndicator: { ticker: "DXY", transform: "SMA", p1: 60 }
        }
      ],
      action: { targetTicker: "KPI200", type: "BUY", sizingMode: "BALANCE_PCT", sizingValue: cfg.buyPct }
    });
  }

  strategies.push({
    id: stratId,
    name: `[${stratId}] 환율 거시 전술 (${cfg.desc})`,
    category: "Group A: 원달러 환율(USDKRW) 거시 전술",
    rationale: cfg.desc,
    allocations: kAlloc(cfg.core),
    rebalanceEnabled: true,
    rebalance: reb("QUARTERLY", "ABS_PP", 6),
    rulesEnabled: true,
    rules
  });
});

// =========================================================================
// GROUP B: 미국 국채금리 & 장단기 금리차(T10Y2Y) 전략 (40개: M041 ~ M080)
// =========================================================================
const groupBYieldConfigs = [
  // B1: T10Y2Y 일드커브 역전 후 스티프닝(정상화) 리세션 경보 스위칭 (15개)
  { core: 45, steepVal: 0.0, sellPct: 75, buyPct: 70, cool: 6, desc: "장단기 금리차(10Y-2Y) 역전 후 0% 상향돌파(스티프닝) 시 리세션 대피 75% 현금화" },
  { core: 50, steepVal: 0.1, sellPct: 80, buyPct: 75, cool: 6, desc: "T10Y2Y > 0.1% 정상화 확인 시 80% 현금 대피" },
  { core: 40, steepVal: 0.2, sellPct: 85, buyPct: 80, cool: 7, desc: "T10Y2Y > 0.2% 본격 스티프닝 시 85% 현금화" },
  { core: 55, steepVal: 0.0, sellPct: 70, buyPct: 70, cool: 6, desc: "T10Y2Y 0% 돌파 70% 현금화 / 코어 55:45" },
  { core: 35, steepVal: -0.1, sellPct: 75, buyPct: 75, cool: 5, desc: "T10Y2Y > -0.1% 역전 완화 시 조기 대피 / 코어 35:65" },
  { core: 50, steepVal: 0.0, sellPct: 100, buyPct: 80, cool: 7, desc: "T10Y2Y 0% 상향돌파 시 전량(100%) 현금 대피" },
  { core: 45, steepVal: 0.15, sellPct: 80, buyPct: 75, cool: 6, desc: "T10Y2Y > 0.15% 기준 80% 현금화" },
  { core: 60, steepVal: 0.0, sellPct: 80, buyPct: 70, cool: 6, desc: "고성장형(60:40) T10Y2Y 0% 돌파 시 80% 현금화" },
  { core: 40, steepVal: 0.25, sellPct: 90, buyPct: 85, cool: 7, desc: "T10Y2Y > 0.25% 리세션 공식 진입 시 90% 현금화" },
  { core: 50, steepVal: 0.05, sellPct: 75, buyPct: 75, cool: 6, desc: "T10Y2Y > 0.05% 중립 스티프닝 스위칭" },
  { core: 45, steepVal: -0.2, sellPct: 65, buyPct: 65, cool: 5, desc: "T10Y2Y 심각 역전 탈출 시 65% 현금화" },
  { core: 50, steepVal: 0.3, sellPct: 80, buyPct: 80, cool: 7, desc: "T10Y2Y 0.3% 확인 스티프닝" },
  { core: 35, steepVal: 0.0, sellPct: 85, buyPct: 80, cool: 6, desc: "초방어 35:65 + T10Y2Y 0% 돌파" },
  { core: 55, steepVal: 0.1, sellPct: 75, buyPct: 75, cool: 6, desc: "성장 55:45 + T10Y2Y 0.1% 돌파" },
  { core: 45, steepVal: 0.08, sellPct: 70, buyPct: 70, cool: 5, desc: "밸런스 45:55 + T10Y2Y 0.08% 돌파" },

  // B2: 미국 10년물 국채금리(US10Y) 급등 긴축 발작 방어 (15개)
  { core: 45, diffP: 20, diffVal: 0.30, sellPct: 70, buyPct: 70, cool: 5, desc: "미국 10년물 금리 20일간 +30bp(+0.30%p) 급등 시 긴축 쇼크 70% 현금화" },
  { core: 50, diffP: 20, diffVal: 0.40, sellPct: 80, buyPct: 75, cool: 6, desc: "미 10년 금리 20일간 +40bp 스파이크 시 80% 현금 대피" },
  { core: 40, diffP: 30, diffVal: 0.35, sellPct: 75, buyPct: 75, cool: 6, desc: "미 10년 금리 30일간 +35bp 상승 시 75% 현금화" },
  { core: 55, diffP: 20, diffVal: 0.25, sellPct: 65, buyPct: 65, cool: 5, desc: "미 10년 금리 20일간 +25bp 민감 감지 매도" },
  { core: 35, diffP: 15, diffVal: 0.30, sellPct: 75, buyPct: 75, cool: 5, desc: "미 10년 금리 15일간 +30bp 보수형 대피" },
  { core: 50, rocP: 40, rocVal: 15.0, sellPct: 75, buyPct: 75, cool: 6, desc: "미 10년 금리 40일 ROC > +15% 급등 시 75% 현금화" },
  { core: 45, rocP: 60, rocVal: 20.0, sellPct: 80, buyPct: 80, cool: 7, desc: "미 10년 금리 60일 ROC > +20% 긴축 사이클 차단" },
  { core: 60, diffP: 20, diffVal: 0.45, sellPct: 85, buyPct: 80, cool: 6, desc: "고성장 60:40 + 미 10년 금리 +45bp 급등 방어" },
  { core: 40, diffP: 10, diffVal: 0.25, sellPct: 70, buyPct: 70, cool: 4, desc: "미 10년 금리 10일 +25bp 초단기 금리발작 방어" },
  { core: 50, diffP: 20, diffVal: 0.35, sellPct: 75, buyPct: 75, cool: 5, desc: "미 10년 금리 20일 +35bp 표준 금리 필터" },
  { core: 45, smaP: 60, sellPct: 65, buyPct: 65, cool: 5, desc: "미 10년 금리 > SMA(60) 돌파 시 65% 현금화" },
  { core: 50, smaP: 120, sellPct: 70, buyPct: 70, cool: 6, desc: "미 10년 금리 > SMA(120) 돌파 시 70% 현금화" },
  { core: 35, smaP: 60, sellPct: 75, buyPct: 75, cool: 5, desc: "초방어 35:65 + 미 10년 금리 60일선 돌파" },
  { core: 55, rocP: 30, rocVal: 12.0, sellPct: 70, buyPct: 70, cool: 5, desc: "미 10년 금리 30일 ROC 12% 상승 시 매도" },
  { core: 50, diffP: 25, diffVal: 0.35, sellPct: 75, buyPct: 75, cool: 6, desc: "미 10년 금리 25일 +35bp 스위칭" },

  // B3: 미국 2년물 금리(US2Y) 피벗 & 장단기 금리차 복합 (10개)
  { core: 45, us2yRoc: -10.0, sellPct: 60, buyPct: 70, cool: 6, desc: "미 2년물 금리 60일간 -10% 급락(피벗 인하) 시 침체 확인 매도 / 바닥 진정 매수" },
  { core: 50, us2yRoc: -15.0, sellPct: 70, buyPct: 75, cool: 7, desc: "미 2년물 금리 -15% 급락 시 리세션 대피" },
  { core: 40, us2yDiff: -0.40, sellPct: 75, buyPct: 75, cool: 6, desc: "미 2년물 금리 20일간 -40bp 급락 시 75% 현금화" },
  { core: 55, us2yDiff: -0.50, sellPct: 80, buyPct: 80, cool: 7, desc: "미 2년물 금리 -50bp 폭락 시 패닉 대피" },
  { core: 35, us2yDiff: -0.35, sellPct: 75, buyPct: 75, cool: 5, desc: "보수 35:65 + 미 2년 금리 -35bp 급락 방어" },
  { core: 50, steepVal: 0.0, us10yDiff: 0.3, sellPct: 85, buyPct: 80, cool: 7, desc: "T10Y2Y 스티프닝 OR 미10년 금리 급등 복합 금리 쉴드" },
  { core: 45, steepVal: 0.1, us10yDiff: 0.35, sellPct: 80, buyPct: 75, cool: 6, desc: "T10Y2Y > 0.1% OR 미10년 +35bp 80% 현금 대피" },
  { core: 60, steepVal: 0.0, us10yDiff: 0.4, sellPct: 85, buyPct: 80, cool: 6, desc: "고성장 60:40 + 복합 금리 충격 차단" },
  { core: 40, steepVal: 0.05, us10yDiff: 0.25, sellPct: 75, buyPct: 75, cool: 5, desc: "저낙폭 40:60 + 복합 금리 필터" },
  { core: 50, steepVal: 0.2, us10yDiff: 0.3, sellPct: 80, buyPct: 80, cool: 6, desc: "스마트 일드커브 80% 현금 스위칭" },
];

groupBYieldConfigs.forEach((cfg, idx) => {
  const num = String(41 + idx).padStart(3, "0");
  const stratId = `M${num}`;
  const rules = [];

  if (cfg.steepVal !== undefined && !cfg.us10yDiff) {
    rules.push({
      id: `${stratId}_R1`,
      name: `T10Y2Y > ${cfg.steepVal}% 스티프닝 리세션 매도`,
      enabled: true,
      logic: "AND",
      cooldownDays: cfg.cool,
      conditions: [{
        left: { ticker: "T10Y2Y", transform: "PRICE" },
        operator: ">=",
        rightMode: "VALUE",
        rightValue: cfg.steepVal
      }],
      action: { targetTicker: "KPI200", type: "SELL", sizingMode: "BALANCE_PCT", sizingValue: cfg.sellPct }
    });
    rules.push({
      id: `${stratId}_R2`,
      name: `T10Y2Y < ${cfg.steepVal - 0.2}% 재진입 매수`,
      enabled: true,
      logic: "AND",
      cooldownDays: cfg.cool,
      conditions: [{
        left: { ticker: "T10Y2Y", transform: "PRICE" },
        operator: "<=",
        rightMode: "VALUE",
        rightValue: cfg.steepVal - 0.2
      }],
      action: { targetTicker: "KPI200", type: "BUY", sizingMode: "BALANCE_PCT", sizingValue: cfg.buyPct }
    });
  } else if (cfg.diffVal) {
    rules.push({
      id: `${stratId}_R1`,
      name: `미10년 금리 DIFF(${cfg.diffP}) >= +${cfg.diffVal}%p 급등 매도`,
      enabled: true,
      logic: "AND",
      cooldownDays: cfg.cool,
      conditions: [{
        left: { ticker: "US10Y", transform: "DIFF", p1: cfg.diffP },
        operator: ">=",
        rightMode: "VALUE",
        rightValue: cfg.diffVal
      }],
      action: { targetTicker: "KPI200", type: "SELL", sizingMode: "BALANCE_PCT", sizingValue: cfg.sellPct }
    });
    rules.push({
      id: `${stratId}_R2`,
      name: `미10년 금리 DIFF(${cfg.diffP}) <= -0.15%p 안정 매수`,
      enabled: true,
      logic: "AND",
      cooldownDays: cfg.cool,
      conditions: [{
        left: { ticker: "US10Y", transform: "DIFF", p1: cfg.diffP },
        operator: "<=",
        rightMode: "VALUE",
        rightValue: -0.15
      }],
      action: { targetTicker: "KPI200", type: "BUY", sizingMode: "BALANCE_PCT", sizingValue: cfg.buyPct }
    });
  } else if (cfg.rocVal) {
    rules.push({
      id: `${stratId}_R1`,
      name: `미10년 금리 ROC(${cfg.rocP}) >= +${cfg.rocVal}% 매도`,
      enabled: true,
      logic: "AND",
      cooldownDays: cfg.cool,
      conditions: [{
        left: { ticker: "US10Y", transform: "ROC", p1: cfg.rocP },
        operator: ">=",
        rightMode: "VALUE",
        rightValue: cfg.rocVal
      }],
      action: { targetTicker: "KPI200", type: "SELL", sizingMode: "BALANCE_PCT", sizingValue: cfg.sellPct }
    });
    rules.push({
      id: `${stratId}_R2`,
      name: `미10년 금리 ROC(${cfg.rocP}) <= -8% 매수`,
      enabled: true,
      logic: "AND",
      cooldownDays: cfg.cool,
      conditions: [{
        left: { ticker: "US10Y", transform: "ROC", p1: cfg.rocP },
        operator: "<=",
        rightMode: "VALUE",
        rightValue: -8.0
      }],
      action: { targetTicker: "KPI200", type: "BUY", sizingMode: "BALANCE_PCT", sizingValue: cfg.buyPct }
    });
  } else if (cfg.smaP) {
    rules.push({
      id: `${stratId}_R1`,
      name: `미10년 금리 > SMA(${cfg.smaP}) 매도`,
      enabled: true,
      logic: "AND",
      cooldownDays: cfg.cool,
      conditions: [{
        left: { ticker: "US10Y", transform: "PRICE" },
        operator: "CROSS_UP",
        rightMode: "INDICATOR",
        rightIndicator: { ticker: "US10Y", transform: "SMA", p1: cfg.smaP }
      }],
      action: { targetTicker: "KPI200", type: "SELL", sizingMode: "BALANCE_PCT", sizingValue: cfg.sellPct }
    });
    rules.push({
      id: `${stratId}_R2`,
      name: `미10년 금리 < SMA(${cfg.smaP}) 매수`,
      enabled: true,
      logic: "AND",
      cooldownDays: cfg.cool,
      conditions: [{
        left: { ticker: "US10Y", transform: "PRICE" },
        operator: "CROSS_DOWN",
        rightMode: "INDICATOR",
        rightIndicator: { ticker: "US10Y", transform: "SMA", p1: cfg.smaP }
      }],
      action: { targetTicker: "KPI200", type: "BUY", sizingMode: "BALANCE_PCT", sizingValue: cfg.buyPct }
    });
  } else if (cfg.us2yDiff) {
    rules.push({
      id: `${stratId}_R1`,
      name: `미2년 금리 DIFF(20) <= ${cfg.us2yDiff}%p 피벗 침체 매도`,
      enabled: true,
      logic: "AND",
      cooldownDays: cfg.cool,
      conditions: [{
        left: { ticker: "US2Y", transform: "DIFF", p1: 20 },
        operator: "<=",
        rightMode: "VALUE",
        rightValue: cfg.us2yDiff
      }],
      action: { targetTicker: "KPI200", type: "SELL", sizingMode: "BALANCE_PCT", sizingValue: cfg.sellPct }
    });
    rules.push({
      id: `${stratId}_R2`,
      name: `미2년 금리 안정 시 매수`,
      enabled: true,
      logic: "AND",
      cooldownDays: cfg.cool,
      conditions: [{
        left: { ticker: "US2Y", transform: "DIFF", p1: 20 },
        operator: ">=",
        rightMode: "VALUE",
        rightValue: 0.05
      }],
      action: { targetTicker: "KPI200", type: "BUY", sizingMode: "BALANCE_PCT", sizingValue: cfg.buyPct }
    });
  } else {
    // Composite
    rules.push({
      id: `${stratId}_R1`,
      name: `T10Y2Y 스티프닝 OR 미10년 금리 급등 매도`,
      enabled: true,
      logic: "OR",
      cooldownDays: cfg.cool,
      conditions: [
        {
          left: { ticker: "T10Y2Y", transform: "PRICE" },
          operator: ">=",
          rightMode: "VALUE",
          rightValue: cfg.steepVal
        },
        {
          left: { ticker: "US10Y", transform: "DIFF", p1: 20 },
          operator: ">=",
          rightMode: "VALUE",
          rightValue: cfg.us10yDiff
        }
      ],
      action: { targetTicker: "KPI200", type: "SELL", sizingMode: "BALANCE_PCT", sizingValue: cfg.sellPct }
    });
    rules.push({
      id: `${stratId}_R2`,
      name: `금리 충격 완화 시 매수`,
      enabled: true,
      logic: "AND",
      cooldownDays: cfg.cool,
      conditions: [
        {
          left: { ticker: "T10Y2Y", transform: "PRICE" },
          operator: "<=",
          rightMode: "VALUE",
          rightValue: cfg.steepVal - 0.2
        },
        {
          left: { ticker: "US10Y", transform: "DIFF", p1: 20 },
          operator: "<=",
          rightMode: "VALUE",
          rightValue: 0.0
        }
      ],
      action: { targetTicker: "KPI200", type: "BUY", sizingMode: "BALANCE_PCT", sizingValue: cfg.buyPct }
    });
  }

  strategies.push({
    id: stratId,
    name: `[${stratId}] 금리/일드커브 거시 전술 (${cfg.desc})`,
    category: "Group B: 미국 국채금리 & 장단기 금리차",
    rationale: cfg.desc,
    allocations: kAlloc(cfg.core),
    rebalanceEnabled: true,
    rebalance: reb("QUARTERLY", "ABS_PP", 6),
    rulesEnabled: true,
    rules
  });
});

// =========================================================================
// GROUP C: 한국 OECD 경기순환변동치(KOR_CLI) 경기사이클 전략 (40개: M081 ~ M120)
// =========================================================================
const groupCCliConfigs = [
  // C1: CLI 100 기준 확장/수축 스위칭 (15개)
  { core: 50, cliLevel: 100.0, sellPct: 75, buyPct: 80, cool: 10, desc: "OECD 경기선행지수(CLI) 100 상회 시 경기확장 매수 80% / 100 하회 시 경기수축 현금화 75%" },
  { core: 45, cliLevel: 100.0, sellPct: 85, buyPct: 85, cool: 10, desc: "CLI 100 기준 85% 대규모 현금 대피 및 확장 매수" },
  { core: 40, cliLevel: 100.0, sellPct: 70, buyPct: 75, cool: 10, desc: "CLI 100 기준 코어 40:60 방어형 스위칭" },
  { core: 55, cliLevel: 100.0, sellPct: 80, buyPct: 85, cool: 10, desc: "CLI 100 기준 코어 55:45 성장형 스위칭" },
  { core: 35, cliLevel: 100.0, sellPct: 90, buyPct: 80, cool: 10, desc: "CLI 100 기준 코어 35:65 초방어형 스위칭" },
  { core: 50, cliLevel: 100.5, sellPct: 80, buyPct: 80, cool: 10, desc: "CLI 100.5 이상 확실한 확장 국면 매수 / 하향 시 현금화" },
  { core: 45, cliLevel: 99.5, sellPct: 75, buyPct: 75, cool: 10, desc: "CLI 99.5 선제적 수축 탈출 스위칭" },
  { core: 60, cliLevel: 100.0, sellPct: 85, buyPct: 90, cool: 10, desc: "고성장 60:40 CLI 100 경기사이클 풀베팅" },
  { core: 50, cliLevel: 100.0, sellPct: 100, buyPct: 80, cool: 12, desc: "CLI 100 하회 시 전량(100%) 현금 대피" },
  { core: 40, cliLevel: 100.2, sellPct: 80, buyPct: 80, cool: 10, desc: "CLI 100.2 기준 밸런스 40:60" },
  { core: 50, cliLevel: 99.8, sellPct: 70, buyPct: 70, cool: 10, desc: "CLI 99.8 민감형 스위칭" },
  { core: 45, cliLevel: 100.0, sellPct: 65, buyPct: 70, cool: 8, desc: "CLI 100 마일드 스위칭" },
  { core: 35, cliLevel: 100.0, sellPct: 80, buyPct: 75, cool: 10, desc: "초방어 35:65 CLI 100 쉴드" },
  { core: 55, cliLevel: 100.3, sellPct: 75, buyPct: 80, cool: 10, desc: "성장 55:45 CLI 100.3 확인 확장" },
  { core: 50, cliLevel: 100.0, sellPct: 75, buyPct: 75, cool: 10, desc: "표준 50:50 CLI 100 경기추종" },

  // C2: CLI 변화율(ROC / 모멘텀) 선행 방향성 스위칭 (15개)
  { core: 45, rocP: 60, rocVal: 0.3, sellPct: 75, buyPct: 80, cool: 10, desc: "CLI 60일 변화율 +0.3% 상승 가속 시 저점 매집 / -0.3% 하락 둔화 시 선제 현금화" },
  { core: 50, rocP: 60, rocVal: 0.5, sellPct: 80, buyPct: 85, cool: 10, desc: "CLI 60일 변화율 +0.5% 강한 경기반등 매수 / -0.5% 둔화 매도" },
  { core: 40, rocP: 90, rocVal: 0.4, sellPct: 80, buyPct: 80, cool: 12, desc: "CLI 90일 분기 모멘텀 +0.4% 경기 확장 추종" },
  { core: 55, rocP: 60, rocVal: 0.2, sellPct: 70, buyPct: 75, cool: 8, desc: "CLI 60일 +0.2% 민감 경기회복 조기 포착" },
  { core: 35, rocP: 60, rocVal: 0.4, sellPct: 85, buyPct: 80, cool: 10, desc: "초방어 35:65 + CLI 60일 모멘텀" },
  { core: 50, rocP: 120, rocVal: 0.6, sellPct: 85, buyPct: 85, cool: 15, desc: "CLI 120일 반기 대세 사이클 +0.6% 추종" },
  { core: 45, rocP: 40, rocVal: 0.25, sellPct: 70, buyPct: 70, cool: 8, desc: "CLI 40일 단기 모멘텀 스위처" },
  { core: 60, rocP: 60, rocVal: 0.4, sellPct: 80, buyPct: 85, cool: 10, desc: "고성장 60:40 + CLI 60일 ROC 0.4%" },
  { core: 40, rocP: 60, rocVal: 0.35, sellPct: 75, buyPct: 75, cool: 10, desc: "밸런스 40:60 + CLI 60일 ROC 0.35%" },
  { core: 50, rocP: 60, rocVal: 0.2, sellPct: 65, buyPct: 70, cool: 8, desc: "CLI 60일 ROC 0.2% 마일드" },
  { core: 45, rocP: 90, rocVal: 0.6, sellPct: 80, buyPct: 80, cool: 12, desc: "CLI 90일 ROC 0.6% 대형 사이클" },
  { core: 35, rocP: 60, rocVal: 0.3, sellPct: 80, buyPct: 75, cool: 10, desc: "초방어 35:65 CLI 모멘텀" },
  { core: 55, rocP: 90, rocVal: 0.5, sellPct: 75, buyPct: 80, cool: 12, desc: "성장 55:45 CLI 90일 모멘텀" },
  { core: 50, rocP: 60, rocVal: 0.4, sellPct: 75, buyPct: 80, cool: 10, desc: "표준 50:50 CLI 60일 모멘텀" },
  { core: 45, rocP: 60, rocVal: 0.45, sellPct: 80, buyPct: 80, cool: 10, desc: "CLI 60일 ROC 0.45% 밸런스" },

  // C3: CLI 4국면 & 환율/이평선 복합 경기엔진 (10개)
  { core: 50, cliLevel: 100.0, rocP: 60, sellPct: 85, buyPct: 85, cool: 10, desc: "CLI > 100 AND ROC > 0 (경기 확장기) 코스피 집중 / CLI < 100 AND ROC < 0 (수축기) 전량 대피" },
  { core: 45, cliLevel: 100.0, rocP: 60, sellPct: 80, buyPct: 80, cool: 10, desc: "CLI 100 + ROC 60일 복합 경기사이클 4국면 배분" },
  { core: 55, cliLevel: 100.0, rocP: 60, sellPct: 80, buyPct: 85, cool: 10, desc: "성장형 CLI 100 + 모멘텀 확장 집중" },
  { core: 40, cliLevel: 100.0, rocP: 60, sellPct: 85, buyPct: 80, cool: 10, desc: "방어형 CLI 100 + 모멘텀 수축 철벽 대피" },
  { core: 50, cliLevel: 100.0, kpiSma: 60, sellPct: 80, buyPct: 80, cool: 8, desc: "CLI > 100 AND 코스피 > SMA(60) 쌍끌이 상승 매수 / 이탈 시 현금화" },
  { core: 45, cliLevel: 100.0, kpiSma: 60, sellPct: 85, buyPct: 85, cool: 8, desc: "CLI 100 + 코스피 60일 수급선 동시 확인 골디락스" },
  { core: 40, cliLevel: 100.0, usdkrwSma: 60, sellPct: 85, buyPct: 80, cool: 10, desc: "CLI > 100 AND 환율 < SMA(60) 최상 경기 매수 / CLI < 100 & 환율 급등 시 85% 현금화" },
  { core: 50, cliLevel: 100.0, usdkrwSma: 60, sellPct: 80, buyPct: 80, cool: 10, desc: "CLI 경기선행 + 원달러 환율 쌍방향 매크로 엔진" },
  { core: 55, cliLevel: 100.0, usdkrwSma: 60, sellPct: 85, buyPct: 85, cool: 10, desc: "성장형 CLI + 환율 복합 매크로" },
  { core: 35, cliLevel: 100.0, usdkrwSma: 60, sellPct: 90, buyPct: 80, cool: 10, desc: "초방어 35:65 CLI + 환율 최악 국면 90% 대피" },
];

groupCCliConfigs.forEach((cfg, idx) => {
  const num = String(81 + idx).padStart(3, "0");
  const stratId = `M${num}`;
  const rules = [];

  if (cfg.cliLevel && !cfg.rocP && !cfg.kpiSma && !cfg.usdkrwSma) {
    rules.push({
      id: `${stratId}_R1`,
      name: `CLI < ${cfg.cliLevel} 경기수축 매도`,
      enabled: true,
      logic: "AND",
      cooldownDays: cfg.cool,
      conditions: [{
        left: { ticker: "KOR_CLI", transform: "PRICE" },
        operator: "<",
        rightMode: "VALUE",
        rightValue: cfg.cliLevel
      }],
      action: { targetTicker: "KPI200", type: "SELL", sizingMode: "BALANCE_PCT", sizingValue: cfg.sellPct }
    });
    rules.push({
      id: `${stratId}_R2`,
      name: `CLI >= ${cfg.cliLevel} 경기확장 매수`,
      enabled: true,
      logic: "AND",
      cooldownDays: cfg.cool,
      conditions: [{
        left: { ticker: "KOR_CLI", transform: "PRICE" },
        operator: ">=",
        rightMode: "VALUE",
        rightValue: cfg.cliLevel
      }],
      action: { targetTicker: "KPI200", type: "BUY", sizingMode: "BALANCE_PCT", sizingValue: cfg.buyPct }
    });
  } else if (cfg.rocVal && !cfg.cliLevel) {
    rules.push({
      id: `${stratId}_R1`,
      name: `CLI ROC(${cfg.rocP}) <= -${cfg.rocVal}% 둔화 매도`,
      enabled: true,
      logic: "AND",
      cooldownDays: cfg.cool,
      conditions: [{
        left: { ticker: "KOR_CLI", transform: "ROC", p1: cfg.rocP },
        operator: "<=",
        rightMode: "VALUE",
        rightValue: -cfg.rocVal
      }],
      action: { targetTicker: "KPI200", type: "SELL", sizingMode: "BALANCE_PCT", sizingValue: cfg.sellPct }
    });
    rules.push({
      id: `${stratId}_R2`,
      name: `CLI ROC(${cfg.rocP}) >= +${cfg.rocVal}% 회복 매수`,
      enabled: true,
      logic: "AND",
      cooldownDays: cfg.cool,
      conditions: [{
        left: { ticker: "KOR_CLI", transform: "ROC", p1: cfg.rocP },
        operator: ">=",
        rightMode: "VALUE",
        rightValue: cfg.rocVal
      }],
      action: { targetTicker: "KPI200", type: "BUY", sizingMode: "BALANCE_PCT", sizingValue: cfg.buyPct }
    });
  } else if (cfg.cliLevel && cfg.rocP) {
    // 4-phase
    rules.push({
      id: `${stratId}_R1`,
      name: `CLI < 100 AND ROC <= 0 침체기 매도`,
      enabled: true,
      logic: "AND",
      cooldownDays: cfg.cool,
      conditions: [
        {
          left: { ticker: "KOR_CLI", transform: "PRICE" },
          operator: "<",
          rightMode: "VALUE",
          rightValue: cfg.cliLevel
        },
        {
          left: { ticker: "KOR_CLI", transform: "ROC", p1: cfg.rocP },
          operator: "<=",
          rightMode: "VALUE",
          rightValue: 0.0
        }
      ],
      action: { targetTicker: "KPI200", type: "SELL", sizingMode: "BALANCE_PCT", sizingValue: cfg.sellPct }
    });
    rules.push({
      id: `${stratId}_R2`,
      name: `CLI >= 100 AND ROC >= 0 확장기 매수`,
      enabled: true,
      logic: "AND",
      cooldownDays: cfg.cool,
      conditions: [
        {
          left: { ticker: "KOR_CLI", transform: "PRICE" },
          operator: ">=",
          rightMode: "VALUE",
          rightValue: cfg.cliLevel
        },
        {
          left: { ticker: "KOR_CLI", transform: "ROC", p1: cfg.rocP },
          operator: ">=",
          rightMode: "VALUE",
          rightValue: 0.0
        }
      ],
      action: { targetTicker: "KPI200", type: "BUY", sizingMode: "BALANCE_PCT", sizingValue: cfg.buyPct }
    });
  } else if (cfg.kpiSma) {
    rules.push({
      id: `${stratId}_R1`,
      name: `CLI < 100 OR 코스피 < SMA(60) 매도`,
      enabled: true,
      logic: "OR",
      cooldownDays: cfg.cool,
      conditions: [
        {
          left: { ticker: "KOR_CLI", transform: "PRICE" },
          operator: "<",
          rightMode: "VALUE",
          rightValue: 100.0
        },
        {
          left: { ticker: "KPI200", transform: "PRICE" },
          operator: "<",
          rightMode: "INDICATOR",
          rightIndicator: { ticker: "KPI200", transform: "SMA", p1: cfg.kpiSma }
        }
      ],
      action: { targetTicker: "KPI200", type: "SELL", sizingMode: "BALANCE_PCT", sizingValue: cfg.sellPct }
    });
    rules.push({
      id: `${stratId}_R2`,
      name: `CLI >= 100 AND 코스피 >= SMA(60) 매수`,
      enabled: true,
      logic: "AND",
      cooldownDays: cfg.cool,
      conditions: [
        {
          left: { ticker: "KOR_CLI", transform: "PRICE" },
          operator: ">=",
          rightMode: "VALUE",
          rightValue: 100.0
        },
        {
          left: { ticker: "KPI200", transform: "PRICE" },
          operator: ">=",
          rightMode: "INDICATOR",
          rightIndicator: { ticker: "KPI200", transform: "SMA", p1: cfg.kpiSma }
        }
      ],
      action: { targetTicker: "KPI200", type: "BUY", sizingMode: "BALANCE_PCT", sizingValue: cfg.buyPct }
    });
  } else {
    // CLI + USDKRW
    rules.push({
      id: `${stratId}_R1`,
      name: `CLI < 100 OR 환율 > SMA(60) 매도`,
      enabled: true,
      logic: "OR",
      cooldownDays: cfg.cool,
      conditions: [
        {
          left: { ticker: "KOR_CLI", transform: "PRICE" },
          operator: "<",
          rightMode: "VALUE",
          rightValue: 100.0
        },
        {
          left: { ticker: "USDKRW", transform: "PRICE" },
          operator: ">=",
          rightMode: "INDICATOR",
          rightIndicator: { ticker: "USDKRW", transform: "SMA", p1: cfg.usdkrwSma }
        }
      ],
      action: { targetTicker: "KPI200", type: "SELL", sizingMode: "BALANCE_PCT", sizingValue: cfg.sellPct }
    });
    rules.push({
      id: `${stratId}_R2`,
      name: `CLI >= 100 AND 환율 < SMA(60) 매수`,
      enabled: true,
      logic: "AND",
      cooldownDays: cfg.cool,
      conditions: [
        {
          left: { ticker: "KOR_CLI", transform: "PRICE" },
          operator: ">=",
          rightMode: "VALUE",
          rightValue: 100.0
        },
        {
          left: { ticker: "USDKRW", transform: "PRICE" },
          operator: "<",
          rightMode: "INDICATOR",
          rightIndicator: { ticker: "USDKRW", transform: "SMA", p1: cfg.usdkrwSma }
        }
      ],
      action: { targetTicker: "KPI200", type: "BUY", sizingMode: "BALANCE_PCT", sizingValue: cfg.buyPct }
    });
  }

  strategies.push({
    id: stratId,
    name: `[${stratId}] OECD 경기순환변동치 전술 (${cfg.desc})`,
    category: "Group C: 한국 OECD 경기순환변동치(KOR_CLI)",
    rationale: cfg.desc,
    allocations: kAlloc(cfg.core),
    rebalanceEnabled: true,
    rebalance: reb("QUARTERLY", "ABS_PP", 6),
    rulesEnabled: true,
    rules
  });
});

// =========================================================================
// GROUP D: 글로벌 반도체(SOXX) & 유가(WTI) & VIX 선행 전략 (40개: M121 ~ M160)
// =========================================================================
const groupDCrossConfigs = [
  // D1: 미국 필라델피아 반도체(SOXX) 선행 추세 추종 (15개)
  { core: 45, soxxSma: 60, sellPct: 75, buyPct: 80, cool: 5, desc: "미국 반도체(SOXX) > SMA(60) 돌파 시 코스피 매수 / 하향이탈 시 75% 현금화" },
  { core: 50, soxxSma: 60, sellPct: 80, buyPct: 85, cool: 5, desc: "SOXX 60일선 상향 시 코스피 85% 집중 / 하향 시 80% 현금 대피" },
  { core: 40, soxxSma: 120, sellPct: 75, buyPct: 75, cool: 7, desc: "SOXX 120일 중기선 기준 반도체 사이클 스위칭" },
  { core: 55, soxxSma: 60, sellPct: 70, buyPct: 80, cool: 5, desc: "성장 55:45 + SOXX 60일선 선행 매수" },
  { core: 35, soxxSma: 60, sellPct: 85, buyPct: 75, cool: 5, desc: "초방어 35:65 + SOXX 60일선 쉴드" },
  { core: 50, soxxSma: 20, sellPct: 60, buyPct: 65, cool: 4, desc: "SOXX 20일선 단기 스나이퍼" },
  { core: 60, soxxSma: 60, sellPct: 80, buyPct: 85, cool: 6, desc: "고성장 60:40 + SOXX 60일선" },
  { core: 45, soxxSma: 90, sellPct: 75, buyPct: 75, cool: 6, desc: "SOXX 90일 분기선 스위칭" },
  { core: 50, soxxRoc: 20, rocVal: 5.0, sellPct: 70, buyPct: 75, cool: 5, desc: "SOXX 20일 모멘텀 +5% 돌파 매수 / -5% 이탈 매도" },
  { core: 45, soxxRoc: 40, rocVal: 8.0, sellPct: 75, buyPct: 80, cool: 6, desc: "SOXX 40일 ROC +8% 반도체 붐 탑승" },
  { core: 40, soxxRoc: 20, rocVal: 4.0, sellPct: 70, buyPct: 70, cool: 5, desc: "SOXX 20일 ROC 4% 방어형" },
  { core: 55, soxxRoc: 60, rocVal: 10.0, sellPct: 80, buyPct: 85, cool: 7, desc: "SOXX 60일 ROC 10% 대형 사이클" },
  { core: 50, soxxSma: 200, sellPct: 85, buyPct: 80, cool: 8, desc: "SOXX 200일선 장기 추세 필터" },
  { core: 35, soxxRoc: 20, rocVal: 5.0, sellPct: 80, buyPct: 75, cool: 5, desc: "보수 35:65 SOXX 모멘텀" },
  { core: 50, soxxSma: 60, sellPct: 100, buyPct: 80, cool: 6, desc: "SOXX 60일선 하향 시 전량(100%) 현금화" },

  // D2: WTI 국제유가 인플레/공급망 쇼크 방어 (12개)
  { core: 45, wtiVal: 85, sellPct: 70, buyPct: 70, cool: 6, desc: "WTI 유가 > $85 돌파 시 무역적자/인플레 대비 70% 현금화 / $70 이하 안정 시 매수" },
  { core: 50, wtiVal: 90, sellPct: 80, buyPct: 75, cool: 7, desc: "WTI 유가 > $90 고유가 충격 80% 현금 대피" },
  { core: 40, wtiVal: 80, sellPct: 75, buyPct: 75, cool: 6, desc: "WTI 유가 > $80 선제적 유가 쇼크 차단" },
  { core: 55, wtiVal: 95, sellPct: 80, buyPct: 80, cool: 7, desc: "WTI 유가 > $95 극단 유가쇼크 방어" },
  { core: 35, wtiVal: 85, sellPct: 80, buyPct: 75, cool: 6, desc: "초방어 35:65 + 유가 85달러 방어" },
  { core: 50, wtiRoc: 60, rocVal: 25.0, sellPct: 75, buyPct: 75, cool: 7, desc: "WTI 60일 급등률 > 25% 오일쇼크 대피" },
  { core: 45, wtiRoc: 40, rocVal: 20.0, sellPct: 70, buyPct: 70, cool: 6, desc: "WTI 40일 ROC > 20% 긴급 매도" },
  { core: 60, wtiVal: 90, sellPct: 85, buyPct: 80, cool: 7, desc: "고성장 60:40 + 유가 90달러 방어" },
  { core: 40, wtiRoc: 20, rocVal: 15.0, sellPct: 70, buyPct: 70, cool: 5, desc: "WTI 20일 급등 15% 단기 오일쇼크 차단" },
  { core: 50, wtiVal: 85, wtiRoc: 60, sellPct: 80, buyPct: 80, cool: 7, desc: "유가 85불 & ROC 20% 동시 충격 방어" },
  { core: 45, wtiVal: 88, sellPct: 75, buyPct: 75, cool: 6, desc: "유가 88달러 중립 방어" },
  { core: 50, wtiRoc: 60, rocVal: 30.0, sellPct: 85, buyPct: 80, cool: 7, desc: "WTI 60일 30% 폭등 슈퍼쇼크 대피" },

  // D3: VIX 공포 스파이크 역발상 & 평온기 복원 (13개)
  { core: 45, vixPanic: 32, vixCalm: 16, sellPct: 60, buyPct: 75, cool: 5, desc: "VIX >= 32 패닉 투매 발생 시 저가 분할매수 75% / VIX <= 16 탐욕 시 차익실현" },
  { core: 50, vixPanic: 35, vixCalm: 15, sellPct: 65, buyPct: 80, cool: 5, desc: "VIX >= 35 극단적 공포 시 코스피 80% 저점 매집" },
  { core: 40, vixPanic: 30, vixCalm: 17, sellPct: 60, buyPct: 70, cool: 4, desc: "VIX >= 30 공포 매수 / 17 이하 매도" },
  { core: 55, vixPanic: 38, vixCalm: 14, sellPct: 70, buyPct: 85, cool: 6, desc: "VIX >= 38 역사적 위기 바닥 풀매수 85%" },
  { core: 35, vixPanic: 33, vixCalm: 15, sellPct: 60, buyPct: 75, cool: 5, desc: "초방어 35:65 + VIX 역발상" },
  { core: 50, vixPanic: 34, vixCalm: 16, sellPct: 65, buyPct: 75, cool: 5, desc: "표준 50:50 VIX 콘트라리언" },
  { core: 45, vixPanic: 28, vixCalm: 18, sellPct: 55, buyPct: 65, cool: 4, desc: "VIX 28/18 민감 스윙" },
  { core: 60, vixPanic: 35, vixCalm: 15, sellPct: 70, buyPct: 80, cool: 5, desc: "성장 60:40 + VIX 35 패닉 저가매수" },
  { core: 40, vixPanic: 40, vixCalm: 14, sellPct: 75, buyPct: 85, cool: 7, desc: "VIX 40 세기적 폭락장 스나이퍼" },
  { core: 50, soxxSma: 60, vixCalm: 20, sellPct: 75, buyPct: 80, cool: 6, desc: "SOXX 60일선 돌파 AND VIX < 20 평온기 코스피 집중" },
  { core: 45, soxxSma: 60, wtiVal: 85, sellPct: 80, buyPct: 80, cool: 6, desc: "SOXX 반도체 상승 AND 저유가 안정기 매수" },
  { core: 40, vixPanic: 32, soxxRoc: 20, sellPct: 70, buyPct: 75, cool: 5, desc: "VIX 32 공포 + 반도체 반등 쌍끌이 매수" },
  { core: 50, soxxSma: 60, wtiVal: 90, sellPct: 80, buyPct: 80, cool: 6, desc: "SOXX 60일선 + WTI 90불 크로스 자산 필터" },
];

groupDCrossConfigs.forEach((cfg, idx) => {
  const num = String(121 + idx).padStart(3, "0");
  const stratId = `M${num}`;
  const rules = [];

  if (cfg.soxxSma && !cfg.vixCalm && !cfg.wtiVal) {
    rules.push({
      id: `${stratId}_R1`,
      name: `SOXX < SMA(${cfg.soxxSma}) 반도체 이탈 매도`,
      enabled: true,
      logic: "AND",
      cooldownDays: cfg.cool,
      conditions: [{
        left: { ticker: "SOXX", transform: "PRICE" },
        operator: "<",
        rightMode: "INDICATOR",
        rightIndicator: { ticker: "SOXX", transform: "SMA", p1: cfg.soxxSma }
      }],
      action: { targetTicker: "KPI200", type: "SELL", sizingMode: "BALANCE_PCT", sizingValue: cfg.sellPct }
    });
    rules.push({
      id: `${stratId}_R2`,
      name: `SOXX >= SMA(${cfg.soxxSma}) 반도체 확장 매수`,
      enabled: true,
      logic: "AND",
      cooldownDays: cfg.cool,
      conditions: [{
        left: { ticker: "SOXX", transform: "PRICE" },
        operator: ">=",
        rightMode: "INDICATOR",
        rightIndicator: { ticker: "SOXX", transform: "SMA", p1: cfg.soxxSma }
      }],
      action: { targetTicker: "KPI200", type: "BUY", sizingMode: "BALANCE_PCT", sizingValue: cfg.buyPct }
    });
  } else if (cfg.soxxRoc && !cfg.vixPanic) {
    rules.push({
      id: `${stratId}_R1`,
      name: `SOXX ROC(${cfg.soxxRoc}) <= -${cfg.rocVal}% 매도`,
      enabled: true,
      logic: "AND",
      cooldownDays: cfg.cool,
      conditions: [{
        left: { ticker: "SOXX", transform: "ROC", p1: cfg.soxxRoc },
        operator: "<=",
        rightMode: "VALUE",
        rightValue: -cfg.rocVal
      }],
      action: { targetTicker: "KPI200", type: "SELL", sizingMode: "BALANCE_PCT", sizingValue: cfg.sellPct }
    });
    rules.push({
      id: `${stratId}_R2`,
      name: `SOXX ROC(${cfg.soxxRoc}) >= +${cfg.rocVal}% 매수`,
      enabled: true,
      logic: "AND",
      cooldownDays: cfg.cool,
      conditions: [{
        left: { ticker: "SOXX", transform: "ROC", p1: cfg.soxxRoc },
        operator: ">=",
        rightMode: "VALUE",
        rightValue: cfg.rocVal
      }],
      action: { targetTicker: "KPI200", type: "BUY", sizingMode: "BALANCE_PCT", sizingValue: cfg.buyPct }
    });
  } else if (cfg.wtiVal && !cfg.wtiRoc && !cfg.soxxSma) {
    rules.push({
      id: `${stratId}_R1`,
      name: `WTI > $${cfg.wtiVal} 고유가 쇼크 매도`,
      enabled: true,
      logic: "AND",
      cooldownDays: cfg.cool,
      conditions: [{
        left: { ticker: "WTI", transform: "PRICE" },
        operator: ">=",
        rightMode: "VALUE",
        rightValue: cfg.wtiVal
      }],
      action: { targetTicker: "KPI200", type: "SELL", sizingMode: "BALANCE_PCT", sizingValue: cfg.sellPct }
    });
    rules.push({
      id: `${stratId}_R2`,
      name: `WTI <= $72 유가 안정 매수`,
      enabled: true,
      logic: "AND",
      cooldownDays: cfg.cool,
      conditions: [{
        left: { ticker: "WTI", transform: "PRICE" },
        operator: "<=",
        rightMode: "VALUE",
        rightValue: 72.0
      }],
      action: { targetTicker: "KPI200", type: "BUY", sizingMode: "BALANCE_PCT", sizingValue: cfg.buyPct }
    });
  } else if (cfg.wtiRoc && !cfg.wtiVal) {
    rules.push({
      id: `${stratId}_R1`,
      name: `WTI ROC(${cfg.wtiRoc}) >= ${cfg.rocVal}% 유가급등 매도`,
      enabled: true,
      logic: "AND",
      cooldownDays: cfg.cool,
      conditions: [{
        left: { ticker: "WTI", transform: "ROC", p1: cfg.wtiRoc },
        operator: ">=",
        rightMode: "VALUE",
        rightValue: cfg.rocVal
      }],
      action: { targetTicker: "KPI200", type: "SELL", sizingMode: "BALANCE_PCT", sizingValue: cfg.sellPct }
    });
    rules.push({
      id: `${stratId}_R2`,
      name: `WTI ROC <= -10% 유가안정 매수`,
      enabled: true,
      logic: "AND",
      cooldownDays: cfg.cool,
      conditions: [{
        left: { ticker: "WTI", transform: "ROC", p1: cfg.wtiRoc },
        operator: "<=",
        rightMode: "VALUE",
        rightValue: -10.0
      }],
      action: { targetTicker: "KPI200", type: "BUY", sizingMode: "BALANCE_PCT", sizingValue: cfg.buyPct }
    });
  } else if (cfg.vixPanic && !cfg.soxxRoc) {
    rules.push({
      id: `${stratId}_R1`,
      name: `VIX >= ${cfg.vixPanic} 공포 투매 저가 매수`,
      enabled: true,
      logic: "AND",
      cooldownDays: cfg.cool,
      conditions: [{
        left: { ticker: "VIX", transform: "PRICE" },
        operator: ">=",
        rightMode: "VALUE",
        rightValue: cfg.vixPanic
      }],
      action: { targetTicker: "KPI200", type: "BUY", sizingMode: "BALANCE_PCT", sizingValue: cfg.buyPct }
    });
    rules.push({
      id: `${stratId}_R2`,
      name: `VIX <= ${cfg.vixCalm} 탐욕 구간 차익실현`,
      enabled: true,
      logic: "AND",
      cooldownDays: cfg.cool,
      conditions: [{
        left: { ticker: "VIX", transform: "PRICE" },
        operator: "<=",
        rightMode: "VALUE",
        rightValue: cfg.vixCalm
      }],
      action: { targetTicker: "KPI200", type: "SELL", sizingMode: "BALANCE_PCT", sizingValue: cfg.sellPct }
    });
  } else {
    // Composite
    rules.push({
      id: `${stratId}_R1`,
      name: `SOXX > SMA(60) AND VIX < 20 골디락스 매수`,
      enabled: true,
      logic: "AND",
      cooldownDays: cfg.cool,
      conditions: [
        {
          left: { ticker: "SOXX", transform: "PRICE" },
          operator: ">=",
          rightMode: "INDICATOR",
          rightIndicator: { ticker: "SOXX", transform: "SMA", p1: 60 }
        },
        {
          left: { ticker: "VIX", transform: "PRICE" },
          operator: "<=",
          rightMode: "VALUE",
          rightValue: 20.0
        }
      ],
      action: { targetTicker: "KPI200", type: "BUY", sizingMode: "BALANCE_PCT", sizingValue: cfg.buyPct }
    });
    rules.push({
      id: `${stratId}_R2`,
      name: `SOXX < SMA(60) OR VIX >= 30 위험 대피`,
      enabled: true,
      logic: "OR",
      cooldownDays: cfg.cool,
      conditions: [
        {
          left: { ticker: "SOXX", transform: "PRICE" },
          operator: "<",
          rightMode: "INDICATOR",
          rightIndicator: { ticker: "SOXX", transform: "SMA", p1: 60 }
        },
        {
          left: { ticker: "VIX", transform: "PRICE" },
          operator: ">=",
          rightMode: "VALUE",
          rightValue: 30.0
        }
      ],
      action: { targetTicker: "KPI200", type: "SELL", sizingMode: "BALANCE_PCT", sizingValue: cfg.sellPct }
    });
  }

  strategies.push({
    id: stratId,
    name: `[${stratId}] 글로벌 선행 크로스자산 전술 (${cfg.desc})`,
    category: "Group D: 미국 반도체(SOXX) · 유가 · VIX 선행",
    rationale: cfg.desc,
    allocations: kAlloc(cfg.core),
    rebalanceEnabled: true,
    rebalance: reb("QUARTERLY", "ABS_PP", 6),
    rulesEnabled: true,
    rules
  });
});

// =========================================================================
// GROUP E: 다중 매크로 앙상블 & 위기 복합 감지 전략 (40개: M161 ~ M200)
// =========================================================================
const groupEEnsembleConfigs = [
  // E1: 3중 위기 카나리아 (환율 급등 OR 금리차 스티프닝 OR VIX 폭등) 방어 (15개)
  { core: 45, usdkrwP: 60, steepVal: 0.0, vixPanic: 32, sellPct: 75, buyPct: 75, cool: 6, desc: "환율 60일선 돌파 OR T10Y2Y 스티프닝 OR VIX 32 폭등 시 3중 위기 감지 75% 현금화" },
  { core: 50, usdkrwP: 60, steepVal: 0.1, vixPanic: 35, sellPct: 80, buyPct: 80, cool: 6, desc: "3중 위기 카나리아 80% 현금 대피" },
  { core: 40, usdkrwP: 120, steepVal: 0.0, vixPanic: 30, sellPct: 85, buyPct: 80, cool: 7, desc: "방어 40:60 + 3중 위기 감지 85% 현금화" },
  { core: 55, usdkrwP: 60, steepVal: 0.0, vixPanic: 35, sellPct: 75, buyPct: 80, cool: 6, desc: "성장 55:45 + 3중 위기 감지" },
  { core: 35, usdkrwP: 60, steepVal: 0.0, vixPanic: 30, sellPct: 90, buyPct: 75, cool: 7, desc: "초방어 35:65 + 3중 위기 90% 현금 대피" },
  { core: 50, usdkrwP: 60, steepVal: 0.2, vixPanic: 34, sellPct: 80, buyPct: 80, cool: 6, desc: "3중 위기 표준 80% 스위칭" },
  { core: 45, usdkrwP: 90, steepVal: 0.05, vixPanic: 33, sellPct: 75, buyPct: 75, cool: 6, desc: "3중 위기 밸런스 75%" },
  { core: 60, usdkrwP: 60, steepVal: 0.0, vixPanic: 36, sellPct: 85, buyPct: 85, cool: 6, desc: "고성장 60:40 + 3중 위기 85% 대피" },
  { core: 50, usdkrwP: 60, steepVal: 0.0, vixPanic: 40, sellPct: 100, buyPct: 80, cool: 7, desc: "3중 위기 발생 시 전량(100%) 현금 대피" },
  { core: 40, usdkrwP: 60, steepVal: 0.15, vixPanic: 32, sellPct: 80, buyPct: 75, cool: 6, desc: "저낙폭 40:60 3중 위기" },
  { core: 45, usdkrwP: 30, steepVal: 0.0, vixPanic: 28, sellPct: 70, buyPct: 70, cool: 5, desc: "3중 위기 민감형 포착" },
  { core: 50, usdkrwP: 60, steepVal: 0.0, vixPanic: 30, sellPct: 75, buyPct: 75, cool: 6, desc: "3중 위기 표준형" },
  { core: 35, usdkrwP: 120, steepVal: 0.0, vixPanic: 35, sellPct: 85, buyPct: 75, cool: 7, desc: "초방어 장기 3중 위기" },
  { core: 55, usdkrwP: 60, steepVal: 0.1, vixPanic: 33, sellPct: 75, buyPct: 80, cool: 6, desc: "성장 55:45 3중 위기" },
  { core: 50, usdkrwP: 60, steepVal: 0.05, vixPanic: 35, sellPct: 80, buyPct: 80, cool: 6, desc: "골드스탠다드 3중 위기" },

  // E2: 4중 골디락스 앙상블 (CLI 100+ & 환율 안정 & SOXX 상승 & 금리 안정) (15개)
  { core: 45, cliP: 100, soxxSma: 60, usdkrwSma: 60, sellPct: 80, buyPct: 85, cool: 8, desc: "CLI > 100 AND SOXX > 60일선 AND 환율 < 60일선 골디락스 3중 일치 시 코스피 85% 풀매집" },
  { core: 50, cliP: 100, soxxSma: 60, usdkrwSma: 60, sellPct: 85, buyPct: 90, cool: 8, desc: "골디락스 3중 확인 코스피 90% 집중 / 악화 시 85% 대피" },
  { core: 40, cliP: 100, soxxSma: 120, usdkrwSma: 120, sellPct: 80, buyPct: 80, cool: 10, desc: "방어 40:60 중기 골디락스 엔진" },
  { core: 55, cliP: 100, soxxSma: 60, usdkrwSma: 60, sellPct: 80, buyPct: 85, cool: 8, desc: "성장 55:45 골디락스 85% 집중" },
  { core: 35, cliP: 100, soxxSma: 60, usdkrwSma: 60, sellPct: 90, buyPct: 80, cool: 10, desc: "초방어 35:65 골디락스 90% 대피" },
  { core: 50, cliP: 100.2, soxxSma: 60, usdkrwSma: 60, sellPct: 80, buyPct: 85, cool: 8, desc: "엄격한 골디락스 85% 스위칭" },
  { core: 60, cliP: 100, soxxSma: 60, usdkrwSma: 60, sellPct: 85, buyPct: 95, cool: 8, desc: "고성장 60:40 골디락스 95% 풀베팅" },
  { core: 45, cliP: 99.8, soxxSma: 60, usdkrwSma: 60, sellPct: 75, buyPct: 80, cool: 7, desc: "민감 골디락스 스위칭" },
  { core: 50, cliP: 100, soxxSma: 200, usdkrwSma: 120, sellPct: 85, buyPct: 85, cool: 10, desc: "장기 추세 골디락스 엔진" },
  { core: 40, cliP: 100, soxxSma: 60, usdkrwSma: 60, sellPct: 75, buyPct: 75, cool: 8, desc: "밸런스 40:60 골디락스" },
  { core: 50, cliP: 100, soxxSma: 90, usdkrwSma: 90, sellPct: 80, buyPct: 80, cool: 9, desc: "분기 골디락스 80%" },
  { core: 55, cliP: 100.5, soxxSma: 60, usdkrwSma: 60, sellPct: 80, buyPct: 85, cool: 8, desc: "확실한 골디락스 확장" },
  { core: 35, cliP: 100, soxxSma: 60, usdkrwSma: 60, sellPct: 85, buyPct: 75, cool: 8, desc: "보수 35:65 골디락스" },
  { core: 45, cliP: 100, soxxSma: 40, usdkrwSma: 40, sellPct: 75, buyPct: 80, cool: 6, desc: "단중기 골디락스 스위퍼" },
  { core: 50, cliP: 100, soxxSma: 60, usdkrwSma: 60, sellPct: 100, buyPct: 85, cool: 8, desc: "골디락스 이탈 시 전량(100%) 현금 대피" },

  // E3: 거시-기술적 듀얼 하이브리드 (매크로 쉴드 + 코스피 60일 수급선) (10개)
  { core: 45, usdkrwP: 60, kpiP: 60, sellPct: 80, buyPct: 80, cool: 6, desc: "환율 60일선 아래 AND 코스피 60일선 위 듀얼 상승 시 매수 / 환율 급등 시 매도" },
  { core: 50, steepVal: 0.0, kpiP: 60, sellPct: 80, buyPct: 80, cool: 6, desc: "T10Y2Y 정상화 침체 경보 OR 코스피 60일선 데드크로스 동반 매도" },
  { core: 40, cliP: 100, kpiP: 120, sellPct: 85, buyPct: 80, cool: 8, desc: "CLI 100 + 코스피 120일 경기선 듀얼 방어" },
  { core: 55, soxxSma: 60, kpiP: 60, sellPct: 75, buyPct: 85, cool: 6, desc: "미국 반도체 60일선 + 코스피 60일선 듀얼 모멘텀" },
  { core: 35, usdkrwP: 60, kpiP: 60, sellPct: 85, buyPct: 75, cool: 6, desc: "초방어 35:65 환율-수급선 듀얼 쉴드" },
  { core: 50, usdkrwP: 60, soxxSma: 60, kpiP: 60, sellPct: 85, buyPct: 85, cool: 7, desc: "트리플 하이브리드 (환율 + 반도체 + 코스피 60일선)" },
  { core: 45, steepVal: 0.1, soxxSma: 60, kpiP: 60, sellPct: 80, buyPct: 80, cool: 7, desc: "금리차 + 반도체 + 코스피 60일선 앙상블" },
  { core: 60, soxxSma: 60, kpiP: 60, sellPct: 85, buyPct: 90, cool: 6, desc: "고성장 60:40 듀얼 모멘텀 90% 매수" },
  { core: 40, cliP: 100, usdkrwP: 60, kpiP: 60, sellPct: 85, buyPct: 80, cool: 8, desc: "CLI + 환율 + 수급선 4중 앙상블" },
  { core: 50, cliP: 100, soxxSma: 60, steepVal: 0.0, sellPct: 90, buyPct: 85, cool: 8, desc: "궁극의 매크로 앙상블 챔피언 (CLI+SOXX+일드커브)" },
];

groupEEnsembleConfigs.forEach((cfg, idx) => {
  const num = String(161 + idx).padStart(3, "0");
  const stratId = `M${num}`;
  const rules = [];

  if (cfg.usdkrwP && cfg.steepVal !== undefined && cfg.vixPanic) {
    // 3-way crisis canary
    rules.push({
      id: `${stratId}_R1`,
      name: `환율 > SMA(${cfg.usdkrwP}) OR T10Y2Y >= ${cfg.steepVal} OR VIX >= ${cfg.vixPanic} 매도`,
      enabled: true,
      logic: "OR",
      cooldownDays: cfg.cool,
      conditions: [
        {
          left: { ticker: "USDKRW", transform: "PRICE" },
          operator: ">=",
          rightMode: "INDICATOR",
          rightIndicator: { ticker: "USDKRW", transform: "SMA", p1: cfg.usdkrwP }
        },
        {
          left: { ticker: "T10Y2Y", transform: "PRICE" },
          operator: ">=",
          rightMode: "VALUE",
          rightValue: cfg.steepVal
        },
        {
          left: { ticker: "VIX", transform: "PRICE" },
          operator: ">=",
          rightMode: "VALUE",
          rightValue: cfg.vixPanic
        }
      ],
      action: { targetTicker: "KPI200", type: "SELL", sizingMode: "BALANCE_PCT", sizingValue: cfg.sellPct }
    });
    rules.push({
      id: `${stratId}_R2`,
      name: `환율 < SMA(${cfg.usdkrwP}) AND VIX < 20 위기 종료 매수`,
      enabled: true,
      logic: "AND",
      cooldownDays: cfg.cool,
      conditions: [
        {
          left: { ticker: "USDKRW", transform: "PRICE" },
          operator: "<",
          rightMode: "INDICATOR",
          rightIndicator: { ticker: "USDKRW", transform: "SMA", p1: cfg.usdkrwP }
        },
        {
          left: { ticker: "VIX", transform: "PRICE" },
          operator: "<=",
          rightMode: "VALUE",
          rightValue: 20.0
        }
      ],
      action: { targetTicker: "KPI200", type: "BUY", sizingMode: "BALANCE_PCT", sizingValue: cfg.buyPct }
    });
  } else if (cfg.cliP && cfg.soxxSma && cfg.usdkrwSma && !cfg.kpiP) {
    // Goldilocks
    rules.push({
      id: `${stratId}_R1`,
      name: `CLI >= ${cfg.cliP} AND SOXX > SMA AND 환율 < SMA 골디락스 매수`,
      enabled: true,
      logic: "AND",
      cooldownDays: cfg.cool,
      conditions: [
        {
          left: { ticker: "KOR_CLI", transform: "PRICE" },
          operator: ">=",
          rightMode: "VALUE",
          rightValue: cfg.cliP
        },
        {
          left: { ticker: "SOXX", transform: "PRICE" },
          operator: ">=",
          rightMode: "INDICATOR",
          rightIndicator: { ticker: "SOXX", transform: "SMA", p1: cfg.soxxSma }
        },
        {
          left: { ticker: "USDKRW", transform: "PRICE" },
          operator: "<=",
          rightMode: "INDICATOR",
          rightIndicator: { ticker: "USDKRW", transform: "SMA", p1: cfg.usdkrwSma }
        }
      ],
      action: { targetTicker: "KPI200", type: "BUY", sizingMode: "BALANCE_PCT", sizingValue: cfg.buyPct }
    });
    rules.push({
      id: `${stratId}_R2`,
      name: `CLI < 100 OR 환율 > SMA 악화 시 매도`,
      enabled: true,
      logic: "OR",
      cooldownDays: cfg.cool,
      conditions: [
        {
          left: { ticker: "KOR_CLI", transform: "PRICE" },
          operator: "<",
          rightMode: "VALUE",
          rightValue: 100.0
        },
        {
          left: { ticker: "USDKRW", transform: "PRICE" },
          operator: ">",
          rightMode: "INDICATOR",
          rightIndicator: { ticker: "USDKRW", transform: "SMA", p1: cfg.usdkrwSma }
        }
      ],
      action: { targetTicker: "KPI200", type: "SELL", sizingMode: "BALANCE_PCT", sizingValue: cfg.sellPct }
    });
  } else {
    // Dual / Triple Hybrid
    rules.push({
      id: `${stratId}_R1`,
      name: `환율 > SMA OR 코스피 < SMA 매도`,
      enabled: true,
      logic: "OR",
      cooldownDays: cfg.cool,
      conditions: [
        {
          left: { ticker: "USDKRW", transform: "PRICE" },
          operator: ">=",
          rightMode: "INDICATOR",
          rightIndicator: { ticker: "USDKRW", transform: "SMA", p1: cfg.usdkrwP || 60 }
        },
        {
          left: { ticker: "KPI200", transform: "PRICE" },
          operator: "<",
          rightMode: "INDICATOR",
          rightIndicator: { ticker: "KPI200", transform: "SMA", p1: cfg.kpiP || 60 }
        }
      ],
      action: { targetTicker: "KPI200", type: "SELL", sizingMode: "BALANCE_PCT", sizingValue: cfg.sellPct }
    });
    rules.push({
      id: `${stratId}_R2`,
      name: `환율 < SMA AND 코스피 >= SMA 매수`,
      enabled: true,
      logic: "AND",
      cooldownDays: cfg.cool,
      conditions: [
        {
          left: { ticker: "USDKRW", transform: "PRICE" },
          operator: "<",
          rightMode: "INDICATOR",
          rightIndicator: { ticker: "USDKRW", transform: "SMA", p1: cfg.usdkrwP || 60 }
        },
        {
          left: { ticker: "KPI200", transform: "PRICE" },
          operator: ">=",
          rightMode: "INDICATOR",
          rightIndicator: { ticker: "KPI200", transform: "SMA", p1: cfg.kpiP || 60 }
        }
      ],
      action: { targetTicker: "KPI200", type: "BUY", sizingMode: "BALANCE_PCT", sizingValue: cfg.buyPct }
    });
  }

  strategies.push({
    id: stratId,
    name: `[${stratId}] 다중 매크로 앙상블 (${cfg.desc})`,
    category: "Group E: 다중 매크로 앙상블 & 위기 복합 감지",
    rationale: cfg.desc,
    allocations: kAlloc(cfg.core),
    rebalanceEnabled: true,
    rebalance: reb("QUARTERLY", "ABS_PP", 6),
    rulesEnabled: true,
    rules
  });
});

console.log(`Generated total ${strategies.length} macro strategies.`);

const outPath = path.join(__dirname, "strategies_kospi_macro_200.js");
const content = `/**
 * tests/strategy_eval/strategies_kospi_macro_200.js
 *
 * 200 Macro-Driven KOSPI 200 + Cash Strategies (M001 ~ M200)
 * Evaluated on Previous-Day Close (T-1) -> Executed on Next-Day Close (T)
 * Covers:
 *  - Group A (M001 ~ M040): 원달러 환율(USDKRW) 거시 전술
 *  - Group B (M041 ~ M080): 미국 국채금리 & 장단기 금리차(T10Y2Y / US10Y / US2Y)
 *  - Group C (M081 ~ M120): 한국 OECD 경기순환변동치(KOR_CLI) 경기사이클
 *  - Group D (M121 ~ M160): 글로벌 반도체(SOXX) · 유가 · VIX 선행
 *  - Group E (M161 ~ M200): 다중 매크로 앙상블 & 위기 복합 감지
 */

function kAlloc(kpiPct) {
  return [{ ticker: "KPI200", weightPct: kpiPct }];
}

function reb(periodMode, bandMode = "NONE", bandThreshold = 8, customDays = 60) {
  return { periodMode, bandMode, bandThreshold, customDays };
}

const STRATEGIES_KOSPI_MACRO_200 = ${JSON.stringify(strategies, null, 2)};

if (typeof module !== "undefined" && module.exports) {
  module.exports = { STRATEGIES_KOSPI_MACRO_200, kAlloc, reb };
}
`;

fs.writeFileSync(outPath, content, "utf8");
console.log(`Successfully written to: ${outPath}`);
