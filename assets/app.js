// Carga apps.json y pinta las tarjetas. Usa textContent: nada del JSON se interpreta como HTML.
(async function () {
  const container = document.getElementById("apps");
  const isSafePath = (p) =>
    typeof p === "string" &&
    ((/^[a-z0-9_.\-\/]+\.(apk|html|pdf)$/i.test(p) && !p.includes("..")) ||
     /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/releases\/download\/[\w.\-]+\/[\w.\-]+\.apk$/i.test(p));
  const isSafeSha = (s) => typeof s === "string" && /^[a-f0-9]{64}$/i.test(s);

  try {
    const res = await fetch("apps.json", { cache: "no-cache" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();

    document.getElementById("contact").href = "mailto:" + encodeURIComponent(data.contact);

    // Solo enlaces https válidos; el nombre viene de apps.json y va como textContent.
    const social = document.getElementById("social");
    for (const s of data.social || []) {
      if (typeof s.url !== "string" || !/^https:\/\//.test(s.url) || !s.name) continue;
      const a = document.createElement("a");
      a.href = s.url;
      a.rel = "noopener noreferrer";
      a.target = "_blank";
      a.textContent = s.name;
      social.append(a, " ");
    }
    container.textContent = "";

    for (const app of data.apps) {
      const card = document.createElement("article");
      card.className = "card";

      const h2 = document.createElement("h2");
      h2.textContent = app.name;

      const p = document.createElement("p");
      p.textContent = app.description;

      const meta = document.createElement("p");
      meta.className = "muted";
      meta.textContent = `Versión ${app.version} · Android ${app.minAndroid}+ · ${app.sizeMB} MB`;

      const sha = document.createElement("p");
      sha.className = "sha";
      sha.textContent = "SHA-256: " + (isSafeSha(app.sha256) ? app.sha256 : "no publicado");

      card.append(h2, p, meta, sha);

      if (isSafePath(app.file) && isSafeSha(app.sha256)) {
        const a = document.createElement("a");
        a.className = "button";
        a.href = app.file;
        a.setAttribute("download", "");
        a.textContent = "Descargar APK";
        card.append(a);
      } else {
        const off = document.createElement("span");
        off.className = "muted";
        off.textContent = "Descarga no disponible";
        card.append(off);
      }

      if (app.privacy) {
        const pl = document.createElement("a");
        pl.href = app.privacy;
        pl.textContent = "Privacidad de esta app";
        card.append(pl);
      }
      container.append(card);
    }
  } catch (err) {
    container.textContent = "No se pudo cargar la lista de aplicaciones. Intenta de nuevo más tarde.";
  }
})();
