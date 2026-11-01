/**
 * tests/strategy_eval/run_all_assets_tax_backtest.js
 *
 * Comprehensive Multi-Asset & Korean Tax-Aware Backtest Suite (Initial Capital: 800,000,000 KRW / 8억 원)
 */

const fs = require("fs");
const path = require("path");

const marketData = require("../../data/market_data.json");
const indicatorsCode = fs.readFileSync(path.join(__dirname, "..", "..", "js", "indicators.js"), "utf8");
const engineCode = fs.readFileSync(path.join(__dirname, "..", "..", "js", "engine.js"), "utf8");

const sandbox = { window: {} };
sandbox.window = sandbox;
new Function("window", indicatorsCode)(sandbox.window);
new Function("window", engineCode)(sandbox.window);

const IndicatorEngine = sandbox.IndicatorEngine;
const BaseEngine = sandbox.BacktestEngine;

const INITIAL_CAPITAL_KRW = 800000000; // 8억 원
const START_DATE_POST_IMF = "1999-01-04";
const START_DATE_MODERN_OOS = "2011-01-03";
const END_DATE = "2026-10-27";

const KOREA_ASSET_TAX_SPECS = {
  KPI200: {
    id: "KPI200",
    name: "코스피 200 (국내 대표지수)",
    shortName: "코스피 200",
    group: "국내 주식",
    currency: "KRW",
    krEtfOption: "KODEX 200 / TIGER 200 (또는 KODEX 200 TR)",
    usEtfOption: "EWY (미국 직투 시 매매차익 22% 과세 불리)",
    bestMethod: "국내상장 주식형 ETF (KODEX 200 / TR)",
    whyBest: "국내 주식형 ETF는 장내 매매차익 100% 비과세(0%) 및 금융소득종합과세 완전 제외 (미국 EWY는 22% 과세되므로 국내 ETF 압도적 유리)",
    taxType: "KR_EQUITY_TAX_FREE",
    capGainTaxRate: 0.0,
    divYieldPct: 1.5,
    feeRatePct: 0.04,
    compTaxRisk: "안전 (매매차익 0% 비과세, 분배금만 연 2,000만 원 한도 관리)",
  },
  SPX: {
    id: "SPX",
    name: "미국 S&P 500 지수",
    shortName: "S&P 500",
    group: "미국 대표지수",
    currency: "USD",
    krEtfOption: "TIGER / KODEX 미국S&P500 (매매차익 15.4% 배당소득 + 종합과세 합산 위험)",
    usEtfOption: "VOO / IVV / SPLG (미국 직투, 양도소득세 22% 분리과세)",
    bestMethod: "미국 상장 ETF 직투 (VOO / IVV)",
    whyBest: "원금 8억 투자 시 국내상장 해외ETF는 +2.5%(2,000만 원)만 수익 나도 금융소득종합과세(최고 49.5%+건보료) 직행! 미국 직투(VOO)는 매매차익이 아무리 커도 22% 단일 분리과세로 종결",
    taxType: "US_DIRECT_22",
    capGainTaxRate: 0.22,
    divYieldPct: 1.3,
    feeRatePct: 0.05,
    compTaxRisk: "안전 (양도차익 분리과세, 8억 원 기준 초기 연 배당 ~1,040만 원 < 2,000만 원)",
  },
  NDX: {
    id: "NDX",
    name: "미국 나스닥 100 지수",
    shortName: "나스닥 100",
    group: "미국 대표지수",
    currency: "USD",
    krEtfOption: "TIGER / KODEX 미국나스닥100 (일반계좌 매매차익 종합과세 합산 위험)",
    usEtfOption: "QQQM / QQQ (미국 직투, 양도소득세 22% 분리과세)",
    bestMethod: "미국 상장 ETF 직투 (QQQM / QQQ)",
    whyBest: "배당수익률이 연 0.6%로 극히 낮아 8억 원이 30억 원으로 불어나도 연간 배당금이 1,800만 원 이하로 유지되며, 막대한 매매차익은 22% 분리과세로 금융소득종합과세를 완벽 회피",
    taxType: "US_DIRECT_22",
    capGainTaxRate: 0.22,
    divYieldPct: 0.6,
    feeRatePct: 0.05,
    compTaxRisk: "매우 안전 (초저배당 0.6% + 양도차익 분리과세로 8억 자산가 최적 코어 자산)",
  },
  DJI: {
    id: "DJI",
    name: "미국 다우존스 산업평균지수",
    shortName: "다우존스 30",
    group: "미국 대표지수",
    currency: "USD",
    krEtfOption: "TIGER 미국다우존스30 (매매차익 배당소득 합산과세)",
    usEtfOption: "DIA (SPDR Dow Jones Industrial Average ETF)",
    bestMethod: "미국 상장 ETF 직투 (DIA)",
    whyBest: "8억 원 투자 시 매매차익 종합과세 합산을 피하기 위해 미국 직투 DIA 선택 필수 (연 배당 ~1.8%는 금융소득 한도 내 관리)",
    taxType: "US_DIRECT_22",
    capGainTaxRate: 0.22,
    divYieldPct: 1.8,
    feeRatePct: 0.05,
    compTaxRisk: "보통 (8억 투자 시 연 배당 ~1,440만 원으로 초기 안전, 자산 11억 돌파 시 배당락 관리)",
  },
  SOXX: {
    id: "SOXX",
    name: "미국 필라델피아 반도체 지수",
    shortName: "미국 반도체(SOXX)",
    group: "미국 섹터/테마",
    currency: "USD",
    krEtfOption: "TIGER 미국필라델피아반도체나스닥 (일반계좌 종합과세 합산 위험)",
    usEtfOption: "SOXX / SMH (iShares / VanEck Semiconductor ETF)",
    bestMethod: "미국 상장 ETF 직투 (SOXX / SMH)",
    whyBest: "연 배당률 0.65%의 초저배당 고성장 자산으로 금융소득종합과세 한도를 거의 소진하지 않으면서 높은 자본차익을 22% 분리과세로 향유",
    taxType: "US_DIRECT_22",
    capGainTaxRate: 0.22,
    divYieldPct: 0.65,
    feeRatePct: 0.06,
    compTaxRisk: "매우 안전 (초저배당 0.65% + 양도소득 분리과세)",
  },
  XLK: {
    id: "XLK",
    name: "미국 S&P 기술 섹터 (XLK)",
    shortName: "미국 기술(XLK)",
    group: "미국 섹터/테마",
    currency: "USD",
    krEtfOption: "KODEX 미국S&P500테크놀로지 (매매차익 배당소득 합산과세)",
    usEtfOption: "XLK / VGT (Technology Select Sector SPDR)",
    bestMethod: "미국 상장 ETF 직투 (XLK / VGT)",
    whyBest: "빅테크 집중 투자, 연 배당률 0.7%로 금융소득종합과세 부담이 없으며 양도소득세 22% 분리과세 적용",
    taxType: "US_DIRECT_22",
    capGainTaxRate: 0.22,
    divYieldPct: 0.7,
    feeRatePct: 0.05,
    compTaxRisk: "매우 안전 (초저배당 0.7% + 양도소득 분리과세)",
  },
  XLV: {
    id: "XLV",
    name: "미국 S&P 헬스케어 섹터 (XLV)",
    shortName: "미국 헬스케어(XLV)",
    group: "미국 섹터/테마",
    currency: "USD",
    krEtfOption: "KODEX 미국S&P500헬스케어 (매매차익 배당소득 합산과세)",
    usEtfOption: "XLV / VHT (Health Care Select Sector SPDR)",
    bestMethod: "미국 상장 ETF 직투 (XLV)",
    whyBest: "하락장 방어력이 뛰어난 헬스케어 섹터로, 미국 직투 시 매매차익 분리과세(22%) 및 연 배당 ~1.5% 수준으로 세무 관리 용이",
    taxType: "US_DIRECT_22",
    capGainTaxRate: 0.22,
    divYieldPct: 1.5,
    feeRatePct: 0.05,
    compTaxRisk: "안전 (연 배당 ~1.5%, 8억 투자 시 연 1,200만 원 수준)",
  },
  XLI: {
    id: "XLI",
    name: "미국 S&P 산업재 섹터 (XLI)",
    shortName: "미국 산업재(XLI)",
    group: "미국 섹터/테마",
    currency: "USD",
    krEtfOption: "KODEX 미국S&P500산업재 (매매차익 배당소득 합산과세)",
    usEtfOption: "XLI (Industrial Select Sector SPDR)",
    bestMethod: "미국 상장 ETF 직투 (XLI)",
    whyBest: "인프라·방산·제조업 핵심 섹터, 미국 직투를 통해 매매차익 금융소득 합산 원천 배제",
    taxType: "US_DIRECT_22",
    capGainTaxRate: 0.22,
    divYieldPct: 1.5,
    feeRatePct: 0.05,
    compTaxRisk: "안전 (연 배당 ~1.5%, 분리과세 양도세 22%)",
  },
  XLP: {
    id: "XLP",
    name: "미국 S&P 필수소비재 섹터 (XLP)",
    shortName: "미국 필수소비재(XLP)",
    group: "미국 섹터/테마",
    currency: "USD",
    krEtfOption: "KODEX 미국S&P500필수소비재 (매매차익 배당소득 합산과세)",
    usEtfOption: "XLP / VDC (Consumer Staples Select Sector SPDR)",
    bestMethod: "미국 상장 ETF 직투 (XLP)",
    whyBest: "불황 방어력이 강하나 배당수익률(~2.4%)이 다소 높으므로 8억 단독 보유 시 자산 성장에 따라 배당 2,000만 원 근접 주의 (포트폴리오 내 40% 이하 편입 권장)",
    taxType: "US_DIRECT_22",
    capGainTaxRate: 0.22,
    divYieldPct: 2.4,
    feeRatePct: 0.05,
    compTaxRisk: "주의 (8억 단독 투자 시 연 배당 ~1,920만 원으로 한도 임박, 분산 편입 필수)",
  },
  XLU: {
    id: "XLU",
    name: "미국 S&P 유틸리티 섹터 (XLU)",
    shortName: "미국 유틸리티(XLU)",
    group: "미국 섹터/테마",
    currency: "USD",
    krEtfOption: "미국 유틸리티 국내 ETF (매매차익 배당소득 합산과세)",
    usEtfOption: "XLU / VPU (Utilities Select Sector SPDR)",
    bestMethod: "미국 상장 ETF 직투 (XLU, 비중 30% 이내 제한 또는 배당락 스왑)",
    whyBest: "AI 전력 인프라 수혜 및 방어주이나 배당률(~2.9%)이 높아 8억 단독 보유 시 연 배당 2,320만 원으로 종합과세 초과 → 비중 캡(30% 이하) 또는 배당락 전 매도로 양도차익 전환 필요",
    taxType: "US_DIRECT_22",
    capGainTaxRate: 0.22,
    divYieldPct: 2.9,
    feeRatePct: 0.05,
    compTaxRisk: "경고 (8억 단독 보유 시 연 배당 ~2,320만 원 > 2,000만 원! 포트폴리오 내 30% 이하 편입 필수)",
  },
  XLE: {
    id: "XLE",
    name: "미국 S&P 에너지 섹터 (XLE)",
    shortName: "미국 에너지(XLE)",
    group: "미국 섹터/테마",
    currency: "USD",
    krEtfOption: "KODEX 미국S&P500에너지 (매매차익 배당소득 합산과세)",
    usEtfOption: "XLE / VDE (Energy Select Sector SPDR - Non-PTP)",
    bestMethod: "미국 상장 ETF 직투 (XLE, 원유 선물 ETF의 최우수 대체재)",
    whyBest: "원유 선물 ETF(USO 등)의 롤오버 비용과 PTP 10% 매도원천징수 문제를 완벽히 회피하면서 인플레이션·유가 급등기 알파 창출! 단 배당률(~3.0%) 관리 위해 비중 30% 이내 편입",
    taxType: "US_DIRECT_22",
    capGainTaxRate: 0.22,
    divYieldPct: 3.0,
    feeRatePct: 0.05,
    compTaxRisk: "경고 (8억 단독 보유 시 연 배당 ~2,400만 원 초과 위험, 포트폴리오 내 20~30% 편입 시 안전)",
  },
  XLF: {
    id: "XLF",
    name: "미국 S&P 금융 섹터 (XLF)",
    shortName: "미국 금융(XLF)",
    group: "미국 섹터/테마",
    currency: "USD",
    krEtfOption: "KODEX 미국S&P500금융 (매매차익 배당소득 합산과세)",
    usEtfOption: "XLF / VFH (Financial Select Sector SPDR)",
    bestMethod: "미국 상장 ETF 직투 (XLF)",
    whyBest: "금리 상승기 수혜 섹터, 미국 직투 시 22% 분리과세 및 연 배당 ~1.7%로 8억 원 기준 연 배당 ~1,360만 원(종합과세 한도 이내)",
    taxType: "US_DIRECT_22",
    capGainTaxRate: 0.22,
    divYieldPct: 1.7,
    feeRatePct: 0.05,
    compTaxRisk: "안전 (연 배당 ~1.7%, 8억 기준 1,360만 원 < 2,000만 원)",
  },
  KRX_GOLD: {
    id: "KRX_GOLD",
    name: "KRX 금현물 (한국거래소 금시장)",
    shortName: "KRX 금현물",
    group: "대체/실물자산",
    currency: "KRW",
    krEtfOption: "KRX 금시장 현물 직접매매 (비과세) vs KODEX 골드선물(15.4% 배당소득 과세)",
    usEtfOption: "GLD / IAU (미국 직투 시 22% 양도소득세 부과)",
    bestMethod: "한국거래소 KRX 금현물 계좌 직접투자",
    whyBest: "대한민국 최고의 합법적 조세회피처! 매매차익 100% 비과세(0%), 배당소득 0원, 금융소득종합과세 완전 제외, 선물 롤오버 비용 0원! (미국 GLD 22% 세금이나 국내 금ETF 15.4%+종합과세 대비 압도적 우위)",
    taxType: "KR_SPOT_TAX_FREE",
    capGainTaxRate: 0.0,
    divYieldPct: 0.0,
    feeRatePct: 0.2,
    compTaxRisk: "완전 면제 (세금 0%, 금융소득 합산 0원 — 8억 이상 거액 자산가의 필수 코어 자산)",
  },
  GOLD: {
    id: "GOLD",
    name: "국제 금 (미국 GLDM/IAU 직투 기준 비교)",
    shortName: "국제 금(GLD직투)",
    group: "대체/실물자산",
    currency: "USD",
    krEtfOption: "ACE KRX금현물 ETF / KODEX 골드선물(H) (15.4% 배당소득 + 종합과세 합산)",
    usEtfOption: "GLDM / IAU / GLD (미국 상장 금 현물 ETF, 양도소득세 22% 분리과세)",
    bestMethod: "원화 계좌는 KRX 금현물(비과세) 1순위 / 달러 계좌 내 스위칭 시 미국 GLDM 직투",
    whyBest: "달러 예수금으로 즉각 스위칭할 때는 미국 GLDM(양도세 22% 분리과세, 배당 0%)이 국내 금ETF(종합과세 노출)보다 유리하나, 원화 기준 장기 보유는 KRX 금현물(비과세 0%)이 세후 수익률을 연 +0.8%p 이상 앞섬",
    taxType: "US_DIRECT_22",
    capGainTaxRate: 0.22,
    divYieldPct: 0.0,
    feeRatePct: 0.05,
    compTaxRisk: "완전 면제 (배당 0% + 매매차익 분리과세, 단 KRX 금현물이 세금 0%로 더 우수)",
  },
  WTI: {
    id: "WTI",
    name: "WTI 원유 (Crude Oil)",
    shortName: "WTI 원유",
    group: "대체/실물자산",
    currency: "USD",
    krEtfOption: "KODEX WTI원유선물(H) (매매차익 15.4% 배당소득세 + 금융소득종합과세 합산!)",
    usEtfOption: "USO/DBO (PTP 매도대금 10% 원천징수 폭탄!) vs Non-PTP 원유ETF(OILK) / 에너지주(XLE)",
    bestMethod: "미국 상장 Non-PTP 원유 선물 ETF(OILK) 또는 에너지 섹터 ETF(XLE) 직투",
    whyBest: "[핵심 비교] ① 국내 상장 원유 ETF는 8억 투자 시 +2.5%만 수익 나도 금융소득종합과세(최고 49.5%) 직행! ② 미국 상장 USO/DBO는 PTP 규제로 매도 시 원금의 10%가 강제 원천징수됨! ③ 따라서 반드시 PTP 면제 미국 ETF(OILK) 또는 에너지 기업 ETF(XLE)로 투자해 22% 분리과세를 적용해야 함",
    taxType: "US_DIRECT_22",
    capGainTaxRate: 0.22,
    divYieldPct: 0.0,
    feeRatePct: 0.08,
    compTaxRisk: "완전 면제 (Non-PTP 직투 시 배당 0% + 양도소득 분리과세, 국내 원유 ETF는 종합과세 위험으로 부적합)",
  },
  VNQ: {
    id: "VNQ",
    name: "미국 부동산 리츠 (VNQ)",
    shortName: "미국 리츠(VNQ)",
    group: "대체/실물자산",
    currency: "USD",
    krEtfOption: "TIGER 미국MSCI리츠 (배당+매매차익 모두 종합과세 합산)",
    usEtfOption: "VNQ / XLRE (Vanguard Real Estate ETF)",
    bestMethod: "미국 상장 ETF 직투 (VNQ/XLRE, 포트폴리오 내 20% 이하 편입 또는 배당락 스왑)",
    whyBest: "매매차익은 미국 직투로 22% 분리과세 처리하되, 리츠 특성상 연 배당률이 ~3.8%로 높아 8억 단독 투자 시 연 배당 3,040만 원으로 금융소득종합과세 대상이 됨! 반드시 포트폴리오 비중 20% 이하로 제한하거나 배당락일 직전 매도 전략을 써야 함",
    taxType: "US_DIRECT_22",
    capGainTaxRate: 0.22,
    divYieldPct: 3.8,
    feeRatePct: 0.05,
    compTaxRisk: "고위험 (8억 단독 바이앤홀드 시 연 배당 ~3,040만 원으로 종합과세 직행! 비중 20% 이하 제한 필수)",
  },
  UST20Y_TR: {
    id: "UST20Y_TR",
    name: "미국 장기국채 20년+ 총수익 (TLT)",
    shortName: "미국 장기채(TLT)",
    group: "미국 국채/채권",
    currency: "USD",
    krEtfOption: "ACE / TIGER 미국30년국채액티브 (매매차익+분배금 모두 종합과세 합산)",
    usEtfOption: "TLT (월배당 ~3.5%) vs 배당락 전 매도(양도차익 전환)",
    bestMethod: "미국 직투 TLT (비중 30% 이내 편입 또는 배당락일 전 매도·재매수로 양도차익 전환)",
    whyBest: "주식 폭락장 최고의 방패이나, 8억 전액을 TLT로 보유하면 연 이자배당이 ~2,800만 원 발생해 금융소득종합과세에 걸림. 포트폴리오 내 25~30% 비중(2~2.4억 원, 연 배당 700~840만 원)으로 편입하거나 전술적 스위칭 시 매매차익(22% 분리과세)으로 전환되어 종합과세 완벽 회피!",
    taxType: "US_DIRECT_22",
    capGainTaxRate: 0.22,
    divYieldPct: 3.5,
    feeRatePct: 0.05,
    compTaxRisk: "단독보유 시 위험 / 자산배분(30% 이하) 또는 스위칭 전략 시 안전 (매매차익은 22% 분리과세)",
  },
  UST10Y_TR: {
    id: "UST10Y_TR",
    name: "미국 중기국채 10년물 총수익 (IEF)",
    shortName: "미국 10년채(IEF)",
    group: "미국 국채/채권",
    currency: "USD",
    krEtfOption: "KODEX 미국10년국채선물 (매매차익 배당소득 합산과세)",
    usEtfOption: "IEF (iShares 7-10 Year Treasury Bond ETF)",
    bestMethod: "미국 직투 IEF (비중 35% 이내 편입 또는 추세 스위칭)",
    whyBest: "안정적인 중기 국채이나 연 분배금(~3.2%)이 금융소득에 합산되므로 8억 단독 보유 대신 다중자산 포트폴리오의 안전판(20~35% 비중)으로 편입할 때 종합과세 한도(2,000만 원) 내에서 작동",
    taxType: "US_DIRECT_22",
    capGainTaxRate: 0.22,
    divYieldPct: 3.2,
    feeRatePct: 0.05,
    compTaxRisk: "단독보유 시 위험 (연 배당 ~2,560만 원) / 포트폴리오 35% 이하 편입 시 안전",
  },
  UST2Y_TR: {
    id: "UST2Y_TR",
    name: "미국 단기국채 2년물 / 초단기채 (BOXX / SHY)",
    shortName: "미국 단기채(BOXX)",
    group: "미국 국채/채권",
    currency: "USD",
    krEtfOption: "TIGER 미국달러단기채권액티브 (배당소득 합산과세)",
    usEtfOption: "BOXX (Alpha Architect 1-3M Box ETF, 무배당 양도차익형!) vs SHY/SGOV (월배당형)",
    bestMethod: "미국 상장 BOXX ETF 직투 (무배당 자본이득 전환형 단기채 ETF)",
    whyBest: "[8억 자산가 핵심 노하우] 일반 단기채(SHY/SGOV)나 달러RP는 연 4% 이자가 전부 배당·이자소득으로 잡혀 8억 보유 시 연 3,200만 원으로 즉시 금융소득종합과세 대상이 됨! 반면 미국 BOXX ETF는 단기국채 수익을 배당(0%) 없이 주가 상승(양도차익)으로 누적시켜 매도 시에만 22% 분리과세되므로 8억 전액을 넣어두어도 금융소득 합산액이 0원!",
    taxType: "US_DIRECT_22",
    capGainTaxRate: 0.22,
    divYieldPct: 0.0,
    feeRatePct: 0.04,
    compTaxRisk: "완전 면제 (BOXX ETF 활용 시 배당소득 0원, 단기금리 수익 전액 양도소득 22% 분리과세)",
  },
  USDKRW: {
    id: "USDKRW",
    name: "원/달러 환율 (달러 현금 보유)",
    shortName: "달러 현금(USD)",
    group: "외환/현금성자산",
    currency: "KRW",
    krEtfOption: "KODEX 미국달러선물 ETF (매매차익 15.4% 배당소득 합산과세)",
    usEtfOption: "증권사 외화계좌 달러(USD) 현물 환전 보유 (95% 환전우대)",
    bestMethod: "외화계좌 달러(USD) 현물 직접 환전 보유 (또는 BOXX 연계)",
    whyBest: "개인의 외화 현물 환차익은 대한민국 세법상 100% 비과세(0%)이며 금융소득종합과세에도 전혀 포함되지 않음! 반면 국내 달러선물 ETF는 환차익에 15.4% 세금과 종합과세가 부과되므로 현물 환전이 절대 유리",
    taxType: "KR_SPOT_TAX_FREE",
    capGainTaxRate: 0.0,
    divYieldPct: 0.0,
    feeRatePct: 0.05,
    compTaxRisk: "완전 면제 (외화 환차익 비과세 0%, 금융소득 합산 0원)",
  },
  BTC_KRW: {
    id: "BTC_KRW",
    name: "비트코인 원화 (BTC/KRW, 2010.07~)",
    shortName: "비트코인(BTC)",
    group: "가상자산",
    currency: "KRW",
    krEtfOption: "업비트 / 빗썸 국내 거래소 원화 비트코인 현물",
    usEtfOption: "IBIT / FBTC (미국 현물 ETF는 국내 증권사 중개 불가)",
    bestMethod: "국내 가상자산 거래소(업비트/빗썸) 현물 직접 매매",
    whyBest: "현행 세법상 가상자산 매매차익은 과세 유예(비과세 0%) 상태이며, 향후 과세 시행 시에도 기타소득 분리과세(250만 원 공제 후 22%)로 분류되어 금융소득종합과세(이자·배당 2,000만 원)에는 영구적으로 합산되지 않음!",
    taxType: "KR_SPOT_TAX_FREE",
    capGainTaxRate: 0.0,
    divYieldPct: 0.0,
    feeRatePct: 0.05,
    compTaxRisk: "완전 면제 (금융소득종합과세 비합산, 소액 1~5% 편입 시 포트폴리오 수익률 부스터)",
  },
};

const ALL_TRADABLE_TICKERS = new Set(Object.keys(KOREA_ASSET_TAX_SPECS));

function getIsoWeekKey(dateStr) {
  const d = new Date(dateStr + "T00:00:00Z");
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

/**
 * Korean Tax-Aware Multi-Asset Backtest Engine
 * - Simulates T-1 Close Signal -> T Close Execution
 * - Tracks Moving Average Cost Basis per asset in KRW
 * - Deducts Annual Capital Gains Tax (22% after 2.5M KRW deduction, with same-year loss offsetting) for US_DIRECT_22 assets
 * - Tracks Annual Dividend & Cash Interest Income against the 20,000,000 KRW (2,000만 원) 금융소득종합과세 threshold
 * - Supports Tax-Engineered Ex-Dividend / BOXX Cash Shield (capping taxable dividend+interest <= 19,000,000 KRW by converting excess dividend exposure into capital gains via ex-date swap / BOXX)
 * - Also calculates what would happen under the "Domestic ETF Trap" (국내상장 해외ETF 일반계좌: 15.4% up to 20M, 38.5% comprehensive tax + health insurance surcharge above 20M)
 */
function runTaxAwareBacktest(config) {
  const dates = marketData.dates;
  const totalDays = dates.length;
  const usdkrwClose = marketData.series["USDKRW"];
  const us3mSeries = marketData.series["US3M"];

  const catalogMap = {};
  (marketData.catalog || []).forEach((item) => {
    catalogMap[item.id] = item;
  });

  function getCloseFx(gIdx) {
    return Number(usdkrwClose[gIdx] || 1300.0);
  }

  function getClosePriceKrw(ticker, gIdx) {
    const spec = KOREA_ASSET_TAX_SPECS[ticker];
    const cur = spec ? spec.currency : catalogMap[ticker]?.currency || "USD";
    let rawPx = Number(marketData.series[ticker]?.[gIdx] || 0);
    // On 2020-04-20, front-month physical WTI printed -36.98 while unleveraged WTI ETFs (USO/DBO/OILK) rolled into June contracts (~$11.50)
    if (ticker === "WTI" && rawPx < 10.01 && dates[gIdx] >= "1990-01-01") {
      rawPx = 11.5;
    }
    if (cur === "KRW") return rawPx;
    return rawPx * getCloseFx(gIdx);
  }

  const reqStart = config.startDate || START_DATE_POST_IMF;
  const reqEnd = config.endDate || END_DATE;

  let startIdx = 0;
  while (startIdx < totalDays - 1 && dates[startIdx] < reqStart) startIdx++;
  let endIdx = totalDays - 1;
  while (endIdx > startIdx && dates[endIdx] > reqEnd) endIdx--;

  const initialCapital = Number(config.initialCapital || INITIAL_CAPITAL_KRW);
  const feeRate = Number(config.feeRatePct ?? 0.05) / 100.0;
  const maxWeeklyTrades = Number(config.maxWeeklyTrades ?? 3);
  // taxShieldMode:
  // - "ENGINEERED": Uses US Direct ETF + BOXX zero-dividend cash + Ex-div swap when annual dividend approaches 19M KRW so financial income never breaches 20M KRW
  // - "RAW_PASSIVE": Does not swap ex-div; if annual dividend > 20M KRW, pays 38.5% comprehensive tax on excess
  // - "DOMESTIC_ETF_TRAP": Simulates buying domestic-listed overseas ETFs in a general account where all gains + dividends > 20M KRW get hit by 38.5% comprehensive tax + health insurance
  const taxMode = config.taxMode || "ENGINEERED";

  const rawAlloc = Array.isArray(config.allocations) ? config.allocations : [];
  const activeAlloc = rawAlloc
    .filter((a) => a && a.ticker && ALL_TRADABLE_TICKERS.has(a.ticker) && Number(a.weightPct) >= 0)
    .map((a) => ({ ticker: a.ticker, weight: Number(a.weightPct) / 100.0 }));

  const targetWeights = {};
  let totalTargetWeight = 0;
  activeAlloc.forEach((a) => {
    targetWeights[a.ticker] = a.weight;
    totalTargetWeight += a.weight;
  });

  const rules =
    config.rulesEnabled !== false && Array.isArray(config.rules)
      ? config.rules.filter((r) => r && r.enabled && r.action && ALL_TRADABLE_TICKERS.has(r.action.targetTicker))
      : [];

  // Track shares and total cost basis (KRW) per ticker
  const shares = {};
  const costBasisKrw = {};
  for (const t of ALL_TRADABLE_TICKERS) {
    shares[t] = 0;
    costBasisKrw[t] = 0;
  }

  let cash = initialCapital;
  let cashCostBasis = initialCapital; // For BOXX capital-gain cash tracking
  let totalFeesPaid = 0;
  let totalCapGainTaxPaid = 0;
  let totalDividendTaxPaid = 0;
  let totalCompTaxPenaltyPaid = 0;
  let compTaxBreachYears = 0;
  let maxAnnualFinIncomeKrw = 0;
  let firstCompTaxBreachYear = null;
  let firstCompTaxBreachEquity = null;

  // Initial allocation at startIdx
  for (const a of activeAlloc) {
    const t = a.ticker;
    const w = a.weight;
    if (w > 0) {
      const allocKrw = initialCapital * w;
      const tFeeRate = (KOREA_ASSET_TAX_SPECS[t]?.feeRatePct ?? 0.05) / 100.0;
      const fee = allocKrw * tFeeRate;
      const netInvest = allocKrw - fee;
      const pxKrw = getClosePriceKrw(t, startIdx);
      if (pxKrw > 0) {
        shares[t] = netInvest / pxKrw;
        costBasisKrw[t] = allocKrw;
        cash -= allocKrw;
        cashCostBasis -= allocKrw;
        totalFeesPaid += fee;
      }
    }
  }
  if (cash < 0 && cash > -1e-4) {
    cash = 0;
    cashCostBasis = 0;
  }

  function getValuationAtClose(gIdx) {
    let assetVal = 0;
    const vals = {};
    for (const t of ALL_TRADABLE_TICKERS) {
      if (shares[t] > 0) {
        const v = shares[t] * getClosePriceKrw(t, gIdx);
        vals[t] = v;
        assetVal += v;
      } else {
        vals[t] = 0;
      }
    }
    return { total: cash + assetVal, assetVal, vals };
  }

  // Helper to sell shares of ticker `t` and record realized capital gain
  let currentYearRealizedOverseasGain = 0;
  let currentYearRealizedDomesticTrapGain = 0;
  let currentYearDividendIncome = 0;
  let currentYearCashInterestIncome = 0;

  function sellAssetKrw(t, sellDollarKrw, gIdx) {
    const pxKrw = getClosePriceKrw(t, gIdx);
    if (pxKrw <= 0 || shares[t] <= 0) return 0;
    const curVal = shares[t] * pxKrw;
    const actualSellVal = Math.min(curVal, sellDollarKrw);
    if (actualSellVal <= 100) return 0;

    const fraction = actualSellVal / curVal;
    const soldShares = shares[t] * fraction;
    const soldCost = costBasisKrw[t] * fraction;
    const tFeeRate = (KOREA_ASSET_TAX_SPECS[t]?.feeRatePct ?? 0.05) / 100.0;
    const fee = actualSellVal * tFeeRate;
    const netProceeds = actualSellVal - fee;
    const realizedGain = netProceeds - soldCost;

    shares[t] = Math.max(0, shares[t] - soldShares);
    costBasisKrw[t] = Math.max(0, costBasisKrw[t] - soldCost);
    cash += netProceeds;
    cashCostBasis += netProceeds;
    totalFeesPaid += fee;

    const spec = KOREA_ASSET_TAX_SPECS[t];
    if (taxMode === "DOMESTIC_ETF_TRAP" && spec && spec.taxType === "US_DIRECT_22") {
      // In domestic ETF trap, every profitable trade is taxed as dividend income (no loss offset!)
      if (realizedGain > 0) {
        currentYearRealizedDomesticTrapGain += realizedGain;
      }
    } else if (spec && spec.taxType === "US_DIRECT_22") {
      // US direct ETF: gains and losses offset within the same calendar year!
      currentYearRealizedOverseasGain += realizedGain;
    } else if (config.forceCryptoTax22 && t === "BTC_KRW") {
      currentYearRealizedOverseasGain += realizedGain;
    }

    return netProceeds;
  }

  function buyAssetKrw(t, spendKrw, gIdx) {
    const actualSpend = Math.min(cash, spendKrw);
    if (actualSpend <= 100) return 0;
    const pxKrw = getClosePriceKrw(t, gIdx);
    if (pxKrw <= 0) return 0;

    // When spending cash that appreciated via BOXX, realize any BOXX gain proportionally
    if (cash > 0 && cash > cashCostBasis) {
      const cashFraction = actualSpend / cash;
      const boxxGain = (cash - cashCostBasis) * cashFraction;
      if (taxMode === "ENGINEERED") {
        currentYearRealizedOverseasGain += boxxGain;
      }
      cashCostBasis -= cashCostBasis * cashFraction;
    } else {
      cashCostBasis = Math.max(0, cashCostBasis - actualSpend);
    }

    const tFeeRate = (KOREA_ASSET_TAX_SPECS[t]?.feeRatePct ?? 0.05) / 100.0;
    const fee = actualSpend * tFeeRate;
    const netBuy = actualSpend - fee;
    const boughtShares = netBuy / pxKrw;

    shares[t] += boughtShares;
    costBasisKrw[t] += actualSpend;
    cash -= actualSpend;
    totalFeesPaid += fee;
    return actualSpend;
  }

  function deductTaxFromPortfolio(taxAmount, gIdx) {
    if (taxAmount <= 0) return;
    if (cash >= taxAmount) {
      const ratio = (cash - taxAmount) / cash;
      cash -= taxAmount;
      cashCostBasis *= ratio;
      return;
    }
    const neededFromAssets = taxAmount - cash;
    cash = 0;
    cashCostBasis = 0;
    const val = getValuationAtClose(gIdx);
    if (val.assetVal <= 0) return;
    // Sell proportionally across held assets to pay tax
    for (const t of ALL_TRADABLE_TICKERS) {
      if (val.vals[t] > 0) {
        const shareOfTax = neededFromAssets * (val.vals[t] / val.assetVal);
        const pxKrw = getClosePriceKrw(t, gIdx);
        const shToSell = Math.min(shares[t], shareOfTax / pxKrw);
        const frac = shToSell / shares[t];
        shares[t] -= shToSell;
        costBasisKrw[t] *= 1 - frac;
      }
    }
  }

  const numDays = endIdx - startIdx + 1;
  const simDates = new Array(numDays);
  const preTaxEquity = new Float64Array(numDays);
  const afterTaxEquity = new Float64Array(numDays);
  const drawdownSeries = new Float64Array(numDays);
  const dailyReturns = new Float64Array(numDays);

  // Also run a parallel pre-tax shadow portfolio or track cumulative taxes to compare pre-tax vs after-tax cleanly
  let cumulativeTaxDragKrw = 0;

  const isoWeekTradeCounts = new Map();
  const executedTradeIndices = [];
  const ruleLastFiredIdx = new Map();
  let lastRebalanceIdx = startIdx;
  let lastRuleTradeIdx = -9999;
  let ruleTradeCount = 0;
  let rebalanceCount = 0;

  function canExecuteTradeOnDay(gIdx) {
    const wk = getIsoWeekKey(dates[gIdx]);
    if ((isoWeekTradeCounts.get(wk) || 0) >= maxWeeklyTrades) return false;
    let rolling5 = 0;
    for (let i = executedTradeIndices.length - 1; i >= 0; i--) {
      if (gIdx - executedTradeIndices[i] < 5) rolling5++;
      else break;
    }
    return rolling5 < maxWeeklyTrades;
  }

  function recordTradeExecution(gIdx) {
    const wk = getIsoWeekKey(dates[gIdx]);
    isoWeekTradeCounts.set(wk, (isoWeekTradeCounts.get(wk) || 0) + 1);
    executedTradeIndices.push(gIdx);
  }

  const allocTickerSet = new Set(activeAlloc.filter((a) => a.weight > 0).map((a) => a.ticker));
  const rebCfg = config.rebalance || {};
  const periodMode = (rebCfg.periodMode || "NONE").toUpperCase();
  const customRebDays = Math.max(5, Math.floor(Number(rebCfg.customDays || 60)));
  const bandMode = (rebCfg.bandMode || "NONE").toUpperCase();
  const bandThreshold = Math.max(1.0, Number(rebCfg.bandThreshold || 5.0)) / 100.0;

  function shouldPeriodRebalance(gIdx) {
    if (config.rebalanceEnabled === false || gIdx <= startIdx || periodMode === "NONE" || totalTargetWeight <= 0)
      return false;
    if (rules.length > 0 && gIdx - lastRuleTradeIdx < 12) return false;
    const curDate = dates[gIdx];
    const prevDate = dates[gIdx - 1];
    const curY = curDate.slice(0, 4);
    const prevY = prevDate.slice(0, 4);
    const curM = parseInt(curDate.slice(5, 7), 10);
    const prevM = parseInt(prevDate.slice(5, 7), 10);

    if (periodMode === "MONTHLY") return curM !== prevM;
    if (periodMode === "QUARTERLY") return curM !== prevM && (curM === 1 || curM === 4 || curM === 7 || curM === 10);
    if (periodMode === "SEMIANNUAL") return curM !== prevM && (curM === 1 || curM === 7);
    if (periodMode === "YEARLY") return curY !== prevY;
    if (periodMode === "CUSTOM_DAYS") return gIdx - lastRebalanceIdx >= customRebDays;
    return false;
  }

  function shouldBandRebalance(sigIdx) {
    if (config.rebalanceEnabled === false || bandMode === "NONE" || totalTargetWeight <= 0) return false;
    if (rules.length > 0 && sigIdx - lastRuleTradeIdx < 10) return false;
    const valClose = getValuationAtClose(sigIdx);
    if (valClose.total <= 1000) return false;
    for (const t of allocTickerSet) {
      const targetW = targetWeights[t] || 0;
      const curW = (valClose.vals[t] || 0) / valClose.total;
      if (bandMode === "ABS_PP" && Math.abs(curW - targetW) >= bandThreshold) return true;
      if (bandMode === "REL_PCT" && targetW > 0 && Math.abs(curW - targetW) / targetW >= bandThreshold) return true;
    }
    return false;
  }

  function settleYearEndTaxes(gIdx, yearStr) {
    if (taxMode === "ZERO_TAX") {
      currentYearRealizedOverseasGain = 0;
      currentYearRealizedDomesticTrapGain = 0;
      currentYearDividendIncome = 0;
      currentYearCashInterestIncome = 0;
      return;
    }
    // 1. Check Financial Income (Dividend + Cash Interest + Domestic Trap Gains)
    let totalFinIncome = currentYearDividendIncome + currentYearCashInterestIncome + currentYearRealizedDomesticTrapGain;

    if (taxMode === "ENGINEERED" && totalFinIncome > 19000000) {
      // Tax-engineered ex-dividend swap: excess dividend above 19M KRW was converted into overseas capital gains
      // via selling before ex-dividend date and rebuying on ex-dividend date (0.1% roundtrip friction)
      const excessDiv = totalFinIncome - 19000000;
      totalFinIncome = 19000000;
      currentYearRealizedOverseasGain += excessDiv * 0.98; // 2% swap friction
      const swapFee = excessDiv * 0.02;
      deductTaxFromPortfolio(swapFee, gIdx);
      totalFeesPaid += swapFee;
    }

    if (totalFinIncome > maxAnnualFinIncomeKrw) {
      maxAnnualFinIncomeKrw = totalFinIncome;
    }

    // Standard 15.4% withholding tax on financial income up to 20,000,000 KRW
    const normalTaxableFin = Math.min(20000000, totalFinIncome);
    const divWithholdingTax = normalTaxableFin * 0.154;
    let compTaxPenalty = 0;

    if (totalFinIncome > 20000000) {
      compTaxBreachYears++;
      if (!firstCompTaxBreachYear) {
        firstCompTaxBreachYear = yearStr;
        firstCompTaxBreachEquity = Math.round(getValuationAtClose(gIdx).total);
      }
      // Excess over 20M KRW is hit with progressive comprehensive income tax + health insurance (~38.5% marginal rate)
      const excessFin = totalFinIncome - 20000000;
      compTaxPenalty = excessFin * 0.385;
    }

    // Note: Price/TR series in market_data reflect pre-tax return; we deduct the actual dividend tax & any comprehensive penalty
    const totalFinTaxToDeduct = divWithholdingTax + compTaxPenalty;
    if (totalFinTaxToDeduct > 0) {
      deductTaxFromPortfolio(totalFinTaxToDeduct, gIdx);
      totalDividendTaxPaid += divWithholdingTax;
      totalCompTaxPenaltyPaid += compTaxPenalty;
      cumulativeTaxDragKrw += totalFinTaxToDeduct;
    }

    // 2. Overseas Capital Gains Tax (22% on net realized gains > 2,500,000 KRW)
    if (currentYearRealizedOverseasGain > 2500000) {
      const taxableCapGain = currentYearRealizedOverseasGain - 2500000;
      const capGainTax = taxableCapGain * 0.22;
      deductTaxFromPortfolio(capGainTax, gIdx);
      totalCapGainTaxPaid += capGainTax;
      cumulativeTaxDragKrw += capGainTax;
    }

    // Reset annual counters
    currentYearRealizedOverseasGain = 0;
    currentYearRealizedDomesticTrapGain = 0;
    currentYearDividendIncome = 0;
    currentYearCashInterestIncome = 0;
  }

  let peakEq = initialCapital;
  let peakDate = dates[startIdx];
  let peakStep = 0;
  let maxDrawdownPct = 0;
  let maxDrawdownDate = dates[startIdx];
  let maxDrawdownPeakDate = dates[startIdx];
  let maxDrawdownPeakStep = 0;
  let maxDrawdownTroughStep = 0;

  for (let step = 0; step < numDays; step++) {
    const gIdx = startIdx + step;
    const curDate = dates[gIdx];
    simDates[step] = curDate;

    // Check year boundary to settle previous year's taxes
    if (step > 0) {
      const prevYear = dates[gIdx - 1].slice(0, 4);
      const curYear = curDate.slice(0, 4);
      if (curYear !== prevYear) {
        settleYearEndTaxes(gIdx - 1, prevYear);
      }
    }

    // 1. Accrue daily cash return & track dividend accrual
    if (step > 0) {
      if (cash > 0 && us3mSeries) {
        const annualRate = Math.max(0, us3mSeries[gIdx - 1]) / 100.0;
        const dailyInterest = cash * (annualRate / 252.0);
        cash += dailyInterest;
        if (taxMode === "ENGINEERED") {
          // Parked in BOXX (capital gain accrual, 0 dividend/interest income)
          // cashCostBasis remains unchanged, so appreciation is capital gain!
        } else {
          // Standard RP/deposit interest -> counts toward 20M financial income limit
          currentYearCashInterestIncome += dailyInterest;
          cashCostBasis += dailyInterest;
        }
      }

      // Accrue daily dividend exposure for held assets (for financial income tracking)
      const valPrev = getValuationAtClose(gIdx - 1);
      for (const t of ALL_TRADABLE_TICKERS) {
        if (valPrev.vals[t] > 0) {
          const divYield = (KOREA_ASSET_TAX_SPECS[t]?.divYieldPct || 0) / 100.0;
          if (divYield > 0) {
            currentYearDividendIncome += valPrev.vals[t] * (divYield / 252.0);
          }
        }
      }
    }

    // 2. Evaluate rules at Day (T-1) Close and execute at Day (T) Close
    if (rules.length > 0 && step > 0) {
      const sigIdx = gIdx - 1;
      const triggeredSells = [];
      const triggeredBuys = [];

      for (let rIdx = 0; rIdx < rules.length; rIdx++) {
        const rule = rules[rIdx];
        const cooldown = Math.max(2, Number(rule.cooldownDays ?? 5));
        const lastFired = ruleLastFiredIdx.get(rule.id);
        if (lastFired !== undefined && gIdx - lastFired < cooldown) continue;

        if (BaseEngine.evaluateRuleAt(marketData, rule, sigIdx)) {
          const actType = (rule.action?.type || "BUY").toUpperCase();
          if (actType === "SELL" || actType === "SELL_ALL") triggeredSells.push(rule);
          else triggeredBuys.push(rule);
        }
      }

      for (const rule of triggeredSells) {
        if (!canExecuteTradeOnDay(gIdx)) break;
        const act = rule.action || {};
        const t = act.targetTicker;
        const valClose = getValuationAtClose(gIdx);
        const holdingVal = valClose.vals[t] || 0;
        if (holdingVal <= 1000) continue;

        const sMode = (act.sizingMode || "BALANCE_PCT").toUpperCase();
        const sVal = Math.max(0, Number(act.sizingValue ?? 100));
        let sellDollar = 0;
        if (act.type === "SELL_ALL") sellDollar = holdingVal;
        else if (sMode === "TOTAL_PCT") sellDollar = Math.min(holdingVal, valClose.total * (sVal / 100.0));
        else sellDollar = holdingVal * Math.min(1.0, sVal / 100.0);

        if (sellDollar > 1000) {
          sellAssetKrw(t, sellDollar, gIdx);
          ruleLastFiredIdx.set(rule.id, gIdx);
          lastRuleTradeIdx = gIdx;
          ruleTradeCount++;
          recordTradeExecution(gIdx);
        }
      }

      for (const rule of triggeredBuys) {
        if (!canExecuteTradeOnDay(gIdx)) break;
        const act = rule.action || {};
        const t = act.targetTicker;
        const valClose = getValuationAtClose(gIdx);
        const sMode = (act.sizingMode || "BALANCE_PCT").toUpperCase();
        const sVal = Math.max(0, Number(act.sizingValue ?? 100));
        let buyDollar = 0;
        if (sMode === "TOTAL_PCT") buyDollar = Math.min(cash, valClose.total * (sVal / 100.0));
        else buyDollar = cash * Math.min(1.0, sVal / 100.0);

        if (buyDollar > 1000 && cash >= buyDollar) {
          buyAssetKrw(t, buyDollar, gIdx);
          ruleLastFiredIdx.set(rule.id, gIdx);
          lastRuleTradeIdx = gIdx;
          ruleTradeCount++;
          recordTradeExecution(gIdx);
        }
      }
    }

    // 3. Rebalancing
    if (config.rebalanceEnabled !== false && step > 0 && totalTargetWeight > 0) {
      const sigIdx = gIdx - 1;
      if (shouldPeriodRebalance(gIdx) || shouldBandRebalance(sigIdx)) {
        if (canExecuteTradeOnDay(gIdx)) {
          const valClose = getValuationAtClose(gIdx);
          const totalEq = valClose.total;
          const rebEq = totalEq * Math.min(1.0, totalTargetWeight);
          let traded = 0;

          for (const t of allocTickerSet) {
            const targetD = rebEq * (targetWeights[t] || 0);
            const curD = valClose.vals[t] || 0;
            const diff = curD - targetD;
            if (diff > 1000) {
              sellAssetKrw(t, diff, gIdx);
              traded += diff;
            }
          }
          for (const t of allocTickerSet) {
            const targetD = rebEq * (targetWeights[t] || 0);
            const curD = shares[t] * getClosePriceKrw(t, gIdx);
            const need = targetD - curD;
            if (need > 1000 && cash > 1000) {
              const spent = buyAssetKrw(t, need, gIdx);
              traded += spent;
            }
          }
          if (traded > 1000) {
            rebalanceCount++;
            lastRebalanceIdx = gIdx;
            recordTradeExecution(gIdx);
          }
        }
      }
    }

    // Final day: settle final year taxes + liquidate unrealized capital gains for fair after-tax comparison
    if (step === numDays - 1) {
      const finalValBeforeTax = getValuationAtClose(gIdx);
      for (const t of ALL_TRADABLE_TICKERS) {
        if (shares[t] > 0) {
          const curVal = finalValBeforeTax.vals[t];
          const unrealizedGain = curVal - costBasisKrw[t];
          const spec = KOREA_ASSET_TAX_SPECS[t];
          if (taxMode === "DOMESTIC_ETF_TRAP" && spec && spec.taxType === "US_DIRECT_22") {
            if (unrealizedGain > 0) currentYearRealizedDomesticTrapGain += unrealizedGain;
          } else if (spec && spec.taxType === "US_DIRECT_22") {
            currentYearRealizedOverseasGain += unrealizedGain;
          } else if (config.forceCryptoTax22 && t === "BTC_KRW") {
            currentYearRealizedOverseasGain += unrealizedGain;
          }
        }
      }
      if (cash > cashCostBasis && taxMode === "ENGINEERED") {
        currentYearRealizedOverseasGain += cash - cashCostBasis;
      }
      settleYearEndTaxes(gIdx, curDate.slice(0, 4));
    }

    const eodVal = getValuationAtClose(gIdx);
    afterTaxEquity[step] = eodVal.total;
    preTaxEquity[step] = eodVal.total + cumulativeTaxDragKrw;

    if (eodVal.total > peakEq) {
      peakEq = eodVal.total;
      peakDate = curDate;
      peakStep = step;
    }
    const dd = ((eodVal.total - peakEq) / peakEq) * 100.0;
    drawdownSeries[step] = dd;
    if (dd < maxDrawdownPct) {
      maxDrawdownPct = dd;
      maxDrawdownDate = curDate;
      maxDrawdownPeakDate = peakDate;
      maxDrawdownPeakStep = peakStep;
      maxDrawdownTroughStep = step;
    }

    if (step === 0) {
      dailyReturns[step] = (eodVal.total - initialCapital) / initialCapital;
    } else {
      dailyReturns[step] = (eodVal.total - afterTaxEquity[step - 1]) / afterTaxEquity[step - 1];
    }
  }

  const finalAfterTaxEquity = afterTaxEquity[numDays - 1];
  const years = numDays / 252.0;
  const afterTaxCagrPct = (Math.pow(Math.max(0.001, finalAfterTaxEquity / initialCapital), 1.0 / years) - 1.0) * 100.0;

  let meanRet = 0;
  for (let s = 0; s < numDays; s++) meanRet += dailyReturns[s];
  meanRet /= numDays;

  let varSum = 0;
  let downVarSum = 0;
  let sumSqDd = 0;
  for (let s = 0; s < numDays; s++) {
    const diff = dailyReturns[s] - meanRet;
    varSum += diff * diff;
    if (dailyReturns[s] < 0) downVarSum += dailyReturns[s] * dailyReturns[s];
    sumSqDd += drawdownSeries[s] * drawdownSeries[s];
  }
  const annualVolPct = Math.sqrt(varSum / Math.max(1, numDays - 1)) * Math.sqrt(252.0) * 100.0;
  const annualDownVolPct = Math.sqrt(downVarSum / Math.max(1, numDays)) * Math.sqrt(252.0) * 100.0;
  const ulcerIndex = Math.sqrt(sumSqDd / numDays);

  const sharpe = annualVolPct > 0 ? (afterTaxCagrPct - 2.0) / annualVolPct : 0;
  const sortino = annualDownVolPct > 0 ? (afterTaxCagrPct - 2.0) / annualDownVolPct : 0;
  const calmar = Math.abs(maxDrawdownPct) > 0.001 ? afterTaxCagrPct / Math.abs(maxDrawdownPct) : 0;

  // Compact curve for charts
  const sampleStep = Math.max(1, Math.floor(numDays / 600));
  const compactDates = [];
  const compactNormEquity = [];
  const compactDrawdown = [];
  for (let s = 0; s < numDays; s += sampleStep) {
    compactDates.push(simDates[s]);
    compactNormEquity.push(Math.round((afterTaxEquity[s] / initialCapital) * 100.0 * 100) / 100);
    compactDrawdown.push(Math.round(drawdownSeries[s] * 100) / 100);
  }
  if (compactDates[compactDates.length - 1] !== simDates[numDays - 1]) {
    compactDates.push(simDates[numDays - 1]);
    compactNormEquity.push(Math.round((afterTaxEquity[numDays - 1] / initialCapital) * 100.0 * 100) / 100);
    compactDrawdown.push(Math.round(drawdownSeries[numDays - 1] * 100) / 100);
  }

  return {
    startDate: simDates[0],
    endDate: simDates[numDays - 1],
    years: Math.round(years * 100) / 100,
    initialCapital,
    finalAfterTaxEquity: Math.round(finalAfterTaxEquity),
    afterTaxCagrPct: Math.round(afterTaxCagrPct * 100) / 100,
    maxDrawdownPct: Math.round(maxDrawdownPct * 100) / 100,
    maxDrawdownPeakDate,
    maxDrawdownDate,
    annualVolPct: Math.round(annualVolPct * 100) / 100,
    sharpe: Math.round(sharpe * 1000) / 1000,
    sortino: Math.round(sortino * 1000) / 1000,
    calmar: Math.round(calmar * 1000) / 1000,
    ulcerIndex: Math.round(ulcerIndex * 100) / 100,
    totalTrades: ruleTradeCount + rebalanceCount,
    totalFeesPaid: Math.round(totalFeesPaid),
    totalCapGainTaxPaid: Math.round(totalCapGainTaxPaid),
    totalDividendTaxPaid: Math.round(totalDividendTaxPaid),
    totalCompTaxPenaltyPaid: Math.round(totalCompTaxPenaltyPaid),
    totalTaxPaid: Math.round(totalCapGainTaxPaid + totalDividendTaxPaid + totalCompTaxPenaltyPaid),
    compTaxBreachYears,
    maxAnnualFinIncomeKrw: Math.round(maxAnnualFinIncomeKrw),
    firstCompTaxBreachYear,
    firstCompTaxBreachEquity,
    compactCurve: {
      dates: compactDates,
      normEquity: compactNormEquity,
      drawdown: compactDrawdown,
    },
  };
}

module.exports = {
  KOREA_ASSET_TAX_SPECS,
  runTaxAwareBacktest,
  INITIAL_CAPITAL_KRW,
  START_DATE_POST_IMF,
  START_DATE_MODERN_OOS,
  END_DATE,
};
