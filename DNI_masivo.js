(() => {
    const panelId = "dni-masivo-panel";
    const serviceIdsStorageKey = "lowi.dniMasivo.serviceIds";
    const isLowiHost = location.hostname === "www.lowi.es" || location.hostname.endsWith(".lowi.es");
    const isOrdersPage = isLowiHost && location.pathname.startsWith("/bo/orders/");
    const isUserPage = isLowiHost && /^\/bo\/milowi\/user\/(?:\d+\/detail\/)?$/.test(location.pathname);

    if (!isOrdersPage && !isUserPage) {
        alert("Ejecuta este script en /bo/orders/ o /bo/milowi/user/.");
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

    if (isOrdersPage) {
        runOrdersLookup();
        return;
    }
    runTemplateMass();

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
        const serviceIds = [];
        let cancelled = false;
        let running = false;

        function getDocumentColumn(table) {
            const headers = [...table.querySelectorAll("thead th")];
            const index = headers.findIndex(header => header.textContent.trim().toLocaleLowerCase() === "documento");
            if (index < 0) throw new Error('No se encontró la columna "Documento".');
            return index;
        }

        function readFirstServiceId(table, columnIndex) {
            const firstRow = table.querySelector("tbody tr");
            const value = firstRow?.cells[columnIndex]?.textContent.trim();
            if (value) serviceIds.push(value);
            copyButton.disabled = serviceIds.length === 0;
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
            const updated = waitForTableUpdate(document.querySelector(selectors.table));
            input.value = value;
            input.dispatchEvent(new Event("input", { bubbles: true }));
            input.dispatchEvent(new Event("change", { bubbles: true }));
            button.click();
            await updated;
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

            let columnIndex;
            try {
                columnIndex = getDocumentColumn(table);
            } catch (error) {
                status.textContent = error.message;
                return;
            }

            running = true;
            cancelled = false;
            serviceIds.length = 0;
            copyButton.disabled = true;
            startButton.disabled = true;
            cancelButton.disabled = false;
            try {
                for (const [index, id] of ids.entries()) {
                    if (cancelled) break;
                    status.textContent = `Consultando ${index + 1} de ${ids.length}: ${id}`;
                    await requestSearch(input, searchButton, id);
                    readFirstServiceId(table, columnIndex);
                }
                status.textContent = `${cancelled ? "Consulta cancelada" : "Proceso terminado"}. ${serviceIds.length} IDs de servicio recopilados.`;
            } catch (error) {
                status.textContent = `Proceso detenido: ${error.message} Se conservaron ${serviceIds.length} IDs de servicio recopilados.`;
            } finally {
                running = false;
                startButton.disabled = false;
                cancelButton.disabled = true;
                copyButton.disabled = serviceIds.length === 0;
            }
        });

        cancelButton.addEventListener("click", () => {
            if (!running) return;
            cancelled = true;
            status.textContent = "Cancelando al terminar la consulta actual...";
        });

        copyButton.addEventListener("click", async () => {
            window.dniMasivoIdsServicio = [...serviceIds];
            let savedForTab = true;
            try {
                sessionStorage.setItem(serviceIdsStorageKey, JSON.stringify(window.dniMasivoIdsServicio));
            } catch {
                savedForTab = false;
            }
            try {
                await navigator.clipboard.writeText(window.dniMasivoIdsServicio.join("\n"));
                status.textContent = savedForTab
                    ? `${serviceIds.length} IDs copiados y guardados para la consulta de plantillas en esta pestaña.`
                    : `${serviceIds.length} IDs copiados. El navegador no permitió guardarlos para la siguiente página.`;
            } catch {
                status.textContent = savedForTab
                    ? "IDs guardados para la consulta de plantillas; no se pudo copiar al portapapeles."
                    : "No se pudieron guardar ni copiar los IDs; revisa los permisos del navegador.";
            }
        });

        panel.querySelector('[data-action="close"]').addEventListener("click", () => panel.remove());
    }

    function runTemplateMass() {
        const clean = (value) => value.replaceAll("(Modificar)", "").trim().split(/\s+/).join(" ");
        const templatePanel = document.createElement("section");
        templatePanel.id = panelId;
        templatePanel.style.cssText = "position:fixed;z-index:2147483647;right:20px;bottom:20px;width:min(390px,calc(100vw - 40px));padding:14px;background:#fff;color:#222;border:1px solid #888;border-radius:8px;box-shadow:0 4px 18px #0004;font:14px Arial,sans-serif";
        templatePanel.innerHTML = `
            <strong style="display:block;margin-bottom:8px">Plantilla CORTA masiva</strong>
            <textarea aria-label="DNI de prueba" placeholder="Un DNI sintético por línea" style="box-sizing:border-box;width:100%;height:100px;padding:8px;resize:vertical"></textarea>
            <textarea data-traces aria-label="Plantillas de trazabilidad" placeholder="Pega aquí las plantillas de trazabilidad al terminar las consultas" style="box-sizing:border-box;width:100%;height:130px;margin-top:8px;padding:8px;resize:vertical"></textarea>
            <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
                <button type="button" data-action="start">Consultar</button>
                <button type="button" data-action="pause" disabled>Pausar</button>
                <button type="button" data-action="stop" disabled>Detener</button>
                <button type="button" data-action="copy" disabled>Copiar plantillas</button>
                <button type="button" data-action="combine" disabled>Plantilla DNI +Traza</button>
                <button type="button" data-action="retry" disabled>Reprocesar errores</button>
                <button type="button" data-action="close" aria-label="Cerrar" title="Cerrar">×</button>
            </div>
            <div data-current style="margin-top:8px;overflow-wrap:anywhere"></div>
            <textarea data-output aria-label="Resultado DNI y trazabilidad" readonly placeholder="El resultado combinado aparecerá aquí" style="display:none;box-sizing:border-box;width:100%;height:180px;margin-top:8px;padding:8px;resize:vertical"></textarea>
            <div role="status" aria-live="polite" style="margin-top:8px;overflow-wrap:anywhere"></div>
        `;
        document.body.appendChild(templatePanel);

        const textarea = templatePanel.querySelector("textarea");
        const traceTextarea = templatePanel.querySelector("[data-traces]");
        const startButton = templatePanel.querySelector('[data-action="start"]');
        const pauseButton = templatePanel.querySelector('[data-action="pause"]');
        const stopButton = templatePanel.querySelector('[data-action="stop"]');
        const copyButton = templatePanel.querySelector('[data-action="copy"]');
        const combineButton = templatePanel.querySelector('[data-action="combine"]');
        const retryButton = templatePanel.querySelector('[data-action="retry"]');
        const current = templatePanel.querySelector("[data-current]");
        const output = templatePanel.querySelector("[data-output]");
        const status = templatePanel.querySelector('[role="status"]');
        const templatesByDni = new Map();
        let allDnis = [];
        let retryQueue = [];
        let retryMode = false;
        const savedServiceIds = readSavedServiceIds();
        window.dniMasivoIdsServicio = [...savedServiceIds];
        textarea.value = savedServiceIds.join("\n");
        let cancelled = false;
        let paused = false;
        let running = false;
        let workerWindows = [];
        let workerStates = [];
        const searchPageUrl = new URL("/bo/milowi/user/", location.origin);
        const maxWorkers = 20;
        const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
        status.textContent = savedServiceIds.length
            ? `${savedServiceIds.length} IDs recuperados. Pulsa Consultar para abrir la pestaña de trabajo.`
            : "No hay IDs guardados. Pega los DNI sintéticos en esta lista y pulsa Consultar.";

        async function control() {
            while (paused && !cancelled) await sleep(250);
            if (cancelled) throw new Error("Proceso detenido por el usuario.");
        }

        async function waitForPage(workerWindow, predicate, label, timeout = 60000) {
            const startedAt = Date.now();
            while (Date.now() - startedAt < timeout) {
                await control();
                if (!workerWindow || workerWindow.closed) throw new Error("La pestaña worker se cerró.");
                try {
                    const url = new URL(workerWindow.location.href);
                    const doc = workerWindow.document;
                    if (doc.readyState === "complete" && doc.body && predicate(doc, url)) return doc;
                } catch {
                    throw new Error("No se puede leer la pestaña. Comprueba que siga en el dominio Lowi.");
                }
                await sleep(250);
            }
            throw new Error(`Tiempo agotado esperando ${label}.`);
        }

        function fillInput(input, value) {
            const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), "value")?.set;
            if (setter) setter.call(input, value);
            else input.value = value;
            input.dispatchEvent(new Event("input", { bubbles: true }));
            input.dispatchEvent(new Event("change", { bubbles: true }));
        }

        function extractLabel(doc, labels) {
            for (const label of labels) {
                const element = [...doc.querySelectorAll("span,div,li,p")].find(node =>
                    node.textContent.includes(label)
                );
                if (element) {
                    let value = element.textContent.trim();
                    const labelIndex = value.indexOf(label);
                    if (labelIndex >= 0) {
                        value = value.slice(labelIndex + label.length).trim();
                        let lineEnd = value.indexOf("\n");
                        const pipe = value.indexOf("|");
                        if (lineEnd < 0 || (pipe >= 0 && pipe < lineEnd)) lineEnd = pipe;
                        if (lineEnd >= 0) value = value.slice(0, lineEnd).trim();
                        return clean(value);
                    }
                }
            }
            return "[No encontrado]";
        }

        function extractMobile(doc) {
            const text = doc.body.innerText;
            const mobiles = [];
            const pattern = /(?:^|\D)([67]\d{2}\s?\d{3}\s?\d{3})(?:\D|$)/g;
            let match;
            while ((match = pattern.exec(text)) !== null) {
                const mobile = match[1].replace(/\s+/g, "");
                if (!mobiles.includes(mobile)) mobiles.push(mobile);
            }
            return mobiles.length ? mobiles.join(" | ") : extractLabel(doc, ["Tlf. contacto:", "Movil:"]);
        }

        function extractAddress(doc) {
            const labels = [
                "Dirección de instalación:",
                "Direccion:",
                "Dirección facturación:"
            ];
            const endLabels = [
                "Tipo de huella:", "Tipo de instalación:", "Movil:", "Tlf. contacto:",
                "DNI:", "ID Cliente:", "Fecha creación:", "Segmento:", "Cuenta bancaria:",
                "Sap ID:", "App instalada:", "Suscripción ID:", "Tarifa:", "Fecha activación:",
                "Plan de suscripción actual:", "Linea móvil adicional :", "ICC:", "Portabilidad",
                "Operador donante:", "Cargo pendiente:", "Motivo de congelamiento:",
                "Factura en papel:", "Idioma de la factura:", "Crear Ticket", "Histórico de planes"
            ];
            for (const label of labels) {
                const element = [...doc.querySelectorAll("span,div,li,p")].find(node =>
                    node.textContent.includes(label)
                );
                if (element) {
                    const labelIndex = element.textContent.indexOf(label);
                    let address = element.textContent.slice(labelIndex + label.length).trim();
                    let sibling = element.nextSibling;
                    while (sibling) {
                        let text = "";
                        if (sibling.nodeType === Node.TEXT_NODE) text = sibling.textContent.trim();
                        else if (sibling.nodeType === Node.ELEMENT_NODE) text = sibling.textContent.trim();
                        if (endLabels.some(endLabel => text.includes(endLabel))) break;
                        address += ` ${text}`;
                        sibling = sibling.nextSibling;
                    }
                    address = clean(address);
                    for (const endLabel of endLabels) {
                        const endIndex = address.indexOf(endLabel);
                        if (endIndex > -1) address = address.slice(0, endIndex).trim();
                    }
                    return address;
                }
            }
            return "[No encontrado]";
        }

        function extractShortTemplate(doc) {
            let name = "[No encontrado]";
            try {
                const nameNode = doc.evaluate(
                    '//*[@id="content-main"]/div/div[3]/div[1]/span[1]',
                    doc,
                    null,
                    XPathResult.FIRST_ORDERED_NODE_TYPE,
                    null
                ).singleNodeValue;
                if (nameNode) name = clean(nameNode.textContent.replace("Nombre:", ""));
            } catch {}
            const dni = extractLabel(doc, ["DNI:", "NIE:"]);
            const customerId = extractLabel(doc, ["AMDOCS ID:", "ID Cliente:"]);
            const address = extractAddress(doc);
            const mobile = extractMobile(doc);
            return [
                `• Nombre: ${name}`,
                `• DNI: ${dni}`,
                `• ID: ${customerId}`,
                `• Dirección: ${address}`,
                `• # Móvil: ${mobile}`
            ].join("\n");
        }

        async function processDni(workerWindow, dni, workerIndex) {
            const searchDoc = await waitForPage(
                workerWindow,
                (doc, url) => url.pathname === searchPageUrl.pathname && doc.querySelector("#id_value"),
                "el formulario DNI / Email"
            );
            const input = searchDoc.querySelector("#id_value");
            const button = searchDoc.querySelector('input[type="submit"][value="Buscar"]');
            if (!input?.form || !button || button.form !== input.form) {
                throw new Error("No se encontró el formulario o el botón Buscar asociado al campo DNI / Email.");
            }
            input.focus();
            fillInput(input, dni);
            workerStates[workerIndex] = `Rellenando DNI ${dni}`;
            current.textContent = workerStates.join("\n");
            await sleep(300);
            await control();
            button.click();
            workerStates[workerIndex] = `Esperando ficha de ${dni}`;
            current.textContent = workerStates.join("\n");
            const detailDoc = await waitForPage(
                workerWindow,
                (doc, url) => /^\/bo\/milowi\/user\/\d+\/detail\/?$/.test(url.pathname) && doc.querySelector("#content-main"),
                `la ficha de ${dni}`
            );
            return extractShortTemplate(detailDoc);
        }

        async function returnToSearchPage(workerWindow) {
            if (!workerWindow || workerWindow.closed) throw new Error("La pestaña worker se cerró.");
            workerWindow.location.href = searchPageUrl.href;
            await waitForPage(
                workerWindow,
                (doc, url) => url.pathname === searchPageUrl.pathname && doc.querySelector("#id_value"),
                "el siguiente formulario"
            );
        }

        async function copyCombinedResult(text) {
            window.dniMasivoResultadoCombinado = text;
            output.value = text;
            output.style.display = "block";
            try {
                await navigator.clipboard.writeText(text);
                return true;
            } catch {
                output.focus();
                output.select();
                const copied = document.execCommand("copy");
                output.setSelectionRange(0, 0);
                return copied;
            }
        }

        startButton.addEventListener("click", async () => {
            const sourceIds = retryMode
                ? retryQueue
                : savedServiceIds.length
                    ? savedServiceIds
                    : textarea.value.split(/[\s,;]+/);
            const dnis = [...new Set(sourceIds.map(value => value.trim()).filter(Boolean))];
            if (!dnis.length) {
                status.textContent = "Introduce al menos un DNI sintético.";
                return;
            }
            const workerCount = Math.min(maxWorkers, dnis.length);
            workerWindows = [];
            for (let index = 0; index < workerCount; index++) {
                const workerWindow = window.open(
                    searchPageUrl.href,
                    `LOWI_TEMPLATE_WORKER_${Date.now()}_${index}`,
                    `width=1000,height=800,left=${20 + index * 35},top=${20 + index * 35}`
                );
                if (!workerWindow) {
                    workerWindows.forEach(worker => worker.close());
                    workerWindows = [];
                    status.textContent = "El navegador bloqueó una pestaña worker. Permite ventanas emergentes y vuelve a pulsar Consultar.";
                    return;
                }
                workerWindows.push(workerWindow);
            }
            if (!retryMode) {
                allDnis = [...dnis];
                templatesByDni.clear();
            }
            retryMode = false;
            retryQueue = [];
            retryButton.disabled = true;
            running = true;
            cancelled = false;
            paused = false;
            workerStates = Array.from({ length: workerCount }, (_, index) => `Worker ${index + 1}: iniciando`);
            copyButton.disabled = true;
            startButton.disabled = true;
            pauseButton.disabled = false;
            stopButton.disabled = false;
            pauseButton.textContent = "Pausar";
            try {
                let nextIndex = 0;
                let completed = 0;
                const errors = [];

                async function runWorker(workerWindow, workerIndex) {
                    while (!cancelled) {
                        try {
                            await control();
                        } catch {
                            break;
                        }
                        const index = nextIndex++;
                        if (index >= dnis.length) break;
                        const dni = dnis[index];
                        workerStates[workerIndex] = `Worker ${workerIndex + 1}: consulta ${index + 1}/${dnis.length} (${dni})`;
                        current.textContent = workerStates.join("\n");
                        status.textContent = `${completed}/${dnis.length} consultas completadas; ${workerCount} workers activos.`;
                        try {
                            const template = await processDni(workerWindow, dni, workerIndex);
                            templatesByDni.set(dni, template);
                            copyButton.disabled = false;
                        } catch (error) {
                            if (cancelled) break;
                            errors.push(`${dni}: ${error.message}`);
                            workerStates[workerIndex] = `Worker ${workerIndex + 1}: error en ${dni}`;
                            current.textContent = workerStates.join("\n");
                        }
                        completed++;
                        status.textContent = `${completed}/${dnis.length} consultas completadas; ${errors.length} errores.`;
                        if (cancelled) break;
                        if (nextIndex < dnis.length) {
                            try {
                                await returnToSearchPage(workerWindow);
                            } catch (error) {
                                errors.push(`Worker ${workerIndex + 1}: ${error.message}`);
                                workerStates[workerIndex] = `Worker ${workerIndex + 1}: detenido`;
                                current.textContent = workerStates.join("\n");
                                break;
                            }
                        }
                    }
                }

                await Promise.all(workerWindows.map((workerWindow, index) => runWorker(workerWindow, index)));
                const templateCount = allDnis.filter(dni => templatesByDni.has(dni)).length;
                status.textContent = `${cancelled ? "Proceso detenido" : "Proceso terminado"}. ${templateCount}/${allDnis.length} plantillas generadas; ${errors.length} errores en este intento.`;
                if (errors.length) current.textContent = `${current.textContent}\nErrores:\n${errors.join("\n")}`;
            } catch (error) {
                status.textContent = `${error.message} Se conservaron ${templatesByDni.size} plantillas.`;
            } finally {
                running = false;
                startButton.disabled = false;
                pauseButton.disabled = true;
                stopButton.disabled = true;
                retryQueue = dnis.filter(dni => !templatesByDni.has(dni));
                retryButton.disabled = retryQueue.length === 0;
                copyButton.disabled = templatesByDni.size === 0;
                combineButton.disabled = templatesByDni.size === 0;
                workerWindows.forEach(worker => {
                    if (!worker.closed) worker.close();
                });
                workerWindows = [];
            }
        });

        pauseButton.addEventListener("click", () => {
            if (!running) return;
            paused = !paused;
            pauseButton.textContent = paused ? "Reanudar" : "Pausar";
            status.textContent = paused ? "Proceso pausado." : "Continuando proceso...";
        });

        stopButton.addEventListener("click", () => {
            if (!running) return;
            cancelled = true;
            paused = false;
            status.textContent = "Deteniendo proceso...";
        });

        retryButton.addEventListener("click", () => {
            if (running || !retryQueue.length) return;
            textarea.value = retryQueue.join("\n");
            retryMode = true;
            startButton.click();
        });

        copyButton.addEventListener("click", async () => {
            try {
                const completedTemplates = allDnis.map(dni => templatesByDni.get(dni)).filter(Boolean);
                await navigator.clipboard.writeText(completedTemplates.join("\n\n-----------------------------------------\n\n"));
                status.textContent = `${completedTemplates.length} plantillas copiadas.`;
            } catch {
                status.textContent = "No se pudo acceder al portapapeles. Comprueba los permisos del navegador.";
            }
        });

        combineButton.addEventListener("click", async () => {
            const traceStarts = [...traceTextarea.value.matchAll(/^ID CLIENTE:\s*([^\r\n]+)\s*$/gim)];
            if (!traceStarts.length) {
                status.textContent = "Pega las plantillas de trazabilidad; no se encontró ningún ID CLIENTE.";
                return;
            }

            const tracesByClientId = new Map();
            traceStarts.forEach((match, index) => {
                const start = match.index;
                const end = traceStarts[index + 1]?.index ?? traceTextarea.value.length;
                const block = traceTextarea.value
                    .slice(start, end)
                    .replace(/^ID CLIENTE:\s*[^\r\n]+(?:\r?\n|$)/i, "")
                    .replace(/[\r\n-]+$/g, "")
                    .trim();
                tracesByClientId.set(match[1].trim(), block);
            });

            const generatedTemplates = allDnis
                .map(dni => ({ dni, template: templatesByDni.get(dni) }))
                .filter(result => result.template);
            const combined = [];
            const matchedTraceIds = new Set();
            let missing = 0;
            for (const { dni, template } of generatedTemplates) {
                const clientId = template.match(/^• ID:\s*(.+)$/m)?.[1]?.trim();
                const trace = clientId && tracesByClientId.get(clientId);
                if (!trace) {
                    missing++;
                    continue;
                }
                matchedTraceIds.add(clientId);
                combined.push(`${template}\n\n${trace}`);
            }

            const withoutTemplate = allDnis.length - generatedTemplates.length;
            const unusedTraces = [...tracesByClientId.keys()].filter(id => !matchedTraceIds.has(id)).length;
            const summary = `Combinadas: ${combined.length}/${generatedTemplates.length} plantillas generadas. Sin traza: ${missing}. Consultas sin plantilla: ${withoutTemplate}. Trazas sin plantilla: ${unusedTraces}.`;
            if (!combined.length) {
                status.textContent = `No hubo plantillas para copiar. ${summary}`;
                return;
            }

            const combinedText = combined.join("\n\n-----------------------------------------\n\n");
            const copied = await copyCombinedResult(combinedText);
            status.textContent = copied
                ? `Plantillas DNI +Traza copiadas. ${summary}`
                : `No se pudo copiar automáticamente. El resultado está en el campo inferior para copiarlo manualmente. ${summary}`;
        });

        templatePanel.querySelector('[data-action="close"]').addEventListener("click", () => templatePanel.remove());
    }
})();
