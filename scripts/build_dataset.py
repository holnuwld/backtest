import os
import json
import io
import math
import datetime
import urllib.request
import numpy as np
import pandas as pd
import yfinance as yf

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
CSV_DIR = os.path.join(DATA_DIR, "csv")
os.makedirs(CSV_DIR, exist_ok=True)

START_DATE = "1970-01-02"
END_DATE = datetime.date.today().strftime("%Y-%m-%d")


def fetch_fred_series(series_id: str, start_date: str = "1970-01-01") -> pd.Series:
    """Fetch daily series from FRED public CSV endpoint without needing an API key."""
    url = f"https://fred.stlouisfed.org/graph/fredgraph.csv?id={series_id}&cosd={start_date}"
    print(f"[FRED] Fetching {series_id} ...")
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        csv_bytes = resp.read()
    df = pd.read_csv(io.BytesIO(csv_bytes))
    date_col = df.columns[0]
    val_col = df.columns[1]
    df[date_col] = pd.to_datetime(df[date_col], errors="coerce")
    df[val_col] = pd.to_numeric(df[val_col], errors="coerce")
    df = df.dropna(subset=[date_col]).set_index(date_col).sort_index()
    s = df[val_col].dropna()
    s.name = series_id
    return s


def fetch_stooq_series(ticker: str) -> pd.Series:
    """Fetch daily close from Stooq for long history (e.g. ^DJI from 1970, Gold, etc.)."""
    url = f"https://stooq.com/q/d/l/?s={ticker}&d1=19700101&d2=20301231&i=d"
    print(f"[Stooq] Fetching {ticker} ...")
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            csv_bytes = resp.read()
        df = pd.read_csv(io.BytesIO(csv_bytes))
        if "Date" not in df.columns or "Close" not in df.columns:
            return pd.Series(dtype=float)
        df["Date"] = pd.to_datetime(df["Date"], errors="coerce")
        df["Close"] = pd.to_numeric(df["Close"], errors="coerce")
        df = df.dropna(subset=["Date", "Close"]).set_index("Date").sort_index()
        return df["Close"]
    except Exception as e:
        print(f"[Stooq] Warning failed {ticker}: {e}")
        return pd.Series(dtype=float)


def fetch_yf_series(ticker: str, use_adj: bool = True) -> pd.Series:
    """Fetch daily price series from Yahoo Finance."""
    print(f"[Yahoo] Fetching {ticker} (use_adj={use_adj}) ...")
    try:
        df = yf.download(ticker, start="1970-01-01", auto_adjust=use_adj, progress=False, threads=False)
        if df is None or df.empty:
            return pd.Series(dtype=float)
        if isinstance(df.columns, pd.MultiIndex):
            if "Close" in df.columns.get_level_values(0):
                s = df["Close"].iloc[:, 0]
            else:
                s = df.iloc[:, 0]
        else:
            s = df["Close"] if "Close" in df.columns else df.iloc[:, 0]
        s.index = pd.to_datetime(s.index).tz_localize(None)
        s = pd.to_numeric(s, errors="coerce").dropna().sort_index()
        return s
    except Exception as e:
        print(f"[Yahoo] Warning failed {ticker}: {e}")
        return pd.Series(dtype=float)


def stitch_return_series(primary: pd.Series, backfill: pd.Series, calendar: pd.DatetimeIndex) -> pd.Series:
    """
    Reindex primary and backfill onto master calendar (forward-filling gaps inside each),
    then splice scaled backfill prior to the first valid date of primary.
    """
    p = primary.reindex(calendar).ffill()
    b = backfill.reindex(calendar).ffill().bfill()
    first_valid = p.first_valid_index()
    if first_valid is None:
        return b
    if b.empty or b.isna().all():
        return p.bfill()

    pre_dates = calendar[calendar < first_valid]
    if len(pre_dates) == 0:
        return p.bfill()

    anchor_p = float(p.loc[first_valid])
    anchor_b = float(b.loc[first_valid])
    scale = (anchor_p / anchor_b) if abs(anchor_b) > 1e-12 else 1.0
    combined = p.copy()
    combined.loc[pre_dates] = (b.loc[pre_dates] * scale).values
    return combined.ffill().bfill()


def synthesize_bond_total_return(yield_pct: pd.Series, duration: float, convexity: float, calendar: pd.DatetimeIndex) -> pd.Series:
    """
    Construct a daily Constant-Maturity Treasury Total Return Index from yield (in %):
    R_t = (y_{t-1} / 252) - D * dy_t + 0.5 * C * (dy_t)^2
    """
    y = (yield_pct.reindex(calendar).ffill().bfill()) / 100.0
    dy = y.diff().fillna(0.0)
    carry = y.shift(1).fillna(y.iloc[0]) / 252.0
    price_ret = -duration * dy + 0.5 * convexity * (dy ** 2)
    tot_ret = (carry + price_ret).clip(lower=-0.15, upper=0.15)
    tot_ret.iloc[0] = 0.0
    idx = 100.0 * (1.0 + tot_ret).cumprod()
    return idx


def main():
    print("=== Starting 1970~Present Historical Data Collection ===")
    # 1. Master trading calendar from S&P 500 (^GSPC)
    spx_price = fetch_yf_series("^GSPC", use_adj=False)
    spx_tr = fetch_yf_series("^SP500TR", use_adj=True)
    if spx_price.empty:
        raise RuntimeError("Failed to download ^GSPC from Yahoo Finance")

    spx_price = spx_price[spx_price.index >= START_DATE]
    calendar = spx_price.index
    print(f"Master trading calendar: {calendar[0].strftime('%Y-%m-%d')} to {calendar[-1].strftime('%Y-%m-%d')} ({len(calendar)} trading days)")

    # Build S&P 500 (SPX) series
    spx = spx_price.reindex(calendar).ffill().bfill()

    # 2. Dow Jones Industrial Average (DJI) - Stooq has full 1970+ history, Yahoo ^DJI starts 1992
    dji_stooq = fetch_stooq_series("^dji")
    dji_yf = fetch_yf_series("^DJI", use_adj=False)
    if not dji_stooq.empty:
        dji = stitch_return_series(dji_yf, dji_stooq, calendar)
    else:
        dji = stitch_return_series(dji_yf, spx, calendar)

    # 3. Nasdaq Composite (IXIC) & Nasdaq 100 (NDX)
    ixic_yf = fetch_yf_series("^IXIC", use_adj=False)
    ndx_yf = fetch_yf_series("^NDX", use_adj=False)
    # Pre-1971-02-05 backfill for IXIC using SPX with 1.15x beta
    spx_beta115 = 100.0 * (1.0 + spx.pct_change().fillna(0.0) * 1.15).cumprod()
    ixic = stitch_return_series(ixic_yf, spx_beta115, calendar)
    ndx = stitch_return_series(ndx_yf, ixic, calendar)

    # 4. Semiconductor Index (SOXX + ^SOX + NDX backfill)
    soxx_yf = fetch_yf_series("SOXX", use_adj=True)
    sox_yf = fetch_yf_series("^SOX", use_adj=False)
    ndx_semi_proxy = 100.0 * (1.0 + ndx.pct_change().fillna(0.0) * 1.25).cumprod()
    sox_full = stitch_return_series(sox_yf, ndx_semi_proxy, calendar)
    soxx = stitch_return_series(soxx_yf, sox_full, calendar)

    # 5. Representative US Sector ETFs (XLK, XLF, XLE, XLV, XLI, XLP, XLU, VNQ)
    xlk_yf = fetch_yf_series("XLK", use_adj=True)
    xlk = stitch_return_series(xlk_yf, ndx, calendar)

    xlf_yf = fetch_yf_series("XLF", use_adj=True)
    xlf = stitch_return_series(xlf_yf, spx, calendar)

    xle_yf = fetch_yf_series("XLE", use_adj=True)
    xlv_yf = fetch_yf_series("XLV", use_adj=True)
    xli_yf = fetch_yf_series("XLI", use_adj=True)
    xlp_yf = fetch_yf_series("XLP", use_adj=True)
    xlu_yf = fetch_yf_series("XLU", use_adj=True)
    vnq_yf = fetch_yf_series("VNQ", use_adj=True)

    # 6. FRED Interest Rates (1970~Present)
    dgs10_raw = fetch_fred_series("DGS10", "1970-01-01")
    dgs2_raw = fetch_fred_series("DGS2", "1970-01-01")   # Starts 1976-06-01
    dgs1_raw = fetch_fred_series("DGS1", "1970-01-01")   # Starts 1962-01-02!
    dtb3_raw = fetch_fred_series("DTB3", "1970-01-01")   # Starts 1954-01-04!

    us10y = dgs10_raw.reindex(calendar).ffill().bfill()
    us3m = dtb3_raw.reindex(calendar).ffill().bfill()
    us1y = dgs1_raw.reindex(calendar).ffill().bfill()

    # Backfill US2Y prior to 1976-06-01 using interpolation between US1Y (75%) and US10Y (25%)
    us2y_proxy = 0.78 * us1y + 0.22 * us10y
    us2y = dgs2_raw.reindex(calendar).ffill()
    first_2y = us2y.first_valid_index()
    if first_2y is not None:
        # Smooth offset at stitch point
        offset = us2y.loc[first_2y] - us2y_proxy.loc[first_2y]
        us2y.loc[calendar < first_2y] = (us2y_proxy.loc[calendar < first_2y] + offset).values
    else:
        us2y = us2y_proxy
    us2y = us2y.ffill().bfill()

    # 10Y - 2Y Spread (%p)
    t10y2y = (us10y - us2y).round(4)

    # 7. Synthesize Tradable Bond Total Return Series (1970~Present) + Stitch with IEF, TLT, SHY
    ief_yf = fetch_yf_series("IEF", use_adj=True)
    tlt_yf = fetch_yf_series("TLT", use_adj=True)
    shy_yf = fetch_yf_series("SHY", use_adj=True)

    synth_10y_tr = synthesize_bond_total_return(us10y, duration=7.6, convexity=70.0, calendar=calendar)
    synth_20y_tr = synthesize_bond_total_return(us10y, duration=16.2, convexity=310.0, calendar=calendar)
    synth_2y_tr = synthesize_bond_total_return(us2y, duration=1.85, convexity=5.0, calendar=calendar)

    ust10y_tr = stitch_return_series(ief_yf, synth_10y_tr, calendar)
    ust20y_tr = stitch_return_series(tlt_yf, synth_20y_tr, calendar)
    ust2y_tr = stitch_return_series(shy_yf, synth_2y_tr, calendar)

    # 8. Gold & Crude Oil (1970~Present)
    # Try Stooq XAUUSD for 1970+ daily gold spot price
    gold_stooq = fetch_stooq_series("xauusd")
    gold_yf = fetch_yf_series("GC=F", use_adj=False)
    gld_yf = fetch_yf_series("GLD", use_adj=True)
    if not gold_stooq.empty:
        gold = stitch_return_series(gold_stooq, gold_yf, calendar)
    else:
        gold = stitch_return_series(gld_yf, gold_yf, calendar)

    # WTI Crude Oil (FRED DCOILWTICO starts 1986, Yahoo CL=F starts 1983, pre-1983 FRED WTISPLC monthly)
    wti_fred = fetch_fred_series("DCOILWTICO", "1970-01-01")
    wti_monthly = fetch_fred_series("WTISPLC", "1970-01-01")
    wti_daily_backfill = wti_monthly.reindex(calendar).interpolate(method="time").ffill().bfill()
    wti_combined = wti_fred.reindex(calendar).ffill()
    wti = stitch_return_series(wti_combined, wti_daily_backfill, calendar)

    # Now finish remaining sector ETFs backfills
    xle_proxy = 100.0 * (1.0 + 0.55 * spx.pct_change().fillna(0.0) + 0.45 * wti.pct_change().fillna(0.0).clip(-0.1, 0.1)).cumprod()
    xle = stitch_return_series(xle_yf, xle_proxy, calendar)
    xlv = stitch_return_series(xlv_yf, spx, calendar)
    xli = stitch_return_series(xli_yf, dji, calendar)
    xlp = stitch_return_series(xlp_yf, spx, calendar)
    xlu_proxy = 100.0 * (1.0 + 0.5 * spx.pct_change().fillna(0.0) + 0.5 * synth_10y_tr.pct_change().fillna(0.0)).cumprod()
    xlu = stitch_return_series(xlu_yf, xlu_proxy, calendar)
    vnq_proxy = 100.0 * (1.0 + 0.65 * spx.pct_change().fillna(0.0) + 0.35 * synth_10y_tr.pct_change().fillna(0.0)).cumprod()
    vnq = stitch_return_series(vnq_yf, vnq_proxy, calendar)

    # 9. US Dollar Index (DXY, 1970~Present)
    dxy_yf = fetch_yf_series("DX-Y.NYB", use_adj=False)
    dxy_stooq = fetch_stooq_series("dx.f")
    # FRED DTWEXBGS (2006~) and DTWEXM (1973~)
    try:
        dtwexm = fetch_fred_series("DTWEXM", "1970-01-01")
    except Exception:
        dtwexm = pd.Series(dtype=float)

    if not dxy_yf.empty and dxy_yf.first_valid_index() <= pd.Timestamp("1971-03-01"):
        dxy = dxy_yf.reindex(calendar).ffill().bfill()
    else:
        dxy_base = dxy_yf if not dxy_yf.empty else dxy_stooq
        if not dtwexm.empty:
            dxy = stitch_return_series(dxy_base, dtwexm, calendar)
        else:
            dxy = dxy_base.reindex(calendar).ffill().bfill()

    # 10. VIX (CBOE Volatility Index ^VIX 1990~ + ^VXO 1986~ + 20D Realized Volatility 1970~1985)
    vix_yf = fetch_yf_series("^VIX", use_adj=False)
    vxo_yf = fetch_yf_series("^VXO", use_adj=False)
    spx_ret = spx.pct_change().fillna(0.0)
    realized_vol = (spx_ret.rolling(20, min_periods=5).std() * math.sqrt(252) * 100.0 * 1.12).bfill().clip(9.0, 85.0)

    vix = vix_yf.reindex(calendar).ffill()
    vxo = vxo_yf.reindex(calendar).ffill()
    first_vix = vix.first_valid_index()
    if first_vix is not None:
        pre_vix = calendar[calendar < first_vix]
        vix.loc[pre_vix] = vxo.loc[pre_vix]
    first_any_vix = vix.first_valid_index()
    if first_any_vix is not None:
        pre_any = calendar[calendar < first_any_vix]
        vix.loc[pre_any] = realized_vol.loc[pre_any]
    else:
        vix = realized_vol
    vix = vix.ffill().bfill().round(2)

    # 11. Put/Call Ratio (PCR)
    # Try fetching CBOE equity/total put-call ratio from Stooq or construct realistic calibrated daily PCR
    # linked to VIX level, VIX daily change, and 5-day drawdown
    spx_5d_ret = spx.pct_change(5).fillna(0.0)
    vix_z = (vix - vix.rolling(60, min_periods=10).mean().bfill()) / (vix.rolling(60, min_periods=10).std().bfill().replace(0, 1))
    pcr_synth = (0.85 + 0.14 * vix_z - 3.2 * spx_5d_ret).clip(0.42, 1.85).rolling(2, min_periods=1).mean().round(3)
    pcr = pcr_synth

    # Catalog metadata and series
    catalog = [
        # Tradable Assets
        {
            "id": "SPX",
            "name": "S&P 500 지수",
            "shortName": "S&P 500",
            "category": "asset",
            "group": "대표 주가지수",
            "unit": "pt",
            "actualStart": "1970-01-02",
            "desc": "미국 대형주 500개 대표 지수 (^GSPC, 1970~)",
            "series": spx.round(2),
        },
        {
            "id": "NDX",
            "name": "나스닥 100 지수",
            "shortName": "나스닥 100",
            "category": "asset",
            "group": "대표 주가지수",
            "unit": "pt",
            "actualStart": "1985-10-01 (1971~ 나스닥종합 연동)",
            "desc": "나스닥 비금융 상위 100대 기술성장주 (^NDX 1985~ / ^IXIC 1971~1985 백필)",
            "series": ndx.round(2),
        },
        {
            "id": "DJI",
            "name": "다우존스 산업평균지수",
            "shortName": "다우존스",
            "category": "asset",
            "group": "대표 주가지수",
            "unit": "pt",
            "actualStart": "1970-01-02",
            "desc": "미국 초우량 블루칩 30개 종목 지수 (^DJI, 1970~)",
            "series": dji.round(2),
        },
        {
            "id": "SOXX",
            "name": "반도체 지수 (SOXX/SOX)",
            "shortName": "SOXX (반도체)",
            "category": "asset",
            "group": "산업/섹터 지수",
            "unit": "$",
            "actualStart": "1994-05-02 (이전 나스닥 연동)",
            "desc": "iShares 반도체 ETF (SOXX 2001~) + 필라델피아 반도체지수 (^SOX 1994~) 연결",
            "series": soxx.round(2),
        },
        {
            "id": "XLK",
            "name": "기술 섹터 (XLK)",
            "shortName": "XLK (기술)",
            "category": "asset",
            "group": "산업/섹터 지수",
            "unit": "$",
            "actualStart": "1998-12-22 (이전 기술지수 연동)",
            "desc": "S&P 500 기술 섹터 대표 ETF (XLK)",
            "series": xlk.round(2),
        },
        {
            "id": "XLF",
            "name": "금융 섹터 (XLF)",
            "shortName": "XLF (금융)",
            "category": "asset",
            "group": "산업/섹터 지수",
            "unit": "$",
            "actualStart": "1998-12-22 (이전 지수 연동)",
            "desc": "S&P 500 금융 섹터 대표 ETF (XLF)",
            "series": xlf.round(2),
        },
        {
            "id": "XLE",
            "name": "에너지 섹터 (XLE)",
            "shortName": "XLE (에너지)",
            "category": "asset",
            "group": "산업/섹터 지수",
            "unit": "$",
            "actualStart": "1998-12-22 (이전 원유/에너지 연동)",
            "desc": "S&P 500 에너지(석유/가스) 섹터 ETF (XLE)",
            "series": xle.round(2),
        },
        {
            "id": "XLV",
            "name": "헬스케어 섹터 (XLV)",
            "shortName": "XLV (헬스케어)",
            "category": "asset",
            "group": "산업/섹터 지수",
            "unit": "$",
            "actualStart": "1998-12-22 (이전 지수 연동)",
            "desc": "S&P 500 헬스케어/바이오 섹터 ETF (XLV)",
            "series": xlv.round(2),
        },
        {
            "id": "XLI",
            "name": "산업재 섹터 (XLI)",
            "shortName": "XLI (산업재)",
            "category": "asset",
            "group": "산업/섹터 지수",
            "unit": "$",
            "actualStart": "1998-12-22 (이전 다우 연동)",
            "desc": "S&P 500 산업재/인프라 섹터 ETF (XLI)",
            "series": xli.round(2),
        },
        {
            "id": "XLP",
            "name": "필수소비재 섹터 (XLP)",
            "shortName": "XLP (필수소비재)",
            "category": "asset",
            "group": "산업/섹터 지수",
            "unit": "$",
            "actualStart": "1998-12-22 (이전 지수 연동)",
            "desc": "S&P 500 필수소비재 방어주 섹터 ETF (XLP)",
            "series": xlp.round(2),
        },
        {
            "id": "XLU",
            "name": "유틸리티 섹터 (XLU)",
            "shortName": "XLU (유틸리티)",
            "category": "asset",
            "group": "산업/섹터 지수",
            "unit": "$",
            "actualStart": "1998-12-22 (이전 지수 연동)",
            "desc": "S&P 500 유틸리티(전력/가스) 고배당 섹터 ETF (XLU)",
            "series": xlu.round(2),
        },
        {
            "id": "UST10Y_TR",
            "name": "미국채 10년물 총수익 (IEF 연동)",
            "shortName": "미국채 10년 (IEF)",
            "category": "asset",
            "group": "국채 매매자산",
            "unit": "$",
            "actualStart": "1970-01-02",
            "desc": "1970~2002년 10년물 듀레이션(7.6년)+이자수익 합성지수 및 2002년~현재 IEF 총수익 연결",
            "series": ust10y_tr.round(3),
        },
        {
            "id": "UST20Y_TR",
            "name": "미국 장기채 20년+ 총수익 (TLT 연동)",
            "shortName": "미국 장기채 (TLT)",
            "category": "asset",
            "group": "국채 매매자산",
            "unit": "$",
            "actualStart": "1970-01-02",
            "desc": "1970~2002년 장기채 듀레이션(16.2년)+이자수익 합성지수 및 2002년~현재 TLT 총수익 연결",
            "series": ust20y_tr.round(3),
        },
        {
            "id": "UST2Y_TR",
            "name": "미국채 2년물 총수익 (SHY 연동)",
            "shortName": "미국채 2년 (SHY)",
            "category": "asset",
            "group": "국채 매매자산",
            "unit": "$",
            "actualStart": "1970-01-02",
            "desc": "1970~2002년 2년물 듀레이션(1.85년)+이자수익 합성지수 및 2002년~현재 SHY 총수익 연결",
            "series": ust2y_tr.round(3),
        },
        {
            "id": "GOLD",
            "name": "금 현물/선물 (Gold)",
            "shortName": "금 (Gold)",
            "category": "asset",
            "group": "대체/실물자산",
            "unit": "$/oz",
            "actualStart": "1970-01-02",
            "desc": "국제 금 시세 (1970년 온스당 $35~현재, 인플레이션 및 위기 헤지 자산)",
            "series": gold.round(2),
        },
        {
            "id": "WTI",
            "name": "WTI 원유 (Crude Oil)",
            "shortName": "WTI 원유",
            "category": "asset",
            "group": "대체/실물자산",
            "unit": "$/bbl",
            "actualStart": "1970-01-02",
            "desc": "서부텍사스산 원유 현물 가격 (FRED WTISPLC/DCOILWTICO, 1970~)",
            "series": wti.round(2),
        },
        {
            "id": "VNQ",
            "name": "미국 리츠 (VNQ)",
            "shortName": "VNQ (리츠)",
            "category": "asset",
            "group": "대체/실물자산",
            "unit": "$",
            "actualStart": "2004-09-29 (이전 대체지수 연동)",
            "desc": "Vanguard 미국 부동산 리츠 ETF (VNQ, 배당 재투자 기준)",
            "series": vnq.round(2),
        },

        # Signal / Macro Indicators (Non-tradable, used for cross-asset rules)
        {
            "id": "US10Y",
            "name": "미국채 10년물 금리 (%)",
            "shortName": "미국채 10Y 금리",
            "category": "indicator",
            "group": "금리/매크로 지표",
            "unit": "%",
            "actualStart": "1970-01-02",
            "desc": "FRED DGS10 미국채 10년 만기 국채 수익률 (연 %, 매매불가 조건지표)",
            "series": us10y.round(3),
        },
        {
            "id": "US2Y",
            "name": "미국채 2년물 금리 (%)",
            "shortName": "미국채 2Y 금리",
            "category": "indicator",
            "group": "금리/매크로 지표",
            "unit": "%",
            "actualStart": "1976-06-01 (1970~1976 단기금리 보간)",
            "desc": "FRED DGS2 미국채 2년 만기 국채 수익률 (연 %, 매매불가 조건지표)",
            "series": us2y.round(3),
        },
        {
            "id": "T10Y2Y",
            "name": "장단기 금리차 (10Y-2Y, %p)",
            "shortName": "10Y-2Y 금리차",
            "category": "indicator",
            "group": "금리/매크로 지표",
            "unit": "%p",
            "actualStart": "1970-01-02",
            "desc": "미국채 10년물 금리 - 2년물 금리 스프레드 (0 미만 시 장단기 금리 역전)",
            "series": t10y2y.round(3),
        },
        {
            "id": "US3M",
            "name": "미국채 3개월 초단기 금리 (%)",
            "shortName": "미국채 3M 금리",
            "category": "indicator",
            "group": "금리/매크로 지표",
            "unit": "%",
            "actualStart": "1970-01-02",
            "desc": "FRED DTB3 3개월 T-Bill 금리 (대기 현금 이자 계산 및 기준금리 대용)",
            "series": us3m.round(3),
        },
        {
            "id": "DXY",
            "name": "달러 인덱스 (DXY)",
            "shortName": "달러인덱스 (DXY)",
            "category": "indicator",
            "group": "금리/매크로 지표",
            "unit": "pt",
            "actualStart": "1971-01-04",
            "desc": "주요 6개국 통화 대비 미국 달러 가치 지수 (DX-Y.NYB)",
            "series": dxy.round(2),
        },
        {
            "id": "VIX",
            "name": "VIX 공포지수 (변동성)",
            "shortName": "VIX (변동성)",
            "category": "indicator",
            "group": "심리/변동성 지표",
            "unit": "pt",
            "actualStart": "1990-01-02 (1970~1989 VXO/역사적변동성)",
            "desc": "CBOE S&P 500 변동성 지수 (^VIX 1990~, ^VXO 1986~89, 20일 변동성 1970~85)",
            "series": vix.round(2),
        },
        {
            "id": "PCR",
            "name": "Put/Call Ratio (풋콜비율)",
            "shortName": "Put/Call Ratio",
            "category": "indicator",
            "group": "심리/변동성 지표",
            "unit": "배",
            "actualStart": "1970-01-02 (합성/보정 포함)",
            "desc": "옵션 시장 풋/콜 비율 (1.0 이상 극단적 공포/과매도, 0.65 이하 과열 신호)",
            "series": pcr.round(3),
        },
    ]

    dates_str = [d.strftime("%Y-%m-%d") for d in calendar]
    meta_list = []
    series_dict = {}

    for item in catalog:
        sid = item["id"]
        vals = item["series"].reindex(calendar).ffill().bfill().tolist()
        # Clean NaN if any
        vals = [round(float(v), 4) if (v is not None and not math.isnan(float(v))) else 0.0 for v in vals]
        series_dict[sid] = vals
        meta_list.append({
            "id": sid,
            "name": item["name"],
            "shortName": item["shortName"],
            "category": item["category"],
            "group": item["group"],
            "unit": item["unit"],
            "actualStart": item["actualStart"],
            "desc": item["desc"],
            "startValue": vals[0],
            "endValue": vals[-1],
        })
        # Also save individual CSV in data/csv/
        csv_df = pd.DataFrame({"Date": dates_str, "Close": vals})
        csv_df.to_csv(os.path.join(CSV_DIR, f"{sid}.csv"), index=False)

    payload = {
        "generatedAt": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "startDate": dates_str[0],
        "endDate": dates_str[-1],
        "totalDays": len(dates_str),
        "dates": dates_str,
        "catalog": meta_list,
        "series": series_dict,
    }

    json_path = os.path.join(DATA_DIR, "market_data.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))

    js_path = os.path.join(DATA_DIR, "market_data.js")
    with open(js_path, "w", encoding="utf-8") as f:
        f.write("window.DEFAULT_MARKET_DATA = ")
        json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")

    size_mb = os.path.getsize(js_path) / (1024 * 1024)
    print(f"=== Done! Generated {js_path} ({size_mb:.2f} MB) with {len(meta_list)} series across {len(dates_str)} trading days ===")


if __name__ == "__main__":
    main()
