(async function() {
  // =========================================================================
  // CARGA DE ICONOS Y ESTILOS GLOBALES (Estética del Script 1)
  // =========================================================================
  if (!document.getElementById("g-font-awesome")) {
    const fa = document.createElement("link");
    fa.id = "g-font-awesome";
    fa.rel = "stylesheet";
    fa.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css";
    document.head.appendChild(fa);
  }

  const u = window.location.href;
  const CDN_BASE = "https://cdn.jsdelivr.net/gh/Lowi2026/AUTOMALOW@main/";

  // Sistema de notificaciones Toast nativo
  const showToast = (msg) => {
    const t = document.createElement("div");
    t.style = `
      position: fixed; bottom: 20px; right: 20px; background: #7b2cbf; color: white;
      padding: 12px 18px; border-radius: 8px; font-family: Arial, sans-serif; z-index: 999999999;
      opacity: 0; transition: opacity .3s; font-size: 13px; font-weight: bold; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    t.innerHTML = `<i class="fa-solid fa-check-double"></i> | ${msg}`;
    document.body.appendChild(t);
    setTimeout(() => (t.style.opacity = "1"), 10);
    setTimeout(() => {
      t.style.opacity = "0";
      setTimeout(() => t.remove(), 300);
    }, 2500);
  };

  // Cargador Asíncrono usando la infraestructura CDN de jsDelivr
  const fetchCloudData = async (archivo) => {
    try {
      const r = await fetch(`${CDN_BASE}${archivo}?t=${Date.now()}`);
      if (!r.ok) throw new Error();
      return await r.json();
    } catch (e) {
      console.error(`Error cargando vía CDN: ${archivo}`);
      return null;
    }
  };

  // --- LÓGICA NATIVA DE DETECCIÓN SCRIPT 1 ---
  const detectarTecnologiaScript1 = (bloqueTexto) => {
    const textoLimpio = bloqueTexto.toUpperCase();
    if (textoLimpio.includes("NEBAL")) return "NEBAL";
    if (textoLimpio.includes("NEBAF")) return "NEBAF";
    if (textoLimpio.includes("HFC")) return "HFC";
    if (textoLimpio.includes("FTTH")) return "FTTH";
    return "FTTH"; // Valor por defecto del Script 1
  };

  const detectarONT = (bloqueTexto) => {
    const clean = bloqueTexto.toUpperCase();
    if (clean.includes("ONT") && (clean.includes("ALARM") || clean.includes("LOS RED") || clean.includes("EXTERNA"))) {
      return true;
    }
    return false;
  };

  // Constructor de Interfaz Lateral Fija (Formato Plano Plano)
  const renderPanelLateral = (titulo, subtitulo) => {
    const anterior = document.getElementById("contenedorMenuGlobalUnico");
    if (anterior) anterior.remove();

    const menu = document.createElement("div");
    menu.id = "contenedorMenuGlobalUnico";
    menu.innerHTML = `
      <div id="menuCopiUnico" style="
        position: fixed !important; top: 50% !important; right: 20px !important;
        transform: translateY(-50%) !important; padding: 14px !important;
        border-radius: 12px !important; box-shadow: 0 0 20px rgba(128,0,255,0.35) !important;
        z-index: 999999 !important; width: 285px !important; max-height: 80vh !important;
        overflow-y: auto !important; font-family: Arial, sans-serif !important; text-align: left !important;
        background:#1a0f1f !important; color:white !important; border: 1px solid #5a1e80 !important;
      ">
        <div id="cerrarMenuUnico" style="position:absolute !important; top:8px !important; right:10px !important; font-size:18px !important; cursor:pointer !important; color:#ff6b6b !important;">
          <i class="fa-solid fa-xmark"></i>
        </div>
        <h2 style="margin-top:0 !important; text-align:center !important; color:#d9a6ff !important; font-weight:600 !important; letter-spacing:.5px !important; font-size:15px !important; margin-bottom:4px !important;">${titulo}</h2>
        <p style="text-align:center !important; margin-top:-6px !important; color:#c9c9c9 !important; font-size:11px !important; margin-bottom:12px !important;">${subtitulo}</p>
        <div id="cuerpoMenuUnico"></div>
      </div>
      <style>
        #menuCopiUnico::-webkit-scrollbar { width: 6px; }
        #menuCopiUnico::-webkit-scrollbar-track { background: #2a0f3a; border-radius: 10px; }
        #menuCopiUnico::-webkit-scrollbar-thumb { background: #7b2cbf; border-radius: 10px; }
        #menuCopiUnico::-webkit-scrollbar-thumb:hover { background: #9d4edd; }
        .btnMenuUnico { width: 100% !important; padding: 8px 10px !important; margin: 4px 0 !important; border-radius: 8px !important; border: none !important; color: white !important; background: #3a1450 !important; border: 1px solid #5a1e80 !important; cursor: pointer !important; transition: background .15s !important; font-size: 11px !important; text-align: left !important; font-weight: bold; display: block; }
        .btnMenuUnico:hover { background: #5a1e80 !important; }
        .btnCierreUnico { width: 100% !important; padding: 8px !important; margin-top: 12px !important; border-radius: 8px !important; border: 1px solid #ff6b6b !important; color: #ff6b6b !important; background: transparent !important; cursor: pointer !important; font-size: 11px !important; font-weight: bold; text-align: center; }
        .btnCierreUnico:hover { background: rgba(255,107,107,0.1) !important; }
        .tituloGrupoUnico { padding: 10px !important; background: #2a0f3a !important; border-radius: 8px !important; margin-top: 8px !important; cursor: pointer !important; font-weight: bold !important; font-size: 12px !important; border: 1px solid #5a1e80 !important; display: flex; justify-content: space-between; align-items: center; }
        .tituloGrupoUnico:hover { background: #3a1450 !important; }
        .contenidoGrupoUnico { margin-left: 4px !important; padding-left: 6px !important; border-left: 2px solid #9d4edd !important; margin-top: 5px !important; margin-bottom: 8px !important; display: none !important; }
      </style>
    `;
    document.body.appendChild(menu);

    menu.querySelectorAll(".tituloGrupoUnico").forEach(t => {
      t.addEventListener("click", () => {
        const cont = t.nextElementSibling;
        const abierto = t.classList.contains("abierto");
        menu.querySelectorAll(".contenidoGrupoUnico").forEach(x => x.style.setProperty("display", "none", "important"));
        menu.querySelectorAll(".tituloGrupoUnico").forEach(x => x.classList.remove("abierto"));
        if (!abierto) {
          cont.style.setProperty("display", "block", "important");
          t.classList.add("abierto");
        }
      });
    });

    menu.querySelector("#cerrarMenuUnico").onclick = () => menu.remove();
    return menu.querySelector("#cuerpoMenuUnico");
  };

  // =========================================================================
  // ENTORNO LOWI.ES (Procesamiento de PL.json)
  // =========================================================================
  if (u.includes("lowi.es")) {
    // LLAMADA EXCLUSIVA AL NUEVO ARCHIVO PL.JSON
    const templatesCloud = await fetchCloudData("PL.json");
    if (!templatesCloud) return alert("❌ Error: No se pudo sincronizar el archivo PL.json desde el CDN.");

    const extraerVariable = (keywords) => {
      const cuerpo = document.body.innerText;
      for (let k of keywords) {
        let idx = cuerpo.toLowerCase().indexOf(k.toLowerCase());
        if (idx > -1) {
          let linea = cuerpo.slice(idx + k.length).split("\n")[0].trim();
          return linea.replace(/\(Modificar\)/gi, "").trim();
        }
      }
      return "N/A";
    };

    const extraerMoviles = () => {
      const t = document.body.innerText, found = [], regex = /(?:^|\D)([67]\d{2}\s?\d{3}\s?\d{3})(?:\D|$)/g;
      let m;
      while ((m = regex.exec(t)) !== null) {
        let n = m[1].replace(/\s+/g, '');
        if (!found.includes(n)) found.push(n);
      }
      return found.length ? found.join(" | ") : "N/A";
    };

    const extraerDireccion = (t) => {
      let s = ["Dirección de instalación:", "Direccion:"], e = ["Tipo de huella:", "Tarifa:", "Internet principal"];
      for (let x of s) {
        let i = t.indexOf(x);
        if (i > -1) {
          let r = t.slice(i + x.length);
          for (let y of e) {
            let p = r.indexOf(y);
            if (p > -1) r = r.slice(0, p);
          }
          return r.trim();
        }
      }
      return "N/A";
    };

    const buildEncabezado = (bloqueTexto) => {
      return [
        `Nombre: ${extraerVariable(["Nombre del cliente:", "Cliente:", "Titular:", "Nombre:"])}`,
        `DNI: ${extraerVariable(["DNI:", "NIE:", "Documento:", "DNI/NIE:"])}`,
        `ID: ${extraerVariable(["AMDOCS ID:", "ID Cliente:", "ID:"])}`,
        `Dirección: ${extraerDireccion(bloqueTexto)}`,
        `Móvil: ${extraerMoviles()}`
      ].join("\n") + "\n";
    };

    const compilarFormatoFront = (servicio, grupo, clave) => {
      const bTexto = servicio.texto;
      let f = [...templatesCloud[grupo][clave]]; // Clonamos la matriz para no alterar el caché local
      
      const tech = detectarTecnologiaScript1(bTexto);

      // ---------------------------------------------------------------------
      // INYECCIÓN DINÁMICA DE REGLAS (Fiel reflejo al Script 1 original)
      // ---------------------------------------------------------------------
      
      // 1. Caso Incomunicado Total
      if (f[1] === "DINAMICO_INCOMUNICADO") {
        if (tech === "HFC") {
          f[1] = "router con luces intermitentes, sin acceso remoto al cpe, se valida cableado sin daños";
          f[2] = "posible daño en acometida HFC";
        } else {
          const tieneOnt = detectarONT(bTexto);
          f[1] = tieneOnt ? "ONT en rojo en alarm, sin acceso remoto, se valida el cableado no presenta daños y no hay acceso a cpe" : "router con ONT integrada sin sincronismo, se valida el cableado no presenta daños, conectado correctamente router";
          f[2] = tieneOnt ? "posible daño en tramo óptico" : "posible daño en fibra";
        }
      }

      // 2. Caso Cortes de Servicio
      if (f[1] === "DINAMICO_CORTES_RESUELTO") {
        f[1] = tech === "HFC" ? "Se revisa en thot hay cortes en los últimos 7 días se hace reinicio de fábrica, ajuste de cableado y separación de bandas, conexión a red de internet ya es estable no hay cortes" : "Se reviso en Schaman hay cortes, reinicio de fábrica, ajuste de cableado, señal estable en ambas bandas wifi";
      }
      if (f[1] === "DINAMICO_CORTES_TECNICO") {
        f[1] = tech === "HFC" ? "Se valido en Thot bastantes cortes, reinicio de fábrica sin mejora tras prueba de conexión" : "Cortes en Schaman, reinicio de fábrica sin mejora";
        f[2] = tech === "HFC" ? "Señal degradada tras saturación del cpe" : "Posible daño en cpe";
      }
      if (f[1] === "DINAMICO_CORTES_NV2") {
        f[1] = tech === "HFC" ? "Se valido en Thot cortes de poco tiempo persistentes, se aplico reinicio de fábrica, y se deja para validación de nivel 2" : "Cortes persistentes validados en Schaman, se hace pruebas con videos y en red pero sigue ocurriendo y sin mejora";
      }

      // 3. Caso Fuera de Umbrales
      if (f[1] === "DINAMICO_FUERA_RESUELTO") {
        f[1] = tech === "HFC" ? "Se valida en THOT parámetros fuera de umbrales, se reinicia de fábrica, se reinician parámetros SNMP, flaps y QoS, separación de bandas, test correcto" : "Se revisa en Schaman parámetros fuera de umbrales, se hace reinicio de fábrica, separación de bandas, test correcto";
        f[3] = tech === "HFC" ? "Se reincia de fabrica, se reinician parámetros SNMP, se dividen bandas y se comprueba con cliente que el internet ya no tiene cortes ni lentitud ni parametros fuera de umbral" : "Se deja resuelto";
      }
      if (f[1] === "DINAMICO_FUERA_NO") {
        f[1] = tech === "HFC" ? "Fuera de umbrales en THOT, reinicio de fábrica y reinicio de parámetros sin mejora" : "Fuera de umbrales en Schaman";
      }

      const vel = (bTexto.match(/(\d+(?:[.,]\d+)?\s*(?:Mbps|Gbps))/i) || ["", "600Mbps"])[1];

      return [
        buildEncabezado(bTexto),
        `• Qué dice el cliente que le sucede: ${f[0] || "N/A"}`,
        `• Pruebas realizadas: ${f[1] || "N/A"}`,
        `• Diagnóstico: ${f[2] || "N/A"}`,
        `• Solución: ${f[3] || "N/A"}`,
        `Tecnología: ${tech}`,
        `Velocidad: ${vel}`,
        `Fecha: ${new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}`
      ].join("\n");
    };

    const bt = document.body.innerText;
    const iP = bt.indexOf("Internet principal");
    const iA = bt.indexOf("Internet adicional");
    const serviciosActivos = [
      { t: "Principal", texto: iP > -1 ? bt.slice(iP, iA > -1 ? iA : undefined) : "" },
      { t: "Adicional", texto: iA > -1 ? bt.slice(iA) : "" }
    ].filter(s => s.texto.trim());

    if (!serviciosActivos.length) return alert("⚠️ No se ha localizado información de Internet en la pantalla.");

    const panel = renderPanelLateral("AUTOMALOW PL", "Panel Directo Plano");

    // Construcción Dinámica por Bloques Planos del PL.json
    Object.keys(templatesCloud).forEach(grupo => {
      serviciosActivos.forEach(s => {
        const titGrupo = document.createElement("div");
        titGrupo.className = "tituloGrupoUnico";
        titGrupo.innerHTML = `<span><i class="fa-solid fa-folder-open"></i> ${grupo} (${s.t})</span> <i class="fa-solid fa-chevron-down" style="font-size:10px;"></i>`;
        
        const contGrupo = document.createElement("div");
        contGrupo.className = "contenidoGrupoUnico";

        Object.keys(templatesCloud[grupo]).forEach(clave => {
          const btn = document.createElement("button");
          btn.className = "btnMenuUnico";
          btn.innerHTML = `<i class="fa-solid fa-file-lines" style="color:#d9a6ff;"></i> ${clave}`;
          btn.onclick = () => {
            navigator.clipboard.writeText(compilarFormatoFront(s, grupo, clave));
            showToast(`Copiado: ${grupo} -> ${clave}`);
          };
          contGrupo.appendChild(btn);
        });

        panel.appendChild(titGrupo);
        panel.appendChild(contGrupo);
      });
    });

    const btnOcultar = document.createElement("button");
    btnOcultar.className = "btnCierreUnico";
    btnOcultar.textContent = "CERRAR ASISTENTE";
    btnOcultar.onclick = () => document.getElementById("contenedorMenuGlobalUnico").remove();
    panel.appendChild(btnOcultar);
  }

  // =========================================================================
  // ENTORNO ENABLER.ES (Automatización Jira)
  // =========================================================================
  else if (u.includes("enabler.es")) {
    const averiasCloud = await fetchCloudData("averias.json");
    if (!averiasCloud) return alert("❌ Error: No se pudo obtener el fichero de averías.");

    const dk = (e, k) => e?.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));
    const di = e => { if (!e) return; e.dispatchEvent(new Event("input", { bubbles: true })); e.dispatchEvent(new Event("change", { bubbles: true })); };
    const x = p => document.evaluate(p, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    const ff = d => {
      const m = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${String(d.getDate()).padStart(2, "0")}/${m[d.getMonth()]}/${String(d.getFullYear()).slice(2)} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    };
    const sl = d => { let s = d.getDay() === 5 ? 3 : d.getDay() === 6 ? 2 : 1; d.setDate(d.getDate() + s); return d; };

    async function ejecutarSeleccion(i, s, b = 80, e = 200) {
      if (!i) return;
      i.focus();
      const c = i.closest(".atlas-select__control") || i.parentElement;
      c.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      await new Promise(r => setTimeout(r, 150));
      if (s > 0) {
        for (let j = 0; j < s; j++) {
          dk(i, "ArrowDown");
          await new Promise(r => setTimeout(r, b));
        }
      } else {
        dk(i, "ArrowDown"); await new Promise(r => setTimeout(r, 50));
        dk(i, "ArrowUp"); await new Promise(r => setTimeout(r, 50));
      }
      dk(i, "Enter");
      await new Promise(r => setTimeout(r, e));
      i.blur();
    }

    const panel = renderPanelLateral("ROBOT INYECTOR JIRA", "Relleno Automatizado");

    const titJira = document.createElement("div");
    titJira.className = "tituloGrupoUnico abierto";
    titJira.innerHTML = `<span><i class="fa-solid fa-robot"></i> Averías Disponibles</span>`;
    
    const contJira = document.createElement("div");
    contJira.className = "contenidoGrupoUnico";
    contJira.style.setProperty("display", "block", "important");

    averiasCloud.forEach(t => {
      const btn = document.createElement("button");
      btn.className = "btnMenuUnico";
      btn.textContent = t.label;
      btn.onclick = async () => {
        document.getElementById("contenedorMenuGlobalUnico").remove();
        showToast("Rellenando campos de Jira...");
        
        try {
          const p = t.pasos;
          const sum = document.getElementById("summary");
          if (sum) { sum.value = t.label.replace(" - TÉCNICO DIRECTO", ""); di(sum); }

          await ejecutarSeleccion(document.querySelector("#react-select-customfield_16817-instance-input"), p.GRUPO || 0);
          await new Promise(r => setTimeout(r, 400));
          await ejecutarSeleccion(document.querySelector("#insight-atlas-select-16800 .atlas-select__input"), p.TIPO || 0);
          await new Promise(r => setTimeout(r, 400));
          await ejecutarSeleccion(document.querySelector("#insight-atlas-select-16801 .atlas-select__input"), p.SUBTIPO_L1 || 0);
          await new Promise(r => setTimeout(r, 500));

          const iL2 = document.querySelector("#insight-atlas-select-16802")?.querySelector("input");
          if (iL2) await ejecutarSeleccion(iL2, p.SUBTIPO_L2 || 0, 100, 300);

          const ic = x('//*[@id="customfield_16820"]'), is = x('//*[@id="customfield_16821"]');
          if (ic && is && ic.value && !is.value) { is.value = ic.value; di(is); }

          const h = new Date(), fdt = x('//*[@id="customfield_16825"]');
          if (fdt) { fdt.value = ff(h); di(fdt); }

          const fi = x('//*[@id="customfield_16823"]');
          if (fi) { const d = sl(new Date(h)); d.setHours(8, 0, 0, 0); fi.value = ff(d); di(fi); }

          const ff2 = x('//*[@id="customfield_16824"]');
          if (ff2) { const d = sl(new Date(h)); d.setHours(16, 0, 0, 0); ff2.value = ff(d); di(ff2); }

          const ok = x('//*[@id="customfield_16833"]');
          if (ok) { ok.value = "OK"; di(ok); }

          await new Promise(r => setTimeout(r, 800));
          const ex = document.querySelector('#cd-1 input[id^="react-select"]');
          if (ex) await ejecutarSeleccion(ex, p.EXTRA_CIERRE || 0, 100, 200);

          showToast("¡Formulario procesado! 🚀");
        } catch (err) {
          console.error(err);
          showToast("Error ejecutando la inyección de datos.");
        }
      };
      contJira.appendChild(btn);
    });

    panel.appendChild(titJira);
    panel.appendChild(contJira);

    const btnCerrar = document.createElement("button");
    btnCerrar.className = "btnCierreUnico";
    btnCerrar.textContent = "DETENER ROBOT";
    btnCerrar.onclick = () => document.getElementById("contenedorMenuGlobalUnico").remove();
    panel.appendChild(btnCerrar);
  } else {
    alert("⚠️ Este script debe ejecutarse únicamente en lowi.es o enabler.es");
  }
})();
