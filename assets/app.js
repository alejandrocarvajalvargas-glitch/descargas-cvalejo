// Pinta las apps desde apps.json. Todo el texto va con textContent: nada del JSON se interpreta como HTML.
(async function () {
  const main = document.getElementById("apps");
  const shelf = document.getElementById("shelf");
  const isSafeFile = (p) =>
    typeof p === "string" &&
    ((/^[a-z0-9_.\-\/]+\.(apk|html|pdf)$/i.test(p) && !p.includes("..")) ||
     /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/releases\/download\/[\w.\-]+\/[\w.\-]+\.apk$/i.test(p));
  const isSafeSha = (s) => typeof s === "string" && /^[a-f0-9]{64}$/i.test(s);
  const isSafeImg = (p) => typeof p === "string" && /^assets\/img\/[a-z0-9_\-]+\.png$/i.test(p);
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
    if (isSafeImg(app.visual)) {
      const fig = el("figure", "shot");
      const img = el("img");
      img.src = app.visual;
      img.alt = "Captura de " + app.name;
      img.loading = "lazy";
      fig.append(img);
      body.append(fig);
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
    if (isSafeSha(app.sha256)) {
      const wrap = el("div", "sha-row");
      wrap.append(el("dt", "", "SHA-256"));
      const dd = el("dd", "sha");
      dd.textContent = app.sha256;
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
      dd.append(copy);
      wrap.append(dd);
      dl.append(wrap);
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
    for (const app of data.apps) {
      main.append(buildApp(app));
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
