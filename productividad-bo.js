javascript: (async () => {
  const K = "AUTOI_COLA_V6",
    FORM_URL =
      "https://vodafone-my.sharepoint.com/personal/hsteffe1_corp_vodafone_es/_layouts/15/listforms.aspx?cid=YjJmYjdmNDEtNTZkNy00NTAwLThjZDctMWY2MGM4M2VkMmIw&nav=MzBmNGNkZTItYTE3Yi00YzE1LThjM2QtY2EyM2RiMDk4MjY2",
    MAX_WORKERS = 20,
    TIPOS = [
      "Correos install",
      "Televisión",
      "Long Runner",
      "Winback - Correo Reconexion",
      "Winback - Brain",
      "Winback - 983",
      "Cierres",
      "Envio a campo",
      "llamadas Front",
      "Autoi TV",
      "Autoi Net",
      "Rep Autoi"
    ],
    S = (ms) => new Promise((r) => setTimeout(r, ms)),
    load = () =>
      JSON.parse(
        localStorage.getItem(K) || '{"pendientes":[],"ok":[],"ko":[]}'
      ),
    save = (q) => localStorage.setItem(K, JSON.stringify(q)),
    setv = (e, v) => {
      if (!e) return false;
      const targetWindow = e.ownerDocument.defaultView;
      const p =
          e.tagName === "TEXTAREA"
            ? targetWindow.HTMLTextAreaElement.prototype
            : targetWindow.HTMLInputElement.prototype,
        f = Object.getOwnPropertyDescriptor(p, "value")?.set;
      if (!f) return false;
      e.focus();
      f.call(e, v);
      e.dispatchEvent(
        new targetWindow.InputEvent("input", {
          bubbles: true,
          inputType: "insertText",
          data: v
        })
      );
      e.dispatchEvent(new targetWindow.Event("change", { bubbles: true }));
      e.dispatchEvent(new targetWindow.Event("blur", { bubbles: true }));
      return true;
    },
    wait = async (sel, n = 60, d = 60, getDocument = () => document) => {
      for (let i = 0; i < n; i++) {
        const doc =
          typeof getDocument === "function" ? getDocument() : getDocument;
        if (doc.defaultView?.closed) throw Error("La ventana del formulario se cerró.");
        const e = doc.querySelector(sel);
        if (e && e.offsetParent !== null) return e;
        await S(d);
      }
      return null;
    },
    elegirModo = (plantillasCount) =>
      new Promise((resolve) => {
        const overlay = document.createElement("div"),
          dialog = document.createElement("div"),
          title = document.createElement("h3"),
          description = document.createElement("p"),
          modes = document.createElement("div"),
          workerSettings = document.createElement("div"),
          workerLabel = document.createElement("label"),
          workerToggle = document.createElement("input"),
          workerCountLabel = document.createElement("label"),
          workerCount = document.createElement("input"),
          manualLabel = document.createElement("label"),
          select = document.createElement("select"),
          actions = document.createElement("div"),
          cancel = document.createElement("button"),
          confirm = document.createElement("button");
        overlay.style.cssText =
          "position:fixed;inset:0;z-index:1000001;background:#0008;display:grid;place-items:center;padding:16px";
        dialog.setAttribute("role", "dialog");
        dialog.setAttribute("aria-modal", "true");
        dialog.setAttribute("aria-labelledby", "AUTOI_MODE_TITLE");
        dialog.style.cssText =
          "box-sizing:border-box;width:min(100%,390px);padding:18px;background:#fff;color:#111;border:1px solid #bbb;border-radius:8px;box-shadow:0 8px 30px #0005;font:14px Arial";
        title.id = "AUTOI_MODE_TITLE";
        title.textContent = "Modo de procesamiento";
        title.style.cssText = "margin:0 0 8px;font-size:17px";
        description.textContent = "Elige cómo procesar las plantillas copiadas.";
        description.style.cssText = "margin:0 0 14px;color:#444";
        modes.style.cssText = "display:flex;gap:16px;margin-bottom:14px";
        workerSettings.style.cssText =
          "display:flex;align-items:center;gap:8px;margin:0 0 14px;flex-wrap:wrap";
        workerToggle.type = "checkbox";
        workerLabel.append(workerToggle, document.createTextNode(" Procesar en varias ventanas"));
        workerCount.type = "number";
        workerCount.min = "2";
        workerCount.max = String(Math.min(MAX_WORKERS, plantillasCount));
        workerCount.value = String(Math.min(3, plantillasCount));
        workerToggle.disabled = plantillasCount < 2;
        workerCount.style.cssText =
          "box-sizing:border-box;width:68px;padding:5px;border:1px solid #888;border-radius:4px";
        workerCountLabel.append(
          document.createTextNode("Workers: "),
          workerCount
        );
        const radioGroup = `AUTOI_MODE_${Date.now()}`;
        const radioAutomatico = document.createElement("input"),
          labelAutomatico = document.createElement("label"),
          radioManual = document.createElement("input");
        radioAutomatico.type = "radio";
        radioAutomatico.name = radioGroup;
        radioAutomatico.value = "automatica";
        radioAutomatico.checked = true;
        labelAutomatico.append(radioAutomatico, document.createTextNode(" Automática"));
        radioManual.type = "radio";
        radioManual.name = radioGroup;
        radioManual.value = "manual";
        manualLabel.append(radioManual, document.createTextNode(" Manual"));
        select.disabled = true;
        select.style.cssText =
          "box-sizing:border-box;width:100%;padding:9px;border:1px solid #888;border-radius:4px;background:#fff;color:#111;font:inherit";
        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = "Selecciona la tipología para todas...";
        select.appendChild(placeholder);
        TIPOS.forEach((tipologia) => {
          const option = document.createElement("option");
          option.value = tipologia;
          option.textContent = tipologia;
          select.appendChild(option);
        });
        actions.style.cssText =
          "display:flex;justify-content:flex-end;gap:8px;margin-top:16px";
        [cancel, confirm].forEach((button) => {
          button.type = "button";
          button.style.cssText =
            "padding:8px 12px;border:1px solid #888;border-radius:4px;background:#f5f5f5;color:#111;font:inherit;cursor:pointer";
        });
        cancel.textContent = "Cancelar";
        confirm.textContent = "Iniciar";
        const cerrar = (value) => {
          document.removeEventListener("keydown", alTeclado);
          overlay.remove();
          resolve(value);
        };
        const alTeclado = (event) => {
          if (event.key === "Escape") cerrar(null);
        };
        const actualizar = () => {
          const manual = radioManual.checked;
          select.disabled = !manual;
          workerCount.disabled = !workerToggle.checked;
          const count = Number(workerCount.value);
          const countValido =
            Number.isInteger(count) &&
            count >= 2 &&
            count <= MAX_WORKERS &&
            count <= plantillasCount;
          confirm.disabled =
            (manual && !select.value) ||
            (workerToggle.checked && !countValido);
          confirm.style.opacity = confirm.disabled ? "0.55" : "1";
        };
        radioAutomatico.addEventListener("change", actualizar);
        radioManual.addEventListener("change", actualizar);
        select.addEventListener("change", actualizar);
        workerToggle.addEventListener("change", actualizar);
        workerCount.addEventListener("input", actualizar);
        actualizar();
        cancel.onclick = () => cerrar(null);
        confirm.onclick = () => {
          const workerWindows = [];
          if (workerToggle.checked) {
            const count = Math.min(Number(workerCount.value), plantillasCount);
            for (let index = 0; index < count; index++) {
              const workerWindow = window.open(
                FORM_URL,
                `AUTOI_WORKER_${Date.now()}_${index}`,
                `width=1100,height=850,left=${20 + index * 35},top=${20 + index * 35}`
              );
              if (!workerWindow) {
                workerWindows.forEach((worker) => worker.close());
                alert(
                  "El navegador bloqueó una ventana worker. Permite las ventanas emergentes y vuelve a iniciar."
                );
                return;
              }
              workerWindows.push(workerWindow);
            }
          }
          cerrar({
            modo: radioManual.checked ? "manual" : "automatica",
            tipologia: radioManual.checked ? select.value : "",
            workerWindows
          });
        };
        overlay.onclick = (event) => {
          if (event.target === overlay) cerrar(null);
        };
        document.addEventListener("keydown", alTeclado);
        workerSettings.append(workerLabel, workerCountLabel);
        modes.append(labelAutomatico, manualLabel);
        actions.append(cancel, confirm);
        dialog.append(
          title,
          description,
          modes,
          select,
          workerSettings,
          actions
        );
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        radioAutomatico.focus();
      });
    panel = () => {
      let p = document.getElementById("AUTOI_PANEL");
      if (p) p.remove();
      const q = load(),
        d = document.createElement("div");
      d.id = "AUTOI_PANEL";
      d.style.cssText =
        "position:fixed;top:20px;left:20px;z-index:999999;background:#fff;color:#111;padding:12px 15px;border:1px solid #bbb;border-radius:9px;font:13px Arial;box-shadow:0 4px 18px #0004;min-width:220px";
      d.innerHTML = `<b>📦 AUTOI</b><hr style="margin:7px 0"><div>⏳ Pendientes: <b>${q.pendientes.length}</b></div><div>✅ OK: <b>${q.ok.length}</b></div><div>❌ KO: <b>${q.ko.length}</b></div><hr style="margin:7px 0"><button id="A_COPY">📋 Copiar KO</button> <button id="A_CLEAR">🗑️ Limpiar</button>`;
      document.body.appendChild(d);
      document.getElementById("A_COPY").onclick = async () => {
        const q = load();
        if (!q.ko.length) return alert("No hay plantillas KO.");
        await navigator.clipboard.writeText(
          q.ko
            .map(
              (x, i) =>
                `===== KO ${i + 1} =====\n\n${x.plantilla}\n\nERROR: ${x.error || "Error no especificado"}`
            )
            .join("\n\n")
        );
        alert(`📋 ${q.ko.length} plantilla(s) KO copiadas.`);
      };
      document.getElementById("A_CLEAR").onclick = () => {
        if (confirm("¿Limpiar toda la memoria AUTOI?")) {
          localStorage.removeItem(K);
          d.remove();
          alert("🗑️ Memoria AUTOI limpiada.");
        }
      };
    };
  let workerTipologiaQueue = Promise.resolve();
  try {
    let q = load(),
      workerWindows = [];
    if (!q.pendientes.length && !q.ok.length && !q.ko.length) {
      const clip = await navigator.clipboard.readText();
      if (!clip?.trim()) return alert("❌ El portapapeles está vacío.");
      const partes = clip
        .split(
          /^[\t ]*-{3,}[\t ]*(?:\r?\n[\t ]*)*(?=(?:[\u2022*-]\s*(?:NOMBRE|DNI)\s*:|(?:[\u2022*-][\t ]*)?ID(?:[ \t]+CLIENTE)?[ \t]*:?[ \t]*[A-Z0-9]*\d[A-Z0-9]*|AVER[IÍ]A\s*:?\s*\d+|NUMERO\s+DE\s+OT\s*:?\s*\d+|\d{6,}\s*-\s*CERRADA))/gim
        )
        .map((x) => x.trim())
        .filter(
          (x) =>
            x &&
            /(?:AVER[IÍ]A\s*:?\s*\d+|NUMERO\s+DE\s+OT\s*:?\s*\d+|(?:^|\n)[\t ]*(?:[\u2022*-][\t ]*)?ID(?:[ \t]+CLIENTE)?[ \t]*:?[ \t]*[A-Z0-9]*\d[A-Z0-9]*|(?:^|\n)\s*\d{6,}\s*-\s*CERRADA)/i.test(
              x
            )
        );
      if (!partes.length)
        return alert("❌ No se encontraron plantillas válidas.");
      const configuracion = await elegirModo(partes.length);
      if (!configuracion) return;
      q.pendientes = partes;
      q.modo = configuracion.modo;
      q.tipologiaManual = configuracion.tipologia;
      q.workers = configuracion.workerWindows.length > 0;
      q.workerCount = configuracion.workerWindows.length;
      workerWindows = configuracion.workerWindows;
      save(q);
      console.log(`📥 ${partes.length} plantillas cargadas.`);
      alert(
        `📥 ${partes.length} plantillas cargadas.\n\n${
          workerWindows.length
            ? `Se procesarán hasta ${workerWindows.length} en paralelo.`
            : "Se procesará la primera."
        }`
      );
    }
    if (!q.pendientes.length) {
      if (!q.ko.length) {
        localStorage.removeItem(K);
        document.getElementById("AUTOI_PANEL")?.remove();
      } else {
        panel();
      }
      return alert(
        `🏁 PROCESO FINALIZADO\n\n✅ OK: ${q.ok.length}\n❌ KO: ${q.ko.length}`
      );
    }
    async function procesarPlantilla(p, formularioWindow = window) {
      const getDocument = () => formularioWindow.document;
      const esperar = (
        selector,
        intentos = formularioWindow === window ? 60 : 1000,
        demora = 60
      ) =>
        wait(selector, intentos, demora, getDocument);
      const a = p.match(/(?:^|\n)\s*AVER[IÍ]A\s*:?\s*(\d+)/i),
        o = p.match(/(?:^|\n)\s*NUMERO\s+DE\s+OT\s*:?\s*(\d+)/i),
        i = p.match(/(?:^|\n)[\t ]*(?:[\u2022*-][\t ]*)?ID(?:[ \t]+CLIENTE)?[ \t]*:?[ \t]*([A-Z0-9]*\d[A-Z0-9]*)/i),
        cerrada = p.match(/(?:^|\n)\s*(\d{6,})\s*-\s*CERRADA/i),
        caso = a
          ? { tipo: "AVERIA", id: a[1] }
          : o
            ? { tipo: "OT", id: o[1] }
            : i
              ? { tipo: "ID", id: i[1] }
              : cerrada
                ? { tipo: "ID", id: cerrada[1] }
                : null;
    if (!caso) throw Error("No se encontró AVERIA, NUMERO DE OT ni ID.");
    const normalizado = p
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase(),
      equipo = (p.match(/(?:^|\n)\s*EQUIPO\s*:\s*(.+)/i) || [])[1]?.trim() || "",
      equipoNormalizado = equipo
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim(),
      tvScore = (normalizado.match(/tv agil|decodificador|\bdeco\b|television|ver tv|sin senal|\bsenal\b|\bhdmi\b|\bmando\b/g) || []).length,
      netScore = (normalizado.match(/\brouter\b|\bwifi\b|wi-fi|\bfibra\b|sin internet|internet no|conexion a internet|banda ancha|\bont\b|\bdocsis\b|\bcga\d+\b/g) || []).length,
      tipForzada = (p.match(/(?:^|\n)\s*TIPOLOGIA\s*:\s*(.+)/i) || [])[1]?.trim(),
      esCorreo = /(?:^|\n)\s*(?:correos?\s+install\b|correos?\s*(?:\n|$)|asunto\s*:)/i.test(p),
      esRepetida = /repetida\s*\+?|rep\s+autoi|ot cancelada por no valida/i.test(normalizado) || cerrada,
      tip = q.modo === "manual"
        ? q.tipologiaManual
        : tipForzada ||
          (esCorreo
          ? "Correos install"
          : esRepetida
            ? "Rep Autoi"
            : equipo
              ? equipoNormalizado === "sagemcom deco tv lowi entry zapper"
                ? "Autoi TV"
                : "Autoi Net"
              : tvScore > netScore
                ? "Autoi TV"
                : netScore > tvScore
                  ? "Autoi Net"
                  : "");
    console.log(
      `📋 ${caso.tipo}: ${caso.id} | 📦 ${equipo || "Sin equipo"} | 🎯 ${tip || "Elegir manualmente"}`
    );
    const id = await esperar("#TextField1");
    if (!id) throw Error("No apareció TextField1.");
    setv(id, "");
    await S(50);
    if (!setv(id, caso.id)) throw Error("No se pudo rellenar TextField1.");
    await S(100);
    const ts = await esperar("#displayView-displayDiv-Tipolog_x00ed_a");
    if (!ts) throw Error("No apareció el selector de Tipología.");
    const normalizarTexto = (texto) =>
      texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
    const findOption = (label) => {
      const textoBuscado = normalizarTexto(label),
        visibles = [...
          getDocument().querySelectorAll(
            '[role="option"],li,div,span,button,[role="menuitem"]'
          )
        ].filter((e) => {
          const estilo = formularioWindow.getComputedStyle(e),
            texto = normalizarTexto(e.innerText || e.textContent || "");
          return (
            texto === textoBuscado &&
            e.getClientRects().length > 0 &&
            estilo.visibility !== "hidden" &&
            estilo.display !== "none"
          );
        });
      return visibles.sort(
        (a, b) =>
          a.getBoundingClientRect().width * a.getBoundingClientRect().height -
          b.getBoundingClientRect().width * b.getBoundingClientRect().height
      )[0];
    };
    const findOriginalOption = (label) =>
      [...getDocument().querySelectorAll('[role="option"],li,div')].find(
        (e) =>
          e.innerText?.trim().toLowerCase() === label.toLowerCase() &&
          e.offsetParent !== null
      );
    const hayOpcionesVisibles = () =>
      [...getDocument().querySelectorAll('[role="option"],li')].some(
        (e) => e.getClientRects().length > 0
      );
    const seleccionarOpcionReact = async (label) => {
      if (ts.getAttribute("aria-expanded") !== "true") {
        ts.click();
      }
      let option = null;
      for (let attempt = 0; attempt < 30 && !option; attempt++) {
        option = findOriginalOption(label);
        if (!option) await S(40);
      }
      if (option) {
        option.click();
        await S(80);
        return true;
      }
      ts.focus();
      if (
        ts.getAttribute("aria-expanded") !== "true" &&
        !hayOpcionesVisibles()
      ) {
        ts.click();
        await S(100);
      }
      if (
        ts.getAttribute("aria-expanded") !== "true" &&
        !findOption(label) &&
        !hayOpcionesVisibles()
      ) {
        ts.dispatchEvent(
          new formularioWindow.KeyboardEvent("keydown", {
            key: "ArrowDown",
            code: "ArrowDown",
            keyCode: 40,
            which: 40,
            bubbles: true
          })
        );
      }
      option = null;
      for (let attempt = 0; attempt < 60 && !option; attempt++) {
        option = findOption(label);
        if (!option) await S(50);
      }
      if (!option) return false;
      option.dispatchEvent(
        new formularioWindow.MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
          view: formularioWindow
        })
      );
      option.click();
      for (let attempt = 0; attempt < 30; attempt++) {
        const valor = normalizarTexto(ts.innerText || ts.textContent || "");
        if (valor.includes(normalizarTexto(label))) return true;
        await S(50);
      }
      return false;
    };
    const seleccionarTipologia = () =>
      new Promise((resolve) => {
        const overlay = document.createElement("div"),
          dialog = document.createElement("div"),
          title = document.createElement("h3"),
          label = document.createElement("label"),
          select = document.createElement("select"),
          actions = document.createElement("div"),
          cancel = document.createElement("button"),
          confirm = document.createElement("button");
        overlay.style.cssText =
          "position:fixed;inset:0;z-index:1000001;background:#0008;display:grid;place-items:center;padding:16px";
        dialog.setAttribute("role", "dialog");
        dialog.setAttribute("aria-modal", "true");
        dialog.setAttribute("aria-labelledby", "AUTOI_TIP_TITLE");
        dialog.style.cssText =
          "box-sizing:border-box;width:min(100%,360px);padding:18px;background:#fff;color:#111;border:1px solid #bbb;border-radius:8px;box-shadow:0 8px 30px #0005;font:14px Arial";
        title.id = "AUTOI_TIP_TITLE";
        title.textContent = "Seleccionar tipología";
        title.style.cssText = "margin:0 0 14px;font-size:17px";
        label.textContent = "Tipología del formulario";
        label.htmlFor = "AUTOI_TIP_SELECT";
        label.style.cssText = "display:block;margin-bottom:6px";
        select.id = "AUTOI_TIP_SELECT";
        select.style.cssText =
          "box-sizing:border-box;width:100%;padding:9px;border:1px solid #888;border-radius:4px;background:#fff;color:#111;font:inherit";
        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = "Selecciona una opción...";
        select.appendChild(placeholder);
        TIPOS.forEach((tipologia) => {
          const option = document.createElement("option");
          option.value = tipologia;
          option.textContent = tipologia;
          select.appendChild(option);
        });
        actions.style.cssText =
          "display:flex;justify-content:flex-end;gap:8px;margin-top:16px";
        [cancel, confirm].forEach((button) => {
          button.type = "button";
          button.style.cssText =
            "padding:8px 12px;border:1px solid #888;border-radius:4px;background:#f5f5f5;color:#111;font:inherit;cursor:pointer";
        });
        cancel.textContent = "Cancelar";
        confirm.textContent = "Usar tipología";
        confirm.disabled = true;
        confirm.style.opacity = "0.55";
        const cerrar = (value) => {
          document.removeEventListener("keydown", alTeclado);
          overlay.remove();
          resolve(value);
        };
        const alTeclado = (event) => {
          if (event.key === "Escape") cerrar(null);
        };
        select.addEventListener("change", () => {
          confirm.disabled = !select.value;
          confirm.style.opacity = select.value ? "1" : "0.55";
        });
        cancel.onclick = () => cerrar(null);
        confirm.onclick = () => cerrar(select.value);
        overlay.onclick = (event) => {
          if (event.target === overlay) cerrar(null);
        };
        document.addEventListener("keydown", alTeclado);
        actions.append(cancel, confirm);
        dialog.append(title, label, select, actions);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        select.focus();
      });
    let tipElegida = tip;
    let tipologiaSeleccionada = tip
      ? await seleccionarOpcionReact(tip)
      : false;
    if (!tipologiaSeleccionada) {
      const solicitudTipologia = workerTipologiaQueue.then(
        () => seleccionarTipologia()
      );
      workerTipologiaQueue = solicitudTipologia.then(
        () => undefined,
        () => undefined
      );
      const manual = await solicitudTipologia;
      if (manual === null) {
        return null;
      }
      tipElegida = manual.trim();
      tipologiaSeleccionada = await seleccionarOpcionReact(tipElegida);
      if (!tipologiaSeleccionada) {
        alert(
          `React no confirmó la selección de "${tipElegida}". La plantilla sigue pendiente.`
        );
        return null;
      }
    }
    await S(80);
    const obs = await esperar("#TextField8");
    if (!obs) throw Error("No apareció TextField8.");
    setv(obs, "");
    await S(40);
    if (!setv(obs, p)) throw Error("No se pudo rellenar TextField8.");
    await S(100);
    const btn = await esperar("#form-submit-button");
    if (!btn) throw Error("No apareció el botón Enviar.");
    btn.click();
    console.log(`📤 Enviando ${caso.id}...`);
    const otra = await esperar(
      'button[aria-label="Enviar otra respuesta"]',
      80,
      75
    );
    if (!otra) throw Error("No apareció Enviar otra respuesta.");
    otra.click();
    return { id: caso.id, tipo: caso.tipo, tipologia: tipElegida, plantilla: p };
    }
    if (workerWindows.length) {
      let nextIndex = 0;
      const pendientesIniciales = [...q.pendientes];
      const ejecutarWorker = async (formularioWindow, workerIndex) => {
        while (nextIndex < pendientesIniciales.length) {
          const plantilla = pendientesIniciales[nextIndex++];
          try {
            const resultado = await procesarPlantilla(
              plantilla,
              formularioWindow
            );
            if (!resultado) continue;
            const indice = q.pendientes.indexOf(plantilla);
            if (indice >= 0) q.pendientes.splice(indice, 1);
            q.ok.push(resultado);
            save(q);
            console.log(
              `✅ Worker ${workerIndex + 1}: ${resultado.id}. Pendientes: ${q.pendientes.length}`
            );
          } catch (error) {
            const indice = q.pendientes.indexOf(plantilla);
            if (indice >= 0) q.pendientes.splice(indice, 1);
            q.ko.push({
              plantilla,
              error: error instanceof Error ? error.message : String(error)
            });
            save(q);
            console.error(`❌ Worker ${workerIndex + 1}`, error);
          }
          panel();
        }
      };
      try {
        await Promise.all(
          workerWindows.map((formularioWindow, index) =>
            ejecutarWorker(formularioWindow, index)
          )
        );
      } finally {
        workerWindows.forEach((formularioWindow) => {
          if (!formularioWindow.closed) formularioWindow.close();
        });
        workerWindows = [];
      }
      q.workers = false;
      q.workerCount = 0;
      if (!q.pendientes.length && !q.ko.length) {
        localStorage.removeItem(K);
        document.getElementById("AUTOI_PANEL")?.remove();
        return alert(
          `🏁 PROCESO FINALIZADO\n\n✅ OK: ${q.ok.length}\n❌ KO: 0`
        );
      }
      save(q);
      panel();
      return alert(
        `🏁 PROCESO FINALIZADO\n\n✅ OK: ${q.ok.length}\n❌ KO: ${q.ko.length}\n⏳ Pendientes: ${q.pendientes.length}`
      );
    }
    if (q.workers) {
      q.workers = false;
      q.workerCount = 0;
      save(q);
      console.warn(
        "No hay ventanas worker disponibles; se continuará en la ventana actual."
      );
    }
    const plantilla = q.pendientes[0];
    const resultado = await procesarPlantilla(plantilla);
    if (!resultado) {
      panel();
      return;
    }
    q.pendientes.shift();
    q.ok.push(resultado);
    const finalizado = !q.pendientes.length && !q.ko.length;
    if (finalizado) localStorage.removeItem(K);
    else save(q);
    console.log(`✅ ${resultado.id} procesado. Pendientes: ${q.pendientes.length}`);
    if (finalizado) {
      document.getElementById("AUTOI_PANEL")?.remove();
      alert(`🏁 PROCESO FINALIZADO\n\n✅ OK: ${q.ok.length}\n❌ KO: 0`);
      return;
    }
    panel();
  } catch (e) {
    console.error("❌", e);
    const q = load();
    if (q.pendientes.length) {
      const p = q.pendientes.shift();
      q.ko.push({ plantilla: p, error: e.message });
      save(q);
    }
    panel();
    alert(`❌ PLANTILLA KO\n\n${e.message}`);
  }
})();
