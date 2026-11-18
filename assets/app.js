// Reloj y zonas horarias del panel. Los dígitos "giran" al cambiar.
(function () {
  const clockEl = document.getElementById("clock");
  const timeFmt = new Intl.DateTimeFormat("es", { hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
  const zones = [...document.querySelectorAll(".zone")].map((z) => ({
    el: z.querySelector("time"),
    fmt: new Intl.DateTimeFormat("es", { timeZone: z.dataset.tz, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }),
  }));
  const setChar = (node, ch) => {
    if (node.textContent === ch) return;
    node.textContent = ch;
    node.classList.remove("flip");
    void node.offsetWidth; // reinicia la animación
    node.classList.add("flip");
  };
  function tick() {
    const now = new Date();
    const t = timeFmt.format(now);
    if (!clockEl.children.length) {
      clockEl.textContent = ""; // quita el texto de marcador
      for (const ch of t) {
        const s = document.createElement("span");
        s.className = ch === ":" ? "sep" : "d";
        s.textContent = ch;
        clockEl.append(s);
      }
    }
    [...t].forEach((ch, i) => { if (ch !== ":") setChar(clockEl.children[i], ch); });
    for (const z of zones) z.el.textContent = z.fmt.format(now);
  }
  tick();
  setInterval(tick, 1000);
})();

// Pinta las apps desde apps.json. Todo el texto va con textContent: nada del JSON se interpreta como HTML.
(async function () {
  const main = document.getElementById("apps");
  const shelf = document.getElementById("shelf");
  const isSafeFile = (p) =>
    typeof p === "string" &&
    ((/^[a-z0-9_.\-\/]+\.(apk|html|pdf)$/i.test(p) && !p.includes("..")) ||
     /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/releases\/download\/[\w.\-]+\/[\w.\-]+\.apk$/i.test(p));
  const isSafeSha = (s) => typeof s === "string" && /^[a-f0-9]{64}$/i.test(s);
  const isSafeImg = (p) => typeof p === "string" && /^assets\/img\/[a-z0-9_\-]+\.(png|jpg)$/i.test(p);
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  };

  function specRow(dl, label, value) {
    const wrap = el("div");
    wrap.append(el("dt", "", label), el("dd", "", value));
    dl.append(wrap);
  }

  function buildApp(app) {
    const section = el("section", "app");
    section.dataset.app = app.id;
    section.id = app.id;

    const head = el("div", "app-head");
    if (isSafeImg(app.icon)) {
      const img = el("img", "icon");
      img.src = app.icon;
      img.alt = "";
      img.width = 96;
      img.height = 96;
      head.append(img);
    }
    const titles = el("div");
    titles.append(el("h2", "", app.name), el("p", "tagline", app.tagline || app.description));
    head.append(titles);

    const body = el("div", "app-body");
    const shots = (Array.isArray(app.shots) ? app.shots : []).filter(isSafeImg);
    if (shots.length) {
      // Teléfono 3D: gira solo en CSS; las capturas cambian con setInterval (ver abajo).
      const stage = el("div", "stage");
      const phone = el("div", "phone");
      const screen = el("div", "screen");
      shots.forEach((src, i) => {
        const img = el("img");
        img.src = src;
        img.alt = i === 0 ? "Captura de " + app.name : "";
        img.loading = "lazy";
        if (i === 0) img.classList.add("on");
        screen.append(img);
      });
      for (let i = 0; i < 16; i++) {
        const slice = el("div", "slice");
        slice.style.setProperty("--i", i); // por CSSOM: permitido por la CSP
        phone.append(slice);
      }
      const front = el("div", "front");
      front.append(screen, el("div", "glare"));
      phone.append(front, el("div", "back"), el("span", "btn b1"), el("span", "btn b2"));
      stage.append(phone);
      body.append(stage);
    }
    if (Array.isArray(app.features) && app.features.length) {
      const ul = el("ul", "features");
      for (const f of app.features) ul.append(el("li", "", f));
      body.append(ul);
    }

    const dl = el("dl", "specs");
    specRow(dl, "Versión", app.version);
    specRow(dl, "Android", app.minAndroid + " o superior");
    specRow(dl, "Tamaño", app.sizeMB + " MB");
    let shaBox = null;
    if (isSafeSha(app.sha256)) {
      shaBox = el("details", "sha-details");
      shaBox.append(el("summary", "", "Verificar SHA-256"));
      const sha = el("p", "sha");
      sha.textContent = app.sha256;
      const copy = el("button", "copy", "Copiar");
      copy.type = "button";
      copy.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(app.sha256);
          copy.textContent = "Copiado";
        } catch (e) {
          copy.textContent = "No se pudo copiar";
        }
      });
      sha.append(copy);
      shaBox.append(sha);
    }

    const actions = el("div", "actions");
    if (isSafeFile(app.file) && isSafeSha(app.sha256)) {
      const a = el("a", "download", "Descargar APK");
      a.href = app.file;
      a.setAttribute("download", "");
      actions.append(a);
    } else {
      actions.append(el("span", "muted", "Descarga disponible próximamente"));
    }
    if (app.privacy) {
      const pl = el("a", "privacy-link", "Privacidad de esta app");
      pl.href = app.privacy;
      actions.append(pl);
    }

    body.append(dl, actions);
    section.append(head, body);
    if (shaBox) section.append(shaBox);
    return section;
  }

  try {
    const res = await fetch("apps.json", { cache: "no-cache" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();

    document.getElementById("contact").href = "mailto:" + encodeURIComponent(data.contact);

    // Enlaces de redes: solo https válidos.
    const social = document.getElementById("social");
    for (const s of data.social || []) {
      if (typeof s.url !== "string" || !/^https:\/\//.test(s.url) || !s.name) continue;
      const a = el("a", "", s.name);
      a.href = s.url;
      a.rel = "noopener noreferrer";
      a.target = "_blank";
      social.append(a);
    }

    main.textContent = "";
    // Cambia la captura de cada teléfono cada 3,2 s (solo si hay más de una).
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setInterval(() => {
        for (const screen of document.querySelectorAll(".screen")) {
          const imgs = [...screen.children];
          if (imgs.length < 2) continue;
          const next = (imgs.findIndex((im) => im.classList.contains("on")) + 1) % imgs.length;
          imgs.forEach((im, i) => im.classList.toggle("on", i === next));
        }
      }, 3200);
    }
    const io ="IntersectionObserver" in window
      ? new IntersectionObserver((entries) => {
          for (const e of entries) if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
        }, { threshold: 0.12 })
      : null;
    for (const app of data.apps) {
      const section = buildApp(app);
      section.classList.add("reveal");
      main.append(section);
      if (io) io.observe(section); else section.classList.add("in");
      const link = el("a", "shelf-item");
      link.href = "#" + app.id;
      link.dataset.app = app.id;
      if (isSafeImg(app.icon)) {
        const img = el("img");
        img.src = app.icon;
        img.alt = "";
        img.width = 48;
        img.height = 48;
        link.append(img);
      }
      link.append(el("span", "", app.name));
      shelf.append(link);
    }
  } catch (err) {
    main.textContent = "No se pudo cargar la lista de aplicaciones. Intenta de nuevo más tarde.";
  }
})();
