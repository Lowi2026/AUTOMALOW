javascript:(async function(){
    const u = window.location.href;
    const REPO = 'https://cdn.jsdelivr.net/gh/Lowi2026/AUTOMALOW@main/';
    
    /* 1. CARGA DE RECURSOS (Iconos y Datos) */
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

    /* 2. UTILIDADES DE FECHA Y XPATH (De tu código) */
    const wait = t => new Promise(r => setTimeout(r, t));
    const xp = x => document.evaluate(x, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
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

    /* 3. ESTILOS PÚRPURA NEOMÓRFICOS */
    const injectStyles = () => {
        if(document.getElementById("g-styles")) return;
        const s = document.createElement("style");
        s.id = "g-styles";
        s.textContent = `
            .g-m { background: #260038; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.8); border: 1px solid #4a007d; width: 400px; padding: 25px; z-index: 999999; font-family: 'Segoe UI', sans-serif; color: #fff; }
            .g-tit { font-weight: 800; font-size: 13px; text-align: center; margin-bottom: 20px; color: #c58cff; text-transform: uppercase; letter-spacing: 1px; }
            .g-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
            .g-btn { background: #34004d; color: #f6f0ff; border: none; padding: 12px; border-radius: 12px; cursor: pointer; font-size: 10px; font-weight: 700; transition: 0.2s; box-shadow: 4px 4px 0px #1a0026; display: flex; align-items: center; gap: 8px; text-transform: uppercase; }
            .g-btn:hover { background: #4a007d; transform: translateY(-2px); box-shadow: 2px 2px 0px #1a0026; }
            .g-btn i { color: #c58cff; font-size: 14px; }
            .g-close { background: #1a1a1a !important; margin-top: 15px; width: 100%; justify-content: center; color: #888 !important; }
            .g-ld { position: fixed; bottom: 20px; right: 20px; width: 280px; background: rgba(42,0,63,.95); color: #fff; padding: 16px; border-radius: 14px; z-index: 1000000; box-shadow: 0 8px 20px rgba(0,0,0,.5); border: 1px solid #9b4dff; }
        `;
        document.head.appendChild(s);
    };

    /* 4. LOADER & RELLENO JIRA */
    const loader = {
        show: () => {
            const l = document.createElement("div"); l.id = "g-loader"; l.className = "g-ld";
            l.innerHTML = `<div id="ltext" style="font-weight:600; font-size:12px; margin-bottom:10px"></div><div style="height:8px;background:#ffffff30;border-radius:6px;overflow:hidden"><div id="lbar" style="height:100%;width:0%;background:#9b4dff;transition:0.3s"></div></div>`;
            document.body.appendChild(l);
        },
        upd: (p, t) => {
            const b = document.getElementById("lbar"); const lt = document.getElementById("ltext");
            if(b) b.style.width = p + "%"; if(lt) lt.innerHTML = t;
        },
        hide: () => document.getElementById("g-loader")?.remove()
    };

    async function fillJira(averia) {
        loader.show();
        const p = averia.pasos;
        const selectRS = async (input, steps) => {
            if(!input) return; input.focus();
            input.dispatchEvent(new MouseEvent("mousedown", {bubbles:true}));
            await wait(300);
            for(let i=0; i<steps; i++){ input.dispatchEvent(new KeyboardEvent("keydown", {key:"ArrowDown", bubbles:true})); await wait(100); }
            input.dispatchEvent(new KeyboardEvent("keydown", {key:"Enter", bubbles:true}));
        };

        loader.upd(20, "<i class='fa-solid fa-flag'></i> Prioridad y Grupo");
        await selectRS(document.querySelector("input[id*='16817']"), p.GRUPO || 0);
        await selectRS(document.querySelector("input[id*='16800']"), p.TIPO || 0);

        loader.upd(50, "<i class='fa-solid fa-sitemap'></i> Subtipos");
        await selectRS(document.querySelector("input[id*='16801']"), p.SUBTIPO_L1 || 0);
        await selectRS(document.querySelector("input[id*='16802']"), p.SUBTIPO_L2 || 0);

        loader.upd(80, "<i class='fa-solid fa-calendar-check'></i> Ajustando Fechas");
        const now = new Date();
        const f1 = document.querySelector("input[id*='16825']"); if(f1) f1.value = fmt(now);
        const cita = nextLab(new Date(now)); cita.setHours(9,0);
        const f2 = document.querySelector("input[id*='16823']"); if(f2) f2.value = fmt(cita);

        loader.upd(100, "<i class='fa-solid fa-circle-check'></i> ¡Completado!");
        await wait(800); loader.hide();
    }

    /* 5. MENÚ PRINCIPAL */
    const showMenu = (tit, opciones) => {
        const ex = document.getElementById("g-ui"); if(ex) ex.remove();
        const m = document.createElement("div"); m.id = "g-ui"; m.className = "g-m";
        m.innerHTML = `<div style="font-size:30px; text-align:center; margin-bottom:5px">ฅ^•ﻌ•^ฅ</div><div class="g-tit">${tit}</div><div class="g-grid" id="g-g"></div>`;
        const g = m.querySelector("#g-g");
        opciones.forEach(o => {
            const b = document.createElement("button"); b.className = "g-btn";
            b.innerHTML = `<i class="fa-solid ${o.icon || 'fa-bolt'}"></i><span>${o.label}</span>`;
            b.onclick = () => { m.remove(); o.act(); }; g.appendChild(b);
        });
        const c = document.createElement("button"); c.className = "g-btn g-close"; c.innerHTML = `<i class="fa-solid fa-xmark"></i> CERRAR`;
        c.onclick = () => m.remove(); m.appendChild(c);
        document.body.appendChild(m);
    };

    /* INICIO LÓGICO */
    injectStyles();
    const plantillas = await loadData('Plantilla.json');
    const averias = await loadData('averias.json');

    if (u.includes("lowi.es")) {
        showMenu("PLANTILLAS SOPORTE", [
            { label: "CONSULTAS", icon: "fa-comments", act: () => {
                showMenu("OPCIONES CONSULTA", Object.keys(plantillas["Consulta - Solucione"]).map(k => ({
                    label: k, icon: "fa-file-lines", act: () => {
                        const f = plantillas["Consulta - Solucione"][k];
                        const res = `PLANTILLA: ${k}\n• Qué sucede: ${f[0]}\n• Pruebas: ${f[1]}\n• Diagnóstico: ${f[2]}\n• Solución: ${f[3]}`;
                        navigator.clipboard.writeText(res); alert("Copiado!");
                    }
                })));
            }},
            { label: "ESCALADOS", icon: "fa-arrow-up-right-from-square", act: () => {
                showMenu("OPCIONES ESCALADO", Object.keys(plantillas["Escalado - No solucione"]).map(k => ({
                    label: k, icon: "fa-triangle-exclamation", act: () => {
                        const f = plantillas["Escalado - No solucione"][k];
                        const res = `PLANTILLA ESCALADO: ${k}\n• Detalle: ${f[0]}\n• Pruebas: ${f[1]}\n• Diagnóstico: ${f[2]}\n• Solución: ${f[3]}`;
                        navigator.clipboard.writeText(res); alert("Copiado!");
                    }
                })));
            }}
        ]);
    } else {
        showMenu("AUTO-RELLENO JIRA", averias.map(a => ({
            label: a.label,
            icon: a.label.includes("INCOMUNICADO") ? "fa-ban" : "fa-gauge-high",
            act: () => fillJira(a)
        })));
    }
})();
