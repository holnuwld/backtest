# QuantCross Lab 4-에이전트 블라인드 전략 탐색 및 검증 하네스 (`tests/strategy_eval/`)

본 디렉토리는 **코스피 200(`KPI200`), 나스닥 100(`NDX`), KRX 금현물(`KRX_GOLD`)** 3가지 자산을 대상으로 **MDD(최대낙폭)를 최소화하면서 기대수익률(CAGR)을 극대화하는 최적 투자 전략**을 탐색·검증하기 위한 **4-에이전트 아키텍처 및 결정론적 블라인드 하네스**입니다.

---

## 1. 4-에이전트 파이프라인 구조 (모두 Flash 모델 구동)

| 단계 | 에이전트 ID | 역할 | 권한 통제 | 입력 → 출력 |
| :---: | :--- | :--- | :---: | :--- |
| **Stage 1** | `strategy-collector` | 웹 대중 전략 및 퀀트 레퍼런스 수집 | Read + Web Search (`enable_write_tools: false`) | 웹/문헌 검색 → 5대 카테고리별 투자 전략 아키타입 카탈로그 |
| **Stage 2** | `quant-strategy-architect` | 50개 후보 전략 스키마 변환 및 그리드 설계 | Read-Only (`enable_write_tools: false`) | 아키타입 카탈로그 → `KPI200`/`NDX`/`KRX_GOLD` 50개 전략 명세 |
| **Stage 3** | `backtest-tester` | 전일 종가 시그널 → 익일 시가 체결 백테스트 & 블라인드 익명화 | Write + Run (`enable_write_tools: true`, `tests/strategy_eval/` 격리) | `strategies_50.js` → 다중 구간 시뮬레이션 → `blind_evaluation_input.json` (완전 익명) + `vault_mapping.json` (비밀 매핑) |
| **Stage 4** | `blind-reviewer` | 완전 블라인드 정량 성과 심사관 | Read-Only (`enable_write_tools: false`, `blind_evaluation_input.json`만 열람) | `blind_evaluation_input.json` → 상위 10개 익명 전략(`BLIND_XXX`) 선정 및 정량 근거 보고 |

---

## 2. 엄격 적용된 4대 시뮬레이션 불변식 (Invariants)

1. **매매 대상 자산 제한**: 포트폴리오 배분(`allocations`) 및 매수·매도 조건의 타겟(`targetTicker`, `fundingSource`)은 오직 **`KPI200`(코스피 200), `NDX`(나스닥 100), `KRX_GOLD`(KRX 금현물)** 3종(및 대기현금 `US3M`)으로만 제한됩니다.
2. **전일 종가(`T-1 Close`) 시그널 → 익일 시가(`T Open`) 체결**:
   - [`prepare_open_prices.js`](prepare_open_prices.js)를 통해 Yahoo Finance의 실제 일별 시가(`Open`) 데이터를 추출하여 `open_prices_cache.json`을 구축합니다.
   - [`next_open_engine.js`](next_open_engine.js)에서 모든 지표/규칙 및 리밸런싱 트리거는 **$T-1$일 종가** 기준으로 판별하며, 실제 매수·매도 체결은 **$T$일 시가(`getOpenPriceKrw`)**로 집행합니다. 일일 마감 평가는 **$T$일 종가(`getClosePriceKrw`)**로 수행합니다.
3. **주간 매매 횟수 제한 (최대 주 3회 이하)**:
   - ISO 달력 주간(`YYYY-Www`) 및 최근 5거래일 롤링 윈도우(`[T-4, T]`) 모두에서 **주간 최대 3회(`maxWeeklyTrades = 3`)**를 초과하는 매매를 원천 차단하며, 모든 개별 전략 규칙에도 `cooldownDays`를 부여해 잦은 매매를 방지합니다.
4. **다중 구간(Multi-Regime) 및 위기 스트레스 검증**:
   - **Full Verified Regime**: `1996-07-01 ~ 2026-10-27` (30.3년, 3자산 모두 100% 실거래 지수 구간)
   - **Modern Out-of-Sample Regime**: `2011-01-03 ~ 2026-10-27` (최근 15.8년)
   - **5대 역사적 위기 구간 MDD**: 1997 IMF 외환위기, 2000~2002 닷컴버블, 2008 글로벌 금융위기, 2020 코로나 팬데믹, 2022 금리인상 하락장
   - **파라미터 민감도(Perturbation)**: 핵심 지표 기간(p1)을 ±15% 변동시켰을 때의 Calmar/MDD 일관성 검증
