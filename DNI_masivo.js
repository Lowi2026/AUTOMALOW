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
        templatePanel.style.cssText = "position:fixed;z-index:2147483647;right:20px;bottom:20px;width:min(390px,calc(100vw - 40px));max-height:calc(100vh - 40px);box-sizing:border-box;overflow-y:auto;padding:14px;background:#fff;color:#222;border:1px solid #888;border-radius:8px;box-shadow:0 4px 18px #0004;font:14px Arial,sans-serif";
        templatePanel.innerHTML = `
            <strong style="display:block;margin-bottom:8px">Plantilla CORTA masiva</strong>
            <label style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
                <input data-full-template-mode type="checkbox">
                Plantilla DNI completa
            </label>
            <details open style="margin-bottom:8px">
                <summary style="cursor:pointer">Opciones de consulta</summary>
                <textarea data-dni-input aria-label="DNI de prueba" placeholder="Un DNI sintético por línea" style="box-sizing:border-box;width:100%;height:100px;margin-top:8px;padding:8px;resize:vertical"></textarea>
                <textarea data-traces aria-label="Plantillas de trazabilidad" placeholder="Pega aquí las plantillas de trazabilidad al terminar las consultas" style="box-sizing:border-box;width:100%;height:130px;margin-top:8px;padding:8px;resize:vertical"></textarea>
            </details>
            <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
                <button type="button" data-action="start">Consultar</button>
                <button type="button" data-action="pause" disabled>Pausar</button>
                <button type="button" data-action="stop" disabled>Detener</button>
                <button type="button" data-action="copy" disabled>Copiar plantillas</button>
                <button type="button" data-action="combine" disabled>Plantilla DNI +Traza</button>
                <button type="button" data-action="retry" disabled>Reprocesar errores</button>
                <button type="button" data-action="close" aria-label="Cerrar" title="Cerrar">×</button>
            </div>
            <section data-errors role="alert" aria-live="assertive" aria-label="Errores y fichas sin pareja" hidden style="margin-top:8px;padding:8px;border:1px solid #c62828;border-radius:4px;background:#fff0f0;color:#8b0000;overflow-wrap:anywhere">
                <strong>Errores y fichas sin pareja</strong>
                <ul data-error-list style="margin:4px 0 0;padding-left:20px"></ul>
            </section>
            <section data-templates hidden style="margin-top:8px">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
                    <strong>Plantillas generadas</strong>
                    <button type="button" data-action="copy-generated">Copiar plantillas</button>
                </div>
                <textarea data-templates-output aria-label="Plantillas generadas" readonly style="box-sizing:border-box;width:100%;height:180px;margin-top:4px;padding:8px;resize:vertical"></textarea>
            </section>
            <div data-output-container hidden style="margin-top:8px">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
                    <strong>Resultado DNI + trazabilidad</strong>
                    <button type="button" data-action="copy-result">Copiar resultado</button>
                </div>
                <textarea data-output aria-label="Resultado DNI y trazabilidad" readonly placeholder="El resultado combinado aparecerá aquí" style="box-sizing:border-box;width:100%;height:180px;margin-top:4px;padding:8px;resize:vertical"></textarea>
            </div>
            <div role="status" aria-live="polite" style="margin-top:8px;overflow-wrap:anywhere"></div>
        `;
        document.body.appendChild(templatePanel);

        const textarea = templatePanel.querySelector("[data-dni-input]");
        const traceTextarea = templatePanel.querySelector("[data-traces]");
        const fullTemplateMode = templatePanel.querySelector("[data-full-template-mode]");
        const startButton = templatePanel.querySelector('[data-action="start"]');
        const pauseButton = templatePanel.querySelector('[data-action="pause"]');
        const stopButton = templatePanel.querySelector('[data-action="stop"]');
        const copyButton = templatePanel.querySelector('[data-action="copy"]');
        const combineButton = templatePanel.querySelector('[data-action="combine"]');
        const retryButton = templatePanel.querySelector('[data-action="retry"]');
        const errorsPanel = templatePanel.querySelector("[data-errors]");
        const errorList = templatePanel.querySelector("[data-error-list]");
        const templatesPanel = templatePanel.querySelector("[data-templates]");
        const templatesOutput = templatePanel.querySelector("[data-templates-output]");
        const outputContainer = templatePanel.querySelector("[data-output-container]");
        const output = templatePanel.querySelector("[data-output]");
        const copyGeneratedButton = templatePanel.querySelector('[data-action="copy-generated"]');
        const copyResultButton = templatePanel.querySelector('[data-action="copy-result"]');
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
        const searchPageUrl = new URL("/bo/milowi/user/", location.origin);
        const maxWorkers = 20;
        const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

        function updateModeControls() {
            const useCompleteTemplate = fullTemplateMode.checked;
            textarea.setAttribute("aria-label", useCompleteTemplate ? "Plantilla completa DNI" : "DNI de prueba");
            textarea.placeholder = useCompleteTemplate
                ? "Pega aquí la plantilla completa del DNI"
                : "Un DNI sintético por línea";
            traceTextarea.placeholder = useCompleteTemplate
                ? "Pega aquí las plantillas de trazabilidad; se usará la primera"
                : "Pega aquí las plantillas de trazabilidad al terminar las consultas";
            startButton.disabled = running || useCompleteTemplate;
            pauseButton.disabled = !running || useCompleteTemplate;
            stopButton.disabled = !running || useCompleteTemplate;
            copyButton.disabled = useCompleteTemplate || templatesByDni.size === 0;
            retryButton.disabled = useCompleteTemplate || running || retryQueue.length === 0;
            combineButton.disabled = !useCompleteTemplate && templatesByDni.size === 0;
        }

        function renderErrors(errors) {
            errorList.replaceChildren();
            errorsPanel.hidden = errors.length === 0;
            errors.forEach(({ dni, clientId, message, worker }) => {
                const item = document.createElement("li");
                const label = document.createElement("strong");
                label.textContent = dni
                    ? `DNI/NIE ${dni} — ID Cliente: ${clientId || "no encontrado en la trazabilidad"}: `
                    : `${worker}: `;
                item.append(label, document.createTextNode(message));
                errorList.appendChild(item);
            });
        }

        function renderTemplates() {
            const completedTemplates = allDnis
                .map(dni => templatesByDni.get(dni))
                .filter(Boolean);
            templatesOutput.value = completedTemplates.join("\n\n-----------------------------------------\n\n");
            templatesPanel.hidden = completedTemplates.length === 0;
        }

        function copyTextWithExecCommand(target) {
            target.focus();
            target.scrollIntoView({ block: "nearest" });
            target.select();
            target.setSelectionRange(0, target.value.length);
            try {
                return document.execCommand("copy");
            } catch {
                return false;
            }
        }

        async function copyText(text, target, label) {
            if (!text) {
                status.textContent = `No hay contenido de ${label} para copiar.`;
                return false;
            }
            target.value = text;
            let clipboardError = "Portapapeles no disponible";
            let clipboardWrite = Promise.resolve(false);
            try {
                if (navigator.clipboard?.writeText) {
                    clipboardWrite = navigator.clipboard.writeText(text).then(
                        () => true,
                        error => {
                            clipboardError = error instanceof Error ? error.message : String(error);
                            return false;
                        }
                    );
                }
            } catch (error) {
                clipboardError = error instanceof Error ? error.message : String(error);
            }

            const legacyCopied = copyTextWithExecCommand(target);
            if (await clipboardWrite || legacyCopied) {
                status.textContent = `Copiado al portapapeles: ${label}.`;
                return true;
            }
            target.focus();
            target.select();
            target.setSelectionRange(0, text.length);
            status.textContent = `El navegador bloqueó la copia automática (${clipboardError}). El texto está seleccionado; pulsa Ctrl+C (o ⌘C).`;
            return false;
        }

        status.textContent = savedServiceIds.length
            ? `${savedServiceIds.length} IDs recuperados. Pulsa Consultar para abrir la pestaña de trabajo.`
            : "No hay IDs guardados. Pega los DNI sintéticos en esta lista y pulsa Consultar.";
        fullTemplateMode.addEventListener("change", () => {
            updateModeControls();
            status.textContent = fullTemplateMode.checked
                ? "Pega una plantilla DNI completa y la trazabilidad. Se combinará solo la primera de cada una, sin abrir workers."
                : "Modo de consulta masiva activado. Pega los DNI sintéticos y pulsa Consultar.";
        });

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

        async function processDni(workerWindow, dni) {
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
            await sleep(300);
            await control();
            button.click();
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
            outputContainer.hidden = false;
            return copyText(text, output, "resultado DNI + trazabilidad");
        }

        startButton.addEventListener("click", async () => {
            if (fullTemplateMode.checked) {
                status.textContent = "El modo Plantilla DNI completa no realiza consultas. Usa Plantilla DNI +Traza para combinar los textos pegados.";
                return;
            }
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
            const traceClientIds = [...traceTextarea.value.matchAll(/^ID CLIENTE:\s*([^\r\n]+)\s*$/gim)]
                .map(match => match[1].trim());
            const clientIdByDni = new Map(
                allDnis.map((dni, index) => [dni, traceClientIds[index] ?? ""])
            );
            retryMode = false;
            retryQueue = [];
            retryButton.disabled = true;
            running = true;
            cancelled = false;
            paused = false;
            renderErrors([]);
            copyButton.disabled = true;
            startButton.disabled = true;
            fullTemplateMode.disabled = true;
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
                        status.textContent = `${completed}/${dnis.length} consultas completadas.`;
                        try {
                            const template = await processDni(workerWindow, dni);
                            templatesByDni.set(dni, template);
                            renderTemplates();
                            copyButton.disabled = false;
                        } catch (error) {
                            if (cancelled) break;
                            errors.push({
                                dni,
                                clientId: clientIdByDni.get(dni),
                                message: error.message
                            });
                            renderErrors(errors);
                        }
                        completed++;
                        status.textContent = `${completed}/${dnis.length} consultas completadas; ${errors.length} errores.`;
                        if (cancelled) break;
                        if (nextIndex < dnis.length) {
                            try {
                                await returnToSearchPage(workerWindow);
                            } catch (error) {
                                errors.push({
                                    worker: `Worker ${workerIndex + 1}`,
                                    message: error.message
                                });
                                renderErrors(errors);
                                break;
                            }
                        }
                    }
                }

                await Promise.all(workerWindows.map((workerWindow, index) => runWorker(workerWindow, index)));
                const templateCount = allDnis.filter(dni => templatesByDni.has(dni)).length;
                status.textContent = `${cancelled ? "Proceso detenido" : "Proceso terminado"}. ${templateCount}/${allDnis.length} plantillas generadas; ${errors.length} errores en este intento.`;
            } catch (error) {
                status.textContent = `${error.message} Se conservaron ${templatesByDni.size} plantillas.`;
            } finally {
                running = false;
                startButton.disabled = false;
                fullTemplateMode.disabled = false;
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
            await copyText(
                allDnis.map(dni => templatesByDni.get(dni)).filter(Boolean).join("\n\n-----------------------------------------\n\n"),
                templatesOutput,
                "las plantillas DNI"
            );
        });
        copyGeneratedButton.addEventListener("click", () =>
            copyText(templatesOutput.value, templatesOutput, "las plantillas DNI")
        );
        copyResultButton.addEventListener("click", () =>
            copyText(output.value, output, "el resultado DNI + trazabilidad")
        );

        combineButton.addEventListener("click", async () => {
            const traceStarts = [...traceTextarea.value.matchAll(/^ID CLIENTE:\s*([^\r\n]+)\s*$/gim)];
            const traceTemplates = traceStarts.map((match, index) => {
                const start = match.index;
                const end = traceStarts[index + 1]?.index ?? traceTextarea.value.length;
                const block = traceTextarea.value
                    .slice(start, end)
                    .replace(/[\r\n-]+$/g, "")
                    .trim();
                return { clientId: match[1].trim(), block };
            });

            if (fullTemplateMode.checked) {
                const dniTemplates = textarea.value
                    .split(/^\s*-{5,}\s*$/m)
                    .map(template => template.trim())
                    .filter(Boolean);
                if (!dniTemplates.length || dniTemplates.some(template => !/^•\s*DNI:\s*.+$/im.test(template))) {
                    status.textContent = "Pega una o más plantillas DNI completas, separadas por líneas de guiones, cada una con el campo • DNI:.";
                    return;
                }
                const combined = [];
                const unmatched = [];
                const traceIndexesByClientId = new Map();
                traceTemplates.forEach(({ clientId }, index) => {
                    const indexes = traceIndexesByClientId.get(clientId) ?? [];
                    indexes.push(index);
                    traceIndexesByClientId.set(clientId, indexes);
                });
                const usedTraceIndexes = new Set();

                for (const dniTemplate of dniTemplates) {
                    const dni = dniTemplate.match(/^•\s*DNI:\s*(.+)$/im)?.[1]?.trim() || "DNI no identificado";
                    const clientId = dniTemplate.match(/^•\s*ID:\s*(.+)$/im)?.[1]?.trim();
                    if (!clientId) {
                        unmatched.push({
                            dni,
                            clientId: "no encontrado",
                            message: "Falta el campo • ID:; no se puede emparejar esta ficha."
                        });
                        continue;
                    }
                    const traceIndex = (traceIndexesByClientId.get(clientId) ?? [])
                        .find(index => !usedTraceIndexes.has(index));
                    if (traceIndex === undefined) {
                        unmatched.push({
                            dni,
                            clientId,
                            message: "No se encontró una trazabilidad con este ID CLIENTE."
                        });
                        continue;
                    }
                    usedTraceIndexes.add(traceIndex);
                    if (!traceTemplates[traceIndex].block) {
                        unmatched.push({
                            dni,
                            clientId,
                            message: "La trazabilidad correspondiente está vacía."
                        });
                        continue;
                    }
                    combined.push(`${dniTemplate}\n\n${traceTemplates[traceIndex].block}`);
                }
                traceTemplates.forEach(({ clientId }, index) => {
                    if (!usedTraceIndexes.has(index)) {
                        unmatched.push({
                            worker: `ID Cliente ${clientId || "no identificado"}`,
                            message: "No se encontró una plantilla DNI con este ID CLIENTE."
                        });
                    }
                });
                renderErrors(unmatched);
                const summary = `${combined.length} parejas combinadas por ID; ${unmatched.length} fichas o trazabilidades sin pareja.`;
                if (!combined.length) {
                    status.textContent = `No se encontró ninguna pareja para copiar. ${summary}`;
                    return;
                }
                const copied = await copyCombinedResult(combined.join("\n\n-----------------------------------------\n\n"));
                status.textContent = copied
                    ? `Plantillas DNI completas + trazabilidad coincidentes copiadas. ${summary}`
                    : `${status.textContent} ${summary}`;
                return;
            }

            if (!traceStarts.length) {
                status.textContent = "Pega las plantillas de trazabilidad; no se encontró ningún ID CLIENTE.";
                return;
            }

            const generatedTemplates = allDnis
                .map(dni => ({ dni, template: templatesByDni.get(dni) }))
                .filter(result => result.template);
            const combined = [];
            const usedTraceIndexes = new Set();
            let missing = 0;
            allDnis.forEach((dni, index) => {
                const template = templatesByDni.get(dni);
                if (template) {
                    const trace = traceTemplates[index]?.block;
                    if (trace) {
                        usedTraceIndexes.add(index);
                        combined.push(`${template}\n\n${trace}`);
                    } else {
                        missing++;
                    }
                }
            });

            const withoutTemplate = allDnis.length - generatedTemplates.length;
            const unusedTraces = traceTemplates.length - usedTraceIndexes.size;
            const summary = `Combinadas por posición: ${combined.length}/${generatedTemplates.length} plantillas generadas. Sin traza: ${missing}. Consultas sin plantilla: ${withoutTemplate}. Trazas sin plantilla: ${unusedTraces}.`;
            if (!combined.length) {
                status.textContent = `No hubo plantillas para copiar. ${summary}`;
                return;
            }

            const combinedText = combined.join("\n\n-----------------------------------------\n\n");
            const copied = await copyCombinedResult(combinedText);
            status.textContent = copied
                ? `Plantillas DNI +Traza copiadas. ${summary}`
                : `${status.textContent} ${summary}`;
        });

        templatePanel.querySelector('[data-action="close"]').addEventListener("click", () => templatePanel.remove());
    }
})();
