javascript: (async () => {
  const USERNAME = "hsteffe1",
    PASSWORD = "Alemania2026--",
    USERCORREO = "hsteffe1@corp.vodafone.es";
  const Utils = {
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    waitForElement: (selector, timeout = 20000, isReady = () => true) =>
      new Promise((resolve, reject) => {
        let observer,
          timer,
          done = false;
        const cleanup = () => {
          if (observer) observer.disconnect();
          if (timer) clearTimeout(timer);
        };
        const finish = (callback, value) => {
          if (done) return;
          done = true;
          cleanup();
          callback(value);
        };
        const check = () => {
          const element = document.querySelector(selector);
          if (!element) return;
          try {
            if (isReady(element)) finish(resolve, element);
          } catch (error) {
            finish(reject, error);
          }
        };
        check();
        if (done) return;
        observer = new MutationObserver(check);
        observer.observe(document.documentElement, {
          childList: true,
          subtree: true
        });
        timer = setTimeout(
          () => finish(reject, new Error("Timeout: " + selector)),
          timeout
        );
        check();
      }),
    copyText: async (text) => {
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(text);
          return;
        } catch {}
      }
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand("copy");
      textarea.remove();
      if (!copied) throw new Error("No se pudo copiar al portapapeles.");
    },
    fillInput: (element, value) => {
      const prototype =
        element instanceof HTMLTextAreaElement
          ? HTMLTextAreaElement.prototype
          : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
      if (!setter) throw new Error("No se pudo establecer el valor del campo.");
      element.focus();
      setter.call(element, value);
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
      element.dispatchEvent(
        new KeyboardEvent("keyup", {
          key: value.slice(-1),
          bubbles: true
        })
      );
    }
  };
  const isHost = (url, host) =>
    url.hostname === host || url.hostname.endsWith("." + host);

  async function runLowi() {
    console.log("?? Ejecutando LOWI");
    const eD = ["DNI:", "NIE:"],
      eID = ["AMDOCS ID:", "ID Cliente:"],
      eM = ["Tlf. contacto:", "Movil:"],
      eDir = [
        "Dirección de instalación:",
        "Direccion:",
        "Dirección facturación:"
      ],
      eFinDir = [
        "Tipo de huella:",
        "Tipo de instalación:",
        "Movil:",
        "Tlf. contacto:",
        "DNI:",
        "ID Cliente:",
        "Fecha creación:",
        "Segmento:",
        "Cuenta bancaria:",
        "Sap ID:",
        "App instalada:",
        "Suscripción ID:",
        "Tarifa:",
        "Fecha activación:",
        "Plan de suscripción actual:",
        "Linea móvil adicional :",
        "ICC:",
        "Portabilidad",
        "Operador donante:",
        "Cargo pendiente:",
        "Motivo de congelamiento:",
        "Factura en papel:",
        "Idioma de la factura:",
        "Crear Ticket",
        "Histórico de planes"
      ],
      limpiar = (t) =>
        t.replaceAll("(Modificar)", "").trim().split(/\s+/).join(" "),
      extraerTexto = (l) => {
        for (const n of l) {
          const o = [...document.querySelectorAll("span,div,li,p")].find((e) =>
            e.textContent.includes(n)
          );
          if (o) {
            let e = o.textContent.trim(),
              i = e.indexOf(n);
            if (i >= 0) {
              e = e.slice(i + n.length).trim();
              let l = e.indexOf("\n"),
                p = e.indexOf("|");
              if (l < 0 || (p >= 0 && p < l)) l = p;
              if (l >= 0) e = e.slice(0, l).trim();
              return limpiar(e);
            }
          }
        }
        return "[No encontrado]";
      },
      extraerMoviles = () => {
        const t = document.body.innerText,
          f = [],
          r = /(?:^|\D)([67]\d{2}\s?\d{3}\s?\d{3})(?:\D|$)/g;
        let m;
        while ((m = r.exec(t)) !== null) {
          let n = m[1].replace(/\s+/g, "");
          if (!f.includes(n)) f.push(n);
        }
        return f.length ? f.join(" | ") : "N/A";
      },
      extraerDireccion = () => {
        for (const n of eDir) {
          const o = [...document.querySelectorAll("span,div,li,p")].find((e) =>
            e.textContent.includes(n)
          );
          if (o) {
            let t = o.textContent,
              i = t.indexOf(n),
              d = t.slice(i + n.length).trim(),
              c = o.nextSibling;
            while (c) {
              let t = "";
              if (c.nodeType === Node.TEXT_NODE) t = c.textContent.trim();
              else if (c.nodeType === Node.ELEMENT_NODE)
                t = c.textContent.trim();
              if (eFinDir.some((e) => t.includes(e))) break;
              d += " " + t;
              c = c.nextSibling;
            }
            d = limpiar(d);
            for (const t of eFinDir) {
              let n = d.indexOf(t);
              if (n > -1) d = d.slice(0, n).trim();
            }
            return d;
          }
        }
        return "[No encontrado]";
      },
      extraerNombre = () => {
        try {
          const e = document.evaluate(
            '//*[@id="content-main"]/div/div[3]/div[1]/span[1]',
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
          ).singleNodeValue;
          return e
            ? limpiar(e.textContent.replace("Nombre:", ""))
            : "[No encontrado]";
        } catch {
          return "[No encontrado]";
        }
      },
      nombre = extraerNombre(),
      dni = extraerTexto(eD),
      idCliente = extraerTexto(eID),
      movilExtraido = extraerMoviles(),
      movil = movilExtraido !== "N/A" ? movilExtraido : extraerTexto(eM),
      direccion = extraerDireccion(),
      crearPlantilla = (t) =>
        t === "lowi"
          ? [
              "AVERIA:",
              "",
              "• Nombre: " + nombre,
              "• DNI: " + dni,
              "• ID: " + idCliente,
              "• Dirección: " + direccion,
              "• # Móvil: " + movil,
              "• Qué dice el diagnostico que le sucede:",
              "• Pruebas realizadas desde el sistema:",
              "• Pruebas realizadas con el cliente:",
              "• Qué has averiguado con tu diagnóstico?",
              "",
              "• FECHA INSTALACION EQUIPO :",
              "• NOMBRE RED:",
              "• CONTRASEÑA:",
              "",
              "• ULTIMO RESET :",
              "• Solución:"
            ].join("\n")
          : [
              "AVERIA:",
              "",
              "• Nombre: " + nombre,
              "• DNI: " + dni,
              "• ID: " + idCliente,
              "• Dirección: " + direccion,
              "• # Móvil: " + movil
            ].join("\n"),
      menu = document.createElement("div");
    menu.innerHTML =
      '<div style="position:fixed;top:20px;right:20px;z-index:9999;background:#222;color:#fff;padding:14px 18px;border-radius:14px;font-family:sans-serif;font-size:16px"><br>Selecciona plantilla:<br><button id="btnLowi" style="margin-top:10px;width:140px;height:45px;background:#ff4d4d;color:#fff;border:0;border-radius:14px;font-weight:bold">Lowi</button><button id="btnCorta" style="margin-left:10px;width:140px;height:45px;background:#3399ff;color:#fff;border:0;border-radius:14px;font-weight:bold">Corta</button></div>';
    document.body.appendChild(menu);
    const copiar = async (text) => {
      try {
        await Utils.copyText(text);
        menu.remove();
        const aviso = document.createElement("div");
        aviso.textContent = "? Copiado correctamente";
        Object.assign(aviso.style, {
          position: "fixed",
          top: "20px",
          right: "20px",
          background: "#28a745",
          color: "#fff",
          padding: "10px 16px",
          borderRadius: "8px",
          zIndex: 9999
        });
        document.body.appendChild(aviso);
        setTimeout(() => aviso.remove(), 2000);
      } catch (error) {
        alert("? Error al copiar: " + error.message);
      }
    };
    document.getElementById("btnLowi").onclick = () =>
      copiar(crearPlantilla("lowi"));
    document.getElementById("btnCorta").onclick = () =>
      copiar(crearPlantilla("corta"));
  }

  async function runVodafoneTraceability() {
    console.log("?? Ejecutando TRAZABILIDAD VODAFONE");

    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.style.cssText =
        "position:fixed;top:16px;right:16px;z-index:9999998;font-family:Inter,Segoe UI,Arial,sans-serif";

      const box = document.createElement("div");
      box.style.cssText =
        "width:230px;max-width:calc(100vw - 32px);background:#fff;border-radius:10px;padding:10px;box-shadow:0 6px 20px rgba(0,0,0,.16);border:1px solid #e2e8f0;box-sizing:border-box";

      box.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;color:#334155;font-size:13px;font-weight:700">
          <span>Trazabilidad</span>
          <button id="vodafone-cancel" title="Cerrar" aria-label="Cerrar" style="border:0;background:transparent;color:#64748b;padding:0 2px;cursor:pointer;font-size:17px;line-height:1">×</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px">
          <button id="vodafone-individual" style="border:1px solid #dbe4ee;background:#f8fafc;color:#0f172a;border-radius:7px;min-height:34px;cursor:pointer;padding:5px 4px;display:flex;align-items:center;justify-content:center;gap:4px;font-family:inherit;font-size:12px;font-weight:700;transition:background .15s ease,border-color .15s ease">
            <span aria-hidden="true" style="font-size:14px">🧍</span>
            <span>Individual</span>
          </button>
          <button id="vodafone-masivo" style="border:1px solid #dbe4ee;background:#f8fafc;color:#0f172a;border-radius:7px;min-height:34px;cursor:pointer;padding:5px 4px;display:flex;align-items:center;justify-content:center;gap:4px;font-family:inherit;font-size:12px;font-weight:700;transition:background .15s ease,border-color .15s ease">
            <span aria-hidden="true" style="font-size:14px">📦</span>
            <span>Masivo</span>
          </button>
        </div>
      `;

      const loadScript = (url) => {
        const script = document.createElement("script");
        script.src = url;
        script.type = "text/javascript";
        script.async = true;

        script.onload = () => {
          console.log("Script cargado correctamente:", url);
          resolve();
        };

        script.onerror = () => {
          console.error("No se pudo cargar el script:", url);
          alert("No se pudo cargar la trazabilidad seleccionada.");
          resolve();
        };

        document.body.appendChild(script);
      };

      const close = () => overlay.remove();

      box.querySelector("#vodafone-individual").onclick = () => {
        close();
        loadScript(
          "https://cdn.jsdelivr.net/gh/Lowi2026/AUTOMALOW@main/TraIndividual.js?v=" +
            Date.now()
        );
      };

      box.querySelector("#vodafone-masivo").onclick = () => {
        close();
        loadScript(
          "https://cdn.jsdelivr.net/gh/Lowi2026/AUTOMALOW@main/Trazabilidad.js?v=" +
            Date.now()
        );
      };

      box.querySelector("#vodafone-cancel").onclick = () => {
        close();
        resolve();
      };

      overlay.onclick = (event) => {
        if (event.target === overlay) {
          close();
          resolve();
        }
      };

      overlay.appendChild(box);
      document.body.appendChild(overlay);
    });
  }

  async function runCisas() {
    const { waitForElement: wait, fillInput: fill } = Utils;
    console.log("?? Ejecutando CISAS");
    let u = await wait('input[name="username"]');
    fill(u, USERNAME);
    console.log("? Usuario CISAS cargado desde USERNAME");
    let p = await wait('input[name="password"]');
    fill(p, PASSWORD);
    console.log("? Password CISAS cargada desde PASSWORD");
    let b = await wait('button[type="submit"]');
    b.click();
    console.log("?? CISAS enviado");
  }

  async function runMicrosoftLogin() {
    const { waitForElement: wait, fillInput: fill } = Utils;
    console.log("?? Ejecutando LOGIN MICROSOFT");
    let c = await wait("#i0116");
    fill(c, USERCORREO);
    console.log("? Correo Microsoft cargado desde USERCORREO");
    let n = await wait("#idSIButton9");
    n.click();
    console.log("?? Siguiente pulsado");
    let p = await wait("#i0118");
    fill(p, PASSWORD);
    console.log("? Password Microsoft cargada desde PASSWORD");
    let i = await wait("#idSIButton9");
    i.click();
    console.log("?? Login Microsoft enviado");
  }

  async function runEtaDirect() {
    console.log("?? Ejecutando ETA DIRECT");
    function getText(label) {
      const el = [...document.querySelectorAll("div,span,td")].find(
        (e) => e.textContent.trim() === label
      );
      return el?.nextElementSibling?.textContent.trim() || "";
    }
    const s = getText("Id Solicitud"),
      c = getText("Identificador CRM"),
      t = getText("Usuario"),
      o = getText("Número de Orden"),
      f = getText("Tfno Técnico"),
      m = getText("Comentarios del Instalador"),
      d = new Date().toLocaleDateString("es-ES"),
      r = `BO_COPS_Mobility Lowi // Solicitud: ${s} // Nº Cliente: ${c} // Técnico: ${t} // Ticket: ${o} // Fecha de creación: ${d} // Tlf Tecnico: ${f} // Comentario técnico: ${m} // Respuesta a técnico:`;
    try {
      await Utils.copyText(r);
      alert("? Plantilla copiada");
    } catch (error) {
      alert("? Error: " + error.message);
    }
  }

  async function runThot() {
    const { waitForElement: wait, fillInput: fill, sleep } = Utils;
    console.log("?? Ejecutando THOT");
    let u = await wait("#login-name");
    fill(u, USERNAME);
    console.log("? Usuario THOT cargado desde USERNAME");
    let p = await wait("#login-pass");
    fill(p, PASSWORD);
    console.log("? Password THOT cargada desde PASSWORD");
    let c = await wait("#condiciones");
    if (!c.checked) c.click();
    console.log("?? Condiciones aceptadas");
    let b = await wait("#enviar"),
      n = 0;
    while (b.disabled && n < 200) {
      await sleep(100);
      b = document.querySelector("#enviar");
      n++;
    }
    if (b && !b.disabled) {
      b.click();
      console.log("?? Login THOT enviado");
    } else console.log("?? El botón continúa deshabilitado");
  }

  const handlers = [
    {
      name: "LOWI",
      matches: (url) =>
        isHost(url, "lowi.es") && url.pathname.includes("/bo/milowi"),
      run: runLowi
    },
    {
      name: "TRAZABILIDAD VODAFONE",
      matches: (url) => url.href.includes("vodafone-espa-a--s-a-u--production"),
      run: runVodafoneTraceability
    },
    {
      name: "CISAS",
      matches: (url) => isHost(url, "nubgt01.ono.es"),
      run: runCisas
    },
    {
      name: "LOGIN MICROSOFT",
      matches: (url) => isHost(url, "login.microsoftonline.com"),
      run: runMicrosoftLogin
    },
    {
      name: "ETA DIRECT",
      matches: (url) => isHost(url, "vodafone.etadirect.com"),
      run: runEtaDirect
    },
    {
      name: "THOT",
      matches: (url) => isHost(url, "thot.ono.es"),
      run: runThot
    }
  ];
  const currentUrl = new URL(location.href);
  const handler = handlers.find(({ matches }) => matches(currentUrl));
  if (handler) {
    try {
      await handler.run();
    } catch (error) {
      console.error("Error en " + handler.name + ":", error);
      alert("Error al ejecutar " + handler.name + ": " + error.message);
    }
  } else {
    console.log("?? Portal no reconocido:", currentUrl.hostname);
  }
})();
