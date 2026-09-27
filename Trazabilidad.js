
(async () => {
  // ============================================
  // CONFIGURACIÓN
  // ============================================
  const CONFIG = {
    debug: true,
    timeout: 10000,
    interval: 150,
    retry: 1,
    tiposValidos: [
      "CAMBIO CM AVERIA BITSTREAM",
      "CAMBIO EQUIPO AVERIA FO LOWI",
      "CAMBIO EQUIPO AVERIA FTTH LOWI",
      "CAMBIO DEC"
      // ... más tipos
    ],
    selectores: {
      tabla: "[class*='tabla']",
      shipping: "[class*='shipping']",
      tablaEquipos: "[class*='equipos']"
    }
  };

  const STATE = {
    ots: []
  };

  // ============================================
  // DIÁLOGO: Seleccionar modo (XLS/MANUAL)
  // ============================================
  const askMode = () =>
    new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.style.cssText =
        "position:fixed;inset:0;background:rgba(15,23,42,.62);z-index:9999998;display:flex;align-items:center;justify-content:center";

      const dialog = document.createElement("div");
      dialog.style.cssText =
        "background:white;padding:20px;border-radius:8px;box-shadow:0 10px 40px rgba(0,0,0,0.3);z-index:9999999";
      dialog.innerHTML = `
        <h2>Selecciona modo</h2>
        <button id="btn-xls">Importar XLS</button>
        <button id="btn-manual">Modo Manual</button>
      `;

      document.body.appendChild(overlay);
      document.body.appendChild(dialog);

      document.getElementById("btn-xls").addEventListener("click", () => {
        overlay.remove();
        dialog.remove();
        resolve("xls");
      });

      document.getElementById("btn-manual").addEventListener("click", () => {
        overlay.remove();
        dialog.remove();
        resolve("manual");
      });
    });

  // ============================================
  // DIÁLOGO: Ingreso de texto manual
  // ============================================
  const askTXT = () =>
    new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.style.cssText =
        "position:fixed;inset:0;background:rgba(15,23,42,.62);z-index:9999998;display:flex;align-items:center;justify-content:center";

      const dialog = document.createElement("div");
      dialog.style.cssText =
        "background:white;padding:20px;border-radius:8px;box-shadow:0 10px 40px rgba(0,0,0,0.3);z-index:9999999;max-width:500px";
      dialog.innerHTML = `
        <h2>Ingresa OT (número de orden)</h2>
        <textarea id="ot-input" placeholder="Ingresa el número de OT aquí..." style="width:100%;height:100px;"></textarea>
        <button id="btn-confirm" style="margin-top:10px;">Confirmar</button>
      `;

      document.body.appendChild(overlay);
      document.body.appendChild(dialog);

      document.getElementById("btn-confirm").addEventListener("click", () => {
        const value = document.getElementById("ot-input").value.trim();
        overlay.remove();
        dialog.remove();
        resolve(value);
      });
    });

  // ============================================
  // EXTRACCIÓN DE DATOS: Filas de tabla
  // ============================================
  const rows = () => {
    const table = document.querySelector(CONFIG.selectores.tabla);
    if (!table) return [];

    const cells = table.querySelectorAll('[id*="-rows-row"][id*="-col"]');
    const map = {};

    for (const cell of cells) {
      const [rowId, colId] = cell.id.split("-").slice(-2);
      if (!map[rowId]) map[rowId] = [];
      map[rowId].push(cell.innerText || cell.textContent || "");
    }

    return Object.values(map);
  };

  // ============================================
  // EXTRACCIÓN: Todos los estados de trazabilidad
  // ============================================
  const extraerTodosEstados = (ot) => {
    const t = traceTable();
    if (!t) return [];

    return [...t.querySelectorAll("tr")].map((row) =>
      [...row.querySelectorAll("td")].map((x) =>
        (x.innerText || x.textContent || "").replace(/\s+/g, " ").trim()
      )
    );
  };

  // ============================================
  // NAVEGACIÓN: Abrir detalle de líneas
  // ============================================
  const abrirDetalleLineas = async () => {
    const tab = await waitElement(CONFIG.selectores.shipping);
    click(tab);
    return await waitElement(CONFIG.selectores.tablaEquipos);
  };

  // ============================================
  // EXTRACCIÓN: Equipo y Serie
  // ============================================
  const extraerEquipoSerie = () => {
    const tabla = document.querySelector(CONFIG.selectores.tablaEquipos);
    let equipo = "";
    let serie = "";

    if (!tabla) {
      return {
        equipo: "NO ENCONTRADO",
        serie: "NO ENCONTRADA"
      };
    }

    for (const fila of tabla.querySelectorAll("tr")) {
      const celdas = fila.querySelectorAll("td");
      if (celdas[0]) equipo = celdas[0].innerText.trim();
      if (celdas[1]) serie = celdas[1].innerText.trim();
    }

    return { equipo, serie };
  };

  // ============================================
  // EXPORTACIÓN: Formato TXT
  // ============================================
  const exportTXT = (data) => {
    let output = "";

    data.forEach((d, i) => {
      if (i) output += "\n\n";
      output += "ID CLIENTE: " + d.idCliente + "\n\n";
      output += "NUMERO DE OT: " + d.ot + "\n";
      output += "#Tracking OnTime Cliente: " + (d.tracking || "NO ENCONTRADO") + "\n";
      output += "# de modelos: " + d.modelos + "\n";
      output += "Estado: " + d.estado + "\n";
    });

    return output;
  };

  // ============================================
  // FUNCIÓN PRINCIPAL: Iniciar proceso
  // ============================================
  const iniciar = async () => {
    const modo = await askMode();

    if (!modo) return;

    if (modo === "xls") {
      STATE.ots = await modal.askXLS();
      if (STATE.ots === "__back") return iniciar();
      if (!STATE.ots.length) return;
      progress.create(STATE.ots.length);
    } else if (modo === "manual") {
      const ot = await askTXT();
      STATE.ots = [ot];
    }

    // Procesar cada OT
    for (const ot of STATE.ots) {
      console.log(`Procesando OT: ${ot}`);
      // ... lógica de procesamiento
    }
  };

  // ============================================
  // FUNCIONES AUXILIARES
  // ============================================
  const waitElement = async (selector, timeout = CONFIG.timeout) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const el = document.querySelector(selector);
      if (el) return el;
      await new Promise((r) => setTimeout(r, CONFIG.interval));
    }
    throw new Error(`Elemento no encontrado: ${selector}`);
  };

  const click = (element) => {
    element.click();
  };

  const traceTable = () => {
    return document.querySelector("[data-trace-table]");
  };

  // ============================================
  // INICIAR EJECUCIÓN
  // ============================================
  await iniciar();
})();
