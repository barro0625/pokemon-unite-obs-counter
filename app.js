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

  const KEY = "pokemon-unite-obs-counter-v1";
  const defaultState = { wins: 0, losses: 0, history: [], title: "本日戰績" };
  let state = load();

  function load() {
    try {
      const parsed = JSON.parse(localStorage.getItem(KEY));
      if (parsed && Number.isFinite(parsed.wins) && Number.isFinite(parsed.losses) && Array.isArray(parsed.history)) {
        return { ...defaultState, ...parsed };
      }
    } catch (_) {}
    return { ...defaultState };
  }
  function save() {
    localStorage.setItem(KEY, JSON.stringify(state));
    render();
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
  function safeText(node, value) { node.textContent = value; }

  function render() {
    ["wins", "cWins"].forEach(id => safeText(el(id), state.wins));
    ["losses", "cLosses"].forEach(id => safeText(el(id), state.losses));
    ["total", "cTotal"].forEach(id => safeText(el(id), total()));
    ["rate", "cRate"].forEach(id => safeText(el(id), rate()));
    safeText(el("streak"), currentStreak());
    safeText(el("titleText"), state.title || "本日戰績");
    if (el("customTitle") && document.activeElement !== el("customTitle")) el("customTitle").value = state.title || "本日戰績";

    const recent = el("recent");
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

    const list = el("historyList");
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
    state.wins = 0; state.losses = 0; state.history = [];
    save();
  });
  if (el("saveTitle")) el("saveTitle").addEventListener("click", () => {
    state.title = (el("customTitle").value || "").trim().slice(0, 30) || "本日戰績";
    save();
  });

  window.addEventListener("storage", event => {
    if (event.key === KEY) { state = load(); render(); }
  });
  render();
})();
