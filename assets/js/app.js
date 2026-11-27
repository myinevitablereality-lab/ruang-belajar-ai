/* Portal publik: router, halaman utama, halaman isi, login, dan kuesioner. */
(function () {
  const S = window.ACL_STORE;
  const U = window.ACL_UI;
  const { esc, heading, md, icons, levelBadge, LEVEL_LABEL } = U;

  const $topbar = document.getElementById("topbar");
  const $heroTop = document.getElementById("heroTop");
  const $tabs = document.getElementById("tabsBar");
  const $main = document.getElementById("main");
  const $foot = document.getElementById("footLinks");
  document.getElementById("year").textContent = new Date().getFullYear();

  const state = { sections: [], items: [], learner: S.getLearner(), admin: null, path: null, next: null };
  const isAuthed = () => !!(state.learner || state.admin);

  // ---------------- helpers ----------------
  const secById = (id) => state.sections.find((s) => s.id === id);
  const secBySlug = (slug) => state.sections.find((s) => s.slug === slug);
  const itemById = (id) => state.items.find((i) => i.id === id);
  const itemsOf = (sec) => state.items.filter((i) => i.section_id === sec.id);
  const tagSlug = (t) => U.slugify(t);

  function allTags(items) {
    const m = new Map();
    for (const it of items) for (const t of it.tags) {
      const k = tagSlug(t);
      if (!k) continue;
      const cur = m.get(k) || { slug: k, name: t, count: 0 };
      cur.count++; m.set(k, cur);
    }
    return [...m.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }

  function itemMeta(it) {
    const sec = secById(it.section_id);
    if (!sec) return "";
    if (sec.type === "videos") return it.duration ? `${icons.clock}<span>${esc(it.duration)}</span>` : "";
    if (sec.type === "articles") return `<span>${U.readMinutes(it.body)} menit baca</span>`;
    return it.category ? `<span>${esc(it.category)}</span>` : "";
  }

  function itemHref(it) {
    const sec = secById(it.section_id);
    if (!sec) return "#/";
    return sec.type === "articles" ? `#/${sec.slug}/baca/${encodeURIComponent(it.id)}` : `#/${sec.slug}?item=${encodeURIComponent(it.id)}`;
  }

  function parseHash() {
    const h = location.hash.replace(/^#\/?/, "");
    const [p, q] = h.split("?");
    return { parts: p.split("/").filter(Boolean).map(decodeURIComponent), query: new URLSearchParams(q || "") };
  }

  function setTitle(t) { document.title = t ? `${t} — Ruang Belajar AI` : "Ruang Belajar AI — AI Creator Labs"; }

  // Rekomendasi: urut per bagian, diselang-seling agar campuran resource/video/artikel.
  function recommend(level, n = 6) {
    const lists = state.sections.map((s) => itemsOf(s).filter((i) => i.level === level));
    const out = [];
    for (let k = 0; out.length < n && lists.some((l) => l[k]); k++) for (const l of lists) if (l[k] && out.length < n) out.push(l[k]);
    if (out.length < n) for (const it of state.items) if (!out.includes(it) && out.length < n) out.push(it);
    return out;
  }

  // ---------------- chrome: topbar & tabs ----------------
  function renderTopbar() {
    const L = state.learner;
    const A = state.admin;
    const right = !L && A
      ? `<div class="user-chip">
          <button type="button" aria-haspopup="true" aria-expanded="false" data-menu-toggle>
            <span class="avatar">${esc(A.email[0].toUpperCase())}</span><span class="email">Admin</span>
          </button>
          <div class="menu" role="menu">
            <div class="menu-head">${esc(A.email)}<br>Masuk sebagai <strong style="color:var(--text)">Admin</strong></div>
            <a href="admin.html" role="menuitem">${icons.edit} Halaman admin</a>
            <button type="button" role="menuitem" data-logout>${icons.logout} Keluar</button>
          </div>
        </div>`
      : L
      ? `<div class="user-chip">
          <button type="button" aria-haspopup="true" aria-expanded="false" data-menu-toggle>
            <span class="avatar">${esc(L.email[0].toUpperCase())}</span><span class="email">${esc(L.email)}</span>
          </button>
          <div class="menu" role="menu">
            <div class="menu-head">${esc(L.email)}${L.level ? `<br>Level: <strong style="color:var(--text)">${LEVEL_LABEL[L.level]}</strong>` : ""}</div>
            <a href="#/kuesioner" role="menuitem">${icons.spark} Ulangi kuesioner</a>
            <button type="button" role="menuitem" data-logout>${icons.logout} Keluar</button>
          </div>
        </div>`
      : "";
    $foot.innerHTML = isAuthed() ? `<a href="#/">Beranda</a>${A ? ` &nbsp;·&nbsp; <a href="admin.html">Admin</a>` : ""}` : "";
    $topbar.innerHTML = `<div class="wrap">
        <a class="brand" href="#/" aria-label="Ruang Belajar AI — beranda">${U.mark}<span>AI Creator Labs<small>Ruang Belajar AI</small></span></a>
        <div class="topbar-right">${right}</div>
      </div>`;
  }

  function renderTabs(activeSlug, isHome) {
    $tabs.classList.toggle("show-home", !isHome);
    $tabs.innerHTML = `<div class="wrap tabs-inner">
        <a class="icon-btn tabs-home" href="#/" aria-label="Kembali ke beranda" title="Beranda" ${isHome ? 'tabindex="-1"' : ""}>${icons.home}</a>
        <div class="tabs">${state.sections.map((s) =>
          `<a class="tab ${s.slug === activeSlug ? "active" : ""}" href="#/${esc(s.slug)}" ${s.slug === activeSlug ? 'aria-current="page"' : ""}>${esc(s.label)}</a>`).join("")}
        </div>
        <span></span>
      </div>`;
    const active = $tabs.querySelector(".tab.active");
    if (active) active.scrollIntoView({ block: "nearest", inline: "center" });
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { $tabs.classList.toggle("stuck", $tabs.getBoundingClientRect().top <= 0.5 && window.scrollY > 4); ticking = false; });
  }
  window.addEventListener("scroll", onScroll, { passive: true });

  // ---------------- komponen kartu ----------------
  function resourceCard(it) {
    return `<a class="card vcard" href="${itemHref(it)}" data-item="${esc(it.id)}">
        <div class="cover">${U.cover(it, "cards")}${it.category ? `<span class="badge cover-badge">${esc(it.category)}</span>` : ""}</div>
        <div class="vbody">
          <h3>${esc(it.title)}</h3>
          <p>${esc(it.summary)}</p>
          <div class="card-foot">${levelBadge(it.level)}<span class="go">Detail ${icons.arrowRight}</span></div>
        </div>
      </a>`;
  }
  function videoCard(it) {
    const id = U.ytId(it.url);
    return `<a class="card vcard" href="${itemHref(it)}" data-item="${esc(it.id)}">
        <div class="thumb">${id ? `<img src="${U.ytThumb(id)}" alt="" loading="lazy" decoding="async" width="480" height="360">` : ""}
          <span class="play">${icons.play}</span>${it.duration ? `<span class="duration">${esc(it.duration)}</span>` : ""}</div>
        <div class="vbody">
          <h3>${esc(it.title)}</h3>
          <p style="-webkit-line-clamp:2">${esc(it.summary)}</p>
          <div class="card-foot">${levelBadge(it.level)}<span class="tagline">${it.tags.slice(0, 2).map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</span></div>
        </div>
      </a>`;
  }
  function articleRow(it) {
    return `<a class="arow has-cover" href="${itemHref(it)}">
        <span class="cover arow-cover">${U.cover(it, "articles")}</span>
        <h3>${esc(it.title)}</h3>
        <span class="ameta">${levelBadge(it.level)}<span>${U.readMinutes(it.body)} menit baca</span></span>
        <p>${esc(it.summary)}</p>
        <span class="tagline">${it.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</span>
      </a>`;
  }
  function miniCard(it) {
    const sec = secById(it.section_id);
    const yt = sec && sec.type === "videos" ? U.ytId(it.url) : "";
    const art = yt ? `<img src="${U.ytThumb(yt)}" alt="" loading="lazy" decoding="async">` : U.cover(it, sec ? sec.type : "cards");
    return `<a class="mini" href="${itemHref(it)}" data-item="${esc(it.id)}">
        <span class="cover mini-cover">${art}</span>
        <span class="mini-top"><span class="kind">${esc(sec ? sec.label : "")}</span>${levelBadge(it.level)}</span>
        <h3>${esc(it.title)}</h3>
        <span class="card-foot" style="padding-top:0;justify-content:flex-start;gap:6px">${itemMeta(it)}</span>
      </a>`;
  }
  function renderGroup(sec, items) {
    if (sec.type === "videos") return `<div class="grid">${items.map(videoCard).join("")}</div>`;
    if (sec.type === "articles") return `<div class="alist">${items.map(articleRow).join("")}</div>`;
    return `<div class="grid">${items.map(resourceCard).join("")}</div>`;
  }

  // ---------------- modal item ----------------
  // Catat materi yang dibuka pengguna (untuk dashboard admin).
  function track(it) {
    if (state.learner && it) S.trackView(state.learner.email, it.id).catch(() => {});
  }

  function openItem(it) {
    const sec = secById(it.section_id);
    if (!sec) return;
    if (sec.type === "articles") { location.hash = itemHref(it); return; }
    track(it);
    if (sec.type === "videos") {
      const id = U.ytId(it.url);
      U.openModal(`
        <div class="video-frame">${id
          ? `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1" title="${esc(it.title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`
          : `<div class="empty" style="position:absolute;inset:0;display:grid;place-items:center;border:0">Link video belum valid.</div>`}</div>
        <div class="modal-body">
          <div class="modal-meta">${levelBadge(it.level)}${it.duration ? `<span class="level">${icons.clock} ${esc(it.duration)}</span>` : ""}</div>
          <h2>${esc(it.title)}</h2>
          <p class="modal-lede" style="margin:0">${esc(it.summary)}</p>
          ${id ? `<div class="modal-actions" style="margin-top:16px;padding-top:16px"><a class="link" href="https://www.youtube.com/watch?v=${id}" target="_blank" rel="noopener noreferrer">Buka di YouTube ${icons.external}</a></div>` : ""}
        </div>`, { video: true });
      return;
    }
    const url = U.safeUrl(it.url);
    U.openModal(`<div class="cover modal-cover">${U.cover(it, "cards")}</div>
      <div class="modal-body">
        <div class="modal-meta">${it.category ? `<span class="badge">${esc(it.category)}</span>` : ""}${levelBadge(it.level)}</div>
        <h2>${esc(it.title)}</h2>
        <p class="modal-lede">${esc(it.summary)}</p>
        ${it.body ? `<div class="prose">${md(it.body)}</div>` : ""}
        ${it.tags.length ? `<div class="tagline" style="margin-top:14px">${it.tags.map((t) => `<a class="tag" href="#/cari?tag=${tagSlug(t)}" data-close>${esc(t)}</a>`).join("")}</div>` : ""}
        <div class="modal-actions">
          ${url ? `<a class="btn btn-primary" href="${esc(url)}" target="_blank" rel="noopener noreferrer">Buka resource ${icons.external}</a>` : ""}
          <button class="btn btn-ghost" data-close>Tutup</button>
        </div>
      </div>`, { wide: true });
  }

  // ---------------- halaman ----------------
  function capsulesHTML(active = {}) {
    const lv = (state.learner && state.learner.level) || "beginner";
    const tags = allTags(state.items).slice(0, 6);
    return `<div class="capsules" role="list">
        <a role="listitem" class="capsule accent ${active.level ? "active" : ""}" href="#/cari?level=${lv}">${icons.spark} Mulai dari sini</a>
        ${tags.map((t) => `<a role="listitem" class="capsule ${active.tag === t.slug ? "active" : ""}" href="#/cari?tag=${t.slug}">${esc(t.name)} <span class="count">${t.count}</span></a>`).join("")}
      </div>`;
  }
  function composerHTML(value = "") {
    return `<form class="composer" data-composer role="search">
        <label class="sr-only" for="ask">Cari materi</label>
        <textarea id="ask" rows="1" placeholder="Mau belajar apa hari ini?" autocomplete="off">${esc(value)}</textarea>
        <button class="send" type="submit" aria-label="Cari" ${value ? "" : "disabled"}>${icons.arrowUp}</button>
      </form>
      <div class="composer-hint">Tekan <kbd>Enter</kbd> untuk mencari di semua resource, video, dan artikel</div>`;
  }

  function viewHome() {
    setTitle("");
    $heroTop.innerHTML = `<section class="hero wrap">
        <span class="eyebrow"><i></i>AI Creator Labs · Portal Belajar</span>
        <h1 class="display">Ruang <em>Belajar</em> AI</h1>
        <p class="lede">Resource pilihan, pustaka video, dan artikel untuk belajar AI dengan tenang, satu langkah setiap kali.</p>
      </section>`;
    const L = state.learner;
    const lv = (L && L.level) || "beginner";
    const recs = recommend(lv);
    $main.innerHTML = `
      <div class="wrap hero-below">${capsulesHTML()}${composerHTML()}</div>
      <section class="section wrap" aria-labelledby="rec-h">
        <div class="section-head">
          <div>
            <span class="kicker">${L && L.level ? `Untukmu · ${LEVEL_LABEL[L.level]}` : "Untuk pemula"}</span>
            <h2 id="rec-h">${L && L.level ? "Rekomendasi <em>pertama</em>mu" : "Mulai dari <em>sini</em>"}</h2>
          </div>
          ${L && L.level
            ? `<a class="link" href="#/kuesioner">Ulangi kuesioner ${icons.arrowRight}</a>`
            : L ? `<a class="link" href="#/kuesioner">Isi kuesioner untuk rekomendasi sesuai levelmu ${icons.arrowRight}</a>` : ""}
        </div>
        ${recs.length ? `<div class="rec-row">${recs.map(miniCard).join("")}</div>` : `<div class="empty">Belum ada materi.</div>`}
      </section>`;
  }

  function pageHead({ eyebrow, title, desc, crumbs }) {
    return `<header class="page-head wrap">
        ${crumbs ? `<nav class="crumbs" aria-label="Breadcrumb">${crumbs}</nav>` : `<span class="eyebrow"><i></i>${esc(eyebrow)}</span>`}
        <h1 class="page-title">${title}</h1>
        ${desc ? `<p class="page-desc">${desc}</p>` : ""}
      </header>`;
  }

  function viewSection(sec, query) {
    setTitle(sec.label);
    const items = itemsOf(sec);
    const head = pageHead({ eyebrow: `${sec.label} · ${items.length} ${sec.type === "videos" ? "video" : sec.type === "articles" ? "artikel" : "item"}`, title: heading(sec.heading || sec.label), desc: esc(sec.description) });

    if (sec.type === "articles") {
      const tags = allTags(items);
      $main.innerHTML = head + `<div class="wrap">
          ${items.length ? `<div class="tag-grid">
            <a class="tag-tile" href="#/${sec.slug}/tag/semua"><span class="name"><em>Semua</em></span><span class="meta"><span>${items.length} artikel</span>${icons.arrowRight}</span></a>
            ${tags.map((t) => `<a class="tag-tile" href="#/${sec.slug}/tag/${t.slug}"><span class="name">${esc(t.name)}</span><span class="meta"><span>${t.count} artikel</span>${icons.arrowRight}</span></a>`).join("")}
          </div>` : `<div class="empty"><h3>Belum ada artikel</h3>Artikel akan muncul di sini.</div>`}
        </div>`;
      return;
    }

    let filterKey, options, active, list;
    if (sec.type === "videos") {
      filterKey = "level";
      options = S.LEVELS.filter((l) => items.some((i) => i.level === l)).map((l) => ({ v: l, label: LEVEL_LABEL[l] }));
    } else {
      filterKey = "kategori";
      const cats = [...new Set(items.map((i) => i.category).filter(Boolean))];
      options = cats.map((c) => ({ v: U.slugify(c), label: c }));
    }
    active = query.get(filterKey) || "";
    list = !active ? items : items.filter((i) => (filterKey === "level" ? i.level === active : U.slugify(i.category) === active));
    const chips = options.length > 1 ? `<div class="filters" role="group" aria-label="Saring">
        <a class="chip ${!active ? "active" : ""}" href="#/${sec.slug}">Semua</a>
        ${options.map((o) => `<a class="chip ${active === o.v ? "active" : ""}" href="#/${sec.slug}?${filterKey}=${o.v}">${esc(o.label)}</a>`).join("")}
      </div>` : "";
    $main.innerHTML = head + `<div class="wrap">${chips}
        ${list.length ? renderGroup(sec, list) : `<div class="empty"><h3>Belum ada isi</h3>Materi akan muncul di sini.</div>`}
      </div>`;
  }

  function viewTag(sec, slug) {
    const items = itemsOf(sec);
    const tags = allTags(items);
    const isAll = slug === "semua";
    const tag = tags.find((t) => t.slug === slug);
    if (!isAll && !tag) return viewNotFound();
    const list = isAll ? items : items.filter((i) => i.tags.some((t) => tagSlug(t) === slug));
    const name = isAll ? "Semua" : tag.name;
    setTitle(`${name} · ${sec.label}`);
    $main.innerHTML = pageHead({
      crumbs: `<a href="#/${sec.slug}">${esc(sec.label)}</a><span>/</span><span>Topik</span>`,
      title: `<em>${esc(name)}</em>`,
      desc: `${list.length} artikel`,
    }) + `<div class="wrap">
        <div class="filters" role="group" aria-label="Pilih topik">
          <a class="chip ${isAll ? "active" : ""}" href="#/${sec.slug}/tag/semua">Semua</a>
          ${tags.map((t) => `<a class="chip ${t.slug === slug ? "active" : ""}" href="#/${sec.slug}/tag/${t.slug}">${esc(t.name)}</a>`).join("")}
        </div>
        ${renderGroup(sec, list)}
      </div>`;
  }

  function viewArticle(sec, id) {
    const it = itemById(id);
    if (!it || it.section_id !== sec.id) return viewNotFound();
    setTitle(it.title);
    track(it);
    const first = it.tags[0];
    const related = itemsOf(sec).filter((x) => x.id !== it.id && x.tags.some((t) => it.tags.includes(t))).slice(0, 3);
    $main.innerHTML = `<article class="reader wrap">
        <header class="page-head">
          <nav class="crumbs" aria-label="Breadcrumb"><a href="#/${sec.slug}">${esc(sec.label)}</a>${first ? `<span>/</span><a href="#/${sec.slug}/tag/${tagSlug(first)}">${esc(first)}</a>` : ""}</nav>
          <h1 class="page-title">${esc(it.title)}</h1>
          <div class="reader-meta">${levelBadge(it.level)}<span>${U.readMinutes(it.body)} menit baca</span>
            <span class="tagline">${it.tags.map((t) => `<a class="tag" href="#/${sec.slug}/tag/${tagSlug(t)}">${esc(t)}</a>`).join("")}</span></div>
        </header>
        <div class="cover reader-cover">${U.cover(it, "articles")}</div>
        ${it.summary ? `<p class="page-desc" style="margin:0 0 8px;font-size:18px">${esc(it.summary)}</p>` : ""}
        <div class="prose">${md(it.body)}</div>
        <a class="link" href="#/${sec.slug}${first ? `/tag/${tagSlug(first)}` : ""}">${icons.arrowLeft} Kembali ke ${esc(first || sec.label)}</a>
      </article>
      ${related.length ? `<section class="section wrap"><div class="section-head"><div><span class="kicker">Lanjut membaca</span><h2>Artikel <em>terkait</em></h2></div></div>
        <div class="alist">${related.map(articleRow).join("")}</div></section>` : ""}`;
  }

  const STOP = new Set("mau ingin pengen belajar apa cara gimana bagaimana saya aku kamu yang dan atau untuk dengan di ke dari tentang tolong hari ini dong sih mulai bikin buat pakai pake".split(" "));
  function search(q) {
    const tokens = q.toLowerCase().split(/[^a-z0-9à-ÿ]+/i).filter((t) => t.length > 1 && !STOP.has(t));
    const effective = tokens.length ? tokens : q.toLowerCase().split(/\s+/).filter(Boolean);
    return state.items.map((it) => {
      const sec = secById(it.section_id);
      const hay = [it.title, it.title, it.summary, it.category, it.tags.join(" "), it.tags.join(" "), it.body, sec && sec.label].join(" ").toLowerCase();
      const score = effective.reduce((n, t) => n + (hay.includes(t) ? 1 : 0), 0);
      return { it, score };
    }).filter((r) => r.score > 0).sort((a, b) => b.score - a.score).map((r) => r.it);
  }

  function viewSearch(query) {
    const q = (query.get("q") || "").trim();
    const tag = query.get("tag") || "";
    const level = query.get("level") || "";
    let list, title, desc;
    if (q) { list = search(q); title = `Hasil untuk <em>“${esc(q)}”</em>`; }
    else if (tag) {
      const t = allTags(state.items).find((x) => x.slug === tag);
      list = state.items.filter((i) => i.tags.some((x) => tagSlug(x) === tag));
      title = `Topik <em>${esc(t ? t.name : tag)}</em>`;
    } else if (level && LEVEL_LABEL[level]) {
      list = state.items.filter((i) => i.level === level);
      title = `Mulai dari <em>sini</em>`;
      desc = `Materi level ${LEVEL_LABEL[level]}${state.learner && state.learner.level === level ? ", sesuai hasil kuesionermu" : ""}.`;
    } else { list = []; title = "Cari <em>materi</em>"; }
    setTitle(q ? `Cari: ${q}` : "Cari");
    const groups = state.sections.map((s) => ({ s, items: list.filter((i) => i.section_id === s.id) })).filter((g) => g.items.length);
    $main.innerHTML = pageHead({ eyebrow: `${list.length} materi ditemukan`, title, desc: desc ? esc(desc) : "" }) + `<div class="wrap">
        <div class="hero-below" style="margin-bottom:44px">${capsulesHTML({ tag, level })}${composerHTML(q)}</div>
        ${groups.length ? groups.map((g) => `<section class="results-group">
            <div class="section-head"><div><span class="kicker">${g.items.length} hasil</span><h2>${heading(g.s.heading || g.s.label)}</h2></div>
            <a class="link" href="#/${g.s.slug}">Lihat semua ${icons.arrowRight}</a></div>
            ${renderGroup(g.s, g.items)}</section>`).join("")
          : `<div class="empty"><h3>Belum ketemu</h3>Coba kata lain, atau pilih salah satu topik di atas.</div>`}
      </div>`;
  }

  // ---------------- login ----------------
  function viewLogin(query) {
    setTitle("Masuk");
    let role = query.get("peran") === "admin" ? "admin" : "user";
    const draw = () => {
      $main.innerHTML = `<div class="wrap"><div class="auth">
        <div class="panel">
          <h1 class="panel-title">Selamat <em>datang</em></h1>
          <p class="panel-sub">${role === "user" ? "Masuk untuk mulai belajar dan mendapat rekomendasi materi sesuai levelmu." : "Masuk ke halaman pengelola konten."}</p>
          <div class="seg" role="tablist" aria-label="Pilih peran">
            <button type="button" role="tab" aria-selected="${role === "user"}" data-role="user">Pengguna</button>
            <button type="button" role="tab" aria-selected="${role === "admin"}" data-role="admin">Admin</button>
          </div>
          <form data-login novalidate>
            <label class="field"><span>Email</span><input type="email" name="email" required autocomplete="email" placeholder="nama@email.com"></label>
            ${role === "admin" ? `<label class="field"><span>Password</span><input type="password" name="password" required autocomplete="current-password" placeholder="••••••••"></label>` : ""}
            <p class="form-error" data-err></p>
            <button class="btn btn-primary btn-block" type="submit" style="height:46px;margin-top:6px">${role === "user" ? "Lanjutkan" : "Masuk sebagai admin"} ${icons.arrowRight}</button>
          </form>
          <p class="note">${role === "user" ? "Tanpa password. Pengguna baru akan menjawab 5 pertanyaan singkat dulu." : "Akses admin hanya untuk tim AI Creator Labs."}</p>
        </div>
        ${S.mode === "demo" ? `<p class="demo-note">Mode demo: data tersimpan di browser ini saja. Hubungkan Supabase di <code>config.js</code> untuk data asli.</p>` : ""}
      </div></div>`;
      $main.querySelectorAll("[data-role]").forEach((b) => b.addEventListener("click", () => { role = b.dataset.role; draw(); }));
      const form = $main.querySelector("[data-login]");
      form.email.focus({ preventScroll: true });
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const err = form.querySelector("[data-err]");
        const btn = form.querySelector("button[type=submit]");
        err.textContent = "";
        const email = form.email.value.trim();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { err.textContent = "Format email belum benar."; form.email.focus(); return; }
        btn.disabled = true;
        try {
          if (role === "admin") {
            if (!form.password.value) throw new Error("Password wajib diisi.");
            await S.adminSignIn(email, form.password.value);
            location.href = "admin.html";
            return;
          }
          const L = await S.learnerLogin(email);
          state.learner = L; S.setLearner(L); renderTopbar();
          if (!L.level) location.hash = "#/kuesioner";
          else { U.toast(`Selamat datang kembali! Level kamu: ${LEVEL_LABEL[L.level]}`, "ok"); location.hash = state.next || "#/"; state.next = null; }
        } catch (ex) { err.textContent = ex.message || "Terjadi kesalahan."; btn.disabled = false; }
      });
    };
    draw();
  }

  // ---------------- kuesioner ----------------
  const QUESTIONS = [
    { q: "Seberapa sering kamu memakai tools AI seperti ChatGPT, Claude, atau Gemini?", o: ["Belum pernah atau baru mencoba sekali-dua kali", "Kadang-kadang, untuk hal tertentu", "Hampir setiap hari, termasuk untuk pekerjaan"] },
    { q: "Bagaimana biasanya kamu menulis prompt?", o: ["Langsung mengetik pertanyaan apa adanya", "Menambahkan konteks, contoh, dan format yang diinginkan", "Memakai template, system prompt, dan mengevaluasi hasilnya"] },
    { q: "Pernah membuat otomasi atau workflow yang memakai AI?", o: ["Belum pernah", "Pernah mencoba lewat tutorial", "Ya, ada workflow yang sudah berjalan rutin"] },
    { q: "Seberapa paham kamu dengan istilah seperti token, konteks, RAG, atau agent?", o: ["Belum familiar", "Paham sebagian, misalnya token dan konteks", "Paham dan pernah menerapkannya"] },
    { q: "Apa tujuan utamamu belajar di sini?", o: ["Mengenal AI dari dasar", "Memakai AI untuk produktivitas dan konten", "Membangun produk, agent, atau sistem dengan AI"] },
  ];
  const levelFromScore = (s) => (s <= 3 ? "beginner" : s <= 7 ? "intermediate" : "advanced");
  const LEVEL_TEXT = {
    beginner: "Kita mulai dari fondasi: mengenal cara kerja AI dan menulis prompt yang jelas.",
    intermediate: "Kamu sudah nyaman memakai AI. Saatnya merapikan teknik dan mulai membuat otomasi.",
    advanced: "Kamu siap membangun: agent, workflow kompleks, dan memahami teknologinya lebih dalam.",
  };

  function viewQuiz() {
    setTitle("Kuesioner");
    const L = state.learner;
    if (!L) { location.replace("#/masuk"); return; }
    let step = 0;
    const answers = new Array(QUESTIONS.length).fill(null);
    const draw = () => {
      const Q = QUESTIONS[step];
      $main.innerHTML = `<div class="wrap"><div class="quiz panel">
          <div class="progress" aria-hidden="true"><span style="width:${((step + 1) / QUESTIONS.length) * 100}%"></span></div>
          <span class="q-step">Pertanyaan ${step + 1} dari ${QUESTIONS.length}</span>
          <h1 class="q-title">${esc(Q.q)}</h1>
          <div class="options" role="group" aria-label="Pilihan jawaban">
            ${Q.o.map((o, i) => `<button type="button" class="option" aria-pressed="${answers[step] === i}" data-opt="${i}"><span class="dot"></span>${esc(o)}</button>`).join("")}
          </div>
          <div class="quiz-nav">
            <button class="btn btn-ghost" type="button" data-back ${step === 0 ? "disabled" : ""}>${icons.arrowLeft} Kembali</button>
            <button class="btn btn-primary" type="button" data-next ${answers[step] === null ? "disabled" : ""}>${step === QUESTIONS.length - 1 ? "Lihat hasil" : "Lanjut"} ${icons.arrowRight}</button>
          </div>
        </div></div>`;
      $main.querySelectorAll("[data-opt]").forEach((b) => b.addEventListener("click", () => {
        answers[step] = +b.dataset.opt;
        $main.querySelectorAll("[data-opt]").forEach((x) => x.setAttribute("aria-pressed", x === b));
        $main.querySelector("[data-next]").disabled = false;
      }));
      $main.querySelector("[data-back]").addEventListener("click", () => { step--; draw(); });
      $main.querySelector("[data-next]").addEventListener("click", async (e) => {
        if (step < QUESTIONS.length - 1) { step++; draw(); return; }
        e.currentTarget.disabled = true;
        const level = levelFromScore(answers.reduce((a, b) => a + b, 0));
        try {
          await S.learnerSaveLevel(L.email, level, answers);
          state.learner = { ...L, level }; S.setLearner(state.learner); renderTopbar();
          drawResult(level);
        } catch (ex) { U.toast(ex.message || "Gagal menyimpan hasil.", "err"); e.currentTarget.disabled = false; }
      });
      const first = $main.querySelector('[aria-pressed="true"]') || $main.querySelector("[data-opt]");
      first.focus({ preventScroll: true });
    };
    const drawResult = (level) => {
      const recs = recommend(level, 3);
      $main.innerHTML = `<div class="wrap"><div class="quiz panel" style="text-align:center">
          <span class="q-step">Level kamu</span>
          <div class="result-level">${LEVEL_LABEL[level]}</div>
          <p class="page-desc">${LEVEL_TEXT[level]}</p>
          <div style="text-align:left;margin-top:28px"><span class="kicker">Materi pertama yang kami sarankan</span>
            <div class="options">${recs.map(miniCard).join("")}</div></div>
          <div class="quiz-nav" style="justify-content:center"><a class="btn btn-primary" href="#/">Mulai belajar ${icons.arrowRight}</a></div>
        </div></div>`;
      window.scrollTo(0, 0);
    };
    draw();
  }

  function viewNotFound() {
    setTitle("Tidak ditemukan");
    $main.innerHTML = `<div class="wrap" style="padding-top:64px"><div class="empty"><h3>Halaman tidak ditemukan</h3><p>Mungkin sudah dipindah atau dihapus.</p><a class="btn btn-ghost" href="#/">${icons.home} Kembali ke beranda</a></div></div>`;
  }

  // ---------------- router ----------------
  function route() {
    const { parts, query } = parseHash();
    const path = parts.join("/");
    U.closeModal();
    const samePath = path === state.path;
    state.path = path;
    const [a, b, c] = parts;
    // Halaman login adalah pintu masuk: belum masuk → selalu ke #/masuk.
    if (!isAuthed() && a !== "masuk") {
      if (location.hash && location.hash !== "#/" && location.hash !== "#") state.next = location.hash;
      location.replace("#/masuk");
      return;
    }
    if (isAuthed() && a === "masuk") { location.replace("#/"); return; }
    const sec = a ? secBySlug(a) : null;
    const isHome = !a;
    if (!isHome) $heroTop.innerHTML = "";
    $tabs.hidden = a === "masuk";
    renderTabs(sec ? sec.slug : null, isHome);
    // Untuk halaman utama, tab berada di bawah judul (hero), jadi pindahkan posisinya.
    if (isHome) viewHome();
    else if (a === "masuk") viewLogin(query);
    else if (a === "kuesioner") viewQuiz();
    else if (a === "cari") viewSearch(query);
    else if (sec && !b) viewSection(sec, query);
    else if (sec && sec.type === "articles" && b === "tag" && c) viewTag(sec, c);
    else if (sec && sec.type === "articles" && b === "baca" && c) viewArticle(sec, c);
    else viewNotFound();
    if (!samePath || !query.get("item")) { window.scrollTo(0, 0); $main.focus({ preventScroll: true }); }
    if (!samePath) {
      $main.classList.remove("page-enter"); void $main.offsetWidth; $main.classList.add("page-enter");
      if (isHome) U.reveal($heroTop, ".hero > *", { step: 90 });
      U.reveal($main, ".page-head > *, .hero-below .capsule, .hero-below .composer, .composer-hint, .section-head, .filters, .grid > *, .rec-row > *, .tag-grid > *, .alist > *, .quiz, .auth > *, .reader .prose, .empty");
    }
    onScroll();
    const itemId = query.get("item");
    if (itemId) { const it = itemById(itemId); if (it) openItem(it); }
  }

  // ---------------- event global ----------------
  document.addEventListener("click", (e) => {
    const card = e.target.closest("[data-item]");
    if (card && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
      const it = itemById(card.dataset.item);
      if (it) {
        const sec = secById(it.section_id);
        if (sec && sec.type !== "articles") { e.preventDefault(); openItem(it); }
        return;
      }
    }
    const toggle = e.target.closest("[data-menu-toggle]");
    const menu = document.querySelector(".user-chip .menu");
    if (toggle && menu) { const open = !menu.classList.contains("open"); menu.classList.toggle("open", open); toggle.setAttribute("aria-expanded", open); return; }
    if (menu && !e.target.closest(".menu")) { menu.classList.remove("open"); }
    if (e.target.closest("[data-logout]")) {
      S.setLearner(null); state.learner = null;
      if (state.admin) { state.admin = null; S.adminSignOut().catch(() => {}); }
      renderTopbar(); U.toast("Kamu sudah keluar.");
      location.hash = "#/masuk";
    }
  });
  document.addEventListener("submit", (e) => {
    const f = e.target.closest("[data-composer]");
    if (!f) return;
    e.preventDefault();
    const q = f.querySelector("textarea").value.trim();
    if (q) location.hash = `#/cari?q=${encodeURIComponent(q)}`;
  });
  document.addEventListener("input", (e) => {
    if (!e.target.matches("[data-composer] textarea")) return;
    const t = e.target;
    t.style.height = "auto"; t.style.height = Math.min(Math.max(t.scrollHeight, 38), 160) + "px";
    t.classList.toggle("scroll", t.scrollHeight > 160);
    t.form.querySelector(".send").disabled = !t.value.trim();
  });
  document.addEventListener("keydown", (e) => {
    if (e.target.matches("[data-composer] textarea") && e.key === "Enter" && !e.shiftKey && !e.isComposing) {
      e.preventDefault(); e.target.form.requestSubmit();
    }
  });
  window.addEventListener("hashchange", route);

  // Contoh pertanyaan yang berganti perlahan di kolom chat (hanya saat kosong & tidak sedang diketik).
  const SUGGESTIONS = ["Mau belajar apa hari ini?", "Coba: cara menulis prompt yang tajam", "Coba: apa itu AI agent?", "Coba: otomasi pertama dengan n8n", "Coba: memahami cara kerja LLM"];
  let sIdx = 0;
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    setInterval(() => {
      const t = document.getElementById("ask");
      if (!t || t.value || document.activeElement === t || document.hidden) return;
      t.classList.add("ph-out");
      setTimeout(() => { sIdx = (sIdx + 1) % SUGGESTIONS.length; t.placeholder = SUGGESTIONS[sIdx]; t.classList.remove("ph-out"); }, 400);
    }, 3800);
  }

  // ---------------- mulai ----------------
  async function boot() {
    U.mountBackground();
    try { state.admin = await S.adminSession(); } catch { state.admin = null; }
    // Setiap kunjungan memperbarui "terakhir aktif" pengguna (dan levelnya bila diubah dari perangkat lain).
    if (state.learner) {
      try {
        const L = await S.learnerLogin(state.learner.email);
        if (L.level) { state.learner = { ...state.learner, level: L.level }; S.setLearner(state.learner); }
      } catch {}
    }
    renderTopbar();
    try {
      state.sections = await S.getSections();
      const visible = new Set(state.sections.map((s) => s.id));
      state.items = (await S.getItems()).filter((i) => visible.has(i.section_id));
    } catch (ex) {
      $main.innerHTML = `<div class="wrap" style="padding-top:64px"><div class="empty"><h3>Gagal memuat materi</h3><p>${esc(ex.message)}</p></div></div>`;
      return;
    }
    route();
  }
  boot();
})();
