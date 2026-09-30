javascript:(async () => {
    const CONFIG = {
        input: "#__input1-inner",
        ir: "#container-vodafonetrazabilidad---Home--filterBarHome-btnGo",
        tabla: "#container-vodafonetrazabilidad---Home--idProductsTable",
        processor: "#container-vodafonetrazabilidad---Detail--iconTabFilterProcessor-icon",
        historial: "#container-vodafonetrazabilidad---Detail--historyDetailTable-listUl",
        shipping: "#container-vodafonetrazabilidad---Detail--iconTabFilterShipping-tab",
        tablaEquipos: "#container-vodafonetrazabilidad---Detail--detailLineTable-tblBody",
        xpaths: {
            tracking: "/html/body/div[2]/div/div/div/div/div[2]/div[3]/div/div/div/div/article/div/div[1]/section/div/div/div[2]/div/div[3]/div/span",
            mobileLogistica: "/html/body/div[2]/div/div/div/div/div[2]/div[3]/div/div/div/div/article/div/div[1]/section/div/div/div[2]/div/div[1]/div/span",
            tablaEstados: "/html/body/div[2]/div/div/div/div/div[2]/div[3]/div/div/div/div/article/div/div[2]/div/div/div/div/div[2]/div/div/div/div/table",
            mensaje: "/html/body/div[1]/div[3]",
            ok: "/html/body/div[1]/div[3]/div[3]/div/button[1]",
        },
        tiposValidos: [
            "CAMBIO CM AVERIA BITSTREAM",
            "CAMBIO EQUIPO AVERIA FO LOWI",
            "CAMBIO EQUIPO AVERIA FTTH LOWI",
            "CAMBIO DECO LOWI",
        ],
    };

    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const getText = (node) =>
        ((node && (node.innerText || node.textContent)) || "")
            .replace(/\s+/g, " ")
            .trim();

    const xpath = (expression) => {
        try {
            return document.evaluate(
                expression,
                document,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null
            ).singleNodeValue;
        } catch (_) {
            return null;
        }
    };

    const noResults = () => {
        const message = xpath(CONFIG.xpaths.mensaje);
        const text = getText(message).toUpperCase();
        if (!text.includes("NO SE HAN ENCONTRADO RESULTADOS")) return false;
        const ok = xpath(CONFIG.xpaths.ok);
        if (ok) click(ok);
        return true;
    };

    const click = (element) => {
        if (!element) return false;

        try {
            element.scrollIntoView({ block: "center", inline: "center" });
            ["pointerdown", "mousedown", "mouseup", "click"].forEach((eventName) => {
                element.dispatchEvent(
                    new MouseEvent(eventName, {
                        bubbles: true,
                        cancelable: true,
                        view: window,
                    })
                );
            });
            return true;
        } catch (_) {
            try {
                element.click();
                return true;
            } catch (__ ) {
                return false;
            }
        }
    };

    const waitForCondition = (condition, timeout = 15000, description = "condición") =>
        new Promise((resolve, reject) => {
            let done = false;
            let observer = null;
            let timer = null;
            let scheduled = false;

            const cleanup = () => {
                if (observer) observer.disconnect();
                if (timer) clearTimeout(timer);
                document.removeEventListener("visibilitychange", checkLater);
                window.removeEventListener("pageshow", checkLater);
                window.removeEventListener("focus", checkLater);
            };

            const finish = (fn, value) => {
                if (done) return;
                done = true;
                cleanup();
                fn(value);
            };

            const check = () => {
                if (done) return;
                if (noResults()) {
                    return finish(reject, new Error("No se encontraron resultados para la OT introducida."));
                }
                try {
                    const value = condition();
                    if (value) return finish(resolve, value);
                } catch (error) {
                    return finish(reject, error);
                }
            };

            const checkLater = () => {
                if (scheduled) return;
                scheduled = true;
                Promise.resolve().then(() => {
                    scheduled = false;
                    check();
                });
            };

            observer = new MutationObserver(checkLater);
            observer.observe(document.documentElement, {
                subtree: true,
                childList: true,
                attributes: true,
                characterData: true,
            });
            document.addEventListener("visibilitychange", checkLater);
            window.addEventListener("pageshow", checkLater);
            window.addEventListener("focus", checkLater);

            timer = setTimeout(() => {
                finish(reject, new Error("No se encontró " + description + " en " + timeout + " ms."));
            }, timeout);

            check();
        });

    const waitElement = (selector, timeout = 15000) =>
        waitForCondition(() => document.querySelector(selector), timeout, "el elemento: " + selector);

    const getManualOT = () => {
        const input = document.querySelector(CONFIG.input);
        return (input && input.value ? input.value.trim() : "");
    };

    const setInput = (input, value) => {
        const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
        input.focus();

        if (descriptor && descriptor.set) {
            descriptor.set.call(input, "");
            input.dispatchEvent(new Event("input", { bubbles: true }));
            descriptor.set.call(input, value);
        } else {
            input.value = "";
            input.dispatchEvent(new Event("input", { bubbles: true }));
            input.value = value;
        }

        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
    };

    const rows = () => {
        const table = document.querySelector(CONFIG.tabla);
        if (!table) return [];

        const cells = table.querySelectorAll('[id*="-rows-row"][id*="-col"]');
        const map = {};

        for (const cell of cells) {
            const match = cell.id.match(/-rows-(row\d+)-col\d+/);
            if (!match) continue;

            const key = match[1];
            if (!map[key]) map[key] = { numero: key, elements: [], text: "" };

            map[key].elements.push(cell);
            const text = (cell.innerText || "").trim();
            if (text) map[key].text += " " + text;
        }

        return Object.values(map).map((row) => ({ ...row, text: row.text.trim() }));
    };

    const findRow = (ot) => {
        for (const row of rows()) {
            const text = (row.text || "").toUpperCase();
            if (!text.includes(String(ot))) continue;
            const tipo = CONFIG.tiposValidos.find((t) => text.includes(t));
            if (tipo) return { row, tipo };
        }
        return null;
    };

    const waitRow = (ot) =>
        waitForCondition(() => findRow(ot), 15000, "la fila correcta de la OT " + ot);

    const traceTable = () => {
        const byXPath = xpath(CONFIG.xpaths.tablaEstados);
        if (byXPath) return byXPath;
        const container = document.querySelector(CONFIG.historial);
        if (container) {
            const table = container.querySelector("table");
            if (table) return table;
            if (container.tagName && container.tagName.toLowerCase() === "table") return container;
        }
        return null;
    };

    const traceSignature = (table) =>
        table
            ? [...table.querySelectorAll("tr")]
                  .map((row) =>
                      [...row.querySelectorAll("td")]
                          .map((cell) =>
                              (cell.innerText || cell.textContent || "")
                                  .replace(/\s+/g, " ")
                                  .trim()
                          )
                          .join("|")
                  )
                  .join("||")
            : "";

    const waitTrace = (previousSignature = "", timeout = 15000) =>
        new Promise((resolve, reject) => {
            let done = false;
            let observer = null;
            let timer = null;
            let stableTimer = null;
            let lastSignature = "";

            const cleanup = () => {
                if (observer) observer.disconnect();
                if (timer) clearTimeout(timer);
                if (stableTimer) clearTimeout(stableTimer);
            };

            const finish = (fn, value) => {
                if (done) return;
                done = true;
                cleanup();
                fn(value);
            };

            const check = () => {
                if (done) return;
                const table = traceTable();
                if (!table || table.querySelectorAll("tr").length <= 1) return;

                const signature = traceSignature(table);
                if (previousSignature && signature === previousSignature) return;
                if (signature !== lastSignature) {
                    lastSignature = signature;
                    if (stableTimer) clearTimeout(stableTimer);
                    stableTimer = setTimeout(() => {
                        const current = traceTable();
                        const currentSignature = traceSignature(current);
                        if (
                            current &&
                            currentSignature === lastSignature &&
                            (!previousSignature || currentSignature !== previousSignature)
                        ) {
                            finish(resolve, current);
                        }
                    }, 700);
                }
            };

            observer = new MutationObserver(check);
            observer.observe(document.documentElement, {
                subtree: true,
                childList: true,
                attributes: true,
                characterData: true,
            });

            document.addEventListener("visibilitychange", check);
            window.addEventListener("pageshow", check);
            window.addEventListener("focus", check);

            timer = setTimeout(() => {
                finish(reject, new Error("No se encontró la tabla de estados logísticos actualizada en " + timeout + " ms."));
            }, timeout);

            check();
        });

    const firstState = (ot) => {
        const table = traceTable();
        if (!table) throw new Error("No se encontró la tabla de estados.");

        for (const row of table.querySelectorAll("tr")) {
            const cells = [...row.querySelectorAll("td")];
            if (cells.length < 4) continue;

            const values = cells.map((cell) => (cell.innerText || "").trim());
            let dateIndex = -1;
            for (let i = 0; i < values.length; i++) {
                if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(values[i])) {
                    dateIndex = i;
                    break;
                }
            }

            const timeIndex = dateIndex >= 0 ? dateIndex + 1 : -1;
            if (dateIndex >= 2 && values[timeIndex] && /^\d{1,2}:\d{2}:\d{2}$/.test(values[timeIndex])) {
                let status = values[dateIndex - 2];
                let description = values[dateIndex - 1];

                if (values.length >= 5 && !values[0]) {
                    status = values[1];
                    description = values[2];
                }

                return {
                    numeroOrden: ot,
                    estadoLogistico: status,
                    descripcion: description,
                    fechaEstado: values[dateIndex],
                    horaEstado: values[timeIndex],
                };
            }
        }

        throw new Error("No fue posible identificar el estado logístico.");
    };

    const extraerTracking = () => {
        const node = xpath(CONFIG.xpaths.tracking);
        if (!node) return "";
        const text = getText(node);
        const match = text.match(/Nº\s*Tracking\s*:\s*(\S+)/i);
        return match ? match[1] : text.replace(/^Nº\s*Tracking\s*:\s*/i, "").trim();
    };

    const extraerMovilLogistica = () => {
        const node = xpath(CONFIG.xpaths.mobileLogistica);
        return node ? getText(node).replace(/^Tel[eé]fono\s*:\s*/i, "") : "";
    };

    const getClienteId = () => {
        const patrones = [
            /ID\s*CLIENTE\s*[:\-]?\s*(\d+)/i,
            /ID\s*Cliente\s*[:\-]?\s*(\d+)/i,
            /ID\s*[:\-]?\s*(\d+)/i,
        ];

        const textoGeneral = document.body.innerText || document.body.textContent || "";

        for (const patron of patrones) {
            const match = textoGeneral.match(patron);
            if (match) return match[1].trim();
        }

        const nodos = Array.from(document.querySelectorAll("*"));
        for (const nodo of nodos) {
            const texto = getText(nodo);
            for (const patron of patrones) {
                const match = texto.match(patron);
                if (match) return match[1].trim();
            }
        }

        return "NO ENCONTRADO";
    };

    const extraerEstados = () => {
        const tabla = traceTable();
        if (!tabla) return [];

        return [...tabla.querySelectorAll("tr")]
            .map((row) => [...row.querySelectorAll("td")].map((cell) => getText(cell)))
            .filter((cells) => cells.length >= 4)
            .map((cells) => {
                let dateIndex = cells.findIndex((cell) => /^\d{1,2}[\/-]\d{1,2}[\/-]\d{4}$/.test(cell));
                if (dateIndex < 2 || !/^\d{1,2}:\d{2}:\d{2}$/.test(cells[dateIndex + 1] || "")) return null;

                let situation = cells[dateIndex - 2] || "";
                let description = cells[dateIndex - 1] || "";
                if (cells.length >= 5 && !cells[0]) {
                    situation = cells[1] || "";
                    description = cells[2] || "";
                }

                return {
                    situacion: situation,
                    descripcion: description,
                    fecha: cells[dateIndex] || "",
                    hora: cells[dateIndex + 1] || "",
                };
            })
            .filter(Boolean);
    };

    const extraerEquipoSerie = () => {
        const tabla = document.querySelector(CONFIG.tablaEquipos);
        let equipo = "";
        let serie = "";

        if (!tabla) return { equipo: "NO ENCONTRADO", serie: "NO ENCONTRADA" };

        for (const fila of tabla.querySelectorAll("tr")) {
            const celdas = Array.from(fila.querySelectorAll("td")).map((celda) =>
                (celda.innerText || celda.textContent || "").replace(/\s+/g, " ").trim()
            );

            if (celdas.length >= 6 && celdas[5] && celdas[5] !== "-") {
                equipo = celdas[3] || equipo;
                serie = celdas[5];
                break;
            }
        }

        return { equipo: equipo || "NO ENCONTRADO", serie: serie || "NO ENCONTRADA" };
    };

    const construirPlantilla = ({ idCliente, ot, tracking, movilLogistica, equipo, serie, estados }) => {
        let salida = "";

        salida += "ID CLIENTE: " + idCliente + "\n\n";
        salida += "NUMERO DE OT: " + ot + "\n";
        salida += "#Tracking OnTime Cliente: " + (tracking || "NO ENCONTRADO") + "\n";
        salida += "# de movil que contacta logistica: " + (movilLogistica || "NO ENCONTRADO") + "\n";
        salida += "LINEA LOGISTICA ONTIME: 900801929 | LINEA WHATSAPP: 689620151\n\n";
        salida += "EQUIPO: " + equipo + "\n";
        salida += "NUMERO DE SERIE/MAC: " + serie + "\n\n\n";
        salida += "VALIDACION TRAZABILIDAD:\n\n";
        salida += "SITUACION      DESCRIPCIÓN                   FECHA DE ESTADO     HORA DE ESTADO\n";
        salida += "-------------------------------------------------------------------------------------\n";

        if (estados.length) {
            estados.forEach((estado) => {
                salida +=
                    String(estado.situacion || "").padEnd(15, " ") +
                    " " +
                    String(estado.descripcion || "").padEnd(30, " ") +
                    " " +
                    String(estado.fecha || "").padEnd(20, " ") +
                    " " +
                    String(estado.hora || "") +
                    "\n";
            });
        } else {
            salida += "SIN TRAZABILIDAD ENCONTRADA\n";
        }

        salida += "\n------------------------------------\n";
        return salida;
    };

    const buscarOT = async () => {
        const ot = getManualOT();
        if (!/^\d{9}$/.test(ot)) {
            throw new Error("Escribe una OT válida en el campo antes de ejecutar el script.");
        }

        const input = document.querySelector(CONFIG.input);
        if (!input) {
            throw new Error("No se encontró el campo del input de OT.");
        }

        const ir = await waitElement(CONFIG.ir);
        click(ir);

        await waitElement(CONFIG.tabla);
        const found = await waitRow(ot);

        let cell =
            found.row.elements.find((element) => (element.innerText || "").trim() === String(ot)) ||
            document.querySelector(
                "#container-vodafonetrazabilidad---Home--idProductsTable-rows-" +
                    found.row.numero +
                    "-col1"
            );

        if (!cell) cell = found.row.elements[1] || found.row.elements[0];
        if (!cell) throw new Error("No se encontró la celda de la OT.");

        click(cell);

        const previousTrace = traceTable();
        const previousTraceSignature = traceSignature(previousTrace);

        const processor = await waitElement(CONFIG.processor);
        click(processor);
        await wait(250);
        await waitTrace(previousTraceSignature);

        return { ot, firstState: firstState(ot) };
    };

    const main = async () => {
        const { ot, firstState: estado } = await buscarOT();
        const idCliente = getClienteId();
        const tracking = extraerTracking();
        const movilLogistica = extraerMovilLogistica();
        const estados = extraerEstados();

        const tab = document.getElementById("container-vodafonetrazabilidad---Detail--iconTabFilterShipping-tab");
        if (!tab) throw new Error("No se encontró la pestaña de envío.");
        click(tab);
        await waitElement(CONFIG.tablaEquipos);
        await wait(500);

        const { equipo, serie } = extraerEquipoSerie();
        const resultado = construirPlantilla({
            idCliente,
            ot,
            tracking,
            movilLogistica,
            equipo,
            serie,
            estados,
        });

        console.log(resultado);

        const area = document.createElement("textarea");
        area.value = resultado;
        document.body.appendChild(area);
        area.select();
        document.execCommand("copy");
        area.remove();

        console.log("Información completa copiada correctamente");
        console.log("Estado extraído:", estado);
    };

    await main();
})();