(() => {
    /* ========================================================================= */
    /* ================= 1. INYECTAR FONT AWESOME Y CONFIGS ==================== */
    /* ========================================================================= */
    if (!document.querySelector('link[data-fa]')) {
        const fa = document.createElement("link");
        fa.rel = "stylesheet";
        fa.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css";
        fa.dataset.fa = "true";
        document.head.appendChild(fa);
    }

    const REPO = 'https://cdn.jsdelivr.net/gh/Lowi2026/AUTOMALOW@main/';
    const urlAct = window.location.href;

    /* ========================================================================= */
    /* ================= 2. UTILIDADES COMUNES JIRA (MOTOR) ==================== */
    /* ========================================================================= */
    const xp = x => document.evaluate(x, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    const wait = t => new Promise(r => setTimeout(r, t));
    const di = e => { if (!e) return; e.dispatchEvent(new Event("input", { bubbles: true })); e.dispatchEvent(new Event("change", { bubbles: true })); };
    
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

    async function selectRS(input, pasos = 0) {
        if (!input) return;
        input.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
        await wait(350); 
        input.value = " "; 
        input.dispatchEvent(new Event("input", { bubbles: true }));
        await wait(200); 
        input.dispatchEvent(new KeyboardEvent("keydown", { key: "Backspace", bubbles: true }));
        await wait(250);
        for (let i = 0; i < pasos; i++) {
            input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
            await wait(150);
        }
        input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
        await wait(400);
    }

    async function rellenarCamposComunesYFechas() {
        const now = new Date();
        const fdt = xp('//*[@id="customfield_16825"]'); if (fdt) fdt.value = fmt(now);
        
        const startDate = nextLab(new Date(now)); startDate.setHours(8, 0, 0, 0);
        const fi = xp('//*[@id="customfield_16823"]'); if (fi) fi.value = fmt(startDate);
        
        const endDate = new Date(startDate); endDate.setHours(16, 0, 0, 0);
        const ff2 = xp('//*[@id="customfield_16824"]'); if (ff2) ff2.value = fmt(endDate);
        
        const ok = xp('//*[@id="customfield_16833"]'); if (ok) { ok.value = "OK"; di(ok); }

        const tp = document.getElementById("customfield_16820");
        const ta = document.getElementById("customfield_16821");
        if (tp && ta && tp.value) { ta.value = tp.value; di(ta); }
    }

    /* ========================================================================= */
    /* ============ 3. FUNCIONES DE EXTRACCIÓN TUYAS ORIGINALES ================ */
    /* ========================================================================= */
    function getVal(etiquetas) {
        const todoElTexto = document.body.innerText || "";
        for (const etiqueta of etiquetas) {
            if (todoElTexto.includes(etiqueta)) {
                const partes = todoElTexto.split(etiqueta);
                if (partes.length > 1) {
                    return partes[1].split("\n")[0].trim().replace(/^[:\s-]+/, "");
                }
            }
        }
        return "N/A";
    }

    const extraerDocumentoIdentidad = () => {
        let doc = getVal(["DNI/NIE/Pasaporte:", "DNI/NIE:", "DNI:", "NIE:", "Documento:", "Pasaporte:"]);
        if (doc === "N/A") {
            const txt = document.body.innerText;
            const match = txt.match(/(?:^|\s|[^\w])([XYZ\d]\d{7}[A-Z])(?:$|\s|[^\w])/i);
            if (match) doc = match[1];
        }
        return doc !== "N/A" ? doc.toUpperCase().replace(/[\s-]/g, "") : "N/A";
    };

    const extraerMoviles = () => {
        const t = document.body.innerText, found = [], regex = /(?:^|\D)([67]\d{2}\s?\d{3}\s?\d{3})(?:\D|$)/g;
        let m; while ((m = regex.exec(t)) !== null) {
            let n = m[1].replace(/\s+/g, ''); if (!found.includes(n)) found.push(n);
        }
        return found.length ? found.join(" | ") : "N/A";
    };

    const extraerDireccion = (t) => {
        let s = ["Dirección de installation:", "Direccion:", "Dirección de instalación:"], e = ["Tipo de huella:", "Tarifa:", "Internet principal"];
        for (let x of s) {
            let i = t.indexOf(x); if (i > -1) {
                let r = t.slice(i + x.length);
                for (let y of e) { let p = r.indexOf(y); if (p > -1) r = r.slice(0, p); }
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

    const saveToHistory = (clienteNombre, dni, nombreGrupo, tipoClase, plantillaNombre) => {
        let currentLogs = JSON.parse(localStorage.getItem("g_automation_logs")) || [];
        currentLogs.unshift({
            timestamp: Date.now(), fechaStr: new Date().toISOString().split('T')[0], 
            horaStr: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
            cliente: clienteNombre, dni: dni, subCat: nombreGrupo || "General", clase: tipoClase || "fibra", plantilla: plantillaNombre
        });
        localStorage.setItem("g_automation_logs", JSON.stringify(currentLogs));
    };

    /* ========================================================================= */
    /* ========================== BLOQUE ENABLER.ES ============================ */
    /* ========================================================================= */
    if (urlAct.includes("enabler.es")) {
        (async function ejecutarEnabler() {
            const oldRoot = document.getElementById("g-automation-root");
            if (oldRoot) oldRoot.remove();

            let averias = null;
            try {
                averias = await fetch(`${REPO}averias.json?v=${Date.now()}`).then(r => r.ok ? r.json() : null);
            } catch (e) { console.error(e); }
            if (!averias) { alert("❌ Error: No se pudo mapear el archivo."); return; }

            const host = document.createElement("div"); host.id = "g-automation-root"; document.body.appendChild(host);
            const shadow = host.attachShadow({ mode: "open" });

            const style = document.createElement("style");
            style.textContent = `
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                :host { --bg-main: #130919; --bg-card: #1c0f24; --border-purple: rgba(185, 118, 247, 0.12); font-family: 'Inter', sans-serif; }
                * { box-sizing: border-box; margin: 0; padding: 0; }
                .widget-panel { position: fixed; z-index: 9999999; width: 340px; max-height: calc(100vh - 40px); top: 20px; right: 20px; background-color: var(--bg-main); border: 1px solid rgba(185, 118, 247, 0.2); border-radius: 20px; box-shadow: 0 24px 50px -12px rgba(0, 0, 0, 0.9); display: flex; flex-direction: column; overflow: hidden; color: #ffffff; }
                .header { padding: 20px 20px 10px 20px; display: flex; align-items: center; justify-content: space-between; cursor: move; }
                .header h2 { font-size: 16px; font-weight: 700; color: #ffffff; }
                .header p { font-size: 11px; color: #b976f7; opacity: 0.7; margin-top: 2px; }
                .close-btn { background: transparent; border: none; color: rgba(255, 255, 255, 0.4); cursor: pointer; font-size: 14px; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; }
                .close-btn:hover { color: #ffffff; }
                .body-container { flex: 1; overflow-y: auto; padding: 16px; }
                .accordion-item { background-color: var(--bg-card); border: 1px solid var(--border-purple); border-radius: 16px; padding: 12px; }
                .g-action-btn { background: #7A22B4; color: #FFF; border: none; padding: 10px 14px; margin-bottom: 8px; border-radius: 12px; cursor: pointer; font-size: 12px; font-weight: 600; width: 100%; display: flex; align-items: center; justify-content: space-between; }
                .g-action-btn:hover { background: #912FD4; }
                .g-jira-btn-container { display: flex; gap: 8px; margin-top: 8px; }
                .g-copy-tt-btn { flex: 1; background: #5c188c; border: none; padding: 10px; color: white; font-size: 11px; font-weight: 700; border-radius: 8px; cursor: pointer; text-transform: uppercase; }
                .g-copy-tt-btn:hover { background: #7A22B4; }
                .footer { padding: 14px; border-top: 1px solid rgba(185, 118, 247, 0.12); }
                .hide-btn { width: 100%; padding: 10px; font-size: 12px; color: #ffffff; background: #1c0f24; border: 1px solid rgba(185, 118, 247, 0.2); cursor: pointer; border-radius: 8px; }
            `;
            shadow.appendChild(style);

            const toast = (m) => {
                const old = document.querySelector(".g-nt"); if (old) old.remove();
                const n = document.createElement("div");
                n.style = "position:fixed; top:20px; right:20px; background:#7A22B4; padding:11px 18px; border-radius:8px; color:#FFF; z-index:10000001; font-size:12px; font-weight:bold; box-shadow:0 5px 15px rgba(0,0,0,0.4);";
                n.className = "g-nt"; n.innerHTML = `✓ | ${m}`; document.body.appendChild(n);
                setTimeout(() => n.remove(), 2000);
            };

            const widget = document.createElement("div"); widget.className = "widget-panel";
            let averiasHTML = `<div style="display:flex; flex-direction:column; gap:4px;">`;
            averias.forEach((t, idx) => {
                averiasHTML += `<button class="g-action-btn" data-averia-idx="${idx}"><span>${t.label}</span><span>🤖</span></button>`;
            });
            averiasHTML += `</div>`;

            widget.innerHTML = `
                <div class="header" id="g-drag-handle">
                    <div><h2>Robot Inyector Jira</h2><p>enabler.es — Modo Index</p></div>
                    <button class="close-btn" id="g-close-panel">✕</button>
                </div>
                <div class="body-container" id="g-body-view">
                    <div class="accordion-item">${averiasHTML}</div>
                    <div class="g-jira-btn-container">
                        <button class="g-copy-tt-btn" id="g-copy-tt">📋 Copiar TT</button>
                    </div>
                </div>
                <div class="footer"><button class="hide-btn" id="g-toggle-visibility">👁️‍🗨️ Ocultar Interfaz</button></div>
            `;
            shadow.appendChild(widget);

            shadow.querySelectorAll(".g-action-btn").forEach(btn => {
                btn.onclick = async () => {
                    const targetAveria = averias[btn.getAttribute("data-averia-idx")];
                    if(!targetAveria) return;
                    host.remove(); 
                    toast("Inyectando mediante secuencia numérica...");

                    try {
                        const p = targetAveria.pasos;
                        const sum = document.getElementById("summary");
                        if (sum) { sum.value = targetAveria.label; di(sum); }

                        await selectRS(document.querySelector("[id^='react-select-customfield_16817'] input"), p.GRUPO);
                        await selectRS(document.querySelector("#insight-atlas-select-16800 input"), p.TIPO);
                        await selectRS(document.querySelector("#insight-atlas-select-16801 input"), p.SUBTIPO_L1);
                        await selectRS(document.querySelector("#insight-atlas-select-16802 input"), p.SUBTIPO_L2);
                        await selectRS(document.querySelector('#cd-1 input[id^="react-select"]'), p.EXTRA_CIERRE);

                        await rellenarCamposComunesYFechas();
                        toast("Completado con éxito ✔");
                    } catch (err) { console.error(err); toast("Error en inyección."); }
                };
            });

            shadow.getElementById("g-copy-tt").onclick = () => {
                const el = document.querySelector(".aui-nav-breadcrumbs li:last-child");
                if (!el) return alert("No se encontró el código TT en la vista actual.");
                const tt = el.textContent.trim();
                navigator.clipboard.writeText(tt).then(() => toast("TT Copiado con éxito: " + tt));
            };

            shadow.getElementById("g-close-panel").onclick = () => host.remove();
            
            let isHidden = false;
            const bodyV = shadow.getElementById("g-body-view");
            const toggleV = shadow.getElementById("g-toggle-visibility");
            
            toggleV.onclick = () => {
                if (!isHidden) {
                    bodyV.style.display = "none";
                    widget.style.maxHeight = "75px";
                    toggleV.textContent = "👁️ Mostrar Interfaz";
                    isHidden = true;
                } else {
                    bodyV.style.display = "block";
                    widget.style.maxHeight = "calc(100vh - 40px)";
                    toggleV.textContent = "👁️‍🗨️ Ocultar Interfaz";
                    isHidden = false;
                }
            };

            let p1 = 0, p2 = 0, p3 = 0, p4 = 0;
            const handle = shadow.getElementById("g-drag-handle");
            handle.onmousedown = (e) => {
                if (e.target.closest('button') || e.target.closest('input')) return;
                e.preventDefault();
                p3 = e.clientX; p4 = e.clientY;
                document.onmouseup = () => { document.onmouseup = null; document.onmousemove = null; };
                document.onmousemove = (ev) => {
                    ev.preventDefault();
                    p1 = p3 - ev.clientX; p2 = p4 - ev.clientY;
                    p3 = ev.clientX; p4 = ev.clientY;
                    widget.style.top = (widget.offsetTop - p2) + "px";
                    widget.style.right = (window.innerWidth - widget.offsetLeft - widget.offsetWidth + p1) + "px";
                };
            };
        })();
        return; 
    }

    /* ========================================================================= */
    /* ================= NO ENABLER: FLUJO MAESTRO PRINCIPAL =================== */
    /* ========================================================================= */
    (async function ejecutarMaestroPrincipal() {
        const bt = document.body.innerText;
        const iP = bt.indexOf("Internet principal");
        const iA = bt.indexOf("Internet adicional");
        const serviciosActivos = [
            { t: "Principal", texto: iP > -1 ? bt.slice(iP, iA > -1 ? iA : undefined) : "" },
            { t: "Adicional", texto: iA > -1 ? bt.slice(iA) : "" }
        ].filter(s => s.texto.trim());

        if (!serviciosActivos.length) {
            alert("⚠️ No se localizó información del servicio de Internet en la pantalla de Lowi.");
            return;
        }

        window._cachedTemplates = {};
        let plantillasHTML = `<div>`;

        if (!window.supabase) {
            const sb = document.createElement("script");
            sb.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
            document.head.appendChild(sb);
            await new Promise(r => setTimeout(r, 1000));
        }

        const SUPABASE_URL = "https://gjchhoraaukfaumzcwnd.supabase.co"; 
        const SUPABASE_ANON_KEY = "sb_publishable_3AVUNcIiNxzTMAhDnvon1Q_GMBwjSW3";
        const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        const obtenerAgenteIdAutomatico = () => {
            try {
                const botonTicket = document.querySelector('a[href*="customfield_16881="]');
                if (botonTicket) {
                    const urlString = botonTicket.getAttribute('href');
                    const urlParams = new URLSearchParams(urlString.substring(urlString.indexOf('?')));
                    const emailAgente = urlParams.get('customfield_16881');
                    if (emailAgente) {
                        return emailAgente.split('@')[0].trim().replace(/\./g, '_');
                    }
                }
            } catch (e) { console.error("Error extrayendo ID:", e); }
            return "Agente_Local";
        };

        const AGENTE_ID_UNICO = obtenerAgenteIdAutomatico();

        const oldRoot = document.getElementById("g-automation-root");
        if (oldRoot) oldRoot.remove();

        let plantillas = null;
        try {
            plantillas = await fetch(`${REPO}PL.json?v=${Date.now()}`).then(r => r.ok ? r.json() : null);
        } catch (e) { console.error("Error cargando PL.json:", e); }

        const host = document.createElement("div"); 
        host.id = "g-automation-root"; 
        document.body.appendChild(host);
        const shadow = host.attachShadow({ mode: "open" });

        const shadowLink = document.createElement("link");
        shadowLink.rel = "stylesheet";
        shadowLink.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css";
        shadow.appendChild(shadowLink);

        const style = document.createElement("style");
        style.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            :host {
                --bg-main: #130919;
                --bg-card: #1c0f24;
                --bg-row: #23142d;
                --border-purple: rgba(185, 118, 247, 0.12);
                --purple-electric: #7a22b4;
                font-family: 'Inter', sans-serif;
            }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            .widget-panel { position: fixed; z-index: 9999999; width: 340px; max-height: calc(100vh - 40px); top: 20px; right: 20px; background-color: var(--bg-main); border: 1px solid rgba(185, 118, 247, 0.2); border-radius: 20px; box-shadow: 0 24px 50px -12px rgba(0, 0, 0, 0.9); display: flex; flex-direction: column; overflow: hidden; color: #ffffff; }
            .header { padding: 20px 20px 10px 20px; background: #130919; display: flex; align-items: center; justify-content: space-between; cursor: move; }
            .header h2 { font-size: 16px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px; }
            .header p { font-size: 11px; color: #b976f7; opacity: 0.7; margin-top: 2px; font-weight: 500; }
            .close-btn { background: transparent; border: none; color: rgba(255, 255, 255, 0.4); cursor: pointer; font-size: 14px; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; }
            .close-btn:hover { color: #ffffff; }
            
            .tabs-container { display: flex; border-bottom: 1px solid rgba(185, 118, 247, 0.15); background: #130919; }
            .tab-button { flex: 1; padding: 12px; background: transparent; border: none; color: rgba(255, 255, 255, 0.4); font-size: 13px; font-weight: 600; cursor: pointer; text-align: center; position: relative; transition: all 0.2s ease; }
            .tab-button:hover { color: rgba(255,255,255,0.8); }
            .tab-button.active { color: #ffffff; }
            .tab-button.active::after { content: ''; position: absolute; bottom: -1px; left: 0; width: 100%; height: 2px; background: #b976f7; box-shadow: 0 -4px 10px #b976f7; }
            
            .body-container { flex: 1; overflow-y: auto; padding: 16px; position: relative; }
            .body-container::-webkit-scrollbar { width: 6px; }
            .body-container::-webkit-scrollbar-track { background: transparent; }
            .body-container::-webkit-scrollbar-thumb { background: #7a22b4; border-radius: 10px; }
            
            .tab-view { display: none; }
            .tab-view.active { display: block; }
            
            .accordion-item { background-color: var(--bg-card); border: 1px solid var(--border-purple); border-radius: 16px; margin-bottom: 12px; overflow: hidden; }
            .accordion-trigger { width: 100%; padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; background: transparent; border: none; color: #ffffff; font-size: 14px; font-weight: 600; cursor: pointer; text-align: left; }
            .accordion-content { display: none; padding: 0 12px 12px 12px; }
            .accordion-content.open { display: block; }
            
            .icon-circle-main { width: 32px; height: 32px; background: rgba(122, 34, 180, 0.2); border: 1px solid rgba(185, 118, 247, 0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; color: #b976f7; flex-shrink: 0; font-size: 14px; }
            
            .sub-accordion { margin-top: 8px; border-radius: 12px; background: #1c0f24; border: 1px solid rgba(185, 118, 247, 0.08); overflow: hidden; }
            .group-label-trigger { width: 100%; padding: 14px 16px; font-size: 14px; font-weight: 600; color: #ffffff; background: transparent; border: none; cursor: pointer; display: flex; align-items: center; justify-content: space-between; }
            .sub-accordion-content { display: none; padding: 4px 10px 12px 10px; }
            .sub-accordion-content.open { display: block; }
            
            .sub-cat-circle { width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0; font-size: 12px; }
            .sub-cat-circle.fibra { color: #00d0ff !important; background: rgba(0, 150, 255, 0.15); border: 1px solid rgba(0, 150, 255, 0.3); }
            .sub-cat-circle.tv { color: #f59e0b !important; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); }
            .sub-cat-circle i { color: inherit !important; display: inline-block; }

            .template-row { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 16px; background: #23142d; border: 1px solid rgba(185, 118, 247, 0.1); border-radius: 12px; color: #ffffff; font-size: 13px; cursor: pointer; margin-bottom: 8px; text-align: left; transition: all 0.2s ease; font-weight: 500; }
            .template-row:hover { border-color: rgba(185, 118, 247, 0.4); background-color: rgba(185, 118, 247, 0.1); }
            .template-text { flex: 1; font-weight: 600; line-height: 1.4; word-break: break-word; }
            .copy-action-btn { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; color: #b976f7; padding: 4px 8px; background: transparent; border: none; flex-shrink: 0; text-transform: uppercase; }
            
            .template-row.copied-state { border: 1px solid #ffffff !important; box-shadow: 0 0 12px rgba(255, 255, 255, 0.2); }
            .template-row.copied-state .copy-action-btn { color: #10b981 !important; }
            
            .calendar-box { background: var(--bg-card); border: 1px solid var(--border-purple); border-radius: 14px; padding: 12px; margin-bottom: 14px; }
            .calendar-box label { font-size: 11px; text-transform: uppercase; color: #b976f7; letter-spacing: 0.5px; font-weight: 700; display: block; margin-bottom: 6px; }
            .filter-action-row { display: flex; align-items: center; gap: 8px; }
            .calendar-input { flex: 1; background: #130919; border: 1px solid rgba(185, 118, 247, 0.2); border-radius: 8px; padding: 8px 12px; color: #ffffff; font-size: 13px; outline: none; cursor: pointer; font-family: inherit; }
            .calendar-input::-webkit-calendar-picker-indicator { filter: invert(1); cursor: pointer; }
            
            .clear-btn { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #ef4444; cursor: pointer; }
            .clear-btn:hover { background: rgba(239, 68, 68, 0.2); color: #ff6b6b; }
            .clear-btn.confirming { background: #ef4444; color: #ffffff; width: auto; padding: 0 12px; font-size: 11px; font-weight: bold; }

            .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 14px; }
            .stat-card { background: rgba(28, 16, 38, 0.4); border: 1px solid rgba(185, 118, 247, 0.08); border-radius: 10px; padding: 10px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; }
            .stat-card.total-box { grid-column: span 2; background: linear-gradient(135deg, rgba(122, 34, 180, 0.2) 0%, rgba(28,16,38,0.4) 100%); border: 1px solid rgba(185, 118, 247, 0.2); padding: 14px; }
            .stat-card h4 { font-size: 11px; color: rgba(255,255,255,0.5); font-weight: 500; text-transform: uppercase; }
            .stat-card p { font-size: 18px; font-weight: 700; margin-top: 2px; }
            .stat-card.total-box p { color: #b976f7; font-size: 22px; }
            .stat-card.sub-stat p { font-weight: 700; }
            .stat-card.sub-stat p.val-fibra { color: #00f0ff; }
            .stat-card.sub-stat p.val-tv { color: #f59e0b; }
            
            .history-group-wrapper { background: var(--bg-card); border: 1px solid var(--border-purple); border-radius: 12px; overflow: hidden; margin-bottom: 8px; }
            .history-group-trigger { width: 100%; padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; background: transparent; border: none; color: #ffffff; font-size: 14px; font-weight: 600; cursor: pointer; text-align: left; }
            
            .history-dot { width: 8px; height: 8px; border-radius: 50%; margin-right: 10px; display: inline-block; }
            .history-dot.fibra { background-color: #00d0ff; box-shadow: 0 0 8px #00d0ff; }
            .history-dot.tv { background-color: #f59e0b; box-shadow: 0 0 8px #f59e0b; }
            
            .history-group-badge { background: #7a22b4; color: #ffffff; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 700; min-width: 22px; text-align: center; }
            .history-group-content { display: none; padding: 4px 12px 12px 12px; background: rgba(19, 9, 25, 0.2); border-top: 1px solid rgba(185, 118, 247, 0.05); }
            .history-group-content.open { display: block; }
            
            .log-item { background: var(--bg-row); padding: 12px; border-radius: 10px; font-size: 11px; display: flex; flex-direction: column; gap: 4px; margin-top: 8px; border-left: 3px solid #00d0ff; }
            .log-item.tv { border-left-color: #f59e0b; }
            .log-header { display: flex; justify-content: space-between; font-weight: 600; color: #ffffff; font-size: 12px; }
            .log-time { color: rgba(255,255,255,0.4); font-size: 10px; }
            .log-body { color: rgba(255,255,255,0.6); font-size: 11px; margin-top: 2px; }
            
            /* ========================================================================= */
            /* ========================== ESTILOS BAÚL ================================= */
            /* ========================================================================= */
            .vault-container { display: flex; flex-direction: column; gap: 12px; }
            .vault-input-box { background: var(--bg-card); border: 1px solid var(--border-purple); border-radius: 14px; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
            .vault-textarea { width: 100%; background: #130919; border: 1px solid rgba(185, 118, 247, 0.2); border-radius: 8px; padding: 10px; color: #ffffff; font-size: 12px; outline: none; resize: none; min-height: 60px; font-family: inherit; }
            .vault-textarea:focus { border-color: rgba(185, 118, 247, 0.5); }
            .vault-add-btn { background: #7A22B4; color: #FFF; border: none; padding: 8px 12px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 6px; transition: background 0.2s; }
            .vault-add-btn:hover { background: #912FD4; }
            .vault-list { display: flex; flex-direction: column; gap: 8px; margin-top: 4px; }
            .vault-item { background: var(--bg-row); border: 1px solid rgba(185, 118, 247, 0.08); border-radius: 12px; padding: 12px; display: flex; flex-direction: column; gap: 8px; position: relative; }
            .vault-text { font-size: 12px; color: rgba(255,255,255,0.85); line-height: 1.4; word-break: break-word; white-space: pre-wrap; }
            .vault-actions { display: flex; justify-content: flex-end; gap: 8px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 8px; }
            .vault-action-btn { background: transparent; border: none; font-size: 11px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px; padding: 4px 6px; border-radius: 4px; transition: all 0.2s; }
            .vault-btn-copy { color: #b976f7; }
            .vault-btn-copy:hover { background: rgba(185, 118, 247, 0.1); }
            .vault-btn-delete { color: #ef4444; }
            .vault-btn-delete:hover { background: rgba(239, 68, 68, 0.1); }
            .vault-btn-delete.confirming { background: #ef4444; color: #ffffff !important; padding: 4px 8px; border-radius: 6px; font-weight: bold; }

            .footer { padding: 14px; border-top: 1px solid rgba(185, 118, 247, 0.12); background: #130919; text-align: center; }
            .hide-btn { width: 100%; padding: 10px; font-size: 12px; color: #ffffff; background: #1c0f24; border: 1px solid rgba(185, 118, 247, 0.2); cursor: pointer; border-radius: 8px; font-weight: 600; }
        `;
        shadow.appendChild(style);

        const toast = (m) => {
            const old = document.querySelector(".g-nt"); if (old) old.remove();
            const n = document.createElement("div");
            n.style = "position:fixed; top:20px; right:20px; background:#7A22B4; padding:11px 18px; border-radius:8px; color:#FFF; z-index:10000001; font-size:12px; font-weight:bold; box-shadow:0 5px 15px rgba(0,0,0,0.4);";
            n.className = "g-nt"; n.innerHTML = `✓ | ${m}`; document.body.appendChild(n);
            setTimeout(() => n.remove(), 2000);
        };

        if (plantillas) {
            serviciosActivos.forEach((serv, sIdx) => {
                Object.keys(plantillas).forEach((categoria, catIdx) => {
                    const idUnicoBloque = `cat-${sIdx}-${catIdx}`;
                    const catLower = categoria.toLowerCase();
                    const esTv = catLower.includes("tv") || catLower.includes("tele");
                    const iconHeader = esTv ? `<i class="fa-solid fa-tv"></i>` : `<i class="fa-solid fa-wifi"></i>`;
                    
                    plantillasHTML += `
                        <div class="accordion-item">
                            <button class="accordion-trigger" data-trigger="${idUnicoBloque}">
                                <div style="display:flex; align-items:center;">
                                    <div class="icon-circle-main">${iconHeader}</div>
                                    <span style="font-weight:600; font-size:14px;">${categoria} ${serviciosActivos.length > 1 ? `(${serv.t})` : ''}</span>
                                </div>
                                <i class="fa-solid fa-chevron-down" style="font-size:11px;opacity:0.5;"></i>
                            </button>
                            <div class="accordion-content" id="${idUnicoBloque}">
                    `;

                    Object.keys(plantillas[categoria]).forEach((nombreGrupo, grpIdx) => {
                        const subId = `sub_${sIdx}_${catIdx}_${grpIdx}`;
                        const subCatClass = esTv ? "tv" : "fibra";
                        const subCatIcon = esTv ? `<i class="fa-solid fa-tv"></i>` : `<i class="fa-solid fa-bolt"></i>`;

                        plantillasHTML += `
                            <div class="sub-accordion">
                                <button class="group-label-trigger" data-subtrigger="${subId}">
                                    <div style="display:flex; align-items:center;">
                                        <div class="sub-cat-circle ${subCatClass}">${subCatIcon}</div>
                                        <span>${nombreGrupo}</span>
                                    </div>
                                    <i class="fa-solid fa-chevron-down" style="font-size:11px;opacity:0.4;"></i>
                                </button>
                                <div class="sub-accordion-content" id="${subId}">
                        `;

                        Object.keys(plantillas[categoria][nombreGrupo]).forEach(clavePlantilla => {
                            const uniqueId = `tmpl_${sIdx}_${catIdx}_${Math.random().toString(36).substr(2, 9)}`;
                            window._cachedTemplates[uniqueId] = { 
                                categoriaRaiz: categoria,
                                grupo: nombreGrupo, 
                                clave: clavePlantilla, 
                                servicio: serv,
                                clase: esTv ? "tv" : "fibra"
                            };

                            plantillasHTML += `
                                <button class="template-row" data-id="${uniqueId}">
                                    <span class="template-text">${clavePlantilla}</span>
                                    <span class="copy-action-btn"><i class="fa-regular fa-copy"></i> Copiar</span>
                                </button>
                            `;
                        });
                        plantillasHTML += `</div></div>`;
                    });
                    plantillasHTML += `</div></div>`;
                });
            });
        } else {
            plantillasHTML += `<p style="font-size:12px;opacity:0.5;text-align:center;">No se cargó el archivo PL.json</p>`;
        }
        plantillasHTML += `</div>`;

        const widget = document.createElement("div"); widget.className = "widget-panel";
        widget.innerHTML = `
            <div class="header" id="g-drag-handle">
                <div><h2>Generador de Plantillas</h2><p>lowi.es — Maestro Principal</p></div>
                <button class="close-btn" id="g-close-panel">✕</button>
            </div>
            <div class="tabs-container">
                <button class="tab-button active" id="tab-btn-pl">Plantillas</button>
                <button class="tab-button" id="tab-btn-hist">Historial</button>
                <button class="tab-button" id="tab-btn-vault">Baúl</button>
            </div>
            <div class="body-container" id="g-body-view">
                <div class="tab-view active" id="view-templates">${plantillasHTML}</div>
                
                <div class="tab-view" id="view-history">
                    <div class="calendar-box">
                        <label>Filtro y Limpieza</label>
                        <div class="filter-action-row">
                            <input type="date" class="calendar-input" id="hist-date-picker">
                            <button class="clear-btn" id="hist-clear-btn" title="Limpiar Historial"><i class="fa-solid fa-trash-can"></i></button>
                        </div>
                    </div>
                    <div class="stats-grid">
                        <div class="stat-card total-box"><h4>Total Copiadas</h4><p id="stat-total-count">0</p></div>
                        <div class="stat-card sub-stat"><h4>⚡ Fibra</h4><p class="val-fibra" id="stat-fibra-count">0</p></div>
                        <div class="stat-card sub-stat"><h4>📺 TV</h4><p class="val-tv" id="stat-tv-count">0</p></div>
                    </div>
                    <div class="log-list" id="hist-logs-container"></div>
                </div>

                <div class="tab-view" id="view-vault"></div>
            </div>
            <div class="footer"><button class="hide-btn" id="g-close-panel-b">👁 Ocultar Interfaz</button></div>
        `;
        shadow.appendChild(widget);

        // Estructura interna dinámica del baúl (Con input de título y variables de modo de guardado)
        const viewVaultContainer = shadow.getElementById("view-vault");
        if (viewVaultContainer) {
            viewVaultContainer.innerHTML = `
                <div class="vault-container">
                    <div class="vault-input-box">
                        <input type="text" id="vault-title-input" placeholder="Título de la nota (opcional)..." 
                            style="width: 100%; background: #130919; border: 1px solid rgba(185, 118, 247, 0.2); border-radius: 8px; padding: 8px 10px; color: #ffffff; font-size: 12px; outline: none; font-family: inherit; margin-bottom: 4px;">
                        <textarea class="vault-textarea" id="vault-input" placeholder="Escribe una nota rápida aquí..."></textarea>
                        <button class="vault-add-btn" id="vault-save-btn" data-mode="create" data-edit-id=""><i class="fa-solid fa-plus"></i> Guardar Nota</button>
                    </div>
                    <div class="vault-list" id="vault-items-container"></div>
                </div>
            `;
        }

        shadow.querySelectorAll(".accordion-trigger").forEach(t => {
            t.onclick = () => shadow.getElementById(t.getAttribute("data-trigger")).classList.toggle("open");
        });
        shadow.querySelectorAll(".group-label-trigger").forEach(t => {
            t.onclick = () => shadow.getElementById(t.getAttribute("data-subtrigger")).classList.toggle("open");
        });

        const tabPl = shadow.getElementById("tab-btn-pl"); 
        const tabHist = shadow.getElementById("tab-btn-hist");
        const tabVault = shadow.getElementById("tab-btn-vault");
        
        const viewPl = shadow.getElementById("view-templates"); 
        const viewHist = shadow.getElementById("view-history");
        const viewVault = shadow.getElementById("view-vault");

        const datePicker = shadow.getElementById("hist-date-picker"); datePicker.value = new Date().toISOString().split('T')[0];

        tabPl.onclick = () => { resetTabs(); tabPl.classList.add("active"); viewPl.classList.add("active"); };
        tabHist.onclick = () => { resetTabs(); tabHist.classList.add("active"); viewHist.classList.add("active"); renderHistorialSincronizado(); };
        tabVault.onclick = () => { resetTabs(); tabVault.classList.add("active"); viewVault.classList.add("active"); renderNotasBaul(); };
        
        datePicker.onchange = () => renderHistorialSincronizado();

        function resetTabs() {
            [tabPl, tabHist, tabVault].forEach(t => t.classList.remove("active"));
            [viewPl, viewHist, viewVault].forEach(v => v.classList.remove("active"));
        }

        const clearBtn = shadow.getElementById("hist-clear-btn");
        let isConfirmingClear = false;

        clearBtn.onclick = async () => {
            const fechaSeleccionada = datePicker.value;
            if (!isConfirmingClear) {
                isConfirmingClear = true;
                clearBtn.classList.add("confirming");
                clearBtn.innerHTML = "¿Borrar?";
                setTimeout(() => {
                    if (isConfirmingClear) {
                        isConfirmingClear = false;
                        clearBtn.classList.remove("confirming");
                        clearBtn.innerHTML = `<i class="fa-solid fa-trash-can"></i>`;
                    }
                }, 4000);
                return;
            }

            isConfirmingClear = false;
            clearBtn.classList.remove("confirming");
            clearBtn.innerHTML = `<i class="fa-solid fa-trash-can"></i>`;

            try {
                await supabaseClient
                    .from('logs_soporte')
                    .delete()
                    .eq('agente_id', AGENTE_ID_UNICO)
                    .eq('fecha_str', fechaSeleccionada);

                let localLogs = JSON.parse(localStorage.getItem("g_automation_logs")) || [];
                localLogs = localLogs.filter(l => l.fechaStr !== fechaSeleccionada);
                localStorage.setItem("g_automation_logs", JSON.stringify(localLogs));

                toast("Historial borrado con éxito");
                shadow.getElementById("stat-total-count").textContent = "0";
                shadow.getElementById("stat-fibra-count").textContent = "0";
                shadow.getElementById("stat-tv-count").textContent = "0";
                shadow.getElementById("hist-logs-container").innerHTML = `<p style="font-size:11px;text-align:center;opacity:0.4;padding:15px;">Historial vaciado.</p>`;
            } catch (err) { console.error(err); toast("Error al vaciar historial"); }
        };

        const renderHistorialSincronizado = async () => {
            const container = shadow.getElementById("hist-logs-container");
            container.innerHTML = `<p style="font-size:11px;text-align:center;opacity:0.5;padding:10px;">Sincronizando con la nube...</p>`;
            
            try {
                const { data: records, error } = await supabaseClient
                    .from('logs_soporte')
                    .select('*')
                    .eq('agente_id', AGENTE_ID_UNICO)
                    .eq('fecha_str', datePicker.value)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                
                let fibraCount = 0; let tvCount = 0;
                records.forEach(r => { if(r.clase === 'tv') tvCount++; else fibraCount++; });

                shadow.getElementById("stat-total-count").textContent = records.length;
                shadow.getElementById("stat-fibra-count").textContent = fibraCount;
                shadow.getElementById("stat-tv-count").textContent = tvCount;
                
                if (records.length === 0) {
                    container.innerHTML = `<p style="font-size:11px;text-align:center;opacity:0.4;padding:15px;">No hay registros para este día.</p>`;
                    return;
                }

                const grupos = {};
                records.forEach(item => {
                    if (!grupos[item.sub_cat]) grupos[item.sub_cat] = [];
                    grupos[item.sub_cat].push(item);
                });

                container.innerHTML = "";
                Object.keys(grupos).forEach((nombreGrupo, gIdx) => {
                    const wrapperId = `hist_grp_${gIdx}`;
                    const itemsEnGrupo = grupos[nombreGrupo];
                    const esGrupoTv = itemsEnGrupo[0]?.clase === 'tv';
                    const dotColorClass = esGrupoTv ? 'tv' : 'fibra';
                    
                    let wrapperHTML = `
                        <div class="history-group-wrapper">
                            <button class="history-group-trigger" data-target="${wrapperId}">
                                <div style="display:flex; align-items:center;">
                                    <span class="history-dot ${dotColorClass}"></span>
                                    <span>${nombreGrupo}</span>
                                </div>
                                <span class="history-group-badge">${itemsEnGrupo.length}</span>
                            </button>
                            <div class="history-group-content" id="${wrapperId}">
                    `;

                    itemsEnGrupo.forEach(log => {
                        const claseClasificacion = log.clase === 'tv' ? 'tv' : 'fibra';
                        wrapperHTML += `
                            <div class="log-item ${claseClasificacion}">
                                <div class="log-header">
                                    <span>👤 ${log.cliente || 'N/A'} (${log.dni || 'N/A'})</span>
                                    <span class="log-time"><i class="fa-regular fa-clock"></i> ${log.hora_str}</span>
                                </div>
                                <div class="log-body">${log.plantilla}</div>
                            </div>
                        `;
                    });

                    wrapperHTML += `</div></div>`;
                    container.innerHTML += wrapperHTML;
                });

                container.querySelectorAll(".history-group-trigger").forEach(btn => {
                    btn.onclick = () => shadow.getElementById(btn.getAttribute("data-target")).classList.toggle("open");
                });

            } catch(e) { 
                console.error(e);
                container.innerHTML = `<p style="color:#ef4444;font-size:11px;text-align:center;padding:10px;">❌ Error de sincronización.</p>`; 
            }
        };

        /* ========================================================================= */
        /* ==================== LÓGICA DE CONTROL DEL BAÚL ========================= */
        /* ========================================================================= */
        const vaultTitleInput = shadow.getElementById("vault-title-input");
        const vaultInput = shadow.getElementById("vault-input");
        const vaultSaveBtn = shadow.getElementById("vault-save-btn");
        const vaultContainer = shadow.getElementById("vault-items-container");

        vaultSaveBtn.onclick = async () => {
            const contenidoNota = vaultInput.value.trim();
            const tituloNota = vaultTitleInput.value.trim() || "Sin Título";
            if (!contenidoNota) return;

            const mode = vaultSaveBtn.getAttribute("data-mode");
            vaultSaveBtn.disabled = true;
            vaultSaveBtn.textContent = "Procesando...";

            try {
                if (mode === "edit") {
                    const editId = vaultSaveBtn.getAttribute("data-edit-id");
                    const { error } = await supabaseClient
                        .from('g_agentes_notas')
                        .update({ titulo: tituloNota, contenido: contenidoNota })
                        .eq('id', editId);

                    if (error) throw error;
                    toast("Nota modificada con éxito");
                } else {
                    const { error } = await supabaseClient.from('g_agentes_notas').insert([{
                        agente_nombre: AGENTE_ID_UNICO,
                        titulo: tituloNota,
                        contenido: contenidoNota
                    }]);

                    if (error) throw error;
                    toast("Nota guardada en tu baúl");
                }

                vaultInput.value = "";
                vaultTitleInput.value = "";
                vaultSaveBtn.setAttribute("data-mode", "create");
                vaultSaveBtn.setAttribute("data-edit-id", "");
                vaultSaveBtn.innerHTML = `<i class="fa-solid fa-plus"></i> Guardar Nota`;
                vaultSaveBtn.style.background = "#7A22B4";

                await renderNotasBaul();
            } catch (err) {
                console.error(err);
                toast("Error al procesar la nota");
            } finally {
                vaultSaveBtn.disabled = false;
                if (vaultSaveBtn.getAttribute("data-mode") === "create") {
                    vaultSaveBtn.innerHTML = `<i class="fa-solid fa-plus"></i> Guardar Nota`;
                }
            }
        };

        async function renderNotasBaul() {
            vaultContainer.innerHTML = `<p style="font-size:11px;text-align:center;opacity:0.5;padding:10px;">Cargando tus notas...</p>`;
            try {
                const { data: notas, error } = await supabaseClient
                    .from('g_agentes_notas')
                    .select('*')
                    .eq('agente_nombre', AGENTE_ID_UNICO)
                    .order('id', { ascending: false });

                if (error) throw error;

                if (!notas || notas.length === 0) {
                    vaultContainer.innerHTML = `<p style="font-size:11px;text-align:center;opacity:0.4;padding:15px;">El baúl está vacío.</p>`;
                    return;
                }

                vaultContainer.innerHTML = "";
                notas.forEach(nota => {
                    const itemDiv = document.createElement("div");
                    itemDiv.className = "vault-item";
                    
                    itemDiv.innerHTML = `
                        <div style="font-size: 13px; font-weight: 700; color: #b976f7; margin-bottom: 4px; border-bottom: 1px solid rgba(185, 118, 247, 0.1); padding-bottom: 2px;">${nota.titulo || "Sin Título"}</div>
                        <div class="vault-text">${nota.contenido}</div>
                        <div class="vault-actions">
                            <button class="vault-action-btn vault-btn-edit-item" style="color: #f59e0b;"><i class="fa-solid fa-pen-to-square"></i> Editar</button>
                            <button class="vault-action-btn vault-btn-copy" data-text="${nota.contenido.replace(/"/g, '&quot;')}"><i class="fa-regular fa-copy"></i> Copiar</button>
                            <button class="vault-action-btn vault-btn-delete" data-confirmed="false"><i class="fa-solid fa-trash"></i> Eliminar</button>
                        </div>
                    `;

                    itemDiv.querySelector(".vault-btn-copy").onclick = () => {
                        navigator.clipboard.writeText(nota.contenido).then(() => {
                            toast("Nota copiada al portapapeles");
                        });
                    };

                    itemDiv.querySelector(".vault-btn-edit-item").onclick = () => {
                        vaultTitleInput.value = nota.titulo || "";
                        vaultInput.value = nota.contenido;
                        vaultSaveBtn.setAttribute("data-mode", "edit");
                        vaultSaveBtn.setAttribute("data-edit-id", nota.id);
                        vaultSaveBtn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Actualizar Cambios`;
                        vaultSaveBtn.style.background = "#d97706";
                        vaultTitleInput.focus();
                        toast("Nota cargada en el editor");
                    };

                    // Sistema Integrado de Confirmación para eliminar notas (Estilo Historial)
                    const deleteBtn = itemDiv.querySelector(".vault-btn-delete");
                    let timeoutConfirm = null;

                    deleteBtn.onclick = async () => {
                        const isConfirmed = deleteBtn.getAttribute("data-confirmed") === "true";

                        if (!isConfirmed) {
                            // Primer clic: Activar estado de confirmación
                            deleteBtn.setAttribute("data-confirmed", "true");
                            deleteBtn.classList.add("confirming");
                            deleteBtn.innerHTML = "¿Borrar?";
                            
                            // Temporizador automático de 4 segundos para cancelar si no se pulsa de nuevo
                            timeoutConfirm = setTimeout(() => {
                                deleteBtn.setAttribute("data-confirmed", "false");
                                deleteBtn.classList.remove("confirming");
                                deleteBtn.innerHTML = `<i class="fa-solid fa-trash"></i> Eliminar`;
                            }, 4000);
                            return;
                        }

                        // Segundo clic: Ejecutar eliminación real en Supabase
                        clearTimeout(timeoutConfirm);
                        try {
                            await supabaseClient.from('g_agentes_notas').delete().eq('id', nota.id);
                            toast("Nota eliminada");
                            
                            if (vaultSaveBtn.getAttribute("data-edit-id") == nota.id) {
                                vaultInput.value = "";
                                vaultTitleInput.value = "";
                                vaultSaveBtn.setAttribute("data-mode", "create");
                                vaultSaveBtn.setAttribute("data-edit-id", "");
                                vaultSaveBtn.innerHTML = `<i class="fa-solid fa-plus"></i> Guardar Nota`;
                                vaultSaveBtn.style.background = "#7A22B4";
                            }
                            
                            renderNotasBaul();
                        } catch (err) {
                            console.error(err);
                            toast("No se pudo eliminar");
                        }
                    };

                    vaultContainer.appendChild(itemDiv);
                });
            } catch (err) {
                console.error(err);
                vaultContainer.innerHTML = `<p style="color:#ef4444;font-size:11px;text-align:center;padding:10px;">❌ Error al cargar notas.</p>`;
            }
        }

        /* ========================================================================= */
        /* ============ CONSTRUCTOR INTELIGENTE CON REEMPLAZOS DINÁMICOS ============ */
        /* ========================================================================= */
        shadow.querySelectorAll(".template-row").forEach(btn => {
            btn.onclick = async () => {
                const cache = window._cachedTemplates[btn.getAttribute("data-id")];
                if (!cache) return;

                const bloqueTexto = cache.servicio.texto;
                const tech = detectarTecnologiaScript1(bloqueTexto);
                
                let c = ["", "", "", ""];
                if (plantillas && plantillas[cache.categoriaRaiz]?.[cache.grupo]?.[cache.clave]) {
                    c = [...plantillas[cache.categoriaRaiz][cache.grupo][cache.clave]];
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
                if (c[1] === "DINAMICO_CORTES_RESUELTO") c[1] = tech === "HFC" ? "Se revisa en thot hay cortes in los últimos 7 días se hace reinicio de fábrica, ajuste de cableado and separación de bandas, conexión a red de internet ya es stable no hay cortes" : "Se reviso en Schaman hay cortes, reinicio de fábrica, ajuste de cableado, señal stable en ambas bandas wifi";
                if (c[1] === "DINAMICO_CORTES_TECNICO") {
                    c[1] = tech === "HFC" ? "Se valido en Thot bastantes cortes, reinicio de fábrica sin mejora tras prueba de conexión" : "Cortes in Schaman, reinicio de fábrica sin mejora";
                    c[2] = tech === "HFC" ? "Señal degradada tras saturación del cpe" : "Posible daño en cpe";
                }
                if (c[1] === "DINAMICO_CORTES_NV2") c[1] = tech === "HFC" ? "Se valido en Thot cortes de poco tiempo persistententes, se aplico reinicio de fábrica, y se deja para validación de nivel 2" : "Cortes persistententes validados en Schaman, se hace pruebas con videos y en red pero sigue ocurriendo y sin mejora";
                if (c[1] === "DINAMICO_FUERA_RESUELTO") {
                    c[1] = tech === "HFC" ? "Se valida en THOT parámetros fuera de umbrales, se reinicia de fábrica, se reinician parámetros SNMP, flaps y QoS, separación de bandas, test correcto" : "Se revisa en Schaman parámetros fuera de umbrales, se hace reinicio de fábrica, separación de bandas, test correcto";
                    c[3] = tech === "HFC" ? "Se reincia de fabrica, se reinician parámetros SNMP, se dividen bandas and se comprueba con cliente que el internet ya no tiene cortes ni lentitud ni parametros fuera de umbral" : "Se deja resuelto";
                }
                if (c[1] === "DINAMICO_FUERA_NO") c[1] = tech === "HFC" ? "Fuera de umbrales en THOT, reinicio de fábrica y reinicio de parámetros sin mejora" : "Fuera de umbrales en Schaman";
                if (c[3] === "DINAMICO_FUERA_RESUELTO_SOL") c[3] = tech === "HFC" ? "Se reinicia de fábrica, se reinician parámetros SNMP, se dividen bandas y se comprueba con cliente que el internet ya no tiene cortes ni lentitud ni parámetros fuera de umbral" : "Se realiza reinicio de fábrica, se dividen bandas y se comprueba con cliente que el internet ya no presenta anomalías estructurales";

                const clienteExtraido = getVal(["Nombre del cliente:", "Nombre:", "Cliente:", "Titular:"]);
                const dniExtraido = extraerDocumentoIdentidad();
                const idExtraido = getVal(["AMDOCS ID:", "ID Cliente:", "ID:"]);
                const direccionExtraida = extraerDireccion(bloqueTexto);
                const movilesExtraidos = extraerMoviles();

                const vel = (bloqueTexto.match(/(\d+(?:[.,]\d+)?\s*(?:Mbps|Gbps))/i) || ["", "600Mbps"])[1];
                const fechaEspanol = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

                const textoFinalEstructurado = 
`Nombre: ${clienteExtraido}
DNI/NIE: ${dniExtraido}
ID: ${idExtraido}
Dirección: ${direccionExtraida}
Móvil: ${movilesExtraidos}
• Qué dice el cliente que le sucede: ${c[0] || "N/A"}
• Pruebas realizadas: ${c[1] || "N/A"}
• Diagnóstico: ${c[2] || "N/A"}
• Solución: ${c[3] || "N/A"}
• Avería: #AVERIA / NA
Tecnología: ${tech}
Velocidad: ${vel}
Fecha: ${fechaEspanol}`;

                try {
                    await navigator.clipboard.writeText(textoFinalEstructurado);
                } catch (err) {
                    const textareaAux = document.createElement("textarea");
                    textareaAux.value = textoFinalEstructurado;
                    document.body.appendChild(textareaAux);
                    textareaAux.select();
                    document.execCommand("copy");
                    textareaAux.remove();
                }
                
                toast(`Copiado: ${cache.clave}`);

                btn.classList.add("copied-state");
                setTimeout(() => btn.classList.remove("copied-state"), 1200);

                saveToHistory(clienteExtraido, dniExtraido, cache.grupo, cache.clase, cache.clave);

                try {
                    await supabaseClient.from('logs_soporte').insert([{
                        agente_id: AGENTE_ID_UNICO,
                        cliente: clienteExtraido,
                        dni: dniExtraido,
                        sub_cat: cache.grupo,
                        clase: cache.clase,
                        plantilla: cache.clave,
                        fecha_str: new Date().toISOString().split('T')[0],
                        hora_str: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                    }]);
                } catch(err) { console.error("Error guardando en nube:", err); }
            };
        });

        shadow.getElementById("g-close-panel").onclick = () => host.remove();
        
        let panelOculto = false;
        shadow.getElementById("g-close-panel-b").onclick = () => {
            const bodyView = shadow.getElementById("g-body-view");
            const tabsContainer = shadow.querySelector(".tabs-container");
            if(!panelOculto){
                bodyView.style.display = "none";
                tabsContainer.style.display = "none";
                widget.style.maxHeight = "75px";
                shadow.getElementById("g-close-panel-b").textContent = "👁 Mostrar Interfaz";
                panelOculto = true;
            } else {
                bodyView.style.display = "block";
                tabsContainer.style.display = "flex";
                widget.style.maxHeight = "calc(100vh - 40px)";
                shadow.getElementById("g-close-panel-b").textContent = "👁 Ocultar Interfaz";
                panelOculto = false;
            }
        };

        let p1 = 0, p2 = 0, p3 = 0, p4 = 0; const handle = shadow.getElementById("g-drag-handle");
        handle.onmousedown = (e) => {
            if (e.target.closest('button')) return; e.preventDefault();
            p3 = e.clientX; p4 = e.clientY;
            document.onmouseup = () => { document.onmouseup = null; document.onmousemove = null; };
            document.onmousemove = (ev) => {
                ev.preventDefault(); p1 = p3 - ev.clientX; p2 = p4 - ev.clientY; p3 = ev.clientX; p4 = ev.clientY;
                widget.style.top = (widget.offsetTop - p2) + "px"; widget.style.right = (window.innerWidth - widget.offsetLeft - widget.offsetWidth + p1) + "px";
            };
        };
    })();
})();
