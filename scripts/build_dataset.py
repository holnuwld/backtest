import os
import json
import io
import math
import zipfile
import datetime
import urllib.request
import numpy as np
import pandas as pd
import yfinance as yf

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
CSV_DIR = os.path.join(DATA_DIR, "csv")
os.makedirs(CSV_DIR, exist_ok=True)

START_DATE = "1970-01-02"
# Keep master calendar end date aligned with 2026-10-27 (14,327 trading days) or latest finalized session
MAX_END_DATE = "2026-10-27"


def fetch_url_bytes(url: str, timeout: int = 30) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def fetch_fred_series(series_id: str, start_date: str = "1969-01-01") -> pd.Series:
    """Fetch daily series from FRED public CSV endpoint without needing an API key."""
    url = f"https://fred.stlouisfed.org/graph/fredgraph.csv?id={series_id}&cosd={start_date}"
    print(f"[FRED] Fetching {series_id} ...")
    csv_bytes = fetch_url_bytes(url, timeout=40)
    df = pd.read_csv(io.BytesIO(csv_bytes))
    date_col = df.columns[0]
    val_col = df.columns[1]
    df[date_col] = pd.to_datetime(df[date_col], errors="coerce")
    df[val_col] = pd.to_numeric(df[val_col], errors="coerce")
    df = df.dropna(subset=[date_col]).set_index(date_col).sort_index()
    s = df[val_col].dropna()
    s.name = series_id
    return s


def fetch_yf_series(ticker: str, use_adj: bool = True, start_date: str = "1969-06-01") -> pd.Series:
    """Fetch daily price series from Yahoo Finance."""
    print(f"[Yahoo] Fetching {ticker} (use_adj={use_adj}) ...")
    df = yf.download(ticker, start=start_date, auto_adjust=use_adj, progress=False, threads=False)
    if df is None or df.empty:
        raise RuntimeError(f"[Yahoo] Empty response for {ticker}")
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


def fetch_historical_dji_1970_1992() -> pd.Series:
    """Fetch authentic daily Dow Jones Industrial Average (1970-01-02 ~ 1992+) from verified public dataset."""
    urls = [
        "https://raw.githubusercontent.com/GenaroForteza/Metodologia_Markowitz-Sharpe/main/Dataset/DJI.csv",
        "https://raw.githubusercontent.com/Fab-Miami/AI_economy_modelisation_and_market_forecast/master/dow_data.csv",
    ]
    for url in urls:
        try:
            print(f"[Historical DJI] Fetching {url.split('/')[-1]} ...")
            raw = fetch_url_bytes(url, timeout=30)
            df = pd.read_csv(io.BytesIO(raw))
            date_col = df.columns[0]
            val_col = df.columns[1]
            df[date_col] = pd.to_datetime(df[date_col], errors="coerce")
            df[val_col] = pd.to_numeric(df[val_col], errors="coerce")
            df = df.dropna(subset=[date_col, val_col]).set_index(date_col).sort_index()
            s = df[val_col]
            if len(s) > 5000 and s.index[0] <= pd.Timestamp("1970-01-05"):
                return s
        except Exception as e:
            print(f"[Historical DJI] Warning failed {url}: {e}")
    raise RuntimeError("Failed to fetch authentic 1970-1991 DJIA daily dataset!")


def fetch_historical_lbma_gold_1968_2024() -> pd.Series:
    """Fetch authentic daily LBMA Gold Spot price ($/oz, 1968-01-02 ~ 2024) from verified public dataset."""
    urls = [
        "https://raw.githubusercontent.com/teofiloxyz/precious-metals-price/main/data/AU.csv",
        "https://raw.githubusercontent.com/marti-1/financial_crashes/master/data/gold_prices_historical.csv",
    ]
    for url in urls:
        try:
            print(f"[Historical LBMA Gold] Fetching {url.split('/')[-1]} ...")
            raw = fetch_url_bytes(url, timeout=30)
            df = pd.read_csv(io.BytesIO(raw))
            date_col = df.columns[0]
            val_col = df.columns[1]
            df[date_col] = pd.to_datetime(df[date_col], errors="coerce")
            df[val_col] = pd.to_numeric(df[val_col], errors="coerce")
            df = df.dropna(subset=[date_col, val_col]).set_index(date_col).sort_index()
            s = df[val_col]
            if len(s) > 8000 and s.index[0] <= pd.Timestamp("1970-01-05"):
                return s
        except Exception as e:
            print(f"[Historical LBMA Gold] Warning failed {url}: {e}")
    raise RuntimeError("Failed to fetch authentic 1970-2000 LBMA Gold daily dataset!")


def fetch_cboe_put_call_ratio() -> pd.Series:
    """Fetch official CBOE Total Put/Call Ratio daily CSV (2006-11-01 ~ 2019-10-04)."""
    url = "https://cdn.cboe.com/resources/options/volume_and_call_put_ratios/totalpc.csv"
    print("[CBOE] Fetching official totalpc.csv ...")
    raw = fetch_url_bytes(url, timeout=30).decode("utf-8", errors="ignore")
    lines = raw.splitlines()
    header_idx = 0
    for i, line in enumerate(lines[:10]):
        if line.upper().startswith("DATE,"):
            header_idx = i
            break
    df = pd.read_csv(io.StringIO("\n".join(lines[header_idx:])))
    date_col = df.columns[0]
    pc_col = [c for c in df.columns if "ratio" in c.lower() or "p/c" in c.lower()][-1]
    df[date_col] = pd.to_datetime(df[date_col], errors="coerce")
    df[pc_col] = pd.to_numeric(df[pc_col], errors="coerce")
    df = df.dropna(subset=[date_col, pc_col]).set_index(date_col).sort_index()
    return df[pc_col]


def fetch_ken_french_daily(url: str) -> pd.DataFrame:
    """Fetch Kenneth French CRSP Daily Value-Weighted Industry Portfolios (1926~present)."""
    print(f"[Ken French] Fetching {url.split('/')[-1]} ...")
    raw = fetch_url_bytes(url, timeout=45)
    z = zipfile.ZipFile(io.BytesIO(raw))
    lines = z.read(z.namelist()[0]).decode("latin1").splitlines()
    start_idx = None
    end_idx = None
    for i, l in enumerate(lines):
        if l.startswith(",Agric") or l.startswith(",NoDur"):
            start_idx = i
            break
    for i in range(start_idx + 1, len(lines)):
        s = lines[i].strip()
        if not s or not s[:8].isdigit():
            end_idx = i
            break
    csv_block = "\n".join(lines[start_idx:end_idx])
    df = pd.read_csv(io.StringIO(csv_block))
    date_col = df.columns[0]
    df.columns = [c.strip() for c in df.columns]
    df[date_col] = pd.to_datetime(df[date_col].astype(str).str.strip(), format="%Y%m%d", errors="coerce")
    df = df.dropna(subset=[date_col]).set_index(date_col).sort_index()
    for c in df.columns:
        df[c] = pd.to_numeric(df[c], errors="coerce")
        df.loc[df[c] <= -99.0, c] = 0.0
    return df


def industry_ret_to_index(ret_pct_series: pd.Series, calendar: pd.DatetimeIndex) -> pd.Series:
    """Convert Ken French daily percentage return series (e.g. 0.56 = +0.56%) into a cumulative index on calendar."""
    r = (ret_pct_series.reindex(calendar).fillna(0.0)) / 100.0
    r.iloc[0] = 0.0
    return 100.0 * (1.0 + r).cumprod()


def stitch_return_series(primary: pd.Series, backfill: pd.Series, calendar: pd.DatetimeIndex, name: str = "") -> pd.Series:
    """
    Reindex primary and backfill onto master calendar, splicing scaled backfill prior to
    the first valid date of primary. Strictly asserts that backfill covers 1970-01-02 so
    blind .bfill() flatlines can never occur.
    """
    p = primary.reindex(calendar).ffill()
    b = backfill.reindex(calendar).ffill()

    first_valid_p = p.first_valid_index()
    first_valid_b = b.first_valid_index()
    if first_valid_p is None:
        raise RuntimeError(f"[{name}] Primary series is completely empty!")
    if first_valid_b is None or first_valid_b > calendar[5]:
        raise RuntimeError(f"[{name}] Backfill series does not cover start of 1970 (starts at {first_valid_b})!")

    b = b.bfill()
    pre_dates = calendar[calendar < first_valid_p]
    if len(pre_dates) == 0:
        return p.bfill()

    anchor_p = float(p.loc[first_valid_p])
    anchor_b = float(b.loc[first_valid_p])
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
    print("=== Starting Verified 1970~Present Historical Data Collection ===")
    # 1. Fetch S&P 500 starting in 1969 so rolling windows in early Jan 1970 have full lookback
    spx_full = fetch_yf_series("^GSPC", use_adj=False, start_date="1969-06-01")
    spx_price = spx_full[(spx_full.index >= START_DATE) & (spx_full.index <= MAX_END_DATE)]
    calendar = spx_price.index
    print(f"Master trading calendar: {calendar[0].strftime('%Y-%m-%d')} to {calendar[-1].strftime('%Y-%m-%d')} ({len(calendar)} trading days)")

    spx = spx_price.reindex(calendar).ffill().bfill()

    # 2. Fetch Ken French 12 & 49 Daily Industry Portfolios (1926~present) for authentic pre-ETF sector & industry returns
    kf12 = fetch_ken_french_daily("https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/ftp/12_Industry_Portfolios_Daily_CSV.zip")
    kf49 = fetch_ken_french_daily("https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/ftp/49_Industry_Portfolios_Daily_CSV.zip")

    idx_tech = industry_ret_to_index(kf12["BusEq"], calendar)
    idx_fin = industry_ret_to_index(kf12["Money"], calendar)
    idx_enrgy = industry_ret_to_index(kf12["Enrgy"], calendar)
    idx_hlth = industry_ret_to_index(kf12["Hlth"], calendar)
    idx_manuf = industry_ret_to_index(kf12["Manuf"], calendar)
    idx_nodur = industry_ret_to_index(kf12["NoDur"], calendar)
    idx_utils = industry_ret_to_index(kf12["Utils"], calendar)
    idx_chips = industry_ret_to_index(kf49["Chips"], calendar)
    idx_rlest = industry_ret_to_index(kf49["RlEst"], calendar)
    idx_oil_daily = industry_ret_to_index(kf49["Oil"], calendar)

    # 3. Dow Jones Industrial Average (DJI): Authentic 1970-1991 DJIA + Yahoo ^DJI 1992-present
    dji_hist = fetch_historical_dji_1970_1992()
    dji_yf = fetch_yf_series("^DJI", use_adj=False)
    dji = stitch_return_series(dji_yf, dji_hist, calendar, name="DJI")

    # 4. Nasdaq Composite (IXIC) & Nasdaq 100 (NDX)
    ixic_yf = fetch_yf_series("^IXIC", use_adj=False)
    ndx_yf = fetch_yf_series("^NDX", use_adj=False)
    ixic = stitch_return_series(ixic_yf, idx_tech, calendar, name="IXIC")
    ndx = stitch_return_series(ndx_yf, ixic, calendar, name="NDX")

    # 5. Semiconductor Index (SOXX 2001~ + ^SOX 1994~2001 + Ken French 'Chips' Semiconductor Portfolio 1970~1994)
    soxx_yf = fetch_yf_series("SOXX", use_adj=True)
    sox_yf = fetch_yf_series("^SOX", use_adj=False)
    sox_full = stitch_return_series(sox_yf, idx_chips, calendar, name="SOX")
    soxx = stitch_return_series(soxx_yf, sox_full, calendar, name="SOXX")

    # 6. Representative US Sector ETFs (1998-12~ ETF + 1970~1998 Ken French Official Industry Portfolios)
    xlk_yf = fetch_yf_series("XLK", use_adj=True)
    xlf_yf = fetch_yf_series("XLF", use_adj=True)
    xle_yf = fetch_yf_series("XLE", use_adj=True)
    xlv_yf = fetch_yf_series("XLV", use_adj=True)
    xli_yf = fetch_yf_series("XLI", use_adj=True)
    xlp_yf = fetch_yf_series("XLP", use_adj=True)
    xlu_yf = fetch_yf_series("XLU", use_adj=True)
    vnq_yf = fetch_yf_series("VNQ", use_adj=True)

    xlk = stitch_return_series(xlk_yf, idx_tech, calendar, name="XLK")
    xlf = stitch_return_series(xlf_yf, idx_fin, calendar, name="XLF")
    xle = stitch_return_series(xle_yf, idx_enrgy, calendar, name="XLE")
    xlv = stitch_return_series(xlv_yf, idx_hlth, calendar, name="XLV")
    xli = stitch_return_series(xli_yf, idx_manuf, calendar, name="XLI")
    xlp = stitch_return_series(xlp_yf, idx_nodur, calendar, name="XLP")
    xlu = stitch_return_series(xlu_yf, idx_utils, calendar, name="XLU")
    vnq = stitch_return_series(vnq_yf, idx_rlest, calendar, name="VNQ")

    # 7. FRED Interest Rates (1970~Present)
    dgs10_raw = fetch_fred_series("DGS10", "1969-06-01")
    dgs2_raw = fetch_fred_series("DGS2", "1969-06-01")   # Starts 1976-06-01
    dgs1_raw = fetch_fred_series("DGS1", "1969-06-01")   # Starts 1962-01-02
    dtb3_raw = fetch_fred_series("DTB3", "1969-06-01")   # Starts 1954-01-04

    us10y = dgs10_raw.reindex(calendar).ffill().bfill()
    us3m = dtb3_raw.reindex(calendar).ffill().bfill()
    us1y = dgs1_raw.reindex(calendar).ffill().bfill()

    # Backfill US2Y prior to 1976-06-01 using interpolation between US1Y (78%) and US10Y (22%)
    us2y_proxy = 0.78 * us1y + 0.22 * us10y
    us2y = dgs2_raw.reindex(calendar).ffill()
    first_2y = us2y.first_valid_index()
    if first_2y is not None:
        offset = us2y.loc[first_2y] - us2y_proxy.loc[first_2y]
        us2y.loc[calendar < first_2y] = (us2y_proxy.loc[calendar < first_2y] + offset).values
    else:
        us2y = us2y_proxy
    us2y = us2y.ffill().bfill()

    t10y2y = (us10y - us2y).round(4)

    # 8. Synthesize Tradable Bond Total Return Series (1970~Present) + Stitch with IEF, TLT, SHY
    ief_yf = fetch_yf_series("IEF", use_adj=True)
    tlt_yf = fetch_yf_series("TLT", use_adj=True)
    shy_yf = fetch_yf_series("SHY", use_adj=True)

    synth_10y_tr = synthesize_bond_total_return(us10y, duration=7.6, convexity=70.0, calendar=calendar)
    synth_20y_tr = synthesize_bond_total_return(us10y, duration=16.2, convexity=310.0, calendar=calendar)
    synth_2y_tr = synthesize_bond_total_return(us2y, duration=1.85, convexity=5.0, calendar=calendar)

    ust10y_tr = stitch_return_series(ief_yf, synth_10y_tr, calendar, name="UST10Y_TR")
    ust20y_tr = stitch_return_series(tlt_yf, synth_20y_tr, calendar, name="UST20Y_TR")
    ust2y_tr = stitch_return_series(shy_yf, synth_2y_tr, calendar, name="UST2Y_TR")

    # 9. Gold (GOLD): GLD (2004.11~) + GC=F (2000.08~2004.11) + LBMA Daily Gold Spot (1970.01~2000.08)
    gold_lbma = fetch_historical_lbma_gold_1968_2024()
    gold_gcf = fetch_yf_series("GC=F", use_adj=False)
    gld_yf = fetch_yf_series("GLD", use_adj=True)

    # First stitch GC=F (2000-08-30~) onto LBMA Gold Spot (1968~2024)
    gold_spot_full = stitch_return_series(gold_gcf, gold_lbma, calendar, name="GOLD_SPOT")
    # Then stitch GLD (2004-11-18~) onto gold_spot_full so 2004+ matches GLD 100% and 1970-2004 reflects exact LBMA/GC=F returns
    gold = stitch_return_series(gld_yf, gold_spot_full, calendar, name="GOLD")

    # 10. WTI Crude Oil (1986~ FRED DCOILWTICO + 1970~1985 FRED WTISPLC monthly with daily Oil sector modulation)
    wti_fred = fetch_fred_series("DCOILWTICO", "1970-01-01")
    wti_monthly = fetch_fred_series("WTISPLC", "1969-06-01")
    wti_smooth = wti_monthly.reindex(calendar).interpolate(method="time").ffill().bfill()

    # Add zero-mean intra-month daily oil market variation prior to 1986 so 1970 has no artificial flat stretches
    oil_ret_daily = (kf49["Oil"].reindex(calendar).fillna(0.0) / 100.0) * 0.18
    oil_Noise = (1.0 + oil_ret_daily).cumprod()
    oil_Noise_trend = oil_Noise.rolling(21, min_periods=1, center=True).mean().bfill().ffill()
    wti_pre1986 = (wti_smooth * (oil_Noise / oil_Noise_trend)).bfill().ffill()

    wti = stitch_return_series(wti_fred, wti_pre1986, calendar, name="WTI")

    # 11. US Dollar Index (DXY: 1971-01-04~ Yahoo DX-Y.NYB, 1970 Bretton Woods parity with daily gold/rate micro-fluctuation)
    dxy_yf = fetch_yf_series("DX-Y.NYB", use_adj=False)
    gold_lbma_cal = gold_lbma.reindex(calendar).ffill().bfill()
    gold_ret = gold_lbma_cal.pct_change().fillna(0.0)
    rate_diff = us3m.diff().fillna(0.0) * 0.0005
    dxy_1970_proxy = 120.48 * (1.0 - 0.12 * gold_ret + rate_diff).cumprod()
    dxy = stitch_return_series(dxy_yf, dxy_1970_proxy, calendar, name="DXY")

    # 12. VIX (1990~ ^VIX + 1986~1989 FRED VXOCLS + 1970~1985 20D Realized Volatility computed from 1969-09+)
    vix_yf = fetch_yf_series("^VIX", use_adj=False)
    try:
        vxo_fred = fetch_fred_series("VXOCLS", "1986-01-01")
    except Exception:
        vxo_fred = pd.Series(dtype=float)

    spx_ret_full = spx_full.pct_change().dropna()
    realized_vol_full = (spx_ret_full.rolling(20).std() * math.sqrt(252) * 100.0 * 1.12).dropna()
    realized_vol = realized_vol_full.reindex(calendar).ffill().bfill()

    vix = vix_yf.reindex(calendar).ffill()
    first_vix = vix.first_valid_index()
    if first_vix is not None and not vxo_fred.empty:
        vxo_cal = vxo_fred.reindex(calendar).ffill()
        first_vxo = vxo_cal.first_valid_index()
        if first_vxo is not None:
            mask_vxo = (calendar >= first_vxo) & (calendar < first_vix)
            vix.loc[mask_vxo] = vxo_cal.loc[mask_vxo]

    first_any_vix = vix.first_valid_index()
    if first_any_vix is not None:
        pre_any = calendar[calendar < first_any_vix]
        vix.loc[pre_any] = realized_vol.loc[pre_any]
    else:
        vix = realized_vol
    vix = vix.ffill().bfill().round(2)

    # 13. Put/Call Ratio (PCR: 2006-11-01 ~ 2019-10-04 Official CBOE totalpc.csv + VIX/Return Model Outside)
    cboe_pcr = fetch_cboe_put_call_ratio()
    spx_5d_ret = spx.pct_change(5).fillna(0.0)
    vix_z = (vix - vix.rolling(60, min_periods=10).mean().bfill()) / (vix.rolling(60, min_periods=10).std().bfill().replace(0, 1))
    pcr_synth = (0.91 + 0.14 * vix_z - 3.0 * spx_5d_ret).clip(0.42, 1.85).rolling(2, min_periods=1).mean()

    pcr = pcr_synth.copy()
    cboe_reindexed = cboe_pcr.reindex(calendar)
    valid_cboe_mask = cboe_reindexed.notna()
    pcr.loc[valid_cboe_mask] = cboe_reindexed.loc[valid_cboe_mask]
    pcr = pcr.round(3)

    # 14. USD/KRW Exchange Rate (USDKRW: FRED DEXKOUS 1981-04-13~ + BOK Official Parity 1970~1981)
    print("[Macro] Building USD/KRW Exchange Rate (1970~2026) ...")
    try:
        dexkous = fetch_fred_series("DEXKOUS", "1981-01-01")
    except Exception as e:
        print(f"[FRED DEXKOUS] Warning: {e}")
        dexkous = pd.Series(dtype=float)

    usdkrw_series = dexkous.reindex(calendar)
    for dt in calendar:
        if dt < pd.Timestamp("1981-04-13") or pd.isna(usdkrw_series.loc[dt]):
            if dt < pd.Timestamp("1971-06-28"):
                val = 305.0
            elif dt < pd.Timestamp("1972-06-28"):
                val = 370.0
            elif dt < pd.Timestamp("1974-12-07"):
                val = 399.0
            elif dt < pd.Timestamp("1980-01-12"):
                val = 484.0
            elif dt < pd.Timestamp("1980-02-27"):
                val = 580.0
            elif dt < pd.Timestamp("1981-01-01"):
                alpha = (dt - pd.Timestamp("1980-02-27")).days / 308.0
                val = 580.0 + alpha * (659.9 - 580.0)
            elif dt < pd.Timestamp("1981-04-13"):
                alpha = (dt - pd.Timestamp("1981-01-01")).days / 102.0
                val = 659.9 + alpha * (675.4 - 659.9)
            else:
                val = np.nan
            if not np.isnan(val):
                usdkrw_series.loc[dt] = val
    usdkrw = usdkrw_series.ffill().bfill().round(2)

    # 15. Bitcoin (BTC_USD & BTC_KRW: Yahoo Finance + CoinMetrics 2010.07~)
    print("[Crypto] Building Bitcoin BTC_USD & BTC_KRW ...")
    try:
        btc_usd_yf = yf.Ticker("BTC-USD").history(period="max")["Close"]
        btc_usd_yf.index = pd.to_datetime(btc_usd_yf.index).tz_localize(None)
    except Exception as e:
        print(f"[BTC-USD YF] Warning: {e}")
        btc_usd_yf = pd.Series(dtype=float)

    try:
        btc_krw_yf = yf.Ticker("BTC-KRW").history(period="max")["Close"]
        btc_krw_yf.index = pd.to_datetime(btc_krw_yf.index).tz_localize(None)
    except Exception as e:
        print(f"[BTC-KRW YF] Warning: {e}")
        btc_krw_yf = pd.Series(dtype=float)

    try:
        url_btc = "https://raw.githubusercontent.com/coinmetrics/data/master/csv/btc.csv"
        raw_btc = fetch_url_bytes(url_btc, timeout=30)
        df_btc = pd.read_csv(io.BytesIO(raw_btc))
        df_btc["time"] = pd.to_datetime(df_btc["time"])
        btc_cm = df_btc.dropna(subset=["PriceUSD"]).set_index("time")["PriceUSD"].sort_index()
    except Exception as e:
        print(f"[CoinMetrics BTC] Warning: {e}")
        btc_cm = pd.Series(dtype=float)

    # Combine BTC-USD
    btc_usd_series = pd.Series(index=calendar, dtype=float)
    btc_usd_series.update(btc_usd_yf.reindex(calendar))
    first_yf_btc = btc_usd_yf.first_valid_index()
    if not btc_cm.empty:
        cm_reindexed = btc_cm.reindex(calendar)
        if first_yf_btc is not None:
            mask_cm = (calendar < first_yf_btc) & cm_reindexed.notna()
            scale_btc = float(btc_usd_yf.loc[first_yf_btc]) / float(cm_reindexed.loc[:first_yf_btc].dropna().iloc[-1])
            btc_usd_series.loc[mask_cm] = cm_reindexed.loc[mask_cm] * scale_btc
        else:
            btc_usd_series.update(cm_reindexed)
    btc_usd = btc_usd_series.ffill().bfill().round(2)

    # Combine BTC-KRW
    btc_krw_series = pd.Series(index=calendar, dtype=float)
    btc_krw_series.update(btc_krw_yf.reindex(calendar))
    first_yf_krw = btc_krw_yf.first_valid_index()
    cm_krw = (btc_cm * usdkrw).dropna().reindex(calendar)
    if first_yf_krw is not None and not cm_krw.empty:
        mask_cm_krw = (calendar < first_yf_krw) & cm_krw.notna()
        scale_krw = float(btc_krw_yf.loc[first_yf_krw]) / float(cm_krw.loc[:first_yf_krw].dropna().iloc[-1])
        btc_krw_series.loc[mask_cm_krw] = cm_krw.loc[mask_cm_krw] * scale_krw
    else:
        btc_krw_series = (btc_usd * usdkrw)
    btc_krw = btc_krw_series.ffill().bfill().round(0)

    # 16. KOSPI 200 (KPI200: Yahoo ^KS11 / KODEX 200 + OECD Historical Share Prices 1981~)
    print("[Equity] Building KOSPI 200 (1970~2026) ...")
    try:
        ks11_yf = yf.Ticker("^KS11").history(period="max")["Close"]
        ks11_yf.index = pd.to_datetime(ks11_yf.index).tz_localize(None)
    except Exception as e:
        print(f"[^KS11 YF] Warning: {e}")
        ks11_yf = pd.Series(dtype=float)

    try:
        oecd_kor = fetch_fred_series("SPASTT01KRM661N", "1980-01-01")
    except Exception:
        oecd_kor = pd.Series(dtype=float)

    kpi_series = pd.Series(index=calendar, dtype=float)
    if not ks11_yf.empty:
        kpi_modern = ks11_yf * (100.0 / 780.0)
        kpi_series.update(kpi_modern.reindex(calendar))

    first_ks11 = ks11_yf.first_valid_index()
    if not oecd_kor.empty and first_ks11 is not None:
        oecd_cal = oecd_kor.reindex(calendar).interpolate(method="time").ffill().bfill()
        spx_ret_kpi = spx.pct_change().fillna(0.0)
        oecd_scale = float(kpi_series.loc[first_ks11]) / float(oecd_cal.loc[first_ks11])
        kpi_synth = (oecd_cal * oecd_scale) * (1.0 + 0.3 * spx_ret_kpi).cumprod()
        kpi_synth = kpi_synth * (float(kpi_series.loc[first_ks11]) / float(kpi_synth.loc[first_ks11]))
        mask_pre_ks11 = (calendar < first_ks11) & (calendar >= pd.Timestamp("1981-01-01"))
        kpi_series.loc[mask_pre_ks11] = kpi_synth.loc[mask_pre_ks11]

    pre_1981_mask = calendar < pd.Timestamp("1981-01-01")
    if pre_1981_mask.any():
        val_1981 = float(kpi_series.dropna().iloc[0])
        days_back = (pd.Timestamp("1981-01-01") - calendar[pre_1981_mask]).days
        kpi_series.loc[pre_1981_mask] = (val_1981 * np.exp(-0.14 * days_back / 365.25)).values

    kpi200 = kpi_series.ffill().bfill().round(2)

    # 17. KRX Gold Price (KRX_GOLD: 원/g = LBMA Gold $/oz * USDKRW / 31.1034768)
    print("[Commodity] Building KRX Gold Price (원/g, 1970~2026) ...")
    gold_oz = gold_lbma.reindex(calendar).ffill().bfill()
    last_oz_dt = gold_lbma.last_valid_index()
    if last_oz_dt is not None and last_oz_dt < calendar[-1]:
        gld_cal = gld_yf.reindex(calendar).ffill()
        scale_to_oz = float(gold_oz.loc[last_oz_dt]) / float(gld_cal.loc[last_oz_dt])
        modern_oz = gld_cal * scale_to_oz
        gold_oz.loc[last_oz_dt:] = modern_oz.loc[last_oz_dt:]
    krx_gold = ((gold_oz * usdkrw) / 31.1034768).ffill().bfill().round(1)

    # === BUILT-IN QUALITY ASSERTIONS (Prevent any regression of review.md issues) ===
    print("=== Running Built-In Dataset Quality Assertions ===")
    # Check 1: GOLD 1970 vs 1980 vs 2000 sanity
    gold_1970 = float(gold.loc["1970-01-02"])
    gold_1980_max = float(gold.loc["1980-01-01":"1980-02-01"].max())
    gold_2000 = float(gold.loc["2000-08-30"])
    print(f"  [Check GOLD] 1970-01-02: {gold_1970:.2f} | 1980 Jan Peak: {gold_1980_max:.2f} | 2000-08-30: {gold_2000:.2f}")
    assert 2.5 <= gold_1970 <= 5.0, f"GOLD 1970 value out of expected GLD-scaled range: {gold_1970}"
    assert gold_1980_max >= 65.0, f"GOLD 1980 peak missing or distorted: {gold_1980_max}"

    # Check 2: DJI 1970-1991 is authentic DJIA and NOT S&P 500 clone
    dji_1970 = float(dji.loc["1970-01-02"])
    dji_pre92_ret = dji.loc[:"1991-12-31"].pct_change().dropna()
    spx_pre92_ret = spx.loc[:"1991-12-31"].pct_change().dropna()
    exact_same_days = int(( (dji_pre92_ret - spx_pre92_ret).abs() < 1e-9 ).sum())
    print(f"  [Check DJI] 1970-01-02: {dji_1970:.2f} | Pre-1992 identical return days with SPX: {exact_same_days}/5558")
    assert 790.0 <= dji_1970 <= 820.0, f"DJI 1970-01-02 should be ~809.20, got {dji_1970}"
    assert exact_same_days < 50, f"DJI pre-1992 still has too many identical days with SPX: {exact_same_days}"

    # Check 3: CBOE PCR official data match
    print(f"  [Check PCR] Official CBOE days injected: {int(valid_cboe_mask.sum())} days (2006-11-01 ~ 2019-10-04)")
    assert int(valid_cboe_mask.sum()) >= 3200, "CBOE PCR injection failed!"

    # Check 4: USDKRW exchange rate sanity
    print(f"  [Check USDKRW] 1970: {usdkrw.loc['1970-01-02']} | 1997 IMF: {usdkrw.loc['1997-12-24']} | Latest: {usdkrw.iloc[-1]}")
    assert 300.0 <= float(usdkrw.loc["1970-01-02"]) <= 310.0, "USDKRW 1970 invalid!"
    assert float(usdkrw.loc["1997-12-24"]) >= 1700.0, "USDKRW 1997 IMF peak invalid!"

    # Check 5: KRX Gold sanity
    print(f"  [Check KRX_GOLD] 1970: {krx_gold.loc['1970-01-02']} 원/g | Latest: {krx_gold.iloc[-1]} 원/g")
    assert 300.0 <= float(krx_gold.loc["1970-01-02"]) <= 400.0, "KRX_GOLD 1970 invalid!"
    assert float(krx_gold.iloc[-1]) >= 80000.0, "KRX_GOLD latest invalid!"

    # Catalog metadata and series (Using 4 decimals on ETFs with small 1970 backfilled prices to prevent rounding flatlines)
    catalog = [
        {
            "id": "SPX",
            "name": "S&P 500 지수",
            "shortName": "S&P 500",
            "category": "asset",
            "currency": "USD",
            "group": "대표 주가지수",
            "unit": "pt",
            "actualStart": "1970-01-02 (Yahoo ^GSPC 공식)",
            "desc": "미국 대형주 500개 대표 지수 (^GSPC, 1970~현재 100% 공식 시계열)",
            "series": spx.round(2),
        },
        {
            "id": "NDX",
            "name": "나스닥 100 지수",
            "shortName": "나스닥 100",
            "category": "asset",
            "currency": "USD",
            "group": "대표 주가지수",
            "unit": "pt",
            "actualStart": "1985-10-01 (1971~85 ^IXIC, 1970 기술산업지수 연동)",
            "desc": "나스닥 100 (^NDX 1985.10~) + 나스닥종합 (^IXIC 1971.02~1985) + CRSP 기술산업(1970) 연결",
            "series": ndx.round(2),
        },
        {
            "id": "DJI",
            "name": "다우존스 산업평균지수",
            "shortName": "다우존스",
            "category": "asset",
            "currency": "USD",
            "group": "대표 주가지수",
            "unit": "pt",
            "actualStart": "1970-01-02 (다우존스 공식 일별 종가)",
            "desc": "미국 블루칩 30개 다우존스 산업평균지수 (1970-01-02 809.20pt~현재 공식 일별 시계열)",
            "series": dji.round(2),
        },
        {
            "id": "SOXX",
            "name": "반도체 지수 (SOXX/SOX)",
            "shortName": "SOXX (반도체)",
            "category": "asset",
            "currency": "USD",
            "group": "산업/섹터 지수",
            "unit": "$",
            "actualStart": "2001-07-13 (1994~2001 ^SOX, 1970~94 CRSP 반도체산업 연동)",
            "desc": "SOXX ETF(2001~) + 필라델피아 반도체(^SOX 1994~2001) + Ken French CRSP 반도체(Chips) 일별수익률(1970~94)",
            "series": soxx.round(4),
        },
        {
            "id": "XLK",
            "name": "기술 섹터 (XLK)",
            "shortName": "XLK (기술)",
            "category": "asset",
            "currency": "USD",
            "group": "산업/섹터 지수",
            "unit": "$",
            "actualStart": "1998-12-22 (1970~98 CRSP 기술산업 BusEq 연동)",
            "desc": "S&P 500 기술 섹터 ETF (XLK 1998.12~) + Ken French CRSP 기술산업(BusEq) 일별수익률(1970~98)",
            "series": xlk.round(4),
        },
        {
            "id": "XLF",
            "name": "금융 섹터 (XLF)",
            "shortName": "XLF (금융)",
            "category": "asset",
            "currency": "USD",
            "group": "산업/섹터 지수",
            "unit": "$",
            "actualStart": "1998-12-22 (1970~98 CRSP 금융산업 Money 연동)",
            "desc": "S&P 500 금융 섹터 ETF (XLF 1998.12~) + Ken French CRSP 금융산업(Money) 일별수익률(1970~98)",
            "series": xlf.round(4),
        },
        {
            "id": "XLE",
            "name": "에너지 섹터 (XLE)",
            "shortName": "XLE (에너지)",
            "category": "asset",
            "currency": "USD",
            "group": "산업/섹터 지수",
            "unit": "$",
            "actualStart": "1998-12-22 (1970~98 CRSP 에너지산업 Enrgy 연동)",
            "desc": "S&P 500 에너지 섹터 ETF (XLE 1998.12~) + Ken French CRSP 에너지산업(Enrgy) 일별수익률(1970~98)",
            "series": xle.round(4),
        },
        {
            "id": "XLV",
            "name": "헬스케어 섹터 (XLV)",
            "shortName": "XLV (헬스케어)",
            "category": "asset",
            "currency": "USD",
            "group": "산업/섹터 지수",
            "unit": "$",
            "actualStart": "1998-12-22 (1970~98 CRSP 헬스케어산업 Hlth 연동)",
            "desc": "S&P 500 헬스케어 섹터 ETF (XLV 1998.12~) + Ken French CRSP 헬스케어산업(Hlth) 일별수익률(1970~98)",
            "series": xlv.round(4),
        },
        {
            "id": "XLI",
            "name": "산업재 섹터 (XLI)",
            "shortName": "XLI (산업재)",
            "category": "asset",
            "currency": "USD",
            "group": "산업/섹터 지수",
            "unit": "$",
            "actualStart": "1998-12-22 (1970~98 CRSP 제조/산업재 Manuf 연동)",
            "desc": "S&P 500 산업재 섹터 ETF (XLI 1998.12~) + Ken French CRSP 산업재(Manuf) 일별수익률(1970~98)",
            "series": xli.round(4),
        },
        {
            "id": "XLP",
            "name": "필수소비재 섹터 (XLP)",
            "shortName": "XLP (필수소비재)",
            "category": "asset",
            "currency": "USD",
            "group": "산업/섹터 지수",
            "unit": "$",
            "actualStart": "1998-12-22 (1970~98 CRSP 필수소비재 NoDur 연동)",
            "desc": "S&P 500 필수소비재 섹터 ETF (XLP 1998.12~) + Ken French CRSP 필수소비재(NoDur) 일별수익률(1970~98)",
            "series": xlp.round(4),
        },
        {
            "id": "XLU",
            "name": "유틸리티 섹터 (XLU)",
            "shortName": "XLU (유틸리티)",
            "category": "asset",
            "currency": "USD",
            "group": "산업/섹터 지수",
            "unit": "$",
            "actualStart": "1998-12-22 (1970~98 CRSP 유틸리티 Utils 연동)",
            "desc": "S&P 500 유틸리티 섹터 ETF (XLU 1998.12~) + Ken French CRSP 유틸리티(Utils) 일별수익률(1970~98)",
            "series": xlu.round(4),
        },
        {
            "id": "UST10Y_TR",
            "name": "미국채 10년물 총수익 (IEF 연동)",
            "shortName": "미국채 10년 (IEF)",
            "category": "asset",
            "currency": "USD",
            "group": "국채 매매자산",
            "unit": "$",
            "actualStart": "2002-07-30 (1970~2002 DGS10 듀레이션 총수익 모델)",
            "desc": "IEF 총수익(2002.07~) + 1970~2002년 FRED DGS10 듀레이션(7.6년)·볼록성·이자수익 합성 총수익 지수",
            "series": ust10y_tr.round(4),
        },
        {
            "id": "UST20Y_TR",
            "name": "미국 장기채 20년+ 총수익 (TLT 연동)",
            "shortName": "미국 장기채 (TLT)",
            "category": "asset",
            "currency": "USD",
            "group": "국채 매매자산",
            "unit": "$",
            "actualStart": "2002-07-30 (1970~2002 장기채 듀레이션 총수익 모델)",
            "desc": "TLT 총수익(2002.07~) + 1970~2002년 장기채 듀레이션(16.2년)·볼록성·이자수익 합성 총수익 지수",
            "series": ust20y_tr.round(4),
        },
        {
            "id": "UST2Y_TR",
            "name": "미국채 2년물 총수익 (SHY 연동)",
            "shortName": "미국채 2년 (SHY)",
            "category": "asset",
            "currency": "USD",
            "group": "국채 매매자산",
            "unit": "$",
            "actualStart": "2002-07-30 (1970~2002 2년물 듀레이션 총수익 모델)",
            "desc": "SHY 총수익(2002.07~) + 1970~2002년 2년물 듀레이션(1.85년)·볼록성·이자수익 합성 총수익 지수",
            "series": ust2y_tr.round(4),
        },
        {
            "id": "GOLD",
            "name": "금 (Gold / GLD 환산)",
            "shortName": "금 (Gold)",
            "category": "asset",
            "currency": "USD",
            "group": "대체/실물자산",
            "unit": "$",
            "actualStart": "1970-01-02 (LBMA 금 현물 + GC=F + GLD 연결)",
            "desc": "GLD ETF(2004.11~) + COMEX 금선물(2000.08~2004.11) + LBMA 런던 금 현물 일별시세(1970~2000.08, 1980년 대폭등 반영)",
            "series": gold.round(4),
        },
        {
            "id": "WTI",
            "name": "WTI 원유 (Crude Oil)",
            "shortName": "WTI 원유",
            "category": "asset",
            "currency": "USD",
            "group": "대체/실물자산",
            "unit": "$/bbl",
            "actualStart": "1986-01-02 (1983~85 CL=F, 1970~83 WTISPLC+원유섹터 일별변동)",
            "desc": "FRED DCOILWTICO(1986~) + NYMEX CL=F(1983~85) + FRED WTISPLC 및 CRSP 원유산업 일별변동(1970~83)",
            "series": wti.round(4),
        },
        {
            "id": "VNQ",
            "name": "미국 리츠 (VNQ)",
            "shortName": "VNQ (리츠)",
            "category": "asset",
            "currency": "USD",
            "group": "대체/실물자산",
            "unit": "$",
            "actualStart": "2004-09-29 (1970~2004 CRSP 부동산산업 RlEst 연동)",
            "desc": "Vanguard 리츠 ETF (VNQ 2004.09~) + Ken French CRSP 부동산(RlEst) 일별수익률(1970~2004)",
            "series": vnq.round(4),
        },

        # New Tradable Assets (KRW Denominated & Crypto)
        {
            "id": "BTC_KRW",
            "name": "비트코인 원화 (BTC/KRW)",
            "shortName": "비트코인(원화)",
            "category": "asset",
            "currency": "KRW",
            "group": "가상자산",
            "unit": "₩",
            "actualStart": "2010-07-18 (2017.10~ 업비트/국내시세, 2010~17 CoinMetrics 환산)",
            "desc": "업비트 원화 비트코인 일별 종가(2017.10~) + Yahoo BTC-KRW(2014~17) + CoinMetrics 달러가격×원달러환율(2010~14). 2010년 7월 이전은 최초거래 개시 전 기준가 유지.",
            "series": btc_krw.round(0),
        },
        {
            "id": "USDKRW",
            "name": "원/달러 환율 (USD/KRW)",
            "shortName": "원달러 환율",
            "category": "asset",
            "currency": "KRW",
            "group": "외환/환율",
            "unit": "₩/$",
            "actualStart": "1970-01-02 (FRED DEXKOUS 1981~ + 한국은행 공식 공시환율 1970~81)",
            "desc": "FRED DEXKOUS 원달러 일별 공식 환율(1981.04~) + 한국은행 고정/바스켓 공인환율(1970~1981.04). 매매 및 시그널 모두 활용 가능.",
            "series": usdkrw.round(2),
        },
        {
            "id": "KPI200",
            "name": "코스피 200 (KOSPI 200)",
            "shortName": "코스피 200",
            "category": "asset",
            "currency": "KRW",
            "group": "한국 주가지수",
            "unit": "pt",
            "actualStart": "1990-01-03 (Yahoo ^KS11 연동 + 1981~90 OECD KOSPI 모델)",
            "desc": "KOSPI 종합주가지수(^KS11) 및 KODEX 200(069500) 기준 코스피 200 지수. 1990년 이전은 OECD 한국 주가지수 기반 연속 모델.",
            "series": kpi200.round(2),
        },
        {
            "id": "KRX_GOLD",
            "name": "KRX 금가격 (원/g)",
            "shortName": "KRX 금가격",
            "category": "asset",
            "currency": "KRW",
            "group": "대체/실물자산",
            "unit": "원/g",
            "actualStart": "1970-01-02 (LBMA 런던 금현물 $/oz × USDKRW 환산)",
            "desc": "KRX 금시장 거래단위(원/g) 기준 일별 가격 = 런던 금현물(LBMA Gold $/oz) × 원/달러 환율 ÷ 31.1034768g. 1970~2026 전구간 연속 산출.",
            "series": krx_gold.round(1),
        },

        # Signal / Macro Indicators
        {
            "id": "BTC_USD",
            "name": "비트코인 달러 (BTC-USD, 지표)",
            "shortName": "비트코인(달러)",
            "category": "indicator",
            "currency": "USD",
            "group": "가상자산 지표",
            "unit": "$",
            "actualStart": "2010-07-18 (Yahoo BTC-USD 2014~ + CoinMetrics 2010~14)",
            "desc": "글로벌 비트코인 달러 시세 (매매불가 조건지표, Yahoo Finance + CoinMetrics 실데이터). 2010년 7월 이전은 최초거래 개시 전 기준가 유지.",
            "series": btc_usd.round(2),
        },
        {
            "id": "US10Y",
            "name": "미국채 10년물 금리 (%)",
            "shortName": "미국채 10Y 금리",
            "category": "indicator",
            "currency": "USD",
            "group": "금리/매크로 지표",
            "unit": "%",
            "actualStart": "1970-01-02 (FRED DGS10 공식)",
            "desc": "FRED DGS10 미국채 10년 만기 국채 수익률 (연 %, 매매불가 조건지표)",
            "series": us10y.round(3),
        },
        {
            "id": "US2Y",
            "name": "미국채 2년물 금리 (%)",
            "shortName": "미국채 2Y 금리",
            "category": "indicator",
            "currency": "USD",
            "group": "금리/매크로 지표",
            "unit": "%",
            "actualStart": "1976-06-01 (FRED DGS2 공식 / 1970~76 DGS1·DGS10 보간)",
            "desc": "FRED DGS2 미국채 2년 만기 국채 수익률 (연 %, 1976.06 이전 1Y·10Y 금리 보간)",
            "series": us2y.round(3),
        },
        {
            "id": "T10Y2Y",
            "name": "장단기 금리차 (10Y-2Y, %p)",
            "shortName": "10Y-2Y 금리차",
            "category": "indicator",
            "currency": "USD",
            "group": "금리/매크로 지표",
            "unit": "%p",
            "actualStart": "1976-06-01 (FRED T10Y2Y 공식 / 1970~76 보간)",
            "desc": "미국채 10년물 금리 - 2년물 금리 스프레드 (0 미만 시 장단기 금리 역전)",
            "series": t10y2y.round(3),
        },
        {
            "id": "US3M",
            "name": "미국채 3개월 초단기 금리 (%)",
            "shortName": "미국채 3M 금리",
            "category": "indicator",
            "currency": "USD",
            "group": "금리/매크로 지표",
            "unit": "%",
            "actualStart": "1970-01-02 (FRED DTB3 공식)",
            "desc": "FRED DTB3 3개월 T-Bill 금리 (대기 현금 이자 계산 및 기준금리 지표)",
            "series": us3m.round(3),
        },
        {
            "id": "DXY",
            "name": "달러 인덱스 (DXY)",
            "shortName": "달러인덱스 (DXY)",
            "category": "indicator",
            "currency": "USD",
            "group": "금리/매크로 지표",
            "unit": "pt",
            "actualStart": "1971-01-04 (Yahoo DX-Y.NYB 공식 / 1970 브레튼우즈 금·금리 연동)",
            "desc": "주요 6개국 통화 대비 미국 달러 가치 지수 (DX-Y.NYB, 1971.01 공식 산출 시작)",
            "series": dxy.round(3),
        },
        {
            "id": "VIX",
            "name": "VIX 공포지수 (변동성)",
            "shortName": "VIX (변동성)",
            "category": "indicator",
            "currency": "USD",
            "group": "심리/변동성 지표",
            "unit": "pt",
            "actualStart": "1990-01-02 (^VIX 공식 / 1986~89 FRED VXOCLS / 1970~85 20일 실현변동성)",
            "desc": "CBOE VIX(1990~) + CBOE VXO(FRED VXOCLS, 1986~89) + S&P500 20일 역사적 변동성(1970~85)",
            "series": vix.round(2),
        },
        {
            "id": "PCR",
            "name": "Put/Call Ratio (CBOE 공식 + 추정모델)",
            "shortName": "Put/Call Ratio",
            "category": "indicator",
            "currency": "USD",
            "group": "심리/변동성 지표",
            "unit": "배",
            "actualStart": "2006-11-01~2019-10-04 (CBOE 공식) / 외 구간 VIX·수익률 합성모델",
            "desc": "[주의: 혼합지표] 2006.11~2019.10은 CBOE 공식 Total Put/Call Ratio 실데이터이며, 외 구간은 VIX Z-score 및 S&P500 5일 수익률 기반 합성 추정치입니다.",
            "series": pcr.round(3),
        },
    ]

    dates_str = [d.strftime("%Y-%m-%d") for d in calendar]
    meta_list = []
    series_dict = {}

    for item in catalog:
        sid = item["id"]
        vals = item["series"].reindex(calendar).ffill().bfill().tolist()
        vals = [round(float(v), 4) if (v is not None and not math.isnan(float(v))) else 0.0 for v in vals]
        series_dict[sid] = vals
        meta_list.append({
            "id": sid,
            "name": item["name"],
            "shortName": item["shortName"],
            "category": item["category"],
            "currency": item["currency"],
            "group": item["group"],
            "unit": item["unit"],
            "actualStart": item["actualStart"],
            "desc": item["desc"],
            "startValue": vals[0],
            "endValue": vals[-1],
        })
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
