(() => {
  "use strict";

  const POEMS = window.POEMS || [];
  const CATS = window.CATEGORIES || [];
  const $ = (s, r = document) => r.querySelector(s);
  const catById = Object.fromEntries(CATS.map(c => [c.id, c]));
  const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
  const fa = n => String(n).replace(/\d/g, d => FA_DIGITS[d]);

  /* ── ذخیره (اختیاری) ── */
  const store = {
    get(k, d) { try { const v = localStorage.getItem("hz:" + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem("hz:" + k, JSON.stringify(v)); } catch { /* بی‌ذخیره هم کار موکنه */ } }
  };

  const state = {
    cat: "all",
    q: "",
    favs: new Set(store.get("favs", [])),
    font: store.get("font", "nastaliq"),
    size: store.get("size", 0),
    list: POEMS,
    current: -1
  };

  /* ── ابزارِ متن ── */
  const esc = s => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const MARKS = "ً-ْٰ‌‍";
  const norm = s => s.replace(new RegExp("[" + MARKS + "]", "g"), "").replace(/ي/g, "ی").replace(/ك/g, "ک").replace(/ة/g, "ه").toLowerCase();
  const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  function highlight(text, q) {
    const safe = esc(text);
    if (!q) return safe;
    const pattern = [...norm(q)].map(ch => reEsc(esc(ch))).join("[" + MARKS + "]*");
    try { return safe.replace(new RegExp(pattern, "g"), m => `<mark>${m}</mark>`); } catch { return safe; }
  }
  const searchable = p => norm([p.title, p.form, catById[p.cat]?.name || "", ...p.lines, p.note || ""].join(" "));

  /* ── دسته‌ها ── */
  function renderCats() {
    $("#cats").innerHTML = CATS.map(c => {
      const n = POEMS.filter(p => p.cat === c.id).length;
      return `<button class="cat" type="button" data-cat="${c.id}">
        <span class="cat__icon"><svg><use href="#i-${c.icon}"/></svg></span>
        <h3>${esc(c.name)}</h3><p>${esc(c.desc)}</p>
        <span class="cat__n">${fa(n)} شعر</span></button>`;
    }).join("");
    $("#cats").addEventListener("click", e => {
      const b = e.target.closest("[data-cat]");
      if (!b) return;
      setCat(b.dataset.cat);
      $("#ashar").scrollIntoView();
    });
  }

  function renderChips() {
    const items = [["all", "همه"], ...CATS.map(c => [c.id, c.name]), ["fav", "★ نشان‌شده‌ها"]];
    $("#chips").innerHTML = items.map(([id, name]) =>
      `<button class="chip" type="button" role="tab" data-cat="${id}" aria-selected="${state.cat === id}">${esc(name)}</button>`).join("");
  }
  $("#chips").addEventListener("click", e => {
    const b = e.target.closest("[data-cat]");
    if (b) setCat(b.dataset.cat);
  });

  function setCat(id) { state.cat = id; renderChips(); renderPoems(); }

  /* ── فهرستِ شعرها ── */
  function filtered() {
    const q = norm(state.q.trim());
    return POEMS.filter(p =>
      (state.cat === "all" || (state.cat === "fav" ? state.favs.has(p.id) : p.cat === state.cat)) &&
      (!q || searchable(p).includes(q)));
  }

  function renderPoems() {
    const list = state.list = filtered();
    const q = state.q.trim();
    const label = state.cat === "all" ? "" : state.cat === "fav" ? " نشان‌شده" : ` دَ دستهٔ «${catById[state.cat].name}»`;
    $("#count").textContent = `${fa(list.length)} شعر${label}`;
    if (!list.length) {
      $("#poems").innerHTML = `<p class="empty">${state.cat === "fav" ? "هنوز شعری نشان نکدید – دَ وختِ خواندن ستاره ره بزنید." : "شعری پیدا نشد. یک واژهٔ دیگه ره امتحان کنید."}</p>`;
      return;
    }
    $("#poems").innerHTML = list.map(p => `
      <button class="poem" type="button" data-id="${p.id}">
        <span class="poem__tag">${esc(p.form)}</span>
        <h3 class="poem__title">${highlight(p.title, q)}</h3>
        <p class="poem__text">${p.lines.slice(0, 4).map(l => highlight(l, q)).join("\n")}</p>
        <span class="poem__foot"><span>${esc(catById[p.cat].name)}</span>
        ${state.favs.has(p.id) ? '<svg class="poem__fav" aria-label="نشان‌شده"><use href="#i-star"/></svg>' : ""}</span>
      </button>`).join("");
  }
  $("#poems").addEventListener("click", e => {
    const b = e.target.closest("[data-id]");
    if (b) openPoem(b.dataset.id);
  });

  let qTimer;
  $("#q").addEventListener("input", e => {
    clearTimeout(qTimer);
    qTimer = setTimeout(() => { state.q = e.target.value; renderPoems(); }, 120);
  });

  /* ── بیتِ امروز ── */
  function renderDaily() {
    const day = Math.floor(Date.now() / 864e5);
    const p = POEMS[day % POEMS.length];
    $("#dailyText").textContent = p.lines.slice(0, 2).join("\n");
    $("#dailyTitle").textContent = `– ${p.title} · ${catById[p.cat].name}`;
    const go = () => openPoem(p.id);
    $("#daily").addEventListener("click", go);
    $("#daily").addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
  }

  $("#randomBtn").addEventListener("click", () => {
    const p = POEMS[Math.floor(Math.random() * POEMS.length)];
    openPoem(p.id);
  });

  /* ── خواننده ── */
  const reader = $("#reader");
  const verses = $("#rVerses");

  function applyReaderPrefs() {
    verses.dataset.font = state.font;
    verses.style.setProperty("--fs", `calc(${window.matchMedia("(max-width:760px)").matches ? 1.15 : 1.35}rem + ${state.size * 0.15}rem)`);
    reader.querySelectorAll("[data-font]").forEach(b => b.classList.toggle("is-on", b.dataset.font === state.font));
  }

  function openPoem(id, fromHash = false) {
    const p = POEMS.find(x => x.id === id);
    if (!p) return;
    if (!state.list.some(x => x.id === id)) state.list = POEMS;
    state.current = state.list.findIndex(x => x.id === id);

    $("#rTitle").textContent = p.title;
    $("#rMeta").textContent = `${p.form} · ${catById[p.cat].name}`;
    $("#rNote").textContent = p.note || "";
    const pairs = [];
    for (let i = 0; i < p.lines.length; i += 2) pairs.push(p.lines.slice(i, i + 2));
    verses.classList.toggle("single", p.form === "سرود");
    verses.innerHTML = pairs.map(b => `<div class="beyt">${b.map(m => `<div class="misra">${esc(m)}</div>`).join("")}</div>`).join("");
    $("#favBtn").classList.toggle("is-on", state.favs.has(p.id));
    $("#favBtn").setAttribute("aria-pressed", state.favs.has(p.id));
    applyReaderPrefs();

    if (!reader.open) reader.showModal();
    reader.scrollTop = 0;
    if (!fromHash && location.hash !== "#poem-" + id) history.replaceState(null, "", "#poem-" + id);
  }

  function closeReader() {
    if (reader.open) reader.close();
  }
  reader.addEventListener("close", () => {
    if (location.hash.startsWith("#poem-")) history.replaceState(null, "", location.pathname + location.search);
    renderPoems();
  });
  reader.addEventListener("click", e => { if (e.target === reader) closeReader(); });
  $("#closeBtn").addEventListener("click", closeReader);

  function step(d) {
    const L = state.list.length;
    if (!L) return;
    openPoem(state.list[(state.current + d + L) % L].id);
  }
  $("#nextBtn").addEventListener("click", () => step(1));
  $("#prevBtn").addEventListener("click", () => step(-1));
  reader.addEventListener("keydown", e => {
    if (e.target.matches("input")) return;
    if (e.key === "ArrowLeft") step(1);   // راست‌به‌چپ: چپ = بعدی
    if (e.key === "ArrowRight") step(-1);
  });

  reader.querySelectorAll("[data-font]").forEach(b => b.addEventListener("click", () => {
    state.font = b.dataset.font; store.set("font", state.font); applyReaderPrefs();
  }));
  reader.querySelectorAll("[data-size]").forEach(b => b.addEventListener("click", () => {
    state.size = Math.max(-2, Math.min(5, state.size + Number(b.dataset.size)));
    store.set("size", state.size); applyReaderPrefs();
  }));

  $("#favBtn").addEventListener("click", () => {
    const p = state.list[state.current];
    if (!p) return;
    state.favs.has(p.id) ? state.favs.delete(p.id) : state.favs.add(p.id);
    store.set("favs", [...state.favs]);
    const on = state.favs.has(p.id);
    $("#favBtn").classList.toggle("is-on", on);
    $("#favBtn").setAttribute("aria-pressed", on);
    toast(on ? "نشان شد ★" : "از نشان‌ها پاک شد");
  });

  $("#copyBtn").addEventListener("click", async () => {
    const p = state.list[state.current];
    if (!p) return;
    const text = `${p.title}\n\n${p.lines.join("\n")}\n\n— گنجینهٔ شعرِ هزارگی`;
    try { await navigator.clipboard.writeText(text); toast("شعر کاپی شد"); }
    catch { toast("کاپی ممکن نشد"); }
  });

  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 1600);
  }

  function fromHash() {
    const m = location.hash.match(/^#poem-(.+)$/);
    if (m) openPoem(decodeURIComponent(m[1]), true);
    else closeReader();
  }
  window.addEventListener("hashchange", fromHash);

  /* ── نگارخانه ── */
  function renderGallery() {
    const g = window.GALLERY || [];
    $("#gallery").innerHTML = g.map((it, i) => `
      <figure class="frame" data-i="${i}" tabindex="0" role="button" aria-label="${esc(it.caption)}">
        <img src="${esc(it.src)}" alt="${esc(it.caption)}">
        <figcaption>${esc(it.caption)}</figcaption>
      </figure>`).join("");
    const lb = $("#lightbox");
    const show = i => { $("#lbImg").src = g[i].src; $("#lbImg").alt = g[i].caption; $("#lbCap").textContent = g[i].caption; lb.showModal(); };
    $("#gallery").addEventListener("click", e => { const f = e.target.closest("[data-i]"); if (f) show(+f.dataset.i); });
    $("#gallery").addEventListener("keydown", e => { const f = e.target.closest("[data-i]"); if (f && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); show(+f.dataset.i); } });
    $("#lbClose").addEventListener("click", () => lb.close());
    lb.addEventListener("click", e => { if (e.target === lb) lb.close(); });
  }

  /* ── واژه‌نامه ── */
  function renderGlossary() {
    $("#glossary").innerHTML = (window.GLOSSARY || []).map(([h, d]) => `<div><dt>${esc(h)}</dt><dd>${esc(d)}</dd></div>`).join("");
  }

  /* ── روز و شب ── */
  const themeBtn = $("#themeBtn");
  function setTheme(t) {
    if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme;
    const dark = t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    themeBtn.textContent = dark ? "☀" : "☾";
  }
  setTheme(store.get("theme", null));
  themeBtn.addEventListener("click", () => {
    const cur = document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = cur === "dark" ? "light" : "dark";
    store.set("theme", next); setTheme(next);
  });

  /* ── آغاز ── */
  renderCats();
  renderChips();
  renderPoems();
  renderDaily();
  renderGallery();
  renderGlossary();
  fromHash();
})();
