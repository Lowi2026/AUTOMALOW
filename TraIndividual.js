javascript:(() => {
    const getText = (node) =>
        (node && (node.innerText || node.textContent || ""))
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

    const extraerTracking = () => {
        const texto = document.body.innerText || document.body.textContent || "";
        const match = texto.match(/N[º°]?\s*Tracking\s*[:\-]?\s*(\S+)/i) ||
            texto.match(/Tracking\s*OnTime\s*Cliente\s*[:\-]?\s*(\S+)/i) ||
            texto.match(/Tracking\s*:\s*(\S+)/i);

        if (match) return match[1].trim();

        const nodo = xpath("/html/body//span[contains(., 'Tracking') or contains(., 'tracking')]" );
        return nodo ? getText(nodo).replace(/^.*Tracking\s*[:\-]?\s*/i, "").trim() : "NO ENCONTRADO";
    };

    const extraerMovilLogistica = () => {
        const texto = document.body.innerText || document.body.textContent || "";
        const match = texto.match(/m[óo]vil\s*que\s*contacta\s*logistica\s*[:\-]?\s*(\d+)/i) ||
            texto.match(/contacta\s*logistica\s*[:\-]?\s*(\d+)/i) ||
            texto.match(/\b\d{9}\b/);

        if (match) return match[1] ? match[1].trim() : match[0].trim();

        const nodo = xpath("/html/body//span[contains(., 'móvil') or contains(., 'movil') or contains(., 'logistica')]" );
        return nodo ? getText(nodo).replace(/^.*?(\d{9})$/, "$1").trim() : "NO ENCONTRADO";
    };

    const extraerEstados = () => {
        const tabla = document.querySelector(
            "#container-vodafonetrazabilidad---Detail--historyDetailTable-listUl"
        );

        if (!tabla) return [];

        const filas = [];
        tabla.querySelectorAll("tbody tr").forEach((fila) => {
            const celdas = Array.from(fila.querySelectorAll("td")).map((celda) =>
                (celda.innerText || celda.textContent || "").replace(/\s+/g, " ").trim()
            );

            if (celdas.length >= 5) {
                filas.push({
                    situacion: celdas[1] || "",
                    descripcion: celdas[2] || "",
                    fecha: celdas[3] || "",
                    hora: celdas[4] || "",
                });
            }
        });

        return filas;
    };

    const extraerEquipoSerie = () => {
        const tabla = document.querySelector(
            "#container-vodafonetrazabilidad---Detail--detailLineTable-tblBody"
        );

        let equipo = "";
        let serie = "";

        if (!tabla) {
            return { equipo: "NO ENCONTRADO", serie: "NO ENCONTRADA" };
        }

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

        return {
            equipo: equipo || "NO ENCONTRADO",
            serie: serie || "NO ENCONTRADA",
        };
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

    const main = () => {
        const tabla = document.querySelector(
            "#container-vodafonetrazabilidad---Detail--historyDetailTable-listUl"
        );

        if (!tabla) {
            console.error("No se encontró la tabla de trazabilidad");
            return;
        }

        const ot = document.querySelector(
            "#container-vodafonetrazabilidad---Home--idProductsTable-rows-row0-col1"
        )?.innerText.trim() || "NO ENCONTRADA";

        const idCliente = getClienteId();
        const estados = extraerEstados();
        const tracking = extraerTracking();
        const movilLogistica = extraerMovilLogistica();

        const tab = document.getElementById(
            "container-vodafonetrazabilidad---Detail--iconTabFilterShipping-tab"
        );

        if (tab) {
            click(tab);
        }

        setTimeout(() => {
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
        }, 500);
    };

    main();
})();