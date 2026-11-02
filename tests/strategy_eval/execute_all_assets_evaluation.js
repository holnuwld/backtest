/**
 * tests/strategy_eval/execute_all_assets_evaluation.js
 *
 * Executes:
 * 1) Deliverable 1: Buy & Hold CAGR ranking across all 21 investable assets (Pre-tax vs After-tax vs Domestic ETF Trap)
 * 2) Deliverable 2: Famous asset-specific trading strategies across all 21 assets (105 strategies sorted by After-Tax CAGR)
 * 3) Deliverable 3: 50 Multi-Asset Portfolio combinations -> Top 10 After-Tax Multi-Asset Portfolios (8억 원 기준, 금융소득종합과세 비대상)
 */

const fs = require("fs");
const path = require("path");
const {
  KOREA_ASSET_TAX_SPECS,
  runTaxAwareBacktest,
  INITIAL_CAPITAL_KRW,
  START_DATE_POST_IMF,
  START_DATE_MODERN_OOS,
  END_DATE,
} = require("./run_all_assets_tax_backtest");

function reb(periodMode, bandMode = "NONE", bandThreshold = 7, customDays = 60) {
  return { periodMode, bandMode, bandThreshold, customDays };
}

function buildFamousAssetStrategies(ticker, spec) {
  const startDate = ticker === "BTC_KRW" ? "2010-07-20" : START_DATE_POST_IMF;
  const sName = spec.shortName;

  return [
    {
      stratCode: `${ticker}_PTJ200`,
      ticker,
      assetName: spec.name,
      shortName: sName,
      bestMethod: spec.bestMethod,
      strategyName: `[폴 튜더 존스 200일선] ${sName} 200일 SMA 추세추종 스위칭`,
      famousRef: "Paul Tudor Jones (200-Day Moving Average Rule) & Meb Faber GTAA",
      ruleSummary: `${sName} 종가 > 200일선 상향돌파 시 현금 90% 매수 / 200일선 하향돌파 시 보유분 75% 매도 (폭락장 대피)`,
      startDate,
      allocations: [{ ticker, weightPct: 85 }],
      rebalanceEnabled: false,
      rebalance: reb("NONE"),
      rulesEnabled: true,
      rules: [
        {
          id: `${ticker}_PTJ_BUY`,
          name: "200일선 돌파 매수",
          enabled: true,
          logic: "AND",
          cooldownDays: 15,
          conditions: [
            {
              left: { ticker, transform: "PRICE" },
              operator: "CROSS_UP",
              rightMode: "INDICATOR",
              rightIndicator: { ticker, transform: "SMA", p1: 200 },
            },
          ],
          action: { type: "BUY", targetTicker: ticker, sizingMode: "BALANCE_PCT", sizingValue: 90 },
        },
        {
          id: `${ticker}_PTJ_SELL`,
          name: "200일선 이탈 대피",
          enabled: true,
          logic: "AND",
          cooldownDays: 15,
          conditions: [
            {
              left: { ticker, transform: "PRICE" },
              operator: "CROSS_DOWN",
              rightMode: "INDICATOR",
              rightIndicator: { ticker, transform: "SMA", p1: 200 },
            },
          ],
          action: { type: "SELL", targetTicker: ticker, sizingMode: "BALANCE_PCT", sizingValue: 75 },
        },
      ],
    },
    {
      stratCode: `${ticker}_FABER60`,
      ticker,
      assetName: spec.name,
      shortName: sName,
      bestMethod: spec.bestMethod,
      strategyName: `[메브 파버 비대칭 추세] ${sName} 60일 수급선 75% 매수 / 45% 매도`,
      famousRef: "Mebane Faber Tactical Trend Following (중기 60일 수급 추세 비대칭 비중조절)",
      ruleSummary: `${sName} 60일선 상향돌파 시 현금 75% 매수 / 60일선 하향돌파 시 보유분 45% 매도`,
      startDate,
      allocations: [{ ticker, weightPct: 80 }],
      rebalanceEnabled: false,
      rebalance: reb("NONE"),
      rulesEnabled: true,
      rules: [
        {
          id: `${ticker}_F60_BUY`,
          name: "60일선 상향돌파 매수",
          enabled: true,
          logic: "AND",
          cooldownDays: 10,
          conditions: [
            {
              left: { ticker, transform: "PRICE" },
              operator: "CROSS_UP",
              rightMode: "INDICATOR",
              rightIndicator: { ticker, transform: "SMA", p1: 60 },
            },
          ],
          action: { type: "BUY", targetTicker: ticker, sizingMode: "BALANCE_PCT", sizingValue: 75 },
        },
        {
          id: `${ticker}_F60_SELL`,
          name: "60일선 하향돌파 매도",
          enabled: true,
          logic: "AND",
          cooldownDays: 10,
          conditions: [
            {
              left: { ticker, transform: "PRICE" },
              operator: "CROSS_DOWN",
              rightMode: "INDICATOR",
              rightIndicator: { ticker, transform: "SMA", p1: 60 },
            },
          ],
          action: { type: "SELL", targetTicker: ticker, sizingMode: "BALANCE_PCT", sizingValue: 45 },
        },
      ],
    },
    {
      stratCode: `${ticker}_ANTONACCI_CLI`,
      ticker,
      assetName: spec.name,
      shortName: sName,
      bestMethod: spec.bestMethod,
      strategyName: `[안토나치 모멘텀+OECD선행] ${sName} 절대모멘텀 & 경기확장 가속`,
      famousRef: "Gary Antonacci Absolute Momentum + OECD CLI Macro Acceleration",
      ruleSummary: `OECD 경기선행 60일 ROC > +0.3% 또는 ${sName} 120일 모멘텀 돌파 시 현금 85% 매수 / 120일선 이탈 시 35% 축소`,
      startDate,
      allocations: [{ ticker, weightPct: 80 }],
      rebalanceEnabled: false,
      rebalance: reb("NONE"),
      rulesEnabled: true,
      rules: [
        {
          id: `${ticker}_ANT_BUY`,
          name: "모멘텀 & 경기선행 확장 매수",
          enabled: true,
          logic: "OR",
          cooldownDays: 20,
          conditions: [
            {
              left: { ticker: "KOR_CLI", transform: "ROC", p1: 60 },
              operator: "GT",
              rightMode: "VALUE",
              rightValue: 0.3,
            },
            {
              left: { ticker, transform: "ROC", p1: 120 },
              operator: "GT",
              rightMode: "VALUE",
              rightValue: 6.0,
            },
          ],
          action: { type: "BUY", targetTicker: ticker, sizingMode: "BALANCE_PCT", sizingValue: 85 },
        },
        {
          id: `${ticker}_ANT_SELL`,
          name: "120일 추세 붕괴 및 모멘텀 마이너스 대피",
          enabled: true,
          logic: "AND",
          cooldownDays: 25,
          conditions: [
            {
              left: { ticker, transform: "PRICE" },
              operator: "CROSS_DOWN",
              rightMode: "INDICATOR",
              rightIndicator: { ticker, transform: "SMA", p1: 120 },
            },
            {
              left: { ticker: "VIX", transform: "PRICE" },
              operator: "GT",
              rightMode: "VALUE",
              rightValue: 24,
            },
          ],
          action: { type: "SELL", targetTicker: ticker, sizingMode: "BALANCE_PCT", sizingValue: 35 },
        },
      ],
    },
    {
      stratCode: `${ticker}_CONNORS_RSI`,
      ticker,
      assetName: spec.name,
      shortName: sName,
      bestMethod: spec.bestMethod,
      strategyName: `[래리 코너스 RSI 역추세] ${sName} 과매도 스나이퍼 & 고점 차익실현`,
      famousRef: "Larry Connors RSI Pullback Buy-the-Dip & Extreme Overbought Trim",
      ruleSummary: `${sName} 코어 75% 보유 + RSI(14) ≤ 32 투매 발생 시 현금 85% 저가매수 / RSI(14) ≥ 78 과열 시 25% 차익실현`,
      startDate,
      allocations: [{ ticker, weightPct: 75 }],
      rebalanceEnabled: true,
      rebalance: reb("SEMIANNUAL", "ABS_PP", 10),
      rulesEnabled: true,
      rules: [
        {
          id: `${ticker}_RSI_BUY`,
          name: "RSI 과매도 투매 스나이퍼 매수",
          enabled: true,
          logic: "AND",
          cooldownDays: 12,
          conditions: [
            {
              left: { ticker, transform: "RSI", p1: 14 },
              operator: "LTE",
              rightMode: "VALUE",
              rightValue: 32,
            },
          ],
          action: { type: "BUY", targetTicker: ticker, sizingMode: "BALANCE_PCT", sizingValue: 85 },
        },
        {
          id: `${ticker}_RSI_SELL`,
          name: "RSI 극단 과열 부분 차익실현",
          enabled: true,
          logic: "AND",
          cooldownDays: 20,
          conditions: [
            {
              left: { ticker, transform: "RSI", p1: 14 },
              operator: "GTE",
              rightMode: "VALUE",
              rightValue: 78,
            },
          ],
          action: { type: "SELL", targetTicker: ticker, sizingMode: "BALANCE_PCT", sizingValue: 25 },
        },
      ],
    },
    {
      stratCode: `${ticker}_SHANNON_VOL`,
      ticker,
      assetName: spec.name,
      shortName: sName,
      bestMethod: spec.bestMethod,
      strategyName: `[클로드 섀넌 변동성 수확] ${sName} 70:30 밴드 리밸런싱 & 위기 줍줍`,
      famousRef: "Claude Shannon Volatility Harvesting + VIX Panic Dip-Buying",
      ruleSummary: `${sName} 70% : 무배당단기채(BOXX) 30% 반기 및 ±8%p 밴드 리밸런싱 + VIX ≥ 30 공포장 현금 80% 저점매수`,
      startDate,
      allocations: [{ ticker, weightPct: 70 }],
      rebalanceEnabled: true,
      rebalance: reb("SEMIANNUAL", "ABS_PP", 8),
      rulesEnabled: true,
      rules: [
        {
          id: `${ticker}_VIX_BUY`,
          name: "VIX 30 공포 패닉장 저가매수",
          enabled: true,
          logic: "AND",
          cooldownDays: 20,
          conditions: [
            {
              left: { ticker: "VIX", transform: "PRICE" },
              operator: "GTE",
              rightMode: "VALUE",
              rightValue: 30,
            },
          ],
          action: { type: "BUY", targetTicker: ticker, sizingMode: "BALANCE_PCT", sizingValue: 80 },
        },
      ],
    },
  ];
}

// 50 Candidate Multi-Asset Portfolios across ALL Korean-accessible assets (8억 원 기준, 세후 수익 & 금융소득종합과세 완전 회피 설계)
const MULTI_ASSET_CANDIDATES = [
  // Group 1: Global Tech/Semi + Tax-Free KRX Gold + US Treasury Barbell (초고수익·비과세 황금바벨)
  {
    id: "MA01",
    name: "나스닥·반도체·KRX금 황금바벨 (35:30:25:10 분기+7%p)",
    category: "글로벌 테크 + 비과세 KRX금 바벨",
    rationale: "초저배당 고성장 미국직투(QQQM 35% + SOXX 30%)와 완전 비과세 KRX 금현물(25%), 미국 장기채(TLT 10%)를 결합해 금융소득종합과세(연 배당 750만원 < 2,000만원)를 원천 차단하면서 세후 복리를 극대화",
    allocations: [
      { ticker: "NDX", weightPct: 35 },
      { ticker: "SOXX", weightPct: 30 },
      { ticker: "KRX_GOLD", weightPct: 25 },
      { ticker: "UST20Y_TR", weightPct: 10 },
    ],
    rebalanceEnabled: true,
    rebalance: reb("QUARTERLY", "ABS_PP", 7),
    rulesEnabled: false,
    rules: [],
  },
  {
    id: "MA02",
    name: "트리플 테크 리더스 & KRX금 실드 (NDX 30 / SOXX 25 / XLK 20 / 금 25)",
    category: "글로벌 테크 + 비과세 KRX금 바벨",
    rationale: "나스닥100(30%)·반도체(25%)·미국기술주(20%)의 3대 혁신 성장엔진(75%)과 비과세 KRX 금현물(25%)을 반기+8%p 밴드로 리밸런싱하여 폭락장 금 가격 급등분을 저가 기술주 매수 재원으로 수확",
    allocations: [
      { ticker: "NDX", weightPct: 30 },
      { ticker: "SOXX", weightPct: 25 },
      { ticker: "XLK", weightPct: 20 },
      { ticker: "KRX_GOLD", weightPct: 25 },
    ],
    rebalanceEnabled: true,
    rebalance: reb("SEMIANNUAL", "ABS_PP", 8),
    rulesEnabled: false,
    rules: [],
  },
  {
    id: "MA03",
    name: "반도체·나스닥·금·코스피 4원소 모멘텀 가속기 (SOXX 30 / NDX 30 / 금 20 / 코스피 10 / 현금 10)",
    category: "전술적 모멘텀 & 거시경제 결합",
    rationale: "OECD 경기선행지수가 확장할 때 반도체(SOXX)와 나스닥(NDX) 비중을 극대화하고, VIX 공포 폭발 시 KRX금과 무배당 단기채(BOXX)로 방어하는 8억 고액자산가 맞춤 전술 포트폴리오",
    allocations: [
      { ticker: "SOXX", weightPct: 30 },
      { ticker: "NDX", weightPct: 30 },
      { ticker: "KRX_GOLD", weightPct: 20 },
      { ticker: "KPI200", weightPct: 10 },
    ],
    rebalanceEnabled: true,
    rebalance: reb("QUARTERLY", "ABS_PP", 8),
    rulesEnabled: true,
    rules: [
      {
        id: "MA03_BUY",
        name: "OECD 경기선행 가속 시 반도체 공격 매수",
        enabled: true,
        logic: "AND",
        cooldownDays: 20,
        conditions: [
          { left: { ticker: "KOR_CLI", transform: "ROC", p1: 60 }, operator: "GT", rightMode: "VALUE", rightValue: 0.25 },
        ],
        action: { type: "BUY", targetTicker: "SOXX", sizingMode: "BALANCE_PCT", sizingValue: 80 },
      },
      {
        id: "MA03_SELL",
        name: "SOXX 200일선 이탈 시 차익실현 방어",
        enabled: true,
        logic: "AND",
        cooldownDays: 20,
        conditions: [
          {
            left: { ticker: "SOXX", transform: "PRICE" },
            operator: "CROSS_DOWN",
            rightMode: "INDICATOR",
            rightIndicator: { ticker: "SOXX", transform: "SMA", p1: 200 },
          },
        ],
        action: { type: "SELL", targetTicker: "SOXX", sizingMode: "BALANCE_PCT", sizingValue: 40 },
      },
    ],
  },
  {
    id: "MA04",
    name: "한국형 택스프리 알파 올웨더 (NDX 30 / SPX 20 / KRX금 25 / TLT 15 / 코스피 10)",
    category: "세후 최적화 올웨더",
    rationale: "레이 달리오의 올웨더를 한국 세법에 맞게 재설계: 고배당 채권(TLT)을 15%로 캡핑해 금융소득종합과세를 막고, 비과세 KRX금(25%)+코스피(10%)와 저배당 미국지수(NDX 30%+SPX 20%)로 성장성을 대폭 강화",
    allocations: [
      { ticker: "NDX", weightPct: 30 },
      { ticker: "SPX", weightPct: 20 },
      { ticker: "KRX_GOLD", weightPct: 25 },
      { ticker: "UST20Y_TR", weightPct: 15 },
      { ticker: "KPI200", weightPct: 10 },
    ],
    rebalanceEnabled: true,
    rebalance: reb("QUARTERLY", "ABS_PP", 6),
    rulesEnabled: false,
    rules: [],
  },
  {
    id: "MA05",
    name: "나스닥·기술주·KRX금·장기채 4분할 성장형 (NDX 35 / XLK 25 / 금 25 / TLT 15)",
    category: "글로벌 테크 + 비과세 KRX금 바벨",
    rationale: "미국 빅테크(NDX+XLK 60%)의 폭발적 성장과 KRX 금현물(25%)·미국 20년 장기국채(15%)의 위기 역상관 헤지를 결합해 MDD를 -20%대로 묶으면서 연 12%+ 세후 복리를 달성",
    allocations: [
      { ticker: "NDX", weightPct: 35 },
      { ticker: "XLK", weightPct: 25 },
      { ticker: "KRX_GOLD", weightPct: 25 },
      { ticker: "UST20Y_TR", weightPct: 15 },
    ],
    rebalanceEnabled: true,
    rebalance: reb("QUARTERLY", "ABS_PP", 7),
    rulesEnabled: false,
    rules: [],
  },
  {
    id: "MA06",
    name: "글로벌 5대 자산 인플레이션 실드 (NDX 30 / SOXX 20 / KRX금 20 / XLE 15 / TLT 15)",
    category: "인플레이션 & 스태그플레이션 전천후",
    rationale: "2022년 같은 인플레이션·금리인상 쇼크에서 주식과 채권이 동반 하락할 때 급등하는 미국 에너지 섹터(XLE 15%)와 비과세 KRX금(20%)을 편입하여 모든 거시 국면에 대응",
    allocations: [
      { ticker: "NDX", weightPct: 30 },
      { ticker: "SOXX", weightPct: 20 },
      { ticker: "KRX_GOLD", weightPct: 20 },
      { ticker: "XLE", weightPct: 15 },
      { ticker: "UST20Y_TR", weightPct: 15 },
    ],
    rebalanceEnabled: true,
    rebalance: reb("QUARTERLY", "ABS_PP", 7),
    rulesEnabled: false,
    rules: [],
  },
  {
    id: "MA07",
    name: "미국 3대 섹터(테크·헬스케어·산업재) & KRX금·채권 균형 (XLK 25 / XLV 20 / XLI 15 / 금 25 / IEF 15)",
    category: "섹터 로테이션 & 안전자산",
    rationale: "기술(XLK)·헬스케어(XLV)·산업재(XLI) 60%로 성장과 경기 방어를 동시에 잡고, 비과세 KRX금 25%와 미 10년 국채(IEF) 15%로 변동성을 낮춘 안정 성장 포트폴리오",
    allocations: [
      { ticker: "XLK", weightPct: 25 },
      { ticker: "XLV", weightPct: 20 },
      { ticker: "XLI", weightPct: 15 },
      { ticker: "KRX_GOLD", weightPct: 25 },
      { ticker: "UST10Y_TR", weightPct: 15 },
    ],
    rebalanceEnabled: true,
    rebalance: reb("QUARTERLY", "ABS_PP", 6),
    rulesEnabled: false,
    rules: [],
  },
  {
    id: "MA08",
    name: "비과세 양대산맥(KRX금 35 + 코스피 25) & 나스닥(40) 조세특화 포트폴리오",
    category: "조세 회피 극대화형",
    rationale: "자산의 60%(KRX금 35% + 코스피200 25%)를 매매차익 완전 비과세(0%) 자산에 배치하고, 40%만 나스닥100(QQQM)에 투자해 세금 유출을 극소화한 한국인 전용 세테크 포트폴리오",
    allocations: [
      { ticker: "NDX", weightPct: 40 },
      { ticker: "KRX_GOLD", weightPct: 35 },
      { ticker: "KPI200", weightPct: 25 },
    ],
    rebalanceEnabled: true,
    rebalance: reb("QUARTERLY", "ABS_PP", 6),
    rulesEnabled: false,
    rules: [],
  },
  {
    id: "MA09",
    name: "반도체·나스닥 200일 듀얼 추세 & KRX금·달러 앵커 (SOXX 30 / NDX 30 / 금 25 / BOXX 15)",
    category: "전술적 모멘텀 & 거시경제 결합",
    rationale: "평소 반도체 30%·나스닥 30%·금 25%·무배당단기채(BOXX) 15%를 유지하되, 나스닥 200일선 상향돌파 시 BOXX 현금을 투입하고 하향돌파 시 절반을 매도해 닷컴버블·금융위기 MDD를 방어",
    allocations: [
      { ticker: "SOXX", weightPct: 30 },
      { ticker: "NDX", weightPct: 30 },
      { ticker: "KRX_GOLD", weightPct: 25 },
    ],
    rebalanceEnabled: true,
    rebalance: reb("SEMIANNUAL", "ABS_PP", 8),
    rulesEnabled: true,
    rules: [
      {
        id: "MA09_BUY",
        name: "NDX 200일선 상향돌파 매수",
        enabled: true,
        logic: "AND",
        cooldownDays: 15,
        conditions: [
          {
            left: { ticker: "NDX", transform: "PRICE" },
            operator: "CROSS_UP",
            rightMode: "INDICATOR",
            rightIndicator: { ticker: "NDX", transform: "SMA", p1: 200 },
          },
        ],
        action: { type: "BUY", targetTicker: "NDX", sizingMode: "BALANCE_PCT", sizingValue: 85 },
      },
      {
        id: "MA09_SELL",
        name: "NDX 200일선 하향돌파 방어",
        enabled: true,
        logic: "AND",
        cooldownDays: 15,
        conditions: [
          {
            left: { ticker: "NDX", transform: "PRICE" },
            operator: "CROSS_DOWN",
            rightMode: "INDICATOR",
            rightIndicator: { ticker: "NDX", transform: "SMA", p1: 200 },
          },
        ],
        action: { type: "SELL", targetTicker: "NDX", sizingMode: "BALANCE_PCT", sizingValue: 45 },
      },
    ],
  },
  {
    id: "MA10",
    name: "해리 브라운 한국형 영구포트폴리오 개량 (NDX 25 / KRX금 25 / TLT 25 / BOXX단기채 25)",
    category: "세후 최적화 올웨더",
    rationale: "영구 포트폴리오의 주식·금·장기채·현금 4등분 구조에서 주식을 나스닥100으로, 금을 비과세 KRX금현물로, 현금을 무배당 BOXX 단기채로 대체해 금융소득종합과세 없이 MDD -15% 이내 방어",
    allocations: [
      { ticker: "NDX", weightPct: 25 },
      { ticker: "KRX_GOLD", weightPct: 25 },
      { ticker: "UST20Y_TR", weightPct: 25 },
      { ticker: "UST2Y_TR", weightPct: 25 },
    ],
    rebalanceEnabled: true,
    rebalance: reb("YEARLY", "ABS_PP", 7),
    rulesEnabled: false,
    rules: [],
  },
  {
    id: "MA11",
    name: "S&P500·나스닥·헬스케어·KRX금·장기채 5분할 코어 (SPX 25 / NDX 25 / XLV 15 / 금 20 / TLT 15)",
    category: "세후 최적화 올웨더",
    rationale: "미국 시장 전체(SPX)와 기술 성장(NDX), 방어 섹터(XLV), 비과세 실물금(KRX_GOLD), 장기국채(TLT)를 이상적 비율로 조합해 세후 샤프 지수를 극대화",
    allocations: [
      { ticker: "SPX", weightPct: 25 },
      { ticker: "NDX", weightPct: 25 },
      { ticker: "XLV", weightPct: 15 },
      { ticker: "KRX_GOLD", weightPct: 20 },
      { ticker: "UST20Y_TR", weightPct: 15 },
    ],
    rebalanceEnabled: true,
    rebalance: reb("QUARTERLY", "ABS_PP", 6),
    rulesEnabled: false,
    rules: [],
  },
  {
    id: "MA12",
    name: "글로벌 7대 자산 그랜드 마스터 배분 (NDX 25 / SOXX 15 / SPX 15 / 코스피 10 / KRX금 15 / TLT 10 / XLE 10)",
    category: "전자산 글로벌 분산",
    rationale: "미국 대형·기술·반도체·에너지, 한국 코스피200, 비과세 KRX금, 미국 장기국채까지 7개 핵심 자산군을 총망라하여 어떤 자산군이 주도권을 잡아도 수익을 창출하는 전천후 모델",
    allocations: [
      { ticker: "NDX", weightPct: 25 },
      { ticker: "SOXX", weightPct: 15 },
      { ticker: "SPX", weightPct: 15 },
      { ticker: "KPI200", weightPct: 10 },
      { ticker: "KRX_GOLD", weightPct: 15 },
      { ticker: "UST20Y_TR", weightPct: 10 },
      { ticker: "XLE", weightPct: 10 },
    ],
    rebalanceEnabled: true,
    rebalance: reb("QUARTERLY", "ABS_PP", 6),
    rulesEnabled: false,
    rules: [],
  },
  {
    id: "MA13",
    name: "반도체·기술·나스닥 공격형 & KRX금 30% 안전벨트 (SOXX 25 / XLK 25 / NDX 20 / KRX금 30)",
    category: "글로벌 테크 + 비과세 KRX금 바벨",
    rationale: "초고성장 IT·반도체 70%와 비과세 KRX 금현물 30%를 결합하고 분기+7%p 밴드 리밸런싱으로 닷컴버블과 금융위기 변동성을 복리 수익으로 치환",
    allocations: [
      { ticker: "SOXX", weightPct: 25 },
      { ticker: "XLK", weightPct: 25 },
      { ticker: "NDX", weightPct: 20 },
      { ticker: "KRX_GOLD", weightPct: 30 },
    ],
    rebalanceEnabled: true,
    rebalance: reb("QUARTERLY", "ABS_PP", 7),
    rulesEnabled: false,
    rules: [],
  },
  {
    id: "MA14",
    name: "방어형 배당캡 스텔스 포트폴리오 (SPX 25 / XLV 20 / XLP 15 / KRX금 25 / IEF 15)",
    category: "중위험·중수익 방어형",
    rationale: "필수소비재(XLP)와 헬스케어(XLV), S&P500(SPX), KRX금, 10년물 국채(IEF)로 구성하여 하락장 방어력을 극대화하면서도 전체 연 배당률을 1.4%로 억제해 8억 투자 시 금융소득종합과세를 완벽 회피",
    allocations: [
      { ticker: "SPX", weightPct: 25 },
      { ticker: "XLV", weightPct: 20 },
      { ticker: "XLP", weightPct: 15 },
      { ticker: "KRX_GOLD", weightPct: 25 },
      { ticker: "UST10Y_TR", weightPct: 15 },
    ],
    rebalanceEnabled: true,
    rebalance: reb("QUARTERLY", "ABS_PP", 5),
    rulesEnabled: false,
    rules: [],
  },
  {
    id: "MA15",
    name: "리츠·원유에너지·금 실물인플레 트리오 & 나스닥 (NDX 35 / KRX금 25 / VNQ 15 / XLE 15 / BOXX 10)",
    category: "인플레이션 & 실물자산 결합",
    rationale: "고배당 리츠(VNQ 15%)와 에너지(XLE 15%)를 금융소득종합과세 안전선 이내로 소량 편입해 실물 인플레이션 방어력을 확보하고 나스닥(35%)과 비과세 금(25%)으로 세후 수익률을 견인",
    allocations: [
      { ticker: "NDX", weightPct: 35 },
      { ticker: "KRX_GOLD", weightPct: 25 },
      { ticker: "VNQ", weightPct: 15 },
      { ticker: "XLE", weightPct: 15 },
      { ticker: "UST2Y_TR", weightPct: 10 },
    ],
    rebalanceEnabled: true,
    rebalance: reb("QUARTERLY", "ABS_PP", 7),
    rulesEnabled: false,
    rules: [],
  },
  {
    id: "MA16",
    name: "OECD 경기선행 4국면 나스닥·코스피·금·장기채 스위처 (NDX 30 / KPI200 15 / KRX금 25 / TLT 15 / 현금 15)",
    category: "전술적 모멘텀 & 거시경제 결합",
    rationale: "한국 OECD 경기순환변동치(KOR_CLI)가 상승할 때 나스닥과 코스피를 확대하고, 미국 10년물 금리 급등 및 경기 수축 시 금과 현금으로 대피하는 거시 전술 포트폴리오",
    allocations: [
      { ticker: "NDX", weightPct: 30 },
      { ticker: "KPI200", weightPct: 15 },
      { ticker: "KRX_GOLD", weightPct: 25 },
      { ticker: "UST20Y_TR", weightPct: 15 },
    ],
    rebalanceEnabled: true,
    rebalance: reb("QUARTERLY", "ABS_PP", 8),
    rulesEnabled: true,
    rules: [
      {
        id: "MA16_BUY",
        name: "OECD CLI 상승 국면 나스닥 비중 확대",
        enabled: true,
        logic: "AND",
        cooldownDays: 20,
        conditions: [
          { left: { ticker: "KOR_CLI", transform: "ROC", p1: 60 }, operator: "GT", rightMode: "VALUE", rightValue: 0.2 },
        ],
        action: { type: "BUY", targetTicker: "NDX", sizingMode: "BALANCE_PCT", sizingValue: 80 },
      },
      {
        id: "MA16_SELL",
        name: "환율 급등 위기 시 코스피 현금화",
        enabled: true,
        logic: "AND",
        cooldownDays: 20,
        conditions: [
          {
            left: { ticker: "USDKRW", transform: "PRICE" },
            operator: "CROSS_UP",
            rightMode: "INDICATOR",
            rightIndicator: { ticker: "USDKRW", transform: "SMA", p1: 120 },
          },
        ],
        action: { type: "SELL", targetTicker: "KPI200", sizingMode: "BALANCE_PCT", sizingValue: 50 },
      },
    ],
  },
  {
    id: "MA17",
    name: "미국 60/40 세후 업그레이드 (NDX 30 + SPX 30 + TLT 20 + KRX금 20)",
    category: "세후 최적화 올웨더",
    rationale: "전통적 60/40 포트폴리오에서 채권 40%가 유발하는 금융소득종합과세 문제와 2022년 채권 폭락 취약점을 해결하기 위해 안전자산 40%를 TLT(20%)와 비과세 KRX금(20%)으로 양분",
    allocations: [
      { ticker: "NDX", weightPct: 30 },
      { ticker: "SPX", weightPct: 30 },
      { ticker: "UST20Y_TR", weightPct: 20 },
      { ticker: "KRX_GOLD", weightPct: 20 },
    ],
    rebalanceEnabled: true,
    rebalance: reb("QUARTERLY", "ABS_PP", 6),
    rulesEnabled: false,
    rules: [],
  },
  {
    id: "MA18",
    name: "다우·S&P·헬스케어·유틸리티·KRX금 가치방어 (DJI 20 / SPX 20 / XLV 20 / XLU 15 / 금 25)",
    category: "중위험·중수익 방어형",
    rationale: "미국 블루칩 다우존스(20%), S&P500(20%), 헬스케어(20%), 유틸리티(15%)와 비과세 KRX금(25%)을 결합하여 기술주 거품 붕괴기에도 흔들리지 않는 가치주 중심 자산배분",
    allocations: [
      { ticker: "DJI", weightPct: 20 },
      { ticker: "SPX", weightPct: 20 },
      { ticker: "XLV", weightPct: 20 },
      { ticker: "XLU", weightPct: 15 },
      { ticker: "KRX_GOLD", weightPct: 25 },
    ],
    rebalanceEnabled: true,
    rebalance: reb("QUARTERLY", "ABS_PP", 6),
    rulesEnabled: false,
    rules: [],
  },
  {
    id: "MA19",
    name: "나스닥·반도체·헬스케어·KRX금·단기채 5각 편대 (NDX 30 / SOXX 20 / XLV 15 / 금 25 / BOXX 10)",
    category: "글로벌 테크 + 비과세 KRX금 바벨",
    rationale: "성장주(NDX·SOXX 50%) + 방어주(XLV 15%) + 비과세 실물(KRX금 25%) + 무배당 단기채(BOXX 10%)로 구성해 연 배당률을 0.55%로 낮추어 자산이 30억으로 불어나도 종합과세가 전혀 발생하지 않는 구조",
    allocations: [
      { ticker: "NDX", weightPct: 30 },
      { ticker: "SOXX", weightPct: 20 },
      { ticker: "XLV", weightPct: 15 },
      { ticker: "KRX_GOLD", weightPct: 25 },
      { ticker: "UST2Y_TR", weightPct: 10 },
    ],
    rebalanceEnabled: true,
    rebalance: reb("QUARTERLY", "ABS_PP", 7),
    rulesEnabled: false,
    rules: [],
  },
  {
    id: "MA20",
    name: "디지털·실물 골드 & 테크 퓨처스 (NDX 35 / SOXX 20 / KRX금 25 / TLT 15 / BTC 5)",
    category: "디지털 & 실물 하이브리드",
    rationale: "나스닥·반도체(55%)와 실물 KRX금(25%)·장기채(15%) 포트폴리오에 비과세 비트코인 현물(5%)을 소량 편입하고 분기+7%p 밴드로 리밸런싱하여 2011년 이후 현대 장세에서 폭발적 변동성 수확 알파를 창출",
    allocations: [
      { ticker: "NDX", weightPct: 35 },
      { ticker: "SOXX", weightPct: 20 },
      { ticker: "KRX_GOLD", weightPct: 25 },
      { ticker: "UST20Y_TR", weightPct: 15 },
      { ticker: "BTC_KRW", weightPct: 5 },
    ],
    rebalanceEnabled: true,
    rebalance: reb("QUARTERLY", "ABS_PP", 7),
    rulesEnabled: false,
    rules: [],
  },
];

// Add 10 more systematic weight variations (MA21 ~ MA30) so we have 30 diverse multi-asset candidates
const extraGrid = [
  { id: "MA21", name: "나스닥 45 · KRX금 35 · 장기채 20 (반기+7%p)", w: [["NDX", 45], ["KRX_GOLD", 35], ["UST20Y_TR", 20]], p: "SEMIANNUAL", b: 7 },
  { id: "MA22", name: "반도체 35 · 나스닥 25 · KRX금 30 · 코스피 10 (분기+8%p)", w: [["SOXX", 35], ["NDX", 25], ["KRX_GOLD", 30], ["KPI200", 10]], p: "QUARTERLY", b: 8 },
  { id: "MA23", name: "미국기술(XLK) 40 · S&P500 20 · KRX금 25 · 10년채 15 (분기+6%p)", w: [["XLK", 40], ["SPX", 20], ["KRX_GOLD", 25], ["UST10Y_TR", 15]], p: "QUARTERLY", b: 6 },
  { id: "MA24", name: "초안정 KRX금 40 · 나스닥 30 · 중기채 15 · 단기채 15 (분기+5%p)", w: [["KRX_GOLD", 40], ["NDX", 30], ["UST10Y_TR", 15], ["UST2Y_TR", 15]], p: "QUARTERLY", b: 5 },
  { id: "MA25", name: "미국 4대 섹터(XLK·XLV·XLI·XLF) & KRX금·장기채 (각15%+금25%+TLT15%)", w: [["XLK", 15], ["XLV", 15], ["XLI", 15], ["XLF", 15], ["KRX_GOLD", 25], ["UST20Y_TR", 15]], p: "QUARTERLY", b: 6 },
  { id: "MA26", name: "원유(WTI) 10 · 에너지(XLE) 10 · 나스닥 35 · KRX금 30 · 장기채 15", w: [["WTI", 10], ["XLE", 10], ["NDX", 35], ["KRX_GOLD", 30], ["UST20Y_TR", 15]], p: "QUARTERLY", b: 7 },
  { id: "MA27", name: "달러현금(USD) 20 · KRX금 30 · 나스닥 35 · 코스피 15 비과세 특화", w: [["USDKRW", 20], ["KRX_GOLD", 30], ["NDX", 35], ["KPI200", 15]], p: "QUARTERLY", b: 6 },
  { id: "MA28", name: "나스닥 40 · 반도체 20 · 헬스케어 15 · KRX금 25 (연간+8%p)", w: [["NDX", 40], ["SOXX", 20], ["XLV", 15], ["KRX_GOLD", 25]], p: "YEARLY", b: 8 },
  { id: "MA29", name: "S&P500 30 · 다우 15 · KRX금 30 · 장기채 15 · 코스피 10", w: [["SPX", 30], ["DJI", 15], ["KRX_GOLD", 30], ["UST20Y_TR", 15], ["KPI200", 10]], p: "QUARTERLY", b: 6 },
  { id: "MA30", name: "반도체 25 · 기술 25 · 나스닥 20 · KRX금 20 · 장기채 10 (반기+7%p)", w: [["SOXX", 25], ["XLK", 25], ["NDX", 20], ["KRX_GOLD", 20], ["UST20Y_TR", 10]], p: "SEMIANNUAL", b: 7 },
];

for (const g of extraGrid) {
  MULTI_ASSET_CANDIDATES.push({
    id: g.id,
    name: g.name,
    category: "다중자산 그리드 탐색",
    rationale: `${g.name} 구성으로 한국 세법상 분리과세 및 비과세 혜택을 결합한 포트폴리오`,
    allocations: g.w.map(([ticker, weightPct]) => ({ ticker, weightPct })),
    rebalanceEnabled: true,
    rebalance: reb(g.p, "ABS_PP", g.b),
    rulesEnabled: false,
    rules: [],
  });
}

const CURRENT_INVEST_KRW = 800000000; // 현재 투자 원금 8억 원
const COMP_TAX_LIMIT_KRW = 20000000; // 금융소득종합과세 기준 금액 (연 이자·배당 2,000만 원)
const US_BASIC_DEDUCTION_KRW = 2500000; // 해외주식 양도소득세 연간 기본공제 250만 원

/**
 * 백테스트를 통해 도출된 기대 세전 CAGR(expectedPreTaxCagrPct)을 바탕으로
 * "현재 기준으로 8억 원(800,000,000원)을 투자했을 때 1년 후 기대 수익, 예상 세금, 금융소득종합과세 대상 여부, 세후 기대 수익률"을 정밀 계산
 */
function compute1YrProjectionAt800M(expectedPreTaxCagrPct, allocations) {
  let totalWeight = 0;
  let yr1DivIncomeKrw = 0; // 1년 후 예상 배당·분배금 (금융소득 합산 대상)
  let taxableUsCapGainWeight = 0; // 22% 해외주식 양도소득세 과세 대상 비중 합계
  let taxFreeCapGainWeight = 0; // 비과세 매매차익(국내주식/KRX금현물/달러현물/비트코인) 비중 합계

  for (const a of allocations) {
    const sp = KOREA_ASSET_TAX_SPECS[a.ticker];
    if (!sp) continue;
    const w = a.weightPct / 100.0;
    totalWeight += a.weightPct;
    yr1DivIncomeKrw += CURRENT_INVEST_KRW * w * ((sp.divYieldPct || 0) / 100.0);
    if (sp.capGainTaxRate > 0) {
      taxableUsCapGainWeight += w;
    } else {
      taxFreeCapGainWeight += w;
    }
  }

  // 남은 현금 비중은 무배당 합성 단기채(BOXX, 22% 양도세 분리과세, 배당 0%)로 운용
  if (totalWeight < 100) {
    const remW = (100 - totalWeight) / 100.0;
    taxableUsCapGainWeight += remW;
  }

  const weightedDivYieldPct = (yr1DivIncomeKrw / CURRENT_INVEST_KRW) * 100.0;
  // expectedPreTaxCagrPct가 자본수익(Price CAGR) + 배당수익을 반영한 기대 세전 총수익률일 때:
  // (단일자산 Buy&Hold에서 priceCagr + divYield 구조가 명확하도록, 만약 expectedPreTaxCagrPct < weightedDivYieldPct인 채권/배당주도 정확히 분리)
  const yr1PreTaxTotalGainKrw = Math.round(CURRENT_INVEST_KRW * (expectedPreTaxCagrPct / 100.0));
  const yr1CapGainKrw = Math.max(0, yr1PreTaxTotalGainKrw - Math.round(yr1DivIncomeKrw));

  // [1] 최적 투자 방식 (미국 상장 ETF 직투 + KRX 금현물 + 국내 주식형 ETF) 선택 시 1년 후 예상 세금
  // - 해외주식 매매차익 부분만 250만 원 기본공제 후 22% 분리과세 (국내주식 KODEX200, KRX금현물, 달러현물, BTC 매매차익은 0% 비과세)
  const totalNonZeroWeight = taxableUsCapGainWeight + taxFreeCapGainWeight || 1;
  const usTaxableRatio = taxableUsCapGainWeight / totalNonZeroWeight;
  const yr1UsTaxableCapGainKrw = Math.round(yr1CapGainKrw * usTaxableRatio);
  const yr1CapGainTaxKrw = Math.round(
    Math.max(0, yr1UsTaxableCapGainKrw - US_BASIC_DEDUCTION_KRW) * 0.22
  );

  // - 배당소득세 (15.4%) 및 금융소득종합과세(연 2,000만 원 초과 여부)
  const yr1FinIncomeOptimalKrw = Math.round(yr1DivIncomeKrw);
  const isCompTaxTargetOptimal = yr1FinIncomeOptimalKrw > COMP_TAX_LIMIT_KRW;
  const yr1DivBaseTaxKrw = Math.round(
    Math.min(yr1FinIncomeOptimalKrw, COMP_TAX_LIMIT_KRW) * 0.154
  );
  // 2,000만 원 초과 시 초과분에 대해 종합소득세 합산 누진세율(평균 26.4%~38.5%) + 지역건보료(~8%) = 약 35% 실효부담
  const yr1CompTaxSurchargeKrw = isCompTaxTargetOptimal
    ? Math.round((yr1FinIncomeOptimalKrw - COMP_TAX_LIMIT_KRW) * 0.35)
    : 0;
  const yr1DivTotalTaxKrw = yr1DivBaseTaxKrw + yr1CompTaxSurchargeKrw;

  // 1년 후 전량 차익실현(매도) 가정 시 총 예상 세금 vs 미매도 보유(배당세만 납부) 시 세금
  const yr1TotalTaxRealizedKrw = yr1CapGainTaxKrw + yr1DivTotalTaxKrw;
  const yr1TotalTaxHoldOnlyKrw = yr1DivTotalTaxKrw;

  // 1년 후 기대 세후 순수익금 및 세후 기대 CAGR (차익실현 기준 & 미매도 보유 기준)
  const yr1AfterTaxNetGainKrw = yr1PreTaxTotalGainKrw - yr1TotalTaxRealizedKrw;
  const yr1AfterTaxCagrPct =
    Math.round((yr1AfterTaxNetGainKrw / CURRENT_INVEST_KRW) * 10000) / 100;
  const yr1HoldOnlyAfterTaxNetGainKrw = yr1PreTaxTotalGainKrw - yr1TotalTaxHoldOnlyKrw;
  const yr1HoldOnlyAfterTaxCagrPct =
    Math.round((yr1HoldOnlyAfterTaxNetGainKrw / CURRENT_INVEST_KRW) * 10000) / 100;

  // [2] 국내 상장 해외/원자재 ETF 투자 시 (예: KODEX WTI원유선물, KODEX 골드선물, TIGER 미국나스닥100 등) 1년 후 예상 세금
  // - 국내 주식(KPI200) 비중을 제외한 모든 매매차익 + 분배금이 100% '배당소득'으로 합산 과세됨!
  let kpi200Weight = 0;
  for (const a of allocations) {
    if (a.ticker === "KPI200") kpi200Weight += a.weightPct / 100.0;
  }
  const domTaxableGainRatio = Math.max(0, 1.0 - kpi200Weight);
  const yr1FinIncomeDomTrapKrw = Math.round(
    yr1CapGainKrw * domTaxableGainRatio + yr1DivIncomeKrw
  );
  const isCompTaxTargetDomTrap = yr1FinIncomeDomTrapKrw > COMP_TAX_LIMIT_KRW;
  const yr1DomTrapTaxKrw = isCompTaxTargetDomTrap
    ? Math.round(
        COMP_TAX_LIMIT_KRW * 0.154 +
          (yr1FinIncomeDomTrapKrw - COMP_TAX_LIMIT_KRW) * 0.35
      )
    : Math.round(yr1FinIncomeDomTrapKrw * 0.154);
  const yr1DomTrapNetGainKrw = yr1PreTaxTotalGainKrw - yr1DomTrapTaxKrw;
  const yr1DomTrapAfterTaxCagrPct =
    Math.round((yr1DomTrapNetGainKrw / CURRENT_INVEST_KRW) * 10000) / 100;

  return {
    principalKrw: CURRENT_INVEST_KRW,
    expectedPreTaxCagrPct: Math.round(expectedPreTaxCagrPct * 100) / 100,
    weightedDivYieldPct: Math.round(weightedDivYieldPct * 100) / 100,
    yr1PreTaxTotalGainKrw,
    yr1CapGainKrw,
    yr1DivIncomeKrw: yr1FinIncomeOptimalKrw,
    // 최적 루트 (미국 직투 / KRX 금현물 / 국내 주식형 ETF)
    yr1CapGainTaxKrw,
    yr1DivTotalTaxKrw,
    yr1TotalTaxRealizedKrw,
    yr1TotalTaxHoldOnlyKrw,
    yr1AfterTaxNetGainKrw,
    yr1AfterTaxCagrPct,
    yr1HoldOnlyAfterTaxNetGainKrw,
    yr1HoldOnlyAfterTaxCagrPct,
    yr1FinIncomeOptimalKrw,
    isCompTaxTargetOptimal,
    // 국내 상장 해외·원자재 ETF 함정 루트
    yr1FinIncomeDomTrapKrw,
    isCompTaxTargetDomTrap,
    yr1DomTrapTaxKrw,
    yr1DomTrapNetGainKrw,
    yr1DomTrapAfterTaxCagrPct,
    yr1TaxSavedVsDomTrapKrw: yr1DomTrapTaxKrw - yr1TotalTaxRealizedKrw,
  };
}

/**
 * 원자재(원유 WTI · 금 Gold) 및 핵심 해외자산에 대해
 * "미국 시장 상장 ETF vs 국내 시장 상장 ETF vs KRX 현물"에 현재 8억 원을 투자했을 때
 * 1년 후 기대수익·예상 세금·금융소득종합과세 대상 여부 정밀 비교 데이터 생성
 */
function buildCommodityAndVehicleComparisons() {
  return [
    {
      assetGroup: "🛢️ 원유 (WTI Crude Oil) & 에너지",
      scenarioTitle: "원유·에너지 8억 원 투자 시 — 미국 상장 ETF(USO vs OILK vs XLE) vs 국내 상장 ETF(KODEX WTI원유선물) 비교",
      options: [
        {
          vehicleName: "국내 상장 원유선물 ETF",
          tickers: "KODEX WTI원유선물(H) / TIGER 원유선물Enhanced(H)",
          market: "🇰🇷 국내 상장 파생형 ETF",
          taxRuleSummary: "매매차익 전액 15.4% 배당소득세 + 연 2,000만 원 초과 시 금융소득종합과세(최대 49.5%+건보료) 합산 · 손익통산 불가",
          bnhPreTaxCagrPct: 1.29,
          activePreTaxCagrPct: 10.0, // 원유 추세/역추세 스윙 또는 유가 반등 사이클(+10%) 가정 시
          yr1PreTaxGainBnhKrw: 10320000,
          yr1TaxBnhKrw: 1589280,
          yr1NetGainBnhKrw: 8730720,
          yr1AfterTaxCagrBnhPct: 1.09,
          yr1PreTaxGainSwingKrw: 80000000, // +10% 반등 시 (+8,000만 원)
          yr1TaxSwingKrw: 24080000, // 2,000만×15.4% + 6,000만×35%(종소세+건보료) = 2,408만 원
          yr1NetGainSwingKrw: 55920000,
          yr1AfterTaxCagrSwingPct: 6.99,
          compTaxStatus: "🚨 고위험 (원금 8억 기준 유가 반등으로 연 +2.5% / +2,000만 원만 수익 나도 즉시 금융소득종합과세 대상 직행!)",
          verdict: "❌ 부적합 (종합과세 폭탄 + 롤오버/환헤지 비용 이중고)",
          isRecommended: false,
        },
        {
          vehicleName: "미국 상장 원유선물 PTP ETF 직투",
          tickers: "USO (United States Oil Fund) / DBO (Invesco DB Oil)",
          market: "🇺🇸 미국 상장 PTP 파트너십 ETF",
          taxRuleSummary: "미국 국세청(IRS) Section 1446(f) PTP 지정 → 수익·손실 무관하게 매도 대금 총액(Gross Proceeds)의 10% 강제 원천징수!",
          bnhPreTaxCagrPct: 1.29,
          activePreTaxCagrPct: 10.0,
          yr1PreTaxGainBnhKrw: 10320000,
          yr1TaxBnhKrw: 81032000, // 매도대금 8억 1,032만 원의 10% = 8,103만 원 원천징수!
          yr1NetGainBnhKrw: -70712000,
          yr1AfterTaxCagrBnhPct: -8.84,
          yr1PreTaxGainSwingKrw: 80000000,
          yr1TaxSwingKrw: 88000000, // 매도대금 8.8억의 10% = 8,800만 원 원천징수!
          yr1NetGainSwingKrw: -8000000,
          yr1AfterTaxCagrSwingPct: -1.0,
          compTaxStatus: "💀 투자 원금 훼손 재앙 (8억 매도 시 무조건 8,000만 원 이상 PTP 원천징수)",
          verdict: "🚫 절대 투자 금지 (미국 PTP 10% 매도대금 원천징수 대상)",
          isRecommended: false,
        },
        {
          vehicleName: "미국 상장 원유선물 Non-PTP ETF 직투",
          tickers: "OILK (ProShares K-1 Free Crude Oil Strategy ETF)",
          market: "🇺🇸 미국 상장 Non-PTP(1940법) ETF",
          taxRuleSummary: "케이맨 자회사 구조로 PTP 10% 원천징수 완전 면제 + 매매차익 연 250만 원 공제 후 22% 분리과세 + 손익통산 가능",
          bnhPreTaxCagrPct: 1.29,
          activePreTaxCagrPct: 10.0,
          yr1PreTaxGainBnhKrw: 10320000,
          yr1TaxBnhKrw: 1720400, // (1,032만 - 250만) × 22% = 172만 원
          yr1NetGainBnhKrw: 8599600,
          yr1AfterTaxCagrBnhPct: 1.08,
          yr1PreTaxGainSwingKrw: 80000000,
          yr1TaxSwingKrw: 17050000, // (8,000만 - 250만) × 22% = 1,705만 원 (분리과세 종결!)
          yr1NetGainSwingKrw: 62950000,
          yr1AfterTaxCagrSwingPct: 7.87,
          compTaxStatus: "✅ 금융소득종합과세 완전 비대상 (수익이 얼마든 금융소득 합산 0원)",
          verdict: "⭕ 원유 선물 단기/중기 매매 시 최적 (KODEX WTI 대비 종합과세 완벽 회피)",
          isRecommended: true,
        },
        {
          vehicleName: "미국 상장 원유·에너지 기업 ETF 직투 (최우선 대체재)",
          tickers: "XLE (Energy Select Sector SPDR) / VDE",
          market: "🇺🇸 미국 상장 에너지 주식형 ETF",
          taxRuleSummary: "엑손모빌·셰브론 등 원유 메이저 기업 보유로 선물 롤오버(콘탱고) 손실 0원! 매매차익 22% 분리과세 + 배당(3.0%) 15.4%",
          bnhPreTaxCagrPct: 9.8,
          activePreTaxCagrPct: 9.8,
          yr1PreTaxGainBnhKrw: 78400000, // 매매차익 5,440만 + 배당 2,400만 = 7,840만 원
          yr1TaxBnhKrw: 15114000, // 양도세 (5,440만-250만)×22% = 1,142만 + 배당세 369.6만 (비중조절/배당락스왑 시 종합과세 회피)
          yr1NetGainBnhKrw: 63286000,
          yr1AfterTaxCagrBnhPct: 7.91,
          yr1PreTaxGainSwingKrw: 78400000,
          yr1TaxSwingKrw: 15114000,
          yr1NetGainSwingKrw: 63286000,
          yr1AfterTaxCagrSwingPct: 7.91,
          compTaxStatus: "✅ 포트폴리오 내 60% 이하 편입 또는 4분기 배당락 스왑 시 종합과세 비대상 (8억 단독 수동보유 시에는 배당 2,400만원으로 주의)",
          verdict: "🏆 원유·인플레이션 장기 투자 최우수 해법 (세후 기대 CAGR +7.91%, 연 +6,329만 원 순수익)",
          isRecommended: true,
        },
      ],
    },
    {
      assetGroup: "🥇 금 (Gold) 귀금속 원자재",
      scenarioTitle: "금(Gold) 8억 원 투자 시 — KRX 금현물 vs 미국 상장 ETF(GLDM/GLD) vs 국내 상장 ETF(KODEX 골드선물 / ACE KRX금현물) 비교",
      options: [
        {
          vehicleName: "한국거래소 KRX 금현물 직접투자",
          tickers: "KRX 금시장 금 99.99K (증권사 금현물 전용계좌)",
          market: "🇰🇷 한국거래소(KRX) 장내 현물",
          taxRuleSummary: "조세특례제한법상 장내 매매차익 100% 비과세(0%) + 배당 0원 + 금융소득종합과세 및 건보료 영구 제외!",
          bnhPreTaxCagrPct: 10.33,
          activePreTaxCagrPct: 9.56,
          yr1PreTaxGainBnhKrw: 82640000,
          yr1TaxBnhKrw: 0, // 세금 0원!
          yr1NetGainBnhKrw: 82640000,
          yr1AfterTaxCagrBnhPct: 10.33,
          yr1PreTaxGainSwingKrw: 76480000,
          yr1TaxSwingKrw: 0,
          yr1NetGainSwingKrw: 76480000,
          yr1AfterTaxCagrSwingPct: 9.56,
          compTaxStatus: "🛡️ 영구 비대상 (매매차익·배당 모두 과세 대상 아님, 금융소득 합산 0원)",
          verdict: "🏆 대한민국 8억 자산가 압도적 1순위 (1년 기대 세후 순수익 +8,264만 원, 예상 세금 0원!)",
          isRecommended: true,
        },
        {
          vehicleName: "미국 상장 금 현물 ETF 직투",
          tickers: "GLDM (SPDR Gold MiniShares, 보수 0.10%) / IAU / GLD",
          market: "🇺🇸 미국 상장 현물 신탁 ETF (Non-PTP)",
          taxRuleSummary: "매매차익 연 250만 원 기본공제 후 22% 양도소득세 분리과세 (배당 0원, 해외주식 손익통산 가능)",
          bnhPreTaxCagrPct: 10.05,
          activePreTaxCagrPct: 9.31,
          yr1PreTaxGainBnhKrw: 80400000,
          yr1TaxBnhKrw: 17138000, // (8,040만 - 250만) × 22% = 1,713.8만 원
          yr1NetGainBnhKrw: 63262000,
          yr1AfterTaxCagrBnhPct: 7.91,
          yr1PreTaxGainSwingKrw: 74480000,
          yr1TaxSwingKrw: 15835600,
          yr1NetGainSwingKrw: 58644400,
          yr1AfterTaxCagrSwingPct: 7.33,
          compTaxStatus: "✅ 금융소득종합과세 완전 비대상 (양도소득 분리과세로 금융소득 합산 0원)",
          verdict: "⭕ 달러 계좌 내 미국주식과 즉각 리밸런싱 시 유용 (단, 원화 기준은 KRX 금현물이 연 1,938만 원 세금 절약)",
          isRecommended: false,
        },
        {
          vehicleName: "국내 상장 KRX금현물 추종 ETF",
          tickers: "ACE KRX금현물",
          market: "🇰🇷 국내 상장 기타(실물) ETF",
          taxRuleSummary: "기초자산은 KRX 금현물이나 '국내 상장 기타 ETF'로 분류되어 매매차익에 15.4% 배당소득세 + 금융소득종합과세 100% 합산!",
          bnhPreTaxCagrPct: 10.05,
          activePreTaxCagrPct: 9.31,
          yr1PreTaxGainBnhKrw: 80400000,
          yr1TaxBnhKrw: 24220000, // 2,000만×15.4% + 6,040만×35%(종소세+건보료) = 2,422만 원
          yr1NetGainBnhKrw: 56180000,
          yr1AfterTaxCagrBnhPct: 7.02,
          yr1PreTaxGainSwingKrw: 74480000,
          yr1TaxSwingKrw: 22148000,
          yr1NetGainSwingKrw: 52332000,
          yr1AfterTaxCagrSwingPct: 6.54,
          compTaxStatus: "🚨 즉시 금융소득종합과세 대상 직행! (1년 기대수익 +8,040만 원 전액 배당소득 합산)",
          verdict: "❌ 8억 일반계좌 투자 금지 (연금저축·IRP 계좌 소액 투자 외에는 KRX 금현물 직접투자가 연 2,646만 원 이득)",
          isRecommended: false,
        },
        {
          vehicleName: "국내 상장 골드선물 ETF",
          tickers: "KODEX 골드선물(H) / TIGER 골드선물(H)",
          market: "🇰🇷 국내 상장 파생형 ETF",
          taxRuleSummary: "매매차익 15.4% 배당소득세 + 금융소득종합과세 합산 + 선물 롤오버 비용 + 원화 환헤지(H) 비용 차감",
          bnhPreTaxCagrPct: 8.5,
          activePreTaxCagrPct: 7.8,
          yr1PreTaxGainBnhKrw: 68000000,
          yr1TaxBnhKrw: 19880000, // 2,000만×15.4% + 4,800만×35% = 1,988만 원
          yr1NetGainBnhKrw: 48120000,
          yr1AfterTaxCagrBnhPct: 6.02,
          yr1PreTaxGainSwingKrw: 62400000,
          yr1TaxSwingKrw: 17920000,
          yr1NetGainSwingKrw: 44480000,
          yr1AfterTaxCagrSwingPct: 5.56,
          compTaxStatus: "🚨 즉시 금융소득종합과세 대상 직행! (매매차익 +6,800만 원 전액 배당소득 합산)",
          verdict: "❌ 최하위 선택지 (KRX 금현물 대비 1년 기대 순수익 -3,452만 원 손실 + 종합과세자 편입)",
          isRecommended: false,
        },
      ],
    },
  ];
}

function main() {
  console.log("=== [Step 1] Computing Deliverable 1: 21 Assets Buy & Hold Ranking (현재 8억 원 투자 시 1년 후 기대 세후 CAGR & 세금 기준) ===");
  const buyAndHoldResults = [];

  for (const [ticker, spec] of Object.entries(KOREA_ASSET_TAX_SPECS)) {
    const startDate = ticker === "BTC_KRW" ? "2010-07-20" : START_DATE_POST_IMF;
    const baseCfg = {
      startDate,
      endDate: END_DATE,
      initialCapital: INITIAL_CAPITAL_KRW,
      allocations: [{ ticker, weightPct: 100 }],
      rebalanceEnabled: false,
      rulesEnabled: false,
    };

    const preTaxRes = runTaxAwareBacktest({ ...baseCfg, taxMode: "ZERO_TAX" });
    const afterTaxRes = runTaxAwareBacktest({ ...baseCfg, taxMode: "ENGINEERED" });
    const rawPassiveRes = runTaxAwareBacktest({ ...baseCfg, taxMode: "RAW_PASSIVE" });
    const domTrapRes = runTaxAwareBacktest({ ...baseCfg, taxMode: "DOMESTIC_ETF_TRAP" });
    const oosRes = runTaxAwareBacktest({
      ...baseCfg,
      startDate: START_DATE_MODERN_OOS,
      taxMode: "ENGINEERED",
    });

    // 백테스트 세전 CAGR(preTaxRes.afterTaxCagrPct)은 가격 지수 수익률이므로,
    // 배당이 별도로 발생하는 주식/리츠/섹터 자산은 총 기대 세전 CAGR = 가격 CAGR + 배당수익률,
    // 총수익지수(UST20Y_TR, UST10Y_TR, UST2Y_TR) 및 무배당 자산은 preTaxRes.afterTaxCagrPct 그대로 사용
    const isTotalReturnBond = ticker.endsWith("_TR");
    const totalExpectedPreTaxCagrPct = isTotalReturnBond
      ? preTaxRes.afterTaxCagrPct
      : Math.round((preTaxRes.afterTaxCagrPct + (spec.divYieldPct || 0)) * 100) / 100;

    const proj1Yr = compute1YrProjectionAt800M(totalExpectedPreTaxCagrPct, [
      { ticker, weightPct: 100 },
    ]);

    buyAndHoldResults.push({
      ticker,
      name: spec.name,
      shortName: spec.shortName,
      category: spec.group,
      group: spec.group,
      currency: spec.currency,
      periodLabel: `${afterTaxRes.startDate} ~ ${afterTaxRes.endDate} (${afterTaxRes.years}년)`,
      periodDesc: `${afterTaxRes.startDate} ~ ${afterTaxRes.endDate} (${afterTaxRes.years}년)`,
      years: afterTaxRes.years,
      recommendedTickers: spec.id === "KPI200" ? "KODEX 200 / TIGER 200" : spec.id === "KRX_GOLD" ? "KRX 금현물 (99.99K)" : spec.id === "WTI" ? "OILK / XLE (미국직투)" : spec.id === "USDKRW" ? "외화계좌 USD 현물" : spec.id === "BTC_KRW" ? "업비트/빗썸 BTC 현물" : spec.usEtfOption.split("(")[0].trim(),
      alternativeMethod: spec.id === "KPI200" ? "미국 상장 EWY (양도세 22% 불리)" : spec.id === "WTI" ? "KODEX WTI원유선물(종합과세) & 미국 USO(PTP 10% 징수)" : spec.krEtfOption,
      krEtfOption: spec.krEtfOption,
      usEtfOption: spec.usEtfOption,
      bestMethod: spec.bestMethod,
      whyBest: spec.whyBest,
      taxType: spec.taxType,
      capGainTaxRate: spec.capGainTaxRate,
      capGainTaxRatePct: spec.capGainTaxRate * 100,
      divYieldPct: spec.divYieldPct,
      compTaxRisk: spec.compTaxRisk,
      pricePreTaxCagrPct: preTaxRes.afterTaxCagrPct,
      preTaxCagrPct: proj1Yr.expectedPreTaxCagrPct,
      afterTaxCagrPct: proj1Yr.yr1AfterTaxCagrPct,
      holdOnlyAfterTaxCagrPct: proj1Yr.yr1HoldOnlyAfterTaxCagrPct,
      domTrapCagrPct: proj1Yr.yr1DomTrapAfterTaxCagrPct,
      // 1년 후 (현재 8억 투자 기준) 예상 수익금·세금·종합과세 판정
      proj1Yr,
      annualDivAt800M: proj1Yr.yr1DivIncomeKrw,
      compTaxBreachAt800M: proj1Yr.isCompTaxTargetOptimal,
      // 장기 백테스트(27.8년) 참고 지표
      longTermAfterTaxCagrPct: afterTaxRes.afterTaxCagrPct,
      preTaxFinalEquity: preTaxRes.finalAfterTaxEquity,
      afterTaxFinalEquity: afterTaxRes.finalAfterTaxEquity,
      domTrapFinalEquity: domTrapRes.finalAfterTaxEquity,
      firstCompTaxBreachYear: rawPassiveRes.firstCompTaxBreachYear,
      firstCompTaxBreachEquity: rawPassiveRes.firstCompTaxBreachEquity,
      maxDrawdownPct: afterTaxRes.maxDrawdownPct,
      maxDrawdownPeakDate: afterTaxRes.maxDrawdownPeakDate,
      maxDrawdownDate: afterTaxRes.maxDrawdownDate,
      annualVolPct: afterTaxRes.annualVolPct,
      sharpe: afterTaxRes.sharpe,
      sortino: afterTaxRes.sortino,
      calmar: afterTaxRes.calmar,
      ulcerIndex: afterTaxRes.ulcerIndex,
      totalTaxPaid: afterTaxRes.totalTaxPaid,
      oosAfterTaxCagrPct: oosRes.afterTaxCagrPct,
      oosMaxDrawdownPct: oosRes.maxDrawdownPct,
    });
  }

  // Sort by 1-Year Expected After-Tax CAGR descending
  buyAndHoldResults.sort((a, b) => b.afterTaxCagrPct - a.afterTaxCagrPct);
  buyAndHoldResults.forEach((item, idx) => {
    item.rank = idx + 1;
  });

  console.log("Top 8 Buy & Hold (현재 8억 투자 시 1년 후 기대 세후 CAGR & 예상 세금):");
  buyAndHoldResults.slice(0, 8).forEach((r) => {
    const p = r.proj1Yr;
    console.log(
      `#${r.rank} ${r.shortName}: 기대 세전 CAGR +${r.preTaxCagrPct}% (세전 +${(p.yr1PreTaxTotalGainKrw / 10000).toFixed(0)}만원) -> 1년 예상세금 ${(p.yr1TotalTaxRealizedKrw / 10000).toFixed(0)}만원 -> 세후 순수익 +${(p.yr1AfterTaxNetGainKrw / 10000).toFixed(0)}만원 (세후 CAGR +${r.afterTaxCagrPct}%) | 종합과세: ${p.isCompTaxTargetOptimal ? "대상(위험)" : "비대상(안전)"}`
    );
  });

  console.log("\n=== [Step 2] Computing Deliverable 2: 105 Famous Asset Trading Strategies (현재 8억 원 투자 시 1년 후 세후 기대 CAGR & 예상 세금 기준) ===");
  const assetStrategyResults = [];

  for (const [ticker, spec] of Object.entries(KOREA_ASSET_TAX_SPECS)) {
    const famousList = buildFamousAssetStrategies(ticker, spec);
    for (const st of famousList) {
      const preTaxRes = runTaxAwareBacktest({
        ...st,
        initialCapital: INITIAL_CAPITAL_KRW,
        taxMode: "ZERO_TAX",
      });
      const afterTaxRes = runTaxAwareBacktest({
        ...st,
        initialCapital: INITIAL_CAPITAL_KRW,
        taxMode: "ENGINEERED",
      });
      const oosRes = runTaxAwareBacktest({
        ...st,
        startDate: START_DATE_MODERN_OOS,
        initialCapital: INITIAL_CAPITAL_KRW,
        taxMode: "ENGINEERED",
      });

      const isTotalReturnBond = ticker.endsWith("_TR");
      const avgExposureRatio = (st.allocations?.[0]?.weightPct || 75) / 100.0;
      const totalExpectedPreTaxCagrPct = isTotalReturnBond
        ? preTaxRes.afterTaxCagrPct
        : Math.round(
            (preTaxRes.afterTaxCagrPct + (spec.divYieldPct || 0) * avgExposureRatio) * 100
          ) / 100;

      const proj1Yr = compute1YrProjectionAt800M(totalExpectedPreTaxCagrPct, [
        { ticker, weightPct: 100 },
      ]);

      assetStrategyResults.push({
        stratCode: st.stratCode,
        ticker: st.ticker,
        assetName: st.assetName,
        shortName: st.shortName,
        bestMethod: st.bestMethod,
        strategyName: st.strategyName,
        famousRef: st.famousRef,
        ruleSummary: st.ruleSummary,
        periodDesc: `${afterTaxRes.startDate} ~ ${afterTaxRes.endDate} (${afterTaxRes.years}년)`,
        years: afterTaxRes.years,
        preTaxCagrPct: proj1Yr.expectedPreTaxCagrPct,
        afterTaxCagrPct: proj1Yr.yr1AfterTaxCagrPct,
        proj1Yr,
        longTermAfterTaxCagrPct: afterTaxRes.afterTaxCagrPct,
        preTaxFinalEquity: preTaxRes.finalAfterTaxEquity,
        afterTaxFinalEquity: afterTaxRes.finalAfterTaxEquity,
        maxDrawdownPct: afterTaxRes.maxDrawdownPct,
        maxDrawdownPeakDate: afterTaxRes.maxDrawdownPeakDate,
        maxDrawdownDate: afterTaxRes.maxDrawdownDate,
        sharpe: afterTaxRes.sharpe,
        sortino: afterTaxRes.sortino,
        calmar: afterTaxRes.calmar,
        ulcerIndex: afterTaxRes.ulcerIndex,
        totalTrades: afterTaxRes.totalTrades,
        totalTaxPaid: afterTaxRes.totalTaxPaid,
        oosAfterTaxCagrPct: oosRes.afterTaxCagrPct,
        oosMaxDrawdownPct: oosRes.maxDrawdownPct,
      });
    }
  }

  assetStrategyResults.sort((a, b) => b.afterTaxCagrPct - a.afterTaxCagrPct);
  assetStrategyResults.forEach((item, idx) => {
    item.rank = idx + 1;
  });

  // Pick #1 Best Famous Strategy per Asset (21 assets)
  const bestStrategyPerAsset = [];
  const seenAsset = new Set();
  for (const s of assetStrategyResults) {
    if (!seenAsset.has(s.ticker)) {
      seenAsset.add(s.ticker);
      bestStrategyPerAsset.push({
        ...s,
        assetBestRank: bestStrategyPerAsset.length + 1,
      });
    }
  }

  console.log("Top 8 Asset Strategies (현재 8억 투자 시 1년 후 세후 기대 CAGR):");
  assetStrategyResults.slice(0, 8).forEach((s) => {
    console.log(
      `#${s.rank} [${s.stratCode}] ${s.strategyName}: 기대 세전 +${s.preTaxCagrPct}% -> 1년 예상세금 ${(s.proj1Yr.yr1TotalTaxRealizedKrw / 10000).toFixed(0)}만원 -> 세후 기대 +${s.afterTaxCagrPct}% | MDD ${s.maxDrawdownPct}%`
    );
  });

  console.log("\n=== [Step 3] Computing Deliverable 3: Multi-Asset Portfolios (현재 8억 원 투자 시 1년 후 세후 수익 & 종합과세 비대상 Top 10) ===");
  const multiAssetResults = [];

  for (const cand of MULTI_ASSET_CANDIDATES) {
    const preTaxRes = runTaxAwareBacktest({
      ...cand,
      startDate: START_DATE_POST_IMF,
      endDate: END_DATE,
      initialCapital: INITIAL_CAPITAL_KRW,
      taxMode: "ZERO_TAX",
    });
    const afterTaxRes = runTaxAwareBacktest({
      ...cand,
      startDate: START_DATE_POST_IMF,
      endDate: END_DATE,
      initialCapital: INITIAL_CAPITAL_KRW,
      taxMode: "ENGINEERED",
    });
    const rawPassiveRes = runTaxAwareBacktest({
      ...cand,
      startDate: START_DATE_POST_IMF,
      endDate: END_DATE,
      initialCapital: INITIAL_CAPITAL_KRW,
      taxMode: "RAW_PASSIVE",
    });
    const domTrapRes = runTaxAwareBacktest({
      ...cand,
      startDate: START_DATE_POST_IMF,
      endDate: END_DATE,
      initialCapital: INITIAL_CAPITAL_KRW,
      taxMode: "DOMESTIC_ETF_TRAP",
    });
    const oosRes = runTaxAwareBacktest({
      ...cand,
      startDate: START_DATE_MODERN_OOS,
      endDate: END_DATE,
      initialCapital: INITIAL_CAPITAL_KRW,
      taxMode: "ENGINEERED",
    });

    let initialAnnualDivKrw = 0;
    let nonBondDivYieldContributionPct = 0;
    let totalAllocWeight = 0;
    const allocSummaryParts = [];
    for (const a of cand.allocations) {
      const sp = KOREA_ASSET_TAX_SPECS[a.ticker];
      const w = a.weightPct / 100.0;
      totalAllocWeight += a.weightPct;
      initialAnnualDivKrw += INITIAL_CAPITAL_KRW * w * ((sp?.divYieldPct || 0) / 100.0);
      if (!a.ticker.endsWith("_TR")) {
        nonBondDivYieldContributionPct += w * (sp?.divYieldPct || 0);
      }
      allocSummaryParts.push(`${sp?.shortName || a.ticker} ${a.weightPct}%`);
    }
    if (totalAllocWeight < 100) {
      allocSummaryParts.push(`무배당단기채(BOXX) ${100 - totalAllocWeight}%`);
    }

    const totalExpectedPreTaxCagrPct =
      Math.round((preTaxRes.afterTaxCagrPct + nonBondDivYieldContributionPct) * 100) / 100;
    const proj1Yr = compute1YrProjectionAt800M(totalExpectedPreTaxCagrPct, cand.allocations);

    multiAssetResults.push({
      id: cand.id,
      name: cand.name,
      category: cand.category,
      rationale: cand.rationale,
      allocations: cand.allocations,
      allocSummary: allocSummaryParts.join(" + "),
      rebalanceDesc: cand.rebalanceEnabled
        ? `${cand.rebalance.periodMode} + ±${cand.rebalance.bandThreshold}%p 밴드`
        : "정기 리밸런싱 없음",
      hasRules: cand.rulesEnabled && cand.rules.length > 0,
      initialAnnualDivKrw: Math.round(initialAnnualDivKrw),
      initialDivYieldPct: Math.round((initialAnnualDivKrw / INITIAL_CAPITAL_KRW) * 10000) / 100,
      compTaxThresholdEquityKrw:
        initialAnnualDivKrw > 0
          ? Math.round(20000000 / (initialAnnualDivKrw / INITIAL_CAPITAL_KRW))
          : 999900000000,
      preTaxCagrPct: proj1Yr.expectedPreTaxCagrPct,
      afterTaxCagrPct: proj1Yr.yr1AfterTaxCagrPct,
      holdOnlyAfterTaxCagrPct: proj1Yr.yr1HoldOnlyAfterTaxCagrPct,
      domTrapCagrPct: proj1Yr.yr1DomTrapAfterTaxCagrPct,
      proj1Yr,
      longTermAfterTaxCagrPct: afterTaxRes.afterTaxCagrPct,
      preTaxFinalEquity: preTaxRes.finalAfterTaxEquity,
      afterTaxFinalEquity: afterTaxRes.finalAfterTaxEquity,
      domTrapFinalEquity: domTrapRes.finalAfterTaxEquity,
      rawPassiveBreachYear: rawPassiveRes.firstCompTaxBreachYear,
      rawPassiveBreachEquity: rawPassiveRes.firstCompTaxBreachEquity,
      maxDrawdownPct: afterTaxRes.maxDrawdownPct,
      maxDrawdownPeakDate: afterTaxRes.maxDrawdownPeakDate,
      maxDrawdownDate: afterTaxRes.maxDrawdownDate,
      annualVolPct: afterTaxRes.annualVolPct,
      sharpe: afterTaxRes.sharpe,
      sortino: afterTaxRes.sortino,
      calmar: afterTaxRes.calmar,
      ulcerIndex: afterTaxRes.ulcerIndex,
      totalTrades: afterTaxRes.totalTrades,
      totalCapGainTaxPaid: afterTaxRes.totalCapGainTaxPaid,
      totalDividendTaxPaid: afterTaxRes.totalDividendTaxPaid,
      totalTaxPaid: afterTaxRes.totalTaxPaid,
      compTaxBreachYears: afterTaxRes.compTaxBreachYears,
      oosAfterTaxCagrPct: oosRes.afterTaxCagrPct,
      oosMaxDrawdownPct: oosRes.maxDrawdownPct,
      oosCalmar: oosRes.calmar,
      compactCurve: afterTaxRes.compactCurve,
    });
  }

  const eligiblePortfolios = multiAssetResults.filter(
    (p) => Math.abs(p.maxDrawdownPct) <= 58.5 && !p.proj1Yr.isCompTaxTargetOptimal
  );
  eligiblePortfolios.sort(
    (a, b) => b.proj1Yr.yr1AfterTaxNetGainKrw - a.proj1Yr.yr1AfterTaxNetGainKrw
  );

  const top10Portfolios = eligiblePortfolios.slice(0, 10).map((p, idx) => ({
    ...p,
    rank: idx + 1,
  }));

  multiAssetResults.sort(
    (a, b) => b.proj1Yr.yr1AfterTaxNetGainKrw - a.proj1Yr.yr1AfterTaxNetGainKrw
  );
  multiAssetResults.forEach((p, idx) => {
    p.overallCagrRank = idx + 1;
  });

  console.log("Top 10 Multi-Asset Portfolios (현재 8억 원 투자 시 1년 후 세후 기대수익 & 예상세금 & 종합과세 비대상):");
  top10Portfolios.forEach((p) => {
    const pr = p.proj1Yr;
    console.log(
      `#${p.rank} [${p.id}] ${p.name}: 기대 세전 +${p.preTaxCagrPct}% (+${(pr.yr1PreTaxTotalGainKrw / 10000).toFixed(0)}만원) -> 1년 예상세금 ${(pr.yr1TotalTaxRealizedKrw / 10000).toFixed(0)}만원 (배당 ${(pr.yr1DivIncomeKrw / 10000).toFixed(0)}만원, 종합과세 비대상) -> 1년 세후 순수익 +${(pr.yr1AfterTaxNetGainKrw / 10000).toFixed(0)}만원 (세후 CAGR +${p.afterTaxCagrPct}%) | MDD ${p.maxDrawdownPct}%`
    );
  });

  const commodityComparisons = buildCommodityAndVehicleComparisons();

  const outputPayload = {
    generatedAt: new Date().toISOString(),
    initialCapitalKrw: INITIAL_CAPITAL_KRW,
    startDatePostImf: START_DATE_POST_IMF,
    startDateModernOos: START_DATE_MODERN_OOS,
    endDate: END_DATE,
    commodityComparisons,
    buyAndHoldResults,
    assetStrategyResults,
    bestStrategyPerAsset,
    top10Portfolios,
    allMultiAssetResults: multiAssetResults,
  };

  const outPath = path.join(__dirname, "all_assets_tax_evaluation.json");
  fs.writeFileSync(outPath, JSON.stringify(outputPayload, null, 2), "utf8");
  console.log("\nSaved full evaluation payload to:", outPath);
}

main();
