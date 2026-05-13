javascript:(() => {
  /* ================= FONT AWESOME ================= */
  if (!document.querySelector('link[data-fa]')) {
    const fa = document.createElement("link");
    fa.rel = "stylesheet";
    fa.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css";
    fa.dataset.fa = "true";
    document.head.appendChild(fa);
  }
  /* ================= UTILIDADES ================= */
  const xp = x => document.evaluate(x, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
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
  /* ================= LOADER ================= */
  function loaderShow() {
    const l = document.createElement("div");
    l.id = "loader";
    Object.assign(l.style, {
      position: "fixed",
      bottom: "20px",
      right: "20px",
      width: "300px",
      background: "rgba(42,0,63,.95)",
      color: "#fff",
      padding: "16px",
      borderRadius: "14px",
      fontFamily: "Segoe UI,sans-serif",
      fontSize: "13px",
      zIndex: 999999,
      boxShadow: "0 8px 20px rgba(0,0,0,.5)"
    });
    l.innerHTML = `
      <div id="ltext" style="margin-bottom:10px;font-weight:600">
        <i class="fa-solid fa-spinner fa-spin"></i> Iniciando…
      </div>
      <div style="height:8px;background:#ffffff30;border-radius:6px;overflow:hidden">
        <div id="lbar" style="height:100%;width:0%;background:#9b4dff"></div>
      </div>`;
    document.body.appendChild(l);
  }
  const loader = p => {
    const b = document.getElementById("lbar");
    if (b) b.style.width = p + "%";
  };
  const loaderText = t => {
    const lt = document.getElementById("ltext");
    if (lt) lt.innerHTML = t;
  };
  const loaderHide = () => {
    const l = document.getElementById("loader");
    if (l) l.remove();
  };
  /* ================= TOAST ÉXITO ================= */
  function toastOK(sel) {
    const t = document.createElement("div");
    Object.assign(t.style, {
      position: "fixed",
      top: "20px",
      right: "20px",
      background: "#2a003f",
      color: "#f6f0ff",
      padding: "14px 18px",
      borderRadius: "12px",
      fontFamily: "Segoe UI,sans-serif",
      fontSize: "13px",
      zIndex: 999999,
      boxShadow: "0 6px 18px rgba(0,0,0,.55)",
      maxWidth: "380px"
    });
    t.innerHTML = `
      <div style="display:flex;gap:10px;align-items:flex-start">
        <i class="fa-solid fa-bolt" style="color:#c58cff;margin-top:2px"></i>
        <div>
          <div style="font-weight:600;margin-bottom:4px"> Automatización completada </div>
          <div><b>Avería:</b><br>${sel}</div>
        </div>
      </div>`;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 9000);
  }
  /* ================= ICONOS ================= */
  function iconoAveria(t) {
    if (t.includes("INCOMUNICADO")) return "fa-ban";
    if (t.includes("MASIVA")) return "fa-tower-broadcast";
    if (t.includes("LENTITUD")) return "fa-gauge-high";
    if (t.includes("CORTES")) return "fa-plug-circle-xmark";
    if (t.includes("DESPERFECTO")) return "fa-screwdriver-wrench";
    if (t.includes("UMBRALES")) return "fa-chart-line";
    return "fa-circle-exclamation";
  }
  /* ================= MENÚ AVERÍAS ================= */
  function menuAverias(lista) {
    return new Promise(resolve => {
      const filtrada = lista.filter(t => !t.includes("TÉCNICO DIRECTO") && !t.includes("PROBLEMA CONFIGURACIÓN DE RED"));
      const ov = document.createElement("div");
      Object.assign(ov.style, {
        position: "fixed",
        inset: 0,
        background: "rgba(20,10,30,.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999999
      });
      const box = document.createElement("div");
      Object.assign(box.style, {
        background: "#260038",
        padding: "16px",
        borderRadius: "14px",
        width: "460px",
        color: "#eee",
        fontFamily: "Segoe UI,sans-serif"
      });
      box.innerHTML = `
        <div style="text-align:center;font-weight:600;margin-bottom:14px">
          <i class="fa-solid fa-list-check"></i> Tipo de avería
        </div>`;
      const grid = document.createElement("div");
      Object.assign(grid.style, {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "12px"
      });
      filtrada.forEach(t => {
        const b = document.createElement("button");
        b.innerHTML = `<i class="fa-solid ${iconoAveria(t)}"></i><span>${t}</span>`;
        Object.assign(b.style, {
          display: "flex",
          gap: "8px",
          alignItems: "center",
          padding: "10px",
          fontSize: "11px",
          background: "#34004d",
          color: "#f6f0ff",
          border: "none",
          borderRadius: "12px",
          cursor: "pointer",
          boxShadow: "5px 5px 10px #1a0026,-5px -5px 10px #54007c"
        });
        b.onmouseenter = () => b.style.boxShadow = "8px 8px 14px #14001e,-8px -8px 14px #620090";
        b.onmouseleave = () => b.style.boxShadow = "5px 5px 10px #1a0026,-5px -5px 10px #54007c";
        b.onmousedown = () => b.style.boxShadow = "inset 5px 5px 10px #1a0026,inset -5px -5px 10px #54007c";
        b.onmouseup = () => b.style.boxShadow = "8px 8px 14px #14001e,-8px -8px 14px #620090";
        b.onclick = () => {
          ov.remove();
          resolve(t);
        };
        grid.appendChild(b);
      });
      box.appendChild(grid);
      ov.appendChild(box);
      document.body.appendChild(ov);
    });
  }
  /* ================= REACT SELECT ================= */
  async function selectRS(input, pasos = 0) {
    if (!input) return;
    input.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    await wait(300);
    input.value = " ";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await wait(200);
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Backspace", bubbles: true }));
    await wait(200);
    for (let i = 0; i < pasos; i++) {
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
      await wait(200);
    }
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await wait(300);
  }
  /* ================= MAIN ================= */
  (async () => {
    try {
      const averias = [
        "INCOMUNICADO TOTAL - PROBLEMA DE SINCRONISMO - NEBAL/FFTH",
        "INCOMUNICADO TOTAL - PROBLEMA SINCRONISMO - HFC",
        "CLIENTE AFECTADO POR AVERÍA MASIVA",
        "RETROPORTABILIDAD",
        "LENTITUD EN LA CONEXIÓN",
        "CORTES EN EL SERVICIO",
        "FUERA DE UMBRALES",
        "NO NAVEGA",
        "INCOMUNICADO TOTAL - NO LEVANTA IP",
        "CPE CON FALLOS EN PUERTOS LAN",
        "DESPERFECTO INTERNO",
        "DESPERFECTO EXTERNO"
      ];
    
      const sel = await menuAverias(averias);
      if (!sel) return;
      document.getElementById("summary").value = sel;
      loaderShow();
      /* PRIORIDAD */
      loaderText("<i class='fa-solid fa-flag'></i> Prioridad");
      loader(15);
      await selectRS(document.querySelector("#react-select-customfield_16817-instance-input"), 0);

      /* GRUPO / TIPO */
      const esMasiva = sel.includes("MASIVA");
      if (!esMasiva) {
        loaderText("<i class='fa-solid fa-users'></i> Grupo");
        loader(35);
        await selectRS(document.querySelector("#insight-atlas-select-16800 input"), 0);
        loaderText("<i class='fa-solid fa-layer-group'></i> Tipo");
        loader(55);
        await selectRS(document.querySelector("#insight-atlas-select-16801 input"), 0);
      }

      /* SUBTIPO */
      let sub = 0;
      if (sel.includes("INCOMUNICADO") || sel.includes("NO LEVANTA")) sub = 1;
      else if (sel.includes("LENTITUD") || sel.includes("CORTES") || sel.includes("NO NAVEGA") || sel.includes("UMBRALES")) sub = 3;
      else if (sel.includes("DESPERFECTO")) sub = 2;
      if (!esMasiva && sub > 0) {
        loaderText("<i class='fa-solid fa-sitemap'></i> Subtipo");
        loader(70);
        await selectRS(document.querySelector("#insight-atlas-select-16802 input"), sub);
      }

      /* CD1 N/A*/
      loaderText("<i class='fa-solid fa-plug-circle-check'></i> CD1");
      loader(85);
      await selectRS(document.querySelector('#cd-1 input[id^="react-select"]'), 5);
      /* FECHAS */
      loaderText("<i class='fa-solid fa-calendar-check'></i> Fechas");
      loader(95);
      const now = new Date();
      xp('//*[@id="customfield_16825"]').value = fmt(now);
      const startDate = nextLab(new Date(now));
      startDate.setHours(8, 0, 0, 0);
      xp('//*[@id="customfield_16823"]').value = fmt(startDate);
      const endDate = new Date(startDate);
      endDate.setHours(16, 0, 0, 0);
      xp('//*[@id="customfield_16824"]').value = fmt(endDate);
      xp('//*[@id="customfield_16833"]').value = "OK";
      /* TELÉFONOS */
      const tp = document.getElementById("customfield_16820");
      const ta = document.getElementById("customfield_16821");
      if (tp && ta && tp.value) {
        ta.value = tp.value;
        ta.dispatchEvent(new Event("input", { bubbles: true }));
      }
      /* FIN */
      loaderText("<i class='fa-solid fa-circle-check'></i> Completado");
      loader(100);
      await wait(700);
      loaderHide();
      toastOK(sel);
    } catch (e) {
      loaderHide();
      alert(e.message);
    }
  })();
})();
