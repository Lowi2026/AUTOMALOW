javascript:(async function(){
    const u = window.location.href;
    const REPO = 'https://cdn.jsdelivr.net/gh/Lowi2026/AUTOMALOW@main/';
    
    /* 1. CARGA DE RECURSOS (ICONOS) */
    if (!document.querySelector('link[data-fa]')) {
        const fa = document.createElement("link");
        fa.rel = "stylesheet";
        fa.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css";
        fa.dataset.fa = "true";
        document.head.appendChild(fa);
    }

    const loadData = async (f) => {
        try {
            const r = await fetch(`${REPO}${f}?t=${Date.now()}`);
            return await r.json();
        } catch(e) { return null; }
    };

    /* 2. EXTRACCIÓN DINÁMICA DE TEXTOS WEB */
    const getVal = (keys) => {
        const body = document.body.innerText;
        for (let key of keys) {
            let index = body.toLowerCase().indexOf(key.toLowerCase());
            if (index > -1) {
                let result = body.slice(index + key.length).split("\n")[0].trim();
                return result.replace(/\(Modificar\)/gi, "").trim() || "N/A";
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

    const detectarTecnologiaScript1 = (bloqueTexto) => {
        const clean = bloqueTexto.toUpperCase();
        if (clean.includes("NEBAL")) return "NEBAL";
        if (clean.includes("NEBAF")) return "NEBAF";
        if (clean.includes("HFC")) return "HFC";
        if (clean.includes("FTTH")) return "FTTH";
        return "FTTH";
    };

    const detectarONT = (bloqueTexto) => {
        const clean = bloqueTexto.toUpperCase();
        if (clean.includes("ONT") && (clean.includes("ALARM") || clean.includes("LOS RED") || clean.includes("EXTERNA"))) {
            return true;
        }
        return false;
    };

    /* 3. UTILIDADES JIRA */
    const wait = t => new Promise(r => setTimeout(r, t));
    const fmt = d => {
        const m = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return `${String(d.getDate()).padStart(2, "0")}/${m[d.getMonth()]}/${String(d.getFullYear()).slice(2)} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    };
    const nextLab = d => {
        if (d.getDay() === 5) d.setDate(d.getDate() + 3);
        else if (d.getDay() === 6) d.setDate(d.getDate() + 2);
        else d.setDate(d.getDate() + 1);
        return d;
    };

    /* 4. INYECCIÓN DE ESTILOS EXACTOS A LA FOTO 2 */
    const injectStyles = () => {
        if(document.getElementById("g-styles")) return;
        const s = document.createElement("style");
        s.id = "g-styles";
        s.textContent = `
            .g-container { background: #130617; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); border-radius: 12px; box-shadow: 0 20px 50px rgba(0,0,0,0.9); border: 1px solid #2f0d3a; width: 370px; padding: 18px; z-index: 999999; font-family: 'Segoe UI', Arial, sans-serif; color: #fff; max-height: 85vh; overflow-y: auto; box-sizing: border-box; }
            .g-container::-webkit-scrollbar { width: 6px; }
            .g-container::-webkit-scrollbar-track { background: #130617; }
            .g-container::-webkit-scrollbar-thumb { background: #4f1564; border-radius: 10px; }
            
            .g-header { position: relative; text-align: center; margin-bottom: 15px; }
            .g-title { font-weight: 700; font-size: 16px; color: #f0c9ff; margin: 0; text-shadow: 0 0 8px rgba(240,201,255,0.3); }
            .g-subtitle { font-size: 11px; color: #b5b5b5; margin: 4px 0 0 0; }
            .g-close-x { position: absolute; top: -5px; right: 0; color: #ff5c5c; font-size: 18px; cursor: pointer; transition: 0.2s; }
            
            /* RAÍZ PRINCIPAL (Internet / TV) */
            .g-root-block { margin-bottom: 10px; border: 1px solid #4a155c; border-radius: 8px; overflow: hidden; background: #1d0924; }
            .g-root-trigger { padding: 12px; font-size: 14px; font-weight: 700; cursor: pointer; display: flex; justify-content: space-between; align-items: center; background: #280a33; user-select: none; }
            .g-root-trigger:hover { background: #350d44; }
            .g-root-trigger i.fa-chevron-down { transition: transform 0.2s; color: #dfa6ff; font-size: 12px; }
            .g-root-block.active .g-root-trigger i.fa-chevron-down { transform: rotate(180deg); }
            .g-root-content { display: none; padding: 8px; background: #130617; }
            .g-root-block.active .g-root-content { display: block; }
            
            /* SUB-ACORDEÓN (Averías internas) */
            .g-sub-accordion { margin-bottom: 6px; border: 1px solid #3d144c; border-radius: 6px; overflow: hidden; }
            .g-sub-trigger { background: #1d0924; padding: 8px 12px; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; justify-content: space-between; align-items: center; user-select: none; border-bottom: 1px solid transparent; }
            .g-sub-trigger:hover { background: #2b0d36; }
            .g-sub-trigger i.fa-chevron-down { transition: transform 0.2s; color: #fff; font-size: 11px; }
            .g-sub-accordion.active .g-sub-trigger { border-bottom-color: #3d144c; background: #2b0d36; }
            .g-sub-accordion.active .g-sub-trigger i.fa-chevron-down { transform: rotate(180deg); }
            .g-sub-content { display: none; background: #130617; padding: 8px 6px; }
            .g-sub-accordion.active .g-sub-content { display: block; }
            
            /* BOTONES DE ACCIÓN (Estilo Foto 2) */
            .g-action-btn { background: #601f7a; color: #fff; border: none; padding: 9px 12px; border-radius: 15px; cursor: pointer; font-size: 11px; font-weight: 600; width: 100%; text-align: center; margin-bottom: 6px; transition: background 0.15s; display: block; box-sizing: border-box; }
            .g-action-btn:last-child { margin-bottom: 0; }
            .g-action-btn:hover { background: #7c269e; }
            
            /* NOTIFICACIÓN TOAST */
            .g-nt { position: fixed; top: 20px; right: 20px; background: #21072e; border: 1px solid #b05cff; padding: 11px 22px; border-radius: 10px; color: #fff; z-index: 1000001; animation: g-in 0.25s forwards; font-family: sans-serif; box-shadow: 0 4px 12px rgba(0,0,0,0.6); font-weight: bold; font-size: 12px; }
            @keyframes g-in { from { transform: translateX(100%); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
        `;
        document.head.appendChild(s);
    };

    const toast = (m) => {
        const n = document.createElement("div"); n.className = "g-nt"; n.innerHTML = `<i class="fa-solid fa-check-double"></i> | ${m}`;
        document.body.appendChild(n); setTimeout(() => n.remove(), 2500);
    };

    /* 5. PROCESADOR DE REGLAS LOGICAS */
    const copyTemplateFront = (titulo, f, servicio) => {
        const bTexto = servicio.texto;
        let c = [...f]; 
        const tech = detectarTecnologiaScript1(bTexto);

        if (c[1] === "DINAMICO_INCOMUNICADO") {
            if (tech === "HFC") {
                c[1] = "router con luces intermitentes, sin acceso remoto al cpe, se valida cableado sin daños";
                c[2] = "posible daño en acometida HFC";
            } else {
                const tieneOnt = detectarONT(bTexto);
                c[1] = tieneOnt ? "ONT en rojo en alarm, sin acceso remoto, se valida el cableado no presenta daños y no hay acceso a cpe" : "router con ONT integrada sin sincronismo, se valida el cableado no presenta daños, conectado correctamente router";
                c[2] = tieneOnt ? "posible daño en tramo óptico" : "posible daño en fibra";
            }
        }

        if (c[1] === "DINAMICO_CORTES_RESUELTO") {
            c[1] = tech === "HFC" ? "Se revisa en thot hay cortes en los últimos 7 días se hace reinicio de fábrica, ajuste de cableado y separación de bandas, conexión a red de internet ya es estable no hay cortes" : "Se reviso en Schaman hay cortes, reinicio de fábrica, ajuste de cableado, señal estable en ambas bandas wifi";
        }
        if (c[1] === "DINAMICO_CORTES_TECNICO") {
            c[1] = tech === "HFC" ? "Se valido en Thot bastantes cortes, reinicio de fábrica sin mejora tras prueba de conexión" : "Cortes en Schaman, reinicio de fábrica sin mejora";
            c[2] = tech === "HFC" ? "Señal degradada tras saturación del cpe" : "Posible daño en cpe";
        }
        if (c[1] === "DINAMICO_CORTES_NV2") {
            c[1] = tech === "HFC" ? "Se valido en Thot cortes de poco tiempo persistentes, se aplico reinicio de fábrica, y se deja para validación de nivel 2" : "Cortes persistentes validados en Schaman, se hace pruebas con videos y en red pero sigue ocurriendo y sin mejora";
        }

        if (c[1] === "DINAMICO_FUERA_RESUELTO") {
            c[1] = tech === "HFC" ? "Se valida en THOT parámetros fuera de umbrales, se reinicia de fábrica, se reinician parámetros SNMP, flaps y QoS, separación de bandas, test correcto" : "Se revisa en Schaman parámetros fuera de umbrales, se hace reinicio de fábrica, separación de bandas, test correcto";
            c[3] = tech === "HFC" ? "Se reincia de fabrica, se reinician parámetros SNMP, se dividen bandas y se comprueba con cliente que el internet ya no tiene cortes ni lentitud ni parametros fuera de umbral" : "Se deja resuelto";
        }
        if (c[1] === "DINAMICO_FUERA_NO") {
            c[1] = tech === "HFC" ? "Fuera de umbrales en THOT, reinicio de fábrica y reinicio de parámetros sin mejora" : "Fuera de umbrales en Schaman";
        }

        const vel = (bTexto.match(/(\d+(?:[.,]\d+)?\s*(?:Mbps|Gbps))/i) || ["", "600Mbps"])[1];

        const res = [
            `Nombre: ${getVal(["Nombre del cliente:", "Nombre:", "Cliente:", "Titular:"])}`,
            `DNI: ${getVal(["DNI/NIE/Pasaporte:", "DNI:", "DNI/NIE:", "Documento:"])}`,
            `ID: ${getVal(["AMDOCS ID:", "ID Cliente:", "ID:"])}`,
            `Dirección: ${extraerDireccion(bTexto)}`,
            `Móvil: ${extraerMoviles()}`,
            `• Qué dice el cliente que le sucede: ${c[0] || "N/A"}`,
            `• Pruebas realizadas: ${c[1] || "N/A"}`,
            `• Diagnóstico: ${c[2] || "N/A"}`,
            `• Solución: ${c[3] || "N/A"}`,
            `Tecnología: ${tech}`,
            `Velocidad: ${vel}`,
            `Fecha: ${new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}`
        ].join("\n");

        navigator.clipboard.writeText(res);
        toast("Copiado en portapapeles");
    };

    /* INICIO DEL RENDERIZADO COMPATIBLE CON PL.JSON */
    injectStyles();
    const plantillas = await loadData('PL.json');
    const averias = await loadData('averias.json');

    if (u.includes("lowi.es")) {
        if (!plantillas) return alert("❌ Error: No se pudo mapear el archivo PL.json.");
        
        const bt = document.body.innerText;
        const iP = bt.indexOf("Internet principal");
        const iA = bt.indexOf("Internet adicional");
        const serviciosActivos = [
            { t: "Principal", texto: iP > -1 ? bt.slice(iP, iA > -1 ? iA : undefined) : "" },
            { t: "Adicional", texto: iA > -1 ? bt.slice(iA) : "" }
        ].filter(s => s.texto.trim());

        if (!serviciosActivos.length) return alert("⚠️ No se ha localizado información de Internet en pantalla.");

        const ex = document.getElementById("g-ui-accordion"); if(ex) ex.remove();
        const wrapper = document.createElement("div"); wrapper.id = "g-ui-accordion"; wrapper.className = "g-container";
        
        wrapper.innerHTML = `
            <div class="g-header">
                <div class="g-close-x" id="g-close-btn"><i class="fa-solid fa-xmark"></i></div>
                <h3 class="g-title">Generador de Plantillas</h3>
                <p class="g-subtitle">Selecciona la tipificación que necesites</p>
            </div>
            <div id="g-root-box"></div>
        `;
        
        const rootBox = wrapper.querySelector("#g-root-box");

        // PASO 1: SEPARACIÓN DE BLOQUES RAÍZ FIJOS (INTERNET VS TV) COMO EN LA FOTO 2
        const categoriasRaiz = [
            { id: "internet", label: "Internet / WiFi", icon: "fa-wifi", matchKeywords: ["original", "incomunicado", "cortes", "lentitud", "contraseña", "bandas", "umbrales", "técnico", "masiva"] },
            { id: "tv", label: "TV", icon: "fa-tv", matchKeywords: ["mando", "error"] }
        ];

        categoriasRaiz.forEach(raiz => {
            serviciosActivos.forEach(s => {
                const rootBlock = document.createElement("div");
                rootBlock.className = "g-root-block";
                
                // Título de la Raíz (Ej: Internet / WiFi (Principal))
                rootBlock.innerHTML = `
                    <div class="g-root-trigger">
                        <span><i class="fa-solid ${raiz.icon}" style="margin-right:8px; color:#dfa6ff;"></i> ${raiz.label} ${serviciosActivos.length > 1 ? `(${s.t})` : ''}</span>
                        <i class="fa-solid fa-chevron-down"></i>
                    </div>
                    <div class="g-root-content"></div>
                `;
                
                const rootContent = rootBlock.querySelector(".g-root-content");
                let tieneHijos = false;

                // PASO 2: CLASIFICACIÓN Y GENERACIÓN DE SUB-ACORDEONES DINÁMICOS
                Object.keys(plantillas).forEach(grupo => {
                    const grupoLimpio = grupo.toLowerCase();
                    const perteneceARaiz = raiz.matchKeywords.some(keyword => grupoLimpio.includes(keyword));

                    if (perteneceARaiz) {
                        tieneHijos = true;
                        const subAccordion = document.createElement("div");
                        subAccordion.className = "g-sub-accordion";
                        
                        subAccordion.innerHTML = `
                            <div class="g-sub-trigger">
                                <span>${grupo}</span>
                                <i class="fa-solid fa-chevron-down"></i>
                            </div>
                            <div class="g-sub-content"></div>
                        `;
                        
                        const subContent = subAccordion.querySelector(".g-sub-content");
                        
                        // PASO 3: INSERCIÓN DE BOTONES DE ACCIÓN INTERNOS CENTRADOS
                        Object.keys(plantillas[grupo]).forEach(clave => {
                            const btn = document.createElement("button");
                            btn.className = "g-action-btn";
                            btn.textContent = clave;
                            btn.onclick = (e) => {
                                e.stopPropagation(); // Evita interferencias con el contenedor colapsable
                                copyTemplateFront(`${grupo} -> ${clave}`, plantillas[grupo][clave], s);
                            };
                            subContent.appendChild(btn);
                        });

                        // Evento interactivo exclusivo para el Sub-Acordeón
                        subAccordion.querySelector(".g-sub-trigger").onclick = (e) => {
                            e.stopPropagation();
                            const activeNow = subAccordion.classList.contains("active");
                            rootContent.querySelectorAll(".g-sub-accordion").forEach(el => el.classList.remove("active"));
                            if (!activeNow) subAccordion.classList.add("active");
                        };

                        rootContent.appendChild(subAccordion);
                    }
                });

                // Evento interactivo exclusivo para la Raíz Superior
                rootBlock.querySelector(".g-root-trigger").onclick = () => {
                    const activeNow = rootBlock.classList.contains("active");
                    rootBox.querySelectorAll(".g-root-block").forEach(el => el.classList.remove("active"));
                    if (!activeNow) rootBlock.classList.add("active");
                };

                if (tieneHijos) {
                    rootBox.appendChild(rootBlock);
                }
            });
        });

        wrapper.querySelector("#g-close-btn").onclick = () => wrapper.remove();
        document.body.appendChild(wrapper);
    }
    // =========================================================================
    // ENTORNO ENABLER.ES (Inyector Jira unificado con el mismo diseño visual)
    // =========================================================================
    else if (u.includes("enabler.es")) {
        if (!averias) return alert("❌ Error: No se pudo obtener el archivo averias.json.");
        
        const dk = (e, k) => e?.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));
        const di = e => { if (!e) return; e.dispatchEvent(new Event("input", { bubbles: true })); e.dispatchEvent(new Event("change", { bubbles: true })); };
        const x = p => document.evaluate(p, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        
        async function ejecutarSeleccion(i, s, b = 80, e = 200) {
            if (!i) return; i.focus();
            const c = i.closest(".atlas-select__control") || i.parentElement;
            c.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
            await wait(150);
            if (s > 0) { for (let j = 0; j < s; j++) { dk(i, "ArrowDown"); await wait(b); } }
            else { dk(i, "ArrowDown"); await wait(50); dk(i, "ArrowUp"); await wait(50); }
            dk(i, "Enter"); await wait(e); i.blur();
        }

        const ex = document.getElementById("g-ui-accordion"); if(ex) ex.remove();
        const wrapper = document.createElement("div"); wrapper.id = "g-ui-accordion"; wrapper.className = "g-container";
        
        wrapper.innerHTML = `
            <div class="g-header">
                <div class="g-close-x" id="g-close-btn"><i class="fa-solid fa-xmark"></i></div>
                <h3 class="g-title">Robot Inyector Jira</h3>
                <p class="g-subtitle">Ejecución automática de campos</p>
            </div>
            <div id="g-root-box"></div>
        `;
        const rootBox = wrapper.querySelector("#g-root-box");

        const rootBlock = document.createElement("div");
        rootBlock.className = "g-root-block active";
        rootBlock.innerHTML = `
            <div class="g-root-trigger">
                <span><i class="fa-solid fa-robot" style="margin-right:8px; color:#dfa6ff;"></i> Averías Automatizadas</span>
                <i class="fa-solid fa-chevron-down"></i>
            </div>
            <div class="g-root-content" style="display:block; padding:10px;"></div>
        `;
        const rootContent = rootBlock.querySelector(".g-root-content");

        averias.forEach(t => {
            const btn = document.createElement("button");
            btn.className = "g-action-btn";
            btn.textContent = t.label;
            btn.onclick = async () => {
                wrapper.remove();
                toast("Procesando Jira...");
                try {
                    const p = t.pasos;
                    const sum = document.getElementById("summary");
                    if (sum) { sum.value = t.label.replace(" - TÉCNICO DIRECTO", ""); di(sum); }

                    await ejecutarSeleccion(document.querySelector("#react-select-customfield_16817-instance-input"), p.GRUPO || 0);
                    await wait(400);
                    await ejecutarSeleccion(document.querySelector("#insight-atlas-select-16800 .atlas-select__input"), p.TIPO || 0);
                    await wait(400);
                    await ejecutarSeleccion(document.querySelector("#insight-atlas-select-16801 .atlas-select__input"), p.SUBTIPO_L1 || 0);
                    await wait(500);

                    const iL2 = document.querySelector("#insight-atlas-select-16802")?.querySelector("input");
                    if (iL2) await ejecutarSeleccion(iL2, p.SUBTIPO_L2 || 0, 100, 300);

                    const ic = x('//*[@id="customfield_16820"]'), is = x('//*[@id="customfield_16821"]');
                    if (ic && is && ic.value && !is.value) { is.value = ic.value; di(is); }

                    const h = new Date(), fdt = x('//*[@id="customfield_16825"]');
                    if (fdt) { fdt.value = fmt(h); di(fdt); }

                    const fi = x('//*[@id="customfield_16823"]');
                    if (fi) { const d = nextLab(new Date(h)); d.setHours(8, 0, 0, 0); fi.value = fmt(d); di(fi); }

                    const ff2 = x('//*[@id="customfield_16824"]');
                    if (ff2) { const d = nextLab(new Date(h)); d.setHours(16, 0, 0, 0); ff2.value = fmt(d); di(ff2); }

                    const ok = x('//*[@id="customfield_16833"]');
                    if (ok) { ok.value = "OK"; di(ok); }

                    await wait(800);
                    const ex = document.querySelector('#cd-1 input[id^="react-select"]');
                    if (ex) await ejecutarSeleccion(ex, p.EXTRA_CIERRE || 0, 100, 200);

                    toast("¡Jira Automatizado! 🚀");
                } catch (err) { toast("Error en la inyección."); }
            };
            rootContent.appendChild(btn);
        });

        rootBox.appendChild(rootBlock);
        wrapper.querySelector("#g-close-btn").onclick = () => wrapper.remove();
        document.body.appendChild(wrapper);
    } else {
        alert("⚠️ Ejecutar únicamente en lowi.es o enabler.es");
    }
})();
