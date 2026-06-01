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

    // Ruta de tu CDN para la carga de archivos de configuración
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

        const style = document.createElement("style");
        style.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css');
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
            
            .accordion-item { background-color: var(--bg-card); border: 1px solid var(--border-purple); border-radius: 16px; margin-bottom: 12px; overflow: hidden; transition: all 0.2s ease; }
            .accordion-trigger { width: 100%; padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; background: transparent; border: none; color: #ffffff; font-size: 14px; font-weight: 600; cursor: pointer; text-align: left; }
            .accordion-content { display: none; padding: 0 14px 14px 14px; }
            .accordion-content.open { display: block; }
            
            .icon-circle-main { width: 32px; height: 32px; background: rgba(122, 34, 180, 0.2); border: 1px solid rgba(185, 118, 247, 0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; color: #b976f7; flex-shrink: 0; font-size: 14px; }
            
            .sub-accordion { margin-top: 8px; border-radius: 12px; background: #1c0f24; border: 1px solid rgba(185, 118, 247, 0.08); overflow: hidden; }
            .group-label-trigger { width: 100%; padding: 14px 16px; font-size: 14px; font-weight: 600; color: #ffffff; background: transparent; border: none; cursor: pointer; display: flex; align-items: center; justify-content: space-between; }
            .sub-accordion-content { display: none; padding: 4px 10px 12px 10px; }
            .sub-accordion-content.open { display: block; }
            
            .sub-cat-circle { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0; font-size: 12px; }
            .sub-cat-circle.fibra { color: #00d0ff; background: rgba(0, 150, 255, 0.15); border: 1px solid rgba(0, 150, 255, 0.3); }
            .sub-cat-circle.tv { color: #f59e0b; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); }

            .template-row { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px; background: none; border: 1px solid rgba(255, 255, 255, 0.02); border-radius: 10px; color: rgba(255, 255, 255, 0.85); font-size: 12px; cursor: pointer; margin-bottom: 8px; text-align: left; transition: all 0.2s ease; }
            .template-row:hover { border-color: rgba(185, 118, 247, 0.3); color: #ffffff; background-color: rgba(185, 118, 247, 0.05); }
            .template-text { flex: 1; font-weight: 500; line-height: 1.4; word-break: break-word; }
            .copy-action-btn { display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; color: #b976f7; padding: 4px 8px; background: transparent; border: none; transition: color 0.2s; flex-shrink: 0; }
            
            .template-row.copied-state { border: 1px solid #ffffff !important; box-shadow: 0 0 12px rgba(255, 255, 255, 0.2); color: #ffffff !important; }
            .template-row.copied-state .copy-action-btn { color: #10b981 !important; }
            
            .calendar-box { background: var(--bg-card); border: 1px solid var(--border-purple); border-radius: 14px; padding: 12px; margin-bottom: 14px; }
            .calendar-box label { font-size: 11px; text-transform: uppercase; color: #b976f7; letter-spacing: 0.5px; font-weight: 700; display: block; margin-bottom: 6px; }
            .filter-action-row { display: flex; align-items: center; gap: 8px; }
            .calendar-input { flex: 1; background: #130919; border: 1px solid rgba(185, 118, 247, 0.2); border-radius: 8px; padding: 8px 12px; color: #ffffff; font-size: 13px; outline: none; cursor: pointer; font-family: inherit; }
            .calendar-input::-webkit-calendar-picker-indicator { filter: invert(1); cursor: pointer; }
            
            .clear-btn { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #ef4444; cursor: pointer; transition: all 0.2s; }
            .clear-btn:hover { background: rgba(239, 68, 68, 0.2); color: #ff6b6b; }

            .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 14px; }
            .stat-card { background: rgba(28, 16, 38, 0.4); border: 1px solid rgba(185, 118, 247, 0.08); border-radius: 10px; padding: 10px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; }
            .stat-card.total-box { grid-column: span 2; background: linear-gradient(135deg, rgba(122, 34, 180, 0.2) 0%, rgba(28,16,38,0.4) 100%); border: 1px solid rgba(185, 118, 247, 0.2); padding: 14px; }
            .stat-card h4 { font-size: 11px; color: rgba(255,255,255,0.5); font-weight: 500; text-transform: uppercase; }
            .stat-card p { font-size: 18px; font-weight: 700; margin-top: 2px; }
            .stat-card.total-box p { color: #b976f7; font-size: 22px; }
            .stat-card.sub-stat p.val-fibra { color: #00f0ff; }
            .stat-card.sub-stat p.val-tv { color: #f59e0b; }
            
            .history-group-wrapper { background: var(--bg-card); border: 1px solid var(--border-purple); border-radius: 12px; overflow: hidden; margin-bottom: 8px; }
            .history-group-trigger { width: 100%; padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; background: transparent; border: none; color: #ffffff; font-size: 14px; font-weight: 600; cursor: pointer; text-align: left; }
            .history-group-trigger:hover { background: rgba(185, 118, 247, 0.03); }
            
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

        window._cachedTemplates = {};
        let plantillasHTML = `<div>`;
        
        if (plantillas) {
            Object.keys(plantillas).forEach((categoria, catIdx) => {
                const idUnicoBloque = `cat-${catIdx}`;
                const esTv = categoria.toLowerCase().includes("tv");
                const iconHeader = esTv ? `<i class="fas fa-tv"></i>` : `<i class="fas fa-wifi"></i>`;
                
                plantillasHTML += `
                    <div class="accordion-item" style="margin-bottom:12px;">
                        <button class="accordion-trigger" data-trigger="${idUnicoBloque}">
                            <div style="display:flex; align-items:center;">
                                <div class="icon-circle-main">${iconHeader}</div>
                                <span style="font-weight:600; font-size:14px;">${categoria}</span>
                            </div>
                            <i class="fas fa-chevron-down" style="font-size:11px;opacity:0.5;"></i>
                        </button>
                        <div class="accordion-content" id="${idUnicoBloque}">
                `;

                Object.keys(plantillas[categoria]).forEach((nombreGrupo, grpIdx) => {
                    const subId = `sub_${catIdx}_${grpIdx}`;
                    const subCatClass = esTv ? "tv" : "fibra";
                    const subCatIcon = esTv ? `<i class="fas fa-tv"></i>` : `<i class="fas fa-bolt"></i>`;

                    plantillasHTML += `
                        <div class="sub-accordion">
                            <button class="group-label-trigger" data-subtrigger="${subId}">
                                <div style="display:flex; align-items:center;">
                                    <div class="sub-cat-circle ${subCatClass}">${subCatIcon}</div>
                                    <span>${nombreGrupo}</span>
                                </div>
                                <i class="fas fa-chevron-down" style="font-size:11px;opacity:0.4;"></i>
                            </button>
                            <div class="sub-accordion-content" id="${subId}">
                    `;

                    Object.keys(plantillas[categoria][nombreGrupo]).forEach(clavePlantilla => {
                        const uniqueId = `tmpl_${catIdx}_${Math.random().toString(36).substr(2, 9)}`;
                        window._cachedTemplates[uniqueId] = { 
                            grupo: nombreGrupo, 
                            clave: clavePlantilla, 
                            clase: esTv ? "tv" : "fibra",
                            cuerpoCompleto: plantillas[categoria][nombreGrupo][clavePlantilla] 
                        };

                        plantillasHTML += `
                            <button class="template-row" data-id="${uniqueId}">
                                <span class="template-text">${clavePlantilla}</span>
                                <span class="copy-action-btn"><i class="far fa-copy"></i> Copiar</span>
                            </button>
                        `;
                    });
                    plantillasHTML += `</div></div>`;
                });
                plantillasHTML += `</div></div>`;
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
            </div>
            <div class="body-container" id="g-body-view">
                <div class="tab-view active" id="view-templates">${plantillasHTML}</div>
                
                <div class="tab-view" id="view-history">
                    <div class="calendar-box">
                        <label>Filtro y Limpieza</label>
                        <div class="filter-action-row">
                            <input type="date" class="calendar-input" id="hist-date-picker">
                            <button class="clear-btn" id="hist-clear-btn" title="Limpiar Historial"><i class="fas fa-trash-alt"></i></button>
                        </div>
                    </div>
                    <div class="stats-grid">
                        <div class="stat-card total-box"><h4>Total Copiadas</h4><p id="stat-total-count">0</p></div>
                        <div class="stat-card sub-stat"><h4>⚡ Fibra</h4><p class="val-fibra" id="stat-fibra-count">0</p></div>
                        <div class="stat-card sub-stat"><h4>📺 TV</h4><p class="val-tv" id="stat-tv-count">0</p></div>
                    </div>
                    <div class="log-list" id="hist-logs-container"></div>
                </div>
            </div>
            <div class="footer"><button class="hide-btn" id="g-close-panel-b">👁 Ocultar Interfaz</button></div>
        `;
        shadow.appendChild(widget);

        shadow.querySelectorAll(".accordion-trigger").forEach(t => {
            t.onclick = () => shadow.getElementById(t.getAttribute("data-trigger")).classList.toggle("open");
        });
        shadow.querySelectorAll(".group-label-trigger").forEach(t => {
            t.onclick = () => shadow.getElementById(t.getAttribute("data-subtrigger")).classList.toggle("open");
        });

        const tabPl = shadow.getElementById("tab-btn-pl"); const tabHist = shadow.getElementById("tab-btn-hist");
        const viewPl = shadow.getElementById("view-templates"); const viewHist = shadow.getElementById("view-history");
        const datePicker = shadow.getElementById("hist-date-picker"); datePicker.value = new Date().toISOString().split('T')[0];

        tabPl.onclick = () => { tabPl.classList.add("active"); viewPl.classList.add("active"); tabHist.classList.remove("active"); viewHist.classList.remove("active"); };
        tabHist.onclick = () => { tabHist.classList.add("active"); viewHist.classList.add("active"); tabPl.classList.remove("active"); viewPl.classList.remove("active"); renderHistorialSincronizado(); };
        datePicker.onchange = () => renderHistorialSincronizado();

        shadow.getElementById("hist-clear-btn").onclick = async () => {
            const fechaSeleccionada = datePicker.value;
            
            if (confirm(`⚠️ ¿Estás seguro de que deseas ELIMINAR permanentemente todo tu historial del día ${fechaSeleccionada} tanto aquí como en Supabase? Esta acción no se puede deshacer.`)) {
                try {
                    // 1. Borrado físico en la base de datos de Supabase
                    const { error } = await supabaseClient
                        .from('logs_soporte')
                        .delete()
                        .eq('agente_id', AGENTE_ID_UNICO)
                        .eq('fecha_str', fechaSeleccionada);

                    if (error) throw error;

                    toast("Historial borrado en la nube 🔥");

                    // 2. Limpieza de la interfaz local y puesta a cero
                    shadow.getElementById("stat-total-count").textContent = "0";
                    shadow.getElementById("stat-fibra-count").textContent = "0";
                    shadow.getElementById("stat-tv-count").textContent = "0";
                    shadow.getElementById("hist-logs-container").innerHTML = `<p style="font-size:11px;text-align:center;opacity:0.4;padding:15px;">Historial vaciado en la base de datos.</p>`;

                } catch (err) {
                    console.error("Error al borrar en Supabase:", err);
                    alert("❌ No se pudo borrar el historial de la nube. Revisa la conexión o los permisos de Supabase.");
                }
            }
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
                                    <span class="log-time"><i class="far fa-clock"></i> ${log.hora_str}</span>
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
        /* ======================== CONSTRUTOR DE ESTRUCTURA ======================= */
        /* ========================================================================= */
        shadow.querySelectorAll(".template-row").forEach(btn => {
            btn.onclick = async () => {
                const cache = window._cachedTemplates[btn.getAttribute("data-id")];
                if (!cache) return;

                const spanTitular = document.querySelector('div[style*="width: 80%"] span[style*="font-size: 30px;"]');
                const clienteNombre = spanTitular ? spanTitular.textContent.split('|')[0].trim() : "Sara Pascual Torres";

                let clienteDni = "46975484P"; 
                document.querySelectorAll('#content-main div').forEach(el => {
                    if (el.textContent.includes("DNI")) {
                        clienteDni = el.textContent.replace("DNI:", "").trim();
                    }
                });

                let clienteID = "154233116";
                let clienteDireccion = "CL REI MARTI 46 EN1 BARCELONA 08014";
                let clienteMovil = "654179063";
                
                document.querySelectorAll('#content-main div, .aui-page-panel-content div, td').forEach(el => {
                    const txt = el.textContent;
                    if (txt.includes("ID:") || txt.includes("Identificador:")) {
                        const m = txt.match(/(?:ID|Identificador):\s*(\d+)/i);
                        if(m) clienteID = m[1].trim();
                    }
                    if (txt.includes("Dirección:") || txt.includes("Direccion:")) {
                        clienteDireccion = txt.replace(/Direcci[óo]n:\s*/i, "").trim();
                    }
                    if (txt.includes("Móvil:") || txt.includes("Movil:")) {
                        const m = txt.match(/(?:Móvil|Movil):\s*(\d+)/i);
                        if(m) clienteMovil = m[1].trim();
                    }
                });

                const opcionesFecha = { day: 'numeric', month: 'long', year: 'numeric' };
                const fechaEspanol = new Date().toLocaleDateString('es-ES', opcionesFecha);

                let rawData = cache.cuerpoCompleto;
                let lineasJSON = [];

                if (Array.isArray(rawData)) {
                    lineasJSON = rawData;
                } else if (typeof rawData === "string") {
                    lineasJSON = rawData.split("\n");
                }

                let qDice = lineasJSON[0] || "";
                let pruebas = lineasJSON[1] || "";
                let diag = lineasJSON[2] || "";
                let sol = lineasJSON[3] || "";

                if(!qDice && !pruebas && !diag && !sol) {
                    qDice = cache.clave;
                    pruebas = cache.clave;
                    diag = cache.clave;
                    sol = cache.clave;
                }

                const textoFinalEstructurado = 
`Nombre: ${clienteNombre.toUpperCase()}
DNI/NIE: ${clienteDni.toUpperCase()}
ID: ${clienteID}
Dirección: ${clienteDireccion.toUpperCase()}
Móvil: ${clienteMovil}
• Qué dice el cliente que le sucede: ${qDice}
• Pruebas realizadas: ${pruebas}
• Diagnóstico: ${diag}
• Solución: ${sol}
Tecnología: HFC
Velocidad: 1Gbps
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
                
                toast(`Copiado Estructurado Completo`);

                btn.classList.add("copied-state");
                setTimeout(() => btn.classList.remove("copied-state"), 1200);

                try {
                    await supabaseClient.from('logs_soporte').insert([{
                        agente_id: AGENTE_ID_UNICO,
                        cliente: clienteNombre,
                        dni: clienteDni,
                        sub_cat: cache.grupo,
                        clase: cache.clase,
                        plantilla: cache.clave,
                        fecha_str: new Date().toISOString().split('T')[0],
                        hora_str: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                    }]);
                } catch(err) { console.error("Error al registrar en la nube:", err); }
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
