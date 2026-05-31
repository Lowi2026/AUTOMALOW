/* ========================================================================= */
/* SCRIPT: Maestro funcional (Producción CDN)                                */
/* ARCHIVO: info.js                                                          */
/* ========================================================================= */

(() => {
    /* ================= 1. INYECTAR FONT AWESOME ================= */
    if (!document.querySelector('link[data-fa]')) {
        const fa = document.createElement("link");
        fa.rel = "stylesheet";
        fa.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css";
        fa.dataset.fa = "true";
        document.head.appendChild(fa);
    }

    /* ================= 2. UTILIDADES COMUNES JIRA ================= */
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

    // MOTOR UNIFICADO DE FLECHAS
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

    const urlAct = window.location.href;
    const REPO = 'https://cdn.jsdelivr.net/gh/Lowi2026/AUTOMALOW@main/';

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
    } 
    /* ========================================================================= */
    /* =========================== BLOQUE LOWI.ES ============================== */
    /* ========================================================================= */
    else {
        (async function ejecutarLowi() {
            const oldRoot = document.getElementById("g-automation-root");
            if (oldRoot) oldRoot.remove();

            console.log("🛰️ Cargando bases de datos en tiempo real...");
            let averias = null;
            let plantillas = null;

            try {
                const [resAverias, resPlantillas] = await Promise.all([
                    fetch(`${REPO}averias.json?v=${Date.now()}`).then(r => r.ok ? r.json() : null),
                    fetch(`${REPO}PL.json?v=${Date.now()}`).then(r => r.ok ? r.json() : null)
                ]);
                averias = resAverias;
                plantillas = resPlantillas;
            } catch (e) {
                console.error("❌ Error al obtener las bases de datos externas:", e);
            }

            const host = document.createElement("div");
            host.id = "g-automation-root";
            document.body.appendChild(host);
            const shadow = host.attachShadow({ mode: "open" });

            const style = document.createElement("style");
            style.textContent = `
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                :host {
                    --bg-main: #130919; --bg-card: #1c0f24; --bg-row: #23142d;
                    --border-purple: rgba(185, 118, 247, 0.12); --purple-electric: #7a22b4;
                    font-family: 'Inter', sans-serif;
                }
                * { box-sizing: border-box; margin: 0; padding: 0; }
                .widget-panel {
                    position: fixed; z-index: 9999999; width: 340px; max-height: calc(100vh - 40px);
                    top: 20px; right: 20px; background-color: var(--bg-main);
                    border: 1px solid rgba(185, 118, 247, 0.2); border-radius: 20px;
                    box-shadow: 0 24px 50px -12px rgba(0, 0, 0, 0.9); display: flex; flex-direction: column; overflow: hidden; color: #ffffff;
                }
                .header { padding: 20px 20px 10px 20px; background: #130919; display: flex; align-items: center; justify-content: space-between; cursor: move; }
                .header h2 { font-size: 16px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px; }
                .header p { font-size: 11px; color: #b976f7; opacity: 0.7; margin-top: 2px; font-weight: 500; }
                .close-btn { background: transparent; border: none; color: rgba(255, 255, 255, 0.4); cursor: pointer; font-size: 14px; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; }
                .close-btn:hover { color: #ffffff; }
                .tabs-container { display: flex; border-bottom: 1px solid rgba(185, 118, 247, 0.15); background: #130919; }
                .tab-button { flex: 1; padding: 12px; background: transparent; border: none; color: rgba(255, 255, 255, 0.4); font-size: 13px; font-weight: 600; cursor: pointer; text-align: center; position: relative; }
                .tab-button.active { color: #ffffff; }
                .tab-button.active::after { content: ''; position: absolute; bottom: -1px; left: 0; width: 100%; height: 2px; background: #b976f7; box-shadow: 0 -4px 10px #b976f7; }
                .body-container { flex: 1; overflow-y: auto; padding: 16px; position: relative; }
                .tab-view { display: none; }
                .tab-view.active { display: block; }
                .body-container::-webkit-scrollbar { width: 6px; }
                .body-container::-webkit-scrollbar-track { background: transparent; }
                .body-container::-webkit-scrollbar-thumb { background: #7a22b4; border-radius: 10px; }
                
                /* DESPLEGABLES PRINCIPALES (Plantillas) */
                .accordion-item { background-color: var(--bg-card); border: 1px solid var(--border-purple); border-radius: 16px; margin-bottom: 12px; overflow: hidden; }
                .accordion-trigger { width: 100%; padding: 16px; display: flex; align-items: center; justify-content: space-between; background: transparent; border: none; color: #ffffff; font-size: 14px; font-weight: 600; cursor: pointer; }
                .accordion-content { display: none; padding: 0 14px 16px 14px; }
                .accordion-content.open { display: block; }
                
                /* SUB-ACCORDEONES */
                .sub-accordion { margin-top: 8px; border-radius: 12px; background: #180c1f; border: 1px solid rgba(185, 118, 247, 0.04); overflow: hidden; }
                .group-label-trigger { width: 100%; padding: 14px 12px; font-size: 13px; font-weight: 600; color: #ffffff; background: transparent; border: none; cursor: pointer; display: flex; align-items: center; justify-content: space-between; }
                .sub-accordion-content { display: none; padding: 4px 10px 12px 10px; }
                .sub-accordion-content.open { display: block; }
                
                /* FILAS DE PLANTILLA */
                .template-row { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px; background: none; border: 1px solid rgba(255, 255, 255, 0.02); border-radius: 10px; color: rgba(255, 255, 255, 0.85); font-size: 12px; cursor: pointer; margin-bottom: 8px; text-align: left; }
                .template-row:hover { border-color: rgba(185, 118, 247, 0.3); color: #ffffff; background-color: rgba(185, 118, 247, 0.05); }
                .template-text { flex: 1; font-weight: 500; line-height: 1.4; word-break: break-word; }
                
                /* ICONOS Y DECORACIONES */
                .icon-circle-main { width: 32px; height: 32px; background: rgba(122, 34, 180, 0.25); border: 1px solid rgba(185, 118, 247, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; color: #b976f7; flex-shrink: 0; }
                .icon-circle-main svg { width: 16px; height: 16px; fill: currentColor; }
                .sub-cat-circle { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0; }
                .sub-cat-circle svg { width: 14px; height: 14px; fill: currentColor; }
                .sub-cat-circle.fibra { color: #00f0ff; background: rgba(0, 240, 255, 0.1); }
                .sub-cat-circle.tv { color: #f59e0b; background: rgba(245, 158, 11, 0.1); }
                .copy-action-btn { display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; color: #b976f7; padding: 4px 8px; background: transparent; border: none; flex-shrink: 0; }
                .template-row.copied-state { border: 1px solid #ffffff !important; box-shadow: 0 0 12px rgba(255, 255, 255, 0.2); color: #ffffff !important; }
                .template-row.copied-state .copy-action-btn { color: #10b981 !important; }
                
                /* FILTRO E HISTORIAL */
                .calendar-box { background: var(--bg-card); border: 1px solid var(--border-purple); border-radius: 14px; padding: 12px; margin-bottom: 14px; }
                .calendar-box label { font-size: 11px; text-transform: uppercase; color: #b976f7; letter-spacing: 0.5px; font-weight: 700; display: block; margin-bottom: 6px; }
                .filter-action-row { display: flex; align-items: center; gap: 8px; }
                .calendar-input { flex: 1; background: #130919; border: 1px solid rgba(185, 118, 247, 0.2); border-radius: 8px; padding: 8px 12px; color: #ffffff; font-size: 13px; outline: none; cursor: pointer; }
                .calendar-input::-webkit-calendar-picker-indicator { filter: invert(1); cursor: pointer; }
                .clear-history-btn { background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); color: #ef4444; width: 35px; height: 35px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
                
                /* ESTADÍSTICAS */
                .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 14px; }
                .stat-card { background: rgba(28, 16, 38, 0.4); border: 1px solid rgba(185, 118, 247, 0.08); border-radius: 10px; padding: 10px; text-align: center; }
                .stat-card.total-box { grid-column: span 2; background: linear-gradient(135deg, rgba(122, 34, 180, 0.2) 0%, rgba(28,16,38,0.4) 100%); border: 1px solid rgba(185, 118, 247, 0.2); }
                .stat-card h4 { font-size: 11px; color: rgba(255,255,255,0.5); font-weight: 500; }
                .stat-card p { font-size: 18px; font-weight: 700; margin-top: 2px; }
                .stat-card.total-box p { color: #b976f7; font-size: 22px; }
                
                /* BLOQUES DE HISTORIAL PREMIUM (ESTILO IMAGEN 2) */
                .history-group-wrapper { background: var(--bg-card); border: 1px solid var(--border-purple); border-radius: 12px; overflow: hidden; margin-bottom: 8px; }
                .history-group-trigger { width: 100%; padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; background: transparent; border: none; color: #ffffff; font-size: 13px; font-weight: 600; cursor: pointer; text-align: left; }
                .history-group-trigger:hover { background: rgba(185, 118, 247, 0.03); }
                .history-group-badge { background: #7a22b4; color: #ffffff; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 700; min-width: 22px; text-align: center; }
                .history-group-content { display: none; padding: 4px 12px 12px 12px; background: rgba(19, 9, 25, 0.2); border-top: 1px solid rgba(185, 118, 247, 0.05); }
                .history-group-content.open { display: block; }
                
                /* TARJETAS LOGS DE CONTENIDO INTERNO */
                .log-item { background: var(--bg-row); padding: 10px 12px; border-radius: 10px; font-size: 11px; display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px; border-left: 3px solid #b976f7; }
                .log-item.fibra { border-left-color: #00f0ff; }
                .log-item.tv { border-left-color: #f59e0b; }
                .log-header { display: flex; justify-content: space-between; font-weight: 600; color: #ffffff; }
                .log-time { color: rgba(255,255,255,0.4); font-size: 10px; font-weight: 400; }
                .log-body { color: rgba(255,255,255,0.65); font-size: 11px; margin-top: 2px; line-height: 1.4; word-break: break-word; }
                
                /* OVERLAY DE ACCIÓN */
                .confirm-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(19, 9, 25, 0.9); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px; opacity: 0; pointer-events: none; transition: opacity 0.2s; }
                .confirm-overlay.show { opacity: 1; pointer-events: auto; }
                .confirm-card { background: var(--bg-card); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 16px; padding: 20px; text-align: center; width: 100%; }
                .confirm-buttons { display: flex; gap: 10px; justify-content: center; margin-top: 12px; }
                .confirm-btn { padding: 8px 20px; font-size: 12px; font-weight: 700; border-radius: 8px; cursor: pointer; border: none; }
                .confirm-btn.yes { background: #ef4444; color: white; }
                .confirm-btn.no { background: rgba(255,255,255,0.1); color: white; }
                
                .footer { padding: 14px; border-top: 1px solid rgba(185, 118, 247, 0.12); background: #130919; text-align: center; }
                .hide-btn { width: 100%; padding: 10px; font-size: 12px; color: #ffffff; font-weight: 600; background: #1c0f24; border: 1px solid rgba(185, 118, 247, 0.2); cursor: pointer; border-radius: 8px; display: flex; align-items: center; justify-content: center; gap: 8px; }
                .chevron, .sub-chevron { transition: transform 0.2s ease; color: rgba(255,255,255,0.4); }
                .open .chevron, .open .sub-chevron { transform: rotate(180deg); }
            `;
            shadow.appendChild(style);

            const toast = (m) => {
                const old = document.querySelector(".g-nt"); if (old) old.remove();
                const n = document.createElement("div");
                n.style = "position:fixed; top:20px; right:20px; background:#7A22B4; padding:11px 18px; border-radius:8px; color:#FFF; z-index:10000001; font-size:12px; font-weight:bold; box-shadow:0 5px 15px rgba(0,0,0,0.4);";
                n.className = "g-nt"; n.innerHTML = `✓ | ${m}`; document.body.appendChild(n);
                setTimeout(() => n.remove(), 2000);
            };

            const SVG_COLLECTION = {
                wifi: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg>`,
                bolt: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 L3 14 h9 l-1 8 10-12 h-9 z"/></svg>`,
                tv: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="11" rx="2" ry="2"></rect><path d="M17 21l-5-4-5 4M12 3v4"/></svg>`
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

            if (plantillas) {
                serviciosActivos.forEach((serv, sIdx) => {
                    Object.keys(plantillas).forEach((categoria, catIdx) => {
                        const catLower = categoria.toLowerCase();
                        const esCategoriaTV = catLower.includes("tv") || catLower.includes("tele");
                        const mainIcon = esCategoriaTV ? SVG_COLLECTION.tv : SVG_COLLECTION.wifi;
                        const idUnicoBloque = `cat-${sIdx}-${catIdx}`;

                        plantillasHTML += `
                            <div class="accordion-item">
                                <button class="accordion-trigger" data-trigger="${idUnicoBloque}">
                                    <span style="display:flex; align-items:center;">
                                        <span class="icon-circle-main">${mainIcon}</span> ${categoria} ${serviciosActivos.length > 1 ? `(${serv.t})` : ''}
                                    </span>
                                    <svg class="chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M6 9l6 6 6-6"/></svg>
                                </button>
                                <div class="accordion-content" id="${idUnicoBloque}">
                        `;

                        Object.keys(plantillas[categoria]).forEach((nombreGrupo, grpIdx) => {
                            const subId = `sub_${sIdx}_${catIdx}_${grpIdx}`;
                            let subIconHTML = esCategoriaTV ? SVG_COLLECTION.tv : SVG_COLLECTION.bolt;
                            let subClass = esCategoriaTV ? "tv" : "fibra";

                            plantillasHTML += `
                                <div class="sub-accordion">
                                    <button class="group-label-trigger" data-subtrigger="${subId}">
                                        <span style="display:flex; align-items:center;">
                                            <span class="sub-cat-circle ${subClass}">${subIconHTML}</span> ${nombreGrupo}
                                        </span>
                                        <svg class="sub-chevron" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M6 9l6 6 6-6"/></svg>
                                    </button>
                                    <div class="sub-accordion-content" id="${subId}">
                            `;

                            Object.keys(plantillas[categoria][nombreGrupo]).forEach(clavePlantilla => {
                                const uniqueId = `tmpl_${sIdx}_${catIdx}_${Math.random().toString(36).substr(2, 9)}`;
                                window._cachedTemplates[uniqueId] = {
                                    categoriaRaiz: categoria, grupo: nombreGrupo, clave: clavePlantilla, servicio: serv, clase: subClass
                                };
                                plantillasHTML += `
                                    <button class="template-row" data-id="${uniqueId}">
                                        <span class="template-text">${clavePlantilla}</span>
                                        <span class="copy-action-btn">📋 Copiar</span>
                                    </button>
                                `;
                            });
                            plantillasHTML += `</div></div>`;
                        });
                        plantillasHTML += `</div></div>`;
                    });
                });
            }
            plantillasHTML += `</div>`;

            const widget = document.createElement("div"); widget.className = "widget-panel";
            widget.innerHTML = `
                <div class="header" id="g-drag-handle">
                    <div><h2>Generador de Plantillas</h2><p>lowi.es — Copiador dinámico</p></div>
                    <button class="close-btn" id="g-close-panel">✕</button>
                </div>
                <div class="tabs-container">
                    <button class="tab-button active" id="tab-btn-pl">Plantillas</button>
                    <button class="tab-button" id="tab-btn-hist">Historial</button>
                </div>
                <div class="body-container" id="g-body-view">
                    <div class="confirm-overlay" id="g-confirm-overlay">
                        <div class="confirm-card">
                            <p style="font-size:13px; font-weight:600;">¿Seguro que deseas borrar el historial?</p>
                            <div class="confirm-buttons">
                                <button class="confirm-btn yes" id="btn-confirm-yes">Sí</button>
                                <button class="confirm-btn no" id="btn-confirm-no">No</button>
                            </div>
                        </div>
                    </div>
                    <div class="tab-view active" id="view-templates">${plantillasHTML}</div>
                    <div class="tab-view" id="view-history">
                        <div class="calendar-box">
                            <label>Filtro y Limpieza</label>
                            <div class="filter-action-row">
                                <input type="date" class="calendar-input" id="hist-date-picker">
                                <button class="clear-history-btn" id="btn-trigger-clear">🗑️</button>
                            </div>
                        </div>
                        <div class="stats-grid">
                            <div class="stat-card total-box"><h4>Total Copiadas</h4><p id="stat-total-count">0</p></div>
                            <div class="stat-card"><h4>⚡ Fibra</h4><p id="stat-fibra-count" style="color:#00f0ff;">0</p></div>
                            <div class="stat-card"><h4>📺 TV</h4><p id="stat-tv-count" style="color:#f59e0b;">0</p></div>
                        </div>
                        <div class="log-list" id="hist-logs-container"></div>
                    </div>
                </div>
                <div class="footer"><button class="hide-btn" id="g-toggle-visibility">👁️‍🗨️ Ocultar Interfaz</button></div>
            `;
            shadow.appendChild(widget);

            const tabPl = shadow.getElementById("tab-btn-pl"); const tabHist = shadow.getElementById("tab-btn-hist");
            const viewPl = shadow.getElementById("view-templates"); const viewHist = shadow.getElementById("view-history");
            const datePicker = shadow.getElementById("hist-date-picker");
            datePicker.value = new Date().toISOString().split('T')[0];

            tabPl.onclick = () => { tabPl.classList.add("active"); viewPl.classList.add("active"); tabHist.classList.remove("active"); viewHist.classList.remove("active"); };
            tabHist.onclick = () => { tabHist.classList.add("active"); viewHist.classList.add("active"); tabPl.classList.remove("active"); viewPl.classList.remove("active"); renderHistory(); };
            datePicker.onchange = () => renderHistory();

            shadow.getElementById("btn-trigger-clear").onclick = () => shadow.getElementById("g-confirm-overlay").classList.add("show");
            shadow.getElementById("btn-confirm-no").onclick = () => shadow.getElementById("g-confirm-overlay").classList.remove("show");
            shadow.getElementById("btn-confirm-yes").onclick = () => { localStorage.removeItem("g_automation_logs"); shadow.getElementById("g-confirm-overlay").classList.remove("show"); toast("Historial limpiado"); renderHistory(); };

            shadow.querySelectorAll(".accordion-trigger").forEach(t => {
                t.onclick = () => {
                    const target = shadow.getElementById(t.getAttribute("data-trigger"));
                    const isOpen = target.classList.contains("open");
                    shadow.querySelectorAll(".accordion-content").forEach(el => el.classList.remove("open"));
                    shadow.querySelectorAll(".accordion-item").forEach(el => el.classList.remove("open"));
                    if(!isOpen) { target.classList.add("open"); t.parentElement.classList.add("open"); }
                }
            });

            shadow.querySelectorAll(".group-label-trigger").forEach(t => {
                t.onclick = () => {
                    const target = shadow.getElementById(t.getAttribute("data-subtrigger"));
                    target.classList.toggle("open"); t.parentElement.classList.toggle("open");
                }
            });

            /* RENDER HISTORIAL TOTALMENTE REAJUSTADO (ESTILO IMAGEN 2) */
            const renderHistory = () => {
                const targetDate = datePicker.value;
                const allLogs = JSON.parse(localStorage.getItem("g_automation_logs")) || [];
                const filtered = allLogs.filter(log => log.fechaStr === targetDate);
                let fCount = 0, tCount = 0; filtered.forEach(l => { if(l.clase === "fibra") fCount++; else tCount++; });
                
                shadow.getElementById("stat-total-count").textContent = filtered.length;
                shadow.getElementById("stat-fibra-count").textContent = fCount;
                shadow.getElementById("stat-tv-count").textContent = tCount;

                const container = shadow.getElementById("hist-logs-container");
                container.innerHTML = filtered.length === 0 ? `<p style="font-size:11px; text-align:center; opacity:0.4; padding:12px;">Sin registros hoy.</p>` : "";

                const mapAgrupado = {};
                filtered.forEach(log => {
                    if (!mapAgrupado[log.subCat]) mapAgrupado[log.subCat] = { clase: log.clase, items: [] };
                    mapAgrupado[log.subCat].items.push(log);
                });

                Object.keys(mapAgrupado).forEach((gName, idx) => {
                    const g = mapAgrupado[gName]; const wrapId = `hist_wrap_${idx}`;
                    const wrap = document.createElement("div"); wrap.className = "history-group-wrapper";
                    
                    let dotColor = g.clase === 'fibra' ? '#00f0ff' : '#f59e0b';
                    
                    wrap.innerHTML = `
                        <button class="history-group-trigger" id="btn-${wrapId}">
                            <span style="display:flex; align-items:center; gap:8px;">
                                <span style="color:${dotColor}; font-size:14px; line-height:1;">•</span> ${gName}
                            </span>
                            <span class="history-group-badge">${g.items.length}</span>
                        </button>
                        <div class="history-group-content" id="${wrapId}"></div>
                    `;
                    
                    const contentArea = wrap.querySelector(`#${wrapId}`);
                    g.items.forEach(item => {
                        contentArea.innerHTML += `
                            <div class="log-item ${item.clase}">
                                <div class="log-header">
                                    <span>${item.cliente} (${item.dni})</span>
                                    <span class="log-time">${item.horaStr}</span>
                                </div>
                                <div class="log-body">${item.plantilla}</div>
                            </div>
                        `;
                    });
                    
                    container.appendChild(wrap);
                    
                    wrap.querySelector(`#btn-${wrapId}`).onclick = () => {
                        contentArea.classList.toggle("open");
                        wrap.classList.toggle("open");
                    };
                });
            };

            shadow.querySelectorAll(".template-row").forEach(btn => {
                btn.onclick = () => {
                    const cache = window._cachedTemplates[btn.getAttribute("data-id")]; if (!cache) return;
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
                    if (c[1] === "DINAMICO_CORTES_RESUELTO") c[1] = tech === "HFC" ? "Se revisa en thot hay cortes en los últimos 7 días se hace reinicio de fábrica, ajuste de cableado y separación de bandas, conexión a red de internet ya es stable no hay cortes" : "Se reviso en Schaman hay cortes, reinicio de fábrica, ajuste de cableado, señal stable en ambas bandas wifi";
                    if (c[1] === "DINAMICO_CORTES_TECNICO") {
                        c[1] = tech === "HFC" ? "Se valido en Thot bastantes cortes, reinicio de fábrica sin mejora tras prueba de conexión" : "Cortes en Schaman, reinicio de fábrica sin mejora";
                        c[2] = tech === "HFC" ? "Señal degradada tras saturación del cpe" : "Posible daño en cpe";
                    }
                    if (c[1] === "DINAMICO_CORTES_NV2") c[1] = tech === "HFC" ? "Se valido en Thot cortes de poco tiempo persistententes, se aplico reinicio de fábrica, y se deja para validación de nivel 2" : "Cortes persistententes validados en Schaman, se hace pruebas con videos y en red pero sigue ocurriendo y sin mejora";
                    if (c[1] === "DINAMICO_FUERA_RESUELTO") {
                        c[1] = tech === "HFC" ? "Se valida en THOT parámetros fuera de umbrales, se reinicia de fábrica, se reinician parámetros SNMP, flaps y QoS, separación de bandas, test correcto" : "Se revisa en Schaman parámetros fuera de umbrales, se hace reinicio de fábrica, separación de bandas, test correcto";
                        c[3] = tech === "HFC" ? "Se reincia de fabrica, se reinician parámetros SNMP, se dividen bandas y se comprueba con cliente que el internet ya no tiene cortes ni lentitud ni parametros fuera de umbral" : "Se deja resuelto";
                    }
                    if (c[1] === "DINAMICO_FUERA_NO") c[1] = tech === "HFC" ? "Fuera de umbrales en THOT, reinicio de fábrica y reinicio de parámetros sin mejora" : "Fuera de umbrales en Schaman";
                    if (c[3] === "DINAMICO_FUERA_RESUELTO_SOL") c[3] = tech === "HFC" ? "Se reinicia de fábrica, se reinician parámetros SNMP, se dividen bandas y se comprueba con cliente que el internet ya no tiene cortes ni lentitud ni parámetros fuera de umbral" : "Se realiza reinicio de fábrica, se dividen bandas y se comprueba con cliente que el internet ya no presenta anomalías estructurales";

                    const vel = (bloqueTexto.match(/(\d+(?:[.,]\d+)?\s*(?:Mbps|Gbps))/i) || ["", "600Mbps"])[1];
                    const clienteExtraido = getVal(["Nombre del cliente:", "Nombre:", "Cliente:", "Titular:"]);
                    const dniExtraido = extraerDocumentoIdentidad();

                    const plantillaFinal = [
                        `Nombre: ${clienteExtraido}`, `DNI/NIE: ${dniExtraido}`, `ID: ${getVal(["AMDOCS ID:", "ID Cliente:", "ID:"])}`,
                        `Dirección: ${extraerDireccion(bloqueTexto)}`, `Móvil: ${extraerMoviles()}`,
                        `• Qué dice el cliente que le sucede: ${c[0] || "N/A"}`, `• Pruebas realizadas: ${c[1] || "N/A"}`,
                        `• Diagnóstico: ${c[2] || "N/A"}`, `• Solución: ${c[3] || "N/A"}`,
                        `Tecnología: ${tech}`, `Velocidad: ${vel}`,
                        `Fecha: ${new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}`
                    ].join("\n");

                    navigator.clipboard.writeText(plantillaFinal).then(() => {
                        toast(`Copiado: ${cache.clave}`);
                        saveToHistory(clienteExtraido, dniExtraido, cache.grupo, cache.clase, cache.clave);
                        btn.classList.add("copied-state"); setTimeout(() => btn.classList.remove("copied-state"), 1200);
                    });
                };
            });

            shadow.getElementById("g-close-panel").onclick = () => host.remove();
            let isHidden = false; const bodyV = shadow.getElementById("g-body-view"); const toggleV = shadow.getElementById("g-toggle-visibility");
            toggleV.onclick = () => {
                if (!isHidden) { bodyV.style.display = "none"; widget.style.maxHeight = "75px"; toggleV.textContent = "👁️ Mostrar Interfaz"; isHidden = true; }
                else { bodyV.style.display = "block"; widget.style.maxHeight = "calc(100vh - 40px)"; toggleV.textContent = "👁️‍🗨️ Ocultar Interfaz"; isHidden = false; }
            };

            let p1 = 0, p2 = 0, p3 = 0, p4 = 0; const handle = shadow.getElementById("g-drag-handle");
            handle.onmousedown = (e) => {
                if (e.target.closest('button') || e.target.closest('input')) return;
                e.preventDefault(); p3 = e.clientX; p4 = e.clientY;
                document.onmouseup = () => { document.onmouseup = null; document.onmousemove = null; };
                document.onmousemove = (ev) => {
                    ev.preventDefault(); p1 = p3 - ev.clientX; p2 = p4 - ev.clientY; p3 = ev.clientX; p4 = ev.clientY;
                    widget.style.top = (widget.offsetTop - p2) + "px"; widget.style.right = (window.innerWidth - widget.offsetLeft - widget.offsetWidth + p1) + "px";
                };
            };
        })();
    }
})();
