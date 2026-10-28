/**
 * storage.js
 * Persistent Storage Manager for:
 * 1) Custom CSV Assets / Indicators (IndexedDB)
 * 2) Scoreboard Backtest History & Best Strategy Leaderboard (localStorage + IndexedDB)
 */
(function (global) {
  "use strict";

  const DB_NAME = "QuantBacktestDB_v1";
  const DB_VERSION = 1;
  const STORE_CUSTOM_SERIES = "custom_series";
  const LS_SCOREBOARD_KEY = "quant_backtest_scoreboard_v1";

  function openDB() {
    return new Promise((resolve, reject) => {
      if (!global.indexedDB) {
        resolve(null);
        return;
      }
      const req = global.indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_CUSTOM_SERIES)) {
          db.createObjectStore(STORE_CUSTOM_SERIES, { keyPath: "id" });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });
  }

  async function getAllCustomSeries() {
    const db = await openDB();
    if (!db) return [];
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_CUSTOM_SERIES, "readonly");
      const store = tx.objectStore(STORE_CUSTOM_SERIES);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  }

  async function saveCustomSeries(entry) {
    const db = await openDB();
    if (!db) return false;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_CUSTOM_SERIES, "readwrite");
      const store = tx.objectStore(STORE_CUSTOM_SERIES);
      store.put(entry);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  }

  async function deleteCustomSeries(id) {
    const db = await openDB();
    if (!db) return false;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_CUSTOM_SERIES, "readwrite");
      const store = tx.objectStore(STORE_CUSTOM_SERIES);
      store.delete(id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  }

  /**
   * Parse CSV text and align onto masterData.dates
   */
  function parseAndAlignCSV(csvText, masterDates) {
    const lines = csvText
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      throw new Error("CSV 파일에 유효한 데이터 행이 부족합니다.");
    }

    // Detect delimiter (comma, tab, semicolon)
    const firstLine = lines[0];
    const delim = firstLine.includes("\t") ? "\t" : firstLine.includes(";") ? ";" : ",";
    const headers = firstLine.split(delim).map((h) => h.replace(/^["']|["']$/g, "").trim().toLowerCase());

    let dateCol = headers.findIndex((h) => h.includes("date") || h.includes("일자") || h.includes("날짜") || h === "time");
    if (dateCol < 0) dateCol = 0;

    let valCol = headers.findIndex(
      (h) =>
        h.includes("adj close") ||
        h.includes("close") ||
        h.includes("price") ||
        h.includes("value") ||
        h.includes("종가") ||
        h.includes("가격") ||
        h.includes("수치")
    );
    if (valCol < 0 || valCol === dateCol) {
      valCol = headers.length > 1 ? 1 : 0;
    }

    const dateValMap = new Map();
    let minDate = "9999-99-99";
    let maxDate = "0000-00-00";

    for (let i = 0; i < lines.length; i++) {
      const cols = lines[i].split(delim).map((c) => c.replace(/^["']|["']$/g, "").trim());
      if (cols.length <= Math.max(dateCol, valCol)) continue;
      const rawDate = cols[dateCol];
      const rawVal = cols[valCol].replace(/,/g, "");
      const numVal = parseFloat(rawVal);
      if (!Number.isFinite(numVal)) continue;

      // Normalize date string to YYYY-MM-DD
      const normDate = normalizeDateString(rawDate);
      if (!normDate) continue;

      dateValMap.set(normDate, numVal);
      if (normDate < minDate) minDate = normDate;
      if (normDate > maxDate) maxDate = normDate;
    }

    if (dateValMap.size < 2) {
      throw new Error("날짜(YYYY-MM-DD)와 숫자 가격/지표 열을 파싱할 수 없습니다.");
    }

    // Sort parsed dates so we can forward-fill even when CSV dates fall on weekends/different days
    const sortedEntries = Array.from(dateValMap.entries()).sort((a, b) => (a[0] < b[0] ? -1 : 1));
    const aligned = new Array(masterDates.length);
    let ptr = 0;
    let lastVal = sortedEntries[0][1];

    for (let i = 0; i < masterDates.length; i++) {
      const mDate = masterDates[i];
      while (ptr < sortedEntries.length && sortedEntries[ptr][0] <= mDate) {
        lastVal = sortedEntries[ptr][1];
        ptr++;
      }
      aligned[i] = Math.round(lastVal * 10000) / 10000;
    }

    return {
      values: aligned,
      actualStart: minDate,
      actualEnd: maxDate,
      rowCount: dateValMap.size,
    };
  }

  function normalizeDateString(str) {
    if (!str) return null;
    const s = str.trim();
    // YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD
    let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (m) {
      return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
    }
    // MM/DD/YYYY
    m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (m) {
      return `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
    }
    // YYYYMMDD
    m = s.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (m) {
      return `${m[1]}-${m[2]}-${m[3]}`;
    }
    return null;
  }

  /**
   * Scoreboard History Management
   */
  function loadScoreboard() {
    try {
      const raw = global.localStorage.getItem(LS_SCOREBOARD_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function saveScoreboard(list) {
    try {
      // Keep top/recent 80 entries max to avoid localStorage quota issues
      const trimmed = list.slice(0, 80);
      global.localStorage.setItem(LS_SCOREBOARD_KEY, JSON.stringify(trimmed));
      return true;
    } catch (e) {
      console.warn("Scoreboard save warning:", e);
      return false;
    }
  }

  function addScoreboardEntry(btResult, customTitle) {
    const list = loadScoreboard();
    const m = btResult.metrics;
    const id = "RUN_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
    const entry = {
      id,
      createdAt: new Date().toISOString(),
      title: customTitle || btResult.configSnapshot.name || "백테스트 전략",
      pinned: false,
      metrics: {
        quantScore: m.quantScore,
        cagrPct: m.cagrPct,
        totalReturnPct: m.totalReturnPct,
        maxDrawdownPct: m.maxDrawdownPct,
        sharpe: m.sharpe,
        sortino: m.sortino,
        calmar: m.calmar,
        annualVolPct: m.annualVolPct,
        winRateYearlyPct: m.winRateYearlyPct,
        initialCapital: m.initialCapital,
        finalEquity: m.finalEquity,
        startDate: m.startDate,
        endDate: m.endDate,
        years: m.years,
        ruleTradeCount: m.ruleTradeCount,
        rebalanceCount: m.rebalanceCount,
      },
      summaryText: btResult.summaryText,
      configSnapshot: btResult.configSnapshot,
      compactCurve: btResult.compactCurve,
    };

    list.unshift(entry);
    saveScoreboard(list);
    return entry;
  }

  function deleteScoreboardEntry(id) {
    const list = loadScoreboard().filter((item) => item.id !== id);
    saveScoreboard(list);
    return list;
  }

  function togglePinScoreboardEntry(id) {
    const list = loadScoreboard();
    const target = list.find((item) => item.id === id);
    if (target) {
      target.pinned = !target.pinned;
      saveScoreboard(list);
    }
    return list;
  }

  function clearScoreboard(keepPinned = true) {
    const list = keepPinned ? loadScoreboard().filter((item) => item.pinned) : [];
    saveScoreboard(list);
    return list;
  }

  global.StorageManager = {
    getAllCustomSeries,
    saveCustomSeries,
    deleteCustomSeries,
    parseAndAlignCSV,
    loadScoreboard,
    saveScoreboard,
    addScoreboardEntry,
    deleteScoreboardEntry,
    togglePinScoreboardEntry,
    clearScoreboard,
  };
})(window);
