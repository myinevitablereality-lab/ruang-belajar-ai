/* Utilitas bersama: escape, markdown, YouTube, modal, toast, ikon, dan latar partikel. */
(function () {
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const slugify = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  // "Kumpulan *Resource*" → Kumpulan <em>Resource</em>
  const heading = (s) => esc(s).replace(/\*(.+?)\*/g, "<em>$1</em>");

  function safeUrl(u) {
    u = String(u || "").trim();
    return /^(https?:\/\/|mailto:|#|\/)/i.test(u) ? u : "";
  }

  function inline(s) {
    return s
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*(?!\s)(.+?)\*/g, "$1<em>$2</em>")
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, u) => {
        const url = safeUrl(u.replace(/&amp;/g, "&"));
        if (!url) return t;
        const ext = /^https?:/i.test(url);
        return `<a href="${esc(url)}"${ext ? ' target="_blank" rel="noopener noreferrer"' : ""}>${t}</a>`;
      });
  }

  // Markdown kecil & aman (input di-escape dulu).
  function md(src) {
    const lines = esc(src).replace(/\r/g, "").split("\n");
    let out = "", list = null, para = [], quote = [], code = null;
    const flushPara = () => { if (para.length) { out += `<p>${inline(para.join(" "))}</p>`; para = []; } };
    const flushList = () => { if (list) { out += `</${list}>`; list = null; } };
    const flushQuote = () => { if (quote.length) { out += `<blockquote><p>${inline(quote.join(" "))}</p></blockquote>`; quote = []; } };
    const flushAll = () => { flushPara(); flushList(); flushQuote(); };
    for (const raw of lines) {
      const line = raw.trimEnd();
      if (code !== null) {
        if (/^```/.test(line)) { out += `<pre><code>${code.join("\n")}</code></pre>`; code = null; }
        else code.push(raw);
        continue;
      }
      let m;
      if (/^```/.test(line)) { flushAll(); code = []; }
      else if (!line.trim()) flushAll();
      else if ((m = line.match(/^(#{1,4})\s+(.*)$/))) { flushAll(); const lv = Math.min(4, m[1].length + 1); out += `<h${lv}>${inline(m[2])}</h${lv}>`; }
      else if (/^(-{3,}|\*{3,})$/.test(line.trim())) { flushAll(); out += "<hr>"; }
      else if ((m = line.match(/^&gt;\s?(.*)$/))) { flushPara(); flushList(); quote.push(m[1]); }
      else if ((m = line.match(/^\s*[-*]\s+(.*)$/))) { flushPara(); flushQuote(); if (list !== "ul") { flushList(); out += "<ul>"; list = "ul"; } out += `<li>${inline(m[1])}</li>`; }
      else if ((m = line.match(/^\s*\d+[.)]\s+(.*)$/))) { flushPara(); flushQuote(); if (list !== "ol") { flushList(); out += "<ol>"; list = "ol"; } out += `<li>${inline(m[1])}</li>`; }
      else { flushList(); flushQuote(); para.push(line.trim()); }
    }
    if (code !== null) out += `<pre><code>${code.join("\n")}</code></pre>`;
    flushAll();
    return out;
  }

  function ytId(url) {
    const u = String(url || "").trim();
    const m = u.match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    if (m) return m[1];
    return /^[A-Za-z0-9_-]{11}$/.test(u) ? u : "";
  }
  const ytThumb = (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

  const readMinutes = (text) => Math.max(1, Math.round(String(text || "").split(/\s+/).filter(Boolean).length / 200));

  const LEVEL_LABEL = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" };
  const levelBadge = (lv) => `<span class="level level-${esc(lv)}"><i></i>${LEVEL_LABEL[lv] || esc(lv)}</span>`;

  // ---------- ikon (SVG garis, buatan sendiri) ----------
  const I = (d, extra = "") => `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
  const icons = {
    arrowUp: I('<path d="M12 19V5M5 12l7-7 7 7"/>'),
    arrowRight: I('<path d="M5 12h14M13 5l7 7-7 7"/>'),
    arrowLeft: I('<path d="M19 12H5M11 5l-7 7 7 7"/>'),
    external: I('<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'),
    close: I('<path d="M6 6l12 12M18 6L6 18"/>'),
    home: I('<path d="M4 11l8-7 8 7M6 9.5V20h12V9.5"/>'),
    play: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>',
    spark: I('<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/>'),
    user: I('<circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5"/>'),
    edit: I('<path d="M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4"/>'),
    trash: I('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'),
    up: I('<path d="M6 15l6-6 6 6"/>'),
    down: I('<path d="M6 9l6 6 6-6"/>'),
    eye: I('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
    eyeOff: I('<path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3 3.8M6.4 6.4C3.6 8.2 2 12 2 12s3.5 7 10 7c1.7 0 3.2-.5 4.5-1.2M9.9 9.9a3 3 0 0 0 4.2 4.2"/>'),
    plus: I('<path d="M12 5v14M5 12h14"/>'),
    search: I('<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>'),
    logout: I('<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>'),
    chart: I('<path d="M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-3"/>'),
    clock: I('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
  };

  // Logo mark sederhana buatan sendiri (bukan logo resmi).
  const mark = `<svg class="mark" viewBox="0 0 32 32" width="26" height="26" aria-hidden="true"><defs><linearGradient id="mk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c9c0ff"/><stop offset="1" stop-color="#86a8ff"/></linearGradient></defs><rect x="1" y="1" width="30" height="30" rx="9" fill="none" stroke="url(#mk)" stroke-width="1.4"/><path d="M9 22l7-13 7 13M11.8 17h8.4" fill="none" stroke="url(#mk)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="24" cy="8.5" r="1.6" fill="#c9c0ff"/></svg>`;

  // ---------- toast ----------
  function toast(msg, kind = "info") {
    let wrap = document.querySelector(".toasts");
    if (!wrap) { wrap = document.createElement("div"); wrap.className = "toasts"; wrap.setAttribute("role", "status"); document.body.appendChild(wrap); }
    const t = document.createElement("div");
    t.className = `toast toast-${kind}`;
    t.textContent = msg;
    wrap.appendChild(t);
    setTimeout(() => { t.classList.add("out"); setTimeout(() => t.remove(), 300); }, 3200);
  }

  // ---------- modal ----------
  let lastFocus = null;
  function openModal(html, { wide = false, video = false, onClose } = {}) {
    closeModal();
    lastFocus = document.activeElement;
    const el = document.createElement("div");
    el.className = "modal-root";
    const x = `<button class="icon-btn modal-x ${video ? "outside" : ""}" data-close aria-label="Tutup">${icons.close}</button>`;
    el.innerHTML = `<div class="modal-backdrop" data-close></div>${video ? x : ""}
      <div class="modal ${wide ? "modal-wide" : ""} ${video ? "modal-video" : ""}" role="dialog" aria-modal="true" tabindex="-1">
        ${video ? "" : x}
        ${html}
      </div>`;
    el._onClose = onClose;
    document.body.appendChild(el);
    document.body.classList.add("no-scroll");
    requestAnimationFrame(() => el.classList.add("in"));
    const first = el.querySelector("input, textarea, select") || el.querySelector(".modal");
    first.focus({ preventScroll: true });
    el.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) closeModal(); });
    return el.querySelector(".modal");
  }
  function closeModal() {
    const el = document.querySelector(".modal-root");
    if (!el) return;
    el.remove();
    document.body.classList.remove("no-scroll");
    if (el._onClose) el._onClose();
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  document.addEventListener("keydown", (e) => {
    const root = document.querySelector(".modal-root");
    if (!root) return;
    if (e.key === "Escape") closeModal();
    if (e.key === "Tab") {
      const f = [...root.querySelectorAll('a[href], button, input, textarea, select, iframe, [tabindex]:not([tabindex="-1"])')].filter((n) => !n.disabled);
      if (!f.length) return;
      const a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    }
  });

  function confirmDialog(title, text, okLabel = "Hapus") {
    return new Promise((resolve) => {
      let done = false;
      const m = openModal(`<div class="modal-body confirm">
          <h3>${esc(title)}</h3><p class="muted">${esc(text)}</p>
          <div class="form-actions"><button class="btn btn-ghost" data-close>Batal</button><button class="btn btn-danger" data-ok>${esc(okLabel)}</button></div>
        </div>`, { onClose: () => { if (!done) resolve(false); } });
      m.querySelector("[data-ok]").addEventListener("click", () => { done = true; resolve(true); closeModal(); });
      m.querySelector("[data-ok]").focus();
    });
  }

  // ---------- latar: partikel cahaya ----------
  function particles(canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w, h, dpr, ps = [], raf = null;
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(80, Math.max(28, (w * h) / 16000)));
      ps = Array.from({ length: n }, () => spawn(true));
    }
    function spawn(any) {
      return {
        x: Math.random() * w,
        y: any ? Math.random() * h : h + 10,
        r: Math.random() * 1.3 + 0.35,
        vy: -(Math.random() * 0.18 + 0.05),
        vx: (Math.random() - 0.5) * 0.08,
        a: Math.random() * 0.5 + 0.2,
        t: Math.random() * Math.PI * 2,
        hue: Math.random() < 0.5 ? "200,190,255" : "160,190,255",
      };
    }
    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (const p of ps) {
        p.t += 0.012; p.x += p.vx + Math.sin(p.t) * 0.06; p.y += p.vy;
        if (p.y < -10) Object.assign(p, spawn(false));
        const alpha = p.a * (0.6 + 0.4 * Math.sin(p.t * 1.3));
        ctx.beginPath();
        ctx.fillStyle = `rgba(${p.hue},${alpha.toFixed(3)})`;
        ctx.shadowColor = `rgba(${p.hue},0.8)`;
        ctx.shadowBlur = p.r * 6;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = reduce ? null : requestAnimationFrame(draw);
    }
    resize(); draw();
    let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { resize(); if (reduce) draw(); }, 150); });
    document.addEventListener("visibilitychange", () => {
      if (reduce) return;
      if (document.hidden) { cancelAnimationFrame(raf); raf = null; } else if (!raf) draw();
    });
  }

  const backgroundHTML = `<div class="bg" aria-hidden="true">
      <div class="bg-photo"></div>
      <div class="bg-visual"><span class="shape s1"></span><span class="shape s2"></span><span class="shape s3"></span><span class="shape s4"></span><span class="shape s5"></span></div>
      <div class="bg-overlay"></div>
      <canvas class="bg-particles"></canvas>
      <div class="bg-vignette"></div>
      <div class="bg-grain"></div>
    </div>`;
  function mountBackground() {
    document.body.insertAdjacentHTML("afterbegin", backgroundHTML);
    particles(document.querySelector(".bg-particles"));
  }

  // Spotlight: simpan posisi kursor di kartu sebagai --mx / --my (dipakai CSS).
  if (window.matchMedia("(hover: hover)").matches) {
    document.addEventListener("pointermove", (e) => {
      const el = e.target.closest && e.target.closest(".card, .mini, .tag-tile");
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    }, { passive: true });
  }

  // Munculkan elemen bertahap (stagger). Dimatikan otomatis oleh CSS bila "kurangi gerakan".
  function reveal(root, selector, { step = 55, max = 14 } = {}) {
    root.querySelectorAll(selector).forEach((el, i) => {
      el.style.setProperty("--d", `${Math.min(i, max) * step}ms`);
      el.classList.remove("reveal");
      void el.offsetWidth;
      el.classList.add("reveal");
      const done = (e) => { if (e.target === el && e.animationName === "rise") { el.classList.remove("reveal"); el.removeEventListener("animationend", done); } };
      el.addEventListener("animationend", done);
    });
  }

  window.ACL_UI = { esc, slugify, heading, md, ytId, ytThumb, readMinutes, LEVEL_LABEL, levelBadge, icons, mark, toast, openModal, closeModal, confirmDialog, mountBackground, safeUrl, reveal };
})();
