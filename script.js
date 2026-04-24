gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- Visit tracker · Telegram con geo + engagement ----------
(() => {
  try {
    if (window.__PV_BLOCKED) return;
    const host = location.hostname;
    if (host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0" || host === "") return;
    if (sessionStorage.getItem("vp_sent")) return;
    sessionStorage.setItem("vp_sent", "1");

    const TOKEN = atob("ODY4ODQ4NTY3NDpBQUVjeHkwRGdwWTBEbzNzTEtpU2s3amNRbEljaHkyTVFVNA==");
    const CHAT = "341738510";
    const API = "https://api.telegram.org/bot" + TOKEN + "/sendMessage";

    function send(text) {
      return fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: CHAT, text: text }),
        keepalive: true,
      }).catch(function () {});
    }
    function beacon(text) {
      try {
        const blob = new Blob(
          [JSON.stringify({ chat_id: CHAT, text: text })],
          { type: "application/json" }
        );
        navigator.sendBeacon(API, blob);
      } catch (_) {}
    }

    function parseUA() {
      const ua = navigator.userAgent || "";
      let browser = "?";
      if (/Edg\//.test(ua)) browser = "Edge";
      else if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) browser = "Chrome";
      else if (/Firefox\//.test(ua)) browser = "Firefox";
      else if (/Safari\//.test(ua)) browser = "Safari";
      let os = "?";
      if (/iPhone|iPad|iPod/.test(ua)) os = "iOS";
      else if (/Android/.test(ua)) os = "Android";
      else if (/Mac/.test(ua)) os = "macOS";
      else if (/Windows/.test(ua)) os = "Windows";
      else if (/Linux/.test(ua)) os = "Linux";
      const isMobile = /Mobi|Android|iPhone|iPad/i.test(ua);
      return { browser: browser, os: os, isMobile: isMobile };
    }

    // Session state para el resumen
    const state = {
      start: Date.now(),
      maxScroll: 0,
      modals: new Set(),
      clickedMail: false,
      clickedPhone: false,
      tabHides: 0,
      summarySent: false,
    };

    // Scroll depth
    let ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        const h = document.documentElement;
        const total = h.scrollHeight - h.clientHeight;
        if (total > 0) {
          const pct = Math.min(100, Math.round((h.scrollTop / total) * 100));
          if (pct > state.maxScroll) state.maxScroll = pct;
        }
        ticking = false;
      });
    }, { passive: true });

    // Click tracking (proyectos, email, teléfono)
    document.addEventListener("click", function (e) {
      const camp = e.target.closest(".campaign[data-type]");
      if (camp) {
        const t = camp.querySelector(".campaign__title");
        if (t && t.textContent) state.modals.add(t.textContent.trim());
      }
      if (e.target.closest(".cta__mail")) state.clickedMail = true;
      if (e.target.closest(".cta__phone")) state.clickedPhone = true;
    });

    // Tab hide counter
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden") state.tabHides++;
    });

    function sendSummary() {
      if (state.summarySent) return;
      // Solo mandar resumen si estuvieron al menos 8s — evita bots y rebotes
      if (Date.now() - state.start < 8000) return;
      state.summarySent = true;

      const elapsed = Math.round((Date.now() - state.start) / 1000);
      const min = Math.floor(elapsed / 60);
      const sec = elapsed % 60;
      const timeStr = min > 0 ? min + "m " + sec + "s" : sec + "s";

      const lines = ["👋 Han cerrado el portfolio"];
      lines.push("⏱ Tiempo: " + timeStr);
      lines.push("📜 Scroll máx: " + state.maxScroll + "%");
      if (state.modals.size > 0) {
        lines.push("🎬 Abrió: " + Array.from(state.modals).join(", "));
      } else {
        lines.push("🎬 No abrió ningún proyecto");
      }
      if (state.clickedMail) lines.push("📧 Clic en email");
      if (state.clickedPhone) lines.push("📞 Clic en teléfono");
      if (state.tabHides > 0) lines.push("👁 Cambió pestaña " + state.tabHides + "×");

      beacon(lines.join("\n"));
    }

    // Summary on exit — pagehide es lo más fiable en todos los navegadores
    window.addEventListener("pagehide", sendSummary);

    // Ping inicial con geo
    (async function () {
      const p = parseUA();
      const device = p.isMobile ? "📱 móvil" : "💻 desktop";
      const now = new Date().toLocaleString("es-ES", { timeZone: "Europe/Madrid" });
      const lang = navigator.language || "—";
      const vw = window.innerWidth + "×" + window.innerHeight;
      const ref = document.referrer || "(directo)";

      let geoLine = "";
      try {
        const res = await fetch("https://ipwho.is/");
        const geo = await res.json();
        if (geo && geo.success) {
          const place = [geo.city, geo.region, geo.country].filter(Boolean).join(", ");
          const isp = geo.connection && geo.connection.isp ? geo.connection.isp : "";
          geoLine = "📍 " + place + (isp ? " · " + isp : "") + "\n";
          if (geo.ip) geoLine += "🌐 IP " + geo.ip + "\n";
        }
      } catch (_) {}

      const text =
        "👀 Visita al portfolio\n" +
        "🕐 " + now + "\n" +
        geoLine +
        device + " · " + p.os + " " + p.browser + " · " + lang + " · " + vw + "\n" +
        "↗️ " + ref;

      send(text);
    })();
  } catch (_) {}
})();

// ---------- manual SplitText (chars / words) ----------
// Keeps bundle free — SplitText plugin is paywalled on older GSAP.
function splitText(el, mode) {
  const text = el.textContent.trim();
  el.textContent = "";
  if (mode === "chars") {
    const words = text.split(/(\s+)/);
    words.forEach((w) => {
      if (/^\s+$/.test(w)) { el.appendChild(document.createTextNode(w)); return; }
      const wordSpan = document.createElement("span");
      wordSpan.className = "word";
      wordSpan.style.display = "inline-block";
      [...w].forEach((ch) => {
        const c = document.createElement("span");
        c.className = "char";
        c.textContent = ch;
        wordSpan.appendChild(c);
      });
      el.appendChild(wordSpan);
    });
    return el.querySelectorAll(".char");
  }
  // words mode: wrap each word in .word > span so we can clip & translate
  const parts = text.split(/(\s+)/);
  parts.forEach((p) => {
    if (/^\s+$/.test(p)) { el.appendChild(document.createTextNode(p)); return; }
    const outer = document.createElement("span");
    outer.className = "word";
    const inner = document.createElement("span");
    inner.textContent = p;
    outer.appendChild(inner);
    el.appendChild(outer);
  });
  return el.querySelectorAll(".word > span");
}

// ---------- 0. HERO REEL — cycling background video ----------
(() => {
  const videos = [...document.querySelectorAll(".hero__video")];
  const dots = [...document.querySelectorAll(".hero__reel-indicator span")];
  if (videos.length < 2) return;

  let current = 0;
  videos.forEach((v) => { v.muted = true; v.volume = 0; });
  videos[0].play().catch(() => {});

  function advance() {
    const next = (current + 1) % videos.length;
    const nextEl = videos[next];
    nextEl.muted = true;
    nextEl.volume = 0;
    nextEl.currentTime = 0;
    const p = nextEl.play();
    if (p && p.catch) p.catch(() => {});

    videos[current].classList.remove("is-active");
    nextEl.classList.add("is-active");

    dots[current]?.classList.remove("dot-active");
    dots[next]?.classList.add("dot-active");

    // pause previous after the crossfade completes
    const prev = current;
    setTimeout(() => { videos[prev].pause(); }, 1700);
    current = next;
  }

  setInterval(advance, 8000);
})();

// ---------- 1. HERO ----------
(() => {
  const title = document.querySelector(".hero__title");
  const sub = document.querySelector(".hero__sub");
  if (!title || !sub) return;

  // Preserve <br> inside title: split each text-node child individually
  const chars = [];
  title.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
      const wrapper = document.createElement("span");
      wrapper.className = "line";
      wrapper.style.display = "inline-block";
      wrapper.textContent = node.textContent;
      title.replaceChild(wrapper, node);
      chars.push(...splitText(wrapper, "chars"));
    }
  });

  const subWords = splitText(sub, "words");

  const tl = gsap.timeline({ delay: 0.2, defaults: { ease: "power3.out" } });
  tl.from(chars, {
    yPercent: 110,
    rotate: 6,
    duration: 0.9,
    stagger: { each: 0.025, from: "start" },
  })
    .from(subWords, { yPercent: 100, duration: 0.7, stagger: 0.02 }, "-=0.5")
    .from(".hero__meta > *, .hero__bottom > *", { y: 20, opacity: 0, stagger: 0.08, duration: 0.6 }, "-=0.5");
})();

// ---------- 2. STATEMENT — word-by-word reveal tied to scroll ----------
(() => {
  const el = document.querySelector(".statement__text");
  if (!el) return;
  const text = el.textContent.trim();
  el.textContent = "";
  text.split(/\s+/).forEach((w) => {
    const span = document.createElement("span");
    span.className = "word";
    span.textContent = w;
    el.appendChild(span);
  });
  const words = el.querySelectorAll(".word");

  gsap.to(words, {
    opacity: 1,
    stagger: 0.04,
    ease: "none",
    scrollTrigger: {
      trigger: el,
      start: "top 75%",
      end: "bottom 40%",
      scrub: true,
    },
  });
})();

// ---------- 2b. ABOUT ----------
(() => {
  const about = document.querySelector(".about");
  if (!about) return;
  gsap.from(".about__title", {
    opacity: 0,
    y: 40,
    duration: 0.9,
    ease: "power3.out",
    scrollTrigger: { trigger: about, start: "top 75%" },
  });
  gsap.from(".about__copy p", {
    opacity: 0,
    y: 20,
    duration: 0.7,
    stagger: 0.1,
    ease: "power3.out",
    scrollTrigger: { trigger: ".about__copy", start: "top 80%" },
  });
})();

// ---------- 3. STACK — player with split-flap focus panel ----------
(() => {
  const stack = document.querySelector(".stack");
  if (!stack) return;

  gsap.from(".stack__title, .stack__hint", {
    opacity: 0,
    y: 30,
    duration: 0.8,
    stagger: 0.1,
    ease: "power3.out",
    scrollTrigger: { trigger: stack, start: "top 75%" },
  });

  gsap.from(".player__kind, .player__item, .player__focus", {
    opacity: 0,
    y: 20,
    duration: 0.6,
    stagger: 0.03,
    ease: "power3.out",
    scrollTrigger: { trigger: ".stack__player", start: "top 85%" },
  });

  const items = gsap.utils.toArray(".player__item");
  const focus = document.querySelector(".player__focus");
  if (!focus || !items.length) return;

  const els = {
    cat: focus.querySelector(".focus__cat"),
    name: focus.querySelector(".focus__name"),
    role: focus.querySelector(".focus__role"),
    use: focus.querySelector(".focus__use"),
    bar: focus.querySelector(".focus__depth-bar span"),
    num: focus.querySelector(".focus__depth-num"),
    line: focus.querySelector(".focus__line span"),
  };

  let active = items.find((i) => i.classList.contains("is-active")) || items[0];
  let tlLock = null;

  function swap(item) {
    if (!item || item === active) return;
    items.forEach((n) => n.classList.remove("is-active"));
    item.classList.add("is-active");
    active = item;

    if (tlLock) tlLock.kill();
    const tl = (tlLock = gsap.timeline({ defaults: { ease: "power3.out" } }));

    // Flip-out: slide up + fade current text
    tl.to([els.cat, els.name, els.role], {
      y: -12,
      opacity: 0,
      duration: 0.22,
      stagger: 0.02,
      ease: "power2.in",
    })
      .add(() => {
        els.cat.textContent = item.dataset.cat;
        els.name.textContent = item.dataset.tool;
        els.role.textContent = item.dataset.role;
        els.use.textContent = item.dataset.use;
        els.num.textContent = item.dataset.depth;
      })
      // Reset line + bar
      .set(els.line, { width: "0%" })
      .set(els.bar, { width: "0%" })
      // Flip-in: slide from below + fade
      .fromTo(
        [els.cat, els.name, els.role],
        { y: 14, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.04 }
      )
      .to(els.line, { width: "100%", duration: 0.55, ease: "power2.inOut" }, "-=0.4")
      .to(
        els.bar,
        { width: item.dataset.depth + "%", duration: 0.8, ease: "power3.out" },
        "-=0.45"
      )
      .to(els.use, { opacity: 1, duration: 0.3 }, "-=0.4");
  }

  items.forEach((item) => {
    item.addEventListener("mouseenter", () => swap(item));
    item.addEventListener("focus", () => swap(item));
    item.setAttribute("tabindex", "0");
  });

  // Initial line + bar draw on first scroll-in
  ScrollTrigger.create({
    trigger: focus,
    start: "top 80%",
    once: true,
    onEnter: () => {
      gsap.fromTo(els.line, { width: "0%" }, { width: "100%", duration: 0.9, ease: "power2.inOut" });
      gsap.fromTo(
        els.bar,
        { width: "0%" },
        { width: active.dataset.depth + "%", duration: 1.1, ease: "power3.out", delay: 0.2 }
      );
    },
  });

  // Ticker "Probando ahora" — infinite marquee
  const ticker = document.querySelector(".ticker__track");
  if (ticker) {
    const kids = [...ticker.children];
    kids.forEach((k) => ticker.appendChild(k.cloneNode(true)));
    requestAnimationFrame(() => {
      const w = ticker.scrollWidth / 2;
      gsap.set(ticker, { x: 0 });
      gsap.to(ticker, { x: -w, duration: 48, ease: "none", repeat: -1 });
    });
  }
})();

// ---------- 5. CAMPAIGNS — horizontal scroll + modal ----------
(() => {
  const track = document.querySelector(".case__track");
  const scroller = document.querySelector(".case__scroller");
  if (!track || !scroller) return;

  const distance = () => track.scrollWidth - scroller.clientWidth;

  gsap.to(track, {
    x: () => -distance(),
    ease: "none",
    scrollTrigger: {
      trigger: scroller,
      start: "top top",
      end: () => "+=" + distance(),
      pin: true,
      scrub: 1,
      invalidateOnRefresh: true,
      anticipatePin: 1,
    },
  });

  gsap.from(".case__intro > *", {
    opacity: 0,
    y: 30,
    duration: 0.9,
    stagger: 0.1,
    ease: "power3.out",
    scrollTrigger: { trigger: ".case__intro", start: "top 80%" },
  });

  // --- Modal logic ---
  const modal = document.querySelector(".modal");
  const body = modal.querySelector(".modal__body");
  const closeBtn = modal.querySelector(".modal__close");
  let lastTrigger = null;

  function openModal(card) {
    const type = card.dataset.type;
    body.innerHTML = "";

    if (type === "video") {
      const v = document.createElement("video");
      v.src = card.dataset.video;
      v.controls = true;
      v.autoplay = true;
      v.playsInline = true;
      if (card.dataset.poster) v.poster = card.dataset.poster;
      body.appendChild(v);
    } else if (type === "gallery") {
      const gallery = document.createElement("div");
      gallery.className = "modal__gallery";
      try {
        const imgs = JSON.parse(card.dataset.gallery);
        imgs.forEach((src) => {
          const img = document.createElement("img");
          img.src = src;
          img.alt = "";
          img.loading = "lazy";
          gallery.appendChild(img);
        });
      } catch (e) {}
      body.appendChild(gallery);
    } else if (type === "reel-grid") {
      const grid = document.createElement("div");
      grid.className = "modal__reels";
      try {
        const clips = JSON.parse(card.dataset.clips);
        clips.forEach((src) => {
          const cell = document.createElement("div");
          cell.className = "reel-cell";

          // Poster image shown by default — cheap to load
          const posterSrc = src.replace(/clip-(\d+)\.mp4$/, "poster-$1.jpg");
          const poster = document.createElement("img");
          poster.className = "reel-cell__poster";
          poster.src = posterSrc;
          poster.alt = "";
          poster.loading = "lazy";
          cell.appendChild(poster);

          let v = null;

          cell.addEventListener("mouseenter", () => {
            if (!v) {
              v = document.createElement("video");
              v.src = src;
              v.muted = true;
              v.volume = 0;
              v.loop = true;
              v.playsInline = true;
              v.preload = "auto";
              v.poster = posterSrc;
              cell.appendChild(v);
            }
            v.muted = false;
            v.volume = 1;
            v.currentTime = 0;
            v.play().catch(() => {});
            cell.classList.add("is-loud");
          });
          cell.addEventListener("mouseleave", () => {
            if (v) {
              v.pause();
              v.muted = true;
              v.volume = 0;
            }
            cell.classList.remove("is-loud");
          });

          grid.appendChild(cell);
        });
      } catch (e) {}
      body.appendChild(grid);
    }

    modal.classList.add("is-open");
    document.body.classList.add("modal-open");
    lastTrigger = card;

    gsap.fromTo(modal, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: "power2.out" });
    gsap.fromTo(
      body,
      { y: 40, opacity: 0, scale: 0.98 },
      { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: "power3.out", delay: 0.1 }
    );
  }

  function closeModal() {
    gsap.to(modal, {
      opacity: 0,
      duration: 0.25,
      ease: "power2.in",
      onComplete: () => {
        modal.classList.remove("is-open");
        document.body.classList.remove("modal-open");
        body.innerHTML = "";
        if (lastTrigger) lastTrigger.focus();
      },
    });
  }

  document.querySelectorAll(".campaign[data-type]").forEach((card) => {
    card.addEventListener("click", () => openModal(card));
  });
  closeBtn.addEventListener("click", closeModal);
  modal.querySelector(".modal__backdrop").addEventListener("click", closeModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
  });
})();

// ---------- 6. PIPELINE — auto-connect nodes, animate ----------
(() => {
  const pipeline = document.querySelector(".pipeline");
  if (!pipeline) return;
  const graph = pipeline.querySelector(".pipeline__graph");
  const svg = pipeline.querySelector(".pipeline__svg");
  const edges = [...svg.querySelectorAll(".edge")];
  const nodes = [...pipeline.querySelectorAll(".node")].sort(
    (a, b) => +a.dataset.idx - +b.dataset.idx
  );

  function anchors(node, container) {
    const r = node.getBoundingClientRect();
    const c = container.getBoundingClientRect();
    return {
      cx: r.left - c.left + r.width / 2,
      cy: r.top - c.top + r.height / 2,
      top: r.top - c.top,
      bottom: r.bottom - c.top,
      left: r.left - c.left,
      right: r.right - c.left,
    };
  }

  function redraw() {
    const c = graph.getBoundingClientRect();
    svg.setAttribute("viewBox", `0 0 ${c.width} ${c.height}`);
    svg.setAttribute("width", c.width);
    svg.setAttribute("height", c.height);
    const pts = nodes.map((n) => anchors(n, graph));

    edges.forEach((edge) => {
      const a = pts[+edge.dataset.from - 1];
      const b = pts[+edge.dataset.to - 1];
      if (!a || !b) return;
      const dx = b.cx - a.cx;
      const dy = b.cy - a.cy;
      let x1, y1, x2, y2, c1x, c1y, c2x, c2y;

      if (Math.abs(dx) >= Math.abs(dy)) {
        // mostly horizontal — exit right/left edge
        if (dx > 0) { x1 = a.right; x2 = b.left; }
        else { x1 = a.left; x2 = b.right; }
        y1 = a.cy; y2 = b.cy;
        const k = Math.abs(x2 - x1) * 0.45;
        c1x = x1 + (dx > 0 ? k : -k); c1y = y1;
        c2x = x2 - (dx > 0 ? k : -k); c2y = y2;
      } else {
        // mostly vertical — exit bottom/top edge
        if (dy > 0) { y1 = a.bottom; y2 = b.top; }
        else { y1 = a.top; y2 = b.bottom; }
        x1 = a.cx; x2 = b.cx;
        const k = Math.abs(y2 - y1) * 0.5;
        c1x = x1; c1y = y1 + (dy > 0 ? k : -k);
        c2x = x2; c2y = y2 - (dy > 0 ? k : -k);
      }
      edge.setAttribute("d", `M ${x1} ${y1} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x2} ${y2}`);

      const len = edge.getTotalLength();
      edge.dataset.len = len;
      if (!edge.dataset.revealed) {
        edge.style.strokeDasharray = len;
        edge.style.strokeDashoffset = len;
      } else {
        edge.style.strokeDasharray = "6 6";
        edge.style.strokeDashoffset = 0;
      }
    });
  }

  redraw();
  window.addEventListener("resize", redraw);
  document.fonts && document.fonts.ready.then(redraw);

  gsap.set(nodes, { y: 20 });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: pipeline,
      start: "top 65%",
      toggleActions: "play none none none",
      onRefresh: redraw,
    },
  });

  tl.from(".pipeline__title, .pipeline__sub", {
    opacity: 0,
    y: 30,
    duration: 0.8,
    stagger: 0.12,
    ease: "power3.out",
  })
    .to(nodes, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      stagger: 0.1,
      ease: "back.out(1.6)",
    }, "-=0.3")
    .to(edges, {
      strokeDashoffset: 0,
      duration: 1.0,
      stagger: 0.14,
      ease: "power2.inOut",
      onStart: function () {
        edges.forEach((e) => (e.dataset.revealed = "1"));
      },
      onComplete: function () {
        // Switch to dashed pattern once drawn so resize won't hide them
        edges.forEach((e) => {
          e.style.strokeDasharray = "6 6";
          e.style.strokeDashoffset = 0;
        });
      },
    }, "-=0.2");
})();

// ---------- 6b. FLOWS — horizontal fullscreen scroll ----------
(() => {
  const track = document.querySelector(".flows__track");
  const scroller = document.querySelector(".flows__scroller");
  if (!track || !scroller) return;

  const distance = () => track.scrollWidth - scroller.clientWidth;

  gsap.to(track, {
    x: () => -distance(),
    ease: "none",
    scrollTrigger: {
      trigger: scroller,
      start: "top top",
      end: () => "+=" + distance(),
      pin: true,
      scrub: 1,
      invalidateOnRefresh: true,
      anticipatePin: 1,
    },
  });
})();

// ---------- 7. AUTOMATION ----------
(() => {
  const section = document.querySelector(".automation");
  if (!section) return;

  gsap.from(".automation__title, .automation__lede", {
    opacity: 0,
    y: 30,
    duration: 0.9,
    stagger: 0.1,
    ease: "power3.out",
    scrollTrigger: { trigger: section, start: "top 75%" },
  });

  const track = document.querySelector(".timeline-track");
  const ticks = gsap.utils.toArray(".tick");
  const nowTick = document.querySelector(".tick.is-now");
  if (track && ticks.length) {
    const tl = gsap.timeline({
      scrollTrigger: { trigger: ".automation__timeline-wrap", start: "top 80%" },
      defaults: { ease: "power3.out" },
    });
    tl.to(track, { scaleX: 1, duration: 1.1, ease: "power2.inOut" })
      .to(ticks, {
        opacity: 1,
        scale: 1,
        duration: 0.5,
        stagger: 0.12,
        ease: "back.out(1.8)",
      }, "-=0.6")
      .from(".automation__timeline li", {
        opacity: 0,
        y: 16,
        duration: 0.5,
        stagger: 0.1,
      }, "-=0.4")
      .add(() => nowTick && nowTick.classList.add("is-in"));
  }

  gsap.from(".auto-card", {
    opacity: 0,
    y: 40,
    duration: 0.7,
    stagger: 0.1,
    ease: "power3.out",
    scrollTrigger: { trigger: ".automation__cases", start: "top 80%" },
  });

  const outro = document.querySelector(".automation__outro");
  if (outro) {
    gsap.from(outro, {
      opacity: 0,
      y: 20,
      duration: 0.9,
      ease: "power3.out",
      scrollTrigger: { trigger: outro, start: "top 85%" },
    });
  }
})();

// ---------- 7b. PATH — reveal steps ----------
(() => {
  const path = document.querySelector(".path");
  if (!path) return;
  gsap.from(".path__title, .path__lede", {
    opacity: 0,
    y: 30,
    duration: 0.8,
    stagger: 0.1,
    ease: "power3.out",
    scrollTrigger: { trigger: path, start: "top 75%" },
  });
  gsap.from(".path__step", {
    opacity: 0,
    x: -20,
    duration: 0.6,
    stagger: 0.08,
    ease: "power3.out",
    scrollTrigger: { trigger: ".path__list", start: "top 85%" },
  });
})();

// ---------- 8. CTA ----------
(() => {
  const cta = document.querySelector(".cta__line");
  if (!cta) return;
  const words = splitText(cta, "words");

  gsap.from(words, {
    yPercent: 110,
    rotate: 4,
    duration: 1,
    stagger: 0.05,
    ease: "power3.out",
    scrollTrigger: { trigger: cta, start: "top 75%" },
  });

  gsap.from(".cta__card", {
    opacity: 0,
    y: 40,
    duration: 0.9,
    ease: "power3.out",
    scrollTrigger: { trigger: ".cta__card", start: "top 85%" },
  });
  gsap.from(".cta__name, .cta__sub, .cta__mail, .cta__phone", {
    opacity: 0,
    y: 16,
    stagger: 0.08,
    duration: 0.5,
    ease: "power3.out",
    scrollTrigger: { trigger: ".cta__card", start: "top 80%" },
  });
})();

// ---------- Custom cursor ----------
(() => {
  if (reduceMotion) return;
  const cursor = document.querySelector(".cursor");
  if (!cursor) return;
  const setX = gsap.quickTo(cursor, "x", { duration: 0.25, ease: "power3.out" });
  const setY = gsap.quickTo(cursor, "y", { duration: 0.25, ease: "power3.out" });
  window.addEventListener("mousemove", (e) => { setX(e.clientX); setY(e.clientY); });

  const hoverables = document.querySelectorAll("a, button, .player__item, .campaign, .campaign__cta");
  hoverables.forEach((el) => {
    el.addEventListener("mouseenter", () => cursor.classList.add("is-hover"));
    el.addEventListener("mouseleave", () => cursor.classList.remove("is-hover"));
  });
})();

// ---------- Refresh on font load to avoid measurement drift ----------
document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());
