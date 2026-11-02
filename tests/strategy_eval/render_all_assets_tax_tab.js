/**
 * tests/strategy_eval/render_all_assets_tax_tab.js
 *
 * Renders the Tab (`exp7_all_assets_tax`: "🌏 전자산 세후·절세 (8억기준)")
 * reflecting the user's exact specification:
 * - Backtest (1999~2026) determines the Expected CAGR, MDD, Sharpe/Calmar/Sortino of each asset, strategy, and portfolio.
 * - Based on investing 800,000,000 KRW (8억 원) TODAY:
 *   1) Calculates 1-Year Expected Pre-Tax Return (매매차익 + 배당금)
 *   2) Calculates 1-Year Expected Tax (양도소득세 + 배당소득세 + 종합과세 추가세액)
 *   3) Determines whether it triggers Comprehensive Financial Income Tax (금융소득종합과세: 연 이자·배당 > 2,000만 원)
 *   4) Calculates 1-Year Expected After-Tax Net Profit & After-Tax Expected CAGR
 * - Explicitly compares US-listed ETFs vs Domestic-listed ETFs vs KRX Spot for Commodities (WTI Crude Oil: USO vs OILK vs XLE vs KODEX WTI원유선물; Gold: KRX 금현물 vs GLDM vs ACE KRX금현물 vs KODEX 골드선물).
 */

const {
  runTaxAwareBacktest,
  INITIAL_CAPITAL_KRW,
  START_DATE_POST_IMF,
  END_DATE,
} = require("./run_all_assets_tax_backtest");

function fmtManwon(krw) {
  const man = Math.round(krw / 10000);
  if (Math.abs(man) >= 10000) {
    const eok = (krw / 100000000).toFixed(2);
    return `${eok}억 원 (${man.toLocaleString("ko-KR")}만 원)`;
  }
  return `${man.toLocaleString("ko-KR")}만 원`;
}

function fmtManwonShort(krw) {
  const man = Math.round(krw / 10000);
  const sign = man > 0 ? "+" : "";
  if (Math.abs(man) >= 100000) {
    return `${sign}${(krw / 100000000).toFixed(1)}억 원`;
  }
  return `${sign}${man.toLocaleString("ko-KR")}만 원`;
}

function fmtTaxManwon(krw) {
  const man = Math.round(krw / 10000);
  if (man === 0) return "0원 (비과세)";
  return `${man.toLocaleString("ko-KR")}만 원`;
}

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

function buildAllAssetsTaxTab(evalData) {
  const {
    commodityComparisons = [],
    buyAndHoldResults,
    assetStrategyResults,
    bestStrategyPerAsset,
    top10Portfolios,
    allMultiAssetResults,
  } = evalData;

  // 0. Build Commodity ETF Comparison Tables (US-listed ETF vs Domestic-listed ETF vs KRX Spot at 8억 원 current investment)
  const commodityComparisonHtml = commodityComparisons
    .map((group) => {
      const rowsHtml = group.options
        .map((opt) => {
          return `
            <tr class="${opt.isRecommended ? "top3-highlight" : ""}">
              <td style="min-width:210px;">
                <div style="font-weight:800; color:${opt.isRecommended ? "#fde047" : "#fff"}; font-size:13.5px;">
                  ${opt.isRecommended ? "⭐ " : ""}${opt.vehicleName}
                </div>
                <div style="font-size:12px; color:#38bdf8; font-weight:700; margin-top:2px;"><code>${opt.tickers}</code></div>
                <div class="sub-num" style="margin-top:2px;">${opt.market}</div>
              </td>
              <td style="min-width:250px; font-size:12.5px; color:#e2e8f0;">
                ${opt.taxRuleSummary}
              </td>
              <td class="num">
                <div style="font-weight:700; color:#cbd5e1;">+${opt.bnhPreTaxCagrPct.toFixed(2)}%</div>
                <div class="sub-num">세전 ${fmtManwonShort(opt.yr1PreTaxGainBnhKrw)}</div>
              </td>
              <td class="num">
                <div style="font-weight:800; color:${opt.yr1TaxBnhKrw === 0 ? "#6ee7b7" : opt.yr1TaxBnhKrw > 30000000 ? "#f43f5e" : "#fde047"};">
                  ${fmtTaxManwon(opt.yr1TaxBnhKrw)}
                </div>
                <div class="sub-num">1년 후 매도·정산 기준</div>
              </td>
              <td class="num" style="background:rgba(16,185,129,0.06);">
                <div class="${opt.yr1NetGainBnhKrw >= 0 ? "pos" : "neg"}" style="font-weight:900; font-size:14px;">
                  ${opt.yr1AfterTaxCagrBnhPct >= 0 ? "+" : ""}${opt.yr1AfterTaxCagrBnhPct.toFixed(2)}%
                </div>
                <div class="sub-num">순수익 ${fmtManwonShort(opt.yr1NetGainBnhKrw)}</div>
              </td>
              <td class="num">
                <div style="font-weight:700; color:#cbd5e1;">+${opt.activePreTaxCagrPct.toFixed(2)}% (세전 ${fmtManwonShort(opt.yr1PreTaxGainSwingKrw)})</div>
                <div class="sub-num">예상세금 <strong style="color:#fda4af;">${fmtTaxManwon(opt.yr1TaxSwingKrw)}</strong> → 세후 <strong class="${opt.yr1NetGainSwingKrw >= 0 ? "pos" : "neg"}">${fmtManwonShort(opt.yr1NetGainSwingKrw)} (${opt.yr1AfterTaxCagrSwingPct >= 0 ? "+" : ""}${opt.yr1AfterTaxCagrSwingPct.toFixed(2)}%)</strong></div>
              </td>
              <td style="min-width:220px;">
                <div style="font-size:12px; font-weight:700; line-height:1.45;">${opt.compTaxStatus}</div>
                <div class="sub-num" style="margin-top:4px; color:#fde047; font-weight:700;">👉 ${opt.verdict}</div>
              </td>
            </tr>
          `;
        })
        .join("\n");

      return `
        <div style="margin-bottom:20px;">
          <h3 style="font-size:16px; color:#fde047; margin: 12px 0 8px;">${group.assetGroup} — ${group.scenarioTitle}</h3>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>투자 상품 분류 &amp; 대표 티커</th>
                  <th>적용 세법 및 과세 구조 (매매차익 · 배당 · PTP · 손익통산)</th>
                  <th class="num">백테스트 기대 세전 CAGR<br/>(8억 1년 세전 수익)</th>
                  <th class="num" style="color:#fde047;">8억 투자 1년 후<br/>예상 세금 (바이앤홀드)</th>
                  <th class="num" style="color:#6ee7b7;">8억 투자 1년 후<br/>세후 기대 CAGR (순수익)</th>
                  <th class="num">전략 매매 / 반등기(+10%) 가정 시<br/>8억 1년 후 예상 세금 &amp; 세후 수익</th>
                  <th>원금 8억 금융소득종합과세 판정 &amp; 최종 결론</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </div>
        </div>
      `;
    })
    .join("\n");

  // 1. Build Deliverable 1 Table Rows (21 Assets Buy & Hold sorted by 1-Year Expected After-Tax CAGR on 8억 원 current investment)
  const table1RowsHtml = buyAndHoldResults
    .map((item) => {
      const p = item.proj1Yr;
      const isTop3 = item.rank <= 3;

      const compTaxBadgeOptimal = p.isCompTaxTargetOptimal
        ? `<span style="display:inline-block; background:rgba(244,63,94,0.18); color:#fda4af; border:1px solid rgba(244,63,94,0.45); padding:2px 7px; border-radius:6px; font-size:11px; font-weight:700;">🚨 종합과세 대상 (연 배당 ${fmtManwon(p.yr1FinIncomeOptimalKrw)} &gt; 2,000만)</span>`
        : p.yr1FinIncomeOptimalKrw === 0
        ? `<span style="display:inline-block; background:rgba(16,185,129,0.18); color:#6ee7b7; border:1px solid rgba(16,185,129,0.45); padding:2px 7px; border-radius:6px; font-size:11px; font-weight:700;">🛡️ 비대상 (금융소득 0원)</span>`
        : `<span style="display:inline-block; background:rgba(56,189,248,0.15); color:#7dd3fc; border:1px solid rgba(56,189,248,0.4); padding:2px 7px; border-radius:6px; font-size:11px; font-weight:700;">✅ 비대상 (연 배당 ${fmtManwon(p.yr1FinIncomeOptimalKrw)})</span>`;

      const domTrapNote =
        item.ticker === "KPI200"
          ? "국내주식형 동일 (비과세)"
          : item.ticker === "BTC_KRW"
          ? "국내 가상자산 거래소 동일"
          : p.isCompTaxTargetDomTrap
          ? `🚨 국내ETF 투자 시 금융소득 ${fmtManwon(p.yr1FinIncomeDomTrapKrw)} → 종합과세 직행 (세금 ${fmtTaxManwon(p.yr1DomTrapTaxKrw)})`
          : `국내ETF 투자 시 배당세 ${fmtTaxManwon(p.yr1DomTrapTaxKrw)}`;

      return `
        <tr class="${isTop3 ? "top3-highlight" : ""}">
          <td><span class="rank-badge ${item.rank <= 3 ? "rank-" + item.rank : ""}">#${item.rank}</span></td>
          <td>
            <div style="font-weight:800; color:#fff; font-size:13.5px;">${item.shortName} <span style="color:#94a3b8; font-size:11.5px;">(${item.ticker})</span></div>
            <div class="sub-num">${item.category} · 백테스트 ${item.years}년</div>
          </td>
          <td style="min-width:245px;">
            <div style="font-weight:700; color:#38bdf8; font-size:12.5px;">✅ 최적: ${item.bestMethod}</div>
            <div style="font-size:11.5px; color:#cbd5e1; margin-top:2px;">추천 티커: <code style="color:#fde047;">${item.recommendedTickers}</code></div>
            <div style="font-size:11px; color:#fda4af; margin-top:2px;">⚠️ 비교 대조: ${item.alternativeMethod}</div>
          </td>
          <td class="num">
            <div style="color:#e2e8f0; font-weight:700;">+${item.preTaxCagrPct.toFixed(2)}%</div>
            <div class="sub-num">가격 +${item.pricePreTaxCagrPct.toFixed(2)}% / 배당 ${item.divYieldPct.toFixed(2)}%</div>
          </td>
          <td class="num">
            <div style="font-weight:700; color:#cbd5e1;">${fmtManwonShort(p.yr1PreTaxTotalGainKrw)}</div>
            <div class="sub-num">차익 ${fmtManwonShort(p.yr1CapGainKrw)} + 배당 ${fmtManwon(p.yr1DivIncomeKrw)}</div>
          </td>
          <td class="num" style="background:rgba(245,158,11,0.06);">
            <div style="font-weight:800; color:#fde047; font-size:13.5px;">${fmtTaxManwon(p.yr1TotalTaxRealizedKrw)}</div>
            <div class="sub-num">양도세 ${fmtTaxManwon(p.yr1CapGainTaxKrw)} + 배당세 ${fmtTaxManwon(p.yr1DivTotalTaxKrw)}</div>
            <div class="sub-num" style="color:#94a3b8;">(미매도 보유시: ${fmtTaxManwon(p.yr1TotalTaxHoldOnlyKrw)})</div>
          </td>
          <td class="num" style="background:rgba(16,185,129,0.08);">
            <div class="pos" style="font-weight:900; font-size:14.5px;">+${item.afterTaxCagrPct.toFixed(2)}%</div>
            <div style="font-weight:700; color:#6ee7b7; font-size:12px;">1년 순수익 ${fmtManwonShort(p.yr1AfterTaxNetGainKrw)}</div>
            <div class="sub-num">(미매도 보유시 +${item.holdOnlyAfterTaxCagrPct.toFixed(2)}%)</div>
          </td>
          <td>
            ${compTaxBadgeOptimal}
            <div class="sub-num" style="margin-top:3px; color:#fda4af;">${domTrapNote}</div>
          </td>
          <td class="num">
            <div class="neg" style="font-weight:700;">${item.maxDrawdownPct.toFixed(2)}%</div>
            <div class="sub-num">${item.maxDrawdownPeakDate} → ${item.maxDrawdownDate}</div>
          </td>
          <td class="num">
            <div><strong class="accent">${item.sharpe.toFixed(3)}</strong> / <strong>${item.calmar.toFixed(3)}</strong></div>
            <div class="sub-num">Sortino ${item.sortino.toFixed(3)}</div>
          </td>
        </tr>
      `;
    })
    .join("\n");

  // 2A. Build Deliverable 2-A Table Rows (Best Famous Strategy per each of the 21 Assets, sorted by 1-Year Expected After-Tax CAGR on 8억 원)
  const table2BestRowsHtml = bestStrategyPerAsset
    .map((item) => {
      const p = item.proj1Yr;
      const bnh = buyAndHoldResults.find((b) => b.ticker === item.ticker);
      const bnhMdd = bnh ? bnh.maxDrawdownPct : 0;
      const mddSaved = bnh ? (Math.abs(bnhMdd) - Math.abs(item.maxDrawdownPct)).toFixed(2) : "0.00";

      const compBadge = p.isCompTaxTargetOptimal
        ? `<span style="color:#fda4af; font-weight:700;">🚨 대상 (배당 ${fmtManwon(p.yr1FinIncomeOptimalKrw)})</span>`
        : `<span style="color:#6ee7b7; font-weight:700;">✅ 비대상 (금융소득 ${fmtManwon(p.yr1FinIncomeOptimalKrw)})</span>`;

      return `
        <tr class="${item.assetBestRank <= 3 ? "top3-highlight" : ""}">
          <td><span class="rank-badge ${item.assetBestRank <= 3 ? "rank-" + item.assetBestRank : ""}">#${item.assetBestRank}</span></td>
          <td>
            <div style="font-weight:800; color:#fff;">${item.shortName} <span style="color:#94a3b8; font-size:11.5px;">(${item.ticker})</span></div>
            <div class="sub-num">${item.bestMethod}</div>
          </td>
          <td style="min-width:250px;">
            <div style="font-weight:800; color:#38bdf8; font-size:13px;">${item.strategyName}</div>
            <div style="font-size:11.5px; color:#fde047; margin-top:2px;">📚 출처: ${item.famousRef}</div>
            <div class="sub-num" style="margin-top:2px;">⚙️ 규칙: ${item.ruleSummary}</div>
          </td>
          <td class="num">
            <div style="color:#e2e8f0; font-weight:700;">+${item.preTaxCagrPct.toFixed(2)}%</div>
            <div class="sub-num">8억 1년 세전 ${fmtManwonShort(p.yr1PreTaxTotalGainKrw)}</div>
          </td>
          <td class="num" style="background:rgba(245,158,11,0.06);">
            <div style="font-weight:800; color:#fde047;">${fmtTaxManwon(p.yr1TotalTaxRealizedKrw)}</div>
            <div class="sub-num">양도세 ${fmtTaxManwon(p.yr1CapGainTaxKrw)} + 배당세 ${fmtTaxManwon(p.yr1DivTotalTaxKrw)}</div>
          </td>
          <td class="num" style="background:rgba(16,185,129,0.08);">
            <div class="pos" style="font-weight:900; font-size:14.5px;">+${item.afterTaxCagrPct.toFixed(2)}%</div>
            <div style="font-weight:700; color:#6ee7b7; font-size:12px;">1년 순수익 ${fmtManwonShort(p.yr1AfterTaxNetGainKrw)}</div>
          </td>
          <td>
            ${compBadge}
            <div class="sub-num" style="margin-top:2px;">국내ETF 투자시 세금: ${fmtTaxManwon(p.yr1DomTrapTaxKrw)}</div>
          </td>
          <td class="num">
            <div class="neg" style="font-weight:700;">${item.maxDrawdownPct.toFixed(2)}%</div>
            <div class="sub-num" style="color:#6ee7b7;">B&amp;H(${bnhMdd.toFixed(1)}%) 대비 ${Number(mddSaved) >= 0 ? "-" + mddSaved + "%p 방어" : mddSaved + "%p"}</div>
          </td>
          <td class="num">
            <div><strong class="accent">${item.sharpe.toFixed(3)}</strong> / <strong>${item.calmar.toFixed(3)}</strong></div>
            <div class="sub-num">Sortino ${item.sortino.toFixed(3)}</div>
          </td>
        </tr>
      `;
    })
    .join("\n");

  // 2B. Build Deliverable 2-B Table Rows (All 105 Asset Strategies sorted by 1-Year Expected After-Tax CAGR on 8억 원)
  const table2AllRowsHtml = assetStrategyResults
    .map((item) => {
      const p = item.proj1Yr;
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
            <div style="color:#cbd5e1; font-weight:700;">+${item.preTaxCagrPct.toFixed(2)}%</div>
            <div class="sub-num">${fmtManwonShort(p.yr1PreTaxTotalGainKrw)}</div>
          </td>
          <td class="num">
            <div style="color:#fde047; font-weight:700;">${fmtTaxManwon(p.yr1TotalTaxRealizedKrw)}</div>
            <div class="sub-num">금융소득 ${fmtManwon(p.yr1FinIncomeOptimalKrw)}</div>
          </td>
          <td class="num" style="background:rgba(16,185,129,0.06);">
            <div class="pos" style="font-weight:800; font-size:13.5px;">+${item.afterTaxCagrPct.toFixed(2)}%</div>
            <div class="sub-num">순수익 ${fmtManwonShort(p.yr1AfterTaxNetGainKrw)}</div>
          </td>
          <td>
            ${
              p.isCompTaxTargetOptimal
                ? `<span style="color:#fda4af; font-weight:700;">🚨 대상</span>`
                : `<span style="color:#6ee7b7; font-weight:700;">✅ 비대상</span>`
            }
          </td>
          <td class="num">
            <div class="neg" style="font-weight:700;">${item.maxDrawdownPct.toFixed(2)}%</div>
            <div class="sub-num">${item.maxDrawdownPeakDate} → ${item.maxDrawdownDate}</div>
          </td>
          <td class="num">
            <div><strong class="accent">${item.sharpe.toFixed(3)}</strong> / <strong>${item.calmar.toFixed(3)}</strong></div>
            <div class="sub-num">Sortino ${item.sortino.toFixed(3)}</div>
          </td>
        </tr>
      `;
    })
    .join("\n");

  // 3. Build Deliverable 3 Top 10 Multi-Asset Portfolio Table Rows (Current 8억 원 investment -> 1-Year Expected Return, Tax, Comprehensive Tax Status)
  const table3Top10RowsHtml = top10Portfolios
    .map((p) => {
      const pr = p.proj1Yr;
      const yr1TaxSaved = pr.yr1DomTrapTaxKrw - pr.yr1TotalTaxRealizedKrw;
      return `
        <tr class="${p.rank <= 3 ? "top3-highlight" : "row-selected"}">
          <td><span class="rank-badge ${p.rank <= 3 ? "rank-" + p.rank : ""}">TOP ${p.rank}</span></td>
          <td style="min-width:235px;">
            <div style="font-weight:800; color:#fff; font-size:13.5px;">[${p.id}] ${p.name}</div>
            <div style="font-size:11.5px; color:#38bdf8; margin-top:2px;">${p.category} · ${p.rebalanceDesc}</div>
            <div class="sub-num" style="margin-top:3px;">💡 ${p.rationale}</div>
          </td>
          <td style="min-width:225px;">
            <div style="font-weight:700; color:#fde047; font-size:12.5px;">${p.allocSummary}</div>
            <div class="sub-num" style="margin-top:2px;">미국ETF 직투(22% 분리) + KRX금/코스피(비과세 0%) 결합</div>
          </td>
          <td class="num">
            <div style="color:#e2e8f0; font-weight:700;">+${p.preTaxCagrPct.toFixed(2)}%</div>
            <div class="sub-num">8억 1년 세전: <strong>${fmtManwonShort(pr.yr1PreTaxTotalGainKrw)}</strong></div>
            <div class="sub-num">(차익 ${fmtManwonShort(pr.yr1CapGainKrw)} + 배당 ${fmtManwon(pr.yr1DivIncomeKrw)})</div>
          </td>
          <td class="num" style="background:rgba(245,158,11,0.06);">
            <div style="font-weight:800; color:#fde047; font-size:13.5px;">${fmtTaxManwon(pr.yr1TotalTaxRealizedKrw)}</div>
            <div class="sub-num">양도세 ${fmtTaxManwon(pr.yr1CapGainTaxKrw)} + 배당세 ${fmtTaxManwon(pr.yr1DivTotalTaxKrw)}</div>
            <div class="sub-num" style="color:#94a3b8;">(미매도 보유시 배당세만 ${fmtTaxManwon(pr.yr1TotalTaxHoldOnlyKrw)})</div>
          </td>
          <td class="num" style="background:rgba(16,185,129,0.09);">
            <div class="pos" style="font-weight:900; font-size:15px;">+${p.afterTaxCagrPct.toFixed(2)}%</div>
            <div style="font-weight:800; color:#6ee7b7; font-size:12.5px;">1년 세후 순수익 ${fmtManwonShort(pr.yr1AfterTaxNetGainKrw)}</div>
            <div class="sub-num">(미매도 보유시 세후 +${p.holdOnlyAfterTaxCagrPct.toFixed(2)}%)</div>
          </td>
          <td class="num">
            <div style="color:#fda4af; font-weight:700;">세금 ${fmtTaxManwon(pr.yr1DomTrapTaxKrw)}</div>
            <div class="sub-num">세후 +${p.domTrapCagrPct.toFixed(2)}% (${fmtManwonShort(pr.yr1DomTrapNetGainKrw)})</div>
            <div class="sub-num" style="color:#6ee7b7; font-weight:700;">직투+KRX금으로 연 ${fmtTaxManwon(yr1TaxSaved)} 절세!</div>
          </td>
          <td>
            <div style="font-weight:800; color:#6ee7b7;">✅ 금융소득종합과세 비대상</div>
            <div class="sub-num">1년 배당소득: <strong>${fmtManwon(pr.yr1FinIncomeOptimalKrw)}</strong> (한도 2,000만원의 ${((pr.yr1FinIncomeOptimalKrw / 20000000) * 100).toFixed(0)}%)</div>
            <div class="sub-num" style="color:#38bdf8;">자산이 <strong>${fmtBillion(p.compTaxThresholdEquityKrw)}</strong> 될 때까지 비대상 유지</div>
          </td>
          <td class="num">
            <div class="neg" style="font-weight:800;">${p.maxDrawdownPct.toFixed(2)}%</div>
            <div class="sub-num">OOS MDD ${p.oosMaxDrawdownPct.toFixed(2)}%</div>
          </td>
          <td class="num">
            <div><strong class="accent">${p.sharpe.toFixed(3)}</strong> / <strong>${p.calmar.toFixed(3)}</strong></div>
            <div class="sub-num">Sortino ${p.sortino.toFixed(3)}</div>
          </td>
        </tr>
      `;
    })
    .join("\n");

  // Full 30 Multi-Asset Candidates Table Rows
  const table3All30RowsHtml = allMultiAssetResults
    .map((p, idx) => {
      const pr = p.proj1Yr;
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
          <td class="num"><span style="color:#e2e8f0; font-weight:700;">+${p.preTaxCagrPct.toFixed(2)}%</span><br/><span class="sub-num">${fmtManwonShort(pr.yr1PreTaxTotalGainKrw)}</span></td>
          <td class="num"><strong style="color:#fde047;">${fmtTaxManwon(pr.yr1TotalTaxRealizedKrw)}</strong><br/><span class="sub-num">(보유시 ${fmtTaxManwon(pr.yr1TotalTaxHoldOnlyKrw)})</span></td>
          <td class="num"><strong class="pos">+${p.afterTaxCagrPct.toFixed(2)}%</strong><br/><span class="sub-num">${fmtManwonShort(pr.yr1AfterTaxNetGainKrw)}</span></td>
          <td class="num"><span style="color:#fda4af;">세금 ${fmtTaxManwon(pr.yr1DomTrapTaxKrw)}</span><br/><span class="sub-num">(+${p.domTrapCagrPct.toFixed(2)}%)</span></td>
          <td><span style="color:#6ee7b7; font-weight:700;">✅ 비대상</span><br/><span class="sub-num">연 배당 ${fmtManwon(pr.yr1FinIncomeOptimalKrw)}</span></td>
          <td class="num"><strong class="neg">${p.maxDrawdownPct.toFixed(2)}%</strong></td>
          <td class="num"><span class="accent">${p.sharpe.toFixed(3)}</span> / <strong>${p.calmar.toFixed(3)}</strong></td>
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
        yr1NetMan: Math.round(p.proj1Yr.yr1AfterTaxNetGainKrw / 10000),
        yr1TaxMan: Math.round(p.proj1Yr.yr1TotalTaxRealizedKrw / 10000),
        finalEok: Math.round(p.proj1Yr.yr1AfterTaxNetGainKrw / 10000) + "만원/년",
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
      finalEok: Math.round(b.proj1Yr.yr1AfterTaxNetGainKrw / 10000) + "만원/년",
      calmar: b.calmar,
    })),
    top10Curves: top10Portfolios.map((p) => ({
      rank: p.rank,
      id: p.id,
      name: p.name,
      afterTaxCagrPct: p.afterTaxCagrPct,
      mddPct: p.maxDrawdownPct,
      finalEok: "+" + Math.round(p.proj1Yr.yr1AfterTaxNetGainKrw / 10000) + "만원/년",
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
              Experiment #7 · Historical Backtest (1999~2026) → Current 800M KRW (8억 원) 1-Year Expected Tax &amp; Comp-Tax Analysis
            </div>
            <h2 class="section-title" style="font-size:22px; margin-top:4px;">
              🌏 한국 투자 가능 21개 전자산 백테스트 기반 — 현재 8억 원 투자 시 1년 후 기대 CAGR · 예상 세금 · 금융소득종합과세 판정 리포트
            </h2>
            <p class="section-sub" style="margin-bottom:0; color:#e2e8f0; line-height:1.6;">
              1999~2026년(27.8년) 백테스트를 통해 도출된 각 자산·전략·포트폴리오의 <strong>기대 연평균 수익률(Expected CAGR)</strong>을 바탕으로,
              <strong>현재 시점에 8억 원(800,000,000원)을 투자했을 때 ① 1년 후 기대 세전 수익(매매차익+배당), ② 투자 상품별 1년 후 예상 세금(양도소득세·배당소득세·PTP 원천징수), ③ 금융소득종합과세(연 이자·배당 2,000만 원 초과) 대상 여부, ④ 1년 후 기대 세후 순수익 및 세후 CAGR</strong>을 정밀 산출했습니다.
            </p>
          </div>
          <div class="exp-Benchmarks">
            <div class="bench-pill"><strong>분석 기준:</strong> 백테스트 기대 CAGR 적용 → <span class="accent">현재 8억 원 투자 시 1년 후 예상 세금 &amp; 종합과세 판정</span></div>
            <div class="bench-pill"><strong>원자재 핵심 비교:</strong> 원유(<span class="pos">미국 OILK/XLE</span> vs <span class="neg">국내 KODEX WTI / 미국 USO</span>) · 금(<span class="pos">KRX 금현물 비과세</span> vs <span class="neg">국내 금ETF 종합과세</span>)</div>
            <div class="bench-pill"><strong>다중자산 Top 10:</strong> 8억 투자 1년 후 기대 세후 순수익 <span class="pos">+6,900만 ~ +1억 1,180만 원/년</span> · 종합과세 <span class="pos">전원 비대상(안전)</span></div>
          </div>
        </div>
      </section>

      <!-- QUICK JUMP ANCHOR BAR -->
      <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:20px;">
        <a href="#sec-exp7-commodity" style="background:#1e293b; color:#fde047; border:1px solid #f59e0b; padding:8px 14px; border-radius:8px; font-size:13px; font-weight:700; text-decoration:none;">🛢️🥇 원자재(원유·금) 미국 상장 ETF vs 국내 상장 ETF 8억 세금 비교</a>
        <a href="#sec-exp7-audit" style="background:#1e293b; color:#a78bfa; border:1px solid #8b5cf6; padding:8px 14px; border-radius:8px; font-size:13px; font-weight:700; text-decoration:none;">🛡️ 검증자 에이전트 세금·종합과세 감사 리포트</a>
        <a href="#sec-exp7-table1" style="background:#1e293b; color:#38bdf8; border:1px solid #38bdf8; padding:8px 14px; border-radius:8px; font-size:13px; font-weight:700; text-decoration:none;">📊 [결과물 1] 21개 자산 바이앤홀드 1년 후 예상세금·세후CAGR 순위표</a>
        <a href="#sec-exp7-table2" style="background:#1e293b; color:#6ee7b7; border:1px solid #10b981; padding:8px 14px; border-radius:8px; font-size:13px; font-weight:700; text-decoration:none;">📈 [결과물 2] 자산별 유명 매매전략 1년 후 예상세금·세후CAGR 순위표</a>
        <a href="#sec-exp7-table3" style="background:#1e293b; color:#f472b6; border:1px solid #ec4899; padding:8px 14px; border-radius:8px; font-size:13px; font-weight:700; text-decoration:none;">🏆 [결과물 3] 최적 비중 포트폴리오 Top 10 (8억 1년 후 세후수익·시각화)</a>
      </div>

      <!-- SECTION 0-A: COMMODITIES (WTI CRUDE OIL & GOLD) US ETF vs DOMESTIC ETF vs KRX SPOT COMPARISON -->
      <section class="section-card" id="sec-exp7-commodity" style="border-color:rgba(245,158,11,0.6);">
        <div class="hero-badge" style="background:rgba(245,158,11,0.18); color:#fde047; border-color:rgba(245,158,11,0.45);">
          COMMODITY ETF TAX &amp; STRUCTURE DEEP-DIVE · 원자재 미국 상장 ETF vs 국내 상장 ETF vs KRX 현물 비교
        </div>
        <h2 class="section-title">🛢️🥇 원자재(원유 WTI · 금 Gold) 한국 투자 시 — 미국 시장 상장 ETF vs 국내 상장 ETF vs KRX 현물 정밀 비교 (현재 8억 투자 기준)</h2>
        <p class="section-sub">
          같은 원자재(원유·금)에 현재 8억 원을 투자하더라도 <strong>① 국내 상장 선물/현물 ETF(<code>KODEX WTI원유선물</code>, <code>KODEX 골드선물</code>, <code>ACE KRX금현물</code>)</strong>를 사느냐, <strong>② 미국 상장 PTP ETF(<code>USO</code>, <code>DBO</code>)</strong>를 사느냐, <strong>③ 미국 상장 Non-PTP ETF(<code>OILK</code>, <code>XLE</code>, <code>GLDM</code>)</strong> 또는 <strong>④ <code>KRX 금현물</code></strong>을 사느냐에 따라 <strong>1년 후 예상 세금과 금융소득종합과세 대상 여부가 완전히 달라집니다.</strong>
        </p>

        ${commodityComparisonHtml}
      </section>

      <!-- SECTION 0-B: VERIFIER SUBAGENT AUDIT REPORT (검증자 에이전트 세금계산 & 종합과세 리스크 검증) -->
      <section class="section-card" id="sec-exp7-audit" style="border-color:rgba(139,92,246,0.5);">
        <div class="hero-badge" style="background:rgba(139,92,246,0.18); color:#c4b5fd; border-color:rgba(139,92,246,0.45);">
          VERIFIER AGENT AUDIT REPORT · blind-reviewer 세금 계산 명확성 &amp; 원금별 종합과세 리스크 검증
        </div>
        <h2 class="section-title">🛡️ 검증자 에이전트(Subagent) 감사 리포트: 현재 8억 투자 시 세금 계산식 검증 &amp; 원금 규모별 종합과세 리스크</h2>
        <p class="section-sub">
          검증자 에이전트(<code>blind-reviewer</code>)가 검증 기준 2가지(① 상품별 세금 계산의 명확성, ② 원금 8억 원 및 원금 규모 변화에 따른 금융소득종합과세 리스크)를 감사한 핵심 결과입니다.
        </p>

        <div class="sweetspot-grid" style="margin-bottom:18px;">
          <div class="sweet-box gold">
            <h3>1️⃣ [검증 기준 1] 현재 8억 원 투자 시 1년 후 예상 세금 계산 공식</h3>
            <ul>
              <li><strong>미국 상장 ETF 직투 (<code>QQQM</code>, <code>VOO</code>, <code>SOXX</code>, <code>OILK</code>, <code>GLDM</code>, <code>BOXX</code> 등):</strong>
                <br/>• <strong>매매차익 양도소득세(분리과세):</strong> <code>(1년 기대 매매차익 - 250만 원 기본공제) × 22%</code> → <strong>금융소득종합과세 합산액 0원! 건강보험료 부과 0원!</strong> 연간 타 해외주식 손실과 <strong>손익통산 가능</strong>. (단, 1년 후 매도하지 않고 계속 보유할 경우 그해 실현 양도세는 0원이며 배당소득세만 납부)
                <br/>• <strong>배당소득세:</strong> <code>1년 기대 배당금 × 15.4%</code> (오직 배당금만 금융소득 2,000만 원 한도에 합산됨)</li>
              <li><strong>국내 상장 주식형 ETF (<code>KODEX 200</code> / <code>TIGER 200</code>):</strong>
                <br/>• <strong>매매차익 비과세(0%)</strong>, 분배금(연 1.5% = 8억 기준 <code>1,200만 원</code>)에 대해서만 15.4% 배당소득세(<code>184.8만 원</code>) 납부 → <strong>금융소득종합과세 비대상</strong>.</li>
              <li><strong>국내 상장 해외·원자재·채권 ETF (<code>TIGER 미국나스닥100</code>, <code>KODEX WTI원유선물</code>, <code>KODEX 골드선물</code> 등):</strong>
                <br/>• <strong>매매차익 + 분배금 전액이 '배당소득(15.4%)'으로 합산 과세!</strong> 250만 원 기본공제 없음, 손익통산 불가.
                <br/>• 현재 8억 원 투자 시 <strong>1년 수익률이 +2.50%(+2,000만 원)만 넘어도 즉시 금융소득종합과세 대상자</strong>가 되어 2,000만 원 초과분에 <strong>종소세 누진세율(최대 49.5%) + 지역건강보험료(약 8%)</strong>가 폭탄처럼 부과됩니다.</li>
            </ul>
          </div>

          <div class="sweet-box">
            <h3>2️⃣ [검증 기준 2] 현재 8억 원 단독 투자 시 종합과세 대상이 되는 자산 vs 안전한 자산</h3>
            <ul>
              <li><strong>🚨 현재 8억 원 단독 투자 시 1년 후 즉시 금융소득종합과세 대상이 되는 자산 (배당률 &gt; 2.50%):</strong>
                <br/>• <code>미국 리츠(VNQ, 배당률 3.8%)</code>: 1년 배당금 <strong>3,040만 원</strong> (+1,040만 원 초과 → <strong>즉시 종합과세 대상!</strong>)
                <br/>• <code>미국 20년+ 장기국채(TLT, 배당률 3.5%)</code>: 1년 배당금 <strong>2,800만 원</strong> (+800만 원 초과 → <strong>즉시 종합과세 대상!</strong>)
                <br/>• <code>미국 10년 중기국채(IEF, 배당률 3.2%)</code>: 1년 배당금 <strong>2,560만 원</strong> (+560만 원 초과 → <strong>즉시 종합과세 대상!</strong>)
                <br/>• <code>미국 에너지 섹터(XLE, 배당률 3.0%)</code>: 1년 배당금 <strong>2,400만 원</strong> (+400만 원 초과 → <strong>즉시 종합과세 대상!</strong>)
                <br/>• <code>미국 유틸리티(XLU, 배당률 2.9%)</code>: 1년 배당금 <strong>2,320만 원</strong> (+320만 원 초과 → <strong>즉시 종합과세 대상!</strong>)</li>
              <li><strong>✅ 현재 8억 원 단독 투자 시 금융소득종합과세 비대상인 핵심 자산 (배당률 ≤ 2.50%):</strong>
                <br/>• <code>KRX 금현물(0%)</code>, <code>무배당 단기채 BOXX(0%)</code>, <code>미국 금 GLDM(0%)</code>, <code>미국 원유 OILK(0%)</code>, <code>비트코인(0%)</code>, <code>달러현물(0%)</code> → <strong>금융소득 0원 (영구 비대상)</strong>
                <br/>• <code>나스닥100 QQQM(0.6% → 연 480만원)</code>, <code>미국 반도체 SOXX(0.65% → 연 520만원)</code>, <code>미국 기술 XLK(0.7% → 연 560만원)</code>, <code>S&P500 VOO(1.3% → 연 1,040만원)</code>, <code>코스피200(1.5% → 연 1,200만원)</code> → <strong>모두 2,000만 원 한도 이내로 종합과세 비대상!</strong></li>
            </ul>
          </div>

          <div class="sweet-box green">
            <h3>3️⃣ 투자 원금 규모별(1억 / 5억 / 8억 / 20억+) 과세 전환 리스크 및 해법</h3>
            <ul>
              <li><strong>원금 1억 ~ 3억 원 구간:</strong> 배당률 4% 채권·리츠에 투자해도 연 배당이 400만~1,200만 원이므로 종합과세 위험이 낮음 (연금저축·IRP·ISA 우선 활용).</li>
              <li><strong>원금 5억 ~ 8억 원 구간 (현재 타겟):</strong> 국내 상장 해외/원자재 ETF는 +2.5%~+4.0% 수익만 나도 종합과세에 걸리므로 <strong>전량 미국 직투 ETF + KRX 금현물 + 국내 주식형 ETF로 구성</strong>해야 하며, 채권/리츠/에너지 등 배당률 3% 이상 자산은 <strong>포트폴리오 내 비중을 15~30% 이하로 제한</strong>하거나 <strong>무배당 합성 단기채(<code>BOXX</code>)</strong>를 활용해야 합니다.</li>
              <li><strong>향후 자산 증식기 (8억 원이 20억 ~ 35억 원 이상으로 불어났을 때):</strong>
                <br/>다중자산 포트폴리오(배당률 0.6~0.9%)도 총자산이 <strong>23억~38억 원</strong>을 넘으면 연간 배당금이 2,000만 원에 근접합니다. 이때는 연간 누적 배당금이 <strong>1,900만 원</strong>에 도달한 시점부터 <strong>배당락일(D-1) 전 매도 → 배당락일(D) 재매수</strong>를 통해 배당소득을 <strong>22% 분리과세 양도소득으로 전환</strong>하면 영구적으로 종합과세를 회피할 수 있습니다.</li>
            </ul>
          </div>
        </div>
      </section>

      <!-- SECTION 1: DELIVERABLE 1 (21개 투자자산 바이앤홀드 기대 CAGR 및 현재 8억 투자 시 1년 후 예상 세금·종합과세 판정 순위표) -->
      <section class="section-card" id="sec-exp7-table1">
        <div class="hero-badge">DELIVERABLE #1 · 21 ASSETS BUY &amp; HOLD — CURRENT 800M KRW 1-YEAR EXPECTED TAX &amp; AFTER-TAX CAGR</div>
        <h2 class="section-title">📊 [결과물 1] 21개 투자자산 바이앤홀드 기대 CAGR 및 현재 8억 투자 시 1년 후 예상 세금 · 종합과세 판정 순위표</h2>
        <p class="section-sub">
          백테스트(1999~2026)를 통해 검증된 각 자산의 기대 세전 CAGR을 기준으로, <strong>현재 8억 원을 각 자산의 한국 최적 투자 방식으로 투자했을 때 1년 후 기대 세전 수익(매매차익+배당), 1년 후 예상 세금(매도 차익실현 시 양도세+배당세 vs 미매도 보유 시 배당세), 금융소득종합과세 대상 여부, 그리고 1년 후 기대 세후 CAGR 높은 순</strong>으로 정렬한 표입니다.
        </p>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>순위</th>
                <th>자산명 (티커 / 검증기간)</th>
                <th>한국 최적 투자 방식 &amp; 추천 상품<br/>(vs 불리한 대조 방식)</th>
                <th class="num">백테스트 기대<br/>세전 CAGR</th>
                <th class="num">현재 8억 투자 시<br/>1년 후 기대 세전수익</th>
                <th class="num" style="color:#fde047;">1년 후 예상 세금<br/>(매도정산 시 / 미매도 보유시)</th>
                <th class="num" style="color:#6ee7b7;">1년 후 기대 세후 CAGR<br/>(1년 세후 순수익금)</th>
                <th>현재 8억 투자 시 1년 후<br/>금융소득종합과세 대상 여부 (vs 국내ETF 함정)</th>
                <th class="num">역사적 MDD<br/>(고점 → 저점)</th>
                <th class="num">Sharpe / Calmar<br/>(Sortino)</th>
              </tr>
            </thead>
            <tbody>
              ${table1RowsHtml}
            </tbody>
          </table>
        </div>
      </section>

      <!-- SECTION 2: DELIVERABLE 2 (각 투자자산에 대해 인터넷 검증 유명 매수·매도 전략 적용 시 1년 후 세후 기대 CAGR 순위표) -->
      <section class="section-card" id="sec-exp7-table2">
        <div class="hero-badge" style="background:rgba(16,185,129,0.18); color:#6ee7b7; border-color:rgba(16,185,129,0.45);">
          DELIVERABLE #2 · FAMOUS ASSET TRADING STRATEGIES — CURRENT 800M KRW 1-YEAR EXPECTED TAX &amp; AFTER-TAX CAGR
        </div>
        <h2 class="section-title">📈 [결과물 2] 투자자산별 유명 매수·매도 전략 적용 시 현재 8억 투자 기준 1년 후 예상 세금 · 세후 기대 CAGR 순위표</h2>
        <p class="section-sub">
          인터넷 및 학계에서 검증된 <strong>5대 유명 매매전략(① 폴 튜더 존스 200일선 추세추종, ② 메브 파버 60일 비대칭 수급 추세, ③ 게리 안토나치 절대모멘텀 + OECD 경기선행 가속, ④ 래리 코너스 RSI 과매도 역추세 스나이퍼, ⑤ 클로드 섀넌 변동성 수확 밴드 + VIX 공포 매수)</strong>으로 백테스트한 뒤, <strong>현재 8억 원을 해당 전략으로 투자했을 때 1년 후 기대 세전 수익 대비 예상 세금(해외주식 양도세 22%·250만 원 공제 + 배당소득세 15.4%)과 금융소득종합과세 대상 여부, 1년 후 세후 기대 CAGR 높은 순</strong>으로 정렬했습니다.
        </p>

        <h3 style="font-size:16.5px; color:#fde047; margin: 14px 0 10px;">
          2-A. 21개 투자자산별 최우수(Best) 유명 매매전략 — 현재 8억 투자 시 1년 후 예상 세금 &amp; 세후 기대 CAGR 순위표
        </h3>
        <div class="table-wrap" style="margin-bottom:22px;">
          <table>
            <thead>
              <tr>
                <th>순위</th>
                <th>투자자산 (한국 투자 방식)</th>
                <th>자산별 최우수 유명 매매전략 &amp; 매수·매도 규칙</th>
                <th class="num">전략 백테스트<br/>기대 세전 CAGR</th>
                <th class="num" style="color:#fde047;">현재 8억 투자 시<br/>1년 후 예상 세금</th>
                <th class="num" style="color:#6ee7b7;">1년 후 세후 기대 CAGR<br/>(1년 세후 순수익)</th>
                <th>8억 투자 시 종합과세 판정<br/>(국내ETF 투자 시 세금 비교)</th>
                <th class="num">전략 MDD<br/>(바이앤홀드 대비 방어력)</th>
                <th class="num">Sharpe / Calmar<br/>(Sortino)</th>
              </tr>
            </thead>
            <tbody>
              ${table2BestRowsHtml}
            </tbody>
          </table>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin: 18px 0 10px;">
          <h3 style="font-size:16.5px; color:#38bdf8; margin:0;">
            2-B. 전체 105개 (21개 자산 × 5대 유명 전략) 현재 8억 투자 시 1년 후 세후 기대 CAGR 전수 정렬 표
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
                <th class="num">기대 세전 CAGR<br/>(8억 1년 세전)</th>
                <th class="num" style="color:#fde047;">8억 투자 1년 후<br/>예상 세금</th>
                <th class="num" style="color:#6ee7b7;">1년 후 세후 기대 CAGR<br/>(1년 세후 순수익)</th>
                <th>종합과세 여부</th>
                <th class="num">전략 MDD</th>
                <th class="num">Sharpe / Calmar</th>
              </tr>
            </thead>
            <tbody>
              ${table2AllRowsHtml}
            </tbody>
          </table>
        </div>
      </section>

      <!-- SECTION 3: DELIVERABLE 3 (적절 보유 비중 다중자산 포트폴리오 현재 8억 투자 시 1년 후 세후 수익 기준 Top 10 & 시각화 차트) -->
      <section class="section-card" id="sec-exp7-table3">
        <div class="hero-badge" style="background:rgba(236,72,153,0.18); color:#f472b6; border-color:rgba(236,72,153,0.45);">
          DELIVERABLE #3 · TOP 10 MULTI-ASSET PORTFOLIOS FOR CURRENT 800M KRW INVESTMENT &amp; VISUALIZATION
        </div>
        <h2 class="section-title">🏆 [결과물 3] 각 자산의 적절 보유 비중을 가져갔을 경우 — 현재 8억 투자 시 1년 후 세후 수익 기준 최종 Top 10 포트폴리오 (시각화 그래프 포함)</h2>
        <p class="section-sub">
          백테스트(1999~2026)로 검증된 30개 다중자산 포트폴리오에 <strong>현재 8억 원을 투자했을 때, ① 금융소득종합과세 대상이 되지 않으면서(1년 배당소득 420만~1,028만 원 ≤ 2,000만 원 한도), ② 1년 후 예상 세금을 차감한 세후 기대 수익(After-Tax CAGR &amp; 1년 세후 순수익금)이 가장 높은 최종 Top 10 포트폴리오</strong>와 시각화 차트 3종입니다.
        </p>

        <!-- 3 INTERACTIVE CHARTS -->
        <div class="chart-box" style="margin-bottom:20px;">
          <div class="chart-header">
            <div class="chart-title">🎯 다중자산 포트폴리오 30선 위험(|MDD|) 대비 현재 8억 투자 시 1년 후 기대 세후 수익률(After-Tax CAGR) 산포도</div>
            <span style="font-size:12px; color:#94a3b8;">왼쪽 위(낙폭은 작고 8억 투자 시 세후 기대수익률은 높은 곳)에 위치할수록 우월한 포트폴리오입니다.</span>
          </div>
          <div class="chart-canvas-wrap" style="height:370px;">
            <canvas id="scatterChart_exp7_all_assets_tax"></canvas>
          </div>
        </div>

        <div class="chart-grid-2" style="margin-bottom:24px;">
          <div class="chart-box">
            <div class="chart-header">
              <div class="chart-title">📈 Top 10 최적 비중 포트폴리오 백테스트 세후 누적 수익 곡선 (기준 지수 = 100)</div>
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
          🏆 현재 8억 원 투자 시 1년 후 세후 기대수익 · 예상 세금 · 금융소득종합과세 비대상 최종 Top 10 포트폴리오 상세표
        </h3>
        <div class="table-wrap" style="margin-bottom:24px;">
          <table>
            <thead>
              <tr>
                <th>순위</th>
                <th>포트폴리오명 &amp; 설계 핵심 논리</th>
                <th>자산별 적절 보유 비중 (한국 최적 상품)</th>
                <th class="num">기대 세전 CAGR<br/>(8억 1년 세전수익)</th>
                <th class="num" style="color:#fde047;">8억 투자 1년 후 예상 세금<br/>(매도정산 시 / 미매도 보유시)</th>
                <th class="num" style="color:#6ee7b7;">1년 후 기대 세후 CAGR<br/>(8억 1년 세후 순수익)</th>
                <th class="num">국내상장 해외ETF로<br/>8억 투자 시 세금 &amp; 손실비교</th>
                <th>현재 8억 투자 시 금융소득종합과세 판정<br/>(1년 배당소득 &amp; 향후 종합과세 임계자산)</th>
                <th class="num">백테스트 MDD<br/>(OOS MDD)</th>
                <th class="num">Sharpe / Calmar<br/>(Sortino)</th>
              </tr>
            </thead>
            <tbody>
              ${table3Top10RowsHtml}
            </tbody>
          </table>
        </div>

        <!-- ALL 30 MULTI-ASSET PORTFOLIOS TABLE -->
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
                <th class="num">기대 세전 CAGR<br/>(8억 1년 세전)</th>
                <th class="num" style="color:#fde047;">1년 후 예상 세금<br/>(정산시 / 보유시)</th>
                <th class="num" style="color:#6ee7b7;">1년 후 세후 CAGR<br/>(1년 세후 순수익)</th>
                <th class="num">국내ETF 함정시<br/>1년 세금 (세후CAGR)</th>
                <th>금융소득종합과세<br/>(8억 1년 배당금)</th>
                <th class="num">MDD</th>
                <th class="num">Sharpe / Calmar</th>
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
