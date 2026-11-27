/* Halaman admin: kelola navigasi (RESOURCES · KNOWLEDGES · ARTICLES, dst.) dan item di dalamnya. */
(function () {
  const S = window.ACL_STORE;
  const U = window.ACL_UI;
  const { esc, icons, levelBadge, LEVEL_LABEL } = U;
  const $top = document.getElementById("topbar");
  const $main = document.getElementById("main");

  const TYPES = {
    cards: { label: "Kartu resource", unit: "item", hint: "Grid kartu: judul, deskripsi singkat, kategori. Klik membuka pop-up detail." },
    videos: { label: "Pustaka video", unit: "video", hint: "Thumbnail, judul, durasi. Video YouTube diputar di pop-up." },
    articles: { label: "Artikel per tag", unit: "artikel", hint: "Pengunjung memilih tag, lalu membaca artikel di halaman ini." },
  };

  const st = { admin: null, sections: [], items: [], allItems: [], counts: {}, selected: null, view: "dashboard", period: "30", learners: [], views: [] };

  async function loadStats() {
    try { [st.learners, st.views] = await Promise.all([S.listLearners(), S.listViews()]); }
    catch (ex) { U.toast(ex.message, "err"); st.learners = []; st.views = []; }
  }

  // ---------------- login ----------------
  // Satu pintu masuk untuk pengguna dan admin: halaman login portal.
  const toLogin = () => location.replace("index.html#/masuk?peran=admin");

  // ---------------- data ----------------
  async function loadAll() {
    st.sections = await S.getSections({ includeHidden: true });
    const all = await S.getItems({ includeUnpublished: true });
    st.allItems = all;
    st.counts = {};
    for (const it of all) st.counts[it.section_id] = (st.counts[it.section_id] || 0) + 1;
    if (!st.sections.find((s) => s.id === st.selected)) st.selected = st.sections[0] ? st.sections[0].id : null;
    st.items = st.selected ? all.filter((i) => i.section_id === st.selected) : [];
  }
  const selected = () => st.sections.find((s) => s.id === st.selected);

  async function run(fn, okMsg) {
    try { await fn(); await loadAll(); renderApp(); if (okMsg) U.toast(okMsg, "ok"); }
    catch (ex) { U.toast(ex.message || "Terjadi kesalahan.", "err"); }
  }

  // ---------------- tampilan utama ----------------
  function renderApp() {
    $top.innerHTML = `<div class="wrap">
        <a class="brand" href="admin.html">${U.mark}<span>Admin<small>Ruang Belajar AI</small></span></a>
        <div class="topbar-right">
          <span class="admin-email muted">${esc(st.admin.email)}</span>
          <a class="btn btn-ghost btn-sm" href="index.html" target="_blank" rel="noopener">Lihat portal ${icons.external}</a>
          <button class="icon-btn bordered" data-logout aria-label="Keluar" title="Keluar">${icons.logout}</button>
        </div></div>`;
    const sec = selected();
    $main.innerHTML = `<div class="wrap admin">
        <aside class="admin-side">
          <button class="side-link ${st.view === "dashboard" ? "active" : ""}" data-view-dashboard>${icons.chart} Dashboard</button>
          <div class="side-sep" style="margin-top:10px"></div>
          <div class="side-head"><span class="kicker" style="margin:0">Navigasi</span>
            <button class="btn btn-ghost btn-sm" data-add-section>${icons.plus} Tambah</button></div>
          <ul class="side-list">
            ${st.sections.map((s, i) => `<li class="side-item ${st.view === "content" && s.id === st.selected ? "active" : ""} ${s.is_visible ? "" : "is-hidden"}">
                <button class="side-main" data-select="${esc(s.id)}">
                  <span class="side-label">${esc(s.label)}</span>
                  <small>${TYPES[s.type].label} · ${st.counts[s.id] || 0} ${TYPES[s.type].unit}${s.is_visible ? "" : " · disembunyikan"}</small>
                </button>
                <span class="side-actions">
                  <button class="icon-btn" data-move-section="${esc(s.id)}" data-dir="-1" aria-label="Naikkan" ${i === 0 ? "disabled" : ""}>${icons.up}</button>
                  <button class="icon-btn" data-move-section="${esc(s.id)}" data-dir="1" aria-label="Turunkan" ${i === st.sections.length - 1 ? "disabled" : ""}>${icons.down}</button>
                </span>
              </li>`).join("")}
          </ul>
          ${st.sections.length ? "" : `<p class="muted" style="font-size:13px">Belum ada navigasi. Tambahkan yang pertama.</p>`}
          <div class="side-sep"></div>
          <button class="side-link ${st.view === "learners" ? "active" : ""}" data-view-learners>${icons.user} Pengguna terdaftar</button>
          ${S.mode === "demo" ? `<div class="side-demo"><strong>Mode demo</strong><span>Perubahan tersimpan di browser ini.</span><button class="link" data-reset>Kembalikan data contoh</button></div>` : ""}
        </aside>
        <section class="admin-main">${st.view === "dashboard" ? dashboardHTML() : st.view === "learners" ? learnersHTML() : sec ? sectionHTML(sec) : `<div class="empty"><h3>Belum ada navigasi</h3><p>Klik “Tambah” untuk membuat navigasi pertama.</p></div>`}</section>
      </div>`;
  }

  function sectionHTML(sec) {
    const T = TYPES[sec.type];
    return `<header class="admin-head">
        <div>
          <span class="kicker">${T.label} · ${st.items.length} ${T.unit}</span>
          <h1 class="admin-title">${esc(sec.label)} ${sec.is_visible ? "" : '<span class="pill pill-off">Disembunyikan</span>'}</h1>
          <p class="muted" style="margin:0">Halaman: <a class="link" href="index.html#/${esc(sec.slug)}" target="_blank" rel="noopener">/#/${esc(sec.slug)}</a></p>
        </div>
        <div class="admin-head-actions">
          <button class="btn btn-ghost btn-sm" data-toggle-section="${esc(sec.id)}">${sec.is_visible ? icons.eyeOff + " Sembunyikan" : icons.eye + " Tampilkan"}</button>
          <button class="btn btn-ghost btn-sm" data-edit-section="${esc(sec.id)}">${icons.edit} Edit</button>
          <button class="btn btn-ghost btn-sm danger-text" data-del-section="${esc(sec.id)}">${icons.trash} Hapus</button>
          <button class="btn btn-primary btn-sm" data-add-item>${icons.plus} Tambah ${T.unit}</button>
        </div>
      </header>
      ${st.items.length ? `<ul class="ilist">${st.items.map((it, i) => itemRow(sec, it, i)).join("")}</ul>`
        : `<div class="empty"><h3>Masih kosong</h3><p>Tambahkan ${T.unit} pertama untuk ${esc(sec.label)}.</p><button class="btn btn-primary" data-add-item>${icons.plus} Tambah ${T.unit}</button></div>`}`;
  }

  function itemRow(sec, it, i) {
    const yt = sec.type === "videos" ? U.ytId(it.url) : "";
    const extra = sec.type === "videos" ? (it.duration ? `<span>${icons.clock} ${esc(it.duration)}</span>` : "")
      : sec.type === "cards" ? (it.category ? `<span class="badge">${esc(it.category)}</span>` : "")
      : `<span>${U.readMinutes(it.body)} menit baca</span>`;
    return `<li class="irow ${it.published ? "" : "is-hidden"}">
        <span class="irow-order">
          <button class="icon-btn" data-move-item="${esc(it.id)}" data-dir="-1" aria-label="Naikkan" ${i === 0 ? "disabled" : ""}>${icons.up}</button>
          <button class="icon-btn" data-move-item="${esc(it.id)}" data-dir="1" aria-label="Turunkan" ${i === st.items.length - 1 ? "disabled" : ""}>${icons.down}</button>
        </span>
        ${yt ? `<img class="irow-thumb" src="${U.ytThumb(yt)}" alt="" loading="lazy">` : ""}
        <span class="irow-main">
          <strong>${esc(it.title)}</strong>
          <span class="irow-meta">${levelBadge(it.level)}${extra}${it.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}${it.published ? "" : '<span class="pill pill-off">Draf</span>'}</span>
        </span>
        <span class="irow-actions">
          <button class="icon-btn" data-toggle-item="${esc(it.id)}" aria-label="${it.published ? "Sembunyikan" : "Tampilkan"}" title="${it.published ? "Sembunyikan" : "Tampilkan"}">${it.published ? icons.eye : icons.eyeOff}</button>
          <button class="icon-btn" data-edit-item="${esc(it.id)}" aria-label="Edit" title="Edit">${icons.edit}</button>
          <button class="icon-btn danger-text" data-del-item="${esc(it.id)}" aria-label="Hapus" title="Hapus">${icons.trash}</button>
        </span>
      </li>`;
  }

  // ---------------- dashboard ----------------
  const PERIODS = [["7", "7 hari"], ["30", "30 hari"], ["all", "Semua waktu"]];
  const fmtNum = (n) => n.toLocaleString("id-ID");
  const pct = (v, t) => (t ? Math.round((v / t) * 100) : 0);

  function bars(rows, { unit = "", total } = {}) {
    const max = Math.max(1, ...rows.map((r) => r.value));
    const sum = total ?? rows.reduce((a, r) => a + r.value, 0);
    return `<div class="bars">${rows.map((r) => `
        <div class="bar-row" title="${esc(r.text)}: ${fmtNum(r.value)} ${unit} (${pct(r.value, sum)}%)">
          <span class="bar-label">${r.label}</span>
          <span class="bar-track"><span class="bar-fill" style="width:${r.value ? Math.max(2, (r.value / max) * 100) : 0}%"></span></span>
          <span class="bar-value"><strong>${fmtNum(r.value)}</strong><small>${pct(r.value, sum)}%</small></span>
        </div>`).join("")}</div>`;
  }

  function dashboardHTML() {
    const days = st.period === "all" ? null : +st.period;
    const since = days ? Date.now() - days * 864e5 : 0;
    const inPeriod = (d) => Date.parse(d || 0) >= since;
    const L = st.learners;
    const V = st.views.filter((v) => inPeriod(v.created_at));
    const itemOf = new Map(st.allItems.map((i) => [i.id, i]));
    const secOf = new Map(st.sections.map((s) => [s.id, s]));
    const levelOfUser = new Map(L.map((l) => [l.email, l.level]));
    const Vk = V.filter((v) => itemOf.has(v.item_id)); // abaikan materi yang sudah dihapus

    const active = L.filter((l) => inPeriod(l.last_seen || l.created_at)).length;
    const newUsers = L.filter((l) => inPeriod(l.created_at)).length;
    const consumers = new Set(Vk.map((v) => v.learner_email)).size;
    const uniqueItems = new Set(Vk.map((v) => v.item_id)).size;
    const periodText = days ? `${days} hari terakhir` : "sejak awal";

    // 2. Hasil kuesioner
    const quizRows = [...S.LEVELS.map((lv) => ({ label: levelBadge(lv), text: LEVEL_LABEL[lv], value: L.filter((l) => l.level === lv).length })),
      { label: '<span class="level"><i style="background:var(--muted)"></i>Belum mengisi</span>', text: "Belum mengisi", value: L.filter((l) => !l.level).length }];

    // 3. Materi dikonsumsi per level materi & per jenis
    const byLevel = S.LEVELS.map((lv) => {
      const vs = Vk.filter((v) => itemOf.get(v.item_id).level === lv);
      return { label: levelBadge(lv), text: LEVEL_LABEL[lv], value: vs.length, unique: new Set(vs.map((v) => v.item_id)).size, total: st.allItems.filter((i) => i.level === lv).length };
    });
    const bySection = st.sections.map((s) => ({ label: `<span class="bar-sec">${esc(s.label)}</span>`, text: s.label, value: Vk.filter((v) => itemOf.get(v.item_id).section_id === s.id).length }));

    // Matriks level pengguna × level materi
    const userLevels = [...S.LEVELS, null];
    const cell = (ul, il) => Vk.filter((v) => (levelOfUser.get(v.learner_email) || null) === ul && itemOf.get(v.item_id).level === il).length;
    const matrix = userLevels.map((ul) => ({ ul, cells: S.LEVELS.map((il) => cell(ul, il)) })).filter((r) => r.ul || r.cells.some(Boolean));
    const mMax = Math.max(1, ...matrix.flatMap((r) => r.cells));

    // Materi terpopuler
    const countBy = new Map();
    for (const v of Vk) countBy.set(v.item_id, (countBy.get(v.item_id) || 0) + 1);
    const top = [...countBy.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

    const empty = (t) => `<p class="dash-empty">${t}</p>`;
    return `<header class="admin-head">
        <div><span class="kicker">Ringkasan · ${periodText}</span><h1 class="admin-title">Dashboard</h1>
          <p class="muted" style="margin:0">Pengguna, hasil kuesioner, dan materi yang dibuka.</p></div>
        <div class="filters" role="group" aria-label="Periode" style="margin:0">${PERIODS.map(([v, t]) => `<button class="chip ${st.period === v ? "active" : ""}" data-period="${v}">${t}</button>`).join("")}</div>
      </header>

      <div class="stat-row dash-tiles">
        <div class="stat"><span class="kicker" style="margin:0">Pengguna terdaftar</span><strong>${fmtNum(L.length)}</strong><small>${fmtNum(newUsers)} baru · ${periodText}</small></div>
        <div class="stat"><span class="kicker" style="margin:0">Pengguna aktif</span><strong>${fmtNum(active)}</strong><small>membuka portal · ${periodText}</small></div>
        <div class="stat"><span class="kicker" style="margin:0">Materi dibuka</span><strong>${fmtNum(Vk.length)}</strong><small>oleh ${fmtNum(consumers)} pengguna</small></div>
        <div class="stat"><span class="kicker" style="margin:0">Materi berbeda</span><strong>${fmtNum(uniqueItems)}</strong><small>dari ${fmtNum(st.allItems.length)} materi tersedia</small></div>
      </div>

      <div class="dash-grid">
        <section class="dcard">
          <h2>Hasil kuesioner</h2><p class="muted">Level semua pengguna terdaftar (${fmtNum(L.length)} orang).</p>
          ${L.length ? bars(quizRows, { unit: "pengguna" }) : empty("Belum ada pengguna yang masuk.")}
        </section>
        <section class="dcard">
          <h2>Materi dibuka per level</h2><p class="muted">Berdasarkan level materinya, ${periodText}.</p>
          ${Vk.length ? bars(byLevel, { unit: "kali dibuka" }) + `<p class="dash-note">${byLevel.map((r) => `${r.text}: ${r.unique} dari ${r.total} materi pernah dibuka`).join(" · ")}</p>` : empty("Belum ada materi yang dibuka pada periode ini.")}
        </section>
        <section class="dcard">
          <h2>Level pengguna × level materi</h2><p class="muted">Siapa membuka materi level apa. Angka = berapa kali dibuka.</p>
          ${Vk.length ? `<div class="table-wrap" style="background:none"><table class="table matrix">
            <thead><tr><th>Pengguna ↓ / Materi →</th>${S.LEVELS.map((l) => `<th>${LEVEL_LABEL[l]}</th>`).join("")}</tr></thead>
            <tbody>${matrix.map((r) => `<tr><td>${r.ul ? levelBadge(r.ul) : '<span class="muted">Belum mengisi</span>'}</td>${r.cells.map((c, k) => `<td><span class="mcell" style="--a:${(c / mMax) * 0.55}" title="Pengguna ${r.ul ? LEVEL_LABEL[r.ul] : "belum mengisi"} membuka materi ${LEVEL_LABEL[S.LEVELS[k]]}: ${c} kali">${fmtNum(c)}</span></td>`).join("")}</tr>`).join("")}</tbody>
          </table></div>` : empty("Belum ada data.")}
        </section>
        <section class="dcard">
          <h2>Materi dibuka per jenis</h2><p class="muted">Per navigasi, ${periodText}.</p>
          ${Vk.length ? bars(bySection, { unit: "kali dibuka" }) : empty("Belum ada data.")}
        </section>
        <section class="dcard dcard-wide">
          <h2>Materi paling sering dibuka</h2><p class="muted">5 teratas, ${periodText}.</p>
          ${top.length ? `<ol class="top-list">${top.map(([id, c]) => { const it = itemOf.get(id); const s = secOf.get(it.section_id);
              return `<li><span class="top-main"><strong>${esc(it.title)}</strong><span class="irow-meta"><span>${esc(s ? s.label : "")}</span>${levelBadge(it.level)}</span></span><span class="top-count"><strong>${fmtNum(c)}</strong><small>kali</small></span></li>`; }).join("")}</ol>`
            : empty("Belum ada data.")}
        </section>
      </div>
      ${S.mode === "demo" ? `<p class="dash-note">Mode demo: statistik dihitung dari aktivitas di browser ini saja. Setelah Supabase tersambung, statistik mencakup semua pengunjung.</p>` : ""}`;
  }

  function learnersHTML() {
    const L = st.learners;
    const count = (lv) => L.filter((x) => x.level === lv).length;
    const viewsBy = new Map();
    for (const v of st.views) viewsBy.set(v.learner_email, (viewsBy.get(v.learner_email) || 0) + 1);
    const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "—");
    return `<header class="admin-head"><div><span class="kicker">${L.length} pengguna</span><h1 class="admin-title">Pengguna terdaftar</h1>
        <p class="muted" style="margin:0">Pengguna yang masuk dengan email dan hasil kuesionernya.</p></div></header>
      <div class="stat-row">${S.LEVELS.map((lv) => `<div class="stat"><span class="kicker" style="margin:0">${LEVEL_LABEL[lv]}</span><strong>${count(lv)}</strong></div>`).join("")}
        <div class="stat"><span class="kicker" style="margin:0">Belum kuesioner</span><strong>${L.filter((x) => !x.level).length}</strong></div></div>
      ${L.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Email</th><th>Level</th><th>Materi dibuka</th><th>Terakhir aktif</th><th>Terdaftar</th></tr></thead><tbody>
        ${L.map((x) => `<tr><td>${esc(x.email)}</td><td>${x.level ? levelBadge(x.level) : '<span class="muted">—</span>'}</td><td>${fmtNum(viewsBy.get(x.email) || 0)}</td><td class="muted">${fmtDate(x.last_seen)}</td><td class="muted">${fmtDate(x.created_at)}</td></tr>`).join("")}
        </tbody></table></div>` : `<div class="empty"><h3>Belum ada pengguna</h3><p>Pengguna muncul di sini setelah masuk dari portal.</p></div>`}`;
  }

  // ---------------- form navigasi ----------------
  function sectionForm(sec) {
    const isNew = !sec;
    sec = sec || { label: "", slug: "", type: "cards", heading: "", description: "", is_visible: true };
    const hasItems = !isNew && (st.counts[sec.id] || 0) > 0;
    const m = U.openModal(`<form class="modal-body" data-form novalidate>
        <span class="kicker">${isNew ? "Navigasi baru" : "Edit navigasi"}</span>
        <h2 style="margin-top:0">${isNew ? "Tambah navigasi" : esc(sec.label)}</h2>
        <div class="row2">
          <label class="field"><span>Nama di navigasi *</span><input type="text" name="label" value="${esc(sec.label)}" maxlength="24" placeholder="Contoh: Tools" required><small>Tampil dalam huruf kapital.</small></label>
          <label class="field"><span>Slug (alamat halaman) *</span><input type="text" name="slug" value="${esc(sec.slug)}" maxlength="40" placeholder="tools" required><small>Huruf kecil, angka, tanda minus.</small></label>
        </div>
        <label class="field"><span>Bentuk tampilan *</span>
          <select name="type">${Object.entries(TYPES).map(([k, t]) => `<option value="${k}" ${sec.type === k ? "selected" : ""}>${t.label}</option>`).join("")}</select>
          <small data-type-hint>${TYPES[sec.type].hint}${hasItems ? " Mengubah bentuk akan mengubah cara item yang sudah ada ditampilkan." : ""}</small></label>
        <label class="field"><span>Judul halaman</span><input type="text" name="heading" value="${esc(sec.heading)}" placeholder="Kumpulan *Tools*"><small>Beri tanda bintang pada satu kata untuk huruf miring, misalnya Kumpulan *Tools*.</small></label>
        <label class="field"><span>Deskripsi singkat</span><textarea name="description" rows="2" style="min-height:70px">${esc(sec.description)}</textarea></label>
        <label class="check"><input type="checkbox" name="is_visible" ${sec.is_visible ? "checked" : ""}> Tampilkan di navigasi portal</label>
        <p class="form-error" data-err></p>
        <div class="form-actions"><button type="button" class="btn btn-ghost" data-close>Batal</button><button class="btn btn-primary" type="submit">Simpan</button></div>
      </form>`, { wide: true });
    const f = m.querySelector("[data-form]");
    let slugTouched = !isNew;
    f.slug.addEventListener("input", () => (slugTouched = true));
    f.label.addEventListener("input", () => { if (!slugTouched) f.slug.value = U.slugify(f.label.value); });
    f.type.addEventListener("change", () => (f.querySelector("[data-type-hint]").textContent = TYPES[f.type.value].hint));
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = f.querySelector("button[type=submit]");
      btn.disabled = true;
      try {
        await S.saveSection({ id: sec.id, label: f.label.value, slug: f.slug.value, type: f.type.value, heading: f.heading.value || f.label.value, description: f.description.value, is_visible: f.is_visible.checked });
        U.closeModal();
        if (isNew) { await loadAll(); const s = st.sections.find((x) => x.slug === f.slug.value.trim().toLowerCase()); if (s) st.selected = s.id; }
        st.view = "content";
        await loadAll(); renderApp(); U.toast(isNew ? "Navigasi ditambahkan." : "Navigasi disimpan.", "ok");
      } catch (ex) { f.querySelector("[data-err]").textContent = ex.message; btn.disabled = false; }
    });
  }

  // ---------------- form item ----------------
  function itemForm(item) {
    const sec = selected();
    const T = TYPES[sec.type];
    const isNew = !item;
    item = item || { title: "", summary: "", category: "", tags: [], level: "beginner", url: "", duration: "", body: "", published: true };
    const typeFields = sec.type === "videos" ? `
        <label class="field"><span>Link YouTube *</span><input type="url" name="url" value="${esc(item.url)}" placeholder="https://www.youtube.com/watch?v=..." required><small data-yt-hint>Tempel link video YouTube. Video diputar di pop-up portal.</small></label>
        <div class="yt-preview" data-yt-preview></div>
        <label class="field"><span>Durasi</span><input type="text" name="duration" value="${esc(item.duration)}" placeholder="12:30" maxlength="10"></label>`
      : sec.type === "cards" ? `
        <div class="row2">
          <label class="field"><span>Kategori</span><input type="text" name="category" value="${esc(item.category)}" placeholder="Tools, Panduan, Template…" maxlength="30"></label>
          <label class="field"><span>Link resource</span><input type="url" name="url" value="${esc(item.url)}" placeholder="https://…"></label>
        </div>
        <label class="field"><span>Detail (tampil di pop-up)</span><textarea name="body" rows="6">${esc(item.body)}</textarea><small>Mendukung format sederhana: ## Judul, - daftar, **tebal**, [teks](link).</small></label>`
      : `
        <label class="field"><span>Isi artikel *</span><textarea name="body" class="tall" rows="14" required>${esc(item.body)}</textarea>
          <small>Format: ## Subjudul · - daftar · 1. daftar bernomor · **tebal** · *miring* · &gt; kutipan · [teks](https://link)</small></label>`;
    const m = U.openModal(`<form class="modal-body" data-form novalidate>
        <span class="kicker">${esc(sec.label)} · ${isNew ? `${T.unit} baru` : `edit ${T.unit}`}</span>
        <h2 style="margin-top:0">${isNew ? `Tambah ${T.unit}` : esc(item.title)}</h2>
        <label class="field"><span>Judul *</span><input type="text" name="title" value="${esc(item.title)}" maxlength="140" required></label>
        <label class="field"><span>Deskripsi singkat</span><textarea name="summary" rows="2" style="min-height:76px" maxlength="300">${esc(item.summary)}</textarea></label>
        ${typeFields}
        <div class="row2">
          <label class="field"><span>Level</span><select name="level">${S.LEVELS.map((l) => `<option value="${l}" ${item.level === l ? "selected" : ""}>${LEVEL_LABEL[l]}</option>`).join("")}</select><small>Dipakai untuk rekomendasi sesuai hasil kuesioner.</small></label>
          <label class="field"><span>Tag / topik</span><input type="text" name="tags" value="${esc(item.tags.join(", "))}" placeholder="Prompting, Otomasi"><small>Pisahkan dengan koma. Tag populer jadi tombol kapsul di beranda.</small></label>
        </div>
        <label class="check"><input type="checkbox" name="published" ${item.published ? "checked" : ""}> Tampilkan di portal</label>
        <p class="form-error" data-err></p>
        <div class="form-actions"><button type="button" class="btn btn-ghost" data-close>Batal</button><button class="btn btn-primary" type="submit">Simpan</button></div>
      </form>`, { wide: true });
    const f = m.querySelector("[data-form]");
    if (sec.type === "videos") {
      const prev = f.querySelector("[data-yt-preview]");
      const upd = () => {
        const id = U.ytId(f.url.value);
        prev.innerHTML = id ? `<img src="${U.ytThumb(id)}" alt="Pratinjau thumbnail">` : "";
        f.querySelector("[data-yt-hint]").textContent = f.url.value && !id ? "Link belum dikenali sebagai video YouTube." : "Tempel link video YouTube. Video diputar di pop-up portal.";
      };
      f.url.addEventListener("input", upd); upd();
    }
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const err = f.querySelector("[data-err]");
      const btn = f.querySelector("button[type=submit]");
      err.textContent = "";
      const data = {
        id: item.id, section_id: sec.id, title: f.title.value, summary: f.summary.value,
        level: f.level.value, tags: f.tags.value.split(",").map((t) => t.trim()).filter(Boolean),
        published: f.published.checked,
        category: f.category ? f.category.value : "", url: f.url ? f.url.value.trim() : "",
        duration: f.duration ? f.duration.value : "", body: f.body ? f.body.value : "",
      };
      if (!data.title.trim()) { err.textContent = "Judul wajib diisi."; f.title.focus(); return; }
      if (sec.type === "videos" && !U.ytId(data.url)) { err.textContent = "Link YouTube belum valid."; f.url.focus(); return; }
      if (sec.type === "articles" && !data.body.trim()) { err.textContent = "Isi artikel wajib diisi."; f.body.focus(); return; }
      if (data.url && sec.type === "cards" && !/^https?:\/\//i.test(data.url)) { err.textContent = "Link harus diawali http:// atau https://"; f.url.focus(); return; }
      btn.disabled = true;
      try { await S.saveItem(data); U.closeModal(); await loadAll(); renderApp(); U.toast(isNew ? `${T.unit[0].toUpperCase() + T.unit.slice(1)} ditambahkan.` : "Perubahan disimpan.", "ok"); }
      catch (ex) { err.textContent = ex.message; btn.disabled = false; }
    });
  }

  // ---------------- event ----------------
  document.addEventListener("click", async (e) => {
    const t = (sel) => e.target.closest(sel);
    let el;
    if (t("[data-logout]")) { await S.adminSignOut(); S.setLearner(null); st.admin = null; toLogin(); return; }
    if ((el = t("[data-select]"))) { st.selected = el.dataset.select; st.view = "content"; await loadAll(); renderApp(); return; }
    if (t("[data-view-learners]")) { await loadStats(); st.view = "learners"; renderApp(); return; }
    if (t("[data-view-dashboard]")) { await loadStats(); st.view = "dashboard"; renderApp(); return; }
    if ((el = t("[data-period]"))) { st.period = el.dataset.period; renderApp(); return; }
    if (t("[data-add-section]")) return sectionForm(null);
    if ((el = t("[data-edit-section]"))) return sectionForm(st.sections.find((s) => s.id === el.dataset.editSection));
    if ((el = t("[data-toggle-section]"))) {
      const s = st.sections.find((x) => x.id === el.dataset.toggleSection);
      return run(() => S.saveSection({ ...s, is_visible: !s.is_visible }), s.is_visible ? "Navigasi disembunyikan dari portal." : "Navigasi ditampilkan di portal.");
    }
    if ((el = t("[data-del-section]"))) {
      const s = st.sections.find((x) => x.id === el.dataset.delSection);
      const n = st.counts[s.id] || 0;
      if (await U.confirmDialog(`Hapus navigasi “${s.label}”?`, `${n ? `Semua ${n} ${TYPES[s.type].unit} di dalamnya ikut terhapus. ` : ""}Tindakan ini tidak bisa dibatalkan.`))
        return run(() => S.deleteSection(s.id), "Navigasi dihapus.");
      return;
    }
    if ((el = t("[data-move-section]"))) return run(() => S.moveSection(el.dataset.moveSection, +el.dataset.dir));
    if (t("[data-add-item]")) return itemForm(null);
    if ((el = t("[data-edit-item]"))) return itemForm(st.items.find((i) => i.id === el.dataset.editItem));
    if ((el = t("[data-toggle-item]"))) {
      const it = st.items.find((i) => i.id === el.dataset.toggleItem);
      return run(() => S.saveItem({ ...it, published: !it.published }), it.published ? "Item disembunyikan (draf)." : "Item ditampilkan di portal.");
    }
    if ((el = t("[data-del-item]"))) {
      const it = st.items.find((i) => i.id === el.dataset.delItem);
      if (await U.confirmDialog(`Hapus “${it.title}”?`, "Tindakan ini tidak bisa dibatalkan.")) return run(() => S.deleteItem(it.id), "Item dihapus.");
      return;
    }
    if ((el = t("[data-move-item]"))) return run(() => S.moveItem(el.dataset.moveItem, +el.dataset.dir));
    if (t("[data-reset]")) {
      if (await U.confirmDialog("Kembalikan data contoh?", "Semua perubahan di mode demo akan diganti dengan data contoh awal.", "Kembalikan"))
        return run(() => S.resetDemo(), "Data contoh dikembalikan.");
    }
  });

  // ---------------- mulai ----------------
  (async function boot() {
    U.mountBackground();
    try {
      st.admin = await S.adminSession();
      if (!st.admin) return toLogin();
      await Promise.all([loadAll(), loadStats()]); renderApp();
    } catch (ex) {
      $main.innerHTML = `<div class="wrap" style="padding-top:64px"><div class="empty"><h3>Gagal memuat</h3><p>${esc(ex.message)}</p></div></div>`;
    }
  })();
})();
