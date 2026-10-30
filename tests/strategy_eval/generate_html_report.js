/**
 * tests/strategy_eval/generate_html_report.js
 *
 * Multi-Tab Interactive HTML Report Generator for `c:\cowork\invest_backtest\test-result.html`
 *
 * Tab Architecture:
 * - Tab 1 (`exp3_post_imf`): 🇰🇷 코스피 200 · 현금 포스트 IMF (1999~2026, 27.8년 실전 최적 50선) [DEFAULT ACTIVE]
 * - Tab 2 (`exp1_3asset`): 🌐 코스피 200 · 나스닥 100 · KRX 금현물 3자산 (50선)
 * - Tab 3 (`exp2_kospicash`): 🏛️ 코스피 200 · 현금 30년 전수 (1996~2026 IMF포함 참고용 50선)
 * - Tab 4 (`glossary_tab`): 📖 퀀트 지표 · 금융 용어 전체 해설집
 */

const fs = require("fs");
const path = require("path");

const VAULT_EXP1_PATH = path.join(__dirname, "vault_mapping.json");
const VAULT_EXP2_PATH = path.join(__dirname, "vault_mapping_kospi_cash.json");
const VAULT_EXP3_PATH = path.join(__dirname, "vault_mapping_kospi_cash_post_imf.json");
const VAULT_EXP4_PATH = path.join(__dirname, "vault_mapping_kospi_cash_post_imf_close.json");
const VAULT_EXP5_PATH = path.join(__dirname, "vault_mapping_ndx_cash.json");
const OUT_HTML_PATH = path.join(__dirname, "..", "..", "test-result.html");

// Top 10 Blind Reviews for Experiment #5 (Post-IMF: NASDAQ 100 + Cash Only, Next-Day Close Execution, 1999-01-04 ~ 2026-10-27)
const EXP5_TOP10_REVIEWS = [
  {
    rank: 1,
    blindId: "NDX_BLIND_005",
    badge: "🏆 나스닥 종합 1위 (20/60 EMA 추세스윙 · CAGR +8.53%, MDD -38.87%)",
    reviewerComment:
      "나스닥 100 단독 보유의 치명적 약점인 2000년 닷컴버블 -80.92% 대폭락을 -38.87%로 절반 이하로 압축하면서도, 27.8년간 CAGR +8.53%(원금 1,000만원 → 9,720만원)의 폭발적인 복리 성장을 달성했습니다. 20/60일 지수이동평균 추세 필터로 하락장에서는 현금으로 대피하고 상승 추세에서만 나스닥 레버리지를 누려 Calmar 0.219, Sharpe 0.471로 전체 1위에 올랐습니다.",
  },
  {
    rank: 2,
    blindId: "NDX_BLIND_015",
    badge: "🥈 나스닥 종합 2위 (27.8년 최고 복리 CAGR +9.35% · 1,000만원→1.18억원)",
    reviewerComment:
      "전체 50개 나스닥 후보 중 가장 높은 연평균 복리수익률(CAGR +9.35%, 1,000만원 → 1억 1,885만원, 11.9배)을 달성했습니다. 나스닥 100% 매수보유(CAGR +10.93%)의 성장성을 거의 90% 흡수하면서도, 200일선 이탈 시 전량 현금화 규칙을 통해 닷컴버블 낙폭을 -80.92%에서 -55.46%로 25.5%p 대폭 방어했습니다.",
  },
  {
    rank: 3,
    blindId: "NDX_BLIND_048",
    badge: "🥉 나스닥 종합 3위 (고점 컷오프 & 저점 매수 하이브리드 · Calmar 0.302)",
    reviewerComment:
      "120일 직전 최고점 대비 -12% 밀리면 즉각 현금화하고, 과매도 구간에서 저가 분할매수하여 27.8년 MDD를 단 -18.90%로 봉쇄했습니다. CAGR +5.71%, Calmar 0.302, 파라미터 안정성 97.4%로 과최적화가 원천 배제된 강력한 실전 전략입니다.",
  },
  {
    rank: 4,
    blindId: "NDX_BLIND_023",
    badge: "🏅 나스닥 종합 4위 (서브-20% 낙폭 제어 & Sharpe 0.482 · CAGR +5.44%)",
    reviewerComment:
      "120일(반년) 모멘텀이 양(+)일 때만 나스닥에 편입하고 음(-)이면 현금에 머무는 단순하고 강력한 절대모멘텀 원리로 27.8년 MDD를 -19.98%로 틀어막았습니다. Sharpe 0.482, Sortino 0.724로 위험대비 초과수익성이 최상위입니다.",
  },
  {
    rank: 5,
    blindId: "NDX_BLIND_045",
    badge: "🏅 나스닥 종합 5위 (변동성 스퀴즈 스나이퍼 · MDD -14.06%, Calmar 0.350)",
    reviewerComment:
      "볼린저 밴드폭 압축(스퀴즈) 후 상향 돌파 시에만 적극 진입하고 하단 이탈 시 칼손절하여 27.8년 MDD를 겨우 -14.06%로 묶었습니다. 특히 최근 15.8년 OOS 구간에서 CAGR +6.21%, MDD -7.76%로 현대 시장 적응력이 최상위입니다.",
  },
  {
    rank: 6,
    blindId: "NDX_BLIND_018",
    badge: "🎖️ 나스닥 종합 6위 (소르티노 0.771 전체 1위 · MDD -12.90%)",
    reviewerComment:
      "정통 골든크로스(50>200) 및 데드크로스(50<200) 레짐 필터링을 통해 하방 변동성만 선택적으로 통제하여 Sortino 0.771(전체 1위), Sharpe 0.509, Calmar 0.368, MDD -12.90%를 기록했습니다.",
  },
  {
    rank: 7,
    blindId: "NDX_BLIND_001",
    badge: "🎖️ 나스닥 종합 7위 (VIX 역발상 분할매수 · 닷컴버블 +1.4% 양수익 방어)",
    reviewerComment:
      "미국 VIX 지수가 34 이상으로 치솟을 때 현금으로 나스닥을 저가 매집하고, 평온기(VIX<=18)에 이익을 실현하여 2000년 닷컴버블 당시 오히려 +1.4%의 양(+)의 수익을 실현했습니다. MDD -13.03%, Calmar 0.369를 달성했습니다.",
  },
  {
    rank: 8,
    blindId: "NDX_BLIND_028",
    badge: "🎖️ 나스닥 종합 8위 (거시경제 경기침체 카나리아 · CAGR +5.51%, MDD -22.77%)",
    reviewerComment:
      "미국 국채 10Y-2Y 스프레드 역전 후 경기침체 스티프닝 전환 시 현금 비중을 85%로 확대하여 2000년 닷컴버블과 2008년 금융위기 충격을 사전에 회피했습니다. CAGR +5.51%, MDD -22.77%, Calmar 0.242를 기록했습니다.",
  },
  {
    rank: 9,
    blindId: "NDX_BLIND_034",
    badge: "🎖️ 나스닥 종합 9위 (연 1.2회 초저회전 패시브 알파 · CAGR +6.36%)",
    reviewerComment:
      "연평균 1.22회의 극도로 낮은 매매만으로 27.8년 CAGR +6.36%(원금 5.5배 증식)를 달성했으며, 파라미터 안정성 98.7%로 과최적화 위험을 완벽히 차단했습니다.",
  },
  {
    rank: 10,
    blindId: "NDX_BLIND_042",
    badge: "🎖️ 나스닥 종합 10위 (10% 미만 최저 MDD -9.67% · Calmar 0.376)",
    reviewerComment:
      "나스닥 편입 전략 중 유일하게 27.8년 MDD를 단자리 수(-9.67%)로 묶어둔 철벽 방어 전략입니다. Ulcer Index 1.91로 심리적 고통 지수가 극히 낮아 퇴직연금 및 대형 자금의 안정적 운용에 최적화되었습니다.",
  },
];

// Top 10 Blind Reviews for Experiment #4 (Post-IMF: KOSPI + Cash Only, Next-Day Close Execution, 1999-01-04 ~ 2026-10-27)
const EXP4_TOP10_REVIEWS = [
  {
    rank: 1,
    blindId: "CLOSE_BLIND_036",
    badge: "🏆 익일종가 종합 1위 (60일 수급선 돌파 챔피언 · CAGR +8.68%, MDD -31.41%)",
    reviewerComment:
      "전일 종가 판정 후 다음날 종가(T Close) 체결 환경에서도 27.8년간 CAGR +8.68%(원금 1,000만원 → 1억 136만원)를 달성하여 코스피 100% 매수보유(+8.56%)를 초과 달성했습니다. 특히 익일 시가 체결 대비 아침 동시호가 패닉 갭하락 매도를 회피하고 장중 가격이 안정된 종가에 체결되면서 MDD가 -34.67%에서 -31.41%로 3.26%p 더 개선되었으며, Calmar 0.276, Sharpe 0.455로 전체 1위를 수성했습니다. 2000년 닷컴버블 당시 오히려 +14.65%의 경이적인 수익을 냈습니다.",
  },
  {
    rank: 2,
    blindId: "CLOSE_BLIND_042",
    badge: "🥈 익일종가 종합 2위 (초단기 휩소 제거 고성장 알파 · CAGR +8.11%)",
    reviewerComment:
      "익일 종가 체결 시 하루 동안 시장 추세를 추가로 확인하고 체결되므로 거짓 신호가 대폭 억제되었습니다. 27.8년 CAGR +8.11%(원금 8.7배 증식), 2011~2026년 현대 OOS 구간에서 CAGR +6.28%, MDD -21.66%, Calmar 0.290으로 현대 시장 적응력이 최상위입니다. 2000년 닷컴버블에서도 +11.23% 플러스 수익을 기록했습니다.",
  },
  {
    rank: 3,
    blindId: "CLOSE_BLIND_044",
    badge: "🥉 익일종가 종합 3위 (파라미터 안정성 98.8% · CAGR +6.35%, MDD -30.28%)",
    reviewerComment:
      "연간 3.7회의 절제된 매매로 27.8년 CAGR +6.35%, MDD -30.28%, Calmar 0.210을 달성했습니다. ±15% 파라미터 섭동 테스트에서 98.8%의 초고안정성을 보여 과최적화 위험이 전혀 없으며, 종가 체결 시 코스피 장기 상승 파동을 안정적으로 추종합니다.",
  },
  {
    rank: 4,
    blindId: "CLOSE_BLIND_035",
    badge: "🏅 익일종가 종합 4위 (7.4% 고복리 성장 & 하락장 칼손절 · CAGR +7.42%)",
    reviewerComment:
      "최고점 대비 -9% 하락 시 익일 종가에 현금으로 전량 대피하는 컷오프를 통해 CAGR +7.42%(원금 7.3배 증식), MDD -36.45%, Calmar 0.204를 기록했습니다. 하락장 진입 시 장중 반등을 기다려 종가에 매도함으로써 시가 투매로 인한 슬리피지를 대폭 절감했습니다.",
  },
  {
    rank: 5,
    blindId: "CLOSE_BLIND_021",
    badge: "🏅 익일종가 종합 5위 (서브-16% 극저낙폭 챔피언 · MDD -15.07%, Calmar 0.351)",
    reviewerComment:
      "익일 종가 체결 시 27.8년 MDD가 단 -15.07%(코스피 -55.73%의 1/4 미만)로 50개 전체 후보 중 가장 강력한 하방 방어력을 기록했습니다. Calmar 0.351, Sortino 0.630, Sharpe 0.437로 위험조정수익비가 극대화되었으며, 2000년 닷컴버블 당시 +14.02%의 대규모 플러스 수익을 실현했습니다.",
  },
  {
    rank: 6,
    blindId: "CLOSE_BLIND_027",
    badge: "🎖️ 익일종가 종합 6위 (연 1.2회 초저빈도 & 무결점 안정성 98.4%)",
    reviewerComment:
      "1년에 단 1.22회만 매매하면서도 종가 체결을 통해 27.8년 CAGR +5.60%, MDD -22.68%, Calmar 0.247을 기록했습니다. 잦은 매매가 불가능한 직장인 및 대형 자금 운용에 최적화된 패시브 전략입니다.",
  },
  {
    rank: 7,
    blindId: "CLOSE_BLIND_007",
    badge: "🎖️ 익일종가 종합 7위 (파라미터 안정성 100.0% 만점 · MDD -22.68%)",
    reviewerComment:
      "파라미터 섭동 안정성 100.0% 만점을 획득하여 실거래 환경에서 성능 저하가 발생하지 않는 완전 무결한 밸런스를 입증했습니다. 27.8년 MDD -22.68%, Ulcer Index 6.81로 심리적 고통 지수가 극히 낮습니다.",
  },
  {
    rank: 8,
    blindId: "CLOSE_BLIND_047",
    badge: "🎖️ 익일종가 종합 8위 (연간 승률 78.6% & 위기방어 우수 · MDD -23.75%)",
    reviewerComment:
      "28개 연도 중 22개 연도에서 플러스 수익을 거두어 연간 승률 78.6%를 달성했습니다. 2000년 닷컴버블(+15.22%)과 2020년 코로나19(+1.90%)를 모두 양(+)의 수익으로 방어하며 MDD를 -23.75%로 철저히 통제했습니다.",
  },
  {
    rank: 9,
    blindId: "CLOSE_BLIND_028",
    badge: "🎖️ 익일종가 종합 9위 (최저 MDD -14.02% 기록 · Calmar 0.344)",
    reviewerComment:
      "미국 반도체 지수의 선행 신호를 받아 한국 장 마감 종가에 매매함으로써, 27.8년 최대낙폭을 겨우 -14.02%로 억제해 50개 후보 중 최저 MDD를 달성했습니다. Sortino 0.657, 2000년 닷컴버블 +15.00%를 기록했습니다.",
  },
  {
    rank: 10,
    blindId: "CLOSE_BLIND_043",
    badge: "🎖️ 익일종가 종합 10위 (현대 OOS MDD -8.82% & 최저 연간손실 -13.5%)",
    reviewerComment:
      "달러인덱스 급등 위험을 감지해 종가에 안전하게 현금으로 대피합니다. 최근 15.8년 OOS 구간에서 MDD가 단 -8.82%에 불과하며, 2000년 닷컴버블 당시 +13.51% 수익을 거두어 하방 리스크를 원천 봉쇄했습니다.",
  },
];

// Top 10 Blind Reviews for Experiment #3 (Post-IMF: KOSPI + Cash Only, 1999-01-04 ~ 2026-10-27)
const EXP3_TOP10_REVIEWS = [
  {
    rank: 1,
    blindId: "POST_IMF_BLIND_004",
    badge: "🏆 포스트IMF 종합 1위 (코스피 Buy&Hold 압도 · CAGR +8.87%, Sharpe 0.480)",
    reviewerComment:
      "27.8년간 코스피 100% 매수보유(CAGR +8.56%)를 초과 달성하여 원금 1,000만원을 1억 589만원(10.6배)으로 증식시켰습니다. 그러면서도 MDD는 -34.67%로 코스피(-55.73%) 대비 21%p 이상 대폭 감축했으며, 특히 2000년 닷컴버블 붕괴 당시 오히려 +13.58%의 경이적인 양(+)의 수익률을 창출했습니다. Sharpe(0.480), Sortino(0.684), Calmar(0.256) 전 부문 1위입니다.",
  },
  {
    rank: 2,
    blindId: "POST_IMF_BLIND_008",
    badge: "🥈 포스트IMF 종합 2위 (고성장 알파 & 현대 OOS 최강자 · CAGR +8.19%)",
    reviewerComment:
      "27.8년 CAGR +8.19%(원금 8.9배 증식)를 기록하며, 특히 2011~2026년 현대 OOS 구간에서 CAGR +6.15%, MDD -21.12%, Calmar 0.291로 현대 시장 적응력이 최상위입니다. 2000년 닷컴버블에서도 +9.40% 플러스 수익을 달성했습니다.",
  },
  {
    rank: 3,
    blindId: "POST_IMF_BLIND_017",
    badge: "🥉 포스트IMF 종합 3위 (황금분할 리스크-리턴 마스터 · MDD -26.70%, CAGR +6.79%)",
    reviewerComment:
      "6.79%의 견실한 CAGR을 유지하면서 27.8년 MDD를 단 -26.70%(코스피의 절반 미만)로 통제하고 Calmar 0.254, Ulcer Index 7.93을 기록했습니다. 2000년 닷컴버블(+0.91%)과 2020년 코로나19(+2.96%) 두 차례 대폭락장에서 모두 플러스 수익을 거두었습니다.",
  },
  {
    rank: 4,
    blindId: "POST_IMF_BLIND_048",
    badge: "🏅 포스트IMF 종합 4위 (서브-27% 철벽 방어선 · MDD -26.58%, 닷컴 +8.1%)",
    reviewerComment:
      "27.8년 MDD -26.58%, 연간 최악의 해 손실 -17.74%로 극도의 손실 안정성을 확보했습니다. 10Y-2Y 장단기 금리차 역전 후 스티프닝 국면을 활용해 2000년 닷컴버블 당시 +8.08%의 높은 수익을 거두었습니다.",
  },
  {
    rank: 5,
    blindId: "POST_IMF_BLIND_010",
    badge: "🏅 포스트IMF 종합 5위 (극저낙폭 고효율 밸런스 앵커 · MDD -24.08%, Calmar 0.249)",
    reviewerComment:
      "27.8년 MDD가 -24.08%로 6% 근접 고수익군 중 가장 낮으며, 연평균 3.93회의 절제된 매매만으로 연간 승률 75.0%, Sharpe 0.375, Ulcer Index 7.35를 달성했습니다.",
  },
  {
    rank: 6,
    blindId: "POST_IMF_BLIND_046",
    badge: "🎖️ 포스트IMF 종합 6위 (저궤양·초고안정성 복리 엔진 · Ulcer 6.76, 안정성 99.5%)",
    reviewerComment:
      "파라미터 섭동 안정성 99.5%로 과최적화 위험이 사실상 제로이며, Ulcer Index 6.76으로 심리적 고통 지수가 극히 낮습니다. CAGR +6.44%, 연간 승률 75.0%, 2020년 코로나 당시 +3.71% 수익을 기록했습니다.",
  },
  {
    rank: 7,
    blindId: "POST_IMF_BLIND_011",
    badge: "🎖️ 포스트IMF 종합 7위 (28%대 낙폭 수비수 · CAGR +6.34%, MDD -28.02%)",
    reviewerComment:
      "미 10년물 국채금리 급등을 성공적으로 방어하며 27.8년 CAGR +6.34%, MDD -28.02%, Calmar 0.226을 기록했습니다. 현대 15.8년 OOS 구간에서도 MDD -18.49%, Calmar 0.266으로 우수한 방어력을 지속했습니다.",
  },
  {
    rank: 8,
    blindId: "POST_IMF_BLIND_043",
    badge: "🎖️ 포스트IMF 종합 8위 (최저 연간 손실 -13.8% · CAGR +6.29%, 승률 75%)",
    reviewerComment:
      "달러인덱스(DXY) 발작을 방어하여 28개 연도 중 최악의 단일 연도 손실이 -13.76%에 불과합니다. 27.8년 MDD -27.82%, CAGR +6.29%, 연간 승률 75.0%로 실전 지속성이 매우 높습니다.",
  },
  {
    rank: 9,
    blindId: "POST_IMF_BLIND_006",
    badge: "🎖️ 포스트IMF 종합 9위 (7% 근접 고수익 & 연 1.2회 매매 · CAGR +6.98%)",
    reviewerComment:
      "연간 1.22회라는 극도로 낮은 매매만으로 27.8년간 CAGR +6.98%(원금 6.5배 증식)를 달성했으며, 파라미터 안정성 99.7%로 과최적화 위험을 완벽히 차단했습니다.",
  },
  {
    rank: 10,
    blindId: "POST_IMF_BLIND_012",
    badge: "🎖️ 포스트IMF 종합 10위 (안정적 6.5% 복리 증식의 표준 · CAGR +6.45%, MDD -33.08%)",
    reviewerComment:
      "60거래일 주기와 ±6%p 밴드 리밸런싱을 결합하여 27.8년 CAGR +6.45%, MDD -33.08%, 파라미터 안정성 96.9%를 달성하며 10위에 안착했습니다.",
  },
];

// Top 10 Blind Reviews for Experiment #1 (3-Asset: KOSPI + NDX + KRX_GOLD, 1996~2026)
const EXP1_TOP10_REVIEWS = [
  {
    rank: 1,
    blindId: "BLIND_018",
    badge: "🏆 종합 1위 (30년 최저 MDD -29.54% 챔피언)",
    reviewerComment:
      "50개 전체 후보 중 유일하게 30.3년 전수 구간 MDD를 -29.54%(30% 미만)로 억제한 독보적 수석 전략입니다. Calmar Ratio 0.419(전체 1위), 최악의 해 수익률 -12.89%, 최대 수중회복기간 976일(유일한 1,000일 미만), 5대 역사적 위기 평균 수익률 +11.81%(IMF +37.1%, 금융위기 +36.1%, 코로나 +13.4%), 파라미터 안정성 100.0%를 달성했습니다.",
  },
  {
    rank: 2,
    blindId: "BLIND_039",
    badge: "🥈 종합 2위 (최저 궤양지수 Ulcer 9.37)",
    reviewerComment:
      "50개 후보 중 투자자의 장기 심리적 고통을 측정하는 Ulcer Index(9.37)가 가장 낮으며, 30.3년 MDD -32.64%(전체 2위), Calmar 0.385(전체 2위), CAGR 12.57%, 연간 승률 83.9%를 기록했습니다. 파라미터 섭동 안정성도 98.7%로 매우 견고합니다.",
  },
  {
    rank: 3,
    blindId: "BLIND_019",
    badge: "🥉 종합 3위 (최악연도 방어 1위 & 위기알파)",
    reviewerComment:
      "30.3년 CAGR 12.88%, MDD -35.77%, Calmar 0.360을 기록하며 하위 후보군을 파레토 지배합니다. 특히 31개 연도 중 최악의 해 수익률이 -12.42%로 전체 1위 방어력을 보였고, 5대 위기 평균 수익률 +11.45%(IMF +46.7%, 금융위기 +34.6%)와 파라미터 안정성 99.4%를 입증했습니다.",
  },
  {
    rank: 4,
    blindId: "BLIND_045",
    badge: "🏅 종합 4위 (초저회전·고효율 방어)",
    reviewerComment:
      "연평균 3.79회(주당 0.073회)의 극도로 절제된 매매만으로 30.3년 CAGR 12.93%, MDD -36.87%(전체 4위), Calmar 0.351을 달성했습니다. 2011~2026년 현대 OOS 구간에서도 CAGR 12.47%, MDD -22.79%로 일관된 성과를 유지했습니다.",
  },
  {
    rank: 5,
    blindId: "BLIND_028",
    badge: "🏅 종합 5위 (연간승률 90.3% & 현대 OOS 최강)",
    reviewerComment:
      "31개 연도 중 28개 연도에서 플러스 수익(연간 승률 90.3%, 전체 1위)을 기록하고 CAGR 13.54%(원금 46.8배 증식), MDD -40.83%를 달성했습니다. 특히 최근 15.8년 OOS 구간에서 CAGR 13.70%, MDD -21.35%(Calmar 0.642)로 현대 시장 적응력이 최상위입니다.",
  },
  {
    rank: 6,
    blindId: "BLIND_006",
    badge: "🎖️ 종합 6위 (30년 vs 현대 OOS 무감쇠 일관성)",
    reviewerComment:
      "30.3년 장기 CAGR(12.74%)과 최근 15.8년 OOS CAGR(12.74%)이 소수점 둘째 자리까지 일치하는 무감쇠(Zero-Decay) 일관성을 보였으며, 30년 MDD를 -39.17%(40% 미만)로 안정적으로 통제했습니다.",
  },
  {
    rank: 7,
    blindId: "BLIND_032",
    badge: "🎖️ 종합 7위 (고성장 파레토 최적 CAGR 13.79%)",
    reviewerComment:
      "Top 10 중 가장 높은 장기 복리 수익률(30.3년 CAGR 13.79%, 1,000만원 → 5억 9만원 / 현대 OOS CAGR 14.19%)을 달성하면서도 MDD를 -42.28%로 방어하여 유사 수익률 경쟁 후보(MDD -47~-51%)를 압도했습니다.",
  },
  {
    rank: 8,
    blindId: "BLIND_030",
    badge: "🎖️ 종합 8위 (저궤양 고수익 밸런서)",
    reviewerComment:
      "CAGR 13.39%, MDD -41.14%, Calmar 0.325, Ulcer Index 10.70을 기록하며, 최근 15.8년 OOS 구간 연간 승률 93.8%와 최악의 해 수익률 -16.56%로 높은 안정성을 보였습니다.",
  },
  {
    rank: 9,
    blindId: "BLIND_050",
    badge: "🎖️ 종합 9위 (파라미터 안정성 99.8% 능동전략)",
    reviewerComment:
      "전술적 규칙을 포함한 능동 전략 중 파라미터 섭동 안정성 99.8%로 과최적화 위험이 사실상 제로(Flat Optimum)이며, 연 2.34회 저빈도 매매로 CAGR 13.28%, MDD -42.14%, 5대 위기 평균 수익률 +6.89%를 기록했습니다.",
  },
  {
    rank: 10,
    blindId: "BLIND_034",
    badge: "🎖️ 종합 10위 (위기방어 & 리스크조정수익 우위)",
    reviewerComment:
      "30.3년 CAGR 13.38%, MDD -41.93%, Calmar 0.319, Ulcer Index 10.75를 기록하며, 경쟁 후보군(BLIND_040, BLIND_017 등) 대비 더 낮은 MDD와 더 높은 CAGR 및 5대 위기 평균 수익률(+5.58%)로 Top 10을 완성했습니다.",
  },
];

// Top 10 Blind Reviews for Experiment #2 (KOSPI + Cash 30-Year Full Period including 1997 IMF)
const EXP2_TOP10_REVIEWS = [
  {
    rank: 1,
    blindId: "KC_BLIND_045",
    badge: "🏆 30년 종합 1위 (초저낙폭 절대방어 챔피언 · MDD -17.01%)",
    reviewerComment:
      "50개 코스피+현금 후보 중 30.3년 전수 구간 MDD가 겨우 -17.01%(코스피 단독 -64.66%의 1/4 수준)에 불과하며, Ulcer Index 4.28로 심리적 고통 지수 전체 최저치를 달성했습니다. 최근 15.8년 OOS MDD는 단 -10.55%이며, 2000년 닷컴버블 당시 오히려 +5.26% 수익을 기록했습니다.",
  },
  {
    rank: 2,
    blindId: "KC_BLIND_046",
    badge: "🥈 30년 종합 2위 (저낙폭·저궤양 안정형 · MDD -24.90%)",
    reviewerComment:
      "30.3년 MDD -24.90%, Ulcer Index 6.45로 Rank 1에 이어 두 번째로 낮은 변동성 고통을 기록하면서 CAGR 4.92%, 연간 승률 71.0%를 달성했습니다. 연평균 3.30회의 극저회전 매매와 파라미터 안정성 98.5%로 실거래 신뢰도가 매우 높습니다.",
  },
  {
    rank: 3,
    blindId: "KC_BLIND_034",
    badge: "🥉 30년 종합 3위 (파라미터 무결성 99.3% · Calmar 0.212)",
    reviewerComment:
      "±15% 파라미터 섭동 스트레스 테스트에서 안정성 99.3%를 기록해 과최적화 위험이 원천 배제된 전략입니다. CAGR 5.88%, MDD -27.73%, Calmar 0.212로 코스피 단독 보유(Calmar 0.104) 대비 2배 이상의 위험조정수익비를 달성했습니다.",
  },
  {
    rank: 4,
    blindId: "KC_BLIND_019",
    badge: "🏅 30년 종합 4위 (코스피 압살 복리수익 1위 · CAGR +8.70%)",
    reviewerComment:
      "안전한 현금을 병용하면서도 30.3년 CAGR +8.70%(1,000만원 → 1억 2,514만원)를 달성해 코스피 100% 보유(CAGR +6.73%, 7,179만원)를 +1.97%p 초과했습니다. 그러면서도 MDD는 -34.91%로 코스피(-64.66%)의 절반으로 줄여 Sharpe(0.459)·Sortino(0.663)·Calmar(0.249) 전 부문 1위를 차지했습니다.",
  },
  {
    rank: 5,
    blindId: "KC_BLIND_031",
    badge: "🏅 30년 종합 5위 (고수익 알파 & OOS Calmar 0.291)",
    reviewerComment:
      "30.3년 CAGR +7.98%(원금 10.2배 증식)로 코스피 지수를 크게 상회하면서 MDD를 -34.16%로 억제했습니다. 특히 2011~2026년 현대 OOS 구간에서 CAGR +6.15%, MDD -21.12%(Calmar 0.291)로 탁월한 현대 시장 적응력을 입증했습니다.",
  },
  {
    rank: 6,
    blindId: "KC_BLIND_036",
    badge: "🎖️ 30년 종합 6위 (위기 역발상 플러스 알파 · 닷컴 +9.3% / 코로나 +2.5%)",
    reviewerComment:
      "2000년 닷컴버블 붕괴기(+9.27%)와 2020년 코로나19 팬데믹(+2.51%) 두 차례 대폭락장에서 오히려 양(+)의 수익을 창출했습니다. 30.3년 MDD -27.17%, Ulcer Index 7.71로 강력한 하방 경직성을 보유하고 있습니다.",
  },
  {
    rank: 7,
    blindId: "KC_BLIND_026",
    badge: "🎖️ 30년 종합 7위 (6%대 복리수익 + 30% 방어벽 수호)",
    reviewerComment:
      "30.3년 CAGR +6.03%와 MDD -30.08%(Calmar 0.200)를 동시에 달성하여 코스피급 수익률을 유지하면서 낙폭을 절반 이하로 압축했습니다. 현대 15.8년 OOS 구간에서도 MDD -18.49%, Calmar 0.266으로 우수한 성과를 이어갔습니다.",
  },
  {
    rank: 8,
    blindId: "KC_BLIND_010",
    badge: "🎖️ 30년 종합 8위 (주간 최대 1회 초저회전 · MDD -28.55%)",
    reviewerComment:
      "주간 최대 매매 1회, 연평균 4.62회 매매만으로 30.3년 MDD를 -28.55%(현대 OOS MDD -17.45%)로 방어하고 CAGR +5.10%, 파라미터 안정성 97.8%를 기록한 실거래 친화적 전략입니다.",
  },
  {
    rank: 9,
    blindId: "KC_BLIND_030",
    badge: "🎖️ 30년 종합 9위 (코스피 수익률 추종 + 고통지수 61% 절감)",
    reviewerComment:
      "30.3년 CAGR +6.48%로 코스피 100% 보유(+6.73%)의 장기 성장성을 거의 그대로 흡수하면서, MDD는 -64.66% → -31.31%로, Ulcer Index는 22.47 → 8.66으로 61% 이상 감축했습니다. 2020년 코로나 위기에서도 +2.96% 수익을 기록했습니다.",
  },
  {
    rank: 10,
    blindId: "KC_BLIND_033",
    badge: "🎖️ 30년 종합 10위 (단단한 28%대 낙폭 제어 · Ulcer 8.22)",
    reviewerComment:
      "30.3년 CAGR +5.44%, MDD -28.64%, Ulcer Index 8.22, 현대 OOS MDD -19.06%, 파라미터 안정성 92.1%를 기록하며 동등 수익권 경쟁 후보들을 파레토 우위로 제치고 Top 10에 안착했습니다.",
  },
];

// Term Dictionary for Interactive `?` Help Buttons
const QUANT_TERMS_DICT = {
  cagr: {
    title: "CAGR (Compound Annual Growth Rate · 연평균 복리수익률)",
    short: "매년 복리로 자산이 몇 %씩 성장했는지 나타내는 핵심 수익성 지표",
    formula: "CAGR = (최종자산 / 초기자산)^(1 / 투자연수) - 1",
    detail:
      "단순 평균 수익률과 달리, 이익이 재투자되어 불어나는 '복리 효과'를 반영한 실제 연간 성장률입니다. 예를 들어 27.8년간 CAGR이 +8.87%라면 매년 은행 복리예금 8.87%짜리에 27.8년 내내 가입한 것과 같아 원금 1,000만원이 약 1억 589만원(10.6배)이 됩니다.",
    goodRange: "코스피 단독(8.56%)과 대등하거나 위험(MDD)을 크게 낮추면서 6~9% 이상을 유지하면 실전에서 매우 우수합니다.",
  },
  mdd: {
    title: "MDD (Maximum Drawdown · 최대낙폭)",
    short: "투자 기간 중 직전 최고점(Peak)에서 최저점(Trough)까지 가장 많이 까먹은 최대 손실률",
    formula: "MDD = min( (당일 자산가치 - 직전 최고 자산가치) / 직전 최고 자산가치 ) × 100%",
    detail:
      "투자자가 최악의 타이밍(고점)에 들어가서 최저점까지 버틸 때 계좌가 찍게 되는 최대 마이너스 폭입니다. 예를 들어 MDD가 -55.73%(포스트IMF 코스피 단독)라는 것은 1억원이 4,427만원까지 반토막 이상 줄어든 시기가 있었다는 뜻입니다. MDD가 깊을수록 원금 회복에 필요한 수익률(예: -50% 손실 시 +100% 수익 필요)이 기하급수적으로 커지므로, MDD 억제가 장기 복리의 핵심입니다.",
    goodRange: "장기 기준 -20% ~ -35% 이내면 매우 우수, 최근 15년 기준 -10% ~ -22% 이내면 최상위 방어력입니다.",
  },
  calmar: {
    title: "Calmar Ratio (칼마 지수)",
    short: "최악의 폭락(MDD) 1단위당 매년 얼마의 복리수익(CAGR)을 벌었는지 측정하는 가성비 지표",
    formula: "Calmar 지수 = 연평균 복리수익률(CAGR) / |최대낙폭(MDD)|",
    detail:
      "헤지펀드와 자산배분 전략을 평가할 때 가장 중시하는 지표 중 하나입니다. 수익률이 아무리 높아도 중간에 계좌가 -60% 폭락하면 실제 투자자는 버티지 못하고 손절합니다. 칼마 지수가 높을수록 '최대 고통(MDD) 대비 매년 따박따박 쌓이는 복리수익(CAGR)'이 월등하다는 뜻입니다.",
    goodRange: "초장기 백테스트 기준 0.20 이상이면 우수, 0.25~0.42 이상이면 최상위권입니다. (포스트IMF 코스피 단독은 0.154)",
  },
  sharpe: {
    title: "Sharpe Ratio (샤프 지수)",
    short: "전체 변동성(출렁임) 대비 무위험 금리를 초과하여 얻은 수익의 효율성 지표",
    formula: "Sharpe 지수 = (연평균 수익률 - 무위험 이자율) / 연간 수익률 표준편차(변동성)",
    detail:
      "노벨경제학상 수상자 윌리엄 샤프(William Sharpe)가 고안한 지표로, 계좌가 위아래로 출렁이는 위험(표준편차) 1단위를 감수할 때 은행 이자보다 얼마나 더 많은 초과수익을 올렸는지를 나타냅니다.",
    goodRange: "코스피+현금 조합 기준 0.35~0.48 이상, 글로벌 다중자산 결합 시 0.65~0.85 이상이면 매우 훌륭합니다.",
  },
  sortino: {
    title: "Sortino Ratio (소르티노 지수)",
    short: "상승 변동성은 제외하고, 오직 '하락할 때의 변동성(손실 위험)'만을 분모로 삼아 계산한 개량 샤프 지수",
    formula: "Sortino 지수 = (연평균 수익률 - 무위험 이자율) / 하방 표준편차(Downside Deviation)",
    detail:
      "샤프 지수는 주가가 급등할 때의 변동성까지 '위험'으로 간주해 불이익을 주는 단점이 있습니다. 반면 소르티노 지수는 투자자가 진짜 두려워하는 '마이너스 손실이 날 때의 변동성'만 위험으로 계산하므로, 손실은 짧게 끊고 수익은 길게 가져가는 추세추종·자산배분 전략의 진가를 정확히 보여줍니다.",
    goodRange: "0.50 이상이면 양호, 0.60~1.00 이상이면 하방 방어와 상승 포착이 매우 뛰어난 전략입니다.",
  },
  ulcer: {
    title: "Ulcer Index (궤양 지수 · 위궤양 지수)",
    short: "고점 대비 하락의 '깊이'뿐만 아니라 원금 회복까지 걸린 '기간(고통의 시간)'을 함께 측정하는 심리적 고통 지수",
    formula: "Ulcer Index = sqrt( 평균( 일별 전고점 대비 하락률(%)^2 ) )",
    detail:
      "MDD가 단순히 '가장 깊었던 단 하루의 손실률'만 본다면, 궤양 지수(Ulcer Index)는 손실 구간에 얼마나 오랫동안 머물렀는지를 제곱 평균으로 누적해 계산합니다. 즉 투자자가 속이 타들어가며 위궤양(Ulcer)에 걸릴 정도의 스트레스 총량을 뜻하며, 숫자가 낮을수록 원금 회복이 빠르고 계좌가 편안함을 의미합니다.",
    goodRange: "낮을수록 좋습니다. 코스피 단독은 20.88인 반면, 우수 전략은 6.7 ~ 11.8 수준으로 고통을 50~70% 줄여줍니다.",
  },
  oos: {
    title: "OOS (Out-of-Sample · 표본외 현대 구간 검증)",
    short: "과거 특수 환경에만 맞춘 우연이 아닌지 확인하기 위해 최근 15.8년(2011~2026) 현대 시장에서 별도 검증한 성적",
    formula: "Regime B (2011.01 ~ 2026.10, 15.82년) 독립 백테스트 성과",
    detail:
      "과거 20~30년 전체 평균만 보면 2000년대 초중반 신흥국 호황기에만 반짝 잘 나오고 최근 15년(2011~2026년 박스피 및 현대 알고리즘 장세)에는 전혀 안 통하는 전략이 섞일 수 있습니다. OOS 검증은 최근 15.8년 현대 시장에서도 여전히 낮은 MDD와 높은 수익률을 유지하는지 확인하는 핵심 관문입니다.",
    goodRange: "전수 구간과 최근 15.8년 OOS 구간의 Calmar·MDD가 일관되게 우수할수록 미래 실전에서도 통할 확률이 높습니다.",
  },
  stability: {
    title: "파라미터 안정성 (Parameter Perturbation Stability)",
    short: "이동평균 일수나 리밸런싱 밴드 설정값을 ±15%씩 흔들었을 때도 성적이 무너지지 않고 유지되는 비율",
    formula: "안정성(%) = (1 - |±15% 설정 변경 시 Calmar 변화율|) × 100%",
    detail:
      "특정 숫자(예: 꼭 60일선이어야만 하고 51일이나 69일로 바꾸면 수익이 박살 나는 경우)에 억지로 끼워 맞춘 '과최적화(Curve-Fitting)'를 걸러내는 지표입니다. 파라미터 안정성이 90~100%에 가까울수록 어떤 인근 설정값을 써도 성적이 비슷하게 나오는 '넓고 평탄한 고원(Flat Optimum)' 전략임을 뜻합니다.",
    goodRange: "85% 이상이면 양호, 95% ~ 100%이면 과최적화 위험이 사실상 없는 매우 견고한 전략입니다.",
  },
  vol_harvest: {
    title: "변동성 수확 (Volatility Harvesting · 섀넌의 도깨비)",
    short: "주식과 현금의 비율을 일정하게 유지하는 리밸런싱만으로 '비쌀 때 팔고 쌀 때 사는' 복리 초과수익을 창출하는 원리",
    formula: "정기(분기/반기) 또는 비중 이탈 밴드(±5%p 등) 도달 시 목표 비중으로 자동 복원",
    detail:
      "정보이론의 아버지 클로드 섀넌(Claude Shannon)이 증명한 원리로, 주식이 급등했을 때 일부 팔아 현금을 챙기고 폭락했을 때 그 현금으로 주식을 헐값에 사모아 장기 복리 수익률이 극대화됩니다.",
    goodRange: "별도의 복잡한 예측 지표 없이도 MDD를 절반 이하로 줄이면서 파라미터 안정성 95~100%를 달성하는 정통 기법입니다.",
  },
  disparity: {
    title: "이격도 (Disparity · 이동평균 대비 괴리율)",
    short: "현재 주가가 이동평균선(평균 가격)으로부터 몇 %나 위나 아래로 떨어져 있는지 나타내는 지표",
    formula: "이격도(%) = (당일 종가 / N일 이동평균선) × 100",
    detail:
      "이격도가 100%이면 주가가 이동평균선과 정확히 같다는 뜻입니다. 20일 이격도 92% 이하는 단기 과매도(바겐세일), 108% 이상은 단기 과열 상태를 의미합니다.",
    goodRange: "추세 필터(예: 이격도 < 98% 시 하락장 대피) 또는 역추세 저가매수에 모두 활용됩니다.",
  },
  rsi: {
    title: "RSI (Relative Strength Index · 상대강도지수)",
    short: "최근 14일 동안 상승폭과 하락폭의 비율을 0~100 사이 숫자로 나타내어 과열/투매 상태를 판별하는 지표",
    formula: "RSI = 상승폭 평균 / (상승폭 평균 + 하락폭 평균) × 100",
    detail:
      "보통 RSI가 30 이하로 내려가면 과매도 바닥권으로 보고 저가 매수하며, 70~75 이상으로 치솟으면 과열권으로 보고 일부 현금화합니다.",
    goodRange: "주간 3회 이하 매매 규율에서는 RSI(14) ≤ 25~30 매수, RSI(14) ≥ 70~75 매도 조건이 높은 승률을 보입니다.",
  },
  bb: {
    title: "볼린저 밴드 (%B 및 밴드폭 Bandwidth)",
    short: "주가가 이동평균 주변의 표준편차 통로 안에서 어디에 위치하는지(%B), 통로가 얼마나 좁아졌는지(밴드폭) 보여주는 지표",
    formula: "%B = (종가 - 하단선) / (상단선 - 하단선) × 100 | 밴드폭(Width) = (상단선 - 하단선) / 중심선 × 100",
    detail:
      "변동성이 극도로 응축(Squeeze)된 뒤 상단으로 터질 때 대세 상승장이 시작되는 경우가 많습니다.",
    goodRange: "볼린저 하단 이탈(%B ≤ 0~10) 저가매수 및 밴드폭 압축 돌파 전략은 실전 승률이 매우 높습니다.",
  },
  roc: {
    title: "ROC (Rate of Change · 기간 수익률/모멘텀)",
    short: "N거래일 전 가격 대비 현재 가격이 몇 % 상승 또는 하락했는지 측정하는 추세 강도 지표",
    formula: "ROC(N) = (당일 종가 / N일 전 종가 - 1) × 100%",
    detail:
      "게리 안토나치의 절대 모멘텀 전략 핵심 지표로, ROC가 플러스(+)면 주식을 보유하고 마이너스(-)로 돌아서면 현금으로 대피합니다.",
    goodRange: "코스피200의 경우 60일(3개월)~120일(6개월) ROC가 하락장 회피에 가장 효과적입니다.",
  },
  canary: {
    title: "카나리아 선행 시그널 (Canary Macro/Global Signal)",
    short: "탄광 속 카나리아처럼 코스피가 폭락하기 전에 미리 위험을 알려주는 글로벌·거시경제 선행 지표",
    formula: "매매는 코스피와 현금만 하되, 신호등으로 SOXX(반도체)·USDKRW(환율)·VIX(공포지수)·T10Y2Y(금리차) 활용",
    detail:
      "한국 증시는 수출 및 반도체 비중이 절대적이므로 미국 필라델피아 반도체지수(SOXX) 추세, 원달러환율(USDKRW), VIX를 신호등으로 활용할 때 폭락장 회피력이 극대화됩니다.",
    goodRange: "실험 #3(Post-IMF)에서 닷컴버블과 글로벌 금융위기를 방어하고 CAGR 8.87%를 달성한 핵심 동력입니다.",
  },
};

function formatKrw(val) {
  const n = Math.round(Number(val) || 0);
  if (n >= 100000000) {
    const eok = Math.floor(n / 100000000);
    const man = Math.round((n % 100000000) / 10000);
    return `${eok}억 ${man.toLocaleString()}만원`;
  }
  return `₩${n.toLocaleString()}`;
}

function formatRebalanceDesc(reb, enabled) {
  if (!enabled || !reb) return "리밸런싱 미사용 (Buy & Hold)";
  const pMap = {
    NONE: "정기주기 없음",
    MONTHLY: "매월 초 (Monthly)",
    QUARTERLY: "매분기 초 (Quarterly)",
    SEMIANNUAL: "매반기 초 (Semi-Annual)",
    YEARLY: "매년 초 (Yearly)",
    CUSTOM_DAYS: `${reb.customDays || 60}거래일 주기`,
  };
  const bMap = {
    NONE: "밴드 없음",
    ABS_PP: `절대비중 ±${reb.bandThreshold}%p 초과 시`,
    REL_PCT: `목표비중 대비 ±${reb.bandThreshold}% 이탈 시`,
  };
  return `${pMap[reb.periodMode] || reb.periodMode} / ${bMap[reb.bandMode] || reb.bandMode}`;
}

function helpBtn(termKey, label = "?") {
  return `<button type="button" class="help-btn" onclick="openTermModal('${termKey}')" title="클릭하여 '${QUANT_TERMS_DICT[termKey]?.title || termKey}' 설명 보기">${label}</button>`;
}

function buildExperimentData(vault, top10Reviews, expKey) {
  const entries = vault.entries;
  const baselines = vault.baselines;

  const top10 = top10Reviews.map((item) => {
    const v = entries[item.blindId];
    if (!v) throw new Error(`Missing vault entry for ${item.blindId} in ${expKey}`);
    return {
      ...item,
      ...v,
    };
  });

  const top10Set = new Map(top10.map((t) => [t.blindId, t.rank]));
  const all50 = Object.values(entries).sort((a, b) => {
    const rA = top10Set.get(a.blindId) || 999;
    const rB = top10Set.get(b.blindId) || 999;
    if (rA !== rB) return rA - rB;
    return b.blindCompositeScore - a.blindCompositeScore;
  });

  const chartPayload = {
    dates: top10[0].compactCurve.dates,
    baselines,
    top10Curves: top10.map((t) => ({
      rank: t.rank,
      blindId: t.blindId,
      originalId: t.originalId,
      name: t.name,
      cagrPct: t.fullMetrics.cagrPct,
      mddPct: t.fullMetrics.maxDrawdownPct,
      calmar: t.fullMetrics.calmar,
      normEquity: t.compactCurve.normEquity,
      drawdown: t.compactCurve.drawdown,
    })),
    scatter50: all50.map((s) => ({
      blindId: s.blindId,
      originalId: s.originalId,
      name: s.name,
      rank: top10Set.get(s.blindId) || null,
      mddAbs: Math.abs(s.fullMetrics.maxDrawdownPct),
      mddPct: s.fullMetrics.maxDrawdownPct,
      mddPeakDate: s.fullMetrics.maxDrawdownPeakDate,
      mddDate: s.fullMetrics.maxDrawdownDate,
      mddEvent: s.fullMetrics.mddEventDescription,
      cagrPct: s.fullMetrics.cagrPct,
      calmar: s.fullMetrics.calmar,
      alloc: s.summaryText.allocations,
    })),
  };

  return { top10, top10Set, all50, baselines, chartPayload };
}

function renderMddEpisodeCell(m) {
  const peak = m.maxDrawdownPeakDate || "-";
  const trough = m.maxDrawdownDate || "-";
  const rec = m.maxDrawdownRecoveryDate ? `${m.maxDrawdownRecoveryDate} 회복` : "미회복";
  const p2t = m.mddPeakToTroughDays || 0;
  const eventShort = (m.mddEventDescription || "").split("(")[0].trim();
  return `
    <div class="mdd-cell">
      <strong class="neg">${m.maxDrawdownPct.toFixed(2)}%</strong>
      <div class="mdd-timing-pill" title="${m.mddEventDescription || ""}">
        📅 ${peak} → <strong>${trough}</strong>
      </div>
      <div class="sub-num">하락 ${p2t}영업일 (${rec}) · Ulcer ${m.ulcerIndex.toFixed(1)}</div>
      <div class="mdd-event-tag">${eventShort}</div>
    </div>
  `;
}

function renderTabSectionHtml(expMeta, expData) {
  const { top10, top10Set, all50 } = expData;
  const k = expMeta.key;

  const top10TableRowsHtml = top10
    .map((t) => {
      const m = t.fullMetrics;
      const mo = t.oosMetrics;
      const rebText = formatRebalanceDesc(t.config.rebalance, t.config.rebalanceEnabled);
      const rulesHtml =
        t.summaryText.rules && t.summaryText.rules.length > 0
          ? t.summaryText.rules.map((r) => `<div class="rule-pill">${r}</div>`).join("")
          : `<span class="badge-static">정적 자산배분 + 리밸런싱 전용 (규칙 없음)</span>`;

      return `
        <tr class="top10-row ${t.rank <= 3 ? "top3-highlight" : ""}">
          <td class="td-rank"><span class="rank-badge rank-${t.rank}">#${t.rank}</span></td>
          <td>
            <div class="strat-title"><strong>[${t.originalId}]</strong> ${t.name}</div>
            <div class="strat-sub"><span class="blind-tag">${t.blindId}</span> · ${t.category}</div>
          </td>
          <td><div class="alloc-chip">${t.summaryText.allocations}</div></td>
          <td><div class="reb-text">${rebText}</div></td>
          <td class="td-rules">${rulesHtml}</td>
          <td class="num pos"><strong>+${m.cagrPct.toFixed(2)}%</strong><br/><span class="sub-num">${formatKrw(m.finalEquity)}</span></td>
          <td class="td-mdd">${renderMddEpisodeCell(m)}</td>
          <td class="num">
            <strong>${m.calmar.toFixed(3)}</strong><br/>
            <span class="sub-num">Sharpe ${m.sharpe.toFixed(2)} · Sortino ${m.sortino.toFixed(2)}</span>
          </td>
          <td class="num pos">+${mo.cagrPct.toFixed(2)}%<br/><span class="sub-num neg">MDD ${mo.maxDrawdownPct.toFixed(2)}% (${mo.maxDrawdownDate || "-"})</span></td>
          <td class="num ${t.avgCrisisReturn >= 0 ? "pos" : "neg"}">
            ${t.avgCrisisReturn >= 0 ? "+" : ""}${t.avgCrisisReturn.toFixed(2)}%<br/>
            <span class="sub-num neg">평균MDD ${t.avgCrisisMdd.toFixed(1)}%</span>
          </td>
          <td class="num">${m.avgTradesPerWeek.toFixed(2)}회/주<br/><span class="sub-num">최대 ${m.maxTradesInSingleWeek}회/주</span></td>
          <td class="num"><strong>${t.parameterStabilityPct.toFixed(1)}%</strong></td>
        </tr>
      `;
    })
    .join("\n");

  const top10CardsHtml = top10
    .map((t) => {
      const m = t.fullMetrics;
      const mo = t.oosMetrics;
      const cw = t.crisisStats;
      const rebText = formatRebalanceDesc(t.config.rebalance, t.config.rebalanceEnabled);
      const rulesList =
        t.summaryText.rules && t.summaryText.rules.length > 0
          ? t.summaryText.rules
              .map(
                (r, idx) =>
                  `<li><strong>규칙 ${idx + 1}:</strong> ${r} <em>(${expMeta.execTimingRule || "전일 종가 판정 → 익일 시가 체결"})</em></li>`
              )
              .join("")
          : `<li><strong>정적 리밸런싱 전용:</strong> 별도 마켓타이밍 매매 규칙 없이 목표 비중과 리밸런싱 조건(${rebText})만으로 변동성 수확(Volatility Harvesting) 수행</li>`;

      const recText = m.maxDrawdownRecoveryDate
        ? `${m.maxDrawdownRecoveryDate} 전고점 완전 회복 (총 수중 기간 ${m.mddTotalUnderwaterDays}영업일)`
        : `기간 내 미회복`;

      // Render crisis mini items based on available keys
      const crisisKeys = Object.keys(cw);
      const crisisLabels = {
        imf_1997: "97 IMF 외환위기",
        dotcom_2000: "00 닷컴버블",
        gfc_2008: "08 금융위기",
        covid_2020: "20 코로나 팬데믹",
        ratehike_2022: "22 고금리 하락장",
      };

      const crisisMiniHtml = crisisKeys
        .map((ck) => {
          const c = cw[ck];
          return `
            <div class="crisis-item">
              <div class="c-name">${crisisLabels[ck] || ck}</div>
              <div class="c-val ${c.returnPct >= 0 ? "pos" : "neg"}">${c.returnPct >= 0 ? "+" : ""}${c.returnPct.toFixed(1)}%</div>
              <div class="c-mdd">MDD ${c.mddPct.toFixed(1)}%</div>
            </div>
          `;
        })
        .join("");

      return `
        <div class="detail-card">
          <div class="detail-card-header">
            <div>
              <span class="badge-rank">${t.badge}</span>
              <h3 class="detail-title">#${t.rank}. [${t.originalId}] ${t.name} <span class="blind-id-pill">심사ID: ${t.blindId}</span></h3>
              <p class="detail-rationale">${t.rationale}</p>
            </div>
            <div class="detail-kpi-box">
              <div class="kpi-mini">
                <span class="kpi-label">연평균 복리(CAGR) ${helpBtn("cagr")}</span>
                <span class="kpi-val pos">+${m.cagrPct.toFixed(2)}%</span>
              </div>
              <div class="kpi-mini">
                <span class="kpi-label">최대낙폭(MDD) ${helpBtn("mdd")}</span>
                <span class="kpi-val neg">${m.maxDrawdownPct.toFixed(2)}%</span>
              </div>
              <div class="kpi-mini">
                <span class="kpi-label">Calmar ${helpBtn("calmar")} / Sortino ${helpBtn("sortino")}</span>
                <span class="kpi-val">${m.calmar.toFixed(3)} / ${m.sortino.toFixed(2)}</span>
              </div>
              <div class="kpi-mini">
                <span class="kpi-label">1,000만원 → 최종자산</span>
                <span class="kpi-val accent">${formatKrw(m.finalEquity)}</span>
              </div>
            </div>
          </div>

          <div class="detail-grid">
            <div class="detail-col">
              <h4>⚙️ 최적 자산배분 · 리밸런싱 · 매수/매도 조건 명세</h4>
              <ul class="spec-list">
                <li><strong>초기 자산배분 비중:</strong> <span class="highlight-text">${t.summaryText.allocations}</span></li>
                <li><strong>리밸런싱 발동 조건 ${helpBtn("vol_harvest")}:</strong> ${rebText}</li>
                <li><strong>체결 및 빈도 규율:</strong> ${expMeta.execTimingDesc || "전일 종가(T-1 Close) 시그널 → 익일 시가(T Open) 체결"} | 연평균 <strong>${m.avgTradesPerYear.toFixed(1)}회</strong> (주평균 ${m.avgTradesPerWeek.toFixed(3)}회, 주간 최대 <strong>${m.maxTradesInSingleWeek}회 ≤ 3회 통과</strong>)</li>
                ${rulesList}
              </ul>

              <div class="mdd-episode-box">
                <div class="mdd-ep-title">📉 최대낙폭(MDD ${m.maxDrawdownPct.toFixed(2)}%) 발생 시점 및 역사적 배경 상세 분석 ${helpBtn("mdd")}</div>
                <div class="mdd-ep-body">
                  <div>• <strong>발생 구간:</strong> 직전 고점일 <code>${m.maxDrawdownPeakDate}</code> → 최저점(바닥) 도달일 <code>${m.maxDrawdownDate}</code> (고점 대비 최저점까지 <strong>${m.mddPeakToTroughDays}영업일</strong> 하락)</div>
                  <div>• <strong>원금 회복 시점:</strong> <code>${recText}</code> | 궤양지수(Ulcer Index) <strong>${m.ulcerIndex.toFixed(2)}</strong> ${helpBtn("ulcer")}</div>
                  <div>• <strong>역사적 시장 배경:</strong> <span class="mdd-desc-highlight">${m.mddEventDescription}</span></div>
                  <div>• <strong>최근 15.8년(2011~2026 OOS) 최대낙폭:</strong> <strong>${mo.maxDrawdownPct.toFixed(2)}%</strong> (고점 <code>${mo.maxDrawdownPeakDate || "-"}</code> → 저점 <code>${mo.maxDrawdownDate || "-"}</code>)</div>
                </div>
              </div>
            </div>

            <div class="detail-col">
              <h4>⚖️ 블라인드 심사관(Blind Reviewer) 선정 사유 & 주요 위기 스트레스 성적</h4>
              <div class="reviewer-box">
                ${t.reviewerComment}
              </div>
              <div class="crisis-mini-grid" style="grid-template-columns: repeat(${crisisKeys.length}, 1fr);">
                ${crisisMiniHtml}
              </div>
            </div>
          </div>
        </div>
      `;
    })
    .join("\n");

  const all50RowsHtml = all50
    .map((s, idx) => {
      const rank = top10Set.get(s.blindId);
      const m = s.fullMetrics;
      const mo = s.oosMetrics;
      const rebText = formatRebalanceDesc(s.config.rebalance, s.config.rebalanceEnabled);
      const eventShort = (m.mddEventDescription || "").split("(")[0].trim();
      return `
        <tr class="${rank ? "row-selected" : "row-other"}">
          <td class="num">${rank ? `<span class="rank-badge rank-${rank}">Top ${rank}</span>` : `<span class="sub-num">${idx + 1}</span>`}</td>
          <td><strong>${s.originalId}</strong></td>
          <td><span class="blind-tag">${s.blindId}</span></td>
          <td>
            <div style="font-weight:600;">${s.name}</div>
            <div class="sub-num">${s.category}</div>
          </td>
          <td><span class="alloc-chip" style="font-size:11px;">${s.summaryText.allocations}</span></td>
          <td><span class="sub-num">${rebText}</span></td>
          <td class="num pos"><strong>+${m.cagrPct.toFixed(2)}%</strong></td>
          <td class="num neg">
            <strong>${m.maxDrawdownPct.toFixed(2)}%</strong><br/>
            <span class="sub-num" title="${m.mddEventDescription || ""}">${m.maxDrawdownPeakDate || "-"} → ${m.maxDrawdownDate || "-"} (${eventShort})</span>
          </td>
          <td class="num">${m.calmar.toFixed(3)}</td>
          <td class="num">${m.sharpe.toFixed(2)} / ${m.sortino.toFixed(2)}</td>
          <td class="num">${m.ulcerIndex.toFixed(2)}</td>
          <td class="num pos">+${mo.cagrPct.toFixed(2)}%</td>
          <td class="num neg">${mo.maxDrawdownPct.toFixed(2)}%</td>
          <td class="num ${s.avgCrisisReturn >= 0 ? "pos" : "neg"}">${s.avgCrisisReturn >= 0 ? "+" : ""}${s.avgCrisisReturn.toFixed(1)}%</td>
          <td class="num">${m.maxTradesInSingleWeek}회 (${m.avgTradesPerWeek.toFixed(2)}/주)</td>
          <td class="num">${s.parameterStabilityPct.toFixed(1)}%</td>
        </tr>
      `;
    })
    .join("\n");

  return `
    <div id="tab-panel-${k}" class="tab-panel ${expMeta.isDefault ? "active" : ""}">
      <!-- EXPERIMENT HERO SUMMARY -->
      <section class="section-card exp-banner">
        <div class="exp-banner-top">
          <div>
            <span class="hero-badge">${expMeta.badge}</span>
            <h2 class="section-title" style="font-size:22px; margin-top:4px;">${expMeta.title}</h2>
            <p class="section-sub" style="margin-bottom:0;">${expMeta.subtitle}</p>
          </div>
          <div class="exp-Benchmarks">
            ${expMeta.benchmarkHtml}
          </div>
        </div>
      </section>

      <!-- SWEET SPOT SYNTHESIS -->
      <section class="section-card">
        <h2 class="section-title">🎯 ${expMeta.shortName} — 블라인드 검증으로 도출된 최적점(Sweet Spot) 핵심 결론</h2>
        <p class="section-sub">${expMeta.sweetSpotIntro}</p>
        <div class="sweetspot-grid">
          ${expMeta.sweetSpotBoxesHtml}
        </div>
      </section>

      <!-- CHARTS -->
      <section class="section-card">
        <h2 class="section-title">📈 파레토 프론티어(Pareto Frontier) 및 Top 10 누적 성과·낙폭 시각화</h2>
        <p class="section-sub">좌측 차트는 50개 전체 전략의 위험(MDD ${helpBtn("mdd")})-수익(CAGR ${helpBtn("cagr")}) 분포이며(마우스 오버 시 MDD 발생 시기 표시), 우측 차트는 Top 10 전략과 벤치마크의 누적 수익률 및 수중 낙폭(Drawdown) 추이입니다.</p>
        <div class="chart-grid-2">
          <div class="chart-box">
            <div class="chart-header">
              <span class="chart-title">🎯 50개 전략 MDD vs CAGR 파레토 프론티어 (좌상단일수록 우수)</span>
            </div>
            <div class="chart-canvas-wrap">
              <canvas id="scatterChart_${k}"></canvas>
            </div>
          </div>
          <div class="chart-box">
            <div class="chart-header">
              <span class="chart-title">🚀 Top 10 전략 vs 벤치마크 누적 수익곡선 (원금=100)</span>
              <div style="display: inline-flex; gap: 6px; align-items: center; flex-wrap: wrap;">
                <button class="btn-toggle" id="btnToggleAllEquity_${k}" onclick="toggleAllDatasets('${k}', 'equity')">전체 해제</button>
                <button class="btn-toggle" id="btnScaleToggle_${k}" onclick="toggleEquityScale('${k}')">선형(Linear) 스케일로 보기</button>
              </div>
            </div>
            <div class="chart-canvas-wrap">
              <canvas id="equityChart_${k}"></canvas>
            </div>
          </div>
        </div>
        <div class="chart-box" style="margin-top: 20px;">
          <div class="chart-header">
            <span class="chart-title">🛡️ Top 5 전략 vs 코스피200 단독 낙폭(Drawdown / Underwater) 비교 (2000 닷컴 · 2008 금융위기 · 2020 코로나 · 2022 금리인상)</span>
            <div style="display: inline-flex; gap: 6px; align-items: center;">
              <button class="btn-toggle" id="btnToggleAllDD_${k}" onclick="toggleAllDatasets('${k}', 'drawdown')">전체 해제</button>
            </div>
          </div>
          <div class="chart-canvas-wrap" style="height: 290px;">
            <canvas id="drawdownChart_${k}"></canvas>
          </div>
        </div>
        ${expMeta.belowMddChartHtml || ""}
      </section>

      <!-- TOP 10 SUMMARY TABLE -->
      <section class="section-card">
        <h2 class="section-title">🏆 블라인드 심사 최종 선정 상위 10개(Top 10) 전략 종합 비교표</h2>
        <p class="section-sub">각 지표 옆의 <code>?</code> 버튼을 클릭하면 생소한 금융·퀀트 지표의 뜻과 해석 기준을 바로 확인할 수 있으며, MDD 칸에는 <strong>실제 고점일 → 최저점일 및 역사적 사건</strong>이 함께 표시됩니다.</p>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>순위</th>
                <th>전략 ID · 이름 (블라인드ID)</th>
                <th>초기 자산배분 비중</th>
                <th>리밸런싱 조건 ${helpBtn("vol_harvest")}</th>
                <th>매수·매도 조건 (${expMeta.execTimingShort || "T-1 종가 → T 시가"})</th>
                <th class="num">연평균 CAGR ${helpBtn("cagr")}<br/><span class="sub-num">(1천만원→최종)</span></th>
                <th>최대낙폭 MDD & 발생 시점 ${helpBtn("mdd")}<br/><span class="sub-num">(고점→저점 · 회복 · Ulcer ${helpBtn("ulcer")})</span></th>
                <th class="num">Calmar ${helpBtn("calmar")}<br/><span class="sub-num">Sharpe ${helpBtn("sharpe")} · Sortino ${helpBtn("sortino")}</span></th>
                <th class="num">최근 15.8년 OOS ${helpBtn("oos")}<br/><span class="sub-num">(CAGR / MDD)</span></th>
                <th class="num">주요위기 평균<br/><span class="sub-num">(수익률 / MDD)</span></th>
                <th class="num">주간 매매빈도<br/><span class="sub-num">(평균 / 최대≤3)</span></th>
                <th class="num">파라미터<br/>안정성 ${helpBtn("stability")}</th>
              </tr>
            </thead>
            <tbody>
              ${top10TableRowsHtml}
            </tbody>
          </table>
        </div>
      </section>

      <!-- TOP 10 DETAILED CARDS -->
      <section class="section-card">
        <h2 class="section-title">🔍 Top 10 전략별 상세 매매 규칙 · MDD 발생 시점 배경 · 위기 성적표</h2>
        <p class="section-sub">각 전략의 정확한 자산배분 비율, 리밸런싱 주기/밴드, 전일 종가 시그널 조건식과 함께 <strong>언제 왜 최대낙폭(MDD)이 발생했는지</strong>를 상세히 해설합니다.</p>
        ${top10CardsHtml}
      </section>

      <!-- ALL 50 TABLE -->
      <section class="section-card">
        <h2 class="section-title">📋 ${expMeta.shortName} — 테스트된 전체 50개 전략 전수 성적표</h2>
        <p class="section-sub">50개 전략의 전수 구간, MDD 발생 시점, 최근 15.8년 OOS 구간, 위기 방어력, 주간 매매 횟수 전수 결과입니다.</p>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th class="num">선정/순위</th>
                <th>전략ID</th>
                <th>블라인드ID</th>
                <th>전략명 · 카테고리</th>
                <th>초기 비중</th>
                <th>리밸런싱 조건 ${helpBtn("vol_harvest")}</th>
                <th class="num">연평균 CAGR ${helpBtn("cagr")}</th>
                <th class="num">최대낙폭 MDD & 발생 시점 ${helpBtn("mdd")}</th>
                <th class="num">Calmar ${helpBtn("calmar")}</th>
                <th class="num">Sharpe ${helpBtn("sharpe")} / Sortino ${helpBtn("sortino")}</th>
                <th class="num">Ulcer ${helpBtn("ulcer")}</th>
                <th class="num">OOS CAGR ${helpBtn("oos")}</th>
                <th class="num">OOS MDD</th>
                <th class="num">위기 평균</th>
                <th class="num">주간최대(평균)</th>
                <th class="num">안정성 ${helpBtn("stability")}</th>
              </tr>
            </thead>
            <tbody>
              ${all50RowsHtml}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `;
}

const OPEN_TOP10_CLOSE_COMPARE_HTML = `
  <div class="open-close-summary-card" style="margin-top: 24px; background: #0f172a; border: 1px solid var(--border); border-radius: 10px; padding: 18px 20px;">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px; flex-wrap:wrap; gap:8px;">
      <h3 style="margin:0; font-size:15px; color:#fff; font-weight:700;">🔄 [시가매수 → 종가매수 변경 비교표] Top 10 전략 체결 시점 변경 시 성과 변동 전수 비교</h3>
      <span style="font-size:12px; color:var(--accent);">전일 종가 판정 후 익일 시가(Open) vs 익일 종가(Close) 체결 전후 비교</span>
    </div>
    <div class="table-wrap" style="margin:0;">
      <table style="font-size:12.5px; line-height:1.45; width:100%; border-collapse:collapse;">
        <thead>
          <tr style="background: rgba(30, 41, 59, 0.95);">
            <th colspan="5" style="text-align:center; border-right: 2px solid #475569; color: var(--accent); padding:8px 6px;">☀️ 시가매수 (T Open) 기준</th>
            <th colspan="4" style="text-align:center; color: var(--gold); padding:8px 6px;">🌙 종가매수 (T Close) 전환 시</th>
          </tr>
          <tr style="border-bottom: 1px solid #475569;">
            <th style="text-align:center; width:50px;">시가 순위</th>
            <th>전략명</th>
            <th class="num" style="width:85px;">연평균 CAGR</th>
            <th class="num" style="width:80px;">MDD</th>
            <th class="num" style="width:160px; border-right: 2px solid #475569;">샤프 / 칼마 / 소르티노</th>
            <th style="text-align:center; width:65px;">종가 순위</th>
            <th class="num" style="width:85px;">CAGR</th>
            <th class="num" style="width:80px;">MDD</th>
            <th class="num" style="width:160px;">샤프 / 칼마 / 소르티노</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="text-align:center;"><span class="rank-badge rank-1">#1</span></td>
            <td><strong>[K18]</strong> 코스피 60일 SMA 돌파 추세 &amp; 데드크로스 현금화</td>
            <td class="num pos"><strong>+8.87%</strong></td>
            <td class="num neg"><strong>-34.67%</strong></td>
            <td class="num" style="border-right: 2px solid #475569;">0.48 / 0.256 / 0.68</td>
            <td style="text-align:center;"><span class="rank-badge rank-1">#1</span></td>
            <td class="num pos"><strong>+8.68%</strong></td>
            <td class="num neg"><strong>-31.41%</strong></td>
            <td class="num">0.46 / <strong>0.276</strong> / 0.65</td>
          </tr>
          <tr>
            <td style="text-align:center;"><span class="rank-badge rank-2">#2</span></td>
            <td><strong>[K20]</strong> 코스피 10/40일 EMA 단중기 추세 스나이퍼</td>
            <td class="num pos"><strong>+8.19%</strong></td>
            <td class="num neg"><strong>-33.64%</strong></td>
            <td class="num" style="border-right: 2px solid #475569;">0.45 / 0.244 / 0.64</td>
            <td style="text-align:center;"><span class="rank-badge rank-2">#2</span></td>
            <td class="num pos"><strong>+8.11%</strong></td>
            <td class="num neg"><strong>-32.76%</strong></td>
            <td class="num">0.44 / <strong>0.247</strong> / 0.62</td>
          </tr>
          <tr>
            <td style="text-align:center;"><span class="rank-badge rank-3">#3</span></td>
            <td><strong>[K12]</strong> 코스피 120일 경기선 추세 실드</td>
            <td class="num pos"><strong>+6.79%</strong></td>
            <td class="num neg"><strong>-26.70%</strong></td>
            <td class="num" style="border-right: 2px solid #475569;">0.40 / 0.254 / 0.57</td>
            <td style="text-align:center;"><span class="sub-num">#47</span></td>
            <td class="num pos">+4.15%</td>
            <td class="num neg">-26.97%</td>
            <td class="num">0.29 / 0.154 / 0.42</td>
          </tr>
          <tr>
            <td style="text-align:center;"><span class="rank-badge">#4</span></td>
            <td><strong>[K45]</strong> 10Y-2Y 장단기 금리차 역전 방어 &amp; 스티프닝</td>
            <td class="num pos"><strong>+6.50%</strong></td>
            <td class="num neg"><strong>-26.58%</strong></td>
            <td class="num" style="border-right: 2px solid #475569;">0.36 / 0.244 / 0.51</td>
            <td style="text-align:center;"><span class="rank-badge" style="background:#0284c7; color:#fff;">#5</span></td>
            <td class="num pos">+5.29%</td>
            <td class="num neg"><strong>-15.07%</strong></td>
            <td class="num"><strong>0.44</strong> / <strong>0.351</strong> / <strong>0.63</strong></td>
          </tr>
          <tr>
            <td style="text-align:center;"><span class="rank-badge">#5</span></td>
            <td><strong>[K14]</strong> 코스피 50/200일 골든·데드 장기 레짐 스위칭</td>
            <td class="num pos"><strong>+5.99%</strong></td>
            <td class="num neg"><strong>-24.08%</strong></td>
            <td class="num" style="border-right: 2px solid #475569;">0.38 / 0.249 / 0.53</td>
            <td style="text-align:center;"><span class="sub-num">#14</span></td>
            <td class="num pos">+3.94%</td>
            <td class="num neg"><strong>-10.21%</strong></td>
            <td class="num"><strong>0.40</strong> / <strong>0.386</strong> / <strong>0.58</strong></td>
          </tr>
          <tr>
            <td style="text-align:center;"><span class="rank-badge">#6</span></td>
            <td><strong>[K43]</strong> VIX 공포 스파이크(&gt;=34) 패닉 현금투입</td>
            <td class="num pos"><strong>+6.44%</strong></td>
            <td class="num neg"><strong>-34.25%</strong></td>
            <td class="num" style="border-right: 2px solid #475569;">0.37 / 0.188 / 0.53</td>
            <td style="text-align:center;"><span class="sub-num">#25</span></td>
            <td class="num pos">+3.98%</td>
            <td class="num neg"><strong>-16.74%</strong></td>
            <td class="num">0.36 / <strong>0.238</strong> / 0.51</td>
          </tr>
          <tr>
            <td style="text-align:center;"><span class="rank-badge">#7</span></td>
            <td><strong>[K48]</strong> 미 10년물 국채금리 급등 방어 &amp; 금리안정 매수</td>
            <td class="num pos"><strong>+6.34%</strong></td>
            <td class="num neg"><strong>-28.02%</strong></td>
            <td class="num" style="border-right: 2px solid #475569;">0.37 / 0.226 / 0.53</td>
            <td style="text-align:center;"><span class="sub-num">#18</span></td>
            <td class="num pos">+4.47%</td>
            <td class="num neg"><strong>-15.45%</strong></td>
            <td class="num"><strong>0.39</strong> / <strong>0.289</strong> / <strong>0.56</strong></td>
          </tr>
          <tr>
            <td style="text-align:center;"><span class="rank-badge">#8</span></td>
            <td><strong>[K46]</strong> 달러인덱스(DXY) 강달러 발작 방어</td>
            <td class="num pos"><strong>+6.29%</strong></td>
            <td class="num neg"><strong>-27.82%</strong></td>
            <td class="num" style="border-right: 2px solid #475569;">0.38 / 0.226 / 0.53</td>
            <td style="text-align:center;"><span class="rank-badge" style="background:#0284c7; color:#fff;">#10</span></td>
            <td class="num pos">+4.67%</td>
            <td class="num neg"><strong>-19.31%</strong></td>
            <td class="num"><strong>0.40</strong> / <strong>0.242</strong> / <strong>0.57</strong></td>
          </tr>
          <tr>
            <td style="text-align:center;"><span class="rank-badge">#9</span></td>
            <td><strong>[K08]</strong> 광역 ±10%p 밴드 추세허용 60:40</td>
            <td class="num pos"><strong>+6.98%</strong></td>
            <td class="num neg"><strong>-35.58%</strong></td>
            <td class="num" style="border-right: 2px solid #475569;">0.35 / 0.196 / 0.49</td>
            <td style="text-align:center;"><span class="rank-badge" style="background:#0284c7; color:#fff;">#6</span></td>
            <td class="num pos">+5.60%</td>
            <td class="num neg"><strong>-22.68%</strong></td>
            <td class="num"><strong>0.38</strong> / <strong>0.247</strong> / <strong>0.54</strong></td>
          </tr>
          <tr>
            <td style="text-align:center;"><span class="rank-badge">#10</span></td>
            <td><strong>[K09]</strong> 60거래일 캘린더 뉴트럴 55:45</td>
            <td class="num pos"><strong>+6.45%</strong></td>
            <td class="num neg"><strong>-33.08%</strong></td>
            <td class="num" style="border-right: 2px solid #475569;">0.34 / 0.195 / 0.47</td>
            <td style="text-align:center;"><span class="sub-num">#34</span></td>
            <td class="num pos">+4.69%</td>
            <td class="num neg"><strong>-19.11%</strong></td>
            <td class="num">0.34 / <strong>0.245</strong> / 0.49</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
`;

function main() {
  const vaultExp1 = JSON.parse(fs.readFileSync(VAULT_EXP1_PATH, "utf8"));
  const vaultExp2 = JSON.parse(fs.readFileSync(VAULT_EXP2_PATH, "utf8"));
  const vaultExp3 = JSON.parse(fs.readFileSync(VAULT_EXP3_PATH, "utf8"));
  const vaultExp4 = JSON.parse(fs.readFileSync(VAULT_EXP4_PATH, "utf8"));
  const vaultExp5 = JSON.parse(fs.readFileSync(VAULT_EXP5_PATH, "utf8"));

  const exp1Data = buildExperimentData(vaultExp1, EXP1_TOP10_REVIEWS, "exp1_3asset");
  const exp2Data = buildExperimentData(vaultExp2, EXP2_TOP10_REVIEWS, "exp2_kospicash");
  const exp3Data = buildExperimentData(vaultExp3, EXP3_TOP10_REVIEWS, "exp3_post_imf");
  const exp4Data = buildExperimentData(vaultExp4, EXP4_TOP10_REVIEWS, "exp4_post_imf_close");
  const exp5Data = buildExperimentData(vaultExp5, EXP5_TOP10_REVIEWS, "exp5_ndx_cash");

  console.log("=== EXPERIMENT #5 (NASDAQ 100 + CASH, NEXT-DAY CLOSE) TOP 10 UNBLINDED ===");
  exp5Data.top10.forEach((t) => {
    const m = t.fullMetrics;
    console.log(
      `Rank ${t.rank}: ${t.blindId} => ${t.originalId} (${t.name}) | Alloc: ${t.summaryText.allocations} | CAGR: +${m.cagrPct}% | MDD: ${m.maxDrawdownPct}% (${m.maxDrawdownPeakDate} -> ${m.maxDrawdownDate}) | Calmar: ${m.calmar}`
    );
  });

  const EXPERIMENT_TABS = [
    {
      key: "exp5_ndx_cash",
      tabIcon: "🇺🇸",
      tabLabel: "나스닥 익일종가 (1999-2026)",
      isDefault: true,
      shortName: "실험 #5 (포스트 IMF 1999~2026 나스닥100+현금 익일 종가 50선)",
      badge: "Experiment #5 · NASDAQ 100 + Cash Only · Modern Era (1999.01.04 ~ 2026.10.27, 27.8 Years) · 50 Strategies Tested",
      title: "🇺🇸 나스닥 100(NDX) · 현금(US3M) 포스트 IMF 익일 종가(T Close) 체결 최적 전략 백테스트 (Top 10 / 50)",
      subtitle:
        "2000년 닷컴버블 당시 -80.92% 대폭락을 겪었던 나스닥 100 지수를 안전한 단기금리 현금(US3M)과 결합하여, 연복리 +8.5% ~ +9.35%의 고성장을 유지하면서도 MDD를 -12% ~ -38%대로 획기적으로 낮춘 상위 10개 전략입니다.",
      execTimingRule: "전일 종가 판정 → 익일 종가 체결",
      execTimingDesc: "전일 종가(T-1 Close) 시그널 → 익일 종가(T Close) 체결",
      execTimingShort: "T-1 종가 → T 종가",
      benchmarkHtml: `
        <div class="bench-pill"><strong>나스닥 100 100% (Buy&Hold, 원화):</strong> CAGR <span class="pos">+10.93%</span> · MDD <span class="neg">-80.92%</span> (2000.03→2002.10 닷컴버블) · Calmar 0.135</div>
        <div class="bench-pill"><strong>나스닥 50% + 현금 50% (무리밸런싱):</strong> CAGR <span class="pos">+8.57%</span> · MDD <span class="neg">-52.96%</span> · Calmar 0.162</div>
        <div class="bench-pill"><strong>현금 100% (US3M 단기금리):</strong> CAGR <span class="pos">+2.06%</span> · MDD <span class="pos">0.00%</span></div>
      `,
      sweetSpotIntro:
        "나스닥 100은 장기 연복리 +10.93%로 성장성이 매우 뛰어나지만 2000년 닷컴버블(-80.92%), 2008년 금융위기(-53.8%), 2022년 금리인상(-35.2%) 등 치명적인 폭락을 동반합니다. 20/60 EMA 추세 스윙(N13)이나 200일선 스위칭(N11), 볼린저 스퀴즈(N34)를 결합하면 MDD를 -14% ~ -38%로 대폭 줄이면서 연복리 +8.5% ~ +9.35%를 달성할 수 있습니다.",
      sweetSpotBoxesHtml: `
        <div class="sweet-box gold">
          <h3>1️⃣ 나스닥100 + 현금 최적 자산배분 구조</h3>
          <ul>
            <li><strong>고성장 추세추종 알파형 (#1 N13, #2 N11):</strong> 코어 <code>나스닥 40~50% : 현금 50~60%</code> + 추세 확인 시 나스닥 유지 / 이탈 시 현금 대피 → 27.8년 연복리 <strong>+8.53% ~ +9.35%</strong>(1,000만원 → 9,720만원 ~ 1억 1,885만원, 10~12배 증식) 달성! 나스닥 100% 보유(+10.93%)의 과실을 거의 다 챙기면서 MDD는 <strong>-38.87% ~ -55.46%</strong>로 나스닥 단독(-80.92%) 대비 25~42%p 이상 경감.</li>
            <li><strong>서브-20% 낙폭 절대방어형 (#3 N36, #4 N21, #8 N45):</strong> <code>나스닥 40~45% : 현금 55~60%</code> + 고점 컷오프/절대모멘텀/장단기금리차 → 27.8년 MDD를 단 <strong>-18.90% ~ -22.77%</strong>로 틀어막으며(나스닥의 1/4 수준) 연복리 <strong>+5.44% ~ +5.71%</strong> 및 Calmar <strong>0.242 ~ 0.302</strong> 달성.</li>
            <li><strong>초저낙폭 10%대 철벽 방어형 (#5 N34, #6 N14, #7 N43, #10 N02):</strong> <code>나스닥 35~40% : 현금 60~65%</code> + 볼린저 스퀴즈/50-200 골든크로스/VIX 스파이크 → 27.8년 MDD를 단 <strong>-9.67% ~ -14.06%</strong>(단자리~10%대 초반)로 봉쇄하며 Calmar <strong>0.350 ~ 0.376</strong> 달성.</li>
          </ul>
        </div>
        <div class="sweet-box">
          <h3>2️⃣ 나스닥 -80.9% 닷컴버블 극복의 비밀</h3>
          <ul>
            <li><strong>나스닥 100의 치명적 함정:</strong> 나스닥은 2000년 3월부터 2002년 10월까지 2.5년간 <strong>-80.92% 폭락</strong>하여 원금의 1/5 토막이 났고, 원금 회복에만 15년(2015년)이 걸렸습니다.</li>
            <li><strong>현금 버퍼와 추세 필터의 힘:</strong> <strong>20/60 EMA 추세스윙(N13)</strong>이나 <strong>50/200 골든데드(N14)</strong>, <strong>고점 -12% 컷오프(N36)</strong>를 적용하면 버블 붕괴 초기에 전량/대부분 현금으로 대피하여 닷컴버블 낙폭을 -12% ~ -38%로 막아내고, 반등장에서 복리 엔진을 폭발시킬 수 있습니다.</li>
          </ul>
        </div>
        <div class="sweet-box green">
          <h3>3️⃣ 나스닥 100 최강의 전술 시그널 TOP 4</h3>
          <ul>
            <li><strong>① 20/60일 EMA 골든·데드 스윙 (#1 N13 — 종합 1위):</strong>
              <br/>코어 40:60에서 <code>EMA(20) &gt; EMA(60) &amp; RSI &gt;= 50</code> 시 나스닥 확대 매수 → 데드크로스 시 현금 대피. <strong>27.8년 CAGR +8.53%, MDD -38.87%, Calmar 0.219!</strong></li>
            <li><strong>② 200일 SMA 추세추종 전량 현금스위칭 (#2 N11 — 복리 1위):</strong>
              <br/><code>종가 &gt; SMA(200)</code> 시 나스닥 보유, <code>종가 &lt; SMA(200)</code> 시 전량 현금화. <strong>27.8년 CAGR +9.35%(최종 1억 1,885만원), 닷컴버블 낙폭 25.5%p 방어!</strong></li>
            <li><strong>③ 120일 고점 -12% 컷오프 &amp; 과매도 재매수 (#3 N36 — Calmar 0.302):</strong>
              <br/>최고점 대비 -12% 하락 시 현금화, RSI&lt;=32 과매도 시 분할 매수. <strong>MDD -18.90%, Calmar 0.302, 파라미터 안정성 97.4%!</strong></li>
            <li><strong>④ 볼린저 밴드폭(BB_WIDTH) 스퀴즈 돌파 (#5 N34 — MDD -14.06%):</strong>
              <br/>변동성 압축 후 상향 돌파 시 진입, 하단 이탈 시 칼손절. <strong>MDD -14.06%, Calmar 0.350, 최근 15.8년 OOS MDD -7.76%!</strong></li>
          </ul>
        </div>
      `,
      data: exp5Data,
    },
    {
      key: "exp4_post_imf_close",
      tabIcon: "🇰🇷",
      tabLabel: "코스피 익일종가 (1999-2026)",
      isDefault: false,
      shortName: "실험 #4 (포스트 IMF 1999~2026 익일 종가 체결 50선)",
      badge: "Experiment #4 · Post-IMF Era with Next-Day Close Execution (1999.01.04 ~ 2026.10.27, 27.8 Years) · 50 Strategies Tested",
      title: "🇰🇷 코스피 200(KPI200) · 현금(US3M) 포스트 IMF 익일 종가(T Close) 체결 최적 전략 백테스트 (Top 10 / 50)",
      subtitle:
        "전일 종가(T-1 Close) 판정 후 다음날 장중 변동을 확인하고 익일 종가(T Close)에 매매하는 실전 체결 환경 백테스트입니다. 아침 동시호가 패닉 갭하락 매도를 회피하여 MDD가 -34.67% → -31.41%로 3.26%p 더 축소되고 Calmar 0.276으로 위험대비 수익률이 추가 향상되었습니다.",
      execTimingRule: "전일 종가 판정 → 익일 종가 체결",
      execTimingDesc: "전일 종가(T-1 Close) 시그널 → 익일 종가(T Close) 체결",
      execTimingShort: "T-1 종가 → T 종가",
      benchmarkHtml: `
        <div class="bench-pill"><strong>코스피200 100% (Buy&Hold):</strong> CAGR <span class="pos">+8.56%</span> · MDD <span class="neg">-55.73%</span> (2000.01→2001.09 닷컴버블/9.11) · Calmar 0.154</div>
        <div class="bench-pill"><strong>코스피 50% + 현금 50% (무리밸런싱):</strong> CAGR <span class="pos">+6.03%</span> · MDD <span class="neg">-30.56%</span> · Calmar 0.197</div>
        <div class="bench-pill"><strong>현금 100% (US3M 단기금리):</strong> CAGR <span class="pos">+2.18%</span> · MDD <span class="pos">0.00%</span></div>
      `,
      sweetSpotIntro:
        "한국 증시는 전일 미 증시 급락 시 아침 시가에 갭하락으로 패닉 투매가 발생하는 특성이 있습니다. 전일 종가 시그널을 확인한 후 '익일 종가(T Close)'에 체결할 경우, 장중 반등을 거쳐 정상화된 종가에 매매되므로 시가 체결 대비 MDD가 추가로 3.26%p 축소되고 닷컴버블 수익률이 +13.58% → +14.65%로 개선됩니다.",
      sweetSpotBoxesHtml: `
        <div class="sweet-box gold">
          <h3>1️⃣ 익일 종가(T Close) 체결 시 성과 변화 핵심</h3>
          <ul>
            <li><strong>아침 갭하락 투매 및 슬리피지 회피:</strong> 전일 종가 조건 달성 후 아침 동시호가(Open)에 던질 때 발생하는 갭하락 손실을 피하고, 장중 안정된 종가에 체결되므로 실거래 체결 왜곡이 완벽히 제거됩니다.</li>
            <li><strong>MDD 축소 & 칼마비율(Calmar) 추가 상승:</strong> 종합 1위 <code>K18</code> 기준 익일 시가 체결 대비 MDD가 <strong>-34.67%에서 -31.41%로 3.26%p 더 개선</strong>되었으며, Calmar 비율도 0.256에서 <strong>0.276으로 상승</strong>했습니다!</li>
            <li><strong>2000년 닷컴버블 방어력 극대화:</strong> 닷컴버블 붕괴기 당시 수익률이 시가 체결(+13.58%)보다 높은 <strong>+14.65%의 대규모 양(+)의 수익</strong>을 기록했습니다.</li>
          </ul>
        </div>
        <div class="sweet-box">
          <h3>2️⃣ 시가(T Open) 체결 vs 종가(T Close) 체결 전략별 반응 비교</h3>
          <ul>
            <li><strong>추세 추종형 (K18, K20):</strong> 종가 체결 시 하루 동안 시장 추세를 추가로 확인하고 체결되므로 장초반 휩소(Whipsaw)가 필터링되어 MDD는 낮아지고(K18 MDD -31.41%), 27.8년 CAGR <strong>+8.11% ~ +8.68%</strong>(코스피 초과)를 유지합니다.</li>
            <li><strong>절대방어형 (K45, K22):</strong> 거시경제 지표(장단기 금리차, 미국 반도체 SOXX) 선행 신호를 바탕으로 종가에 체결할 경우 <strong>27.8년 MDD가 각각 -15.07%, -14.02%</strong>로 50개 전체 후보 중 극강의 최저 낙폭을 달성했습니다.</li>
            <li><strong>패시브 밴드형 (K08, K07):</strong> 정기 주기 및 비중 밴드 리밸런싱 전략은 체결 시점(시가 vs 종가)에 따른 성과 차이가 거의 없이 연복리 <strong>+5.60%, MDD -22.68%</strong>로 안정적인 복리를 이어갔습니다.</li>
          </ul>
        </div>
        <div class="sweet-box green">
          <h3>3️⃣ 포스트 IMF 익일 종가 최강의 전술 시그널 TOP 4</h3>
          <ul>
            <li><strong>① 60일 SMA 돌파 & 데드크로스 현금화 (#1 K18 — 종합 1위):</strong>
              <br/>코어 45:55에서 <code>SMA(20) &gt; SMA(60) &amp; 종가 &gt; SMA(60)</code> 시 매수 → 데드크로스 시 현금 대피. <strong>CAGR +8.68%, MDD -31.41%, Calmar 0.276, 닷컴버블 +14.65%!</strong></li>
            <li><strong>② 10/40일 EMA 단중기 추세 스나이퍼 (#2 K20 — 종합 2위):</strong>
              <br/><code>EMA(10) &gt; EMA(40) &amp; RSI(14) ≥ 52</code> 시 코스피 집중, 데드 시 현금 대피. <strong>CAGR +8.11%, 현대 OOS Calmar 0.290, 닷컴버블 +11.23%!</strong></li>
            <li><strong>③ 적극형 70:30 현금버퍼 (#3 K10 — 파라미터 안정성 98.8%):</strong>
              <br/>코스피 70% : 현금 30% 배분 및 ±7%p 밴드 리밸런싱. <strong>CAGR +6.35%, MDD -30.28%, 연 3.7회 매매!</strong></li>
            <li><strong>④ 10Y-2Y 장단기 금리차 역전 방어 (#5 K45 — MDD -15.07% 전체 1위):</strong>
              <br/>미국 <code>T10Y2Y &lt; 0</code> 금리 역전 후 스티프닝 전환 시 현금 대피. <strong>MDD -15.07%, Calmar 0.351, Sortino 0.630, 닷컴 +14.02%!</strong></li>
          </ul>
        </div>
      `,
      data: exp4Data,
    },
    {
      key: "exp3_post_imf",
      tabIcon: "🇰🇷",
      tabLabel: "코스피 익일시가 (1999-2026)",
      isDefault: false,
      shortName: "실험 #3 (포스트 IMF 1999~2026 익일 시가 체결 50선)",
      badge: "Experiment #3 · Post-IMF Modern Market Era (1999.01.04 ~ 2026.10.27, 27.8 Years) · 50 Strategies Tested",
      title: "🇰🇷 코스피 200(KPI200) · 현금(US3M) 포스트 IMF 익일 시가(T Open) 체결 전략 백테스트 (Top 10 / 50)",
      subtitle:
        "1997~1998년 국가부도 IMF 쇼크를 배제하고 IMF 종료 직후(1999.01)부터 27.8년간 검증하여, 예금금리를 상회하는 실전 복리수익률(CAGR +6.0% ~ +8.87%)과 코스피의 -55.7% MDD를 -24%~-34%로 대폭 낮춘 파레토 최적 전략입니다.",
      benchmarkHtml: `
        <div class="bench-pill"><strong>코스피200 100% (Buy&Hold):</strong> CAGR <span class="pos">+8.56%</span> · MDD <span class="neg">-55.73%</span> (2000.01→2001.09 닷컴버블/9.11) · Calmar 0.154</div>
        <div class="bench-pill"><strong>코스피 50% + 현금 50% (무리밸런싱):</strong> CAGR <span class="pos">+6.03%</span> · MDD <span class="neg">-30.56%</span> · Calmar 0.197</div>
        <div class="bench-pill"><strong>현금 100% (US3M 단기금리):</strong> CAGR <span class="pos">+2.18%</span> · MDD <span class="pos">0.00%</span></div>
      `,
      sweetSpotIntro:
        "1999년 이후 한국 증시는 2000년 닷컴버블(-55.7%), 2008년 금융위기(-53.8%), 2020년 코로나(-34.4%), 2022년 금리인상(-24.9%)을 거쳤습니다. 현금(US3M) 비중과 전술적 시그널을 결합하면 MDD를 -24.08% ~ -34.67%로 낮추면서 연복리 최대 +8.87%(코스피 100% 보유 초월, 원금 10.6배 증식)를 달성할 수 있습니다.",
      sweetSpotBoxesHtml: `
        <div class="sweet-box gold">
          <h3>1️⃣ 포스트 IMF 최적 자산배분 (코스피 : 현금)</h3>
          <ul>
            <li><strong>코스피 Buy&Hold 초월 알파형 (#1 K18, #2 K20):</strong> 코어 <code>코스피 35~45% : 현금 55~65%</code> 출발 + 추세 발생 시 코스피 확대 / 하락 시 현금 대피 → 27.8년 연복리 <strong>+8.19% ~ +8.87%</strong>(원금 8.9배 ~ 10.6배 증식) 달성! 코스피 100% 보유(+8.56%)를 이기면서 MDD는 <strong>-33.64% ~ -34.67%</strong>(코스피 -55.73% 대비 21%p 이상 축소)로 봉쇄.</li>
            <li><strong>초저낙폭 20%대 철벽 방어형 (#3 K12, #4 K45, #5 K14, #7 K48, #8 K46):</strong> <code>코스피 40~45% : 현금 55~60%</code> + 거시/추세 필터 → 27.8년 MDD를 단 <strong>-24.08% ~ -28.02%</strong>로 틀어막으며(코스피의 절반 미만) 연복리 <strong>+5.99% ~ +6.79%</strong> 및 Calmar <strong>0.226 ~ 0.254</strong> 달성.</li>
            <li><strong>초저빈도 패시브 밴드형 (#9 K08, #10 K09):</strong> <code>코스피 55~60% : 현금 40~45%</code> + ±6~10%p 밴드 리밸런싱 ${helpBtn("vol_harvest")} → 1년에 단 1~4회 리밸런싱만으로 연복리 <strong>+6.45% ~ +6.98%</strong>, 파라미터 안정성 <strong>96.9% ~ 99.7%</strong> 달성.</li>
          </ul>
        </div>
        <div class="sweet-box">
          <h3>2️⃣ 왜 IMF 제외 시 CAGR 6~9%가 나오는가?</h3>
          <ul>
            <li><strong>1997~98 IMF 왜곡의 해소:</strong> 1997년 IMF 당시 코스피는 외환위기로 -64.66% 폭락해 당시 현금 75% 전략이 MDD 1위를 했으나 CAGR이 4.18%로 떨어졌습니다. 반면 <strong>1999년 1월 이후 27.8년 구간에서는 코스피 지수 자체가 연평균 +8.56% 성장</strong>하므로, 현금을 적절히 활용하는 전략들의 CAGR이 <strong>+6.0% ~ +8.87%로 정상화</strong>되어 실전 투자 가치가 극대화됩니다.</li>
            <li><strong>변동성 수확의 진가:</strong> 코스피 50% + 현금 50% 무리밸런싱은 CAGR +6.03%/MDD -30.56%에 그치지만, <strong>밴드 리밸런싱 및 전술 스위칭을 결합하면 CAGR이 +6.8%~+8.9%로 1~3%p 증가하고 수중 회복 일수가 1,388일 → 300~500일로 1/3 토막</strong>납니다.</li>
          </ul>
        </div>
        <div class="sweet-box green">
          <h3>3️⃣ 포스트 IMF 최강의 전술 시그널 TOP 4</h3>
          <ul>
            <li><strong>① 20일/60일 수급선 골든·데드크로스 스위칭 (#1 K18 — 종합 1위):</strong>
              <br/>코어 45:55에서 <code>SMA(20) &gt; SMA(60) &amp; 종가 &gt; SMA(60)</code> 시 코스피 확대 매수 → <code>SMA(20) &lt; SMA(60) &amp; 이격도(60) ≤ 98%</code> 시 현금 대피. <strong>CAGR +8.87%(코스피 초과), 닷컴버블 당시 +13.6% 양(+)의 수익 실현!</strong></li>
            <li><strong>② 10/40일 EMA 단중기 추세 스나이퍼 (#2 K20 — 종합 2위):</strong>
              <br/><code>EMA(10) &gt; EMA(40) &amp; RSI(14) ≥ 52</code> 시 코스피 집중, <code>EMA(10) &lt; EMA(40) &amp; RSI(14) ≤ 45</code> 시 현금 대피. <strong>CAGR +8.19%, 현대 OOS Calmar 0.291!</strong></li>
            <li><strong>③ 120일 경기선 추세 실드 (#3 K12 — MDD -26.70%):</strong>
              <br/><code>종가 &lt; SMA(120) &amp; DISPARITY(120) &lt; 97%</code> 시 현금 85% 대피. <strong>2020년 코로나 위기 당시 +3.0% 수익!</strong></li>
            <li><strong>④ 10Y-2Y 장단기 금리차 역전 방어 (#4 K45 — MDD -26.58%):</strong>
              <br/>미국 <code>T10Y2Y &lt; 0</code>(장단기 금리 역전 침체 경보) 후 스티프닝 전환 시 현금 대피. <strong>닷컴버블 +8.1% 수익!</strong></li>
          </ul>
        </div>
      `,
      belowMddChartHtml: OPEN_TOP10_CLOSE_COMPARE_HTML,
      data: exp3Data,
    },
    {
      key: "exp1_3asset",
      tabIcon: "🌐",
      tabLabel: "3자산 배분 (1996-2026)",
      isDefault: false,
      shortName: "실험 #1 (코스피200 + 나스닥100 + KRX금 3자산 50선)",
      badge: "Experiment #1 · KOSPI 200 + NASDAQ 100 + KRX Gold · 50 Strategies Tested",
      title: "🌐 코스피(KPI200) · 나스닥(NDX) · KRX금(KRX_GOLD) 3자산 최적 투자전략 백테스트 (Top 10 / 50)",
      subtitle:
        "성장주(나스닥100 원화환산), 한국 대표지수(코스피200), 위기 헤지 안전자산(KRX 금현물) 3가지를 결합하여 30.3년 MDD를 -29.54%까지 낮추고 연복리 +12.39% ~ +13.79%를 달성한 상위 10개 전략입니다.",
      execTimingRule: "전일 종가 판정 → 익일 시가 체결",
      execTimingDesc: "전일 종가(T-1 Close) 시그널 → 익일 시가(T Open) 체결",
      execTimingShort: "T-1 종가 → T 시가",
      benchmarkHtml: `
        <div class="bench-pill"><strong>코스피200 100%:</strong> CAGR <span class="pos">+6.73%</span> · MDD <span class="neg">-64.66%</span></div>
        <div class="bench-pill"><strong>나스닥100 100% (원화):</strong> CAGR <span class="pos">+13.68%</span> · MDD <span class="neg">-80.93%</span> (2000→2002 닷컴버블)</div>
        <div class="bench-pill"><strong>KRX 금현물 100%:</strong> CAGR <span class="pos">+10.17%</span> · MDD <span class="neg">-47.84%</span> (1998→1999 금약세)</div>
      `,
      sweetSpotIntro:
        "단일 자산 보유 시 MDD가 -47.8%(금) ~ -80.9%(나스닥)에 달하는 반면, 3자산 결합 시 MDD를 -29.5% ~ -42.2%로 낮추면서 연복리 12.4% ~ 13.8%를 달성했습니다.",
      sweetSpotBoxesHtml: `
        <div class="sweet-box gold">
          <h3>1️⃣ 3자산 배분(Allocation) 최적 황금비율</h3>
          <ul>
            <li><strong>최저 MDD 초방어 최적비중 (#1 S01, #2 S06, #3 S10):</strong> <code>코스피 10~20% : 나스닥 25~35% : KRX금 50~60%</code> → 30.3년 MDD를 <strong>-29.54% ~ -35.77%</strong>로 억제하며 5대 역사적 위기에서 평균 <strong>+6.4% ~ +11.8%</strong> 양(+)의 수익 창출.</li>
            <li><strong>균형 리스크패리티 최적비중 (#4 S05, #9 S07):</strong> <code>코스피 15% : 나스닥 35~40% : KRX금 45~50%</code> → 연복리 <strong>12.93% ~ 13.28%</strong>와 현대 15.8년 OOS MDD <strong>-22.4% ~ -22.8%</strong> 달성.</li>
            <li><strong>고수익 전술 바벨 최적비중 (#5 S36, #7 S43, #8 S35):</strong> <code>코스피 15% : 나스닥 45% : KRX금 40%</code> → 연복리 <strong>13.39% ~ 13.79%</strong>(1,000만원 → 4.5억~5.0억원 증식) 및 현대 OOS MDD <strong>-21.35% ~ -23.80%</strong> 달성.</li>
          </ul>
        </div>
        <div class="sweet-box">
          <h3>2️⃣ 리밸런싱(Rebalancing) 최적 조건 ${helpBtn("vol_harvest")}</h3>
          <ul>
            <li><strong>정기 주기 + 비중 이탈 밴드(Band) 결합이 압도적 우위:</strong> 반기/분기 주기에 <strong>절대비중 ±5%p ~ ±8%p 밴드(#3 S10, #4 S05, #5 S36, #7 S43)</strong> 또는 <strong>목표비중 대비 ±15% 상대밴드(#2 S06)</strong>를 결합할 때 폭락장 저가매수와 폭등장 차익실현이 극대화됨.</li>
            <li>달력 주기를 배제하고 <strong>오직 ±5%p 이탈 시에만 리밸런싱(#9 S07)</strong>해도 연 2.34회 매매만으로 CAGR 13.28%, 파라미터 안정성 99.8%를 달성.</li>
          </ul>
        </div>
        <div class="sweet-box green">
          <h3>3️⃣ 매수·매도 교차조건(Rules) 최적 시그널</h3>
          <ul>
            <li><strong>전일 종가 → 익일 시가 체결 시 최고 효율 규칙 TOP 4:</strong>
              <br/>① <strong>볼린저 밴드폭 압축 돌파 (#5 S36) ${helpBtn("bb")}:</strong> <code>NDX BB_WIDTH ≤ 8.5 &amp; %B ≥ 80</code> 돌파 시 금→나스닥 매수 (연간 승률 <strong>90.3%</strong>, 현대 OOS MDD <strong>-21.35%</strong> 전체 1위)
              <br/>② <strong>VIX 공포 스파이크 역발상 (#7 S43):</strong> <code>VIX ≥ 33</code> 폭등 시 금 팔아 나스닥 매집 → <code>VIX ≤ 14 &amp; RSI ≥ 70</code> 시 금 복원 (CAGR <strong>13.79%</strong>, OOS <strong>14.19%</strong>)
              <br/>③ <strong>RSI(14) ≤ 28 투매 리바운드 (#8 S35) ${helpBtn("rsi")} &amp; 볼린저 %B ≤ 12 교차스윙 (#10 S40)</strong>
              <br/>④ <strong>위기 후 금 급등(ROC≥10%)·코스피 폭락(≤-12%) 역발상 스위칭 (#6 S25) ${helpBtn("roc")}</strong>
            </li>
          </ul>
        </div>
      `,
      data: exp1Data,
    },
    {
      key: "exp2_kospicash",
      tabIcon: "🏛️",
      tabLabel: "코스피 30년전수 (1996-2026)",
      isDefault: false,
      shortName: "실험 #2 (1996~2026 IMF포함 코스피+현금 50선)",
      badge: "Experiment #2 · Full Historical Regime (1996.07.01 ~ 2026.10.27, 30.3 Years) · 50 Strategies Tested",
      title: "🏛️ 코스피 200 · 현금 30년 전수(1997 IMF 외환위기 포함) 백테스트 (Top 10 / 50)",
      subtitle:
        "1997~1998년 국가부도 IMF 쇼크(코스피 -64.66% 폭락)를 포함한 30.3년 전수 구간 백테스트 결과입니다. 극단적 위기 방어를 위해 현금 65~75% 전략이 MDD를 -17.01%까지 낮추었으나 CAGR이 4.18%로 낮아진 역사적 비교 데이터입니다.",
      execTimingRule: "전일 종가 판정 → 익일 시가 체결",
      execTimingDesc: "전일 종가(T-1 Close) 시그널 → 익일 시가(T Open) 체결",
      execTimingShort: "T-1 종가 → T 시가",
      benchmarkHtml: `
        <div class="bench-pill"><strong>코스피200 100% (Buy&Hold):</strong> CAGR <span class="pos">+6.73%</span> · MDD <span class="neg">-64.66%</span> (1997.06→1998.06 IMF) · Calmar 0.104</div>
        <div class="bench-pill"><strong>코스피 50% + 현금 50% (무리밸런싱):</strong> CAGR <span class="pos">+5.16%</span> · MDD <span class="neg">-34.00%</span> · Calmar 0.152</div>
        <div class="bench-pill"><strong>현금 100% (US3M 단기금리):</strong> CAGR <span class="pos">+2.31%</span> · MDD <span class="pos">0.00%</span></div>
      `,
      sweetSpotIntro:
        "1997년 IMF를 포함할 경우 초방어 현금 75% 전략(#1 K01)이 MDD -17.01%를 기록하지만 CAGR이 4.18%에 그칩니다. 반면 20/60일 수급선 스위칭 전략(#4 K18)은 30년 전수 구간에서도 CAGR +8.70%, MDD -34.91%를 달성하여 우수한 복리 성장력을 입증했습니다.",
      sweetSpotBoxesHtml: `
        <div class="sweet-box gold">
          <h3>1️⃣ 30년 전수 목적별 배분비율</h3>
          <ul>
            <li><strong>초저낙폭 절대방어형 (#1 K01, #2 K02):</strong> <code>코스피 25~35% : 현금 65~75%</code> → 30.3년 MDD를 <strong>-17.01% ~ -24.90%</strong>로 봉쇄하나 CAGR은 <strong>+4.18% ~ +4.92%</strong>로 예금금리 수준에 머묾.</li>
            <li><strong>중위험·중수익 균형형 (#3 K14, #6 K28, #7 K48, #8 K06, #10 K22):</strong> <code>코스피 40~45% : 현금 55~60%</code> → MDD <strong>-27.17% ~ -30.08%</strong>, CAGR <strong>+5.10% ~ +6.03%</strong>.</li>
            <li><strong>코스피 초과수익 알파 챔피언 (#4 K18, #5 K20, #9 K12):</strong> 코어 35~45% + 추세 스위칭 → CAGR <strong>+6.48% ~ +8.70%</strong>, MDD <strong>-31.31% ~ -34.91%</strong>.</li>
          </ul>
        </div>
        <div class="sweet-box">
          <h3>2️⃣ 30년 전수 리밸런싱의 한계와 교훈</h3>
          <ul>
            <li>IMF와 같은 국가부도 특수 국면에서는 단순 비율 유지 리밸런싱만으로는 낙폭을 20% 이내로 줄이기 위해 현금 비중을 75%까지 올려야 하며, 이로 인해 평상시 수익률이 4%대로 희생됩니다.</li>
            <li>따라서 <strong>추세 추종 및 매크로 스위칭(K18, K20, K12, K45)</strong>을 통해 평소에는 코스피 성장 과실을 누리고 위기 시에만 현금으로 대피하는 전략이 훨씬 우수합니다.</li>
          </ul>
        </div>
        <div class="sweet-box green">
          <h3>3️⃣ 30년 전수 vs 포스트 IMF 시사점</h3>
          <ul>
            <li>현재 한국 시장에 진입하는 실전 투자자 관점에서는 1997년 고정환율제 붕괴 특수 국면이 배제된 <strong>포스트 IMF (1999~2026, 탭 1)</strong>의 결과(CAGR 6~9%, MDD 24~34%)가 훨씬 현실적이고 유용한 가이드라인을 제공합니다.</li>
          </ul>
        </div>
      `,
      data: exp2Data,
    },
  ];

  const tabsNavHtml = EXPERIMENT_TABS.map(
    (tab) => `
      <button type="button" class="tab-btn ${tab.isDefault ? "active" : ""}" id="tab-btn-${tab.key}" onclick="switchExperimentTab('${tab.key}')" title="${tab.shortName}">
        <span class="tab-icon">${tab.tabIcon}</span>
        <span class="tab-title">${tab.tabLabel}</span>
      </button>
    `
  ).join("\n");

  const tabsPanelsHtml = EXPERIMENT_TABS.map((tab) => renderTabSectionHtml(tab, tab.data)).join("\n");

  const glossaryCardsHtml = Object.entries(QUANT_TERMS_DICT)
    .map(
      ([key, item]) => `
        <div class="glossary-card" id="glossary-${key}">
          <div class="g-title">${item.title}</div>
          <div class="g-short">${item.short}</div>
          <div class="g-formula"><code>${item.formula}</code></div>
          <p class="g-detail">${item.detail.replace(/\n/g, "<br/>")}</p>
          <div class="g-good"><strong>💡 실전 판독 기준:</strong> ${item.goodRange}</div>
        </div>
      `
    )
    .join("\n");

  const chartPayloadsMap = {};
  for (const tab of EXPERIMENT_TABS) {
    chartPayloadsMap[tab.key] = tab.data.chartPayload;
  }

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>QuantCross Lab — 멀티에이전트 블라인드 백테스트 통합 리포트 (탭 확장형)</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js"></script>
  <style>
    :root {
      --bg-body: #0b1120;
      --bg-card: #111827;
      --bg-card-alt: #1e293b;
      --border: #334155;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --accent: #38bdf8;
      --gold: #f59e0b;
      --pos: #10b981;
      --neg: #f43f5e;
      --purple: #a855f7;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Pretendard", "Segoe UI", Roboto, sans-serif;
      background: var(--bg-body);
      color: var(--text-main);
      line-height: 1.55;
    }
    .container {
      max-width: 1480px;
      margin: 0 auto;
      padding: 24px 24px 70px;
    }
    .hero {
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 55%, #172554 100%);
      border: 1px solid #3b82f644;
      border-radius: 16px;
      padding: 24px 30px;
      margin-bottom: 18px;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
    }
    .hero-badge {
      display: inline-block;
      background: rgba(56, 189, 248, 0.15);
      color: var(--accent);
      border: 1px solid rgba(56, 189, 248, 0.35);
      font-size: 12px;
      font-weight: 700;
      padding: 4px 12px;
      border-radius: 999px;
      margin-bottom: 8px;
    }
    .hero h1 {
      margin: 0 0 8px;
      font-size: 25px;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    .hero p {
      margin: 0;
      color: #cbd5e1;
      font-size: 14px;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 12px;
      margin-top: 16px;
    }
    .meta-card {
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 10px;
      padding: 11px 15px;
    }
    .meta-card .m-label {
      font-size: 11.5px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .meta-card .m-val {
      font-size: 14.5px;
      font-weight: 700;
      color: #fff;
      margin-top: 3px;
    }
    .meta-card .m-sub {
      font-size: 11.5px;
      color: var(--accent);
      margin-top: 2px;
    }

    /* Quick Glossary Strip */
    .quick-help-bar {
      background: rgba(30, 41, 59, 0.75);
      border: 1px solid rgba(56, 189, 248, 0.3);
      border-radius: 12px;
      padding: 12px 18px;
      margin-bottom: 18px;
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }
    .quick-help-label {
      font-size: 13px;
      font-weight: 700;
      color: var(--accent);
      margin-right: 6px;
    }
    .term-chip {
      background: #0f172a;
      color: #e2e8f0;
      border: 1px solid #475569;
      border-radius: 999px;
      padding: 4px 11px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      transition: all 0.15s ease;
    }
    .term-chip:hover {
      border-color: var(--accent);
      color: #fff;
      background: rgba(56, 189, 248, 0.18);
      transform: translateY(-1px);
    }
    .term-chip .q-mark {
      background: var(--accent);
      color: #0b1120;
      border-radius: 50%;
      width: 15px;
      height: 15px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 10.5px;
      font-weight: 900;
    }

    /* Inline ? Help Button */
    .help-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 17px;
      height: 17px;
      border-radius: 50%;
      background: rgba(56, 189, 248, 0.2);
      color: var(--accent);
      border: 1px solid rgba(56, 189, 248, 0.55);
      font-size: 11px;
      font-weight: 800;
      cursor: pointer;
      margin-left: 3px;
      padding: 0;
      vertical-align: middle;
      transition: all 0.15s ease;
    }
    .help-btn:hover {
      background: var(--accent);
      color: #0f172a;
      transform: scale(1.12);
    }

    /* Chrome-style Compact Tabs Navigation Bar */
    .tabs-nav {
      display: flex;
      gap: 3px;
      align-items: flex-end;
      overflow-x: auto;
      white-space: nowrap;
      flex-wrap: nowrap;
      border-bottom: 1px solid #334155;
      padding: 4px 6px 0 6px;
      margin-bottom: 16px;
      position: sticky;
      top: 0;
      z-index: 100;
      background: rgba(11, 17, 32, 0.96);
      backdrop-filter: blur(12px);
      scrollbar-width: thin;
      scrollbar-color: #334155 transparent;
    }
    .tabs-nav::-webkit-scrollbar {
      height: 3px;
    }
    .tabs-nav::-webkit-scrollbar-thumb {
      background: #334155;
      border-radius: 2px;
    }
    .tab-btn {
      background: rgba(15, 23, 42, 0.65);
      color: #94a3b8;
      border: 1px solid rgba(51, 65, 85, 0.5);
      border-bottom: none;
      border-radius: 8px 8px 0 0;
      padding: 0 13px;
      height: 34px;
      font-size: 12.5px;
      font-weight: 500;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      position: relative;
      margin-bottom: -1px;
      user-select: none;
      transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
      flex-shrink: 0;
    }
    .tab-btn:hover {
      background: rgba(30, 41, 59, 0.85);
      color: #f1f5f9;
      border-color: rgba(100, 116, 139, 0.6);
    }
    .tab-btn.active {
      background: #1e293b;
      color: #38bdf8;
      font-weight: 700;
      border: 1px solid #475569;
      border-top: 2.5px solid #38bdf8;
      border-bottom: 1px solid #1e293b;
      box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.35);
      z-index: 2;
    }
    .tab-icon {
      font-size: 13px;
      line-height: 1;
      display: inline-flex;
      align-items: center;
    }
    .tab-title {
      letter-spacing: -0.2px;
    }
    .tab-pill {
      background: rgba(15, 23, 42, 0.55);
      color: #fde047;
      border: 1px solid rgba(253, 224, 71, 0.4);
      padding: 1px 6px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 700;
      margin-left: 2px;
    }
    .tab-panel {
      display: none;
    }
    .tab-panel.active {
      display: block;
      animation: fadeIn 0.22s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .exp-banner {
      background: linear-gradient(135deg, #111827 0%, #1e293b 100%);
      border-left: 4px solid var(--accent);
    }
    .exp-banner-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 20px;
      flex-wrap: wrap;
    }
    .exp-Benchmarks {
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 320px;
    }
    .bench-pill {
      background: #0f172a;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 7px 12px;
      font-size: 12.5px;
      color: #e2e8f0;
    }

    .section-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 24px;
      margin-bottom: 24px;
    }
    .section-title {
      margin: 0 0 6px;
      font-size: 20px;
      font-weight: 800;
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .section-sub {
      margin: 0 0 18px;
      color: var(--text-muted);
      font-size: 13.5px;
    }
    .sweetspot-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;
    }
    .sweet-box {
      background: var(--bg-card-alt);
      border: 1px solid #475569;
      border-top: 3px solid var(--accent);
      border-radius: 10px;
      padding: 18px;
    }
    .sweet-box.gold { border-top-color: var(--gold); }
    .sweet-box.green { border-top-color: var(--pos); }
    .sweet-box h3 {
      margin: 0 0 8px;
      font-size: 16px;
      color: #fff;
    }
    .sweet-box p, .sweet-box ul {
      margin: 0;
      font-size: 13.5px;
      color: #cbd5e1;
      padding-left: 18px;
    }
    .sweet-box li { margin-bottom: 6px; }
    .chart-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    @media (max-width: 1024px) {
      .chart-grid-2 { grid-template-columns: 1fr; }
    }
    .chart-box {
      background: var(--bg-card-alt);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px;
    }
    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      gap: 8px;
      flex-wrap: wrap;
    }
    .chart-title {
      font-size: 14.5px;
      font-weight: 700;
    }
    .chart-canvas-wrap {
      position: relative;
      height: 360px;
      width: 100%;
    }
    .btn-toggle {
      background: #0f172a;
      color: var(--accent);
      border: 1px solid var(--accent);
      border-radius: 6px;
      padding: 4px 10px;
      font-size: 12px;
      cursor: pointer;
      font-weight: 600;
    }
    .btn-toggle:hover {
      background: rgba(56, 189, 248, 0.15);
    }
    .table-wrap {
      overflow-x: auto;
      border-radius: 10px;
      border: 1px solid var(--border);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    th {
      background: #0f172a;
      color: #cbd5e1;
      font-weight: 700;
      text-align: left;
      padding: 11px 12px;
      border-bottom: 1px solid var(--border);
      white-space: nowrap;
    }
    td {
      padding: 11px 12px;
      border-bottom: 1px solid rgba(51, 65, 85, 0.6);
      vertical-align: middle;
    }
    tr:hover td {
      background: rgba(255, 255, 255, 0.03);
    }
    .top3-highlight td {
      background: rgba(245, 158, 11, 0.05);
    }
    .row-selected td {
      background: rgba(16, 185, 129, 0.05);
    }
    .num {
      text-align: right;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
    .pos { color: var(--pos); }
    .neg { color: var(--neg); }
    .accent { color: var(--accent); }
    .sub-num {
      font-size: 11.5px;
      color: var(--text-muted);
    }
    .rank-badge {
      display: inline-block;
      padding: 3px 9px;
      border-radius: 999px;
      font-weight: 800;
      font-size: 12px;
      background: #334155;
      color: #fff;
    }
    .rank-1 { background: linear-gradient(135deg, #f59e0b, #d97706); color: #000; }
    .rank-2 { background: linear-gradient(135deg, #e2e8f0, #94a3b8); color: #000; }
    .rank-3 { background: linear-gradient(135deg, #f97316, #c2410c); color: #fff; }
    .blind-tag, .blind-id-pill {
      display: inline-block;
      background: rgba(168, 85, 247, 0.15);
      color: #d8b4fe;
      border: 1px solid rgba(168, 85, 247, 0.35);
      padding: 1px 7px;
      border-radius: 4px;
      font-size: 11px;
      font-family: monospace;
    }
    .alloc-chip {
      display: inline-block;
      background: rgba(56, 189, 248, 0.12);
      border: 1px solid rgba(56, 189, 248, 0.3);
      color: #e0f2fe;
      padding: 4px 8px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 12px;
      white-space: nowrap;
    }
    .reb-text {
      font-size: 12px;
      color: #e2e8f0;
    }
    .rule-pill {
      background: rgba(15, 23, 42, 0.8);
      border-left: 3px solid var(--accent);
      padding: 3px 8px;
      margin-bottom: 4px;
      font-size: 11.5px;
      border-radius: 0 4px 4px 0;
    }
    .badge-static {
      color: var(--gold);
      font-size: 12px;
      font-weight: 600;
    }

    /* MDD Timing Cell & Box */
    .td-mdd {
      min-width: 230px;
    }
    .mdd-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .mdd-timing-pill {
      font-size: 11.5px;
      color: #fca5a5;
      background: rgba(244, 63, 94, 0.12);
      border: 1px solid rgba(244, 63, 94, 0.3);
      border-radius: 4px;
      padding: 1px 6px;
      display: inline-block;
      width: fit-content;
    }
    .mdd-event-tag {
      font-size: 11px;
      color: #fde047;
      font-weight: 600;
    }
    .mdd-episode-box {
      margin-top: 12px;
      background: rgba(244, 63, 94, 0.07);
      border: 1px solid rgba(244, 63, 94, 0.35);
      border-left: 4px solid var(--neg);
      border-radius: 8px;
      padding: 10px 14px;
    }
    .mdd-ep-title {
      font-size: 13px;
      font-weight: 800;
      color: #fda4af;
      margin-bottom: 6px;
    }
    .mdd-ep-body {
      font-size: 12.5px;
      color: #e2e8f0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .mdd-ep-body code {
      background: #0f172a;
      color: #38bdf8;
      padding: 1px 5px;
      border-radius: 4px;
      font-size: 12px;
    }
    .mdd-desc-highlight {
      color: #fde047;
      font-weight: 600;
    }

    .detail-card {
      background: var(--bg-card-alt);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 18px;
    }
    .detail-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      flex-wrap: wrap;
      border-bottom: 1px solid var(--border);
      padding-bottom: 14px;
      margin-bottom: 14px;
    }
    .badge-rank {
      display: inline-block;
      background: rgba(245, 158, 11, 0.15);
      color: var(--gold);
      border: 1px solid rgba(245, 158, 11, 0.4);
      font-size: 11.5px;
      font-weight: 700;
      padding: 2px 10px;
      border-radius: 999px;
      margin-bottom: 6px;
    }
    .detail-title {
      margin: 0 0 6px;
      font-size: 18px;
      font-weight: 800;
    }
    .detail-rationale {
      margin: 0;
      font-size: 13.5px;
      color: #cbd5e1;
    }
    .detail-kpi-box {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    .kpi-mini {
      background: #0f172a;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 8px 14px;
      min-width: 130px;
      text-align: right;
    }
    .kpi-label {
      display: block;
      font-size: 11px;
      color: var(--text-muted);
    }
    .kpi-val {
      font-size: 16px;
      font-weight: 800;
    }
    .detail-grid {
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 20px;
    }
    @media (max-width: 960px) {
      .detail-grid { grid-template-columns: 1fr; }
    }
    .detail-col h4 {
      margin: 0 0 10px;
      font-size: 14px;
      color: var(--accent);
    }
    .spec-list {
      margin: 0;
      padding-left: 18px;
      font-size: 13px;
      color: #e2e8f0;
    }
    .spec-list li { margin-bottom: 6px; }
    .highlight-text {
      color: var(--gold);
      font-weight: 700;
    }
    .reviewer-box {
      background: #0f172a;
      border-left: 3px solid var(--purple);
      padding: 10px 14px;
      border-radius: 0 8px 8px 0;
      font-size: 13px;
      color: #e2e8f0;
      margin-bottom: 12px;
    }
    .crisis-mini-grid {
      display: grid;
      gap: 8px;
    }
    .crisis-item {
      background: #0f172a;
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 6px 8px;
      text-align: center;
    }
    .c-name { font-size: 11px; color: var(--text-muted); }
    .c-val { font-size: 13px; font-weight: 700; margin-top: 2px; }
    .c-mdd { font-size: 10.5px; color: #94a3b8; }

    /* Glossary Tab Grid */
    .glossary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
      gap: 16px;
    }
    .glossary-card {
      background: var(--bg-card-alt);
      border: 1px solid var(--border);
      border-top: 3px solid var(--accent);
      border-radius: 12px;
      padding: 18px;
    }
    .g-title {
      font-size: 16px;
      font-weight: 800;
      color: #fff;
      margin-bottom: 6px;
    }
    .g-short {
      font-size: 13px;
      font-weight: 700;
      color: var(--accent);
      margin-bottom: 8px;
    }
    .g-formula {
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 6px;
      padding: 6px 10px;
      font-size: 12px;
      color: #fde047;
      margin-bottom: 10px;
    }
    .g-detail {
      font-size: 13px;
      color: #cbd5e1;
      margin: 0 0 10px;
    }
    .g-good {
      font-size: 12.5px;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.35);
      color: #a7f3d0;
      padding: 7px 10px;
      border-radius: 6px;
    }

    /* Interactive Modal for ? Help */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(2, 6, 23, 0.78);
      backdrop-filter: blur(4px);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: 20px;
    }
    .modal-backdrop.open {
      display: flex;
    }
    .modal-box {
      background: #0f172a;
      border: 2px solid var(--accent);
      border-radius: 16px;
      max-width: 620px;
      width: 100%;
      padding: 24px 28px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.65);
      position: relative;
      animation: fadeIn 0.16s ease;
    }
    .modal-close {
      position: absolute;
      top: 16px;
      right: 18px;
      background: #1e293b;
      color: #cbd5e1;
      border: 1px solid #475569;
      border-radius: 8px;
      padding: 4px 10px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
    }
    .modal-close:hover {
      background: var(--neg);
      color: #fff;
      border-color: var(--neg);
    }
    .modal-badge {
      display: inline-block;
      background: rgba(56, 189, 248, 0.15);
      color: var(--accent);
      font-size: 11.5px;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 999px;
      margin-bottom: 8px;
    }
    .modal-title {
      font-size: 20px;
      font-weight: 800;
      color: #fff;
      margin: 0 0 8px;
      padding-right: 60px;
    }
    .modal-short {
      font-size: 14px;
      font-weight: 700;
      color: #38bdf8;
      margin-bottom: 12px;
    }
    .modal-formula {
      background: #1e293b;
      border-left: 3px solid var(--gold);
      padding: 8px 12px;
      border-radius: 0 6px 6px 0;
      font-family: monospace;
      font-size: 13px;
      color: #fde047;
      margin-bottom: 14px;
    }
    .modal-detail {
      font-size: 14px;
      color: #e2e8f0;
      line-height: 1.65;
      margin-bottom: 14px;
    }
    .modal-good {
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.4);
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 13px;
      color: #a7f3d0;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- GLOBAL HERO -->
    <header class="hero">
      <div class="hero-badge">4-Agent Blind Evaluation Architecture · Multi-Experiment Tabbed Dashboard</div>
      <h1>QuantCross Lab — 투자전략 블라인드 백테스트 통합 결과 보고서</h1>
      <p>
        웹 전략 수집(<strong>strategy-collector</strong>) → 50개 전략 그리드 설계(<strong>quant-strategy-architect</strong>) →
        전일 종가 시그널·익일 시가/종가 체결 및 블라인드 마스킹(<strong>backtest-tester</strong>) →
        독립 정량 심사(<strong>blind-reviewer</strong>)로 검증된 전략 리포트입니다. 상단 탭을 클릭해 실험별 결과를 전환할 수 있습니다.
      </p>
      <div class="meta-grid">
        <div class="meta-card">
          <div class="m-label">누적 검증 전략 수</div>
          <div class="m-val">총 250개 실험 (5개 세트 · 나스닥/코스피/3자산)</div>
          <div class="m-sub">각 실험별 파레토 최적 Top 10 엄선</div>
        </div>
        <div class="meta-card">
          <div class="m-label">시그널 및 주문 체결 기준</div>
          <div class="m-val">전일 종가(T-1) → 익일 시가/종가(T)</div>
          <div class="m-sub">Yahoo Finance 실제 일별 시가 및 종가 체결 지원</div>
        </div>
        <div class="meta-card">
          <div class="m-label">주간 매매 빈도 제한</div>
          <div class="m-val">주 최대 3회 이하 (100% 준수)</div>
          <div class="m-sub">캘린더 주간 & 롤링 5거래일 동시 통제</div>
        </div>
        <div class="meta-card">
          <div class="m-label">검증 구간 & MDD 발생 시점 추적</div>
          <div class="m-val">포스트 IMF (1999~2026, 27.8년)</div>
          <div class="m-sub">고점일→저점일→회복일 및 위기 배경 명시</div>
        </div>
      </div>
    </header>

    <!-- QUICK ? GLOSSARY BAR -->
    <div class="quick-help-bar">
      <span class="quick-help-label">💡 생소한 지표·용어 클릭 설명 (?):</span>
      <button type="button" class="term-chip" onclick="openTermModal('sharpe')"><span class="q-mark">?</span> 샤프 지수 (Sharpe)</button>
      <button type="button" class="term-chip" onclick="openTermModal('calmar')"><span class="q-mark">?</span> 칼마 지수 (Calmar)</button>
      <button type="button" class="term-chip" onclick="openTermModal('sortino')"><span class="q-mark">?</span> 소르티노 지수 (Sortino)</button>
      <button type="button" class="term-chip" onclick="openTermModal('mdd')"><span class="q-mark">?</span> MDD (최대낙폭)</button>
      <button type="button" class="term-chip" onclick="openTermModal('ulcer')"><span class="q-mark">?</span> 궤양 지수 (Ulcer Index)</button>
      <button type="button" class="term-chip" onclick="openTermModal('cagr')"><span class="q-mark">?</span> CAGR (연복리수익률)</button>
      <button type="button" class="term-chip" onclick="openTermModal('oos')"><span class="q-mark">?</span> OOS (표본외 현대검증)</button>
      <button type="button" class="term-chip" onclick="openTermModal('stability')"><span class="q-mark">?</span> 파라미터 안정성</button>
      <button type="button" class="term-chip" onclick="openTermModal('vol_harvest')"><span class="q-mark">?</span> 변동성 수확 (리밸런싱)</button>
      <button type="button" class="term-chip" onclick="openTermModal('canary')"><span class="q-mark">?</span> 카나리아 선행 시그널</button>
      <button type="button" class="term-chip" onclick="openTermModal('disparity')"><span class="q-mark">?</span> 이격도</button>
      <button type="button" class="term-chip" onclick="openTermModal('rsi')"><span class="q-mark">?</span> RSI</button>
      <button type="button" class="term-chip" onclick="openTermModal('bb')"><span class="q-mark">?</span> 볼린저밴드 (%B/폭)</button>
    </div>

    <!-- MULTI-EXPERIMENT TABS BAR -->
    <nav class="tabs-nav" aria-label="실험 결과 탭 메뉴">
      ${tabsNavHtml}
      <button type="button" class="tab-btn" id="tab-btn-glossary" onclick="switchExperimentTab('glossary')" title="백테스트 핵심 지표 및 금융·퀀트 용어 백과사전">
        <span class="tab-icon">📖</span>
        <span class="tab-title">퀀트 용어 사전</span>
      </button>
    </nav>

    <!-- EXPERIMENT PANELS -->
    ${tabsPanelsHtml}

    <!-- GLOSSARY PANEL -->
    <div id="tab-panel-glossary" class="tab-panel">
      <section class="section-card">
        <h2 class="section-title">📖 백테스트 핵심 지표 및 금융·퀀트 용어 백과사전</h2>
        <p class="section-sub">표와 카드에 등장하는 모든 정량 지표와 기술적 시그널의 공식, 직관적 의미, 실전 판독 기준을 한눈에 볼 수 있습니다.</p>
        <div class="glossary-grid">
          ${glossaryCardsHtml}
        </div>
      </section>
    </div>
  </div>

  <!-- MODAL FOR ? HELP -->
  <div class="modal-backdrop" id="termModalBackdrop" onclick="if(event.target===this) closeTermModal()">
    <div class="modal-box" role="dialog" aria-modal="true">
      <button type="button" class="modal-close" onclick="closeTermModal()">✕ 닫기 (ESC)</button>
      <div class="modal-badge">퀀트 지표 · 용어 쉽게 이해하기</div>
      <h3 class="modal-title" id="modalTermTitle"></h3>
      <div class="modal-short" id="modalTermShort"></div>
      <div class="modal-formula" id="modalTermFormula"></div>
      <div class="modal-detail" id="modalTermDetail"></div>
      <div class="modal-good" id="modalTermGood"></div>
    </div>
  </div>

  <script>
    const TERMS_DICT = ${JSON.stringify(QUANT_TERMS_DICT)};
    const CHART_PAYLOADS = ${JSON.stringify(chartPayloadsMap)};

    const palette = [
      "#f59e0b", "#38bdf8", "#10b981", "#a855f7", "#ec4899",
      "#eab308", "#06b6d4", "#84cc16", "#f97316", "#6366f1"
    ];

    const renderedCharts = {};
    const equityScaleModes = {};

    function openTermModal(termKey) {
      const item = TERMS_DICT[termKey];
      if (!item) return;
      document.getElementById("modalTermTitle").textContent = item.title;
      document.getElementById("modalTermShort").textContent = "핵심 요약: " + item.short;
      document.getElementById("modalTermFormula").textContent = "산출 공식: " + item.formula;
      document.getElementById("modalTermDetail").innerHTML = item.detail.replace(/\\n/g, "<br/>");
      document.getElementById("modalTermGood").innerHTML = "<strong>💡 실전 판독 기준:</strong> " + item.goodRange;
      document.getElementById("termModalBackdrop").classList.add("open");
    }

    function closeTermModal() {
      document.getElementById("termModalBackdrop").classList.remove("open");
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeTermModal();
    });

    function switchExperimentTab(tabKey) {
      document.querySelectorAll(".tab-btn").forEach((btn) => btn.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach((panel) => panel.classList.remove("active"));

      const targetBtn = document.getElementById("tab-btn-" + tabKey);
      const targetPanel = document.getElementById("tab-panel-" + tabKey);
      if (targetBtn) targetBtn.classList.add("active");
      if (targetPanel) targetPanel.classList.add("active");

      if (CHART_PAYLOADS[tabKey] && !renderedCharts[tabKey]) {
        initChartsForTab(tabKey);
      }
    }

    function initChartsForTab(tabKey) {
      const payload = CHART_PAYLOADS[tabKey];
      if (!payload) return;

      // 1. Scatter Chart (50 Strategies MDD vs CAGR)
      const scatterCtx = document.getElementById("scatterChart_" + tabKey).getContext("2d");
      const top10Points = payload.scatter50.filter((d) => d.rank !== null);
      const otherPoints = payload.scatter50.filter((d) => d.rank === null);

      const benchPoints = Object.values(payload.baselines).map((b) => ({
        x: Math.abs(b.fullMetrics.maxDrawdownPct),
        y: b.fullMetrics.cagrPct,
        raw: {
          originalId: b.id,
          name: b.name,
          cagrPct: b.fullMetrics.cagrPct,
          mddPct: b.fullMetrics.maxDrawdownPct,
          mddPeakDate: b.fullMetrics.maxDrawdownPeakDate,
          mddDate: b.fullMetrics.maxDrawdownDate,
          mddEvent: b.fullMetrics.mddEventDescription,
          calmar: b.fullMetrics.calmar,
        },
      }));

      new Chart(scatterCtx, {
        type: "scatter",
        data: {
          datasets: [
            {
              label: "선정된 Top 10 최적 전략",
              data: top10Points.map((d) => ({ x: d.mddAbs, y: d.cagrPct, raw: d })),
              backgroundColor: "#f59e0b",
              borderColor: "#fff",
              borderWidth: 1.5,
              pointRadius: 7,
              pointHoverRadius: 9,
            },
            {
              label: "나머지 40개 후보 전략",
              data: otherPoints.map((d) => ({ x: d.mddAbs, y: d.cagrPct, raw: d })),
              backgroundColor: "rgba(56, 189, 248, 0.45)",
              borderColor: "rgba(56, 189, 248, 0.8)",
              borderWidth: 1,
              pointRadius: 4.5,
            },
            {
              label: "비교 벤치마크 (단독/기본 보유)",
              data: benchPoints,
              backgroundColor: "#f43f5e",
              borderColor: "#fff",
              pointStyle: "rectRot",
              pointRadius: 7.5,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: "#cbd5e1", font: { size: 11.5 } } },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const r = ctx.raw.raw;
                  const rankStr = r.rank ? "[Top " + r.rank + "] " : "";
                  return [
                    rankStr + r.originalId + " " + r.name,
                    "• 연평균 CAGR: +" + r.cagrPct.toFixed(2) + "% | MDD: " + r.mddPct.toFixed(2) + "% (Calmar " + r.calmar.toFixed(3) + ")",
                    "• MDD 시점: " + (r.mddPeakDate || "-") + " → " + (r.mddDate || "-"),
                    "• 배경: " + (r.mddEvent || "-"),
                  ];
                },
              },
            },
          },
          scales: {
            x: {
              reverse: true,
              title: { display: true, text: "최대낙폭 |MDD| (%) — 왼쪽(작을수록)이 안전", color: "#94a3b8" },
              ticks: { color: "#94a3b8", callback: (v) => "-" + v + "%" },
              grid: { color: "rgba(51, 65, 85, 0.4)" },
            },
            y: {
              title: { display: true, text: "연평균 복리수익률 CAGR (%) — 위쪽이 고수익", color: "#94a3b8" },
              ticks: { color: "#94a3b8", callback: (v) => v + "%" },
              grid: { color: "rgba(51, 65, 85, 0.4)" },
            },
          },
        },
      });

      // 2. Equity Curve Chart
      const eqCtx = document.getElementById("equityChart_" + tabKey).getContext("2d");
      equityScaleModes[tabKey] = true; // default logarithmic

      const eqDatasets = payload.top10Curves.map((t, i) => ({
        label: "#" + t.rank + " " + t.originalId + " (+" + t.cagrPct.toFixed(1) + "%)",
        data: t.normEquity,
        borderColor: palette[i % palette.length],
        borderWidth: i < 3 ? 2.4 : 1.4,
        pointRadius: 0,
        tension: 0.1,
      }));

      Object.values(payload.baselines).forEach((b, idx) => {
        const dashColors = ["#94a3b8", "#f43f5e", "#eab308"];
        eqDatasets.push({
          label: "벤치마크: " + b.name + " (+" + b.fullMetrics.cagrPct.toFixed(1) + "%)",
          data: b.compactCurve.normEquity,
          borderColor: dashColors[idx % dashColors.length],
          borderDash: [5, 4],
          borderWidth: 1.6,
          pointRadius: 0,
        });
      });

      const equityChart = new Chart(eqCtx, {
        type: "line",
        data: {
          labels: payload.dates,
          datasets: eqDatasets,
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: "index", intersect: false },
          plugins: {
            legend: {
              labels: { color: "#cbd5e1", boxWidth: 12, font: { size: 11 } },
              onClick: function (e, legendItem, legend) {
                Chart.defaults.plugins.legend.onClick.call(this, e, legendItem, legend);
                syncToggleAllBtn(tabKey, "equity");
              },
            },
          },
          scales: {
            x: {
              ticks: { color: "#94a3b8", maxTicksLimit: 10 },
              grid: { color: "rgba(51, 65, 85, 0.3)" },
            },
            y: {
              type: "logarithmic",
              title: { display: true, text: "누적 자산 지수 (원금 = 100, 로그 스케일)", color: "#94a3b8" },
              ticks: { color: "#94a3b8" },
              grid: { color: "rgba(51, 65, 85, 0.3)" },
            },
          },
        },
      });

      // 3. Drawdown Chart (Top 5 vs KPI200 100%)
      const ddCtx = document.getElementById("drawdownChart_" + tabKey).getContext("2d");
      const ddDatasets = payload.top10Curves.slice(0, 5).map((t, i) => ({
        label: "#" + t.rank + " " + t.originalId + " (MDD " + t.mddPct.toFixed(1) + "%)",
        data: t.drawdown,
        borderColor: palette[i],
        backgroundColor: "transparent",
        borderWidth: 1.7,
        pointRadius: 0,
      }));

      if (payload.baselines.BASE_KPI200) {
        ddDatasets.push({
          label: "코스피200 단독 100% (MDD " + payload.baselines.BASE_KPI200.fullMetrics.maxDrawdownPct.toFixed(1) + "%)",
          data: payload.baselines.BASE_KPI200.compactCurve.drawdown,
          borderColor: "rgba(244, 63, 94, 0.7)",
          backgroundColor: "rgba(244, 63, 94, 0.08)",
          fill: true,
          borderDash: [4, 4],
          borderWidth: 1.4,
          pointRadius: 0,
        });
      }

      const drawdownChart = new Chart(ddCtx, {
        type: "line",
        data: {
          labels: payload.dates,
          datasets: ddDatasets,
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: "index", intersect: false },
          plugins: {
            legend: {
              labels: { color: "#cbd5e1", boxWidth: 12, font: { size: 11 } },
              onClick: function (e, legendItem, legend) {
                Chart.defaults.plugins.legend.onClick.call(this, e, legendItem, legend);
                syncToggleAllBtn(tabKey, "drawdown");
              },
            },
          },
          scales: {
            x: {
              ticks: { color: "#94a3b8", maxTicksLimit: 12 },
              grid: { color: "rgba(51, 65, 85, 0.3)" },
            },
            y: {
              max: 0,
              min: -85,
              ticks: { color: "#94a3b8", callback: (v) => v + "%" },
              grid: { color: "rgba(51, 65, 85, 0.3)" },
            },
          },
        },
      });

      renderedCharts[tabKey] = { equityChart, drawdownChart };
    }

    function toggleAllDatasets(tabKey, chartType) {
      const cObj = renderedCharts[tabKey];
      if (!cObj) return;
      const chart = chartType === "equity" ? cObj.equityChart : cObj.drawdownChart;
      if (!chart) return;

      const anyVisible = chart.data.datasets.some((ds, idx) => {
        return typeof chart.isDatasetVisible === "function" ? chart.isDatasetVisible(idx) : !ds.hidden;
      });

      const targetVisibility = !anyVisible;

      chart.data.datasets.forEach((ds, idx) => {
        if (typeof chart.setDatasetVisibility === "function") {
          chart.setDatasetVisibility(idx, targetVisibility);
        } else {
          ds.hidden = !targetVisibility;
        }
      });

      chart.update();
      syncToggleAllBtn(tabKey, chartType);
    }

    function syncToggleAllBtn(tabKey, chartType) {
      const cObj = renderedCharts[tabKey];
      if (!cObj) return;
      const chart = chartType === "equity" ? cObj.equityChart : cObj.drawdownChart;
      if (!chart) return;

      const anyVisible = chart.data.datasets.some((ds, idx) => {
        return typeof chart.isDatasetVisible === "function" ? chart.isDatasetVisible(idx) : !ds.hidden;
      });

      const btnId = chartType === "equity" ? "btnToggleAllEquity_" + tabKey : "btnToggleAllDD_" + tabKey;
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.textContent = anyVisible ? "전체 해제" : "전체 선택";
      }
    }

    function toggleEquityScale(tabKey) {
      const cObj = renderedCharts[tabKey];
      if (!cObj || !cObj.equityChart) return;
      equityScaleModes[tabKey] = !equityScaleModes[tabKey];
      const isLog = equityScaleModes[tabKey];
      const chart = cObj.equityChart;
      chart.options.scales.y.type = isLog ? "logarithmic" : "linear";
      chart.options.scales.y.title.text = isLog
        ? "누적 자산 지수 (원금 = 100, 로그 스케일)"
        : "누적 자산 지수 (원금 = 100, 선형 스케일)";
      document.getElementById("btnScaleToggle_" + tabKey).textContent = isLog
        ? "선형(Linear) 스케일로 보기"
        : "로그(Log) 스케일로 보기";
      chart.update();
    }

    // Initialize default active tab charts on load
    window.addEventListener("DOMContentLoaded", () => {
      initChartsForTab("exp5_ndx_cash");
    });
  </script>
</body>
</html>`;

  fs.writeFileSync(OUT_HTML_PATH, html, "utf8");
  console.log(`[Report Generator] Multi-tab report successfully written to: ${OUT_HTML_PATH}`);
}

if (require.main === module) {
  main();
}
