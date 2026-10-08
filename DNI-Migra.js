(() => {
    const panelId = "dni-masivo-panel";
    const serviceIdsStorageKey = "lowi.dniMasivo.serviceIds";
    const isLowiHost = location.hostname === "www.lowi.es" || location.hostname.endsWith(".lowi.es");
    const isOrdersPage = isLowiHost && location.pathname.startsWith("/bo/orders/");

    if (!isOrdersPage) {
        alert("Ejecuta este script en /bo/orders/.");
        return;
    }
    document.getElementById(panelId)?.remove();

    function readSavedServiceIds() {
        if (Array.isArray(window.dniMasivoIdsServicio) && window.dniMasivoIdsServicio.length) {
            return [...window.dniMasivoIdsServicio];
        }
        try {
            const saved = JSON.parse(sessionStorage.getItem(serviceIdsStorageKey) || "[]");
            return Array.isArray(saved) ? saved : [];
        } catch {
            return [];
        }
    }

    runOrdersLookup();

    function runOrdersLookup() {
        const selectors = {
            input: "#id_query",
            search: "#search-button",
            table: "#order_tabledata",
            processing: "#order_tabledata_processing"
        };
        const panel = document.createElement("section");
        panel.id = panelId;
        panel.style.cssText = "position:fixed;z-index:2147483647;right:20px;bottom:20px;width:min(360px,calc(100vw - 40px));padding:14px;background:#fff;color:#222;border:1px solid #888;border-radius:8px;box-shadow:0 4px 18px #0004;font:14px Arial,sans-serif";
        panel.innerHTML = `
            <strong style="display:block;margin-bottom:8px">Consulta de IDs de servicio</strong>
            <textarea aria-label="IDs de cliente" placeholder="Un ID de cliente por línea" style="box-sizing:border-box;width:100%;height:110px;padding:8px;resize:vertical"></textarea>
            <div style="display:flex;gap:8px;margin-top:8px">
                <button type="button" data-action="start">Consultar IDs</button>
                <button type="button" data-action="cancel" disabled>Cancelar</button>
                <button type="button" data-action="copy" disabled>Copiar y guardar IDs</button>
                <button type="button" data-action="close" aria-label="Cerrar" title="Cerrar">×</button>
            </div>
            <div role="status" aria-live="polite" style="margin-top:8px;overflow-wrap:anywhere">Introduce los IDs, uno por línea.</div>
        `;
        document.body.appendChild(panel);

        const textarea = panel.querySelector("textarea");
        const startButton = panel.querySelector('[data-action="start"]');
        const cancelButton = panel.querySelector('[data-action="cancel"]');
        const copyButton = panel.querySelector('[data-action="copy"]');
        const status = panel.querySelector('[role="status"]');
        const matches = [];
        let cancelled = false;
        let running = false;

        function getColumnIndex(table, needles) {
            const headers = [...table.querySelectorAll("thead th")];
            return headers.findIndex(header => {
                const text = header.textContent.trim().toLocaleLowerCase();
                return needles.some(needle => text === needle || text.includes(needle));
            });
        }

        function readMatchingRows(table) {
            const rows = [...table.querySelectorAll("tbody tr")];
            if (!rows.length) return [];

            const idIndex = getColumnIndex(table, [
                "id compra",
                "id_compra",
                "id compra ",
                "id cliente",
                "id del cliente",
                "id cliente/usuario",
                "documento",
                "id"
            ]);
            const dniIndex = getColumnIndex(table, [
                "documento",
                "dni",
                "nif",
                "nif/cif",
                "numero de documento",
                "número de documento"
            ]);
            const origenIndex = getColumnIndex(table, ["origen"]);
            const estadoOrdenIndex = getColumnIndex(table, ["estado orden", "estado de la orden"]);

            const byDni = new Map();
            for (const row of rows) {
                const cells = [...row.cells];
                const origen = (cells[origenIndex]?.textContent || "").trim();
                const rowText = cells.map(cell => cell.textContent.trim()).join(" | ");
                if (!/traslado de fibra anterior/i.test(origen || rowText)) continue;

                const id = (cells[idIndex]?.textContent || "").trim();
                const dni = (cells[dniIndex]?.textContent || "").trim();
                const estadoOrden = (cells[estadoOrdenIndex]?.textContent || "").trim();

                if (!id || !dni || !estadoOrden) continue;

                const current = byDni.get(dni);
                if (!current) {
                    byDni.set(dni, { id, dni, estadoOrden, rowIndex: rows.indexOf(row) });
                    continue;
                }

                const shouldReplace =
                    (current.estadoOrden.toUpperCase() === "CANCELADO" && estadoOrden.toUpperCase() !== "CANCELADO") ||
                    (current.estadoOrden.toUpperCase() === estadoOrden.toUpperCase() && rows.indexOf(row) < current.rowIndex);

                if (shouldReplace) {
                    byDni.set(dni, { id, dni, estadoOrden, rowIndex: rows.indexOf(row) });
                }
            }

            return [...byDni.values()].sort((a, b) => a.rowIndex - b.rowIndex);
        }

        function updateCopyButtonState() {
            copyButton.disabled = matches.length === 0;
        }

        function waitForTableUpdate(table, timeoutMs = 60000) {
            const processing = document.querySelector(selectors.processing);
            return new Promise((resolve, reject) => {
                let changed = false;
                let settleTimer;
                const observer = new MutationObserver(() => {
                    changed = true;
                    checkSettled();
                });
                const finish = error => {
                    clearTimeout(timeoutTimer);
                    clearTimeout(settleTimer);
                    observer.disconnect();
                    error ? reject(error) : resolve();
                };
                const checkSettled = () => {
                    if (!changed || (processing && getComputedStyle(processing).display !== "none")) return;
                    clearTimeout(settleTimer);
                    settleTimer = setTimeout(() => finish(), 400);
                };
                const timeoutTimer = setTimeout(() => finish(new Error("La tabla no se actualizó a tiempo.")), timeoutMs);
                observer.observe(table.parentElement ?? table, {
                    attributes: true,
                    childList: true,
                    characterData: true,
                    subtree: true
                });
            });
        }

        async function requestSearch(input, button, value) {
            const table = document.querySelector(selectors.table);
            const before = table?.innerText || "";
            input.value = value;
            input.dispatchEvent(new Event("input", { bubbles: true }));
            input.dispatchEvent(new Event("change", { bubbles: true }));
            button.click();

            const startedAt = Date.now();
            while (Date.now() - startedAt < 20000) {
                const processing = document.querySelector(selectors.processing);
                const current = table?.innerText || "";
                if (current !== before && (!processing || getComputedStyle(processing).display === "none")) {
                    return;
                }
                await new Promise(resolve => setTimeout(resolve, 250));
            }

            throw new Error("La tabla no se actualizó a tiempo tras la búsqueda.");
        }

        startButton.addEventListener("click", async () => {
            const input = document.querySelector(selectors.input);
            const searchButton = document.querySelector(selectors.search);
            const table = document.querySelector(selectors.table);
            if (!input || !searchButton || !table) {
                status.textContent = "No se encuentran los controles de búsqueda y la tabla en esta página.";
                return;
            }

            const ids = [...new Set(textarea.value.split(/[\s,;]+/).map(id => id.trim()).filter(Boolean))];
            if (!ids.length) {
                status.textContent = "Introduce al menos un ID de cliente.";
                return;
            }

            running = true;
            cancelled = false;
            matches.length = 0;
            updateCopyButtonState();
            startButton.disabled = true;
            cancelButton.disabled = false;
            try {
                for (const [index, id] of ids.entries()) {
                    if (cancelled) break;
                    status.textContent = `Consultando ${index + 1} de ${ids.length}: ${id}`;
                    await requestSearch(input, searchButton, id);

                    const tableMatches = readMatchingRows(table);
                    for (const match of tableMatches) {
                        const exists = matches.some(item => item.id === match.id || item.dni === match.dni);
                        if (!exists) {
                            matches.push(match);
                        }
                    }
                    updateCopyButtonState();
                }
                status.textContent = `${cancelled ? "Consulta cancelada" : "Proceso terminado"}. ${matches.length} coincidencias con TRASLADO DE FIBRA ANTERIOR.`;
            } catch (error) {
                status.textContent = `Proceso detenido: ${error.message} Se conservaron ${matches.length} coincidencias.`;
            } finally {
                running = false;
                startButton.disabled = false;
                cancelButton.disabled = true;
                updateCopyButtonState();
            }
        });

        cancelButton.addEventListener("click", () => {
            if (!running) return;
            cancelled = true;
            status.textContent = "Cancelando al terminar la consulta actual...";
        });

        function downloadTextFile(fileName, text) {
            const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = fileName;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }

        copyButton.addEventListener("click", async () => {
            if (!matches.length) {
                status.textContent = "No hay coincidencias con TRASLADO DE FIBRA ANTERIOR para exportar.";
                return;
            }

            const outputLines = [
                "ID\tDNI\tEstado orden",
                ...matches.map(match => `${match.id}\t${match.dni}\t${match.estadoOrden}`)
            ];

            const outputText = outputLines.join("\n");
            window.dniMasivoIdsServicio = matches.map(match => match.id);
            let savedForTab = true;
            try {
                sessionStorage.setItem(serviceIdsStorageKey, JSON.stringify(window.dniMasivoIdsServicio));
            } catch {
                savedForTab = false;
            }
            try {
                await navigator.clipboard.writeText(outputText);
                downloadTextFile("traslado-fibra-anterior.txt", outputText);
                status.textContent = savedForTab
                    ? `${matches.length} coincidencias exportadas como ID | DNI | Estado orden y descargadas en TXT.`
                    : `${matches.length} coincidencias copiadas y descargadas. El navegador no permitió guardarlas en esta sesión.`;
            } catch {
                downloadTextFile("traslado-fibra-anterior.txt", outputText);
                status.textContent = savedForTab
                    ? "Coincidencias guardadas en esta sesión; el TXT se descargó y no se pudo copiar al portapapeles."
                    : "No se pudo copiar al portapapeles, pero sí se descargó el TXT con las coincidencias.";
            }
        });

        panel.querySelector('[data-action="close"]').addEventListener("click", () => panel.remove());
    }

})();
