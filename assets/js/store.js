/*
 * Lapisan data. Satu antarmuka, dua penyimpanan:
 *  - Supabase  (bila SUPABASE_URL & SUPABASE_ANON_KEY diisi di config.js)
 *  - Mode demo (localStorage di browser ini, diisi dari seed.js)
 */
(function () {
  const cfg = window.ACL_CONFIG || {};
  const USE_SB = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY);
  const SB_CDN = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js";
  const LEARNER_KEY = "acl_learner";
  const LEVELS = ["beginner", "intermediate", "advanced"];
  const RESERVED = ["masuk", "kuesioner", "cari", "admin", "baca", "tag"];

  const bySort = (a, b) => (a.position - b.position) || String(a.created_at || "").localeCompare(String(b.created_at || ""));
  const normEmail = (e) => String(e || "").trim().toLowerCase();
  const validEmail = (e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);

  function cleanItem(it) {
    return {
      section_id: it.section_id,
      title: String(it.title || "").trim(),
      summary: String(it.summary || "").trim(),
      category: String(it.category || "").trim(),
      tags: (it.tags || []).map((t) => String(t).trim()).filter(Boolean),
      level: LEVELS.includes(it.level) ? it.level : "beginner",
      url: String(it.url || "").trim(),
      duration: String(it.duration || "").trim(),
      body: String(it.body || ""),
      published: it.published !== false,
    };
  }
  function cleanSection(s) {
    return {
      slug: String(s.slug || "").trim().toLowerCase(),
      label: String(s.label || "").trim(),
      type: ["cards", "videos", "articles"].includes(s.type) ? s.type : "cards",
      heading: String(s.heading || "").trim(),
      description: String(s.description || "").trim(),
      is_visible: s.is_visible !== false,
    };
  }
  function checkSection(s, all, id) {
    if (!s.label) throw new Error("Nama navigasi wajib diisi.");
    if (!/^[a-z0-9-]+$/.test(s.slug)) throw new Error("Slug hanya boleh huruf kecil, angka, dan tanda minus.");
    if (RESERVED.includes(s.slug)) throw new Error(`Slug "${s.slug}" sudah dipakai sistem. Pilih yang lain.`);
    if (all.some((x) => x.slug === s.slug && x.id !== id)) throw new Error(`Slug "${s.slug}" sudah dipakai navigasi lain.`);
  }

  // ---------------- learner session (both modes) ----------------
  function getLearner() {
    try { return JSON.parse(localStorage.getItem(LEARNER_KEY) || "null"); } catch { return null; }
  }
  function setLearner(v) {
    try { v ? localStorage.setItem(LEARNER_KEY, JSON.stringify(v)) : localStorage.removeItem(LEARNER_KEY); } catch {}
  }

  // ================= DEMO STORE =================
  const DB_KEY = "acl_db_v1";
  const ADMIN_KEY = "acl_demo_admin";
  let memDb = null;
  function db() {
    if (memDb) return memDb;
    try { memDb = JSON.parse(localStorage.getItem(DB_KEY) || "null"); } catch { memDb = null; }
    if (!memDb) {
      const seed = JSON.parse(JSON.stringify(window.ACL_SEED));
      const now = Date.now();
      seed.sections.forEach((s, i) => (s.created_at = new Date(now - 100000 + i).toISOString()));
      seed.items.forEach((s, i) => (s.created_at = new Date(now - 90000 + i * 1000).toISOString()));
      memDb = { sections: seed.sections, items: seed.items, learners: [], views: [] };
      save();
    }
    if (!memDb.views) memDb.views = [];
    return memDb;
  }
  function save() { try { localStorage.setItem(DB_KEY, JSON.stringify(memDb)); } catch {} }
  const uid = (p) => p + "-" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

  const demo = {
    async getSections({ includeHidden = false } = {}) {
      return db().sections.filter((s) => includeHidden || s.is_visible).sort(bySort).map((s) => ({ ...s }));
    },
    async getItems({ sectionId = null, includeUnpublished = false } = {}) {
      const visible = new Set(db().sections.filter((s) => s.is_visible).map((s) => s.id));
      return db().items
        .filter((i) => (!sectionId || i.section_id === sectionId) && (includeUnpublished || (i.published && visible.has(i.section_id))))
        .sort(bySort).map((i) => ({ ...i, tags: [...i.tags] }));
    },
    async saveSection(s) {
      const data = cleanSection(s);
      checkSection(data, db().sections, s.id);
      if (s.id) {
        Object.assign(db().sections.find((x) => x.id === s.id), data);
      } else {
        const pos = Math.max(0, ...db().sections.map((x) => x.position)) + 1;
        db().sections.push({ id: uid("sec"), position: pos, created_at: new Date().toISOString(), ...data });
      }
      save();
    },
    async deleteSection(id) {
      db().sections = db().sections.filter((s) => s.id !== id);
      db().items = db().items.filter((i) => i.section_id !== id);
      save();
    },
    async moveSection(id, dir) { swap(db().sections.sort(bySort), id, dir); save(); },
    async saveItem(it) {
      const data = cleanItem(it);
      if (!data.title) throw new Error("Judul wajib diisi.");
      if (it.id) {
        Object.assign(db().items.find((x) => x.id === it.id), data);
      } else {
        const sib = db().items.filter((x) => x.section_id === data.section_id);
        const pos = Math.max(0, ...sib.map((x) => x.position)) + 1;
        db().items.push({ id: uid("itm"), position: pos, created_at: new Date().toISOString(), ...data });
      }
      save();
    },
    async deleteItem(id) { db().items = db().items.filter((i) => i.id !== id); save(); },
    async moveItem(id, dir) {
      const it = db().items.find((x) => x.id === id);
      swap(db().items.filter((x) => x.section_id === it.section_id).sort(bySort), id, dir);
      save();
    },
    async learnerLogin(email) {
      email = normEmail(email);
      if (!validEmail(email)) throw new Error("Format email belum benar.");
      let l = db().learners.find((x) => x.email === email);
      if (!l) { l = { email, level: null, answers: null, created_at: new Date().toISOString() }; db().learners.push(l); }
      l.last_seen = new Date().toISOString();
      save();
      return { email, level: l.level };
    },
    async learnerSaveLevel(email, level, answers) {
      const l = db().learners.find((x) => x.email === normEmail(email));
      if (l) { l.level = level; l.answers = answers; save(); }
    },
    async listLearners() {
      return [...db().learners].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
    },
    async trackView(email, itemId) {
      email = normEmail(email);
      if (!db().learners.some((l) => l.email === email)) return;
      db().views.push({ learner_email: email, item_id: itemId, created_at: new Date().toISOString() });
      save();
    },
    async listViews() { return db().views.map((v) => ({ ...v })); },
    async adminSignIn(email, password) {
      // Mode demo: email apa pun boleh, asalkan password admin benar.
      if (!validEmail(normEmail(email))) throw new Error("Format email belum benar.");
      if (String(password).trim() !== cfg.DEMO_ADMIN_PASSWORD) throw new Error("Password admin salah.");
      localStorage.setItem(ADMIN_KEY, normEmail(email));
      return { email: normEmail(email) };
    },
    async adminSignOut() { localStorage.removeItem(ADMIN_KEY); },
    async adminSession() {
      const e = localStorage.getItem(ADMIN_KEY);
      return e ? { email: e } : null;
    },
    async resetDemo() { localStorage.removeItem(DB_KEY); memDb = null; db(); },
  };
  function swap(list, id, dir) {
    const i = list.findIndex((x) => x.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) return;
    list.forEach((x, k) => (x.position = k + 1));
    [list[i].position, list[j].position] = [list[j].position, list[i].position];
  }

  // ================= SUPABASE STORE =================
  let sbClient = null;
  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = src; s.onload = res; s.onerror = () => rej(new Error("Gagal memuat library Supabase."));
      document.head.appendChild(s);
    });
  }
  async function sb() {
    if (sbClient) return sbClient;
    if (!window.supabase) await loadScript(SB_CDN);
    sbClient = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
    return sbClient;
  }
  const ok = ({ data, error }) => { if (error) throw new Error(error.message); return data; };

  async function sbSwap(table, rows, id, dir) {
    const c = await sb();
    const i = rows.findIndex((x) => x.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= rows.length) return;
    const order = rows.map((r) => r.id);
    [order[i], order[j]] = [order[j], order[i]];
    for (let k = 0; k < order.length; k++) {
      const r = rows.find((x) => x.id === order[k]);
      if (r.position !== k + 1) ok(await c.from(table).update({ position: k + 1 }).eq("id", order[k]));
    }
  }

  const supa = {
    async getSections({ includeHidden = false } = {}) {
      const c = await sb();
      let q = c.from("sections").select("*").order("position").order("created_at");
      if (!includeHidden) q = q.eq("is_visible", true);
      return ok(await q);
    },
    async getItems({ sectionId = null, includeUnpublished = false } = {}) {
      const c = await sb();
      let q = c.from("items").select("*").order("position").order("created_at");
      if (sectionId) q = q.eq("section_id", sectionId);
      if (!includeUnpublished) q = q.eq("published", true);
      return ok(await q);
    },
    async saveSection(s) {
      const c = await sb();
      const data = cleanSection(s);
      checkSection(data, await supa.getSections({ includeHidden: true }), s.id);
      if (s.id) ok(await c.from("sections").update(data).eq("id", s.id));
      else {
        const all = await supa.getSections({ includeHidden: true });
        ok(await c.from("sections").insert({ ...data, position: Math.max(0, ...all.map((x) => x.position)) + 1 }));
      }
    },
    async deleteSection(id) { const c = await sb(); ok(await c.from("sections").delete().eq("id", id)); },
    async moveSection(id, dir) { await sbSwap("sections", await supa.getSections({ includeHidden: true }), id, dir); },
    async saveItem(it) {
      const c = await sb();
      const data = cleanItem(it);
      if (!data.title) throw new Error("Judul wajib diisi.");
      if (it.id) ok(await c.from("items").update(data).eq("id", it.id));
      else {
        const sib = await supa.getItems({ sectionId: data.section_id, includeUnpublished: true });
        ok(await c.from("items").insert({ ...data, position: Math.max(0, ...sib.map((x) => x.position)) + 1 }));
      }
    },
    async deleteItem(id) { const c = await sb(); ok(await c.from("items").delete().eq("id", id)); },
    async moveItem(id, dir) {
      const c = await sb();
      const it = ok(await c.from("items").select("section_id").eq("id", id).single());
      await sbSwap("items", await supa.getItems({ sectionId: it.section_id, includeUnpublished: true }), id, dir);
    },
    async learnerLogin(email) {
      email = normEmail(email);
      if (!validEmail(email)) throw new Error("Format email belum benar.");
      const c = await sb();
      const rows = ok(await c.rpc("learner_login", { p_email: email }));
      const r = Array.isArray(rows) ? rows[0] : rows;
      return { email, level: r ? r.learner_level : null };
    },
    async learnerSaveLevel(email, level, answers) {
      const c = await sb();
      ok(await c.rpc("learner_save_level", { p_email: normEmail(email), p_level: level, p_answers: answers }));
    },
    async listLearners() {
      const c = await sb();
      return ok(await c.from("learners").select("email, level, created_at, last_seen").order("created_at", { ascending: false }));
    },
    async trackView(email, itemId) {
      const c = await sb();
      ok(await c.rpc("learner_track_view", { p_email: normEmail(email), p_item_id: itemId }));
    },
    async listViews() {
      const c = await sb();
      return ok(await c.from("item_views").select("learner_email, item_id, created_at").order("created_at", { ascending: false }).limit(10000));
    },
    async adminSignIn(email, password) {
      const c = await sb();
      ok(await c.auth.signInWithPassword({ email: normEmail(email), password }));
      const isAdmin = ok(await c.rpc("is_admin"));
      if (!isAdmin) { await c.auth.signOut(); throw new Error("Akun ini bukan admin."); }
      return { email: normEmail(email) };
    },
    async adminSignOut() { const c = await sb(); await c.auth.signOut(); },
    async adminSession() {
      const c = await sb();
      const { data } = await c.auth.getSession();
      if (!data.session) return null;
      const isAdmin = ok(await c.rpc("is_admin"));
      return isAdmin ? { email: data.session.user.email } : null;
    },
  };

  window.ACL_STORE = Object.assign(USE_SB ? supa : demo, {
    mode: USE_SB ? "supabase" : "demo",
    LEVELS,
    getLearner,
    setLearner,
  });
})();
