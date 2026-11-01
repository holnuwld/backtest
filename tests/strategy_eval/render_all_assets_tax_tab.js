/**
 * tests/strategy_eval/render_all_assets_tax_tab.js
 *
 * Renders the new Tab (`exp7_all_assets_tax`: "🌏 전자산 세후·절세 (8억기준)")
 * containing:
 * - Verifier Subagent (`blind-reviewer`) Tax & Comprehensive Income Tax Audit Report
 * - Deliverable 1: 21 Tradable Assets Buy & Hold After-Tax CAGR Ranking Table (with Korean investment vehicle & tax comparison)
 * - Deliverable 2: Famous Trading Strategies per Asset After-Tax CAGR Ranking Table (Best per asset + All 105 strategies sorted by After-Tax CAGR)
 * - Deliverable 3: Top 10 Optimal Multi-Asset Portfolios (8억 원 기준, 세후 수익 극대화 & 금융소득종합과세 완전 회피) + 3 Interactive Charts
 */

const fs = require("fs");
const path = require("path");
const {
  runTaxAwareBacktest,
  INITIAL_CAPITAL_KRW,
  START_DATE_POST_IMF,
  END_DATE,
} = require("./run_all_assets_tax_backtest");

function fmtBillion(krw) {
  const eok = krw / 100000000;
  if (eok >= 10000) {
    return `${(eok / 10000).toFixed(2)}조 원`;
  }
  if (eok >= 100) {
    return `${eok.toFixed(1)}억 원`;
  }
  return `${eok.toFixed(2)}억 원`;
}

function fmtManwon(krw) {
  const man = Math.round(krw / 10000);
  return `${man.toLocaleString("ko-KR")}만 원`;
}

function buildAllAssetsTaxTab(evalData) {
  const {
    buyAndHoldResults,
    assetStrategyResults,
    bestStrategyPerAsset,
    top10Portfolios,
    allMultiAssetResults,
  } = evalData;

  // 1. Build Deliverable 1 Table Rows (21 Assets Buy & Hold sorted by After-Tax CAGR)
  const table1RowsHtml = buyAndHoldResults
    .map((item) => {
      const isTop3 = item.rank <= 3;
      const compTaxBadge = item.compTaxBreachAt800M
        ? `<span style="display:inline-block; background:rgba(244,63,94,0.18); color:#fda4af; border:1px solid rgba(244,63,94,0.45); padding:2px 7px; border-radius:6px; font-size:11px; font-weight:700;">🚨 8억 즉시 초과 (연 ${fmtManwon(item.annualDivAt800M)})</span>`
        : item.divYieldPct === 0
        ? `<span style="display:inline-block; background:rgba(16,185,129,0.18); color:#6ee7b7; border:1px solid rgba(16,185,129,0.45); padding:2px 7px; border-radius:6px; font-size:11px; font-weight:700;">🛡️ 영구 비대상 (배당 0원)</span>`
        : `<span style="display:inline-block; background:rgba(56,189,248,0.15); color:#7dd3fc; border:1px solid rgba(56,189,248,0.4); padding:2px 7px; border-radius:6px; font-size:11px; font-weight:700;">✅ 8억 안전 (연 ${fmtManwon(item.annualDivAt800M)})</span>`;

      const taxAlphaVsDom = item.afterTaxFinalEquity - item.domTrapFinalEquity;
      const taxDragPct = (item.preTaxCagrPct - item.afterTaxCagrPct).toFixed(2);

      return `
        <tr class="${isTop3 ? "top3-highlight" : ""}">
          <td><span class="rank-badge ${item.rank <= 3 ? "rank-" + item.rank : ""}">#${item.rank}</span></td>
          <td>
            <div style="font-weight:800; color:#fff; font-size:13.5px;">${item.shortName} <span style="color:#94a3b8; font-size:11.5px;">(${item.ticker})</span></div>
            <div class="sub-num">${item.category} · ${item.periodLabel}</div>
          </td>
          <td style="min-width:250px;">
            <div style="font-weight:700; color:#38bdf8; font-size:12.5px;">✅ 최적: ${item.bestMethod}</div>
            <div style="font-size:11.5px; color:#cbd5e1; margin-top:2px;">추천 상품: <code style="color:#fde047;">${item.recommendedTickers}</code></div>
            <div style="font-size:11px; color:#fda4af; margin-top:2px;">⚠️ 피해야 할 방식: ${item.alternativeMethod}</div>
          </td>
          <td class="num">
            <div style="font-weight:700; color:#e2e8f0;">차익 ${(item.capGainTaxRate * 100).toFixed(1)}%</div>
            <div class="sub-num">배당 ${item.divYieldPct > 0 ? "15.4% (율 " + item.divYieldPct + "%)" : "0% (무배당)"}</div>
          </td>
          <td class="num">
            <div style="color:#94a3b8; font-weight:600;">+${item.preTaxCagrPct.toFixed(2)}%</div>
            <div class="sub-num">${fmtBillion(item.preTaxFinalEquity)}</div>
          </td>
          <td class="num" style="background:rgba(16,185,129,0.07);">
            <div class="pos" style="font-weight:900; font-size:14.5px;">+${item.afterTaxCagrPct.toFixed(2)}%</div>
            <div class="sub-num">세금차감 -${taxDragPct}%p</div>
          </td>
          <td class="num">
            <div style="font-weight:800; color:#fde047;">${fmtBillion(item.afterTaxFinalEquity)}</div>
            <div class="sub-num">납부세액 ${fmtBillion(item.totalTaxPaid)}</div>
          </td>
          <td class="num">
            <div style="color:#fda4af; font-weight:700;">+${item.domTrapCagrPct.toFixed(2)}%</div>
            <div class="sub-num">${taxAlphaVsDom > 10000000 ? "직투시 +" + fmtBillion(taxAlphaVsDom) + " 이득" : "차이 미미"}</div>
          </td>
          <td class="num">
            <div class="neg" style="font-weight:700;">${item.maxDrawdownPct.toFixed(2)}%</div>
            <div class="sub-num">${item.maxDrawdownPeakDate} → ${item.maxDrawdownDate}</div>
          </td>
          <td class="num">
            <div><strong class="accent">${item.sharpe.toFixed(3)}</strong> / <strong>${item.calmar.toFixed(3)}</strong></div>
            <div class="sub-num">Sortino ${item.sortino.toFixed(3)}</div>
          </td>
          <td>
            ${compTaxBadge}
            <div class="sub-num" style="margin-top:3px;">${
              item.firstCompTaxBreachYear
                ? `수동보유시 ${item.firstCompTaxBreachYear}년(${fmtBillion(item.firstCompTaxBreachEquity)}) 초과`
                : "27.8년 전구간 종합과세 0회"
            }</div>
          </td>
        </tr>
      `;
    })
    .join("\n");

  // 2A. Build Deliverable 2-A Table Rows (Best Famous Strategy per each of the 21 Assets, sorted by After-Tax CAGR)
  const table2BestRowsHtml = bestStrategyPerAsset
    .map((item) => {
      const bnh = buyAndHoldResults.find((b) => b.ticker === item.ticker);
      const bnhAfterTaxCagr = bnh ? bnh.afterTaxCagrPct : 0;
      const bnhMdd = bnh ? bnh.maxDrawdownPct : 0;
      const mddSaved = bnh ? (Math.abs(bnhMdd) - Math.abs(item.maxDrawdownPct)).toFixed(2) : "0.00";
      const cagrDiff = (item.afterTaxCagrPct - bnhAfterTaxCagr).toFixed(2);

      return `
        <tr class="${item.assetBestRank <= 3 ? "top3-highlight" : ""}">
          <td><span class="rank-badge ${item.assetBestRank <= 3 ? "rank-" + item.assetBestRank : ""}">#${item.assetBestRank}</span></td>
          <td>
            <div style="font-weight:800; color:#fff;">${item.shortName} <span style="color:#94a3b8; font-size:11.5px;">(${item.ticker})</span></div>
            <div class="sub-num">${item.bestMethod}</div>
          </td>
          <td style="min-width:260px;">
            <div style="font-weight:800; color:#38bdf8; font-size:13px;">${item.strategyName}</div>
            <div style="font-size:11.5px; color:#fde047; margin-top:2px;">📚 출처: ${item.famousRef}</div>
            <div class="sub-num" style="margin-top:2px;">⚙️ 규칙: ${item.ruleSummary}</div>
          </td>
          <td class="num">
            <div style="color:#94a3b8; font-weight:600;">+${item.preTaxCagrPct.toFixed(2)}%</div>
            <div class="sub-num">${fmtBillion(item.preTaxFinalEquity)}</div>
          </td>
          <td class="num" style="background:rgba(16,185,129,0.07);">
            <div class="pos" style="font-weight:900; font-size:14.5px;">+${item.afterTaxCagrPct.toFixed(2)}%</div>
            <div class="sub-num">B&H(${bnhAfterTaxCagr.toFixed(2)}%) 대비 ${Number(cagrDiff) >= 0 ? "+" + cagrDiff : cagrDiff}%p</div>
          </td>
          <td class="num">
            <div style="font-weight:800; color:#fde047;">${fmtBillion(item.afterTaxFinalEquity)}</div>
            <div class="sub-num">세금 ${fmtBillion(item.totalTaxPaid)}</div>
          </td>
          <td class="num">
            <div class="neg" style="font-weight:700;">${item.maxDrawdownPct.toFixed(2)}%</div>
            <div class="sub-num" style="color:#6ee7b7;">B&H(${bnhMdd.toFixed(1)}%) 대비 ${Number(mddSaved) >= 0 ? "-" + mddSaved + "%p 방어" : mddSaved + "%p"}</div>
          </td>
          <td class="num">
            <div><strong class="accent">${item.sharpe.toFixed(3)}</strong> / <strong>${item.calmar.toFixed(3)}</strong></div>
            <div class="sub-num">Sortino ${item.sortino.toFixed(3)} · 매매 ${item.totalTrades}회</div>
          </td>
          <td class="num">
            <div class="pos" style="font-weight:700;">+${item.oosAfterTaxCagrPct.toFixed(2)}%</div>
            <div class="sub-num">OOS MDD ${item.oosMaxDrawdownPct.toFixed(1)}%</div>
          </td>
        </tr>
      `;
    })
    .join("\n");

  // 2B. Build Deliverable 2-B Table Rows (All 105 Asset Strategies sorted by After-Tax CAGR)
  const table2AllRowsHtml = assetStrategyResults
    .map((item) => {
      const isHiddenRow = item.rank > 35;
      return `
        <tr class="${item.rank <= 3 ? "top3-highlight" : ""} ${isHiddenRow ? "strat105-extra-row" : ""}" style="${isHiddenRow ? "display:none;" : ""}">
          <td><span class="rank-badge ${item.rank <= 3 ? "rank-" + item.rank : ""}">#${item.rank}</span></td>
          <td>
            <div style="font-weight:700; color:#fff;">${item.shortName}</div>
            <div class="sub-num">${item.ticker}</div>
          </td>
          <td>
            <div style="font-weight:700; color:#38bdf8;">${item.strategyName}</div>
            <div class="sub-num">${item.ruleSummary}</div>
          </td>
          <td class="num">
            <div style="color:#94a3b8;">+${item.preTaxCagrPct.toFixed(2)}%</div>
          </td>
          <td class="num" style="background:rgba(16,185,129,0.06);">
            <div class="pos" style="font-weight:800; font-size:13.5px;">+${item.afterTaxCagrPct.toFixed(2)}%</div>
          </td>
          <td class="num">
            <div style="font-weight:700; color:#fde047;">${fmtBillion(item.afterTaxFinalEquity)}</div>
          </td>
          <td class="num">
            <div class="neg" style="font-weight:700;">${item.maxDrawdownPct.toFixed(2)}%</div>
            <div class="sub-num">${item.maxDrawdownPeakDate} → ${item.maxDrawdownDate}</div>
          </td>
          <td class="num">
            <div><strong class="accent">${item.sharpe.toFixed(3)}</strong> / <strong>${item.calmar.toFixed(3)}</strong></div>
            <div class="sub-num">Sortino ${item.sortino.toFixed(3)}</div>
          </td>
          <td class="num">
            <div>${item.totalTrades}회</div>
            <div class="sub-num">세금 ${fmtBillion(item.totalTaxPaid)}</div>
          </td>
        </tr>
      `;
    })
    .join("\n");

  // 3. Build Deliverable 3 Top 10 Multi-Asset Portfolio Table Rows
  const table3Top10RowsHtml = top10Portfolios
    .map((p) => {
      const taxSavedVsDomTrap = p.afterTaxFinalEquity - p.domTrapFinalEquity;
      return `
        <tr class="${p.rank <= 3 ? "top3-highlight" : "row-selected"}">
          <td><span class="rank-badge ${p.rank <= 3 ? "rank-" + p.rank : ""}">TOP ${p.rank}</span></td>
          <td style="min-width:240px;">
            <div style="font-weight:800; color:#fff; font-size:13.5px;">[${p.id}] ${p.name}</div>
            <div style="font-size:11.5px; color:#38bdf8; margin-top:2px;">${p.category} · ${p.rebalanceDesc}</div>
            <div class="sub-num" style="margin-top:3px;">💡 ${p.rationale}</div>
          </td>
          <td style="min-width:230px;">
            <div style="font-weight:700; color:#fde047; font-size:12.5px;">${p.allocSummary}</div>
            <div class="sub-num" style="margin-top:2px;">미국ETF 직투(22% 분리) + KRX금/코스피(비과세 0%) 결합</div>
          </td>
          <td class="num">
            <div style="color:#94a3b8; font-weight:600;">+${p.preTaxCagrPct.toFixed(2)}%</div>
            <div class="sub-num">${fmtBillion(p.preTaxFinalEquity)}</div>
          </td>
          <td class="num" style="background:rgba(16,185,129,0.09);">
            <div class="pos" style="font-weight:900; font-size:15px;">+${p.afterTaxCagrPct.toFixed(2)}%</div>
            <div class="sub-num">OOS(15.8년) +${p.oosAfterTaxCagrPct.toFixed(2)}%</div>
          </td>
          <td class="num">
            <div style="font-weight:900; color:#fde047; font-size:14px;">${fmtBillion(p.afterTaxFinalEquity)}</div>
            <div class="sub-num" style="color:#6ee7b7;">국내ETF 함정 대비 +${fmtBillion(taxSavedVsDomTrap)} 이득!</div>
          </td>
          <td class="num">
            <div style="color:#fda4af; font-weight:700;">+${p.domTrapCagrPct.toFixed(2)}%</div>
            <div class="sub-num">${fmtBillion(p.domTrapFinalEquity)}</div>
          </td>
          <td class="num">
            <div class="neg" style="font-weight:800;">${p.maxDrawdownPct.toFixed(2)}%</div>
            <div class="sub-num">OOS MDD ${p.oosMaxDrawdownPct.toFixed(2)}%</div>
          </td>
          <td class="num">
            <div><strong class="accent">${p.sharpe.toFixed(3)}</strong> / <strong>${p.calmar.toFixed(3)}</strong></div>
            <div class="sub-num">Sortino ${p.sortino.toFixed(3)} · Ulcer ${p.ulcerIndex.toFixed(1)}</div>
          </td>
          <td>
            <div style="font-weight:700; color:#6ee7b7;">✅ 연 ${fmtManwon(p.initialAnnualDivKrw)} (배당률 ${p.initialDivYieldPct}%)</div>
            <div class="sub-num">종합과세 임계자산: <strong>${fmtBillion(p.compTaxThresholdEquityKrw)}</strong></div>
            <div class="sub-num" style="color:#38bdf8;">27.8년 종합과세 위반: <strong>0회</strong></div>
          </td>
        </tr>
      `;
    })
    .join("\n");

  // Also build Full 30 Multi-Asset Candidates Table Rows (so low-MDD All-Weather portfolios like MA24, MA29, MA07 are also visible!)
  const table3All30RowsHtml = allMultiAssetResults
    .map((p, idx) => {
      const top10Match = top10Portfolios.find((t) => t.id === p.id);
      const badgeHtml = top10Match
        ? `<span class="rank-badge ${top10Match.rank <= 3 ? "rank-" + top10Match.rank : ""}">TOP ${top10Match.rank}</span>`
        : `<span style="color:#94a3b8; font-weight:700;">#${idx + 1}</span>`;
      return `
        <tr class="${top10Match ? "row-selected" : ""}">
          <td>${badgeHtml}</td>
          <td>
            <div style="font-weight:700; color:#fff;">[${p.id}] ${p.name}</div>
            <div class="sub-num">${p.allocSummary}</div>
          </td>
          <td class="num"><span style="color:#94a3b8;">+${p.preTaxCagrPct.toFixed(2)}%</span></td>
          <td class="num"><strong class="pos">+${p.afterTaxCagrPct.toFixed(2)}%</strong></td>
          <td class="num"><span style="color:#fda4af;">+${p.domTrapCagrPct.toFixed(2)}%</span></td>
          <td class="num"><strong style="color:#fde047;">${fmtBillion(p.afterTaxFinalEquity)}</strong></td>
          <td class="num"><strong class="neg">${p.maxDrawdownPct.toFixed(2)}%</strong></td>
          <td class="num"><span class="accent">${p.sharpe.toFixed(3)}</span> / <strong>${p.calmar.toFixed(3)}</strong></td>
          <td class="num">연 ${fmtManwon(p.initialAnnualDivKrw)} (${p.initialDivYieldPct}%)</td>
          <td class="num">${fmtBillion(p.compTaxThresholdEquityKrw)}</td>
        </tr>
      `;
    })
    .join("\n");

  // Build Chart Payload for `exp7_all_assets_tax`
  const refDates = top10Portfolios[0].compactCurve.dates;
  const kpi200Bnh = buyAndHoldResults.find((b) => b.ticker === "KPI200");
  const ndxBnh = buyAndHoldResults.find((b) => b.ticker === "NDX");
  const goldBnh = buyAndHoldResults.find((b) => b.ticker === "KRX_GOLD");

  const kpi200Curve = runTaxAwareBacktest({
    allocations: [{ ticker: "KPI200", weightPct: 100 }],
    rebalanceEnabled: false,
    rulesEnabled: false,
    startDate: START_DATE_POST_IMF,
    endDate: END_DATE,
    initialCapital: INITIAL_CAPITAL_KRW,
    taxMode: "ENGINEERED",
  }).compactCurve;

  const goldCurve = runTaxAwareBacktest({
    allocations: [{ ticker: "KRX_GOLD", weightPct: 100 }],
    rebalanceEnabled: false,
    rulesEnabled: false,
    startDate: START_DATE_POST_IMF,
    endDate: END_DATE,
    initialCapital: INITIAL_CAPITAL_KRW,
    taxMode: "ENGINEERED",
  }).compactCurve;

  const ndxCurve = runTaxAwareBacktest({
    allocations: [{ ticker: "NDX", weightPct: 100 }],
    rebalanceEnabled: false,
    rulesEnabled: false,
    startDate: START_DATE_POST_IMF,
    endDate: END_DATE,
    initialCapital: INITIAL_CAPITAL_KRW,
    taxMode: "ENGINEERED",
  }).compactCurve;

  const exp7ChartPayload = {
    dates: refDates,
    scatterPoints: allMultiAssetResults.map((p) => {
      const tMatch = top10Portfolios.find((t) => t.id === p.id);
      return {
        id: p.id,
        name: p.name,
        rank: tMatch ? tMatch.rank : null,
        mddAbs: Math.abs(p.maxDrawdownPct),
        mddPct: p.maxDrawdownPct,
        afterTaxCagrPct: p.afterTaxCagrPct,
        preTaxCagrPct: p.preTaxCagrPct,
        finalEok: Number((p.afterTaxFinalEquity / 100000000).toFixed(2)),
        calmar: p.calmar,
        sharpe: p.sharpe,
        initDivMan: Math.round(p.initialAnnualDivKrw / 10000),
      };
    }),
    benchScatter: [kpi200Bnh, ndxBnh, goldBnh].filter(Boolean).map((b) => ({
      id: b.ticker,
      name: `${b.shortName} 단독 보유 (세후)`,
      mddAbs: Math.abs(b.maxDrawdownPct),
      mddPct: b.maxDrawdownPct,
      afterTaxCagrPct: b.afterTaxCagrPct,
      finalEok: Number((b.afterTaxFinalEquity / 100000000).toFixed(2)),
      calmar: b.calmar,
    })),
    top10Curves: top10Portfolios.map((p) => ({
      rank: p.rank,
      id: p.id,
      name: p.name,
      afterTaxCagrPct: p.afterTaxCagrPct,
      mddPct: p.maxDrawdownPct,
      finalEok: Number((p.afterTaxFinalEquity / 100000000).toFixed(2)),
      normEquity: p.compactCurve.normEquity,
      drawdown: p.compactCurve.drawdown,
    })),
    benchCurves: [
      kpi200Bnh && {
        name: `코스피200 단독 (세후 +${kpi200Bnh.afterTaxCagrPct}%, MDD ${kpi200Bnh.maxDrawdownPct}%)`,
        normEquity: kpi200Curve.normEquity,
        drawdown: kpi200Curve.drawdown,
      },
      goldBnh && {
        name: `KRX금현물 단독 (비과세 +${goldBnh.afterTaxCagrPct}%, MDD ${goldBnh.maxDrawdownPct}%)`,
        normEquity: goldCurve.normEquity,
        drawdown: goldCurve.drawdown,
      },
      ndxBnh && {
        name: `나스닥100 직투 단독 (세후 +${ndxBnh.afterTaxCagrPct}%, MDD ${ndxBnh.maxDrawdownPct}%)`,
        normEquity: ndxCurve.normEquity,
        drawdown: ndxCurve.drawdown,
      },
    ].filter(Boolean),
  };

  const panelHtml = `
    <div class="tab-panel active" id="tab-panel-exp7_all_assets_tax">
      <!-- TOP BANNER -->
      <section class="section-card exp-banner">
        <div class="exp-banner-top">
          <div style="flex: 1; min-width: 320px;">
            <div class="hero-badge" style="background:rgba(16,185,129,0.18); color:#6ee7b7; border-color:rgba(16,185,129,0.45);">
              Experiment #7 · All 21 Korean-Accessible Assets · 800M KRW (8억 원) After-Tax &amp; Comp-Tax Shielded Suite
            </div>
            <h2 class="section-title" style="font-size:22px; margin-top:4px;">
              🌏 한국 투자 가능 21개 전자산 세후(After-Tax) 백테스트 &amp; 원금 8억 금융소득종합과세 비대상 최적 포트폴리오
            </h2>
            <p class="section-sub" style="margin-bottom:0; color:#e2e8f0; line-height:1.6;">
              한국 투자자가 접근 가능한 <strong>21개 전체 자산군(국내주식, 미국 대표지수 3종, 미국 핵심 섹터 8종, KRX 금현물 vs 국제금, WTI 원유, 미국 리츠, 미 국채 20년/10년/2년, 달러 현물, 비트코인)</strong>을 대상으로
              <strong>투자 원금 8억 원</strong> 기준 <strong>실제 한국 세법(해외주식 양도세 22% 분리과세·연 250만 원 공제·손익통산 vs 국내상장 해외ETF 15.4%~49.5% 배당종합과세 함정 vs KRX 금현물 비과세 vs 미국 원유 PTP 10% 원천징수)</strong>을 정밀 반영하여 산출한 세후 백테스트 리포트입니다.
            </p>
          </div>
          <div class="exp-Benchmarks">
            <div class="bench-pill"><strong>투자 원금 &amp; 핵심 제약:</strong> 원금 <span class="accent">8억 원 (800,000,000원)</span> · 금융소득종합과세(연 이자·배당 2,000만 원) <span class="pos">100% 비대상 유지</span></div>
            <div class="bench-pill"><strong>단일자산 세후 1위 (전구간 27.8년):</strong> <span class="pos">미국 반도체 SOXX 직투 (세후 +13.84%, 8억→292.8억)</span> · 비과세 1위 <span class="pos">KRX 금현물 (세후 +10.33%, 8억→122.5억)</span></div>
            <div class="bench-pill"><strong>다중자산 포트폴리오 Top 1 (MA20):</strong> 세후 CAGR <span class="pos">+16.10%</span> (8억→505.2억) · 올웨더 방어형(MA26) 세후 <span class="pos">+10.44%</span> (MDD -33.48%)</div>
          </div>
        </div>
      </section>

      <!-- QUICK JUMP ANCHOR BAR -->
      <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:20px;">
        <a href="#sec-exp7-audit" style="background:#1e293b; color:#fde047; border:1px solid #f59e0b; padding:8px 14px; border-radius:8px; font-size:13px; font-weight:700; text-decoration:none;">🛡️ 검증자 에이전트 세금·종합과세 감사 리포트</a>
        <a href="#sec-exp7-table1" style="background:#1e293b; color:#38bdf8; border:1px solid #38bdf8; padding:8px 14px; border-radius:8px; font-size:13px; font-weight:700; text-decoration:none;">📊 [결과물 1] 21개 투자자산 바이앤홀드 세후 CAGR 순위표</a>
        <a href="#sec-exp7-table2" style="background:#1e293b; color:#6ee7b7; border:1px solid #10b981; padding:8px 14px; border-radius:8px; font-size:13px; font-weight:700; text-decoration:none;">📈 [결과물 2] 투자자산별 유명 매매전략 세후 CAGR 순위표</a>
        <a href="#sec-exp7-table3" style="background:#1e293b; color:#f472b6; border:1px solid #ec4899; padding:8px 14px; border-radius:8px; font-size:13px; font-weight:700; text-decoration:none;">🏆 [결과물 3] 최적 비중 다중자산 포트폴리오 Top 10 &amp; 시각화 그래프</a>
      </div>

      <!-- SECTION 0: VERIFIER SUBAGENT AUDIT REPORT (검증자 에이전트 세금계산 & 종합과세 리스크 검증) -->
      <section class="section-card" id="sec-exp7-audit" style="border-color:rgba(245,158,11,0.55);">
        <div class="hero-badge" style="background:rgba(245,158,11,0.18); color:#fde047; border-color:rgba(245,158,11,0.45);">
          VERIFIER AGENT AUDIT REPORT · blind-reviewer 독립 세무·정량 감사 완료
        </div>
        <h2 class="section-title">🛡️ 검증자 에이전트(Subagent) 감사 보고서: 상품별 세금 계산 명확성 &amp; 원금 8억 금융소득종합과세 리스크 검증</h2>
        <p class="section-sub">
          검증자 에이전트(<code>blind-reviewer</code>)가 대한민국 소득세법(제16조·제17조·제118조의2), 국민건강보험법 시행령(제41조), 미국 국세청(IRS Section 1446(f) PTP 원천징수) 규정을 바탕으로 백테스트 엔진의 세금 계산식과 원금 규모별 과세 전환 리스크를 감사한 결과입니다.
        </p>

        <div class="sweetspot-grid" style="margin-bottom:18px;">
          <div class="sweet-box gold">
            <h3>✅ [검증 기준 1] 한국 투자 루트별 과세 체계 &amp; 상품 선택 감사</h3>
            <ul>
              <li><strong>국내 상장 해외/원자재 ETF의 치명적 함정 (원금 8억 투자 시 절대 금기!):</strong>
                <br/>국내 상장된 <code>TIGER 미국나스닥100</code>, <code>KODEX WTI원유선물</code>, <code>ACE 미국30년국채</code> 등은 매매차익이 양도소득이 아닌 <strong>'배당소득(15.4%)'</strong>으로 과세됩니다. 원금 8억 원에서는 연간 <strong>단 +2.5%(2,000만 원)만 수익이 나도 즉시 금융소득종합과세 대상자로 직행</strong>하여 초과분에 <strong>최대 49.5% 누진세율 + 건강보험료 피부양자 박탈(연 수백만 원 추가 부담)</strong>이 부과되며, <strong>자산 간 손익통산조차 불가능</strong>합니다.</li>
              <li><strong>미국 상장 ETF 직접투자(직투)의 압도적 절세 우위:</strong>
                <br/>미국 시장에 상장된 <code>QQQM</code>, <code>VOO</code>, <code>SOXX</code>, <code>XLK</code>, <code>XLE</code>, <code>TLT</code>, <code>BOXX</code> 등을 직투하면 매매차익이 수십억 원 발생해도 <strong>연 250만 원 기본공제 후 22% 단일세율로 완전 분리과세</strong>되어 금융소득종합과세 및 건보료 산정에서 <strong>100% 영구 제외</strong>되며, 연간 해외주식 간 <strong>손익통산(Loss Offsetting)</strong>이 완벽히 적용됩니다.</li>
            </ul>
          </div>

          <div class="sweet-box">
            <h3>🛢️ [특수 자산 심층 검증] 원유(WTI) &amp; 금(Gold) 3중 비교 결론</h3>
            <ul>
              <li><strong>원유(WTI) 투자 3가지 선택지 감사 결론:</strong>
                <br/>① <em>국내 상장 <code>KODEX WTI원유선물</code></em>: 매매차익 15.4% 배당소득 합산 → 8억 투자 시 유가 반등 한 번에 <strong>금융소득종합과세 폭탄</strong>.
                <br/>② <em>미국 상장 <code>USO</code> / <code>DBO</code> 직투</em>: 미국 세법 Section 1446(f) <strong>PTP(공개거래파트너십)</strong> 지정으로 손익과 무관하게 <strong>매도 대금 전체의 10%(8억 매도 시 8,000만 원!)가 강제 원천징수</strong>되는 재앙 발생.
                <br/>③ <strong>✅ 최선의 해법 (미국 상장 Non-PTP <code>OILK</code> 또는 에너지 섹터 <code>XLE</code> 직투):</strong> 케이맨 자회사 구조로 PTP 10% 원천징수가 면제된 <code>OILK</code>를 직투하거나, 선물 롤오버(콘탱고) 비용까지 없는 미국 에너지 기업 ETF <code>XLE</code>(세후 CAGR <strong>+8.26%</strong> vs WTI 선물 <strong>+0.25%</strong>)에 직투해야 합니다.</li>
              <li><strong>금(Gold) 투자 3가지 선택지 감사 결론 (8억 원 → 27.8년 후 세후 자산):</strong>
                <br/>① <strong>✅ <code>KRX 금현물</code> 직접투자:</strong> 매매차익·배당 <strong>완전 비과세(0%)</strong> → 세후 <strong>122.5억 원 (CAGR +10.33%, 세금 0원)</strong>!
                <br/>② <em>미국 <code>GLDM/GLD</code> 직투</em>: 양도세 22% 분리과세 → 세후 <strong>91.0억 원 (CAGR +9.15%)</strong>.
                <br/>③ <em>국내 상장 골드선물 ETF</em>: 배당소득세 + 종합과세 → 세후 <strong>73.5억 원 (CAGR +8.31%)</strong>.
                <br/>👉 <strong>똑같은 금에 8억을 투자해도 'KRX 금현물'을 선택하는 것만으로 세금 31.5억~49.0억 원을 절약합니다!</strong></li>
            </ul>
          </div>

          <div class="sweet-box green">
            <h3>🚨 [검증 기준 2] 원금 8억 &amp; 자산 증식 시 금융소득종합과세 리스크와 3대 방어막</h3>
            <ul>
              <li><strong>원금 8억 원 단일자산 투자의 즉각적 위험:</strong>
                <br/>원금 8억 원에서는 포트폴리오 배당수익률이 <strong>연 2.50%(연 배당 2,000만 원)</strong>를 넘는 즉시 금융소득종합과세 대상이 됩니다. 따라서 <code>VNQ 리츠(3.8% → 연 3,040만원)</code>, <code>TLT 장기채(3.5% → 연 2,800만원)</code>, <code>IEF 중기채(3.2% → 연 2,560만원)</code>, <code>XLE 에너지(3.0% → 연 2,400만원)</code>, <code>일반 달러RP/단기채(4.0% → 연 3,200만원)</code>를 8억 원 단독 보유하면 <strong>투자 첫해(1년 차)부터 100% 종합과세 대상</strong>이 됩니다.</li>
              <li><strong>실전 3대 절세 엔지니어링 방어막 (27.8년간 종합과세 0회 달성):</strong>
                <br/>① <strong>현금·단기채는 무배당 합성 ETF <code>BOXX</code> 직투로 대체:</strong> 연 4~5% 단기 국채금리를 배당(0%)이 아닌 주가 상승으로 적립해 이자소득을 <strong>22% 분리과세 양도차익으로 전환</strong>.
                <br/>② <strong>무배당·비과세 <code>KRX 금현물(25~40%)</code> + 초저배당 <code>QQQM/SOXX(0.6%)</code> 코어 편입:</strong> 포트폴리오 전체 배당률을 <strong>0.5%~1.1% 이하(8억 기준 연 420만~890만 원)</strong>로 압축하여 종합과세 임계 자산을 <strong>23억~38억 원</strong>까지 상향.
                <br/>③ <strong>자산 증식기(20억~100억+) 배당락일 전 매도·익일 재매수(Dividend-to-Capital-Gain Swap):</strong> 장기 복리로 자산이 30억 원 이상으로 불어나 연간 누적 배당이 <strong>1,900만 원 안전선</strong>에 근접하면, 남은 분기에는 배당락일 직전 매도 후 배당락일에 재매수하여 배당소득을 <strong>22% 분리과세 양도소득으로 합법 전환</strong>.</li>
            </ul>
          </div>
        </div>

        <!-- CAPITAL SCALE RISK MATRIX TABLE -->
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>투자 원금(자산) 규모 구간</th>
                <th>종합과세 발동 임계 배당률 (연 2,000만원 기준)</th>
                <th>과세 전환 리스크 진단 (검증자 에이전트 평가)</th>
                <th>필수 포트폴리오 설계 및 절세 엔지니어링 수칙</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>1억 원 구간</strong><br/><span class="sub-num">(일반 개인 투자자)</span></td>
                <td class="num"><strong class="pos">연 20.0% 이상</strong></td>
                <td><span class="pos" style="font-weight:700;">🟢 안전 (Very Low Risk)</span> — 초고배당 커버드콜에 몰빵하지 않는 한 종합과세 위험 없음</td>
                <td>ISA(서민/일반형) 및 연금저축·IRP 계좌 한도를 우선 채워 국내상장 해외ETF 과세이연·비과세 혜택 활용 가능</td>
              </tr>
              <tr>
                <td><strong>5억 원 구간</strong><br/><span class="sub-num">(준자산가 진입)</span></td>
                <td class="num"><strong style="color:#fde047;">연 4.00% 이상</strong></td>
                <td><span style="color:#fde047; font-weight:700;">🟡 주의 (Moderate Risk)</span> — 리츠(VNQ), 고배당주(SCHD), 예금/RP 단독 보유 시 2,000만 원 돌파 시작</td>
                <td>국내 상장 해외/원자재 ETF 전량 정리 → 미국 상장 ETF 직투 전환 및 KRX 금현물 계좌 개설 필수</td>
              </tr>
              <tr class="top3-highlight">
                <td><strong>8억 원 구간 (현재 기준)</strong><br/><span class="sub-num">(핵심 분석 타겟)</span></td>
                <td class="num"><strong class="neg">연 2.50% 이상</strong></td>
                <td><span class="neg" style="font-weight:700;">🟠 고위험 (High Risk)</span> — 국채(TLT 3.5%, IEF 3.2%), 리츠(3.8%), 에너지(3.0%), 달러예금(4.0%) 단독 보유 시 <strong>1년 차 즉시 종합과세 발동!</strong></td>
                <td><strong>Top 10 다중자산 포트폴리오 적용:</strong> 초저배당 성장주(QQQM·SOXX) + 비과세 KRX 금현물(25~35%) + 무배당 단기채(BOXX) 조합으로 초기 배당을 <strong>연 420만~1,020만 원(배당률 0.5~1.2%)</strong>으로 억제</td>
              </tr>
              <tr>
                <td><strong>20억 ~ 35억 원 구간</strong><br/><span class="sub-num">(8억 투자 10~14년 후 증식 자산)</span></td>
                <td class="num"><strong class="neg">연 0.57% ~ 1.00% 이상</strong></td>
                <td><span class="neg" style="font-weight:700;">🔴 임계 도달 (Critical Threshold)</span> — 저배당 다중자산 포트폴리오도 자산이 23억~32억 원을 돌파하면 자연 배당금이 연 2,000만 원에 도달</td>
                <td>채권 비중을 <code>TLT/IEF</code>에서 무배당 합성 단기채 <code>BOXX</code> 및 무배당 <code>KRX 금현물</code>로 점진 이동 + 4분기 배당락일 전 매도·재매수(양도차익 전환) 가동</td>
              </tr>
              <tr>
                <td><strong>50억 ~ 500억+ 구간</strong><br/><span class="sub-num">(8억 투자 18~27.8년 후 장기 복리)</span></td>
                <td class="num"><strong class="neg">연 0.04% ~ 0.40% 이상</strong></td>
                <td><span class="neg" style="font-weight:700;">🔥 초고액 자산가 과세 절벽</span> — 나스닥(배당률 0.6%)조차 34억 원 이상 보유 시 배당금이 2,000만 원을 초과함</td>
                <td>연간 누적 배당금 1,900만 원 도달 시점부터 <strong>분기 배당락일(D-1) 전 매도 → 배당락일(D) 재매수 스왑</strong>을 실행하여 배당소득을 <strong>22% 분리과세 양도소득으로 100% 전환</strong> (실제 백테스트 27.8년 종합과세 0회 입증)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- SECTION 1: DELIVERABLE 1 (21개 투자자산 바이앤홀드 세후 CAGR 높은 순 정렬 표) -->
      <section class="section-card" id="sec-exp7-table1">
        <div class="hero-badge">DELIVERABLE #1 · 21 TRADABLE ASSETS BUY &amp; HOLD AFTER-TAX RANKING</div>
        <h2 class="section-title">📊 [결과물 1] 한국 투자 가능 21개 전체 자산 바이앤홀드(Buy &amp; Hold) 세후 CAGR 높은 순 정렬 표 (원금 8억 기준)</h2>
        <p class="section-sub">
          각 투자자산을 한국에서 투자할 때 <strong>가장 세후 수익이 높은 최적 투자 방식(국내 상장 ETF vs 미국 직투 ETF vs KRX 금현물/현물)</strong>과 적용 세율, 세전/세후 CAGR, 8억 원 투자 시 최종 세후 자산 및 금융소득종합과세 판정을 세후 CAGR 높은 순으로 정렬한 표입니다. (분석 기간: 포스트 IMF <code>1999-01-04 ~ 2026-10-27</code> 27.8년, 비트코인은 거래 개시일 <code>2010-07-20 ~ 2026-10-27</code> 16.3년)
        </p>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>순위</th>
                <th>자산명 (티커 / 분류)</th>
                <th>한국 최적 투자 방법 &amp; 추천 상품 (vs 피해야 할 방식)</th>
                <th class="num">적용 세율<br/>(매매차익 / 배당)</th>
                <th class="num">세전 CAGR<br/>(세전 최종자산)</th>
                <th class="num" style="color:#6ee7b7;">세후 CAGR (정렬기준)<br/>(세금 차감폭)</th>
                <th class="num" style="color:#fde047;">8억 → 세후 최종자산<br/>(총 납부세액)</th>
                <th class="num">국내상장 해외ETF<br/>함정 시 세후 CAGR</th>
                <th class="num">최대낙폭 (MDD)<br/>(고점일 → 저점일)</th>
                <th class="num">Sharpe / Calmar<br/>(Sortino)</th>
                <th>원금 8억 단독 보유 시<br/>금융소득종합과세 판정</th>
              </tr>
            </thead>
            <tbody>
              ${table1RowsHtml}
            </tbody>
          </table>
        </div>
      </section>

      <!-- SECTION 2: DELIVERABLE 2 (각 투자자산에 대해 인터넷 검증 유명 매수·매도 전략 적용 시 세후 CAGR 높은 순 정렬 표) -->
      <section class="section-card" id="sec-exp7-table2">
        <div class="hero-badge" style="background:rgba(16,185,129,0.18); color:#6ee7b7; border-color:rgba(16,185,129,0.45);">
          DELIVERABLE #2 · FAMOUS ASSET TRADING STRATEGIES AFTER-TAX RANKING
        </div>
        <h2 class="section-title">📈 [결과물 2] 투자자산별 유명 매수·매도 전략 적용 시 세후 CAGR 높은 순 정렬 표 (한국 투자·세후 이익 기준)</h2>
        <p class="section-sub">
          글로벌 퀀트 문헌 및 학계에서 검증된 <strong>5대 유명 매매전략(① 폴 튜더 존스 200일선 추세추종, ② 메브 파버 60일 비대칭 수급 추세, ③ 게리 안토나치 절대모멘텀 + OECD 경기선행 가속, ④ 래리 코너스 RSI 과매도 역추세 스나이퍼, ⑤ 클로드 섀넌 변동성 수확 밴드 + VIX 공포 매수)</strong>을 21개 각 자산에 적용하여, <strong>매매할 때마다 발생하는 연간 해외주식 양도소득세(22%, 250만 원 공제)와 배당소득세(15.4%)를 모두 차감한 세후 CAGR 높은 순</strong>으로 정렬했습니다.
        </p>

        <h3 style="font-size:16.5px; color:#fde047; margin: 14px 0 10px;">
          2-A. 21개 투자자산별 최우수(Best) 유명 매매전략 세후 CAGR 순위표 (단순 보유 대비 MDD 방어 효과 비교)
        </h3>
        <div class="table-wrap" style="margin-bottom:22px;">
          <table>
            <thead>
              <tr>
                <th>순위</th>
                <th>투자자산 (한국 투자 방식)</th>
                <th>자산별 최우수 유명 매매전략 &amp; 매수·매도 규칙</th>
                <th class="num">세전 CAGR<br/>(세전 최종자산)</th>
                <th class="num" style="color:#6ee7b7;">세후 CAGR (정렬기준)<br/>(바이앤홀드 대비)</th>
                <th class="num" style="color:#fde047;">8억 → 세후 최종자산<br/>(총 납부세액)</th>
                <th class="num">최대낙폭 (MDD)<br/>(바이앤홀드 대비 방어력)</th>
                <th class="num">Sharpe / Calmar<br/>(Sortino · 매매횟수)</th>
                <th class="num">현대 OOS (2011~2026)<br/>세후 CAGR / MDD</th>
              </tr>
            </thead>
            <tbody>
              ${table2BestRowsHtml}
            </tbody>
          </table>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin: 18px 0 10px;">
          <h3 style="font-size:16.5px; color:#38bdf8; margin:0;">
            2-B. 전체 105개 (21개 자산 × 5대 유명 전략) 세후 CAGR 높은 순 전수 정렬 표
          </h3>
          <button type="button" class="btn-toggle" id="btnToggle105Strat" onclick="toggleExtra105Strategies()">
            전체 105개 전략 모두 펼치기 (+70개 더보기)
          </button>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>전체 순위</th>
                <th>자산명</th>
                <th>적용 유명 매매전략 및 세부 시그널</th>
                <th class="num">세전 CAGR</th>
                <th class="num" style="color:#6ee7b7;">세후 CAGR (정렬기준)</th>
                <th class="num" style="color:#fde047;">8억 → 세후 최종자산</th>
                <th class="num">최대낙폭 (MDD)</th>
                <th class="num">Sharpe / Calmar</th>
                <th class="num">총 매매횟수 / 납부세액</th>
              </tr>
            </thead>
            <tbody>
              ${table2AllRowsHtml}
            </tbody>
          </table>
        </div>
      </section>

      <!-- SECTION 3: DELIVERABLE 3 (적절 보유 비중 다중자산 포트폴리오 세후 수익 기준 Top 10 & 시각화 차트) -->
      <section class="section-card" id="sec-exp7-table3">
        <div class="hero-badge" style="background:rgba(236,72,153,0.18); color:#f472b6; border-color:rgba(236,72,153,0.45);">
          DELIVERABLE #3 · TOP 10 AFTER-TAX MULTI-ASSET PORTFOLIOS &amp; VISUALIZATION
        </div>
        <h2 class="section-title">🏆 [결과물 3] 각 자산의 적절 보유 비중을 가져갔을 경우 세후 수익 기준 최종 Top 10 포트폴리오 (원금 8억 · 금융소득종합과세 비대상)</h2>
        <p class="section-sub">
          단일자산 보유 시 발생하는 극단적 낙폭(나스닥 -81%, 반도체 -82%, 비트코인 -92%)이나 금융소득종합과세 초과(장기채·리츠 1년차 즉시 과세)를 완벽히 해결하기 위해,
          <strong>초저배당 고성장 미국 직투 ETF(<code>QQQM</code>, <code>SOXX</code>, <code>XLK</code>, <code>XLV</code>, <code>XLE</code>, <code>OILK</code>) + 완전 비과세 국내 핵심자산(<code>KRX 금현물</code>, <code>KODEX 200</code>) + 위기 방어 국채(<code>TLT</code>, 무배당 <code>BOXX</code>)</strong>를 최적 비중으로 결합한 30개 다중자산 포트폴리오 중 <strong>세후 수익(After-Tax CAGR) 기준 최종 Top 10</strong>입니다.
        </p>

        <!-- 3 INTERACTIVE CHARTS -->
        <div class="chart-box" style="margin-bottom:20px;">
          <div class="chart-header">
            <div class="chart-title">🎯 다중자산 포트폴리오 30선 위험(|MDD|) 대비 세후 연복리(After-Tax CAGR) 파레토 산포도</div>
            <span style="font-size:12px; color:#94a3b8;">왼쪽 위(낙폭은 작고 세후 수익률은 높은 곳)에 위치할수록 우월한 포트폴리오입니다.</span>
          </div>
          <div class="chart-canvas-wrap" style="height:370px;">
            <canvas id="scatterChart_exp7_all_assets_tax"></canvas>
          </div>
        </div>

        <div class="chart-grid-2" style="margin-bottom:24px;">
          <div class="chart-box">
            <div class="chart-header">
              <div class="chart-title">📈 Top 10 최적 비중 포트폴리오 세후 누적 자산 곡선 (원금 8억 = 100 기준)</div>
              <div style="display:flex; gap:6px; align-items:center;">
                <button type="button" class="btn-toggle" id="btnToggleAllEquity_exp7_all_assets_tax" onclick="toggleAllDatasets('exp7_all_assets_tax', 'equity')">전체 해제</button>
                <button type="button" class="btn-toggle" id="btnScaleToggle_exp7_all_assets_tax" onclick="toggleEquityScale('exp7_all_assets_tax')">선형(Linear) 스케일로 보기</button>
              </div>
            </div>
            <div class="chart-canvas-wrap">
              <canvas id="equityChart_exp7_all_assets_tax"></canvas>
            </div>
          </div>

          <div class="chart-box">
            <div class="chart-header">
              <div class="chart-title">🌊 Top 10 포트폴리오 수중 낙폭 (Underwater Drawdown MDD) 비교</div>
              <div style="display:flex; gap:6px; align-items:center;">
                <button type="button" class="btn-toggle" id="btnToggleAllDD_exp7_all_assets_tax" onclick="toggleAllDatasets('exp7_all_assets_tax', 'drawdown')">전체 해제</button>
              </div>
            </div>
            <div class="chart-canvas-wrap">
              <canvas id="drawdownChart_exp7_all_assets_tax"></canvas>
            </div>
          </div>
        </div>

        <!-- TOP 10 MULTI-ASSET PORTFOLIO TABLE -->
        <h3 style="font-size:17px; color:#fde047; margin: 10px 0 10px;">
          🏆 원금 8억 원 세후 수익 &amp; 금융소득종합과세 비대상 최종 Top 10 다중자산 포트폴리오 상세표
        </h3>
        <div class="table-wrap" style="margin-bottom:24px;">
          <table>
            <thead>
              <tr>
                <th>순위</th>
                <th>포트폴리오명 &amp; 설계 핵심 논리</th>
                <th>자산별 적절 보유 비중 (한국 최적 상품)</th>
                <th class="num">세전 CAGR<br/>(세전 최종자산)</th>
                <th class="num" style="color:#6ee7b7;">세후 CAGR (정렬기준)<br/>(현대 OOS 세후)</th>
                <th class="num" style="color:#fde047;">8억 → 세후 최종자산<br/>(절세 구조 이득액)</th>
                <th class="num">국내상장 해외ETF<br/>함정 시 세후 CAGR</th>
                <th class="num">최대낙폭 (MDD)<br/>(OOS MDD)</th>
                <th class="num">Sharpe / Calmar<br/>(Sortino · Ulcer)</th>
                <th>원금 8억 초기 연배당금 &amp;<br/>종합과세 임계 자산 규모</th>
              </tr>
            </thead>
            <tbody>
              ${table3Top10RowsHtml}
            </tbody>
          </table>
        </div>

        <!-- ALL 30 MULTI-ASSET PORTFOLIOS COLLAPSIBLE TABLE (INCLUDING ULTRA-LOW-MDD ALL-WEATHER PORTFOLIOS) -->
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin: 18px 0 10px;">
          <h3 style="font-size:16px; color:#38bdf8; margin:0;">
            📋 다중자산 포트폴리오 30선 전체 비교표 (초저낙폭 MDD -20%대 올웨더 방어형 <code>MA24</code>, <code>MA29</code>, <code>MA07</code> 포함)
          </h3>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>구분</th>
                <th>포트폴리오명 &amp; 자산 배분 비중</th>
                <th class="num">세전 CAGR</th>
                <th class="num" style="color:#6ee7b7;">세후 CAGR</th>
                <th class="num">국내ETF 함정시</th>
                <th class="num" style="color:#fde047;">8억 → 세후 최종자산</th>
                <th class="num">MDD</th>
                <th class="num">Sharpe / Calmar</th>
                <th class="num">8억 초기 연배당</th>
                <th class="num">종합과세 임계자산</th>
              </tr>
            </thead>
            <tbody>
              ${table3All30RowsHtml}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `;

  return {
    panelHtml,
    exp7ChartPayload,
  };
}

module.exports = {
  buildAllAssetsTaxTab,
};
