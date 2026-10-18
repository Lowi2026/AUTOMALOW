(() => {
    "use strict";

    // Configuración compartida: URLs, claves y límites usados por los módulos.
    const CONFIG = Object.freeze({
        repositoryUrl: "https://cdn.jsdelivr.net/gh/Lowi2026/AUTOMALOW@main/",
        supabaseUrl: "https://gjchhoraaukfaumzcwnd.supabase.co",
        supabaseKey: "sb_publishable_3AVUNcIiNxzTMAhDnvon1Q_GMBwjSW3",
        historyStorageKey: "g_automation_logs",
        historyLimit: 500,
        rootId: "g-automation-root",
        supabaseScriptUrl: "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2",
        templatesFile: "PL.json"
    });

    // Utilidades comunes de DOM, red, fechas, eventos y portapapeles.
    const Core = (() => {
        const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
        const todayLocal = (date = new Date()) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            return `${year}-${month}-${day}`;
        };

        const escapeText = value => String(value ?? "");
        const dispatchChange = element => {
            if (!element) return;
            element.dispatchEvent(new Event("input", { bubbles: true }));
            element.dispatchEvent(new Event("change", { bubbles: true }));
        };

        async function fetchJson(path) {
            const response = await fetch(`${CONFIG.repositoryUrl}${path}?v=${Date.now()}`, {
                cache: "no-store"
            });
            if (!response.ok) {
                throw new Error(`No se pudo cargar ${path} (HTTP ${response.status}).`);
            }
            return response.json();
        }

        async function copyText(text) {
            if (navigator.clipboard?.writeText) {
                try {
                    await navigator.clipboard.writeText(text);
                    return;
                } catch (error) {
                    console.warn("Clipboard API no disponible; se probará el método alternativo.", error);
                }
            }

            const textarea = document.createElement("textarea");
            textarea.value = text;
            textarea.setAttribute("readonly", "");
            Object.assign(textarea.style, {
                position: "fixed",
                opacity: "0",
                pointerEvents: "none"
            });
            document.body.appendChild(textarea);
            textarea.select();
            const copied = document.execCommand("copy");
            textarea.remove();
            if (!copied) throw new Error("El navegador no permitió copiar al portapapeles.");
        }

        function createElement(tag, className, text) {
            const element = document.createElement(tag);
            if (className) element.className = className;
            if (text !== undefined) element.textContent = escapeText(text);
            return element;
        }

        return { wait, todayLocal, dispatchChange, fetchJson, copyText, createElement, escapeText };
    })();

    // Identifica al agente actual a partir de los datos del ticket Jira.
    const Identity = (() => {
        function getAgentId() {
            const link = document.querySelector('a[href*="customfield_16881="]');
            if (!link) return null;

            try {
                const url = new URL(link.href, window.location.href);
                const email = url.searchParams.get("customfield_16881")?.trim().toLowerCase();
                if (!email || !email.includes("@")) return null;
                return email.split("@")[0].replace(/\./g, "_");
            } catch (error) {
                console.error("No se pudo identificar al agente desde el enlace del ticket.", error);
                return null;
            }
        }
        return { getAgentId };
    })();

    // Extrae datos del cliente y del servicio desde el texto visible de la página.
    const Extractor = (() => {
        const NOT_FOUND = "N/A";

        function pageText() {
            return document.body?.innerText || "";
        }

        function getValue(labels, text = pageText()) {
            for (const label of labels) {
                const index = text.indexOf(label);
                if (index < 0) continue;
                const value = text.slice(index + label.length).split("\n", 1)[0]
                    .trim().replace(/^[:\s-]+/, "");
                if (value) return value;
            }
            return NOT_FOUND;
        }

        function getDocument() {
            let documentId = getValue([
                "DNI/NIE/Pasaporte:", "DNI/NIE:", "DNI:", "NIE:", "Documento:", "Pasaporte:"
            ]);
            if (documentId === NOT_FOUND) {
                const match = pageText().match(/(?:^|\s|[^\w])([XYZ\d]\d{7}[A-Z])(?:$|\s|[^\w])/i);
                if (match) documentId = match[1];
            }
            return documentId === NOT_FOUND
                ? NOT_FOUND
                : documentId.toUpperCase().replace(/[\s-]/g, "");
        }

        function getMobileNumbers() {
            const regex = /(?:^|\D)([67]\d{2}\s?\d{3}\s?\d{3})(?:\D|$)/g;
            const numbers = new Set();
            let match;
            while ((match = regex.exec(pageText())) !== null) {
                numbers.add(match[1].replace(/\s+/g, ""));
            }
            return numbers.size ? [...numbers].join(" | ") : NOT_FOUND;
        }

        function getAddress(text) {
            const labels = ["Dirección de instalación:", "Direccion:", "Dirección de installation:"];
            const terminators = ["Tipo de huella:", "Tarifa:", "Internet principal"];
            for (const label of labels) {
                const index = text.indexOf(label);
                if (index < 0) continue;
                let address = text.slice(index + label.length);
                const end = terminators.map(term => address.indexOf(term))
                    .filter(position => position >= 0)
                    .reduce((min, position) => Math.min(min, position), address.length);
                address = address.slice(0, end).trim();
                if (address) return address;
            }
            return NOT_FOUND;
        }

        function getTechnology(text) {
            const normalized = text.toUpperCase();
            if (normalized.includes("NEBAL")) return "NEBAL";
            if (normalized.includes("NEBAF")) return "NEBAF";
            if (normalized.includes("HFC")) return "HFC";
            return "FTTH";
        }

        function hasOntAlarm(text) {
            const normalized = text.toUpperCase();
            return normalized.includes("ONT") &&
                ["ALARM", "LOS RED", "EXTERNA"].some(token => normalized.includes(token));
        }

        function getInternetServices(text) {
            const primaryIndex = text.indexOf("Internet principal");
            const additionalIndex = text.indexOf("Internet adicional");
            return [
                {
                    title: "Principal",
                    text: primaryIndex >= 0
                        ? text.slice(primaryIndex, additionalIndex > primaryIndex ? additionalIndex : undefined)
                        : ""
                },
                {
                    title: "Adicional",
                    text: additionalIndex >= 0 ? text.slice(additionalIndex) : ""
                }
            ].filter(service => service.text.trim());
        }

        return { NOT_FOUND, pageText, getValue, getDocument, getMobileNumbers, getAddress,
            getTechnology, hasOntAlarm, getInternetServices };
    })();

    // Persiste y consulta localmente el historial de plantillas copiadas.
    const LocalHistory = (() => {
        function read() {
            try {
                const stored = localStorage.getItem(CONFIG.historyStorageKey);
                if (!stored) return [];
                const parsed = JSON.parse(stored);
                if (!Array.isArray(parsed)) throw new TypeError("El historial guardado no es una lista.");
                return parsed.filter(item => item && typeof item === "object");
            } catch (error) {
                console.error("No se pudo leer el historial local.", error);
                return [];
            }
        }

        function write(entries) {
            try {
                localStorage.setItem(CONFIG.historyStorageKey, JSON.stringify(entries));
                return true;
            } catch (error) {
                console.error("No se pudo guardar el historial local.", error);
                return false;
            }
        }

        function add(entry) {
            const timestamp = Date.now();
            const entries = read();
            entries.unshift({
                timestamp,
                fechaStr: Core.todayLocal(),
                horaStr: new Intl.DateTimeFormat("es-ES", {
                    hour: "2-digit", minute: "2-digit"
                }).format(new Date(timestamp)),
                ...entry
            });
            return write(entries.slice(0, CONFIG.historyLimit));
        }

        function removeByDate(date, agentId) {
            if (!agentId) return false;
            const filtered = read().filter(entry => {
                return !(entry.agenteId === agentId && entry.fechaStr === date);
            });
            return write(filtered);
        }

        function forDate(date, agentId) {
            if (!agentId) return [];
            return read().filter(entry => {
                return entry.agenteId === agentId && entry.fechaStr === date;
            }).map(entry => ({
                cliente: entry.cliente,
                dni: entry.dni,
                sub_cat: entry.subCat || "General",
                clase: entry.clase || "fibra",
                plantilla: entry.plantilla,
                hora_str: entry.horaStr || ""
            }));
        }

        return { add, removeByDate, forDate };
    })();

    // Carga el SDK y centraliza la creación y validación de consultas Supabase.
    const DataClient = (() => {
        let clientPromise;

        function loadSupabase() {
            if (window.supabase?.createClient) return Promise.resolve(window.supabase);
            if (clientPromise) return clientPromise;

            clientPromise = new Promise((resolve, reject) => {
                const existing = document.querySelector(`script[src="${CONFIG.supabaseScriptUrl}"]`);
                const script = existing || document.createElement("script");
                const timeout = window.setTimeout(() => {
                    reject(new Error("Tiempo agotado al cargar el cliente de Supabase."));
                }, 15000);

                const onLoad = () => {
                    window.clearTimeout(timeout);
                    if (window.supabase?.createClient) resolve(window.supabase);
                    else reject(new Error("Supabase se cargó sin exponer createClient."));
                };
                const onError = () => {
                    window.clearTimeout(timeout);
                    reject(new Error("No se pudo cargar el cliente de Supabase."));
                };

                script.addEventListener("load", onLoad, { once: true });
                script.addEventListener("error", onError, { once: true });
                if (!existing) {
                    script.src = CONFIG.supabaseScriptUrl;
                    script.async = true;
                    document.head.appendChild(script);
                }
            }).catch(error => {
                clientPromise = null;
                throw error;
            });
            return clientPromise;
        }

        async function createClient() {
            const supabase = await loadSupabase();
            return supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);
        }

        function assertSuccess(result) {
            if (result.error) throw result.error;
            return result.data;
        }

        return { createClient, assertSuccess };
    })();

    // Define y construye los iconos SVG usados por las interfaces.
    const Icons = (() => {
        const shapes = Object.freeze({
            wifi: [
                ["path", { d: "M5 12.55a11 11 0 0 1 14.08 0" }],
                ["path", { d: "M1.42 9a16 16 0 0 1 21.16 0" }],
                ["path", { d: "M8.53 16.11a6 6 0 0 1 6.95 0" }],
                ["circle", { cx: "12", cy: "20", r: "1", fill: "currentColor", stroke: "none" }]
            ],
            tv: [
                ["rect", { x: "2", y: "3", width: "20", height: "15", rx: "2" }],
                ["path", { d: "M8 21h8M12 18v3" }]
            ],
            bolt: [["path", { d: "M13 2 3 14h7l-1 8 12-12h-7l-1-8Z", fill: "currentColor", stroke: "none" }]],
            chevron: [["path", { d: "m6 9 6 6 6-6" }]],
            trash: [
                ["path", { d: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" }],
                ["path", { d: "M10 11v5M14 11v5" }]
            ],
            close: [["path", { d: "m18 6-12 12M6 6l12 12" }]],
            copy: [
                ["rect", { x: "8", y: "8", width: "13", height: "13", rx: "2" }],
                ["path", { d: "M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" }]
            ],
            user: [
                ["circle", { cx: "12", cy: "8", r: "4" }],
                ["path", { d: "M4 21a8 8 0 0 1 16 0" }]
            ],
            clock: [
                ["circle", { cx: "12", cy: "12", r: "10" }],
                ["path", { d: "M12 6v6l4 2" }]
            ],
            headset: [
                ["path", { d: "M3 14v-3a9 9 0 0 1 18 0v3" }],
                ["rect", { x: "2", y: "13", width: "4", height: "7", rx: "2" }],
                ["rect", { x: "18", y: "13", width: "4", height: "7", rx: "2" }],
                ["path", { d: "M18 20a6 6 0 0 1-6 3h-2" }]
            ]
        });

        function create(name, className = "icon-svg") {
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute("viewBox", "0 0 24 24");
            svg.setAttribute("width", "1em");
            svg.setAttribute("height", "1em");
            svg.setAttribute("fill", "none");
            svg.setAttribute("stroke", "currentColor");
            svg.setAttribute("stroke-width", "2");
            svg.setAttribute("stroke-linecap", "round");
            svg.setAttribute("stroke-linejoin", "round");
            svg.setAttribute("aria-hidden", "true");
            svg.setAttribute("focusable", "false");
            if (className) svg.setAttribute("class", className);

            for (const [tagName, attributes] of shapes[name] || []) {
                const shape = document.createElementNS("http://www.w3.org/2000/svg", tagName);
                for (const [key, value] of Object.entries(attributes)) shape.setAttribute(key, value);
                svg.appendChild(shape);
            }
            return svg;
        }

        return { create };
    })();

    // Inyector de Jira: panel de averías, automatización de campos y copia del TT.
    const JiraModule = (() => {
        const STEP_KEYS = ["GRUPO", "TIPO", "SUBTIPO_L1", "SUBTIPO_L2", "EXTRA_CIERRE"];

        function isValidIncident(incident) {
            return incident && typeof incident.label === "string" && incident.label.trim() &&
                incident.pasos && typeof incident.pasos === "object" && !Array.isArray(incident.pasos) &&
                STEP_KEYS.every(key => Number.isInteger(incident.pasos[key]) && incident.pasos[key] >= 0);
        }

        const formatDateTime = date => {
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            return `${String(date.getDate()).padStart(2, "0")}/${months[date.getMonth()]}/` +
                `${String(date.getFullYear()).slice(-2)} ${String(date.getHours()).padStart(2, "0")}:` +
                `${String(date.getMinutes()).padStart(2, "0")}`;
        };

        function nextBusinessDay(date) {
            const day = date.getDay();
            date.setDate(date.getDate() + (day === 5 ? 3 : day === 6 ? 2 : 1));
            return date;
        }

        async function selectReactOption(selectors, steps, fieldName, optional = false) {
            if (!Number.isInteger(steps) || steps < 0) {
                throw new Error("La configuración contiene un índice de opción inválido.");
            }

            const deadline = Date.now() + (optional ? 500 : 5000);
            let input = null;
            while (Date.now() < deadline) {
                for (const selector of selectors) {
                    const candidate = document.querySelector(selector);
                    if (candidate instanceof HTMLInputElement) {
                        input = candidate;
                        break;
                    }
                }
                if (input) break;
                await Core.wait(100);
            }
            if (!input) {
                if (optional) return false;
                throw new Error(`No se encontró el desplegable "${fieldName}". Comprueba que el formulario de Jira haya terminado de cargar.`);
            }

            input.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
            await Core.wait(100);
            input.value = " ";
            Core.dispatchChange(input);
            await Core.wait(100);
            input.dispatchEvent(new KeyboardEvent("keydown", { key: "Backspace", bubbles: true }));
            await Core.wait(50);
            for (let index = 0; index < steps; index++) {
                input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
                await Core.wait(60);
            }
            input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
            await Core.wait(150);
        }

        function setFieldValue(id, value, notify = false) {
            const field = document.getElementById(id);
            if (!field) return false;
            const prototype = field instanceof HTMLTextAreaElement
                ? HTMLTextAreaElement.prototype
                : HTMLInputElement.prototype;
            const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
            if (setter) setter.call(field, value);
            else field.value = value;
            if (notify) Core.dispatchChange(field);
            return true;
        }

        async function fillCommonFields() {
            const now = new Date();
            const start = nextBusinessDay(new Date(now));
            start.setHours(8, 0, 0, 0);
            const end = new Date(start);
            end.setHours(16, 0, 0, 0);

            const fields = [
                ["customfield_16825", formatDateTime(now)],
                ["customfield_16823", formatDateTime(start)],
                ["customfield_16824", formatDateTime(end)],
                ["customfield_16833", "OK"]
            ];
            const fieldIds = [...fields.map(([id]) => id), "customfield_16820", "customfield_16821"];

            const deadline = Date.now() + 2000;
            while (Date.now() < deadline && fieldIds.some(id => !document.getElementById(id))) {
                await Core.wait(100);
            }

            const missingFields = [];
            fields.forEach(([id, value]) => {
                if (!setFieldValue(id, value, true)) missingFields.push(id);
            });
            const product = document.getElementById("customfield_16820");
            if (!product) missingFields.push("customfield_16820");
            else if (product.value.trim() && !setFieldValue("customfield_16821", product.value, true)) {
                missingFields.push("customfield_16821");
            }
            return missingFields;
        }

        function makeToast(message, isError = false) {
            const oldToast = document.querySelector(".g-automation-toast");
            oldToast?.remove();
            const toast = Core.createElement("div", "g-automation-toast", message);
            Object.assign(toast.style, {
                position: "fixed", top: "20px", right: "20px", zIndex: "10000001",
                background: isError ? "#b91c1c" : "#7A22B4", color: "#fff",
                padding: "11px 18px", borderRadius: "8px", fontSize: "12px",
                fontWeight: "700", boxShadow: "0 5px 15px rgba(0,0,0,.4)"
            });
            document.body.appendChild(toast);
            window.setTimeout(() => toast.remove(), 3000);
        }

        function createPanel(incidents) {
            const host = document.createElement("div");
            host.id = CONFIG.rootId;
            const shadow = host.attachShadow({ mode: "open" });
            const style = Core.createElement("style");
            style.textContent = `
                :host{font-family:Arial,sans-serif;color:#fff}
                *{box-sizing:border-box;margin:0;padding:0}
                .panel{position:fixed;z-index:9999999;top:20px;right:20px;width:340px;max-height:calc(100vh - 40px);
                    display:flex;flex-direction:column;background:#130919;border:1px solid rgba(185,118,247,.2);
                    border-radius:20px;box-shadow:0 24px 50px -12px rgba(0,0,0,.9);overflow:hidden}
                .header,.footer{display:flex;align-items:center;justify-content:space-between;background:#130919}
                .header{padding:20px 20px 10px;cursor:move}
                h2{font-size:16px;font-weight:700;color:#fff}.subtitle{font-size:11px;color:#b976f7;opacity:.7;margin-top:2px}
                button{font:inherit;cursor:pointer}.header-actions{display:flex;align-items:center;gap:5px}
                .header-actions button{width:24px;height:24px;display:flex;align-items:center;justify-content:center;
                    padding:0;background:transparent;border:0;border-radius:7px;color:rgba(255,255,255,.4);font-size:16px}
                .header-actions button:hover{background:#7a22b4;color:#fff}
                #restore-panel[hidden]{display:none}
                .body{flex:1;overflow-y:auto;padding:16px}
                .incident-list{padding:12px;background:#1c0f24;border:1px solid rgba(185,118,247,.12);border-radius:16px}
                .incident-items{display:flex;flex-direction:column;gap:4px}
                .incident{width:100%;display:flex;align-items:center;justify-content:space-between;gap:8px;
                    margin-bottom:4px;padding:10px 14px;border:0;border-radius:12px;color:#fff;background:#7a22b4;
                    text-align:left;font-size:12px;font-weight:600}
                .incident:last-child{margin-bottom:0}
                .incident:hover{background:#912fd4}
                .incident-label{min-width:0;text-align:center;flex:1}
                .incident-icon{flex:none}
                .copy{width:100%;margin-top:8px;padding:10px;border:0;border-radius:8px;background:#5c188c;color:#fff;
                    font-size:11px;font-weight:700;text-transform:uppercase}
                .copy:hover{background:#7a22b4}
                .footer{padding:14px;border-top:1px solid rgba(185,118,247,.12)}
                .toggle{width:100%;padding:10px;border:1px solid rgba(185,118,247,.2);border-radius:8px;
                    background:#1c0f24;color:#fff;font-size:12px}
                .toggle:hover{background:#7a22b4}
            `;
            shadow.appendChild(style);

            const panel = Core.createElement("section", "panel");
            const header = Core.createElement("header", "header");
            header.id = "g-drag-handle";
            const title = document.createElement("div");
            const heading = Core.createElement("h2", "", "Robot Inyector Jira");
            const subtitle = Core.createElement("p", "subtitle", "enabler.es — Modo Index");
            title.append(heading, subtitle);
            const headerActions = Core.createElement("div", "header-actions");
            const restore = Core.createElement("button", "", "+");
            restore.type = "button";
            restore.id = "restore-panel";
            restore.hidden = true;
            restore.title = "Mostrar interfaz";
            restore.setAttribute("aria-label", "Mostrar interfaz");
            const close = Core.createElement("button", "close", "×");
            close.type = "button";
            close.setAttribute("aria-label", "Cerrar panel");
            headerActions.append(restore, close);
            header.append(title, headerActions);

            const body = Core.createElement("main", "body");
            body.id = "g-body-view";
            const list = Core.createElement("div", "incident-list");
            const incidentItems = Core.createElement("div", "incident-items");
            incidents.forEach((incident, index) => {
                const button = Core.createElement("button", "incident");
                button.type = "button";
                button.dataset.incidentIndex = String(index);
                button.append(
                    Core.createElement("span", "incident-label", incident.label),
                    Core.createElement("span", "incident-icon", "🤖")
                );
                incidentItems.appendChild(button);
            });
            list.appendChild(incidentItems);
            body.appendChild(list);
            const copy = Core.createElement("button", "copy", "📋 Copiar TT");
            copy.type = "button";
            copy.id = "g-copy-tt";
            body.appendChild(copy);

            const footer = Core.createElement("footer", "footer");
            const toggle = Core.createElement("button", "toggle", "Ocultar interfaz");
            toggle.type = "button";
            footer.appendChild(toggle);
            panel.append(header, body, footer);
            shadow.appendChild(panel);
            document.body.appendChild(host);

            close.addEventListener("click", () => host.remove());
            const setInterfaceVisible = visible => {
                body.hidden = !visible;
                panel.style.maxHeight = visible ? "calc(100vh - 40px)" : "75px";
                toggle.textContent = visible ? "👁️‍🗨️ Ocultar Interfaz" : "👁️ Mostrar Interfaz";
                restore.hidden = visible;
            };
            toggle.addEventListener("click", () => {
                setInterfaceVisible(body.hidden);
            });
            restore.addEventListener("click", () => setInterfaceVisible(true));
            copy.addEventListener("click", async () => {
                const breadcrumb = document.querySelector(".aui-nav-breadcrumbs li:last-child");
                const ticket = breadcrumb?.textContent?.trim();
                if (!ticket) {
                    makeToast("No se encontró el código TT en la vista actual.", true);
                    return;
                }
                try {
                    await Core.copyText(ticket);
                    makeToast(`TT copiado: ${ticket}`);
                } catch (error) {
                    console.error(error);
                    makeToast(error.message, true);
                }
            });
            shadow.querySelectorAll(".incident").forEach(button => {
                button.addEventListener("click", async () => {
                    const incident = incidents[Number(button.dataset.incidentIndex)];
                    if (!incident?.pasos) {
                        makeToast("La avería no tiene una configuración válida.", true);
                        return;
                    }
                    button.disabled = true;
                    try {
                        const summary = document.getElementById("summary");
                        if (!summary) throw new Error("No se encontró el resumen del ticket.");
                        summary.value = incident.label;
                        Core.dispatchChange(summary);
                        const steps = incident.pasos;
                        const selectors = [
                            [["[id^='react-select-customfield_16817'] input", "#customfield_16817 input",
                                "input[id^='react-select-customfield_16817']"], steps.GRUPO, "Grupo"],
                            [["#insight-atlas-select-16800 input"], steps.TIPO, "Tipo"],
                            [["#insight-atlas-select-16801 input"], steps.SUBTIPO_L1, "Subtipo nivel 1"],
                            [["#insight-atlas-select-16802 input"], steps.SUBTIPO_L2, "Subtipo nivel 2"],
                            [['#cd-1 input[id^="react-select"]', "#cd-1 input"], steps.EXTRA_CIERRE, "Extra cierre", true]
                        ];
                        for (const [fieldSelectors, index, fieldName, optional] of selectors) {
                            await selectReactOption(fieldSelectors, index, fieldName, optional);
                        }
                        const missingFields = await fillCommonFields();
                        if (missingFields.length) {
                            makeToast(`No se encontraron campos Jira: ${missingFields.join(", ")}.`, true);
                        } else {
                            makeToast("Ticket completado.");
                        }
                    } catch (error) {
                        console.error("Error durante la inyección en Jira.", error);
                        makeToast(error.message || "Error durante la inyección.", true);
                    } finally {
                        button.disabled = false;
                    }
                });
            });
            setupDrag(header, panel);
        }

        function setupDrag(handle, panel) {
            let pointerX = 0;
            let pointerY = 0;
            let dragging = false;
            handle.addEventListener("pointerdown", event => {
                if (event.target.closest("button")) return;
                dragging = true;
                pointerX = event.clientX;
                pointerY = event.clientY;
                handle.setPointerCapture(event.pointerId);
            });
            handle.addEventListener("pointermove", event => {
                if (!dragging) return;
                const dx = event.clientX - pointerX;
                const dy = event.clientY - pointerY;
                pointerX = event.clientX;
                pointerY = event.clientY;
                const rect = panel.getBoundingClientRect();
                panel.style.right = "auto";
                panel.style.left = `${Math.max(0, Math.min(window.innerWidth - rect.width, rect.left + dx))}px`;
                panel.style.top = `${Math.max(0, Math.min(window.innerHeight - 50, rect.top + dy))}px`;
            });
            const stopDragging = () => { dragging = false; };
            handle.addEventListener("pointerup", stopDragging);
            handle.addEventListener("pointercancel", stopDragging);
        }

        async function start() {
            try {
                const client = await DataClient.createClient();
                const result = await client.from("averias")
                    .select("orden,label,grupo,tipo,subtipo_l1,subtipo_l2,extra_cierre")
                    .eq("activo", true)
                    .order("orden", { ascending: true });
                const rows = DataClient.assertSuccess(result);
                if (!Array.isArray(rows) || !rows.length) {
                    throw new TypeError("La tabla public.averias no contiene registros activos válidos.");
                }
                const incidents = rows.map(row => ({
                    label: row.label,
                    pasos: {
                        GRUPO: row.grupo,
                        TIPO: row.tipo,
                        SUBTIPO_L1: row.subtipo_l1,
                        SUBTIPO_L2: row.subtipo_l2,
                        EXTRA_CIERRE: row.extra_cierre
                    }
                }));
                if (incidents.some(incident => !isValidIncident(incident))) {
                    throw new TypeError("Hay averías con pasos incompletos o índices inválidos en public.averias.");
                }
                document.getElementById(CONFIG.rootId)?.remove();
                createPanel(incidents);
            } catch (error) {
                console.error("No se pudo inicializar el módulo Jira.", error);
                window.alert(`No se pudieron cargar las averías desde Supabase: ${error.message}`);
            }
        }

        return { start };
    })();

    // Interfaz y funciones Lowi: plantillas, historial, rellamadas y baúl.
    const LowiModule = (() => {
        const state = {
            templates: null, services: [], agentId: null, db: null,
            isAdmin: false, recallers: null, recallAgentNames: null,
            supervisorAssignments: null, supervisors: [],
            adminSupervisorName: null,
            teamFollowupAlerts: [],
            pendingManualReminderIds: new Set(),
            toastTimer: null, toastHost: null, toastElement: null,
            followupTimer: null, followupToastTimer: null, followupToastQueue: [],
            followupAlerts: []
        };
        let root;
        let shadow;
        let selectedDate;

        // Identificadores que activan textos dinámicos de plantillas.
        const TEMPLATE_MARKERS = Object.freeze({
            DINAMICO_INCOMUNICADO: "incommunicado",
            DINAMICO_CORTES_RESUELTO: "cutsResolved",
            DINAMICO_CORTES_TECNICO: "cutsTechnician",
            DINAMICO_CORTES_NV2: "cutsLevelTwo",
            DINAMICO_FUERA_RESUELTO: "thresholdResolved",
            DINAMICO_FUERA_NO: "thresholdNotResolved",
            DINAMICO_FUERA_RESUELTO_SOL: "thresholdSolution"
        });

        function notify(message, isError = false, action = null) {
            if (!state.toastHost?.isConnected) {
                const host = document.createElement("div");
                host.setAttribute("aria-live", "polite");
                host.style.setProperty("all", "initial");
                host.style.setProperty("position", "fixed", "important");
                host.style.setProperty("top", "12px", "important");
                host.style.setProperty("right", "12px", "important");
                host.style.setProperty("z-index", "2147483647", "important");
                host.style.setProperty("display", "block", "important");
                host.style.setProperty("width", "max-content", "important");
                host.style.setProperty("max-width", "calc(100vw - 24px)", "important");
                host.style.setProperty("pointer-events", "none", "important");
                const toastShadow = host.attachShadow({ mode: "open" });
                const style = document.createElement("style");
                style.textContent = `
                    :host{all:initial}
                    #toast{max-width:min(360px,calc(100vw - 24px));padding:10px 13px;border-radius:8px;
                        background:#7a22b4;color:#fff;box-shadow:0 8px 20px #0009;
                        font:12px Arial,sans-serif;overflow-wrap:anywhere;display:flex;align-items:center;gap:10px;
                        pointer-events:auto}
                    #toast-message{flex:1;min-width:0}
                    #toast-action{flex:none;padding:6px 8px;border:1px solid #ffffff55;border-radius:6px;
                        background:#ffffff18;color:#fff;font:600 11px Arial,sans-serif;cursor:pointer}
                    #toast-action:hover{background:#ffffff30}
                    #toast.error{background:#b91c1c}
                    #toast[hidden]{display:none!important}
                `;
                const toast = document.createElement("div");
                toast.id = "toast";
                toast.hidden = true;
                toastShadow.append(style, toast);
                document.documentElement.appendChild(host);
                state.toastHost = host;
                state.toastElement = toast;
            }
            const toast = state.toastElement;
            const messageElement = Core.createElement("span", "", message);
            messageElement.id = "toast-message";
            toast.replaceChildren(messageElement);
            toast.classList.toggle("error", isError);
            if (action) {
                const actionButton = Core.createElement("button", "", action.label);
                actionButton.id = "toast-action";
                actionButton.type = "button";
                actionButton.addEventListener("click", async () => {
                    actionButton.disabled = true;
                    try {
                        const completed = await action.onClick();
                        if (completed) toast.hidden = true;
                        else if (actionButton.isConnected) actionButton.disabled = false;
                    } catch (error) {
                        console.error("No se pudo completar la acción del aviso.", error);
                        notify(`No se pudo completar la acción: ${error.message}`, true);
                    }
                });
                toast.appendChild(actionButton);
            }
            toast.hidden = false;
            window.clearTimeout(state.toastTimer);
            state.toastTimer = window.setTimeout(() => { toast.hidden = true; }, action ? 12000 : 2600);
        }

        // Estructura visual, navegación y eventos comunes del widget Lowi.
        function addStyles() {
            const style = Core.createElement("style");
            style.textContent = `
                :host{--bg:#130919;--card:#1c0f24;--border:rgba(185,118,247,.18);font:13px Arial,sans-serif;color:#fff}
                *{box-sizing:border-box}
                .panel{position:fixed;z-index:9999999;top:20px;right:10px;width:480px;max-width:calc(100vw - 20px);
                    max-height:calc(100vh - 40px);
                    display:flex;flex-direction:column;overflow:hidden;background:var(--bg);border:1px solid var(--border);
                    border-radius:18px;box-shadow:0 20px 50px #000b}
                .header,.footer{padding:14px 16px;background:var(--bg);display:flex;align-items:center;justify-content:space-between}
                .header{cursor:move;border-bottom:1px solid var(--border)}
                .header h2{font-size:15px;margin:0 0 4px}.header p{font-size:11px;color:#b976f7;margin:0}
                button,input,textarea{font:inherit}.button{color:#fff;border:0;border-radius:8px;padding:9px 11px;background:#7a22b4;cursor:pointer}
                .header-actions{display:flex;align-items:center;gap:5px}
                .header-actions button{width:28px;height:28px;display:flex;align-items:center;justify-content:center;
                    padding:0;border:0;border-radius:7px;background:transparent;color:#fff;cursor:pointer;font-size:17px}
                .header-actions button:hover{background:#7a22b4}
                #restore-panel[hidden]{display:none}
                .tabs{display:flex;min-width:0;border-bottom:1px solid var(--border)}
                .tab-button{flex:1;padding:11px 6px;background:transparent;border:0;color:#aaa;cursor:pointer;font-weight:600}
                .tab-button.active{color:white;border-bottom:2px solid #b976f7}
                .tab-button{min-width:0;padding-left:4px;padding-right:4px;font-size:12px;white-space:nowrap}
                .tab-button:focus-visible{outline:2px solid #d8b4fe;outline-offset:-3px;border-radius:5px}
                .tab-button[hidden]{display:none}
                .tab-count{display:inline-block;min-width:16px;margin-left:4px;padding:2px 5px;
                    border-radius:10px;background:#7a22b4;color:#fff;font-size:9px}
                .body{padding:12px;overflow:auto}.view{display:none}.view.active{display:block}
                .category,.subgroup,.history-group,.note{border:1px solid var(--border);border-radius:11px;background:var(--card);overflow:hidden;margin-bottom:9px}
                .accordion,.group-trigger,.history-trigger{width:100%;padding:12px;text-align:left;background:transparent;border:0;color:#fff;cursor:pointer;font-weight:600}
                .accordion,.group-trigger{display:flex;align-items:center;justify-content:space-between;font-size:13px}
                .accordion:hover,.group-trigger:hover{background:rgba(185,118,247,.04)}
                .category-heading,.group-heading{display:flex;align-items:center;min-width:0}
                .category-heading span,.group-heading span{overflow-wrap:anywhere}
                .icon-svg{display:inline-block;width:1em;height:1em;vertical-align:-.12em;flex:none}
                .icon-circle-main{width:30px;height:30px;display:flex;align-items:center;justify-content:center;flex:none;
                    margin-right:10px;border-radius:50%;color:#b976f7;background:rgba(122,34,180,.2);border:1px solid rgba(185,118,247,.3)}
                .sub-cat-circle{width:27px;height:27px;display:flex;align-items:center;justify-content:center;flex:none;
                    margin-right:10px;border-radius:50%;font-size:11px}
                .sub-cat-circle.fibra{color:#00d0ff;background:rgba(0,150,255,.15);border:1px solid rgba(0,150,255,.3)}
                .sub-cat-circle.tv{color:#f59e0b;background:rgba(245,158,11,.15);border:1px solid rgba(245,158,11,.3)}
                .chevron{font-size:10px;opacity:.5;margin-left:8px;transition:transform .15s ease}
                .accordion[aria-expanded="true"]>.chevron,.group-trigger[aria-expanded="true"]>.chevron{transform:rotate(180deg)}
                .accordion-content,.subgroup-content,.history-content{display:none;padding:0 9px 9px}.open{display:block}
                .accordion-content{padding:0 10px 10px}
                .subgroup{margin-top:7px;background:#1c0f24}
                .group-trigger{padding:10px 12px}
                .template{font-size:12px}
                .template{width:100%;display:flex;justify-content:space-between;gap:8px;align-items:center;text-align:left;
                    padding:11px;background:#23142d;border:1px solid var(--border);border-radius:9px;color:#fff;cursor:pointer;margin-top:7px}
                .template:hover{border-color:#b976f7;background:rgba(185,118,247,.08)}
                .template-label{font-weight:600;line-height:1.4;overflow-wrap:anywhere}
                .template-copy{color:#b976f7;font-size:10px;font-weight:700;text-transform:uppercase;white-space:nowrap}
                .calendar,.stat,.note-editor{padding:10px;border:1px solid var(--border);border-radius:10px;background:var(--card);margin-bottom:10px}
                .calendar{border-radius:14px;padding:12px;margin-bottom:14px}
                .calendar label{display:block;color:#b976f7;font-size:11px;font-weight:700;letter-spacing:.5px;
                    text-transform:uppercase;margin-bottom:6px}
                input[type=date],input[type=text],textarea,select{width:100%;background:var(--bg);color:#fff !important;
                    -webkit-text-fill-color:#fff;caret-color:#d8b4fe;border:1px solid var(--border);
                    border-radius:7px;padding:9px}
                input[type=date]::placeholder,input[type=text]::placeholder,textarea::placeholder{color:#aaa !important;
                    -webkit-text-fill-color:#aaa;opacity:1}
                input[type=date]:focus,input[type=text]:focus,textarea:focus{outline:2px solid rgba(185,118,247,.65);
                    outline-offset:1px;border-color:#b976f7}
                input[type=date]::-webkit-calendar-picker-indicator{
                    width:20px;height:20px;padding:2px;margin-left:4px;border-radius:4px;
                    background-color:#d8b4fe;filter:none;opacity:1;cursor:pointer}
                .danger-row{display:flex;align-items:center;gap:8px}
                .danger-row input{flex:1;min-width:0}
                .clear{width:36px;height:36px;display:flex;align-items:center;justify-content:center;flex:none;
                    color:#ef4444;background:rgba(239,68,68,.1);border-color:rgba(239,68,68,.2)}
                .calendar .clear{padding:0}
                .clear:hover{background:rgba(239,68,68,.2);color:#ff6b6b}
                .clear.confirming{width:auto;padding:0 12px;background:#ef4444;color:#fff;font-size:11px;font-weight:700}
                .stats{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px}
                .stat{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;
                    background:rgba(28,16,38,.4);border-color:rgba(185,118,247,.08);margin:0}
                .stat.total{grid-column:span 2;background:linear-gradient(135deg,rgba(122,34,180,.2),rgba(28,16,38,.4));
                    border-color:rgba(185,118,247,.2);padding:14px}
                .stat-label{font-size:11px;color:rgba(255,255,255,.5);font-weight:500;text-transform:uppercase}
                .stat strong{display:block;color:#b976f7;font-size:18px;margin-top:2px}
                .stat.total strong{font-size:22px}
                #fiber-count{color:#00f0ff}.stat.tv-stat strong{color:#f59e0b}
                .history-group{border-radius:12px;margin-bottom:8px}
                .history-trigger{display:flex;align-items:center;justify-content:space-between;padding:11px 12px;
                    text-align:left;font-size:13px}
                .history-trigger:hover{background:rgba(185,118,247,.04)}
                .history-name{display:flex;align-items:center;min-width:0}
                .history-name-label{overflow-wrap:anywhere}
                .history-dot{width:8px;height:8px;flex:none;border-radius:50%;margin-right:10px;display:inline-block}
                .history-dot.fibra{background:#00d0ff;box-shadow:0 0 8px #00d0ff}
                .history-dot.tv{background:#f59e0b;box-shadow:0 0 8px #f59e0b}
                .icon-circle-main .icon-svg{width:15px;height:15px}
                .sub-cat-circle .icon-svg{width:13px;height:13px}
                .chevron{width:11px;height:11px}
                .template-copy .icon-svg{width:12px;height:12px}
                .stat-label .icon-svg{width:11px;height:11px}
                .history-customer .icon-svg,.history-time .icon-svg,.recall-agent .icon-svg{width:12px;height:12px}
                .history-badge{min-width:22px;padding:2px 8px;border-radius:20px;background:#7a22b4;color:#fff;
                    text-align:center;font-size:11px;font-weight:700}
                .history-content{display:none;padding:4px 12px 12px;background:rgba(19,9,25,.2);
                    border-top:1px solid rgba(185,118,247,.05)}
                .history-content.open{display:block}
                .history-entry{display:flex;flex-direction:column;gap:4px;margin-top:8px;padding:10px;
                    border-radius:10px;background:#23142d;border-left:3px solid #00d0ff;font-size:11px}
                .history-entry.tv{border-left-color:#f59e0b}
                .history-entry-header{display:flex;justify-content:space-between;gap:6px;align-items:center;
                    color:#fff;font-size:12px;font-weight:600}
                .history-customer{overflow-wrap:anywhere}
                .history-time{flex:none;color:rgba(255,255,255,.45);font-size:10px;font-weight:400}
                .history-actions{display:flex;align-items:center;gap:6px;flex:none}
                .history-alert{padding:4px 7px;border:1px solid var(--border);border-radius:6px;
                    background:transparent;color:#d8b4fe;font-size:10px;font-weight:600;cursor:pointer}
                .history-alert:hover{background:rgba(185,118,247,.12)}
                .history-alert.active{border-color:rgba(245,158,11,.55);color:#fbbf24}
                .history-alert:disabled{opacity:.45;cursor:not-allowed}
                .history-actions{flex-wrap:wrap;justify-content:flex-end}
                .followup-editor{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:7px}
                .followup-editor[hidden]{display:none}
                .followup-editor input{flex:1;min-width:175px;padding:6px;border:1px solid var(--border);
                    border-radius:6px;background:var(--bg);color:#fff;color-scheme:dark;font-size:11px}
                .followup-editor button{padding:6px 8px;border:1px solid var(--border);border-radius:6px;
                    background:transparent;color:#d8b4fe;font-size:10px;cursor:pointer}
                .followup-editor button:hover{background:rgba(185,118,247,.12)}
                .followup-schedule{color:#fbbf24;font-size:10px}
                .followup-card{padding:11px 12px;border:1px solid var(--border);border-left:3px solid #f59e0b;
                    border-radius:10px;background:var(--card);margin-bottom:8px}
                .followup-card-title{font-size:12px;font-weight:700;overflow-wrap:anywhere}
                .followup-card-dni{margin-top:4px;color:#d8b4fe;font-size:11px}
                .followup-card-date{margin-top:6px;color:rgba(255,255,255,.7);font-size:11px}
                .followup-card-status{margin-top:4px;color:#fbbf24;font-size:10px;font-weight:700}
                .followup-card-actions{display:flex;gap:7px;margin-top:9px}
                .followup-card-actions button{padding:6px 9px;border:1px solid var(--border);border-radius:6px;
                    background:transparent;color:#d8b4fe;font-size:10px;font-weight:600;cursor:pointer}
                .followup-card-actions button:hover{background:rgba(185,118,247,.12)}
                .followup-card-actions button:disabled{opacity:.5;cursor:wait}
                .followup-team-heading{margin:14px 0 8px;padding:8px 10px;border:1px solid var(--border);
                    border-radius:8px;background:rgba(122,34,180,.16);color:#d8b4fe;font-size:11px;font-weight:700}
                .followup-card-agent{margin-top:5px;color:rgba(255,255,255,.65);font-size:10px}
                .followup-card-actions button.remind{border-color:rgba(245,158,11,.45);color:#fbbf24}
                .followup-date-range{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:end;gap:8px;
                    padding:10px;border:1px solid var(--border);border-radius:10px;background:var(--card);margin-bottom:10px}
                .followup-date-range label{display:block;min-width:0;color:#b976f7;font-size:10px;
                    font-weight:700;letter-spacing:.3px;text-transform:uppercase}
                .followup-date-range input{display:block;width:100%;min-width:0;margin-top:5px;padding:7px;
                    border:1px solid var(--border);border-radius:7px;background:var(--bg);color:#fff;
                    color-scheme:dark;font:11px Arial,sans-serif}
                .followup-date-clear{height:32px;padding:0 9px;border:1px solid var(--border);
                    border-radius:7px;background:transparent;color:#d8b4fe;font-size:10px;cursor:pointer}
                .followup-date-clear:hover{background:rgba(185,118,247,.12)}
                .history-entry p{white-space:pre-wrap;overflow-wrap:anywhere;color:rgba(255,255,255,.65);
                    font-size:11px;margin:2px 0 0}
                .recall-summary{padding:11px 12px;border:1px solid var(--border);border-radius:10px;
                    background:rgba(28,16,38,.4);margin-bottom:10px;color:rgba(255,255,255,.65);font-size:11px;line-height:1.5}
                .recall-summary strong{color:#b976f7}
                .recall-group-actions{display:flex;justify-content:flex-end;gap:6px;margin-bottom:8px}
                .recall-group-actions button{padding:6px 8px;border:1px solid var(--border);border-radius:7px;
                    background:transparent;color:#d8b4fe;font-size:10px;font-weight:600;cursor:pointer}
                .recall-group-actions button:hover{background:rgba(185,118,247,.12)}
                .recall-agent-group{margin-bottom:10px}
                .recall-group-toggle{width:100%;display:flex;align-items:center;gap:8px;padding:9px 10px;
                    border:1px solid var(--border);border-radius:8px;background:rgba(28,16,38,.55);
                    color:#fff;text-align:left;cursor:pointer}
                .recall-group-toggle strong{flex:1;min-width:0;overflow-wrap:anywhere;font-size:12px}
                .recall-group-count{min-width:22px;padding:2px 7px;border-radius:10px;background:rgba(185,118,247,.16);
                    color:#d8b4fe;text-align:center;font-size:10px;font-weight:700}
                .recall-group-chevron{color:#b976f7;transition:transform .15s ease}
                .recall-group-toggle[aria-expanded="true"] .recall-group-chevron{transform:rotate(180deg)}
                .recall-group-content{padding-top:7px}
                .recall-group-content[hidden]{display:none}
                .recall-filter{padding:10px;border:1px solid var(--border);border-radius:12px;
                    background:var(--card);margin-bottom:10px}
                .recall-filter label{display:block;color:#b976f7;font-size:10px;font-weight:700;
                    letter-spacing:.5px;text-transform:uppercase;margin-bottom:6px}
                .recall-filter-row{display:flex;align-items:center;gap:7px}
                .recall-filter-row input{flex:1;min-width:0}
                .recall-agent-filter{margin-top:8px}
                .recall-same-day-filter{display:flex;align-items:flex-start;gap:7px;margin-top:9px}
                .recall-same-day-filter input{width:15px;height:15px;flex:none;margin-top:1px;accent-color:#b976f7}
                .recall-filter .recall-same-day-filter label{margin:0;color:rgba(255,255,255,.75);font-size:11px;
                    font-weight:500;letter-spacing:0;text-transform:none}
                .recall-filter-clear{width:36px;height:36px;display:flex;align-items:center;justify-content:center;
                    padding:0;border:1px solid var(--border);border-radius:7px;background:transparent;color:#b976f7;cursor:pointer}
                .recall-filter-clear:hover{background:rgba(185,118,247,.12)}
                .recall-entry{padding:11px 12px;border:1px solid var(--border);border-left:3px solid #b976f7;
                    border-radius:10px;background:var(--card);margin-bottom:8px}
                .recall-customer{font-size:13px;font-weight:700;overflow-wrap:anywhere}
                .recall-dni{color:#b976f7;font-size:12px;font-weight:700;margin-top:4px}
                .recall-timeline{display:grid;gap:8px;margin-top:12px}
                .recall-step{min-width:0;padding:2px 0 2px 10px;border-left:2px solid rgba(185,118,247,.55)}
                .recall-step-label{display:block;color:#b976f7;font-size:10px;font-weight:700;text-transform:uppercase}
                .recall-step-agent{display:block;margin-top:3px;color:#fff;font-size:11px;font-weight:600;overflow-wrap:anywhere}
                .recall-step-id{display:block;margin-top:2px;color:rgba(255,255,255,.55);font-size:10px;overflow-wrap:anywhere}
                .recall-step-time{display:flex;align-items:center;gap:5px;margin-top:4px;color:rgba(255,255,255,.7);font-size:10px}
                .recall-step-time .icon-svg{width:11px;height:11px;flex:none}
                .note-editor{padding:12px}
                .note-editor textarea{min-height:130px;resize:vertical;margin:7px 0;color:#fff !important;
                    -webkit-text-fill-color:#fff;line-height:1.5}
                .note-editor input[type=text]{min-height:40px;color:#fff !important;-webkit-text-fill-color:#fff}
                .note-editor-actions{display:flex;gap:7px;align-items:center;flex-wrap:wrap}
                .note-editor-actions .button{min-width:112px}
                .cancel-edit[hidden]{display:none}
                .editing-note-label{display:none;margin-bottom:7px;color:#e9d5ff;font-size:11px;font-weight:700}
                .note-editor.is-editing .editing-note-label{display:block}
                .note-editor.is-editing{border-color:rgba(245,158,11,.6);box-shadow:0 0 0 1px rgba(245,158,11,.15)}
                .note-title{font-weight:700;color:#d8b4fe;margin-bottom:5px;overflow-wrap:anywhere}
                .note-text{color:#f3edf8;white-space:pre-wrap;overflow-wrap:anywhere;margin:7px 0;line-height:1.5}
                .note.is-editing{border-color:#f59e0b;box-shadow:0 0 0 1px rgba(245,158,11,.25)}
                .notes-toolbar{display:flex;justify-content:flex-end;gap:6px;margin:0 0 8px}
                .note-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}
                .note-heading .note-title{flex:1;min-width:0}
                .note-content[hidden]{display:none}
                .view[data-view="vault"] button{padding:9px 11px;border:0;border-radius:8px;background:#7a22b4;color:#fff;
                    font:inherit;cursor:pointer;transition:background .15s ease}
                .view[data-view="vault"] button:hover{background:#8b2bc5}
                .view[data-view="vault"] button:focus-visible{outline:2px solid #d8b4fe;outline-offset:2px}
                .note-actions{display:flex;gap:5px;flex-wrap:wrap}
                .confirming{background:#b91c1c!important}
                .footer{border-top:1px solid var(--border)}.footer button{width:100%;background:var(--card);color:#fff;border:1px solid var(--border);
                    border-radius:8px;padding:9px;cursor:pointer}
                .footer button:hover{background:#7a22b4}
                .muted{text-align:center;opacity:.65;padding:12px;font-size:12px}.copied{border-color:#10b981}
                @media(max-width:430px){
                    .panel{top:10px;right:10px;max-height:calc(100vh - 20px)}
                    .tabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr))}
                    .tab-button{padding:9px 3px;font-size:11px}
                    .tab-count{display:none}
                }
            `;
            shadow.appendChild(style);
        }

        function buildShell() {
            root = document.createElement("div");
            root.id = CONFIG.rootId;
            shadow = root.attachShadow({ mode: "open" });
            addStyles();

            const panel = Core.createElement("section", "panel");
            panel.innerHTML = `
                <header class="header" id="drag-handle">
                    <div><h2>Generador de Plantillas</h2><p>lowi.es — Maestro Principal</p></div>
                    <div class="header-actions">
                        <button id="restore-panel" type="button" aria-label="Mostrar interfaz" title="Mostrar interfaz" hidden>+</button>
                        <button class="close" id="close" type="button" aria-label="Cerrar" title="Cerrar">×</button>
                    </div>
                </header>
                <nav class="tabs" aria-label="Secciones">
                    <button class="tab-button active" data-tab="templates">Plantillas</button>
                    <button class="tab-button" data-tab="history">Historial</button>
                    <button class="tab-button" data-tab="followups" hidden>Seguimientos</button>
                    <button class="tab-button" data-tab="recall">Rellamantes</button>
                    <button class="tab-button" data-tab="vault">Baúl</button>
                </nav>
                <main class="body" id="body">
                    <section class="view active" data-view="templates" id="templates-view"></section>
                    <section class="view" data-view="history" id="history-view">
                        <div class="calendar">
                            <label for="history-date">FILTRO Y LIMPIEZA</label>
                            <div class="danger-row">
                                <input id="history-date" type="date">
                                <button class="clear" id="clear-history" type="button" title="Limpiar historial"
                                        aria-label="Limpiar historial"></button>
                            </div>
                        </div>
                        <div class="stats">
                            <div class="stat total"><span class="stat-label">Total copiadas</span><strong id="total-count">0</strong></div>
                            <div class="stat"><span class="stat-label" id="fiber-label">Fibra</span><strong id="fiber-count">0</strong></div>
                            <div class="stat tv-stat"><span class="stat-label" id="tv-label">TV</span><strong id="tv-count">0</strong></div>
                        </div>
                        <div id="history-list"></div>
                    </section>
                    <section class="view" data-view="followups" id="followups-view">
                        <div class="followup-date-range">
                            <label for="followups-date">FECHA DEL SEGUIMIENTO
                                <input id="followups-date" type="date">
                            </label>
                            <button class="followup-date-clear" id="clear-followups-date" type="button">
                                Limpiar
                            </button>
                        </div>
                        <div id="followups-list"></div>
                    </section>
                    <section class="view" data-view="recall" id="recall-view">
                        <div class="recall-filter">
                            <label for="recall-date">FILTRAR POR FECHA DE RELLAMADA</label>
                            <div class="recall-filter-row">
                                <input id="recall-date" type="date" aria-label="Filtrar por fecha de rellamada">
                                <button class="recall-filter-clear" id="clear-recall-date" type="button"
                                    title="Quitar filtro de fecha" aria-label="Quitar filtro de fecha">
                                    ×
                                </button>
                            </div>
                            <div class="recall-same-day-filter">
                                <input id="recall-same-day" type="checkbox">
                                <label for="recall-same-day">Solo atención y rellamada del mismo día</label>
                            </div>
                            <div class="recall-agent-filter" id="recall-supervisor-filter-container" hidden>
                                <label for="recall-supervisor-filter">FILTRAR POR SUPERVISOR</label>
                                <select id="recall-supervisor-filter" aria-label="Filtrar rellamadas por supervisor"></select>
                            </div>
                            <div class="recall-agent-filter" id="recall-group-filter-container" hidden>
                                <label for="recall-group-filter">ORGANIZAR RESULTADOS</label>
                                <select id="recall-group-filter" aria-label="Agrupar rellamadas">
                                    <option value="all">Todas las rellamadas</option>
                                    <option value="agent">Por agente de atención inicial</option>
                                </select>
                            </div>
                            <div class="recall-agent-filter" id="recall-agent-filter-container" hidden>
                                <label for="recall-agent-filter">BUSCAR POR NOMBRE O CITRIX</label>
                                <input id="recall-agent-filter" type="text" placeholder="Nombre o Citrix..."
                                    autocomplete="off" aria-label="Buscar rellamadas por nombre o Citrix">
                            </div>
                        </div>
                        <div id="recall-list"></div>
                    </section>
                    <section class="view" data-view="vault" id="vault-view">
                        <div class="note-editor" id="note-editor">
                            <div class="editing-note-label" id="editing-note-label" aria-live="polite"></div>
                            <input id="note-title" type="text" maxlength="120" placeholder="Título (opcional)">
                            <textarea id="note-content" maxlength="10000" placeholder="Escribe una nota..."></textarea>
                            <div class="note-editor-actions">
                                <button class="button" id="save-note" type="button">Guardar nota</button>
                                <button class="cancel-edit" id="cancel-note-edit" type="button" hidden>Cancelar edición</button>
                            </div>
                        </div>
                        <div id="notes-list"></div>
                    </section>
                </main>
                <footer class="footer"><button id="toggle-panel" type="button">Ocultar interfaz</button></footer>
            `;
            shadow.appendChild(panel);
            shadow.getElementById("close").replaceChildren(Icons.create("close"));
            shadow.getElementById("clear-history").appendChild(Icons.create("trash"));
            shadow.getElementById("fiber-label").prepend(Icons.create("bolt"), " ");
            shadow.getElementById("tv-label").prepend(Icons.create("tv"), " ");
            shadow.getElementById("clear-recall-date").replaceChildren(Icons.create("close"));
            shadow.getElementById("recall-agent-filter-container").hidden = !state.isAdmin;
            shadow.getElementById("recall-group-filter-container").hidden = !state.isAdmin;
            const supervisorFilter = shadow.getElementById("recall-supervisor-filter-container");
            supervisorFilter.hidden = !state.isAdmin;
            const supervisorSelect = shadow.getElementById("recall-supervisor-filter");
            const allSupervisors = Core.createElement("option", "", "Todos los supervisores");
            allSupervisors.value = "";
            supervisorSelect.appendChild(allSupervisors);
            state.supervisors.forEach(supervisor => {
                const option = Core.createElement("option", "", supervisor.label);
                option.value = supervisor.value;
                supervisorSelect.appendChild(option);
            });
            document.body.appendChild(root);

            selectedDate = shadow.getElementById("history-date");
            selectedDate.value = Core.todayLocal();
            shadow.getElementById("recall-date").value = "";
            bindShellEvents(panel);
            setupDrag(shadow.getElementById("drag-handle"), panel);
        }

        function bindShellEvents(panel) {
            shadow.getElementById("close").addEventListener("click", () => root.remove());
            const body = shadow.getElementById("body");
            const nav = shadow.querySelector(".tabs");
            const toggleButton = shadow.getElementById("toggle-panel");
            const restoreButton = shadow.getElementById("restore-panel");
            const setInterfaceVisible = visible => {
                body.hidden = !visible;
                nav.hidden = !visible;
                panel.style.maxHeight = visible ? "calc(100vh - 40px)" : "75px";
                toggleButton.textContent = visible ? "Ocultar interfaz" : "Mostrar interfaz";
                restoreButton.hidden = visible;
            };
            shadow.getElementById("toggle-panel").addEventListener("click", event => {
                setInterfaceVisible(body.hidden);
            });
            restoreButton.addEventListener("click", () => setInterfaceVisible(true));
            shadow.querySelectorAll(".tab-button").forEach(button => {
                button.addEventListener("click", () => {
                    shadow.querySelectorAll(".tab-button").forEach(tab => tab.classList.remove("active"));
                    shadow.querySelectorAll(".view").forEach(view => view.classList.remove("active"));
                    button.classList.add("active");
                    shadow.querySelector(`[data-view="${button.dataset.tab}"]`).classList.add("active");
                    if (button.dataset.tab === "history") renderHistory();
                    if (button.dataset.tab === "followups") renderFollowups();
                    if (button.dataset.tab === "recall") {
                        state.recallers = null;
                        renderRecallers();
                    }
                    if (button.dataset.tab === "vault") renderNotes();
                });
            });
            selectedDate.addEventListener("change", () => renderHistory());
            shadow.getElementById("recall-date").addEventListener("change", renderRecallers);
            shadow.getElementById("recall-same-day").addEventListener("change", renderRecallers);
            shadow.getElementById("recall-supervisor-filter").addEventListener("change", renderRecallers);
            shadow.getElementById("recall-group-filter").addEventListener("change", renderRecallers);
            shadow.getElementById("recall-agent-filter").addEventListener("input", renderRecallers);
            shadow.getElementById("followups-date").addEventListener("change", renderFollowups);
            shadow.getElementById("clear-followups-date").addEventListener("click", () => {
                shadow.getElementById("followups-date").value = "";
                renderFollowups();
            });
            shadow.getElementById("clear-recall-date").addEventListener("click", () => {
                shadow.getElementById("recall-date").value = "";
                renderRecallers();
            });
            shadow.getElementById("clear-history").addEventListener("click", clearHistory);
            shadow.getElementById("save-note").addEventListener("click", saveNote);
            shadow.getElementById("note-content").addEventListener("input", resizeNoteEditor);
            shadow.getElementById("cancel-note-edit").addEventListener("click", () => {
                resetNoteEditor();
                notify("Edición cancelada.");
            });
        }

        function setupDrag(handle, panel) {
            let pointerX = 0;
            let pointerY = 0;
            let dragging = false;
            handle.addEventListener("pointerdown", event => {
                if (event.target.closest("button,input,textarea")) return;
                dragging = true;
                pointerX = event.clientX;
                pointerY = event.clientY;
                handle.setPointerCapture(event.pointerId);
            });
            handle.addEventListener("pointermove", event => {
                if (!dragging) return;
                const dx = event.clientX - pointerX;
                const dy = event.clientY - pointerY;
                pointerX = event.clientX;
                pointerY = event.clientY;
                const rect = panel.getBoundingClientRect();
                panel.style.right = "auto";
                panel.style.left = `${Math.max(0, Math.min(window.innerWidth - rect.width, rect.left + dx))}px`;
                panel.style.top = `${Math.max(0, Math.min(window.innerHeight - 50, rect.top + dy))}px`;
            });
            const stop = () => { dragging = false; };
            handle.addEventListener("pointerup", stop);
            handle.addEventListener("pointercancel", stop);
        }

        // Vista de plantillas: categorías, grupos y botones para copiar tipificaciones.
        function createTemplateView() {
            const container = shadow.getElementById("templates-view");
            if (!state.templates) {
                container.appendChild(Core.createElement("p", "muted", "No se pudieron cargar las plantillas."));
                return;
            }
            if (!state.services.length) {
                container.appendChild(Core.createElement("p", "muted",
                    "No se localizó información del servicio de Internet en la pantalla."));
                return;
            }

            state.services.forEach((service, serviceIndex) => {
                Object.entries(state.templates).forEach(([category, groups], categoryIndex) => {
                    if (!groups || typeof groups !== "object" || Array.isArray(groups)) return;
                    const categoryId = `category-${serviceIndex}-${categoryIndex}`;
                    const categoryElement = Core.createElement("section", "category");
                    const isTv = /tv|tele/i.test(category);
                    const trigger = Core.createElement("button", "accordion");
                    trigger.type = "button";
                    trigger.setAttribute("aria-expanded", "false");
                    const categoryHeading = Core.createElement("span", "category-heading");
                    const categoryIcon = Core.createElement("span", "icon-circle-main");
                    categoryIcon.appendChild(Icons.create(isTv ? "tv" : "wifi"));
                    const categoryLabel = Core.createElement("span", "",
                        `${category}${state.services.length > 1 ? ` (${service.title})` : ""}`);
                    categoryHeading.append(categoryIcon, categoryLabel);
                    trigger.append(categoryHeading, Icons.create("chevron", "icon-svg chevron"));
                    const content = Core.createElement("div", "accordion-content");
                    content.id = categoryId;
                    trigger.addEventListener("click", () => {
                        content.classList.toggle("open");
                        const expanded = content.classList.contains("open");
                        trigger.setAttribute("aria-expanded", String(expanded));
                    });

                    Object.entries(groups).forEach(([group, templates], groupIndex) => {
                        if (!templates || typeof templates !== "object" || Array.isArray(templates)) return;
                        const subgroup = Core.createElement("section", "subgroup");
                        const groupTrigger = Core.createElement("button", "group-trigger");
                        groupTrigger.type = "button";
                        groupTrigger.setAttribute("aria-expanded", "false");
                        const groupHeading = Core.createElement("span", "group-heading");
                        const groupIcon = Core.createElement("span", `sub-cat-circle ${isTv ? "tv" : "fibra"}`);
                        groupIcon.appendChild(Icons.create(isTv ? "tv" : "bolt"));
                        groupHeading.append(groupIcon, Core.createElement("span", "", group));
                        groupTrigger.append(groupHeading, Icons.create("chevron", "icon-svg chevron"));
                        const subgroupContent = Core.createElement("div", "subgroup-content");
                        subgroupContent.id = `group-${serviceIndex}-${categoryIndex}-${groupIndex}`;
                        groupTrigger.addEventListener("click", () => {
                            subgroupContent.classList.toggle("open");
                            groupTrigger.setAttribute("aria-expanded",
                                String(subgroupContent.classList.contains("open")));
                        });

                        Object.entries(templates).forEach(([templateName, template]) => {
                            const button = Core.createElement("button", "template");
                            button.type = "button";
                            const templateLabel = Core.createElement("span", "template-label", templateName);
                            const copyLabel = Core.createElement("span", "template-copy");
                            copyLabel.append(Icons.create("copy"), " Copiar");
                            button.append(templateLabel, copyLabel);
                            button.addEventListener("click", () =>
                                copyTemplate(button, service, category, group, templateName, template));
                            subgroupContent.appendChild(button);
                        });
                        subgroup.append(groupTrigger, subgroupContent);
                        content.appendChild(subgroup);
                    });
                    categoryElement.append(trigger, content);
                    container.appendChild(categoryElement);
                });
            });
        }

        // Resuelve los textos fijos o dinámicos que componen una tipificación.
        function resolveTemplate(category, group, name, original, service) {
            const result = Array.isArray(original) ? [...original] : ["", "", "", ""];
            while (result.length < 4) result.push("");
            const technology = Extractor.getTechnology(service.text);
            const markers = TEMPLATE_MARKERS;
            const dynamic = markers[result[1]];

            if (dynamic === "incommunicated") {
                if (technology === "HFC") {
                    result[1] = "router con luces intermitentes, sin acceso remoto al CPE; se valida cableado sin daños";
                    result[2] = "posible daño en acometida HFC";
                } else {
                    const hasAlarm = Extractor.hasOntAlarm(service.text);
                    result[1] = hasAlarm
                        ? "ONT en rojo en alarm, sin acceso remoto; se valida cableado sin daños y sin acceso a CPE"
                        : "router con ONT integrada sin sincronismo; cableado validado y correctamente conectado";
                    result[2] = hasAlarm ? "posible daño en tramo óptico" : "posible daño en fibra";
                }
            } else if (dynamic === "cutsResolved") {
                result[1] = technology === "HFC"
                    ? "Se revisan cortes en THOT de los últimos 7 días, se reinicia de fábrica y se ajusta cableado y bandas; conexión estable"
                    : "Se revisan cortes en Schaman, se reinicia de fábrica y se ajusta cableado; señal estable en ambas bandas Wi-Fi";
            } else if (dynamic === "cutsTechnician") {
                result[1] = technology === "HFC"
                    ? "Se validan cortes en THOT; reinicio de fábrica sin mejora tras prueba de conexión"
                    : "Cortes validados en Schaman; reinicio de fábrica sin mejora";
                result[2] = technology === "HFC"
                    ? "Señal degradada tras saturación del CPE"
                    : "Posible daño en CPE";
            } else if (dynamic === "cutsLevelTwo") {
                result[1] = technology === "HFC"
                    ? "Se validan cortes breves persistentes en THOT; se reinicia de fábrica y se escala a nivel 2"
                    : "Cortes persistentes validados en Schaman; las pruebas de vídeo y red no resuelven la incidencia";
            } else if (dynamic === "thresholdResolved") {
                result[1] = technology === "HFC"
                    ? "Se validan parámetros fuera de umbrales en THOT, se reinicia de fábrica y parámetros SNMP, flaps y QoS; pruebas correctas"
                    : "Se validan parámetros fuera de umbrales en Schaman, se reinicia de fábrica y se separan bandas; pruebas correctas";
                result[3] = technology === "HFC"
                    ? "Se reinicia de fábrica, se ajustan parámetros SNMP y bandas, y se confirma con el cliente la estabilidad"
                    : "Se deja resuelto";
            } else if (dynamic === "thresholdNotResolved") {
                result[1] = technology === "HFC"
                    ? "Parámetros fuera de umbrales en THOT; reinicio de fábrica y parámetros sin mejora"
                    : "Parámetros fuera de umbrales en Schaman";
            } else if (dynamic === "thresholdSolution") {
                result[3] = technology === "HFC"
                    ? "Se reinicia de fábrica, se ajustan parámetros SNMP y bandas, y se confirma con el cliente la estabilidad"
                    : "Se reinicia de fábrica, se separan bandas y se comprueba con el cliente que no persisten anomalías";
            }

            return { fields: result, technology };
        }

        // Copia la tipificación, actualiza el historial local y sincroniza con Supabase.
        async function copyTemplate(button, service, category, group, name, template) {
            try {
                const { fields, technology } = resolveTemplate(category, group, name, template, service);
                const client = Extractor.getValue(["Nombre del cliente:", "Nombre:", "Cliente:", "Titular:"]);
                const documentId = Extractor.getDocument();
                const customerId = Extractor.getValue(["AMDOCS ID:", "ID Cliente:", "ID:"]);
                const address = Extractor.getAddress(service.text);
                const mobiles = Extractor.getMobileNumbers();
                const speed = service.text.match(/(\d+(?:[.,]\d+)?\s*(?:Mbps|Gbps))/i)?.[1] || "600Mbps";
                const date = new Intl.DateTimeFormat("es-ES", {
                    day: "numeric", month: "long", year: "numeric"
                }).format(new Date());
                const text = [
                    `Nombre: ${client}`,
                    `DNI/NIE: ${documentId}`,
                    `ID: ${customerId}`,
                    `Dirección: ${address}`,
                    `Móvil: ${mobiles}`,
                    `• Qué dice el cliente que le sucede: ${fields[0] || "N/A"}`,
                    `• Pruebas realizadas: ${fields[1] || "N/A"}`,
                    `• Diagnóstico: ${fields[2] || "N/A"}`,
                    `• Solución: ${fields[3] || "N/A"}`,
                    "• Avería: #AVERIA / NA",
                    `Tecnología: ${technology}`,
                    `Velocidad: ${speed}`,
                    `Fecha: ${date}`
                ].join("\n");

                await Core.copyText(text);
                const entry = {
                    cliente: client, dni: documentId, subCat: group,
                    clase: category.toLowerCase().includes("tv") ||
                        category.toLowerCase().includes("tele") ? "tv" : "fibra",
                    plantilla: name, agenteId: state.agentId
                };
                if (state.agentId && !LocalHistory.add(entry)) {
                    notify("Copiado, pero no se pudo guardar el historial local.", true);
                }
                button.classList.add("copied");
                window.setTimeout(() => button.classList.remove("copied"), 1200);
                if (!state.agentId) {
                    notify("Copiado. No se guardó el historial porque no se pudo identificar al agente.", true);
                } else {
                    notify(`Copiado: ${name}`);
                }
                if (state.db && state.agentId) {
                    try {
                        const result = await state.db.from("logs_soporte").insert([{
                            agente_id: state.agentId,
                            cliente: client,
                            dni: documentId,
                            sub_cat: group,
                            clase: entry.clase,
                            plantilla: name,
                            fecha_str: Core.todayLocal(),
                            hora_str: new Intl.DateTimeFormat("es-ES", {
                                hour: "2-digit", minute: "2-digit"
                            }).format(new Date())
                        }]);
                        DataClient.assertSuccess(result);
                    } catch (error) {
                        console.error("La plantilla se copió, pero no se sincronizó el historial.", error);
                        notify(`Copiado; falló la sincronización del historial: ${error.message}`, true);
                    }
                }
            } catch (error) {
                console.error("No se pudo generar/copiar la plantilla.", error);
                notify(`No se pudo completar la operación: ${error.message}`, true);
            }
        }

        function showEmpty(container, message) {
            container.replaceChildren(Core.createElement("p", "muted", message));
        }

        async function loadFollowupAlerts() {
            const result = await state.db.from("g_seguimientos")
                .select("id,agente_id,cliente,dni,due_at,reminder_mode,notified_stages")
                .eq("agente_id", state.agentId)
                .order("due_at", { ascending: true });
            return DataClient.assertSuccess(result) || [];
        }

        function getAdminTeamAgentIds() {
            if (!state.isAdmin || !state.adminSupervisorName || !state.supervisorAssignments) return [];
            const supervisorName = normalizeRecallSearch(state.adminSupervisorName);
            return [...state.supervisorAssignments]
                .filter(([, assignment]) =>
                    normalizeRecallSearch(assignment.supervisor) === supervisorName)
                .map(([agentId]) => agentId);
        }

        async function loadTeamFollowupAlerts() {
            if (!state.isAdmin) return [];
            if (!state.adminSupervisorName) {
                throw new Error("Completa supervisor_nombre para tu agente en g_usuarios_roles.");
            }
            if (!state.supervisorAssignments) {
                throw new Error("No se pudo cargar la relación de agentes y supervisores.");
            }
            const agentIds = getAdminTeamAgentIds();
            if (!agentIds.length) return [];
            return fetchAllRows(() => state.db.from("g_seguimientos")
                .select("id,agente_id,cliente,dni,due_at,reminder_mode,notified_stages")
                .in("agente_id", agentIds)
                .order("due_at", { ascending: true }));
        }

        async function loadPendingManualReminders() {
            const result = await state.db.from("g_seguimientos_recordatorios")
                .select("id,seguimiento_id,mensaje,supervisor_nombre,created_at")
                .eq("agente_id", state.agentId)
                .is("acknowledged_at", null)
                .order("created_at", { ascending: true });
            return DataClient.assertSuccess(result) || [];
        }

        function localDateTimeValue(date) {
            const pad = value => String(value).padStart(2, "0");
            return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
                `T${pad(date.getHours())}:${pad(date.getMinutes())}`;
        }

        function getFollowupMilestones(alert) {
            const dueAt = new Date(alert.due_at).getTime();
            if (!Number.isFinite(dueAt)) return [];
            const reminders = alert.reminder_mode === "days"
                ? [{ key: "day_before", label: "Queda 1 día", offset: 86400000 }]
                : [
                    { key: "one_hour", label: "Queda 1 hora", offset: 3600000 },
                    { key: "thirty_minutes", label: "Quedan 30 minutos", offset: 1800000 },
                    { key: "fifteen_minutes", label: "Quedan 15 minutos", offset: 900000 }
                ];
            return [
                ...reminders.map(reminder => ({
                    ...reminder,
                    at: dueAt - reminder.offset
                })),
                { key: "due", label: "Es momento de llamar", at: dueAt }
            ];
        }

        function formatFollowupDate(value) {
            const date = new Date(value);
            if (Number.isNaN(date.getTime())) return "Fecha no disponible";
            return new Intl.DateTimeFormat("es-ES", {
                day: "2-digit", month: "2-digit", year: "numeric",
                hour: "2-digit", minute: "2-digit"
            }).format(date);
        }

        async function saveFollowupAlert(record, dueAtValue, button) {
            const dni = normalizeDni(record.dni);
            if (!state.db || !state.agentId || !dni) return;
            const dueAt = new Date(dueAtValue);
            if (!Number.isFinite(dueAt.getTime()) || dueAt.getTime() <= Date.now()) {
                notify("Selecciona una fecha y hora futura para el seguimiento.", true);
                return;
            }
            button.disabled = true;
            try {
                const reminderMode = dueAt.getTime() - Date.now() > 86400000 ? "days" : "hours";
                const result = await state.db.from("g_seguimientos").upsert([{
                    agente_id: state.agentId,
                    cliente: record.cliente || "N/A",
                    dni,
                    due_at: dueAt.toISOString(),
                    reminder_mode: reminderMode,
                    notified_stages: []
                }], { onConflict: "agente_id,dni" });
                DataClient.assertSuccess(result);
                notify(`Seguimiento programado para ${formatFollowupDate(dueAt)}.`);
                await renderHistory();
                await runFollowupScheduler();
            } catch (error) {
                console.error("No se pudo programar la alerta de seguimiento.", error);
                notify(`No se pudo programar la alerta: ${error.message}`, true);
                button.disabled = false;
            }
        }

        async function removeFollowupAlert(alert, button) {
            if (!state.db || !state.agentId || !alert?.id) return;
            button.disabled = true;
            try {
                const result = await state.db.from("g_seguimientos").delete()
                    .eq("id", alert.id)
                    .eq("agente_id", state.agentId);
                DataClient.assertSuccess(result);
                notify(`Alerta de seguimiento eliminada para ${alert.dni}.`);
                await renderHistory();
                await runFollowupScheduler();
            } catch (error) {
                console.error("No se pudo eliminar la alerta de seguimiento.", error);
                notify(`No se pudo eliminar la alerta: ${error.message}`, true);
                button.disabled = false;
            }
        }

        async function sendManualFollowupReminder(alert, button) {
            const teamAgentIds = getAdminTeamAgentIds();
            if (!state.isAdmin || !state.adminSupervisorName ||
                !teamAgentIds.includes(String(alert.agente_id || "").toLowerCase())) {
                notify("No tienes permisos para enviar un recordatorio a este agente.", true);
                return;
            }
            if (!state.teamFollowupAlerts.some(item => String(item.id) === String(alert.id))) {
                notify("El seguimiento ya no está activo o no se encuentra disponible.", true);
                await runFollowupScheduler();
                return;
            }
            button.disabled = true;
            try {
                const result = await state.db.from("g_seguimientos_recordatorios").insert([{
                    seguimiento_id: alert.id,
                    agente_id: alert.agente_id,
                    supervisor_agente_id: state.agentId,
                    supervisor_nombre: state.adminSupervisorName,
                    mensaje: `Se te recuerda realizar el seguimiento programado para ${formatFollowupDate(alert.due_at)}.`
                }]).select("id");
                const rows = DataClient.assertSuccess(result) || [];
                if (!rows.length) throw new Error("Supabase no confirmó el envío del recordatorio.");
                notify(`Recordatorio enviado a ${alert.cliente || alert.agente_id}.`);
            } catch (error) {
                console.error("No se pudo enviar el recordatorio manual.", error);
                notify(`No se pudo enviar el recordatorio: ${error.message}`, true);
                button.disabled = false;
            }
        }

        async function openCustomerByDni(dni) {
            const documentId = normalizeDni(dni);
            if (!documentId) {
                notify("La alerta no contiene un DNI válido.", true);
                return false;
            }
            const customerWindow = window.open(
                new URL("/bo/milowi/user/", window.location.origin).href,
                "_blank"
            );
            if (!customerWindow) {
                notify(
                    "El navegador bloqueó la apertura de la ficha. Permite ventanas emergentes y vuelve a intentarlo.",
                    true,
                    {
                        label: "Reintentar",
                        onClick: () => openCustomerByDni(documentId)
                    }
                );
                return false;
            }

            try {
                const deadline = Date.now() + 20000;
                while (Date.now() < deadline) {
                    if (customerWindow.closed) throw new Error("Se cerró la pestaña de búsqueda.");
                    const searchInput = customerWindow.document.querySelector("#id_value");
                    const searchButton = customerWindow.document.querySelector(
                        'input[type="submit"][value="Buscar"]'
                    );
                    if (customerWindow.document.readyState === "complete" &&
                        searchInput?.form && searchButton?.form === searchInput.form) {
                        searchInput.focus();
                        searchInput.value = documentId;
                        Core.dispatchChange(searchInput);
                        searchButton.click();
                        return true;
                    }
                    await Core.wait(250);
                }
                throw new Error("No se encontró el formulario de búsqueda por DNI en Lowi.");
            } catch (error) {
                console.error("No se pudo abrir la ficha del cliente desde la alerta.", error);
                notify(`No se pudo abrir la ficha de ${documentId}: ${error.message}`, true, {
                    label: "Reintentar",
                    onClick: () => openCustomerByDni(documentId)
                });
                return false;
            }
        }

        function enqueueFollowupToast(alert, milestone, manualReminder = null) {
            state.followupToastQueue.push({ alert, milestone, manualReminder });
            if (state.followupToastQueue.length > 1) return;
            showNextFollowupToast();
        }

        function showNextFollowupToast() {
            window.clearTimeout(state.followupToastTimer);
            const item = state.followupToastQueue.shift();
            if (!item) return;
            const { alert, milestone, manualReminder } = item;
            notify(
                manualReminder
                    ? `${manualReminder.mensaje} (${manualReminder.supervisor_nombre})`
                    : `${milestone.label}: ${alert.cliente || "Cliente"} (${alert.dni}) — ${formatFollowupDate(alert.due_at)}`,
                false,
                {
                    label: manualReminder ? "Ver seguimiento" : "Ver cliente",
                    onClick: async () => {
                        const opened = await openCustomerByDni(alert.dni);
                        if (!opened || !manualReminder) return opened;
                        const result = await state.db.from("g_seguimientos_recordatorios")
                            .update({ acknowledged_at: new Date().toISOString() })
                            .eq("id", manualReminder.id)
                            .eq("agente_id", state.agentId)
                            .is("acknowledged_at", null)
                            .select("id");
                        if (!(DataClient.assertSuccess(result) || []).length) {
                            throw new Error("No se pudo confirmar la recepción del recordatorio.");
                        }
                        return true;
                    }
                }
            );
            state.followupToastTimer = window.setTimeout(showNextFollowupToast, 12500);
        }

        function updateFollowupTab(alerts, teamAlerts = state.teamFollowupAlerts) {
            state.followupAlerts = alerts;
            state.teamFollowupAlerts = teamAlerts;
            const tab = shadow?.querySelector('[data-tab="followups"]');
            if (!tab) return;
            const totalAlerts = alerts.length + (state.isAdmin ? teamAlerts.length : 0);
            tab.hidden = totalAlerts === 0;
            tab.replaceChildren(
                document.createTextNode("Seguimientos"),
                ...(totalAlerts
                    ? [Core.createElement("span", "tab-count", String(totalAlerts))]
                    : [])
            );
            if (!totalAlerts && tab.classList.contains("active")) {
                tab.classList.remove("active");
                shadow.querySelector('[data-view="followups"]').classList.remove("active");
                shadow.querySelector('[data-tab="templates"]').classList.add("active");
                shadow.querySelector('[data-view="templates"]').classList.add("active");
            }
            if (shadow.querySelector('[data-view="followups"].active')) renderFollowups();
        }

        function renderFollowups() {
            const container = shadow.getElementById("followups-list");
            const selectedFollowupDate = shadow.getElementById("followups-date").value;
            container.replaceChildren();
            const isInDateRange = alert => {
                const dueAt = new Date(alert.due_at);
                if (Number.isNaN(dueAt.getTime())) return false;
                const followupDate = localDateTimeValue(dueAt).slice(0, 10);
                return !selectedFollowupDate || followupDate === selectedFollowupDate;
            };
            const alerts = state.followupAlerts.filter(isInDateRange);
            const teamAlerts = state.teamFollowupAlerts.filter(isInDateRange);
            if (!alerts.length && !teamAlerts.length) {
                showEmpty(container, selectedFollowupDate
                    ? "No hay seguimientos activos para la fecha seleccionada."
                    : "No hay seguimientos activos.");
                return;
            }
            const renderCard = (alert, isTeamAlert = false) => {
                const card = Core.createElement("article", "followup-card");
                const dueAt = new Date(alert.due_at);
                const overdue = Number.isFinite(dueAt.getTime()) && dueAt.getTime() <= Date.now();
                card.append(
                    Core.createElement("div", "followup-card-title", alert.cliente || "Cliente"),
                    Core.createElement("div", "followup-card-dni", `DNI/NIE: ${alert.dni || "N/A"}`),
                    ...(isTeamAlert
                        ? [Core.createElement(
                            "div", "followup-card-agent",
                            `Agente: ${state.supervisorAssignments.get(String(alert.agente_id).toLowerCase())?.nombreCompleto || alert.agente_id}`
                        )]
                        : []),
                    Core.createElement("div", "followup-card-date",
                        `Llamar: ${formatFollowupDate(alert.due_at)}`),
                    Core.createElement("div", "followup-card-status",
                        overdue ? "Pendiente de realizar" : "Programado")
                );
                const actions = Core.createElement("div", "followup-card-actions");
                const openButton = Core.createElement("button", "", "Ver cliente");
                openButton.type = "button";
                openButton.addEventListener("click", () => openCustomerByDni(alert.dni));
                actions.appendChild(openButton);
                if (isTeamAlert) {
                    const remindButton = Core.createElement("button", "remind", "Enviar recordatorio");
                    remindButton.type = "button";
                    remindButton.addEventListener("click", () =>
                        sendManualFollowupReminder(alert, remindButton));
                    actions.appendChild(remindButton);
                } else {
                    const completeButton = Core.createElement("button", "", "Marcar realizado");
                    completeButton.type = "button";
                    completeButton.addEventListener("click", () =>
                        removeFollowupAlert(alert, completeButton));
                    actions.appendChild(completeButton);
                }
                card.appendChild(actions);
                container.appendChild(card);
            };
            alerts.forEach(alert => renderCard(alert));
            if (state.isAdmin && teamAlerts.length) {
                const teams = new Map();
                teamAlerts.forEach(alert => {
                    const assignment = state.supervisorAssignments.get(
                        String(alert.agente_id || "").toLowerCase()
                    );
                    const supervisor = assignment?.supervisor || "Sin supervisor asignado";
                    const key = normalizeRecallSearch(supervisor);
                    if (!teams.has(key)) teams.set(key, { label: supervisor, alerts: [] });
                    teams.get(key).alerts.push(alert);
                });
                if (!alerts.length && !teams.size) {
                    showEmpty(container, "No hay seguimientos activos para este supervisor.");
                    return;
                }
                [...teams.values()]
                    .sort((left, right) => left.label.localeCompare(right.label, "es"))
                    .forEach(team => {
                        container.appendChild(Core.createElement(
                            "h3", "followup-team-heading", team.label
                        ));
                        team.alerts.forEach(alert => renderCard(alert, true));
                    });
            }
        }

        async function runFollowupScheduler() {
            if (!state.db || !state.agentId) return;
            window.clearTimeout(state.followupTimer);
            try {
                const alerts = await loadFollowupAlerts();
                let teamAlerts = [];
                if (state.isAdmin) {
                    try {
                        teamAlerts = await loadTeamFollowupAlerts();
                    } catch (error) {
                        console.error("No se pudieron cargar los seguimientos del equipo.", error);
                        notify(`No se pudieron cargar los seguimientos del equipo: ${error.message}`, true);
                    }
                }
                updateFollowupTab(alerts, teamAlerts);
                const manualReminders = await loadPendingManualReminders();
                const alertsById = new Map(alerts.map(alert => [String(alert.id), alert]));
                for (const reminder of manualReminders) {
                    const reminderId = String(reminder.id);
                    const alert = alertsById.get(String(reminder.seguimiento_id));
                    if (!alert || state.pendingManualReminderIds.has(reminderId)) continue;
                    state.pendingManualReminderIds.add(reminderId);
                    enqueueFollowupToast(alert, null, reminder);
                }
                const now = Date.now();
                const notifications = [];
                let nextReminderAt = Infinity;
                for (const alert of alerts) {
                    const dueAt = new Date(alert.due_at).getTime();
                    if (!Number.isFinite(dueAt)) continue;
                    const notified = Array.isArray(alert.notified_stages)
                        ? alert.notified_stages
                        : [];
                    const milestones = getFollowupMilestones(alert);
                    const crossed = milestones.filter(milestone =>
                        milestone.at <= now && !notified.includes(milestone.key));
                    if (crossed.length) {
                        const latest = crossed[crossed.length - 1];
                        const updatedStages = [...new Set([
                            ...notified,
                            ...crossed.map(milestone => milestone.key)
                        ])];
                        const result = await state.db.from("g_seguimientos")
                            .update({ notified_stages: updatedStages })
                            .eq("id", alert.id)
                            .eq("agente_id", state.agentId)
                            .eq("due_at", alert.due_at)
                            .select("id");
                        if (!(DataClient.assertSuccess(result) || []).length) continue;
                        notifications.push({ alert, milestone: latest });
                    }
                    for (const milestone of milestones) {
                        if (!notified.includes(milestone.key) && milestone.at > now) {
                            nextReminderAt = Math.min(nextReminderAt, milestone.at);
                        }
                    }
                }
                notifications
                    .sort((left, right) => new Date(left.alert.due_at) - new Date(right.alert.due_at))
                    .forEach(({ alert, milestone }) => enqueueFollowupToast(alert, milestone));
                if (Number.isFinite(nextReminderAt)) {
                    state.followupTimer = window.setTimeout(
                        runFollowupScheduler,
                        Math.max(0, Math.min(nextReminderAt - Date.now(), 2147483000))
                    );
                }
            } catch (error) {
                console.error("No se pudieron revisar las alertas programadas.", error);
                notify(`No se pudieron revisar las alertas programadas: ${error.message}`, true);
                state.followupTimer = window.setTimeout(runFollowupScheduler, 60000);
            }
        }

        async function showFollowupToast() {
            if (!state.db || !state.agentId) return;
            await runFollowupScheduler();
        }

        // Historial: renderizado agrupado, métricas, filtro de fecha y limpieza.
        function renderHistoryEntries(container, records, followupAlerts, alertsAvailable) {
            container.replaceChildren();
            if (!records.length) {
                showEmpty(container, "No hay registros para este día.");
                return;
            }
            const groups = new Map();
            records.forEach(record => {
                const name = record.sub_cat || "General";
                if (!groups.has(name)) groups.set(name, []);
                groups.get(name).push(record);
            });
            let groupIndex = 0;
            for (const [name, items] of groups) {
                const section = Core.createElement("section", "history-group");
                const trigger = Core.createElement("button", "history-trigger");
                trigger.type = "button";
                const isTvGroup = items[0]?.clase === "tv";
                const historyName = Core.createElement("span", "history-name");
                historyName.append(
                    Core.createElement("span", `history-dot ${isTvGroup ? "tv" : "fibra"}`),
                    Core.createElement("span", "history-name-label", name)
                );
                trigger.append(historyName, Core.createElement("span", "history-badge", String(items.length)));
                const content = Core.createElement("div", "history-content");
                content.id = `history-group-${groupIndex++}`;
                trigger.setAttribute("aria-expanded", "false");
                trigger.addEventListener("click", () => {
                    content.classList.toggle("open");
                    trigger.setAttribute("aria-expanded", String(content.classList.contains("open")));
                });
                items.forEach(item => {
                    const entry = Core.createElement("article", `history-entry ${item.clase === "tv" ? "tv" : "fibra"}`);
                    const entryHeader = Core.createElement("div", "history-entry-header");
                    const customer = Core.createElement("span", "history-customer");
                    customer.append(
                        Icons.create("user"),
                        ` ${item.cliente || "N/A"} (${item.dni || "N/A"})`
                    );
                    const time = Core.createElement("span", "history-time");
                    time.append(
                        Icons.create("clock"),
                        ` ${item.hora_str || ""}`
                    );
                    const dni = normalizeDni(item.dni);
                    const activeAlert = dni ? followupAlerts.get(dni) : null;
                    const isAlertActive = Boolean(activeAlert);
                    const alertButton = Core.createElement("button", "history-alert",
                        isAlertActive ? "Cambiar" : "Programar");
                    alertButton.type = "button";
                    alertButton.disabled = !alertsAvailable || !dni;
                    alertButton.classList.toggle("active", isAlertActive);
                    alertButton.setAttribute("aria-label", isAlertActive
                        ? `Cambiar fecha u hora del seguimiento de ${item.cliente || "cliente"} (${item.dni || "DNI no disponible"})`
                        : `Programar seguimiento para ${item.cliente || "cliente"} (${item.dni || "DNI no disponible"})`);
                    alertButton.title = !dni
                        ? "Este registro no tiene un DNI válido"
                        : !alertsAvailable
                            ? "No se pudo conectar con las alertas de seguimiento"
                            : isAlertActive
                                ? `Programada para ${formatFollowupDate(activeAlert.due_at)}`
                                : "Elegir fecha y hora del seguimiento";
                    const removeButton = Core.createElement("button", "history-alert", "Quitar");
                    removeButton.type = "button";
                    removeButton.hidden = !isAlertActive;
                    removeButton.disabled = !alertsAvailable;
                    removeButton.title = "Eliminar seguimiento programado";
                    removeButton.addEventListener("click", () =>
                        removeFollowupAlert(activeAlert, removeButton));
                    const actions = Core.createElement("span", "history-actions");
                    actions.append(time, alertButton, removeButton);
                    entryHeader.append(customer, actions);
                    entry.appendChild(entryHeader);
                    const scheduleEditor = Core.createElement("div", "followup-editor");
                    scheduleEditor.hidden = true;
                    const dateTime = document.createElement("input");
                    dateTime.type = "datetime-local";
                    dateTime.required = true;
                    dateTime.min = localDateTimeValue(new Date(Date.now() + 60000));
                    dateTime.value = activeAlert?.due_at
                        ? localDateTimeValue(new Date(activeAlert.due_at))
                        : localDateTimeValue(new Date(Date.now() + 3600000));
                    dateTime.setAttribute("aria-label", `Fecha y hora para llamar a ${item.cliente || "cliente"}`);
                    const saveButton = Core.createElement("button", "", "Guardar");
                    saveButton.type = "button";
                    saveButton.addEventListener("click", () =>
                        saveFollowupAlert(item, dateTime.value, saveButton));
                    const cancelButton = Core.createElement("button", "", "Cancelar");
                    cancelButton.type = "button";
                    cancelButton.addEventListener("click", () => { scheduleEditor.hidden = true; });
                    scheduleEditor.append(dateTime, saveButton, cancelButton);
                    alertButton.addEventListener("click", () => {
                        scheduleEditor.hidden = !scheduleEditor.hidden;
                        if (!scheduleEditor.hidden) dateTime.focus();
                    });
                    entry.appendChild(scheduleEditor);
                    if (activeAlert?.due_at) {
                        entry.appendChild(Core.createElement(
                            "span", "followup-schedule",
                            `Seguimiento: ${formatFollowupDate(activeAlert.due_at)}`
                        ));
                    } else if (isAlertActive) {
                        entry.appendChild(Core.createElement(
                            "span", "followup-schedule",
                            "Sin fecha y hora; configura el recordatorio."
                        ));
                    }
                    entry.appendChild(Core.createElement("p", "", item.plantilla || ""));
                    content.appendChild(entry);
                });
                section.append(trigger, content);
                container.appendChild(section);
            }
        }

        // Rellamadas: búsqueda de registros y atribución secuencial dentro de siete días.
        function normalizeDni(value) {
            const normalized = String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
            return normalized && normalized !== "NA" ? normalized : null;
        }

        function colombiaDate(value) {
            const date = new Date(value);
            if (Number.isNaN(date.getTime())) return null;
            const parts = new Intl.DateTimeFormat("en-CA", {
                timeZone: "America/Bogota",
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            }).formatToParts(date);
            const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
            return `${values.year}-${values.month}-${values.day}`;
        }

        function dayDifference(fromDate, toDate) {
            const from = Date.parse(`${fromDate}T00:00:00Z`);
            const to = Date.parse(`${toDate}T00:00:00Z`);
            return Number.isFinite(from) && Number.isFinite(to)
                ? Math.round((to - from) / 86400000)
                : null;
        }

        async function fetchAllRows(queryFactory) {
            const pageSize = 500;
            const rows = [];
            for (let offset = 0; ; offset += pageSize) {
                const result = await queryFactory().range(offset, offset + pageSize - 1);
                const page = DataClient.assertSuccess(result) || [];
                rows.push(...page);
                if (page.length < pageSize) return rows;
            }
        }

        async function getRelevantRecallLogs() {
            if (state.isAdmin) {
                return fetchAllRows(() => state.db.from("logs_soporte")
                    .select("id,created_at,agente_id,cliente,dni")
                    .not("dni", "is", null)
                    .order("created_at", { ascending: true })
                    .order("id", { ascending: true }));
            }

            const ownLogs = await fetchAllRows(() => state.db.from("logs_soporte")
                .select("dni")
                .eq("agente_id", state.agentId)
                .not("dni", "is", null)
                .order("id", { ascending: true }));
            const dniValues = [...new Set(ownLogs
                .filter(log => normalizeDni(log.dni))
                .map(log => String(log.dni).trim()))];
            if (!dniValues.length) return [];

            const records = [];
            const dniBatchSize = 50;
            for (let index = 0; index < dniValues.length; index += dniBatchSize) {
                const batch = dniValues.slice(index, index + dniBatchSize);
                const rows = await fetchAllRows(() => state.db.from("logs_soporte")
                    .select("id,created_at,agente_id,cliente,dni")
                    .in("dni", batch)
                    .order("created_at", { ascending: true })
                    .order("id", { ascending: true }));
                records.push(...rows);
            }
            return records;
        }

        async function loadSupervisorAssignments() {
            const result = await state.db.from("g_citrix_supervisores")
                .select("citrix,nombre_completo,supervisor")
                .order("supervisor", { ascending: true })
                .order("citrix", { ascending: true });
            const rows = DataClient.assertSuccess(result) || [];
            const assignments = new Map();
            const supervisors = new Map();
            rows.forEach(row => {
                const agentId = String(row.citrix || "").trim();
                const supervisor = String(row.supervisor || "").trim();
                if (!agentId || !supervisor) return;
                assignments.set(agentId.toLowerCase(), {
                    nombreCompleto: String(row.nombre_completo || "").trim(),
                    supervisor
                });
                const supervisorKey = supervisor.toLowerCase();
                if (!supervisors.has(supervisorKey)) supervisors.set(supervisorKey, supervisor);
            });
            state.supervisorAssignments = assignments;
            state.supervisors = [...supervisors].map(([value, label]) => ({ value, label }));
        }

        async function loadRecallAgentNames(agentIds) {
            const uniqueAgentIds = [...new Set(agentIds.filter(Boolean))];
            if (!uniqueAgentIds.length) return new Map();

            const result = await state.db.from("g_citrix_supervisores")
                .select("citrix,nombre_completo")
                .in("citrix", uniqueAgentIds);
            const rows = DataClient.assertSuccess(result) || [];
            return new Map(rows.map(row => [
                String(row.citrix || "").trim().toLowerCase(),
                String(row.nombre_completo || "").trim()
            ]));
        }

        function findRecallers(records) {
            const byDni = new Map();
            records.forEach(record => {
                const dni = normalizeDni(record.dni);
                const agentId = String(record.agente_id || "").trim();
                const eventDate = colombiaDate(record.created_at);
                if (!dni || !agentId || !eventDate) return;
                if (!byDni.has(dni)) byDni.set(dni, []);
                byDni.get(dni).push({ ...record, agente_id: agentId, eventDate });
            });

            const recallers = [];
            for (const [dni, events] of byDni) {
                events.sort((left, right) => {
                    const timeDifference = new Date(left.created_at) - new Date(right.created_at);
                    return timeDifference || Number(left.id) - Number(right.id);
                });

                let previousEpisode = null;
                for (const event of events) {
                    if (!previousEpisode) {
                        previousEpisode = event;
                        continue;
                    }

                    if (event.agente_id === previousEpisode.agente_id) {
                        previousEpisode = event;
                        continue;
                    }

                    const daysApart = dayDifference(previousEpisode.eventDate, event.eventDate);
                    if ((state.isAdmin || previousEpisode.agente_id === state.agentId) &&
                        daysApart !== null && daysApart >= 0 && daysApart < 7) {
                        recallers.push({
                            dni,
                            cliente: previousEpisode.cliente || event.cliente || "N/A",
                            initialAgent: previousEpisode.agente_id,
                            initialDate: previousEpisode.created_at,
                            initialDay: previousEpisode.eventDate,
                            callbackDate: event.created_at,
                            callbackDay: event.eventDate,
                            callbackAgent: event.agente_id
                        });
                    }
                    previousEpisode = event;
                }
            }

            return recallers.sort((left, right) =>
                new Date(right.callbackDate) - new Date(left.callbackDate) ||
                left.cliente.localeCompare(right.cliente, "es")
            );
        }

        function formatRecallDate(timestamp) {
            const date = new Date(timestamp);
            if (Number.isNaN(date.getTime())) return "Fecha no disponible";

            const dateParts = new Intl.DateTimeFormat("en-GB", {
                timeZone: "America/Bogota",
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            }).formatToParts(date);
            const timeParts = new Intl.DateTimeFormat("en-US", {
                timeZone: "America/Bogota",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true
            }).formatToParts(date);
            const dateValues = Object.fromEntries(dateParts.map(part => [part.type, part.value]));
            const timeValues = Object.fromEntries(timeParts.map(part => [part.type, part.value]));
            return `${dateValues.day}/${dateValues.month}/${dateValues.year} ` +
                `${timeValues.hour}:${timeValues.minute} ${timeValues.dayPeriod.toUpperCase()}`;
        }

        function formatDateOnly(date) {
            const [year, month, day] = date.split("-");
            return `${day}/${month}/${year}`;
        }

        async function renderCustomerRecallAlert() {
            const alertId = "g-recall-alert";
            document.getElementById(alertId)?.remove();
            const documentId = normalizeDni(Extractor.getDocument());
            if (!documentId || !state.agentId || !state.db) return;

            try {
                const records = await fetchAllRows(() => state.db.from("logs_soporte")
                    .select("id,created_at,agente_id,cliente,dni")
                    .eq("dni", documentId)
                    .order("created_at", { ascending: true })
                    .order("id", { ascending: true }));
                const recallers = findRecallers(records);
                if (!recallers.length) return;

                const latestRecall = recallers[0];
                const host = document.createElement("div");
                host.id = alertId;
                host.setAttribute("aria-live", "assertive");
                host.style.cssText = "all:initial;position:fixed;z-index:2147483647;left:16px;right:16px;bottom:16px;display:block;pointer-events:none";
                const alertShadow = host.attachShadow({ mode: "open" });
                const style = document.createElement("style");
                style.textContent = `
                    :host{all:initial}
                    .alert{max-width:640px;margin:0 auto;display:flex;align-items:center;gap:12px;
                        padding:13px 16px;border:1px solid #f59e0b;border-left:5px solid #f59e0b;
                        border-radius:8px;background:#231b0d;color:#fff;box-shadow:0 8px 24px #0008;
                        font:13px/1.45 Arial,sans-serif;pointer-events:auto}
                    .message{flex:1;min-width:0;overflow-wrap:anywhere}
                    .message strong{color:#fbbf24}
                    .close{flex:none;width:28px;height:28px;border:0;border-radius:5px;background:transparent;
                        color:#fff;font:20px Arial,sans-serif;cursor:pointer}
                    .close:hover{background:#ffffff20}
                    @media(max-width:480px){:host{left:8px!important;right:8px!important;bottom:8px!important}
                        .alert{padding:10px 12px;font-size:12px}}
                `;
                const alert = document.createElement("div");
                alert.className = "alert";
                alert.setAttribute("role", "alert");
                const message = document.createElement("div");
                message.className = "message";
                const count = recallers.length;
                message.append(
                    document.createTextNode("Este cliente ha rellamado "),
                    Object.assign(document.createElement("strong"), {
                        textContent: `${count} ${count === 1 ? "vez" : "veces"}`
                    }),
                    document.createTextNode(`. Última rellamada: ${formatRecallDate(latestRecall.callbackDate)}.`)
                );
                const close = document.createElement("button");
                close.className = "close";
                close.type = "button";
                close.setAttribute("aria-label", "Cerrar alerta de rellamada");
                close.title = "Cerrar alerta";
                close.textContent = "×";
                close.addEventListener("click", () => host.remove());
                alert.append(message, close);
                alertShadow.append(style, alert);
                document.documentElement.appendChild(host);
            } catch (error) {
                console.error("No se pudo comprobar si el cliente ha rellamado.", error);
            }
        }

        function normalizeRecallSearch(value) {
            return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                .toLowerCase().trim();
        }

        function renderRecallEntries(container, recallers, filterDate, isAdmin, sameDayOnly, groupByAgent) {
            container.replaceChildren();
            if (!recallers.length) {
                showEmpty(container, isAdmin
                    ? "No se encontraron rellamadas para los filtros seleccionados."
                    : sameDayOnly
                        ? "No se encontraron atenciones y rellamadas del mismo día con los filtros seleccionados."
                        : filterDate
                        ? "No tienes rellamadas en la fecha seleccionada."
                        : "No se encontraron rellamadas tuyas dentro de la ventana de 7 días.");
                return;
            }

            const summary = Core.createElement("div", "recall-summary");
            summary.append(
                Core.createElement("strong", "", String(recallers.length)),
                isAdmin
                    ? " rellamada(s) entre agentes dentro de los 7 días siguientes. "
                    : " cliente(s) atendido(s) después por otro agente dentro de los 7 días siguientes. ",
                "Las tipificaciones consecutivas del mismo agente se consolidan usando la última.",
                filterDate ? ` Fecha de rellamada: ${formatDateOnly(filterDate)}.` : "",
                sameDayOnly ? " Solo atenciones y rellamadas del mismo día." : ""
            );
            container.appendChild(summary);

            if (groupByAgent) {
                const groupActions = Core.createElement("div", "recall-group-actions");
                const expandAll = Core.createElement("button", "", "Expandir todas");
                const collapseAll = Core.createElement("button", "", "Colapsar todas");
                expandAll.type = "button";
                collapseAll.type = "button";
                const setGroupsExpanded = expanded => {
                    container.querySelectorAll(".recall-group-toggle").forEach(toggle => {
                        toggle.setAttribute("aria-expanded", String(expanded));
                    });
                    container.querySelectorAll(".recall-group-content").forEach(content => {
                        content.hidden = !expanded;
                    });
                };
                expandAll.addEventListener("click", () => setGroupsExpanded(true));
                collapseAll.addEventListener("click", () => setGroupsExpanded(false));
                groupActions.append(expandAll, collapseAll);
                container.appendChild(groupActions);
            }

            const recallGroups = new Map();
            if (groupByAgent) {
                recallers.forEach(recaller => {
                    const assignment = state.supervisorAssignments.get(recaller.initialAgent.toLowerCase());
                    const agentName = assignment?.nombreCompleto || "Nombre no disponible";
                    const agentId = recaller.initialAgent.toLowerCase();
                    if (!recallGroups.has(agentId)) recallGroups.set(agentId, { agentName, entries: [] });
                    recallGroups.get(agentId).entries.push(recaller);
                });
            } else {
                recallGroups.set("", { agentName: "", entries: recallers });
            }

            [...recallGroups].sort(([, left], [, right]) =>
                left.agentName.localeCompare(right.agentName, "es")
            ).forEach(([, group], groupIndex) => {
                    const { agentName, entries } = group;
                    let groupContent = container;
                    if (groupByAgent) {
                        const section = Core.createElement("section", "recall-agent-group");
                        const toggle = Core.createElement("button", "recall-group-toggle");
                        const contentId = `recall-agent-group-${groupIndex}`;
                        toggle.type = "button";
                        toggle.setAttribute("aria-expanded", "true");
                        toggle.setAttribute("aria-controls", contentId);
                        toggle.append(
                            Core.createElement("strong", "", agentName),
                            Core.createElement("span", "recall-group-count", String(entries.length)),
                            Icons.create("chevron", "icon-svg recall-group-chevron")
                        );
                        groupContent = Core.createElement("div", "recall-group-content");
                        groupContent.id = contentId;
                        toggle.addEventListener("click", () => {
                            const expanded = toggle.getAttribute("aria-expanded") !== "true";
                            toggle.setAttribute("aria-expanded", String(expanded));
                            groupContent.hidden = !expanded;
                        });
                        section.append(toggle, groupContent);
                        container.appendChild(section);
                    }
                    entries.forEach(recaller => {
                        const entry = Core.createElement("article", "recall-entry");
                        entry.append(
                            Core.createElement("div", "recall-customer", recaller.cliente),
                            Core.createElement("div", "recall-dni", `DNI/NIE: ${recaller.dni}`)
                        );
                        const initialAssignment = isAdmin
                            ? state.supervisorAssignments.get(recaller.initialAgent.toLowerCase())
                            : null;
                        const callbackAssignment = isAdmin
                            ? state.supervisorAssignments.get(recaller.callbackAgent.toLowerCase())
                            : state.recallAgentNames.get(recaller.callbackAgent.toLowerCase());
                        const createRecallStep = (label, agentName, agentId, timestamp) => {
                            const step = Core.createElement("div", "recall-step");
                            step.appendChild(Core.createElement("span", "recall-step-label", label));
                            step.appendChild(Core.createElement("span", "recall-step-agent", agentName));
                            if (agentId) {
                                step.appendChild(Core.createElement("span", "recall-step-id", `Citrix: ${agentId}`));
                            }
                            const time = Core.createElement("span", "recall-step-time");
                            time.append(Icons.create("clock"), formatRecallDate(timestamp));
                            step.appendChild(time);
                            return step;
                        };
                        const timeline = Core.createElement("div", "recall-timeline");
                        timeline.append(
                            createRecallStep(
                                "Atención inicial",
                                isAdmin ? initialAssignment?.nombreCompleto || "Nombre no disponible" : "Tú",
                                isAdmin ? recaller.initialAgent : "",
                                recaller.initialDate
                            ),
                            createRecallStep(
                                "Rellamada posterior",
                                isAdmin
                                    ? callbackAssignment?.nombreCompleto || "Nombre no disponible"
                                    : callbackAssignment || "Otro agente",
                                recaller.callbackAgent,
                                recaller.callbackDate
                            )
                        );
                        entry.appendChild(timeline);
                        groupContent.appendChild(entry);
                    });
                });
        }

        async function renderRecallers() {
            const container = shadow.getElementById("recall-list");
            if (!state.agentId) {
                showEmpty(container, "No se pudo identificar al agente; no se pueden consultar sus rellamadas.");
                return;
            }
            if (!state.db) {
                showEmpty(container, "No hay conexión con Supabase. Las rellamadas requieren consultar tipificaciones del equipo.");
                return;
            }
            if (state.isAdmin && state.supervisorAssignments === null) {
                showEmpty(container, "No se pudo cargar la relación de agentes y supervisores.");
                return;
            }

            showEmpty(container, "Buscando clientes atendidos por otro agente...");
            try {
                if (state.recallers === null) {
                    const records = await getRelevantRecallLogs();
                    state.recallers = findRecallers(records);
                }
                if (!state.isAdmin && state.recallAgentNames === null) {
                    const callbackAgents = state.recallers.map(recaller => recaller.callbackAgent);
                    try {
                        state.recallAgentNames = await loadRecallAgentNames(callbackAgents);
                    } catch (error) {
                        console.warn("No se pudieron cargar los nombres de los agentes de rellamada.", error);
                        state.recallAgentNames = new Map();
                    }
                }
                const filterDate = shadow.getElementById("recall-date").value;
                const sameDayOnly = shadow.getElementById("recall-same-day").checked;
                const supervisorFilter = shadow.getElementById("recall-supervisor-filter").value;
                const groupByAgent = state.isAdmin &&
                    shadow.getElementById("recall-group-filter").value === "agent";
                const agentTerms = normalizeRecallSearch(
                    shadow.getElementById("recall-agent-filter").value
                ).split(/\s+/).filter(Boolean);
                const recallers = state.recallers.filter(recaller => {
                    const matchesDate = !filterDate || recaller.callbackDay === filterDate;
                    const matchesSameDay = !sameDayOnly || recaller.initialDay === recaller.callbackDay;
                    if (!state.isAdmin) return matchesDate && matchesSameDay;
                    const assignment = state.supervisorAssignments.get(recaller.initialAgent.toLowerCase());
                    if (!assignment) return false;
                    const searchableAgent = normalizeRecallSearch(
                        `${assignment.nombreCompleto} ${recaller.initialAgent}`
                    );
                    return matchesDate && matchesSameDay &&
                        (!supervisorFilter || assignment.supervisor.toLowerCase() === supervisorFilter) &&
                        agentTerms.every(term => searchableAgent.includes(term));
                });
                renderRecallEntries(container, recallers, filterDate, state.isAdmin, sameDayOnly, groupByAgent);
            } catch (error) {
                console.error("No se pudieron calcular las rellamadas.", error);
                showEmpty(container,
                    `No se pudieron consultar las tipificaciones necesarias. Verifica el acceso de lectura de logs_soporte para detectar cambios de agente. ${error.message}`);
            }
        }

        // Coordina la lectura, el filtrado por fecha y el renderizado del historial.
        async function renderHistory() {
            const container = shadow.getElementById("history-list");
            if (!/^\d{4}-\d{2}-\d{2}$/.test(selectedDate.value)) {
                shadow.getElementById("total-count").textContent = "0";
                shadow.getElementById("tv-count").textContent = "0";
                shadow.getElementById("fiber-count").textContent = "0";
                showEmpty(container, "Selecciona una fecha válida para consultar el historial.");
                return;
            }
            if (!state.agentId) {
                shadow.getElementById("total-count").textContent = "0";
                shadow.getElementById("tv-count").textContent = "0";
                shadow.getElementById("fiber-count").textContent = "0";
                showEmpty(container, "Historial deshabilitado para evitar mezclar datos: no se pudo identificar al agente.");
                return;
            }
            showEmpty(container, "Cargando historial...");
            let records;
            try {
                if (state.db && state.agentId) {
                    const result = await state.db.from("logs_soporte")
                        .select("cliente,dni,sub_cat,clase,plantilla,hora_str,created_at")
                        .eq("agente_id", state.agentId)
                        .eq("fecha_str", selectedDate.value)
                        .order("created_at", { ascending: false });
                    records = DataClient.assertSuccess(result) || [];
                } else {
                    records = LocalHistory.forDate(selectedDate.value, state.agentId);
                }
                let alertsAvailable = Boolean(state.db);
                let followupAlerts = new Map();
                if (state.db) {
                    try {
                        const alerts = await loadFollowupAlerts();
                        updateFollowupTab(alerts);
                        followupAlerts = new Map(alerts
                            .map(alert => [normalizeDni(alert.dni), alert])
                            .filter(([dni]) => Boolean(dni)));
                    } catch (error) {
                        alertsAvailable = false;
                        console.error("No se pudieron cargar las alertas del historial.", error);
                        notify(`No se pudieron cargar las alertas de seguimiento: ${error.message}`, true);
                    }
                }
                const tvCount = records.filter(record => record.clase === "tv").length;
                shadow.getElementById("total-count").textContent = String(records.length);
                shadow.getElementById("tv-count").textContent = String(tvCount);
                shadow.getElementById("fiber-count").textContent = String(records.length - tvCount);
                renderHistoryEntries(container, records, followupAlerts, alertsAvailable);
            } catch (error) {
                console.error("Error cargando historial.", error);
                showEmpty(container, `Error al sincronizar el historial: ${error.message}`);
            }
        }

        async function clearHistory(event) {
            const button = event.currentTarget;
            if (button.dataset.confirming !== "true") {
                button.dataset.confirming = "true";
                button.classList.add("confirming");
                button.textContent = "¿Borrar?";
                window.setTimeout(() => {
                    if (button.dataset.confirming === "true") {
                        delete button.dataset.confirming;
                        button.classList.remove("confirming");
                        button.replaceChildren(Icons.create("trash"));
                    }
                }, 4000);
                return;
            }
            delete button.dataset.confirming;
            button.classList.remove("confirming");
            button.replaceChildren(Icons.create("trash"));
            if (!/^\d{4}-\d{2}-\d{2}$/.test(selectedDate.value)) {
                notify("Selecciona una fecha válida antes de borrar el historial.", true);
                return;
            }
            if (!state.agentId) {
                notify("No se puede borrar el historial sin identificar al agente.", true);
                return;
            }
            try {
                if (state.db && state.agentId) {
                    const result = await state.db.from("logs_soporte").delete()
                        .eq("agente_id", state.agentId).eq("fecha_str", selectedDate.value);
                    DataClient.assertSuccess(result);
                }
                if (!LocalHistory.removeByDate(selectedDate.value, state.agentId)) {
                    throw new Error("No se pudo actualizar el historial local.");
                }
                notify("Historial borrado.");
                await renderHistory();
            } catch (error) {
                console.error("No se pudo borrar el historial.", error);
                notify(`Error al borrar historial: ${error.message}`, true);
            }
        }

        // Baúl de notas: edición, guardado, expansión y eliminación de notas del agente.
        function resetNoteEditor() {
            shadow.getElementById("note-title").value = "";
            const contentInput = shadow.getElementById("note-content");
            contentInput.value = "";
            contentInput.style.height = "";
            contentInput.style.overflowY = "";
            shadow.getElementById("note-editor").classList.remove("is-editing");
            shadow.getElementById("editing-note-label").textContent = "";
            shadow.getElementById("cancel-note-edit").hidden = true;
            shadow.querySelectorAll(".note.is-editing").forEach(note => note.classList.remove("is-editing"));
            const saveButton = shadow.getElementById("save-note");
            delete saveButton.dataset.editId;
            saveButton.textContent = "Guardar nota";
        }

        function resizeNoteEditor() {
            const textarea = shadow.getElementById("note-content");
            textarea.style.height = "auto";
            const maxHeight = Math.floor(window.innerHeight * 0.45);
            const nextHeight = Math.min(textarea.scrollHeight, maxHeight);
            textarea.style.height = `${Math.max(130, nextHeight)}px`;
            textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
        }

        async function saveNote() {
            if (!state.db || !state.agentId) {
                notify("El baúl requiere identificar al agente y conectar con Supabase.", true);
                return;
            }
            const title = shadow.getElementById("note-title").value.trim() || "Sin Título";
            const content = shadow.getElementById("note-content").value.trim();
            if (!content) {
                notify("Escribe el contenido de la nota antes de guardarla.", true);
                return;
            }
            const button = shadow.getElementById("save-note");
            const editId = button.dataset.editId;
            button.disabled = true;
            button.textContent = "Procesando...";
            try {
                const result = editId
                    ? await state.db.from("g_agentes_notas").update({ titulo: title, contenido: content })
                        .eq("id", editId).eq("agente_nombre", state.agentId)
                    : await state.db.from("g_agentes_notas").insert([{
                        agente_nombre: state.agentId, titulo: title, contenido: content
                    }]);
                DataClient.assertSuccess(result);
                resetNoteEditor();
                notify(editId ? "Nota actualizada." : "Nota guardada.");
                await renderNotes();
            } catch (error) {
                console.error("No se pudo guardar la nota.", error);
                notify(`Error al guardar la nota: ${error.message}`, true);
            } finally {
                button.disabled = false;
                if (button.dataset.editId) button.textContent = "Actualizar nota";
                else button.textContent = "Guardar nota";
            }
        }

        async function renderNotes() {
            const container = shadow.getElementById("notes-list");
            if (!state.db || !state.agentId) {
                showEmpty(container, "Baúl deshabilitado: no se pudo identificar al agente o conectar con Supabase.");
                return;
            }
            showEmpty(container, "Cargando notas...");
            try {
                const result = await state.db.from("g_agentes_notas").select("id,titulo,contenido")
                    .eq("agente_nombre", state.agentId).order("id", { ascending: false });
                const notes = DataClient.assertSuccess(result) || [];
                container.replaceChildren();
                if (!notes.length) {
                    showEmpty(container, "El baúl está vacío.");
                    return;
                }
                const toolbar = Core.createElement("div", "notes-toolbar");
                const expandAll = Core.createElement("button", "", "Expandir todas");
                const collapseAll = Core.createElement("button", "", "Colapsar todas");
                expandAll.type = "button";
                collapseAll.type = "button";
                toolbar.append(expandAll, collapseAll);
                container.appendChild(toolbar);

                const setAllNotesExpanded = expanded => {
                    container.querySelectorAll(".note-content").forEach(content => {
                        content.hidden = !expanded;
                        const toggle = content.closest(".note").querySelector(".note-toggle");
                        toggle.textContent = expanded ? "Colapsar" : "Expandir";
                        toggle.setAttribute("aria-expanded", String(expanded));
                    });
                };
                expandAll.addEventListener("click", () => setAllNotesExpanded(true));
                collapseAll.addEventListener("click", () => setAllNotesExpanded(false));

                notes.forEach(note => {
                    const item = Core.createElement("article", "note");
                    item.dataset.noteId = String(note.id);
                    const heading = Core.createElement("div", "note-heading");
                    heading.appendChild(Core.createElement("div", "note-title", note.titulo || "Sin Título"));
                    const content = Core.createElement("div", "note-content");
                    content.appendChild(Core.createElement("div", "note-text", note.contenido || ""));
                    const toggle = Core.createElement("button", "note-toggle", "Colapsar");
                    toggle.type = "button";
                    toggle.setAttribute("aria-expanded", "true");
                    toggle.addEventListener("click", () => {
                        content.hidden = !content.hidden;
                        toggle.textContent = content.hidden ? "Expandir" : "Colapsar";
                        toggle.setAttribute("aria-expanded", String(!content.hidden));
                    });
                    heading.appendChild(toggle);
                    item.append(heading, content);
                    const actions = Core.createElement("div", "note-actions");
                    const edit = Core.createElement("button", "", "Editar");
                    const copy = Core.createElement("button", "", "Copiar");
                    const remove = Core.createElement("button", "", "Eliminar");
                    [edit, copy, remove].forEach(button => { button.type = "button"; });

                    edit.addEventListener("click", () => {
                        shadow.querySelectorAll(".note.is-editing").forEach(activeNote => {
                            activeNote.classList.remove("is-editing");
                        });
                        item.classList.add("is-editing");
                        shadow.getElementById("note-title").value = note.titulo || "";
                        const contentInput = shadow.getElementById("note-content");
                        contentInput.value = note.contenido || "";
                        resizeNoteEditor();
                        const saveButton = shadow.getElementById("save-note");
                        saveButton.dataset.editId = String(note.id);
                        saveButton.textContent = "Actualizar nota";
                        shadow.getElementById("note-editor").classList.add("is-editing");
                        shadow.getElementById("editing-note-label").textContent =
                            `Editando: ${note.titulo || "Sin Título"}`;
                        shadow.getElementById("cancel-note-edit").hidden = false;
                        shadow.getElementById("note-editor").scrollIntoView({ behavior: "smooth", block: "nearest" });
                        shadow.getElementById("note-title").focus();
                        notify("Nota cargada en el editor.");
                    });
                    copy.addEventListener("click", async () => {
                        try {
                            await Core.copyText(note.contenido || "");
                            notify("Nota copiada.");
                        } catch (error) {
                            console.error(error);
                            notify(error.message, true);
                        }
                    });
                    remove.addEventListener("click", () => confirmDeleteNote(note.id, remove));
                    actions.append(edit, copy, remove);
                    item.appendChild(actions);
                    container.appendChild(item);
                });
            } catch (error) {
                console.error("No se pudieron cargar las notas.", error);
                showEmpty(container, `Error al cargar notas: ${error.message}`);
            }
        }

        async function confirmDeleteNote(noteId, button) {
            if (button.dataset.confirming !== "true") {
                button.dataset.confirming = "true";
                button.dataset.originalText = button.textContent;
                button.classList.add("confirming");
                button.textContent = "¿Borrar?";
                window.setTimeout(() => {
                    if (button.dataset.confirming === "true") {
                        delete button.dataset.confirming;
                        button.classList.remove("confirming");
                        button.textContent = button.dataset.originalText || "Eliminar";
                    }
                }, 4000);
                return;
            }
            delete button.dataset.confirming;
            button.disabled = true;
            try {
                const result = await state.db.from("g_agentes_notas").delete()
                    .eq("id", noteId).eq("agente_nombre", state.agentId);
                DataClient.assertSuccess(result);
                const saveButton = shadow.getElementById("save-note");
                if (saveButton.dataset.editId === String(noteId)) resetNoteEditor();
                notify("Nota eliminada.");
                await renderNotes();
            } catch (error) {
                console.error("No se pudo eliminar la nota.", error);
                notify(`Error al eliminar la nota: ${error.message}`, true);
                button.disabled = false;
                button.classList.remove("confirming");
                button.textContent = button.dataset.originalText || "Eliminar";
            }
        }

        async function start() {
            const text = Extractor.pageText();
            state.services = Extractor.getInternetServices(text);
            state.agentId = Identity.getAgentId();
            try {
                state.templates = await Core.fetchJson(CONFIG.templatesFile);
                if (!state.templates || typeof state.templates !== "object" || Array.isArray(state.templates)) {
                    throw new TypeError("PL.json no contiene un objeto de plantillas válido.");
                }
            } catch (error) {
                console.error("Error cargando PL.json.", error);
            }

            if (state.agentId) {
                try {
                    state.db = await DataClient.createClient();
                    try {
                        const result = await state.db.from("g_usuarios_roles")
                            .select("rol,supervisor_nombre")
                            .eq("agente_id", state.agentId).limit(1);
                        const roles = DataClient.assertSuccess(result) || [];
                        const adminRole = roles.find(row =>
                            String(row.rol || "").trim().toLowerCase() === "admin");
                        state.isAdmin = Boolean(adminRole);
                        if (state.isAdmin) {
                            state.adminSupervisorName = String(adminRole.supervisor_nombre || "").trim();
                            await loadSupervisorAssignments();
                        }
                    } catch (error) {
                        if (state.isAdmin) state.supervisorAssignments = null;
                        console.warn("No se pudo verificar el rol del agente; se usará la vista individual de rellamadas.", error);
                    }
                } catch (error) {
                    console.error("Supabase no está disponible.", error);
                }
            } else {
                console.warn("No se identificó un agente; se deshabilitarán las funciones en la nube.");
            }

            document.getElementById(CONFIG.rootId)?.remove();
            buildShell();
            createTemplateView();
            renderCustomerRecallAlert();
            showFollowupToast();
        }

        return { start };
    })();

    // Punto de entrada: selecciona el módulo según el sitio donde se ejecuta el script.
    const Bootstrap = (() => {
        async function start() {
            if (!document.body) {
                document.addEventListener("DOMContentLoaded", start, { once: true });
                return;
            }
            const hostname = window.location.hostname.toLowerCase();
            const isEnabler = hostname === "enabler.es" || hostname.endsWith(".enabler.es");
            if (isEnabler) {
                await JiraModule.start();
                return;
            }
            await LowiModule.start();
        }
        return { start };
    })();

    Bootstrap.start().catch(error => {
        console.error("Error inesperado al iniciar InfoCli.", error);
        window.alert(`No se pudo iniciar InfoCli: ${error.message}`);
    });
})();