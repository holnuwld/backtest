/**
 * app.js
 * Main Application Controller for Multi-Asset Cross-Condition Backtester
 */
(function (global) {
  "use strict";

  const IndicatorEngine = global.IndicatorEngine;
  const BacktestEngine = global.BacktestEngine;
  const StorageManager = global.StorageManager;

  let marketData = null;
  let catalogMap = {};
  let currentConfig = null;
  let lastResult = null;
  let isLogScale = true;
  let autoSaveToScoreboard = true;
  let selectedScoreboardIds = new Set();

  // Condition Items Help Dictionary for (?) Popups
  const HELP_DICT = {
    DRAWDOWN_DAYS: {
      title: "고점 기준일 (Lookback Days)",
      content: `
        <p><strong>최고가를 탐색할 과거 기간(거래일 수)</strong>을 설정합니다.</p>
        <ul>
          <li><strong>0 입력 시:</strong> 백테스트 시작일 이후의 <strong>'역대 최고점(ATH, All-Time High)'</strong> 대비 현재 가격의 하락률(-%)을 계산합니다. 장기 대세 하락장이나 역사적 고점 대비 낙폭 과대 매수를 노릴 때 사용합니다.</li>
          <li><strong>N (예: 252) 입력 시:</strong> 최근 N 거래일(252 거래일 ≈ 1년) 동안의 최고가 대비 현재 가격의 하락률(-%)을 계산합니다. 최근 1년 고점 대비 단기/중기 조정 폭을 측정할 때 적합합니다.</li>
          <li><strong>조건 활용 팁:</strong> 하락률 수치는 <strong>음수(-%)</strong>로 계산되므로, 고점 대비 20% 이상 하락했을 때 매수하려면 연산자를 <code>&le;</code> (이하)로 하고 기준값에 <code>-20</code>을 입력합니다.</li>
        </ul>
      `,
    },
    TRANSFORM: {
      title: "파생지표 종류 (Indicator Transform)",
      content: `
        <p>원천 시계열 가격을 다양한 기술적 분석 지표로 가공하여 매매 시그널을 생성합니다.</p>
        <ul>
          <li><strong>종가(PRICE):</strong> 해당 자산/지표의 원천 수치 그대로 사용합니다.</li>
          <li><strong>단순이동평균(SMA):</strong> 최근 N 거래일 종가의 산술평균입니다.</li>
          <li><strong>지수이동평균(EMA):</strong> 최근 가격에 더 높은 가중치를 부여한 지수 이동평균선입니다.</li>
          <li><strong>이격도(DISPARITY):</strong> 현재 주가가 이동평균선 대비 몇 %에 위치하는지(100% 기준)를 나타내며, 과매수/과매도 판단에 쓰입니다.</li>
          <li><strong>볼린저밴드(BB):</strong> 이동평균선 기준 &plusmn;K배 표준편차로 상단/하단 밴드를 산출합니다.</li>
          <li><strong>RSI(상대강도지수):</strong> 14일간의 상승폭과 하락폭 비율(0~100)로 과열/침체를 진단합니다.</li>
          <li><strong>MACD:</strong> 단기(12일)와 장기(26일) 지수이동평균의 차이로 추세 방향과 반전을 포착합니다.</li>
          <li><strong>모멘텀(ROC):</strong> 최근 N일 전 대비 수익률 변화폭(%)을 측정합니다.</li>
        </ul>
      `,
    },
    OPERATOR: {
      title: "비교 / 교차 조건 (Operator)",
      content: `
        <p>좌측 지표와 우측 수치(또는 타 지표)를 비교하는 규칙입니다.</p>
        <ul>
          <li><strong>&gt; (초과), &ge; (이상), &lt; (미만), &le; (이하):</strong> 현재 시점의 단순 대소 비교입니다.</li>
          <li><strong>상향돌파(CROSS_UP):</strong> 전일에는 이하(&le;)였다가 당일 초과(&gt;)로 올라서는 순간 골든크로스를 감지합니다.</li>
          <li><strong>하향돌파(CROSS_DOWN):</strong> 전일에는 이상(&ge;)이었다가 당일 미만(&lt;)으로 떨어지는 데드크로스를 감지합니다.</li>
          <li><strong>볼린저밴드 상/하단 터치:</strong> 주가가 볼린저 상단 이상이거나 하단 이하로 접촉한 상태를 감지합니다.</li>
          <li><strong>MACD 골든/데드크로스:</strong> MACD 히스토그램이 0선을 상향/하향 돌파하는 모멘텀 전환 시점입니다.</li>
        </ul>
      `,
    },
    SIZING_MODE: {
      title: "매수 / 매도 주문 기준 (Sizing Mode)",
      content: `
        <p>체결 시 주문할 주식 수량을 어떤 기준으로 산정할지 결정합니다.</p>
        <ul>
          <li><strong>포트폴리오 총액 대비 비율 (TOTAL_PCT):</strong> 현재 전체 자산(현금 + 모든 보유자산) 평가액의 특정 %만큼 매수/매도합니다. (예: 총자산의 20% 매수)</li>
          <li><strong>잔액 대비 비율 (BALANCE_PCT):</strong> 매수 시에는 <strong>'보유 현금'</strong>의 특정 %, 매도 시에는 <strong>'해당 자산 보유량'</strong>의 특정 %만큼 체결합니다. (예: 보유잔액의 50% 분할 매도)</li>
          <li><strong>고정 금액 (AMOUNT):</strong> 지정한 <strong>원화(₩)</strong> 금액만큼 정액 매수/매도합니다. (예: 1,000,000원 매수)</li>
          <li><strong>전량 매도 (SELL_ALL):</strong> 보유 중인 해당 자산을 100% 전량 청산하여 현금화합니다.</li>
        </ul>
      `,
    },
    FUNDING_SOURCE: {
      title: "매수 재원 및 충당 방식 (Funding Source)",
      content: `
        <p>매수 주문 시 보유 현금이 부족할 경우 어떻게 매수 자금을 조달할지 지정합니다.</p>
        <ul>
          <li><strong>현금 우선 + 부족분 타자산 비례매도:</strong> 현금을 먼저 쓰고, 모자란 금액은 포트폴리오의 다른 보유 자산들을 비례적으로 분할 매도하여 채웁니다.</li>
          <li><strong>보유 현금 한도 내에서만 매수:</strong> 보유 중인 여유 현금(Cash)을 초과하는 주문은 체결되지 않습니다.</li>
          <li><strong>특정 자산 매도 대금으로 충당:</strong> 특정 자산(예: 국채 TLT 또는 금)을 매도하여 해당 대금으로 대상 자산을 교차 매수(스위칭)합니다.</li>
        </ul>
      `,
    },
    COOLDOWN: {
      title: "재발동 대기일 (Cooldown Days)",
      content: `
        <p>규칙이 한 번 발동하여 주문이 체결된 후, <strong>동일한 규칙이 다시 실행되기까지 대기해야 하는 최소 거래일 수</strong>입니다.</p>
        <p>연속적인 신호 발생으로 인해 매 거래일마다 과도하게 주문이 반복 체결되거나 불필요한 거래 수수료가 누적되는 것을 방지합니다. 보통 5~20 거래일 설정을 권장합니다.</p>
      `,
    },
    BENCHMARK: {
      title: "비교 벤치마크 자산",
      content: `
        <p>포트폴리오의 투자 성과(누적 수익률, CAGR, MDD, 샤프지수 등)를 1:1로 비교 평가할 기준 자산입니다.</p>
        <p>모든 달러 자산(S&P 500, 나스닥 등)은 당일 원달러 환율이 반영된 원화 환산 총수익률 곡선으로 동일하게 평가되므로 정확한 상대 성과(알파)를 확인할 수 있습니다.</p>
      `,
    },
    REBALANCE_COND: {
      title: "리밸런싱 발동 조건",
      content: `
        <p>포트폴리오가 목표 비중에서 이탈했을 때 원래 목표 비율로 되돌리는 규칙입니다.</p>
        <ul>
          <li><strong>주기적 리밸런싱:</strong> 매월 초, 매분기 초, 매년 초 등 정해진 시간 간격마다 정기적으로 리밸런싱합니다.</li>
          <li><strong>비율초과량(밴드) 리밸런싱:</strong> 특정 자산의 실제 비중이 목표 비중 대비 허용 한도(예: &plusmn;10%p) 이상 크게 벗어났을 때 즉시 발동합니다.</li>
        </ul>
      `,
    },
  };

  function openHelpModal(key) {
    const item = HELP_DICT[key] || { title: "안내", content: "상세 내용이 없습니다." };
    const modal = document.getElementById("helpModal");
    const titleEl = document.getElementById("helpModalTitle");
    const bodyEl = document.getElementById("helpModalBody");
    if (!modal || !titleEl || !bodyEl) return;
    titleEl.innerHTML = item.title;
    bodyEl.innerHTML = item.content;
    modal.style.display = "flex";
  }

  function closeHelpModal() {
    const modal = document.getElementById("helpModal");
    if (modal) modal.style.display = "none";
  }

  // Chart instances
  const charts = {
    equity: null,
    drawdown: null,
    weights: null,
    yearly: null,
    scoreboardOverlay: null,
    catalogPreview: null,
  };

  // Built-in Strategy Presets
  const STRATEGY_PRESETS = [
    {
      id: "preset_yield_curve_ndx",
      title: "📈 10Y-2Y 장단기 금리차 + 나스닥/국채 교차전략",
      desc: "금리차 역전 시 장기채 방어 비중 확대, 금리차 정상화(>0) 또는 나스닥 200일선 돌파 시 나스닥 100 매수",
      config: {
        name: "10Y-2Y 금리차 & 나스닥/국채 스위칭",
        initialCapital: 10000000,
        startDate: "1980-01-02",
        endDate: "2026-10-27",
        executionLag: 1,
        feeRatePct: 0.05,
        cashYieldMode: "US3M",
        benchmarkTicker: "SPX",
        allocations: [
          { ticker: "NDX", weightPct: 60 },
          { ticker: "UST10Y_TR", weightPct: 30 },
          { ticker: "GOLD", weightPct: 10 },
        ],
        rebalance: {
          periodMode: "QUARTERLY",
          customDays: 60,
          bandMode: "ABS_PP",
          bandThreshold: 10,
        },
        rules: [
          {
            id: "r_yc_inv",
            name: "장단기 금리차 역전 & 나스닥 약세 시 나스닥 축소",
            enabled: true,
            logic: "AND",
            cooldownDays: 20,
            conditions: [
              {
                left: { ticker: "T10Y2Y", transform: "PRICE", p1: 20, p2: 2, p3: 9 },
                operator: "<",
                rightMode: "VALUE",
                rightValue: 0,
              },
              {
                left: { ticker: "NDX", transform: "DISPARITY", p1: 200, p2: 2, p3: 9 },
                operator: "<",
                rightMode: "VALUE",
                rightValue: 98,
              },
            ],
            action: {
              type: "SELL",
              targetTicker: "NDX",
              sizingMode: "BALANCE_PCT",
              sizingValue: 40,
              fundingSource: "CASH_THEN_PRORATA",
            },
          },
          {
            id: "r_yc_ steep",
            name: "금리차 정상화(>0.2%p) & MACD 골든크로스 시 나스닥 매수",
            enabled: true,
            logic: "AND",
            cooldownDays: 15,
            conditions: [
              {
                left: { ticker: "T10Y2Y", transform: "PRICE", p1: 20, p2: 2, p3: 9 },
                operator: ">",
                rightMode: "VALUE",
                rightValue: 0.2,
              },
              {
                left: { ticker: "NDX", transform: "PRICE", p1: 12, p2: 26, p3: 9 },
                operator: "MACD_GOLDEN",
                rightMode: "VALUE",
                rightValue: 0,
              },
            ],
            action: {
              type: "BUY",
              targetTicker: "NDX",
              sizingMode: "BALANCE_PCT",
              sizingValue: 50,
              fundingSource: "CASH_THEN_PRORATA",
            },
          },
        ],
      },
    },
    {
      id: "preset_bb_rsi_ndx",
      title: "🎯 볼린저밴드 하단터치 + RSI 과매도 매수 / 상단 차익실현",
      desc: "나스닥100 볼린저밴드(20,2σ) 하단 터치 또는 RSI(14)≤30 과매도 시 현금/채권 재원으로 매수, 상단 돌파 & RSI≥75 시 일부 차익실현",
      config: {
        name: "나스닥 볼린저밴드 상하단 + RSI 스윙",
        initialCapital: 10000000,
        startDate: "1985-01-02",
        endDate: "2026-10-27",
        executionLag: 1,
        feeRatePct: 0.05,
        cashYieldMode: "US3M",
        benchmarkTicker: "SPX",
        allocations: [
          { ticker: "NDX", weightPct: 55 },
          { ticker: "UST10Y_TR", weightPct: 35 },
          { ticker: "UST2Y_TR", weightPct: 10 },
        ],
        rebalance: {
          periodMode: "SEMIANNUAL",
          customDays: 60,
          bandMode: "ABS_PP",
          bandThreshold: 12,
        },
        rules: [
          {
            id: "r_bb_low",
            name: "볼린저 하단 터치 OR RSI(14)≤32 과매도 매수",
            enabled: true,
            logic: "OR",
            cooldownDays: 10,
            conditions: [
              {
                left: { ticker: "NDX", transform: "PRICE", p1: 20, p2: 2, p3: 9 },
                operator: "BB_LOWER_TOUCH",
                rightMode: "VALUE",
                rightValue: 0,
              },
              {
                left: { ticker: "NDX", transform: "RSI", p1: 14, p2: 2, p3: 9 },
                operator: "<=",
                rightMode: "VALUE",
                rightValue: 32,
              },
            ],
            action: {
              type: "BUY",
              targetTicker: "NDX",
              sizingMode: "TOTAL_PCT",
              sizingValue: 15,
              fundingSource: "UST10Y_TR",
            },
          },
          {
            id: "r_bb_high",
            name: "볼린저 상단 터치 AND RSI(14)≥76 과열 시 일부 매도",
            enabled: true,
            logic: "AND",
            cooldownDays: 15,
            conditions: [
              {
                left: { ticker: "NDX", transform: "PRICE", p1: 20, p2: 2, p3: 9 },
                operator: "BB_UPPER_TOUCH",
                rightMode: "VALUE",
                rightValue: 0,
              },
              {
                left: { ticker: "NDX", transform: "RSI", p1: 14, p2: 2, p3: 9 },
                operator: ">=",
                rightMode: "VALUE",
                rightValue: 76,
              },
            ],
            action: {
              type: "SELL",
              targetTicker: "NDX",
              sizingMode: "BALANCE_PCT",
              sizingValue: 20,
              fundingSource: "CASH_THEN_PRORATA",
            },
          },
        ],
      },
    },
    {
      id: "preset_vix_pcr_soxx",
      title: "⚡ VIX 공포(>30) & Put/Call(>1.1) 반도체(SOXX) 역발상 매수",
      desc: "시장 극단적 공포(VIX≥30 및 Put/Call Ratio≥1.10) 발생 시 반도체(SOXX) 집중 매수, VIX 안정화 및 이격도 과열 시 리밸런싱",
      config: {
        name: "VIX & Put/Call 공포지수 역발상 반도체 전략",
        initialCapital: 10000000,
        startDate: "1990-01-02",
        endDate: "2026-10-27",
        executionLag: 1,
        feeRatePct: 0.05,
        cashYieldMode: "US3M",
        benchmarkTicker: "SPX",
        allocations: [
          { ticker: "SPX", weightPct: 40 },
          { ticker: "SOXX", weightPct: 30 },
          { ticker: "UST10Y_TR", weightPct: 30 },
        ],
        rebalance: {
          periodMode: "QUARTERLY",
          customDays: 60,
          bandMode: "ABS_PP",
          bandThreshold: 8,
        },
        rules: [
          {
            id: "r_vix_panic",
            name: "VIX ≥ 30 & Put/Call ≥ 1.10 패닉 시 SOXX 공격 매수",
            enabled: true,
            logic: "AND",
            cooldownDays: 10,
            conditions: [
              {
                left: { ticker: "VIX", transform: "PRICE", p1: 20, p2: 2, p3: 9 },
                operator: ">=",
                rightMode: "VALUE",
                rightValue: 30,
              },
              {
                left: { ticker: "PCR", transform: "PRICE", p1: 20, p2: 2, p3: 9 },
                operator: ">=",
                rightMode: "VALUE",
                rightValue: 1.1,
              },
            ],
            action: {
              type: "BUY",
              targetTicker: "SOXX",
              sizingMode: "TOTAL_PCT",
              sizingValue: 20,
              fundingSource: "UST10Y_TR",
            },
          },
          {
            id: "r_soxx_overheat",
            name: "SOXX 60일 이격도 ≥ 120% 단기과열 시 25% 차익실현",
            enabled: true,
            logic: "AND",
            cooldownDays: 20,
            conditions: [
              {
                left: { ticker: "SOXX", transform: "DISPARITY", p1: 60, p2: 2, p3: 9 },
                operator: ">=",
                rightMode: "VALUE",
                rightValue: 120,
              },
            ],
            action: {
              type: "SELL",
              targetTicker: "SOXX",
              sizingMode: "BALANCE_PCT",
              sizingValue: 25,
              fundingSource: "CASH_THEN_PRORATA",
            },
          },
        ],
      },
    },
    {
      id: "preset_disparity_macd",
      title: "📐 200일 이격도 + MACD 시그널 추세추종 & 눌림목 매수",
      desc: "S&P500·나스닥100의 200일 이격도가 90% 이하일 때 저가매수, 이격도 100% 이상 상승추세 + MACD 골든크로스 시 비중확대",
      config: {
        name: "200일 이격도 & MACD 하이브리드 전략",
        initialCapital: 10000,
        startDate: "1975-01-02",
        endDate: "2026-10-27",
        executionLag: 1,
        feeRatePct: 0.05,
        cashYieldMode: "US3M",
        benchmarkTicker: "SPX",
        allocations: [
          { ticker: "SPX", weightPct: 40 },
          { ticker: "NDX", weightPct: 30 },
          { ticker: "UST10Y_TR", weightPct: 20 },
          { ticker: "GOLD", weightPct: 10 },
        ],
        rebalance: {
          periodMode: "YEARLY",
          customDays: 60,
          bandMode: "ABS_PP",
          bandThreshold: 8,
        },
        rules: [
          {
            id: "r_disp_oversold",
            name: "나스닥 200일 이격도 ≤ 88% 극단적 과매도 시 저가매수",
            enabled: true,
            logic: "AND",
            cooldownDays: 15,
            conditions: [
              {
                left: { ticker: "NDX", transform: "DISPARITY", p1: 200, p2: 2, p3: 9 },
                operator: "<=",
                rightMode: "VALUE",
                rightValue: 88,
              },
            ],
            action: {
              type: "BUY",
              targetTicker: "NDX",
              sizingMode: "TOTAL_PCT",
              sizingValue: 15,
              fundingSource: "CASH_THEN_PRORATA",
            },
          },
          {
            id: "r_macd_trend",
            name: "S&P500 200일 이격도 ≥ 100% & MACD 골든크로스 시 매수",
            enabled: true,
            logic: "AND",
            cooldownDays: 20,
            conditions: [
              {
                left: { ticker: "SPX", transform: "DISPARITY", p1: 200, p2: 2, p3: 9 },
                operator: ">=",
                rightMode: "VALUE",
                rightValue: 100,
              },
              {
                left: { ticker: "SPX", transform: "PRICE", p1: 12, p2: 26, p3: 9 },
                operator: "MACD_GOLDEN",
                rightMode: "VALUE",
                rightValue: 0,
              },
            ],
            action: {
              type: "BUY",
              targetTicker: "NDX",
              sizingMode: "BALANCE_PCT",
              sizingValue: 40,
              fundingSource: "UST10Y_TR",
            },
          },
        ],
      },
    },
    {
      id: "preset_allweather_band",
      title: "🛡️ 올웨더 멀티에셋 (1970~현재) + 5%p 밴드 리밸런싱",
      desc: "S&P500 30% + 나스닥 15% + 미국장기채(TLT) 30% + 중기채(IEF) 10% + 금(Gold) 15% 배분 및 ±5%p 비율초과 시 자동 리밸런싱",
      config: {
        name: "올웨더 멀티에셋 + ±5%p 밴드 리밸런싱 (1970~)",
        initialCapital: 10000000,
        startDate: "1970-01-02",
        endDate: "2026-10-27",
        executionLag: 1,
        feeRatePct: 0.05,
        cashYieldMode: "US3M",
        benchmarkTicker: "SPX",
        allocations: [
          { ticker: "SPX", weightPct: 30 },
          { ticker: "NDX", weightPct: 15 },
          { ticker: "UST20Y_TR", weightPct: 30 },
          { ticker: "UST10Y_TR", weightPct: 10 },
          { ticker: "GOLD", weightPct: 15 },
        ],
        rebalance: {
          periodMode: "NONE",
          customDays: 60,
          bandMode: "ABS_PP",
          bandThreshold: 5,
        },
        rules: [],
      },
    },
    {
      id: "preset_dxy_macro",
      title: "💵 달러인덱스(DXY) & 금리 모멘텀 기반 매크로 로테이션",
      desc: "달러인덱스(DXY)와 10년물 금리가 60일선 하향돌파 시 기술/반도체 비중 확대, 급등 시 금/단기채 방어",
      config: {
        name: "달러(DXY) & 10Y금리 모멘텀 매크로 로테이션",
        initialCapital: 10000000,
        startDate: "1980-01-02",
        endDate: "2026-10-27",
        executionLag: 1,
        feeRatePct: 0.05,
        cashYieldMode: "US3M",
        benchmarkTicker: "SPX",
        allocations: [
          { ticker: "NDX", weightPct: 35 },
          { ticker: "XLK", weightPct: 25 },
          { ticker: "UST10Y_TR", weightPct: 25 },
          { ticker: "GOLD", weightPct: 15 },
        ],
        rebalance: {
          periodMode: "QUARTERLY",
          customDays: 60,
          bandMode: "ABS_PP",
          bandThreshold: 10,
        },
        rules: [
          {
            id: "r_dxy_weak",
            name: "DXY 60일 이격도 ≤ 98% & 10Y금리 하락추세 시 XLK 매수",
            enabled: true,
            logic: "AND",
            cooldownDays: 20,
            conditions: [
              {
                left: { ticker: "DXY", transform: "DISPARITY", p1: 60, p2: 2, p3: 9 },
                operator: "<=",
                rightMode: "VALUE",
                rightValue: 98,
              },
              {
                left: { ticker: "US10Y", transform: "DIFF", p1: 20, p2: 2, p3: 9 },
                operator: "<",
                rightMode: "VALUE",
                rightValue: 0,
              },
            ],
            action: {
              type: "BUY",
              targetTicker: "XLK",
              sizingMode: "TOTAL_PCT",
              sizingValue: 15,
              fundingSource: "UST10Y_TR",
            },
          },
          {
            id: "r_yield_spike",
            name: "10Y 금리 60일 변화폭 > +0.6%p 급등 시 금/단기채 방어",
            enabled: true,
            logic: "AND",
            cooldownDays: 20,
            conditions: [
              {
                left: { ticker: "US10Y", transform: "DIFF", p1: 60, p2: 2, p3: 9 },
                operator: ">",
                rightMode: "VALUE",
                rightValue: 0.6,
              },
            ],
            action: {
              type: "BUY",
              targetTicker: "UST2Y_TR",
              sizingMode: "TOTAL_PCT",
              sizingValue: 15,
              fundingSource: "NDX",
            },
          },
        ],
      },
    },
    {
      id: "preset_korea_btc_multi",
      title: "🪙 비트코인(BTC/KRW) & 코스피200 & KRX금 글로벌 멀티에셋",
      desc: "비트코인(BTC/KRW) 10% + 코스피200 20% + S&P500 25% + KRX금 15% + 미국채10Y 25% 배분 및 BTC 달러(BTC_USD) 50일선 추세추종 교차매매",
      config: {
        name: "한국형 글로벌 멀티에셋 (BTC+KOSPI+KRX금+미국채)",
        initialCapital: 10000000,
        startDate: "2018-01-02",
        endDate: "2026-10-27",
        executionLag: 1,
        feeRatePct: 0.05,
        cashYieldMode: "US3M",
        benchmarkTicker: "SPX",
        allocations: [
          { ticker: "SPX", weightPct: 25 },
          { ticker: "KPI200", weightPct: 20 },
          { ticker: "KRX_GOLD", weightPct: 15 },
          { ticker: "UST10Y_TR", weightPct: 25 },
          { ticker: "BTC_KRW", weightPct: 10 },
        ],
        rebalance: {
          periodMode: "QUARTERLY",
          customDays: 60,
          bandMode: "ABS_PP",
          bandThreshold: 8,
        },
        rules: [
          {
            id: "r_btc_trend_buy",
            name: "BTC 달러가격(BTC_USD) 50일 이동평균 상향돌파 시 비트코인 10% 추가매수",
            enabled: true,
            logic: "AND",
            cooldownDays: 15,
            conditions: [
              {
                left: { ticker: "BTC_USD", transform: "PRICE", p1: 20, p2: 2, p3: 9 },
                operator: "CROSS_UP",
                rightMode: "INDICATOR",
                rightIndicator: { ticker: "BTC_USD", transform: "SMA", p1: 50, p2: 2, p3: 9 },
              },
            ],
            action: {
              type: "BUY",
              targetTicker: "BTC_KRW",
              sizingMode: "TOTAL_PCT",
              sizingValue: 10,
              fundingSource: "UST10Y_TR",
            },
          },
          {
            id: "r_btc_rsi_profit",
            name: "BTC_USD RSI(14) ≥ 80 과열 시 비트코인 30% 차익실현",
            enabled: true,
            logic: "AND",
            cooldownDays: 15,
            conditions: [
              {
                left: { ticker: "BTC_USD", transform: "RSI", p1: 14, p2: 2, p3: 9 },
                operator: ">=",
                rightMode: "VALUE",
                rightValue: 80,
              },
            ],
            action: {
              type: "SELL",
              targetTicker: "BTC_KRW",
              sizingMode: "BALANCE_PCT",
              sizingValue: 30,
              fundingSource: "CASH_THEN_PRORATA",
            },
          },
        ],
      },
    },
  ];

  // Initialize app
  async function initApp() {
    if (!global.DEFAULT_MARKET_DATA) {
      showToast("데이터 파일(data/market_data.js)을 찾을 수 없습니다.", "danger");
      return;
    }

    // Deep clone base catalog and merge custom series from IndexedDB
    marketData = {
      ...global.DEFAULT_MARKET_DATA,
      catalog: [...global.DEFAULT_MARKET_DATA.catalog],
      series: { ...global.DEFAULT_MARKET_DATA.series },
    };

    const customList = await StorageManager.getAllCustomSeries();
    customList.forEach((c) => {
      if (c && c.id && Array.isArray(c.values) && c.values.length === marketData.dates.length) {
        marketData.series[c.id] = c.values;
        const existingIdx = marketData.catalog.findIndex((x) => x.id === c.id);
        const meta = {
          id: c.id,
          name: c.name,
          shortName: c.shortName || c.name,
          category: c.category || "asset",
          group: c.category === "indicator" ? "사용자 추가 지표 (CSV)" : "사용자 추가 자산 (CSV)",
          unit: c.unit || "$",
          actualStart: c.actualStart || marketData.dates[0],
          desc: c.desc || "사용자 CSV 업로드 데이터",
          startValue: c.values[0],
          endValue: c.values[c.values.length - 1],
          isCustom: true,
        };
        if (existingIdx >= 0) marketData.catalog[existingIdx] = meta;
        else marketData.catalog.push(meta);
      }
    });

    rebuildCatalogMap();
    bindGlobalEvents();
    renderPresets();
    renderBenchmarkOptions();
    renderCatalogTab();

    // Seed initial scoreboard if empty so the user immediately has a rich comparison board
    let sb = StorageManager.loadScoreboard();
    if (sb.length === 0) {
      seedInitialScoreboard();
    } else {
      updateScoreboardBadge();
    }

    // Load default preset (#1) and run initial backtest without duplicating scoreboard entry
    loadConfigIntoUI(STRATEGY_PRESETS[0].config);
    executeCurrentBacktest(false);
    renderScoreboardTab();
  }

  function rebuildCatalogMap() {
    catalogMap = {};
    marketData.catalog.forEach((item) => {
      catalogMap[item.id] = item;
    });
  }

  function seedInitialScoreboard() {
    // Run top 4 presets silently and store in scoreboard for instant comparison
    const toSeed = [STRATEGY_PRESETS[4], STRATEGY_PRESETS[3], STRATEGY_PRESETS[1], STRATEGY_PRESETS[0]];
    toSeed.forEach((p) => {
      try {
        const res = BacktestEngine.runBacktest(marketData, p.config);
        StorageManager.addScoreboardEntry(res, p.config.name);
      } catch (e) {
        console.warn("Seed preset failed:", e);
      }
    });
    updateScoreboardBadge();
  }

  function updateScoreboardBadge() {
    const sb = StorageManager.loadScoreboard();
    const badges = document.querySelectorAll(".js-sb-count");
    badges.forEach((b) => {
      b.textContent = sb.length;
    });
  }

  function showToast(msg, type = "info") {
    const container = document.getElementById("toastContainer");
    if (!container) return;
    const el = document.createElement("div");
    el.className = "toast";
    if (type === "success") el.style.borderLeftColor = "#10b981";
    if (type === "danger") el.style.borderLeftColor = "#ef4444";
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => {
      el.remove();
    }, 3200);
  }

  // Option builders separating Tradable Assets vs Signal Indicators
  function buildTradableAssetOptionsHTML(selectedTicker) {
    const assets = marketData.catalog.filter((c) => c.category === "asset");
    const groups = {};
    assets.forEach((a) => {
      const g = a.group || "기타 매매자산";
      if (!groups[g]) groups[g] = [];
      groups[g].push(a);
    });
    let html = "";
    Object.keys(groups).forEach((gName) => {
      html += `<optgroup label="📈 ${gName}">`;
      groups[gName].forEach((a) => {
        const sel = a.id === selectedTicker ? "selected" : "";
        html += `<option value="${a.id}" ${sel}>${a.name} (${a.id})</option>`;
      });
      html += `</optgroup>`;
    });
    return html;
  }

  function buildAllSeriesOptionsHTML(selectedTicker) {
    const indicators = marketData.catalog.filter((c) => c.category === "indicator");
    const assets = marketData.catalog.filter((c) => c.category === "asset");

    let html = `<optgroup label="📊 시그널 전용 지표 (금리·환율·변동성·심리)">`;
    indicators.forEach((ind) => {
      const sel = ind.id === selectedTicker ? "selected" : "";
      html += `<option value="${ind.id}" ${sel}>[지표] ${ind.name}</option>`;
    });
    html += `</optgroup>`;

    const groups = {};
    assets.forEach((a) => {
      const g = a.group || "매매자산";
      if (!groups[g]) groups[g] = [];
      groups[g].push(a);
    });
    Object.keys(groups).forEach((gName) => {
      html += `<optgroup label="💹 매매 가능 자산 - ${gName}">`;
      groups[gName].forEach((a) => {
        const sel = a.id === selectedTicker ? "selected" : "";
        html += `<option value="${a.id}" ${sel}>[자산] ${a.name}</option>`;
      });
      html += `</optgroup>`;
    });
    return html;
  }

  function buildTransformOptionsHTML(selectedTransform) {
    const list = [
      { v: "PRICE", label: "현재값 / 종가 (Raw Value)" },
      { v: "SMA", label: "단순이동평균선 (SMA N일)" },
      { v: "EMA", label: "지수이동평균선 (EMA N일)" },
      { v: "DISPARITY", label: "이격도 (N일선 대비 %, 100기준)" },
      { v: "RSI", label: "RSI 상대강도지수 (N일, 0~100)" },
      { v: "BB_PCT_B", label: "볼린저밴드 %B (하단=0, 상단=100)" },
      { v: "BB_UPPER", label: "볼린저밴드 상단선 가격 (N일, Kσ)" },
      { v: "BB_LOWER", label: "볼린저밴드 하단선 가격 (N일, Kσ)" },
      { v: "BB_WIDTH", label: "볼린저밴드 폭 (Band Width %)" },
      { v: "MACD_LINE", label: "MACD 선 (Fast, Slow, Signal)" },
      { v: "MACD_SIGNAL", label: "MACD 시그널선 (Fast, Slow, Signal)" },
      { v: "MACD_HIST", label: "MACD 히스토그램 (MACD - Signal)" },
      { v: "DRAWDOWN", label: "고점 대비 하락률 (Drawdown %)" },
      { v: "ROC", label: "모멘텀 수익률 (최근 N일 변화율 %)" },
      { v: "DIFF", label: "최근 N일 변화폭 (금리/스프레드 증감)" },
      { v: "SPREAD", label: "두 자산/지표 간 차이 (A - B)" },
      { v: "RATIO", label: "두 자산/지표 간 비율 (A ÷ B)" },
    ];
    return list
      .map((item) => `<option value="${item.v}" ${item.v === selectedTransform ? "selected" : ""}>${item.label}</option>`)
      .join("");
  }

  function buildOperatorOptionsHTML(selectedOp) {
    const list = [
      { v: ">", label: "> (초과)" },
      { v: ">=", label: "≥ (이상)" },
      { v: "<", label: "< (미만)" },
      { v: "<=", label: "≤ (이하)" },
      { v: "CROSS_UP", label: "↗ 상향 돌파 (골든크로스 / 돌파)" },
      { v: "CROSS_DOWN", label: "↘ 하향 돌파 (데드크로스 / 이탈)" },
      { v: "BB_LOWER_TOUCH", label: "💧 볼린저밴드 하단 터치/이탈 (≤ 하단)" },
      { v: "BB_UPPER_TOUCH", label: "🔥 볼린저밴드 상단 터치/돌파 (≥ 상단)" },
      { v: "BB_LOWER_CROSS", label: "⚡ 볼린저밴드 하단 하향돌파" },
      { v: "BB_UPPER_CROSS", label: "⚡ 볼린저밴드 상단 상향돌파" },
      { v: "MACD_GOLDEN", label: "🌟 MACD 골든크로스 (시그널 상향돌파)" },
      { v: "MACD_DEAD", label: "🌑 MACD 데드크로스 (시그널 하향돌파)" },
    ];
    return list
      .map((item) => `<option value="${item.v}" ${item.v === selectedOp ? "selected" : ""}>${item.label}</option>`)
      .join("");
  }

  function renderBenchmarkOptions() {
    const sel = document.getElementById("cfgBenchmark");
    if (!sel) return;
    sel.innerHTML = buildTradableAssetOptionsHTML("SPX");
  }

  function renderPresets() {
    const container = document.getElementById("presetContainer");
    if (!container) return;
    container.innerHTML = STRATEGY_PRESETS.map(
      (p, idx) => `
      <button type="button" class="preset-card" data-preset-idx="${idx}">
        <div class="preset-card-title">${p.title}</div>
        <div class="preset-card-desc">${p.desc}</div>
      </button>
    `
    ).join("");

    container.querySelectorAll(".preset-card").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-preset-idx"), 10);
        const preset = STRATEGY_PRESETS[idx];
        if (preset) {
          loadConfigIntoUI(preset.config);
          executeCurrentBacktest(true);
          showToast(`프리셋 [${preset.config.name}] 적용 및 실행 완료!`, "success");
        }
      });
    });
  }

  function updateToggleUI() {
    const rebCheck = document.getElementById("toggleRebalance")?.checked !== false;
    const rebBadge = document.getElementById("badgeRebalanceStatus");
    if (rebBadge) {
      rebBadge.textContent = rebCheck ? "활성" : "비활성";
      rebBadge.className = `toggle-status-badge ${rebCheck ? "on" : "off"}`;
    }

    const rulesCheck = document.getElementById("toggleRules")?.checked !== false;
    const rulesBadge = document.getElementById("badgeRulesStatus");
    if (rulesBadge) {
      rulesBadge.textContent = rulesCheck ? "활성" : "비활성";
      rulesBadge.className = `toggle-status-badge ${rulesCheck ? "on" : "off"}`;
    }
  }

  function loadConfigIntoUI(cfg) {
    currentConfig = JSON.parse(JSON.stringify(cfg));
    document.getElementById("cfgName").value = currentConfig.name || "나의 백테스트 전략";
    document.getElementById("cfgCapital").value = currentConfig.initialCapital || 10000000;
    document.getElementById("cfgStartDate").value = currentConfig.startDate || marketData.startDate;
    document.getElementById("cfgEndDate").value = currentConfig.endDate || marketData.endDate;
    document.getElementById("cfgLag").value = String(currentConfig.executionLag ?? 1);
    document.getElementById("cfgFee").value = currentConfig.feeRatePct ?? 0.05;
    document.getElementById("cfgCashYield").value = currentConfig.cashYieldMode || "US3M";
    document.getElementById("cfgBenchmark").value = currentConfig.benchmarkTicker || "SPX";

    const toggleReb = document.getElementById("toggleRebalance");
    if (toggleReb) {
      toggleReb.checked = currentConfig.rebalanceEnabled !== false;
    }
    const toggleRul = document.getElementById("toggleRules");
    if (toggleRul) {
      toggleRul.checked = currentConfig.rulesEnabled !== false;
    }
    updateToggleUI();

    const reb = currentConfig.rebalance || {};
    document.getElementById("cfgRebPeriod").value = reb.periodMode || "QUARTERLY";
    document.getElementById("cfgRebCustomDays").value = reb.customDays || 60;
    document.getElementById("cfgRebBandMode").value = reb.bandMode || "NONE";
    document.getElementById("cfgRebBandVal").value = reb.bandThreshold ?? 5;
    toggleRebalanceSubInputs();

    renderAllocationsUI();
    renderRulesUI();
  }

  function toggleRebalanceSubInputs() {
    const pMode = document.getElementById("cfgRebPeriod").value;
    const bMode = document.getElementById("cfgRebBandMode").value;
    document.getElementById("wrapRebCustomDays").style.display = pMode === "CUSTOM_DAYS" ? "flex" : "none";
    document.getElementById("wrapRebBandVal").style.display = bMode !== "NONE" ? "flex" : "none";
  }

  // Allocations UI
  function renderAllocationsUI() {
    const listEl = document.getElementById("allocList");
    if (!listEl) return;
    const allocs = currentConfig.allocations || [];

    listEl.innerHTML = allocs
      .map(
        (item, idx) => `
      <div class="alloc-item" data-idx="${idx}">
        <select class="form-control js-alloc-ticker" data-idx="${idx}">
          ${buildTradableAssetOptionsHTML(item.ticker)}
        </select>
        <div style="display:flex;align-items:center;gap:4px;">
          <input type="number" class="form-control js-alloc-weight" data-idx="${idx}" min="0" max="100" step="1" value="${item.weightPct}" />
          <span style="font-size:12px;color:var(--text-muted);">%</span>
        </div>
        <button type="button" class="btn btn-danger btn-sm js-alloc-del" data-idx="${idx}" title="삭제">✕</button>
      </div>
    `
      )
      .join("");

    listEl.querySelectorAll(".js-alloc-ticker").forEach((el) => {
      el.addEventListener("change", (e) => {
        const i = parseInt(e.target.dataset.idx, 10);
        currentConfig.allocations[i].ticker = e.target.value;
        updateAllocationSummaryBar();
      });
    });

    listEl.querySelectorAll(".js-alloc-weight").forEach((el) => {
      el.addEventListener("input", (e) => {
        const i = parseInt(e.target.dataset.idx, 10);
        currentConfig.allocations[i].weightPct = Math.max(0, parseFloat(e.target.value) || 0);
        updateAllocationSummaryBar();
      });
    });

    listEl.querySelectorAll(".js-alloc-del").forEach((el) => {
      el.addEventListener("click", (e) => {
        const i = parseInt(e.currentTarget.dataset.idx, 10);
        currentConfig.allocations.splice(i, 1);
        renderAllocationsUI();
      });
    });

    updateAllocationSummaryBar();
  }

  function updateAllocationSummaryBar() {
    const sum = (currentConfig.allocations || []).reduce((acc, a) => acc + (Number(a.weightPct) || 0), 0);
    const cashPct = Math.max(0, 100 - sum);
    const sumEl = document.getElementById("allocSumText");
    if (!sumEl) return;
    if (sum > 100.01) {
      sumEl.innerHTML = `<span class="text-warn">자산 합계: ${sum.toFixed(1)}% (실행 시 100% 비율로 자동 정규화됨)</span>`;
    } else {
      sumEl.innerHTML = `투자자산 합계: <strong>${sum.toFixed(1)}%</strong> | 대기 현금(Cash): <strong class="text-accent">${cashPct.toFixed(1)}%</strong>`;
    }
  }

  // Rules Builder UI
  function renderRulesUI() {
    const container = document.getElementById("rulesContainer");
    if (!container) return;
    const rules = currentConfig.rules || [];

    if (rules.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:20px;color:var(--text-muted);border:1px dashed var(--border-color);border-radius:8px;">
          설정된 교차 매매 조건이 없습니다. (기본 자산배분 + 리밸런싱만 수행됩니다)<br/>
          아래 <strong>[+ 매수/매도 교차조건 규칙 추가]</strong> 버튼을 눌러 조건을 추가해 보세요.
        </div>
      `;
      return;
    }

    container.innerHTML = rules
      .map((rule, rIdx) => {
        const act = rule.action || { type: "BUY", targetTicker: "NDX", sizingMode: "TOTAL_PCT", sizingValue: 20 };
        const isSell = act.type === "SELL" || act.type === "SELL_ALL";
        const cardClass = isSell ? "rule-card rule-sell" : "rule-card rule-buy";

        const conditionsHTML = (rule.conditions || [])
          .map((cond, cIdx) => renderSingleConditionHTML(rIdx, cIdx, cond, rule.conditions.length))
          .join(
            `<div style="text-align:center;margin:4px 0;font-size:11px;font-weight:800;color:var(--accent);">── ${
              rule.logic === "OR" ? "OR (하나라도 만족 시)" : "AND (모두 만족 시)"
            } ──</div>`
          );

        return `
        <div class="${cardClass}" data-ridx="${rIdx}">
          <div class="rule-top-bar">
            <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:200px;">
              <input type="checkbox" class="js-rule-enable" data-ridx="${rIdx}" ${rule.enabled ? "checked" : ""} style="width:16px;height:16px;cursor:pointer;" />
              <input type="text" class="form-control js-rule-name" data-ridx="${rIdx}" value="${escapeHtml(rule.name || `규칙 #${rIdx + 1}`)}" placeholder="규칙 설명 입력" style="font-weight:700;" />
            </div>
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
              <select class="form-control js-rule-logic" data-ridx="${rIdx}" style="width:auto;padding:5px 8px;font-size:12px;">
                <option value="AND" ${rule.logic !== "OR" ? "selected" : ""}>복합조건: 모두 만족 (AND)</option>
                <option value="OR" ${rule.logic === "OR" ? "selected" : ""}>복합조건: 하나만 만족 (OR)</option>
              </select>
              <button type="button" class="btn btn-sm js-add-cond" data-ridx="${rIdx}">+ 세부조건 추가</button>
              <button type="button" class="btn btn-danger btn-sm js-del-rule" data-ridx="${rIdx}">규칙 삭제</button>
            </div>
          </div>

          <div class="conditions-list">
            ${conditionsHTML}
          </div>

          <div class="action-box">
            <div style="font-size:12px;font-weight:700;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:4px;">
              <span>⚡ 조건 충족 시 실행할 주문 (Action)</span>
              <span style="font-size:11px;color:var(--text-muted);">
                재발동 대기(Cooldown)<button type="button" class="btn-help-inline" data-help="COOLDOWN" title="재발동 대기일 안내">?</button>: 
                <input type="number" class="form-control js-rule-cooldown" data-ridx="${rIdx}" value="${rule.cooldownDays ?? 5}" min="1" max="252" style="width:58px;display:inline-block;padding:2px 6px;font-size:11px;" /> 거래일
              </span>
            </div>
            <div class="form-row" style="margin-bottom:0;">
              <div class="form-group">
                <label class="form-label">주문 종류</label>
                <select class="form-control js-act-type" data-ridx="${rIdx}">
                  <option value="BUY" ${act.type === "BUY" ? "selected" : ""}>🟢 매수 (BUY)</option>
                  <option value="SELL" ${act.type === "SELL" ? "selected" : ""}>🔴 매도 (SELL)</option>
                  <option value="SELL_ALL" ${act.type === "SELL_ALL" ? "selected" : ""}>🚨 전량 매도 (100% 청산)</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">대상 매매자산</label>
                <select class="form-control js-act-ticker" data-ridx="${rIdx}">
                  ${buildTradableAssetOptionsHTML(act.targetTicker)}
                </select>
              </div>
              <div class="form-group" style="${act.type === "SELL_ALL" ? "display:none;" : ""}">
                <label class="form-label">
                  매수/매도 기준
                  <button type="button" class="btn-help-inline" data-help="SIZING_MODE" title="주문 기준 안내">?</button>
                </label>
                <select class="form-control js-act-sizing-mode" data-ridx="${rIdx}">
                  <option value="TOTAL_PCT" ${act.sizingMode === "TOTAL_PCT" ? "selected" : ""}>포트폴리오 총액 대비 비율 (%)</option>
                  <option value="BALANCE_PCT" ${act.sizingMode === "BALANCE_PCT" ? "selected" : ""}>잔액 대비 비율 (매수:현금잔액% / 매도:보유잔액%)</option>
                  <option value="AMOUNT" ${act.sizingMode === "AMOUNT" ? "selected" : ""}>고정 금액 (₩)</option>
                </select>
              </div>
              <div class="form-group" style="${act.type === "SELL_ALL" ? "display:none;" : ""}">
                <label class="form-label">${act.sizingMode === "AMOUNT" ? "주문 금액 (₩)" : "주문 비율 (%)"}</label>
                <input type="number" class="form-control js-act-sizing-val" data-ridx="${rIdx}" value="${act.sizingValue ?? 20}" min="0.1" step="any" />
              </div>
              <div class="form-group" style="${act.type === "BUY" ? "" : "display:none;"}">
                <label class="form-label">
                  현금 부족 시 매수 재원
                  <button type="button" class="btn-help-inline" data-help="FUNDING_SOURCE" title="매수 재원 충당 방식 안내">?</button>
                </label>
                <select class="form-control js-act-funding" data-ridx="${rIdx}">
                  <option value="CASH_THEN_PRORATA" ${act.fundingSource === "CASH_THEN_PRORATA" ? "selected" : ""}>현금 우선 + 부족분 타자산 비례매도</option>
                  <option value="CASH_ONLY" ${act.fundingSource === "CASH_ONLY" ? "selected" : ""}>보유 현금 한도 내에서만 매수</option>
                  <optgroup label="특정 자산 매도 대금으로 충당">
                    ${marketData.catalog
                      .filter((c) => c.category === "asset")
                      .map(
                        (a) =>
                          `<option value="${a.id}" ${act.fundingSource === a.id ? "selected" : ""}>[${a.shortName}] 매도하여 충당</option>`
                      )
                      .join("")}
                  </optgroup>
                </select>
              </div>
            </div>
          </div>
        </div>
      `;
      })
      .join("");

    bindRuleEvents(container);
  }

  function renderSingleConditionHTML(rIdx, cIdx, cond, totalConds) {
    const left = cond.left || { ticker: "T10Y2Y", transform: "PRICE", p1: 20, p2: 2, p3: 9 };
    const rightInd = cond.rightIndicator || { ticker: "SPX", transform: "SMA", p1: 200, p2: 2, p3: 9 };
    const op = (cond.operator || ">").toUpperCase();
    const isSpecialOp =
      op === "BB_UPPER_TOUCH" ||
      op === "BB_LOWER_TOUCH" ||
      op === "BB_UPPER_CROSS" ||
      op === "BB_LOWER_CROSS" ||
      op === "MACD_GOLDEN" ||
      op === "MACD_DEAD";

    return `
      <div class="condition-box" data-ridx="${rIdx}" data-cidx="${cIdx}">
        <div class="cond-grid">
          <!-- Left Spec -->
          <div class="side-spec-box">
            <div class="side-spec-title">
              ① 기준 자산 / 시그널 지표 (Left)
              <button type="button" class="btn-help-inline" data-help="TRANSFORM" title="파생지표 설명">?</button>
            </div>
            <div class="form-group" style="margin-bottom:6px;">
              <select class="form-control js-cond-left-ticker" data-ridx="${rIdx}" data-cidx="${cIdx}">
                ${buildAllSeriesOptionsHTML(left.ticker)}
              </select>
            </div>
            <div class="form-group" style="${isSpecialOp ? "display:none;" : ""}">
              <select class="form-control js-cond-left-transform" data-ridx="${rIdx}" data-cidx="${cIdx}">
                ${buildTransformOptionsHTML(left.transform)}
              </select>
            </div>
            ${renderIndicatorParamsHTML("left", rIdx, cIdx, left, op)}
          </div>

          <!-- Operator -->
          <div class="form-group">
            <label class="form-label">
              ② 비교 / 교차 조건
              <button type="button" class="btn-help-inline" data-help="OPERATOR" title="비교 조건 연산자 설명">?</button>
            </label>
            <select class="form-control js-cond-op" data-ridx="${rIdx}" data-cidx="${cIdx}">
              ${buildOperatorOptionsHTML(op)}
            </select>
          </div>

          <!-- Right Spec -->
          <div class="side-spec-box" style="${isSpecialOp ? "opacity:0.55;" : ""}">
            <div class="side-spec-title">③ 비교 대상 (수치 또는 타 지표)</div>
            ${
              isSpecialOp
                ? `<div style="font-size:12px;color:var(--text-muted);padding:14px 4px;">좌측 자산의 <strong>${
                    op.includes("BB_") ? "볼린저밴드 상/하단" : "MACD 시그널선"
                  }</strong>과 자동 비교됩니다.</div>`
                : `
              <div class="form-group" style="margin-bottom:6px;">
                <select class="form-control js-cond-right-mode" data-ridx="${rIdx}" data-cidx="${cIdx}">
                  <option value="VALUE" ${cond.rightMode !== "INDICATOR" ? "selected" : ""}>고정 수치 입력 (Value)</option>
                  <option value="INDICATOR" ${cond.rightMode === "INDICATOR" ? "selected" : ""}>다른/동일 자산·지표와 비교</option>
                </select>
              </div>
              ${
                cond.rightMode === "INDICATOR"
                  ? `
                <div class="form-group" style="margin-bottom:6px;">
                  <select class="form-control js-cond-right-ticker" data-ridx="${rIdx}" data-cidx="${cIdx}">
                    ${buildAllSeriesOptionsHTML(rightInd.ticker)}
                  </select>
                </div>
                <div class="form-group">
                  <select class="form-control js-cond-right-transform" data-ridx="${rIdx}" data-cidx="${cIdx}">
                    ${buildTransformOptionsHTML(rightInd.transform)}
                  </select>
                </div>
                ${renderIndicatorParamsHTML("right", rIdx, cIdx, rightInd, ">")}
              `
                  : `
                <div class="form-group">
                  <label class="form-label">기준 수치 값 (예: 금리차 0, RSI 30, 이격도 95)</label>
                  <input type="number" class="form-control js-cond-right-val" data-ridx="${rIdx}" data-cidx="${cIdx}" value="${cond.rightValue ?? 0}" step="any" />
                </div>
              `
              }
            `
            }
          </div>

          <!-- Delete Condition Button -->
          <div style="display:flex;justify-content:flex-end;">
            ${
              totalConds > 1
                ? `<button type="button" class="btn btn-danger btn-sm js-del-cond" data-ridx="${rIdx}" data-cidx="${cIdx}" title="세부조건 삭제">✕</button>`
                : ``
            }
          </div>
        </div>
      </div>
    `;
  }

  function renderIndicatorParamsHTML(side, rIdx, cIdx, spec, op) {
    const t = (spec.transform || "PRICE").toUpperCase();
    const prefix = `js-cond-${side}`;

    if (op === "BB_UPPER_TOUCH" || op === "BB_LOWER_TOUCH" || op === "BB_UPPER_CROSS" || op === "BB_LOWER_CROSS") {
      return `
        <div class="param-inline">
          <div class="form-group">
            <label class="form-label">기간(일)</label>
            <input type="number" class="form-control ${prefix}-p1" data-ridx="${rIdx}" data-cidx="${cIdx}" value="${spec.p1 ?? 20}" min="2" />
          </div>
          <div class="form-group">
            <label class="form-label">표준편차(σ)</label>
            <input type="number" class="form-control ${prefix}-p2" data-ridx="${rIdx}" data-cidx="${cIdx}" value="${spec.p2 ?? 2.0}" step="0.1" min="0.5" />
          </div>
        </div>
      `;
    }

    if (op === "MACD_GOLDEN" || op === "MACD_DEAD" || t.startsWith("MACD_")) {
      return `
        <div class="param-inline">
          <div class="form-group">
            <label class="form-label"> 단기(Fast)</label>
            <input type="number" class="form-control ${prefix}-p1" data-ridx="${rIdx}" data-cidx="${cIdx}" value="${spec.p1 ?? 12}" min="2" />
          </div>
          <div class="form-group">
            <label class="form-label">장기(Slow)</label>
            <input type="number" class="form-control ${prefix}-p2" data-ridx="${rIdx}" data-cidx="${cIdx}" value="${spec.p2 ?? 26}" min="3" />
          </div>
          <div class="form-group">
            <label class="form-label">시그널</label>
            <input type="number" class="form-control ${prefix}-p3" data-ridx="${rIdx}" data-cidx="${cIdx}" value="${spec.p3 ?? 9}" min="2" />
          </div>
        </div>
      `;
    }

    if (t === "SMA" || t === "EMA" || t === "DISPARITY" || t === "RSI" || t === "ROC" || t === "DIFF") {
      const defaultP = t === "RSI" ? 14 : 20;
      return `
        <div class="param-inline">
          <div class="form-group">
            <label class="form-label">기간 (N 거래일)</label>
            <input type="number" class="form-control ${prefix}-p1" data-ridx="${rIdx}" data-cidx="${cIdx}" value="${spec.p1 ?? defaultP}" min="1" />
          </div>
        </div>
      `;
    }

    if (t.startsWith("BB_")) {
      return `
        <div class="param-inline">
          <div class="form-group">
            <label class="form-label">기간(N일)</label>
            <input type="number" class="form-control ${prefix}-p1" data-ridx="${rIdx}" data-cidx="${cIdx}" value="${spec.p1 ?? 20}" min="2" />
          </div>
          <div class="form-group">
            <label class="form-label">승수(Kσ)</label>
            <input type="number" class="form-control ${prefix}-p2" data-ridx="${rIdx}" data-cidx="${cIdx}" value="${spec.p2 ?? 2.0}" step="0.1" min="0.5" />
          </div>
        </div>
      `;
    }

    if (t === "DRAWDOWN") {
      return `
        <div class="param-inline">
          <div class="form-group">
            <label class="form-label">
              고점 기준일 (0=역대전고점)
              <button type="button" class="btn-help-inline" data-help="DRAWDOWN_DAYS" title="고점 기준일 안내">?</button>
            </label>
            <input type="number" class="form-control ${prefix}-p1" data-ridx="${rIdx}" data-cidx="${cIdx}" value="${spec.p1 ?? 0}" min="0" />
          </div>
        </div>
      `;
    }

    if (t === "SPREAD" || t === "RATIO") {
      return `
        <div class="param-inline">
          <div class="form-group">
            <label class="form-label">대상 B 자산/지표</label>
            <select class="form-control ${prefix}-ticker2" data-ridx="${rIdx}" data-cidx="${cIdx}">
              ${buildAllSeriesOptionsHTML(spec.ticker2 || "US2Y")}
            </select>
          </div>
        </div>
      `;
    }

    return "";
  }

  function bindRuleEvents(container) {
    // Rule-level controls
    container.querySelectorAll(".js-rule-enable").forEach((el) => {
      el.addEventListener("change", (e) => {
        const rIdx = parseInt(e.target.dataset.ridx, 10);
        currentConfig.rules[rIdx].enabled = e.target.checked;
      });
    });
    container.querySelectorAll(".js-rule-name").forEach((el) => {
      el.addEventListener("input", (e) => {
        const rIdx = parseInt(e.target.dataset.ridx, 10);
        currentConfig.rules[rIdx].name = e.target.value;
      });
    });
    container.querySelectorAll(".js-rule-logic").forEach((el) => {
      el.addEventListener("change", (e) => {
        const rIdx = parseInt(e.target.dataset.ridx, 10);
        currentConfig.rules[rIdx].logic = e.target.value;
        renderRulesUI();
      });
    });
    container.querySelectorAll(".js-rule-cooldown").forEach((el) => {
      el.addEventListener("input", (e) => {
        const rIdx = parseInt(e.target.dataset.ridx, 10);
        currentConfig.rules[rIdx].cooldownDays = Math.max(1, parseInt(e.target.value, 10) || 1);
      });
    });
    container.querySelectorAll(".js-add-cond").forEach((el) => {
      el.addEventListener("click", (e) => {
        const rIdx = parseInt(e.currentTarget.dataset.ridx, 10);
        currentConfig.rules[rIdx].conditions.push({
          left: { ticker: "VIX", transform: "PRICE", p1: 20, p2: 2, p3: 9 },
          operator: ">=",
          rightMode: "VALUE",
          rightValue: 25,
        });
        renderRulesUI();
      });
    });
    container.querySelectorAll(".js-del-rule").forEach((el) => {
      el.addEventListener("click", (e) => {
        const rIdx = parseInt(e.currentTarget.dataset.ridx, 10);
        currentConfig.rules.splice(rIdx, 1);
        renderRulesUI();
      });
    });

    // Action controls
    container.querySelectorAll(".js-act-type").forEach((el) => {
      el.addEventListener("change", (e) => {
        const rIdx = parseInt(e.target.dataset.ridx, 10);
        currentConfig.rules[rIdx].action.type = e.target.value;
        renderRulesUI();
      });
    });
    container.querySelectorAll(".js-act-ticker").forEach((el) => {
      el.addEventListener("change", (e) => {
        const rIdx = parseInt(e.target.dataset.ridx, 10);
        currentConfig.rules[rIdx].action.targetTicker = e.target.value;
      });
    });
    container.querySelectorAll(".js-act-sizing-mode").forEach((el) => {
      el.addEventListener("change", (e) => {
        const rIdx = parseInt(e.target.dataset.ridx, 10);
        currentConfig.rules[rIdx].action.sizingMode = e.target.value;
        renderRulesUI();
      });
    });
    container.querySelectorAll(".js-act-sizing-val").forEach((el) => {
      el.addEventListener("input", (e) => {
        const rIdx = parseInt(e.target.dataset.ridx, 10);
        currentConfig.rules[rIdx].action.sizingValue = parseFloat(e.target.value) || 0;
      });
    });
    container.querySelectorAll(".js-act-funding").forEach((el) => {
      el.addEventListener("change", (e) => {
        const rIdx = parseInt(e.target.dataset.ridx, 10);
        currentConfig.rules[rIdx].action.fundingSource = e.target.value;
      });
    });

    // Condition-level controls
    container.querySelectorAll(".js-del-cond").forEach((el) => {
      el.addEventListener("click", (e) => {
        const rIdx = parseInt(e.currentTarget.dataset.ridx, 10);
        const cIdx = parseInt(e.currentTarget.dataset.cidx, 10);
        currentConfig.rules[rIdx].conditions.splice(cIdx, 1);
        renderRulesUI();
      });
    });

    container.querySelectorAll(".js-cond-left-ticker").forEach((el) => {
      el.addEventListener("change", (e) => {
        const { ridx, cidx } = e.target.dataset;
        currentConfig.rules[ridx].conditions[cidx].left.ticker = e.target.value;
      });
    });
    container.querySelectorAll(".js-cond-left-transform").forEach((el) => {
      el.addEventListener("change", (e) => {
        const { ridx, cidx } = e.target.dataset;
        const newT = e.target.value;
        const left = currentConfig.rules[ridx].conditions[cidx].left;
        left.transform = newT;
        if (newT === "RSI") left.p1 = 14;
        else if (newT.startsWith("MACD_")) {
          left.p1 = 12;
          left.p2 = 26;
          left.p3 = 9;
        } else if (newT === "DRAWDOWN") left.p1 = 0;
        else left.p1 = 20;
        renderRulesUI();
      });
    });

    ["p1", "p2", "p3"].forEach((pKey) => {
      container.querySelectorAll(`.js-cond-left-${pKey}`).forEach((el) => {
        el.addEventListener("input", (e) => {
          const { ridx, cidx } = e.target.dataset;
          currentConfig.rules[ridx].conditions[cidx].left[pKey] = parseFloat(e.target.value) || 0;
        });
      });
      container.querySelectorAll(`.js-cond-right-${pKey}`).forEach((el) => {
        el.addEventListener("input", (e) => {
          const { ridx, cidx } = e.target.dataset;
          currentConfig.rules[ridx].conditions[cidx].rightIndicator[pKey] = parseFloat(e.target.value) || 0;
        });
      });
    });

    container.querySelectorAll(".js-cond-left-ticker2").forEach((el) => {
      el.addEventListener("change", (e) => {
        const { ridx, cidx } = e.target.dataset;
        currentConfig.rules[ridx].conditions[cidx].left.ticker2 = e.target.value;
      });
    });
    container.querySelectorAll(".js-cond-right-ticker2").forEach((el) => {
      el.addEventListener("change", (e) => {
        const { ridx, cidx } = e.target.dataset;
        currentConfig.rules[ridx].conditions[cidx].rightIndicator.ticker2 = e.target.value;
      });
    });

    container.querySelectorAll(".js-cond-op").forEach((el) => {
      el.addEventListener("change", (e) => {
        const { ridx, cidx } = e.target.dataset;
        const op = e.target.value;
        const cond = currentConfig.rules[ridx].conditions[cidx];
        cond.operator = op;
        if (op.startsWith("MACD_")) {
          cond.left.p1 = 12;
          cond.left.p2 = 26;
          cond.left.p3 = 9;
        } else if (op.startsWith("BB_")) {
          cond.left.p1 = 20;
          cond.left.p2 = 2.0;
        }
        renderRulesUI();
      });
    });

    container.querySelectorAll(".js-cond-right-mode").forEach((el) => {
      el.addEventListener("change", (e) => {
        const { ridx, cidx } = e.target.dataset;
        const cond = currentConfig.rules[ridx].conditions[cidx];
        cond.rightMode = e.target.value;
        if (cond.rightMode === "INDICATOR" && !cond.rightIndicator) {
          cond.rightIndicator = { ticker: cond.left.ticker, transform: "SMA", p1: 200, p2: 2, p3: 9 };
        }
        renderRulesUI();
      });
    });

    container.querySelectorAll(".js-cond-right-val").forEach((el) => {
      el.addEventListener("input", (e) => {
        const { ridx, cidx } = e.target.dataset;
        currentConfig.rules[ridx].conditions[cidx].rightValue = parseFloat(e.target.value) || 0;
      });
    });

    container.querySelectorAll(".js-cond-right-ticker").forEach((el) => {
      el.addEventListener("change", (e) => {
        const { ridx, cidx } = e.target.dataset;
        currentConfig.rules[ridx].conditions[cidx].rightIndicator.ticker = e.target.value;
      });
    });

    container.querySelectorAll(".js-cond-right-transform").forEach((el) => {
      el.addEventListener("change", (e) => {
        const { ridx, cidx } = e.target.dataset;
        currentConfig.rules[ridx].conditions[cidx].rightIndicator.transform = e.target.value;
        renderRulesUI();
      });
    });
  }

  function syncUIFieldsToConfig() {
    currentConfig.name = document.getElementById("cfgName").value.trim() || "백테스트 전략";
    currentConfig.initialCapital = Math.max(100, parseFloat(document.getElementById("cfgCapital").value) || 10000000);
    currentConfig.startDate = document.getElementById("cfgStartDate").value || marketData.startDate;
    currentConfig.endDate = document.getElementById("cfgEndDate").value || marketData.endDate;
    currentConfig.executionLag = parseInt(document.getElementById("cfgLag").value, 10) === 0 ? 0 : 1;
    currentConfig.feeRatePct = Math.max(0, parseFloat(document.getElementById("cfgFee").value) || 0);
    currentConfig.cashYieldMode = document.getElementById("cfgCashYield").value;
    currentConfig.benchmarkTicker = document.getElementById("cfgBenchmark").value || "SPX";

    const toggleReb = document.getElementById("toggleRebalance");
    currentConfig.rebalanceEnabled = toggleReb ? toggleReb.checked : true;

    const toggleRul = document.getElementById("toggleRules");
    currentConfig.rulesEnabled = toggleRul ? toggleRul.checked : true;

    currentConfig.rebalance = {
      periodMode: document.getElementById("cfgRebPeriod").value,
      customDays: Math.max(1, parseInt(document.getElementById("cfgRebCustomDays").value, 10) || 60),
      bandMode: document.getElementById("cfgRebBandMode").value,
      bandThreshold: Math.max(0.5, parseFloat(document.getElementById("cfgRebBandVal").value) || 5),
    };
  }

  function executeCurrentBacktest(saveToBoard = true) {
    try {
      syncUIFieldsToConfig();
      const result = BacktestEngine.runBacktest(marketData, currentConfig);
      lastResult = result;
      renderResultsUI(result);

      if (saveToBoard && autoSaveToScoreboard) {
        StorageManager.addScoreboardEntry(result, currentConfig.name);
        updateScoreboardBadge();
        renderScoreboardTab();
      }
    } catch (err) {
      console.error(err);
      showToast("백테스트 실행 오류: " + err.message, "danger");
    }
  }

  // Render Results & Charts
  function renderResultsUI(res) {
    const m = res.metrics;
    const benchName = catalogMap[m.benchmarkTicker]?.shortName || m.benchmarkTicker;

    document.getElementById("resStrategyTitle").textContent = res.configSnapshot.name;
    document.getElementById("resPeriodBadge").textContent = `${m.startDate} ~ ${m.endDate} (${m.years}년 / ${m.tradingDays.toLocaleString()}거래일)`;

    // KPI Cards
    const kpiHTML = `
      <div class="kpi-card">
        <div class="kpi-label">🏆 종합 퀀트 스코어 (Quant Score)</div>
        <div class="kpi-value text-accent">${m.quantScore.toFixed(1)} <span style="font-size:13px;font-weight:600;">/ 100</span></div>
        <div class="kpi-sub">수익·변동성·낙폭 종합점수</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">📈 연평균 복리수익률 (CAGR)</div>
        <div class="kpi-value ${m.cagrPct >= 0 ? "text-pos" : "text-neg"}">${m.cagrPct >= 0 ? "+" : ""}${m.cagrPct.toFixed(2)}%</div>
        <div class="kpi-sub">벤치마크(${benchName}): ${m.benchCagrPct >= 0 ? "+" : ""}${m.benchCagrPct.toFixed(2)}%</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">💰 최종 평가자산 (총수익률)</div>
        <div class="kpi-value ${m.totalReturnPct >= 0 ? "text-pos" : "text-neg"}">₩${Math.round(m.finalEquity).toLocaleString()}</div>
        <div class="kpi-sub">누적 ${m.totalReturnPct >= 0 ? "+" : ""}${m.totalReturnPct.toLocaleString(undefined, { maximumFractionDigits: 1 })}% (원금 ₩${m.initialCapital.toLocaleString()})</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">🛡️ 최대 낙폭 (MDD)</div>
        <div class="kpi-value text-neg">${m.maxDrawdownPct.toFixed(2)}%</div>
        <div class="kpi-sub">${benchName} MDD: ${m.benchMddPct.toFixed(2)}% (최저점 ${m.maxDrawdownDate})</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">⚡ 샤프 지수 (Sharpe Ratio)</div>
        <div class="kpi-value ${m.sharpe >= 1 ? "text-pos" : "text-main"}">${m.sharpe.toFixed(2)}</div>
        <div class="kpi-sub">소르티노(Sortino): ${m.sortino.toFixed(2)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">⚖️ 칼마 지수 (CAGR / |MDD|)</div>
        <div class="kpi-value">${m.calmar.toFixed(2)}</div>
        <div class="kpi-sub">연간 변동성: ${m.annualVolPct.toFixed(2)}%</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">🗓️ 연도별 승률 (Win Rate)</div>
        <div class="kpi-value">${m.winRateYearlyPct.toFixed(1)}%</div>
        <div class="kpi-sub">일별 상승비율: ${m.DailyWinRatePct.toFixed(1)}%</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">🔄 교차매매 & 리밸런싱 횟수</div>
        <div class="kpi-value">${m.ruleTradeCount}회 <span style="font-size:14px;color:var(--text-muted);">/ ${m.rebalanceCount}회</span></div>
        <div class="kpi-sub">누적 수수료: ₩${Math.round(m.totalFeesPaid).toLocaleString()}</div>
      </div>
    `;
    document.getElementById("kpiGrid").innerHTML = kpiHTML;

    // Strategy Rules Summary & Data Provenance Notice
    const rulesSummaryEl = document.getElementById("resRulesSummary");
    const rulePills =
      res.summaryText.rules.length > 0
        ? res.summaryText.rules.map((r) => `<span class="tag tag-indicator">${escapeHtml(r)}</span>`).join(" ")
        : `<span class="tag">교차조건 없음 (Buy & Rebalance)</span>`;

    // Collect all tickers referenced in allocations and active rules
    const usedTickers = new Set(res.series.trackedTickers || []);
    (res.configSnapshot.rules || []).forEach((r) => {
      if (!r || !r.enabled) return;
      (r.conditions || []).forEach((c) => {
        if (c.left?.ticker) usedTickers.add(c.left.ticker);
        if (c.left?.ticker2) usedTickers.add(c.left.ticker2);
        if (c.rightMode === "INDICATOR" && c.rightIndicator?.ticker) usedTickers.add(c.rightIndicator.ticker);
      });
    });
    const provenanceItems = Array.from(usedTickers)
      .map((t) => {
        const meta = catalogMap[t];
        if (!meta) return "";
        return `<span class="tag" title="${escapeHtml(meta.desc || "")}"><strong>${escapeHtml(meta.shortName)}</strong>: ${escapeHtml(meta.actualStart)}</span>`;
      })
      .filter(Boolean)
      .join(" ");

    rulesSummaryEl.innerHTML = `
      <div><strong>목표 자산배분:</strong> <span class="tag tag-asset">${escapeHtml(res.summaryText.allocations)}</span></div>
      <div style="margin-top:4px;"><strong>활성 교차규칙:</strong> ${rulePills}</div>
      <div style="margin-top:6px;padding-top:6px;border-top:1px dashed var(--border-color);font-size:11.5px;color:var(--text-muted);">
        <strong>📌 데이터 출처 및 백필 구간 안내 (마우스 오버 시 상세 설명):</strong> ${provenanceItems}
      </div>
    `;

    renderMainCharts(res);
    renderTradeLogsTable(res.tradeLogs);
  }

  function downsampleForChart(dates, arraysObj, maxPoints = 650, keyDateSet = null) {
    const n = dates.length;
    if (n <= maxPoints) {
      return { dates, series: arraysObj };
    }
    const step = Math.ceil(n / maxPoints);
    const keepSet = new Set();
    keepSet.add(0);
    keepSet.add(n - 1);
    for (let i = 0; i < n; i += step) {
      keepSet.add(i);
    }
    if (keyDateSet && keyDateSet.size > 0) {
      for (let i = 0; i < n; i++) {
        if (keyDateSet.has(dates[i])) {
          keepSet.add(i);
        }
      }
    }
    const sortedIndices = Array.from(keepSet).sort((a, b) => a - b);
    const outDates = new Array(sortedIndices.length);
    const outSeries = {};
    const keys = Object.keys(arraysObj);
    keys.forEach((k) => (outSeries[k] = new Array(sortedIndices.length)));

    for (let j = 0; j < sortedIndices.length; j++) {
      const idx = sortedIndices[j];
      outDates[j] = dates[idx];
      for (let k = 0; k < keys.length; k++) {
        const key = keys[k];
        outSeries[key][j] = arraysObj[key][idx];
      }
    }
    return { dates: outDates, series: outSeries };
  }

  function computeYearlyComparison(res, benchTicker) {
    const dates = res.series.dates;
    const equity = res.series.equity;
    const n = dates.length;
    if (n === 0) return [];

    const isKrw = catalogMap[benchTicker]?.currency === "KRW";
    const bSeries = marketData.series[benchTicker];
    const fxSeries = marketData.series["USDKRW"];
    const startIdx = marketData.dates.indexOf(dates[0]);

    function getBenchPxKrw(idx) {
      const gIdx = startIdx >= 0 ? startIdx + idx : marketData.dates.indexOf(dates[idx]);
      if (gIdx < 0 || !bSeries) return 1.0;
      const raw = bSeries[gIdx] || 1.0;
      if (isKrw) return raw;
      const fx = fxSeries && fxSeries[gIdx] ? fxSeries[gIdx] : 1.0;
      return raw * fx;
    }

    const yearlyData = [];
    let yrStartEq = equity[0];
    let yrStartBench = getBenchPxKrw(0);
    let curYear = dates[0].slice(0, 4);

    for (let i = 1; i < n; i++) {
      const y = dates[i].slice(0, 4);
      if (y !== curYear || i === n - 1) {
        const endIdx = y !== curYear ? i - 1 : i;
        const yrEndEq = equity[endIdx];
        const yrEndBench = getBenchPxKrw(endIdx);
        const stratRet = yrStartEq > 0 ? ((yrEndEq / yrStartEq) - 1.0) * 100.0 : 0.0;
        const benchRet = yrStartBench > 0 ? ((yrEndBench / yrStartBench) - 1.0) * 100.0 : 0.0;
        yearlyData.push({
          year: curYear,
          stratReturnPct: stratRet,
          benchReturnPct: benchRet,
          isBeat: stratRet >= benchRet,
        });
        curYear = y;
        yrStartEq = yrEndEq;
        yrStartBench = yrEndBench;
      }
    }
    return yearlyData;
  }

  function populateYearlyBenchmarkSelect(selectedTicker) {
    const sel = document.getElementById("resYearlyBenchSelect");
    if (!sel) return;
    const curVal = selectedTicker || sel.value || "SPX";
    sel.innerHTML = buildTradableAssetOptionsHTML(curVal);
    sel.value = curVal;
  }

  function renderYearlyChart(res, targetBenchTicker) {
    if (!global.Chart || !res) return;
    const benchTicker = targetBenchTicker || res.metrics.benchmarkTicker || "SPX";
    const benchMeta = catalogMap[benchTicker] || { name: benchTicker, shortName: benchTicker };
    const benchName = benchMeta.shortName || benchMeta.name || benchTicker;

    const yearlyData = computeYearlyComparison(res, benchTicker);

    const ctxYr = document.getElementById("chartYearly")?.getContext("2d");
    if (!ctxYr) return;
    if (charts.yearly) charts.yearly.destroy();

    charts.yearly = new global.Chart(ctxYr, {
      type: "bar",
      data: {
        labels: yearlyData.map((y) => y.year),
        datasets: [
          {
            label: `전략 연수익률 (%) [Beat=초록 / Under=적색]`,
            data: yearlyData.map((y) => Number(y.stratReturnPct.toFixed(2))),
            backgroundColor: yearlyData.map((y) =>
              y.isBeat ? "rgba(16, 185, 129, 0.85)" : "rgba(239, 68, 68, 0.85)"
            ),
            borderColor: yearlyData.map((y) =>
              y.isBeat ? "#059669" : "#dc2626"
            ),
            borderWidth: 1,
            borderRadius: 3,
          },
          {
            label: `비교자산: ${benchName} 연수익률 (%)`,
            data: yearlyData.map((y) => Number(y.benchReturnPct.toFixed(2))),
            backgroundColor: "rgba(148, 163, 184, 0.5)",
            borderColor: "#64748b",
            borderWidth: 1,
            borderRadius: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: "#cbd5e1" } },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y >= 0 ? "+" : ""}${ctx.parsed.y.toFixed(2)}%`,
            },
          },
        },
        scales: {
          x: { ticks: { color: "#94a3b8" }, grid: { display: false } },
          y: {
            ticks: {
              color: "#94a3b8",
              callback: (v) => `${v}%`,
            },
            grid: { color: "rgba(148,163,184,0.1)" },
          },
        },
      },
    });
  }

  function renderMainCharts(res) {
    if (!global.Chart) return;
    const benchName = catalogMap[res.metrics.benchmarkTicker]?.shortName || res.metrics.benchmarkTicker;

    // Collect trade dates to ensure every trade date is kept during downsampling
    const tradeDateSet = new Set();
    const trades = res.tradeLogs || [];
    trades.forEach((t) => {
      if (t.type === "BUY" || t.type === "SELL" || t.type === "SELL_ALL") {
        tradeDateSet.add(t.date);
      }
    });

    const rawSeriesMap = {
      equity: res.series.equity,
      benchmark: res.series.benchmark,
      drawdown: res.series.drawdown,
      benchDrawdown: res.series.benchDrawdown,
      cashRatio: res.series.cashRatio,
    };
    res.series.trackedTickers.forEach((t) => {
      rawSeriesMap["w_" + t] = res.series.assetWeights[t];
    });

    const sampled = downsampleForChart(res.series.dates, rawSeriesMap, 650, tradeDateSet);

    // Prepare buy and sell scatter points for Equity chart
    const buyScatterPoints = [];
    const sellScatterPoints = [];

    trades.forEach((t) => {
      if (t.type === "BUY") {
        buyScatterPoints.push({
          x: t.date,
          y: t.equityAfter,
          trade: t,
        });
      } else if (t.type === "SELL" || t.type === "SELL_ALL") {
        sellScatterPoints.push({
          x: t.date,
          y: t.equityAfter,
          trade: t,
        });
      }
    });

    // 1. Equity Curve Chart
    const ctxEq = document.getElementById("chartEquity").getContext("2d");
    if (charts.equity) charts.equity.destroy();
    charts.equity = new global.Chart(ctxEq, {
      type: "line",
      data: {
        labels: sampled.dates,
        datasets: [
          {
            label: `전략 포트폴리오 (₩)`,
            data: sampled.series.equity,
            borderColor: "#3b82f6",
            backgroundColor: "rgba(59, 130, 246, 0.12)",
            borderWidth: 2.2,
            pointRadius: 0,
            fill: true,
            tension: 0.1,
            order: 3,
          },
          {
            label: `벤치마크: ${benchName} (₩)`,
            data: sampled.series.benchmark,
            borderColor: "#94a3b8",
            borderWidth: 1.5,
            borderDash: [4, 4],
            pointRadius: 0,
            fill: false,
            tension: 0.1,
            order: 4,
          },
          {
            type: "scatter",
            label: "🟢 매수 체결 (BUY ▲)",
            data: buyScatterPoints,
            backgroundColor: "#10b981",
            borderColor: "#059669",
            borderWidth: 1.5,
            pointStyle: "triangle",
            rotation: 0,
            pointRadius: 6,
            pointHoverRadius: 9,
            order: 1,
          },
          {
            type: "scatter",
            label: "🔴 매도 체결 (SELL ▼)",
            data: sellScatterPoints,
            backgroundColor: "#ef4444",
            borderColor: "#dc2626",
            borderWidth: 1.5,
            pointStyle: "triangle",
            rotation: 180,
            pointRadius: 6,
            pointHoverRadius: 9,
            order: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { labels: { color: "#cbd5e1" } },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const raw = ctx.raw;
                if (raw && raw.trade) {
                  const t = raw.trade;
                  const typeLabel = t.type === "BUY" ? "🟢 매수 (BUY ▲)" : "🔴 매도 (SELL ▼)";
                  const assetName = t.tickerName || catalogMap[t.ticker]?.name || t.ticker;
                  const unitPriceStr =
                    t.currency === "KRW"
                      ? `₩${Math.round(t.priceKrw).toLocaleString()}`
                      : `$${t.rawPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (₩${Math.round(t.priceKrw).toLocaleString()})`;
                  const sharesStr = t.shares ? (t.shares >= 100 ? t.shares.toFixed(1) : t.shares.toFixed(4)) : "0";
                  const amtStr = `₩${Math.round(t.amountKrw || t.amount).toLocaleString()}`;
                  return [
                    `${typeLabel}: ${assetName}`,
                    ` • 단가: ${unitPriceStr}`,
                    ` • 수량: ${sharesStr}주`,
                    ` • 체결금액: ${amtStr}`,
                    ` • 발동사유: ${t.ruleName || ""}`,
                  ];
                }
                return `${ctx.dataset.label}: ₩${Math.round(ctx.parsed.y).toLocaleString()}`;
              },
            },
          },
        },
        scales: {
          x: { ticks: { color: "#94a3b8", maxTicksLimit: 10 }, grid: { color: "rgba(148,163,184,0.08)" } },
          y: {
            type: isLogScale ? "logarithmic" : "linear",
            ticks: {
              color: "#94a3b8",
              callback: (v) => "₩" + Number(v).toLocaleString(),
            },
            grid: { color: "rgba(148,163,184,0.1)" },
          },
        },
      },
    });

    // 2. Drawdown Chart
    const ctxDd = document.getElementById("chartDrawdown").getContext("2d");
    if (charts.drawdown) charts.drawdown.destroy();
    charts.drawdown = new global.Chart(ctxDd, {
      type: "line",
      data: {
        labels: sampled.dates,
        datasets: [
          {
            label: "전략 낙폭 (Drawdown %)",
            data: sampled.series.drawdown,
            borderColor: "#ef4444",
            backgroundColor: "rgba(239, 68, 68, 0.18)",
            borderWidth: 1.6,
            pointRadius: 0,
            fill: true,
          },
          {
            label: `${benchName} 낙폭 (%)`,
            data: sampled.series.benchDrawdown,
            borderColor: "#64748b",
            borderWidth: 1.2,
            borderDash: [3, 3],
            pointRadius: 0,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { labels: { color: "#cbd5e1" } },
        },
        scales: {
          x: { ticks: { color: "#94a3b8", maxTicksLimit: 10 }, grid: { display: false } },
          y: {
            max: 0,
            ticks: { color: "#94a3b8", callback: (v) => v + "%" },
            grid: { color: "rgba(148,163,184,0.1)" },
          },
        },
      },
    });

    // 3. Asset Allocation Weights History Chart
    const palette = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#eab308"];
    const weightDatasets = res.series.trackedTickers.map((t, i) => ({
      label: catalogMap[t]?.shortName || t,
      data: sampled.series["w_" + t],
      borderColor: palette[i % palette.length],
      backgroundColor: palette[i % palette.length] + "55",
      borderWidth: 1.2,
      pointRadius: 0,
      fill: true,
      stack: "weights",
    }));
    weightDatasets.push({
      label: "현금 (Cash)",
      data: sampled.series.cashRatio,
      borderColor: "#64748b",
      backgroundColor: "rgba(100, 116, 139, 0.35)",
      borderWidth: 1,
      pointRadius: 0,
      fill: true,
      stack: "weights",
    });

    const ctxW = document.getElementById("chartWeights").getContext("2d");
    if (charts.weights) charts.weights.destroy();
    charts.weights = new global.Chart(ctxW, {
      type: "line",
      data: {
        labels: sampled.dates,
        datasets: weightDatasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { labels: { color: "#cbd5e1" } },
        },
        scales: {
          x: { ticks: { color: "#94a3b8", maxTicksLimit: 10 }, grid: { display: false } },
          y: {
            stacked: true,
            min: 0,
            max: 100,
            ticks: { color: "#94a3b8", callback: (v) => v + "%" },
            grid: { color: "rgba(148,163,184,0.1)" },
          },
        },
      },
    });

    // 4. Annual Returns Bar Chart (Dynamic comparison against selected benchmark)
    populateYearlyBenchmarkSelect(res.metrics.benchmarkTicker);
    const chosenBench = document.getElementById("resYearlyBenchSelect")?.value || res.metrics.benchmarkTicker;
    renderYearlyChart(res, chosenBench);
  }

  function renderTradeLogsTable(logs) {
    const tbody = document.getElementById("tradeLogsBody");
    const countEl = document.getElementById("tradeLogsCount");
    if (!tbody) return;
    countEl.textContent = `총 ${logs.length}건 기록`;

    if (logs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:18px;">매매 또는 리밸런싱 내역이 없습니다.</td></tr>`;
      return;
    }

    // Show most recent 250 trades in table for fast DOM rendering
    const slice = logs.slice().reverse().slice(0, 250);
    tbody.innerHTML = slice
      .map((row) => {
        const badgeClass =
          row.type === "BUY" ? "tag-asset" : row.type === "SELL" || row.type === "SELL_ALL" ? "tag-indicator" : "";
        const pxStr = row.priceKrw
          ? (row.currency === "KRW" ? `₩${Math.round(row.priceKrw).toLocaleString()}` : `$${(row.rawPrice || 0).toFixed(2)} (₩${Math.round(row.priceKrw).toLocaleString()})`)
          : "";
        const sharesStr = row.shares ? ` • ${row.shares >= 100 ? row.shares.toFixed(1) : row.shares.toFixed(4)}주` : "";
        return `
        <tr>
          <td>${row.date}</td>
          <td><span class="tag ${badgeClass}">${row.type}</span></td>
          <td>${escapeHtml(row.ruleName || "")}</td>
          <td><strong>${escapeHtml(row.actionLabel || row.tickerName || row.ticker)}</strong><div style="font-size:11px;color:var(--text-muted);">${pxStr}${sharesStr}</div></td>
          <td>₩${Math.round(row.amountKrw || row.amount || 0).toLocaleString()}</td>
          <td>₩${Math.round(row.equityAfter || 0).toLocaleString()}</td>
        </tr>
      `;
      })
      .join("");
  }

  // Scoreboard Tab Rendering & Multi-Run Comparison
  function renderScoreboardTab() {
    const list = StorageManager.loadScoreboard();
    updateScoreboardBadge();

    const sortBy = document.getElementById("sbSortSelect")?.value || "quantScore";
    const sorted = [...list].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      if (sortBy === "createdAt") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "maxDrawdownPct") return b.metrics.maxDrawdownPct - a.metrics.maxDrawdownPct; // closer to 0 is better
      return (b.metrics[sortBy] || 0) - (a.metrics[sortBy] || 0);
    });

    // Top Champions Podium
    const podiumEl = document.getElementById("sbPodium");
    if (list.length > 0 && podiumEl) {
      const bestScore = [...list].sort((a, b) => b.metrics.quantScore - a.metrics.quantScore)[0];
      const bestCagr = [...list].sort((a, b) => b.metrics.cagrPct - a.metrics.cagrPct)[0];
      const bestSharpe = [...list].sort((a, b) => b.metrics.sharpe - a.metrics.sharpe)[0];

      podiumEl.innerHTML = `
        <div class="podium-card rank-1">
          <div style="font-size:11.5px;color:#fbbf24;font-weight:800;">🥇 종합 스코어 1위 (Best Quant Score)</div>
          <div style="font-size:15px;font-weight:800;margin:4px 0;">${escapeHtml(bestScore.title)}</div>
          <div style="font-size:13px;color:var(--text-muted);">
            점수: <strong class="text-accent">${bestScore.metrics.quantScore}점</strong> | CAGR: <strong class="text-pos">+${bestScore.metrics.cagrPct.toFixed(2)}%</strong> | MDD: <strong class="text-neg">${bestScore.metrics.maxDrawdownPct.toFixed(1)}%</strong>
          </div>
        </div>
        <div class="podium-card">
          <div style="font-size:11.5px;color:#34d399;font-weight:800;">🚀 최고 연평균 수익률 (Best CAGR)</div>
          <div style="font-size:15px;font-weight:800;margin:4px 0;">${escapeHtml(bestCagr.title)}</div>
          <div style="font-size:13px;color:var(--text-muted);">
            CAGR: <strong class="text-pos">+${bestCagr.metrics.cagrPct.toFixed(2)}%</strong> | 총수익: <strong>+${Math.round(bestCagr.metrics.totalReturnPct).toLocaleString()}%</strong> | 샤프: <strong>${bestCagr.metrics.sharpe.toFixed(2)}</strong>
          </div>
        </div>
        <div class="podium-card">
          <div style="font-size:11.5px;color:#38bdf8;font-weight:800;">🛡️ 최고 위험대비 수익 (Best Sharpe)</div>
          <div style="font-size:15px;font-weight:800;margin:4px 0;">${escapeHtml(bestSharpe.title)}</div>
          <div style="font-size:13px;color:var(--text-muted);">
            샤프지수: <strong class="text-accent">${bestSharpe.metrics.sharpe.toFixed(2)}</strong> | 칼마: <strong>${bestSharpe.metrics.calmar.toFixed(2)}</strong> | MDD: <strong class="text-neg">${bestSharpe.metrics.maxDrawdownPct.toFixed(1)}%</strong>
          </div>
        </div>
      `;
    } else if (podiumEl) {
      podiumEl.innerHTML = "";
    }

    // Ensure at least top 3 are selected for overlay chart if selection is empty
    if (selectedScoreboardIds.size === 0 && sorted.length > 0) {
      sorted.slice(0, Math.min(3, sorted.length)).forEach((item) => selectedScoreboardIds.add(item.id));
    }

    const tbody = document.getElementById("sbTableBody");
    if (!tbody) return;

    if (sorted.length === 0) {
      tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:24px;color:var(--text-muted);">저장된 백테스트 이력이 없습니다. 전략을 실행하면 이곳에 자동으로 스코어보드가 기록됩니다.</td></tr>`;
      renderScoreboardOverlayChart([]);
      return;
    }

    tbody.innerHTML = sorted
      .map((item, idx) => {
        const m = item.metrics;
        const rankBadge = idx === 0 ? "🥇 1" : idx === 1 ? "🥈 2" : idx === 2 ? "🥉 3" : `${idx + 1}`;
        const checked = selectedScoreboardIds.has(item.id) ? "checked" : "";
        const ruleSummary =
          item.summaryText?.rules && item.summaryText.rules.length > 0
            ? item.summaryText.rules.join(" | ")
            : "기본 자산배분 + 리밸런싱";

        return `
        <tr>
          <td>
            <input type="checkbox" class="js-sb-check" data-id="${item.id}" ${checked} style="width:16px;height:16px;cursor:pointer;" title="차트 겹쳐보기 선택" />
          </td>
          <td style="font-weight:800;white-space:nowrap;">${item.pinned ? "📌 " : ""}${rankBadge}</td>
          <td style="min-width:220px;">
            <div style="font-weight:700;color:var(--text-main);">${escapeHtml(item.title)}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">배분: ${escapeHtml(item.summaryText?.allocations || "")}</div>
            <div style="font-size:11px;color:var(--accent);margin-top:1px;">조건: ${escapeHtml(ruleSummary)}</div>
          </td>
          <td><span class="score-pill ${m.quantScore >= 70 ? "high" : ""}">${m.quantScore.toFixed(1)}</span></td>
          <td class="${m.cagrPct >= 0 ? "text-pos" : "text-neg"}" style="font-weight:700;">${m.cagrPct >= 0 ? "+" : ""}${m.cagrPct.toFixed(2)}%</td>
          <td>${m.totalReturnPct >= 0 ? "+" : ""}${Math.round(m.totalReturnPct).toLocaleString()}%<br/><span style="font-size:11px;color:var(--text-muted);">₩${Math.round(m.finalEquity).toLocaleString()}</span></td>
          <td class="text-neg" style="font-weight:700;">${m.maxDrawdownPct.toFixed(2)}%</td>
          <td style="font-weight:700;">${m.sharpe.toFixed(2)}</td>
          <td>${m.calmar.toFixed(2)}</td>
          <td style="font-size:11.5px;white-space:nowrap;">${m.startDate}<br/>~ ${m.endDate} (${m.years}년)</td>
          <td style="white-space:nowrap;">
            <button type="button" class="btn btn-primary btn-sm js-sb-load" data-id="${item.id}">⚡ 조건 불러오기</button>
            <button type="button" class="btn btn-sm js-sb-pin" data-id="${item.id}" title="상단 고정">${item.pinned ? "고정해제" : "📌"}</button>
            <button type="button" class="btn btn-danger btn-sm js-sb-del" data-id="${item.id}" title="삭제">✕</button>
          </td>
        </tr>
      `;
      })
      .join("");

    // Bind table actions
    tbody.querySelectorAll(".js-sb-check").forEach((el) => {
      el.addEventListener("change", (e) => {
        const id = e.target.dataset.id;
        if (e.target.checked) selectedScoreboardIds.add(id);
        else selectedScoreboardIds.delete(id);
        renderScoreboardOverlayChart(sorted.filter((x) => selectedScoreboardIds.has(x.id)));
      });
    });

    tbody.querySelectorAll(".js-sb-load").forEach((el) => {
      el.addEventListener("click", (e) => {
        const id = e.currentTarget.dataset.id;
        const entry = list.find((x) => x.id === id);
        if (entry && entry.configSnapshot) {
          loadConfigIntoUI(entry.configSnapshot);
          executeCurrentBacktest(false);
          switchTab("tab-builder");
          showToast(`[${entry.title}] 조건을 불러왔습니다!`, "success");
        }
      });
    });

    tbody.querySelectorAll(".js-sb-pin").forEach((el) => {
      el.addEventListener("click", (e) => {
        const id = e.currentTarget.dataset.id;
        StorageManager.togglePinScoreboardEntry(id);
        renderScoreboardTab();
      });
    });

    tbody.querySelectorAll(".js-sb-del").forEach((el) => {
      el.addEventListener("click", (e) => {
        const id = e.currentTarget.dataset.id;
        selectedScoreboardIds.delete(id);
        StorageManager.deleteScoreboardEntry(id);
        renderScoreboardTab();
      });
    });

    renderScoreboardOverlayChart(sorted.filter((x) => selectedScoreboardIds.has(x.id)));
  }

  function renderScoreboardOverlayChart(selectedEntries) {
    if (!global.Chart) return;
    const ctx = document.getElementById("chartScoreboardOverlay")?.getContext("2d");
    if (!ctx) return;
    if (charts.scoreboardOverlay) charts.scoreboardOverlay.destroy();

    if (!selectedEntries || selectedEntries.length === 0) {
      return;
    }

    // Build unified date axis across selected runs
    const dateSet = new Set();
    selectedEntries.forEach((e) => {
      (e.compactCurve?.dates || []).forEach((d) => dateSet.add(d));
    });
    const allDates = Array.from(dateSet).sort();

    const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4"];
    const datasets = selectedEntries.map((entry, idx) => {
      const map = new Map();
      const dArr = entry.compactCurve?.dates || [];
      const vArr = entry.compactCurve?.normEquity || [];
      for (let i = 0; i < dArr.length; i++) map.set(dArr[i], vArr[i]);

      let lastVal = null;
      const aligned = allDates.map((d) => {
        if (map.has(d)) lastVal = map.get(d);
        return lastVal;
      });

      return {
        label: `${entry.title} (CAGR ${entry.metrics.cagrPct.toFixed(1)}%)`,
        data: aligned,
        borderColor: colors[idx % colors.length],
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
        spanGaps: true,
      };
    });

    charts.scoreboardOverlay = new global.Chart(ctx, {
      type: "line",
      data: {
        labels: allDates,
        datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { labels: { color: "#cbd5e1" } },
          tooltip: {
            callbacks: {
              label: (c) => `${c.dataset.label}: ${Number(c.parsed.y).toLocaleString()} (시작=100 기준)`,
            },
          },
        },
        scales: {
          x: { ticks: { color: "#94a3b8", maxTicksLimit: 10 }, grid: { color: "rgba(148,163,184,0.08)" } },
          y: {
            type: "logarithmic",
            ticks: { color: "#94a3b8", callback: (v) => v + "pt" },
            grid: { color: "rgba(148,163,184,0.1)" },
          },
        },
      },
    });
  }

  // Catalog & Custom CSV Upload Tab
  function renderCatalogTab() {
    const tbody = document.getElementById("catalogTableBody");
    if (!tbody) return;

    tbody.innerHTML = marketData.catalog
      .map((item) => {
        const isAsset = item.category === "asset";
        return `
        <tr>
          <td><strong>${item.id}</strong></td>
          <td>${escapeHtml(item.name)}</td>
          <td><span class="tag ${isAsset ? "tag-asset" : "tag-indicator"}">${isAsset ? "💹 매매 가능 자산" : "📊 시그널 전용 지표"}</span></td>
          <td>${escapeHtml(item.group || "")}</td>
          <td>${escapeHtml(item.actualStart || "1970-01-02")}</td>
          <td>${item.startValue} → <strong>${item.endValue}</strong> (${item.unit})</td>
          <td style="font-size:11.5px;color:var(--text-muted);">${escapeHtml(item.desc || "")}</td>
          <td style="white-space:nowrap;">
            <button type="button" class="btn btn-sm js-cat-preview" data-id="${item.id}">📈 차트보기</button>
            <button type="button" class="btn btn-sm js-cat-dl" data-id="${item.id}">CSV 다운</button>
            ${
              item.isCustom
                ? `<button type="button" class="btn btn-danger btn-sm js-cat-del" data-id="${item.id}">삭제</button>`
                : ``
            }
          </td>
        </tr>
      `;
      })
      .join("");

    tbody.querySelectorAll(".js-cat-preview").forEach((el) => {
      el.addEventListener("click", (e) => {
        const id = e.currentTarget.dataset.id;
        renderCatalogPreviewChart(id);
      });
    });

    tbody.querySelectorAll(".js-cat-dl").forEach((el) => {
      el.addEventListener("click", (e) => {
        const id = e.currentTarget.dataset.id;
        downloadSeriesCSV(id);
      });
    });

    tbody.querySelectorAll(".js-cat-del").forEach((el) => {
      el.addEventListener("click", async (e) => {
        const id = e.currentTarget.dataset.id;
        await StorageManager.deleteCustomSeries(id);
        delete marketData.series[id];
        marketData.catalog = marketData.catalog.filter((c) => c.id !== id);
        IndicatorEngine.clearIndicatorCache();
        rebuildCatalogMap();
        renderCatalogTab();
        renderAllocationsUI();
        renderRulesUI();
        showToast(`사용자 데이터 [${id}] 삭제 완료`, "info");
      });
    });

    renderCatalogPreviewChart("SPX");
  }

  function renderCatalogPreviewChart(ticker) {
    if (!global.Chart) return;
    const vals = marketData.series[ticker];
    const meta = catalogMap[ticker];
    if (!vals || !meta) return;

    const titleEl = document.getElementById("catPreviewTitle");
    if (titleEl) titleEl.textContent = `${meta.name} (${meta.id}) — 1970~현재 일별 추이`;

    const sampled = downsampleForChart(marketData.dates, { val: vals }, 600);
    const ctx = document.getElementById("chartCatalogPreview")?.getContext("2d");
    if (!ctx) return;
    if (charts.catalogPreview) charts.catalogPreview.destroy();

    charts.catalogPreview = new global.Chart(ctx, {
      type: "line",
      data: {
        labels: sampled.dates,
        datasets: [
          {
            label: `${meta.name} (${meta.unit})`,
            data: sampled.series.val,
            borderColor: meta.category === "asset" ? "#10b981" : "#f59e0b",
            backgroundColor: meta.category === "asset" ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
            borderWidth: 1.8,
            pointRadius: 0,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: "#cbd5e1" } } },
        scales: {
          x: { ticks: { color: "#94a3b8", maxTicksLimit: 10 }, grid: { display: false } },
          y: { ticks: { color: "#94a3b8" }, grid: { color: "rgba(148,163,184,0.1)" } },
        },
      },
    });
  }

  function downloadSeriesCSV(ticker) {
    const vals = marketData.series[ticker];
    if (!vals) return;
    const rows = ["Date,Close"];
    for (let i = 0; i < marketData.dates.length; i++) {
      rows.push(`${marketData.dates[i]},${vals[i]}`);
    }
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${ticker}_daily_1970_present.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Global UI Event Listeners
  function bindGlobalEvents() {
    // Tab switching
    document.querySelectorAll("[data-tab-target]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.getAttribute("data-tab-target");
        switchTab(target);
      });
    });

    // Theme toggle
    document.getElementById("btnThemeToggle")?.addEventListener("click", () => {
      const html = document.documentElement;
      const cur = html.getAttribute("data-theme");
      html.setAttribute("data-theme", cur === "light" ? "dark" : "light");
    });

    // Quick Date Chips
    document.querySelectorAll(".js-date-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        document.getElementById("cfgStartDate").value = chip.dataset.start;
        document.getElementById("cfgEndDate").value = marketData.endDate;
      });
    });

    // Quick Capital Chips
    document.querySelectorAll(".js-cap-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        document.getElementById("cfgCapital").value = chip.dataset.cap;
      });
    });

    // Rebalance selects
    document.getElementById("cfgRebPeriod")?.addEventListener("change", toggleRebalanceSubInputs);
    document.getElementById("cfgRebBandMode")?.addEventListener("change", toggleRebalanceSubInputs);

    // Add Allocation Asset button
    document.getElementById("btnAddAlloc")?.addEventListener("click", () => {
      currentConfig.allocations.push({ ticker: "SPX", weightPct: 10 });
      renderAllocationsUI();
    });

    // Normalize Allocations to 100%
    document.getElementById("btnNormalizeAlloc")?.addEventListener("click", () => {
      const sum = currentConfig.allocations.reduce((s, a) => s + (Number(a.weightPct) || 0), 0);
      if (sum > 0) {
        currentConfig.allocations.forEach((a) => {
          a.weightPct = Math.round((a.weightPct / sum) * 1000) / 10;
        });
        renderAllocationsUI();
      }
    });

    // Add Cross-Condition Rule button
    document.getElementById("btnAddRule")?.addEventListener("click", () => {
      currentConfig.rules.push({
        id: "rule_" + Date.now(),
        name: `교차 매매 규칙 #${currentConfig.rules.length + 1}`,
        enabled: true,
        logic: "AND",
        cooldownDays: 10,
        conditions: [
          {
            left: { ticker: "T10Y2Y", transform: "PRICE", p1: 20, p2: 2, p3: 9 },
            operator: "<",
            rightMode: "VALUE",
            rightValue: 0,
          },
        ],
        action: {
          type: "BUY",
          targetTicker: "NDX",
          sizingMode: "TOTAL_PCT",
          sizingValue: 20,
          fundingSource: "CASH_THEN_PRORATA",
        },
      });
      renderRulesUI();
    });

    // Run Backtest Buttons
    document.getElementById("btnRunBacktest")?.addEventListener("click", () => {
      executeCurrentBacktest(true);
      switchTab("tab-results");
      showToast("백테스트 실행 및 스코어보드 기록 완료!", "success");
    });

    document.getElementById("btnRunQuick")?.addEventListener("click", () => {
      executeCurrentBacktest(true);
      switchTab("tab-results");
      showToast("백테스트 실행 완료!", "success");
    });

    // Log/Linear scale toggle on Equity Chart
    document.getElementById("btnToggleScale")?.addEventListener("click", (e) => {
      isLogScale = !isLogScale;
      e.currentTarget.textContent = isLogScale ? "📐 현재: 로그 스케일 (Log)" : "📏 현재: 선형 스케일 (Linear)";
      if (lastResult) renderMainCharts(lastResult);
    });

    // Manual Save to Scoreboard button on Results tab
    document.getElementById("btnManualSaveSb")?.addEventListener("click", () => {
      if (!lastResult) return;
      const customName = prompt("스코어보드에 저장할 전략 이름을 입력하세요:", lastResult.configSnapshot.name);
      if (customName !== null) {
        StorageManager.addScoreboardEntry(lastResult, customName.trim() || lastResult.configSnapshot.name);
        updateScoreboardBadge();
        renderScoreboardTab();
        showToast("스코어보드에 저장되었습니다!", "success");
      }
    });

    // Scoreboard Sort & Controls
    document.getElementById("sbSortSelect")?.addEventListener("change", () => {
      renderScoreboardTab();
    });

    document.getElementById("btnClearScoreboard")?.addEventListener("click", () => {
      if (confirm("고정(📌)된 전략을 제외한 나머지 스코어보드 기록을 정리할까요?")) {
        selectedScoreboardIds.clear();
        StorageManager.clearScoreboard(true);
        renderScoreboardTab();
        showToast("고정 항목 외 이력이 정리되었습니다.", "info");
      }
    });

    document.getElementById("btnExportScoreboard")?.addEventListener("click", () => {
      const list = StorageManager.loadScoreboard();
      const blob = new Blob([JSON.stringify(list, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `quant_scoreboard_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    document.getElementById("inputImportScoreboard")?.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const imported = JSON.parse(reader.result);
          if (Array.isArray(imported)) {
            const existing = StorageManager.loadScoreboard();
            StorageManager.saveScoreboard([...imported, ...existing]);
            renderScoreboardTab();
            showToast(`${imported.length}개의 스코어보드 이력을 가져왔습니다!`, "success");
          }
        } catch (err) {
          showToast("JSON 파일 형식이 올바르지 않습니다.", "danger");
        }
      };
      reader.readAsText(file);
    });

    // Custom CSV Upload Form
    document.getElementById("formUploadCsv")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const idRaw = document.getElementById("csvTickerId").value.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "");
      const name = document.getElementById("csvTickerName").value.trim();
      const category = document.getElementById("csvCategory").value;
      const unit = document.getElementById("csvUnit").value.trim() || "$";
      const fileInput = document.getElementById("csvFileInput");
      const file = fileInput.files?.[0];

      if (!idRaw || !name || !file) {
        showToast("티커 코드, 이름, CSV 파일을 모두 선택해 주세요.", "danger");
        return;
      }

      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const aligned = StorageManager.parseAndAlignCSV(reader.result, marketData.dates);
          const entry = {
            id: idRaw,
            name,
            shortName: name,
            category,
            unit,
            actualStart: `${aligned.actualStart} (CSV ${aligned.rowCount}행)`,
            desc: `사용자 업로드 CSV (${file.name})`,
            values: aligned.values,
          };

          await StorageManager.saveCustomSeries(entry);
          marketData.series[idRaw] = aligned.values;

          const meta = {
            id: idRaw,
            name,
            shortName: name,
            category,
            group: category === "indicator" ? "사용자 추가 지표 (CSV)" : "사용자 추가 자산 (CSV)",
            unit,
            actualStart: entry.actualStart,
            desc: entry.desc,
            startValue: aligned.values[0],
            endValue: aligned.values[aligned.values.length - 1],
            isCustom: true,
          };
          const existingIdx = marketData.catalog.findIndex((c) => c.id === idRaw);
          if (existingIdx >= 0) marketData.catalog[existingIdx] = meta;
          else marketData.catalog.push(meta);

          IndicatorEngine.clearIndicatorCache();
          rebuildCatalogMap();
          renderCatalogTab();
          renderAllocationsUI();
          renderRulesUI();
          renderBenchmarkOptions();
          showToast(`[${name} (${idRaw})] CSV 데이터가 DB에 추가되었습니다!`, "success");
          e.target.reset();
        } catch (err) {
          showToast("CSV 파싱 실패: " + err.message, "danger");
        }
      };
      reader.readAsText(file);
    });

    // Toggle switch listeners
    document.getElementById("toggleRebalance")?.addEventListener("change", () => {
      updateToggleUI();
      if (currentConfig) {
        currentConfig.rebalanceEnabled = document.getElementById("toggleRebalance").checked;
      }
    });

    document.getElementById("toggleRules")?.addEventListener("change", () => {
      updateToggleUI();
      if (currentConfig) {
        currentConfig.rulesEnabled = document.getElementById("toggleRules").checked;
      }
    });

    // Dynamic Yearly Benchmark Selector change listener
    document.getElementById("resYearlyBenchSelect")?.addEventListener("change", (e) => {
      if (lastResult) {
        renderYearlyChart(lastResult, e.target.value);
      }
    });

    // Help Modal event listeners
    document.getElementById("btnHelpModalClose")?.addEventListener("click", closeHelpModal);
    document.getElementById("btnHelpModalOk")?.addEventListener("click", closeHelpModal);
    document.getElementById("helpModal")?.addEventListener("click", (e) => {
      if (e.target.id === "helpModal") closeHelpModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeHelpModal();
    });

    // Delegated click listener for (?) inline help buttons
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".btn-help-inline");
      if (btn && btn.dataset.help) {
        e.preventDefault();
        e.stopPropagation();
        openHelpModal(btn.dataset.help);
      }
    });
  }

  function switchTab(tabId) {
    document.querySelectorAll(".tab-panel").forEach((p) => {
      p.classList.toggle("active", p.id === tabId);
    });
    document.querySelectorAll("[data-tab-target]").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-tab-target") === tabId);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  window.addEventListener("DOMContentLoaded", initApp);
})(window);
