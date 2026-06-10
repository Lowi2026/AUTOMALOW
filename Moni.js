(function(){
    // Evitar que se duplique la interfaz si se pulsa el marcador varias veces
    const viejo = document.getElementById("monitMain");
    if(viejo) viejo.remove();
    const viejaPrev = document.getElementById("mPreview");
    if(viejaPrev) viejaPrev.remove();

    window.monitPro = true;

    /* Lista de agentes de tu equipo */
    const db = {
        "48088":{n:"Mateo Rodríguez Teque",c:"mrodr548"},
        "48232":{n:"Joel Giovanny Ramirez Leal",c:"jrami284"},
        "48231":{n:"Mariana Forero Valderrama",c:"mforerou"},
        "48229":{n:"Janis Alexandra Cifuentes Guzmán",c:"jcifue18"},
        "47788":{n:"Derly Yuliana Martinez Velandia",c:"dmart249"},
        "46779":{n:"Paola Andrea Alayon Congote",c:"palayon"},
        "48241":{n:"Jaime Alberto Tejera Flores",c:"jtejera3"},
        "48062":{n:"Juan Felipe Sogamoso Capera",c:"jsogamo1"},
        "48132":{n:"Juan Carlos Romero Garcia",c:"jrome221"},
        "47610":{n:"Jeison Mauricio Martinez Conda",c:"jmart541"},
        "47856":{n:"Paola Andrea Jimenez Ramos",c:"pjimen64"},
        "46800":{n:"Leonardo Mendez Suarez",c:"lmendezy"},
        "48719":{n:"Marggi Dayana Amaya Rojas",c:"mamayar1"},
        "48913":{n:"Luis Sebastian Lizarazo Cifuentes",c:"llizara4"},
        "49194":{n:"Anwelo  Stiven  Díaz  Rodríguez ",c:"adiazroi"},
        "49194":{n:"Anwelo  Stiven  Díaz  Rodríguez ",c:"adiazroi"},
        "49185":{n:"Jessica  Alejandra  Gómez  Casallas ",c:"jgome250"}
    };

    const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
    const storageKey = 'db_monit_v5';
    
    // Carga de datos persistente en LocalStorage
    let data = JSON.parse(localStorage.getItem(storageKey)) || [];
    let state = { editIdx: null, tempItem: { dur: "0:00:00", f: "" } };

    // Auxiliar para creación ágil de elementos DOM
    const $ = (tag, props = {}, style = {}) => {
        const el = document.createElement(tag);
        Object.assign(el, props);
        if (style) Object.assign(el.style, style);
        return el;
    };

    // Formateador de tiempo para la duración extraída del CRM
    const fmtT = s => {
        const sec = parseInt(s) || 0;
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const x = sec % 60;
        return `${h}:${m.toString().padStart(2,'0')}:${x.toString().padStart(2,'0')}`;
    };

    const save = () => localStorage.setItem(storageKey, JSON.stringify(data));

    const getFullTxt = (d) => `AGENTE: ${d.n}\nCITRIX: ${d.c}\nID TRANS: ${d.id}\nTIEMPO: ${d.dur}\nFECHA: ${d.f}\nID CLIENTE: ${d.idCli}\nDNI: ${d.dni}\nRESUMEN: ${d.ctx}\nFORTALEZA: ${d.fort}\nDEBILIDAD: ${d.debi}\nMEJORA: ${d.mejo}\nFEEDBACK: ${d.feed}\nESTADO: ${d.hecho}`;

    // --- INTERFAZ GRÁFICA (PREVIEW LATERAL) ---
    const preview = $("div", {id: "mPreview"}, {
        position: "fixed", top: "20px", right: "510px", width: "320px", background: "#fdfdfd",
        color: "#222", borderRadius: "8px", zIndex: "999998", padding: "20px", fontSize: "12px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.3)", display: "none", border: "1px solid #ccc",
        whiteSpace: "pre-wrap", maxHeight: "85vh", overflowY: "auto", fontFamily: "'Courier New', monospace", borderLeft: "6px solid #3a7afe"
    });
    document.body.appendChild(preview);

    // --- INTERFAZ GRÁFICA (PANEL PRINCIPAL) ---
    const ui = $("div", {id: "monitMain"}, {
        position: "fixed", top: "20px", right: "20px", width: "480px", background: "#0f0f0f", 
        color: "#fff", borderRadius: "12px", zIndex: "999999", fontFamily: "Segoe UI, sans-serif", 
        boxShadow: "0 10px 40px rgba(0,0,0,0.8)", display: "flex", flexDirection: "column", resize: "both", overflow: "hidden"
    });

    ui.innerHTML = `
        <div id="mHeader" style="padding:15px; background:#1a1a1a; cursor:move; display:flex; justify-content:space-between; border-bottom:1px solid #333">
            <span style="font-weight:bold; color:#3a7afe">📊 MONITOR <span style="color:#fff">SMART v10</span></span>
            <span id="mClose" style="cursor:pointer">✕</span>
        </div>
        <div style="display:flex; background:#151515; border-bottom:1px solid #222">
            <button class="t-btn active" data-tab="tab-edit">REGISTRO</button>
            <button class="t-btn" data-tab="tab-list">HISTORIAL</button>
            <button class="t-btn" data-tab="tab-team">EQUIPO</button>
            <button class="t-btn" data-tab="tab-stats">REPORTES</button>
        </div>
        <div id="mContent" style="padding:15px; overflow-y:auto; flex-grow:1; max-height:80vh">
            <div id="tab-edit" class="tab-pane">
                <button id="mExtract" style="width:100%; padding:12px; background:#6610f2; color:#fff; border:0; border-radius:8px; cursor:pointer; font-weight:bold; margin-bottom:15px">🔍 EXTRAER / COMPLETAR DATOS</button>
                <div id="editFields" style="display:flex; flex-direction:column; gap:12px">
                    <div id="mManualBox" style="background:#1a1a1a; padding:12px; border-radius:8px; border-left:4px solid #3a7afe; font-size:12px; display:flex; flex-direction:column; gap:10px">
                        <div style="display:flex; flex-direction:column; gap:4px">
                            <label style="color:#888; font-size:10px">👤 SELECCIONAR AGENTE</label>
                            <select id="mSelAgente" style="background:#000; color:#fff; border:1px solid #333; padding:6px; border-radius:4px"></select>
                        </div>
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px">
                            <div style="display:flex; flex-direction:column; gap:4px">
                                <label style="color:#888; font-size:10px">🆔 ID TRANSACCIÓN</label>
                                <input id="mIdEdit" type="text" style="background:#000; border:1px solid #333; color:#fff; padding:6px; border-radius:4px">
                            </div>
                            <div style="display:flex; flex-direction:column; gap:4px">
                                <label style="color:#888; font-size:10px">⏱️ TIEMPO Y FECHA (AUTO)</label>
                                <div id="mAutoInfo" style="color:#aaa; padding:6px; background:#111; border-radius:4px; border:1px solid #222">Esperando...</div>
                            </div>
                        </div>
                    </div>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px">
                        <textarea id="mCtx" placeholder="Resumen..." style="height:70px; background:#000; color:#fff; border:1px solid #333; border-radius:6px; padding:8px; font-size:12px"></textarea>
                        <textarea id="mFeed" placeholder="Feedback..." style="height:70px; background:#000; color:#fff; border:1px solid #333; border-radius:6px; padding:8px; font-size:12px"></textarea>
                    </div>
                    <input id="mFort" placeholder="💪 Fortaleza" style="background:#000; border:1px solid #333; color:#fff; padding:8px; border-radius:6px; font-size:12px">
                    <input id="mDebi" placeholder="⚠️ Debilidad" style="background:#000; border:1px solid #333; color:#fff; padding:8px; border-radius:6px; font-size:12px">
                    <input id="mMejo" placeholder="🚀 A mejorar" style="background:#000; border:1px solid #333; color:#fff; padding:8px; border-radius:6px; font-size:12px">
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px">
                        <input id="mDni" placeholder="DNI" style="background:#000; border:1px solid #333; color:#fff; padding:8px; border-radius:6px; font-size:12px">
                        <input id="mCli" placeholder="ID Cliente (Smart)" style="background:#000; border:1px solid #333; color:#fff; padding:8px; border-radius:6px; font-size:12px">
                    </div>
                    <select id="mStatus" style="width:100%; background:#000; border:1px solid #333; color:#fff; padding:10px; border-radius:6px"><option value="NO">❌ NO EXITOSO</option><option value="SI">✅ EXITOSO</option></select>
                    <div style="display:flex; gap:10px">
                        <button id="mSave" style="flex:2; padding:12px; background:#28a745; color:#fff; border:0; border-radius:8px; font-weight:bold; cursor:pointer">GUARDAR</button>
                        <button id="mCancel" style="flex:1; padding:12px; background:#dc3545; color:#fff; border:0; border-radius:8px; cursor:pointer; display:none">CANCELAR</button>
                        <button id="mReset" style="flex:1; padding:12px; background:#444; color:#fff; border:0; border-radius:8px; cursor:pointer">LIMPIAR</button>
                    </div>
                </div>
            </div>
            <div id="tab-list" class="tab-pane" style="display:none">
                <div style="display:flex; gap:5px; margin-bottom:10px">
                    <select id="fMes" style="flex:1; background:#1a1a1a; color:#fff; border:1px solid #333; padding:5px; border-radius:4px; font-size:11px"><option value="All">Meses</option></select>
                    <select id="fHecho" style="flex:1; background:#1a1a1a; color:#fff; border:1px solid #333; padding:5px; border-radius:4px; font-size:11px"><option value="All">Estados</option><option value="SI">SI</option><option value="NO">NO</option></select>
                </div>
                <div id="mLog" style="display:flex; flex-direction:column; gap:6px"></div>
            </div>
            <div id="tab-team" class="tab-pane" style="display:none">
                <div style="display:flex; flex-direction:column; gap:10px">
                    <select id="fMesTeam" style="width:100%; background:#1a1a1a; color:#3a7afe; border:1px solid #333; padding:8px; border-radius:6px; font-size:12px; font-weight:bold"><option value="All">Ver Todo el Historial</option></select>
                    <div id="mTeamTable" style="background:#1a1a1a; border-radius:8px; padding:10px; overflow-x:auto"></div>
                </div>
            </div>
            <div id="tab-stats" class="tab-pane" style="display:none">
                <div style="background:#1a1a1a; padding:15px; border-radius:10px; display:flex; flex-direction:column; gap:12px">
                    
                    <label style="font-weight:bold; color:#3a7afe; font-size:11px; letter-spacing:0.5px">📤 EXPORTAR DATOS ACTIVOS</label>
                    <select id="expFilter" style="background:#000; color:#fff; border:1px solid #333; padding:8px; border-radius:6px; font-size:12px">
                        <option value="All">Todo el historial</option>
                        <option value="SI">Solo Exitosos (SI)</option>
                        <option value="NO">Solo No Exitosos (NO)</option>
                    </select>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px">
                        <button id="mCsv" style="padding:10px; background:#007bff; color:#fff; border:0; border-radius:6px; font-weight:bold; cursor:pointer; font-size:11px">DESCARGAR CSV</button>
                        <button id="mTxt" style="padding:10px; background:#17a2b8; color:#fff; border:0; border-radius:6px; font-weight:bold; cursor:pointer; font-size:11px">DESCARGAR TXT</button>
                    </div>
                    
                    <hr style="border:0; border-top:1px solid #333; margin:5px 0">
                    
                    <label style="font-weight:bold; color:#e0a800; font-size:11px; letter-spacing:0.5px">📥 IMPORTAR / FUSIONAR RESPALDO</label>
                    <div style="display:flex; flex-direction:column; gap:8px; background:#111; padding:10px; border-radius:6px; border:1px solid #222">
                        <button id="btnTriggerImport" style="padding:10px; background:#28a745; color:#fff; border:0; border-radius:6px; font-weight:bold; cursor:pointer; font-size:11px">📁 SELECCIONAR ARCHIVO (.csv o .txt)</button>
                        <input id="mImportFile" type="file" accept=".csv,.txt" style="display:none">
                        <span id="importInfo" style="font-size:10px; color:#aaa; text-align:center">Soporta CSV de Excel (Tabulador/Comas/Punto y coma) o TXT con saltos de línea internos.</span>
                    </div>

                    <hr style="border:0; border-top:1px solid #333; margin:5px 0">
                    
                    <button id="mClear" style="padding:8px; background:transparent; border:1px solid #dc3545; color:#dc3545; border-radius:8px; cursor:pointer; font-size:11px; font-weight:bold">⚠ BORRAR TODO EL LOCALSTORAGE</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(ui);

    // Poblar el menú desplegable de Agentes
    const selA = ui.querySelector("#mSelAgente");
    selA.append($("option", {value:"", textContent:"Selecciona un agente..."}));
    Object.keys(db).forEach(k => selA.append($("option", {value:k, textContent:db[k].n})));

    const st = document.createElement("style");
    st.innerHTML = `.t-btn{flex:1;padding:12px;border:0;background:#151515;color:#666;cursor:pointer;font-weight:bold;font-size:10px;border-bottom:2px solid transparent}.t-btn.active{color:#3a7afe;background:#1a1a1a;border-bottom:2px solid #3a7afe} table.team{width:100%; border-collapse:collapse; font-size:11px} table.team th{text-align:left; color:#3a7afe; padding:8px; border-bottom:1px solid #333} table.team td{padding:8px; border-bottom:1px solid #222}`;
    document.head.appendChild(st);

    // --- RENDERIZADO: TABLA DE EQUIPO ---
    const renderTeam = () => {
        const container = ui.querySelector("#mTeamTable");
        const fM = ui.querySelector("#fMesTeam").value;
        const targetMesIndex = meses.indexOf(fM);

        let html = `<table class="team"><thead><tr><th>AGENTE</th><th>TOT</th><th style="color:#28a745">SI</th><th style="color:#dc3545">NO</th></tr></thead><tbody>`;
        
        Object.keys(db).forEach(id => {
            const agent = db[id];
            const stats = data.reduce((acc, curr) => {
                if(curr.n === agent.n) {
                    let matchMes = true;
                    if (fM !== "All" && curr.f) {
                        const parts = curr.f.replace(/-/g, '/').split('/');
                        const mesRegistro = parseInt(parts[1]) - 1;
                        matchMes = (mesRegistro === targetMesIndex);
                    }
                    if(matchMes) {
                        acc.total++;
                        if(curr.hecho === 'SI') acc.si++;
                        else acc.no++;
                    }
                }
                return acc;
            }, {total:0, si:0, no:0});
            
            html += `<tr>
                <td>${agent.n.split(' ')[0]} ${agent.n.split(' ')[1] || ''}</td>
                <td><b>${stats.total}</b></td>
                <td style="color:#28a745">${stats.si}</td>
                <td style="color:#dc3545">${stats.no}</td>
            </tr>`;
        });
        
        html += `</tbody></table>`;
        container.innerHTML = html;
    };

    // --- RENDERIZADO: LISTA HISTÓRICA FILTRADA ---
    const renderList = () => {
        const log = ui.querySelector("#mLog"); log.innerHTML = "";
        const fM = ui.querySelector("#fMes").value;
        const fH = ui.querySelector("#fHecho").value;
        const targetMesIndex = meses.indexOf(fM);

        data.filter(d => {
            let matchMes = true;
            if (fM !== "All" && d.f) {
                const parts = d.f.replace(/-/g, '/').split('/');
                if (parts.length >= 2) {
                    const mesRegistro = parseInt(parts[1]) - 1;
                    matchMes = (mesRegistro === targetMesIndex);
                } else {
                    matchMes = d.f.includes(fM);
                }
            }
            const matchHecho = (fH === "All" || d.hecho === fH);
            return matchMes && matchHecho;
        })
        .slice().reverse().forEach(d => {
            const idx = data.indexOf(d);
            const item = $("div", {}, { background: "#1a1a1a", padding: "10px", borderRadius: "8px", borderLeft: `4px solid ${d.hecho==='SI'?'#28a745':'#dc3545'}`, display: "flex", justifyContent: "space-between", alignItems: "center" });
            item.innerHTML = `<div><b style="font-size:12px">${d.n}</b><br><small style="color:#666">${d.f} | ${d.dur}</small></div>`;
            
            const acts = $("div", {}, {display: "flex", gap: "4px"});
            const btnV = $("button", {textContent: "👁️", onclick: () => { preview.style.display = "block"; preview.innerText = getFullTxt(d); }}, {background: "#444", border: "0", cursor: "pointer", borderRadius: "4px", padding: "5px"});
            const btnC = $("button", {textContent: "📋", onclick: () => { navigator.clipboard.writeText(getFullTxt(d)); alert("Copiado"); }}, {background: "#333", border: "0", cursor: "pointer", borderRadius: "4px", padding: "5px"});
            const btnE = $("button", {textContent: "✎", onclick: () => { ui.querySelector('[data-tab="tab-edit"]').click(); edit(idx); }}, {background: "#333", border: "0", cursor: "pointer", borderRadius: "4px", padding: "5px"});
            const btnD = $("button", {textContent: "🗑️", onclick: () => { if(confirm("¿Eliminar?")) { data.splice(idx, 1); save(); renderList(); } }}, {background: "#dc3545", color: "#fff", border: "0", cursor: "pointer", borderRadius: "4px", padding: "5px"});
            
            acts.append(btnV, btnC, btnE, btnD); item.append(acts); log.append(item);
        });
    };

    const edit = (idx) => {
        state.editIdx = idx; const itm = data[idx];
        const aKey = Object.keys(db).find(k => db[k].n === itm.n);
        ui.querySelector("#mSelAgente").value = aKey || "";
        ui.querySelector("#mIdEdit").value = itm.id;
        ui.querySelector("#mAutoInfo").innerText = `${itm.dur} | ${itm.f}`;
        ui.querySelector("#mCtx").value = itm.ctx || ""; ui.querySelector("#mFeed").value = itm.feed || "";
        ui.querySelector("#mFort").value = itm.fort || ""; ui.querySelector("#mDebi").value = itm.debi || "";
        ui.querySelector("#mMejo").value = itm.mejo || ""; ui.querySelector("#mDni").value = itm.dni || "";
        ui.querySelector("#mCli").value = itm.idCli || ""; ui.querySelector("#mStatus").value = itm.hecho;
        ui.querySelector("#mCancel").style.display = "block";
    };

    // --- ACCIÓN: RASPADO AUTOMÁTICO (CRM SMART) ---
    ui.querySelector("#mExtract").onclick = () => {
        const row = document.querySelector('input.paraDescarga:checked')?.closest('tr') || document.querySelector('tr.odd, tr.even');
        if(!row) return alert("Tabla no detectada.");
        const tds = row.querySelectorAll('td');
        if(tds.length < 7) return alert("La estructura de la tabla web cambió o no es la correcta.");
        
        const idAgente = tds[6].innerText.trim();
        const ag = db[idAgente];
        ui.querySelector("#mSelAgente").value = ag ? idAgente : "";
        ui.querySelector("#mIdEdit").value = tds[2].innerText.trim();
        const dur = fmtT(tds[5].innerText.trim());
        const fec = tds[3].innerText.split(' ')[0];
        ui.querySelector("#mAutoInfo").innerText = `${dur} | ${fec}`;
        
        if (state.editIdx === null) { 
            state.tempItem.dur = dur; 
            state.tempItem.f = fec; 
        } else { 
            data[state.editIdx].dur = dur; 
            data[state.editIdx].f = fec; 
        }
    };

    ui.querySelector("#mCancel").onclick = () => { 
        ui.querySelector("#mReset").click(); 
        ui.querySelector('[data-tab="tab-list"]').click();
        renderList(); 
    };

    // --- ACCIÓN: GUARDAR / ACTUALIZAR ---
    ui.querySelector("#mSave").onclick = () => {
        const agK = ui.querySelector("#mSelAgente").value;
        if(!agK) return alert("Selecciona un agente primero.");
        
        let itm = state.editIdx !== null ? data[state.editIdx] : {...state.tempItem};
        const info = db[agK];
        
        if(!itm.dur || itm.dur === "0:00:00"){
            const autoTxt = ui.querySelector("#mAutoInfo").innerText;
            if(autoTxt.includes('|')){
                itm.dur = autoTxt.split('|')[0].trim();
                itm.f = autoTxt.split('|')[1].trim();
            }
        }

        Object.assign(itm, { 
            n: info.n, c: info.c, id: ui.querySelector("#mIdEdit").value, 
            dni: ui.querySelector("#mDni").value, idCli: ui.querySelector("#mCli").value, 
            ctx: ui.querySelector("#mCtx").value, feed: ui.querySelector("#mFeed").value, 
            fort: ui.querySelector("#mFort").value, debi: ui.querySelector("#mDebi").value, 
            mejo: ui.querySelector("#mMejo").value, hecho: ui.querySelector("#mStatus").value 
        });

        if(state.editIdx === null) data.push(itm);
        save(); 
        alert("Guardado."); 
        ui.querySelector("#mReset").click();
    };

    // --- ACCIONES: EXPORTACIONES ---
    ui.querySelector("#mCsv").onclick = () => {
        const filter = ui.querySelector("#expFilter").value;
        const filtered = data.filter(d => filter === "All" || d.hecho === filter);
        let csv = "\ufeffNombre;Citrix;ID Trans;Tiempo;Fecha;ID Smart;DNI;Resumen;Fortaleza;Debilidad;Mejora;Feedback;Estado\n";
        filtered.forEach(d => { csv += `"${(d.n||'').replace(/"/g,'""')}";"${(d.c||'').replace(/"/g,'""')}";"${(d.id||'').replace(/"/g,'""')}";"${(d.dur||'').replace(/"/g,'""')}";"${(d.f||'').replace(/"/g,'""')}";"${(d.idCli||'').replace(/"/g,'""')}";"${(d.dni||'').replace(/"/g,'""')}";"${(d.ctx||'').replace(/"/g,'""')}";"${(d.fort||'').replace(/"/g,'""')}";"${(d.debi||'').replace(/"/g,'""')}";"${(d.mejo||'').replace(/"/g,'""')}";"${(d.feed||'').replace(/"/g,'""')}";"${d.hecho}"\n`; });
        const a = Object.assign(document.createElement("a"), {href: URL.createObjectURL(new Blob([csv], {type:'text/csv'})), download: `Reporte_${filter}.csv`});
        a.click();
    };

    ui.querySelector("#mTxt").onclick = () => {
        const filter = ui.querySelector("#expFilter").value;
        const filtered = data.filter(d => filter === "All" || d.hecho === filter);
        const txt = filtered.map(d => getFullTxt(d) + "\n" + "=".repeat(30)).join("\n\n");
        const a = Object.assign(document.createElement("a"), {href: URL.createObjectURL(new Blob([txt], {type:'text/plain'})), download: `Monitoreos_${filter}.txt`});
        a.click();
    };

    // --- PARSER AVANZADO DE CSV / EXCEL PARA LOGRAR SOPORTAR SALTOS DE LÍNEA ---
    const parseCSVAvanzado = (texto) => {
        let lineas = [];
        let filaActual = [];
        let valorActual = "";
        let dentroComillas = false;
        
        // Detectar delimitador leyendo la primera línea analizable
        let delimitador = ";"; 
        if (texto.includes("\t") && !texto.includes(";")) delimitador = "\t";
        else if (texto.includes(",") && !texto.includes(";")) delimitador = ",";

        for (let i = 0; i < texto.length; i++) {
            let c = texto[i];
            let sig = texto[i + 1];

            if (c === '"') {
                if (dentroComillas && sig === '"') { // Comilla doble escapada
                    valorActual += '"';
                    i++;
                } else { // Cambiar estado de lectura de comillas
                    dentroComillas = !dentroComillas;
                }
            } else if (c === delimitador && !dentroComillas) {
                filaActual.push(valorActual.trim());
                valorActual = "";
            } else if ((c === '\r' || c === '\n') && !dentroComillas) {
                if (c === '\r' && sig === '\n') i++; 
                filaActual.push(valorActual.trim());
                if (filaActual.length > 1 || filaActual[0] !== "") {
                    lineas.push(filaActual);
                }
                filaActual = [];
                valorActual = "";
            } else {
                valorActual += c;
            }
        }
        if (valorActual || filaActual.length > 0) {
            filaActual.push(valorActual.trim());
            lineas.push(filaActual);
        }
        return lineas;
    };

    // --- ACCIÓN: IMPORTADOR COMPATIBLE CON EXCEL Y TEXTO LARGO ---
    ui.querySelector("#btnTriggerImport").onclick = () => ui.querySelector("#mImportFile").click();

    ui.querySelector("#mImportFile").onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(evt) {
            const contenido = evt.target.result;
            let nuevosRegistros = [];
            let importadosCont = 0;

            try {
                if (file.name.endsWith(".csv")) {
                    const matrizFilas = parseCSVAvanzado(contenido);
                    if (matrizFilas.length < 2) throw new Error("Archivo vacío.");

                    // Validar si la primera fila es la cabecera
                    let inicioIdx = matrizFilas[0][0].toLowerCase().includes("nombre") ? 1 : 0;

                    for (let i = inicioIdx; i < matrizFilas.length; i++) {
                        let columnas = matrizFilas[i];
                        if (columnas.length >= 13) {
                            nuevosRegistros.push({
                                n: columnas[0], c: columnas[1], id: columnas[2], dur: columnas[3], f: columnas[4],
                                idCli: columnas[5], dni: columnas[6], ctx: columnas[7], fort: columnas[8],
                                debi: columnas[9], mejo: columnas[10], feed: columnas[11], hecho: columnas[12]
                            });
                        }
                    }
                } else if (file.name.endsWith(".txt")) {
                    const bloques = contenido.split("==============================");
                    bloques.forEach(bloque => {
                        let lines = bloque.trim().split("\n");
                        if (lines.length < 5) return;
                        
                        let obj = {};
                        let ultimaKey = null;

                        lines.forEach(line => {
                            let idxSep = line.indexOf(":");
                            // Validar cabeceras conocidas del TXT
                            let esCabecera = false;
                            let keysConocidas = ["AGENTE","CITRIX","ID TRANS","TIEMPO","FECHA","ID CLIENTE","DNI","RESUMEN","FORTALEZA","DEBILIDAD","MEJORA","FEEDBACK","ESTADO"];
                            
                            if (idxSep !== -1) {
                                let testKey = line.substring(0, idxSep).trim();
                                if (keysConocidas.includes(testKey)) esCabecera = true;
                            }

                            if (esCabecera) {
                                let key = line.substring(0, idxSep).trim();
                                let val = line.substring(idxSep + 1).trim();
                                ultimaKey = key;
                                
                                if (key === "AGENTE") obj.n = val;
                                else if (key === "CITRIX") obj.c = val;
                                else if (key === "ID TRANS") obj.id = val;
                                else if (key === "TIEMPO") obj.dur = val;
                                else if (key === "FECHA") obj.f = val;
                                else if (key === "ID CLIENTE") obj.idCli = val;
                                else if (key === "DNI") obj.dni = val;
                                else if (key === "RESUMEN") obj.ctx = val;
                                else if (key === "FORTALEZA") obj.fort = val;
                                else if (key === "DEBILIDAD") obj.debi = val;
                                else if (key === "MEJORA") obj.mejo = val;
                                else if (key === "FEEDBACK") obj.feed = val;
                                else if (key === "ESTADO") obj.hecho = val;
                            } else if (ultimaKey) {
                                // Adjuntar líneas huérfanas al último campo de texto (ej. saltos de línea del resumen)
                                let parrafo = "\n" + line.trim();
                                if (ultimaKey === "RESUMEN") obj.ctx += parrafo;
                                else if (ultimaKey === "FORTALEZA") obj.fort += parrafo;
                                else if (ultimaKey === "DEBILIDAD") obj.debi += parrafo;
                                else if (ultimaKey === "MEJORA") obj.mejo += parrafo;
                                else if (ultimaKey === "FEEDBACK") obj.feed += parrafo;
                            }
                        });
                        if (obj.id && obj.n) nuevosRegistros.push(obj);
                    });
                }

                if (nuevosRegistros.length === 0) {
                    alert("No se encontraron registros estructurados válidos.");
                    return;
                }

                // Cruzar registros para no duplicar IDs de transacción
                nuevosRegistros.forEach(nuevo => {
                    let existe = data.some(existente => existente.id === nuevo.id);
                    if (!existe) {
                        data.push(nuevo);
                        importadosCont++;
                    }
                });

                save();
                alert(`¡Proceso completado!\nSe agregaron ${importadosCont} monitoreos nuevos.`);
                ui.querySelector("#mReset").click();
                e.target.value = "";
            } catch (err) {
                alert("Error al procesar el archivo. Asegúrate de usar un formato nativo.");
                console.error(err);
            }
        };
        reader.readAsText(file);
    };

    ui.querySelector("#mClear").onclick = () => { if(confirm("¿Borrar todo?")){ data = []; save(); ui.querySelector("#mReset").click(); renderList(); } };

    // --- ACCIÓN: LIMPIAR FORMULARIO ---
    ui.querySelector("#mReset").onclick = () => {
        state.editIdx = null; state.tempItem = { dur: "0:00:00", f: "" };
        ui.querySelectorAll("input, textarea, select").forEach(i => {
            if(i.id === "mStatus") i.value = "NO";
            else if(i.id !== "fMes" && i.id !== "fHecho" && i.id !== "expFilter" && i.id !== "fMesTeam") i.value = "";
        });
        ui.querySelector("#mAutoInfo").innerText = "Esperando...";
        ui.querySelector("#mSelAgente").value = "";
        ui.querySelector("#mCancel").style.display = "none";
    };

    // --- LOGICA DEL ENRUTADOR DE PESTAÑAS ---
    ui.querySelectorAll(".t-btn").forEach(btn => btn.onclick = () => {
        ui.querySelectorAll(".t-btn").forEach(b => b.classList.remove("active")); ui.querySelectorAll(".tab-pane").forEach(p => p.style.display = "none");
        btn.classList.add("active"); ui.querySelector(`#${btn.dataset.tab}`).style.display = "block";
        preview.style.display = "none"; 
        if(btn.dataset.tab === "tab-list") renderList();
        if(btn.dataset.tab === "tab-team") {
            ui.querySelector("#fMesTeam").value = ui.querySelector("#fMes").value;
            renderTeam();
        }
    });

    ui.querySelector("#fMes").onchange = renderList;
    ui.querySelector("#fHecho").onchange = renderList;
    ui.querySelector("#fMesTeam").onchange = renderTeam;
    ui.querySelector("#mClose").onclick = () => { ui.remove(); preview.remove(); window.monitPro = false; };
    
    meses.forEach(m => {
        ui.querySelector("#fMes").append($("option", {value:m, textContent:m}));
        ui.querySelector("#fMesTeam").append($("option", {value:m, textContent:m}));
    });

    let drag=false,ox,oy;
    ui.querySelector("#mHeader").onmousedown = e => { drag=true; ox=e.clientX-ui.offsetLeft; oy=e.clientY-ui.offsetTop; };
    document.onmousemove = e => { if(drag) { ui.style.left=(e.clientX-ox)+'px'; ui.style.top=(e.clientY-oy)+'px'; ui.style.right='auto'; }};
    document.onmouseup = () => drag=false;
})();
