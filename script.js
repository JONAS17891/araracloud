/*
 * CONFIGURAÇÃO DO LINK DE COMPRA
 * Quando seu site de contratação estiver pronto, cole a URL de cada plano
 * entre as aspas correspondentes. Se usar um único endereço, repita-o nos dois.
 */
const LINKS_DE_COMPRA = {
  Inicial: "https://financeiro.araracloud.site/store/hospedagem-de-bots-ryzen-5-7430u/hospedagem-easy-400-mb-de-ram",
  Pro: "https://financeiro.araracloud.site/store/hospedagem-de-bots-ryzen-5-7430u/hospedagem-fast-800-mb-de-ram",
};

const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".main-nav");

if (menuButton && navigation) {
  const menuIcon = menuButton.querySelector("use");
  menuButton.addEventListener("click", () => {
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!isOpen));
    menuButton.setAttribute("aria-label", isOpen ? "Abrir menu" : "Fechar menu");
    navigation.classList.toggle("main-nav--open", !isOpen);
    if (menuIcon) menuIcon.setAttribute("href", isOpen ? "#i-menu" : "#i-x");
  });

  navigation.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navigation.classList.remove("main-nav--open");
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.setAttribute("aria-label", "Abrir menu");
      if (menuIcon) menuIcon.setAttribute("href", "#i-menu");
    });
  });
}

document.querySelectorAll(".faq-question").forEach((button) => {
  button.addEventListener("click", () => {
    const item = button.closest(".faq-item");
    const answer = item?.querySelector(".faq-answer");
    if (!item || !answer) return;
    const willOpen = button.getAttribute("aria-expanded") !== "true";
    button.setAttribute("aria-expanded", String(willOpen));
    item.classList.toggle("faq-item--open", willOpen);
    answer.hidden = !willOpen;
  });
});

const buyNotice = document.querySelector("#buy-notice");
const launchOverlay = document.querySelector("#launch-overlay");
const launchText = document.querySelector("#launch-text");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function launchTo(destination, planName, card, clickEvent) {
  if (prefersReducedMotion || !launchOverlay) {
    window.location.href = destination;
    return;
  }
  const rect = clickEvent.currentTarget.getBoundingClientRect();
  launchOverlay.style.setProperty("--x", rect.left + rect.width / 2 + "px");
  launchOverlay.style.setProperty("--y", rect.top + rect.height / 2 + "px");
  if (launchText) launchText.textContent = `Decolando com o plano ${planName}…`;
  if (card) card.classList.add("lift");
  requestAnimationFrame(() => launchOverlay.classList.add("on"));
  setTimeout(() => { window.location.href = destination; }, 1900);
}

document.querySelectorAll("[data-buy-plan]").forEach((button) => {
  button.addEventListener("click", (event) => {
    const plan = button.getAttribute("data-buy-plan") || "";
    const destination = LINKS_DE_COMPRA[plan]?.trim();
    const card = button.closest(".pricing-card");
    const planName = card?.querySelector("h3")?.textContent?.trim() || plan;
    if (destination) {
      launchTo(destination, planName, card, event);
      return;
    }

    if (buyNotice) {
      buyNotice.textContent = `O link de compra do plano ${plan} ainda não foi configurado. Quando seu site estiver pronto, cole o endereço ao lado de “${plan}” na constante LINKS_DE_COMPRA, no início do arquivo script.js.`;
      buyNotice.hidden = false;
      buyNotice.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  });
});

document.querySelectorAll("[data-copy]").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const code = btn.getAttribute("data-copy") || "";
    const label = btn.querySelector("span");
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    if (label) label.textContent = "Copiado!";
    btn.classList.add("done");
    setTimeout(() => {
      if (label) label.textContent = "Copiar";
      btn.classList.remove("done");
    }, 2200);
  });
});

const currentYear = document.querySelector("#current-year");
if (currentYear) currentYear.textContent = String(new Date().getFullYear());

/* ==========================================================================
 * MOVIMENTO — scroll suave (Lenis) + parallax e revelações (GSAP)
 * Só anima transform/opacity (GPU). Roda na taxa nativa da tela (60/120/144Hz).
 * Se as bibliotecas não carregarem ou o usuário preferir menos movimento,
 * nada disso executa e o site continua normal.
 * ========================================================================== */
(function () {
  "use strict";
  if (!window.gsap || !window.ScrollTrigger) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  gsap.registerPlugin(ScrollTrigger);
  gsap.config({ force3D: true });
  gsap.ticker.lagSmoothing(0);
  ScrollTrigger.config({ ignoreMobileResize: true });

  const $$ = (s) => gsap.utils.toArray(s);
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const scrub = finePointer ? true : 0.6;

  /* ---------- Scroll suave ---------- */
  if (window.Lenis) {
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));

    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        const target = id && id.length > 1 ? document.querySelector(id) : null;
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -8, duration: 1.4 });
      });
    });
  }

  /* ---------- Utilitários ---------- */
  // remove o "trava transição" e devolve o controle do transform ao CSS (hover)
  const release = (targets) => {
    targets.forEach((t) => t.classList.remove("m-anim"));
    gsap.set(targets, { clearProps: "transform,opacity" });
  };

  function reveal(selector, { y = 48, scale = 1 } = {}) {
    const els = $$(selector);
    if (!els.length) return;
    els.forEach((e) => e.classList.add("m-anim"));
    gsap.set(els, { opacity: 0, y, scale });
    ScrollTrigger.batch(els, {
      start: "top 90%",
      once: true,
      interval: 0.1,
      batchMax: 6,
      onEnter: (batch) =>
        gsap.to(batch, {
          opacity: 1, y: 0, scale: 1, duration: 1.1, ease: "expo.out",
          stagger: 0.1, overwrite: true,
          onComplete() { release(this.targets()); },
        }),
    });
  }

  /* ---------- Entrada do hero ---------- */
  const heroEls = $$(".header-inner, .hero-copy .eyebrow, #hero-title, .hero-description, .hero-actions .button, .hero-footnote, .hero-side-note, .dashboard-wrap, .hero-bottom > *");
  heroEls.forEach((e) => e.classList.add("m-anim"));
  gsap.timeline({
    defaults: { ease: "expo.out", onComplete() { release(this.targets()); } },
  })
    .from(".header-inner", { y: -24, opacity: 0, duration: 1 }, 0)
    .from(".hero-copy .eyebrow", { y: 24, opacity: 0, duration: 1 }, 0.15)
    .from("#hero-title", { y: 60, opacity: 0, duration: 1.4 }, 0.25)
    .from(".hero-description", { y: 30, opacity: 0, duration: 1.2 }, 0.5)
    .from(".hero-actions .button", { y: 26, opacity: 0, scale: 0.9, duration: 1.1, stagger: 0.12, ease: "back.out(1.7)" }, 0.65)
    .from(".hero-footnote", { y: 20, opacity: 0, duration: 1 }, 0.9)
    .from(".hero-side-note", { x: 40, opacity: 0, duration: 1.2 }, 0.8)
    .from(".dashboard-wrap", { y: 80, opacity: 0, duration: 1.5 }, 0.7)
    .from(".hero-bottom > *", { y: 20, opacity: 0, duration: 1, stagger: 0.1 }, 1.1);

  /* ---------- Revelações ao rolar ---------- */
  reveal(".intro-heading > *, .intro-copy > *, .section-heading > *, .faq-intro > *, .closing-content > *", { y: 40 });
  reveal(".principle-card, .service-card, .pricing-card, .step-card", { y: 70, scale: 0.97 });
  reveal(".pricing-client-wrap, .coupon-banner, .fine-print, .pricing-footnote, .steps-note, .faq-item, .footer-main > *", { y: 32 });

  // detalhes dentro dos planos: recursos em cascata + botão
  $$(".pricing-card").forEach((card) => {
    const rows = card.querySelectorAll(".plan-resource");
    const btn = card.querySelector(".pricing-button");
    const items = [...rows, btn].filter(Boolean);
    items.forEach((i) => i.classList.add("m-anim"));
    gsap.set(items, { opacity: 0, x: -18 });
    ScrollTrigger.create({
      trigger: card, start: "top 80%", once: true,
      onEnter: () => gsap.to(items, {
        opacity: 1, x: 0, duration: 0.9, ease: "expo.out", stagger: 0.07, delay: 0.25,
        onComplete() { release(this.targets()); },
      }),
    });
  });

  // preços contando
  $$(".price-lockup strong").forEach((el) => {
    const txt = el.textContent.trim();
    const dec = txt.includes(",") ? txt.split(",")[1].length : 0;
    const end = parseFloat(txt.replace(",", "."));
    if (isNaN(end)) return;
    const o = { v: 0 };
    el.textContent = (0).toFixed(dec).replace(".", ",");
    ScrollTrigger.create({
      trigger: el, start: "top 88%", once: true,
      onEnter: () => gsap.to(o, {
        v: end, duration: 1.6, ease: "power3.out",
        onUpdate: () => { el.textContent = o.v.toFixed(dec).replace(".", ","); },
        onComplete: () => { el.textContent = txt; },
      }),
    });
  });

  // métricas do painel: barras enchendo e gráfico se desenhando
  $$(".metric-fill").forEach((bar) => {
    gsap.from(bar, { width: 0, duration: 1.6, ease: "expo.out", delay: 1.4 });
  });
  const line = document.querySelector(".chart-line");
  if (line && line.getTotalLength) {
    const len = line.getTotalLength();
    gsap.set(line, { strokeDasharray: len, strokeDashoffset: len });
    gsap.to(line, { strokeDashoffset: 0, duration: 2.2, ease: "power2.inOut", delay: 1.5, onComplete: () => gsap.set(line, { clearProps: "strokeDasharray,strokeDashoffset" }) });
    gsap.from(".chart-fill", { opacity: 0, duration: 1.6, delay: 2.2 });
  }

  // flutuar / brilhar
  gsap.to(".floating-note", { y: -8, duration: 2.4, ease: "sine.inOut", yoyo: true, repeat: -1 });
  $$(".closing-star").forEach((s, i) => {
    gsap.to(s, { scale: 1.5, opacity: 0.35, duration: 1.8 + i * 0.6, ease: "sine.inOut", yoyo: true, repeat: -1 });
  });

  /* ---------- Parallax (menos intenso no celular) ---------- */
  const mm = gsap.matchMedia();
  mm.add({ desktop: "(min-width: 769px)", mobile: "(max-width: 768px)" }, (ctx) => {
    const k = ctx.conditions.desktop ? 1 : 0.5;
    const st = (trigger, start = "top bottom", end = "bottom top") => ({ trigger, start, end, scrub });

    // céu do hero: escala maior + desce devagar (sem mostrar bordas)
    gsap.fromTo(".hero-sky", { yPercent: 0, scale: 1.2 }, { yPercent: 8 * k, ease: "none", scrollTrigger: st(".hero", "top top") });
    gsap.to(".hero-orbit--one", { y: -140 * k, rotation: 30, ease: "none", scrollTrigger: st(".hero", "top top") });
    gsap.to(".hero-orbit--two", { y: -70 * k, rotation: -24, ease: "none", scrollTrigger: st(".hero", "top top") });

    // textos do hero sobem em velocidades diferentes
    gsap.to(".hero-copy", { y: -80 * k, opacity: 0.15, ease: "none", scrollTrigger: st(".hero", "top top", "70% top") });
    gsap.to(".hero-side-note", { y: -130 * k, ease: "none", scrollTrigger: st(".hero", "top top") });

    // painel: leve inclinação 3D que endireita ao chegar
    gsap.fromTo(".dashboard-window",
      { rotationX: 9 * k, scale: 0.94, transformPerspective: 1200, transformOrigin: "50% 100%" },
      { rotationX: 0, scale: 1, ease: "none", scrollTrigger: st(".dashboard-wrap", "top 98%", "top 40%") });

    // órbitas dos cards giram devagar
    $$(".card-orbit").forEach((o) => {
      gsap.fromTo(o, { rotation: -40 }, { rotation: 60, ease: "none", scrollTrigger: st(o.closest(".principle-card")) });
    });

    // fechamento: nuvens e estrelas em camadas
    gsap.fromTo(".closing-cloud--one", { y: 90 * k }, { y: -90 * k, ease: "none", scrollTrigger: st(".closing-section") });
    gsap.fromTo(".closing-cloud--two", { y: -60 * k }, { y: 80 * k, ease: "none", scrollTrigger: st(".closing-section") });
    gsap.fromTo(".closing-star--one", { y: 70 * k, rotation: 0 }, { y: -110 * k, rotation: 120, ease: "none", scrollTrigger: st(".closing-section") });
    gsap.fromTo(".closing-star--two", { y: 40 * k, rotation: 0 }, { y: -160 * k, rotation: -160, ease: "none", scrollTrigger: st(".closing-section") });
  });

  /* ---------- Ajustes finos ---------- */
  document.querySelectorAll(".faq-question").forEach((b) =>
    b.addEventListener("click", () => setTimeout(() => ScrollTrigger.refresh(), 60))
  );
  window.addEventListener("load", () => ScrollTrigger.refresh());
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
})();

/* ==========================================================================
 * LIQUID GLASS — indicador deslizante, dock mobile e brilho que segue o mouse
 * ========================================================================== */
(function () {
  "use strict";
  const html = document.documentElement;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const ua = navigator.userAgent;

  // refração real só em Chromium com mouse (Safari/Firefox ignoram url() no backdrop-filter)
  if (fine && /Chrome\/|Chromium\//.test(ua) && !/CriOS|FxiOS/.test(ua) &&
      window.CSS && CSS.supports("backdrop-filter", "url(#x)")) html.classList.add("lg-refract");

  document.querySelectorAll(".header-inner, .button--glass, .hero-side-note, .floating-note")
    .forEach((el) => el.classList.add("lg"));

  // brilho especular seguindo o cursor
  if (fine) {
    document.querySelectorAll(".lg").forEach((el) => {
      el.addEventListener("pointermove", (ev) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", ev.clientX - r.left + "px");
        el.style.setProperty("--my", ev.clientY - r.top + "px");
      });
      el.addEventListener("pointerleave", () => {
        el.style.removeProperty("--mx"); el.style.removeProperty("--my");
      });
    });
  }

  // indicador de vidro que desliza entre os itens
  function lens(container, links, cls) {
    if (!container) return () => {};
    const el = document.createElement("span");
    el.className = cls; el.setAttribute("aria-hidden", "true");
    container.prepend(el);
    let active = null, first = true;
    const move = (a) => {
      if (!a || !a.offsetWidth) { el.style.opacity = "0"; return; }
      if (first) { el.style.transition = "none"; }
      el.style.opacity = "1";
      el.style.width = a.offsetWidth + "px";
      el.style.height = a.offsetHeight + "px";
      el.style.transform = `translate(${a.offsetLeft}px, ${a.offsetTop}px)`;
      if (first) { void el.offsetWidth; el.style.transition = ""; first = false; }
    };
    const set = (a) => { active = a; links.forEach((l) => l.classList.toggle("is-active", l === a)); move(a); };
    links.forEach((l) => l.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") move(l); }));
    container.addEventListener("pointerleave", () => move(active));
    window.addEventListener("resize", () => move(active));
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => move(active));
    return set;
  }

  const deskLinks = [...document.querySelectorAll(".main-nav > a:not(.mobile-nav-cta)")];
  const dockLinks = [...document.querySelectorAll(".dock-bar a")];
  const setDesk = lens(document.querySelector(".main-nav"), deskLinks, "nav-lens");
  const setDock = lens(document.querySelector(".dock-bar"), dockLinks, "dock-lens");

  // qual seção está no meio da tela?
  const findLink = (list, href) => list.find((a) => a.getAttribute("href") === href) || null;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const h = en.target.dataset.navId;
      setDesk(findLink(deskLinks, h));
      setDock(findLink(dockLinks, h));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  new Set([...deskLinks, ...dockLinks].map((a) => a.getAttribute("href"))).forEach((h) => {
    const t = h === "#inicio" ? document.querySelector(".hero") : document.querySelector(h);
    if (t) { t.dataset.navId = h; io.observe(t); }
  });
  const closing = document.querySelector("#comecar");
  if (closing) { closing.dataset.navId = "#comecar"; io.observe(closing); }

  // barra fica mais densa ao rolar; dock encolhe ao descer e volta ao subir
  const header = document.querySelector(".site-header");
  const dock = document.querySelector(".dock");
  let lastY = window.scrollY;
  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    if (header) header.classList.toggle("is-scrolled", y > 40);
    if (dock && Math.abs(y - lastY) > 6) { dock.classList.toggle("is-compact", y > lastY && y > 120); lastY = y; }
  }, { passive: true });

  // entrada da dock
  if (window.gsap && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    gsap.from(".dock-bar, .dock-cta", { y: 90, opacity: 0, scale: 0.9, duration: 1.2, ease: "expo.out", delay: 1.2, stagger: 0.08, clearProps: "transform,opacity" });
  }
})();
