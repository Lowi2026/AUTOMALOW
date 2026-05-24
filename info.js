javascript:(async function(){
    const u = window.location.href;
    /* Usamos Githack para evitar bloqueos por Throttle de jsDelivr */
    const REPO = 'https://glcdn.githack.com/Lowi2026/AUTOMALOW/raw/main/';
    
    const respuestaAverias = await fetch(REPO + 'averias.json?v=' + Date.now());
    const averias = await respuestaAverias.json();
    
    const respuestaPlantillas = await fetch(REPO + 'PL.json?v=' + Date.now());
    const plantillas = await respuestaPlantillas.json();
    
    if (!document.querySelector('link[data-fa]')) {
        const fa = document.createElement("link");
        fa.rel = "stylesheet";
        fa.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css";
        fa.dataset.fa = "true";
        document.head.appendChild(fa);
    }

    const getVal = (keys) => {
        const body = document.body.innerText;
        for (let key of keys) {
            let index = body.toLowerCase().indexOf(key.toLowerCase());
            if (index > -1) {
                let result = body.slice(index + key.length).split("\n")[0].trim();
                result = result.replace(/\(Modificar\)/gi, "").trim();
                return result || "N/A";
            }
        }
        return "N/A";
    };

    const extraerDocumentoIdentidad = () => {
        let doc = getVal(["DNI/NIE/Pasaporte:", "DNI/NIE:", "DNI:", "NIE:", "Documento:", "Pasaporte:"]);
        if (doc === "N/A") {
            const txt = document.body.innerText;
            const regexDoc = /(?:^|\s|[^\w])([XYZ\d]\d{7}[A-Z])(?:$|\s|[^\w])/i;
            const match = txt.match(regexDoc);
            if (match) doc = match[1];
        }
        return doc !== "N/A" ? doc.toUpperCase().replace(/[\s-]/g, "") : "N/A";
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
        let s = ["Dirección de installation:", "Direccion:", "Dirección de instalación:"], e = ["Tipo de huella:", "Tarifa:", "Internet principal"];
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
        return "FTTH";
    };

    const detectarONT = (bloqueTexto) => {
        const clean = bloqueTexto.toUpperCase();
        return clean.includes("ONT") && (clean.includes("ALARM") || clean.includes("LOS RED") || clean.includes("EXTERNA"));
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
            .g-container { background: #180C20; position: fixed; top: 80px; right: 25px; border-radius: 16px; box-shadow: 0 10px 35px rgba(0,0,0,0.6); border: 1px solid #2D143D; width: 320px; padding: 16px; z-index: 999999; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-height: 85vh; overflow-y: auto; display: flex; flex-direction: column; box-sizing: border-box; }
            .g-container::-webkit-scrollbar { width: 5px; }
            .g-container::-webkit-scrollbar-track { background: transparent; }
            .g-container::-webkit-scrollbar-thumb { background: #441A5C; border-radius: 10px; }
            
            .g-header { position: relative; text-align: center; margin-bottom: 14px; user-select: none; cursor: move; }
            .g-title { font-weight: 700; font-size: 16px; color: #E3B3FF; margin: 0; }
            .g-subtitle { font-size: 11px; color: #A493B0; margin: 3px 0 0 0; }
            .g-close-x { position: absolute; top: -2px; right: 2px; color: #FF5A5A; font-size: 16px; cursor: pointer; transition: transform 0.15s; }
            .g-close-x:hover { transform: scale(1.1); }
            
            .g-root-block { margin-bottom: 8px; border-radius: 10px; border: 1px solid #3D1B54; background: #1F0F29; overflow: hidden; }
            .g-root-trigger { padding: 11px 14px; font-size: 13.5px; font-weight: 600; color: #FFF; cursor: pointer; display: flex; justify-content: space-between; align-items: center; user-select: none; }
            .g-root-trigger:hover { background: #281433; }
            .g-root-trigger i.fa-chevron-down { transition: transform 0.2s; color: #FFF; font-size: 11px; }
            .g-root-block.active { border-color: #4A1F66; }
            .g-root-block.active .g-root-trigger i.fa-chevron-down { transform: rotate(180deg); }
            
            .g-root-content { display: none; padding: 6px 10px 10px 10px; background: #160A1C; border-top: 1px solid #2B133B; position: relative; max-height: 340px; overflow-y: auto; }
            .g-root-content::before { content: ''; position: absolute; left: 14px; top: 12px; bottom: 12px; width: 2px; background: #441A5C; border-radius: 2px; }
            .g-root-block.active .g-root-content { display: block; }
            
            .g-sub-accordion { margin-bottom: 6px; margin-left: 12px; border-radius: 8px; border: 1px solid #36174A; background: #22102E; overflow: hidden; }
            .g-sub-accordion:last-child { margin-bottom: 0; }
            .g-sub-trigger { padding: 8px 12px; font-size: 12px; font-weight: 600; color: #E5D6ED; cursor: pointer; display: flex; justify-content: space-between; align-items: center; user-select: none; }
            .g-sub-trigger:hover { background: #2D153D; }
            .g-sub-trigger i.fa-chevron-down { transition: transform 0.2s; color: #B59EBF; font-size: 10px; }
            .g-sub-accordion.active { border-color: #532373; }
            .g-sub-accordion.active .g-sub-trigger i.fa-chevron-down { transform: rotate(180deg); }
            
            .g-sub-content { display: none; padding: 8px 10px; background: #1A0C24; border-top: 1px solid #2C133D; }
            .g-sub-accordion.active .g-sub-content { display: block; }
            
            .g-action-btn { background: #7A22B4; color: #FFF; border: none; padding: 7px 14px; margin-bottom: 6px; border-radius: 20px; cursor: pointer; font-size: 11.5px; font-weight: 600; width: 100%; text-align: center; transition: background 0.15s, transform 0.1s; box-sizing: border-box; }
            .g-action-btn:last-child { margin-bottom: 0; }
            .g-action-btn:hover { background: #912FD4; }
            .g-action-btn:active { transform: scale(0.98); }
            
            .g-footer-buttons { display: flex; gap: 8px; margin-top: 8px; width: 100%; box-sizing: border-box; }
            .g-cierre-asistente { flex: 1; padding: 10px; border-radius: 8px; border: none; color: #160A1C; background: #E2D5EA; cursor: pointer; font-size: 11px; font-weight: 700; text-align: center; letter-spacing: 0.5px; text-transform: uppercase; transition: background 0.15s; }
            .g-cierre-asistente:hover { background: #FFF; }

            .g-nt { position: fixed; top: 20px; right: 20px; background: #7A22B4; padding: 11px 18px; border-radius: 8px; color: #FFF; z-index: 1000001; animation: g-in 0.25s forwards; font-size: 12px; font-weight: bold; box-shadow: 0 5px 15px rgba(0,0,0,0.4); display: flex; align-items: center; gap: 8px; }
            @keyframes g-in { from { transform: translateX(100%); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
        `;
        document.head.appendChild(s);
    };

    const toast = (m) => {
        const old = document.querySelector(".g-nt");
        if (old) old.remove();
        const n = document.createElement("div"); n.className = "g-nt"; n.innerHTML = `<i class="fa-solid fa-check"></i> | ${m}`;
        document.body.appendChild(n); setTimeout(() => n.remove(), 2000);
    };

    const copyTemplateFront = (grupo, clave, servicio) => {
        const bloqueTexto = servicio ? servicio.texto : document.body.innerText;
        let c = ["", "", "", ""]; 
        const tech = detectarTecnologiaScript1(bloqueTexto);

        if (plantillas && plantillas[grupo] && plantillas[grupo][clave]) {
            c = [...plantillas[grupo][clave]];
        }
        
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
            c[1] = tech === "HFC" ? "Se revisa en thot hay cortes en los últimos 7 días se hace reinicio de fábrica, ajuste de cableado y separación de bandas, conexión a red de internet ya es stable no hay cortes" : "Se reviso en Schaman hay cortes, reinicio de fábrica, ajuste de cableado, señal stable en ambas bandas wifi";
        }
        if (c[1] === "DINAMICO_CORTES_TECNICO") {
            c[1] = tech === "HFC" ? "Se valido en Thot bastantes cortes, reinicio de fábrica sin mejora tras prueba de conexión" : "Cortes en Schaman, reinicio de fábrica sin mejora";
            c[2] = tech === "HFC" ? "Señal degradada tras saturación del cpe" : "Posible daño en cpe";
        }
        if (c[1] === "DINAMICO_CORTES_NV2") {
            c[1] = tech === "HFC" ? "Se valido en Thot cortes de poco tiempo persistententes, se aplico reinicio de fábrica, y se deja para validación de nivel 2" : "Cortes persistentes validados en Schaman, se hace pruebas con videos y en red pero sigue ocurriendo y sin mejora";
        }
        if (c[1] === "DINAMICO_FUERA_RESUELTO") {
            c[1] = tech === "HFC" ? "Se valida en THOT parámetros fuera de umbrales, se reinicia de fábrica, se reinician parámetros SNMP, flaps y QoS, separación de bandas, test correcto" : "Se revisa en Schaman parámetros fuera de umbrales, se hace reinicio de fábrica, separación de bandas, test correcto";
            c[3] = tech === "HFC" ? "Se reincia de fabrica, se reinician parámetros SNMP, se dividen bandas y se comprueba con cliente que el internet ya no tiene cortes ni lentitud ni parametros fuera de umbral" : "Se deja resuelto";
        }
        if (c[1] === "DINAMICO_FUERA_NO") {
            c[1] = tech === "HFC" ? "Fuera de umbrales en THOT, reinicio de fábrica y reinicio de parámetros sin mejora" : "Fuera de umbrales en Schaman";
        }
        if (c[3] === "DINAMICO_FUERA_RESUELTO_SOL") {
            c[3] = tech === "HFC" ? "Se reinicia de fábrica, se reinician parámetros SNMP, se dividen bandas y se comprueba con cliente que el internet ya no tiene cortes ni lentitud ni parámetros fuera de umbral" : "Se realiza reinicio de fábrica, se dividen bandas y se comprueba con cliente que el internet ya no presenta anomalías estructurales";
        }

        const vel = (bloqueTexto.match(/(\d+(?:[.,]\d+)?\s*(?:Mbps|Gbps))/i) || ["", "600Mbps"])[1];

        const res = [
            `Nombre: ${getVal(["Nombre del cliente:", "Nombre:", "Cliente:", "Titular:"])}`,
            `DNI/NIE: ${extraerDocumentoIdentidad()}`,
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
        toast("Copiado con éxito");
    };

    function makeDraggable(el, handleId) {
        var p1 = 0, p2 = 0, p3 = 0, p4 = 0;
        const handle = document.getElementById(handleId);
        if (handle) { handle.onmousedown = dragMouseDown; } else { el.onmousedown = dragMouseDown; }

        function dragMouseDown(e) {
            if(e.target.closest('button') || e.target.closest('.g-close-x') || e.target.closest('.g-root-trigger') || e.target.closest('.g-sub-trigger')) return;
            e = e || window.event; e.preventDefault();
            p3 = e.clientX; p4 = e.clientY;
            document.onmouseup = closeDragElement; document.onmousemove = elementDrag;
        }
        function elementDrag(e) {
            e = e || window.event; e.preventDefault();
            p1 = p3 - e.clientX; p2 = p4 - e.clientY;
            p3 = e.clientX; p4 = e.clientY;
            el.style.top = (el.offsetTop - p2) + "px"; el.style.left = (el.offsetLeft - p1) + "px";
        }
        function closeDragElement() { document.onmouseup = null; document.onmousemove = null; }
    }

    injectStyles();
    if (u.includes("lowi.es")) {
        const bt = document.body.innerText;
        const iP = bt.indexOf("Internet principal");
        const iA = bt.indexOf("Internet adicional");
        const serviciosActivos = [
            { t: "Principal", texto: iP > -1 ? bt.slice(iP, iA > -1 ? iA : undefined) : "" },
            { t: "Adicional", texto: iA > -1 ? bt.slice(iA) : "" }
        ].filter(s => s.texto.trim());

        if (!serviciosActivos.length) return alert("⚠️ No se localizó información del servicio de Internet.");

        const ex = document.getElementById("g-ui-dragg"); if(ex) ex.remove();
        const container = document.createElement("div"); container.id = "g-ui-dragg"; container.className = "g-container";
        
        container.innerHTML = `
            <div class="g-header" id="g-drag-handle">
                <div class="g-close-x" id="g-close-btn"><i class="fa-solid fa-xmark"></i></div>
                <h3 class="g-title">Generador de Plantillas</h3>
                <p class="g-subtitle">Selecciona la tipificación que necesites</p>
            </div>
            <div id="g-root-box"></div>
            <div class="g-footer-buttons">
                <button class="g-cierre-asistente" id="g-cierre-total">Ocultar Interfaz</button>
            </div>
        `;
        
        const rootBox = container.querySelector("#g-root-box");

        if (plantillas) {
            /* Localizar la clave exacta de TV en el JSON de forma insensible a mayúsculas/minúsculas */
            const claveTvExacta = Object.keys(plantillas).find(k => k.toUpperCase() === "TV");

            /* 1. SECCIÓN DE INTERNET / WIFI (DINÁMICA POR SERVICIO ACTIVO) */
            serviciosActivos.forEach(s => {
                const rootBlock = document.createElement("div");
                rootBlock.className = "g-root-block active"; 
                
                rootBlock.innerHTML = `
                    <div class="g-root-trigger">
                        <span><i class="fa-solid fa-wifi" style="margin-right:8px; color:#E3B3FF;"></i> Internet / WiFi ${serviciosActivos.length > 1 ? `(${s.t})` : ''}</span>
                        <i class="fa-solid fa-chevron-down"></i>
                    </div>
                    <div class="g-root-content" style="display:block;"></div>
                `;
                
                const rootContent = rootBlock.querySelector(".g-root-content");

                /* Cargamos todas las categorías EXCEPTUANDO la de "TV/Tv" en el bloque de internet */
                Object.keys(plantillas).forEach(grupo => {
                    if (grupo.toUpperCase() === "TV") return; 

                    const subAccordion = document.createElement("div");
                    subAccordion.className = "g-sub-accordion";
                    subAccordion.innerHTML = `
                        <div class="g-sub-trigger"><span>${grupo}</span><i class="fa-solid fa-chevron-down"></i></div>
                        <div class="g-sub-content"></div>
                    `;
                    const subContent = subAccordion.querySelector(".g-sub-content");
                    
                    Object.keys(plantillas[grupo]).forEach(clave => {
                        const btn = document.createElement("button");
                        btn.className = "g-action-btn";
                        btn.textContent = clave;
                        btn.onclick = (e) => { e.stopPropagation(); copyTemplateFront(grupo, clave, s); };
                        subContent.appendChild(btn);
                    });

                    subAccordion.querySelector(".g-sub-trigger").onclick = (e) => {
                        e.stopPropagation();
                        const activeNow = subAccordion.classList.contains("active");
                        rootContent.querySelectorAll(".g-sub-accordion").forEach(el => el.classList.remove("active"));
                        if (!activeNow) subAccordion.classList.add("active");
                    };
                    rootContent.appendChild(subAccordion);
                });

                rootBlock.querySelector(".g-root-trigger").onclick = () => {
                    const activeNow = rootBlock.classList.contains("active");
                    rootBlock.classList.toggle("active", !activeNow);
                    rootContent.style.display = activeNow ? "none" : "block";
                };

                rootBox.appendChild(rootBlock);
            });

            /* 2. SECCIÓN DE TV INDEPENDIENTE (A PRUEBA DE MAYÚSCULAS/MINÚSCULAS) */
            if (claveTvExacta) {
                const tvBlock = document.createElement("div");
                tvBlock.className = "g-root-block"; // Inicia cerrado
                
                tvBlock.innerHTML = `
                    <div class="g-root-trigger">
                        <span><i class="fa-solid fa-tv" style="margin-right:8px; color:#E3B3FF;"></i> TV</span>
                        <i class="fa-solid fa-chevron-down"></i>
                    </div>
                    <div class="g-root-content" style="display:none; padding: 10px 14px;"></div>
                `;
                
                const tvContent = tvBlock.querySelector(".g-root-content");

                /* Renderizamos los botones leyendo la clave exacta encontrada en el JSON */
                Object.keys(plantillas[claveTvExacta]).forEach(clave => {
                    const btn = document.createElement("button");
                    btn.className = "g-action-btn";
                    btn.textContent = clave;
                    btn.onclick = (e) => { e.stopPropagation(); copyTemplateFront(claveTvExacta, clave, null); };
                    tvContent.appendChild(btn);
                });

                tvBlock.querySelector(".g-root-trigger").onclick = () => {
                    const activeNow = tvBlock.classList.contains("active");
                    tvBlock.classList.toggle("active", !activeNow);
                    tvContent.style.display = activeNow ? "none" : "block";
                };

                rootBox.appendChild(tvBlock);
            }
        }

        container.querySelector("#g-close-btn").onclick = () => container.remove();
        container.querySelector("#g-cierre-total").onclick = () => container.remove();
        document.body.appendChild(container);
        makeDraggable(container, "g-drag-handle");
    }
    else if (u.includes("enabler.es")) {
        /* (Inyector Jira - Intacto) */
        if (!averias) return alert("❌ Error: No se pudo mapear el archivo averias.json.");
        const ex = document.getElementById("g-ui-dragg"); if(ex) ex.remove();
        const container = document.createElement("div"); container.id = "g-ui-dragg"; container.className = "g-container";
        container.innerHTML = `<div class="g-header" id="g-drag-handle"><h3 class="g-title">Robot Inyector Jira</h3></div><div id="g-root-box"></div>`;
        const rootBox = container.querySelector("#g-root-box");
        const rootBlock = document.createElement("div"); rootBlock.className = "g-root-block active";
        rootBlock.innerHTML = `<div class="g-root-trigger"><span><i class="fa-solid fa-robot"></i> Averías</span></div><div class="g-root-content" style="display:block;"></div>`;
        const rootContent = rootBlock.querySelector(".g-root-content");
        averias.forEach(t => {
            const btn = document.createElement("button"); btn.className = "g-action-btn"; btn.textContent = t.label;
            rootContent.appendChild(btn);
        });
        rootBox.appendChild(rootBlock); document.body.appendChild(container);
    } else {
        alert("⚠️ Ejecutar únicamente en lowi.es o enabler.es");
    }
})();
