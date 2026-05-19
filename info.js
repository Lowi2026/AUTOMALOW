javascript:(async function(){
    const u = window.location.href;
    const REPO = 'https://cdn.jsdelivr.net/gh/Lowi2026/AUTOMALOW@main/';
    
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

    const injectStyles = () => {
        if(document.getElementById("g-styles")) return;
        const s = document.createElement("style");
        s.id = "g-styles";
        s.textContent = `
            .g-container { background: #1a0f1f; position: fixed; top: 100px; right: 20px; border-radius: 12px; box-shadow: 0 0 20px rgba(128,0,255,0.35); border: 1px solid #5a1e80; width: 280px; padding: 14px; z-index: 999999; font-family: Arial, sans-serif; text-align: left; max-height: 80vh; overflow-y: auto; cursor: move; }
            .g-container::-webkit-scrollbar { width: 6px; }
            .g-container::-webkit-scrollbar-track { background: #2a0f3a; border-radius: 10px; }
            .g-container::-webkit-scrollbar-thumb { background: #7b2cbf; border-radius: 10px; }
            
            .g-header { position: relative; text-align: center; margin-bottom: 4px; padding-bottom: 8px; }
            .g-title { font-weight: 600; font-size: 15px; color: #d9a6ff; margin: 0; letter-spacing: 0.5px; }
            .g-subtitle { font-size: 11px; color: #c9c9c9; margin: 0; margin-top: -6px; margin-bottom: 12px; }
            .g-close-x { position: absolute; top: 8px; right: 10px; color: #ff6b6b; font-size: 18px; cursor: pointer; }
            
            .g-root-block { margin-top: 8px; background: #2a0f3a; border-radius: 8px; border: 1px solid #5a1e80; overflow: hidden; }
            .g-root-trigger { padding: 10px; font-size: 12px; font-weight: bold; cursor: pointer; display: flex; justify-content: space-between; align-items: center; user-select: none; }
            .g-root-trigger:hover { background: #3a1450; }
            .g-root-trigger i.fa-chevron-down { transition: transform 0.2s; color: #dfa6ff; font-size: 10px; }
            .g-root-block.active .g-root-trigger i.fa-chevron-down { transform: rotate(180deg); }
            .g-root-content { display: none; padding: 5px 6px 8px 4px; margin-left: 4px; margin-top: 5px; margin-bottom: 8px; border-left: 2px solid #9d4edd; }
            .g-root-block.active .g-root-content { display: block; }
            
            .g-sub-accordion { }
            .g-sub-trigger { padding: 0 10px; font-size: 12px; font-weight: bold; cursor: pointer; display: flex; justify-content: space-between; align-items: center; user-select: none; height: 35px; }
            .g-sub-trigger i.fa-chevron-down { transition: transform 0.2s; color: #dfa6ff; font-size: 10px; }
            .g-sub-accordion.active .g-sub-trigger i.fa-chevron-down { transform: rotate(180deg); }
            .g-sub-content { display: none; padding: 5px 0 0 0; }
            .g-sub-accordion.active .g-sub-content { display: block; }
            
            .g-action-btn { background: #7b2cbf; color: #fff; border: none; padding: 8px; margin: 4px 0; border-radius: 8px; cursor: pointer; font-size: 11px; font-weight: bold; width: 100%; text-align: left; text-transform: uppercase; transition: background 0.15s; display: block; box-sizing: border-box; }
            .g-action-btn:last-child { margin-bottom: 0; }
            .g-action-btn:hover { background: #9d4edd; transform: translateY(-1px); }
            
            .g-cierre-asistente { width: 100%; padding: 8px; margin-top: 12px; border-radius: 8px; border: 1px solid #ff6b6b; color: #ff6b6b; background: transparent; cursor: pointer; font-size: 11px; font-weight: bold; text-align: center; }
            .g-cierre-asistente:hover { background: rgba(255,107,107,0.1); }

            .g-nt { position: fixed; top: 20px; right: 20px; background: #7b2cbf; padding: 12px 18px; border-radius: 8px; color: #fff; z-index: 1000001; animation: g-in 0.3s forwards; font-family: Arial, sans-serif; box-shadow: 0 4px 12px rgba(0,0,0,0.3); font-weight: bold; font-size: 13px; }
            @keyframes g-in { from { transform: translateX(100%); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
        `;
        document.head.appendChild(s);
    };

    const toast = (m) => {
        const n = document.createElement("div"); n.className = "g-nt"; n.innerHTML = `<i class="fa-solid fa-check-double"></i> | ${m}`;
        document.body.appendChild(n); setTimeout(() => n.remove(), 2500);
    };

    const copyTemplateFront = (titulo, f, servicio) => {
        const bloqueTexto = servicio.texto;
        let c = [...f]; 
        const tech = detectarTecnologiaScript1(bloqueTexto);

        if (c[1] === "DINAMICO_INCOMUNICADO") {
            if (tech === "HFC") {
                c[1] = "router con luces intermitentes, sin acceso remoto al cpe, se valida cableado sin daños";
                c[2] = "posible daño en acometida HFC";
            } else {
                const tieneOnt = detectarONT(bloqueTexto);
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

        const vel = (bloqueTexto.match(/(\d+(?:[.,]\d+)?\s*(?:Mbps|Gbps))/i) || ["", "600Mbps"])[1];

        const res = [
            `Nombre: ${getVal(["Nombre del cliente:", "Nombre:", "Cliente:", "Titular:"])}`,
            `DNI: ${getVal(["DNI/NIE/Pasaporte:", "DNI:", "DNI/NIE:", "Documento:"])}`,
            `ID: ${getVal(["AMDOCS ID:", "ID Cliente:", "ID:"])}`,
            `Dirección: ${extraerDireccion(bloqueTexto)}`,
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
        toast("Copiado ✔");
    };

    function makeDraggable(el) {
        var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        if (document.getElementById(el.id + "header")) {
            document.getElementById(el.id + "header").onmousedown = dragMouseDown;
        } else {
            el.onmousedown = dragMouseDown;
        }

        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            el.style.top = (el.offsetTop - pos2) + "px";
            el.style.left = (el.offsetLeft - pos1) + "px";
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    injectStyles();
    const plantillas = await loadData('PL.json');
    const averias = await loadData('averias.json');

    if (u.includes("lowi.es")) {
        if (!plantillas) return alert("❌ Error: PL.json");
        
        const bt = document.body.innerText;
        const iP = bt.indexOf("Internet principal");
        const iA = bt.indexOf("Internet adicional");
        const serviciosActivos = [
            { t: "Principal", texto: iP > -1 ? bt.slice(iP, iA > -1 ? iA : undefined) : "" },
            { t: "Adicional", texto: iA > -1 ? bt.slice(iA) : "" }
        ].filter(s => s.texto.trim());

        if (!serviciosActivos.length) return alert("⚠️ No Internet.");

        const ex = document.getElementById("g-ui-dragg"); if(ex) ex.remove();
        const container = document.createElement("div"); container.id = "g-ui-dragg"; container.className = "g-container";
        
        container.innerHTML = `
            <div class="g-header" id="g-ui-draggheader">
                <div class="g-close-x" id="g-close-btn"><i class="fa-solid fa-xmark"></i></div>
                <h3 class="g-title">Generador de Plantillas</h3>
                <p class="g-subtitle">Selecciona la tipificación que necesites</p>
            </div>
            <div id="g-root-box"></div>
            <button class="g-cierre-asistente" id="g-cierre-total">OCULTAR INTERFAZ</button>
        `;
        
        const rootBox = container.querySelector("#g-root-box");

        const categoriasRaiz = [
            { id: "internet", label: "Internet / WiFi", icon: "fa-wifi", matchKeywords: ["original", "incomunicado", "cortes", "lentitud", "contraseña", "bandas", "umbrales", "técnico", "masiva"] },
            { id: "tv", label: "TV", icon: "fa-tv", matchKeywords: ["mando", "error"] }
        ];

        categoriasRaiz.forEach(raiz => {
            serviciosActivos.forEach(s => {
                const rootBlock = document.createElement("div");
                rootBlock.className = "g-root-block";
                
                rootBlock.innerHTML = `
                    <div class="g-root-trigger">
                        <span><i class="fa-solid ${raiz.icon}" style="margin-right:8px; color:#dfa6ff;"></i> ${raiz.label} ${serviciosActivos.length > 1 ? `(${s.t})` : ''}</span>
                        <i class="fa-solid fa-chevron-down"></i>
                    </div>
                    <div class="g-root-content"></div>
                `;
                
                const rootContent = rootBlock.querySelector(".g-root-content");
                let tieneHijos = false;

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
                        
                        Object.keys(plantillas[grupo]).forEach(clave => {
                            const btn = document.createElement("button");
                            btn.className = "g-action-btn";
                            btn.textContent = clave;
                            btn.onclick = (e) => {
                                e.stopPropagation();
                                copyTemplateFront(`${grupo} -> ${clave}`, plantillas[grupo][clave], s);
                            };
                            subContent.appendChild(btn);
                        });

                        subAccordion.querySelector(".g-sub-trigger").onclick = (e) => {
                            e.stopPropagation();
                            const activeNow = subAccordion.classList.contains("active");
                            rootContent.querySelectorAll(".g-sub-accordion").forEach(el => el.classList.remove("active"));
                            if (!activeNow) subAccordion.classList.add("active");
                        };

                        rootContent.appendChild(subAccordion);
                    }
                });

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

        container.querySelector("#g-close-btn").onclick = () => container.remove();
        container.querySelector("#g-cierre-total").onclick = () => container.remove();
        document.body.appendChild(container);
        makeDraggable(container);
    }
    else if (u.includes("enabler.es")) {
        if (!averias) return alert("❌ Error: averias.json");
        
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

        const ex = document.getElementById("g-ui-dragg"); if(ex) ex.remove();
        const container = document.createElement("div"); container.id = "g-ui-dragg"; container.className = "g-container";
        
        container.innerHTML = `
            <div class="g-header" id="g-ui-draggheader">
                <div class="g-close-x" id="g-close-btn"><i class="fa-solid fa-xmark"></i></div>
                <h3 class="g-title">Robot Inyector Jira</h3>
                <p class="g-subtitle">Ejecución automática de campos</p>
            </div>
            <div id="g-root-box"></div>
            <button class="g-cierre-asistente" id="g-cierre-total">OCULTAR INTERFAZ</button>
        `;
        const rootBox = container.querySelector("#g-root-box");

        const rootBlock = document.createElement("div");
        rootBlock.className = "g-root-block active";
        rootBlock.innerHTML = `
            <div class="g-root-trigger">
                <span><i class="fa-solid fa-robot" style="margin-right:8px; color:#dfa6ff;"></i> Averías Automatizadas</span>
                <i class="fa-solid fa-chevron-down"></i>
            </div>
            <div class="g-root-content" style="display:block; padding-left:0; margin-left:0; border:none;"></div>
        `;
        const rootContent = rootBlock.querySelector(".g-root-content");

        averias.forEach(t => {
            const btn = document.createElement("button");
            btn.className = "g-action-btn";
            btn.textContent = t.label;
            btn.style.textTransform = "none";
            btn.onclick = async () => {
                container.remove();
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

                    toast("Jira Automatizado ✔");
                } catch (err) { toast("Error."); }
            };
            rootContent.appendChild(btn);
        });

        rootBox.appendChild(rootBlock);
        container.querySelector("#g-close-btn").onclick = () => container.remove();
        container.querySelector("#g-cierre-total").onclick = () => container.remove();
        document.body.appendChild(container);
        makeDraggable(container);
    } else {
        alert("⚠️ lowi.es / enabler.es");
    }
})();
