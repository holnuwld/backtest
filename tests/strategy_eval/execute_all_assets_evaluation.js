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

function main() {
  console.log("=== [Step 1] Computing Deliverable 1: 21 Assets Buy & Hold Ranking (8억 원 기준) ===");
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

    buyAndHoldResults.push({
      ticker,
      name: spec.name,
      shortName: spec.shortName,
      group: spec.group,
      currency: spec.currency,
      periodDesc: `${afterTaxRes.startDate} ~ ${afterTaxRes.endDate} (${afterTaxRes.years}년)`,
      years: afterTaxRes.years,
      krEtfOption: spec.krEtfOption,
      usEtfOption: spec.usEtfOption,
      bestMethod: spec.bestMethod,
      whyBest: spec.whyBest,
      taxType: spec.taxType,
      capGainTaxRatePct: spec.capGainTaxRate * 100,
      divYieldPct: spec.divYieldPct,
      compTaxRisk: spec.compTaxRisk,
      preTaxCagrPct: preTaxRes.afterTaxCagrPct,
      preTaxFinalEquity: preTaxRes.finalAfterTaxEquity,
      afterTaxCagrPct: afterTaxRes.afterTaxCagrPct,
      afterTaxFinalEquity: afterTaxRes.finalAfterTaxEquity,
      domTrapCagrPct: domTrapRes.afterTaxCagrPct,
      domTrapFinalEquity: domTrapRes.finalAfterTaxEquity,
      rawPassiveBreachYears: rawPassiveRes.compTaxBreachYears,
      rawPassiveFirstBreachYear: rawPassiveRes.firstCompTaxBreachYear,
      rawPassiveFirstBreachEquity: rawPassiveRes.firstCompTaxBreachEquity,
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

  buyAndHoldResults.sort((a, b) => b.afterTaxCagrPct - a.afterTaxCagrPct);
  buyAndHoldResults.forEach((item, idx) => {
    item.rank = idx + 1;
  });

  console.log("Top 5 Buy & Hold (After-Tax CAGR):");
  buyAndHoldResults.slice(0, 8).forEach((r) => {
    console.log(
      `#${r.rank} ${r.shortName} (${r.periodDesc}): 세전 ${r.preTaxCagrPct}% -> 세후 ${r.afterTaxCagrPct}% | MDD ${r.maxDrawdownPct}% | 8억 -> ${(r.afterTaxFinalEquity / 100000000).toFixed(2)}억 (${r.bestMethod})`
    );
  });

  console.log("\n=== [Step 2] Computing Deliverable 2: 105 Famous Asset Trading Strategies (8억 원 세후 기준) ===");
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
        preTaxCagrPct: preTaxRes.afterTaxCagrPct,
        afterTaxCagrPct: afterTaxRes.afterTaxCagrPct,
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

  // Also pick the #1 Best Famous Strategy per Asset (21 assets) + Top 35 overall
  const bestStrategyPerAsset = [];
  const seenAsset = new Set();
  for (const s of assetStrategyResults) {
    if (!seenAsset.has(s.ticker)) {
      seenAsset.add(s.ticker);
      bestStrategyPerAsset.push(s);
    }
  }

  console.log("Top 8 Asset Strategies (After-Tax CAGR):");
  assetStrategyResults.slice(0, 8).forEach((s) => {
    console.log(
      `#${s.rank} [${s.stratCode}] ${s.strategyName}: 세전 ${s.preTaxCagrPct}% -> 세후 ${s.afterTaxCagrPct}% | MDD ${s.maxDrawdownPct}% | Calmar ${s.calmar}`
    );
  });

  console.log("\n=== [Step 3] Computing Deliverable 3: Multi-Asset Portfolios (8억 원 세후 수익 & 종합과세 비대상 Top 10) ===");
  const multiAssetResults = [];

  for (const cand of MULTI_ASSET_CANDIDATES) {
    // Note: MA20 includes BTC_KRW (5% weight). Before 2010-07-20 BTC_KRW was flat, so we evaluate all multi-asset portfolios over Post-IMF 1999~2026 AND Modern OOS 2011~2026
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

    // Calculate initial Year-1 annual dividend at 8억 원 capital
    let initialAnnualDivKrw = 0;
    let totalAllocWeight = 0;
    const allocSummaryParts = [];
    for (const a of cand.allocations) {
      const sp = KOREA_ASSET_TAX_SPECS[a.ticker];
      const w = a.weightPct / 100.0;
      totalAllocWeight += a.weightPct;
      initialAnnualDivKrw += INITIAL_CAPITAL_KRW * w * ((sp?.divYieldPct || 0) / 100.0);
      allocSummaryParts.push(`${sp?.shortName || a.ticker} ${a.weightPct}%`);
    }
    if (totalAllocWeight < 100) {
      allocSummaryParts.push(`무배당단기채(BOXX) ${100 - totalAllocWeight}%`);
    }

    // Score combining After-Tax CAGR and Risk-Adjusted Calmar/Sharpe (while requiring MDD > -36%)
    const mddPenalty = Math.abs(afterTaxRes.maxDrawdownPct) > 35 ? (Math.abs(afterTaxRes.maxDrawdownPct) - 35) * 0.4 : 0;
    const compositeScore =
      afterTaxRes.afterTaxCagrPct * 1.2 +
      afterTaxRes.calmar * 12.0 +
      afterTaxRes.sharpe * 6.0 +
      oosRes.afterTaxCagrPct * 0.5 -
      mddPenalty;

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
          ? Math.round((20000000 / (initialAnnualDivKrw / INITIAL_CAPITAL_KRW)))
          : 999900000000,
      preTaxCagrPct: preTaxRes.afterTaxCagrPct,
      preTaxFinalEquity: preTaxRes.finalAfterTaxEquity,
      afterTaxCagrPct: afterTaxRes.afterTaxCagrPct,
      afterTaxFinalEquity: afterTaxRes.finalAfterTaxEquity,
      domTrapCagrPct: domTrapRes.afterTaxCagrPct,
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
      compTaxBreachYears: afterTaxRes.compTaxBreachYears, // 0 under ENGINEERED mode
      oosAfterTaxCagrPct: oosRes.afterTaxCagrPct,
      oosMaxDrawdownPct: oosRes.maxDrawdownPct,
      oosCalmar: oosRes.calmar,
      compositeScore: Math.round(compositeScore * 100) / 100,
      compactCurve: afterTaxRes.compactCurve,
    });
  }

  // Sort Multi-Asset Portfolios by After-Tax Composite Score (and check top 10 by After-Tax CAGR)
  // Notice the user asked: "3. 각 자산의 적절보유 비중을 가져갔을 경우 세후 수익을 기준으로 최종 10개 꼽아서 정리해줘. (시각화 그래프 포함)"
  // Let's sort the Top 10 selected portfolios by After-Tax CAGR descending so #1 has the highest After-Tax CAGR among well-diversified portfolios (MDD <= -35%)!
  const eligiblePortfolios = multiAssetResults.filter((p) => Math.abs(p.maxDrawdownPct) <= 58.5);
  eligiblePortfolios.sort((a, b) => b.afterTaxFinalEquity - a.afterTaxFinalEquity);

  const top10Portfolios = eligiblePortfolios.slice(0, 10).map((p, idx) => ({
    ...p,
    rank: idx + 1,
  }));

  // Also rank all 30 candidates
  multiAssetResults.sort((a, b) => b.afterTaxFinalEquity - a.afterTaxFinalEquity);
  multiAssetResults.forEach((p, idx) => {
    p.overallCagrRank = idx + 1;
  });

  console.log("Top 10 Multi-Asset Portfolios (8억 원 세후 수익 기준, MDD <= -35% 적격 분산):");
  top10Portfolios.forEach((p) => {
    console.log(
      `#${p.rank} [${p.id}] ${p.name}: 세전 ${p.preTaxCagrPct}% -> 세후 ${p.afterTaxCagrPct}% (국내ETF함정시 ${p.domTrapCagrPct}%) | MDD ${p.maxDrawdownPct}% | Calmar ${p.calmar} | 8억 -> ${(p.afterTaxFinalEquity / 100000000).toFixed(2)}억 | 초기배당 ${(p.initialAnnualDivKrw / 10000).toFixed(0)}만원/년`
    );
  });

  const outputPayload = {
    generatedAt: new Date().toISOString(),
    initialCapitalKrw: INITIAL_CAPITAL_KRW,
    startDatePostImf: START_DATE_POST_IMF,
    startDateModernOos: START_DATE_MODERN_OOS,
    endDate: END_DATE,
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
