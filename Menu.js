(function() {
    // 1. Cargar Bootstrap 5 si no existe en la página
    if (!document.querySelector('link[href*="bootstrap.min.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css';
        document.head.appendChild(link);
    }

    // 2. Base de datos de empleados
    const empleados = [
        ["6054636", "Mateo Rodríguez Teque"],
        ["6072902", "Joel Giovanny Ramirez Leal"],
        ["6064967", "Mariana Forero Valderrama"],
        ["6067860", "Janis Alexandra Cifuentes Guzmán"],
        ["5912713", "Derly Yuliana Martinez Velandia"],
        ["2768309", "Paola Andrea Alayon Congote"],
        ["6113727", "Jaime Alberto Tejera Flores"],
        ["6113683", "Juan Esteban Rodríguez Fonseca"],
        ["6059730", "Juan Felipe Sogamoso Capera"],
        ["6019285", "Juan Carlos Romero Garcia"],
        ["5987362", "Jeison Mauricio Martinez Conda"],
        ["5923067", "Paola Andrea Jimenez Ramos"],
        ["2035331", "Leonardo Mendez Suarez"],
        ["6233696", "Marggi Dayana Amaya Rojas"],
        ["6298714", "Luis Sebastian Lizarazo Cifuentes"],
        ["6294349", "Jhonattan David Torres Guzmán"],
        ["6141445", "Anwelo Stiven Díaz Rodríguez"],
        ["6179921", "Jessica Alejandra Gómez Casallas"]
    ];

    // 3. Detectar la vista actual según la URL
    const url = location.href;
    let vista = "";
    if (url.includes("/monitor.pl")) vista = "Monitor";
    else if (url.includes("/observation.pl")) vista = "Observación";
    else if (url.includes("/audit.pl")) vista = "Auditoría";
    else if (url.includes("/checklist.pl")) vista = "Checklist";
    else vista = "Home";

    // 4. Crear contenedor de la interfaz flotante
    const div = document.createElement("div");
    div.style.position = "fixed";
    div.style.top = "80px";
    div.style.right = "20px";
    div.style.zIndex = "9999";
    div.style.minWidth = "300px";
    div.style.padding = "0px";
    div.style.borderRadius = "12px";
    div.style.boxShadow = "0 8px 20px rgba(0,0,0,0.35)";
    div.style.background = "linear-gradient(135deg, #4a90e2, #50e3c2)";
    div.style.color = "white";
    div.style.fontFamily = "'Segoe UI', sans-serif";
    div.style.cursor = "move";

    // Header del panel
    const header = document.createElement("div");
    header.textContent = "Vista: " + vista;
    header.style.fontWeight = "700";
    header.style.padding = "10px";
    header.style.textAlign = "center";
    header.style.background = "rgba(0,0,0,0.2)";
    header.style.borderTopLeftRadius = "12px";
    header.style.borderTopRightRadius = "12px";
    header.style.userSelect = "none";
    div.appendChild(header);

    // Cuerpo del panel
    const bodyDiv = document.createElement("div");
    bodyDiv.style.padding = "12px";
    div.appendChild(bodyDiv);

    // Selector de empleados
    const selEmpleado = document.createElement("select");
    selEmpleado.className = "form-select mb-2";
    selEmpleado.style.borderRadius = "8px";
    selEmpleado.style.padding = "6px";
    empleados.forEach(e => {
        let o = document.createElement("option");
        o.value = e[0];
        o.textContent = e[1] + " (" + e[0] + ")";
        selEmpleado.appendChild(o);
    });
    bodyDiv.appendChild(selEmpleado);

    // Lógica específica para la vista "Home"
    let selModulo;
    if (vista === "Home") {
        selModulo = document.createElement("select");
        selModulo.className = "form-select mb-2";
        selModulo.style.borderRadius = "8px";
        selModulo.style.padding = "6px";
        ["Monitor", "Observación", "Auditoría", "Checklist"].forEach(m => {
            let o = document.createElement("option");
            o.value = m;
            o.textContent = m;
            selModulo.appendChild(o);
        });
        bodyDiv.appendChild(selModulo);

        function crearBotonHome(text, urlBase, color = "#e74c3c") {
            const b = document.createElement("button");
            b.textContent = text;
            b.className = "btn btn-sm mb-1 w-100";
            b.style.background = color;
            b.style.border = "none";
            b.style.color = "white";
            b.style.fontWeight = "600";
            b.style.borderRadius = "6px";
            b.style.padding = "6px";
            b.onclick = function() {
                const emp = selEmpleado.value;
                window.open(urlBase.replace("5437186", emp), "_blank");
            };
            bodyDiv.appendChild(b);
        }
        crearBotonHome("Observaciones", "https://www.seadc.ccms.teleperformance.com/ccms-bin/employee/observation.pl?employee_ident=5437186", "#3498db");
        crearBotonHome("Comunicados", "https://www.seadc.ccms.teleperformance.com/ccms-bin/employee/communication.pl?employee_ident=5437186", "#1abc9c");
    }

    // Botón principal "Ir"
    const btn = document.createElement("button");
    btn.textContent = "Ir";
    btn.className = "btn mb-3 w-100";
    btn.style.background = "#ff7f50";
    btn.style.border = "none";
    btn.style.fontWeight = "600";
    btn.style.color = "white";
    btn.style.boxShadow = "0 4px 8px rgba(0,0,0,0.3)";
    btn.style.borderRadius = "8px";
    btn.style.padding = "8px";
    btn.onclick = function() {
        const emp = selEmpleado.value;
        let urlTarget = "";
        if (vista === "Home") {
            const mod = selModulo.value;
            switch (mod) {
                case "Monitor":
                    urlTarget = "https://www.seadc.ccms.teleperformance.com/ccms-bin/employee/monitor.pl?frmTarget=MONITOR&employee_ident=" + emp + "&frmOption=CREATE";
                    break;
                case "Observación":
                    urlTarget = "https://www.seadc.ccms.teleperformance.com/ccms-bin/employee/observation.pl?frmTarget=OBSERVATION&employee_ident=" + emp + "&frmOption=CREATE";
                    break;
                case "Auditoría":
                    urlTarget = "https://www.seadc.ccms.teleperformance.com/ccms-bin/console/audit.pl?frmTarget=AUDIT&frmOption=CREATE";
                    break;
                case "Checklist":
                    urlTarget = "https://www.seadc.ccms.teleperformance.com/ccms-bin/console/tops/checklist.pl?frmTarget=CHECKLIST&frmOption=CREATE";
                    break;
            }
        } else {
            urlTarget = location.href.replace(/([?&]employee_ident=)\d+/, "$1" + emp);
        }
        window.open(urlTarget, "_blank");
    };
    bodyDiv.appendChild(btn);

    // Función auxiliar para crear botones de automatización
    function crearBoton(text, func, color = "#28a745") {
        const b = document.createElement("button");
        b.textContent = text;
        b.className = "btn btn-sm mb-1 w-100";
        b.style.background = color;
        b.style.border = "none";
        b.style.color = "white";
        b.style.fontWeight = "600";
        b.style.borderRadius = "6px";
        b.style.padding = "6px";
        b.onclick = func;
        bodyDiv.appendChild(b);
    }

    // 5. Automatizaciones por Módulo
    if (vista === "Monitor") {
        crearBoton("Paso 1", function() {
            document.querySelector("#ui-monitor_widget-1_monitor_ident").value = document.querySelector("#ui-monitor_widget-1_monitor_ident > optgroup:nth-child(2) > option:nth-child(9)").value;
            document.querySelector("#ui-monitor_widget-1_monitor_ident").dispatchEvent(new Event('change', { bubbles: true }));
            document.querySelector("#ui-monitor_widget-1_target_program_ident").value = document.querySelector("#ui-monitor_widget-1_target_program_ident > option:nth-child(794)").value;
            document.querySelector("#ui-monitor_widget-1_target_program_ident").dispatchEvent(new Event('change', { bubbles: true }));
            document.querySelector("#form > form > fieldset:nth-child(5) > div.emp_monitor_type.required > select").value = document.querySelector("#form > form > fieldset:nth-child(5) > div.emp_monitor_type.required > select > option:nth-child(3)").value;
            document.querySelector("#form > form > fieldset:nth-child(5) > div.emp_monitor_type.required > select").dispatchEvent(new Event('change', { bubbles: true }));
            
            let e = document.evaluate("/html/body/div[3]/form/fieldset[4]/div[2]/input", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            if (e) {
                let t = new Date(),
                    n = String(t.getDate()).padStart(2, "0"),
                    c = String(t.getMonth() + 1).padStart(2, "0"),
                    a = t.getFullYear();
                e.value = `${a}-${c}-${n}`;
                e.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }, "#1abc9c");

        crearBoton("Paso 2", function() {
            function sel(o) {
                let e = document.querySelector(o);
                if (e) {
                    let s = e.parentElement;
                    s.value = e.value;
                    s.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
            function chk(o) {
                let e = document.querySelector(o);
                if (e) {
                    e.checked = true;
                    e.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
            sel("#question_35699280_response > select > option:nth-child(2)");
            sel("#question_35699299_response > select > option:nth-child(2)");
            chk("#question_response_221783921");
            chk("#question_response_221783932");
            chk("#question_response_221783939");
            sel("#question_35699506_response > select > option:nth-child(4)");
            sel("#question_15597370_response > select > option:nth-child(2)");
            sel("#question_15597373_response > select > option:nth-child(2)");
            sel("#question_15597374_response > select > option:nth-child(9)");
            sel("#question_15597381_response > select > option:nth-child(9)");
            sel("#question_15597385_response > select > option:nth-child(2)");
            sel("#question_15597386_response > select > option:nth-child(5)");
            sel("#question_15597391_response > select > option:nth-child(9)");
            sel("#question_15597395_response > select > option:nth-child(6)");
            sel("#question_15597398_response > select > option:nth-child(9)");
            sel("#question_15597402_response > select > option:nth-child(8)");
            sel("#question_15597403_response > select > option:nth-child(6)");
            sel("#question_15597404_response > select > option:nth-child(7)");
            sel("#question_15597405_response > select > option:nth-child(11)");
            sel("#question_15597406_response > select > option:nth-child(7)");
            sel("#question_15597409_response > select > option:nth-child(3)");
            sel("#question_33972968_response > select > option:nth-child(2)");
            sel("#question_33972969_response > select > option:nth-child(2)");
            sel("#question_33972970_response > select > option:nth-child(2)");
            sel("#question_33972971_response > select > option:nth-child(2)");
            sel("#question_33972972_response > select > option:nth-child(2)");
            sel("#question_33972973_response > select > option:nth-child(2)");
            sel("#question_33972974_response > select > option:nth-child(2)");
            sel("#question_33972975_response > select > option:nth-child(2)");
            alert("✔ Formulario rellenado automáticamente");
        }, "#16a085");

    } else if (vista === "Observación") {
        crearBoton("MPR - Plan de trabajo", async function() {
            async function selectOptionXPath(xpath, textExpected) {
                return new Promise(resolve => {
                    let check = setInterval(() => {
                        let opt = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                        if (opt && opt.textContent.trim() === textExpected) {
                            let sel = opt.parentNode;
                            sel.focus();
                            sel.click();
                            opt.selected = true;
                            sel.dispatchEvent(new Event('change', { bubbles: true }));
                            clearInterval(check);
                            resolve();
                        }
                    }, 100);
                });
            }
            function setToday(selector) {
                let input = document.querySelector(selector);
                if (input) {
                    let today = new Date();
                    let yyyy = today.getFullYear();
                    let mm = ('0' + (today.getMonth() + 1)).slice(-2);
                    let dd = ('0' + today.getDate()).slice(-2);
                    input.value = yyyy + '-' + mm + '-' + dd;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
            await selectOptionXPath("/html/body/div[3]/form/fieldset[2]/div[1]/select/option[1446]", "Teleperformance Colombia");
            await new Promise(r => setTimeout(r, 2000));
            await selectOptionXPath("/html/body/div[3]/form/fieldset[2]/div[2]/select/option[6]", "Specialist Observation");
            await selectOptionXPath("/html/body/div[3]/form/fieldset[2]/div[3]/select/option[4]", "TOPS24_MPR_CE_SPA v4");
            setToday("#observation_date");
            alert("Formulario automatizado con éxito");
        }, "#3498db");

        crearBoton("CEDP - Motivacional", function() {
            document.querySelector("#client_ident").value = document.querySelector("#client_ident > option:nth-child(1464)").value;
            document.querySelector("#client_ident").dispatchEvent(new Event('change', { bubbles: !0 }));
            (function() {
                let e = document.querySelector("#observation_type_ident"),
                    t = document.querySelector("#observation_type_ident > option:nth-child(6)").value;
                e.value = t;
                e.dispatchEvent(new Event('input', { bubbles: !0 }));
                e.dispatchEvent(new Event('change', { bubbles: !0 }));
                let n = new MutationObserver(() => {
                    e.value !== t && (e.value = t, e.dispatchEvent(new Event('input', { bubbles: !0 })), e.dispatchEvent(new Event('change', { bubbles: !0 })));
                });
                n.observe(e, { attributes: !0, attributeFilter: ["value"] });
            })();
            setTimeout(() => {
                let e = document.evaluate("/html/body/div[3]/form/fieldset[2]/div[3]/select/option[9]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                e && (e.parentElement.value = e.value, e.parentElement.dispatchEvent(new Event('change', { bubbles: !0 })));
                let t = document.evaluate("/html/body/div[3]/form/fieldset[2]/div[5]/input", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                if (t) {
                    let n = new Date(),
                        r = String(n.getDate()).padStart(2, "0"),
                        o = String(n.getMonth() + 1).padStart(2, "0"),
                        a = n.getFullYear();
                    t.value = `${a}-${o}-${r}`;
                    t.dispatchEvent(new Event('change', { bubbles: !0 }));
                }
            }, 2000);
        }, "#2980b9");

    } else if (vista === "Auditoría") {
        crearBoton("Paso 1", function() {
            (function() {
                function e(e, t) {
                    e && (e.focus(), e.value = t, e.dispatchEvent(new Event("input", { bubbles: !0 })), e.dispatchEvent(new Event("change", { bubbles: !0 })));
                }
                function t(e, t = !0) {
                    let n = document.createElement("div");
                    n.innerText = e, n.style.position = "fixed", n.style.top = "20px", n.style.right = "20px", n.style.background = t ? "#4CAF50" : "#f44336", n.style.color = "white", n.style.padding = "12px 20px", n.style.borderRadius = "10px", n.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)", n.style.fontSize = "16px", n.style.zIndex = "9999", document.body.appendChild(n), setTimeout(() => { n.remove(); }, 2000);
                }
                let n = new Date(),
                    o = n.getFullYear(),
                    d = String(n.getMonth() + 1).padStart(2, "0"),
                    l = String(n.getDate()).padStart(2, "0"),
                    a = `${o}-${d}-${l}`,
                    r = document.evaluate("/html/body/div[3]/form/fieldset[2]/div[2]/input", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                e(r, a);
                let u = document.evaluate("/html/body/div[3]/form/div/fieldset/div[1]/select", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                u && (u.selectedIndex = 2, u.dispatchEvent(new Event("input", { bubbles: !0 })), u.dispatchEvent(new Event("change", { bubbles: !0 })));
                let i = document.evaluate("/html/body/div[3]/form/fieldset[3]/div/select", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                i && (i.selectedIndex = 2, i.dispatchEvent(new Event("input", { bubbles: !0 })), i.dispatchEvent(new Event("change", { bubbles: !0 })));
                setTimeout(function() {
                    let e = document.querySelector("#ui-audit-1_form_ident > option:nth-child(19)");
                    e ? (e.selected = !0, e.parentElement.dispatchEvent(new Event("input", { bubbles: !0 })), e.parentElement.dispatchEvent(new Event("change", { bubbles: !0 })), t("🎉 Formulario completado correctamente", !0)) : t("❌ No se encontró la opción 19 en Audit Form", !1);
                }, 3000);
            })();
        }, "#9b59b6");

        crearBoton("Paso 2", async function() {
            const delay = ms => new Promise(r => setTimeout(r, ms));
            const get = x => document.evaluate(x, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            const seleccionarOpcion = async x => {
                let o = get(x);
                if (o) {
                    let s = o.parentElement;
                    s.value = o.value;
                    s.dispatchEvent(new Event("input", { bubbles: true }));
                    s.dispatchEvent(new Event("change", { bubbles: true }));
                }
                await delay(400);
            };
            const presionar = async x => {
                let b = get(x);
                if (b) b.click();
                await delay(600);
            };
            const setInput = async (x, v) => {
                let i = get(x);
                if (i) {
                    i.value = v;
                    i.dispatchEvent(new Event('input', { bubbles: true }));
                    i.dispatchEvent(new Event('change', { bubbles: true }));
                }
                await delay(400);
            };
            if (!window.location.href.startsWith("https://www.seadc.ccms.teleperformance.com/ccms-bin/console/audit.pl")) {
                alert("Este bookmarklet debe ejecutarse en la vista 2 del formulario.");
                return;
            }
            await seleccionarOpcion('/html/body/div[4]/form[1]/fieldset[1]/div[1]/select/option[2]');
            await seleccionarOpcion('/html/body/div[4]/form[1]/div/fieldset/div[3]/select/option[2]');
            await presionar('/html/body/div[4]/form[1]/fieldset[2]/div[1]/button');
            await seleccionarOpcion('/html/body/div[4]/form[1]/fieldset[1]/div[1]/select/option[3]');
            await seleccionarOpcion('/html/body/div[4]/form[1]/div/fieldset/div[1]/select/option[3]');
            await presionar('/html/body/div[4]/form[1]/fieldset[2]/div[1]/button');
            await seleccionarOpcion('/html/body/div[4]/form[1]/fieldset[1]/div[1]/select/option[4]');
            let n = prompt("Ingrese el número requerido:");
            if (n !== null) {
                await setInput('/html/body/div[4]/form[1]/fieldset[1]/div[2]/input', n);
            }
            await presionar('/html/body/div[4]/form[1]/fieldset[2]/div[1]/button');
            await seleccionarOpcion('/html/body/div[4]/form[1]/fieldset[1]/div[1]/select/option[5]');
            await delay(2000);
            await delay(3000);
            let s10 = document.querySelector('#ui-lcp-1_location_ident');
            if (s10) {
                s10.value = s10.querySelector('option:nth-child(2)').value;
                s10.dispatchEvent(new Event('input', { bubbles: true }));
                s10.dispatchEvent(new Event('change', { bubbles: true }));
                s10.dispatchEvent(new Event('blur', { bubbles: true }));
                await delay(500);
            }
            await presionar('/html/body/div[4]/form[1]/fieldset[2]/div[1]/button');
            await seleccionarOpcion('/html/body/div[4]/form[1]/fieldset[1]/div[1]/select/option[6]');
            await delay(1500);
            await seleccionarOpcion('/html/body/div[4]/form[1]/div/fieldset/div[4]/select/option[104]');
            await presionar('/html/body/div[4]/form[1]/fieldset[2]/div[1]/button');
            alert("✅ Flujo completado (1–15)");
        }, "#8e44ad");

        crearBoton("Paso 3", async function() {
            function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
            async function setInput(xpath, value) {
                const el = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                if (el) {
                    el.value = value;
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                    el.dispatchEvent(new Event('change', { bubbles: true }));
                    await delay(300);
                } else console.warn("No se encontró input:", xpath);
            }
            async function seleccionarOptionQuery(query) {
                const opcion = document.querySelector(query);
                if (opcion) {
                    const select = opcion.parentElement;
                    opcion.selected = true;
                    select.dispatchEvent(new Event('input', { bubbles: true }));
                    select.dispatchEvent(new Event('change', { bubbles: true }));
                    select.dispatchEvent(new Event('blur', { bubbles: true }));
                    await delay(300);
                } else console.warn("No se encontró opción:", query);
            }
            let numero = prompt("Ingrese el número requerido para Paso 1:");
            if (numero !== null) {
                await setInput('/html/body/div[5]/form[1]/fieldset/div[1]/input', numero);
            }
            let hoy = new Date();
            let dia = String(hoy.getDate()).padStart(2, '0');
            let mes = String(hoy.getMonth() + 1).padStart(2, '0');
            let anio = hoy.getFullYear();
            let fecha = `${anio}-${mes}-${dia}`;
            await setInput('/html/body/div[5]/form[1]/fieldset/div[2]/input', fecha);
            const queries = [
                "#question_5738280_response > select > option:nth-child(3)",
                "#question_5738281_response > select > option:nth-child(3)",
                "#question_5738282_response > select > option:nth-child(3)",
                "#question_5738283_response > select > option:nth-child(3)",
                "#question_5738284_response > select > option:nth-child(3)",
                "#question_5738285_response > select > option:nth-child(3)",
                "#question_5738286_response > select > option:nth-child(3)",
                "#question_5738287_response > select > option:nth-child(3)",
                "#question_5738288_response > select > option:nth-child(3)",
                "#question_5738289_response > select > option:nth-child(3)"
            ];
            for (let q of queries) {
                await seleccionarOptionQuery(q);
            }
            alert("✅ Sección completada (Pasos 1–11)");
        }, "#9b59b6");

    } else if (vista === "Checklist") {
        crearBoton("Paso 1", function() {
            (function() {
                function e(t, n) {
                    if (!t) return;
                    t.focus();
                    t.value = n;
                    t.dispatchEvent(new Event("input", { bubbles: !0 }));
                    t.dispatchEvent(new Event("change", { bubbles: !0 }));
                }
                function n(t, n) {
                    let o = document.evaluate(t, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                    if (o) {
                        let t = o.parentElement;
                        o.parentElement.value = o.value;
                        o.selected = !0;
                        t.dispatchEvent(new Event("input", { bubbles: !0 }));
                        t.dispatchEvent(new Event("change", { bubbles: !0 }));
                        console.log(`✅ Seleccionado intento ${n}:`, o.textContent.trim());
                    } else console.warn("⚠ No encontrada opción:", t);
                }
                function o(t, n) {
                    let o = document.querySelector(t);
                    if (o) {
                        let t = o.parentElement;
                        o.parentElement.value = o.value;
                        o.selected = !0;
                        t.dispatchEvent(new Event("input", { bubbles: !0 }));
                        t.dispatchEvent(new Event("change", { bubbles: !0 }));
                        console.log(`✅ Seleccionado intento ${n}:`, o.textContent.trim());
                    } else console.warn("⚠ No encontrada opción:", t);
                }
                function a(t) {
                    let n = document.evaluate(t, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                    n ? n.click() : console.warn("⚠ No encontrado botón:", t);
                }
                let hoy = new Date(),
                    yyyy = hoy.getFullYear(),
                    mm = String(hoy.getMonth() + 1).padStart(2, "0"),
                    dd = String(hoy.getDate()).padStart(2, "0"),
                    fechaHoy = `${yyyy}-${mm}-${dd}`;
                e(document.evaluate('/html/body/div[3]/form/fieldset[2]/div[1]/input', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue, fechaHoy);
                let numero = prompt("Ingrese el número requerido:");
                numero !== null && e(document.evaluate('/html/body/div[3]/form/fieldset[2]/div[2]/input', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue, numero);
                n('/html/body/div[3]/form/fieldset[2]/div[3]/select/option[4]', 1);
                const selectorPaso4 = "#checklist_form_ident > option:nth-child(40)";
                o(selectorPaso4, 1);
                setTimeout(() => o(selectorPaso4, 2), 1200);
                setTimeout(() => o(selectorPaso4, 3), 2500);
                setTimeout(() => {
                    a('/html/body/div[3]/form/fieldset[3]/div/input[2]');
                    alert("✅ Pasos 1 a 5 completados");
                }, 3500);
            })();
        }, "#e67e22");

        crearBoton("Paso 2", function() {
            (function() {
                function o(selector, intento = 1) {
                    let el = document.querySelector(selector);
                    if (el) {
                        let s = el.parentElement;
                        s.value = el.value;
                        el.selected = !0;
                        s.dispatchEvent(new Event("input", { bubbles: !0 }));
                        s.dispatchEvent(new Event("change", { bubbles: !0 }));
                        console.log(`✅ Seleccionado intento ${intento}:`, el.textContent.trim());
                    } else console.warn("⚠ No encontrada opción:", selector);
                }
                const pasos = [
                    "#question_10777226_response > select > option:nth-child(2)",
                    "#question_10777227_response > select > option:nth-child(2)",
                    "#question_10777228_response > select > option:nth-child(2)",
                    "#question_10777229_response > select > option:nth-child(2)",
                    "#question_10777230_response > select > option:nth-child(2)",
                    "#question_10777231_response > select > option:nth-child(2)",
                    "#question_10777232_response > select > option:nth-child(2)",
                    "#question_10777233_response > select > option:nth-child(2)",
                    "#question_10777234_response > select > option:nth-child(2)",
                    "#question_10777235_response > select > option:nth-child(2)",
                    "#question_10777236_response > select > option:nth-child(2)",
                    "#question_10777237_response > select > option:nth-child(2)",
                    "#question_10777238_response > select > option:nth-child(2)",
                    "#question_10777239_response > select > option:nth-child(2)",
                    "#question_22860579_response > select > option:nth-child(2)"
                ];
                pasos.forEach((s, i) => setTimeout(() => o(s, 1), i * 100));
            })();
        }, "#d35400");
    }

    // 6. Permitir arrastrar y soltar el panel (Drag & Drop)
    document.body.appendChild(div);
    let isDown = false,
        offsetX, offsetY;
    header.addEventListener('mousedown', e => {
        isDown = true;
        offsetX = e.clientX - div.offsetLeft;
        offsetY = e.clientY - div.offsetTop;
    });
    document.addEventListener('mouseup', () => {
        isDown = false;
    });
    document.addEventListener('mousemove', e => {
        if (!isDown) return;
        div.style.left = (e.clientX - offsetX) + 'px';
        div.style.top = (e.clientY - offsetY) + 'px';
    });
})();
