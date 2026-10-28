# QuantCross Lab — 1970~현재 멀티에셋 교차조건 백테스터

1970년 1월 2일부터 현재까지 일별(Daily) 데이터를 기반으로, **매매 가능 자산(17종)**과 **시그널 전용 지표(7종)**를 분리하여 다양한 파생지표(볼린저밴드, 이격도, RSI, MACD, 이동평균, 고점대비 하락률, 모멘텀, 스프레드) 및 리밸런싱 조건을 테스트하고 **스코어보드(Scoreboard)**로 관리할 수 있는 정적 웹 애플리케이션입니다.

## 주요 구성 파일
- [`index.html`](index.html) : 메인 웹 애플리케이션 (모바일 스마트폰 & PC 반응형)
- [`css/styles.css`](css/styles.css) : 다크/라이트 테마 및 모바일 하단 탭 UI 스타일시트
- [`js/indicators.js`](js/indicators.js) : 파생지표 계산 엔진 (SMA, EMA, 이격도, 볼린저밴드 상/하단·%B·폭, RSI, MACD, 낙폭, 모멘텀, 스프레드/비율)
- [`js/engine.js`](js/engine.js) : 멀티에셋 포트폴리오 백테스트 엔진 (금액/총액비율/잔액비율 매매, 기간·비율초과 밴드 리밸런싱, 단기금리 현금이자, 수수료)
- [`js/storage.js`](js/storage.js) : 스코어보드 실험 이력 관리 (`localStorage`) 및 사용자 추가 CSV 자산 영구 저장 (`IndexedDB`)
- [`js/app.js`](js/app.js) : UI 컨트롤러, 프리셋 전략 6종, Chart.js 시각화
- [`data/market_data.js`](data/market_data.js) : 1970~현재 일별 24개 자산/지표 통합 데이터셋 (`data/csv/` 폴더에 개별 CSV 수록)
- [`scripts/build_dataset.py`](scripts/build_dataset.py) : Yahoo Finance, FRED, Stooq에서 최신 일별 데이터를 수집·합성하여 `data/market_data.js`를 생성하는 스크립트

## 스마트폰 접속을 위한 GitHub Pages 배포 방법
1. 현재 폴더를 GitHub 저장소(Repository)에 Push합니다.
2. GitHub 저장소의 **Settings → Pages** 메뉴로 이동합니다.
3. **Build and deployment → Source**를 `Deploy from a branch`로 선택하고 `main` (또는 `master`) 브랜치의 `/ (root)` 폴더를 선택한 뒤 **Save**를 누릅니다.
4. 생성된 `https://<아이디>.github.io/<저장소이름>/` 주소로 스마트폰 브라우저에서 접속하면 언제든 백테스트 및 스코어보드 비교가 가능합니다.
