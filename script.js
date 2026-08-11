/* =====================================================================
   JLB CHEF GAUCHO — script.js
   ---------------------------------------------------------------------
   01. Configuración editable
   02. Utilidades
   03. Nav + menú mobile + progreso de scroll
   04. Animaciones de entrada (reveal)
   05. Video del hero (short girado)
   06. WhatsApp: estado de carga + confirmación
   07. Menú: tabs de categoría + carrusel horizontal
   08. Selector de evento (cantidad exacta + mensaje editable)
   09. Brasas de fondo (capa persistente)
   ===================================================================== */

   (function () {
    "use strict";
  
    /* ══════════════════════════════════════════
       01. CONFIGURACIÓN EDITABLE
       ══════════════════════════════════════════ */
    const WHATSAPP = "17864288673";
  
    // El archivo es un short vertical grabado de costado.
    //   -90  gira a la izquierda (valor por defecto)
    //    90  gira a la derecha (si se ve al revés)
    //     0  sin rotar (si el video ya viene en horizontal)
    const HERO_VIDEO_ROTATION = -90;
  
    // Segundos que se saltean al arrancar y en cada vuelta del loop.
    // Como el video queda tapado por la foto de fondo hasta que empieza
    // a reproducirse, el salto no se nota — no hace falta recortar el archivo.
    const HERO_VIDEO_START_OFFSET = 4.3;
  
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  
  
    /* ══════════════════════════════════════════
       02. UTILIDADES
       ══════════════════════════════════════════ */
    const $ = (sel, ctx) => (ctx || document).querySelector(sel);
    const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
  
    function onFrame(fn) {
      let ticking = false;
      return function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => { fn(); ticking = false; });
      };
    }
  
    const yearEl = $("#year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  
  
    /* ══════════════════════════════════════════
       03. NAV + MENÚ MOBILE + PROGRESO DE SCROLL
       ══════════════════════════════════════════ */
    const nav = $("#nav");
    const navLinks = $("#navLinks");
    const navToggle = $("#navToggle");
    const progress = $("#scrollProgress");
  
    const onScrollUI = onFrame(() => {
      const y = window.scrollY;
      nav.classList.toggle("is-scrolled", y > 40);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
    });
    window.addEventListener("scroll", onScrollUI, { passive: true });
    onScrollUI();
  
    function closeMenu() {
      navLinks.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Open menu");
      document.body.classList.remove("is-locked");
    }
  
    navToggle.addEventListener("click", () => {
      const open = navLinks.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(open));
      navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      document.body.classList.toggle("is-locked", open);
    });
  
    $$("#navLinks a").forEach((a) => a.addEventListener("click", closeMenu));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && navLinks.classList.contains("is-open")) closeMenu();
    });
  
  
    /* ══════════════════════════════════════════
       04. ANIMACIONES DE ENTRADA
       ══════════════════════════════════════════ */
    const revealables = $$("[data-reveal]");
  
    if (reduceMotion || !("IntersectionObserver" in window)) {
      revealables.forEach((el) => el.classList.add("is-visible"));
    } else {
      const io = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        });
      }, { rootMargin: "0px 0px -12% 0px", threshold: 0.12 });
  
      revealables.forEach((el) => io.observe(el));
    }
  
  
    /* ══════════════════════════════════════════
       05. VIDEO DEL HERO
       Short vertical grabado de costado: se rota y redimensiona
       para llenar el escenario panorámico sin barras negras.
       También arranca salteando los primeros segundos (ver
       HERO_VIDEO_START_OFFSET) y hace el loop a mano para
       mantener ese salto en cada vuelta.
       ══════════════════════════════════════════ */
    const stage = $("#heroMedia");
    const heroVideo = $("#heroVideo");
  
    function layoutHeroVideo() {
      if (!stage || !heroVideo) return;
      const rot = ((HERO_VIDEO_ROTATION % 360) + 360) % 360;
      const swapped = rot === 90 || rot === 270;
      const w = stage.clientWidth;
      const h = stage.clientHeight;
  
      heroVideo.style.width = (swapped ? h : w) + "px";
      heroVideo.style.height = (swapped ? w : h) + "px";
      heroVideo.style.transform = "translate(-50%,-50%) rotate(" + HERO_VIDEO_ROTATION + "deg)";
    }
  
    if (stage && heroVideo) {
      layoutHeroVideo();
  
      if ("ResizeObserver" in window) {
        new ResizeObserver(layoutHeroVideo).observe(stage);
      } else {
        window.addEventListener("resize", onFrame(layoutHeroVideo));
      }
  
      heroVideo.addEventListener("playing", () => {
        layoutHeroVideo();
        heroVideo.classList.add("is-playing");
      });
  
      // Salta los primeros segundos al arrancar. Como el video queda
      // transparente (opacity:0) hasta el evento "playing", el salto
      // no se llega a ver — solo se ve la ambience de fondo hasta ahí.
      let introSkipped = false;
      function skipIntro() {
        if (introSkipped) return;
        const d = heroVideo.duration;
        if (!d || isNaN(d)) return;
        introSkipped = true;
        try { heroVideo.currentTime = Math.min(HERO_VIDEO_START_OFFSET, Math.max(0, d - 0.3)); }
        catch (err) { /* algunos navegadores tiran error si aún no hay buffer suficiente */ }
      }
  
      if (heroVideo.readyState >= 1) skipIntro();
      else heroVideo.addEventListener("loadedmetadata", skipIntro, { once: true });
  
      // Loop manual: cada vez que termina, vuelve a arrancar salteando la intro
      // en vez de reiniciar en el segundo 0 (por eso no usamos el atributo loop).
      heroVideo.addEventListener("ended", () => {
        introSkipped = false;
        skipIntro();
        heroVideo.play().catch(() => {});
      });
  
      if ("IntersectionObserver" in window) {
        new IntersectionObserver((entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              skipIntro();
              heroVideo.play().catch(() => {});
            } else {
              heroVideo.pause();
            }
          });
        }, { threshold: 0.1 }).observe(stage);
      } else {
        skipIntro();
        heroVideo.play().catch(() => {});
      }
    }
  
  
    /* ══════════════════════════════════════════
       06. WHATSAPP — carga + confirmación
       ══════════════════════════════════════════ */
    let toastEl = null;
    let toastTimer = null;
  
    function showToast(html) {
      if (!toastEl) {
        toastEl = document.createElement("div");
        toastEl.className = "toast";
        toastEl.setAttribute("role", "status");
        document.body.appendChild(toastEl);
      }
      toastEl.innerHTML = html;
      requestAnimationFrame(() => toastEl.classList.add("is-visible"));
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toastEl.classList.remove("is-visible"), 6000);
    }
  
    function openWhatsApp(message, trigger) {
      const url = "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(message);
      const delay = reduceMotion ? 0 : 600;
  
      if (trigger) trigger.classList.add("is-loading");
  
      setTimeout(() => {
        const win = window.open(url, "_blank", "noopener");
        if (!win) { window.location.href = url; return; }
        if (trigger) trigger.classList.remove("is-loading");
        showToast(
          "Opening WhatsApp with your message ready.<br>" +
          "If it didn't open, text us at <strong>+1 (786) 428-8673</strong>."
        );
      }, delay);
    }
  
    document.addEventListener("click", (e) => {
      const trigger = e.target.closest("[data-wa]");
      if (!trigger) return;
      e.preventDefault();
      openWhatsApp(trigger.dataset.msg || "Hi, I'd like to ask about an event.", trigger);
    });
  
  
    /* ══════════════════════════════════════════
       07. MENÚ — tabs de categoría + carrusel horizontal
       Un solo panel visible a la vez (Sauces / The Boards / Served On
       Their Own). Cada panel tiene su propia tira con scroll-snap nativo:
       el swipe táctil ya funciona solo, esto solo suma las flechas de
       desktop y su estado (se apagan al llegar a la punta).
       ══════════════════════════════════════════ */
    const menuCarousel = $(".menu-carousel");
  
    if (menuCarousel) {
      const tabs = $$(".menu-tabs__btn");
      const panels = $$(".menu-panel");
      const prevBtn = $(".menu-carousel__nav--prev");
      const nextBtn = $(".menu-carousel__nav--next");
      const GAP = 18; // debe coincidir con el gap de .menu-slides en el CSS
  
      function activeTrack() {
        const panel = panels.find((p) => p.classList.contains("is-active"));
        return panel ? $(".menu-slides", panel) : null;
      }
  
      function updateNavState() {
        const track = activeTrack();
        if (!track || !prevBtn || !nextBtn) return;
        const max = track.scrollWidth - track.clientWidth - 2;
        prevBtn.disabled = track.scrollLeft <= 2;
        nextBtn.disabled = max <= 0 || track.scrollLeft >= max;
      }
  
      function scrollByCard(dir) {
        const track = activeTrack();
        if (!track) return;
        const card = $(".menu-slide", track);
        const step = (card ? card.getBoundingClientRect().width : 250) + GAP;
        track.scrollBy({ left: dir * step, behavior: reduceMotion ? "auto" : "smooth" });
      }
  
      tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
          const cat = tab.dataset.menuCat;
  
          tabs.forEach((t) => {
            const on = t === tab;
            t.classList.toggle("is-active", on);
            t.setAttribute("aria-selected", String(on));
          });
  
          panels.forEach((p) => {
            const on = p.dataset.panel === cat;
            p.classList.toggle("is-active", on);
            p.hidden = !on;
          });
  
          // Cada categoría arranca mostrando su primer plato
          const track = activeTrack();
          if (track) track.scrollLeft = 0;
          requestAnimationFrame(updateNavState);
        });
      });
  
      if (prevBtn) prevBtn.addEventListener("click", () => scrollByCard(-1));
      if (nextBtn) nextBtn.addEventListener("click", () => scrollByCard(1));
  
      $$(".menu-slides").forEach((track) => {
        track.addEventListener("scroll", onFrame(updateNavState), { passive: true });
      });
      window.addEventListener("resize", onFrame(updateNavState));
  
      updateNavState();
    }
  
  
    /* ══════════════════════════════════════════
       08. SELECTOR DE EVENTO
       - Chips de tipo y de rango de invitados
       - Input de cantidad exacta (pisa el rango elegido)
       - El mensaje se arma solo, pero es editable a mano:
         en cuanto el usuario lo toca, dejamos de reescribirlo
         hasta que pida "Rewrite from my answers".
       ══════════════════════════════════════════ */
    const booker = $("#booker");
  
    if (booker) {
      const chips = $$(".chip", booker);
      const exactInput = $("#guestsExact");
      const previewBox = $("#preview");
      const previewText = $("#previewText");
      const previewReset = $("#previewReset");
      const errorMsg = $("#bookerError");
      const typeSet = $("#setType");
  
      const state = { tipo: null, invitados: null };
      const BASE = "Hi José Luis, I'd like to ask about an event with JLB Chef Gaucho.";
      let manualEdit = false; // true en cuanto el usuario escribe directo en el textarea
  
      function buildMessage() {
        if (!state.tipo) return BASE;
  
        let msg = "Hi José Luis, I'd like to ask about a " +
                  state.tipo.toLowerCase() + " with JLB Chef Gaucho.";
  
        const exact = exactInput.value.trim();
        if (exact) {
          msg += " We'd be " + exact + (Number(exact) === 1 ? " guest." : " guests.");
        } else if (state.invitados) {
          msg += " We'd be " + state.invitados + " guests.";
        }
        return msg;
      }
  
      function refreshPreview() {
        if (manualEdit) return;              // el usuario ya lo editó a mano: no lo pisamos
        previewText.value = buildMessage();
        previewBox.classList.remove("is-updated");
        void previewBox.offsetWidth;
        previewBox.classList.add("is-updated");
      }
  
      function select(chip) {
        const group = chip.dataset.group;
        chips.forEach((c) => {
          if (c.dataset.group !== group) return;
          const on = c === chip;
          c.setAttribute("aria-checked", String(on));
          c.tabIndex = on ? 0 : -1;
        });
        state[group] = chip.dataset.value;
  
        // Elegir un rango de chips vuelve a tomar el volante sobre el campo exacto
        if (group === "invitados" && exactInput.value) {
          exactInput.value = "";
          exactInput.classList.remove("has-value");
        }
  
        if (group === "tipo") {
          typeSet.classList.remove("has-error");
          errorMsg.hidden = true;
        }
        refreshPreview();
      }
  
      chips.forEach((chip) => {
        chip.addEventListener("click", () => select(chip));
        chip.addEventListener("keydown", (e) => {
          if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
          e.preventDefault();
          const group = chips.filter((c) => c.dataset.group === chip.dataset.group);
          const i = group.indexOf(chip);
          const next = group[(i + (e.key === "ArrowRight" ? 1 : -1) + group.length) % group.length];
          next.focus();
          select(next);
        });
      });
  
      // Cantidad exacta: pisa los chips de rango mientras tenga valor
      exactInput.addEventListener("input", () => {
        const has = exactInput.value.trim().length > 0;
        exactInput.classList.toggle("has-value", has);
        if (has) {
          chips.filter((c) => c.dataset.group === "invitados").forEach((c) => {
            c.setAttribute("aria-checked", "false");
          });
          state.invitados = null;
        }
        refreshPreview();
      });
  
      // El usuario edita el mensaje a mano: dejamos de autogenerarlo
      previewText.addEventListener("input", () => {
        manualEdit = true;
        previewReset.hidden = false;
      });
      previewText.addEventListener("focus", () => previewBox.classList.add("is-focused"));
      previewText.addEventListener("blur", () => previewBox.classList.remove("is-focused"));
  
      previewReset.addEventListener("click", () => {
        manualEdit = false;
        previewReset.hidden = true;
        refreshPreview();
      });
  
      booker.addEventListener("submit", (e) => {
        e.preventDefault();
  
        if (!state.tipo) {
          errorMsg.hidden = false;
          typeSet.classList.add("has-error");
          typeSet.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
          $(".chip", typeSet).focus();
          setTimeout(() => typeSet.classList.remove("has-error"), 700);
          return;
        }
  
        const finalMessage = previewText.value.trim() || buildMessage();
        openWhatsApp(finalMessage, $("#bookerSubmit"));
      });
    }
  
  
    /* ══════════════════════════════════════════
       09. BRASAS DE FONDO — capa fija persistente
       Vive en el canvas de .ambience, detrás de toda la página.
       No se reinicia por sección: es un único set de partículas
       que sigue a la pantalla mientras se scrollea.
       ══════════════════════════════════════════ */
    function initEmbers(canvas, opts) {
      if (!canvas || reduceMotion) return;
      const ctx = canvas.getContext("2d");
      const COLORS = (opts && opts.colors) || ["#D86A21", "#8E2E18", "#C89A3D"];
      const density = (opts && opts.density) || { desktop: 34, mobile: 20 };
      let particles = [];
      let raf = null;
      let w = 0, h = 0;
  
      function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const rect = canvas.getBoundingClientRect();
        w = rect.width; h = rect.height;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
  
      function spawn(atBottom) {
        const isFlare = Math.random() < 0.16; // ~1 de cada 6 es una brasa grande con halo
        return {
          x: Math.random() * w,
          y: atBottom ? h + Math.random() * 60 : Math.random() * h,
          r: isFlare ? 1.7 + Math.random() * 1.7 : 0.5 + Math.random() * 1.2,
          vy: 0.15 + Math.random() * 0.55,
          drift: (Math.random() - 0.5) * 0.4,
          life: 0,
          max: 280 + Math.random() * 340,
          phase: Math.random() * Math.PI * 2,
          flare: isFlare,
          color: COLORS[(Math.random() * COLORS.length) | 0]
        };
      }
  
      function tick() {
        ctx.clearRect(0, 0, w, h);
        particles.forEach((p, i) => {
          p.life++;
          p.y -= p.vy;
          p.x += Math.sin(p.life / 34 + p.phase) * p.drift;
  
          const fade = 1 - p.life / p.max;
          if (fade <= 0 || p.y < -20) { particles[i] = spawn(true); return; }
  
          // Titileo leve, más marcado en las brasas grandes, para que no se sientan
          // puntos estáticos sino fuego vivo.
          const flicker = 0.72 + 0.28 * Math.sin(p.life / 9 + p.phase);
  
          ctx.globalAlpha = Math.max(0, fade) * (p.flare ? 0.7 : 0.5) * flicker;
          ctx.fillStyle = p.color;
          if (p.flare) {
            ctx.shadowBlur = p.r * 5;
            ctx.shadowColor = p.color;
          } else {
            ctx.shadowBlur = 0;
          }
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        raf = requestAnimationFrame(tick);
      }
  
      function start() {
        if (raf) return;
        resize();
        if (!particles.length) {
          const total = window.innerWidth < 700 ? density.mobile : density.desktop;
          particles = Array.from({ length: total }, () => spawn(false));
        }
        raf = requestAnimationFrame(tick);
      }
  
      function stop() {
        cancelAnimationFrame(raf);
        raf = null;
      }
  
      window.addEventListener("resize", onFrame(resize));
  
      // La capa es fija a pantalla completa, así que siempre está "visible";
      // solo la pausamos cuando la pestaña pasa a segundo plano (batería).
      document.addEventListener("visibilitychange", () => {
        document.hidden ? stop() : start();
      });
  
      start();
    }
  
    initEmbers($("#ambienceEmbers"), {
      density: { desktop: 40, mobile: 20 },
      colors: ["#D86A21", "#8E2E18", "#C89A3D", "#E1C16E"]
    });
  
  })();