// Mark that JS is running so motion styles only apply when they can finish
document.documentElement.classList.add("js");

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- Page-load sequence ----------
const start = () => requestAnimationFrame(() => document.body.classList.add("is-loaded"));
const heroImg = document.querySelector(".hero__photo img");
if (heroImg && !heroImg.complete) {
  heroImg.addEventListener("load", start, { once: true });
  setTimeout(start, 1500); // don't wait forever on slow networks
} else {
  start();
}

// ---------- Footer year ----------
const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();

// ---------- Nav: switch to frosted bar once past the hero ----------
const nav = document.getElementById("nav");
const hero = document.querySelector(".hero");
if (nav && hero) {
  new IntersectionObserver(([entry]) => {
    nav.classList.toggle("is-scrolled", !entry.isIntersecting);
  }, { rootMargin: "-64px 0px 0px 0px" }).observe(hero);
}

// ---------- Reveal on scroll ----------
const reveals = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window && !reduceMotion) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
  reveals.forEach((el) => io.observe(el));
} else {
  reveals.forEach((el) => el.classList.add("is-in"));
}

// ---------- Ghost words drift sideways as you scroll ----------
const ghosts = [...document.querySelectorAll(".ghost")];
if (ghosts.length && !reduceMotion) {
  let ticking = false;
  const update = () => {
    const vh = window.innerHeight;
    ghosts.forEach((g) => {
      const r = g.parentElement.getBoundingClientRect();
      const progress = (r.top + r.height / 2 - vh / 2) / vh; // -1 … 1 around centre
      g.style.setProperty("--shift", `${(progress * 120).toFixed(1)}px`);
    });
    ticking = false;
  };
  window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();
}

// ---------- Work filters ----------
const filters = document.querySelectorAll(".filter");
const cards = document.querySelectorAll(".card");
filters.forEach((btn) => {
  btn.addEventListener("click", () => {
    const f = btn.dataset.filter;
    filters.forEach((b) => { const on = b === btn; b.classList.toggle("is-on", on); b.setAttribute("aria-pressed", on); });
    cards.forEach((c) => { c.hidden = !(f === "all" || c.dataset.status === f); if (!c.hidden) c.classList.add("is-in"); });
  });
});

// ---------- Services: one row open at a time; hover opens on desktop ----------
const services = document.querySelectorAll(".service");
const openService = (svc) => {
  services.forEach((s) => {
    const on = s === svc && !s.classList.contains("is-open");
    s.classList.toggle("is-open", on);
    s.querySelector(".service__row").setAttribute("aria-expanded", on);
  });
};
const canHover = window.matchMedia("(hover: hover)").matches;
services.forEach((svc) => {
  svc.querySelector(".service__row").addEventListener("click", () => openService(svc));
  if (canHover) svc.addEventListener("mouseenter", () => { if (!svc.classList.contains("is-open")) openService(svc); });
});
if (services[0]) openService(services[0]);

// ---------- Contact form: send without leaving the page ----------
const form = document.querySelector(".form");
if (form) {
  const status = form.querySelector(".form__status");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    // Until Formspree is set up, open the visitor's email app with the message filled in
    if (form.action.includes("YOUR_FORM_ID")) {
      const d = new FormData(form);
      const subject = encodeURIComponent(`Project enquiry from ${d.get("name")}`);
      const body = encodeURIComponent(`${d.get("message")}\n\nName: ${d.get("name")}\nContact: ${d.get("contact")}`);
      window.location.href = `mailto:twumgyanchristian2@gmail.com?subject=${subject}&body=${body}`;
      status.textContent = "Opening your email app…";
      return;
    }
    const button = form.querySelector("button");
    button.disabled = true;
    status.textContent = "Sending…";
    try {
      const res = await fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error();
      form.reset();
      status.textContent = "Message sent. I'll reply within a day.";
    } catch {
      status.textContent = "Message didn't send. Check your connection, or reach me on WhatsApp.";
    } finally {
      button.disabled = false;
    }
  });
}
