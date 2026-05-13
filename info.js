javascript:(async function(){
    const u = window.location.href;
    const REPO = 'https://cdn.jsdelivr.net/gh/Lowi2026/AUTOMALOW@main/';
    
    /* 1. RECURSOS */
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

    /* 2. EXTRACCIÓN DINÁMICA DE LA WEB */
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

    /* 4. ESTILOS */
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
            .g-close { background: #1a1a1a !important; margin-top: 15px; width: 100%; justify-content: center; color: #888 !important; }
            .g-nt { position: fixed; top: 20px; right: 20px; background: #260038; border: 1px solid #9b4dff; padding: 12px 25px; border-radius: 15px; color: #fff; z-index: 1000001; animation: g-in 0.4s; font-family: sans-serif; box-shadow: 0 5px 15px rgba(0,0,0,0.5); }
            @keyframes g-in { from { transform: translateX(100%); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
            .g-ld { position: fixed; bottom: 20px; right: 20px; width: 280px; background: rgba(42,0,63,.95); color: #fff; padding: 16px; border-radius: 14px; z-index: 1000000; box-shadow: 0 8px 20px rgba(0,0,0,.5); border: 1px solid #9b4dff; }
        `;
        document.head.appendChild(s);
    };

    const toast = (m) => {
        const n = document.createElement("div"); n.className = "g-nt"; n.innerHTML = `<i class="fa-solid fa-check-double"></i> | ${m}`;
        document.body.appendChild(n); setTimeout(() => n.remove(), 3000);
    };

    /* 5. FUNCIÓN CLAVE: COPIADO CON DATOS DE CLIENTE */
    const copyTemplate = (titulo, f, cat) => {
        const res = [
            `PLANTILLA FRONT SOPORTE // ${cat.toUpperCase()}`,
            `• Nombre: ${getVal(["Nombre del cliente:", "Nombre:", "Cliente:"])}`,
            `• DNI: ${getVal(["DNI/NIE/Pasaporte:", "DNI:", "DNI/NIE:"])}`,
            `• ID: ${getVal(["AMDOCS ID:", "ID Cliente:", "ID:"])}`,
            `• Dirección: ${getVal(["Dirección de instalación:", "Dirección:"])}`,
            `• # Móvil: ${getVal(["Teléfono de contacto:", "Móvil:", "Teléfono:"])}`,
            `• Qué dice el cliente que le sucede: ${f[0] || "N/A"}`,
            `• Pruebas realizadas: ${f[1] || "N/A"}`,
            `• Diagnóstico: ${f[2] || "N/A"}`,
            `• Solución: ${f[3] || "N/A"}`
        ].join("\n");
        navigator.clipboard.writeText(res);
        toast("Copiado: " + titulo);
    };

    /* 6. MENÚS */
    const showMenu = (tit, opciones) => {
        const ex = document.getElementById("g-ui"); if(ex) ex.remove();
        const m = document.createElement("div"); m.id = "g-ui"; m.className = "g-m";
        m.innerHTML = `<div style="font-size:30px; text-align:center; margin-bottom:5px">ฅ^•ﻌ•^ฅ</div><div class="g-tit">${tit}</div><div class="g-grid" id="g-g"></div>`;
        const g = m.querySelector("#g-g");
        opciones.forEach(o => {
            const b = document.createElement("button"); b.className = "g-btn";
            b.innerHTML = `<i class="fa-solid ${o.icon || 'fa-bolt'}"></i><span>${o.label}</span>`;
            b.onclick = () => { if(!o.sub) m.remove(); o.act(); }; g.appendChild(b);
        });
        const c = document.createElement("button"); c.className = "g-btn g-close"; c.innerHTML = `<i class="fa-solid fa-xmark"></i> CERRAR`;
        c.onclick = () => m.remove(); m.appendChild(c);
        document.body.appendChild(m);
    };

    /* INICIO */
    injectStyles();
    const plantillas = await loadData('Plantilla.json');
    const averias = await loadData('averias.json');

    if (u.includes("lowi.es")) {
        showMenu("GATITO CLOUD SOPORTE", [
            { label: "CONSULTAS", icon: "fa-comments", sub: true, act: () => {
                showMenu("CONSULTAS GENERALES", Object.keys(plantillas["Consulta - Solucione"]).map(k => ({
                    label: k, icon: "fa-file-lines", act: () => copyTemplate(k, plantillas["Consulta - Solucione"][k], "CONSULTAS GENERALES")
                })));
            }},
            { label: "ESCALADOS", icon: "fa-arrow-up-right-from-square", sub: true, act: () => {
                showMenu("ESCALADOS TÉCNICOS", Object.keys(plantillas["Escalado - No solucione"]).map(k => ({
                    label: k, icon: "fa-triangle-exclamation", act: () => copyTemplate(k, plantillas["Escalado - No solucione"][k], "ESCALADO")
                })));
            }}
        ]);
    }
})();
