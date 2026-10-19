(() => {
  const params = new URLSearchParams(location.search);
  const mode = params.get("mode") || "overlay";
  const overlay = document.getElementById("overlay");
  const control = document.getElementById("control");

  if (mode === "control") {
    overlay.classList.add("hidden");
    control.classList.remove("hidden");
  } else {
    control.classList.add("hidden");
    overlay.classList.remove("hidden");
  }

  // Supabase project settings
  const SUPABASE_URL = "https://flzrxmqbxxtjbcapddnw.supabase.co";
  // Replace this placeholder with your Supabase Publishable key (sb_publishable_...).
  // Never put a Secret key or service_role key in this file.
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_sb_publishable_TSyWv_TaFk-b7Ok0OEmaUA_ZuAD58KR";  const KEY = "pokemon-unite-obs-counter-v1";
  const ROW_ID = "main";
  const POLL_MS = 1500;
  const defaultState = { wins: 0, losses: 0, history: [], title: "本日戰績" };

  let state = loadLocal();
  let lastRemoteSnapshot = "";
  let isSaving = false;
  let pollTimer = null;

  function normalizeState(value) {
    if (value && Number.isFinite(value.wins) && Number.isFinite(value.losses) && Array.isArray(value.history)) {
      return {
        wins: Math.max(0, Math.floor(value.wins)),
        losses: Math.max(0, Math.floor(value.losses)),
        history: value.history.filter(x => x && (x.result === "W" || x.result === "L")).slice(-500),
        title: typeof value.title === "string" ? value.title.slice(0, 30) : defaultState.title
      };
    }
    return { ...defaultState, history: [] };
  }

  function loadLocal() {
    try {
      const parsed = JSON.parse(localStorage.getItem(KEY));
      return normalizeState(parsed);
    } catch (_) {
      return { ...defaultState, history: [] };
    }
  }

  function persistLocal() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) {}
  }

  function apiHeaders(extra = {}) {
    return {
      "apikey": SUPABASE_PUBLISHABLE_KEY,
      "Authorization": `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      "Content-Type": "application/json",
      ...extra
    };
  }

  function configReady() {
    return SUPABASE_PUBLISHABLE_KEY.startsWith("sb_publishable_");
  }

  async function fetchRemote() {
    if (!configReady()) return null;
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/unite_counter?id=eq.${encodeURIComponent(ROW_ID)}&select=id,wins,losses,history,title,updated_at`,
      { headers: apiHeaders(), cache: "no-store" }
    );
    if (!response.ok) throw new Error(`讀取資料失敗（HTTP ${response.status}）`);
    const rows = await response.json();
    return rows[0] || null;
  }

  async function saveRemote(snapshot) {
    if (!configReady()) {
      setStatus("請先在 app.js 填入 Supabase Publishable key。");
      return;
    }
    isSaving = true;
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/unite_counter?id=eq.${encodeURIComponent(ROW_ID)}`,
        {
          method: "PATCH",
          headers: apiHeaders({ "Prefer": "return=representation" }),
          body: JSON.stringify({
            wins: snapshot.wins,
            losses: snapshot.losses,
            history: snapshot.history,
            title: snapshot.title,
            updated_at: new Date().toISOString()
          })
        }
      );
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`儲存失敗（HTTP ${response.status}）：${detail.slice(0, 180)}`);
      }
      lastRemoteSnapshot = JSON.stringify(snapshot);
      setStatus("已同步至線上資料庫");
    } catch (error) {
      console.error(error);
      setStatus(error.message || "同步失敗，請檢查 Supabase 設定");
    } finally {
      isSaving = false;
    }
  }

  function save() {
    persistLocal();
    render();
    const snapshot = normalizeState(state);
    saveRemote(snapshot);
  }

  async function pollRemote() {
    if (!configReady() || isSaving) return;
    try {
      const row = await fetchRemote();
      if (!row) {
        setStatus("找不到 main 資料列，請確認 SQL 已成功執行");
        return;
      }
      const remote = normalizeState(row);
      const remoteSnapshot = JSON.stringify(remote);

      // The control page pushes changes; all pages receive remote changes by polling.
      if (remoteSnapshot !== lastRemoteSnapshot) {
        const localSnapshot = JSON.stringify(normalizeState(state));
        if (remoteSnapshot !== localSnapshot) {
          state = remote;
          persistLocal();
          render();
        }
        lastRemoteSnapshot = remoteSnapshot;
        if (mode !== "control") setStatus("已連線，戰績同步中");
      }
    } catch (error) {
      console.error(error);
      setStatus(error.message || "無法連接 Supabase");
    }
  }

  function total() { return state.wins + state.losses; }
  function rate() { return total() ? (state.wins / total() * 100).toFixed(1) + "%" : "—"; }
  function currentStreak() {
    if (!state.history.length) return 0;
    const last = state.history[state.history.length - 1].result;
    let n = 0;
    for (let i = state.history.length - 1; i >= 0; i--) {
      if (state.history[i].result !== last) break;
      n++;
    }
    return last === "W" ? n : 0;
  }
  function el(id) { return document.getElementById(id); }
  function safeText(node, value) { if (node) node.textContent = value; }

  function setStatus(message) {
    const status = el("syncStatus");
    if (status) status.textContent = message;
  }

  function render() {
    ["wins", "cWins"].forEach(id => safeText(el(id), state.wins));
    ["losses", "cLosses"].forEach(id => safeText(el(id), state.losses));
    ["total", "cTotal"].forEach(id => safeText(el(id), total()));
    ["rate", "cRate"].forEach(id => safeText(el(id), rate()));
    safeText(el("streak"), currentStreak());
    safeText(el("titleText"), state.title || "本日戰績");
    if (el("customTitle") && document.activeElement !== el("customTitle")) {
      el("customTitle").value = state.title || "本日戰績";
    }

    const recent = el("recent");
    if (recent) {
      recent.replaceChildren();
      const last = state.history.slice(-12).reverse();
      if (!last.length) {
        const empty = document.createElement("span");
        empty.className = "empty";
        empty.textContent = "尚無對戰紀錄";
        recent.appendChild(empty);
      } else {
        last.forEach(item => {
          const badge = document.createElement("span");
          badge.className = "badge " + item.result;
          badge.textContent = item.result === "W" ? "勝" : "敗";
          badge.title = item.time || "";
          recent.appendChild(badge);
        });
      }
    }

    const list = el("historyList");
    if (list) {
      list.replaceChildren();
      safeText(el("historyCount"), `${state.history.length} 場`);
      if (!state.history.length) {
        const li = document.createElement("li");
        li.className = "empty";
        li.textContent = "還沒有紀錄";
        list.appendChild(li);
      } else {
        state.history.slice().reverse().slice(0, 20).forEach((item, index) => {
          const li = document.createElement("li");
          const left = document.createElement("span");
          left.textContent = `第 ${state.history.length - index} 場　${item.time || ""}`;
          const right = document.createElement("span");
          right.className = item.result === "W" ? "result-win" : "result-loss";
          right.textContent = item.result === "W" ? "勝利" : "敗北";
          li.append(left, right);
          list.appendChild(li);
        });
      }
    }
  }

  function addResult(result) {
    if (result === "W") state.wins++;
    else state.losses++;
    state.history.push({ result, time: new Date().toLocaleString("zh-TW", { hour12: false }) });
    save();
  }

  if (el("winBtn")) el("winBtn").addEventListener("click", () => addResult("W"));
  if (el("lossBtn")) el("lossBtn").addEventListener("click", () => addResult("L"));
  if (el("undoBtn")) el("undoBtn").addEventListener("click", () => {
    if (!state.history.length) return;
    const last = state.history.pop();
    if (last.result === "W") state.wins = Math.max(0, state.wins - 1);
    else state.losses = Math.max(0, state.losses - 1);
    save();
  });
  if (el("resetBtn")) el("resetBtn").addEventListener("click", () => {
    if (!confirm("確定要清除全部勝敗紀錄嗎？此操作無法復原。")) return;
    state.wins = 0;
    state.losses = 0;
    state.history = [];
    save();
  });
  if (el("saveTitle")) el("saveTitle").addEventListener("click", () => {
    state.title = (el("customTitle").value || "").trim().slice(0, 30) || "本日戰績";
    save();
  });

  window.addEventListener("storage", event => {
    if (event.key === KEY) {
      state = loadLocal();
      render();
    }
  });

  render();
  if (!configReady()) {
    setStatus("尚未設定 Supabase Publishable key");
  } else {
    setStatus("正在連接線上資料庫…");
    pollRemote().then(async () => {
      // Seed the remote row from its current state only if the database row is blank.
      try {
        const row = await fetchRemote();
        if (row && row.wins === 0 && row.losses === 0 && (!row.history || row.history.length === 0) &&
            (state.wins > 0 || state.losses > 0 || state.history.length > 0)) {
          await saveRemote(state);
        }
      } catch (error) { console.error(error); }
    });
    pollTimer = window.setInterval(pollRemote, POLL_MS);
  }
})();
