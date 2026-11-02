(() => {
  "use strict";

  const POEMS = window.POEMS || [];
  const CATS = window.CATEGORIES || [];
  const C = window.CULTURE || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const catById = Object.fromEntries(CATS.map(c => [c.id, c]));
  const poemById = Object.fromEntries(POEMS.map(p => [p.id, p]));
  const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
  const fa = n => String(n).replace(/\d/g, d => FA_DIGITS[d]);

  /* ── ذخیره (اختیاری) ── */
  const store = {
    get(k, d) { try { const v = localStorage.getItem("hz:" + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem("hz:" + k, JSON.stringify(v)); } catch { /* بی‌ذخیره هم کار موکنه */ } }
  };

  const state = {
    cat: "all",
    voice: "all",
    q: "",
    favs: new Set(store.get("favs", [])),
    font: store.get("font", "nastaliq"),
    size: store.get("size", 0),
    list: POEMS,
    current: -1,
    view: "home",
    field: "all"
  };

  /* ── ابزارِ متن ── */
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const MARKS = "ً-ْٰ‌‍";
  const norm = s => s.replace(new RegExp("[" + MARKS + "]", "g"), "").replace(/ي/g, "ی").replace(/ك/g, "ک").replace(/ة/g, "ه").toLowerCase();
  const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  function highlight(text, q) {
    const safe = esc(text);
    if (!q) return safe;
    const pattern = [...norm(q)].map(ch => reEsc(esc(ch))).join("[" + MARKS + "]*");
    try { return safe.replace(new RegExp(pattern, "g"), m => `<mark>${m}</mark>`); } catch { return safe; }
  }
  const searchable = p => norm([p.title, p.form, p.voice || "", catById[p.cat]?.name || "", ...p.lines, p.note || ""].join(" "));

  /* ── تکهٔ شعر (پیوندِ هر بخشِ فرهنگی به شعر) ── */
  function snippet(id, label = "شعرِ همی بخش") {
    const p = poemById[id];
    if (!p) return "";
    return `<button type="button" class="snip" data-poem="${p.id}">
      <span class="snip__label">${esc(label)} · «${esc(p.title)}»</span>
      <span class="snip__text">${esc(p.lines.slice(0, 2).join("\n"))}</span>
      <span class="snip__go">خواندنِ شعر ←</span></button>`;
  }
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-poem]");
    if (b) openPoem(b.dataset.poem);
  });

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

  function renderVoices() {
    const voices = [...new Set(POEMS.map(p => p.voice).filter(Boolean))];
    $("#voice").innerHTML = `<option value="all">همه</option>` + voices.map(v => `<option value="${esc(v)}">${esc(v)} (${fa(POEMS.filter(p => p.voice === v).length)})</option>`).join("");
    $("#voice").addEventListener("change", e => { state.voice = e.target.value; renderPoems(); });
  }

  /* ── فهرستِ شعرها ── */
  function filtered() {
    const q = norm(state.q.trim());
    return POEMS.filter(p =>
      (state.cat === "all" || (state.cat === "fav" ? state.favs.has(p.id) : p.cat === state.cat)) &&
      (state.voice === "all" || p.voice === state.voice) &&
      (!q || searchable(p).includes(q)));
  }

  function renderPoems() {
    const list = state.list = filtered();
    const q = state.q.trim();
    const parts = [];
    if (state.cat === "fav") parts.push("نشان‌شده");
    else if (state.cat !== "all") parts.push(`دَ دستهٔ «${catById[state.cat].name}»`);
    if (state.voice !== "all") parts.push(`از زبانِ «${state.voice}»`);
    $("#count").textContent = `${fa(list.length)} شعر ${parts.join(" ")}`.trim();
    if (!list.length) {
      $("#poems").innerHTML = `<p class="empty">${state.cat === "fav" ? "هنوز شعری نشان نکدید – دَ وختِ خواندن ستاره ره بزنید." : "شعری پیدا نشد. یک واژه یا فیلترِ دیگه ره امتحان کنید."}</p>`;
      return;
    }
    $("#poems").innerHTML = list.map(p => {
      const long = p.lines.length > 4;
      return `
      <button class="poem${long ? " poem--long" : ""}" type="button" data-id="${p.id}">
        <span class="poem__tags"><span class="poem__tag">${esc(p.form)}</span>${long ? `<span class="poem__len">${fa(p.lines.length)} مصراع</span>` : ""}</span>
        <h3 class="poem__title">${highlight(p.title, q)}</h3>
        <p class="poem__text">${p.lines.slice(0, 4).map(l => highlight(l, q)).join("\n")}${long ? "\n…" : ""}</p>
        <span class="poem__foot"><span>${esc(catById[p.cat].name)}</span><span class="poem__voice">از زبانِ ${esc(p.voice || "راوی")}</span>
        ${state.favs.has(p.id) ? '<svg class="poem__fav" aria-label="نشان‌شده"><use href="#i-star"/></svg>' : ""}</span>
      </button>`;
    }).join("");
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
    const long = POEMS.filter(x => x.lines.length > 4).length;
    $("#stats").textContent = `${fa(POEMS.length)} شعر · ${fa(CATS.length)} دسته · ${fa(long)} شعرِ بلند · ${fa(new Set(POEMS.map(x => x.voice)).size)} صدا`;
  }
  $("#randomBtn").addEventListener("click", () => openPoem(POEMS[Math.floor(Math.random() * POEMS.length)].id));

  /* ── خواننده ── */
  const reader = $("#reader");
  const verses = $("#rVerses");

  function applyReaderPrefs() {
    verses.dataset.font = state.font;
    verses.style.setProperty("--fs", `calc(${matchMedia("(max-width:760px)").matches ? 1.15 : 1.35}rem + ${state.size * 0.15}rem)`);
    $$("[data-font]", reader).forEach(b => b.classList.toggle("is-on", b.dataset.font === state.font));
  }

  function openPoem(id, fromHash = false) {
    const p = poemById[id];
    if (!p) return;
    if (!state.list.some(x => x.id === id)) state.list = POEMS;
    state.current = state.list.findIndex(x => x.id === id);

    $("#rTitle").textContent = p.title;
    $("#rMeta").textContent = `${p.form} · ${catById[p.cat].name} · از زبانِ ${p.voice || "راوی"}`;
    $("#rNote").textContent = p.note || "";
    const pairs = [];
    for (let i = 0; i < p.lines.length; i += 2) pairs.push(p.lines.slice(i, i + 2));
    verses.classList.toggle("single", p.form === "مَتَل");
    verses.innerHTML = pairs.map(b => `<div class="beyt">${b.map(m => `<div class="misra">${esc(m)}</div>`).join("")}</div>`).join("");
    $("#favBtn").classList.toggle("is-on", state.favs.has(p.id));
    $("#favBtn").setAttribute("aria-pressed", state.favs.has(p.id));
    applyReaderPrefs();

    if (!reader.open) reader.showModal();
    reader.scrollTop = 0;
    if (!fromHash && location.hash !== "#poem-" + id) history.replaceState(null, "", "#poem-" + id);
  }

  function closeReader() { if (reader.open) reader.close(); }
  reader.addEventListener("close", () => {
    if (location.hash.startsWith("#poem-")) {
      const back = state.view === "home" ? location.pathname + location.search : "#" + state.view;
      history.replaceState(null, "", back);
    }
    if (state.view === "home") renderPoems();
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
    if (e.key === "ArrowLeft") step(1);   // راست‌به‌چپ: چپ = بعدی
    if (e.key === "ArrowRight") step(-1);
  });

  $$("[data-font]", reader).forEach(b => b.addEventListener("click", () => {
    state.font = b.dataset.font; store.set("font", state.font); applyReaderPrefs();
  }));
  $$("[data-size]", reader).forEach(b => b.addEventListener("click", () => {
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
    catch {
      const r = document.createRange(); r.selectNodeContents(verses);
      const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
      toast("متن انتخاب شد – کاپی کنید");
    }
  });

  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
  }

  /* ── بخش‌های فرهنگی ── */
  function renderZendagi() {
    $("#dayline").innerHTML = (C.day || []).map(d => `
      <li class="tl">
        <div class="tl__time"><strong>${esc(d.time)}</strong><small>${esc(d.hint)}</small></div>
        <article class="tl__card">
          ${d.img ? `<img class="tl__img" src="${esc(d.img)}" alt="" loading="eager">` : ""}
          <h3>${esc(d.title)}</h3>
          <p class="who">${d.who.map(w => `<span>${esc(w)}</span>`).join("")}</p>
          <p>${esc(d.text)}</p>
          ${snippet(d.poem)}
        </article>
      </li>`).join("");
    $("#seasons").innerHTML = (C.seasons || []).map(s => `
      <article class="season" style="--c:${s.color}">
        <h3>${esc(s.name)}</h3><small>${esc(s.sub)}</small>
        <p>${esc(s.text)}</p>${snippet(s.poem, "شعرِ فصل")}
      </article>`).join("");
    $("#foods").innerHTML = (C.food || []).map(f => `
      <article class="food"><span class="food__tag">${esc(f.tag)}</span><h3>${esc(f.name)}</h3><p>${esc(f.text)}</p></article>`).join("");
  }

  function renderBazi() {
    $("#games").innerHTML = (C.games || []).map(g => `
      <article class="card">
        <h3>${esc(g.name)}</h3>
        <p class="who"><span>${esc(g.who)}</span><span>${esc(g.season)}</span></p>
        <p>${esc(g.text)}</p>${snippet(g.poem)}
      </article>`).join("");
    $("#crafts").innerHTML = (C.crafts || []).map(g => `<article class="card"><h3>${esc(g.name)}</h3><p>${esc(g.text)}</p></article>`).join("");
  }

  function renderRasm() {
    $("#wedding").innerHTML = (C.wedding || []).map((w, i) => `
      <li class="step">
        <span class="step__n">${fa(i + 1)}</span>
        <div class="step__body"><h3>${esc(w.title)}</h3><p>${esc(w.text)}</p>${w.poem ? snippet(w.poem) : ""}</div>
      </li>`).join("");
    $("#ceremonies").innerHTML = (C.ceremonies || []).map(c => `
      <article class="card"><h3>${esc(c.name)}</h3><p>${esc(c.text)}</p>${snippet(c.poem)}</article>`).join("");
  }

  function renderLebas() {
    const dl = arr => arr.map(d => `<div><dt>${esc(d.name)}</dt><dd>${esc(d.text)}</dd></div>`).join("");
    $("#dressW").innerHTML = dl(C.clothing?.women || []);
    $("#dressM").innerHTML = dl(C.clothing?.men || []);
    $("#stitches").innerHTML = (C.clothing?.stitches || []).map(s => `<span class="chip">${esc(s)}</span>`).join("");
  }

  function renderPeople() {
    const people = C.people || [];
    const fields = ["all", ...new Set(people.map(p => p.field))];
    $("#fields").innerHTML = fields.map(f => `<button type="button" class="chip" role="tab" data-field="${esc(f)}" aria-selected="${state.field === f}">${f === "all" ? "همه" : esc(f)}</button>`).join("");
    $("#people").innerHTML = people.filter(p => state.field === "all" || p.field === state.field).map(p => `
      <article class="person">
        <div class="person__seal" aria-hidden="true">${esc([...p.name.replace(/^سید /, "")][0])}</div>
        <div class="person__body">
          <h3>${esc(p.name)}</h3>
          <p class="person__meta"><span>${esc(p.years)}</span><span>${esc(p.place)}</span><span class="person__field">${esc(p.field)}</span></p>
          <p class="person__role">${esc(p.role)}</p>
          <p class="person__why"><strong>چرا مهم است؟</strong> ${esc(p.why)}</p>
        </div>
      </article>`).join("");
  }
  $("#fields").addEventListener("click", e => {
    const b = e.target.closest("[data-field]");
    if (b) { state.field = b.dataset.field; renderPeople(); }
  });

  function renderTarikh() {
    $("#history").innerHTML = (C.history || []).map(h => `<li><span class="history__when">${esc(h.when)}</span><p>${esc(h.text)}</p></li>`).join("");
    $("#perspectives").innerHTML = (C.perspectives || []).map(p => `
      <article class="card card--voice"><h3>${esc(p.title)}</h3><p>${esc(p.text)}</p>
      <p class="poemlinks">${p.poems.map(id => poemById[id] ? `<button type="button" class="linkbtn" data-poem="${id}">«${esc(poemById[id].title)}»</button>` : "").join("")}</p></article>`).join("");
    $("#sources").innerHTML = (C.sources || []).map(([t, u]) => `<li><a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)}</a></li>`).join("");
  }

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

  function renderGlossary() {
    $("#glossary").innerHTML = (window.GLOSSARY || []).map(([h, d]) => `<div><dt>${esc(h)}</dt><dd>${esc(d)}</dd></div>`).join("");
  }

  /* ── مسیرها (هر صفحه یک #نام) ── */
  const VIEWS = ["zendagi", "bazi", "rasm", "lebas", "mashahir", "tarikh"];
  const HOME_ANCHORS = ["ashar", "dasta", "negarkhana", "wazhanama", "darbara"];

  function showView(v) {
    if (state.view === v) return false;
    state.view = v;
    $$(".view").forEach(el => { el.hidden = el.id !== "view-" + v; });
    $$("#nav a").forEach(a => a.classList.toggle("is-on", a.dataset.view === v));
    return true;
  }

  function route() {
    const h = decodeURIComponent(location.hash.slice(1));
    if (h.startsWith("poem-")) {
      if (!$(".view:not([hidden])")) showView("home");
      openPoem(h.slice(5), true);
      return;
    }
    closeReader();
    if (VIEWS.includes(h)) {
      if (showView(h)) window.scrollTo(0, 0);
    } else {
      const changed = showView("home");
      if (HOME_ANCHORS.includes(h)) $("#" + h).scrollIntoView();
      else if (changed || h === "") window.scrollTo(0, 0);
    }
  }
  window.addEventListener("hashchange", route);

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
  renderVoices();
  renderPoems();
  renderDaily();
  renderGallery();
  renderGlossary();
  renderZendagi();
  renderBazi();
  renderRasm();
  renderLebas();
  renderPeople();
  renderTarikh();
  state.view = null;
  route();
})();
